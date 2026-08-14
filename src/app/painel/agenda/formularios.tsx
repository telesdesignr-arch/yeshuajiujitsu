"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus, Clock, Loader2 } from "lucide-react";

import {
  createEvent,
  createSchedule,
  type ActionState,
} from "@/actions/painel";
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

export function EventoForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createEvent,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Nome do evento" htmlFor="ev-title" required>
        <Input
          id="ev-title"
          name="title"
          placeholder="Ex.: Copa Rio de Jiu-Jitsu 2026"
          required
        />
      </Field>

      {/* Campeonato nao entra aqui: tem tela propria, com prazo de inscricao
          e resultados por atleta. */}
      <Field label="Tipo" htmlFor="ev-type" required>
        <Select id="ev-type" name="type" defaultValue="GRADUACAO" required>
          {Object.entries(EVENT_TYPES)
            .filter(([key]) => key !== "CAMPEONATO")
            .map(([key, info]) => (
              <option key={key} value={key}>
                {info.label}
              </option>
            ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Data" htmlFor="ev-date" required>
          <Input id="ev-date" name="startsAt" type="date" required />
        </Field>
        <Field label="Horário" htmlFor="ev-time">
          <Input id="ev-time" name="time" type="time" defaultValue="19:00" />
        </Field>
      </div>

      <Field label="Local" htmlFor="ev-local">
        <Input
          id="ev-local"
          name="location"
          placeholder="Ex.: Tijuca Tênis Clube — Rio de Janeiro"
        />
      </Field>

      <Field
        label="Descrição"
        htmlFor="ev-desc"
        hint="Explique o que o aluno precisa saber: inscrições, o que levar, horário de chegada."
      >
        <Textarea id="ev-desc" name="description" rows={3} />
      </Field>

      <Field label="Link (opcional)" htmlFor="ev-link" hint="Página de inscrição, por exemplo.">
        <Input id="ev-link" name="link" type="url" placeholder="https://" />
      </Field>

      <Enviar label="Publicar evento" loading="Publicando..." icon={CalendarPlus} />
    </form>
  );
}

export function HorarioForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createSchedule,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Dia da semana" htmlFor="hr-weekday" required>
        <Select id="hr-weekday" name="weekday" defaultValue="1" required>
          {WEEKDAYS.map((dia, i) => (
            <option key={dia} value={i}>
              {dia}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Começa às" htmlFor="hr-start" required>
          <Input id="hr-start" name="startTime" type="time" defaultValue="19:00" required />
        </Field>
        <Field label="Termina às" htmlFor="hr-end" required>
          <Input id="hr-end" name="endTime" type="time" defaultValue="20:00" required />
        </Field>
      </div>

      <Field label="Nome da aula" htmlFor="hr-title" required>
        <Input id="hr-title" name="title" defaultValue="Jiu-Jitsu" required />
      </Field>

      <Field label="Tipo de aula" htmlFor="hr-type" required>
        <Select id="hr-type" name="type" defaultValue="ADULTO" required>
          {Object.entries(CLASS_TYPES).map(([key, info]) => (
            <option key={key} value={key}>
              {info.label}
            </option>
          ))}
        </Select>
      </Field>

      <Enviar label="Adicionar à grade" loading="Adicionando..." icon={Clock} />
    </form>
  );
}
