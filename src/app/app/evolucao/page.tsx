import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Award, CalendarCheck, Medal, Target, User } from "lucide-react";

import { BeltBar, BeltChip, DegreeDots } from "@/components/belt";
import { Card, CardBody, CardHeader, CardTitle, SectionTitle } from "@/components/ui/card";
import { Badge, EmptyState, Progress, Stat } from "@/components/ui/misc";
import {
  beltsDaTrilha,
  graduationLabel,
  graduationRank,
  nextStep,
  trackOf,
  TRACK_LABEL,
} from "@/lib/belts";
import { requireStudent } from "@/lib/auth";
import { formatDateLong, humanDuration } from "@/lib/dates";
import { temGraduacao } from "@/lib/modalities";
import { prisma } from "@/lib/prisma";
import { getStudentStats } from "@/lib/stats";
import { pluralize } from "@/lib/utils";

export const metadata: Metadata = { title: "Minha evolução" };
export const dynamic = "force-dynamic";

export default async function EvolucaoPage() {
  const { student } = await requireStudent();

  // A página inteira é sobre faixa e graus. Quem só treina boxe não tem nada
  // disso, então volta para o início (o link já some do menu, isto cobre quem
  // digita o endereço na mão ou tem a página salva nos favoritos).
  if (!temGraduacao(student.modality)) redirect("/app");

  const [graduacoes, stats] = await Promise.all([
    prisma.graduation.findMany({
      where: { studentId: student.id },
      include: { awardedBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    getStudentStats(student),
  ]);

  const proximo = nextStep(student.belt, student.degree);

  // A escada do aluno: infantil ou adulta, conforme a faixa que ele tem hoje.
  const trilha = trackOf(student.belt);
  const escada = beltsDaTrilha(trilha);

  // Tempo que o aluno passou (ou está passando) em cada faixa.
  const porFaixa = escada.map((belt) => {
    const doGrupo = graduacoes
      .filter((g) => g.belt === belt.key)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (doGrupo.length === 0) return null;

    const inicio = doGrupo[0].date;
    const proximaFaixa = graduacoes
      .filter((g) => graduationRank(g.belt, g.degree) > graduationRank(belt.key, 4))
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    return {
      belt: belt.key,
      label: belt.label,
      inicio,
      fim: proximaFaixa?.date ?? null,
      duracao: humanDuration(inicio, proximaFaixa?.date ?? new Date()),
      atual: belt.key === student.belt,
    };
  }).filter(Boolean) as {
    belt: string;
    label: string;
    inicio: Date;
    fim: Date | null;
    duracao: string;
    atual: boolean;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Minha evolução
        </h1>
        <p className="text-sm text-ink-500">
          Toda a sua caminhada na Yeshua, do primeiro dia até hoje.
        </p>
      </div>

      {/* No computador: à esquerda onde você está, à direita como chegou até
          aqui. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-6">

      {/* Faixa atual */}
      <Card className="border-ink bg-ink text-white">
        <CardBody className="pt-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-white/50 uppercase">
            Faixa atual
          </p>
          <p className="mt-1.5 font-display text-2xl font-bold tracking-wide uppercase">
            {graduationLabel(student.belt, student.degree)}
          </p>
          <div className="my-4 rounded-[10px] bg-white/10 p-2">
            <BeltBar belt={student.belt} degree={student.degree} height={40} />
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-white/12 pt-4 text-sm">
            <div>
              <dt className="text-white/50">Nesta graduação há</dt>
              <dd className="mt-0.5 font-semibold">
                {humanDuration(student.beltSinceAt)}
              </dd>
            </div>
            <div>
              <dt className="text-white/50">Treinando desde</dt>
              <dd className="mt-0.5 font-semibold">
                {formatDateLong(student.joinedAt)}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Graduações"
          value={graduacoes.length}
          hint="Recebidas na academia"
          icon={Medal}
        />
        <Stat
          label="Treinos no total"
          value={stats.totalTrainings}
          hint={`Meta: ${student.monthlyGoal}/mês`}
          icon={CalendarCheck}
        />
      </div>

      {/* Próximo objetivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target aria-hidden className="size-4 text-brand-600" />
            Próximo objetivo
          </CardTitle>
        </CardHeader>
        <CardBody>
          <p className="font-display text-xl font-bold tracking-wide uppercase">
            {proximo.label}
          </p>
          {proximo.expectedMonths ? (
            <>
              <Progress
                value={stats.graduationProgress * 100}
                label="Progresso até a próxima graduação"
                className="mt-3"
              />
              <p className="mt-2.5 text-sm text-ink-500">
                {stats.monthsOnCurrentGrade >= proximo.expectedMonths
                  ? `Você já cumpriu os ${proximo.expectedMonths} ${pluralize(proximo.expectedMonths, "mês", "meses")} de referência nesta graduação. `
                  : `${stats.monthsOnCurrentGrade} de ${proximo.expectedMonths} ${pluralize(proximo.expectedMonths, "mês", "meses")} de referência nesta graduação. `}
                O professor {student.professor?.name ?? "responsável"} avalia
                técnica, postura e frequência antes de graduar.
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-500">
              Você chegou ao topo da escada de graduação.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Tempo em cada faixa */}
      {porFaixa.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tempo em cada faixa</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-3">
              {porFaixa.map((f) => (
                <li
                  key={f.belt}
                  className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0"
                >
                  <BeltChip belt={f.belt} degree={0} size="sm" />
                  <span className="text-right">
                    <span className="block text-sm font-semibold">{f.duracao}</span>
                    <span className="block text-xs text-ink-500">
                      {f.atual ? "em andamento" : "concluída"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      </div>
      <div className="space-y-6">

      {/* Linha do tempo */}
      <section>
        <SectionTitle>Linha do tempo</SectionTitle>

        {graduacoes.length === 0 ? (
          <EmptyState
            icon={Award}
            title="Ainda sem graduações registradas"
            description="Assim que o professor registrar sua primeira graduação, ela aparece aqui."
          />
        ) : (
          <ol className="relative space-y-4 border-l-2 border-line pl-6">
            {graduacoes.map((g, i) => (
              <li key={g.id} className="relative">
                <span
                  aria-hidden
                  className={`absolute top-4 -left-[31px] size-3.5 rounded-full ${
                    i === 0 ? "bg-brand-600" : "bg-ink-300"
                  }`}
                  style={{ boxShadow: "0 0 0 4px var(--color-ink-100)" }}
                />
                <Card className={i === 0 ? "border-brand-300" : undefined}>
                  <CardBody className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-bold tracking-wide uppercase">
                          {graduationLabel(g.belt, g.degree)}
                        </p>
                        <p className="text-sm text-ink-500 first-letter:uppercase">
                          {formatDateLong(g.date)}
                        </p>
                      </div>
                      {i === 0 && <Badge tone="brand">Atual</Badge>}
                    </div>

                    <div className="mt-3">
                      <BeltBar belt={g.belt} degree={g.degree} height={22} />
                    </div>

                    {g.awardedBy && (
                      <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-500">
                        <User aria-hidden className="size-3.5" />
                        Graduado por {g.awardedBy.name}
                      </p>
                    )}

                    {g.notes && (
                      <p className="mt-2 rounded-[8px] bg-ink-100 px-3 py-2 text-sm leading-relaxed text-ink-700">
                        {g.notes}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Escada completa */}
      <Card>
        <CardHeader>
          <CardTitle>O caminho completo</CardTitle>
          <p className="mt-1 text-sm text-ink-500">{TRACK_LABEL[trilha]}</p>
        </CardHeader>
        <CardBody>
          <ul className="space-y-4">
            {escada.map((belt) => {
              const rankAtual = graduationRank(student.belt, student.degree);
              const passou = graduationRank(belt.key, 4) < rankAtual;
              const atual = belt.key === student.belt;
              const grausAqui = atual ? student.degree : passou ? 4 : 0;

              return (
                <li key={belt.key} className={passou || atual ? "" : "opacity-45"}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="font-display text-base font-bold tracking-wide uppercase">
                      Faixa {belt.label}
                    </span>
                    {atual ? (
                      <Badge tone="brand">Você está aqui</Badge>
                    ) : passou ? (
                      <span className="text-xs font-semibold text-success">
                        Concluída
                      </span>
                    ) : (
                      <DegreeDots belt={belt.key} degree={0} />
                    )}
                  </div>
                  <BeltBar belt={belt.key} degree={grausAqui} height={24} />
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      </div>
      </div>
    </div>
  );
}
