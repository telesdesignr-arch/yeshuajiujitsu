# Yeshua Jiu-Jitsu

Site e sistema de gestão da academia **Yeshua Jiu-Jitsu** — *Jiu-Jitsu com Cristo*.
Professor responsável: Renato Pierre.

**No ar:** https://yeshuajiujitsu-eight.vercel.app

> O sistema está publicado com **dados de exemplo** (15 alunos fictícios).
> Quando os dados reais da academia chegarem, apagamos tudo e começamos limpo.

---

## O que já está pronto (Versão 1)

| # | Módulo | Onde fica |
|---|--------|-----------|
| 1 | Login com e-mail e senha | `/login` |
| 2 | Perfil do aluno | `/app/perfil` |
| 3 | Cadastro de alunos | `/painel/alunos/novo` |
| 4 | Controle de presença (chamada) | `/painel/chamada` |
| 5 | Faixa e graduação | `/painel/alunos/[aluno]` |
| 6 | Histórico de evolução | `/app/evolucao` |
| 7 | Agenda (horários + eventos) | `/app/agenda` e `/painel/agenda` |
| 8 | Dashboard do professor | `/painel` |
| — | Site institucional público | `/` |

Ainda **não** estão prontos (Versão 2 e 3): financeiro, campeonatos, metas,
gamificação, biblioteca de técnicas, notificações, pagamento online, IA,
ranking e relatórios avançados.

---

## Como rodar no seu computador

Abra o Terminal na pasta do projeto e rode, **uma vez só**:

```bash
npm install
```

Depois, sempre que quiser abrir o sistema:

```bash
npm run dev
```

O sistema abre em **http://localhost:3200**.

Para parar, aperte `Ctrl + C` no terminal.

### Entrar no sistema

| Quem | E-mail | Senha |
|------|--------|-------|
| Professor / Admin | `renato@yeshuajiujitsu.com.br` | `yeshua123` |
| Aluno de exemplo | `joao@exemplo.com` | `yeshua123` |

> Os 15 alunos, os horários e as 312 chamadas são **dados de exemplo**, criados
> só para o sistema não nascer vazio. Quando chegarem os dados reais, é só
> trocar as listas no arquivo `prisma/seed.ts` e rodar `npm run db:reset`.

---

## O que precisa ser trocado pelos dados reais

Cada item abaixo está marcado no código e é rápido de mudar:

| O quê | Arquivo |
|-------|---------|
| Endereço da academia | `src/lib/academia.ts` |
| WhatsApp e Instagram | `src/lib/academia.ts` |
| Logo oficial | salvar por cima de `public/logo.svg` |
| Horários das aulas | pelo próprio sistema, em `/painel/agenda` |
| Alunos | pelo próprio sistema, em `/painel/alunos/novo` |
| Tempo esperado entre graus | `src/lib/belts.ts` |

### Sobre a logo

O arquivo `public/logo.svg` é uma **reconstrução** do emblema da academia,
feita para o sistema não ficar sem marca. Quando você mandar o arquivo
original, ele substitui esse.

---

## Comandos disponíveis

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Abre o sistema no seu computador |
| `npm run build` | Prepara a versão de produção |
| `npm run db:seed` | Recria os dados de exemplo |
| `npm run db:reset` | Apaga tudo e recria do zero |
| `npm run db:studio` | Abre uma tela para ver o banco de dados |

---

## Decisões que valem explicar

**Frequência = treinos ÷ meta do aluno.**
A academia abre vários horários por dia e ninguém treina em todos. Comparar as
presenças com *todas* as aulas da academia daria números baixos e injustos.
Por isso cada aluno tem uma meta mensal (padrão: 12 treinos) e a frequência é
medida contra ela. A meta é ajustável aluno por aluno.

**Sequência é contada em semanas, não em dias.**
"Dias seguidos treinando" ficaria quase sempre em zero — ninguém treina
Jiu-Jitsu seis dias por semana. Semanas seguidas com pelo menos um treino é a
medida real de constância no tatame.

**O mês corrente é proporcionalizado nos gráficos.**
No dia 10 de agosto, comparar "24% de agosto" com "65% de julho" daria a
impressão de que a academia despencou. O sistema calcula o mês corrente só
sobre os dias que já passaram.

**"Pronto para graduar" olha os últimos 3 meses.**
A frequência do mês corrente oscila demais no começo do mês. Para sugerir
graduação, o sistema usa os 3 meses fechados anteriores.

**O sistema sugere, o professor decide.**
Nenhuma graduação é automática. A tela `/painel/graduacoes` é uma lista de
sugestões — quem gradua é sempre o professor.

---

## Tecnologia

- **Next.js 15** + TypeScript — roda na Vercel sem configuração
- **Tailwind CSS v4** — tokens de marca em `src/app/globals.css`
- **Prisma + SQLite** no computador → **Postgres** quando publicar
- **Barlow Condensed + Barlow** — tipografia
- Gráficos desenhados à mão em SVG (sem biblioteca externa, para o app
  carregar rápido no celular do aluno)

### Paleta

| Uso | Cor |
|-----|-----|
| Marrom da marca | `#7f5430` |
| Preto | `#14100d` |
| Branco | `#ffffff` |
| Faixa azul / roxa / marrom / preta | `#1e4b8f` `#5b2c87` `#6b4423` `#111111` |

---

## Publicar na internet

Ver o passo a passo em [`PUBLICAR.md`](./PUBLICAR.md).
