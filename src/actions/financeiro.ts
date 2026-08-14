"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaff, requireStudent } from "@/lib/auth";
import { mesValido, vencimentoDoMes, valorDoAluno } from "@/lib/finance";
import { parseMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { dataBrasileira, hojeISO } from "@/lib/dates";

export type ActionState = { error?: string; success?: string };

function revalidarFinanceiro(studentId?: string) {
  revalidatePath("/painel/financeiro");
  revalidatePath("/painel");
  revalidatePath("/app/financeiro");
  revalidatePath("/app");
  if (studentId) revalidatePath(`/painel/alunos/${studentId}`);
}

/* -------------------------------------------------------------------------- */
/* Planos                                                                      */
/* -------------------------------------------------------------------------- */

/** Cria o plano ou salva por cima, quando vem com id. */
export async function savePlan(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const planId = String(formData.get("planId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const precoTexto = String(formData.get("price") ?? "");
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 2) return { error: "Dê um nome ao plano." };

  const priceCents = parseMoney(precoTexto);
  if (priceCents === null) {
    return { error: "Valor inválido. Escreva assim: 150,00" };
  }
  if (priceCents === 0) {
    return { error: "O valor do plano não pode ser zero." };
  }

  if (planId) {
    const plano = await prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true },
    });
    if (!plano) return { error: "Plano não encontrado." };

    // Mudar o valor do plano vale daqui para a frente. As mensalidades que já
    // foram geradas guardam o próprio valor, então o histórico e o que o aluno
    // já pagou não mudam retroativamente.
    await prisma.plan.update({
      where: { id: planId },
      data: { name, priceCents, description: description || null },
    });

    revalidarFinanceiro();
    return {
      success: `Plano "${name}" atualizado. O novo valor vale para as próximas mensalidades.`,
    };
  }

  const quantos = await prisma.plan.count();

  await prisma.plan.create({
    data: {
      name,
      priceCents,
      description: description || null,
      sortOrder: quantos,
    },
  });

  revalidarFinanceiro();
  return { success: `Plano "${name}" criado.` };
}

export async function togglePlan(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("planId") ?? "");
  if (!id) return;

  const plano = await prisma.plan.findUnique({ where: { id } });
  if (!plano) return;

  // Não apagamos planos: mensalidades antigas e alunos apontam para eles.
  await prisma.plan.update({
    where: { id },
    data: { active: !plano.active },
  });

  revalidarFinanceiro();
}

/* -------------------------------------------------------------------------- */
/* Configuracoes da academia                                                   */
/* -------------------------------------------------------------------------- */

export async function saveSettings(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const pixKey = String(formData.get("pixKey") ?? "").trim();
  const pixOwnerName = String(formData.get("pixOwnerName") ?? "").trim();
  const dia = Number(formData.get("defaultDueDay") ?? 10);

  if (!Number.isInteger(dia) || dia < 1 || dia > 28) {
    return {
      error:
        "O dia do vencimento precisa ser entre 1 e 28. Usamos 28 como limite porque fevereiro não tem dia 29 todo ano.",
    };
  }

  await prisma.academySettings.upsert({
    where: { id: "unica" },
    create: {
      id: "unica",
      pixKey: pixKey || null,
      pixOwnerName: pixOwnerName || null,
      defaultDueDay: dia,
    },
    update: {
      pixKey: pixKey || null,
      pixOwnerName: pixOwnerName || null,
      defaultDueDay: dia,
    },
  });

  revalidarFinanceiro();
  return { success: "Configurações salvas." };
}

/* -------------------------------------------------------------------------- */
/* Dados financeiros do aluno                                                  */
/* -------------------------------------------------------------------------- */

export async function updateStudentFinance(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const studentId = String(formData.get("studentId") ?? "");
  const planId = String(formData.get("planId") ?? "");
  const dia = Number(formData.get("dueDay") ?? 10);
  const valorTexto = String(formData.get("customFee") ?? "").trim();
  const financialNotes = String(formData.get("financialNotes") ?? "").trim();

  if (!studentId) return { error: "Aluno não identificado." };
  if (!Number.isInteger(dia) || dia < 1 || dia > 28) {
    return { error: "O dia do vencimento precisa ser entre 1 e 28." };
  }

  let customFeeCents: number | null = null;
  if (valorTexto) {
    customFeeCents = parseMoney(valorTexto);
    if (customFeeCents === null) {
      return { error: "Valor personalizado inválido. Escreva assim: 120,00" };
    }
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      planId: planId || null,
      dueDay: dia,
      customFeeCents,
      financialNotes: financialNotes || null,
    },
  });

  revalidarFinanceiro(studentId);
  return { success: "Dados financeiros atualizados." };
}

