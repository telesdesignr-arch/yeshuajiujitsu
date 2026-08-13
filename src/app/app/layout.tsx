import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { BottomNav } from "@/components/bottom-nav";
import { Wordmark } from "@/components/logo";
import { requireUser } from "@/lib/auth";
import { isStaff } from "@/lib/session";

export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();

  return (
    <div className="min-h-dvh bg-ink-100/70 pb-[76px]">
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/app" aria-label="Início">
            <Wordmark size={32} />
          </Link>

          {isStaff(session.role) && (
            <Link
              href="/painel"
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
            >
              <ClipboardList aria-hidden className="size-3.5" />
              Painel do professor
            </Link>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-5 pb-8">{children}</div>

      <BottomNav />
    </div>
  );
}
