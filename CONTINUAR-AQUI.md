# Yeshua Jiu-Jitsu — documento de passagem

**Cole este arquivo inteiro num chat novo do Claude Code.** Ele contém tudo o
que é preciso para continuar de onde paramos, sem precisar reler conversa
antiga.

Última atualização: 14/08/2026 · commit `f135dbc` · 22 commits · 98 arquivos

---

# 1. O que é isto

Sistema de gestão + site institucional da academia **Yeshua Jiu-Jitsu**
(*Jiu-Jitsu com Cristo*), no Rio de Janeiro.

| Quem | Papel |
|---|---|
| **Lucas Teles** | Dono do projeto. **Não é programador** — instruções sempre no nível do clique, nunca do comando técnico |
| **Renato Pierre** | Professor da academia. Quem vai usar o painel no dia a dia |

Três públicos, três áreas:

- **Site público** (`/`) — quem procura academia: aulas, horários, graduação, campeonatos, contato
- **Área do aluno** (`/app`) — evolução, frequência, agenda, mensalidade, campeonatos
- **Painel do professor** (`/painel`) — chamada, alunos, graduações, financeiro, campeonatos, agenda

---

# 2. Onde está tudo

| O quê | Onde |
|---|---|
| **Código no computador** | `C:\Users\lucas\Downloads\yeshua JJ` |
| **Repositório** | https://github.com/telesdesignr-arch/yeshuajiujitsu (privado) |
| **Conta do GitHub** | `telesdesignr-arch` — **não** a `telesouttax`, que é da Outtax |
| **Site no ar** | https://yeshuajiujitsu-eight.vercel.app |
| **Hospedagem** | Vercel, projeto `yeshuajiujitsu`, plano Hobby |
| **Banco de dados** | Neon (Postgres), banco `neon-sky-window`, região São Paulo, plano free |
| **Logo original** | `marca/` (SVG e PDF) e `public/logo.svg` |

## Acessos de teste (dados fictícios)

| Quem | E-mail | Senha |
|---|---|---|
| Professor / Admin | `renato@yeshuajiujitsu.com.br` | `yeshua123` |
| Aluno adulto | `joao@exemplo.com` | `yeshua123` |
| Adolescente (faixa infantil) | `enzo@exemplo.com` | `yeshua123` |
| Criança | `miguel@exemplo.com` | `yeshua123` |
| Aluno faltoso e em atraso | `anderson@exemplo.com` | `yeshua123` |

Todos os 21 alunos usam a mesma senha.

## Variáveis de ambiente

No arquivo `.env` local (que **nunca** vai para o GitHub) e no painel da
Vercel:

- `DATABASE_URL` — Postgres do Neon. Local usa a versão **sem** `-pooler`;
  a Vercel usa a com pooler
- `AUTH_SECRET` — assina o cookie de login. É diferente entre local e produção,
  de propósito

---

# 3. Como rodar

```bash
npm install
npm run dev
```

Abre em **http://localhost:3200** (a porta 3000 é de outro projeto do Lucas).

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda no computador |
| `npm run build` | Build de produção |
| `npm run db:seed` | Recria os dados de exemplo |
| `npm run db:studio` | Abre um navegador do banco |
| `npm run icones` | Regera os ícones a partir da logo |
| `npm run usar-sqlite` / `usar-postgres` | Troca o tipo de banco |

> **Atenção:** o `.env` local aponta para o banco de **produção**. O script de
> seed tem trava: fora de banco local só roda com
> `CONFIRMAR_SEED_EM_PRODUCAO=sim npm run db:seed`.

Publicar é só `git push` — a Vercel constrói e publica sozinha em ~2 minutos.

---

# 4. Tecnologia

- **Next.js 15.5.23** (App Router) + TypeScript + React 19
- **Tailwind CSS v4** — tokens da marca em `src/app/globals.css`
- **Prisma 6** + Postgres
- Autenticação própria: bcrypt + JWT em cookie httpOnly (`jose`)
- Ícones: `lucide-react`. Gráficos: SVG à mão, sem biblioteca
- Tipografia: Barlow Condensed (títulos) + Barlow (texto)

## Paleta

| Uso | Cor |
|---|---|
| Marrom da marca | `#73401d` — tirado do vetor oficial |
| Preto | `#14100d` |
| Vermelho do logo | `#e52521` |

## Mapa das pastas

```
prisma/schema.prisma      modelo do banco
prisma/seed.ts            dados de exemplo
src/lib/                  regras: belts, finance, stats, dates, money, competitions
src/actions/              ações de servidor (formulários)
src/app/(site)/           site público
src/app/app/              área do aluno
src/app/painel/           painel do professor
src/components/           componentes compartilhados
```

