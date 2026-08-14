"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Copy, KeyRound, Loader2, MessageCircle } from "lucide-react";

import { gerarSenhaTemporaria, type SenhaGerada } from "@/actions/painel";
import { Button } from "@/components/ui/button";
import { FormAlert } from "@/components/ui/field";

function Botao({ compacto }: { compacto?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size={compacto ? "sm" : "md"}
      variant={compacto ? "outline" : "primary"}
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <KeyRound aria-hidden className="size-4" />
          Gerar senha nova
        </>
      )}
    </Button>
  );
}

/**
 * Gera uma senha temporaria para um aluno que nao consegue entrar.
 *
 * Depois de gerada, a senha aparece na tela junto com um botao que abre o
 * WhatsApp do aluno com a mensagem pronta. Enquanto nao ha servico de envio de
 * e-mail, quem entrega a senha e o professor -- e o caminho mais curto para
 * isso e o WhatsApp, que ele ja usa com a turma.
 */
export function SenhaTemporaria({
  userId,
  compacto,
}: {
  userId: string;
  compacto?: boolean;
}) {
  const [state, formAction] = useActionState<SenhaGerada, FormData>(
    gerarSenhaTemporaria,
    {},
  );

  if (state.senha) {
    const telefone = state.telefone?.replace(/\D/g, "");
    const mensagem = encodeURIComponent(
      `Olá! Sua senha nova do app da Yeshua Jiu-Jitsu é: ${state.senha}\n\n` +
        `Entre em yeshuajiujitsu-eight.vercel.app e o app vai pedir para você criar uma senha só sua.`,
    );

    return (
      <div className="space-y-3 rounded-[10px] border border-success/25 bg-success/8 p-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
            Senha temporária de {state.nome}
          </p>
          <p className="mt-1 font-mono text-xl font-bold select-all">
            {state.senha}
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Ela aparece só desta vez. No primeiro acesso o app pede para o aluno
            criar uma senha própria.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => navigator.clipboard?.writeText(state.senha!)}
          >
            <Copy aria-hidden className="size-4" />
            Copiar
          </Button>

          {telefone && (
            <a
              href={`https://wa.me/55${telefone}?text=${mensagem}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-success px-3 text-sm font-semibold text-white transition-smooth hover:brightness-95"
            >
              <MessageCircle aria-hidden className="size-4" />
              Mandar no WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="userId" value={userId} />
      {state.error && <FormAlert>{state.error}</FormAlert>}
      <Botao compacto={compacto} />
    </form>
  );
}
