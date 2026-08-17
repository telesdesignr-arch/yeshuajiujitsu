"use client";

import { useEffect, useRef, useState } from "react";

import type { VideoDoTopo } from "@/lib/midia-gerada";

/**
 * Video de fundo do topo do site.
 *
 * Regras que fazem ele funcionar como fundo, e nao como um player:
 *  - mudo, em loop e sem controles. Video com som que comeca sozinho e o tipo
 *    de coisa que faz a pessoa fechar a aba.
 *  - playsInline: sem isso o iPhone abre o video em tela cheia sozinho.
 *  - preload="none" ate a tela aparecer, para nao gastar a internet de quem
 *    entra pelo celular e nem chega a rolar ate aqui.
 *  - quem desligou animacao no sistema ve so a imagem parada.
 */
export function VideoTopo({ video }: { video: VideoDoTopo }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [tocar, setTocar] = useState(false);

  useEffect(() => {
    const semAnimacao = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (semAnimacao) return;

    // Conexao lenta ou modo de economia: fica so no poster.
    const conexao = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (conexao?.saveData) return;
    if (conexao?.effectiveType && /2g/.test(conexao.effectiveType)) return;

    setTocar(true);
  }, []);

  useEffect(() => {
    if (!tocar) return;
    // O autoplay pode ser recusado pelo navegador; nesse caso o poster fica.
    ref.current?.play().catch(() => {});
  }, [tocar]);

  return (
    <video
      ref={ref}
      aria-hidden
      tabIndex={-1}
      muted
      loop
      playsInline
      preload={tocar ? "auto" : "none"}
      poster={video.poster ?? undefined}
      className="absolute inset-0 size-full object-cover"
    >
      {tocar &&
        video.fontes.map((f) => <source key={f.src} src={f.src} type={f.type} />)}
    </video>
  );
}