---

# 5. O que já está pronto

## Versão 1 — completa

Login com e-mail e senha · perfil do aluno · cadastro de alunos · chamada ·
faixas e graduação · histórico de evolução · agenda · painel do professor ·
site institucional.

## Versão 2 — parcial

| Módulo | Situação |
|---|---|
| Financeiro (mensalidades) | ✅ Pronto |
| Campeonatos | ✅ Pronto |
| Metas | ⬜ Não feito |
| Gamificação | ⬜ Não feito |
| Biblioteca de técnicas | ⬜ Não feito |

## Versão 3 — não iniciada

PWA (**pausado, ver seção 8**) · notificações · pagamento online (Mercado
Pago) · IA de acompanhamento · ranking · relatórios avançados.

---

# 6. Decisões que valem preservar

Estas não são preferências de estilo — cada uma resolve um problema concreto.
Mudar sem entender o motivo vai reintroduzir o problema.

### Duas escadas de graduação, não uma

Até 15 anos: escada **infantil**, 13 faixas (Branca → Cinza e Branca → Cinza →
Cinza e Preta → Amarela e Branca → Amarela → Amarela e Preta → Laranja e
Branca → Laranja → Laranja e Preta → Verde e Branca → Verde → Verde e Preta).
Aos 16: escada **adulta**, 5 faixas.

Nas faixas de nome composto, a **primeira cor é o corpo** e a **segunda é uma
listra** que corre de ponta a ponta. O sistema descobre a escada pela própria
faixa — não existe campo separado.

### Ritmo infantil: uma faixa por ano

2 meses por grau + 4 meses no 4º grau. São 13 faixas: com o ritmo adulto, um
adolescente de 13 anos apareceria com 12 anos de academia.

### Frequência = treinos ÷ meta do aluno

E não ÷ todas as aulas da academia. A academia abre 13 aulas por semana e
ninguém treina em todas — a segunda conta daria 20% para um aluno excelente.
Meta padrão: 12 treinos/mês, ajustável por aluno.

### Sequência em semanas, não em dias

Ninguém treina Jiu-Jitsu 6 dias seguidos. Contador de dias ficaria sempre em
zero e desmotivaria.

### O mês corrente é proporcionalizado nos gráficos

No dia 10, comparar "24% de agosto" com "65% de julho" daria impressão de
queda. O sistema calcula o mês corrente só sobre os dias decorridos.

### Dinheiro em centavos, como inteiro

R$ 149,90 é `14990`. Número quebrado acumula erro de arredondamento, e somando
mensalidades vira diferença de centavos no fechamento.

### "Atrasado" não é gravado, é calculado

Se fosse campo, dependeria de uma rotina rodar todo dia. Se falhasse num
feriado, o professor veria a academia em dia sem estar.

### Fuso fixo em America/Sao_Paulo

A Vercel roda em UTC. Sem isso, depois das 21h a chamada da aula das 19h cairia
no dia seguinte — exatamente quando o professor usa. Tudo passa pelos helpers
de `src/lib/dates.ts`.

### A sessão é conferida no banco a cada acesso

O cookie vale 30 dias. Sem essa conferência, desmarcar "Aluno ativo" não
tiraria o acesso de quem já está logado.

### Menu inferior do celular: máximo 5 itens

Acima disso os alvos ficam estreitos demais para o dedo. No computador a barra
lateral cabe mais. Por isso Mensalidade e Campeonatos entram pelo Perfil no
celular e ficam diretos no desktop.

### Campeonatos: cadastro manual, não importação automática

Investigamos as quatro federações. Só o **CBJJ/IBJJF** tem API de verdade
(`/api/v1/events/upcomings.json`, exige o cabeçalho `X-Requested-With`). O
**LBJJ** é WordPress e daria para ler pela API. **CBJJD** e **FJJRIO** exigiriam
raspagem de HTML — e são justamente as duas mais relevantes para uma academia
do Rio. Como são ~15 campeonatos/ano que interessam, cadastrar à mão custa 15
min/ano e funciona como curadoria. Raciocínio completo em
`src/lib/competitions.ts`.

---

# 7. Armadilhas que já morderam

Cada uma custou tempo para descobrir. Não repita.

### Tailwind v4 e o espaço no caminho da pasta

A pasta se chama `yeshua JJ`, **com espaço**. Isso quebra a detecção automática
de arquivos do Tailwind v4: as classes padrão funcionam, mas nenhuma classe do
`@theme` (`bg-brand-600`) nem valor arbitrário (`text-[3.25rem]`) é gerado.
Resolvido com `@source "../**/*.{ts,tsx}";` no `globals.css`. **Não remova
essa linha.**

