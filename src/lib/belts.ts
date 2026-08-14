/**
 * Sistema de graduacao do Jiu-Jitsu.
 *
 * Sao DUAS escadas diferentes:
 *
 *   INFANTIL (ate 15 anos) -- 13 faixas, de Branca a Verde e Preta
 *   ADULTO   (16 anos ou mais) -- 5 faixas, de Branca a Preta
 *
 * Cada faixa tem 4 graus. O caminho e sempre:
 *   Faixa lisa -> 1o Grau -> 2o Grau -> 3o Grau -> 4o Grau -> proxima faixa
 *
 * Nas faixas de nome composto ("Verde e Preta"), a PRIMEIRA cor e o corpo da
 * faixa e a SEGUNDA e uma listra que corre de ponta a ponta pelo meio dela.
 *
 * Os tempos abaixo sao referencias para o sistema sugerir quem esta proximo
 * de graduar. Quem decide continua sendo o professor -- o sistema so avisa.
 */

export type Track = "INFANTIL" | "ADULTO";

export type BeltDef = {
  key: string;
  label: string;
  track: Track;
  /** posicao na escada da propria trilha (0 = primeira faixa) */
  order: number;
  /** cor do corpo da faixa */
  color: string;
  /** listra central que corre de ponta a ponta, nas faixas compostas */
  stripe?: string;
  /** meses de treino esperados entre um grau e o proximo */
  monthsPerDegree: number;
  /** meses esperados no 4o grau antes da proxima faixa */
  monthsToNextBelt: number | null;
};

export const MAX_DEGREE = 4;

/* -------------------------------------------------------------------------- */
/* Cores                                                                       */
/* -------------------------------------------------------------------------- */

const COR = {
  branca: "#f2f0ed",
  cinza: "#8b9096",
  amarela: "#f2c009",
  laranja: "#e2711d",
  verde: "#17651f",
  azul: "#1e4b8f",
  roxa: "#5b2c87",
  marrom: "#6b4423",
  preta: "#111111",
} as const;

/* -------------------------------------------------------------------------- */
/* Escada infantil (ate 15 anos)                                               */
/* -------------------------------------------------------------------------- */

// Ritmo infantil: um grau a cada 2 meses e mais 4 meses no 4o grau -- ou seja,
// aproximadamente UMA FAIXA POR ANO.
//
// A conta importa: sao 13 faixas ate a Verde e Preta. Se cada uma demorasse o
// mesmo que uma faixa adulta, uma crianca de 14 anos precisaria ter comecado a
// treinar com 3 meses de vida. Uma faixa por ano fecha com a realidade e ainda
// da retorno frequente, que e o que segura a crianca no tatame.
//
// RENATO: estes numeros sao estimativa. Se o ritmo da Yeshua for outro, e aqui
// que se muda.
const RITMO_INFANTIL = { monthsPerDegree: 2, monthsToNextBelt: 4 };

const INFANTIL: BeltDef[] = [
  { key: "INF_BRANCA", label: "Branca", color: COR.branca },
  { key: "INF_CINZA_BRANCA", label: "Cinza e Branca", color: COR.cinza, stripe: COR.branca },
  { key: "INF_CINZA", label: "Cinza", color: COR.cinza },
  { key: "INF_CINZA_PRETA", label: "Cinza e Preta", color: COR.cinza, stripe: COR.preta },
  { key: "INF_AMARELA_BRANCA", label: "Amarela e Branca", color: COR.amarela, stripe: COR.branca },
  { key: "INF_AMARELA", label: "Amarela", color: COR.amarela },
  { key: "INF_AMARELA_PRETA", label: "Amarela e Preta", color: COR.amarela, stripe: COR.preta },
  { key: "INF_LARANJA_BRANCA", label: "Laranja e Branca", color: COR.laranja, stripe: COR.branca },
  { key: "INF_LARANJA", label: "Laranja", color: COR.laranja },
  { key: "INF_LARANJA_PRETA", label: "Laranja e Preta", color: COR.laranja, stripe: COR.preta },
  { key: "INF_VERDE_BRANCA", label: "Verde e Branca", color: COR.verde, stripe: COR.branca },
  { key: "INF_VERDE", label: "Verde", color: COR.verde },
  { key: "INF_VERDE_PRETA", label: "Verde e Preta", color: COR.verde, stripe: COR.preta },
].map((b, i) => ({
  ...b,
  track: "INFANTIL" as const,
  order: i,
  ...RITMO_INFANTIL,
}));

