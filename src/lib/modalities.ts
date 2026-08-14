/**
 * Modalidades da academia.
 *
 * A Yeshua e "Jiu-Jitsu Boxe Team": treina as duas coisas, com turmas e alunos
 * diferentes. Cada aluno enxerga apenas o que ele treina -- quem so faz boxe
 * nao ve grade de Jiu-Jitsu nem tela de faixa, porque boxe nao tem sistema de
 * graduacao.
 */

export type Modality = "JIU_JITSU" | "BOXE";
/** O que o aluno treina. AMBOS = as duas modalidades. */
export type StudentModality = Modality | "AMBOS";

export const MODALITY_INFO: Record<
  Modality,
  { label: string; curto: string; descricao: string }
> = {
  JIU_JITSU: {
    label: "Jiu-Jitsu",
    curto: "Jiu-Jitsu",
    descricao: "Turmas de adultos, adolescentes e crianças, com graduação por faixas.",
  },
  BOXE: {
    label: "Boxe",
    curto: "Boxe",
    descricao: "Turmas de boxe ao longo do dia, sem sistema de faixas.",
  },
};

export const MODALITY_OPTIONS: { value: StudentModality; label: string }[] = [
  { value: "JIU_JITSU", label: "Jiu-Jitsu" },
  { value: "BOXE", label: "Boxe" },
  { value: "AMBOS", label: "Jiu-Jitsu e Boxe" },
];

export function modalityLabel(m: string) {
  if (m === "AMBOS") return "Jiu-Jitsu e Boxe";
  return MODALITY_INFO[m as Modality]?.label ?? m;
}

/** As modalidades que um aluno treina, sempre como lista. */
export function modalidadesDoAluno(modality: string): Modality[] {
  if (modality === "AMBOS") return ["JIU_JITSU", "BOXE"];
  if (modality === "BOXE") return ["BOXE"];
  return ["JIU_JITSU"];
}

/** Este aluno participa desta aula? */
export function alunoParticipaDe(
  modalidadeDoAluno: string,
  modalidadeDaAula: string,
) {
  return modalidadesDoAluno(modalidadeDoAluno).includes(
    modalidadeDaAula as Modality,
  );
}

/**
 * O aluno tem faixa e graduacao?
 *
 * So quem treina Jiu-Jitsu. Para quem so faz boxe, toda a area de evolucao por
 * faixas fica escondida -- e nao mostrada vazia, que confundiria mais.
 */
export function temGraduacao(modalidadeDoAluno: string) {
  return modalidadesDoAluno(modalidadeDoAluno).includes("JIU_JITSU");
}

/** Filtro do Prisma: alunos que participam de aulas desta modalidade. */
export function filtroDeAlunosPorModalidade(modalidade: Modality) {
  return { in: [modalidade, "AMBOS"] };
}
