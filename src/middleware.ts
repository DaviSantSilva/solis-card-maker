import { NextRequest, NextResponse } from "next/server";

const COOKIE   = "solis_auth";
const LOGIN_PATH = "/login";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas públicas — nunca bloqueadas
  if (pathname === LOGIN_PATH) return NextResponse.next();

  // Verifica cookie de sessão
  const cookie = req.cookies.get(COOKIE)?.value;
  const expected = process.env.APP_PASSWORD;

  if (!expected) {
    // APP_PASSWORD não configurada — bloqueia tudo por segurança
    return NextResponse.redirect(new URL(LOGIN_PATH, req.url));
  }

  if (cookie === expected) {
    // Autenticado — libera
    return NextResponse.next();
  }

  // Não autenticado — redireciona para login
  const loginUrl = new URL(LOGIN_PATH, req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    // Protege todas as rotas exceto assets estáticos e API de tradução
    "/((?!_next/static|_next/image|favicon.ico|api/translate).*)",
  ],
};
