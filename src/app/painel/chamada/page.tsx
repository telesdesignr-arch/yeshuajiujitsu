import type { Metadata } from "next";
import { CalendarX } from "lucide-react";

import { ChamadaForm } from "./chamada-form";
import { SeletorAula } from "./seletor-aula";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { WEEKDAYS, dataBrasileira, hojeISO, naAcademia } from "@/lib/dates";
import {
  filtroDeAlunosPorModalidade,
  type Modality,
} from "@/lib/modalities";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Chamada" };
export const dynamic = "force-dynamic";

export default async function ChamadaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; aula?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(params.data ?? "")
    ? params.data!
    : hojeISO();
  const weekday = naAcademia(dataBrasileira(date)).getDay();

  const aulasDoDia = await prisma.classSchedule.findMany({
    where: { weekday, active: true },
    orderBy: { startTime: "asc" },
  });

  const scheduleId =
    aulasDoDia.find((a) => a.id === params.aula)?.id ?? aulasDoDia[0]?.id ?? "";

  const aulaEscolhida = aulasDoDia.find((a) => a.id === scheduleId);

  const [alunos, sessaoExistente] = await Promise.all([
    // Só entram na chamada os alunos que treinam a modalidade da aula. Numa
    // aula de boxe não faz sentido rolar a lista inteira de Jiu-Jitsu.
    prisma.student.findMany({
      where: {
        active: true,
        ...(aulaEscolhida
          ? {
              modality: filtroDeAlunosPorModalidade(
                aulaEscolhida.modality as Modality,
              ),
            }
          : {}),
      },
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    scheduleId
      ? prisma.attendanceSession.findFirst({
          where: {
            scheduleId,
            date: {
              gte: dataBrasileira(date, "00:00"),
              lte: dataBrasileira(date, "23:59"),
            },
          },
          include: { attendances: { where: { present: true } } },
        })
      : null,
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Chamada
        </h1>
        <p className="text-sm text-ink-500">
          Toque no nome de quem está no tatame e salve no fim.
        </p>
      </div>

      <Card>
        <CardBody className="pt-5">
          <SeletorAula
            date={date}
            scheduleId={scheduleId}
            aulas={aulasDoDia.map((a) => ({
              id: a.id,
              label: `${a.startTime} · ${a.title}`,
            }))}
            modalidade={aulaEscolhida?.modality}
            quantosAlunos={alunos.length}
          />
          {sessaoExistente && (
            <p className="mt-3 rounded-[8px] bg-brand-50 px-3 py-2 text-sm text-brand-800">
              Esta chamada já foi feita ({sessaoExistente.attendances.length}{" "}
              {sessaoExistente.attendances.length === 1 ? "presente" : "presentes"}
              ). Você pode ajustar e salvar de novo.
            </p>
          )}
        </CardBody>
      </Card>

      {aulasDoDia.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={`Sem aula na ${WEEKDAYS[weekday].toLowerCase()}`}
          description="Não há nenhum horário cadastrado para este dia da semana. Escolha outra data ou adicione o horário na agenda."
        />
      ) : (
        <ChamadaForm
          key={`${date}-${scheduleId}`}
          date={date}
          scheduleId={scheduleId}
          alunos={alunos.map((a) => ({
            id: a.id,
            name: a.user.name,
            photoUrl: a.photoUrl,
            belt: a.belt,
            degree: a.degree,
            modality: a.modality,
          }))}
          presentesIniciais={
            sessaoExistente?.attendances.map((p) => p.studentId) ?? []
          }
          tecnicasIniciais={sessaoExistente?.techniques ?? ""}
        />
      )}
    </div>
  );
}
