import { Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cartaz do campeonato.
 *
 * Duas decisoes que valem explicar:
 *
 * 1. <img> comum, e nao next/image. O endereco vem do site da federacao, e o
 *    next/image exige declarar cada dominio permitido antes. Uma federacao
 *    nova quebraria a imagem ate alguem editar a configuracao -- e quem
 *    cadastra e o professor, nao um programador.
 *
 * 2. A imagem aparece inteira (object-contain), nunca cortada. Os cartazes vem
 *    em formatos muito diferentes: a IBJJF usa logo quadrado, a FJJRIO usa
 *    banner deitado. Cortar esconderia justamente data, categorias e prazo de
 *    inscricao. A sobra e preenchida com a propria imagem desfocada, para nao
 *    ficar tarja cinza dos lados.
 *
 * A proporcao fica reservada pelo container, entao a pagina nao "pula" quando
 * a imagem termina de carregar.
 */
export function CompetitionImage({
  src,
  alt,
  className,
  ratio = "16 / 9",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  ratio?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-ink-100 text-ink-300",
          className,
        )}
        style={{ aspectRatio: ratio }}
        aria-hidden
      >
        <Trophy className="size-8" />
      </div>
    );
  }

  return (
    <div
      className={cn("relative overflow-hidden bg-ink-100", className)}
      style={{ aspectRatio: ratio }}
    >
      {/* fundo: a propria imagem, ampliada e desfocada */}
      <div
        aria-hidden
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-xl"
        style={{ backgroundImage: `url("${src}")` }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="relative size-full object-contain"
      />
    </div>
  );
}
