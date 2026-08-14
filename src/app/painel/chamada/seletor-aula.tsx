"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

import { Field, Select } from "@/components/ui/field";
import { Input } from "@/components/ui/field";
import { hojeISO } from "@/lib/dates";
import { modalityLabel } from "@/lib/modalities";

/**
 * Escolha da data e da aula. Ao mudar qualquer um dos dois recarregamos a
 * pagina com os parametros na URL, para que a lista de alunos ja venha com a
 * chamada daquele dia marcada (e para o professor poder salvar o link).
 */
export function SeletorAula({
  date,
  scheduleId,
  aulas,
  modalidade,
  quantosAlunos,
}: {
  date: string;
  scheduleId: string;
  aulas: { id: string; label: string }[];
  modalidade?: string;
  quantosAlunos?: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function atualizar(chave: string, valor: string) {
    const novo = new URLSearchParams(params.toString());
    novo.set(chave, valor);
    if (chave === "data") novo.delete("aula"); // a grade muda com o dia
    startTransition(() => router.replace(`/painel/chamada?${novo.toString()}`));
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Dia da aula" htmlFor="data">
        <Input
          id="data"
          type="date"
          value={date}
          max={hojeISO()}
          onChange={(e) => atualizar("data", e.target.value)}
        />
      </Field>

      <Field
        label="Qual aula"
        htmlFor="aula"
        hint={
          aulas.length === 0
            ? "Não há aula cadastrada neste dia da semana."
            : undefined
        }
      >
        <div className="relative">
          <Select
            id="aula"
            value={scheduleId}
            disabled={aulas.length === 0}
            onChange={(e) => atualizar("aula", e.target.value)}
          >
            {aulas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
          {pending && (
            <Loader2
              aria-hidden
              className="absolute top-1/2 right-9 size-4 -translate-y-1/2 animate-spin text-ink-500"
            />
          )}
        </div>
      </Field>

      {modalidade && (
        <p className="sm:col-span-2 -mt-1 text-xs text-ink-500">
          Aula de <strong className="font-semibold">{modalityLabel(modalidade)}</strong>
          {typeof quantosAlunos === "number" &&
            ` · ${quantosAlunos} ${quantosAlunos === 1 ? "aluno treina" : "alunos treinam"} essa modalidade`}
        </p>
      )}
    </div>
  );
}
