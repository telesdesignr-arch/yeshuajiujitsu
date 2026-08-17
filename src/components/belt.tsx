import {
  beltInfo,
  beltsDaTrilha,
  graduationLabel,
  TRACK_LABEL,
  type Track,
} from "@/lib/belts";
import { cn } from "@/lib/utils";

/**
 * Opcoes de faixa para um <select>, separadas por escada.
 * Assim o professor nao corre o risco de dar uma faixa azul adulta para uma
 * crianca de 9 anos so porque as duas listas estavam misturadas.
 */
export function BeltSelectOptions() {
  const trilhas: Track[] = ["ADULTO", "INFANTIL"];
  return (
    <>
      {trilhas.map((t) => (
        <optgroup key={t} label={TRACK_LABEL[t]}>
          {beltsDaTrilha(t).map((b) => (
            <option key={b.key} value={b.key}>
              {b.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}

/**
 * Desenho da faixa.
 *
 * Faixas de nome composto ("Verde e Preta") tem uma listra da segunda cor que
 * corre de ponta a ponta pelo meio da faixa. A ponteira fica sobre ela, como
 * na faixa de verdade, e sobra um pedaco de faixa depois dela.
 *
 * Ponteira preta nas faixas coloridas; vermelha na faixa preta, como manda a
 * tradicao do Jiu-Jitsu.
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
  // Ponteira vermelha na preta e na coral, preta nas coloridas -- como manda a
  // tradição do Jiu-Jitsu.
  const pontaVermelha = info.key === "PRETA" || info.key === "CORAL";
  const tipColor = pontaVermelha ? "#a4161a" : "#111111";

  // Faixas claras somem no fundo branco: ganham um contorno discreto.
  const claras = ["#f2f0ed", "#f2c009"];
  const outline = claras.includes(info.color)
    ? "rgba(20,16,13,0.22)"
    : "rgba(20,16,13,0.10)";

  // As marcas contam o avanço DENTRO da faixa. Na coral, que já entra como 7º
  // grau, isso dá zero marcas -- e está certo: ali a faixa é a graduação.
  const stripes = Math.max(
    0,
    Math.min(info.maxDegree, degree) - info.minDegree,
  );

  // A faixa e montada com elementos reais, e nao com um SVG esticado.
  //
  // Antes o desenho era um SVG com preserveAspectRatio="none", esticado para
  // preencher a largura. O problema: o mesmo grau saia com proporcao 1:6 no
  // celular e 1:2,7 num cartao largo -- ou seja, gordo e quadrado onde havia
  // espaco sobrando. Aqui a espessura e o espacamento dos graus sao medidos em
  // pixels a partir da altura da faixa, entao a proporcao nunca muda.
  const grauW = Math.max(3, Math.round(height * 0.15));
  const grauGap = Math.max(4, Math.round(height * 0.22));
  const grauMargem = Math.max(5, Math.round(height * 0.3));

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[2px] ring-1 ring-inset",
        className,
      )}
      style={{ height, background: info.color, ["--tw-ring-color" as string]: outline }}
      role="img"
      aria-label={graduationLabel(belt, degree)}
    >
      {/* listra central, de ponta a ponta */}
      {info.stripe && (
        <span
          aria-hidden
          className="absolute inset-x-0"
          style={{ background: info.stripe, top: "33%", height: "34%" }}
        />
      )}

      {/* ponteira, com os graus cobrindo-a de cima a baixo */}
      <span
        aria-hidden
        className="absolute inset-y-0 flex items-stretch justify-end"
        style={{
          left: "70%",
          right: "10%",
          background: tipColor,
          gap: grauGap,
          paddingRight: grauMargem,
        }}
      >
        {Array.from({ length: stripes }).map((_, i) => (
          <span key={i} style={{ width: grauW, background: "#ffffff" }} />
        ))}
      </span>
    </div>
  );
}

/** Versao compacta: amostra da faixa + nome. Usada em listas. */
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
  const lado = size === "sm" ? 12 : 14;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border border-line bg-white font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
        className,
      )}
    >
      <svg
        aria-hidden
        width={lado}
        height={lado}
        viewBox="0 0 14 14"
        className="shrink-0 rounded-[2px]"
      >
        <rect width="14" height="14" fill={info.color} />
        {info.stripe && <rect y="5" width="14" height="4" fill={info.stripe} />}
        <rect
          x="0.5"
          y="0.5"
          width="13"
          height="13"
          fill="none"
          stroke="rgba(20,16,13,0.25)"
        />
      </svg>
      <span className="whitespace-nowrap">{info.label}</span>
      {degree > 0 && <span className="tabular text-ink-500">{degree}º</span>}
    </span>
  );
}

/**
 * Marcas de grau da faixa, preenchidas conforme a graduacao atual.
 *
 * Quantas marcas aparecem depende da faixa: quatro nas coloridas, seis na
 * preta. Na coral nao aparece nenhuma, porque a propria faixa e o grau.
 */
export function DegreeDots({
  belt = "BRANCA",
  degree,
  className,
}: {
  belt?: string;
  degree: number;
  className?: string;
}) {
  const info = beltInfo(belt);
  const total = info.maxDegree - info.minDegree;
  const preenchidas = Math.max(0, Math.min(info.maxDegree, degree) - info.minDegree);

  if (total === 0) return null;

  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      aria-label={`${preenchidas} de ${total} graus`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "block h-3.5 w-1.5 rounded-[1px]",
            i < preenchidas ? "bg-ink" : "bg-ink-200",
          )}
        />
      ))}
    </span>
  );
}
