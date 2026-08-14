"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { hashPassword, requireStaff } from "@/lib/auth";
import { BELT_KEYS, MAX_DEGREE } from "@/lib/belts";
import { prisma } from "@/lib/prisma";

export type ActionState = { error?: string; success?: string };

/* -------------------------------------------------------------------------- */
/* Alunos                                                                      */
/* -------------------------------------------------------------------------- */

const alunoSchema = z.object({
  name: z.string().trim().min(3, "Digite o nome completo do aluno."),
  email: z.string().trim().toLowerCase().email("Digite um e-mail válido."),
  phone: z.string().trim().optional(),
  belt: z.enum(BELT_KEYS as [string, ...string[]]),
  degree: z.coerce.number().int().min(0).max(MAX_DEGREE),
  joinedAt: z.string().min(1, "Informe a data de entrada na academia."),
  beltSinceAt: z.string().optional(),
  monthlyGoal: z.coerce.number().int().min(1).max(31),
  isCompetitor: z.coerce.boolean().optional(),
  guardianName: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
  observations: z.string().trim().optional(),
});

const SENHA_INICIAL = "yeshua123";

export async function createStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = alunoSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    belt: formData.get("belt"),
    degree: formData.get("degree"),
    joinedAt: formData.get("joinedAt"),
    beltSinceAt: formData.get("beltSinceAt"),
    monthlyGoal: formData.get("monthlyGoal"),
    isCompetitor: formData.get("isCompetitor") === "on",
    guardianName: formData.get("guardianName"),
    emergencyContact: formData.get("emergencyContact"),
    observations: formData.get("observations"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const data = parsed.data;

  const jaExiste = await prisma.user.findUnique({ where: { email: data.email } });
  if (jaExiste) {
    return { error: "Já existe alguém cadastrado com esse e-mail." };
  }

  const joinedAt = new Date(`${data.joinedAt}T12:00:00`);
  const beltSinceAt = data.beltSinceAt
    ? new Date(`${data.beltSinceAt}T12:00:00`)
    : joinedAt;

  let novoId = "";
  // Gerar o hash fora da transação: é uma operação lenta de propósito e
  // seguraria a conexão do banco aberta à toa.
  const passwordHash = await hashPassword(SENHA_INICIAL);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: "ALUNO",
        mustChangePassword: true,
      },
    });

    const student = await tx.student.create({
      data: {
        userId: user.id,
        professorId: staff.userId,
        phone: data.phone || null,
        belt: data.belt,
        degree: data.degree,
        joinedAt,
        beltSinceAt,
        monthlyGoal: data.monthlyGoal,
        isCompetitor: !!data.isCompetitor,
        guardianName: data.guardianName || null,
        emergencyContact: data.emergencyContact || null,
        observations: data.observations || null,
      },
    });
    novoId = student.id;

    // Registra a graduação atual para a linha do tempo já começar preenchida.
    await tx.graduation.create({
      data: {
        studentId: student.id,
        belt: data.belt,
        degree: data.degree,
        date: beltSinceAt,
        awardedById: staff.userId,
        notes: "Graduação registrada no cadastro do aluno.",
      },
    });
  });

  revalidatePath("/painel/alunos");
  revalidatePath("/painel");
  redirect(`/painel/alunos/${novoId}?novo=1`);
}

const editarSchema = alunoSchema.partial().extend({
  studentId: z.string().min(1),
  active: z.coerce.boolean().optional(),
});

