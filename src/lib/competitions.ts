/**
 * Campeonatos e resultados dos atletas.
 */

/* -------------------------------------------------------------------------- */
/* Federacoes                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Calendarios oficiais das federacoes onde a equipe compete.
 *
 * Por que apenas links, e nao importacao automatica:
 *
 * Investigamos os quatro sites. So o CBJJ tem API de verdade
 * (/api/v1/events/upcomings.json, exige o cabecalho X-Requested-With). LBJJ e
 * CBJJD sao WordPress -- no LBJJ os campeonatos sao posts da categoria
 * "competicoes" e dariam para ler pela API; no CBJJD nao, sao HTML solto. A
 * FJJRIO e PHP sem JSON nenhum.
 *
 * Ou seja: as duas federacoes mais relevantes para uma academia do Rio (FJJRIO
 * e CBJJD) sao justamente as que exigiriam raspagem de HTML -- que quebra em
 * silencio quando eles mexem no site, e deixa o aluno vendo lista velha.
 *
 * Como sao cerca de 15 campeonatos por ano que interessam a equipe, cadastrar
 * a mao custa uns 15 minutos por ano e ainda funciona como curadoria: o
 * professor publica so o que faz sentido para os alunos dele. Estes links
 * cobrem quem quiser ver o calendario completo, sempre atualizado na fonte.
 */
export const FEDERACOES = [
  {
    sigla: "FJJRIO",
    nome: "Federação de Jiu-Jitsu do Rio de Janeiro",
    descricao: "Campeonatos estaduais do Rio, com e sem kimono.",
    url: "https://www.fjjrio.app.br/",
  },
  {
    sigla: "CBJJD",
    nome: "Confederação Brasileira de Jiu-Jitsu Desportivo",
    descricao: "Circuitos Mineirinho e as etapas nacionais.",
    url: "https://cbjjd.com.br/eventos/",
  },
  {
    sigla: "CBJJ",
    nome: "Confederação Brasileira de Jiu-Jitsu (IBJJF)",
    descricao: "Opens internacionais, Brasileiro e Mundial. Exige carteirinha.",
    url: "https://cbjj.com.br/events/championships",
  },
  {
    sigla: "LBJJ",
    nome: "Liga Brasileira de Jiu-Jitsu",
    descricao: "Interclubes, festivais e etapas da liga.",
    url: "https://lbjj.com.br/calendario/",
  },
] as const;

export type Modality = "GI" | "NOGI" | "AMBOS";

export const MODALITIES: Record<string, { label: string; short: string }> = {
  GI: { label: "Com kimono (Gi)", short: "Gi" },
  NOGI: { label: "Sem kimono (No-Gi)", short: "No-Gi" },
  AMBOS: { label: "Com e sem kimono", short: "Gi + No-Gi" },
};

export function modalityLabel(m: string) {
  return MODALITIES[m]?.short ?? m;
}

/* -------------------------------------------------------------------------- */
/* Colocacoes                                                                  */
/* -------------------------------------------------------------------------- */

export type PlacementInfo = {
  label: string;
  short: string;
  /** cor da medalha; nulo quando nao houve podio */
  color: string | null;
  isPodium: boolean;
};

const OURO = "#d4a017";
const PRATA = "#9ca3af";
const BRONZE = "#a9633a";

export function placementInfo(placement: number): PlacementInfo {
  switch (placement) {
    case 1:
      return { label: "1º lugar", short: "Ouro", color: OURO, isPodium: true };
    case 2:
      return { label: "2º lugar", short: "Prata", color: PRATA, isPodium: true };
    case 3:
      return { label: "3º lugar", short: "Bronze", color: BRONZE, isPodium: true };
    case 0:
      return {
        label: "Participou",
        short: "Participou",
        color: null,
        isPodium: false,
      };
    default:
      return {
        label: `${placement}º lugar`,
        short: `${placement}º`,
        color: null,
        isPodium: false,
      };
  }
}

/** Opcoes oferecidas ao professor ao registrar um resultado. */
export const PLACEMENT_OPTIONS = [
  { value: 1, label: "1º lugar (ouro)" },
  { value: 2, label: "2º lugar (prata)" },
  { value: 3, label: "3º lugar (bronze)" },
  { value: 4, label: "4º lugar" },
  { value: 5, label: "5º lugar" },
  { value: 0, label: "Participou (sem medalha)" },
];

/* -------------------------------------------------------------------------- */
/* Contagem de medalhas                                                        */
/* -------------------------------------------------------------------------- */

export type MedalTally = {
  ouro: number;
  prata: number;
  bronze: number;
  podios: number;
  /** quantas vezes subiu ao tatame (linhas de resultado) */
  lutas: number;
  /** em quantos campeonatos diferentes competiu */
  campeonatos: number;
};

export function tallyMedals(
  results: { placement: number; competitionId: string }[],
): MedalTally {
  const tally: MedalTally = {
    ouro: 0,
    prata: 0,
    bronze: 0,
    podios: 0,
    lutas: results.length,
    campeonatos: new Set(results.map((r) => r.competitionId)).size,
  };

  for (const r of results) {
    if (r.placement === 1) tally.ouro += 1;
    else if (r.placement === 2) tally.prata += 1;
    else if (r.placement === 3) tally.bronze += 1;
  }
  tally.podios = tally.ouro + tally.prata + tally.bronze;

  return tally;
}

/**
 * Ordem do quadro de medalhas da equipe: mais ouro primeiro, depois prata,
 * depois bronze -- como num quadro olimpico.
 */
export function compareTally(a: MedalTally, b: MedalTally) {
  return b.ouro - a.ouro || b.prata - a.prata || b.bronze - a.bronze;
}
