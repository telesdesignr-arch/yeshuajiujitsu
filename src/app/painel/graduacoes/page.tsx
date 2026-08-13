import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";

import { BeltChip, DegreeDots } from "@/components/belt";
import { Card, CardBody } from "@/components/ui/card";
import { Avatar, Badge, EmptyState, Progress } from "@/components/ui/misc";
import { requireStaff } from "@/lib/auth";
import { humanDuration } from "@/lib/dates";
import { getGraduationCandidates } from "@/lib/stats";

export const metadata: Metadata = { title: "Graduações" };
export const dynamic = "force-dynamic";

export default async function GraduacoesPage() {
  await requireStaff();
  const candidatos = await getGraduationCandidates();

  const prontos = candidatos.filter((c) => c.pronto);
  const chegando = candidatos.filter((c) => !c.pronto && c.progresso >= 0.6);
  const resto = candidatos.filter((c) => !c.pronto && c.progresso < 0.6);

  const grupos = [
    {
      key: "prontos",
      titulo: "Prontos para graduar",
      descricao:
        "Cumpriram o tempo de referência e vêm treinando com constância.",
      lista: prontos,
    },
    {
      key: "chegando",
      titulo: "Chegando lá",
      descricao: "Já passaram de 60% do tempo de referência.",
      lista: chegando,
    },
    {
      key: "resto",
      titulo: "Em construção",
      descricao: "Ainda no começo do ciclo da graduação atual.",
      lista: resto,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
          Graduações
        </h1>
        <p className="text-sm text-ink-500">
          Quem está perto do próximo grau ou da próxima faixa. O sistema só
          sugere — a decisão é sempre sua.
        </p>
        <p className="mt-1 text-xs text-ink-500">
          A frequência mostrada aqui é a dos últimos 3 meses fechados, não a do
          mês corrente.
        </p>
      </div>

      {candidatos.length === 0 && (
        <EmptyState
          icon={GraduationCap}
          title="Nenhum aluno ativo"
          description="Cadastre alunos para acompanhar a evolução da turma."
        />
      )}

      {grupos.map(
        (grupo) =>
          grupo.lista.length > 0 && (
            <section key={grupo.key}>
              <div className="mb-3">
                <h2 className="font-display text-xl font-bold tracking-wide uppercase">
                  {grupo.titulo}{" "}
                  <span className="tabular text-ink-300">
                    ({grupo.lista.length})
                  </span>
                </h2>
                <p className="text-sm text-ink-500">{grupo.descricao}</p>
              </div>

              {/* Celular: cartões */}
              <div className="space-y-3 sm:hidden">
                {grupo.lista.map((c) => (
                  <Card key={c.studentId}>
                    <Link href={`/painel/alunos/${c.studentId}`}>
                      <CardBody className="pt-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} src={c.photoUrl} size={44} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{c.name}</p>
                            <div className="mt-0.5 flex items-center gap-2">
                              <BeltChip belt={c.belt} degree={c.degree} size="sm" />
                              <DegreeDots degree={c.degree} />
                            </div>
                          </div>
                          <ChevronRight
                            aria-hidden
                            className="size-4 shrink-0 text-ink-300"
                          />
                        </div>

                        <Progress
                          value={Math.min(1, c.progresso) * 100}
                          label={`Progresso de ${c.name} até a próxima graduação`}
                          tone={c.pronto ? "success" : "brand"}
                          className="mt-3"
                        />

                        <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <dt className="text-ink-500">Frequência</dt>
                            <dd className="tabular font-bold">
                              {c.recentPercent}%
                            </dd>
                          </div>
                          <div>
                            <dt className="text-ink-500">Na graduação</dt>
                            <dd className="font-bold">
                              {humanDuration(c.beltSinceAt)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-ink-500">Próximo</dt>
                            <dd className="truncate font-bold">
                              {c.degree < 4 ? `${c.degree + 1}º grau` : "Nova faixa"}
                            </dd>
                          </div>
                        </dl>
                      </CardBody>
                    </Link>
                  </Card>
                ))}
              </div>

              {/* Computador: tabela */}
              <Card className="hidden overflow-hidden sm:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-line bg-ink-100/70">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Aluno
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Faixa
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Graus
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Frequência
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Última graduação
                        </th>
                        <th scope="col" className="px-4 py-2.5 font-semibold">
                          Próximo passo
                        </th>
                        <th scope="col" className="px-4 py-2.5">
                          <span className="sr-only">Abrir</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {grupo.lista.map((c, i) => (
                        <tr
                          key={c.studentId}
                          className={i > 0 ? "border-t border-line" : ""}
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/painel/alunos/${c.studentId}`}
                              className="flex items-center gap-2.5 font-semibold hover:underline"
                            >
                              <Avatar name={c.name} src={c.photoUrl} size={32} />
                              {c.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <BeltChip belt={c.belt} degree={0} size="sm" />
                          </td>
                          <td className="px-4 py-3">
                            <DegreeDots degree={c.degree} />
                          </td>
                          <td className="tabular px-4 py-3">
                            <Badge
                              tone={
                                c.recentPercent >= 70
                                  ? "success"
                                  : c.recentPercent >= 40
                                    ? "warning"
                                    : "danger"
                              }
                            >
                              {c.recentPercent}%
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-ink-500">
                            há {humanDuration(c.beltSinceAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="block">{c.proximoLabel}</span>
                            <Progress
                              value={Math.min(1, c.progresso) * 100}
                              label={`Progresso de ${c.name}`}
                              tone={c.pronto ? "success" : "brand"}
                              className="mt-1 w-28"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/painel/alunos/${c.studentId}`}
                              aria-label={`Abrir perfil de ${c.name}`}
                              className="flex size-9 items-center justify-center rounded-[8px] text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
                            >
                              <ChevronRight aria-hidden className="size-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          ),
      )}
    </div>
  );
}
