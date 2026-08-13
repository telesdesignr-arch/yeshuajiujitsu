import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySession, isStaff } from "@/lib/session";

/**
 * Guarda das rotas privadas. Roda antes de qualquer pagina:
 *  /app     -> area do aluno (precisa estar logado)
 *  /painel  -> painel do professor (precisa ser professor ou admin)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(
    request.cookies.get(SESSION_COOKIE)?.value,
  );

  const isPrivate = pathname.startsWith("/app") || pathname.startsWith("/painel");

  if (isPrivate && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("continuar", pathname);
    return NextResponse.redirect(url);
  }

  if (session?.mustChangePassword && isPrivate) {
    return NextResponse.redirect(new URL("/trocar-senha", request.url));
  }

  if (pathname.startsWith("/painel") && session && !isStaff(session.role)) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // Quem ja esta logado nao precisa ver a tela de login de novo.
  if (pathname === "/login" && session && !session.mustChangePassword) {
    return NextResponse.redirect(
      new URL(isStaff(session.role) ? "/painel" : "/app", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/painel/:path*", "/login"],
};
