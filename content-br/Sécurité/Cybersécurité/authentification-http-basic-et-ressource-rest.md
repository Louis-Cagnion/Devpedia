---
order: 24
---

# Recurso REST e autenticação HTTP Basic (31/10/2026)

Um programa (um aplicativo móvel, um script, outro servidor) que quer ler ou alterar os dados de um site passa por uma [API](/?c=infrastructure-devops&s=infrastructure&p=api-et-http): uma porta de entrada em HTTP, feita para ser usada por um programa e não por uma pessoa. Este capítulo responde a duas perguntas. Como descrever de forma adequada o que a porta expõe: é o **recurso REST**, que se declara como um [plugin](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) (um pedaço de código independente que se inscreve sozinho em um catálogo central, o **registro**; o detalhe vem mais adiante). Como verificar quem bate à porta: é a **autenticação HTTP Basic**, a mais simples de todas, cujos limites precisam ser conhecidos com precisão.

Ele pressupõe dois conhecimentos: o [método, o endereço e o código de status](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) de uma requisição HTTP, e a diferença entre [autenticação e autorização](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation), que já apresenta o HTTP Basic em uma seção. Aqui, desmontamos o assunto peça por peça, sobre um servidor realmente executado. Como o HTTP Basic envia o identificador a cada requisição, a conexão que o transporta deve ser protegida por TLS: o que a opção que desativa a verificação corta é explicado em [Desativar a verificação TLS: o que a opção realmente desliga](/?c=securite&s=cybersecurite&p=desactiver-la-verification-tls). Um cabeçalho de autorização copiado em um log é tratado em [Dados pessoais nos logs e nas cópias](/?c=securite&s=cybersecurite&p=donnees-personnelles-dans-les-journaux).

| Noção | Onde é tratada |
|---|---|
| Método, endereço, código de status | [API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) |
| `401` contra `403`, primeiro panorama do Basic | [Autenticação vs autorização](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) |
| Contrato, rótulo e gerenciador de um plugin | [A arquitetura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins) |
| CORS, limitação de taxa em geral, chave ou token | [Segurança das APIs web](/?c=securite&s=cybersecurite&p=securite-api-web) |
| Hash, criptografia, comparação de uma assinatura | [Criptografia aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee) e [Segurança dos webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) |
| Onde guardar uma senha ou uma chave | [Gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets) |
| **Aqui** | O recurso e seu registro, Basic em detalhe, a demonstração de que Base64 não protege nada, a comparação em tempo constante, as tentativas limitadas, a escolha de uma alternativa |

## O que é um recurso REST

**REST** é um estilo de organização de uma API: o servidor expõe **recursos**, cada um designado por um endereço, e o cliente age sobre eles com os métodos HTTP habituais. Um **recurso** é uma “coisa” que o servidor sabe nomear: a lista de artigos, um artigo específico, um usuário. Uma **URL** (*Uniform Resource Locator*) é o endereço web que o designa, por exemplo `/artigos`. Uma **representação** é o texto que o servidor devolve para descrever o recurso, na maioria das vezes em [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) (um formato de texto que descreve dados com chaves e pares nome/valor).

A imagem: o recurso é um fichário etiquetado `/artigos` numa biblioteca. Os métodos são os gestos permitidos sobre esse fichário (consultar, acrescentar uma ficha, corrigir uma ficha, retirar uma ficha). A representação é a fotocópia que lhe entregam, nunca o fichário em si.

Um **cabeçalho** (*header*) é uma linha `Nome: valor` colocada antes do conteúdo de uma requisição ou de uma resposta; ele transporta metadados (o formato, a identidade, a data). Por exemplo, `Accept` indica o formato desejado pelo cliente, e `Content-Type` o formato do conteúdo enviado. O esquema a seguir mostra um intercâmbio completo.

```
Cliente                                     Servidor
  |                                            |
  |  GET /artigos                              |   método + URL
  |  Accept: application/json                  |   cabeçalho : formato desejado
  | -----------------------------------------> |
  |                                            |   o recurso « artigos »
  |  200 OK                                    |   é encontrado, o método GET
  |  Content-Type: application/json            |   é permitido
  |  [{"id":1,"titulo":"Primeiro artigo"}]     |   representação (JSON)
  | <----------------------------------------- |
```

| Método | Gesto | Altera os dados? | Repetível sem efeito a mais (idempotente)? | Sucesso típico |
|---|---|---|---|---|
| `GET` | Ler o recurso | Não | Sim | `200` |
| `POST` | Criar um elemento na coleção | Sim | Não: dois envios criam dois elementos | `201` (criado) |
| `PUT` | Substituir inteiramente um elemento | Sim | Sim: mesmo estado final | `200` ou `204` |
| `PATCH` | Corrigir uma parte de um elemento | Sim | Depende da forma como é escrito | `200` ou `204` |
| `DELETE` | Excluir um elemento | Sim | Sim: depois de excluído, continua excluído | `204` (sem conteúdo) |

Um método é **idempotente** quando enviá-lo uma vez ou dez vezes deixa os dados no mesmo estado final. Isso importa quando uma rede corta a resposta: o cliente pode então reenviar a requisição sem temer um duplicado, exceto para `POST`.

| Endereço | Designa | Exemplo de métodos úteis |
|---|---|---|
| `/artigos` | A coleção (a lista) | `GET` para listar, `POST` para acrescentar |
| `/artigos/2` | Um elemento específico da coleção | `GET`, `PATCH`, `DELETE` |
| `/saude` | Um recurso de estado do serviço | `GET` apenas |

Último traço do REST, pesado de consequências aqui: o servidor é **sem estado** (*stateless*). Ele não guarda na memória “o cliente que acabou de se conectar”: cada requisição deve trazer tudo o que é preciso para ser processada, **identidade incluída**. É exatamente o que faz o HTTP Basic, e a razão pela qual ele combina tão naturalmente com uma API.

## Declarar um recurso como um plugin

Sem organização, um servidor de API logo se parece com um arquivo central em que cada novo endereço acrescenta mais um caso, com o defeito descrito em [o capítulo sobre a arquitetura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins): o arquivo central precisa conhecer todo mundo. O **plugin** inverte a responsabilidade: cada recurso é um pedaço independente que **se declara** junto a um **registro** (o catálogo central dos recursos conhecidos). O capítulo citado detalha o contrato, o rótulo e o gerenciador; aqui, apenas o aplicamos.

```
   Recursos declarados                 Registro (catálogo)
  +----------------------+           +-----------------------------+
  | artigos              |  declarar | id         caminho          |
  |  GET   permissão     | --------> | artigos    /artigos         |
  |  POST  permissão     |           | saude      /saude           |
  +----------------------+           +--------------+--------------+
  | saude                |                          |
  |  GET   (pública)     |      requisição GET /artigos
  +----------------------+                          |
                                          1. buscar o recurso pelo caminho
                                          2. buscar o método nas suas regras
                                          3. verificar a identidade e a permissão
                                          4. executar a regra, devolver a resposta
```

| Elemento da declaração | Papel | No exemplo deste capítulo |
|---|---|---|
| Identificador | Nome estável do recurso no registro | `artigos` |
| Caminho | A URL que o designa | `/artigos` |
| Métodos | Lista **branca** dos métodos permitidos (todo o resto é recusado) | `GET`, `POST` |
| Permissão por método | O que o chamador precisa ter para aquele método | `ler`, `escrever` |
| Regra de execução | A função que produz a resposta | `responder` |

Duas consequências devem ser guardadas. Primeiro, acrescentar um recurso não altera nenhuma linha do código central: declara-se, e pronto. Depois, a lista dos métodos é um **contrato explícito**: um método ausente da declaração recebe a resposta [`405 Method Not Allowed`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status/405) (“método não permitido”), acompanhada de um cabeçalho `Allow` que enumera os métodos aceitos. O que não está declarado não existe, o que reduz a **superfície de ataque** (o conjunto dos pontos pelos quais se pode atacar o serviço).

