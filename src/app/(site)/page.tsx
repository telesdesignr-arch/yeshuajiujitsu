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
  Trophy,
  Users,
} from "lucide-react";

import { BeltBar } from "@/components/belt";
import { Carrossel } from "@/components/carrossel";
import { CompetitionImage } from "@/components/competition-image";
import { VideoTopo } from "@/components/video-topo";
import { MedalTallyRow } from "@/components/medal";
import { EventTypeBadge, TURMAS_JOVENS, classType } from "@/components/event-type";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/misc";
import { TRACK_LABEL, beltsDaTrilha } from "@/lib/belts";
import { ACADEMIA, whatsappLink } from "@/lib/academia";
import { modalityLabel, tallyMedals } from "@/lib/competitions";
import { WEEKDAYS, formatDateLong, formatDateShortYear } from "@/lib/dates";
import { FOTOS_DA_ACADEMIA, VIDEO_DO_TOPO } from "@/lib/midia-gerada";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // A lista sai de src/lib/midia-gerada.ts, montada na hora do build a partir
  // das pastas public/fotos e public/video.
  const fotos = FOTOS_DA_ACADEMIA;
  const video = VIDEO_DO_TOPO;

  const [schedules, events, alunosAtivos, campeonatos, resultados] = await Promise.all([
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
    prisma.competition.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 4,
    }),
    prisma.competitionResult.findMany({
      select: { placement: true, competitionId: true },
    }),
  ]);

  const medalhas = tallyMedals(resultados);

  // Agrupa a grade por dia da semana, começando na segunda-feira.
  const ordemDias = [1, 2, 3, 4, 5, 6, 0];
  const gradeDe = (modalidade: string) =>
    ordemDias
      .map((weekday) => ({
        weekday,
        label: WEEKDAYS[weekday],
        aulas: schedules.filter(
          (s) => s.weekday === weekday && s.modality === modalidade,
        ),
      }))
      .filter((d) => d.aulas.length > 0);

  const grades = [
    { modalidade: "JIU_JITSU", titulo: "Jiu-Jitsu", dias: gradeDe("JIU_JITSU") },
    { modalidade: "BOXE", titulo: "Boxe", dias: gradeDe("BOXE") },
  ].filter((g) => g.dias.length > 0);

  return (
    <>
      {/* ==================================================================== */}
      {/* Hero                                                                 */}
      {/* ==================================================================== */}
      <section className="bg-tatame relative overflow-hidden px-4 pt-14 pb-16 text-white sm:px-6 sm:pt-20 sm:pb-24">
        {/* Vídeo de fundo, quando a academia tiver enviado um. Sem vídeo, o
            topo continua exatamente como era: fundo preto texturizado. */}
        {video && (
          <>
            <VideoTopo video={video} />
            {/* Véu escuro por cima: sem ele o texto branco some em qualquer
                trecho claro do vídeo, e o contraste deixa de ser acessível. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/78 to-ink/55"
            />
          </>
        )}

        {/* Faixa de marca no topo, no lugar de uma borda comum */}
        <span aria-hidden className="rule-marca absolute inset-x-0 top-0 z-10" />

        {/* Faixa preta gigante atravessando o fundo na diagonal. Fica quase
            invisível, mas dá profundidade e é a única forma do logo. */}
        {!video && (
          <span
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-40 h-[34rem] w-[34rem] rotate-12 rounded-full border-[3rem] border-white/[0.035]"
          />
        )}

        <div className="cascata relative z-10 mx-auto max-w-6xl">
          <p className="text-sm font-semibold tracking-[0.24em] text-brand-300 uppercase">
            Rio de Janeiro · Jiu-Jitsu e boxe
          </p>

          <h1 className="text-balance mt-4 max-w-3xl font-display text-[3.25rem] leading-[0.92] font-bold tracking-wide uppercase sm:text-7xl lg:text-8xl">
            O tatame muda
            <br />
            <span className="text-brand-400">quem você é</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-white/75">
            Aqui tem Jiu-Jitsu e boxe, com o professor corrigindo aluno por
            aluno. Não importa se hoje é seu primeiro dia ou se você já treina há
            dez anos: tem lugar para você.
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

          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-brand-300">
            <BadgeCheck aria-hidden className="size-4 shrink-0" />
            A primeira aula é grátis, no Jiu-Jitsu e no boxe
          </p>

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
          <p className="eyebrow">Como funciona</p>
          <h2 className="text-balance mt-3 max-w-2xl font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            Você não precisa chegar pronto
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-500">
            Todo mundo começa sem saber nada. A aula é montada para o iniciante
            aprender no seu tempo enquanto o veterano continua evoluindo, na
            mesma hora e no mesmo tatame.
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
                text: "No fim da aula tem luta leve. Quem está começando pode só assistir nas primeiras semanas. Ninguém vai achar ruim.",
              },
              {
                icon: HeartHandshake,
                title: "Encerramento",
                text: "Terminamos juntos, com um agradecimento e um recado da equipe. É o momento em que a turma vira turma de verdade.",
              },
              {
                icon: Shirt,
                title: "O que levar no primeiro dia",
                text: "Roupa de treino confortável, chinelo e uma garrafa de água. Kimono e luva a gente empresta, e essa primeira aula não custa nada.",
              },
            ].map((item) => (
              <Card key={item.title} className="card-hover">
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
      {/* Fotos da academia                                                    */}
      {/* ==================================================================== */}
      {fotos.length > 0 && (
        <section
          id="fotos"
          className="scroll-mt-20 border-t border-line px-4 py-16 sm:px-6 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <p className="eyebrow">A academia</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
              Como é por dentro
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-ink-500">
              O tatame, as turmas e os dias de competição.
            </p>

            <div className="mt-10">
              <Carrossel fotos={fotos} />
            </div>
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* Horários                                                             */}
      {/* ==================================================================== */}
      <section
        id="horarios"
        className="scroll-mt-20 border-y border-line bg-ink-100 px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="mx-auto max-w-6xl">
          <p className="eyebrow">Grade da semana</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            Horários das aulas
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-500">
            Chegue uns 10 minutos antes para trocar de roupa com calma. Se o
            horário que você precisa não estiver aqui, fale com o professor.
            Quase sempre dá para achar um jeito.
          </p>

          {grades.map((g) => (
            <div key={g.modalidade} className="mt-10">
              <div className="mb-4 flex items-center gap-3">
                <h3 className="font-display text-2xl font-bold tracking-wide uppercase">
                  {g.titulo}
                </h3>
                <span aria-hidden className="h-px flex-1 bg-line" />
                <span className="tabular text-sm text-ink-500">
                  {g.dias.reduce((t, d) => t + d.aulas.length, 0)} aulas por semana
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.dias.map((dia) => (
                  <Card key={dia.weekday} className="card-hover">
                    <CardBody className="pt-4">
                      <h4 className="font-display text-lg font-bold tracking-[0.1em] uppercase">
                        {dia.label}
                      </h4>
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
                              <span className="text-sm text-ink-500">
                                {aula.title}
                              </span>
                            </span>
                            <Badge
                              tone={
                                TURMAS_JOVENS.includes(aula.type)
                                  ? "brand"
                                  : "neutral"
                              }
                            >
                              {classType(aula.type).short}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          <p className="mt-8 max-w-2xl text-sm text-ink-500">
            Entre meio-dia e 16h o tatame fica livre. Se esse for o único horário
            que cabe na sua rotina, avise o professor que a gente abre a turma.
            Em feriados e datas de competição a grade muda, e o aviso sai sempre
            na área do aluno.
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
              <p className="eyebrow">Graduação</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
                Cada grau é um pedaço da sua história
              </h2>
              <p className="mt-4 text-lg text-ink-500">
                No Jiu-Jitsu a graduação vem pela presença, não pelo calendário.
                As faixas coloridas têm quatro graus cada uma, e o grau só sai
                quando o professor vê que a técnica e a postura amadureceram. A
                faixa preta vai mais longe: são seis graus, e depois dela vem a
                coral, que já é o 7º.
              </p>
              <p className="mt-4 text-lg text-ink-500">
                Quem tem até 15 anos segue a escada infantil, que tem treze
                faixas. São mais degraus de propósito: a criança precisa sentir
                que está avançando. Aos 16 anos ela passa para a escada adulta.
              </p>
              <p className="mt-4 text-lg text-ink-500">
                Na área do aluno você acompanha tudo: quando recebeu cada
                graduação, quem entregou, há quanto tempo está na faixa atual e o
                que falta para o próximo passo.
              </p>
              <p className="mt-4 text-lg text-ink-500">
                No boxe não existe faixa. Quem treina só boxe acompanha a
                presença e a agenda pelo aplicativo do mesmo jeito.
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
          <p className="eyebrow">Agenda</p>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            O que vem por aí
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-500">
            Os campeonatos, as graduações e os treinos especiais da equipe.
          </p>

          {/* Campeonatos */}
          {campeonatos.length > 0 && (
            <div className="mt-10">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <h3 className="font-display text-2xl font-bold tracking-wide uppercase">
                  Campeonatos
                </h3>
                {medalhas.podios > 0 && (
                  <div className="flex items-center gap-2 text-sm text-ink-500">
                    <span className="font-semibold text-ink">
                      {medalhas.podios}{" "}
                      {medalhas.podios === 1 ? "pódio" : "pódios"}
                    </span>
                    <span>conquistados pela equipe</span>
                    <MedalTallyRow
                      ouro={medalhas.ouro}
                      prata={medalhas.prata}
                      bronze={medalhas.bronze}
                      size={18}
                      className="gap-2.5"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {campeonatos.map((c) => (
                  <Card key={c.id} className="card-hover overflow-hidden">
                    {c.imageUrl && (
                      <CompetitionImage
                        src={c.imageUrl}
                        alt={`Cartaz do ${c.name}`}
                        ratio="16 / 9"
                      />
                    )}
                    <CardBody className="pt-5">
                      <Badge tone="warning">
                        <Trophy aria-hidden className="size-3.5" />
                        {modalityLabel(c.modality)}
                      </Badge>
                      <h4 className="mt-3 font-display text-xl leading-tight font-bold tracking-wide uppercase">
                        {c.name}
                      </h4>
                      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-brand-700 first-letter:uppercase">
                        <CalendarDays aria-hidden className="size-4" />
                        {formatDateLong(c.date)}
                      </p>
                      {c.location && (
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                          <MapPin aria-hidden className="size-4" />
                          {c.location}
                        </p>
                      )}
                      {c.registrationDeadline && (
                        <p className="mt-3 inline-flex rounded-[6px] bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
                          Inscrições até{" "}
                          {formatDateShortYear(c.registrationDeadline)}
                        </p>
                      )}
                      {c.description && (
                        <p className="mt-3 text-[15px] leading-relaxed text-ink-500">
                          {c.description}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {campeonatos.length > 0 && events.length > 0 && (
            <h3 className="mt-12 mb-4 font-display text-2xl font-bold tracking-wide uppercase">
              Outros eventos
            </h3>
          )}

          {events.length === 0 ? (
            <p className="mt-10 text-ink-500">
              Nenhum evento marcado no momento. Fique de olho no Instagram da
              equipe.
            </p>
          ) : (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {events.map((evento) => (
                <Card key={evento.id} className="card-hover">
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
        <div className="bg-tatame relative mx-auto max-w-6xl overflow-hidden rounded-[20px] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <span aria-hidden className="rule-marca absolute inset-x-0 top-0" />
          <h2 className="text-balance mx-auto max-w-2xl font-display text-4xl font-bold tracking-wide uppercase sm:text-5xl">
            Sua primeira aula é por nossa conta
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/75">
            Vale para o Jiu-Jitsu e para o boxe. Manda uma mensagem para o
            professor {ACADEMIA.professor}, conta um pouco de você e a gente
            marca o melhor dia para você conhecer o tatame.
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
