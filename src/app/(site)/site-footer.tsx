import Link from "next/link";
import { Instagram, MessageCircle, MapPin } from "lucide-react";

import { Logo } from "@/components/logo";
import { ACADEMIA, whatsappLink } from "@/lib/academia";

export function SiteFooter() {
  return (
    <footer className="bg-ink px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <Logo size={64} />
            <p className="mt-4 font-display text-2xl font-bold tracking-[0.12em] uppercase">
              {ACADEMIA.nome}
            </p>
            <p className="mt-1 text-sm text-brand-300">{ACADEMIA.lema}</p>
            <p className="mt-4 text-sm text-white/60">
              Professor responsável: {ACADEMIA.professor}
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-display text-sm font-bold tracking-[0.18em] text-white/50 uppercase">
              Fale com a gente
            </p>
            <a
              href={whatsappLink(
                "Olá! Vi o site da Yeshua Jiu-Jitsu e quero saber mais sobre as aulas.",
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-white/85 transition-smooth hover:text-white"
            >
              <MessageCircle aria-hidden className="size-5 text-brand-400" />
              {ACADEMIA.whatsappFormatado}
            </a>
            <a
              href={ACADEMIA.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 text-white/85 transition-smooth hover:text-white"
            >
              <Instagram aria-hidden className="size-5 text-brand-400" />
              {ACADEMIA.instagramHandle}
            </a>
            <p className="flex items-center gap-3 text-white/85">
              <MapPin aria-hidden className="size-5 text-brand-400" />
              {ACADEMIA.endereco}
            </p>
          </div>

          <div className="space-y-3">
            <p className="font-display text-sm font-bold tracking-[0.18em] text-white/50 uppercase">
              Alunos
            </p>
            <Link
              href="/login"
              className="block text-white/85 transition-smooth hover:text-white"
            >
              Entrar na área do aluno
            </Link>
            <a
              href="#horarios"
              className="block text-white/85 transition-smooth hover:text-white"
            >
              Horários das aulas
            </a>
            <a
              href="#graduacao"
              className="block text-white/85 transition-smooth hover:text-white"
            >
              Sistema de graduação
            </a>
          </div>
        </div>

        <p className="mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} {ACADEMIA.nome}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
