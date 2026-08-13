import { eachDayOfInterval, endOfMonth, getDay, startOfMonth } from "date-fns";

import { dayKey, WEEKDAYS_SHORT } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Calendario do mes marcando os dias em que o aluno treinou.
 * Serve tanto na area do aluno quanto no perfil aberto pelo professor.
 */
export function AttendanceCalendar({
  month,
  attendedDays,
  academyDays,
  /** quem treinou: "Você" na área do aluno, o nome dele no painel */
  subject = "Você",
  className,
}: {
  month: Date;
  attendedDays: Set<string>;
  academyDays: Set<string>;
  subject?: string;
  className?: string;
}) {
  const faltou = subject === "Você" ? "você não treinou" : `${subject} não treinou`;
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  const days = eachDayOfInterval({ start: first, end: last });
  const leading = getDay(first); // quantas casas vazias antes do dia 1
  const today = dayKey(new Date());

  return (
    <div className={className}>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS_SHORT.map((d) => (
          <span
            key={d}
            aria-hidden
            className="pb-1 text-center text-[11px] font-bold tracking-wide text-ink-300 uppercase"
          >
            {d.charAt(0)}
          </span>
        ))}

        {Array.from({ length: leading }).map((_, i) => (
          <span key={`vazio-${i}`} />
        ))}

        {days.map((day) => {
          const key = dayKey(day);
          const treinou = attendedDays.has(key);
          const teveAula = academyDays.has(key);
          const isFuturo = key > today;
          const isHoje = key === today;

          return (
            <span
              key={key}
              title={
                treinou
                  ? `${subject} treinou neste dia`
                  : teveAula && !isFuturo
                    ? `Teve aula, ${faltou}`
                    : "Sem aula"
              }
              className={cn(
                "tabular flex aspect-square items-center justify-center rounded-[8px] text-[13px] font-semibold",
                treinou && "bg-brand-600 text-white",
                !treinou && teveAula && !isFuturo && "bg-ink-100 text-ink-500",
                !treinou && teveAula && isFuturo && "bg-white text-ink-300 ring-1 ring-line",
                !teveAula && "text-ink-300",
                isHoje && !treinou && "ring-2 ring-ink",
              )}
            >
              {day.getDate()}
            </span>
          );
        })}
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-500">
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-[3px] bg-brand-600" />
          {subject} treinou
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-[3px] bg-ink-100" />
          Teve aula, {faltou}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-[3px] ring-2 ring-ink" />
          Hoje
        </li>
      </ul>
    </div>
  );
}
