"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import { Wordmark } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#aulas", label: "As aulas" },
  { href: "#horarios", label: "Horários" },
  { href: "#graduacao", label: "Graduação" },
  { href: "#agenda", label: "Agenda" },
  { href: "#contato", label: "Contato" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  // Trava o scroll do fundo enquanto o menu do celular esta aberto.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Yeshua Jiu-Jitsu, página inicial">
          <Wordmark size={38} />
        </Link>

        <nav aria-label="Seções do site" className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-[8px] px-3 py-2 text-sm font-semibold text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/login" size="sm" variant="dark" className="hidden sm:inline-flex">
            Área do aluno
          </ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="flex size-11 cursor-pointer items-center justify-center rounded-[10px] text-ink transition-smooth hover:bg-ink-100 lg:hidden"
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {/* Menu do celular */}
      <div
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-40 bg-white px-4 pt-4 pb-10 lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <nav aria-label="Seções do site" className="flex flex-col">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex min-h-[52px] items-center border-b border-line font-display text-lg font-semibold tracking-wide uppercase transition-smooth active:bg-ink-100"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <ButtonLink href="/login" size="lg" variant="dark" block className="mt-6">
          Área do aluno
        </ButtonLink>
      </div>
    </header>
  );
}
