import { placementInfo } from "@/lib/competitions";
import { cn } from "@/lib/utils";

/**
 * Medalha desenhada em SVG -- e nao um emoji.
 *
 * Emoji muda de forma em cada sistema operacional e nao obedece as cores da
 * marca. Aqui a fita usa o marrom da academia e o disco a cor do metal.
 */
export function Medal({
  placement,
  size = 28,
  className,
}: {
  placement: number;
  size?: number;
  className?: string;
}) {
  const info = placementInfo(placement);
  if (!info.color) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={info.label}
    >
      {/* fita */}
      <path d="M7 1.5 L10.5 9 L7.5 10.5 L4 3 Z" fill="var(--color-brand-600)" />
      <path d="M17 1.5 L13.5 9 L16.5 10.5 L20 3 Z" fill="var(--color-brand-700)" />
      {/* disco */}
      <circle cx="12" cy="16" r="6.6" fill={info.color} />
      <circle
        cx="12"
        cy="16"
        r="6.6"
        fill="none"
        stroke="rgba(20,16,13,0.28)"
        strokeWidth="0.9"
      />
      <circle cx="12" cy="16" r="4.1" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="0.9" />
    </svg>
  );
}

/** Contagem compacta: 2 ouro, 1 prata, 3 bronze. */
export function MedalTallyRow({
  ouro,
  prata,
  bronze,
  size = 22,
  className,
}: {
  ouro: number;
  prata: number;
  bronze: number;
  size?: number;
  className?: string;
}) {
  const linhas = [
    { placement: 1, valor: ouro, nome: "ouro" },
    { placement: 2, valor: prata, nome: "prata" },
    { placement: 3, valor: bronze, nome: "bronze" },
  ];

  return (
    <ul className={cn("flex items-center gap-4", className)}>
      {linhas.map((l) => (
        <li key={l.nome} className="flex items-center gap-1.5">
          <Medal placement={l.placement} size={size} />
          <span className="tabular font-display text-lg leading-none font-bold">
            {l.valor}
          </span>
          <span className="sr-only">
            {l.valor} {l.nome}
          </span>
        </li>
      ))}
    </ul>
  );
}
