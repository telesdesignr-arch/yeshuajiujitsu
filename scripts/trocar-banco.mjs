/**
 * Troca o tipo de banco de dados do projeto.
 *
 *   npm run usar-postgres   -> para publicar na internet (Vercel)
 *   npm run usar-sqlite     -> para voltar a rodar no seu computador
 *
 * A única coisa que muda é uma linha do arquivo prisma/schema.prisma.
 * O Prisma não aceita essa escolha por variável de ambiente, por isso
 * existe este script.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const caminho = join(raiz, "prisma", "schema.prisma");

const alvo = process.argv[2];
if (alvo !== "postgresql" && alvo !== "sqlite") {
  console.error('Use: node scripts/trocar-banco.mjs postgresql | sqlite');
  process.exit(1);
}

const original = readFileSync(caminho, "utf8");
const atualizado = original.replace(
  /provider = "(sqlite|postgresql)"\n  url/,
  `provider = "${alvo}"\n  url`,
);

if (original === atualizado) {
  console.log(`O banco já está configurado como ${alvo}. Nada a fazer.`);
  process.exit(0);
}

writeFileSync(caminho, atualizado, "utf8");

console.log(`Pronto! O projeto agora usa ${alvo}.`);
if (alvo === "postgresql") {
  console.log("");
  console.log("Próximos passos:");
  console.log("  1. Coloque a URL do Postgres em DATABASE_URL (no .env ou na Vercel)");
  console.log("  2. Rode: npx prisma db push");
  console.log("  3. Rode: npm run db:seed   (só se quiser os dados de exemplo)");
} else {
  console.log("");
  console.log("Rode: npx prisma db push");
}
