import type { Metadata } from "next";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  Medal as MedalIcon,
  Trophy,
} from "lucide-react";

import { BeltBar } from "@/components/belt";
import { CompetitionImage } from "@/components/competition-image";
import { Federacoes } from "@/components/federacoes";
import { Medal, MedalTallyRow } from "@/components/medal";
import { Card, CardBody, SectionTitle } from "@/components/ui/card";
import { Badge, EmptyState, Stat } from "@/components/ui/misc";
import { graduationLabel } from "@/lib/belts";
import { requireStudent } from "@/lib/auth";
import {
  modalityLabel,
  placementInfo,
  tallyMedals,
} from "@/lib/competitions";
// `modalityLabel` acima é a modalidade da luta (Gi / No-Gi). Esta é a
// modalidade que o aluno treina (Jiu-Jitsu / boxe), por isso o apelido.
import {
  modalityLabel as labelDaModalidade,
  temGraduacao,
} from "@/lib/modalities";
import { agora, formatDateLong, formatDateShortYear } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Campeonatos" };
export const dynamic = "force-dynamic";

export default async function CampeonatosDoAlunoPage() {
  const { student } = await requireStudent();
  const hoje = agora();

  const [meusResultados, proximos] = await Promise.all([
    prisma.competitionResult.findMany({
      where: { studentId: student.id },
      include: { competition: true },
      orderBy: [{ competition: { date: "desc" } }, { placement: "asc" }],
    }),
    prisma.competition.findMany({
      where: { date: { gte: hoje } },
      orderBy: { date: "asc" },
    }),
  ]);

  const tally = tallyMedals(meusResultados);

  // Agrupa os resultados por campeonato: o atleta pode ter lutado no peso e no
  // absoluto do mesmo evento.
  const porCampeonato = new Map<
    string,
    { competition: (typeof meusResultados)[number]["competition"]; resultados: typeof meusResultados }
  >();
  for (const r of meusResultados) {
    const atual = porCampeonato.get(r.competitionId);
    if (atual) atual.resultados.push(r);
    else porCampeonato.set(r.competitionId, { competition: r.competition, resultados: [r] });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Campeonatos
        </h1>
        <p className="text-sm text-ink-500">
          Seus resultados e as competições que vêm por aí.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6">

      {/* Perfil do atleta */}
      <Card className="border-ink bg-ink text-white">
        <CardBody className="pt-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/50 uppercase">
            Perfil do atleta
          </p>
          <p className="mt-1.5 font-display text-2xl leading-tight font-bold tracking-wide uppercase">
            {student.user.name}
          </p>
          <p className="text-sm text-white/60">
            {temGraduacao(student.modality)
              ? graduationLabel(student.belt, student.degree)
              : labelDaModalidade(student.modality)}
          </p>

          {temGraduacao(student.modality) && (
            <div className="my-4 rounded-[10px] bg-white/10 p-2">
              <BeltBar belt={student.belt} degree={student.degree} height={30} />
            </div>
          )}

          {tally.lutas === 0 ? (
            <p className="text-sm text-white/70">
              Você ainda não competiu pela equipe. Quando quiser entrar numa
              chave, fale com o professor que ele te ajuda a escolher o
              campeonato e a categoria.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4 border-t border-white/12 pt-4">
                <div>
                  <p className="tabular font-display text-3xl leading-none font-bold">
                    {tally.campeonatos}
                  </p>
                  <p className="text-xs text-white/60">
                    {pluralize(tally.campeonatos, "campeonato", "campeonatos")}
                  </p>
                </div>
                <MedalTallyRow
                  ouro={tally.ouro}
                  prata={tally.prata}
                  bronze={tally.bronze}
                  size={24}
                />
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {tally.lutas > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Pódios"
            value={tally.podios}
            hint={`Em ${tally.lutas} ${pluralize(tally.lutas, "luta", "participações")}`}
            icon={Trophy}
            tone={tally.podios > 0 ? "brand" : "default"}
          />
          <Stat
            label="Ouro"
            value={tally.ouro}
            hint="Primeiros lugares"
            icon={MedalIcon}
          />
        </div>
      )}

      {/* Histórico */}
      <section>
        <SectionTitle>Meu histórico</SectionTitle>

        {porCampeonato.size === 0 ? (
          <EmptyState
            icon={MedalIcon}
            title="Nenhum resultado ainda"
            description="Assim que você competir e o professor registrar a colocação, ela aparece aqui."
          />
        ) : (
          <div className="space-y-3">
            {[...porCampeonato.values()].map(({ competition, resultados }) => (
              <Card key={competition.id}>
                <CardBody className="pt-4">
                  <h3 className="font-display text-lg leading-tight font-bold tracking-wide uppercase">
                    {competition.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-500 first-letter:uppercase">
                    {formatDateLong(competition.date)}
                    {competition.location && ` · ${competition.location}`}
                  </p>

                  <ul className="mt-3 space-y-2 border-t border-line pt-3">
                    {resultados.map((r) => {
                      const info = placementInfo(r.placement);
                      return (
                        <li key={r.id} className="flex items-center gap-3">
                          <span className="flex w-8 shrink-0 justify-center">
                            {info.color ? (
                              <Medal placement={r.placement} size={28} />
                            ) : (
                              <span className="text-xs font-bold text-ink-300">
                                {r.placement > 0 ? `${r.placement}º` : "·"}
                              </span>
                            )}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold">
                              {info.label}
                              {r.category && (
                                <span className="font-normal text-ink-500">
                                  {" · "}
                                  {r.category}
                                </span>
                              )}
                            </span>
                            <span className="block text-xs text-ink-500">
                              {modalityLabel(r.modality)}
                            </span>
                            {r.notes && (
                              <span className="mt-1 block text-sm text-ink-500">
                                {r.notes}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      </div>
      <div className="space-y-6">

      {/* Próximos campeonatos */}
      <section>
        <SectionTitle>Próximos campeonatos</SectionTitle>

        {proximos.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nada marcado no momento"
            description="Quando o professor divulgar um campeonato, ele aparece aqui com o prazo de inscrição."
          />
        ) : (
          <div className="space-y-3">
            {proximos.map((c) => (
              <Card key={c.id} className="overflow-hidden">
                {c.imageUrl && (
                  <CompetitionImage
                    src={c.imageUrl}
                    alt={`Cartaz do ${c.name}`}
                    ratio="16 / 9"
                  />
                )}
                <CardBody className="pt-4">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="warning">
                      <Trophy aria-hidden className="size-3" />
                      {modalityLabel(c.modality)}
                    </Badge>
                    {c.organizer && <Badge tone="neutral">{c.organizer}</Badge>}
                  </div>

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
                      Inscrições até {formatDateShortYear(c.registrationDeadline)}
                    </p>
                  )}

                  {c.description && (
                    <p className="mt-3 border-t border-line pt-3 text-[15px] leading-relaxed text-ink-500">
                      {c.description}
                    </p>
                  )}

                  {c.registrationUrl && (
                    <a
                      href={c.registrationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex h-11 items-center gap-2 rounded-[10px] bg-brand-600 px-4 text-sm font-semibold text-white transition-smooth hover:bg-brand-700"
                    >
                      <ExternalLink aria-hidden className="size-4" />
                      Fazer inscrição
                    </a>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Calendários oficiais */}
      <Federacoes />

      </div>
      </div>
    </div>
  );
}
