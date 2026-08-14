import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronRight, Clock, MapPin, Trophy } from "lucide-react";

import { EventTypeBadge, TURMAS_JOVENS, classType } from "@/components/event-type";
import { Card, CardBody, CardHeader, CardTitle, SectionTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/misc";
import { getCurrentStudent, requireUser } from "@/lib/auth";
import { modalityLabel } from "@/lib/competitions";
import {
  WEEKDAYS,
  agora,
  formatDateLong,
  formatDateShortYear,
  formatTime,
} from "@/lib/dates";
import { modalidadesDoAluno } from "@/lib/modalities";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  await requireUser();
  const student = await getCurrentStudent();

  // O aluno vê só a grade da modalidade dele. Quem faz os dois vê tudo, e o
  // professor (que não tem ficha de aluno) também.
  const minhasModalidades = student
    ? modalidadesDoAluno(student.modality)
    : ["JIU_JITSU", "BOXE"];

  const [schedules, eventos, campeonatos] = await Promise.all([
    prisma.classSchedule.findMany({
      where: { active: true, modality: { in: minhasModalidades } },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.competition.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 3,
    }),
  ]);

  const hoje = agora().getDay();
  const ordemDias = [1, 2, 3, 4, 5, 6, 0];
  const grade = ordemDias
    .map((weekday) => ({
      weekday,
      label: WEEKDAYS[weekday],
      aulas: schedules.filter((s) => s.weekday === weekday),
    }))
    .filter((d) => d.aulas.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Agenda
        </h1>
        <p className="text-sm text-ink-500">
          Horários fixos da semana e os próximos eventos da equipe.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6">

      {/* Campeonatos */}
      <section>
        <SectionTitle
          action={
            <Link
              href="/app/campeonatos"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Meus resultados
              <ChevronRight aria-hidden className="size-3.5" />
            </Link>
          }
        >
          Campeonatos
        </SectionTitle>

        {campeonatos.length === 0 ? (
          <Card>
            <CardBody className="pt-4">
              <p className="text-sm text-ink-500">
                Nenhum campeonato marcado no momento.{" "}
                <Link
                  href="/app/campeonatos"
                  className="font-semibold text-brand-700 hover:underline"
                >
                  Ver seus resultados anteriores
                </Link>
                .
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {campeonatos.map((c) => (
              <Card key={c.id}>
                <Link href="/app/campeonatos" className="block">
                  <CardBody className="pt-4">
                    <Badge tone="warning">
                      <Trophy aria-hidden className="size-3" />
                      {modalityLabel(c.modality)}
                    </Badge>
                    <h3 className="mt-2 font-display text-lg leading-tight font-bold tracking-wide uppercase">
                      {c.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-700 first-letter:uppercase">
                      <CalendarDays aria-hidden className="size-4 shrink-0" />
                      {formatDateLong(c.date)}
                    </p>
                    {c.location && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
                        <MapPin aria-hidden className="size-4 shrink-0" />
                        {c.location}
                      </p>
                    )}
                    {c.registrationDeadline && (
                      <p className="mt-2 inline-flex rounded-[6px] bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                        Inscrições até{" "}
                        {formatDateShortYear(c.registrationDeadline)}
                      </p>
                    )}
                  </CardBody>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Eventos */}
      <section>
        <SectionTitle>Próximos eventos</SectionTitle>

        {eventos.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum evento marcado"
            description="Campeonatos, graduações e seminários aparecem aqui assim que o professor cadastrar."
          />
        ) : (
          <div className="space-y-3">
            {eventos.map((evento) => (
              <Card key={evento.id}>
                <CardBody className="pt-4">
                  <EventTypeBadge type={evento.type} />
                  <h3 className="mt-2 font-display text-lg leading-tight font-bold tracking-wide uppercase">
                    {evento.title}
                  </h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-brand-700 first-letter:uppercase">
                    <CalendarDays aria-hidden className="size-4 shrink-0" />
                    {formatDateLong(evento.startsAt)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
                    <Clock aria-hidden className="size-4 shrink-0" />
                    {formatTime(evento.startsAt)}
                  </p>
                  {evento.location && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
                      <MapPin aria-hidden className="size-4 shrink-0" />
                      {evento.location}
                    </p>
                  )}
                  {evento.description && (
                    <p className="mt-3 border-t border-line pt-3 text-[15px] leading-relaxed text-ink-500">
                      {evento.description}
                    </p>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      </div>
      <div className="space-y-6">

      {/* Grade fixa */}
      <section>
        <SectionTitle>Horários da semana</SectionTitle>
        <div className="space-y-3">
          {grade.map((dia) => (
            <Card
              key={dia.weekday}
              className={dia.weekday === hoje ? "border-brand-400" : undefined}
            >
              <CardHeader className="flex items-center justify-between pb-2">
                <CardTitle className="text-base">{dia.label}</CardTitle>
                {dia.weekday === hoje && <Badge tone="brand">Hoje</Badge>}
              </CardHeader>
              <CardBody>
                <ul className="space-y-2">
                  {dia.aulas.map((aula) => (
                    <li
                      key={aula.id}
                      className="flex items-center justify-between gap-3 border-t border-line pt-2 first:border-0 first:pt-0"
                    >
                      <span className="flex items-baseline gap-3">
                        <span className="tabular font-display text-base font-bold">
                          {aula.startTime}
                        </span>
                        <span className="text-sm">{aula.title}</span>
                      </span>
                      <Badge tone={TURMAS_JOVENS.includes(aula.type) ? "brand" : "neutral"}>
                        {classType(aula.type).short}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      </div>
      </div>
    </div>
  );
}
