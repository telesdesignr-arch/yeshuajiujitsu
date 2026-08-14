"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireStaff } from "@/lib/auth";
import { dataBrasileira } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string; success?: string };

/* -------------------------------------------------------------------------- */
/* Campeonatos                                                                 */
/* -------------------------------------------------------------------------- */

const campeonatoSchema = z.object({
  name: z.string().trim().min(3, "Dê o nome do campeonato."),
  date: z.string().min(1, "Informe a data do campeonato."),
  time: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().trim().optional(),
  organizer: z.string().trim().optional(),
  modality: z.enum(["GI", "NOGI", "AMBOS"]),
  registrationUrl: z.string().trim().optional(),
  registrationDeadline: z.string().optional(),
  description: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
});

export async function createCompetition(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = campeonatoSchema.safeParse({
    name: formData.get("name"),
    date: formData.get("date"),
    time: formData.get("time"),
    endDate: formData.get("endDate"),
    location: formData.get("location"),
    organizer: formData.get("organizer"),
    modality: formData.get("modality"),
    registrationUrl: formData.get("registrationUrl"),
    registrationDeadline: formData.get("registrationDeadline"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // O endereço da imagem tem que ser https: um http quebraria o cadeado do
  // site e o navegador bloquearia a imagem.
  if (d.imageUrl && !/^https:\/\//i.test(d.imageUrl)) {
    return {
      error:
        "O endereço da imagem precisa começar com https:// — copie clicando com o botão direito na imagem do site da federação e escolhendo “Copiar endereço da imagem”.",
    };
  }

  if (d.registrationDeadline && d.registrationDeadline > d.date) {
    return {
      error: "O prazo de inscrição não pode ser depois da data do campeonato.",
    };
  }
  if (d.endDate && d.endDate < d.date) {
    return { error: "A data de encerramento não pode ser antes da de início." };
  }

  await prisma.competition.create({
    data: {
      name: d.name,
      date: dataBrasileira(d.date, d.time || "08:00"),
      endDate: d.endDate ? dataBrasileira(d.endDate, "18:00") : null,
      location: d.location || null,
      organizer: d.organizer || null,
      modality: d.modality,
      registrationUrl: d.registrationUrl || null,
      registrationDeadline: d.registrationDeadline
        ? dataBrasileira(d.registrationDeadline, "23:59")
        : null,
      description: d.description || null,
      imageUrl: d.imageUrl || null,
    },
  });

  revalidateCampeonatos();
  return { success: "Campeonato publicado. Já aparece para os alunos." };
}

export async function deleteCompetition(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("competitionId") ?? "");
  if (!id) return;

  // Os resultados vao junto (onDelete: Cascade no schema).
  await prisma.competition.delete({ where: { id } });
  revalidateCampeonatos();
}

/* -------------------------------------------------------------------------- */
/* Resultados                                                                  */
/* -------------------------------------------------------------------------- */

const resultadoSchema = z.object({
  competitionId: z.string().min(1),
  studentId: z.string().min(1, "Escolha o atleta."),
  placement: z.coerce.number().int().min(0).max(64),
  category: z.string().trim().optional(),
  modality: z.enum(["GI", "NOGI"]),
  notes: z.string().trim().optional(),
});

export async function addResult(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = resultadoSchema.safeParse({
    competitionId: formData.get("competitionId"),
    studentId: formData.get("studentId"),
    placement: formData.get("placement"),
    category: formData.get("category"),
    modality: formData.get("modality"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const [campeonato, aluno] = await Promise.all([
    prisma.competition.findUnique({ where: { id: d.competitionId } }),
    prisma.student.findUnique({
      where: { id: d.studentId },
      include: { user: { select: { name: true } } },
    }),
  ]);

  if (!campeonato) return { error: "Campeonato não encontrado." };
  if (!aluno) return { error: "Aluno não encontrado." };

  await prisma.$transaction([
    prisma.competitionResult.create({
      data: {
        competitionId: d.competitionId,
        studentId: d.studentId,
        placement: d.placement,
        category: d.category || null,
        modality: d.modality,
        notes: d.notes || null,
      },
    }),
    // Quem competiu passa a contar como atleta competidor da equipe.
    prisma.student.update({
      where: { id: d.studentId },
      data: { isCompetitor: true },
    }),
  ]);

  revalidateCampeonatos();
  revalidatePath(`/painel/alunos/${d.studentId}`);

  return { success: `Resultado de ${aluno.user.name} registrado.` };
}

export async function deleteResult(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("resultId") ?? "");
  if (!id) return;

  await prisma.competitionResult.delete({ where: { id } });
  revalidateCampeonatos();
}

function revalidateCampeonatos() {
  revalidatePath("/painel/campeonatos");
  revalidatePath("/app/campeonatos");
  revalidatePath("/app/agenda");
  revalidatePath("/app");
  revalidatePath("/painel");
  revalidatePath("/");
}
