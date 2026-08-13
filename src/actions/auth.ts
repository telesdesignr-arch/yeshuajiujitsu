"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  checkPassword,
  endSession,
  getSession,
  hashPassword,
  startSession,
} from "@/lib/auth";
import { isStaff, type Role } from "@/lib/session";

export type FormState = { error?: string; success?: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Digite um e-mail válido."),
  password: z.string().min(1, "Digite sua senha."),
});

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Mensagem generica de proposito: nao revela se o e-mail existe.
  const generico = "E-mail ou senha incorretos. Confira e tente de novo.";

  if (!user || !user.active) return { error: generico };

  const ok = await checkPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { error: generico };

  await startSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    mustChangePassword: user.mustChangePassword,
  });

  if (user.mustChangePassword) redirect("/trocar-senha");
  redirect(isStaff(user.role as Role) ? "/painel" : "/app");
}

export async function logout() {
  await endSession();
  redirect("/login");
}

const senhaSchema = z
  .object({
    password: z
      .string()
      .min(6, "A senha nova precisa ter pelo menos 6 caracteres."),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "As duas senhas não são iguais.",
    path: ["confirm"],
  });

export async function changePassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const parsed = senhaSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      passwordHash: await hashPassword(parsed.data.password),
      mustChangePassword: false,
    },
  });

  await startSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    mustChangePassword: false,
  });

  redirect(isStaff(user.role as Role) ? "/painel" : "/app");
}