/* -------------------------------------------------------------------------- */
/* Geracao das mensalidades do mes                                             */
/* -------------------------------------------------------------------------- */

export async function generateInvoices(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const referenceMonth = String(formData.get("referenceMonth") ?? "");
  if (!mesValido(referenceMonth)) {
    return { error: "Mês inválido." };
  }

  const alunos = await prisma.student.findMany({
    where: { active: true },
    include: { plan: true, user: { select: { name: true } } },
  });

  const comValor = alunos.filter((a) => valorDoAluno(a) > 0);
  const semValor = alunos.length - comValor.length;

  if (comValor.length === 0) {
    return {
      error:
        "Nenhum aluno ativo tem plano ou valor definido. Crie um plano e associe aos alunos antes de gerar as mensalidades.",
    };
  }

  // A restrição de unicidade (aluno + mês) no banco é o que garante que rodar
  // isso duas vezes não cria cobrança duplicada. O skipDuplicates apenas evita
  // que a operação inteira falhe por causa dos que já existem.
  const resultado = await prisma.invoice.createMany({
    data: comValor.map((a) => ({
      studentId: a.id,
      referenceMonth,
      dueDate: vencimentoDoMes(referenceMonth, a.dueDay),
      amountCents: valorDoAluno(a),
    })),
    skipDuplicates: true,
  });

  revalidarFinanceiro();

  const criadas = resultado.count;
  const jaExistiam = comValor.length - criadas;

  const partes = [
    criadas === 0
      ? "Nenhuma mensalidade nova"
      : `${criadas} ${criadas === 1 ? "mensalidade gerada" : "mensalidades geradas"}`,
  ];
  if (jaExistiam > 0) partes.push(`${jaExistiam} já existia(m)`);
  if (semValor > 0) partes.push(`${semValor} aluno(s) sem plano ficaram de fora`);

  return { success: partes.join(" · ") + "." };
}

/* -------------------------------------------------------------------------- */
/* Baixa de pagamento                                                          */
/* -------------------------------------------------------------------------- */

const baixaSchema = z.object({
  invoiceId: z.string().min(1),
  paymentMethod: z.enum(["PIX", "DINHEIRO", "CARTAO", "TRANSFERENCIA", "OUTRO"]),
  paidAt: z.string().min(1, "Informe a data do pagamento."),
  notes: z.string().trim().optional(),
});

export async function markPaid(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = baixaSchema.safeParse({
    invoiceId: formData.get("invoiceId"),
    paymentMethod: formData.get("paymentMethod"),
    paidAt: formData.get("paidAt"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (d.paidAt > hojeISO()) {
    return { error: "A data do pagamento não pode estar no futuro." };
  }

  const invoice = await prisma.invoice.update({
    where: { id: d.invoiceId },
    data: {
      status: "PAGO",
      paidAt: dataBrasileira(d.paidAt),
      paymentMethod: d.paymentMethod,
      notes: d.notes || null,
      confirmedById: staff.userId,
    },
    include: { student: { include: { user: { select: { name: true } } } } },
  });

  revalidarFinanceiro(invoice.studentId);
  return { success: `Pagamento de ${invoice.student.user.name} confirmado.` };
}

export async function markUnpaid(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("invoiceId") ?? "");
  if (!id) return;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      status: "PENDENTE",
      paidAt: null,
      paymentMethod: null,
      confirmedById: null,
    },
  });

  revalidarFinanceiro(invoice.studentId);
}

export async function cancelInvoice(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("invoiceId") ?? "");
  if (!id) return;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status: "CANCELADO" },
  });

  revalidarFinanceiro(invoice.studentId);
}

/* -------------------------------------------------------------------------- */
/* Aluno avisa que pagou                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Enquanto o Mercado Pago nao esta ligado, quem confirma o pagamento e o
 * professor. Este botao existe para o aluno sinalizar que pagou, em vez de
 * mandar mensagem solta -- a mensalidade fica "aguardando confirmacao" na
 * tela do professor.
 */
export async function declararPagamento(formData: FormData) {
  const { student } = await requireStudent();
  const id = String(formData.get("invoiceId") ?? "");
  if (!id) return;

  // O aluno só pode mexer nas próprias mensalidades.
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || invoice.studentId !== student.id) return;
  if (invoice.status !== "PENDENTE") return;

  await prisma.invoice.update({
    where: { id },
    data: { status: "EM_ANALISE" },
  });

  revalidarFinanceiro(student.id);
}
