import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Flame,
  MapPin,
  Swords,
  Target,
  TrendingUp,
} from "lucide-react";

import { BeltBar } from "@/components/belt";
import { EventTypeBadge } from "@/components/event-type";
import { Card, CardBody, SectionTitle } from "@/components/ui/card";
import { Badge, EmptyState, Progress, Stat } from "@/components/ui/misc";
import { graduationLabel, nextStep } from "@/lib/belts";
import { requireStudent } from "@/lib/auth";
import {
  formatDateLong,
  formatDateShort,
  formatDateShortYear,
  humanDuration,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getStudentStats } from "@/lib/stats";
import { firstName, pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const { student } = await requireStudent();
  const stats = await getStudentStats(student);
  const proximo = nextStep(student.belt, student.degree);

  const [eventos, ultimosTreinos] = await Promise.all([
    prisma.event.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 2,
    }),
    prisma.attendance.findMany({
      where: { studentId: student.id, present: true },
      include: { session: true },
      orderBy: { session: { date: "desc" } },
      take: 3,
    }),
  ]);

  const faltamParaMeta = Math.max(0, stats.monthGoal - stats.monthTrainings);

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Olá, {firstName(student.user.name)}
        </h1>
        <p className="text-sm text-ink-500 first-letter:uppercase">
          {formatDateLong(new Date())}
        </p>
      </div>

      {/* Cartão da faixa */}
      <Card className="overflow-hidden border-ink bg-ink text-white">
        <CardBody className="pt-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/50 uppercase">
            Sua graduação
          </p>
          <p className="mt-1.5 font-display text-2xl font-bold tracking-wide uppercase">
            {graduationLabel(student.belt, student.degree)}
          </p>

          {/* fundo claro atrás da faixa: sem ele a ponteira preta some no
              cartão escuro */}
          <div className="my-4 rounded-[10px] bg-white/10 p-2">
            <BeltBar belt={student.belt} degree={student.degree} height={38} />
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-white/60">
              Há {humanDuration(student.beltSinceAt)} nesta graduação
            </span>
            <Link
              href="/app/evolucao"
              className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-300 transition-smooth hover:text-brand-200"
            >
              Ver evolução
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>
        </CardBody>
      </Card>

      {/* Números do mês */}
      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Sequência"
          value={stats.streak}
          suffix={pluralize(stats.streak, "semana", "semanas")}
          hint={
            stats.streak > 0
              ? "Semanas seguidas treinando"
              : "Treine esta semana para começar"
          }
          icon={Flame}
          tone={stats.streak >= 4 ? "brand" : "default"}
        />
        <Stat
          label="Total de treinos"
          value={stats.totalTrainings}
          hint={`Desde ${formatDateShortYear(student.joinedAt)}`}
          icon={Swords}
        />
      </div>

      {/* Meta do mês */}
      <Card>
        <CardBody className="pt-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-ink-500 uppercase">
                Treinos este mês
              </p>
              <p className="tabular mt-1 font-display text-4xl leading-none font-bold">
                {stats.monthTrainings}
                <span className="text-2xl text-ink-300"> / {stats.monthGoal}</span>
              </p>
            </div>
            <Badge tone={stats.monthPercent >= 100 ? "success" : "brand"}>
              {stats.monthPercent}%
            </Badge>
          </div>

          <Progress
            value={stats.monthTrainings}
            max={stats.monthGoal}
            label="Progresso da meta do mês"
            className="mt-4"
          />

          <p className="mt-3 flex items-start gap-2 text-sm text-ink-500">
            <Target aria-hidden className="mt-0.5 size-4 shrink-0 text-brand-600" />
            {faltamParaMeta === 0
              ? "Meta do mês batida. Agora é seguir somando."
              : `Faltam ${faltamParaMeta} ${pluralize(faltamParaMeta, "treino", "treinos")} para bater a meta do mês.`}
          </p>
        </CardBody>
      </Card>

      {/* Próximo objetivo */}
      <Card>
        <CardBody className="pt-5">
          <div className="flex items-center gap-2">
            <TrendingUp aria-hidden className="size-4 text-brand-600" />
            <p className="text-xs font-semibold tracking-[0.16em] text-ink-500 uppercase">
              Próximo objetivo
            </p>
          </div>
          <p className="mt-1.5 font-display text-xl font-bold tracking-wide uppercase">
            {proximo.label}
          </p>

          {proximo.expectedMonths ? (
            <>
              <Progress
                value={stats.graduationProgress * 100}
                label="Progresso até a próxima graduação"
                tone="dark"
                className="mt-4"
              />
              <p className="mt-2.5 text-sm text-ink-500">
                {stats.monthsOnCurrentGrade >= proximo.expectedMonths
                  ? `Você já cumpriu os ${proximo.expectedMonths} ${pluralize(proximo.expectedMonths, "mês", "meses")} de referência. Mantenha a frequência — a graduação pode vir em qualquer treino.`
                  : `${stats.monthsOnCurrentGrade} de ${proximo.expectedMonths} ${pluralize(proximo.expectedMonths, "mês", "meses")} de referência. Quem decide é o professor — frequência e evolução contam mais que o calendário.`}
              </p>
            </>
          ) : (
            <p className="mt-2.5 text-sm text-ink-500">
              Você chegou ao topo da escada. Agora o caminho é ensinar.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Próximos eventos */}
      <section>
        <SectionTitle
          action={
            <Link
              href="/app/agenda"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Ver agenda
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          }
        >
          Vem aí
        </SectionTitle>

        {eventos.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nada marcado ainda"
            description="Quando o professor marcar um campeonato ou uma graduação, aparece aqui."
          />
        ) : (
          <div className="space-y-3">
            {eventos.map((evento) => (
              <Card key={evento.id}>
                <CardBody className="pt-4">
                  <EventTypeBadge type={evento.type} />
                  <p className="mt-2 font-display text-lg font-bold tracking-wide uppercase">
                    {evento.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                    <CalendarDays aria-hidden className="size-4" />
                    {formatDateLong(evento.startsAt)}
                  </p>
                  {evento.location && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
                      <MapPin aria-hidden className="size-4" />
                      {evento.location}
                    </p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Últimos treinos */}
      <section>
        <SectionTitle
          action={
            <Link
              href="/app/treinos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Ver todos
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          }
        >
          Últimos treinos
        </SectionTitle>

        {ultimosTreinos.length === 0 ? (
          <EmptyState
            icon={Swords}
            title="Nenhum treino registrado"
            description="Assim que o professor fizer a chamada, seus treinos aparecem aqui."
          />
        ) : (
          <Card>
            <ul>
              {ultimosTreinos.map((registro, i) => (
                <li
                  key={registro.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line" : ""}`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
                    <Swords aria-hidden className="size-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {registro.session.title}
                    </span>
                    <span className="block text-sm text-ink-500 first-letter:uppercase">
                      {formatDateShort(registro.session.date)}
                    </span>
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
