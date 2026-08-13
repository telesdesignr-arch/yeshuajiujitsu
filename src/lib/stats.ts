import "server-only";

import {
  endOfMonth,
  format,
  getDaysInMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";

import { prisma } from "@/lib/prisma";
import { dayKey, formatMonthYear, monthsSince } from "@/lib/dates";
import { nextStep } from "@/lib/belts";

/**
 * Calculo de frequencia e evolucao do aluno.
 *
 * Decisao importante: a "frequencia" mostrada ao aluno e
 *   treinos realizados / meta de treinos do periodo
 * e nao "presencas / todas as aulas da academia". A academia abre varios
 * horarios por dia; ninguem treina em todos. Comparar com a meta pessoal do
 * aluno (padrao: 12 treinos por mes) e justo e mostra um numero que faz
 * sentido para ele.
 */

export type MonthPoint = {
  key: string; // "2026-08"
  label: string; // "agosto de 2026"
  short: string; // "ago"
  count: number;
  goal: number;
  percent: number;
};

export type StudentStats = {
  totalTrainings: number;
  monthTrainings: number;
  monthGoal: number;
  monthPercent: number;
  streak: number;
  lastTrainingAt: Date | null;
  attendedDayKeys: string[];
  academyDayKeys: string[];
  history: MonthPoint[];
  /** progresso ate a proxima graduacao, de 0 a 1 */
  graduationProgress: number;
  monthsOnCurrentGrade: number;
  expectedMonths: number | null;
};

const MONTH_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

const WEEK_OPTIONS = { weekStartsOn: 1 as const }; // semana comeca na segunda

function weekKey(date: Date) {
  return format(startOfWeek(date, WEEK_OPTIONS), "yyyy-MM-dd");
}

/**
 * Sequencia de constancia: quantas semanas seguidas o aluno treinou pelo
 * menos uma vez.
 *
 * Medimos em semanas, e nao em dias seguidos, porque ninguem treina
 * Jiu-Jitsu seis dias por semana -- um contador de dias seguidos ficaria
 * quase sempre em zero e desmotivaria em vez de motivar. Semana e a unidade
 * real de constancia no tatame.
 *
 * A semana corrente nao quebra a sequencia: se o aluno ainda nao treinou
 * nesta semana, contamos a partir da semana passada.
 */
export function computeWeekStreak(
  attendedDates: Date[],
  today = new Date(),
): number {
  const weeks = new Set(attendedDates.map(weekKey));
  let streak = 0;
  let cursor = startOfWeek(today, WEEK_OPTIONS);

  if (weeks.has(weekKey(cursor))) streak += 1;

  cursor = subWeeks(cursor, 1);
  while (weeks.has(weekKey(cursor))) {
    streak += 1;
    cursor = subWeeks(cursor, 1);
  }

  return streak;
}

export async function getStudentStats(student: {
  id: string;
  joinedAt: Date;
  monthlyGoal: number;
  belt: string;
  degree: number;
  beltSinceAt: Date;
}): Promise<StudentStats> {
  const now = new Date();
  const historyStart = startOfMonth(subMonths(now, 5));
  const from = student.joinedAt < historyStart ? historyStart : student.joinedAt;

  const [sessions, attendances, totalTrainings] = await Promise.all([
    prisma.attendanceSession.findMany({
      where: { date: { gte: from } },
      select: { date: true },
      orderBy: { date: "desc" },
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id, present: true },
      select: { session: { select: { date: true } } },
      orderBy: { session: { date: "desc" } },
    }),
    prisma.attendance.count({ where: { studentId: student.id, present: true } }),
  ]);

  const attendedDates = attendances.map((a) => a.session.date);
  const attendedDayKeys = Array.from(new Set(attendedDates.map(dayKey)));
  const academyDayKeys = Array.from(new Set(sessions.map((s) => dayKey(s.date))));

  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthTrainings = attendedDates.filter(
    (d) => d >= monthStart && d <= monthEnd,
  ).length;

  const monthGoal = student.monthlyGoal || 12;
  const monthPercent = Math.round((monthTrainings / monthGoal) * 100);

  // Historico dos ultimos 6 meses
  const history: MonthPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const ref = subMonths(now, i);
    const start = startOfMonth(ref);
    const end = endOfMonth(ref);
    const count = attendedDates.filter((d) => d >= start && d <= end).length;
    history.push({
      key: `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`,
      label: formatMonthYear(ref),
      short: MONTH_SHORT[ref.getMonth()],
      count,
      goal: monthGoal,
      percent: Math.round((count / monthGoal) * 100),
    });
  }

  const monthsOnCurrentGrade = monthsSince(student.beltSinceAt, now);
  const step = nextStep(student.belt, student.degree);
  const graduationProgress = step.expectedMonths
    ? Math.min(1, monthsOnCurrentGrade / step.expectedMonths)
    : 1;

  return {
    totalTrainings,
    monthTrainings,
    monthGoal,
    monthPercent,
    streak: computeWeekStreak(attendedDates),
    lastTrainingAt: attendedDates[0] ?? null,
    attendedDayKeys,
    academyDayKeys,
    history,
    graduationProgress,
    monthsOnCurrentGrade,
    expectedMonths: step.expectedMonths,
  };
}

