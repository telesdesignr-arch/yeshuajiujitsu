import type { Metadata } from "next";
import { CalendarDays, CalendarPlus, Clock, MapPin, Trash2 } from "lucide-react";

import { EventoForm, HorarioForm } from "./formularios";
import { deleteEvent, deleteSchedule } from "@/actions/painel";
import { EventTypeBadge, classType } from "@/components/event-type";
import { Button } from "@/components/ui/button";
import { Card, CardBody, Collapsible, SectionTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { WEEKDAYS, formatDateLong } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Agenda" };
export const dynamic = "force-dynamic";

export default async function PainelAgendaPage() {
  await requireStaff();

  const [eventos, schedules] = await Promise.all([
    prisma.event.findMany({ orderBy: { startsAt: "asc" } }),
    prisma.classSchedule.findMany({
      where: { active: true },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    }),
  ]);

  const agora = new Date();
  const proximos = eventos.filter((e) => e.startsAt >= agora);
  const passados = eventos.filter((e) => e.startsAt < agora).reverse();

  const ordemDias = [1, 2, 3, 4, 5, 6, 0];
  const grade = ordemDias
    .map((weekday) => ({
      weekday,
      label: WEEKDAYS[weekday],
      aulas: schedules.filter((s) => s.weekday === weekday),
    }))
    .filter((d) => d.aulas.length > 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Agenda
        </h1>
        <p className="text-sm text-ink-500">
          Tudo que você publicar aqui aparece no site e no app dos alunos.
        </p>
      </div>

      <Collapsible
        title="Novo evento"
        description="Campeonato, graduação, seminário, confraternização"
        icon={CalendarPlus}
      >
        <EventoForm />
      </Collapsible>

      <Collapsible
        title="Novo horário fixo"
        description="Adicionar uma aula à grade da semana"
        icon={Clock}
      >
        <HorarioForm />
      </Collapsible>

      {/* Próximos eventos */}
      <SectionTitle>Próximos eventos</SectionTitle>

      {proximos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum evento marcado"
          description="Publique o próximo campeonato ou a data da graduação para a turma se programar."
        />
      ) : (
        <div className="space-y-3">
          {proximos.map((evento) => (
            <Card key={evento.id}>
              <CardBody className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <EventTypeBadge type={evento.type} />
                    <h3 className="mt-2 font-display text-lg leading-tight font-bold tracking-wide uppercase">
                      {evento.title}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-700 first-letter:uppercase">
                      <CalendarDays aria-hidden className="size-4 shrink-0" />
                      {formatDateLong(evento.startsAt)}
                    </p>
                    {evento.location && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
                        <MapPin aria-hidden className="size-4 shrink-0" />
                        {evento.location}
                      </p>
                    )}
                  </div>
                  <form action={deleteEvent} className="shrink-0">
                    <input type="hidden" name="eventId" value={evento.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-ink-500 hover:text-danger"
                      aria-label={`Apagar evento ${evento.title}`}
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </Button>
                  </form>
                </div>
                {evento.description && (
                  <p className="mt-3 border-t border-line pt-3 text-sm leading-relaxed text-ink-500">
                    {evento.description}
                  </p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Grade fixa */}
      <SectionTitle>Grade da semana</SectionTitle>

      <div className="space-y-3">
        {grade.map((dia) => (
          <Card key={dia.weekday}>
            <CardBody className="pt-4">
              <h3 className="font-display text-base font-bold tracking-[0.1em] uppercase">
                {dia.label}
              </h3>
              <ul className="mt-2">
                {dia.aulas.map((aula) => (
                  <li
                    key={aula.id}
                    className="flex items-center justify-between gap-3 border-t border-line py-2 first:border-0"
                  >
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className="tabular shrink-0 font-display text-base font-bold">
                        {aula.startTime}
                      </span>
                      <span className="truncate text-sm">
                        {aula.title}
                        <span className="text-ink-500"> · até {aula.endTime}</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <Badge tone={aula.type === "KIDS" ? "brand" : "neutral"}>
                        {classType(aula.type).short}
                      </Badge>
                      <form action={deleteSchedule}>
                        <input type="hidden" name="scheduleId" value={aula.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-ink-500 hover:text-danger"
                          aria-label={`Remover ${aula.title} de ${dia.label} às ${aula.startTime}`}
                        >
                          <Trash2 aria-hidden className="size-4" />
                        </Button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Eventos passados */}
      {passados.length > 0 && (
        <Collapsible
          title="Eventos já realizados"
          description={`${passados.length} no histórico`}
          icon={CalendarDays}
        >
          <ul className="space-y-2">
            {passados.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between gap-3 border-b border-line pb-2 last:border-0"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {e.title}
                  </span>
                  <span className="block text-xs text-ink-500 first-letter:uppercase">
                    {formatDateLong(e.startsAt)}
                  </span>
                </span>
                <form action={deleteEvent}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-ink-500 hover:text-danger"
                    aria-label={`Apagar evento ${e.title}`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
    </div>
  );
}
