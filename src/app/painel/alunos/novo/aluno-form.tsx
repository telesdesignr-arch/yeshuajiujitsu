"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, UserPlus } from "lucide-react";

import { createStudent, type ActionState } from "@/actions/painel";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/field";
import { BeltSelectOptions } from "@/components/belt";
import { MAX_DEGREE } from "@/lib/belts";
import { hojeISO } from "@/lib/dates";

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block disabled={pending}>
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          Cadastrando...
        </>
      ) : (
        <>
          <UserPlus aria-hidden className="size-4" />
          Cadastrar aluno
        </>
      )}
    </Button>
  );
}

export function AlunoForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createStudent,
    {},
  );
  const hoje = hojeISO();

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <Card>
        <CardHeader>
          <CardTitle>Dados do aluno</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field label="Nome completo" htmlFor="name" required>
            <Input id="name" name="name" autoComplete="name" required />
          </Field>

          <Field
            label="E-mail"
            htmlFor="email"
            required
            hint="É com este e-mail que o aluno entra no app."
          >
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
          </Field>

          <Field label="Telefone / WhatsApp" htmlFor="phone">
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="(21) 99999-9999"
            />
          </Field>

          <Field
            label="Data de entrada na academia"
            htmlFor="joinedAt"
            required
            hint="Se não lembrar o dia exato, use uma data aproximada."
          >
            <Input
              id="joinedAt"
              name="joinedAt"
              type="date"
              defaultValue={hoje}
              max={hoje}
              required
            />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Graduação atual</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Faixa" htmlFor="belt" required>
              <Select id="belt" name="belt" defaultValue="BRANCA" required>
                <BeltSelectOptions />
              </Select>
            </Field>

            <Field label="Graus" htmlFor="degree" required>
              <Select id="degree" name="degree" defaultValue="0" required>
                {Array.from({ length: MAX_DEGREE + 1 }).map((_, i) => (
                  <option key={i} value={i}>
                    {i === 0 ? "Faixa lisa (sem grau)" : `${i}º grau`}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label="Desde quando está nesta graduação"
            htmlFor="beltSinceAt"
            hint="Deixe em branco para usar a data de entrada."
          >
            <Input id="beltSinceAt" name="beltSinceAt" type="date" max={hoje} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acompanhamento</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <Field
            label="Meta de treinos por mês"
            htmlFor="monthlyGoal"
            hint="Usada para calcular a frequência do aluno. O padrão é 12."
          >
            <Input
              id="monthlyGoal"
              name="monthlyGoal"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              defaultValue={12}
            />
          </Field>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              name="isCompetitor"
              className="size-5 cursor-pointer accent-brand-600"
            />
            <span className="text-sm font-semibold">
              Atleta competidor
              <span className="block text-xs font-normal text-ink-500">
                Marque se o aluno compete pela equipe.
              </span>
            </span>
          </label>

          <Field
            label="Responsável (para menores de idade)"
            htmlFor="guardianName"
          >
            <Input id="guardianName" name="guardianName" />
          </Field>

          <Field label="Contato de emergência" htmlFor="emergencyContact">
            <Input
              id="emergencyContact"
              name="emergencyContact"
              placeholder="Nome e telefone"
            />
          </Field>

          <Field
            label="Observações"
            htmlFor="observations"
            hint="Lesões, restrições médicas, qualquer coisa que você precise lembrar."
          >
            <Textarea id="observations" name="observations" rows={3} />
          </Field>
        </CardBody>
      </Card>

      <Salvar />
    </form>
  );
}
