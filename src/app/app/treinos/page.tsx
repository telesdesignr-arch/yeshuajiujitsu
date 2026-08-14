import type { Metadata } from "next";
import Link from "next/link";
import { addMonths, endOfMonth, isAfter, startOfMonth } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Swords } from "lucide-react";

import { AttendanceCalendar } from "@/components/attendance-calendar";
import { BarChart } from "@/components/charts";
import { Card, CardBody, CardHeader, CardTitle, SectionTitle } from "@/components/ui/card";
import { Badge, EmptyState, Progress } from "@/components/ui/misc";
import { requireStudent } from "@/lib/auth";
import { dayKey, formatMonthYear, formatWeekdayShort } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getStudentStats } from "@/lib/stats";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Treinos" };
export const dynamic = "force-dynamic";

function parseMonth(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return startOfMonth(new Date());
}

function monthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function TreinosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const { student } = await requireStudent();

  const mesAtual = parseMonth(mes);
  const inicio = startOfMonth(mesAtual);
  const fim = endOfMonth(mesAtual);
  const podeAvancar = !isAfter(addMonths(inicio, 1), startOfMonth(new Date()));

  const [stats, presencas, aulasDoMes] = await Promise.all([
    getStudentStats(student),
    prisma.attendance.findMany({
      where: {
        studentId: student.id,
        present: true,
        date: { gte: inicio, lte: fim },
      },
      include: { session: true },
      orderBy: { date: "desc" },
    }),
    prisma.attendanceSession.findMany({
      where: { date: { gte: inicio, lte: fim } },
      select: { date: true },
    }),
  ]);

  const attendedDays = new Set(presencas.map((p) => dayKey(p.session.date)));
  const academyDays = new Set(aulasDoMes.map((a) => dayKey(a.date)));
  const percentual = Math.round((presencas.length / (student.monthlyGoal || 12)) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Treinos
        </h1>
        <p className="text-sm text-ink-500">
          Seu calendário de presença, mês a mês.
        </p>
      </div>

      {/* Calendário */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-2 pb-3">
          <Link
            href={`/app/treinos?mes=${monthParam(addMonths(inicio, -1))}`}
            aria-label="Mês anterior"
            className="flex size-10 items-center justify-center rounded-[10px] text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </Link>
          <CardTitle className="text-center first-letter:uppercase">
            {formatMonthYear(inicio)}
          </CardTitle>
          {podeAvancar ? (
            <Link
              href={`/app/treinos?mes=${monthParam(addMonths(inicio, 1))}`}
              aria-label="Próximo mês"
              className="flex size-10 items-center justify-center rounded-[10px] text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
            >
              <ChevronRight aria-hidden className="size-5" />
            </Link>
          ) : (
            <span aria-hidden className="size-10" />
          )}
        </CardHeader>
        <CardBody>
          <AttendanceCalendar
            month={inicio}
            attendedDays={attendedDays}
            academyDays={academyDays}
          />

          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-end justify-between gap-3">
              <p className="tabular font-display text-3xl leading-none font-bold">
                {presencas.length}
                <span className="text-xl text-ink-300">
                  {" "}
                  / {student.monthlyGoal}
                </span>
                <span className="ml-2 text-sm font-semibold text-ink-500">
                  {pluralize(presencas.length, "treino", "treinos")} no mês
                </span>
              </p>
              <Badge tone={percentual >= 100 ? "success" : "brand"}>
                {percentual}%
              </Badge>
            </div>
            <Progress
              value={presencas.length}
              max={student.monthlyGoal}
              label="Treinos do mês em relação à meta"
              className="mt-3"
            />
          </div>
        </CardBody>
      </Card>

      {/* Histórico de 6 meses */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos 6 meses</CardTitle>
        </CardHeader>
        <CardBody>
          <BarChart
            caption="Treinos realizados por mês nos últimos seis meses"
            data={stats.history.map((h) => ({
              label: h.short,
              fullLabel: h.label,
              value: h.count,
              target: h.goal,
              highlight: h.key === monthParam(inicio),
            }))}
          />
          <p className="mt-3 text-xs text-ink-500">
            A linha tracejada mostra a sua meta de {student.monthlyGoal} treinos
            por mês.
          </p>
        </CardBody>
      </Card>

      {/* Lista de treinos do mês */}
      <section>
        <SectionTitle>Histórico do mês</SectionTitle>

        {presencas.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum treino neste mês"
            description="Escolha outro mês nas setas acima ou volte ao tatame para começar a somar."
          />
        ) : (
          <Card>
            <ul>
              {presencas.map((registro, i) => (
                <li
                  key={registro.id}
                  className={`flex gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-[10px] bg-brand-50 leading-none text-brand-800">
                    <span className="tabular text-base font-bold">
                      {registro.session.date.getDate()}
                    </span>
                    <span className="mt-0.5 text-[10px] font-semibold uppercase">
                      {formatWeekdayShort(registro.session.date)}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <Swords aria-hidden className="size-3.5 shrink-0 text-ink-500" />
                      <span className="truncate font-semibold">
                        {registro.session.title}
                      </span>
                    </span>
                    {registro.session.techniques && (
                      <span className="mt-0.5 block text-sm leading-snug text-ink-500">
                        {registro.session.techniques}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
