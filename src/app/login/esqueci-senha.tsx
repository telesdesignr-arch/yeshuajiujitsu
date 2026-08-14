"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2 } from "lucide-react";

import { requestPasswordReset, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <KeyRound aria-hidden className="size-4" />
          Pedir senha nova
        </>
      )}
    </Button>
  );
}

export function EsqueciSenha() {
  const [state, formAction] = useActionState<FormState, FormData>(
    requestPasswordReset,
    {},
  );
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="cursor-pointer text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
      >
        Esqueci minha senha
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-3" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      {!state.success && (
        <>
          <Field
            label="Seu e-mail"
            htmlFor="rec-email"
            hint="O mesmo que você usa para entrar."
            required
          >
            <Input
              id="rec-email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </Field>
          <Enviar />
          <button
            type="button"
            onClick={() => setAberto(false)}
            className="cursor-pointer text-sm font-semibold text-ink-500 hover:text-ink"
          >
            Voltar
          </button>
        </>
      )}
    </form>
  );
}
