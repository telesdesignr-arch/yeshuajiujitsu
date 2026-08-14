import { ExternalLink } from "lucide-react";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { FEDERACOES } from "@/lib/competitions";

/**
 * Calendarios oficiais das federacoes.
 *
 * O aluno que quiser ver TUDO que existe vai direto na fonte, sempre
 * atualizada. Aqui na Yeshua fica so o que o professor selecionou.
 */
export function Federacoes({
  descricao = "O professor publica aqui os campeonatos que valem a pena para a equipe. Se quiser ver o calendário completo, é nestes sites — eles são atualizados pelas próprias federações.",
}: {
  descricao?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendários das federações</CardTitle>
        <p className="mt-1 text-sm text-ink-500">{descricao}</p>
      </CardHeader>
      <CardBody className="pt-1">
        <ul className="divide-y divide-line">
          {FEDERACOES.map((f) => (
            <li key={f.sigla}>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[60px] items-center gap-3 py-2.5 transition-smooth hover:opacity-75"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-ink text-[11px] font-bold tracking-wide text-white">
                  {f.sigla}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{f.nome}</span>
                  <span className="block text-xs text-ink-500">
                    {f.descricao}
                  </span>
                </span>
                <ExternalLink
                  aria-hidden
                  className="size-4 shrink-0 text-ink-300"
                />
                <span className="sr-only">Abre o site oficial em outra aba</span>
              </a>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
