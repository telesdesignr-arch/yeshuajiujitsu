import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarClock,
  KeyRound,
  Mail,
  MessageSquareQuote,
  Phone,
  Trophy,
  UserRound,
} from "lucide-react";

import { BeltBar } from "@/components/belt";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardBody, CardHeader, CardTitle, SectionTitle } from "@/components/ui/card";
import { Avatar, Badge, EmptyState } from "@/components/ui/misc";
import { graduationLabel } from "@/lib/belts";
import { requireStudent } from "@/lib/auth";
import { formatDateLong, humanDuration } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const { student } = await requireStudent();

  const recados = await prisma.studentNote.findMany({
    where: { studentId: student.id, visibleToStudent: true },
    include: { author: { select: { name: true } } },
    orderBy: { date: "desc" },
    take: 5,
  });

  const dados = [
    { icon: Mail, label: "E-mail", value: student.user.email },
    { icon: Phone, label: "Telefone", value: student.phone ?? "Não informado" },
    {
      icon: CalendarClock,
      label: "Na academia desde",
      value: `${formatDateLong(student.joinedAt)} (${humanDuration(student.joinedAt)})`,
    },
    {
      icon: UserRound,
      label: "Professor responsável",
      value: student.professor?.name ?? "A definir",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-wide uppercase">
        Perfil
      </h1>

      {/* Cartão de identificação */}
      <Card>
        <CardBody className="pt-5">
          <div className="flex items-center gap-4">
            <Avatar name={student.user.name} src={student.photoUrl} size={68} />
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold tracking-wide uppercase">
                {student.user.name}
              </p>
              <p className="text-sm text-ink-500">
                {graduationLabel(student.belt, student.degree)}
              </p>
              {student.isCompetitor && (
                <Badge tone="warning" className="mt-1.5">
                  <Trophy aria-hidden className="size-3" />
                  Atleta competidor
                </Badge>
              )}
            </div>
          </div>

          <div className="mt-5">
            <BeltBar belt={student.belt} degree={student.degree} height={32} />
          </div>
        </CardBody>
      </Card>

      {/* Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Meus dados</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="space-y-3.5">
            {dados.map((d) => (
              <div key={d.label} className="flex gap-3">
                <d.icon aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-500" />
                <div className="min-w-0">
                  <dt className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                    {d.label}
                  </dt>
                  <dd className="break-words">{d.value}</dd>
                </div>
              </div>
            ))}
          </dl>
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-500">
            Algum dado errado? Fale com o professor — ele corrige pelo painel.
          </p>
        </CardBody>
      </Card>

      {/* Recados do professor */}
      <section>
        <SectionTitle>Recados do professor</SectionTitle>
        {recados.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="Nenhum recado por aqui"
            description="Quando o professor deixar uma observação para você, ela aparece nesta tela."
          />
        ) : (
          <div className="space-y-3">
            {recados.map((r) => (
              <Card key={r.id}>
                <CardBody className="pt-4">
                  <p className="text-[15px] leading-relaxed">{r.content}</p>
                  <p className="mt-2 text-xs text-ink-500">
                    {r.author?.name ?? "Professor"} ·{" "}
                    <span className="first-letter:uppercase">
                      {formatDateLong(r.date)}
                    </span>
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Conta */}
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
        </CardHeader>
        <CardBody className="space-y-1">
          <Link
            href="/trocar-senha"
            className="flex min-h-[48px] items-center gap-3 rounded-[10px] px-2 font-semibold transition-smooth hover:bg-ink-100"
          >
            <KeyRound aria-hidden className="size-4 text-ink-500" />
            Trocar minha senha
          </Link>
          <div className="border-t border-line pt-1">
            <LogoutButton className="min-h-[48px] w-full justify-start gap-3 px-2 text-danger hover:bg-danger/8" />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
