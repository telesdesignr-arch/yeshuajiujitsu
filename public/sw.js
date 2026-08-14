/**
 * Service worker do Yeshua Jiu-Jitsu.
 *
 * ESTRATEGIA CONSERVADORA, DE PROPOSITO.
 *
 * Um service worker mal feito e pior que nenhum: ele passa a servir uma copia
 * velha da pagina e o usuario fica vendo dado desatualizado sem entender por
 * que, mesmo depois de atualizar a tela. Num sistema de chamada e mensalidade,
 * isso seria grave -- o professor daria baixa num pagamento e o aluno
 * continuaria vendo "em atraso".
 *
 * Por isso:
 *
 *  - PAGINAS E DADOS: sempre da rede primeiro. So caem no cache se o celular
 *    estiver realmente sem internet, e mesmo assim mostrando a tela de
 *    "sem conexao" em vez de dado velho disfarcado de atual.
 *
 *  - ARQUIVOS ESTATICOS (js, css, fontes, imagens do proprio site): cache
 *    primeiro. Eles tem nome com hash -- quando mudam, o nome muda -- entao
 *    servir do cache nunca entrega versao errada.
 *
 * Trocar a versao abaixo apaga os caches antigos na proxima visita.
 */

const VERSAO = "yeshua-v1";
const CACHE_ESTATICO = `${VERSAO}-estatico`;
const CACHE_PAGINAS = `${VERSAO}-paginas`;

const PAGINA_OFFLINE = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_PAGINAS)
      .then((cache) => cache.addAll([PAGINA_OFFLINE]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(
          chaves
            .filter((c) => !c.startsWith(VERSAO))
            .map((c) => caches.delete(c)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function ehEstatico(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icones/") ||
    url.pathname === "/logo.svg" ||
    url.pathname === "/favicon.png"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Só mexemos em leitura simples do próprio site. Envio de formulário,
  // login e chamada passam direto para a rede, sempre.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Arquivos estáticos: cache primeiro (o nome tem hash, não fica velho)
  if (ehEstatico(url)) {
    event.respondWith(
      caches.match(request).then(
        (cacheado) =>
          cacheado ??
          fetch(request).then((resposta) => {
            const copia = resposta.clone();
            caches.open(CACHE_ESTATICO).then((c) => c.put(request, copia));
            return resposta;
          }),
      ),
    );
    return;
  }

  // Páginas: rede primeiro. Sem internet, mostramos a tela de "sem conexão"
  // em vez de uma cópia velha que pareceria atual.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(PAGINA_OFFLINE).then((r) => r ?? Response.error()),
      ),
    );
  }
});
