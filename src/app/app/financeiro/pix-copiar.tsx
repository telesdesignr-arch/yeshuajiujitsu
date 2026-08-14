"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Botao de copiar a chave Pix.
 *
 * Cair no clipboard e o unico passo do pagamento que o sistema controla: dai
 * em diante o aluno vai para o banco dele. Por isso o retorno visual importa
 * -- sem ele, a pessoa clica tres vezes sem saber se copiou.
 */
export function PixCopiar({ chave }: { chave: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(chave);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Navegador antigo ou sem permissão: o aluno seleciona e copia à mão.
      setCopiado(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="rounded-[10px] border border-line bg-white px-3 py-2.5 font-mono text-sm break-all select-all">
        {chave}
      </p>
      <Button type="button" onClick={copiar} block variant={copiado ? "success" : "primary"}>
        {copiado ? (
          <>
            <Check aria-hidden className="size-4" />
            Chave copiada
          </>
        ) : (
          <>
            <Copy aria-hidden className="size-4" />
            Copiar chave Pix
          </>
        )}
      </Button>
    </div>
  );
}
