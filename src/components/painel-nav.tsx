"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const ITEMS: Item[] = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/painel/chamada", label: "Chamada", icon: ClipboardCheck },
  { href: "/painel/alunos", label: "Alunos", icon: Users },
  { href: "/painel/graduacoes", label: "Graduações", icon: GraduationCap },
  { href: "/painel/agenda", label: "Agenda", icon: CalendarDays },
];

function useActive() {
  const pathname = usePathname();
  return (item: Item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/** Menu inferior, usado no celular. */
export function PainelBottomNav() {
  const isActive = useActive();

  return (
    <nav
      aria-label="Navegação do painel"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 pt-1.5 pb-1 transition-smooth active:scale-95",
                  active ? "text-brand-700" : "text-ink-500",
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
                <span className="w-full truncate text-center text-[10.5px] leading-none font-semibold">
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

/** Menu lateral, usado no computador. */
export function PainelSidebarNav() {
  const isActive = useActive();

  return (
    <nav aria-label="Navegação do painel" className="space-y-1">
      {ITEMS.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 font-semibold transition-smooth",
              active
                ? "bg-ink text-white"
                : "text-ink-500 hover:bg-ink-100 hover:text-ink",
            )}
          >
            <Icon aria-hidden className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
