import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  Clock,
  MapPin,
  Trash2,
  Trophy,
} from "lucide-react";

import { EventoForm, HorarioForm } from "./formularios";
import { deleteEvent, deleteSchedule } from "@/actions/painel";
import { EventTypeBadge, TURMAS_JOVENS, classType } from "@/components/event-type";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  Collapsible,
  Disclosure,
  SectionTitle,
} from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { WEEKDAYS, dayKey, formatDateLong, formatTime } from "@/lib/dates";
import { modalityLabel } from "@/lib/modalities";
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

      {/* Campeonato tem tela propria, com inscricao e resultados. */}
      <Card>
        <Link
          href="/painel/campeonatos"
          className="flex min-h-[64px] items-center gap-3 px-4 py-3 transition-smooth hover:bg-ink-100/60 sm:px-5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
            <Trophy aria-hidden className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-bold tracking-wide uppercase">
              Campeonatos
            </span>
            <span className="block text-xs text-ink-500">
              Divulgar competições e registrar os resultados da equipe
            </span>
          </span>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-300" />
        </Link>
      </Card>

      <Collapsible
        title="Novo evento"
        description="Graduação, seminário, treino especial, confraternização"
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
                <EventTypeBadge type={evento.type} />
                <h3 className="mt-2 font-display text-lg leading-tight font-bold tracking-wide uppercase">
                  {evento.title}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-700 first-letter:uppercase">
                  <CalendarDays aria-hidden className="size-4 shrink-0" />
                  {formatDateLong(evento.startsAt)} às{" "}
                  {formatTime(evento.startsAt)}
                </p>
                {evento.location && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-500">
                    <MapPin aria-hidden className="size-4 shrink-0" />
                    {evento.location}
                  </p>
                )}
                {evento.description && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">
                    {evento.description}
                  </p>
                )}

                <Disclosure
                  label="Editar ou apagar"
                  className="mt-3 border-t border-line pt-3"
                >
                  <EventoForm
                    evento={{
                      id: evento.id,
                      title: evento.title,
                      type: evento.type,
                      startsAt: dayKey(evento.startsAt),
                      time: formatTime(evento.startsAt),
                      location: evento.location ?? "",
                      description: evento.description ?? "",
                      link: evento.link ?? "",
                    }}
                  />
                  <form
                    action={deleteEvent}
                    className="mt-4 border-t border-line pt-3"
                  >
                    <input type="hidden" name="eventId" value={evento.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="text-ink-500 hover:text-danger"
                    >
                      <Trash2 aria-hidden className="size-4" />
                      Apagar evento
                    </Button>
                  </form>
                </Disclosure>
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
              {/* Cada aula abre no toque para editar: no celular a linha
                  inteira vira o alvo, em vez de um lápis minúsculo. */}
              <ul className="mt-2">
                {dia.aulas.map((aula) => (
                  <li key={aula.id} className="border-t border-line first:border-0">
                    <details className="group/aula">
                      <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 py-2 [&::-webkit-details-marker]:hidden">
                        <span className="flex min-w-0 items-baseline gap-3">
                          <span className="tabular shrink-0 font-display text-base font-bold">
                            {aula.startTime}
                          </span>
                          <span className="truncate text-sm">
                            {aula.title}
                            <span className="text-ink-500">
                              {" "}
                              · até {aula.endTime}
                            </span>
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1.5">
                          <Badge tone={aula.modality === "BOXE" ? "dark" : "neutral"}>
                            {modalityLabel(aula.modality)}
                          </Badge>
                          <Badge
                            tone={
                              TURMAS_JOVENS.includes(aula.type) ? "brand" : "neutral"
                            }
                          >
                            {classType(aula.type).short}
                          </Badge>
                          <svg
                            aria-hidden
                            viewBox="0 0 24 24"
                            className="size-4 text-ink-300 transition-transform duration-200 group-open/aula:rotate-180"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </span>
                      </summary>

                      <div className="mb-3 rounded-[10px] border border-line bg-ink-100/50 p-4">
                        <HorarioForm
                          horario={{
                            id: aula.id,
                            weekday: aula.weekday,
                            startTime: aula.startTime,
                            endTime: aula.endTime,
                            title: aula.title,
                            modality: aula.modality,
                            type: aula.type,
                          }}
                        />
                        <form
                          action={deleteSchedule}
                          className="mt-4 border-t border-line pt-3"
                        >
                          <input type="hidden" name="scheduleId" value={aula.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-ink-500 hover:text-danger"
                          >
                            <Trash2 aria-hidden className="size-4" />
                            Tirar da grade
                          </Button>
                          <p className="mt-1.5 text-xs text-ink-500">
                            As chamadas já feitas nesse horário continuam no
                            histórico dos alunos.
                          </p>
                        </form>
                      </div>
                    </details>
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
          {/* Editável também: se a data foi digitada errada, o evento cai aqui
              e é justamente aqui que ele precisa ser corrigido. */}
          <ul className="space-y-2">
            {passados.map((e) => (
              <li key={e.id} className="border-b border-line pb-2 last:border-0">
                <div className="flex items-center justify-between gap-3">
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
                </div>
                <Disclosure label="Corrigir" className="mt-1">
                  <EventoForm
                    evento={{
                      id: e.id,
                      title: e.title,
                      type: e.type,
                      startsAt: dayKey(e.startsAt),
                      time: formatTime(e.startsAt),
                      location: e.location ?? "",
                      description: e.description ?? "",
                      link: e.link ?? "",
                    }}
                  />
                </Disclosure>
              </li>
            ))}
          </ul>
        </Collapsible>
      )}
    </div>
  );
}
