/**
 * Sistema de graduacao do Jiu-Jitsu.
 *
 * Sao DUAS escadas diferentes:
 *
 *   INFANTIL (ate 15 anos) -- 13 faixas, de Branca a Verde e Preta
 *   ADULTO   (16 anos ou mais) -- 5 faixas, de Branca a Preta
 *
 * Quase toda faixa tem 4 graus. O caminho e:
 *   Faixa lisa -> 1o Grau -> 2o Grau -> 3o Grau -> 4o Grau -> proxima faixa
 *
 * DUAS EXCECOES no topo da escada adulta:
 *
 *   PRETA vai ate o 6o Grau (e nao ate o 4o).
 *
 *   CORAL nao comeca do zero. Ela JA E o 7o grau: quem sai da preta 6o grau
 *   entra direto na coral como 7o. Nao existe "coral 1o grau". Por isso ela
 *   tem minDegree e maxDegree iguais a 7.
 *
 * Nas faixas de nome composto ("Verde e Preta", "Branca e Vermelha"), a
 * PRIMEIRA cor e o corpo da faixa e a SEGUNDA e uma listra que corre de ponta
 * a ponta pelo meio dela.
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
  /**
   * Corpo em blocos alternados ao longo do comprimento, em vez de cor unica.
   * E o desenho da coral: branco e vermelho se revezando, como a cobra que da
   * nome a faixa.
   */
  bodyPattern?: { cores: string[]; blocos: number };
  /**
   * Largura da tarja como fracao da largura da faixa. Vazio = 0.20, que e o
   * padrao. A coral usa uma tarja mais estreita.
   */
  tipWidth?: number;
  /** primeiro grau possivel nesta faixa (0 em todas, menos a coral, que e 7) */
  minDegree: number;
  /** ultimo grau possivel nesta faixa */
  maxDegree: number;
  /** meses de treino esperados entre um grau e o proximo */
  monthsPerDegree: number;
  /** meses esperados no ultimo grau antes da proxima faixa */
  monthsToNextBelt: number | null;
};

/** Graus de uma faixa normal: lisa ate o 4o. */
const GRAUS_PADRAO = { minDegree: 0, maxDegree: 4 };

/** Largura da tarja das faixas comuns, como fracao da largura da faixa. */
export const TARJA_PADRAO = 0.2;

/** Onde a tarja termina, medido da direita. Sobra um pedaco de faixa depois. */
export const TARJA_FIM = 0.1;

/**
 * Maior grau que existe no sistema. Serve so como teto de validacao; o limite
 * que vale de verdade e o da faixa (`maxDegree`).
 */
export const MAX_DEGREE = 7;

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
  vermelha: "#c1121f",
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
  ...GRAUS_PADRAO,
  ...RITMO_INFANTIL,
}));

/* -------------------------------------------------------------------------- */
/* Escada adulta (16 anos ou mais)                                             */
/* -------------------------------------------------------------------------- */

