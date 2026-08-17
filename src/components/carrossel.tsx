"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { FotoDaAcademia } from "@/lib/midia-gerada";
import { cn } from "@/lib/utils";

/**
 * Carrossel de fotos da academia.
 *
 * A rolagem e a nativa do navegador com scroll-snap, e nao uma biblioteca:
 *  - no celular o dedo ja arrasta, que e como as pessoas esperam
 *  - funciona com teclado e leitor de tela sem nada a mais
 *  - nao carrega JavaScript de terceiros so para deslizar imagem
 *
 * As setas e as bolinhas so guiam a mesma rolagem; se o JavaScript falhar, a
 * tira de fotos continua arrastavel.
 */
export function Carrossel({ fotos }: { fotos: FotoDaAcademia[] }) {
  const tiraRef = useRef<HTMLUListElement>(null);
  const [atual, setAtual] = useState(0);

  const irPara = useCallback((i: number) => {
    const tira = tiraRef.current;
    const alvo = tira?.children[i] as HTMLElement | undefined;
    if (!tira || !alvo) return;
    tira.scrollTo({ left: alvo.offsetLeft - tira.offsetLeft, behavior: "smooth" });
  }, []);

  // Descobre qual foto está no meio da janela para acender a bolinha certa.
  useEffect(() => {
    const tira = tiraRef.current;
    if (!tira) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.i);
            if (!Number.isNaN(i)) setAtual(i);
          }
        }
      },
      { root: tira, threshold: 0.6 },
    );

    for (const filho of Array.from(tira.children)) observador.observe(filho);
    return () => observador.disconnect();
  }, [fotos.length]);

  if (fotos.length === 0) return null;

  return (
    <div className="relative">
      <ul
        ref={tiraRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Fotos da academia"
      >
        {fotos.map((foto, i) => (
          <li
            key={foto.src}
            data-i={i}
            className="w-[86%] shrink-0 snap-center sm:w-[48%] lg:w-[32%]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.src}
              alt={foto.alt}
              loading={i < 2 ? "eager" : "lazy"}
              decoding="async"
              className="aspect-[4/3] w-full rounded-card border border-line bg-ink-100 object-cover"
            />
          </li>
        ))}
      </ul>

      {fotos.length > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" role="tablist">
            {fotos.map((foto, i) => (
              <button
                key={foto.src}
                type="button"
                role="tab"
                aria-selected={i === atual}
                aria-label={`Foto ${i + 1} de ${fotos.length}`}
                onClick={() => irPara(i)}
                className={cn(
                  "h-1.5 cursor-pointer rounded-pill transition-smooth",
                  i === atual ? "w-6 bg-brand-600" : "w-1.5 bg-ink-200 hover:bg-ink-300",
                )}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <Seta
              direcao="anterior"
              onClick={() => irPara(Math.max(0, atual - 1))}
              desativada={atual === 0}
            />
            <Seta
              direcao="proxima"
              onClick={() => irPara(Math.min(fotos.length - 1, atual + 1))}
              desativada={atual === fotos.length - 1}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Seta({
  direcao,
  onClick,
  desativada,
}: {
  direcao: "anterior" | "proxima";
  onClick: () => void;
  desativada: boolean;
}) {
  const Icone = direcao === "anterior" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativada}
      aria-label={direcao === "anterior" ? "Foto anterior" : "Próxima foto"}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white text-ink transition-smooth hover:bg-ink-100 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white"
    >
      <Icone aria-hidden className="size-5" />
    </button>
  );
}
