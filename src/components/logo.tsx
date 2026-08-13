import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Marca da academia.
 *
 * Hoje usa /public/logo.svg, que e uma reconstrucao do emblema.
 * Assim que o arquivo original chegar, basta salvar por cima de
 * public/logo.svg (ou trocar o caminho aqui para /logo.png).
 */
export function Logo({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo.svg"
      alt="Yeshua Jiu-Jitsu"
      width={size}
      height={size}
      priority
      className={cn("shrink-0", className)}
    />
  );
}

/** Logo + nome da academia, usado nos cabecalhos. */
export function Wordmark({
  size = 40,
  invert = false,
  className,
}: {
  size?: number;
  invert?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Logo size={size} />
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-lg font-bold tracking-[0.14em] uppercase",
            invert ? "text-white" : "text-ink",
          )}
        >
          Yeshua
        </span>
        <span
          className={cn(
            "block font-display text-[11px] font-semibold tracking-[0.22em] uppercase",
            invert ? "text-brand-300" : "text-brand-600",
          )}
        >
          Jiu-Jitsu
        </span>
      </span>
    </span>
  );
}
