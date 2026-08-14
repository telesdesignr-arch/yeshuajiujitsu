import type { Metadata } from "next";
import { WifiOff } from "lucide-react";

import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Sem conexão" };

/**
 * Mostrada quando o celular esta sem internet e o app foi aberto pela tela
 * inicial. Nao tentamos adivinhar nada nem mostrar dado guardado: numa tela de
 * chamada ou de mensalidade, informacao velha disfarcada de atual e pior do
 * que assumir que nao da para carregar agora.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo size={72} />

      <span className="mt-8 flex size-14 items-center justify-center rounded-full bg-ink-100 text-ink-500">
        <WifiOff aria-hidden className="size-6" />
      </span>

      <h1 className="mt-5 font-display text-3xl font-bold tracking-wide uppercase">
        Sem conexão
      </h1>

      <p className="mt-2 max-w-sm text-ink-500">
        O celular está sem internet agora. Assim que a conexão voltar, é só
        puxar a tela para baixo para atualizar.
      </p>

      <p className="mt-8 max-w-sm text-sm text-ink-500">
        Preferimos avisar a mostrar informação antiga: numa tela de presença ou
        de mensalidade, dado velho parecendo atual causa mais confusão do que
        ajuda.
      </p>
    </main>
  );
}
