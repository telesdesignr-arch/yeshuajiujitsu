"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  House,
  Swords,
  TrendingUp,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const ITEMS: Item[] = [
  { href: "/app", label: "Início", icon: House, exact: true },
  { href: "/app/treinos", label: "Treinos", icon: Swords },
  { href: "/app/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/perfil", label: "Perfil", icon: UserRound },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 pt-1.5 pb-1 transition-smooth active:scale-95",
                  active ? "text-brand-700" : "text-ink-500 hover:text-ink",
                )}
              >
                <span className="relative">
                  <Icon
                    aria-hidden
                    className="size-[22px]"
                    strokeWidth={active ? 2.4 : 1.9}
                  />
                  {active && (
                    <span className="absolute -top-2.5 left-1/2 h-1 w-6 -translate-x-1/2 rounded-pill bg-brand-600" />
                  )}
                </span>
                <span className="text-[11px] leading-none font-semibold">
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
