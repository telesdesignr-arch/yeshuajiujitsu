import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  isStaff,
  type Role,
  type SessionPayload,
} from "@/lib/session";

export type { SessionPayload, Role };
export { isStaff };

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export async function checkPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

/** Grava o cookie de sessao apos um login bem sucedido. */
export async function startSession(payload: SessionPayload) {
  const token = await signSession(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Sessao atual, ou null se ninguem estiver logado. */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/**
 * Exige um usuario logado. Se nao houver, manda para o login.
 * Tambem forca a troca de senha no primeiro acesso.
 *
 * O cookie de sessao vale 30 dias, entao conferimos a conta no banco a cada
 * acesso. Sem isso, desmarcar "Aluno ativo" no painel nao tiraria o acesso de
 * quem ja esta logado -- o aluno continuaria entrando por ate um mes. E uma
 * consulta por chave primaria, custa quase nada.
 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      mustChangePassword: true,
    },
  });

  // Conta apagada ou desativada: manda limpar o cookie e voltar ao login.
  if (!user || !user.active) redirect("/sair");

  if (user.mustChangePassword) redirect("/trocar-senha");

  // Devolvemos os dados do banco, e nao os do cookie: assim uma troca de nome
  // ou de papel vale na hora, sem precisar sair e entrar de novo.
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
    mustChangePassword: false,
  };
}

/** Exige professor ou administrador. */
export async function requireStaff(): Promise<SessionPayload> {
  const session = await requireUser();
  if (!isStaff(session.role)) redirect("/app");
  return session;
}

/** Exige administrador (dono da academia). */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "ADMIN") redirect("/painel");
  return session;
}

/**
 * O perfil de aluno de quem esta logado. Professores tambem podem ter
 * perfil de aluno (eles treinam), mas nao e obrigatorio.
 */
export async function getCurrentStudent() {
  const session = await getSession();
  if (!session) return null;
  return prisma.student.findUnique({
    where: { userId: session.userId },
    include: { user: true, professor: true },
  });
}

/** Igual ao anterior, mas obriga que o perfil exista. */
export async function requireStudent() {
  const session = await requireUser();
  const student = await prisma.student.findUnique({
    where: { userId: session.userId },
    include: { user: true, professor: true },
  });
  if (!student) {
    // Professor sem perfil de aluno cai direto no painel dele.
    redirect(isStaff(session.role) ? "/painel" : "/login");
  }
  return { session, student };
}
