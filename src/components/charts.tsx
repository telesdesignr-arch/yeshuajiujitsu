import { cn } from "@/lib/utils";

/**
 * Graficos desenhados a mao em SVG/CSS.
 *
 * Optamos por nao usar biblioteca de graficos: os graficos aqui sao simples,
 * assim eles herdam as cores da marca, ficam acessiveis (cada um vem com uma
 * tabela equivalente para leitores de tela) e nao pesam no carregamento pelo
 * celular do aluno.
 */

export type BarDatum = {
  label: string;
  fullLabel?: string;
  value: number;
  /** valor de referencia (meta). Marca uma linha tracejada na coluna. */
  target?: number;
  highlight?: boolean;
};

export function BarChart({
  data,
  unit = "",
  caption,
  height = 132,
  className,
}: {
  data: BarDatum[];
  unit?: string;
  caption: string;
  height?: number;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.target ?? 0)));

  if (data.every((d) => d.value === 0)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[10px] border border-dashed border-line bg-ink-100/60 px-4 text-center text-sm text-ink-500",
          className,
        )}
        style={{ height }}
      >
        Ainda não há dados suficientes para montar este gráfico.
      </div>
    );
  }

  return (
    <figure className={className}>
      <div
        className="flex gap-1.5"
        style={{ height }}
        role="img"
        aria-label={caption}
      >
        {data.map((d, i) => {
          const h = (d.value / max) * 100;
          const targetH = d.target ? (d.target / max) * 100 : null;
          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col">
              <span
                className={cn(
                  "tabular mb-1 text-center text-[11px] font-bold",
                  d.highlight ? "text-brand-700" : "text-ink-500",
                )}
              >
                {d.value}
                {unit}
              </span>
              {/* flex-1 faz a área da barra ocupar toda a altura restante */}
              <div className="relative w-full flex-1">
                {targetH !== null && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 border-t border-dashed border-ink-300"
                    style={{ bottom: `${targetH}%` }}
                  />
                )}
                <span
                  className={cn(
                    "absolute inset-x-0 bottom-0 rounded-t-[4px]",
                    d.highlight ? "bg-brand-600" : "bg-ink-200",
                  )}
                  style={{ height: `${Math.max(h, 2)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between gap-1.5">
        {data.map((d, i) => (
          <span
            key={i}
            className={cn(
              "min-w-0 flex-1 truncate text-center text-[11px] font-semibold",
              d.highlight ? "text-ink" : "text-ink-500",
            )}
          >
            {d.label}
          </span>
        ))}
      </div>

      {/* Alternativa em texto para leitores de tela */}
      <figcaption className="sr-only">
        {caption}.{" "}
        {data
          .map((d) => `${d.fullLabel ?? d.label}: ${d.value}${unit}`)
          .join(", ")}
        .
      </figcaption>
    </figure>
  );
}

/* -------------------------------------------------------------------------- */

export type DistributionDatum = {
  label: string;
  value: number;
  color: string;
  /** cor da borda, para faixas claras que somem no branco */
  ring?: boolean;
};

/**
 * Distribuicao em barras horizontais. Escolhemos barras em vez de pizza
 * porque com 5 faixas a pizza fica dificil de comparar.
 */
export function DistributionBars({
  data,
  total,
  className,
}: {
  data: DistributionDatum[];
  total: number;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className={cn("space-y-2.5", className)}>
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
        return (
          <li key={d.label} className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-center gap-2">
              <span
                aria-hidden
                className={cn(
                  "size-3 shrink-0 rounded-[3px]",
                  d.ring && "ring-1 ring-ink-200",
                )}
                style={{ background: d.color }}
              />
              <span className="truncate text-sm font-semibold">{d.label}</span>
            </span>
            <span className="h-3 flex-1 overflow-hidden rounded-pill bg-ink-100">
              <span
                className="block h-full rounded-pill"
                style={{
                  width: `${(d.value / max) * 100}%`,
                  background: d.color,
                  border: d.ring ? "1px solid var(--color-ink-200)" : undefined,
                }}
              />
            </span>
            <span className="tabular w-16 shrink-0 text-right text-sm">
              <span className="font-bold">{d.value}</span>
              <span className="ml-1 text-xs text-ink-500">{pct}%</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
