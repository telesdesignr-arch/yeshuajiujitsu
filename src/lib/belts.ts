/**
 * Sistema de graduacao do Jiu-Jitsu.
 *
 * O caminho de cada aluno e sempre o mesmo:
 *   Branca -> 1o Grau -> 2o Grau -> 3o Grau -> 4o Grau -> Faixa Azul -> ...
 *
 * Os tempos abaixo sao referencias para o sistema sugerir quem esta proximo
 * de graduar. Quem decide continua sendo o professor -- o sistema so avisa.
 * O Renato pode ajustar esses numeros aqui a qualquer momento.
 */

export type BeltKey = "BRANCA" | "AZUL" | "ROXA" | "MARROM" | "PRETA";

export type BeltDef = {
  key: BeltKey;
  label: string;
  /** cor da faixa para desenhar na tela */
  color: string;
  /** cor de texto legivel sobre a cor da faixa */
  textOn: string;
  /** meses de treino esperados entre um grau e o proximo */
  monthsPerDegree: number;
  /** meses esperados no 4o grau antes da proxima faixa */
  monthsToNextBelt: number | null;
};

export const MAX_DEGREE = 4;

export const BELTS: BeltDef[] = [
  {
    key: "BRANCA",
    label: "Branca",
    color: "#f2f0ed",
    textOn: "#14100d",
    monthsPerDegree: 4,
    monthsToNextBelt: 6,
  },
  {
    key: "AZUL",
    label: "Azul",
    color: "#1e4b8f",
    textOn: "#ffffff",
    monthsPerDegree: 6,
    monthsToNextBelt: 6,
  },
  {
    key: "ROXA",
    label: "Roxa",
    color: "#5b2c87",
    textOn: "#ffffff",
    monthsPerDegree: 5,
    monthsToNextBelt: 6,
  },
  {
    key: "MARROM",
    label: "Marrom",
    color: "#6b4423",
    textOn: "#ffffff",
    monthsPerDegree: 4,
    monthsToNextBelt: 6,
  },
  {
    key: "PRETA",
    label: "Preta",
    color: "#111111",
    textOn: "#ffffff",
    monthsPerDegree: 36,
    monthsToNextBelt: null,
  },
];

export const BELT_KEYS = BELTS.map((b) => b.key);

export function beltInfo(belt: string): BeltDef {
  return BELTS.find((b) => b.key === belt) ?? BELTS[0];
}

export function beltLabel(belt: string) {
  return beltInfo(belt).label;
}

/** "Faixa Azul - 2o Grau" / "Faixa Branca (lisa)" */
export function graduationLabel(belt: string, degree: number) {
  const name = `Faixa ${beltLabel(belt)}`;
  if (degree <= 0) return `${name} (lisa)`;
  return `${name} · ${degree}º Grau`;
}

/** Posicao absoluta na escada de graduacao, para comparar dois alunos. */
export function graduationRank(belt: string, degree: number) {
  const beltIndex = Math.max(
    0,
    BELTS.findIndex((b) => b.key === belt),
  );
  return beltIndex * (MAX_DEGREE + 1) + Math.min(degree, MAX_DEGREE);
}

export type NextStep = {
  /** proximo passo e um grau novo ou a troca de faixa? */
  kind: "GRAU" | "FAIXA" | "FINAL";
  belt: BeltKey;
  degree: number;
  label: string;
  /** meses de treino esperados para chegar la */
  expectedMonths: number | null;
};

/** Qual e o proximo objetivo de quem esta em (faixa, grau). */
export function nextStep(belt: string, degree: number): NextStep {
  const current = beltInfo(belt);
  const index = BELTS.findIndex((b) => b.key === current.key);

  if (degree < MAX_DEGREE) {
    const target = degree + 1;
    return {
      kind: "GRAU",
      belt: current.key,
      degree: target,
      label: `${target}º Grau na Faixa ${current.label}`,
      expectedMonths: current.monthsPerDegree,
    };
  }

  const next = BELTS[index + 1];
  if (!next) {
    return {
      kind: "FINAL",
      belt: current.key,
      degree: MAX_DEGREE,
      label: "Faixa Preta 4º Grau — topo da escada",
      expectedMonths: null,
    };
  }

  return {
    kind: "FAIXA",
    belt: next.key,
    degree: 0,
    label: `Faixa ${next.label}`,
    expectedMonths: current.monthsToNextBelt,
  };
}

export type LadderStep = {
  belt: BeltKey;
  beltLabel: string;
  degree: number;
  label: string;
  status: "concluido" | "atual" | "futuro";
};

/**
 * A escada completa de graduacao, marcando onde o aluno esta.
 * Usada na linha do tempo da tela "Minha evolucao".
 */
export function graduationLadder(belt: string, degree: number): LadderStep[] {
  const currentRank = graduationRank(belt, degree);
  const steps: LadderStep[] = [];

  for (const b of BELTS) {
    for (let d = 0; d <= MAX_DEGREE; d++) {
      const rank = graduationRank(b.key, d);
      steps.push({
        belt: b.key,
        beltLabel: b.label,
        degree: d,
        label: d === 0 ? `Faixa ${b.label}` : `${d}º Grau`,
        status:
          rank < currentRank
            ? "concluido"
            : rank === currentRank
              ? "atual"
              : "futuro",
      });
    }
  }

  return steps;
}

/** Criterios que o professor avalia numa graduacao. */
export const GRADUATION_CRITERIA = [
  "Frequência nos treinos",
  "Técnica e execução",
  "Defesa pessoal",
  "Postura e disciplina",
  "Evolução no sparring",
  "Companheirismo e respeito",
] as const;
