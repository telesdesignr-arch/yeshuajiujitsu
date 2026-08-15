/**
 * Foto do aluno.
 *
 * A foto vai guardada no proprio banco, como texto (data URL), e nao num
 * servico de arquivos. O motivo e pratico: a academia tem dezenas de alunos,
 * nao milhares, e assim nao existe conta para criar, chave para configurar nem
 * arquivo orfao quando um aluno e apagado. Em troca, a foto precisa ser
 * pequena -- ela e reduzida no navegador antes de subir.
 *
 * Se um dia a academia passar de algumas centenas de alunos, o caminho e
 * trocar isto por um servico de arquivos (Vercel Blob, por exemplo) e guardar
 * so o endereco aqui. O resto do sistema nao muda: `photoUrl` continua sendo
 * um texto que o navegador sabe exibir.
 */

/** Lado do quadrado salvo, em pixels. Cobre o maior avatar da tela com folga. */
export const FOTO_LADO = 200;

/**
 * Teto do texto salvo no banco, em caracteres.
 *
 * ~24 mil caracteres sao uns 18 KB. Com 100 alunos isso da 1,8 MB somados --
 * cabe numa listagem sem pesar. O redutor do navegador vai baixando a
 * qualidade ate caber aqui.
 */
export const FOTO_MAX_CARACTERES = 24_000;

/** Aceita so JPEG em data URL: e o que o redutor do navegador produz. */
export function fotoValida(valor: string) {
  return (
    valor.startsWith("data:image/jpeg;base64,") &&
    valor.length <= FOTO_MAX_CARACTERES
  );
}
