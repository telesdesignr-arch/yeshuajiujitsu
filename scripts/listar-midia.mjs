/**
 * Lê public/fotos e public/video e escreve a lista em src/lib/midia-gerada.ts.
 *
 * Roda antes do `dev` e do `build` (veja os scripts do package.json), então a
 * lista está sempre igual ao conteúdo das pastas.
 *
 * Por que gerar um arquivo em vez de ler a pasta na hora que a página carrega:
 * o servidor nem sempre roda a partir da pasta do projeto, e aí a leitura
 * falhava sem dar erro visível -- a seção de fotos simplesmente sumia. Gerando
 * aqui, o caminho é o da própria pasta do projeto, que é sempre o certo.
 */
import { readdir, writeFile, mkdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXTENSOES_FOTO = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

async function listar(pasta) {
  try {
    return await readdir(join(raiz, "public", pasta));
  } catch {
    return [];
  }
}

/** "03-turma-kids.jpg" -> "turma kids" */
function descricao(arquivo) {
  const semExtensao = arquivo.replace(/\.[^.]+$/, "");
  const semNumero = semExtensao.replace(/^\d+[-_\s]*/, "");
  return semNumero.replace(/[-_]+/g, " ").trim() || "Foto da academia";
}

const fotos = (await listar("fotos"))
  .filter((a) => EXTENSOES_FOTO.includes(extname(a).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }))
  .map((a) => ({ src: `/fotos/${encodeURIComponent(a)}`, alt: descricao(a) }));

const arquivosVideo = await listar("video");
const fontes = [];
if (arquivosVideo.includes("hero.webm"))
  fontes.push({ src: "/video/hero.webm", type: "video/webm" });
if (arquivosVideo.includes("hero.mp4"))
  fontes.push({ src: "/video/hero.mp4", type: "video/mp4" });

const posterEncontrado = ["hero.jpg", "hero.jpeg", "hero.png", "hero.webp"].find(
  (n) => arquivosVideo.includes(n),
);

const video =
  fontes.length > 0
    ? { fontes, poster: posterEncontrado ? `/video/${posterEncontrado}` : null }
    : null;

const conteudo = `// GERADO AUTOMATICAMENTE por scripts/listar-midia.mjs.
// Não edite à mão: para trocar as fotos, mexa em public/fotos.

export type FotoDaAcademia = { src: string; alt: string };
export type VideoDoTopo = {
  fontes: { src: string; type: string }[];
  poster: string | null;
};

export const FOTOS_DA_ACADEMIA: FotoDaAcademia[] = ${JSON.stringify(fotos, null, 2)};

export const VIDEO_DO_TOPO: VideoDoTopo | null = ${JSON.stringify(video, null, 2)};
`;

await mkdir(join(raiz, "src", "lib"), { recursive: true });
await writeFile(join(raiz, "src", "lib", "midia-gerada.ts"), conteudo, "utf8");

console.log(
  `midia: ${fotos.length} foto(s), video ${video ? "presente" : "ausente"}`,
);
