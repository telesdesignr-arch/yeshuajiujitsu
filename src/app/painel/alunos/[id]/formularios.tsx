"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Award, Loader2, MessageSquarePlus, Save } from "lucide-react";

import {
  addGraduation,
  addNote,
  updateGraduation,
  updateStudent,
  type ActionState,
} from "@/actions/painel";
import { updateStudentFinance } from "@/actions/financeiro";
import { formatMoney, formatMoneyInput } from "@/lib/money";
import { BeltBar, BeltSelectOptions } from "@/components/belt";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/field";
import {
  GRADUATION_CRITERIA,
  MAX_DEGREE,
  graduationLabel,
  nextStep,
} from "@/lib/belts";
import { hojeISO } from "@/lib/dates";

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
/* Registrar graduacao                                                         */
/* -------------------------------------------------------------------------- */

export function GraduacaoForm({
  studentId,
  beltAtual,
  degreeAtual,
}: {
  studentId: string;
  beltAtual: string;
  degreeAtual: number;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    addGraduation,
    {},
  );
  const sugestao = nextStep(beltAtual, degreeAtual);
  const [belt, setBelt] = useState(sugestao.belt);
  const [degree, setDegree] = useState(String(sugestao.degree));

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="studentId" value={studentId} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <div className="rounded-[10px] bg-ink-100 p-3">
        <p className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
          Como vai ficar
        </p>
        <BeltBar belt={belt} degree={Number(degree)} height={30} />
        <p className="mt-2 text-sm font-semibold">
          {graduationLabel(belt, Number(degree))}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Faixa" htmlFor="grad-belt" required>
          <Select
            id="grad-belt"
            name="belt"
            value={belt}
            onChange={(e) => setBelt(e.target.value as typeof belt)}
            required
          >
            <BeltSelectOptions />
          </Select>
        </Field>

        <Field label="Graus" htmlFor="grad-degree" required>
          <Select
            id="grad-degree"
            name="degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            required
          >
            {Array.from({ length: MAX_DEGREE + 1 }).map((_, i) => (
              <option key={i} value={i}>
                {i === 0 ? "Faixa lisa (sem grau)" : `${i}º grau`}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Data da graduação" htmlFor="grad-date" required>
        <Input
          id="grad-date"
          name="date"
          type="date"
          defaultValue={hojeISO()}
          max={hojeISO()}
          required
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          Critérios avaliados
          <span className="block text-xs font-normal text-ink-500">
            Marque o que pesou na decisão. Fica registrado no histórico.
          </span>
        </legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {GRADUATION_CRITERIA.map((c) => (
            <label
              key={c}
              className="flex min-h-[40px] cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                name="criterio"
                value={c}
                className="size-4 cursor-pointer accent-brand-600"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        label="Observações da graduação"
        htmlFor="grad-notes"
        hint="Aparece na linha do tempo do aluno."
      >
        <Textarea id="grad-notes" name="notes" rows={3} />
      </Field>

      <Enviar label="Registrar graduação" loading="Registrando..." icon={Award} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Corrigir uma graduacao ja registrada                                        */
/* -------------------------------------------------------------------------- */

export function EditarGraduacaoForm({
  graduationId,
  belt: beltInicial,
  degree: degreeInicial,
  date,
  notes,
  criterios,
}: {
  graduationId: string;
  belt: string;
  degree: number;
  date: string;
  notes: string | null;
  criterios: string[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateGraduation,
    {},
  );
  const [belt, setBelt] = useState(beltInicial);
  const [degree, setDegree] = useState(String(degreeInicial));

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="graduationId" value={graduationId} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <div className="rounded-[10px] bg-ink-100 p-3">
        <BeltBar belt={belt} degree={Number(degree)} height={28} />
        <p className="mt-2 text-sm font-semibold">
          {graduationLabel(belt, Number(degree))}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Faixa" htmlFor={`eg-belt-${graduationId}`} required>
          <Select
            id={`eg-belt-${graduationId}`}
            name="belt"
            value={belt}
            onChange={(e) => setBelt(e.target.value)}
            required
          >
            <BeltSelectOptions />
          </Select>
        </Field>

        <Field label="Graus" htmlFor={`eg-deg-${graduationId}`} required>
          <Select
            id={`eg-deg-${graduationId}`}
            name="degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            required
          >
            {Array.from({ length: MAX_DEGREE + 1 }).map((_, i) => (
              <option key={i} value={i}>
                {i === 0 ? "Faixa lisa (sem grau)" : `${i}º grau`}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Data da graduação" htmlFor={`eg-date-${graduationId}`} required>
        <Input
          id={`eg-date-${graduationId}`}
          name="date"
          type="date"
          defaultValue={date}
          max={hojeISO()}
          required
        />
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Critérios avaliados</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {GRADUATION_CRITERIA.map((c) => (
            <label
              key={c}
              className="flex min-h-[40px] cursor-pointer items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                name="criterio"
                value={c}
                defaultChecked={criterios.includes(c)}
                className="size-4 cursor-pointer accent-brand-600"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Observações" htmlFor={`eg-notes-${graduationId}`}>
        <Textarea
          id={`eg-notes-${graduationId}`}
          name="notes"
          rows={2}
          defaultValue={notes ?? ""}
        />
      </Field>

      <p className="text-xs text-ink-500">
        A faixa atual do aluno é recalculada a partir da graduação mais recente
        que sobrar no histórico.
      </p>

      <Enviar label="Salvar correção" loading="Salvando..." icon={Save} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Diario do aluno                                                             */
/* -------------------------------------------------------------------------- */

export function NotaForm({ studentId }: { studentId: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(addNote, {});

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="studentId" value={studentId} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Observação" htmlFor="nota-content">
        <Textarea
          id="nota-content"
          name="content"
          rows={3}
          placeholder="Ex.: Está evoluindo muito na passagem de guarda. Precisa trabalhar mais a defesa de costas."
          required
        />
      </Field>

      <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="visibleToStudent"
          className="size-5 cursor-pointer accent-brand-600"
        />
        <span className="text-sm font-semibold">
          Mostrar esta observação para o aluno
          <span className="block text-xs font-normal text-ink-500">
            Se ficar desmarcado, só você enxerga.
          </span>
        </span>
      </label>

      <Enviar
        label="Salvar observação"
        loading="Salvando..."
        icon={MessageSquarePlus}
      />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Financeiro do aluno                                                         */
/* -------------------------------------------------------------------------- */

export function FinanceiroAlunoForm({
  studentId,
  planId,
  dueDay,
  customFeeCents,
  financialNotes,
  planos,
}: {
  studentId: string;
  planId: string | null;
  dueDay: number;
  customFeeCents: number | null;
  financialNotes: string | null;
  planos: { id: string; name: string; priceCents: number }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateStudentFinance,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="studentId" value={studentId} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      {planos.length === 0 && (
        <p className="rounded-[8px] bg-warning/10 px-3 py-2 text-sm text-warning">
          Nenhum plano cadastrado ainda. Crie um em Financeiro antes de associar
          o aluno.
        </p>
      )}

      <Field label="Plano" htmlFor="fin-plano">
        <Select id="fin-plano" name="planId" defaultValue={planId ?? ""}>
          <option value="">Sem plano</option>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatMoney(p.priceCents)}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Dia do vencimento"
        htmlFor="fin-dia"
        hint="De 1 a 28. Fevereiro não tem dia 29 todo ano, por isso o limite."
      >
        <Input
          id="fin-dia"
          name="dueDay"
          type="number"
          min={1}
          max={28}
          defaultValue={dueDay}
        />
      </Field>

      <Field
        label="Valor personalizado"
        htmlFor="fin-valor"
        hint="Deixe vazio para usar o valor do plano. Preencha só para bolsa ou desconto combinado."
      >
        <Input
          id="fin-valor"
          name="customFee"
          inputMode="decimal"
          defaultValue={
            customFeeCents !== null ? formatMoneyInput(customFeeCents) : ""
          }
          placeholder="Ex.: 120,00"
        />
      </Field>

      <Field label="Observações financeiras" htmlFor="fin-obs">
        <Textarea
          id="fin-obs"
          name="financialNotes"
          rows={2}
          defaultValue={financialNotes ?? ""}
          placeholder="Ex.: irmão do Pedro, desconto de 20% combinado."
        />
      </Field>

      <Enviar label="Salvar" loading="Salvando..." icon={Save} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Editar dados                                                                */
/* -------------------------------------------------------------------------- */

export function EditarAlunoForm({
  student,
}: {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    monthlyGoal: number;
    isCompetitor: boolean;
    active: boolean;
    guardianName: string | null;
    emergencyContact: string | null;
    observations: string | null;
  };
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateStudent,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="studentId" value={student.id} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Nome completo" htmlFor="ed-name" required>
        <Input id="ed-name" name="name" defaultValue={student.name} required />
      </Field>

      <Field label="E-mail" htmlFor="ed-email" required>
        <Input
          id="ed-email"
          name="email"
          type="email"
          defaultValue={student.email}
          required
        />
      </Field>

      <Field label="Telefone / WhatsApp" htmlFor="ed-phone">
        <Input id="ed-phone" name="phone" type="tel" defaultValue={student.phone ?? ""} />
      </Field>

      <Field label="Meta de treinos por mês" htmlFor="ed-goal">
        <Input
          id="ed-goal"
          name="monthlyGoal"
          type="number"
          min={1}
          max={31}
          defaultValue={student.monthlyGoal}
        />
      </Field>

      <Field label="Responsável (menores de idade)" htmlFor="ed-guardian">
        <Input
          id="ed-guardian"
          name="guardianName"
          defaultValue={student.guardianName ?? ""}
        />
      </Field>

      <Field label="Contato de emergência" htmlFor="ed-emergency">
        <Input
          id="ed-emergency"
          name="emergencyContact"
          defaultValue={student.emergencyContact ?? ""}
        />
      </Field>

      <Field label="Observações internas" htmlFor="ed-obs">
        <Textarea
          id="ed-obs"
          name="observations"
          rows={3}
          defaultValue={student.observations ?? ""}
        />
      </Field>

      <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="isCompetitor"
          defaultChecked={student.isCompetitor}
          className="size-5 cursor-pointer accent-brand-600"
        />
        <span className="text-sm font-semibold">Atleta competidor</span>
      </label>

      <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="active"
          defaultChecked={student.active}
          className="size-5 cursor-pointer accent-brand-600"
        />
        <span className="text-sm font-semibold">
          Aluno ativo
          <span className="block text-xs font-normal text-ink-500">
            Desmarque quando o aluno trancar ou sair. O histórico é preservado.
          </span>
        </span>
      </label>

      <Enviar label="Salvar alterações" loading="Salvando..." icon={Save} />
    </form>
  );
}
