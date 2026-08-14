import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  Flame,
  GraduationCap,
  KeyRound,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { BeltChip } from "@/components/belt";
import { SenhaTemporaria } from "@/components/senha-temporaria";
import { BarChart, DistributionBars } from "@/components/charts";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, Badge, EmptyState, Stat } from "@/components/ui/misc";
import { beltsDaTrilha } from "@/lib/belts";
import { requireStaff } from "@/lib/auth";
import { dayKey, formatDateShortYear, hojeISO, humanDuration } from "@/lib/dates";
import { mesAtual, nomeDoMes, situacao } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
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

  // Alunos que pediram ajuda para entrar
  const pedidosDeSenha = await prisma.user.findMany({
    where: { passwordResetRequestedAt: { not: null }, active: true },
    select: {
      id: true,
      name: true,
      email: true,
      passwordResetRequestedAt: true,
    },
    orderBy: { passwordResetRequestedAt: "asc" },
  });

  // Resumo financeiro do mês corrente
  const mensalidades = await prisma.invoice.findMany({
    where: { referenceMonth: mesAtual(), status: { not: "CANCELADO" } },
    select: { status: true, dueDate: true, amountCents: true, discountCents: true },
  });

  const financeiro = {
    total: mensalidades.length,
    pagas: mensalidades.filter((m) => m.status === "PAGO").length,
    atrasadas: mensalidades.filter((m) => situacao(m) === "ATRASADO").length,
    recebido: mensalidades
      .filter((m) => m.status === "PAGO")
      .reduce((s, m) => s + m.amountCents - m.discountCents, 0),
  };

  // Distribuição por faixa: adultos primeiro, depois infantil, sem as faixas
  // que não têm ninguém.
  const faixasComAlunos = [...beltsDaTrilha("ADULTO"), ...beltsDaTrilha("INFANTIL")]
    .map((b) => ({
      label: b.label,
      value: overview.porFaixa.find((f) => f.belt === b.key)?.count ?? 0,
      color: b.color,
      stripe: b.stripe,
    }))
    .filter((f) => f.value > 0);

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

      {/* Alunos que não conseguem entrar */}
      {pedidosDeSenha.length > 0 && (
        <Card className="border-brand-300 bg-brand-50">
          <CardBody className="pt-4">
            <p className="flex items-center gap-2 font-display text-base font-bold tracking-wide text-brand-800 uppercase">
              <KeyRound aria-hidden className="size-4" />
              {pedidosDeSenha.length === 1
                ? "1 aluno não está conseguindo entrar"
                : `${pedidosDeSenha.length} alunos não estão conseguindo entrar`}
            </p>
            <p className="mt-1 mb-3 text-sm text-brand-800">
              Gere uma senha nova e mande para o aluno. Ele vai criar a senha
              dele no primeiro acesso.
            </p>

            <ul className="space-y-3">
              {pedidosDeSenha.map((u) => (
                <li
                  key={u.id}
                  className="rounded-[10px] border border-brand-200 bg-white p-3"
                >
                  <p className="font-semibold">{u.name}</p>
                  <p className="mb-2 text-xs text-ink-500">
                    {u.email} ·{" "}
                    {dayKey(u.passwordResetRequestedAt!) === hojeISO()
                      ? "pediu hoje"
                      : `pediu há ${humanDuration(u.passwordResetRequestedAt!)}`}
                  </p>
                  <SenhaTemporaria userId={u.id} compacto />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {/* Financeiro do mês */}
      <Link href="/painel/financeiro" className="block">
        <Card className="transition-smooth hover:opacity-90">
          <CardBody className="flex flex-wrap items-center gap-4 pt-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-brand-50 text-brand-700">
              <Wallet aria-hidden className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-base font-bold tracking-wide uppercase">
                Financeiro de {nomeDoMes(mesAtual())}
              </span>
              <span className="block text-xs text-ink-500">
                {financeiro.total === 0
                  ? "Nenhuma mensalidade lançada neste mês"
                  : `${financeiro.pagas} de ${financeiro.total} mensalidades quitadas`}
              </span>
            </span>
            <span className="text-right">
              <span className="tabular block font-display text-xl leading-none font-bold">
                {formatMoney(financeiro.recebido)}
              </span>
              <span className="block text-xs text-ink-500">recebido</span>
            </span>
            {financeiro.atrasadas > 0 && (
              <Badge tone="danger">
                {financeiro.atrasadas} em atraso
              </Badge>
            )}
            <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-300" />
          </CardBody>
        </Card>
      </Link>

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
            <CardDescription>
              {overview.alunosQueGraduam} no Jiu-Jitsu. Quem treina só boxe não
              entra aqui, porque não tem faixa.
            </CardDescription>
          </CardHeader>
          <CardBody>
            {/* Com as duas escadas somamos 18 faixas possíveis. Mostrar todas
                deixaria a lista cheia de linhas zeradas, então só entram as
                faixas que existem hoje na academia. */}
            {/* O total aqui é só quem faz Jiu-Jitsu. Usar o total de alunos
                ativos jogaria os percentuais para baixo, porque quem treina só
                boxe não aparece em faixa nenhuma. */}
            <DistributionBars
              total={overview.alunosQueGraduam}
              data={faixasComAlunos}
            />
            {faixasComAlunos.length === 0 && (
              <p className="text-sm text-ink-500">
                Nenhum aluno ativo cadastrado ainda.
              </p>
            )}
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
