"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, Plus, Save, Wand2 } from "lucide-react";

import {
  savePlan,
  generateInvoices,
  markPaid,
  saveSettings,
  type ActionState,
} from "@/actions/financeiro";
import { Button } from "@/components/ui/button";
import { Field, FormAlert, Input, Select, Textarea } from "@/components/ui/field";
import { PAYMENT_METHODS, nomeDoMes } from "@/lib/finance";
import { formatMoney, parseMoney } from "@/lib/money";
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
/* Novo plano                                                                  */
/* -------------------------------------------------------------------------- */

/** Valores que ja estao salvos, quando o professor esta editando. */
export type PlanoSalvo = {
  id: string;
  name: string;
  /** ja formatado, ex.: "150,00" */
  price: string;
  description: string;
};

/** Serve para criar e para editar: com `plano`, salva por cima. */
export function PlanoForm({ plano }: { plano?: PlanoSalvo }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    savePlan,
    {},
  );
  const [preco, setPreco] = useState(plano?.price ?? "");

  const centavos = parseMoney(preco);
  const editando = Boolean(plano);
  const p = editando ? `ed-pl-${plano!.id}` : "pl";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {plano && <input type="hidden" name="planId" value={plano.id} />}

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field label="Nome do plano" htmlFor={`${p}-name`} required>
        <Input
          id={`${p}-name`}
          name="name"
          defaultValue={plano?.name}
          placeholder="Ex.: Adulto, 3x por semana"
          required
        />
      </Field>

      <Field
        label="Valor da mensalidade"
        htmlFor={`${p}-price`}
        required
        hint={
          centavos !== null && centavos > 0
            ? `Vai ficar: ${formatMoney(centavos)}`
            : "Escreva assim: 150,00"
        }
      >
        <Input
          id={`${p}-price`}
          name="price"
          inputMode="decimal"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="150,00"
          required
        />
      </Field>

      <Field label="Descrição" htmlFor={`${p}-desc`}>
        <Textarea
          id={`${p}-desc`}
          name="description"
          rows={2}
          defaultValue={plano?.description}
          placeholder="O que está incluso neste plano."
        />
      </Field>

      {editando && (
        <p className="text-xs text-ink-500">
          Mudar o valor vale para as próximas mensalidades. As que já foram
          geradas continuam com o valor de quando saíram.
        </p>
      )}

      <Enviar
        label={editando ? "Salvar alterações" : "Criar plano"}
        loading="Salvando..."
        icon={editando ? Save : Plus}
      />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Configuracoes                                                               */
/* -------------------------------------------------------------------------- */

export function ConfiguracoesForm({
  pixKey,
  pixOwnerName,
  defaultDueDay,
}: {
  pixKey: string;
  pixOwnerName: string;
  defaultDueDay: number;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveSettings,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <Field
        label="Chave Pix da academia"
        htmlFor="cf-pix"
        hint="CPF, CNPJ, telefone, e-mail ou chave aleatória. É o que o aluno vai copiar para pagar."
      >
        <Input
          id="cf-pix"
          name="pixKey"
          defaultValue={pixKey}
          placeholder="Ex.: 21987059207"
        />
      </Field>

      <Field
        label="Nome que aparece no Pix"
        htmlFor="cf-pix-nome"
        hint="Para o aluno conferir que está pagando para a pessoa certa."
      >
        <Input
          id="cf-pix-nome"
          name="pixOwnerName"
          defaultValue={pixOwnerName}
          placeholder="Ex.: Renato Pierre"
        />
      </Field>

      <Field
        label="Dia do vencimento padrão"
        htmlFor="cf-dia"
        hint="Usado nos alunos novos. Cada aluno pode ter um dia diferente. Vai até 28 porque fevereiro não tem dia 29 todo ano."
      >
        <Input
          id="cf-dia"
          name="defaultDueDay"
          type="number"
          min={1}
          max={28}
          defaultValue={defaultDueDay}
        />
      </Field>

      <Enviar label="Salvar configurações" loading="Salvando..." icon={Save} />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Gerar mensalidades do mes                                                   */
/* -------------------------------------------------------------------------- */

export function GerarMensalidadesForm({
  referenceMonth,
  quantosAlunos,
  jaGeradas,
}: {
  referenceMonth: string;
  quantosAlunos: number;
  jaGeradas: number;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    generateInvoices,
    {},
  );

  const faltam = quantosAlunos - jaGeradas;

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="referenceMonth" value={referenceMonth} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <p className="text-sm text-ink-500">
        Cria a mensalidade de <strong>{nomeDoMes(referenceMonth)}</strong> para
        cada aluno ativo com plano, usando o dia de vencimento de cada um.
        {faltam > 0
          ? ` Faltam ${faltam} de ${quantosAlunos}.`
          : " Todas já foram geradas."}
      </p>

      <p className="text-xs text-ink-500">
        Pode clicar sem medo: rodar duas vezes não duplica cobrança.
      </p>

      <Enviar
        label={`Gerar mensalidades de ${nomeDoMes(referenceMonth)}`}
        loading="Gerando..."
        icon={Wand2}
      />
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Dar baixa                                                                   */
/* -------------------------------------------------------------------------- */

export function BaixaForm({
  invoiceId,
  alunoNome,
  valor,
}: {
  invoiceId: string;
  alunoNome: string;
  valor: number;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    markPaid,
    {},
  );

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="invoiceId" value={invoiceId} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.success && <FormAlert tone="success">{state.success}</FormAlert>}

      <p className="text-sm">
        Confirmar o pagamento de <strong>{formatMoney(valor)}</strong> de{" "}
        {alunoNome}.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Como pagou" htmlFor={`m-${invoiceId}`} required>
          <Select
            id={`m-${invoiceId}`}
            name="paymentMethod"
            defaultValue="PIX"
            required
          >
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Data do pagamento" htmlFor={`d-${invoiceId}`} required>
          <Input
            id={`d-${invoiceId}`}
            name="paidAt"
            type="date"
            defaultValue={hojeISO()}
            max={hojeISO()}
            required
          />
        </Field>
      </div>

      <Field label="Observação" htmlFor={`n-${invoiceId}`}>
        <Input id={`n-${invoiceId}`} name="notes" placeholder="Opcional" />
      </Field>

      <Enviar label="Confirmar pagamento" loading="Confirmando..." icon={Check} />
    </form>
  );
}
