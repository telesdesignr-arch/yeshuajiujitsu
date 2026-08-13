import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

import { AlunoForm } from "./aluno-form";
import { requireStaff } from "@/lib/auth";

export const metadata: Metadata = { title: "Novo aluno" };

export default async function NovoAlunoPage() {
  await requireStaff();

  return (
    <div className="space-y-5">
      <Link
        href="/painel/alunos"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-smooth hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Voltar para alunos
      </Link>

      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Novo aluno
        </h1>
        <p className="text-sm text-ink-500">
          Só o nome, o e-mail e a data de entrada são obrigatórios. O resto pode
          ser preenchido depois.
        </p>
      </div>

      <p className="flex items-start gap-2.5 rounded-card border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
        <KeyRound aria-hidden className="mt-0.5 size-4 shrink-0" />
        <span>
          O aluno vai entrar com o e-mail dele e a senha inicial{" "}
          <strong className="font-bold">yeshua123</strong>. No primeiro acesso o
          app pede para ele criar uma senha só dele.
        </span>
      </p>

      <AlunoForm />
    </div>
  );
}
