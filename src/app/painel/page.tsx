import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  ClipboardCheck,
  Flame,
  GraduationCap,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";

import { BeltChip } from "@/components/belt";
import { BarChart, DistributionBars } from "@/components/charts";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, Badge, EmptyState, Stat } from "@/components/ui/misc";
import { BELTS } from "@/lib/belts";
import { requireStaff } from "@/lib/auth";
import { formatDateShortYear, humanDuration } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import {
  getAcademyOverview,
  getGraduationCandidates,
  getStudentsSummary,
} from "@/lib/stats";
import { firstName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PainelHome() {
  const session = await requireStaff();

  const [overview, candidatos, alunos] = await Promise.all([
    getAcademyOverview(),
    getGraduationCandidates(),
    prisma.student.findMany({
      where: { active: true },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const resumo = await getStudentsSummary(
    alunos.map((a) => ({ id: a.id, monthlyGoal: a.monthlyGoal })),
  );

  const comResumo = alunos
    .map((a) => ({ aluno: a, r: resumo.get(a.id)! }))
    .filter((x) => x.r);

  const maisFrequentes = [...comResumo]
    .sort((a, b) => b.r.monthTrainings - a.r.monthTrainings)
    .slice(0, 5);

  const faltando = [...comResumo]
    .filter((x) => x.r.monthPercent < 40)
    .sort((a, b) => a.r.monthPercent - b.r.monthPercent)
    .slice(0, 5);

  const prontos = candidatos.filter((c) => c.pronto);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
            Olá, professor {firstName(session.name)}
          </h1>
          <p className="text-sm text-ink-500">Como está a academia neste mês.</p>
        </div>
        <ButtonLink href="/painel/chamada" size="md">
          <ClipboardCheck aria-hidden className="size-4" />
          Fazer a chamada
        </ButtonLink>
      </div>

      {/* Números principais */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Alunos ativos"
          value={overview.alunosAtivos}
          hint={`${overview.novosNoMes} ${overview.novosNoMes === 1 ? "novo" : "novos"} neste mês`}
          icon={Users}
          tone="dark"
        />
        <Stat
          label="Presenças no mês"
          value={overview.presencasNoMes}
          hint={`Em ${overview.aulasNoMes} aulas`}
          icon={CalendarCheck}
        />
        <Stat
          label="Frequência média"
          value={overview.frequenciaMedia}
          suffix="%"
          hint="No ritmo do mês até aqui"
          icon={TrendingUp}
          tone={overview.frequenciaMedia >= 70 ? "brand" : "default"}
        />
        <Stat
          label="Competidores"
          value={overview.competidores}
          hint="Atletas na equipe"
          icon={Trophy}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Frequência da academia */}
        <Card>
          <CardHeader>
            <CardTitle>Frequência da academia</CardTitle>
          </CardHeader>
          <CardBody>
            <BarChart
              caption="Frequência média da academia nos últimos seis meses, em porcentagem da meta de treinos"
              unit="%"
              data={overview.historico.map((h, i) => ({
                label: h.short,
                fullLabel: h.label,
                value: h.percent,
                highlight: i === overview.historico.length - 1,
              }))}
            />
            <p className="mt-3 text-xs text-ink-500">
              Presenças registradas dividido pela soma das metas mensais dos
              alunos matriculados. O mês corrente é calculado só sobre os dias
              que já passaram, para dar para comparar com os meses fechados.
            </p>
          </CardBody>
        </Card>

        {/* Distribuição por faixa */}
        <Card>
          <CardHeader>
            <CardTitle>Alunos por faixa</CardTitle>
          </CardHeader>
          <CardBody>
            <DistributionBars
              total={overview.alunosAtivos}
              data={BELTS.map((b) => ({
                label: b.label,
                value: overview.porFaixa.find((f) => f.belt === b.key)?.count ?? 0,
                color: b.color,
                ring: b.key === "BRANCA",
              }))}
            />
          </CardBody>
        </Card>
      </div>

      {/* Graduações próximas */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap aria-hidden className="size-4 text-brand-600" />
            Prontos para graduar
          </CardTitle>
          <Link
            href="/painel/graduacoes"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Ver todos
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </CardHeader>
        <CardBody>
          {prontos.length === 0 ? (
            <p className="text-sm text-ink-500">
              Ninguém bateu o tempo de referência ainda. Confira a lista completa
              para ver quem está chegando perto.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {prontos.slice(0, 5).map((c) => (
                <li key={c.studentId}>
                  <Link
                    href={`/painel/alunos/${c.studentId}`}
                    className="flex items-center gap-3 py-2.5 transition-smooth hover:opacity-80"
                  >
                    <Avatar name={c.name} src={c.photoUrl} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.name}</span>
                      <span className="block text-xs text-ink-500">
                        {c.proximoLabel} · há {humanDuration(c.beltSinceAt)} na
                        graduação atual
                      </span>
                    </span>
                    <Badge tone={c.recentPercent >= 70 ? "success" : "warning"}>
                      {c.recentPercent}%
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mais frequentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame aria-hidden className="size-4 text-brand-600" />
              Mais presentes no mês
            </CardTitle>
          </CardHeader>
          <CardBody>
            {maisFrequentes.length === 0 ? (
              <EmptyState title="Sem presenças este mês" />
            ) : (
              <ul className="divide-y divide-line">
                {maisFrequentes.map(({ aluno, r }, i) => (
                  <li key={aluno.id}>
                    <Link
                      href={`/painel/alunos/${aluno.id}`}
                      className="flex items-center gap-3 py-2.5 transition-smooth hover:opacity-80"
                    >
                      <span className="tabular w-5 shrink-0 text-center font-display text-lg font-bold text-ink-300">
                        {i + 1}
                      </span>
                      <Avatar name={aluno.user.name} src={aluno.photoUrl} size={36} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {aluno.user.name}
                        </span>
                        <BeltChip belt={aluno.belt} degree={aluno.degree} size="sm" />
                      </span>
                      <span className="tabular shrink-0 text-right">
                        <span className="block font-bold">{r.monthTrainings}</span>
                        <span className="block text-xs text-ink-500">treinos</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Faltando muito */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle aria-hidden className="size-4 text-warning" />
              Sumiram do tatame
            </CardTitle>
          </CardHeader>
          <CardBody>
            {faltando.length === 0 ? (
              <p className="text-sm text-ink-500">
                Ninguém abaixo de 40% da meta neste mês. Turma cheia.
              </p>
            ) : (
              <>
                <ul className="divide-y divide-line">
                  {faltando.map(({ aluno, r }) => (
                    <li key={aluno.id}>
                      <Link
                        href={`/painel/alunos/${aluno.id}`}
                        className="flex items-center gap-3 py-2.5 transition-smooth hover:opacity-80"
                      >
                        <Avatar name={aluno.user.name} src={aluno.photoUrl} size={36} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">
                            {aluno.user.name}
                          </span>
                          <span className="block text-xs text-ink-500">
                            Último treino:{" "}
                            {r.lastTrainingAt
                              ? formatDateShortYear(r.lastTrainingAt)
                              : "nunca treinou"}
                          </span>
                        </span>
                        <Badge tone="danger">{r.monthPercent}%</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-ink-500">
                  Uma mensagem no WhatsApp costuma trazer o aluno de volta antes
                  que ele desista de vez.
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>

      <ButtonLink href="/painel/alunos/novo" variant="outline" size="lg" block>
        <UserPlus aria-hidden className="size-4" />
        Cadastrar novo aluno
      </ButtonLink>
    </div>
  );
}
