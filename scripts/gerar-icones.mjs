/**
 * Gera os icones do app a partir do vetor oficial da academia.
 *
 *   npm run icones
 *
 * Rode de novo se a logo mudar. Os PNGs entram no repositorio de proposito:
 * assim o build da Vercel nao depende de gerar imagem.
 *
 * Por que PNG se ja temos o SVG:
 *  - o iPhone ignora SVG no icone da tela inicial; so aceita PNG
 *  - o Android aceita SVG, mas o icone "maskable" (que o sistema recorta em
 *    circulo ou squircle) precisa de margem propria, que so da para controlar
 *    gerando a imagem
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const origem = join(raiz, "public", "logo.svg");
const destino = join(raiz, "public", "icones");

// Fundo branco: o emblema tem anel preto e texto branco, que sumiria num
// fundo transparente sobre tema escuro do sistema.
const FUNDO = { r: 255, g: 255, b: 255, alpha: 1 };

const ICONES = [
  // Icone comum: a logo ocupa a imagem toda
  { arquivo: "icone-192.png", tamanho: 192, margem: 0 },
  { arquivo: "icone-512.png", tamanho: 512, margem: 0 },
  // Icone do iPhone: o sistema arredonda os cantos sozinho
  { arquivo: "apple-touch-icon.png", tamanho: 180, margem: 0 },
  // "Maskable": o Android recorta em circulo/squircle, entao deixamos 20% de
  // margem para o emblema nao ser cortado
  { arquivo: "icone-maskable-512.png", tamanho: 512, margem: 0.2 },
];

await mkdir(destino, { recursive: true });

for (const { arquivo, tamanho, margem } of ICONES) {
  const interno = Math.round(tamanho * (1 - margem * 2));
  const borda = Math.round((tamanho - interno) / 2);

  const logo = await sharp(origem, { density: 600 })
    .resize(interno, interno, { fit: "contain", background: FUNDO })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: tamanho,
      height: tamanho,
      channels: 4,
      background: FUNDO,
    },
  })
    .composite([{ input: logo, top: borda, left: borda }])
    .png()
    .toFile(join(destino, arquivo));

  console.log(`  ${arquivo} (${tamanho}x${tamanho})`);
}

// Favicon da aba do navegador
await sharp(origem, { density: 300 })
  .resize(48, 48, { fit: "contain", background: FUNDO })
  .flatten({ background: FUNDO })
  .png()
  .toFile(join(raiz, "public", "favicon.png"));

console.log("  favicon.png (48x48)");
console.log("");
console.log("Icones gerados em public/icones/");
