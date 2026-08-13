import { beltInfo, graduationLabel, MAX_DEGREE } from "@/lib/belts";
import { cn } from "@/lib/utils";

/**
 * Desenho da faixa com a ponteira e os graus.
 * Faixas coloridas usam ponteira preta; a faixa preta usa ponteira vermelha,
 * como manda a tradicao do Jiu-Jitsu.
 */
export function BeltBar({
  belt,
  degree,
  className,
  height = 34,
}: {
  belt: string;
  degree: number;
  className?: string;
  height?: number;
}) {
  const info = beltInfo(belt);
  const isBlack = info.key === "PRETA";
  const tipColor = isBlack ? "#a4161a" : "#111111";
  const bodyStroke = info.key === "BRANCA" ? "#cdc7bf" : "rgba(0,0,0,0.18)";

  const stripes = Math.max(0, Math.min(MAX_DEGREE, degree));
  const stripeWidth = 7;
  const stripeGap = 6;
  const tipStart = 122;
  const tipEnd = 198;

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox="0 0 200 40"
        preserveAspectRatio="none"
        style={{ height, width: "100%" }}
        role="img"
        aria-label={graduationLabel(belt, degree)}
      >
        <rect
          x="1"
          y="1"
          width="198"
          height="38"
          rx="5"
          fill={info.color}
          stroke={bodyStroke}
          strokeWidth="1.5"
        />
        <rect
          x={tipStart}
          y="1"
          width={tipEnd - tipStart}
          height="38"
          rx="5"
          fill={tipColor}
        />
        {/* costura da faixa */}
        <line
          x1="6"
          y1="20"
          x2={tipStart - 4}
          y2="20"
          stroke={info.key === "BRANCA" ? "#d8d2c9" : "rgba(255,255,255,0.16)"}
          strokeWidth="1"
          strokeDasharray="5 4"
        />
        {Array.from({ length: stripes }).map((_, i) => (
          <rect
            key={i}
            x={tipEnd - 10 - i * (stripeWidth + stripeGap) - stripeWidth}
            y="5"
            width={stripeWidth}
            height="30"
            rx="1.5"
            fill="#ffffff"
          />
        ))}
      </svg>
    </div>
  );
}

/** Versao compacta: bolinha da cor da faixa + texto. Usada em listas. */
export function BeltChip({
  belt,
  degree,
  className,
  size = "md",
}: {
  belt: string;
  degree: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const info = beltInfo(belt);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-line bg-white font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <span
        aria-hidden
        className="inline-block shrink-0 rounded-[2px] ring-1 ring-black/15"
        style={{
          background: info.color,
          width: size === "sm" ? 10 : 12,
          height: size === "sm" ? 10 : 12,
        }}
      />
      <span>{info.label}</span>
      {degree > 0 && (
        <span className="tabular text-ink-500">{degree}º</span>
      )}
    </span>
  );
}

/** Quatro marcas de grau, preenchidas conforme a graduacao atual. */
export function DegreeDots({
  degree,
  className,
}: {
  degree: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`${degree} de ${MAX_DEGREE} graus`}
    >
      {Array.from({ length: MAX_DEGREE }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "block h-3.5 w-1.5 rounded-[1px]",
            i < degree ? "bg-ink" : "bg-ink-200",
          )}
        />
      ))}
    </span>
  );
}
