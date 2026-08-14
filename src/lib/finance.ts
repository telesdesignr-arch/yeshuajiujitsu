import { agora, dataBrasileira, naAcademia } from "@/lib/dates";

/**
 * Regras das mensalidades.
 */

export type InvoiceStatus = "PENDENTE" | "EM_ANALISE" | "PAGO" | "CANCELADO";

/** Situacao mostrada na tela, ja considerando o vencimento. */
export type SituacaoMensalidade =
  | "PAGO"
  | "EM_ANALISE"
  | "ATRASADO"
  | "VENCE_HOJE"
  | "A_VENCER"
  | "CANCELADO";

/**
 * "Atrasado" nao fica guardado no banco -- e calculado aqui.
 *
 * Se fosse um campo, dependeria de alguma rotina rodar todo dia na hora certa
 * para virar de PENDENTE para ATRASADO. Se a rotina falhasse num feriado, o
 * professor veria a academia toda em dia sem estar. Calculando na hora, a tela
 * nunca mente.
 */
export function situacao(invoice: {
  status: string;
  dueDate: Date;
}): SituacaoMensalidade {
  if (invoice.status === "PAGO") return "PAGO";
  if (invoice.status === "CANCELADO") return "CANCELADO";
  if (invoice.status === "EM_ANALISE") return "EM_ANALISE";

  const hoje = agora();
  const venceEm = naAcademia(invoice.dueDate);

  const mesmoDia =
    venceEm.getFullYear() === hoje.getFullYear() &&
    venceEm.getMonth() === hoje.getMonth() &&
    venceEm.getDate() === hoje.getDate();

  if (mesmoDia) return "VENCE_HOJE";
  return venceEm < hoje ? "ATRASADO" : "A_VENCER";
}

export const SITUACAO_INFO: Record<
  SituacaoMensalidade,
  { label: string; tone: "success" | "warning" | "danger" | "neutral" | "brand" }
> = {
  PAGO: { label: "Pago", tone: "success" },
  EM_ANALISE: { label: "Aguardando confirmação", tone: "brand" },
  ATRASADO: { label: "Atrasado", tone: "danger" },
  VENCE_HOJE: { label: "Vence hoje", tone: "warning" },
  A_VENCER: { label: "A vencer", tone: "neutral" },
  CANCELADO: { label: "Cancelado", tone: "neutral" },
};

export const PAYMENT_METHODS: Record<string, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO: "Cartão",
  TRANSFERENCIA: "Transferência",
  OUTRO: "Outro",
};

/* -------------------------------------------------------------------------- */
/* Mes de competencia                                                          */
/* -------------------------------------------------------------------------- */

/** "2026-08" do mes corrente, no calendario brasileiro. */
export function mesAtual() {
  const d = agora();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-08" -> "agosto de 2026" */
export function nomeDoMes(referencia: string) {
  const [ano, mes] = referencia.split("-").map(Number);
  const nomes = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  return `${nomes[mes - 1]} de ${ano}`;
}

/** Anda meses para frente ou para tras: ("2026-08", -1) -> "2026-07" */
export function deslocarMes(referencia: string, passos: number) {
  const [ano, mes] = referencia.split("-").map(Number);
  const total = ano * 12 + (mes - 1) + passos;
  const novoAno = Math.floor(total / 12);
  const novoMes = (total % 12) + 1;
  return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

export function mesValido(referencia: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(referencia);
}

/**
 * Data de vencimento de um aluno num mes.
 *
 * O dia e limitado a 28 no cadastro justamente para nao existir "31 de
 * fevereiro". Ainda assim protegemos aqui, para o caso de um dado antigo.
 */
export function vencimentoDoMes(referencia: string, dia: number) {
  const [ano, mes] = referencia.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const diaSeguro = Math.min(Math.max(1, dia), ultimoDia);
  return dataBrasileira(
    `${referencia}-${String(diaSeguro).padStart(2, "0")}`,
    "12:00",
  );
}

/** Quanto o aluno paga: valor proprio, se houver, senao o do plano. */
export function valorDoAluno(aluno: {
  customFeeCents: number | null;
  plan: { priceCents: number } | null;
}) {
  return aluno.customFeeCents ?? aluno.plan?.priceCents ?? 0;
}
