import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";

/**
 * Encerra a sessão e volta para o login.
 *
 * Existe como rota (e não só como botão) porque uma página não pode apagar
 * cookie no Next: quando o sistema descobre no meio de um acesso que a conta
 * foi desativada, ele manda o usuário para cá para o cookie ser limpo de
 * verdade -- senão o navegador ficaria tentando entrar em looping.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
