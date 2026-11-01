---
order: 1
---

# Códigos de status HTTP e cabeçalhos de controle

Quando um navegador ou um programa pede uma página a um servidor, a resposta contém bem mais do que a página: ela traz um **código de status** (um número que diz se deu certo) e **cabeçalhos** (linhas de instruções do tipo « guarde esta página por 60 segundos » ou « volte em 5 segundos »). Este capítulo ensina a ler esses dois elementos, a produzi-los do lado do servidor e, sobretudo, a reagir corretamente do lado do cliente. Ele supõe conhecidos os fundamentos de [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) (um **cliente** envia uma **requisição**, um **servidor** devolve uma **resposta**) e o uso de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (a janela onde se digitam comandos no teclado). Ele se situa na seção [Servidores web](/?c=infrastructure-devops&s=serveurs-web&p=serveurs-web).

Um **servidor web** é um programa que aguarda requisições HTTP e responde a elas: é ele que fica por trás de um site ou de uma API (uma interface que outros programas chamam por HTTP para obter ou enviar dados). Um **cabeçalho** (*header*) é uma linha `Nome: valor` colocada antes do conteúdo de uma mensagem HTTP, que transmite uma informação sobre a própria mensagem, e não sobre o seu conteúdo.

## Uma resposta HTTP, linha por linha

Uma resposta HTTP se divide sempre em três partes: uma linha de status, cabeçalhos e, depois, uma linha vazia seguida do conteúdo (o **corpo**).

```text
HTTP/1.1 429 Too Many Requests        <- linha de status : versão, código, nome do código
Content-Type: text/plain; charset=utf-8   <- cabeçalhos : um « Nome: valor » por linha
Content-Length: 21
Retry-After: 5
                                       <- linha vazia : fim dos cabeçalhos
Muitas requisições                     <- corpo : o conteúdo propriamente dito
```