/**
 * Frequencia resumida de varios alunos de uma vez.
 * Usada nas listas do professor, onde carregar aluno por aluno seria lento.
 */
export type StudentSummary = {
  studentId: string;
  monthTrainings: number;
  monthPercent: number;
  totalTrainings: number;
  lastTrainingAt: Date | null;
};

export async function getStudentsSummary(
  students: { id: string; monthlyGoal: number }[],
): Promise<Map<string, StudentSummary>> {
  const ids = students.map((s) => s.id);
  if (ids.length === 0) return new Map();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [monthRows, totalRows, lastRows] = await Promise.all([
    prisma.attendance.groupBy({
      by: ["studentId"],
      where: {
        studentId: { in: ids },
        present: true,
        session: { date: { gte: monthStart, lte: monthEnd } },
      },
      _count: { _all: true },
    }),
    prisma.attendance.groupBy({
      by: ["studentId"],
      where: { studentId: { in: ids }, present: true },
      _count: { _all: true },
    }),
    prisma.attendance.findMany({
      where: { studentId: { in: ids }, present: true },
      select: { studentId: true, session: { select: { date: true } } },
      orderBy: { session: { date: "desc" } },
    }),
  ]);

  const monthMap = new Map(monthRows.map((r) => [r.studentId, r._count._all]));
  const totalMap = new Map(totalRows.map((r) => [r.studentId, r._count._all]));
  const lastMap = new Map<string, Date>();
  for (const row of lastRows) {
    if (!lastMap.has(row.studentId)) lastMap.set(row.studentId, row.session.date);
  }

  const result = new Map<string, StudentSummary>();
  for (const s of students) {
    const monthTrainings = monthMap.get(s.id) ?? 0;
    const goal = s.monthlyGoal || 12;
    result.set(s.id, {
      studentId: s.id,
      monthTrainings,
      monthPercent: Math.round((monthTrainings / goal) * 100),
      totalTrainings: totalMap.get(s.id) ?? 0,
      lastTrainingAt: lastMap.get(s.id) ?? null,
    });
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* Visao geral da academia (dashboard do professor)                            */
/* -------------------------------------------------------------------------- */

export type AcademyOverview = {
  alunosAtivos: number;
  novosNoMes: number;
  presencasNoMes: number;
  aulasNoMes: number;
  competidores: number;
  frequenciaMedia: number;
  porFaixa: { belt: string; count: number }[];
  historico: {
    short: string;
    label: string;
    percent: number;
    parcial: boolean;
  }[];
};

export async function getAcademyOverview(): Promise<AcademyOverview> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [ativos, novosNoMes, presencasNoMes, aulasNoMes, competidores, porFaixaRaw] =
    await Promise.all([
      prisma.student.findMany({
        where: { active: true },
        select: { id: true, monthlyGoal: true, joinedAt: true },
      }),
      prisma.student.count({
        where: { joinedAt: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.attendance.count({
        where: {
          present: true,
          session: { date: { gte: monthStart, lte: monthEnd } },
        },
      }),
      prisma.attendanceSession.count({
        where: { date: { gte: monthStart, lte: monthEnd } },
      }),
      prisma.student.count({ where: { active: true, isCompetitor: true } }),
      prisma.student.groupBy({
        by: ["belt"],
        where: { active: true },
        _count: { _all: true },
      }),
    ]);

  // Frequência da academia mês a mês: presenças registradas dividido pela
  // soma das metas dos alunos que já estavam matriculados naquele mês.
  //
  // O mês corrente é proporcionalizado pelos dias já decorridos. Sem isso,
  // no dia 10 de agosto o gráfico mostraria "24%" ao lado de "65%" de julho
  // e daria a impressão de que a academia despencou -- quando na verdade o
  // mês só começou.
  const historico: AcademyOverview["historico"] = [];
  let metaProporcionalAtual = 0;

  for (let i = 5; i >= 0; i--) {
    const ref = subMonths(now, i);
    const start = startOfMonth(ref);
    const end = endOfMonth(ref);
    const parcial = i === 0;

    const matriculados = ativos.filter((a) => a.joinedAt <= end);
    const metaTotal = matriculados.reduce((s, a) => s + (a.monthlyGoal || 12), 0);
    const proporcao = parcial
      ? Math.min(1, now.getDate() / getDaysInMonth(ref))
      : 1;
    const metaAjustada = metaTotal * proporcao;
    if (parcial) metaProporcionalAtual = metaAjustada;

    const presencas = await prisma.attendance.count({
      where: { present: true, session: { date: { gte: start, lte: end } } },
    });

    historico.push({
      short: MONTH_SHORT[ref.getMonth()],
      label: formatMonthYear(ref) + (parcial ? " (parcial)" : ""),
      percent: metaAjustada > 0 ? Math.round((presencas / metaAjustada) * 100) : 0,
      parcial,
    });
  }

  return {
    alunosAtivos: ativos.length,
    novosNoMes,
    presencasNoMes,
    aulasNoMes,
    competidores,
    frequenciaMedia:
      metaProporcionalAtual > 0
        ? Math.round((presencasNoMes / metaProporcionalAtual) * 100)
        : 0,
    porFaixa: porFaixaRaw.map((f) => ({ belt: f.belt, count: f._count._all })),
    historico,
  };
}

/* -------------------------------------------------------------------------- */
/* Alunos proximos da graduacao                                                */
/* -------------------------------------------------------------------------- */

export type GraduationCandidate = {
  studentId: string;
  name: string;
  photoUrl: string | null;
  belt: string;
  degree: number;
  beltSinceAt: Date;
  monthsOnGrade: number;
  expectedMonths: number | null;
  monthPercent: number;
  /** frequencia dos ultimos 3 meses fechados -- mais estavel que a do mes */
  recentPercent: number;
  totalTrainings: number;
  proximoLabel: string;
  /** 0 a 1+: quanto do tempo de referencia ja cumpriu */
  progresso: number;
  pronto: boolean;
};

export async function getGraduationCandidates(): Promise<GraduationCandidate[]> {
  const students = await prisma.student.findMany({
    where: { active: true },
    include: { user: { select: { name: true } } },
  });

  const resumo = await getStudentsSummary(
    students.map((s) => ({ id: s.id, monthlyGoal: s.monthlyGoal })),
  );

  // Para decidir graduação olhamos os últimos 3 meses fechados, e não o mês
  // corrente: no dia 5 do mês todo mundo pareceria relapso.
  const now = new Date();
  const inicioJanela = startOfMonth(subMonths(now, 3));
  const fimJanela = endOfMonth(subMonths(now, 1));

  const recentes = await prisma.attendance.groupBy({
    by: ["studentId"],
    where: {
      studentId: { in: students.map((s) => s.id) },
      present: true,
      session: { date: { gte: inicioJanela, lte: fimJanela } },
    },
    _count: { _all: true },
  });
  const recenteMap = new Map(recentes.map((r) => [r.studentId, r._count._all]));

  const candidatos = students.map((s) => {
    const step = nextStep(s.belt, s.degree);
    const meses = monthsSince(s.beltSinceAt);
    const progresso = step.expectedMonths ? meses / step.expectedMonths : 0;
    const r = resumo.get(s.id);
    const monthPercent = r?.monthPercent ?? 0;

    // Se o aluno entrou há menos de 3 meses, comparamos só com os meses que
    // ele realmente teve na academia.
    const mesesNaJanela = Math.max(1, Math.min(3, monthsSince(s.joinedAt)));
    const metaJanela = (s.monthlyGoal || 12) * mesesNaJanela;
    const recentPercent = Math.round(
      ((recenteMap.get(s.id) ?? 0) / metaJanela) * 100,
    );

    return {
      studentId: s.id,
      name: s.user.name,
      photoUrl: s.photoUrl,
      belt: s.belt,
      degree: s.degree,
      beltSinceAt: s.beltSinceAt,
      monthsOnGrade: meses,
      expectedMonths: step.expectedMonths,
      monthPercent,
      recentPercent,
      totalTrainings: r?.totalTrainings ?? 0,
      proximoLabel: step.label,
      progresso,
      // "Pronto" = cumpriu o tempo de referência E vem treinando de verdade.
      // A porta da frequência é o que separa "está há muito tempo na faixa"
      // de "merece o grau": quem sumiu do tatame aparece em "chegando lá",
      // não aqui.
      pronto: progresso >= 1 && recentPercent >= 60,
    };
  });

  return candidatos.sort((a, b) => {
    if (a.pronto !== b.pronto) return a.pronto ? -1 : 1;
    return b.progresso - a.progresso;
  });
}
