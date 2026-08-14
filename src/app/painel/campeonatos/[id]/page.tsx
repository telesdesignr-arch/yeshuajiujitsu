import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  MapPin,
  Medal as MedalIcon,
  Trash2,
  Trophy,
} from "lucide-react";

import { ResultadoForm } from "../formularios";
import { deleteCompetition, deleteResult } from "@/actions/campeonatos";
import { BeltChip } from "@/components/belt";
import { CompetitionImage } from "@/components/competition-image";
import { Medal, MedalTallyRow } from "@/components/medal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  Collapsible,
  SectionTitle,
} from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import {
  modalityLabel,
  placementInfo,
  tallyMedals,
} from "@/lib/competitions";
import { agora, formatDateLong, formatDateShortYear } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = await prisma.competition.findUnique({ where: { id } });
  return { title: c?.name ?? "Campeonato" };
}

export default async function CampeonatoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;

  const [campeonato, alunos] = await Promise.all([
    prisma.competition.findUnique({
      where: { id },
      include: {
        results: {
          include: { student: { include: { user: { select: { name: true } } } } },
          orderBy: [{ placement: "asc" }, { createdAt: "asc" }],
        },
      },
    }),
    prisma.student.findMany({
      where: { active: true },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  if (!campeonato) notFound();

  const passado = campeonato.date < agora();
  const tally = tallyMedals(campeonato.results);

  // Pódios primeiro, depois as demais participações.
  const podios = campeonato.results.filter((r) => placementInfo(r.placement).isPodium);
  const demais = campeonato.results.filter(
    (r) => !placementInfo(r.placement).isPodium,
  );

  return (
    <div className="space-y-5">
      <Link
        href="/painel/campeonatos"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-smooth hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para campeonatos
      </Link>

      {/* Cabeçalho */}
      <Card className="overflow-hidden">
        {campeonato.imageUrl && (
          <CompetitionImage
            src={campeonato.imageUrl}
            alt={`Cartaz do ${campeonato.name}`}
            ratio="16 / 9"
          />
        )}
        <CardBody className="pt-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="warning">
              <Trophy aria-hidden className="size-3" />
              {modalityLabel(campeonato.modality)}
            </Badge>
            {campeonato.organizer && (
              <Badge tone="neutral">{campeonato.organizer}</Badge>
            )}
            {passado ? (
              <Badge tone="neutral">Já realizado</Badge>
            ) : (
              <Badge tone="success">Ainda vai acontecer</Badge>
            )}
          </div>

          <h1 className="mt-3 font-display text-2xl leading-tight font-bold tracking-wide uppercase">
            {campeonato.name}
          </h1>

          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand-700 first-letter:uppercase">
            <CalendarDays aria-hidden className="size-4 shrink-0" />
            {formatDateLong(campeonato.date)}
            {campeonato.endDate && ` a ${formatDateLong(campeonato.endDate)}`}
          </p>

          {campeonato.location && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
              <MapPin aria-hidden className="size-4 shrink-0" />
              {campeonato.location}
            </p>
          )}

          {campeonato.registrationDeadline && !passado && (
            <p className="mt-3 inline-flex rounded-[6px] bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning">
              Inscrições até {formatDateShortYear(campeonato.registrationDeadline)}
            </p>
          )}

          {campeonato.description && (
            <p className="mt-3 border-t border-line pt-3 text-[15px] leading-relaxed text-ink-500">
              {campeonato.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
            {campeonato.registrationUrl && (
              <a
                href={campeonato.registrationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line px-3 text-sm font-semibold transition-smooth hover:bg-ink-100"
              >
                <ExternalLink aria-hidden className="size-4" />
                Página de inscrição
              </a>
            )}
            <form action={deleteCompetition} className="ml-auto">
              <input type="hidden" name="competitionId" value={campeonato.id} />
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-ink-500 hover:text-danger"
              >
                <Trash2 aria-hidden className="size-4" />
                Apagar campeonato
              </Button>
            </form>
          </div>
        </CardBody>
      </Card>

      {/* Medalhas da equipe neste campeonato */}
      {campeonato.results.length > 0 && (
        <Card>
          <CardBody className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div>
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                A equipe neste campeonato
              </p>
              <p className="tabular mt-1 font-display text-2xl leading-none font-bold">
                {tally.podios}
                <span className="ml-1.5 text-base font-semibold text-ink-500">
                  {tally.podios === 1 ? "pódio" : "pódios"} em {tally.lutas}{" "}
                  {tally.lutas === 1 ? "participação" : "participações"}
                </span>
              </p>
            </div>
            <MedalTallyRow
              ouro={tally.ouro}
              prata={tally.prata}
              bronze={tally.bronze}
            />
          </CardBody>
        </Card>
      )}

      <Collapsible
        title="Registrar resultado"
        description="Adicionar a colocação de um atleta"
        icon={MedalIcon}
        defaultOpen={passado && campeonato.results.length === 0}
      >
        <ResultadoForm
          competitionId={campeonato.id}
          modalidadeCampeonato={campeonato.modality}
          atletas={alunos.map((a) => ({
            id: a.id,
            name: a.user.name,
            belt: a.belt,
            degree: a.degree,
          }))}
        />
      </Collapsible>

      <SectionTitle>Resultados</SectionTitle>

      {campeonato.results.length === 0 ? (
        <EmptyState
          icon={MedalIcon}
          title="Nenhum resultado registrado"
          description={
            passado
              ? "Registre a colocação de cada atleta que competiu. Isso monta o histórico deles."
              : "Depois do campeonato, volte aqui para registrar como a equipe foi."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {[...podios, ...demais].map((r, i) => {
              const info = placementInfo(r.placement);
              return (
                <li key={r.id} className={i > 0 ? "border-t border-line" : ""}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="flex w-8 shrink-0 justify-center">
                      {info.color ? (
                        <Medal placement={r.placement} size={30} />
                      ) : (
                        <span className="tabular text-sm font-bold text-ink-300">
                          {r.placement > 0 ? `${r.placement}º` : "sem pódio"}
                        </span>
                      )}
                    </span>

                    <Link
                      href={`/painel/alunos/${r.studentId}`}
                      className="min-w-0 flex-1 hover:underline"
                    >
                      <span className="block truncate font-semibold">
                        {r.student.user.name}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <BeltChip
                          belt={r.student.belt}
                          degree={r.student.degree}
                          size="sm"
                        />
                        <span className="text-xs text-ink-500">
                          {r.category ?? "Categoria não informada"} ·{" "}
                          {modalityLabel(r.modality)}
                        </span>
                      </span>
                      {r.notes && (
                        <span className="mt-1 block text-sm text-ink-500">
                          {r.notes}
                        </span>
                      )}
                    </Link>

                    <form action={deleteResult} className="shrink-0">
                      <input type="hidden" name="resultId" value={r.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-ink-500 hover:text-danger"
                        aria-label={`Apagar resultado de ${r.student.user.name}`}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
