"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus, Clock, Loader2, Save } from "lucide-react";

import { saveEvent, saveSchedule, type ActionState } from "@/actions/painel";
import { EVENT_TYPES, CLASS_TYPES } from "@/components/event-type";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/field";
import { WEEKDAYS } from "@/lib/dates";

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
/* Evento                                                                      */
/* -------------------------------------------------------------------------- */

/** Valores que ja estao salvos, quando o professor esta editando. */
export type EventoSalvo = {
  id: string;
  title: string;
  type: string;
  /** "2026-09-14" */
  startsAt: string;
  /** "19:00" */
  time: string;
  location: string;
  description: string;
  link: string;
};

/**
 * Serve para cadastrar e para editar. Com `evento` preenchido, os campos ja vem
 * com o que esta salvo e um campo escondido leva o id, o que faz a action
 * salvar por cima em vez de criar outro.
 */
export function EventoForm({ evento }: { evento?: EventoSalvo }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveEvent,
    {},
  );

  const editando = Boolean(evento);
  // Ids diferentes por formulario: os dois podem estar abertos na mesma pagina.
  const p = editando ? `ed-ev-${evento!.id}` : "ev";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {evento && <input type="hidden" name="eventId" value={evento.id} />}

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Nome do evento" htmlFor={`${p}-title`} required>
        <Input
          id={`${p}-title`}
          name="title"
          defaultValue={evento?.title}
          placeholder="Ex.: Graduação de meio de ano"
          required
        />
      </Field>

      {/* Campeonato nao entra aqui: tem tela propria, com prazo de inscricao
          e resultados por atleta. */}
      <Field label="Tipo" htmlFor={`${p}-type`} required>
        <Select
          id={`${p}-type`}
          name="type"
          defaultValue={evento?.type ?? "GRADUACAO"}
          required
        >
          {Object.entries(EVENT_TYPES)
            .filter(([key]) => key !== "CAMPEONATO" || evento?.type === key)
            .map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" htmlFor={`${p}-date`} required>
          <Input
            id={`${p}-date`}
            name="startsAt"
            type="date"
            defaultValue={evento?.startsAt}
            required
          />
        </Field>
        <Field label="Horário" htmlFor={`${p}-time`}>
          <Input
            id={`${p}-time`}
            name="time"
            type="time"
            defaultValue={evento?.time ?? "19:00"}
          />
        </Field>
      </div>

      <Field label="Local" htmlFor={`${p}-local`}>
        <Input
          id={`${p}-local`}
          name="location"
          defaultValue={evento?.location}
          placeholder="Ex.: Tijuca Tênis Clube, Rio de Janeiro"
        />
      </Field>

      <Field
        label="Descrição"
        htmlFor={`${p}-desc`}
        hint="Explique o que o aluno precisa saber: inscrições, o que levar, horário de chegada."
      >
        <Textarea
          id={`${p}-desc`}
          name="description"
          rows={3}
          defaultValue={evento?.description}
        />
      </Field>

      <Field
        label="Link (opcional)"
        htmlFor={`${p}-link`}
        hint="Página de inscrição, por exemplo."
      >
        <Input
          id={`${p}-link`}
          name="link"
          type="url"
          defaultValue={evento?.link}
          placeholder="https://"
        />
      </Field>

      <Enviar
        label={editando ? "Salvar alterações" : "Publicar evento"}
        loading="Salvando..."
        icon={editando ? Save : CalendarPlus}
      />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Horario da grade                                                            */
/* -------------------------------------------------------------------------- */

export type HorarioSalvo = {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  title: string;
  modality: string;
  type: string;
};

export function HorarioForm({ horario }: { horario?: HorarioSalvo }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveSchedule,
    {},
  );

  const editando = Boolean(horario);
  const p = editando ? `ed-hr-${horario!.id}` : "hr";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {horario && <input type="hidden" name="scheduleId" value={horario.id} />}

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Dia da semana" htmlFor={`${p}-weekday`} required>
        <Select
          id={`${p}-weekday`}
          name="weekday"
          defaultValue={String(horario?.weekday ?? 1)}
          required
        >
          {WEEKDAYS.map((dia, i) => (
            <option key={dia} value={i}>
              {dia}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Começa às" htmlFor={`${p}-start`} required>
          <Input
            id={`${p}-start`}
            name="startTime"
            type="time"
            defaultValue={horario?.startTime ?? "19:00"}
            required
          />
        </Field>
        <Field label="Termina às" htmlFor={`${p}-end`} required>
          <Input
            id={`${p}-end`}
            name="endTime"
            type="time"
            defaultValue={horario?.endTime ?? "20:00"}
            required
          />
        </Field>
      </div>

      <Field label="Nome da aula" htmlFor={`${p}-title`} required>
        <Input
          id={`${p}-title`}
          name="title"
          defaultValue={horario?.title ?? "Jiu-Jitsu"}
          required
        />
      </Field>

      <Field
        label="Modalidade"
        htmlFor={`${p}-mod`}
        required
        hint="Define quem entra na chamada e quem vê essa aula na agenda."
      >
        <Select
          id={`${p}-mod`}
          name="modality"
          defaultValue={horario?.modality ?? "JIU_JITSU"}
          required
        >
          <option value="JIU_JITSU">Jiu-Jitsu</option>
          <option value="BOXE">Boxe</option>
        </Select>
      </Field>

      <Field label="Turma" htmlFor={`${p}-type`} required>
        <Select
          id={`${p}-type`}
          name="type"
          defaultValue={horario?.type ?? "ADULTO"}
          required
        >
          {Object.entries(CLASS_TYPES).map(([key, info]) => (
            <option key={key} value={key}>
              {info.label}
            </option>
          ))}
        </Select>
      </Field>

      <Enviar
        label={editando ? "Salvar alterações" : "Adicionar à grade"}
        loading="Salvando..."
        icon={editando ? Save : Clock}
      />
    </form>
  );
}
