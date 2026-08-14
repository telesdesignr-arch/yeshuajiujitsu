import { TZDate } from "@date-fns/tz";
import {
  differenceInCalendarDays,
  differenceInMonths,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * FUSO HORARIO DA ACADEMIA
 *
 * O servidor da Vercel roda em UTC. Sem fixar o fuso aqui, depois das 21h
 * (horario de Brasilia) o sistema ja acha que e o dia seguinte -- e a chamada
 * da aula das 19h cairia no dia errado, que e exatamente quando o professor
 * usa o app.
 *
 * Toda conta de calendario (que dia e hoje, que mes e este, que dia da semana)
 * passa por aqui. O Brasil nao tem mais horario de verao desde 2019, entao o
 * deslocamento e sempre -03:00.
 */
export const FUSO_ACADEMIA = "America/Sao_Paulo";
export const OFFSET_ACADEMIA = "-03:00";

/** Converte um instante para o calendario da academia. */
export function naAcademia(date: Date | string | number): TZDate {
  return new TZDate(new Date(date), FUSO_ACADEMIA);
}

/** Agora, no calendario da academia. */
export function agora(): TZDate {
  return new TZDate(new Date(), FUSO_ACADEMIA);
}

/**
 * Transforma "2026-08-13" (vindo de um campo de data) num instante real,
 * entendendo a data como horario de Brasilia -- e nao como UTC.
 */
export function dataBrasileira(dia: string, hora = "12:00") {
  return new Date(`${dia}T${hora}:00${OFFSET_ACADEMIA}`);
}

export const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const WEEKDAYS_SHORT = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

/** Chave estavel de um dia: "2026-08-13". Usada para comparar datas. */
export function dayKey(date: Date | string) {
  return format(naAcademia(date), "yyyy-MM-dd");
}

/** O dia de hoje no Brasil, em "2026-08-13". */
export function hojeISO() {
  return dayKey(new Date());
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(naAcademia(date), "dd/MM/yyyy");
}

export function formatDateLong(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(naAcademia(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(naAcademia(date), "d 'de' MMM", { locale: ptBR });
}

/** "13 de ago" no ano corrente, "13 de dez de 2025" nos outros. */
export function formatDateShortYear(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = naAcademia(date);
  const mesmoAno = d.getFullYear() === agora().getFullYear();
  return format(d, mesmoAno ? "d 'de' MMM" : "d 'de' MMM 'de' yyyy", {
    locale: ptBR,
  });
}

/** "19:30" no horario de Brasilia. */
export function formatTime(date: Date | string) {
  return format(naAcademia(date), "HH:mm");
}

export function formatMonthYear(date: Date | string) {
  return format(naAcademia(date), "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatWeekdayShort(date: Date | string) {
  return WEEKDAYS_SHORT[naAcademia(date).getDay()];
}

/** Dia do mes (1 a 31) no calendario brasileiro. */
export function diaDoMes(date: Date | string) {
  return naAcademia(date).getDate();
}

export function monthRange(reference: Date = new Date()) {
  const ref = naAcademia(reference);
  return { start: startOfMonth(ref), end: endOfMonth(ref) };
}

/** "1 ano e 3 meses", "8 meses", "12 dias" */
export function humanDuration(from: Date | string, to: Date = new Date()) {
  const start = new Date(from);
  const months = differenceInMonths(to, start);

  if (months < 1) {
    const days = Math.max(0, differenceInCalendarDays(to, start));
    if (days === 0) return "hoje";
    return `${days} ${days === 1 ? "dia" : "dias"}`;
  }
  if (months < 12) {
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  }

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const yearPart = `${years} ${years === 1 ? "ano" : "anos"}`;
  if (rest === 0) return yearPart;
  return `${yearPart} e ${rest} ${rest === 1 ? "mês" : "meses"}`;
}

export function monthsSince(from: Date | string, to: Date = new Date()) {
  return differenceInMonths(to, new Date(from));
}
