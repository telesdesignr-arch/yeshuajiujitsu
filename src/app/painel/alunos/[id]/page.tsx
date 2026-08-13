import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { startOfMonth } from "date-fns";
import {
  ArrowLeft,
  Award,
  CalendarCheck,
  CheckCircle2,
  Flame,
  MessageCircle,
  MessageSquarePlus,
  Pencil,
  Phone,
  Trash2,
  Trophy,
  User,
} from "lucide-react";

import { EditarAlunoForm, GraduacaoForm, NotaForm } from "./formularios";
import { deleteNote } from "@/actions/painel";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { BeltBar } from "@/components/belt";
import { BarChart } from "@/components/charts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Collapsible,
  SectionTitle,
} from "@/components/ui/card";
import { Avatar, Badge, EmptyState, Progress, Stat } from "@/components/ui/misc";
import { graduationLabel, nextStep } from "@/lib/belts";
import { requireStaff } from "@/lib/auth";
import { dayKey, formatDateLong, formatDateShortYear, humanDuration } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getStudentStats } from "@/lib/stats";
import { firstName, pluralize } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  return { title: student?.user.name ?? "Aluno" };
}

export default async function AlunoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const { novo } = await searchParams;

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      professor: { select: { name: true } },
      graduations: {
        include: { awardedBy: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
      journal: {
        include: { author: { select: { name: true } } },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!student) notFound();

  const stats = await getStudentStats(student);
  const proximo = nextStep(student.belt, student.degree);
  const mesAtual = startOfMonth(new Date());

  const aulasDoMes = await prisma.attendanceSession.findMany({
    where: { date: { gte: mesAtual } },
    select: { date: true },
  });

  const telefoneLimpo = student.phone?.replace(/\D/g, "");

  return (
    <div className="space-y-5">
      <Link
        href="/painel/alunos"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-smooth hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para alunos
      </Link>

      {novo && (
        <p className="flex items-start gap-2.5 rounded-card border border-success/25 bg-success/8 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
          Aluno cadastrado. Avise que a senha inicial é{" "}
          <strong className="font-bold">yeshua123</strong>.
        </p>
      )}

      {/* Cabeçalho */}
      <Card>
        <CardBody className="pt-5">
          <div className="flex items-start gap-4">
            <Avatar name={student.user.name} src={student.photoUrl} size={64} />
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl leading-tight font-bold tracking-wide uppercase">
                {student.user.name}
              </h1>
              <p className="text-sm text-ink-500">
                {graduationLabel(student.belt, student.degree)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {!student.active && <Badge tone="neutral">Inativo</Badge>}
                {student.isCompetitor && (
                  <Badge tone="warning">
                    <Trophy aria-hidden className="size-3" />
                    Competidor
                  </Badge>
                )}
                <Badge tone="neutral">
                  <User aria-hidden className="size-3" />
                  Prof. {student.professor?.name ?? "—"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <BeltBar belt={student.belt} degree={student.degree} height={34} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
            <div>
              <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                Na academia desde
              </dt>
              <dd className="mt-0.5 font-semibold">
                {formatDateShortYear(student.joinedAt)}
                <span className="font-normal text-ink-500">
                  {" "}
                  ({humanDuration(student.joinedAt)})
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                Nesta graduação
              </dt>
              <dd className="mt-0.5 font-semibold">
                {humanDuration(student.beltSinceAt)}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                E-mail
              </dt>
              <dd className="mt-0.5 break-all">{student.user.email}</dd>
            </div>
          </dl>

          {telefoneLimpo && (
            <div className="mt-4 flex gap-2">
              <a
                href={`https://wa.me/55${telefoneLimpo}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-line bg-white text-sm font-semibold transition-smooth hover:bg-ink-100"
              >
                <MessageCircle aria-hidden className="size-4" />
                WhatsApp
              </a>
              <a
                href={`tel:${telefoneLimpo}`}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-[10px] border border-line bg-white text-sm font-semibold transition-smooth hover:bg-ink-100"
              >
                <Phone aria-hidden className="size-4" />
                {student.phone}
              </a>
            </div>
          )}

          {student.observations && (
            <p className="mt-4 rounded-[8px] bg-warning/8 px-3 py-2 text-sm text-ink-700">
              <strong className="font-semibold">Atenção:</strong>{" "}
              {student.observations}
            </p>
          )}
        </CardBody>
      </Card>

      {/* Números */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Treinos no mês"
          value={stats.monthTrainings}
          suffix={`/${stats.monthGoal}`}
          hint={`${stats.monthPercent}% da meta`}
          icon={CalendarCheck}
          tone={stats.monthPercent >= 70 ? "brand" : "default"}
        />
        <Stat
          label="Sequência"
          value={stats.streak}
          suffix={pluralize(stats.streak, "sem", "sem")}
          hint="Semanas seguidas"
          icon={Flame}
        />
        <Stat
          label="Total de treinos"
          value={stats.totalTrainings}
          hint="Desde a entrada"
          icon={CalendarCheck}
        />
        <Stat
          label="Graduações"
          value={student.graduations.length}
          hint="Na academia"
          icon={Award}
        />
      </div>

      {/* Próxima graduação */}
      <Card>
        <CardHeader>
          <CardTitle>Próxima graduação</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="font-display text-lg font-bold tracking-wide uppercase">
            {proximo.label}
          </p>
          {proximo.expectedMonths && (
            <>
              <Progress
                value={stats.graduationProgress * 100}
                label="Progresso até a próxima graduação"
                className="mt-3"
              />
              <p className="mt-2 text-sm text-ink-500">
                {stats.monthsOnCurrentGrade >= proximo.expectedMonths
                  ? `Já cumpriu os ${proximo.expectedMonths} ${pluralize(proximo.expectedMonths, "mês", "meses")} de referência`
                  : `${stats.monthsOnCurrentGrade} de ${proximo.expectedMonths} ${pluralize(proximo.expectedMonths, "mês", "meses")} de referência`}{" "}
                · {stats.monthPercent}% de frequência neste mês.
              </p>
            </>
          )}
        </CardBody>
      </Card>

      {/* Ações do professor */}
      <SectionTitle>Ações</SectionTitle>

      <Collapsible
        title="Registrar graduação"
        description="Entregar um grau novo ou trocar a faixa"
        icon={Award}
      >
        <GraduacaoForm
          studentId={student.id}
          beltAtual={student.belt}
          degreeAtual={student.degree}
        />
      </Collapsible>

      <Collapsible
        title="Adicionar observação"
        description="Diário de evolução do aluno"
        icon={MessageSquarePlus}
      >
        <NotaForm studentId={student.id} />
      </Collapsible>

      <Collapsible
        title="Editar dados"
        description="Nome, contato, meta e situação"
        icon={Pencil}
      >
        <EditarAlunoForm
          student={{
            id: student.id,
            name: student.user.name,
            email: student.user.email,
            phone: student.phone,
            monthlyGoal: student.monthlyGoal,
            isCompetitor: student.isCompetitor,
            active: student.active,
            guardianName: student.guardianName,
            emergencyContact: student.emergencyContact,
            observations: student.observations,
          }}
        />
      </Collapsible>

      {/* Frequência */}
      <SectionTitle>Frequência</SectionTitle>

      <Card>
        <CardHeader>
          <CardTitle className="text-base first-letter:uppercase">
            Este mês
          </CardTitle>
        </CardHeader>
        <CardBody>
          <AttendanceCalendar
            month={mesAtual}
            attendedDays={new Set(stats.attendedDayKeys)}
            academyDays={new Set(aulasDoMes.map((a) => dayKey(a.date)))}
            subject={firstName(student.user.name)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos 6 meses</CardTitle>
        </CardHeader>
        <CardBody>
          <BarChart
            caption={`Treinos de ${student.user.name} por mês nos últimos seis meses`}
            data={stats.history.map((h, i) => ({
              label: h.short,
              fullLabel: h.label,
              value: h.count,
              target: h.goal,
              highlight: i === stats.history.length - 1,
            }))}
          />
        </CardBody>
      </Card>

      {/* Diário */}
      <SectionTitle>Diário do aluno</SectionTitle>

      {student.journal.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="Nenhuma observação ainda"
          description="Anote o que você percebe na evolução do aluno. Com o tempo isso vira o histórico real dele."
        />
      ) : (
        <div className="space-y-3">
          {student.journal.map((nota) => (
            <Card key={nota.id}>
              <CardBody className="pt-4">
                <p className="text-[15px] leading-relaxed">{nota.content}</p>
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-ink-500">
                    {nota.author?.name ?? "Professor"} ·{" "}
                    <span className="first-letter:uppercase">
                      {formatDateLong(nota.date)}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    {nota.visibleToStudent ? (
                      <Badge tone="brand">O aluno vê</Badge>
                    ) : (
                      <Badge tone="neutral">Só você vê</Badge>
                    )}
                    <form action={deleteNote}>
                      <input type="hidden" name="noteId" value={nota.id} />
                      <input type="hidden" name="studentId" value={student.id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-ink-500 hover:text-danger"
                        aria-label="Apagar observação"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico de graduações */}
      <SectionTitle>Histórico de graduações</SectionTitle>

      {student.graduations.length === 0 ? (
        <EmptyState icon={Award} title="Sem graduações registradas" />
      ) : (
        <Card>
          <ul>
            {student.graduations.map((g, i) => {
              const criterios: string[] = g.criteria
                ? (JSON.parse(g.criteria) as string[])
                : [];
              return (
                <li key={g.id} className={i > 0 ? "border-t border-line" : ""}>
                  <div className="px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">
                        {graduationLabel(g.belt, g.degree)}
                      </p>
                      <p className="shrink-0 text-sm text-ink-500">
                        {formatDateShortYear(g.date)}
                      </p>
                    </div>
                    {g.awardedBy && (
                      <p className="mt-0.5 text-xs text-ink-500">
                        Graduado por {g.awardedBy.name}
                      </p>
                    )}
                    {criterios.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {criterios.map((c) => (
                          <li key={c}>
                            <Badge tone="neutral">{c}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                    {g.notes && (
                      <p className="mt-2 text-sm text-ink-500">{g.notes}</p>
                    )}
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