const ADULTO: BeltDef[] = [
  { key: "BRANCA", label: "Branca", color: COR.branca, ...GRAUS_PADRAO, monthsPerDegree: 4, monthsToNextBelt: 6 },
  { key: "AZUL", label: "Azul", color: COR.azul, ...GRAUS_PADRAO, monthsPerDegree: 6, monthsToNextBelt: 6 },
  { key: "ROXA", label: "Roxa", color: COR.roxa, ...GRAUS_PADRAO, monthsPerDegree: 5, monthsToNextBelt: 6 },
  { key: "MARROM", label: "Marrom", color: COR.marrom, ...GRAUS_PADRAO, monthsPerDegree: 4, monthsToNextBelt: 6 },
  // Preta: seis graus, e nao quatro. Tres anos por grau e uma referencia
  // conhecida do Jiu-Jitsu; do 6o grau para a coral sao cerca de sete anos.
  {
    key: "PRETA",
    label: "Preta",
    color: COR.preta,
    minDegree: 0,
    maxDegree: 6,
    monthsPerDegree: 36,
    monthsToNextBelt: 84,
  },
  // Coral: entra direto como 7o grau. Nao ha grau anterior dentro dela, por
  // isso minDegree = maxDegree = 7.
  //
  // A coral nao tem listra atravessando: o corpo inteiro alterna branco e
  // vermelho ao longo do comprimento. A tarja dela tambem e mais estreita que
  // a das outras faixas (30% menos larga).
  {
    key: "CORAL",
    label: "Coral",
    color: COR.branca,
    bodyPattern: { cores: [COR.branca, COR.vermelha], blocos: 14 },
    tipWidth: TARJA_PADRAO * 0.7,
    minDegree: 7,
    maxDegree: 7,
    monthsPerDegree: 0,
    monthsToNextBelt: null,
  },
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

/** Graus que existem dentro da faixa, do menor ao maior. Ex.: [0,1,2,3,4]. */
export function grausDaFaixa(belt: string) {
  const info = beltInfo(belt);
  const quantos = info.maxDegree - info.minDegree + 1;
  return Array.from({ length: quantos }, (_, i) => info.minDegree + i);
}

/** Encaixa um grau dentro do que a faixa aceita. */
export function grauValido(belt: string, degree: number) {
  const info = beltInfo(belt);
  return Math.min(info.maxDegree, Math.max(info.minDegree, degree));
}

/**
 * Confere se o par (faixa, grau) existe de verdade. Devolve a mensagem de erro
 * ou null quando esta certo.
 *
 * O formulario ja impede escolher um grau que a faixa nao tem, mas a checagem
 * precisa existir tambem no servidor: e o que garante que nao entre uma "coral
 * 2o grau" no banco por um pedido montado a mao.
 */
export function erroDeGraduacao(belt: string, degree: number): string | null {
  const info = beltInfo(belt);
  if (degree >= info.minDegree && degree <= info.maxDegree) return null;

  if (info.minDegree === info.maxDegree) {
    return `A faixa ${info.label} é sempre ${info.minDegree}º grau: não existe outro grau nela.`;
  }
  return `A faixa ${info.label} vai da lisa até o ${info.maxDegree}º grau.`;
}

/** "Faixa Verde e Preta · 2º Grau" / "Faixa Branca (lisa)" */
export function graduationLabel(belt: string, degree: number) {
  const info = beltInfo(belt);
  const name = `Faixa ${info.label}`;
  if (degree <= 0) return `${name} (lisa)`;
  return `${name} · ${degree}º Grau`;
}

/**
 * Quantos degraus a faixa ocupa na escada. A preta ocupa 7 (lisa ate o 6o) e a
 * coral ocupa 1 (so o 7o), enquanto as demais ocupam 5 (lisa ate o 4o).
 */
function degraus(b: BeltDef) {
  return b.maxDegree - b.minDegree + 1;
}

/**
 * Posicao absoluta na escada, para comparar dois alunos.
 *
 * Nao da para multiplicar a ordem da faixa por um numero fixo de graus, porque
 * as faixas tem quantidades diferentes: a soma corrida abaixo e o que mantem a
 * ordem correta mesmo com preta de 6 graus e coral de um so.
 *
 * As trilhas nao se misturam: o infantil vem antes do adulto.
 */
const OFFSET_DA_FAIXA = new Map<string, number>();
for (const trilha of ["INFANTIL", "ADULTO"] as Track[]) {
  let acumulado = 0;
  for (const b of trilha === "INFANTIL" ? INFANTIL : ADULTO) {
    OFFSET_DA_FAIXA.set(b.key, acumulado);
    acumulado += degraus(b);
  }
}

export function graduationRank(belt: string, degree: number) {
  const info = beltInfo(belt);
  const base = info.track === "INFANTIL" ? 0 : 1000;
  const dentroDaFaixa = grauValido(belt, degree) - info.minDegree;
  return base + (OFFSET_DA_FAIXA.get(info.key) ?? 0) + dentroDaFaixa;
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

  // Ainda ha grau a subir dentro da propria faixa.
  if (degree < current.maxDegree) {
    const target = Math.max(current.minDegree, degree + 1);
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
      degree: current.maxDegree,
      label: `Faixa ${current.label}, topo da escada`,
      expectedMonths: null,
    };
  }

  // A proxima faixa comeca no primeiro grau DELA: da preta 6o grau o aluno vai
  // para a coral ja como 7o, e nao para uma "coral lisa".
  return {
    kind: "FAIXA",
    belt: next.key,
    degree: next.minDegree,
    label:
      next.minDegree > 0
        ? `Faixa ${next.label} · ${next.minDegree}º Grau`
        : `Faixa ${next.label}`,
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