`Content-Type` (o tipo do conteúdo) e `Content-Length` (o tamanho dele em bytes) são explicados em [Content-Type e Content-Length](#content-type-e-content-length-ler-o-corpo-corretamente).

| Parte | Papel | Quem a lê |
|---|---|---|
| Linha de status | Resume o resultado: `429` é o **código**, `Too Many Requests` é o nome dele em inglês | O programa (o código foi feito para ser lido por uma máquina) |
| Cabeçalhos | Especificam como tratar o corpo e como se comportar em seguida | O navegador, o programa, os caches intermediários |
| Corpo | O conteúdo: página, dados [JSON](/?c=infrastructure-devops&s=infrastructure&p=json), mensagem de erro... | O usuário ou o programa |

O código é a parte confiável: o nome que o acompanha é uma indicação para os humanos, e o corpo pode ser qualquer coisa. Um programa decide, portanto, **com base no código**, nunca com base no texto.

## Observar uma resposta com `curl`

Os comandos deste capítulo são escritos para Bash (Linux, macOS, WSL ou Git Bash), não para PowerShell nem cmd.

**`curl`** é um programa de terminal que envia uma requisição HTTP e exibe a resposta ([documentação oficial](https://curl.se/docs/manpage.html)). Ele está presente na maioria dos Linux e macOS; no Windows PowerShell, o nome `curl` costuma designar outro [alias](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), e é preciso digitar `curl.exe`. Verifique sua presença com `curl --version`.

| Opção | Efeito |
|---|---|
| `-i` | Exibe os cabeçalhos da resposta antes do corpo |
| `-I` | Envia uma requisição `HEAD` (um [método HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http#uma-requisicao-um-metodo-um-endereco-as-vezes-dados) : como `GET`, mas o servidor devolve somente a linha de status e os cabeçalhos, sem corpo) |
| `-s` | Silencioso : sem barra de progresso |
| `-o /dev/null` | Descarta o corpo (`/dev/null` é a « lixeira » de arquivos do Linux e do macOS, ver [os redirecionamentos](/?c=langages&s=bash&p=redirections-et-pipes)) |
| `-w '%{http_code}\n'` | Exibe, quando a requisição termina, somente o código de status (`\n` passa para a linha seguinte) |
| `-L` | Segue os redirecionamentos (ver `Location` mais abaixo) |
| `-H 'Nome: valor'` | Acrescenta um cabeçalho à requisição |

Para poder testar tudo em casa, a seção seguinte traz um pequeno servidor de demonstração.

## Um servidor de teste em Node.js

**Node.js** é um programa que executa JavaScript fora do navegador ([site oficial e instalação](https://nodejs.org/en/download)); é preciso Node 18 ou superior (verifique com `node --version`); seu módulo `http` permite criar um servidor ([documentação](https://nodejs.org/api/http.html)). O código abaixo supõe os fundamentos de [JavaScript](/?c=langages&s=javascript&p=javascript) : [funções](/?c=langages&s=javascript&p=fonctions), [condições](/?c=langages&s=javascript&p=conditions), [objetos](/?c=langages&s=javascript&p=objets) e [arrays](/?c=langages&s=javascript&p=tableaux). Salve-o em um arquivo `servidor.mjs` (a extensão `.mjs` indica ao Node que o arquivo usa `import`, ver [o editor de código](/?c=fondamentaux&s=bases-de-l-informatique&p=editeur-de-code-et-ide)).

Ele escuta em `127.0.0.1` (o endereço da **sua própria máquina**, ver [o endereçamento de rede](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau)) e na **porta** 5628 (um número que distingue vários programas de rede em uma mesma máquina, ver [os sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)). Se essa porta já estiver ocupada, o Node exibe `EADDRINUSE` : troque o número em `PORTA` e nos endereços dos exemplos.

```javascript
// import carrega um módulo : http é o do Node que permite criar um servidor web
import http from "node:http";

// PORTA : o « número da porta » em que o servidor escuta
const PORTA = 5628;
// LIMITE : número de requisições aceitas por janela de tempo
const LIMITE = 3;
// JANELA_MS : duração de uma janela, em milissegundos (5000 ms = 5 s)
const JANELA_MS = 5000;

// ROTAS : para cada endereço fixo, o status, os cabeçalhos e o corpo a devolver
const ROTAS = {
  // 301 : o cabeçalho Location dá o novo endereço da página
  "/antigo": [301, { Location: "/novo" }, ""],
  // 200 : o cliente pode guardar a página por 60 segundos (Cache-Control)
  "/novo": [200, { "Cache-Control": "max-age=60" }, "Bem-vindo\n"],
  // 401 : « quem é você? » ; WWW-Authenticate indica como se identificar
  // (Basic : um nome de usuário e uma senha ; realm : o nome da zona protegida)
  "/privado": [401, { "WWW-Authenticate": 'Basic realm="privado"' }, "Identifique-se\n"],
  // 403 : o servidor sabe quem você é, mas recusa
  "/proibido": [403, {}, "Acesso negado\n"],
  // 503 : servidor em manutenção ; Retry-After diz para voltar em 120 segundos
  "/manutencao": [503, { "Retry-After": "120" }, "Manutenção em andamento\n"],
};

// inicioJanela : instante (em ms) em que a janela atual começou
// (Date.now() dá o instante presente em milissegundos)
let inicioJanela = Date.now();
// contador : número de requisições já vistas na janela atual
let contador = 0;

// responder envia um status, cabeçalhos e um corpo de texto
function responder(res, status, cabecalhos, corpo) {
  // Content-Length : tamanho do corpo em bytes (um « ç » ocupa 2 bytes em UTF-8)
  // Buffer : o tipo do Node para manipular bytes ; byteLength conta os do corpo
  const tamanho = Buffer.byteLength(corpo);
  // cabeçalhos comuns a todas as respostas ; ...cabecalhos copia os da rota
  const todos = {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": tamanho,
    ...cabecalhos,
  };
  // writeHead fixa o status e os cabeçalhos, end envia o corpo
  res.writeHead(status, todos);
  res.end(corpo);
}

// limitar conta a requisição e devolve a espera em segundos (0 = aceita)
function limitar(agora) {
  // se a janela terminou, recomeça com um contador zerado
  if (agora - inicioJanela >= JANELA_MS) {
    inicioJanela = agora;
    contador = 0;
  }
  // mais uma requisição na janela
  contador += 1;
  // abaixo do limite : aceita ; senão, segundos restantes arredondados para cima
  if (contador <= LIMITE) return 0;
  return Math.ceil((inicioJanela + JANELA_MS - agora) / 1000);
}

// servirPagina responde a /pagina : 304 se o cliente já possui a versão "v1"
function servirPagina(req, res) {
  // if-none-match : a etiqueta (ETag) que o cliente guardou da visita anterior
  if (req.headers["if-none-match"] === '"v1"') {
    // 304 : nada mudou, por isso a resposta não tem corpo de propósito
    res.writeHead(304, { ETag: '"v1"' });
    res.end();
    return;
  }
  // primeira visita : a página inteira, com sua etiqueta de versão
  responder(res, 200, { ETag: '"v1"', "Cache-Control": "no-cache" }, "Página v1\n");
}

// servidor : a função passada a createServer é chamada a cada requisição
// req : a requisição recebida, res : a resposta a enviar
// (req, res) => { ... } é uma função escrita com seta, sem nome
const servidor = http.createServer((req, res) => {
  // req.url : a parte do endereço depois do nome da máquina, por exemplo /api
  if (req.url === "/api") {
    // espera : 0 se a requisição for aceita, senão o número de segundos a aguardar
    const espera = limitar(Date.now());
    // 429 Too Many Requests, com Retry-After em segundos (String : número em texto)
    if (espera > 0) {
      responder(res, 429, { "Retry-After": String(espera) }, "Muitas requisições\n");
      return;
    }
    // senão : 200 com uma resposta no formato JSON
    responder(res, 200, { "Content-Type": "application/json" }, '{"ok":true}\n');
    return;
  }
  // /pagina cuida da própria lógica
  if (req.url === "/pagina") {
    servirPagina(req, res);
    return;
  }
  // rota fixa conhecida : ...ROTAS[req.url] passa os três valores a responder
  if (ROTAS[req.url]) {
    responder(res, ...ROTAS[req.url]);
    return;
  }
  // qualquer outro endereço não existe : 404
  responder(res, 404, {}, "Não encontrado\n");
});

// listen inicia a escuta ; 127.0.0.1 = somente esta máquina
servidor.listen(PORTA, "127.0.0.1");
```

| Endereço | O que o servidor devolve |
|---|---|
| `/api` | `200` para as 3 primeiras requisições de cada janela de 5 segundos, depois `429` com `Retry-After` |
| `/antigo` | `301` e `Location: /novo` |
| `/novo` | `200` e `Cache-Control: max-age=60` |
| `/pagina` | `200` com um `ETag`, ou `304` se o cliente já o conhece |
| `/privado` | `401` |
| `/proibido` | `403` |
| `/manutencao` | `503` com `Retry-After` |
| qualquer outro endereço | `404` |

Execute-o em um primeiro terminal com `node servidor.mjs` : o terminal fica ocupado enquanto o servidor roda (parada com `Ctrl+C`). Abra um **segundo** terminal para os comandos `curl` seguintes. Um exemplo, com a resposta realmente obtida :

```bash
# -i : exibe os cabeçalhos ; /novo é a página que traz Cache-Control
curl -i http://127.0.0.1:5628/novo
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 10
Cache-Control: max-age=60
Date: Sat, 31 Oct 2026 22:01:54 GMT
Connection: keep-alive
Keep-Alive: timeout=5

Bem-vindo
```

`Date`, `Connection` e `Keep-Alive` são acrescentados automaticamente pelo Node (a data e a hora da resposta, depois a instrução de manter a conexão aberta por alguns segundos) ; nas saídas do restante do capítulo, essas três linhas são omitidas para deixá-las mais leves.

## As cinco famílias de códigos

Um código de status tem três algarismos, e **o primeiro** basta para saber a família :

| Família | Nome | Sentido geral | Quem deve agir depois |
|---|---|---|---|
| `1xx` | Informação | A requisição foi recebida, o restante está a caminho (raramente visto por um desenvolvedor de aplicações) | Ninguém, o protocolo cuida disso |
| `2xx` | Sucesso | A requisição foi compreendida e tratada | Ninguém |
| `3xx` | Redirecionamento | O recurso está em outro lugar ou não mudou | O cliente deve fazer outra requisição (ou reutilizar a sua cópia) |
| `4xx` | Erro do cliente | A requisição está incorreta, proibida ou é frequente demais | **O cliente** deve modificar sua requisição ou seu comportamento |
| `5xx` | Erro do servidor | A requisição era válida, mas o servidor não conseguiu tratá-la | **O servidor** deve ser consertado ; o cliente pode, às vezes, tentar de novo mais tarde |

A ideia a reter : o primeiro algarismo responde à pergunta « **quem precisa mudar alguma coisa?** ». Repetir idêntica uma requisição que deu um `4xx` não adianta (exceto `429`, ver mais abaixo) ; repetir uma requisição que deu um `5xx` pode dar certo se a falha for passageira.

## Os códigos que mais aparecem

### Sucesso e redirecionamentos

| Código | Nome | Sentido | Responsável | Exemplo |
|---|---|---|---|---|
| `200` | OK | A requisição deu certo, o corpo contém o resultado | Ninguém | Carregar uma página, ler uma lista |
| `201` | Created | Um novo recurso foi criado ; `Location` indica seu endereço | Ninguém | Resposta a um `POST` que cria uma conta |
| `204` | No Content | Sucesso, propositalmente **sem corpo** | Ninguém | Resposta a um `DELETE` bem-sucedido |
| `301` | Moved Permanently | O recurso mudou de endereço de forma definitiva (`Location`) | Servidor (configuração) | Um site que passa de um endereço antigo para um novo |
| `302` | Found | O recurso está **temporariamente** em outro lugar (`Location`) | Servidor (configuração) | Redirecionar para a página de login e depois voltar |
| `304` | Not Modified | Nada mudou desde a cópia que o cliente possui ; **sem corpo** | Ninguém | Um navegador que revalida uma página que já tem |

`301` e `302` nem sempre mantêm o método original : um navegador pode transformar um `POST` redirecionado em `GET`. Os códigos `308` (equivalente permanente) e `307` (equivalente temporário) obrigam a **manter o mesmo método** ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) ; uma RFC, *Request For Comments*, é um documento numerado que descreve uma norma da Internet). A `301` pode ser memorizada por muito tempo pelos navegadores, o que a torna incômoda de corrigir se tiver sido um erro.

### Erros do cliente (4xx)

| Código | Nome | Sentido | Responsável | Exemplo |
|---|---|---|---|---|
| `400` | Bad Request | A requisição está malformada ou inválida | Cliente | JSON quebrado, campo obrigatório ausente |
| `401` | Unauthorized | **Não identificado** : o servidor não sabe quem você é (ou a identificação está errada) | Cliente | Senha ausente, token expirado (um token é um código temporário que comprova a sua identidade) |
| `403` | Forbidden | **Identificado, mas recusado** : o servidor sabe quem você é e não autoriza | Cliente | Um usuário comum que pede uma página de administração |
| `404` | Not Found | O recurso não existe (ou o servidor se recusa a dizer que ele existe) | Cliente | Erro de digitação no endereço |
| `429` | Too Many Requests | **Requisições demais** em um dado intervalo de tempo ; costuma vir com `Retry-After` | Cliente | Um script que consulta uma API em laço |

### Erros do servidor (5xx)

| Código | Nome | Sentido | Responsável | Exemplo |
|---|---|---|---|---|
| `500` | Internal Server Error | O servidor encontrou um erro imprevisto | Servidor | Bug no código, [banco de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees) inacessível |
| `502` | Bad Gateway | Um servidor intermediário recebeu uma resposta inválida do servidor que está atrás dele | Servidor (cadeia de servidores) | O programa de aplicação travou atrás de um [proxy reverso](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit) (definido abaixo da tabela) |
| `503` | Service Unavailable | O servidor não pode responder **por enquanto** (sobrecarga, manutenção) ; costuma vir com `Retry-After` | Servidor | Atualização em andamento |
| `504` | Gateway Timeout | O intermediário esperou tempo demais pela resposta do servidor que está atrás dele | Servidor (cadeia de servidores) | Requisição muito lenta em um site atrás de um proxy reverso |

Um **proxy reverso** é um servidor intermediário que recebe as requisições no lugar do servidor de aplicação e as repassa a ele : é ele que produz um `502` ou um `504` quando o servidor que está atrás dele está fora do ar ou lento demais.

Verifiquemos alguns desses códigos no servidor de teste (as linhas `Date`, `Connection` e `Keep-Alive` são omitidas, e uma linha vazia separa aqui cada resposta) :

```bash
# 301 : -i exibe o cabeçalho Location ; sem -L, o curl não segue o redirecionamento
curl -i http://127.0.0.1:5628/antigo
# 401 : o cabeçalho WWW-Authenticate diz como se identificar
curl -i http://127.0.0.1:5628/privado
# 403 : nenhum cabeçalho especial, o servidor simplesmente recusa
curl -i http://127.0.0.1:5628/proibido
# 404 : endereço desconhecido pelo servidor
curl -i http://127.0.0.1:5628/ausente
```

```text
HTTP/1.1 301 Moved Permanently
Content-Type: text/plain; charset=utf-8
Content-Length: 0
Location: /novo

HTTP/1.1 401 Unauthorized
Content-Type: text/plain; charset=utf-8
Content-Length: 15
WWW-Authenticate: Basic realm="privado"

Identifique-se

HTTP/1.1 403 Forbidden
Content-Type: text/plain; charset=utf-8
Content-Length: 14

Acesso negado

HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Content-Length: 16

Não encontrado
```

A primeira resposta não tem corpo (o `Content-Length: 0` indica isso) ; as outras três têm um. Para reter somente o código, `-w` basta :

```bash
# -s silencioso, -o /dev/null descarta o corpo, -w exibe o código de status
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5628/ausente
```

Isso exibe `404`.

### `401` ou `403`: a confusão mais frequente

A **autenticação** responde à pergunta « quem é você? » ; a **autorização** responde à pergunta « você tem o direito de fazer isto? » ([a diferença em detalhe](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation)). O nome oficial do `401`, *Unauthorized*, é enganoso : ele fala de **autenticação**.

| Situação | Código | O que o cliente deve fazer |
|---|---|---|
| Nenhum identificador enviado | `401` | Identificar-se, depois recomeçar |
| Identificador errado ou token expirado | `401` | Identificar-se de novo |
| Identificado, mas sem o direito (usuário comum, página de administração) | `403` | Nada : identificar-se de novo não muda nada, é preciso outra conta ou outra permissão |
| Recurso que se prefere não revelar | `404` | Nada (o servidor esconde de propósito que ele existe) |

## Os cabeçalhos que comandam o cliente

Alguns cabeçalhos de resposta não descrevem apenas o conteúdo : eles **dizem ao cliente o que fazer**.

| Cabeçalho | O que pede | Costuma aparecer com |
|---|---|---|
| `Retry-After` | Esperar antes de tentar de novo | `429`, `503` |
| `Cache-Control` | Guardar (ou não guardar) a resposta na memória | `200`, `304` |
| `Location` | Ir para este endereço | `201`, `301`, `302`, `307`, `308` |
| `Content-Type` | Ler o corpo como este tipo de conteúdo | Quase todas as respostas com corpo |
| `Content-Length` | Ler exatamente este número de bytes de corpo | Quase todas as respostas com corpo |

### `Location`: para onde ir agora

Com um redirecionamento (`3xx`), `Location` dá o novo endereço ; com um `201`, ele dá o endereço do recurso que acabou de ser criado. Um navegador segue o redirecionamento sozinho. O `curl` só o faz quando solicitado :

```bash
# -L : segue o redirecionamento ; -w exibe o código final e o endereço final
# (url_effective é o nome que o curl dá ao endereço da última requisição)
curl -sL -o /dev/null -w '%{http_code} %{url_effective}\n' http://127.0.0.1:5628/antigo
```

```text
200 http://127.0.0.1:5628/novo
```

Sem `-L`, a mesma chamada exibe `301 http://127.0.0.1:5628/antigo`. Duas requisições aconteceram : uma para `/antigo` (resposta `301`), outra para `/novo` (resposta `200`).

### `Content-Type` e `Content-Length`: ler o corpo corretamente

| Cabeçalho | Valor de exemplo | Papel |
|---|---|---|
| `Content-Type` | `application/json` | O **tipo de conteúdo** (tipo MIME, do nome da norma de origem, *Multipurpose Internet Mail Extensions*) : aqui, dados [JSON](/?c=infrastructure-devops&s=infrastructure&p=json). `text/html` para uma página web, `text/plain` para texto puro |
| `Content-Type` | `text/plain; charset=utf-8` | O tipo, seguido do **conjunto de caracteres** (*charset*) : a tabela que associa os bytes às letras. UTF-8 é a mais comum e lida com os acentos ([as codificações](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)) |
| `Content-Length` | `21` | O tamanho do corpo em **bytes** (um byte é uma unidade de armazenamento : uma letra sem acento ocupa 1) |

Na resposta `429` da seção [Uma resposta HTTP, linha por linha](#uma-resposta-http-linha-por-linha), o corpo `Muitas requisições` seguido de uma quebra de linha conta 19 caracteres, mas o `Content-Length` é `21` : o `ç` e o `õ` se escrevem em dois bytes cada em UTF-8. Um `Content-Length` contado em caracteres em vez de bytes trunca o corpo: o cliente recebe um texto cujo final se perde (um valor alto demais, por sua vez, o faz esperar indefinidamente por bytes que não chegam).

Um `Content-Type` errado produz erros estranhos : um navegador que recebe JSON rotulado como `text/html` o exibe como página, e um cliente que espera JSON rotulado como `text/plain` pode recusar-se a analisá-lo. O servidor também precisa rotular corretamente o que serve, para evitar que o navegador « adivinhe » o tipo (ver `X-Content-Type-Options` em [as falhas de navegador](/?c=securite&s=cybersecurite&p=failles-de-navigateur)).

### `Cache-Control`: guardar ou não guardar

Um **cache** é uma cópia guardada na memória (pelo navegador ou por um servidor intermediário) para evitar pedir de novo a mesma coisa. `Cache-Control` regula esse comportamento ([documentação de referência](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Headers/Cache-Control)) :

| Valor | Efeito |
|---|---|
| `max-age=60` | A cópia é considerada válida por 60 segundos : nesse intervalo, nenhuma requisição é enviada |
| `no-cache` | A cópia pode ser guardada, mas o cliente deve **revalidar** junto ao servidor antes de reutilizá-la (apesar do nome, não desativa o armazenamento) |
| `no-store` | Não guardar nada (páginas bancárias, dados pessoais) |
| `private` | Só o navegador do usuário pode guardar a cópia, e não um cache compartilhado entre usuários |
| `public` | Qualquer cache pode guardá-la |

Com `no-cache`, a revalidação passa por um `ETag` : uma **etiqueta de versão** que o servidor cola à resposta. Na próxima passagem, o cliente a devolve no cabeçalho de requisição `If-None-Match` (« me dê a página somente se ela não corresponder mais a esta etiqueta »). Se nada mudou, o servidor responde `304` **sem corpo**, o que economiza a transferência. Com a rota `/pagina` do servidor de teste :

```bash
# primeira visita : o servidor responde 200 com o corpo e o ETag
curl -i http://127.0.0.1:5628/pagina
# segunda visita : -H envia If-None-Match com o ETag recebido ; resposta 304
curl -i -H 'If-None-Match: "v1"' http://127.0.0.1:5628/pagina
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 11
ETag: "v1"
Cache-Control: no-cache

Página v1

HTTP/1.1 304 Not Modified
ETag: "v1"
```

`curl` não guarda nada em cache : ele mostra somente os cabeçalhos. É o navegador que aplica `max-age` ou `no-cache`. O princípio vizinho, « servir logo uma cópia vencida e atualizá-la por trás », é descrito em [o recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant).

## `Retry-After`: « volte mais tarde »

Quando um servidor não pode ou não quer responder agora, ele não diz apenas « não » : pode dizer **quando** tentar de novo. É esse o papel de `Retry-After`. Ele acompanha sobretudo `429` (o cliente vai rápido demais) e `503` (o servidor está sobrecarregado ou em manutenção), e também pode aparecer em um redirecionamento `3xx` ([RFC 9110](https://www.rfc-editor.org/rfc/rfc9110), seção 10.2.3 ; o código `429` é definido pela [RFC 6585](https://www.rfc-editor.org/rfc/rfc6585)).

### Dois formatos possíveis

| Formato | Exemplo | Sentido |
|---|---|---|
| Um número de segundos | `Retry-After: 120` | Espere 120 segundos a partir de agora |
| Uma data HTTP | `Retry-After: Wed, 21 Oct 2026 07:28:00 GMT` | Não volte antes deste instante (hora GMT, equivalente à hora UTC, a mesma para todos) |

Um cliente precisa saber ler os dois. Com o servidor de teste :

```bash
# aguarde 5 s após o comando anterior em /api ; 3 requisições passam,
# a 4ª ultrapassa o limite : 429 com Retry-After em segundos
for i in 1 2 3 4; do curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5628/api; done
# o servidor de manutenção também devolve um Retry-After, com o código 503
curl -i http://127.0.0.1:5628/manutencao
```

```text
200
200
200
429
HTTP/1.1 503 Service Unavailable
Content-Type: text/plain; charset=utf-8
Content-Length: 26
Retry-After: 120

Manutenção em andamento
```

O `for i in 1 2 3 4; do ... done` é um [laço](/?c=langages&s=bash&p=boucles) do shell que repete o comando quatro vezes.

Para ver uma resposta `429` inteira, basta enviar três requisições em sequência, depois uma quarta com `-i` (sem pausa entre elas ; aguarde 5 segundos após o comando anterior para começar com uma janela nova) :

```bash
# as 3 primeiras requisições consomem o limite, a 4ª exibe a resposta 429 completa
for i in 1 2 3; do curl -s -o /dev/null http://127.0.0.1:5628/api; done
curl -i http://127.0.0.1:5628/api
```

```text
HTTP/1.1 429 Too Many Requests
Content-Type: text/plain; charset=utf-8
Content-Length: 21
Retry-After: 5

Muitas requisições
```

É a forma descrita em [Uma resposta HTTP, linha por linha](#uma-resposta-http-linha-por-linha) : uma linha de status, cabeçalhos, uma linha vazia, depois o corpo. `Retry-After: 5` significa « tente de novo em 5 segundos » : o servidor calculou que faltam 5 segundos para o fim da janela de 5 segundos atual, e que uma requisição enviada antes seria recusada de novo. Se você esperar antes de lançar a quarta requisição, o valor cai (4, 3...), pois a janela avança.

### O que faz um cliente educado

```text
Cliente                                         Servidor
  | GET /api  (4ª requisição na janela)  ---->    |
  | <----  429 Too Many Requests, Retry-After: 5  |
  |                                               |
  |   o cliente ESPERA 5 s (+ aleatório)          |
  |                                               |
  | GET /api  -------------------------------->   |
  | <----  200 {"ok":true}                        |
```

| Regra do cliente educado | Por quê |
|---|---|
| Tentar de novo somente em `429` e `503` (e em outras falhas passageiras) | `400`, `401`, `403` e `404` não mudam ao repetir a mesma requisição |
| Ler `Retry-After` em primeiro lugar (segundos **ou** data) | O servidor conhece melhor do que o cliente a duração da própria sobrecarga |
| Sem `Retry-After` : esperar cada vez mais (**recuo exponencial**, *exponential backoff*) | O atraso dobra a cada falha : deixa-se ao servidor o tempo de se recuperar |
| Acrescentar **aleatoriedade** (*jitter*) | Sem ela, mil clientes que receberam o mesmo `Retry-After: 5` voltam todos no mesmo segundo e causam um novo pico |
| Limitar o número de tentativas e a espera | Um `Retry-After` de várias horas não deve bloquear um programa para sempre |
| Repetir uma requisição somente se ela for **idempotente** | Uma requisição idempotente (`GET`, `PUT`, `DELETE`) tem o mesmo efeito enviada uma vez ou dez vezes ; repetir um `POST` pode criar uma duplicata |

O mesmo princípio é aplicado pelas bibliotecas clientes das APIs profissionais (ver [o SDK e a API](/?c=ia&s=modeles-de-decision-structuree&p=sdk-et-api)) e complementado pelo disjuntor (parar de chamar um recurso em falha) em [a robustez dos processamentos em lote](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots).

### O mau cliente: tentar de novo sem esperar

Eis um script que ignora a resposta e recomeça imediatamente. Ele usa `fetch` (a função de JavaScript que envia uma requisição HTTP) com `await` (esperar o resultado), explicados em [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone). `fetch` está disponível sem instalação a partir do Node 18, e `await` fora de uma função exige um arquivo `.mjs` : salve o script em `mau.mjs` e execute `node mau.mjs`, depois de aguardar 5 segundos desde o comando anterior.

```javascript
// contadores : quantas respostas de cada código foram recebidas
const contadores = {};
// vinte requisições imediatas, sem nunca esperar : o comportamento a evitar
for (let i = 0; i < 20; i += 1) {
  // só olhamos o código de status ; { status } extrai a propriedade status da resposta
  const { status } = await fetch("http://127.0.0.1:5628/api");
  // somamos 1 ao contador desse código (?? 0 : se ele ainda não existia, começamos em 0)
  contadores[status] = (contadores[status] ?? 0) + 1;
}
// exibe o balanço
console.log(contadores);
```

```text
{ '200': 3, '429': 17 }
```

Em 20 requisições, 17 foram inúteis : sobrecarregaram o servidor, consumiram o limite e não trouxeram nada. Em um serviço real, isso pode levar a um bloqueio duradouro da chave de acesso (o código secreto que identifica o seu programa junto ao serviço ; ver [a segurança de uma API web](/?c=securite&s=cybersecurite&p=securite-api-web)).

### O bom cliente: respeitar `Retry-After`

O script a seguir (a ser salvo em `cliente.mjs`) lê o cabeçalho, espera e recomeça. A função `lerRetryAfter` cuida dos dois formatos ; `atrasoCrescente` serve de reserva quando o cabeçalho falta. O tratamento de erros com `throw` é explicado em [a gestão de erros](/?c=langages&s=javascript&p=gestion-des-erreurs).

```javascript
// URL_API : o endereço da rota que limita a taxa
const URL_API = "http://127.0.0.1:5628/api";
// MAX_TENTATIVAS : número máximo de tentativas antes de desistir
const MAX_TENTATIVAS = 5;
// ESPERA_MAX_MS : teto de uma espera, qualquer que seja o pedido do servidor
const ESPERA_MAX_MS = 30000;

// pausar devolve uma promessa que termina depois de ms milissegundos
function pausar(ms) {
  // setTimeout chama a função concluido quando o tempo tiver passado
  return new Promise((concluido) => setTimeout(concluido, ms));
}

// lerRetryAfter converte o valor do cabeçalho em milissegundos (null se ausente)
function lerRetryAfter(valor) {
  // sem cabeçalho, ou cabeçalho vazio : o cliente decidirá sozinho sua espera
  if (valor === null || valor.trim() === "") return null;
  // primeiro formato possível : um número inteiro de segundos, por exemplo "5"
  const segundos = Number(valor);
  // Number.isFinite é falso para NaN (« não é um número »), o que descarta uma data
  if (Number.isFinite(segundos)) return Math.max(0, segundos * 1000);
  // segundo formato : uma data HTTP ; Date.parse a lê e a converte em milissegundos
  // decorridos desde 1º de janeiro de 1970 (como Date.now())
  const data = Date.parse(valor);
  if (Number.isNaN(data)) return null;
  // Date.now() : instante presente ; Math.max(0, x) pega o maior entre 0 e x,
  // logo nunca negativo : uma data passada quer dizer « agora mesmo »
  return Math.max(0, data - Date.now());
}

// atrasoCrescente : espera sorteada entre 0 e 500 ms x 2^tentativa (recuo exponencial)
function atrasoCrescente(tentativa) {
  // Math.random() dá um número entre 0 e 1 ; 2 ** tentativa : 2 elevado a tentativa
  return Math.random() * 500 * 2 ** tentativa;
}

// chamar envia a requisição e tenta de novo, com cuidado, em 429 e 503
async function chamar(url) {
  // tentativa vale 0 na primeira tentativa, 1 na segunda, etc.
  for (let tentativa = 0; tentativa < MAX_TENTATIVAS; tentativa += 1) {
    // fetch envia a requisição ; resposta.status é o código de status recebido
    const resposta = await fetch(url);
    // resposta.ok é verdadeiro para todos os códigos 2xx : devolvemos a resposta
    if (resposta.ok) return resposta;
    // qualquer código diferente de 429 ou 503 : tentar de novo não adiantaria
    if (resposta.status !== 429 && resposta.status !== 503) {
      throw new Error(`Falha definitiva : ${resposta.status}`);
    }
    // pedido do servidor, se houver ; ?? escolhe senão o atraso crescente sorteado
    const pausaPedida = lerRetryAfter(resposta.headers.get("Retry-After"));
    // aleatoriedade de 0 a 500 ms acrescentada : os clientes não voltam no mesmo instante
    const espera = (pausaPedida ?? atrasoCrescente(tentativa)) + Math.random() * 500;
    // longa demais : desistimos em vez de bloquear o programa
    if (espera > ESPERA_MAX_MS) throw new Error(`Espera longa demais : ${espera} ms`);
    // Math.round arredonda para o inteiro ; os ${...} de um texto entre crases
    // são substituídos pelo valor deles
    const arredondado = Math.round(espera);
    console.log(
      `tentativa ${tentativa + 1} : ${resposta.status}, pausa de ${arredondado} ms`
    );
    // pausa antes de recomeçar
    await pausar(espera);
  }
  throw new Error("Muitas tentativas");
}

// encadeamos seis chamadas : as três primeiras passam, as seguintes sofrem o limite
for (let numero = 1; numero <= 6; numero += 1) {
  const resposta = await chamar(URL_API);
  console.log(`chamada ${numero} : ${resposta.status} ${(await resposta.text()).trim()}`);
}
```

Com o servidor de teste em execução, a saída realmente obtida é :

```text
chamada 1 : 200 {"ok":true}
chamada 2 : 200 {"ok":true}
chamada 3 : 200 {"ok":true}
tentativa 1 : 429, pausa de 5197 ms
chamada 4 : 200 {"ok":true}
chamada 5 : 200 {"ok":true}
chamada 6 : 200 {"ok":true}
```

A quarta chamada recebeu um `429`, esperou um pouco mais de 5 segundos (os 5 de `Retry-After` mais a aleatoriedade de 0 a 500 ms), depois teve sucesso já na primeira tentativa. Nenhuma requisição foi desperdiçada. A duração da pausa varia um pouco de uma execução para outra por causa da aleatoriedade.

Eis o que `lerRetryAfter` devolve (em milissegundos) para diferentes valores do cabeçalho, resultados obtidos chamando a função :

| Valor do cabeçalho | Resultado | Explicação |
|---|---|---|
| `"5"` | `5000` | 5 segundos convertidos em milissegundos |
| `"120"` | `120000` | 2 minutos |
| `"-5"` | `0` | Um atraso negativo não faz sentido : nenhuma espera |
| Uma data já passada (`Wed, 21 Oct 2015 07:28:00 GMT`) | `0` | Voltar imediatamente é permitido |
| Uma data daqui a 90 segundos | aproximadamente `89000` | O tempo restante até essa data |
| `"abc"`, `""` ou ausente | `null` | Valor inaproveitável : o cliente usa `atrasoCrescente` |

Sem `Retry-After`, `atrasoCrescente` sorteia um número ao acaso entre 0 e um teto que dobra a cada tentativa :

| Tentativa (número de partida 0) | Teto da espera sorteada ao acaso |
|---|---|
| 0 | 500 ms |
| 1 | 1 000 ms |
| 2 | 2 000 ms |
| 3 | 4 000 ms |
| 4 | 8 000 ms |

`Retry-After` continua sendo um **pedido**, não uma obrigação técnica : nada impede um cliente de ignorá-lo. Um servidor sério se protege sozinho (limitação de taxa, bloqueio dos clientes que insistem) ; esse lado do servidor é o assunto de [a limitação de taxa e do proxy reverso](/?c=infrastructure-devops&s=serveurs-web&p=proxy-inverse-et-limitation-de-debit). O risco representado por uma sobrecarga é detalhado em [a sobrecarga e a negação de serviço de aplicação](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Alguns serviços acrescentam seus próprios cabeçalhos para anunciar a cota restante ; seus nomes e sentidos se leem na documentação de cada serviço.

## Escolher o código certo do lado do servidor

| Situação | Código a devolver |
|---|---|
| A página ou o dado é devolvido normalmente | `200` |
| Um `POST` criou um recurso | `201` com `Location` |
| Um `DELETE` deu certo, nada a exibir | `204` |
| A página mudou de endereço de forma definitiva | `301` com `Location` |
| O corpo da requisição é inválido (JSON quebrado, campo ausente) | `400`, com, no corpo, o que está errado |
| Nenhum identificador, ou identificador errado | `401` |
| Identificado, mas não autorizado | `403` |
| O recurso não existe | `404` |
| O cliente ultrapassa seu limite | `429` com `Retry-After` |
| Bug ou falha imprevista | `500` (sem detalhes internos no corpo) |
| Sobrecarga ou manutenção planejada | `503` com `Retry-After` |

## As armadilhas

| Armadilha | Consequência | O que fazer no lugar |
|---|---|---|
| Confundir `401` e `403` | O cliente se identifica de novo em laço quando não tem o direito, ou nunca se identifica quando precisaria | `401` : não identificado ; `403` : identificado, mas recusado |
| Devolver `200` com uma mensagem de erro no corpo (`{"erro": "não encontrado"}`) | Os programas, os caches e as ferramentas de monitoramento acham que tudo vai bem ; o erro é contado como sucesso | Usar o código correspondente (`404`, `400`...) e manter a mensagem no corpo como complemento |
| Tentar de novo imediatamente, em laço | Medido mais acima : 17 requisições perdidas em 20 ; risco de bloqueio pelo servidor | Esperar `Retry-After`, senão um atraso crescente e aleatório, com número de tentativas limitado |
| Ignorar o formato data de `Retry-After` | `Number("Wed, 21 Oct 2026...")` dá `NaN` : o cliente espera `NaN` milissegundos, ou seja, nada | Ler os dois formatos (`lerRetryAfter`) |
| Tentar de novo um `400`, `401`, `403` ou `404` | A mesma resposta toda vez, carga inútil | Corrigir a requisição, ou se identificar |
| Tentar de novo um `POST` não idempotente após um `5xx` | Duplicata possível (dois pedidos, dois pagamentos) se o primeiro tiver, na verdade, dado certo | Tentar de novo somente requisições idempotentes, ou acrescentar uma chave de unicidade (um identificador único enviado com a requisição, que permite ao servidor ignorar uma duplicata ; ver [a idempotência](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=robustesse-traitement-par-lots)) |
| Nenhum teto nem número máximo de tentativas | Um programa travado durante horas por um `Retry-After` enorme | `ESPERA_MAX_MS` e `MAX_TENTATIVAS` |
| `500` para um erro do cliente (JSON inválido, campo ausente) | Os alertas de falha disparam à toa, o cliente acha que é uma falha passageira e tenta de novo | `400` : é a requisição que está em causa |
| `404` para tudo (inclusive uma recusa de acesso) | O cliente não sabe o que corrigir | Um código preciso, salvo se a intenção for esconder a existência |
| `301` posto por engano | Memorizada pelos navegadores, difícil de desfazer | Testar primeiro com `302`, passar para `301` quando o endereço for definitivo |
| `Content-Length` contado em caracteres | Corpo cortado assim que há um acento | Medir em bytes (`Buffer.byteLength`) |
| `Content-Type` ausente ou errado | O navegador adivinha o tipo ou exibe mal o conteúdo | Declará-lo sempre (`application/json` para JSON) |
| Colocar uma resposta pessoal como `public` | Um cache compartilhado a serve a outro usuário | `private` ou `no-store` para dados pessoais |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Decidir com base no **código**, e não no texto do corpo | O código é o contrato entre máquinas |
| Distinguir `4xx` (corrigir a requisição) e `5xx` (tentar de novo mais tarde, com limite) | Cada família pede uma reação diferente |
| Sempre ler `Retry-After` em `429` e `503` | O servidor sabe melhor do que você quanto tempo a falha vai durar |
| Recuo exponencial, aleatoriedade, número de tentativas e espera máxima limitados | Evita que todos os clientes voltem ao mesmo tempo, e esperas intermináveis |
| Devolver o código exato no servidor, com `Retry-After` quando se limita | Um cliente bem escrito poderá então se comportar com educação |
| Declarar `Content-Type` (com `charset=utf-8` para texto) e deixar `Content-Length` para a biblioteca, quando possível | Nenhum cálculo de bytes à mão |
| Escolher `Cache-Control` de propósito : `max-age` para o estático, `no-cache` com `ETag` para o dinâmico a revalidar, `no-store` para o sensível | O comportamento padrão dos caches raramente é o que se quer |
| Testar com `curl -i` antes de escrever o cliente | Vê-se exatamente o que o servidor envia |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um código de status se lê pelo primeiro algarismo : `2xx` sucesso, `3xx` redirecionamento, `4xx` falta do cliente, `5xx` falta do servidor. `Retry-After` (segundos ou data HTTP) acompanha `429` e `503` e diz quando voltar ; `Cache-Control`, `Location`, `Content-Type` e `Content-Length` comandam o cache, o destino e a leitura do corpo. `curl -i` permite observar tudo. |
| **Armadilhas a evitar** | Confundir `401` (não identificado) e `403` (recusado) ; devolver `200` com um erro no corpo ; tentar de novo em laço sem esperar ; ler só o formato em segundos de `Retry-After` ; tentar de novo um `4xx` ou um `POST` não idempotente ; contar `Content-Length` em caracteres. |
| **Boas práticas** | Decidir com base no código ; tentar de novo só nas falhas passageiras (`429`, `503`), respeitando `Retry-After`, senão recuo exponencial com aleatoriedade, número de tentativas e espera máxima limitados ; devolver o código exato e os cabeçalhos corretos no servidor ; verificar com `curl -i`. |
