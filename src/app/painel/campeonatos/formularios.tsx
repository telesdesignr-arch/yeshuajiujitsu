"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Medal as MedalIcon, Trophy } from "lucide-react";

import {
  addResult,
  createCompetition,
  type ActionState,
} from "@/actions/campeonatos";
import { BeltChip } from "@/components/belt";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/field";
import { MODALITIES, PLACEMENT_OPTIONS } from "@/lib/competitions";

function Enviar({
  label,
  loading,
  icon: Icon,
}: {
  label: string;
  loading: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" block disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {loading}
        </>
      ) : (
        <>
          <Icon aria-hidden className="size-4" />
          {label}
        </>
      )}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Novo campeonato                                                             */
/* -------------------------------------------------------------------------- */

export function CampeonatoForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createCompetition,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Nome do campeonato" htmlFor="cp-name" required>
        <Input
          id="cp-name"
          name="name"
          placeholder="Ex.: Copa Rio de Jiu-Jitsu 2026"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" htmlFor="cp-date" required>
          <Input id="cp-date" name="date" type="date" required />
        </Field>
        <Field label="Horário de início" htmlFor="cp-time">
          <Input id="cp-time" name="time" type="time" defaultValue="08:00" />
        </Field>
      </div>

      <Field
        label="Termina em"
        htmlFor="cp-end"
        hint="Só para campeonatos de mais de um dia."
      >
        <Input id="cp-end" name="endDate" type="date" />
      </Field>

      <Field label="Modalidade" htmlFor="cp-mod" required>
        <Select id="cp-mod" name="modality" defaultValue="GI" required>
          {Object.entries(MODALITIES).map(([key, m]) => (
            <option key={key} value={key}>
              {m.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Local" htmlFor="cp-local">
        <Input
          id="cp-local"
          name="location"
          placeholder="Ex.: Tijuca Tênis Clube — Rio de Janeiro"
        />
      </Field>

      <Field label="Organização" htmlFor="cp-org" hint="IBJJF, CBJJ, federação...">
        <Input id="cp-org" name="organizer" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Inscrições até" htmlFor="cp-prazo">
          <Input id="cp-prazo" name="registrationDeadline" type="date" />
        </Field>
        <Field label="Link de inscrição" htmlFor="cp-link">
          <Input
            id="cp-link"
            name="registrationUrl"
            type="url"
            placeholder="https://"
          />
        </Field>
      </div>

      <Field
        label="Imagem do campeonato"
        htmlFor="cp-img"
        hint="No site da federação, clique com o botão direito no cartaz do campeonato e escolha “Copiar endereço da imagem”. Cole aqui."
      >
        <Input
          id="cp-img"
          name="imageUrl"
          type="url"
          placeholder="https://..."
        />
      </Field>

      <Field
        label="Informações"
        htmlFor="cp-desc"
        hint="Categorias, pesagem, o que levar, horário de chegada."
      >
        <Textarea id="cp-desc" name="description" rows={3} />
      </Field>

      <Enviar
        label="Publicar campeonato"
        loading="Publicando..."
        icon={Trophy}
      />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Registrar resultado                                                         */
/* -------------------------------------------------------------------------- */

export type AtletaOpcao = {
  id: string;
  name: string;
  belt: string;
  degree: number;
};

export function ResultadoForm({
  competitionId,
  atletas,
  modalidadeCampeonato,
}: {
  competitionId: string;
  atletas: AtletaOpcao[];
  modalidadeCampeonato: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(addResult, {});
  const [studentId, setStudentId] = useState("");

  const escolhido = atletas.find((a) => a.id === studentId);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="competitionId" value={competitionId} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Atleta" htmlFor="rs-aluno" required>
        <Select
          id="rs-aluno"
          name="studentId"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        >
          <option value="">Escolha o atleta</option>
          {atletas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>

      {escolhido && (
        <div className="rounded-[10px] bg-ink-100 px-3 py-2">
          <BeltChip belt={escolhido.belt} degree={escolhido.degree} size="sm" />
        </div>
      )}

      <Field label="Resultado" htmlFor="rs-pos" required>
        <Select id="rs-pos" name="placement" defaultValue="1" required>
          {PLACEMENT_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Categoria"
        htmlFor="rs-cat"
        hint="Como estava na chave. Ex.: Azul · Adulto · Médio, ou Absoluto."
      >
        <Input id="rs-cat" name="category" placeholder="Azul · Adulto · Médio" />
      </Field>

      <Field label="Modalidade" htmlFor="rs-mod" required>
        <Select
          id="rs-mod"
          name="modality"
          defaultValue={modalidadeCampeonato === "NOGI" ? "NOGI" : "GI"}
          required
        >
          <option value="GI">Com kimono (Gi)</option>
          <option value="NOGI">Sem kimono (No-Gi)</option>
        </Select>
      </Field>

      <Field
        label="Observações"
        htmlFor="rs-notes"
        hint="Aparece no histórico do atleta."
      >
        <Textarea
          id="rs-notes"
          name="notes"
          rows={2}
          placeholder="Ex.: finalizou as três lutas por armlock."
        />
      </Field>

      <p className="text-xs text-ink-500">
        Se o atleta lutou no peso e no absoluto, registre um resultado para cada.
      </p>

      <Enviar
        label="Registrar resultado"
        loading="Registrando..."
        icon={MedalIcon}
      />
    </form>
  );
}