## O servidor de exemplo

Para refazer as manipulações, é preciso um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) Bash (Linux, macOS ou WSL, veja [os comandos básicos](/?c=langages&s=bash&p=commandes-de-base)), o [Node.js](https://nodejs.org/en/download) instalado (o comando `node --version` deve exibir um número) e o `curl`, um programa fornecido com Linux e macOS que envia requisições HTTP. Cria-se uma pasta de trabalho, salva-se nela o código abaixo em um arquivo `servidor-rest.mjs` (as cinco partes em sequência, na ordem), depois inicia-se o servidor em um primeiro terminal. Os comandos `curl` se digitam em um **segundo** terminal, deixando o primeiro ocupado com o servidor.

Tudo o que segue vem de um pequeno servidor escrito em [JavaScript](/?c=langages&s=javascript&p=javascript) com o módulo `node:http` do [Node.js](https://nodejs.org/api/http.html) (o ambiente que executa JavaScript fora de um navegador). Ele escuta na porta `7312` (uma **porta** é o número da porta de um computador na qual um programa escuta) do endereço `127.0.0.1`: o endereço da sua própria máquina, também chamado `localhost`, como em [o servidor local](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement). O arquivo é dividido em cinco partes; cada notação do código é explicada em um comentário em sua primeira aparição, com um link para o capítulo que a detalha quando existe: [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as funções](/?c=langages&s=javascript&p=fonctions), [os objetos](/?c=langages&s=javascript&p=objets), [os arrays](/?c=langages&s=javascript&p=tableaux), [os erros](/?c=langages&s=javascript&p=gestion-des-erreurs), [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone) e [as regex](/?c=langages&s=javascript&p=regex) (as expressões regulares).

**Parte 1: as contas.** O servidor nunca guarda uma senha legível: ele guarda um **sal** (um valor aleatório próprio de cada conta, que torna cada resultado único) e um **hash** (o resultado do hashing por `scrypt`, uma função de hash propositalmente lenta, veja [senhas e hash seguro](/?c=securite&s=fondamentaux&p=mots-de-passe-et-hachage)). Sal e hash se medem em **bytes** (um byte é um grupo de 8 bits, veja [os inteiros e os bits](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)). `alice` só tem a permissão de ler, `bruno` pode ler e escrever.

```javascript
// Um módulo é um arquivo de código reutilizável (daí a extensão .mjs); import o carrega.
import http from 'node:http';                       // servidor HTTP embutido no Node
// Um byte é um grupo de 8 bits (um bit vale 0 ou 1), logo um valor de 0 a 255.
// Um Buffer é uma sequência de bytes brutos.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'; // hash

// ---------- Parte 1: as contas ----------
// const nomeia um valor; (a, b) => { ... } é uma função; return devolve seu resultado.
const criarConta = (senha, permissoes) => {         // fabrica uma conta cadastrada
  const sal = randomBytes(16);                      // sal: 16 bytes aleatórios da conta
  // O sufixo Sync de scryptSync: o programa espera o fim do cálculo antes de continuar.
  const hash = scryptSync(senha, sal, 32);          // hash lento, 32 bytes
  return { sal, hash, permissoes };                 // { a, b } é o objeto { a: a, b: b }
};                                                   // jamais a senha em si

// new Map([...]) cria um dicionário: associa uma chave a um valor.
// Cada [chave, valor] é um array (uma lista) de duas casas.
const CONTAS = new Map([                            // usuário => conta
  ['alice', criarConta('leitura-ok', ['ler'])],     // alice só pode ler
  ['bruno', criarConta('escrita-ok', ['ler', 'escrever'])], // bruno lê e escreve
]);
const CONTA_FICTICIA = criarConta('inutilizado', []); // serve se o usuário for desconhecido
```

**Parte 2: a autenticação HTTP Basic.** `lerCredenciais` decodifica o cabeçalho; `autenticar` verifica a senha. Cada linha será retomada nas seções seguintes.

```javascript
// ---------- Parte 2: a autenticação HTTP Basic ----------
// function nome(parametro) { ... } declara uma função; null quer dizer « nenhum valor ».
function lerCredenciais(cabecalho) {                // cabecalho: valor de Authorization
  // A expressão regular /.../i é um padrão de busca: ^ início do texto, \s+ espaços,
  // (\S+) um grupo de caracteres não brancos, $ fim do texto, i caixa livre.
  // exec devolve null se o texto não corresponder ao padrão.
  // a ?? b vale a, exceto se a for null ou undefined (ausente): então b.
  const encontrado = /^basic\s+(\S+)$/i.exec(cabecalho ?? ''); // esquema Basic, caixa livre
  if (encontrado === null) return null;             // outro esquema, ou cabeçalho ausente
  // encontrado[1] é o texto do grupo (\S+). Base64 é uma escrita de bytes com 64
  // caracteres (veja abaixo): Buffer.from(texto, 'base64') a decodifica em bytes, depois
  // .toString('utf8') relê esses bytes como texto.
  const decodificado = Buffer.from(encontrado[1], 'base64').toString('utf8'); // de base64
  const posicao = decodificado.indexOf(':');        // posição do PRIMEIRO « : » (-1: nenhum)
  if (posicao < 0) return null;                     // sem « : »: cabeçalho malformado
  return {
    // slice(a, b) extrai o texto da posição a (incluída) até a posição b (excluída)
    usuario: decodificado.slice(0, posicao),        // antes do primeiro « : »
    senha: decodificado.slice(posicao + 1),         // o resto, outros « : » incluídos
  };
}

function autenticar(cabecalho) {                    // devolve a conta, ou null
  const lido = lerCredenciais(cabecalho);           // usuário e senha recebidos
  if (lido === null) return null;                   // cabeçalho inutilizável
  const conhecido = CONTAS.has(lido.usuario);       // has: a chave existe?
  // get lê o valor associado à chave; senão, a conta fictícia
  const conta = CONTAS.get(lido.usuario) ?? CONTA_FICTICIA;
  const candidata = scryptSync(lido.senha, conta.sal, 32); // mesmo custo em todos os casos
  // timingSafeEqual compara dois Buffer em tempo constante (explicado mais abaixo)
  const igual = timingSafeEqual(candidata, conta.hash);
  // a && b: « a e b »; teste ? x : y vale x se teste for verdadeiro, senão y;
  // ...conta copia para o novo objeto todas as propriedades de conta.
  return conhecido && igual ? { usuario: lido.usuario, ...conta } : null;
}
```

**Parte 3: limitar as tentativas.** Um contador de falhas por [endereço IP](/?c=infrastructure-devops&s=reseaux&p=fondamentaux-reseau) (o número que identifica uma máquina numa rede), mantido do lado do servidor, numa janela de sessenta segundos.

```javascript
// ---------- Parte 3: limitar as tentativas ----------
const FALHAS = new Map();                           // endereço IP => { total, inicio }
const MAX_FALHAS = 3;                               // falhas toleradas por janela
const JANELA_MS = 60_000;                           // 60 s em ms (o _ é um separador)

function bloqueado(endereco) {                      // este endereço falhou demais?
  const e = FALHAS.get(endereco);                   // seu histórico, senão undefined
  // Date.now() é a hora atual em milissegundos; !== significa « diferente de ».
  const recente = e !== undefined && Date.now() - e.inicio < JANELA_MS; // na janela?
  return recente && e.total >= MAX_FALHAS;          // verdadeiro se atingiu o limite (>=)
}

function registrarFalha(endereco) {                 // registra uma falha a mais
  const e = FALHAS.get(endereco);                   // seu histórico, se existir
  if (e === undefined || Date.now() - e.inicio >= JANELA_MS) {
    FALHAS.set(endereco, { total: 1, inicio: Date.now() }); // set: nova janela
  } else {
    e.total += 1;                                   // += 1: soma 1 ao contador
  }
}
```

**Parte 4: o registro de recursos.** Dois recursos se declaram: `artigos` (protegido, dois métodos) e `saude` (público, um método).

```javascript
// ---------- Parte 4: o registro de recursos ----------
const REGISTRO = new Map();                         // identificador => recurso declarado
// r.id lê a propriedade id; set(chave, valor) acrescenta uma entrada ao dicionário.
const declarar = (r) => REGISTRO.set(r.id, r);      // acrescenta um recurso ao registro
// [ ... ] é um array (uma lista); { chave: valor } é um objeto.
const ARTIGOS = [{ id: 1, titulo: 'Primeiro artigo' }]; // dados em memória (demo)

declarar({
  id: 'artigos',                                    // identificador estável do recurso
  caminho: '/artigos',                              // a URL que o designa
  metodos: {                                        // método HTTP => regra
    // () => ARTIGOS: função sem parâmetro que devolve ARTIGOS
    GET: { permissao: 'ler', responder: () => ARTIGOS }, // leitura: permissão « ler »
    POST: {
      permissao: 'escrever',                        // criação: permissão « escrever »
      responder: (corpo) => {                       // corpo: o JSON recebido
        const titulo = String(corpo.titulo ?? '');  // String(x) força um texto
        const artigo = { id: ARTIGOS.length + 1, titulo }; // length: número de elementos
        ARTIGOS.push(artigo);                       // push acrescenta ao fim da lista
        return artigo;                              // devolve o artigo criado
      },
    },
  },
});
declarar({
  id: 'saude',                                      // recurso de estado do serviço
  caminho: '/saude',                                // sua URL
  metodos: { GET: { permissao: null, responder: () => ({ estado: 'ok' }) } }, // público
});
```

**Parte 5: o servidor.** `verificar` encadeia os controles de identidade; o gerenciador principal busca o recurso, o método e depois executa a regra; os códigos de status como `404` (recurso não encontrado) são apresentados em [API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). O formato [JSON](/?c=infrastructure-devops&s=infrastructure&p=json) serve para os corpos: `JSON.stringify` transforma um objeto em texto JSON, `JSON.parse` faz o inverso.

```javascript
// ---------- Parte 5: o servidor ----------
// cabecalhos = {}: valor padrão se omitido; ...cabecalhos copia as propriedades dele.
function enviar(res, status, corpo, cabecalhos = {}) { // escreve uma resposta JSON
  res.writeHead(status, { 'Content-Type': 'application/json', ...cabecalhos });
  res.end(JSON.stringify(corpo));                   // end envia o corpo em texto JSON
}

// async: a função pode esperar (await) um resultado que ainda não chegou,
// sem bloquear o programa; for await lê o fluxo da requisição pedaço a pedaço.
// Armadilha: nenhum limite de tamanho aqui; um servidor de verdade recusa um corpo grande.
async function lerCorpo(req) {                      // lê o corpo JSON de uma requisição
  let texto = '';                                   // let: valor modificável (texto lido)
  for await (const pedaco of req) texto += pedaco;  // lê o fluxo até o fim
  return texto === '' ? {} : JSON.parse(texto);     // texto vazio: objeto vazio
}

function verificar(req, res, regra) {               // devolve true se a requisição passa
  const endereco = req.socket.remoteAddress;        // endereço IP de quem chama
  if (bloqueado(endereco)) {                        // falhas demais recentemente
    // 429: tentativas demais; Retry-After: quantos segundos esperar
    enviar(res, 429, { erro: 'tentativas demais' }, { 'Retry-After': '60' });
    return false;
  }
  // Node escreve os nomes em minúsculas: authorization é o cabeçalho Authorization.
  const conta = autenticar(req.headers.authorization); // verifica o cabeçalho
  if (conta === null) {                             // ausente ou inválido: o desafio
    if (req.headers.authorization !== undefined) registrarFalha(endereco); // tentativa real
    enviar(res, 401, { erro: 'autenticação necessária' },
      { 'WWW-Authenticate': 'Basic realm="demo", charset="UTF-8"' });
    return false;
  }
  // includes: o array contém esta permissão? ! significa « não ».
  if (!conta.permissoes.includes(regra.permissao)) { // identificado, mas não autorizado
    enviar(res, 403, { erro: 'permissão ausente' });
    return false;
  }
  return true;                                      // identificado e autorizado
}

// createServer recebe a função chamada a cada requisição; req é a requisição recebida,
// res a resposta a escrever.
const servidor = http.createServer(async (req, res) => {
  // new URL(endereco, base) separa um endereço; pathname é o caminho, sem parâmetros.
  const caminho = new URL(req.url, 'http://x').pathname;
  // res.on('finish', f) chama f quando a resposta é enviada; console.log escreve uma linha
  // no terminal; `...${x}...` (crases) insere o valor de x no texto.
  res.on('finish', () => console.log(`${req.method} ${caminho} -> ${res.statusCode}`));
  // [...REGISTRO.values()] cria uma lista dos recursos; find(f) devolve o primeiro
  // elemento para o qual f é verdadeira, senão undefined.
  const recurso = [...REGISTRO.values()].find((r) => r.caminho === caminho);
  // 404: recurso não encontrado
  if (recurso === undefined) return enviar(res, 404, { erro: 'recurso desconhecido' });
  const regra = recurso.metodos[req.method];        // a regra deste método
  if (regra === undefined) {                        // método não declarado
    // Object.keys lista os nomes das propriedades; join(', ') os junta em um texto
    const permitidos = Object.keys(recurso.metodos).join(', ');
    return enviar(res, 405, { erro: 'método recusado' }, { Allow: permitidos });
  }
  if (regra.permissao !== null && !verificar(req, res, regra)) return; // protegido
  // try { ... } catch { ... }: se um erro ocorrer no try, o programa pula para o catch
  try {
    const corpo = req.method === 'POST' ? await lerCorpo(req) : {}; // corpo das escritas
    enviar(res, req.method === 'POST' ? 201 : 200, regra.responder(corpo));
  } catch {
    enviar(res, 400, { erro: 'JSON inválido' }); // corpo ilegível
  }
});

servidor.listen(7312, '127.0.0.1');                 // porta local apenas
```

O servidor se inicia no primeiro terminal com `timeout 100 node servidor-rest.mjs`: o comando `timeout` (fornecido com o Linux) o encerra sozinho ao cabo de cem segundos; sem `timeout` (no macOS, por exemplo), inicia-se `node servidor-rest.mjs` e para-se com Ctrl+C. Ele registra uma linha de log por requisição (método, caminho, código de resposta) e **nunca** o cabeçalho de identidade, uma escolha que importa, e à qual voltaremos.

## O diálogo HTTP Basic, requisição por requisição

O método é descrito pela norma [RFC 7617](https://www.rfc-editor.org/rfc/rfc7617) (uma **RFC**, *Request for Comments*, é um documento de referência que define um padrão da Internet). O cliente usado é o `curl`, o programa de terminal que envia requisições HTTP (veja a [documentação do curl](https://curl.se/docs/manpage.html)). Nos blocos a seguir, o `$` no início da linha é o prompt do terminal: ele se lê mas não se digita, e as linhas sem `$` são a resposta exibida. As linhas `Date`, `Connection`, `Keep-Alive` e `Transfer-Encoding`, sem interesse aqui, foram retiradas das saídas copiadas.

| Opção do `curl` | Efeito |
|---|---|
| `-i` | Exibe os cabeçalhos da resposta antes do seu conteúdo |
| `-s` | Silencioso: suprime a barra de progresso |
| `-u usuario:senha` | Fornece as credenciais (o curl monta o cabeçalho `Authorization`) |

Outras opções são explicadas onde servem pela primeira vez (`-v`, `-o`, `-X`, `-d`, `-w`, `--anyauth`, `--netrc-file`).

```
Cliente                                         Servidor
  |  GET /artigos                                |
  | --------------------------------------------> |  sem cabeçalho Authorization
  |  401 Unauthorized                             |
  |  WWW-Authenticate: Basic realm="demo"         |  o desafio : « prove sua identidade »
  | <-------------------------------------------- |
  |  GET /artigos                                |
  |  Authorization: Basic YWxpY2U6bGVp...         |  usuario:senha em Base64
  | --------------------------------------------> |
  |  200 OK  + representação                      |  identidade verificada, permissão presente
  | <-------------------------------------------- |
```

**Sem credenciais.** A requisição não traz cabeçalho `Authorization`:

```
$ curl -i http://127.0.0.1:7312/artigos
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Basic realm="demo", charset="UTF-8"

{"erro":"autenticação necessária"}
```

O código `401` é a resposta « não sei quem você é ». O cabeçalho `WWW-Authenticate` é o **desafio**: ele nomeia o método esperado (`Basic`), o `realm` (o nome da zona protegida, que o navegador exibe na janela de login) e o conjunto de caracteres das credenciais (`UTF-8`, a norma que codifica as letras acentuadas, veja [a codificação dos textos](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes)).

**Com uma senha errada.**

```
$ curl -i -u alice:errada http://127.0.0.1:7312/artigos
HTTP/1.1 401 Unauthorized
Content-Type: application/json
WWW-Authenticate: Basic realm="demo", charset="UTF-8"

{"erro":"autenticação necessária"}
```

A resposta é **idêntica** à anterior, e isso é intencional: ela não diz se o usuário existe, se a senha está errada ou se o cabeçalho está malformado. Uma mensagem mais falante (« senha incorreta para alice ») confirmaria a um atacante que `alice` é uma conta real: é a **enumeração de contas**, que consiste em levantar a lista dos usuários válidos para concentrar em seguida os ataques sobre eles.

**Com as credenciais corretas.**

```
$ curl -i -u alice:leitura-ok http://127.0.0.1:7312/artigos
HTTP/1.1 200 OK
Content-Type: application/json

[{"id":1,"titulo":"Primeiro artigo"}]
```

Eis a anatomia do cabeçalho que o `curl` acaba de enviar:

| Etapa | Resultado para `alice` e `leitura-ok` |
|---|---|
| 1. Montar `usuario:senha` com dois-pontos | `alice:leitura-ok` |
| 2. Codificar esse texto em bytes (UTF-8) e depois em Base64 | `YWxpY2U6bGVpdHVyYS1vaw==` |
| 3. Pôr na frente a palavra `Basic` e um espaço | `Basic YWxpY2U6bGVpdHVyYS1vaw==` |
| 4. Colocar o conjunto no cabeçalho `Authorization` | `Authorization: Basic YWxpY2U6bGVpdHVyYS1vaw==` |

O primeiro dois-pontos separa o usuário da senha, daí uma regra da norma: **um usuário não pode conter dois-pontos**, ao passo que uma senha pode. É a razão de `decodificado.indexOf(':')` na parte 2, que corta somente no primeiro dois-pontos.

### Quem envia o cabeçalho, e quando

Na saída acima, o `curl -u` enviou o cabeçalho **logo de início**, sem esperar o desafio. Já um navegador ainda não conhece as credenciais: ele envia uma requisição nua, recebe o `401` e seu `WWW-Authenticate`, exibe a janela de login e reenvia a requisição com o cabeçalho. A opção `--anyauth` do `curl` reproduz esse comportamento. Para ver as trocas, acrescenta-se `-v` (*verbose*, « detalhado »: exibe cada linha enviada e recebida; `-sv` junta `-s` e `-v`) e `-o /dev/null` (`-o` grava o conteúdo da resposta em um arquivo, e `/dev/null` é o arquivo-lixeira do Linux que descarta tudo, para guardar apenas o registro). O rastro mostra os dois ciclos de ida e volta:

```
$ curl -sv --anyauth -u bruno:escrita-ok http://127.0.0.1:7312/artigos -o /dev/null
> GET /artigos HTTP/1.1
< HTTP/1.1 401 Unauthorized
< WWW-Authenticate: Basic realm="demo", charset="UTF-8"
> GET /artigos HTTP/1.1
> Authorization: Basic YnJ1bm86ZXNjcml0YS1vaw==
< HTTP/1.1 200 OK
```

(As linhas que começam com `>` são enviadas pelo cliente, as que começam com `<` são recebidas. Só as linhas úteis foram mantidas.)

| Cliente | Primeiro envio | Consequência |
|---|---|---|
| `curl -u` | Com o cabeçalho `Authorization` | Um único ciclo de ida e volta, mas a senha sai mesmo para um servidor que não a pedia |
| `curl --anyauth`, navegador | Sem cabeçalho, depois reenvio após o `401` | Dois ciclos, a senha só sai se o servidor a reclamar |

## Base64 não é criptografia

O capítulo sobre [a autenticação e a autorização](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation) afirma isso; eis a prova. **Base64** é uma forma de escrever bytes com apenas 64 caracteres seguros (as letras, os algarismos, `+` e `/`), para que atravessem sem dano protocolos feitos para texto. Três bytes viram quatro caracteres; um ou dois `=` no fim do texto completam o último grupo (o **preenchimento**). Não há chave, nem segredo, nem cálculo difícil: é uma tabela de correspondência.

O que um observador vê passar, reproduzindo a requisição com `curl -v`:

```
$ curl -sv -u alice:leitura-ok http://127.0.0.1:7312/artigos -o /dev/null
> GET /artigos HTTP/1.1
> Authorization: Basic YWxpY2U6bGVpdHVyYS1vaw==
```

E o que ele faz em seguida, sem nenhuma chave, com o comando `base64` (fornecido com o Linux; `-d` significa *decode*, decodificar). `echo 'texto'` exibe o texto; `printf` faz o mesmo sem acrescentar quebra de linha final, que mudaria o Base64; o **tubo** `|` envia o que o comando da esquerda exibe para o comando da direita (veja [redirecionamentos e pipes](/?c=langages&s=bash&p=redirections-et-pipes)):

```
$ echo 'YWxpY2U6bGVpdHVyYS1vaw==' | base64 -d
alice:leitura-ok
$ printf 'alice:leitura-ok' | base64
YWxpY2U6bGVpdHVyYS1vaw==
```

O usuário **e** a senha aparecem em texto claro, e o caminho inverso devolve exatamente o texto transmitido. A mesma decodificação se escreve em Node com `Buffer.from(texto, 'base64').toString('utf8')`, o que faz a linha `Buffer.from(encontrado[1], 'base64')` da parte 2: o próprio servidor não precisa de nenhum segredo para ler o cabeçalho, logo qualquer outra pessoa também não.

| | Codificação (Base64) | Hash | Criptografia |
|---|---|---|---|
| Reversível? | Sim, por qualquer um | Não | Sim, somente com a chave |
| Chave ou segredo? | Nenhum | Nenhum (às vezes um sal) | Sim |
| Objetivo | Fazer passar bytes dentro de um texto | Verificar ou comparar sem armazenar o dado | Tornar ilegível para quem não tem a chave |
| Protege uma senha em trânsito? | **Não** | Não (o servidor precisa receber a senha) | Sim, é o papel do TLS |

A distinção entre hash e criptografia é desenvolvida em [Criptografia aplicada](/?c=securite&s=cybersecurite&p=cryptographie-appliquee).

### A única proteção: HTTPS

**HTTPS** é HTTP dentro de um túnel criptografado por **TLS** (*Transport Layer Security*, o protocolo que criptografa a conexão entre o cliente e o servidor; veja [o certificado TLS](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)). Com HTTPS, o cabeçalho `Authorization` é criptografado junto com o restante da requisição. O **certificado** é a carteira de identidade digital do servidor, que o cliente verifica: sem essa verificação, um intermediário pode se passar pelo servidor e ler o que o cliente lhe envia.

```
HTTP (porta 80)                                 HTTPS (porta 443)

Cliente -- Authorization: Basic YWxp... -->     Cliente -- bytes ilegíveis (TLS) -->
          ^                                               ^
   legível por cada máquina do trajeto            somente o servidor pode lê-los
   (Wi-Fi público, roteador, proxy...)            (se o certificado for verificado)
```

> **Armadilha:** redirecionar `http://` para `https://` acreditando que o problema está resolvido. Um cliente como `curl -u` envia o cabeçalho já na **primeira** requisição, portanto em texto claro, antes mesmo de ler o redirecionamento. A senha já trafegou.
>
> **Boa prática:** não escutar em HTTP de modo algum numa API que aceita Basic (ou recusar toda requisição que traga um `Authorization` fora do TLS), e considerar comprometida uma senha que um dia circulou sem TLS.

O servidor de exemplo escuta em HTTP simples porque responde apenas em `127.0.0.1` (a sua própria máquina), onde nada circula numa rede: é um compromisso de demonstração, nunca um modelo de implantação.

## Os limites próprios do HTTP Basic

Esses limites não são defeitos de uma implementação: decorrem do princípio do Basic.

| Limite | Por quê | Consequência concreta |
|---|---|---|
| Sem desconexão | O servidor não guarda nenhuma sessão para fechar; o cliente reenvia as credenciais enquanto as conhecer | Fechar uma aba nem sempre basta, e o servidor não consegue « expulsar » um cliente sem trocar a senha |
| Credenciais reenviadas a **cada** requisição | Servidor sem estado: a identidade acompanha cada envio | Cada requisição é uma oportunidade de vazamento, e cada uma refaz um cálculo de verificação |
| Sem expiração | A senha vale enquanto não for trocada | Credenciais roubadas continuam utilizáveis por meses |
| Segredo principal exposto | É a senha real da conta que trafega, não um token descartável | Um vazamento compromete também os outros usos da conta |
| Sem segundo fator | Um único segredo, enviado numa única mensagem | Impossível exigir um código temporário (veja [a autenticação multifator](/?c=securite&s=renforcer-lauthentification&p=authentification-multifacteur)) |
| Rastros involuntários | O cabeçalho pode ser copiado por ferramentas intermediárias | Veja o esquema abaixo |

```
 Computador do desenvolvedor     Rede                      Servidor
+--------------------+     +----------------+     +----------------------+
| histórico do shell |     | proxy          |     | log de acesso        |
| (curl -u a:senha)  | --> | firewall       | --> | (se o cabeçalho      |
| depurador          | --> | que registra   | --> | estiver copiado),    |
| captura de tela    |     | em log         |     | monitor, cópia       |
+--------------------+     +----------------+     | de backup            |
                                                  +----------------------+
 Cada caixa pode guardar uma cópia da senha.
```

Um **proxy** é um servidor intermediário por onde passam as requisições (muitas vezes numa empresa), um **firewall** é um dispositivo que filtra o tráfego de rede; um **log** é o arquivo em que um programa anota o que aconteceu, veja [os logs centralizados](/?c=infrastructure-devops&s=infrastructure&p=elk-agregation-de-logs). O servidor de exemplo só grava `GET /artigos -> 401`: não há nada a vazar. Um servidor configurado para copiar todos os cabeçalhos em seus logs, este sim, deposita nelas senhas válidas.

O terminal é o caso mais negligenciado: digitar `curl -u alice:leitura-ok ...` grava a senha no histórico de comandos, e a deixa visível por um instante na lista dos programas em execução (o comando `ps` a exibe, com os argumentos de cada um). Um arquivo de credenciais lido pelo `curl` evita as duas coisas. Seu formato é o dos arquivos **netrc** (veja a opção [`--netrc-file`](https://curl.se/docs/manpage.html#--netrc-file) do curl): `machine` é o nome ou o endereço do servidor em questão, `login` o usuário e `password` a senha. Cria-se esse arquivo com um editor de texto (criá-lo com `echo` colocaria a senha de volta no histórico):

```
$ cat netrc-demo
machine 127.0.0.1 login alice password leitura-ok
$ chmod 600 netrc-demo
$ curl -si --netrc-file netrc-demo http://127.0.0.1:7312/artigos | head -1
HTTP/1.1 200 OK
```

`cat` exibe o conteúdo de um arquivo. `chmod 600` reserva o arquivo ao seu proprietário (veja [as permissões de arquivos](/?c=langages&s=bash&p=permissions-et-fichiers)). `head -1` guarda apenas a primeira linha da resposta, aqui a linha de status (veja [os comandos básicos](/?c=langages&s=bash&p=commandes-de-base) e [os pipes](/?c=langages&s=bash&p=redirections-et-pipes)). Em uma implantação real, o segredo não fica em nenhum arquivo do repositório: veja [a gestão de segredos](/?c=securite&s=cybersecurite&p=gestion-des-secrets).

## Autenticação e autorização: dois controles distintos

O servidor encadeia suas verificações numa ordem precisa, que a função `verificar` da parte 5 materializa:

```
requisição
   |
   v
recurso conhecido ?  -- não --> 404 Not Found (não encontrado)
   |
   v
método declarado ?  -- não --> 405 Method Not Allowed (+ Allow)
   |
   v
recurso protegido ? -- não --> executar
   |
   v
falhas recentes demais ?  -- sim --> 429 Too Many Requests (+ Retry-After)
   |
   v
identidade válida ?   -- não --> 401 Unauthorized (+ WWW-Authenticate)
   |
   v
permissão presente ? -- não --> 403 Forbidden
   |
   v
executar a regra -> 200 ou 201
```

As respostas reais para quatro casos: `alice` (permissão `ler` apenas) tenta escrever, `bruno` (permissão `escrever`) escreve, `bruno` tenta um método não declarado, e uma chamada sem credenciais mira o recurso público `/saude`. Novas opções do `curl`: `-X METODO` escolhe o método HTTP, `-d 'texto'` fornece o corpo da requisição. No shell, uma `\` no fim da linha indica que o comando continua na linha seguinte, onde o terminal exibe então o prompt `>` (que não se digita).

```
$ curl -i -u alice:leitura-ok -X POST -d '{"titulo":"Intruso"}' http://127.0.0.1:7312/artigos
HTTP/1.1 403 Forbidden
Content-Type: application/json

{"erro":"permissão ausente"}

$ curl -i -u bruno:escrita-ok -X POST -d '{"titulo":"Segundo artigo"}' \
>   http://127.0.0.1:7312/artigos
HTTP/1.1 201 Created
Content-Type: application/json

{"id":2,"titulo":"Segundo artigo"}

$ curl -i -u bruno:escrita-ok -X DELETE http://127.0.0.1:7312/artigos
HTTP/1.1 405 Method Not Allowed
Content-Type: application/json
Allow: GET, POST

{"erro":"método recusado"}

$ curl -i http://127.0.0.1:7312/saude
HTTP/1.1 200 OK
Content-Type: application/json

{"estado":"ok"}
```

`alice` está perfeitamente autenticada no primeiro caso (sua senha está certa) e mesmo assim recusada: o `403` indica que o servidor sabe quem ela é e lhe recusa aquele gesto. Mesmo com os direitos mais amplos, `bruno` não pode chamar um método que o recurso não declara. Por fim, `/saude` declara `permissao: null`: o recurso é **público** por uma escolha escrita preto no branco, e não por esquecimento.

| Código | Pergunta à qual responde | Corrige-se... |
|---|---|---|
| `401` | Quem é você? | Fornecendo credenciais válidas |
| `403` | Você tem o direito de fazer isto? | Alterando as permissões, nunca a senha |
| `405` | Este método existe neste recurso? | Usando um método da lista `Allow` |
| `429` | Você tentou com frequência excessiva? | Esperando a duração de `Retry-After` |

Para agrupar as permissões em perfis, veja [RBAC e ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac). Um ponto a escolher com consciência: neste exemplo, os controles `404` e `405` vêm antes da autenticação, então um desconhecido descobre quais endereços e quais métodos existem. Para uma API em que essa informação é ela mesma sensível, autentica-se primeiro e responde-se `401` em todos os casos.

## Comparar segredos em tempo constante

Comparar a senha recebida com a que se espera parece trivial: `recebido === esperado`. Ocorre que o operador de igualdade de uma linguagem **para na primeira diferença**. Quanto mais os dois textos se parecem no início, mais longa é a comparação. O pequeno programa a seguir conta os caracteres examinados por uma comparação clássica:

Arquivo `comparacao.mjs` (a salvar na mesma pasta e depois executar com `node comparacao.mjs`):

```javascript
import { timingSafeEqual } from 'node:crypto';          // comparação em tempo constante

// Math.min(x, y) é o menor dos dois números; a[i] é o caractere de posição i
// (o primeiro tem a posição 0); a.length é o número de caracteres do texto a.
function compararIngenuo(a, b) {                        // comparação « clássica »
  let comparadas = 0;                                   // caracteres examinados até aqui
  // for (início; condição; passo) repete enquanto a condição for verdadeira; i++ soma 1 a i
  for (let i = 0; i < Math.min(a.length, b.length); i++) { // do primeiro ao último
    comparadas += 1;                                    // um caractere a mais examinado
    if (a[i] !== b[i]) return { igual: false, comparadas }; // parada na primeira diferença
  }
  return { igual: a.length === b.length, comparadas };  // tudo igual: mesmo tamanho?
}

const segredo = 'leitura-ok';                           // o segredo a adivinhar
// for (const x of lista) repete o bloco para cada elemento da lista
for (const tentativa of ['xxxxxxxxxx', 'lxxxxxxxxx', 'leituraxxx', 'leitura-ok']) {
  const r = compararIngenuo(tentativa, segredo);        // resultado da comparação ingênua
  console.log(tentativa, '->', r.igual, '| caracteres examinados :', r.comparadas);
}

// try { ... } catch (erro) { ... }: se try lançar um erro, catch o recebe
try {
  timingSafeEqual(Buffer.from('abcd'), Buffer.from(segredo)); // 4 bytes contra 10
} catch (erro) {
  console.log(erro.code);                               // a função recusa comparar
}
```

Resultado obtido na execução (as quatro primeiras linhas para a comparação clássica, a última para `timingSafeEqual`):

```
$ node comparacao.mjs
xxxxxxxxxx -> false | caracteres examinados : 1
lxxxxxxxxx -> false | caracteres examinados : 2
leituraxxx -> false | caracteres examinados : 8
leitura-ok -> true | caracteres examinados : 10
ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH
```

A duração da comparação **revela** o comprimento do prefixo exato. Um **ataque por cronometragem** (*timing attack*) explora isso: o atacante envia um número muito grande de tentativas, mede os tempos de resposta e descobre o segredo caractere por caractere. Pela rede, a medição é ruidosa e o ataque exige muitas tentativas; ele se torna realista numa rede local ou com repetições suficientes, e a defesa quase não custa nada, por isso sempre a aplicamos.

| Linguagem | Comparação em tempo constante | Cuidado |
|---|---|---|
| Node.js | `crypto.timingSafeEqual(a, b)` (veja a [documentação do Node](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)) | Exige dois `Buffer` de **mesmo tamanho**, senão lança um erro |
| PHP | [`hash_equals($esperado, $recebido)`](https://www.php.net/manual/pt_BR/function.hash-equals.php) | Colocar o valor de confiança no primeiro argumento |
| Python | [`hmac.compare_digest(a, b)`](https://docs.python.org/pt-br/3/library/hmac.html#hmac.compare_digest) | Dois textos ou duas sequências de bytes do mesmo tipo; para textos, a documentação os limita aos caracteres ASCII (letras sem acento, algarismos, pontuação básica) |

O mesmo reflexo serve para as assinaturas de [webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) e de [HMAC](/?c=securite&s=cybersecurite&p=cryptographie-appliquee).

A armadilha própria do `timingSafeEqual` é a exigência de tamanho: comparar uma senha de 4 caracteres com uma de 10 lança um erro (a última linha acima, `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`), e esse erro revela o comprimento do segredo.

A defesa, aplicada na parte 2: nunca se comparam **as próprias senhas**, mas seus hashes `scrypt`, sempre de 32 bytes. O atacante não controla o início do hash (um caractere a mais no seu teste muda o hash inteiro), de modo que até uma comparação ingênua não lhe ensinaria nada; o `timingSafeEqual` acrescenta uma garantia a mais.

Segundo detalhe da parte 2: quando o usuário é desconhecido, o servidor calcula **mesmo assim** um hash, contra uma `CONTA_FICTICIA`. Sem isso, um usuário inexistente seria recusado instantaneamente, e um usuário real, só após um cálculo lento, o que permitiria enumerar contas medindo os tempos. Essa lentidão desejada do `scrypt` tem um custo: cada tentativa consome processador, o que alimenta os [ataques por sobrecarga](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif). Por isso, o controle do número de falhas vem **antes** do cálculo.

## Limitar as tentativas

Um atacante que consegue tentar uma senha por milissegundo fará milhões de tentativas: é a **força bruta** (*brute force*), a tentativa metódica de um número muito grande de valores até acertar. O servidor, portanto, conta as falhas por endereço IP (parte 3) e, além de três numa janela de sessenta segundos, responde `429 Too Many Requests` (« tentativas demais ») com um cabeçalho `Retry-After: 60` (« tente de novo em sessenta segundos »). Três tentativas erradas seguidas, depois a senha **certa**. O primeiro comando é um [laço](/?c=langages&s=bash&p=boucles): `for i in 1 2 3; do ...; done` repete o que está entre `do` e `done`, dando a `i` os valores 1, 2 e depois 3, e `$i` insere esse valor. A opção `-w "tentativa $i : %{http_code}\n"` faz o `curl` exibir, depois da resposta, este texto em que `%{http_code}` é substituído pelo código de status e `\n` é uma quebra de linha; `-o /dev/null` descarta o conteúdo da resposta.

```
$ for i in 1 2 3; do curl -s -o /dev/null -w "tentativa $i : %{http_code}\n" \
>   -u alice:errada$i http://127.0.0.1:7312/artigos; done
tentativa 1 : 401
tentativa 2 : 401
tentativa 3 : 429

$ curl -i -u alice:leitura-ok http://127.0.0.1:7312/artigos
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{"erro":"tentativas demais"}
```

(Uma primeira tentativa errada já tinha sido contada mais acima na sessão: o contador chega portanto a três já na segunda tentativa da rajada, e a terceira é recusada antes de qualquer verificação. As requisições **sem** cabeçalho `Authorization`, primeiro intercâmbio normal do desafio, não contam.) Mesmo a senha certa continua recusada enquanto a janela não tiver passado: é a regra, e é ela que torna as tentativas massivas de senhas impraticáveis.

| Chave do contador | Protege contra | Risco |
|---|---|---|
| Por endereço IP | Um atacante que tenta muitas contas a partir de uma máquina | Vários usuários atrás do mesmo endereço (uma empresa) se bloqueiam mutuamente; um atacante que muda de endereço contorna a regra |
| Por conta | Um atacante que mira uma conta a partir de muitos endereços | Ele pode **bloquear de propósito** uma conta legítima, errando de propósito: é uma **negação de serviço** (tornar um serviço inutilizável para os outros, veja [sobrecarga e negação de serviço](/?c=securite&s=cybersecurite&p=surcharge-et-deni-de-service-applicatif)) |
| Os dois, com limites diferentes | Os dois cenários | Mais regras a ajustar e a monitorar |

Quatro armadilhas próprias desta implementação, todas reais em produção:

| Armadilha | Por quê | Defesa |
|---|---|---|
| Servidor atrás de um proxy reverso (um servidor frontal que recebe as requisições em seu lugar e as repassa) | `remoteAddress` passa a ser o endereço do proxy, para todos os clientes: todo mundo compartilha um único contador | Ler o endereço de origem que o proxy transmite no cabeçalho [`X-Forwarded-For`](https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Headers/X-Forwarded-For), e somente se o proxy for confiável (senão qualquer cliente pode escrever o endereço que quiser) |
| Contador mantido na memória do processo | Perdido a cada reinicialização, e próprio de cada instância se várias estiverem rodando | Um armazenamento compartilhado: um banco de dados, ou um **cache** (uma memória rápida que guarda dados já obtidos) |
| Contador que nunca se esvazia | Bloqueia de modo duradouro um usuário legítimo | Uma janela, como aqui, ou um atraso que cresce |
| Contador mantido do lado do cliente | O cliente pode simplesmente ignorá-lo | Sempre do lado do servidor, veja [a segurança das APIs web](/?c=securite&s=cybersecurite&p=securite-api-web) |

## As alternativas ao HTTP Basic

| Mecanismo | O que trafega a cada requisição | Expira? | Revogável sozinho? | Adequado para | Capítulo |
|---|---|---|---|---|---|
| HTTP Basic | Usuário e **senha** | Não | Não (é preciso trocar a senha) | Script interno, ferramenta de administração, atrás de HTTPS | Este capítulo |
| Chave de API | Um valor secreto longo ligado a uma conta ou a um aplicativo | Raramente | Sim, apaga-se a chave | Um serviço de terceiros, um acesso servidor a servidor | [Segurança das APIs web](/?c=securite&s=cybersecurite&p=securite-api-web) |
| Sessão e cookie | Um identificador de sessão escolhido pelo servidor | Sim | Sim, o servidor esquece a sessão | Um usuário humano num navegador | [Sessões e cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies) |
| Token assinado (JWT) | Um token que contém suas próprias informações | Sim | Dificilmente antes da expiração | Uma API consumida por um aplicativo | [JWT e tokens](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) |
| OAuth 2.0 | Um token de acesso emitido por um servidor de autorização | Sim | Sim | Dar acesso limitado a um aplicativo de terceiros sem compartilhar a senha | [OAuth 2.0 e OpenID Connect](/?c=securite&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) |
| Assinatura HMAC | Uma assinatura calculada com um segredo compartilhado | Com um carimbo de data e hora (a data e a hora entram na assinatura) | Sim, troca-se o segredo | Uma chamada de um sistema para outro, como um webhook | [Segurança dos webhooks](/?c=securite&s=cybersecurite&p=securite-des-webhooks) |

| Situação | Escolha razoável |
|---|---|
| Um script de backup interno chama uma API de administração por HTTPS | Basic com uma conta **dedicada**, com permissões mínimas, e uma senha longa sorteada ao acaso (veja [a aleatoriedade](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs)) |
| Um aplicativo móvel chama a API em nome de um usuário | Token de duração limitada, nunca a senha do usuário em cada requisição |
| Um site de terceiros precisa ler dados de um usuário | OAuth 2.0 |
| Um parceiro envia eventos automáticos | Assinatura HMAC |

## Exemplo no Drupal: o módulo REST e o provedor `basic_auth`

> **Este exemplo é específico do Drupal, e sua forma depende da versão.** [Drupal](https://www.drupal.org) é um sistema de gerenciamento de conteúdo escrito em [PHP](/?c=langages&s=php&p=php) (um software que permite construir e administrar um site). Ele não foi instalado no ambiente que serviu para escrever este capítulo: o código PHP abaixo não foi executado, apenas verificado quanto à sintaxe (com `php -l`, o comando do PHP que verifica um arquivo sem executá-lo). Os nomes próprios do Drupal foram conferidos com a documentação oficial ([api.drupal.org](https://api.drupal.org), ramo 11.x, e [drupal.org](https://www.drupal.org/docs/drupal-apis/restful-web-services-api)). O ponto mais sensível às versões é a forma de declarar o plugin: um **atributo** PHP `#[RestResource]` nas versões recentes (a documentação de API do Drupal 10.3 e 11 o apresenta), uma **anotação** `@RestResource` nas versões mais antigas (Drupal 8 a 10). Verifique a versão do seu site antes de copiar. O restante do capítulo não depende disso.

O Drupal oferece os mesmos blocos, sob outros nomes. Um recurso é aí um **plugin** (veja [a arquitetura de plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins), que cita justamente os recursos de API entre os tipos de plugins desse software) cujo rótulo é o atributo `#[RestResource]` colocado logo acima da classe.

| Conceito do capítulo | Elemento do Drupal |
|---|---|
| O registro de recursos | O gerenciador de plugins dos recursos REST, alimentado pelas classes da pasta `Plugin/rest/resource` de um módulo |
| A declaração de um recurso | Uma classe que estende `ResourceBase`, rotulada pelo atributo `#[RestResource(id, label, uri_paths)]` (ou, antes, pela anotação `@RestResource(...)`) |
| Os métodos `GET` e `POST` | Os métodos PHP `get()` e `post()` da classe (assim como `patch()` e `delete()`) |
| Os métodos e formatos ativados, a autenticação aceita | Uma configuração `rest.resource.<identificador>` que lista `methods`, `formats` e `authentication`; sem ela, o recurso não fica disponível |
| O provedor de autenticação Basic | O módulo `basic_auth`, referenciado pelo identificador `basic_auth` |
| As permissões por método | Permissões que o `ResourceBase` gera para cada método, sob a forma `restful get exemplo_artigos`, a atribuir aos papéis |

```php
<?php

namespace Drupal\exemplo_api\Plugin\rest\resource;

use Drupal\Core\StringTranslation\TranslatableMarkup; // um texto traduzível
use Drupal\rest\Attribute\RestResource;   // o atributo que declara o recurso
use Drupal\rest\Plugin\ResourceBase;      // classe-mãe dos recursos REST
use Drupal\rest\ResourceResponse;         // a resposta devolvida por um recurso

/**
 * Expõe uma lista de artigos de exemplo.
 */
#[RestResource(
  id: 'exemplo_artigos',
  label: new TranslatableMarkup("Artigos de exemplo"),
  uri_paths: [
    'canonical' => '/api/exemplo/artigos',
    'create' => '/api/exemplo/artigos',
  ],
)]
class ArtigosResource extends ResourceBase {

  /**
   * Responde a GET: devolve a lista.
   */
  public function get(): ResourceResponse {
    $artigos = [['id' => 1, 'titulo' => 'Primeiro artigo']];  // dados de exemplo
    return new ResourceResponse($artigos);                    // 200 e a lista em JSON
  }

  /**
   * Responde a POST: cria um artigo.
   */
  public function post(array $dados): ResourceResponse {
    // ?? : o valor à esquerda, salvo se estiver ausente; (string) força um texto
    $titulo = (string) ($dados['titulo'] ?? '');              // lê o título recebido
    return new ResourceResponse(['id' => 2, 'titulo' => $titulo], 201); // 201: criado
  }

}
```

Um **atributo** PHP é uma linha especial `#[...]`, colocada logo antes da classe, que o gerenciador de plugins lê para descobrir o recurso: `id` o nomeia, `label` dá seu nome legível, `uri_paths` associa o recurso a seus endereços (`canonical` para um elemento, `create` para a criação). `namespace` coloca a classe num espaço de nomes, `use` importa uma classe de outro espaço, e `extends` faz com que ela herde de `ResourceBase`, veja [a programação orientada a objetos em PHP](/?c=langages&s=php&p=poo). Numa versão mais antiga do Drupal, a mesma declaração se escreve com uma **anotação**, um comentário especial acima da classe, sem o `use` de `RestResource` nem o de `TranslatableMarkup` (este se torna `@Translation`):

```php
/**
 * Expõe uma lista de artigos de exemplo.
 *
 * @RestResource(
 *   id = "exemplo_artigos",
 *   label = @Translation("Artigos de exemplo"),
 *   uri_paths = {
 *     "canonical" = "/api/exemplo/artigos",
 *     "create" = "/api/exemplo/artigos"
 *   }
 * )
 */
```

A segunda peça ativa o recurso e escolhe sua autenticação. É um arquivo de configuração no formato [YAML](/?c=infrastructure-devops&s=docker&p=docker-compose) (um formato de texto baseado em indentação), com a mesma estrutura da configuração do recurso `entity.node` fornecida com o módulo REST do Drupal:

```yaml
id: exemplo_artigos           # identificador da configuração
plugin_id: exemplo_artigos    # o plugin de recurso que ela ativa
status: true                  # o recurso está ativado
granularity: resource         # uma opção para o recurso inteiro (não por método)
configuration:
  methods:                    # lista branca dos métodos ativados
    - GET
    - POST
  formats:                    # representações aceitas
    - json
  authentication:             # provedores de autenticação aceitos
    - basic_auth
```

Três observações de cautela. Primeiro, esta configuração só vale se o módulo `basic_auth` estiver ativado. Depois, o provedor `basic_auth` do Drupal já aplica sua própria limitação das tentativas falhas (o serviço « flood », configurado pela opção `user.flood`: limites e durações por endereço IP e por conta, no código do ramo 11.x): antes de escrever à mão a limitação vista acima, verifique essas configurações. Por fim, o formato da resposta se escolhe no endereço: a documentação do Drupal indica que o cabeçalho `Accept` não é mais aceito e que é preciso sempre o parâmetro `_format`, daí uma chamada como `curl -u usuario:senha 'https://exemplo.test/api/exemplo/artigos?_format=json'` (`exemplo.test` é um nome de exemplo), com exatamente os mesmos limites de antes: Base64 transparente, HTTPS obrigatório, senha da conta em cada requisição. Para a documentação oficial, veja [a API dos serviços web RESTful do Drupal](https://www.drupal.org/docs/drupal-apis/restful-web-services-api).

## As armadilhas

| Armadilha | Por que é um problema | Reflexo |
|---|---|---|
| Acreditar que Base64 protege as credenciais | Qualquer um o decodifica com um comando, sem chave | HTTPS obrigatório, nunca Basic em texto claro |
| Redirecionar `http://` para `https://` | O primeiro envio já expôs a senha | Não escutar em HTTP, ou recusar todo `Authorization` fora do TLS |
| Comparar o segredo com `===` ou `==` | A duração da comparação revela o prefixo exato | `timingSafeEqual`, `hash_equals` ou `compare_digest` |
| `timingSafeEqual` com tamanhos diferentes | O erro lançado revela o tamanho | Comparar hashes de tamanho fixo |
| Mensagem de erro que informa “senha incorreta” ou “conta desconhecida” | Permite levantar a lista das contas válidas | Uma única resposta `401` para todas as falhas |
| Usuário desconhecido recusado sem cálculo | A diferença de duração revela as contas reais | Calcular um hash fictício nesse caso |
| Copiar o cabeçalho `Authorization` nos logs | Senhas válidas em arquivos lidos por muita gente | Registrar método, caminho e código, nunca o cabeçalho |
| `curl -u usuario:senha` digitado no terminal | A senha fica no histórico de comandos e pode aparecer na lista dos processos | `--netrc-file`, ou `-u usuario` sozinho, que pede a senha |
| Senha no endereço (`https://id:senha@host/`) | O endereço se encontra no histórico, nos logs e nos links | Sempre o cabeçalho, nunca o endereço |
| Contador de falhas do lado do cliente ou na memória de uma única instância | Contornável, e perdido na reinicialização | Contador do lado do servidor, em armazenamento compartilhado |
| Bloquear uma conta após três falhas | Um atacante bloqueia de propósito um usuário legítimo | Um atraso crescente em vez de um bloqueio definitivo |
| Recurso declarado sem permissão, portanto aberto a todos | Uma API inteira pública por esquecimento | Recusa por padrão: exigir uma permissão explícita, `null` apenas para o público desejado |
| Permitir todos os métodos num recurso | `DELETE` ou `PATCH` abertos quando ninguém precisa deles | Lista branca de métodos por recurso |
| Usar uma conta de administrador para um script | O vazamento dá todos os direitos | Uma conta dedicada, com permissões mínimas |

## Boas práticas

| Prática | Motivo |
|---|---|
| HTTPS em todo lugar em que o Basic é aceito | Única proteção real do cabeçalho `Authorization` |
| Declarar cada recurso num registro, com seus métodos e suas permissões | Superfície de ataque conhecida e legível, acréscimo sem tocar no código central |
| Uma permissão por método, recusa por padrão | O controle de acesso não depende de um esquecimento |
| Nunca guardar uma senha legível: sal aleatório e hash lento | Um banco roubado não entrega as senhas |
| Comparar hashes de tamanho fixo em tempo constante | Nenhum vazamento pela duração nem pelo tamanho |
| Mesma resposta e mesmo custo para usuário desconhecido e senha errada | Nenhuma enumeração de contas |
| Limitar as tentativas no servidor, antes do cálculo caro | Protege o segredo e o processador |
| Responder `401` com `WWW-Authenticate`, `403` para uma permissão ausente, `405` com `Allow` | O cliente entende qual parte falha |
| Registrar em log sem o cabeçalho `Authorization` | Nenhuma cópia do segredo a proteger |
| Uma conta dedicada por uso, senha longa e aleatória, guardada numa ferramenta de segredos | Vazamento limitado, revogação sem consequência para os outros usos |
| Escolher um token, uma chave ou OAuth assim que um usuário humano ou um terceiro estiver envolvido | Expiração, revogação e delegação que o Basic não sabe oferecer |

## O que reter

| | |
|---|---|
| **Para lembrar: o recurso** | Um **recurso REST** é uma coisa designada por uma URL, sobre a qual o cliente age com métodos HTTP (`GET` lê, `POST` cria, `PUT` substitui, `PATCH` corrige, `DELETE` exclui) e da qual o servidor devolve uma representação, muitas vezes em JSON. Ele se **declara como um plugin** num registro: caminho, métodos permitidos (lista branca, senão `405` com `Allow`) e permissão de cada método. A API é **sem estado**: a identidade acompanha cada requisição. |
| **Para lembrar: HTTP Basic** | O **HTTP Basic** envia `Authorization: Basic <Base64 de usuario:senha>`; sem cabeçalho, o servidor responde `401` com `WWW-Authenticate: Basic realm="..."`. **Base64 não é criptografia**: `base64 -d` devolve a senha em texto claro, por isso o HTTPS é obrigatório. |
| **Para lembrar: seus limites** | O Basic não tem desconexão, expiração nem segundo fator, e reenvia a verdadeira senha a cada requisição, com o risco de cópia nos logs, nos proxies e no histórico do terminal. |
| **Para lembrar: os controles** | Autenticação (`401`) e autorização (`403`) são dois controles distintos. O segredo se compara **em tempo constante** (`timingSafeEqual`, `hash_equals`, `compare_digest`) sobre hashes de tamanho fixo, um usuário desconhecido custa o mesmo cálculo, e as tentativas são limitadas no servidor (`429` com `Retry-After`). |
| **Armadilhas a evitar** | Acreditar que o Base64 protege; redirecionar do HTTP para o HTTPS achando que o primeiro envio foi salvo; comparar com `===`; `timingSafeEqual` com tamanhos diferentes; mensagens de erro específicas demais; usuário desconhecido recusado sem cálculo; `Authorization` copiado nos logs; senha digitada em `curl -u` ou colocada no endereço; contador de falhas do lado do cliente, na memória ou atrás de um proxy sem endereço de origem; bloqueio definitivo de uma conta; recurso sem permissão declarada, portanto público; métodos não listados permitidos; conta de administrador para um script. |
| **Boas práticas** | HTTPS em todo lugar; um registro de recursos com lista branca de métodos e permissão por método, recusa por padrão; sal e hash lento para guardar as senhas; comparação em tempo constante de hashes de tamanho fixo; mesma resposta para todas as falhas de autenticação; limitação das tentativas no servidor antes do cálculo; logs sem `Authorization`; conta dedicada, com direitos mínimos, e um segredo longo e aleatório guardado numa ferramenta de segredos; token, chave de API ou OAuth 2.0 assim que um usuário humano ou um terceiro estiver envolvido. |