export async function updateStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = editarSchema.safeParse({
    studentId: formData.get("studentId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    monthlyGoal: formData.get("monthlyGoal"),
    isCompetitor: formData.get("isCompetitor") === "on",
    active: formData.get("active") === "on",
    guardianName: formData.get("guardianName"),
    emergencyContact: formData.get("emergencyContact"),
    observations: formData.get("observations"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const student = await prisma.student.findUnique({
    where: { id: d.studentId },
    select: { userId: true },
  });
  if (!student) return { error: "Aluno não encontrado." };

  if (d.email) {
    const conflito = await prisma.user.findFirst({
      where: { email: d.email, id: { not: student.userId } },
    });
    if (conflito) return { error: "Esse e-mail já está em uso por outra pessoa." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: student.userId },
      data: {
        ...(d.name ? { name: d.name } : {}),
        ...(d.email ? { email: d.email } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
      },
    }),
    prisma.student.update({
      where: { id: d.studentId },
      data: {
        phone: d.phone || null,
        monthlyGoal: d.monthlyGoal ?? 12,
        isCompetitor: !!d.isCompetitor,
        active: d.active ?? true,
        guardianName: d.guardianName || null,
        emergencyContact: d.emergencyContact || null,
        observations: d.observations || null,
      },
    }),
  ]);

  revalidatePath(`/painel/alunos/${d.studentId}`);
  revalidatePath("/painel/alunos");
  return { success: "Dados do aluno atualizados." };
}

/* -------------------------------------------------------------------------- */
/* Chamada                                                                     */
/* -------------------------------------------------------------------------- */

export async function saveAttendance(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();

  const date = String(formData.get("date") ?? "");
  const scheduleId = String(formData.get("scheduleId") ?? "");
  const techniques = String(formData.get("techniques") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const presentes = formData.getAll("presente").map(String);

  if (!date) return { error: "Escolha a data da aula." };
  if (!scheduleId) return { error: "Escolha qual aula você está registrando." };

  const schedule = await prisma.classSchedule.findUnique({
    where: { id: scheduleId },
  });
  if (!schedule) return { error: "Aula não encontrada na grade." };

  const dataAula = new Date(`${date}T${schedule.startTime}:00`);
  if (dataAula.getDay() !== schedule.weekday) {
    return {
      error:
        "A data escolhida não bate com o dia da semana dessa aula. Confira a data.",
    };
  }

  // Uma chamada por aula por dia: se já existe, atualizamos.
  const inicioDoDia = new Date(`${date}T00:00:00`);
  const fimDoDia = new Date(`${date}T23:59:59`);

  const existente = await prisma.attendanceSession.findFirst({
    where: { scheduleId, date: { gte: inicioDoDia, lte: fimDoDia } },
  });

  const session = existente
    ? await prisma.attendanceSession.update({
        where: { id: existente.id },
        data: { techniques: techniques || null, notes: notes || null },
      })
    : await prisma.attendanceSession.create({
        data: {
          date: dataAula,
          title: `${schedule.title} · ${schedule.startTime}`,
          type: schedule.type,
          scheduleId: schedule.id,
          professorId: staff.userId,
          techniques: techniques || null,
          notes: notes || null,
        },
      });

  await prisma.$transaction([
    prisma.attendance.deleteMany({ where: { sessionId: session.id } }),
    prisma.attendance.createMany({
      data: presentes.map((studentId) => ({
        sessionId: session.id,
        studentId,
        present: true,
        // mesma data da aula: e o que faz as contas de frequencia serem rapidas
        date: session.date,
      })),
    }),
  ]);

  revalidatePath("/painel");
  revalidatePath("/painel/chamada");
  revalidatePath("/app");

  return {
    success: `Chamada salva: ${presentes.length} ${presentes.length === 1 ? "aluno presente" : "alunos presentes"}.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Graduacao                                                                   */
/* -------------------------------------------------------------------------- */

const graduacaoSchema = z.object({
  studentId: z.string().min(1),
  belt: z.enum(BELT_KEYS as [string, ...string[]]),
  degree: z.coerce.number().int().min(0).max(MAX_DEGREE),
  date: z.string().min(1, "Informe a data da graduação."),
  notes: z.string().trim().optional(),
  criteria: z.string().optional(),
});

export async function addGraduation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();

  const criterios = formData
    .getAll("criterio")
    .map(String)
    .filter(Boolean);

  const parsed = graduacaoSchema.safeParse({
    studentId: formData.get("studentId"),
    belt: formData.get("belt"),
    degree: formData.get("degree"),
    date: formData.get("date"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const dataGraduacao = new Date(`${d.date}T12:00:00`);

  await prisma.$transaction([
    prisma.graduation.create({
      data: {
        studentId: d.studentId,
        belt: d.belt,
        degree: d.degree,
        date: dataGraduacao,
        awardedById: staff.userId,
        notes: d.notes || null,
        criteria: criterios.length ? JSON.stringify(criterios) : null,
      },
    }),
    prisma.student.update({
      where: { id: d.studentId },
      data: { belt: d.belt, degree: d.degree, beltSinceAt: dataGraduacao },
    }),
  ]);

  revalidatePath(`/painel/alunos/${d.studentId}`);
  revalidatePath("/painel/graduacoes");
  revalidatePath("/painel");
  revalidatePath("/app");

  return { success: "Graduação registrada. Já aparece na evolução do aluno." };
}

/* -------------------------------------------------------------------------- */
/* Diario do aluno                                                             */
/* -------------------------------------------------------------------------- */

export async function addNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();

  const studentId = String(formData.get("studentId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  const visibleToStudent = formData.get("visibleToStudent") === "on";

  if (!studentId) return { error: "Aluno não identificado." };
  if (content.length < 3) return { error: "Escreva a observação antes de salvar." };

  await prisma.studentNote.create({
    data: {
      studentId,
      authorId: staff.userId,
      content,
      visibleToStudent,
      date: new Date(),
    },
  });

  revalidatePath(`/painel/alunos/${studentId}`);
  revalidatePath("/app/perfil");

  return {
    success: visibleToStudent
      ? "Observação salva. O aluno vai ver esse recado no perfil dele."
      : "Observação salva no histórico (só você enxerga).",
  };
}

export async function deleteNote(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("noteId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!id) return;

  await prisma.studentNote.delete({ where: { id } });
  revalidatePath(`/painel/alunos/${studentId}`);
}

/* -------------------------------------------------------------------------- */
/* Agenda: eventos e horarios                                                  */
/* -------------------------------------------------------------------------- */

const eventoSchema = z.object({
  title: z.string().trim().min(3, "Dê um nome ao evento."),
  type: z.string().min(1),
  startsAt: z.string().min(1, "Informe a data do evento."),
  time: z.string().optional(),
  location: z.string().trim().optional(),
  description: z.string().trim().optional(),
  link: z.string().trim().optional(),
});

export async function createEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStaff();

  const parsed = eventoSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    startsAt: formData.get("startsAt"),
    time: formData.get("time"),
    location: formData.get("location"),
    description: formData.get("description"),
    link: formData.get("link"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await prisma.event.create({
    data: {
      title: d.title,
      type: d.type,
      startsAt: new Date(`${d.startsAt}T${d.time || "19:00"}:00`),
      location: d.location || null,
      description: d.description || null,
      link: d.link || null,
    },
  });

  revalidatePath("/painel/agenda");
  revalidatePath("/app/agenda");
  revalidatePath("/");

  return { success: "Evento publicado na agenda." };
}

export async function deleteEvent(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("eventId") ?? "");
  if (!id) return;

  await prisma.event.delete({ where: { id } });
  revalidatePath("/painel/agenda");
  revalidatePath("/app/agenda");
  revalidatePath("/");
}

const horarioSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use o formato 19:00."),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use o formato 20:30."),
  title: z.string().trim().min(2, "Dê um nome à aula."),
  type: z.string().min(1),
});

export async function createSchedule(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const staff = await requireStaff();

  const parsed = horarioSchema.safeParse({
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    title: formData.get("title"),
    type: formData.get("type"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await prisma.classSchedule.create({
    data: { ...parsed.data, professorId: staff.userId },
  });

  revalidatePath("/painel/agenda");
  revalidatePath("/app/agenda");
  revalidatePath("/");

  return { success: "Horário adicionado à grade." };
}

export async function deleteSchedule(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("scheduleId") ?? "");
  if (!id) return;

  // Não apagamos de verdade: as chamadas antigas apontam para este horário.
  await prisma.classSchedule.update({
    where: { id },
    data: { active: false },
  });

  revalidatePath("/painel/agenda");
  revalidatePath("/app/agenda");
  revalidatePath("/");
}
