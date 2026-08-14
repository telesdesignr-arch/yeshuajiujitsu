import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  HeartHandshake,
  Instagram,
  MapPin,
  MessageCircle,
  Shirt,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { BeltBar } from "@/components/belt";
import { EventTypeBadge, TURMAS_JOVENS, classType } from "@/components/event-type";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import { TRACK_LABEL, beltsDaTrilha } from "@/lib/belts";
import { ACADEMIA, whatsappLink } from "@/lib/academia";
import { WEEKDAYS, formatDateLong } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [schedules, events, alunosAtivos] = await Promise.all([
    prisma.classSchedule.findMany({
      where: { active: true },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    }),
    prisma.event.findMany({
      where: { startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 4,
    }),
    prisma.student.count({ where: { active: true } }),
  ]);

  // Agrupa a grade por dia da semana, começando na segunda-feira.
  const ordemDias = [1, 2, 3, 4, 5, 6, 0];
  const grade = ordemDias
    .map((weekday) => ({
      weekday,
      label: WEEKDAYS[weekday],
      aulas: schedules.filter((s) => s.weekday === weekday),
    }))
    .filter((d) => d.aulas.length > 0);

  return (
    <>
      {/* ==================================================================== */}
      {/* Hero                                                                 */}
      {/* ==================================================================== */}
      <section className="bg-tatame px-4 pt-14 pb-16 text-white sm:px-6 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <Badge tone="brand" className="border-brand-400/30 bg-white/10 text-brand-300">
            <Sparkles aria-hidden className="size-3.5" />
            {ACADEMIA.lema}
          </Badge>

          <h1 className="text-balance mt-5 max-w-3xl font-display text-[3.25rem] leading-[0.92] font-bold tracking-wide uppercase sm:text-7xl lg:text-8xl">
            O tatame muda
            <br />
            <span className="text-brand-400">quem você é</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-white/75">
            Na Yeshua a gente treina Jiu-Jitsu de verdade — técnica, disciplina e
            respeito — num ambiente onde ninguém é deixado para trás. Se é seu
            primeiro dia ou sua décima faixa, tem lugar para você aqui.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink(
                "Olá, professor Renato! Quero agendar uma aula experimental na Yeshua Jiu-Jitsu.",
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-13 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-brand-600 px-7 text-base font-semibold text-white transition-smooth hover:bg-brand-500 active:scale-[0.98]"
            >
              <MessageCircle aria-hidden className="size-5" />
              Agendar aula experimental
            </a>
            <ButtonLink
              href="/login"
              size="lg"
              variant="outline"
              className="border-white/25 bg-white/5 text-white hover:bg-white/12"
            >
              Já sou aluno
              <ArrowRight aria-hidden className="size-4" />
            </ButtonLink>
          </div>

          <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/12 pt-8">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-white/50 uppercase">
                Alunos na equipe
              </dt>
              <dd className="tabular mt-1 font-display text-3xl font-bold">
                {alunosAtivos}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-white/50 uppercase">
                Aulas por semana
              </dt>
              <dd className="tabular mt-1 font-display text-3xl font-bold">
                {schedules.length}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-white/50 uppercase">
                Professor
              </dt>
              <dd className="mt-1 font-display text-xl font-bold">
                {ACADEMIA.professor}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* Como funcionam as aulas                                              */}
      {/* ==================================================================== */}
      <section id="aulas" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-bold tracking-[0.2em] text-brand-600 uppercase">
            Como funciona
          </p>
          <h2 className="text-balance mt-2 max-w-2xl font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            Você não precisa chegar pronto
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-500">
            Todo mundo começa sem saber nada. A aula é montada para que o
            iniciante aprenda no seu tempo e o veterano continue evoluindo — na
            mesma hora, no mesmo tatame.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Users,
                title: "Aquecimento em grupo",
                text: "Uns 15 minutos de movimentação, quedas e exercícios específicos do Jiu-Jitsu. Ninguém vai além do que o corpo aguenta.",
              },
              {
                icon: BadgeCheck,
                title: "Técnica do dia",
                text: "O professor mostra a posição, explica o detalhe que faz diferença e passa de dupla em dupla corrigindo cada um.",
              },
              {
                icon: ShieldCheck,
                title: "Treino com parceiro",
                text: "Você repete a técnica sem pressa e sem competição. O objetivo aqui é entender o movimento, não vencer o colega.",
              },
              {
                icon: Sparkles,
                title: "Sparring (opcional)",
                text: "No fim da aula tem luta leve. Quem está começando pode só assistir nas primeiras semanas — e ninguém vai achar ruim.",
              },
              {
                icon: HeartHandshake,
                title: "Encerramento",
                text: "Terminamos juntos, com um agradecimento e um recado da equipe. É o momento em que a turma vira turma de verdade.",
              },
              {
                icon: Shirt,
                title: "O que levar no primeiro dia",
                text: "Roupa de treino confortável, chinelo e uma garrafa de água. O kimono a gente empresta enquanto você experimenta.",
              },
            ].map((item) => (
              <Card key={item.title}>
                <CardBody className="pt-5">
                  <span className="mb-3 inline-flex size-11 items-center justify-center rounded-[12px] bg-brand-50 text-brand-700">
                    <item.icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="font-display text-lg font-bold tracking-wide uppercase">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500">
                    {item.text}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* Horários                                                             */}
      {/* ==================================================================== */}
      <section
        id="horarios"
        className="scroll-mt-20 border-y border-line bg-ink-100 px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-bold tracking-[0.2em] text-brand-600 uppercase">
            Grade da semana
          </p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            Horários das aulas
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-500">
            Chegue uns 10 minutos antes para trocar de roupa com calma. Se o
            horário que você precisa não estiver aqui, fale com o professor —
            sempre dá para achar um jeito.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grade.map((dia) => (
              <Card key={dia.weekday}>
                <CardBody className="pt-4">
                  <h3 className="font-display text-lg font-bold tracking-[0.1em] uppercase">
                    {dia.label}
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {dia.aulas.map((aula) => (
                      <li
                        key={aula.id}
                        className="flex items-center justify-between gap-3 border-t border-line pt-2.5 first:border-0 first:pt-0"
                      >
                        <span>
                          <span className="tabular block font-display text-base font-bold">
                            {aula.startTime}
                          </span>
                          <span className="text-sm text-ink-500">{aula.title}</span>
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

          <p className="mt-6 text-sm text-ink-500">
            Horários sujeitos a alteração em feriados e datas de competição. As
            mudanças são sempre avisadas na área do aluno.
          </p>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* Sistema de graduação                                                 */}
      {/* ==================================================================== */}
      <section id="graduacao" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="font-display text-sm font-bold tracking-[0.2em] text-brand-600 uppercase">
                Graduação
              </p>
              <h2 className="mt-2 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
                Cada grau é um pedaço da sua história
              </h2>
              <p className="mt-4 text-lg text-ink-500">
                No Jiu-Jitsu a evolução não é medida em meses — é medida em
                presença. Cada faixa tem quatro graus, e cada grau vem quando o
                professor vê que a técnica e a postura amadureceram.
              </p>
              <p className="mt-4 text-lg text-ink-500">
                Quem tem até 15 anos segue a escada infantil, com treze faixas —
                bem mais degraus, para a criança sentir que está avançando. Aos
                16 anos, entra na escada adulta.
              </p>
              <p className="mt-4 text-lg text-ink-500">
                Na área do aluno você acompanha tudo: quando recebeu cada
                graduação, quem entregou, há quanto tempo está na faixa atual e o
                que falta para o próximo passo.
              </p>
              <ButtonLink href="/login" size="lg" className="mt-7">
                Ver minha evolução
                <ArrowRight aria-hidden className="size-4" />
              </ButtonLink>
            </div>

            <div className="space-y-4">
              {(["ADULTO", "INFANTIL"] as const).map((trilha) => (
                <Card key={trilha}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {TRACK_LABEL[trilha]}
                    </CardTitle>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    {beltsDaTrilha(trilha).map((belt) => (
                      <div key={belt.key}>
                        <p className="mb-1 text-sm font-semibold">
                          Faixa {belt.label}
                        </p>
                        <BeltBar belt={belt.key} degree={4} height={22} />
                      </div>
                    ))}
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* Agenda / eventos                                                     */}
      {/* ==================================================================== */}
      <section
        id="agenda"
        className="scroll-mt-20 border-y border-line bg-ink-100 px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-sm font-bold tracking-[0.2em] text-brand-600 uppercase">
            Agenda
          </p>
          <h2 className="mt-2 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            O que vem por aí
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-500">
            Campeonatos, graduações, seminários e os treinos especiais da equipe.
          </p>

          {events.length === 0 ? (
            <p className="mt-10 text-ink-500">
              Nenhum evento marcado no momento. Fique de olho no Instagram da
              equipe.
            </p>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {events.map((evento) => (
                <Card key={evento.id}>
                  <CardBody className="pt-5">
                    <EventTypeBadge type={evento.type} />
                    <h3 className="mt-3 font-display text-xl font-bold tracking-wide uppercase">
                      {evento.title}
                    </h3>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                      <CalendarDays aria-hidden className="size-4" />
                      {formatDateLong(evento.startsAt)}
                    </p>
                    {evento.location && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                        <MapPin aria-hidden className="size-4" />
                        {evento.location}
                      </p>
                    )}
                    {evento.description && (
                      <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
                        {evento.description}
                      </p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* Contato                                                              */}
      {/* ==================================================================== */}
      <section id="contato" className="scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
        <div className="bg-tatame mx-auto max-w-6xl rounded-[20px] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <h2 className="text-balance mx-auto max-w-2xl font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            Sua primeira aula é por nossa conta
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
            Manda uma mensagem para o professor {ACADEMIA.professor}, conta um
            pouco de você e a gente marca o melhor dia para você conhecer o
            tatame.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={whatsappLink(
                "Olá, professor Renato! Quero agendar minha aula experimental na Yeshua Jiu-Jitsu.",
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-brand-600 px-7 text-base font-semibold text-white transition-smooth hover:bg-brand-500 active:scale-[0.98] sm:w-auto"
            >
              <MessageCircle aria-hidden className="size-5" />
              {ACADEMIA.whatsappFormatado}
            </a>
            <a
              href={ACADEMIA.instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-white/25 bg-white/5 px-7 text-base font-semibold text-white transition-smooth hover:bg-white/12 sm:w-auto"
            >
              <Instagram aria-hidden className="size-5" />
              Ver o Instagram
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
