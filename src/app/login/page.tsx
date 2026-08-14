import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { EsqueciSenha } from "./esqueci-senha";
import { LoginForm } from "./login-form";
import { Logo, Wordmark } from "@/components/logo";
import { ACADEMIA, whatsappLink } from "@/lib/academia";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      {/* Painel da marca */}
      <section className="bg-tatame relative flex flex-col justify-between px-6 py-8 text-white lg:w-[46%] lg:px-12 lg:py-14">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-white/70 transition-smooth hover:text-white"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Voltar ao site
        </Link>

        <div className="hidden lg:block">
          <Logo size={92} className="mb-8" />
          <h1 className="font-display text-5xl leading-[0.95] font-bold tracking-wide uppercase">
            Sua evolução
            <br />
            <span className="text-brand-400">no tatame</span>
          </h1>
          <p className="mt-5 max-w-md text-white/70">
            Faixa, graus, frequência e histórico de graduações. Tudo que você
            construiu na Yeshua, num lugar só.
          </p>
        </div>

        <p className="hidden text-sm text-white/50 lg:block">
          {ACADEMIA.lema} · Prof. {ACADEMIA.professor}
        </p>
      </section>

      {/* Formulário */}
      <section className="flex flex-1 items-center justify-center px-6 py-10 sm:py-14">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark size={52} />
          </div>

          <h2 className="font-display text-3xl font-bold tracking-wide uppercase">
            Entrar
          </h2>
          <p className="mt-1 mb-7 text-ink-500">
            Use o e-mail que você cadastrou na academia.
          </p>

          <LoginForm />

          <div className="mt-8 space-y-4 border-t border-line pt-6">
            <EsqueciSenha />

            <div>
              <p className="text-sm text-ink-500">
                Ainda não tem acesso? Chame o professor {ACADEMIA.professor} no
                WhatsApp — ele libera na hora.
              </p>
              <a
                href={whatsappLink(
                  "Olá, professor! Preciso de ajuda para acessar o app da Yeshua Jiu-Jitsu.",
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
              >
                <MessageCircle aria-hidden className="size-4" />
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
