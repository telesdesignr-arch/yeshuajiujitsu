import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Cog,
  Layers,
  Undo2,
  Wallet,
  Wand2,
  X,
} from "lucide-react";

import {
  BaixaForm,
  ConfiguracoesForm,
  GerarMensalidadesForm,
  PlanoForm,
} from "./formularios";
import { cancelInvoice, markUnpaid, togglePlan } from "@/actions/financeiro";
import { BeltChip } from "@/components/belt";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Collapsible,
  SectionTitle,
} from "@/components/ui/card";
import { Avatar, Badge, EmptyState, Stat } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { formatDateShortYear } from "@/lib/dates";
import {
  SITUACAO_INFO,
  deslocarMes,
  mesAtual,
  mesValido,
  nomeDoMes,
  situacao,
  valorDoAluno,
} from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Financeiro" };
export const dynamic = "force-dynamic";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  await requireStaff();
  const { mes } = await searchParams;
  const referencia = mes && mesValido(mes) ? mes : mesAtual();

  const [mensalidades, planos, config, alunosAtivos] = await Promise.all([
    prisma.invoice.findMany({
      where: { referenceMonth: referencia },
      include: {
        student: {
          include: { user: { select: { name: true } }, plan: true },
        },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.plan.findMany({ orderBy: [{ active: "desc" }, { sortOrder: "asc" }] }),
    prisma.academySettings.findUnique({ where: { id: "unica" } }),
    prisma.student.findMany({
      where: { active: true },
      include: { plan: true },
    }),
  ]);

  const comValor = alunosAtivos.filter((a) => valorDoAluno(a) > 0);

  // Situação de cada mensalidade, já considerando o vencimento.
  const comSituacao = mensalidades.map((m) => ({ ...m, sit: situacao(m) }));

  const recebido = comSituacao
    .filter((m) => m.sit === "PAGO")
    .reduce((s, m) => s + m.amountCents - m.discountCents, 0);
  const aReceber = comSituacao
    .filter((m) => m.sit === "A_VENCER" || m.sit === "VENCE_HOJE")
    .reduce((s, m) => s + m.amountCents - m.discountCents, 0);
  const atrasado = comSituacao
    .filter((m) => m.sit === "ATRASADO")
    .reduce((s, m) => s + m.amountCents - m.discountCents, 0);
  const emAnalise = comSituacao.filter((m) => m.sit === "EM_ANALISE");

  const previsto = comSituacao
    .filter((m) => m.sit !== "CANCELADO")
    .reduce((s, m) => s + m.amountCents - m.discountCents, 0);
  const percentualRecebido =
    previsto > 0 ? Math.round((recebido / previsto) * 100) : 0;

  // Ordem de leitura do professor: quem precisa de ação primeiro.
  const ordem = ["EM_ANALISE", "ATRASADO", "VENCE_HOJE", "A_VENCER", "PAGO", "CANCELADO"];
  const ordenadas = [...comSituacao].sort(
    (a, b) =>
      ordem.indexOf(a.sit) - ordem.indexOf(b.sit) ||
      a.dueDate.getTime() - b.dueDate.getTime(),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Financeiro
        </h1>
        <p className="text-sm text-ink-500">
          Mensalidades da academia, mês a mês.
        </p>
      </div>

      {/* Seletor de mês */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-2 pb-3">
          <Link
            href={`/painel/financeiro?mes=${deslocarMes(referencia, -1)}`}
            aria-label="Mês anterior"
            className="flex size-10 items-center justify-center rounded-[10px] text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
          <CardTitle className="text-center first-letter:uppercase">
            {nomeDoMes(referencia)}
          </CardTitle>
          <Link
            href={`/painel/financeiro?mes=${deslocarMes(referencia, 1)}`}
            aria-label="Próximo mês"
            className="flex size-10 items-center justify-center rounded-[10px] text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
          >
            <ChevronRight aria-hidden className="size-5" />
          </Link>
        </CardHeader>
      </Card>

      {/* Números */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Recebido"
          value={formatMoney(recebido)}
          hint={`${percentualRecebido}% do previsto`}
          icon={Wallet}
          tone="dark"
        />
        <Stat
          label="A receber"
          value={formatMoney(aReceber)}
          hint="Ainda não venceu"
          icon={Clock}
        />
        <Stat
          label="Em atraso"
          value={formatMoney(atrasado)}
          hint={`${comSituacao.filter((m) => m.sit === "ATRASADO").length} aluno(s)`}
          icon={AlertTriangle}
          tone={atrasado > 0 ? "brand" : "default"}
        />
        <Stat
          label="Previsto no mês"
          value={formatMoney(previsto)}
          hint={`${comSituacao.length} mensalidade(s)`}
          icon={CircleDollarSign}
        />
      </div>

      {emAnalise.length > 0 && (
        <Card className="border-brand-300 bg-brand-50">
          <CardBody className="pt-4">
            <p className="font-display text-base font-bold tracking-wide uppercase text-brand-800">
              {emAnalise.length}{" "}
              {emAnalise.length === 1
                ? "aluno avisou que pagou"
                : "alunos avisaram que pagaram"}
            </p>
            <p className="mt-1 text-sm text-brand-800">
              Confira no extrato da academia e confirme abaixo. Eles aparecem no
              topo da lista.
            </p>
          </CardBody>
        </Card>
      )}

      <Collapsible
        title="Gerar mensalidades do mês"
        description={`Criar as cobranças de ${nomeDoMes(referencia)}`}
        icon={Wand2}
        defaultOpen={mensalidades.length === 0}
      >
        <GerarMensalidadesForm
          referenceMonth={referencia}
          quantosAlunos={comValor.length}
          jaGeradas={mensalidades.length}
        />
      </Collapsible>

      {/* Lista */}
      <SectionTitle>Mensalidades</SectionTitle>

      {ordenadas.length === 0 ? (
        <EmptyState
          icon={CircleDollarSign}
          title={`Nenhuma mensalidade em ${nomeDoMes(referencia)}`}
          description="Use o botão acima para gerar as cobranças do mês de todos os alunos com plano."
        />
      ) : (
        <div className="space-y-3">
          {ordenadas.map((m) => {
            const info = SITUACAO_INFO[m.sit];
            const valor = m.amountCents - m.discountCents;
            const precisaAcao = m.sit !== "PAGO" && m.sit !== "CANCELADO";

            return (
              <Card key={m.id}>
                <CardBody className="pt-4">
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={m.student.user.name}
                      src={m.student.photoUrl}
                      size={42}
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/painel/alunos/${m.studentId}`}
                        className="block truncate font-semibold hover:underline"
                      >
                        {m.student.user.name}
                      </Link>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <BeltChip
                          belt={m.student.belt}
                          degree={m.student.degree}
                          size="sm"
                        />
                        <span className="text-xs text-ink-500">
                          {m.student.plan?.name ?? "Valor personalizado"}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="tabular font-display text-lg leading-none font-bold">
                        {formatMoney(valor)}
                      </p>
                      <Badge tone={info.tone} className="mt-1.5">
                        {info.label}
                      </Badge>
                    </div>
                  </div>

                  <p className="mt-3 border-t border-line pt-2.5 text-sm text-ink-500">
                    Vence em {formatDateShortYear(m.dueDate)}
                    {m.paidAt && ` · pago em ${formatDateShortYear(m.paidAt)}`}
                    {m.paymentMethod && ` · ${m.paymentMethod.toLowerCase()}`}
                  </p>

                  {m.notes && (
                    <p className="mt-1 text-sm text-ink-500">{m.notes}</p>
                  )}

                  {precisaAcao ? (
                    <details className="group mt-3">
                      <summary className="inline-flex h-10 cursor-pointer list-none items-center gap-2 rounded-[10px] bg-brand-600 px-4 text-sm font-semibold text-white transition-smooth hover:bg-brand-700 [&::-webkit-details-marker]:hidden">
                        Dar baixa no pagamento
                      </summary>
                      <div className="mt-3 rounded-[10px] border border-line p-3">
                        <BaixaForm
                          invoiceId={m.id}
                          alunoNome={m.student.user.name}
                          valor={valor}
                        />
                        <form action={cancelInvoice} className="mt-3 border-t border-line pt-3">
                          <input type="hidden" name="invoiceId" value={m.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-ink-500 hover:text-danger"
                          >
                            <X aria-hidden className="size-4" />
                            Cancelar esta mensalidade
                          </Button>
                        </form>
                      </div>
                    </details>
                  ) : (
                    m.sit === "PAGO" && (
                      <form action={markUnpaid} className="mt-2">
                        <input type="hidden" name="invoiceId" value={m.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-ink-500 hover:text-ink"
                        >
                          <Undo2 aria-hidden className="size-4" />
                          Desfazer baixa
                        </Button>
                      </form>
                    )
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Planos */}
      <SectionTitle>Planos</SectionTitle>

      <Collapsible
        title="Novo plano"
        description="Criar um plano de mensalidade"
        icon={Layers}
        defaultOpen={planos.length === 0}
      >
        <PlanoForm />
      </Collapsible>

      {planos.length > 0 && (
        <Card className="overflow-hidden">
          <ul>
            {planos.map((p, i) => (
              <li key={p.id} className={i > 0 ? "border-t border-line" : ""}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      {p.name}
                      {!p.active && <Badge tone="neutral">Inativo</Badge>}
                    </p>
                    {p.description && (
                      <p className="text-sm text-ink-500">{p.description}</p>
                    )}
                  </div>
                  <p className="tabular shrink-0 font-display text-lg font-bold">
                    {formatMoney(p.priceCents)}
                  </p>
                  <form action={togglePlan} className="shrink-0">
                    <input type="hidden" name="planId" value={p.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-ink-500"
                    >
                      {p.active ? "Desativar" : "Reativar"}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-xs text-ink-500">
        Planos não são apagados, só desativados. As mensalidades antigas continuam
        apontando para eles.
      </p>

      {/* Configurações */}
      <SectionTitle>Configurações</SectionTitle>

      <Collapsible
        title="Chave Pix e vencimento"
        description="O que o aluno vê para pagar"
        icon={Cog}
        defaultOpen={!config?.pixKey}
      >
        <ConfiguracoesForm
          pixKey={config?.pixKey ?? ""}
          pixOwnerName={config?.pixOwnerName ?? ""}
          defaultDueDay={config?.defaultDueDay ?? 10}
        />
      </Collapsible>
    </div>
  );
}
