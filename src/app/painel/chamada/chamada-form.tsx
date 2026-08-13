"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, Save, Search, Users } from "lucide-react";

import { saveAttendance, type ActionState } from "@/actions/painel";
import { BeltChip } from "@/components/belt";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Textarea } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

export type AlunoDaChamada = {
  id: string;
  name: string;
  photoUrl: string | null;
  belt: string;
  degree: number;
};

function BotaoSalvar({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Salvando chamada...
        </>
      ) : (
        <>
          <Save aria-hidden className="size-4" />
          Salvar chamada · {total} {total === 1 ? "presente" : "presentes"}
        </>
      )}
    </Button>
  );
}

export function ChamadaForm({
  date,
  scheduleId,
  alunos,
  presentesIniciais,
  tecnicasIniciais,
}: {
  date: string;
  scheduleId: string;
  alunos: AlunoDaChamada[];
  presentesIniciais: string[];
  tecnicasIniciais: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveAttendance,
    {},
  );
  const [presentes, setPresentes] = useState<Set<string>>(
    () => new Set(presentesIniciais),
  );
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return alunos;
    return alunos.filter((a) => a.name.toLowerCase().includes(termo));
  }, [alunos, busca]);

  function alternar(id: string) {
    setPresentes((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="scheduleId" value={scheduleId} />
      {[...presentes].map((id) => (
        <input key={id} type="hidden" name="presente" value={id} />
      ))}

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      {/* Busca e ações em massa */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-auto sm:flex-1">
          <Search
            aria-hidden
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500"
          />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aluno"
            aria-label="Buscar aluno pelo nome"
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={() => setPresentes(new Set(alunos.map((a) => a.id)))}
        >
          <Users aria-hidden className="size-4" />
          Todos
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => setPresentes(new Set())}
        >
          Limpar
        </Button>
      </div>

      {/* Lista de alunos */}
      <ul className="overflow-hidden rounded-card border border-line bg-white">
        {filtrados.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-ink-500">
            Nenhum aluno encontrado com esse nome.
          </li>
        )}
        {filtrados.map((aluno, i) => {
          const marcado = presentes.has(aluno.id);
          return (
            <li key={aluno.id} className={i > 0 ? "border-t border-line" : ""}>
              <button
                type="button"
                onClick={() => alternar(aluno.id)}
                aria-pressed={marcado}
                className={cn(
                  "flex min-h-[64px] w-full cursor-pointer items-center gap-3 px-4 text-left transition-smooth",
                  marcado ? "bg-brand-50" : "hover:bg-ink-100/60",
                )}
              >
                <Avatar name={aluno.name} src={aluno.photoUrl} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{aluno.name}</span>
                  <BeltChip belt={aluno.belt} degree={aluno.degree} size="sm" />
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-smooth",
                    marcado
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink-200 bg-white",
                  )}
                >
                  {marcado && <Check className="size-4" strokeWidth={3} />}
                </span>
                <span className="sr-only">
                  {marcado ? "Presente" : "Ausente"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Field
        label="Técnicas ensinadas"
        htmlFor="techniques"
        hint="Aparece no histórico de treinos de quem esteve na aula."
      >
        <Textarea
          id="techniques"
          name="techniques"
          defaultValue={tecnicasIniciais}
          rows={3}
          placeholder="Ex.: Passagem de guarda com pressão · joelho na barriga"
        />
      </Field>

      <div className="sticky bottom-[70px] z-20 lg:bottom-4">
        <BotaoSalvar total={presentes.size} />
      </div>
    </form>
  );
}
