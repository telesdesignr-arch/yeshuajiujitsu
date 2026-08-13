/**
 * Dados da academia usados no site publico e nos rodapes.
 * Tudo que for informacao de contato ou institucional fica aqui, para o
 * Renato conseguir atualizar num lugar so.
 */

export const ACADEMIA = {
  nome: "Yeshua Jiu-Jitsu",
  lema: "Jiu-Jitsu com Cristo",
  professor: "Renato Pierre",
  whatsapp: "5521987059207",
  whatsappFormatado: "(21) 98705-9207",
  instagram: "https://www.instagram.com/yeshuajiujitsuboxeteam/",
  instagramHandle: "@yeshuajiujitsuboxeteam",
  // TODO: trocar pelo endereco real quando o Renato passar
  endereco: "Rio de Janeiro · RJ",
} as const;

export function whatsappLink(mensagem: string) {
  return `https://wa.me/${ACADEMIA.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}
