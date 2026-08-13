import { SignJWT, jwtVerify } from "jose";

/**
 * Sessao do usuario guardada num cookie assinado (httpOnly).
 * Este arquivo so usa `jose`, entao tambem roda no middleware do Next.
 */

export const SESSION_COOKIE = "yeshua_session";
const SESSION_DAYS = 30;

export type Role = "ALUNO" | "PROFESSOR" | "ADMIN";

export type SessionPayload = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean;
};

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) {
    throw new Error(
      "AUTH_SECRET nao definido. Confira o arquivo .env na raiz do projeto.",
    );
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.userId !== "string") return null;
    return {
      userId: payload.userId,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: (payload.role as Role) ?? "ALUNO",
      mustChangePassword: Boolean(payload.mustChangePassword),
    };
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

export function isStaff(role: Role | undefined) {
  return role === "PROFESSOR" || role === "ADMIN";
}