/* -------------------------------------------------------------------------- */
/* Escada adulta (16 anos ou mais)                                             */
/* -------------------------------------------------------------------------- */

const ADULTO: BeltDef[] = [
  { key: "BRANCA", label: "Branca", color: COR.branca, monthsPerDegree: 4, monthsToNextBelt: 6 },
  { key: "AZUL", label: "Azul", color: COR.azul, monthsPerDegree: 6, monthsToNextBelt: 6 },
  { key: "ROXA", label: "Roxa", color: COR.roxa, monthsPerDegree: 5, monthsToNextBelt: 6 },
  { key: "MARROM", label: "Marrom", color: COR.marrom, monthsPerDegree: 4, monthsToNextBelt: 6 },
  { key: "PRETA", label: "Preta", color: COR.preta, monthsPerDegree: 36, monthsToNextBelt: null },
].map((b, i) => ({ ...b, track: "ADULTO" as const, order: i }));

/* -------------------------------------------------------------------------- */

export const BELTS_POR_TRILHA: Record<Track, BeltDef[]> = {
  INFANTIL: INFANTIL,
  ADULTO: ADULTO,
};

/** Todas as faixas, infantis primeiro. */
export const BELTS: BeltDef[] = [...INFANTIL, ...ADULTO];

export const BELT_KEYS = BELTS.map((b) => b.key);

const POR_CHAVE = new Map(BELTS.map((b) => [b.key, b]));

export function beltInfo(belt: string): BeltDef {
  return POR_CHAVE.get(belt) ?? ADULTO[0];
}

export function beltLabel(belt: string) {
  return beltInfo(belt).label;
}

/** A qual escada a faixa pertence. */
export function trackOf(belt: string): Track {
  return beltInfo(belt).track;
}

export function beltsDaTrilha(track: Track) {
  return BELTS_POR_TRILHA[track];
}

export const TRACK_LABEL: Record<Track, string> = {
  INFANTIL: "Infantil (até 15 anos)",
  ADULTO: "Adulto (16 anos ou mais)",
};

/** "Faixa Verde e Preta · 2º Grau" / "Faixa Branca (lisa)" */
export function graduationLabel(belt: string, degree: number) {
  const name = `Faixa ${beltLabel(belt)}`;
  if (degree <= 0) return `${name} (lisa)`;
  return `${name} · ${degree}º Grau`;
}

/**
 * Posicao absoluta na escada, para comparar dois alunos.
 * As trilhas nao se misturam: o infantil vem antes do adulto.
 */
export function graduationRank(belt: string, degree: number) {
  const info = beltInfo(belt);
  const base = info.track === "INFANTIL" ? 0 : 1000;
  return base + info.order * (MAX_DEGREE + 1) + Math.min(degree, MAX_DEGREE);
}

export type NextStep = {
  kind: "GRAU" | "FAIXA" | "FINAL";
  belt: string;
  degree: number;
  label: string;
  expectedMonths: number | null;
};

/** Qual e o proximo objetivo de quem esta em (faixa, grau). */
export function nextStep(belt: string, degree: number): NextStep {
  const current = beltInfo(belt);
  const escada = beltsDaTrilha(current.track);

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

  const next = escada[current.order + 1];

  // Fim da escada infantil: o proximo passo e a faixa branca adulta.
  if (!next && current.track === "INFANTIL") {
    return {
      kind: "FAIXA",
      belt: ADULTO[0].key,
      degree: 0,
      label: "Faixa Branca adulta",
      expectedMonths: current.monthsToNextBelt,
    };
  }

  if (!next) {
    return {
      kind: "FINAL",
      belt: current.key,
      degree: MAX_DEGREE,
      label: "Faixa Preta 4º Grau, topo da escada",
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

/** Criterios que o professor avalia numa graduacao. */
export const GRADUATION_CRITERIA = [
  "Frequência nos treinos",
  "Técnica e execução",
  "Defesa pessoal",
  "Postura e disciplina",
  "Evolução no sparring",
  "Companheirismo e respeito",
] as const;