### PowerShell corrompe acentos

`Get-Content | Set-Content` em arquivo `.ts`/`.tsx` transforma "Graduações" em
"GraduaÃ§Ãµes". Sempre use as ferramentas de edição de arquivo, nunca
substituição via PowerShell.

### O seed duplica se a tabela não estiver na limpeza

O `prisma/seed.ts` apaga tudo antes de recriar. **Toda tabela nova precisa
entrar naquela lista** — senão o seed passa a duplicar registros dela a cada
execução. Já aconteceu com os campeonatos.

### A Vercel bloqueia versão vulnerável do Next.js

O build passa e o deploy é recusado no fim. Se acontecer, é atualizar o Next.

### O commit via PowerShell com aspas quebra

Mensagens de commit com acentos ou aspas dão erro. Escreva a mensagem num
arquivo e use `git commit -F arquivo.txt`.

---

# 8. PWA — pausado de propósito

Ícones e manifesto **estão ativos**. Service worker, tela offline e convite de
instalação estão construídos mas **desligados**. Ligar é uma linha.
Detalhes em `PWA-PAUSADO.md`.

Registro para não se perder: **PWA não envolve App Store nem Play Store** — é
instalação pelo próprio navegador, sem conta de desenvolvedor.

---

# 9. O que falta

## 9.1 Aguardando o professor Renato

O documento completo está em `PARA-O-RENATO.md`. Foi combinado pedir **uma
coisa por vez**. O primeiro pedido já foi enviado:

> Abrir a tela **Graduações** e dizer se graduaria as pessoas listadas como
> "prontos para graduar".

Depois, nesta ordem: grade de horários → planos e chave Pix → lista de alunos →
fotos e endereço.

**Todos os números de graduação hoje são estimativa e precisam da confirmação
dele.**

## 9.2 Pendências do Lucas

1. **Trocar a senha do banco Neon** — ela foi exposta numa conversa. Não é
   urgente enquanto só houver dados fictícios, mas é obrigatório antes de
   entrar aluno real
2. Decidir se vão usar **Mercado Pago** (precisa de conta com CNPJ ou CPF)
3. Confirmar se a **LBJJ** encontrada (`lbjj.com.br`) é a liga certa

## 9.3 Buracos técnicos conhecidos

Nada está quebrado. Estes são recursos que faltam e vão doer no uso real:

| # | O quê | Quando dói |
|---|---|---|
| 1 | Recuperação de senha não existe | Primeira semana |
| 2 | E-mail de aviso ao professor quando o aluno paga (foi pedido, não construído) | Todo mês |
| 3 | Graduação registrada errada não pode ser corrigida nem apagada | Na primeira vez que errar |
| 4 | Campeonato e plano não podem ser editados, só apagados/desativados | Ao corrigir data ou valor |
| 5 | Foto do aluno: o campo existe, a tela de enviar não | Na migração |
| 6 | Site sem nenhuma foto da academia | Já dói |
| 7 | Não confirmado: aluno inativo deve gerar mensalidade? (hoje não gera) | No primeiro trancamento |
| 8 | Nenhum relatório exportável | Na contabilidade |

**Ordem recomendada:** 1 e 3 primeiro (travam o aluno do lado de fora e deixam
o professor sem desfazer o próprio erro), depois 2, depois 5 e 6 juntos (mesmo
trabalho por baixo: armazenamento de imagem).

---

# 10. Como o Lucas prefere trabalhar

- **Ele não é programador.** Instruções no nível do clique: "abra tal site,
  clique no botão X". Nunca assuma que ele sabe rodar comando ou editar arquivo
- **Nunca peça senha a ele nem digite senha por ele.** Onde precisar de senha
  ou dado de cartão, quem faz é ele
- Ele decide o rumo; peça escolha quando a decisão for realmente dele
- Explique o **porquê** das decisões técnicas, não só o quê
- Português do Brasil, direto, sem jargão desnecessário
- Ele valoriza saber dos problemas encontrados no caminho, inclusive os que
  foram erro meu

---

# 11. Onde ler mais

| Arquivo | Conteúdo |
|---|---|
| `README.md` | Visão geral, comandos, decisões |
| `PARA-O-RENATO.md` | Tudo que falta o professor confirmar |
| `TESTE-RENATO.md` | Roteiro de teste para o professor |
| `PUBLICAR.md` | Passo a passo de publicação (já feito) |
| `PWA-PAUSADO.md` | O que está pronto e desligado |
| `src/lib/belts.ts` | Regras de graduação, com os tempos |
| `src/lib/finance.ts` | Regras de mensalidade |
| `src/lib/competitions.ts` | Federações e por que não importamos automático |
