import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { AlunoSidebarNav, BottomNav } from "@/components/bottom-nav";
import { LogoutButton } from "@/components/logout-button";
import { Wordmark } from "@/components/logo";
import { BeltChip } from "@/components/belt";
import { Avatar } from "@/components/ui/misc";
import { getCurrentStudent, requireUser } from "@/lib/auth";
import { modalityLabel, temGraduacao } from "@/lib/modalities";
import { isStaff } from "@/lib/session";

/**
 * Casca da area do aluno.
 *
 * Celular: cabecalho fino em cima e menu de 5 itens embaixo, no alcance do
 * polegar. Computador: barra lateral fixa a esquerda com os 7 destinos, e o
 * conteudo num container largo -- no desktop as paginas se abrem em duas
 * colunas, entao a mesma tela cabe sem rolagem.
 */
export default async function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireUser();
  const student = await getCurrentStudent();

  // Quem só treina boxe não tem faixa: a tela de Evolução sai do menu.
  const mostraGraduacao = student ? temGraduacao(student.modality) : true;

  return (
    <div className="min-h-dvh bg-ink-100/70">
      {/* Cabeçalho do celular */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/app" aria-label="Início">
            <Wordmark size={32} />
          </Link>

          {isStaff(session.role) && (
            <Link
              href="/painel"
              className="inline-flex items-center gap-1.5 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
            >
              <ClipboardList aria-hidden className="size-3.5" />
              Painel do professor
            </Link>
          )}
        </div>
      </header>

      <div className="lg:flex">
        {/* Barra lateral do computador */}
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-5 lg:flex">
          <Link href="/app" aria-label="Início" className="mb-7 px-1">
            <Wordmark size={38} />
          </Link>

          <AlunoSidebarNav temGraduacao={mostraGraduacao} />

          <div className="mt-auto space-y-1 border-t border-line pt-4">
            {student && (
              <div className="mb-3 flex items-center gap-2.5 px-1">
                <Avatar
                  name={student.user.name}
                  src={student.photoUrl}
                  size={36}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {student.user.name}
                  </p>
                  {mostraGraduacao ? (
                    <BeltChip
                      belt={student.belt}
                      degree={student.degree}
                      size="sm"
                    />
                  ) : (
                    <p className="text-xs text-ink-500">
                      {modalityLabel(student.modality)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isStaff(session.role) && (
              <Link
                href="/painel"
                className="flex min-h-[40px] items-center gap-3 rounded-[10px] px-3 text-sm font-semibold text-ink-500 transition-smooth hover:bg-ink-100 hover:text-ink"
              >
                <ClipboardList aria-hidden className="size-4" />
                Painel do professor
              </Link>
            )}

            <LogoutButton className="min-h-[40px] w-full justify-start gap-3 rounded-[10px] px-3 text-danger hover:bg-danger/8" />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-[88px] lg:px-8 lg:pt-8 lg:pb-12">
          <div className="mx-auto max-w-lg lg:max-w-5xl">{children}</div>
        </main>
      </div>

      <BottomNav temGraduacao={mostraGraduacao} />
    </div>
  );
}
