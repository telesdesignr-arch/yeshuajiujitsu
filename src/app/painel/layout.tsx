import Link from "next/link";
import { Smartphone } from "lucide-react";

import { PainelBottomNav, PainelSidebarNav } from "@/components/painel-nav";
import { LogoutButton } from "@/components/logout-button";
import { Wordmark } from "@/components/logo";
import { Avatar } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";

export default async function PainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStaff();

  return (
    <div className="min-h-dvh bg-ink-100/70">
      {/* Cabeçalho do celular */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/painel" aria-label="Painel">
            <Wordmark size={32} />
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
            >
              <Smartphone aria-hidden className="size-3.5" />
              Ver como aluno
            </Link>
            <LogoutButton
              label=""
              className="size-11 justify-center text-ink-500 hover:text-danger"
            />
          </div>
        </div>
      </header>

      <div className="lg:flex">
        {/* Menu lateral do computador */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
          <Link href="/painel" aria-label="Painel" className="mb-7 px-1">
            <Wordmark size={38} />
          </Link>

          <PainelSidebarNav />

          <div className="mt-auto border-t border-line pt-4">
            <div className="mb-3 flex items-center gap-2.5 px-1">
              <Avatar name={session.name} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{session.name}</p>
                <p className="truncate text-xs text-ink-500">
                  {session.role === "ADMIN" ? "Administrador" : "Professor"}
                </p>
              </div>
            </div>
            <Link
              href="/app"
              className="mb-1 flex min-h-[40px] items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
            >
              <Smartphone aria-hidden className="size-4" />
              Ver como aluno
            </Link>
            <LogoutButton className="min-h-[40px] w-full justify-start gap-3 rounded-[10px] px-3 text-danger hover:bg-danger/8" />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-[80px] sm:px-6 lg:px-8 lg:pt-8 lg:pb-12">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>

      <PainelBottomNav />
    </div>
  );
}
