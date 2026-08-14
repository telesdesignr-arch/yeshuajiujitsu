"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Medal as MedalIcon, Save, Trophy } from "lucide-react";

import {
  addResult,
  saveCompetition,
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

/** Valores que ja estao salvos, quando o professor esta editando. */
export type CampeonatoSalvo = {
  id: string;
  name: string;
  /** "2026-10-14" */
  date: string;
  /** "08:00" */
  time: string;
  endDate: string;
  location: string;
  organizer: string;
  modality: string;
  registrationUrl: string;
  registrationDeadline: string;
  description: string;
  imageUrl: string;
};

/**
 * Serve para cadastrar e para editar. Quando recebe `campeonato`, os campos ja
 * vem preenchidos e um campo escondido leva o id junto, o que faz a action
 * salvar por cima em vez de criar outro.
 */
export function CampeonatoForm({
  campeonato,
}: {
  campeonato?: CampeonatoSalvo;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveCompetition,
    {},
  );

  const editando = Boolean(campeonato);
  // Prefixo dos ids: no modo edicao os dois formularios podem existir na mesma
  // pagina, e ids repetidos quebrariam o clique no rotulo do campo.
  const p = editando ? "ed-cp" : "cp";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {campeonato && (
        <input type="hidden" name="competitionId" value={campeonato.id} />
      )}

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Nome do campeonato" htmlFor={`${p}-name`} required>
        <Input
          id={`${p}-name`}
          name="name"
          defaultValue={campeonato?.name}
          placeholder="Ex.: Copa Rio de Jiu-Jitsu 2026"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" htmlFor={`${p}-date`} required>
          <Input
            id={`${p}-date`}
            name="date"
            type="date"
            defaultValue={campeonato?.date}
            required
          />
        </Field>
        <Field label="Horário de início" htmlFor={`${p}-time`}>
          <Input
            id={`${p}-time`}
            name="time"
            type="time"
            defaultValue={campeonato?.time ?? "08:00"}
          />
        </Field>
      </div>

      <Field
        label="Termina em"
        htmlFor={`${p}-end`}
        hint="Só para campeonatos de mais de um dia."
      >
        <Input
          id={`${p}-end`}
          name="endDate"
          type="date"
          defaultValue={campeonato?.endDate}
        />
      </Field>

      <Field label="Modalidade" htmlFor={`${p}-mod`} required>
        <Select
          id={`${p}-mod`}
          name="modality"
          defaultValue={campeonato?.modality ?? "GI"}
          required
        >
          {Object.entries(MODALITIES).map(([key, m]) => (
            <option key={key} value={key}>
              {m.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Local" htmlFor={`${p}-local`}>
        <Input
          id={`${p}-local`}
          name="location"
          defaultValue={campeonato?.location}
          placeholder="Ex.: Tijuca Tênis Clube, Rio de Janeiro"
        />
      </Field>

      <Field
        label="Organização"
        htmlFor={`${p}-org`}
        hint="IBJJF, CBJJ, federação..."
      >
        <Input
          id={`${p}-org`}
          name="organizer"
          defaultValue={campeonato?.organizer}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Inscrições até" htmlFor={`${p}-prazo`}>
          <Input
            id={`${p}-prazo`}
            name="registrationDeadline"
            type="date"
            defaultValue={campeonato?.registrationDeadline}
          />
        </Field>
        <Field label="Link de inscrição" htmlFor={`${p}-link`}>
          <Input
            id={`${p}-link`}
            name="registrationUrl"
            type="url"
            defaultValue={campeonato?.registrationUrl}
            placeholder="https://"
          />
        </Field>
      </div>

      <Field
        label="Imagem do campeonato"
        htmlFor={`${p}-img`}
        hint='No site da federação, clique com o botão direito no cartaz do campeonato e escolha "Copiar endereço da imagem". Cole aqui.'
      >
        <Input
          id={`${p}-img`}
          name="imageUrl"
          type="url"
          defaultValue={campeonato?.imageUrl}
          placeholder="https://..."
        />
      </Field>

      <Field
        label="Informações"
        htmlFor={`${p}-desc`}
        hint="Categorias, pesagem, o que levar, horário de chegada."
      >
        <Textarea
          id={`${p}-desc`}
          name="description"
          rows={3}
          defaultValue={campeonato?.description}
        />
      </Field>

      <Enviar
        label={editando ? "Salvar alterações" : "Publicar campeonato"}
        loading="Salvando..."
        icon={editando ? Save : Trophy}
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
