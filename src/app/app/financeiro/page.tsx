import type { Metadata } from "next";
import {
  BadgeCheck,
  CalendarClock,
  CircleDollarSign,
  Clock,
  MessageCircle,
} from "lucide-react";

import { PixCopiar } from "./pix-copiar";
import { declararPagamento } from "@/actions/financeiro";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle, SectionTitle } from "@/components/ui/card";
import { Badge, EmptyState } from "@/components/ui/misc";
import { requireStudent } from "@/lib/auth";
import { ACADEMIA, whatsappLink } from "@/lib/academia";
import { formatDateLong, formatDateShortYear } from "@/lib/dates";
import { SITUACAO_INFO, mesAtual, nomeDoMes, situacao } from "@/lib/finance";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mensalidade" };
export const dynamic = "force-dynamic";

export default async function FinanceiroDoAlunoPage() {
  const { student } = await requireStudent();

  const [mensalidades, config] = await Promise.all([
    prisma.invoice.findMany({
      where: { studentId: student.id, status: { not: "CANCELADO" } },
      orderBy: { referenceMonth: "desc" },
      take: 12,
    }),
    prisma.academySettings.findUnique({ where: { id: "unica" } }),
  ]);

  const atual = mensalidades.find((m) => m.referenceMonth === mesAtual());
  const anteriores = mensalidades.filter((m) => m.id !== atual?.id);

  // Pendências de meses passados: é o que realmente precisa de atenção.
  const emAberto = mensalidades.filter(
    (m) => situacao(m) === "ATRASADO",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Mensalidade
        </h1>
        <p className="text-sm text-ink-500">
          Sua situação com a academia, mês a mês.
        </p>
      </div>

      {/* Mês atual */}
      {atual ? (
        <MensalidadeCard invoice={atual} destaque />
      ) : (
        <Card>
          <CardBody className="pt-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-ink-500 uppercase">
              {nomeDoMes(mesAtual())}
            </p>
            <p className="mt-2 text-[15px] text-ink-500">
              A mensalidade deste mês ainda não foi lançada. Quando o professor
              lançar, ela aparece aqui com o valor e o vencimento.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Atrasos de meses anteriores */}
      {emAberto.length > 0 && (
        <Card className="border-danger/30 bg-danger/5">
          <CardBody className="pt-4">
            <p className="font-display text-base font-bold tracking-wide text-danger uppercase">
              {emAberto.length === 1
                ? "1 mensalidade em atraso"
                : `${emAberto.length} mensalidades em atraso`}
            </p>
            <p className="mt-1 text-sm text-ink-700">
              Se já pagou e ainda está aparecendo assim, fale com o professor —
              pode ser só a confirmação que faltou.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Como pagar */}
      {config?.pixKey ? (
        <Card>
          <CardHeader>
            <CardTitle>Como pagar</CardTitle>
            {config.pixOwnerName && (
              <p className="mt-1 text-sm text-ink-500">
                A chave Pix está no nome de{" "}
                <strong className="font-semibold text-ink">
                  {config.pixOwnerName}
                </strong>
                . Confira antes de confirmar no seu banco.
              </p>
            )}
          </CardHeader>
          <CardBody>
            <PixCopiar chave={config.pixKey} />

            <ol className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm text-ink-500">
              <li>1. Copie a chave acima</li>
              <li>2. Pague pelo aplicativo do seu banco</li>
              <li>3. Volte aqui e toque em “Já paguei”</li>
            </ol>

            <a
              href={whatsappLink(
                `Olá, professor! Acabei de pagar a mensalidade de ${nomeDoMes(mesAtual())}. Segue o comprovante.`,
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-[10px] border border-line px-4 text-sm font-semibold transition-smooth hover:bg-ink-100"
            >
              <MessageCircle aria-hidden className="size-4" />
              Enviar comprovante no WhatsApp
            </a>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="pt-4">
            <p className="text-sm text-ink-500">
              A academia ainda não cadastrou a chave Pix. Fale com o professor{" "}
              {ACADEMIA.professor} para saber como pagar.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Histórico */}
      <section>
        <SectionTitle>Histórico</SectionTitle>

        {anteriores.length === 0 ? (
          <EmptyState
            icon={CircleDollarSign}
            title="Sem histórico ainda"
            description="Suas mensalidades pagas vão aparecer aqui."
          />
        ) : (
          <div className="space-y-3">
            {anteriores.map((m) => (
              <MensalidadeCard key={m.id} invoice={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MensalidadeCard({
  invoice,
  destaque,
}: {
  invoice: {
    id: string;
    referenceMonth: string;
    dueDate: Date;
    amountCents: number;
    discountCents: number;
    status: string;
    paidAt: Date | null;
  };
  destaque?: boolean;
}) {
  const sit = situacao(invoice);
  const info = SITUACAO_INFO[sit];
  const valor = invoice.amountCents - invoice.discountCents;
  const podeAvisar = sit === "ATRASADO" || sit === "VENCE_HOJE" || sit === "A_VENCER";

  return (
    <Card className={destaque ? "border-ink bg-ink text-white" : undefined}>
      <CardBody className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className={`text-xs font-semibold tracking-[0.16em] uppercase ${
                destaque ? "text-white/50" : "text-ink-500"
              }`}
            >
              {nomeDoMes(invoice.referenceMonth)}
            </p>
            <p className="tabular mt-1.5 font-display text-3xl leading-none font-bold">
              {formatMoney(valor)}
            </p>
          </div>
          <Badge tone={info.tone}>{info.label}</Badge>
        </div>

        <p
          className={`mt-3 flex items-center gap-1.5 text-sm ${
            destaque ? "text-white/70" : "text-ink-500"
          }`}
        >
          {sit === "PAGO" ? (
            <>
              <BadgeCheck aria-hidden className="size-4 shrink-0" />
              Pago em {formatDateShortYear(invoice.paidAt)}
            </>
          ) : sit === "EM_ANALISE" ? (
            <>
              <Clock aria-hidden className="size-4 shrink-0" />
              O professor vai confirmar assim que conferir o recebimento
            </>
          ) : (
            <>
              <CalendarClock aria-hidden className="size-4 shrink-0" />
              <span className="first-letter:uppercase">
                Vence em {formatDateLong(invoice.dueDate)}
              </span>
            </>
          )}
        </p>

        {podeAvisar && (
          <form action={declararPagamento} className="mt-4">
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <Button
              type="submit"
              block
              variant={destaque ? "outline" : "primary"}
              className={
                destaque ? "border-white/25 bg-white/10 text-white hover:bg-white/20" : ""
              }
            >
              <BadgeCheck aria-hidden className="size-4" />
              Já paguei
            </Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
