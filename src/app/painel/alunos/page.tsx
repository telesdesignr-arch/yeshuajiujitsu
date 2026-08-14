import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Search, UserPlus, Users } from "lucide-react";

import { BeltChip, BeltSelectOptions } from "@/components/belt";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { graduationRank } from "@/lib/belts";
import { requireStaff } from "@/lib/auth";
import { formatDateShortYear } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { getStudentsSummary } from "@/lib/stats";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Alunos" };
export const dynamic = "force-dynamic";

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; faixa?: string; status?: string }>;
}) {
  await requireStaff();
  const { q = "", faixa = "", status = "ativos" } = await searchParams;

  const todos = await prisma.student.findMany({
    where: {
      ...(status === "todos" ? {} : { active: status !== "inativos" }),
      ...(faixa ? { belt: faixa } : {}),
    },
    include: { user: { select: { name: true, email: true } } },
  });

  // A busca por nome é feita aqui, e não no banco, porque o SQLite não faz
  // busca sem diferenciar maiúsculas/minúsculas. Como a academia tem dezenas
  // de alunos (não milhares), filtrar em memória é instantâneo.
  const termo = q.trim().toLowerCase();
  const alunos = termo
    ? todos.filter((a) => a.user.name.toLowerCase().includes(termo))
    : todos;

  const resumo = await getStudentsSummary(
    alunos.map((a) => ({ id: a.id, monthlyGoal: a.monthlyGoal })),
  );

  const ordenados = [...alunos].sort(
    (a, b) =>
      graduationRank(b.belt, b.degree) - graduationRank(a.belt, a.degree) ||
      a.user.name.localeCompare(b.user.name, "pt-BR"),
  );


  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
            Alunos
          </h1>
          <p className="text-sm text-ink-500">
            {ordenados.length}{" "}
            {ordenados.length === 1 ? "aluno encontrado" : "alunos encontrados"}
          </p>
        </div>
        <ButtonLink href="/painel/alunos/novo">
          <UserPlus aria-hidden className="size-4" />
          Novo aluno
        </ButtonLink>
      </div>

      {/* Busca e filtros
          Com as escadas infantil e adulta juntas são 18 faixas: uma fileira de
          botões viraria uma rolagem infinita no celular, então a faixa virou
          uma lista suspensa agrupada por escada. */}
      <form method="get" className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="status" value={status} />
        <div className="relative min-w-[160px] flex-1">
          <Search
            aria-hidden
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-500"
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar pelo nome"
            aria-label="Buscar aluno pelo nome"
            className="pl-9"
          />
        </div>
        <Select
          name="faixa"
          defaultValue={faixa}
          aria-label="Filtrar por faixa"
          className="w-auto min-w-[150px]"
        >
          <option value="">Todas as faixas</option>
          <BeltSelectOptions />
        </Select>
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {ordenados.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno por aqui"
          description={
            q
              ? `Nada encontrado para "${q}". Tente outro nome.`
              : "Cadastre o primeiro aluno para começar a registrar presenças e graduações."
          }
          action={
            <ButtonLink href="/painel/alunos/novo">
              <UserPlus aria-hidden className="size-4" />
              Cadastrar aluno
            </ButtonLink>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <ul>
            {ordenados.map((aluno, i) => {
              const r = resumo.get(aluno.id);
              const pct = r?.monthPercent ?? 0;
              return (
                <li key={aluno.id} className={i > 0 ? "border-t border-line" : ""}>
                  <Link
                    href={`/painel/alunos/${aluno.id}`}
                    className="flex min-h-[68px] items-center gap-3 px-4 py-2.5 transition-smooth hover:bg-ink-100/60"
                  >
                    <Avatar name={aluno.user.name} src={aluno.photoUrl} size={44} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate font-semibold">
                          {aluno.user.name}
                        </span>
                        {!aluno.active && <Badge tone="neutral">Inativo</Badge>}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <BeltChip belt={aluno.belt} degree={aluno.degree} size="sm" />
                        <span className="text-xs text-ink-500">
                          {r?.lastTrainingAt
                            ? `Treinou em ${formatDateShortYear(r.lastTrainingAt)}`
                            : "Sem treinos"}
                        </span>
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <Badge
                        tone={pct >= 70 ? "success" : pct >= 40 ? "warning" : "danger"}
                      >
                        {pct}%
                      </Badge>
                      <span className="mt-0.5 block text-[11px] text-ink-500">
                        {r?.monthTrainings ?? 0}/{aluno.monthlyGoal} no mês
                      </span>
                    </span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-300" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <div className="flex gap-2">
        {[
          { key: "ativos", label: "Ativos" },
          { key: "inativos", label: "Inativos" },
          { key: "todos", label: "Todos" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/painel/alunos?${new URLSearchParams({ q, faixa, status: s.key })}`}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-sm font-semibold transition-smooth",
              status === s.key
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink-500 hover:bg-ink-100",
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
