# Como publicar o sistema na internet

Guia passo a passo, no nível do clique. Não precisa saber programar.

Você vai usar três serviços, todos com **plano gratuito** suficiente para a
academia:

| Serviço | Para quê | Custo |
|---------|----------|-------|
| **GitHub** | Guardar o código | Grátis |
| **Neon** | Banco de dados (Postgres) | Grátis |
| **Vercel** | Colocar o site no ar | Grátis |

Reserve uns 30 minutos. Faça na ordem.

---

## Parte 1 — Criar o banco de dados (Neon)

O banco é onde ficam os alunos, presenças e graduações. Enquanto o sistema roda
no seu computador ele usa um arquivo local; na internet precisa de um banco de
verdade.

1. Abra **https://neon.tech** e clique em **Sign up**.
2. Entre com a sua conta do Google (é o caminho mais rápido).
3. Na tela de criar projeto:
   - **Project name:** `yeshua-jiujitsu`
   - **Postgres version:** deixe como está
   - **Region:** escolha **AWS São Paulo** (ou a mais próxima do Brasil)
4. Clique em **Create project**.
5. Vai aparecer uma caixa **Connection string** com um texto começando em
   `postgresql://`. Clique no botão de **copiar**.
6. **Cole esse texto em algum lugar seguro** (bloco de notas). Você vai precisar
   dele daqui a pouco. Ele é a senha do banco — não mande para ninguém.

---

## Parte 2 — Subir o código para o GitHub

1. Abra **https://github.com** e crie uma conta (ou entre na sua).
2. Clique no **+** no canto superior direito → **New repository**.
3. Preencha:
   - **Repository name:** `yeshua-jiujitsu`
   - Marque **Private** (só você enxerga)
   - **Não** marque nenhuma das caixinhas de "Initialize this repository"
4. Clique em **Create repository**.
5. A página seguinte mostra um endereço parecido com
   `https://github.com/seu-usuario/yeshua-jiujitsu.git`. **Copie esse endereço.**
6. Abra o Terminal na pasta do projeto e rode, trocando o endereço pelo seu:

```bash
git remote add origin https://github.com/SEU-USUARIO/yeshua-jiujitsu.git
```

```bash
git push -u origin main
```

7. Se o GitHub pedir login, entre com a sua conta.
8. Recarregue a página do GitHub: os arquivos devem estar lá.

> Se aparecer um erro dizendo que `origin` já existe, rode
> `git remote set-url origin https://github.com/SEU-USUARIO/yeshua-jiujitsu.git`
> e tente o `git push` de novo.

---

## Parte 3 — Preparar o projeto para o banco novo

Ainda no Terminal, na pasta do projeto:

```bash
npm run usar-postgres
```

Isso troca o tipo de banco de dados no projeto. Depois suba a mudança:

```bash
git add -A
```

```bash
git commit -m "Preparar para Postgres"
```

```bash
git push
```

---

## Parte 4 — Colocar no ar (Vercel)

1. Abra **https://vercel.com** e clique em **Sign up**.
2. Escolha **Continue with GitHub** e autorize.
3. No painel, clique em **Add New...** → **Project**.
4. Encontre `yeshua-jiujitsu` na lista e clique em **Import**.
5. **Antes de clicar em Deploy**, abra a seção **Environment Variables** e
   adicione **duas** variáveis:

   **Primeira:**
   - Name: `DATABASE_URL`
   - Value: cole aquele texto que começa com `postgresql://` (Parte 1, passo 6)

   **Segunda:**
   - Name: `AUTH_SECRET`
   - Value: uma frase longa e aleatória, sem espaços. Por exemplo:
     `yeshua-tatame-2026-frase-secreta-comprida-que-so-eu-sei-9f3k2`

   > O `AUTH_SECRET` é o que mantém o login dos alunos seguro. Invente uma frase
   > sua, com pelo menos 40 caracteres, e guarde no bloco de notas.

6. Clique em **Deploy** e espere (uns 2 minutos).
7. Quando terminar, a Vercel mostra o endereço do site, algo como
   `https://yeshua-jiujitsu.vercel.app`. **Ainda não abra** — falta criar as
   tabelas do banco.

---

## Parte 5 — Criar as tabelas e o primeiro usuário

No Terminal, na pasta do projeto:

1. Abra o arquivo `.env` (com o Bloco de Notas) e troque a linha do
   `DATABASE_URL` pela do Neon:

```
DATABASE_URL="postgresql://...cole aqui a sua..."
```

2. Salve o arquivo e rode:

```bash
npx prisma db push
```

Isso cria as tabelas vazias no banco da internet.

3. Se quiser começar com os dados de exemplo (15 alunos fictícios, para você e
   o Renato testarem):

```bash
npm run db:seed
```

Se preferir começar do zero, com só o professor cadastrado, me avise que eu
faço um comando específico para isso.

4. Agora sim, abra o endereço da Vercel. Entre com
   `renato@yeshuajiujitsu.com.br` / `yeshua123`.

5. **Troque a senha do Renato imediatamente**, em Perfil → Trocar minha senha.

---

## Parte 6 — Domínio próprio (quando quiser)

1. Compre o domínio (ex.: `yeshuajiujitsu.com.br`) no **Registro.br** —
   é o registrador oficial dos domínios `.com.br`, custa cerca de R$ 40 por ano.
2. Na Vercel, abra o projeto → **Settings** → **Domains** → **Add**.
3. Digite o domínio e clique em **Add**.
4. A Vercel mostra dois ou três registros de DNS. Copie cada um.
5. No Registro.br, vá em **DNS** → **Editar zona** e cole os registros.
6. Espere de 15 minutos a algumas horas. O certificado de segurança (o
   cadeadinho) é criado sozinho pela Vercel.

---

## Depois de publicado

Toda vez que eu (ou você) alterar o código e rodar `git push`, a Vercel
atualiza o site sozinha em cerca de 1 minuto. Não precisa refazer nada disso.

### Se algo der errado

- **"Erro ao entrar" / login não funciona:** confira se o `AUTH_SECRET` está
  configurado na Vercel (Settings → Environment Variables).
- **Página de erro ao abrir o site:** provavelmente as tabelas não foram
  criadas. Repita a Parte 5.
- **Site não atualiza depois do push:** abra a Vercel → aba **Deployments** e
  veja se o último deploy falhou. Me manda a mensagem de erro.

---

## Voltar a rodar no seu computador

Se quiser testar localmente de novo com o banco em arquivo:

```bash
npm run usar-sqlite
```

E deixe o `.env` local com `DATABASE_URL="file:./dev.db"`.
