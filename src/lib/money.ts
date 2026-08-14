/**
 * Dinheiro.
 *
 * Todo valor circula em CENTAVOS, como numero inteiro. R$ 149,90 e 14990.
 *
 * Guardar 149.90 como decimal parece mais natural, mas numero quebrado no
 * computador acumula erro: 0.1 + 0.2 nao da exatamente 0.3. Somando dezenas de
 * mensalidades isso vira diferenca de centavos no fechamento do mes -- do tipo
 * que ninguem consegue explicar depois. Com centavos inteiros, a conta fecha
 * sempre.
 */

/** 14990 -> "R$ 149,90" */
export function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** 14990 -> "149,90" (sem o simbolo, para dentro de campos de formulario) */
export function formatMoneyInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/**
 * Le o que a pessoa digitou e devolve centavos.
 * Aceita "149,90", "149.90", "R$ 149,90", "149" e "1.149,90".
 * Devolve null quando nao da para entender.
 */
export function parseMoney(input: string): number | null {
  const limpo = input.replace(/[^\d,.-]/g, "").trim();
  if (!limpo) return null;

  let normalizado = limpo;

  // "1.149,90" -> ponto e separador de milhar, virgula e decimal
  if (limpo.includes(",")) {
    normalizado = limpo.replace(/\./g, "").replace(",", ".");
  } else if ((limpo.match(/\./g) ?? []).length > 1) {
    // "1.149.900" -> so milhares
    normalizado = limpo.replace(/\./g, "");
  }

  const valor = Number(normalizado);
  if (!Number.isFinite(valor) || valor < 0) return null;

  return Math.round(valor * 100);
}
