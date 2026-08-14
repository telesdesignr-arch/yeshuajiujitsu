"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Registra o service worker e convida a instalar o app na tela inicial.
 *
 * Android e iPhone funcionam de formas diferentes e nao ha como unificar:
 *
 *  - No Android/Chrome o navegador avisa quando a instalacao e possivel
 *    (evento beforeinstallprompt) e nos abrimos a caixa de instalacao.
 *  - No iPhone nao existe esse evento. A Apple exige que a pessoa faca pelo
 *    menu Compartilhar do Safari, entao aqui so da para ensinar o caminho.
 *
 * O convite some sozinho quando o app ja esta instalado, e fica escondido por
 * 30 dias se a pessoa dispensar.
 */

const CHAVE_DISPENSA = "yeshua:convite-instalar-dispensado";
const DIAS_ESCONDIDO = 30;

type PromptDeInstalacao = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstalarApp() {
  const [prompt, setPrompt] = useState<PromptDeInstalacao | null>(null);
  const [ehIphone, setEhIphone] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    // Registra o service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sem service worker o app continua funcionando normalmente,
        // só não abre offline. Não vale incomodar o usuário com isso.
      });
    }

    // Já está instalado? Não precisa convidar.
    const jaInstalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      // Safari do iPhone usa uma propriedade própria
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
    if (jaInstalado) return;

    // Dispensou faz pouco tempo?
    const dispensadoEm = Number(localStorage.getItem(CHAVE_DISPENSA) ?? 0);
    const diasDesde = (Date.now() - dispensadoEm) / 86_400_000;
    if (dispensadoEm && diasDesde < DIAS_ESCONDIDO) return;

    const iOS =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      // iPad moderno se identifica como Mac; o toque o entrega
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    if (iOS) {
      setEhIphone(true);
      setVisivel(true);
      return;
    }

    function aoPoderInstalar(e: Event) {
      e.preventDefault();
      setPrompt(e as PromptDeInstalacao);
      setVisivel(true);
    }

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    return () =>
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
  }, []);

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSA, String(Date.now()));
    setVisivel(false);
  }

  async function instalar() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setVisivel(false);
    else dispensar();
  }

  if (!visivel) return null;

  return (
    <div className="relative mb-5 rounded-card border border-brand-200 bg-brand-50 p-4">
      <button
        type="button"
        onClick={dispensar}
        aria-label="Dispensar convite de instalação"
        className="absolute top-2 right-2 flex size-9 cursor-pointer items-center justify-center rounded-[8px] text-brand-700 transition-smooth hover:bg-brand-100"
      >
        <X aria-hidden className="size-4" />
      </button>

      <p className="pr-8 font-display text-base font-bold tracking-wide text-brand-800 uppercase">
        Deixe a Yeshua na tela do celular
      </p>

      {ehIphone ? (
        <>
          <p className="mt-1.5 text-sm text-brand-800">
            Abre igual a um aplicativo, sem a barra do navegador.
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-brand-800">
            <li className="flex items-center gap-2">
              <Share aria-hidden className="size-4 shrink-0" />
              1. Toque em <strong>Compartilhar</strong>, na barra de baixo
            </li>
            <li className="flex items-center gap-2">
              <SquarePlus aria-hidden className="size-4 shrink-0" />
              2. Escolha <strong>Adicionar à Tela de Início</strong>
            </li>
          </ol>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-brand-800">
            Abre igual a um aplicativo, sem a barra do navegador, e carrega mais
            rápido.
          </p>
          <Button onClick={instalar} className="mt-3">
            <Download aria-hidden className="size-4" />
            Instalar aplicativo
          </Button>
        </>
      )}
    </div>
  );
}
