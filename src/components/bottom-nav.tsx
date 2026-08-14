"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  House,
  Swords,
  TrendingUp,
  Trophy,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

// Menu do celular: 5 itens, o limite antes de os alvos ficarem estreitos
// demais para o dedo.
const ITEMS: Item[] = [
  { href: "/app", label: "Início", icon: House, exact: true },
  { href: "/app/treinos", label: "Treinos", icon: Swords },
  { href: "/app/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/perfil", label: "Perfil", icon: UserRound },
];

// No computador a barra lateral e vertical e cabe mais: mensalidade e
// campeonatos saem de dentro do Perfil e ficam a um clique.
const ITEMS_LATERAL: Item[] = [
  ...ITEMS.slice(0, 4),
  { href: "/app/campeonatos", label: "Campeonatos", icon: Trophy },
  { href: "/app/financeiro", label: "Mensalidade", icon: Wallet },
  ITEMS[4],
];

function useIsActive() {
  const pathname = usePathname();
  return (item: Item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

/**
 * Quem so treina boxe nao tem faixa, entao a tela de Evolucao (que e toda
 * sobre graduacao) sai do menu -- em vez de aparecer vazia.
 */
function filtrar(itens: Item[], temGraduacao: boolean) {
  return temGraduacao
    ? itens
    : itens.filter((i) => i.href !== "/app/evolucao");
}

/** Barra lateral, usada no computador. */
export function AlunoSidebarNav({ temGraduacao = true }: { temGraduacao?: boolean }) {
  const isActive = useIsActive();

  return (
    <nav aria-label="Navegação principal" className="space-y-1">
      {filtrar(ITEMS_LATERAL, temGraduacao).map((item) => {
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

export function BottomNav({ temGraduacao = true }: { temGraduacao?: boolean }) {
  const pathname = usePathname();
  const itens = filtrar(ITEMS, temGraduacao);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg">
        {itens.map((item) => {
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
