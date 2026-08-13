import {
  differenceInCalendarDays,
  differenceInMonths,
  endOfMonth,
  format,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "yyyy-MM-dd");
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "dd/MM/yyyy");
}

export function formatDateLong(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "d 'de' MMM", { locale: ptBR });
}

/** "13 de ago" no ano corrente, "13 de dez de 2025" nos outros. */
export function formatDateShortYear(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = new Date(date);
  const mesmoAno = d.getFullYear() === new Date().getFullYear();
  return format(d, mesmoAno ? "d 'de' MMM" : "d 'de' MMM 'de' yyyy", {
    locale: ptBR,
  });
}

export function formatMonthYear(date: Date | string) {
  return format(new Date(date), "MMMM 'de' yyyy", { locale: ptBR });
}

export function formatWeekdayShort(date: Date | string) {
  return WEEKDAYS_SHORT[new Date(date).getDay()];
}

export function monthRange(reference: Date = new Date()) {
  return { start: startOfMonth(reference), end: endOfMonth(reference) };
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
