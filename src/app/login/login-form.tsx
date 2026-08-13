"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { login, type FormState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input } from "@/components/ui/field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Entrando...
        </>
      ) : (
        <>
          <LogIn aria-hidden className="size-4" />
          Entrar
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<FormState, FormData>(login, {});
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert>{state.error}</FormAlert>

      <Field label="E-mail" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="seu@email.com"
          required
        />
      </Field>

      <Field label="Senha" htmlFor="password" required>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Sua senha"
            className="pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center text-ink-500 hover:text-ink"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-[18px]" />
            ) : (
              <Eye aria-hidden className="size-[18px]" />
            )}
          </button>
        </div>
      </Field>

      <SubmitButton />
    </form>
  );
}
