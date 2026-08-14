import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  ExternalLink,
  MapPin,
  Trophy,
  Users,
} from "lucide-react";

import { CampeonatoForm } from "./formularios";
import { MedalTallyRow } from "@/components/medal";
import { BeltChip } from "@/components/belt";
import { Card, CardBody, Collapsible, SectionTitle } from "@/components/ui/card";
import { Avatar, Badge, EmptyState, Stat } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { compareTally, modalityLabel, tallyMedals } from "@/lib/competitions";
import { agora, formatDateLong, formatDateShortYear } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Campeonatos" };
export const dynamic = "force-dynamic";

export default async function PainelCampeonatosPage() {
  await requireStaff();

  const [campeonatos, resultados] = await Promise.all([
    prisma.competition.findMany({
      orderBy: { date: "desc" },
      include: { _count: { select: { results: true } } },
    }),
    prisma.competitionResult.findMany({
      include: {
        student: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

  const hoje = agora();
  const proximos = campeonatos
    .filter((c) => c.date >= hoje)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const realizados = campeonatos.filter((c) => c.date < hoje);

  // Quadro de medalhas da equipe
  const totalEquipe = tallyMedals(resultados);

  const porAtleta = new Map<
    string,
    {
      studentId: string;
      name: string;
      belt: string;
      degree: number;
      photoUrl: string | null;
      tally: ReturnType<typeof tallyMedals>;
    }
  >();

  for (const r of resultados) {
    const atual = porAtleta.get(r.studentId);
    if (atual) continue;
    const meus = resultados.filter((x) => x.studentId === r.studentId);
    porAtleta.set(r.studentId, {
      studentId: r.studentId,
      name: r.student.user.name,
      belt: r.student.belt,
      degree: r.student.degree,
      photoUrl: r.student.photoUrl,
      tally: tallyMedals(meus),
    });
  }

  const ranking = [...porAtleta.values()].sort((a, b) =>
    compareTally(a.tally, b.tally),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Campeonatos
        </h1>
        <p className="text-sm text-ink-500">
          Divulgue os campeonatos do ano e registre os resultados da equipe.
        </p>
      </div>

      {/* Quadro da equipe */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Campeonatos"
          value={campeonatos.length}
          hint={`${proximos.length} ainda por vir`}
          icon={Trophy}
          tone="dark"
        />
        <Stat
          label="Pódios"
          value={totalEquipe.podios}
          hint={`Em ${totalEquipe.lutas} participações`}
          icon={Trophy}
          tone={totalEquipe.podios > 0 ? "brand" : "default"}
        />
        <Stat
          label="Atletas com medalha"
          value={ranking.filter((r) => r.tally.podios > 0).length}
          hint="Na equipe"
          icon={Users}
        />
        <Card className="flex flex-col justify-center px-4 py-3">
          <p className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Medalhas
          </p>
          <MedalTallyRow
            ouro={totalEquipe.ouro}
            prata={totalEquipe.prata}
            bronze={totalEquipe.bronze}
            size={20}
          />
        </Card>
      </div>

      <Collapsible
        title="Novo campeonato"
        description="Divulgar uma competição para a equipe"
        icon={Trophy}
      >
        <CampeonatoForm />
      </Collapsible>

      {/* Próximos */}
      <SectionTitle>Próximos campeonatos</SectionTitle>

      {proximos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum campeonato marcado"
          description="Publique o próximo campeonato para a equipe se preparar e se inscrever a tempo."
        />
      ) : (
        <div className="space-y-3">
          {proximos.map((c) => (
            <CampeonatoCard key={c.id} campeonato={c} />
          ))}
        </div>
      )}

      {/* Realizados */}
      <SectionTitle>Já realizados</SectionTitle>

      {realizados.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="Nenhum campeonato no histórico"
          description="Depois que a equipe competir, registre aqui os resultados de cada atleta."
        />
      ) : (
        <div className="space-y-3">
          {realizados.map((c) => (
            <CampeonatoCard key={c.id} campeonato={c} passado />
          ))}
        </div>
      )}

      {/* Ranking da equipe */}
      {ranking.length > 0 && (
        <>
          <SectionTitle>Quadro de medalhas da equipe</SectionTitle>
          <Card className="overflow-hidden">
            <ul>
              {ranking.map((a, i) => (
                <li key={a.studentId} className={i > 0 ? "border-t border-line" : ""}>
                  <Link
                    href={`/painel/alunos/${a.studentId}`}
                    className="flex items-center gap-3 px-4 py-3 transition-smooth hover:bg-ink-100/60"
                  >
                    <span className="tabular w-5 shrink-0 text-center font-display text-lg font-bold text-ink-300">
                      {i + 1}
                    </span>
                    <Avatar name={a.name} src={a.photoUrl} size={38} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{a.name}</span>
                      <BeltChip belt={a.belt} degree={a.degree} size="sm" />
                    </span>
                    <MedalTallyRow
                      ouro={a.tally.ouro}
                      prata={a.tally.prata}
                      bronze={a.tally.bronze}
                      size={18}
                      className="shrink-0 gap-2.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

function CampeonatoCard({
  campeonato,
  passado,
}: {
  campeonato: {
    id: string;
    name: string;
    date: Date;
    location: string | null;
    organizer: string | null;
    modality: string;
    registrationDeadline: Date | null;
    registrationUrl: string | null;
    _count: { results: number };
  };
  passado?: boolean;
}) {
  const c = campeonato;
  return (
    <Card>
      <Link
        href={`/painel/campeonatos/${c.id}`}
        className="block transition-smooth hover:opacity-85"
      >
        <CardBody className="pt-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="warning">
                  <Trophy aria-hidden className="size-3" />
                  {modalityLabel(c.modality)}
                </Badge>
                {c.organizer && <Badge tone="neutral">{c.organizer}</Badge>}
                {passado && c._count.results > 0 && (
                  <Badge tone="success">
                    {c._count.results}{" "}
                    {c._count.results === 1 ? "resultado" : "resultados"}
                  </Badge>
                )}
                {passado && c._count.results === 0 && (
                  <Badge tone="danger">Sem resultados</Badge>
                )}
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

              {!passado && c.registrationDeadline && (
                <p className="mt-2 inline-flex rounded-[6px] bg-warning/10 px-2 py-1 text-xs font-semibold text-warning">
                  Inscrições até {formatDateShortYear(c.registrationDeadline)}
                </p>
              )}
            </div>

            <ChevronRight aria-hidden className="mt-1 size-4 shrink-0 text-ink-300" />
          </div>
        </CardBody>
      </Link>

      {c.registrationUrl && (
        <div className="border-t border-line px-4 py-2.5 sm:px-5">
          <a
            href={c.registrationUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            <ExternalLink aria-hidden className="size-3.5" />
            Página de inscrição
          </a>
        </div>
      )}
    </Card>
  );
}
