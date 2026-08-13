import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangePasswordForm } from "./change-password-form";
import { Wordmark } from "@/components/logo";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Criar sua senha" };

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Wordmark size={52} className="mb-8" />

        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          {session.mustChangePassword ? "Crie sua senha" : "Trocar senha"}
        </h1>
        <p className="mt-1 mb-7 text-ink-500">
          {session.mustChangePassword
            ? `Bem-vindo, ${session.name.split(" ")[0]}! Escolha uma senha só sua para continuar.`
            : "Escolha uma nova senha para a sua conta."}
        </p>

        <ChangePasswordForm />
      </div>
    </main>
  );
}
