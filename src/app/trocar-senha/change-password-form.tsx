"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";

import { changePassword, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Salvando...
        </>
      ) : (
        <>
          <Check aria-hidden className="size-4" />
          Salvar e continuar
        </>
      )}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<FormState, FormData>(
    changePassword,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert>{state.error}</FormAlert>

      <Field
        label="Nova senha"
        htmlFor="password"
        required
        hint="Pelo menos 6 caracteres."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </Field>

      <Field label="Repita a nova senha" htmlFor="confirm" required>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
      </Field>

      <SubmitButton />
    </form>
  );
}
