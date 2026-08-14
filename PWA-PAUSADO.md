# PWA — pausado, pronto para ligar

O trabalho de deixar o sistema instalável no celular está **construído mas
desligado**, por decisão de priorizar fechar o que já existe primeiro.

Nada disso está ativo hoje. O sistema funciona como site normal no navegador.

## O que já está pronto

| Arquivo | O que é | Ativo? |
|---|---|---|
| `public/icones/*.png` | Ícones gerados do vetor oficial | Sim — o navegador já usa |
| `public/favicon.png` | Ícone da aba | Sim |
| `scripts/gerar-icones.mjs` | Regera os ícones se a logo mudar (`npm run icones`) | — |
| `public/manifest.webmanifest` | Nome, cores, ícones e atalhos do app | Declarado, sem efeito sem o resto |
| `public/sw.js` | Service worker (cache e offline) | **Não** — ninguém registra |
| `src/app/offline/page.tsx` | Tela de "sem conexão" | Existe, nunca é chamada |
| `src/components/instalar-app.tsx` | Convite de instalação + registro do service worker | **Não** — não está importado |

## Como ligar depois

Uma linha em `src/app/app/layout.tsx`, dentro do `<main>`, antes de
`{children}`:

```tsx
import { InstalarApp } from "@/components/instalar-app";
...
<InstalarApp />
```

Esse componente faz as duas coisas: registra o service worker e mostra o
convite de instalação.

## Lembretes de quando voltarmos

- O service worker foi escrito de forma conservadora de propósito: páginas
  sempre buscam da rede, nunca servem cópia velha. O motivo está comentado no
  próprio arquivo.
- Android e iPhone instalam de formas diferentes. O componente trata os dois.
- **Não envolve App Store nem Play Store.** É instalação pelo próprio
  navegador, sem conta de desenvolvedor e sem aprovação.
- Depois de ligar, vale testar em celular de verdade — o comportamento de
  instalação não aparece direito no navegador do computador.
