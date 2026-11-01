---
order: 13
---

# Carregamento adiado e espaço reservado (31/10/2026)

Uma **página web** é um documento que o **navegador** (o programa que exibe as páginas) recebe de um **servidor** (um computador que responde às requisições do navegador) e exibe; a troca é descrita em [requisição e resposta HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). Ela raramente é de uma peça só: é composta de **blocos**, pedaços autônomos (um menu, um artigo, um carrinho, uma mensagem « Olá Jean »). A maioria é idêntica para todos os visitantes; alguns são **lentos** para calcular ou **pertencem à pessoa** que está olhando. Este capítulo explica como exibir logo o que já está pronto, sem esperar por esses blocos, e depois encaixá-los assim que forem calculados.

Ele se apoia nessas trocas e na ideia de [não recalcular o que não mudou](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant). Os exemplos executados usam [Node.js](https://nodejs.org/api/http.html), iniciado a partir de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal). Um sistema de gerenciamento de conteúdo, o [Drupal](https://www.drupal.org/) (um software escrito em [PHP](/?c=langages&s=php&p=php) que permite construir e administrar um site), serve de exemplo no fim do capítulo: ele é apenas uma ilustração, a ideia vale para qualquer site. O cache compartilhado que evita recalcular os blocos idênticos é detalhado em [Metadados de cache e invalidação](/?c=qualite-performance-et-outils&s=performance&p=metadonnees-de-cache-et-invalidation), e a reserva de espaço de uma imagem em [Redimensionar imagens e servir o WebP](/?c=qualite-performance-et-outils&s=performance&p=redimensionner-des-images-et-servir-du-webp).

| Seção | Pergunta tratada |
|---|---|
| [O problema](#o-problema-um-unico-bloco-lento-trava-a-pagina-inteira) | Por que um bloco lento ou pessoal prejudica a página inteira |
| [A ideia](#a-ideia-um-espaco-reservado-preenchido-depois) | Renderizar primeiro, preencher depois |
| [Três maneiras de entregar](#tres-maneiras-de-entregar-o-bloco-adiado) | Síncrona, em fluxo, por uma segunda requisição |
| [A experiência](#a-experiencia-um-pequeno-servidor-que-mede) | Medir o ganho com um servidor de verdade |
| [O deslocamento](#a-armadilha-do-deslocamento-de-layout) | Reservar o tamanho do espaço |
| [A acessibilidade](#a-acessibilidade-anunciar-o-que-esta-chegando) | Anunciar o conteúdo que está chegando |
| [O bloco como plugin](#o-bloco-como-plugin) | Onde guardar o código de um bloco |
| [Um exemplo no Drupal](#um-exemplo-no-drupal-lazy-builder-e-bigpipe) | O mecanismo em um software real |

## O problema: um único bloco lento trava a página inteira

Tomemos uma loja online. Sua página inicial é formada por quatro blocos:

```
+-------------------------------------------------+
|  Menu                  (igual para todos)       |
+-------------------------------------------------+
|  Destaques             (igual para todos)       |
+-------------------------------------------------+
|  Olá Jean, 3 artigos no carrinho                |   <- próprio do Jean, lento
+-------------------------------------------------+
|  Rodapé                (igual para todos)       |
+-------------------------------------------------+
```

| Bloco | Mesmo conteúdo para todos? | Custo de cálculo | Pode ficar em cache? |
|---|---|---|---|
| Menu | Sim | Baixo | Sim |
| Destaques | Sim | Médio (consultas ao [banco de dados](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees)) | Sim |
| Carrinho e « Olá Jean » | Não, depende do visitante | Alto (banco de dados, conta conectada) | Somente para o Jean |
| Rodapé | Sim | Baixo | Sim |

Um **cache** é uma cópia de um resultado já calculado, guardada para ser reutilizada sem refazer o cálculo (ver [evitar o recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)). Uma cópia só pode ser reutilizada se o resultado for o mesmo para quem a pede. Um cache **compartilhado** (por exemplo o de uma [CDN](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=cdn-et-diffusion-adaptative), uma rede de servidores que guarda cópias perto dos visitantes) serve a mesma cópia a todos.

Um único bloco pessoal basta para estragar a página inteira:

| Escolha do desenvolvedor | Consequência |
|---|---|
| Página inteira em cache compartilhado | Maria veria « Olá Jean »: falha grave (vazamento de dados pessoais) |
| Página inteira sem cache | Cada visita recalcula também o menu e os destaques, que não mudaram |
| Uma cópia da página por visitante | Uma cópia para cada visitante, quase nunca reutilizada: o cache não serve para nada |
| Página esperando o bloco lento | O visitante vê uma página em branco durante todo o cálculo do carrinho |

O último caso é o mais visível: o tempo até o visitante ver algo é igual ao tempo do bloco **mais lento**, enquanto os outros estavam prontos havia muito tempo.

## A ideia: um espaço reservado preenchido depois

Um **espaço reservado** (em inglês *placeholder*) é um lugar vazio, ou preenchido com um texto provisório, deixado no lugar de um bloco que ainda não foi calculado. O servidor procede em dois tempos:

1. Ele envia logo a página, com o espaço reservado no lugar do bloco lento.
2. Calcula o bloco e o faz chegar para substituir o espaço reservado.

O **carregamento adiado** (em inglês *lazy loading*) é esse adiamento do cálculo de um bloco: ele é feito **depois** do envio do resto, e não antes. Não o confunda com o atributo `loading="lazy"` das imagens, que apenas adia o download de uma imagem enquanto ela não está visível (ver [links e imagens](/?c=langages&s=html&p=liens-et-images)): aqui, é o **cálculo de um bloco pelo servidor** que é adiado.

```
Sem adiamento (síncrono)
  tempo ->  0 ms                                  800 ms
            |---- cálculo do carrinho ------------|
                                                  | envio da página inteira
            página em branco por 800 ms ---------->  tudo aparece de uma vez

Com adiamento
  tempo ->  0 ms   1 ms                           800 ms
            |      | envio da página + espaço reservado
            |      | o visitante já lê o menu e os destaques
            |---- cálculo do carrinho ------------|
                                                  | o carrinho substitui o espaço reservado
```

Essa separação tem uma segunda consequência, ainda mais importante para o cache: a página « esqueleto » (menu, destaques, espaço reservado) é a **mesma para todos**, então pode ficar em cache. O trecho pessoal é calculado à parte, para cada visitante, e só precisa ser refeito para ele.

| Parte | Conteúdo | Cacheável? | Quem calcula |
|---|---|---|---|
| Esqueleto | Menu, destaques, espaço reservado | Sim, para todos | Uma vez, depois copiado |
| Fragmento | « Olá Jean, 3 artigos » | Não (ou por visitante) | A cada visita, só no bloco em questão |

## Três maneiras de entregar o bloco adiado

O fragmento pode chegar de três maneiras. Elas diferem pelo momento em que o cálculo começa e pelo número de requisições HTTP.

| | Síncrono (sem adiamento) | Adiado em fluxo | Adiado por uma segunda requisição |
|---|---|---|---|
| Princípio | Tudo é calculado, depois tudo é enviado | Página e espaço reservado enviados, fragmento enviado depois **na mesma resposta** | Página e espaço reservado enviados, o navegador pede o fragmento por **outra requisição** |
| Número de requisições | 1 | 1 | 2 |
| Início do cálculo lento | Antes do envio | Enquanto o navegador exibe o resto | Só quando a segunda requisição chega |
| Primeira exibição | Depois de todo o cálculo | Imediata | Imediata |
| Fragmento completo visível | Ao fim do cálculo | Ao fim do cálculo | Ao fim do cálculo, mais um ida e volta de rede |
| Esqueleto cacheável em HTTP? | Não | Não (a resposta contém o fragmento pessoal) | Sim, os bytes são idênticos para todos |
| JavaScript necessário? | Não | Sim, para encaixar o fragmento | Sim, para pedir e encaixar o fragmento |
| Ponto delicado de rede | Nenhum | Um intermediário que guarda a resposta em tampão até o fim anula o ganho | Uma requisição a mais para tratar |

O **fluxo** (em inglês *streaming*) consiste em enviar uma resposta HTTP **em pedaços**, sem esperar que ela termine: os cabeçalhos e o primeiro pedaço saem logo, os seguintes saem quando estão prontos. Os **cabeçalhos** são linhas de informação enviadas antes do conteúdo da resposta (tipo do conteúdo, data...). O HTTP sabe fazer esse fluxo com o cabeçalho `Transfer-Encoding: chunked` (« transferência em pedaços »): o tamanho total não é anunciado antecipadamente. Um caso parecido, em um script PHP, é descrito em [o streaming HTTP progressivo](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant#streaming-http-progressivo-quando-o-calculo-e-inevitavel); aqui ele serve a outro fim: entregar em dois tempos uma página cuja parte é lenta.

No fluxo, o esqueleto não é cacheável **no nível do HTTP** (a resposta completa contém o fragmento pessoal), mas a aplicação pode guardar o esqueleto em cache **por conta própria** (na memória do servidor) e calcular apenas o fragmento. Com a segunda requisição, a primeira resposta é idêntica para todos: um cache compartilhado pode guardá-la tal qual.

## A experiência: um pequeno servidor que mede

Nada vale mais que uma medição. Este servidor Node.js (o motor que executa JavaScript fora do navegador, ver [o servidor local de desenvolvimento](/?c=fondamentaux&s=bases-de-l-informatique&p=serveur-local-de-developpement)) oferece os três modos em três endereços: `/sincrono`, `/fluxo` e `/requisicao`. O « cálculo lento » é simulado por uma pausa de 800 milissegundos. Salve o código abaixo em um arquivo chamado `servidor-adiado.mjs` (a extensão `.mjs` indica ao Node que o arquivo usa `import`), em uma pasta de sua escolha.

Algumas notações do código, definidas aqui antes de lê-lo:

| Notação | Sentido | Para aprofundar |
|---|---|---|
| `async` e `await` | Esperar um resultado sem bloquear o programa | [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone) |
| `new Promise(...)` | Uma promessa: um valor que ainda não está lá, mas que chegará mais tarde | [as Promises](/?c=langages&s=javascript&p=asynchrone) |
| `(x) => ...` | Função seta, uma função escrita de forma abreviada | [as funções](/?c=langages&s=javascript&p=fonctions) |
| `/.../` | Expressão regular, um padrão de texto a encontrar | [as expressões regulares](/?c=langages&s=javascript&p=regex) |
| `process.env.PORT` | Valor da variável de ambiente `PORT`, fixado no lançamento | [as variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement) |
| `?.` e `??` | Se o dado estiver ausente, não fazer nada (`?.`) ou usar um valor de reserva (`??`) | [as condições](/?c=langages&s=javascript&p=conditions) |
| `` `...${x}...` `` | Texto no qual `${x}` é substituído pelo valor de `x` | [as strings](/?c=langages&s=javascript&p=strings) |

No código, `req` é a requisição recebida (`req.url` é o endereço pedido) e `res` a resposta a enviar. O HTML usado é descrito em [a estrutura de um documento](/?c=langages&s=html&p=structure-dun-document) : `<div>` é um bloco da página, `id` o seu nome, `style` ajustes de aparência.

```js
import { createServer } from 'node:http';         // módulo HTTP fornecido pelo Node

const PORT = Number(process.env.PORT);            // porta de escuta, convertida em número
const ATRASO_MS = 800;                            // duração do cálculo lento simulado
// charset=utf-8 : codificação dos caracteres, que permite escrever os acentos
const TIPO = { 'content-type': 'text/html; charset=utf-8' }; // a resposta é HTML
const ESPERA = 'Carregando o carrinho…';          // texto provisório do espaço reservado

// Pausa de `ms` milissegundos : uma promessa que termina após esse atraso
// (setTimeout chama a função `fim` quando o atraso passa)
const esperar = (ms) => new Promise((fim) => setTimeout(fim, ms));
// Troca < > & " ' pelo seu código HTML (&#60; para <), para que o navegador
// nunca tome um nome por HTML (charCodeAt(0) : número do caractere)
const escapar = (t) => t.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);

// O bloco lento e próprio do usuário : devolve texto puro, sem HTML
async function calcularCarrinho(nome) {
  await esperar(ATRASO_MS);                       // simula um banco de dados lento
  return `Olá ${nome}, 3 artigos no carrinho`;    // próprio desta pessoa
}

// Lê o nome no cookie « usuario » : `exec` procura o padrão, `[1]` pega
// o texto entre parênteses ; « visitante » se não houver cookie
const nomeDe = (req) =>
  /usuario=([^;]+)/.exec(req.headers.cookie ?? '')?.[1] ?? 'visitante';

const topo = '<h1>Loja</h1><p>Conteúdo idêntico para todos.</p>'; // parte comum

// O lugar do bloco lento. min-height:2em reserva uma altura de pelo menos duas vezes
// o tamanho do texto ; aria-live="polite" faz os leitores de tela anunciarem a mudança
const zona = (conteudo) =>
  `<div id="carrinho" style="min-height:2em" aria-live="polite">${conteudo}</div>`;

createServer(async (req, res) => {                // chamada a cada requisição recebida
  const nome = nomeDe(req);                       // quem pede a página
  if (req.url === '/sincrono') {                  // modo 1 : tudo é calculado antes do envio
    const carrinho = await calcularCarrinho(nome); // a página inteira espera este cálculo
    // aqui o texto é inserido em HTML : ele deve ser escapado
    res.writeHead(200, TIPO).end(topo + zona(escapar(carrinho))); // envio após 800 ms
  } else if (req.url === '/fluxo') {              // modo 2 : espaço reservado, depois fluxo
    res.writeHead(200, TIPO);                     // código 200 (OK) e cabeçalhos, antes
    res.write(topo + zona(ESPERA));               // 1º pedaço : página e espaço reservado
    const carrinho = await calcularCarrinho(nome); // o cálculo roda, a página já está lá
    // JSON.stringify põe o texto entre aspas, como um texto JavaScript ;
    // \u003c é a escrita JavaScript de < : um </script> do texto não fecha a tag
    const codigo = JSON.stringify(carrinho).replace(/</g, '\\u003c');
    // textContent põe texto puro no elemento : nenhum escape HTML a fazer
    res.end(`<script>carrinho.textContent = ${codigo}</script>`); // 2º pedaço
  } else if (req.url === '/requisicao') {         // modo 3 : preenchimento por uma requisição
    const script = "fetch('/fragmento').then((r) => r.text())" + // o navegador pede
      '.then((t) => { carrinho.textContent = t; })'; // depois o coloca no espaço
    res.writeHead(200, TIPO).end(topo + zona(ESPERA) + `<script>${script}</script>`);
  } else if (req.url === '/fragmento') {          // o bloco lento, servido à parte
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' }); // texto simples
    res.end(await calcularCarrinho(nome));        // responde após 800 ms
  } else {                                        // qualquer outro endereço
    res.writeHead(404).end();                     // não encontrado
  }
}).listen(PORT, '127.0.0.1');                     // 127.0.0.1 : escuta só esta máquina
```

Regra a reter, aplicada acima: um texto inserido **como HTML** (`/sincrono`) deve ser escapado; um texto colocado com `textContent` (`/fluxo`, `/requisicao`) não deve ser, senão o visitante veria os códigos `&#60;` no lugar do caractere.

Os comandos a seguir são digitados em um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) aberto na pasta do arquivo. Iniciamos o servidor e depois medimos com [`curl`](https://curl.se/docs/manpage.html) (um programa que envia uma requisição HTTP pelo terminal). A opção `-w` mostra durações: `time_starttransfer` é o tempo decorrido até o **primeiro byte** recebido, `time_total` o tempo até o fim. Notações do shell usadas:

| Notação | Sentido | Para aprofundar |
|---|---|---|
| `commande &` | Inicia o comando em segundo plano: o terminal continua disponível | [os processos](/?c=langages&s=bash&p=gestion-des-processus) |
| `PORT=7143 commande` | Fixa a variável `PORT` apenas para este comando | [as variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement) |
| `timeout 300 commande` | Interrompe o comando após 300 s: o servidor se encerra sozinho | [`timeout`](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout) |
| `for m in a b; do ... done` | Repete para cada valor; `$m` é o valor atual | [os laços](/?c=langages&s=bash&p=boucles) |
| `\` no fim da linha | O comando continua na linha seguinte | [os comandos básicos](/?c=langages&s=bash&p=commandes-de-base) |
| `a \| b` | O resultado de `a` vira a entrada de `b` (um *pipe*) | [redirecionamentos e pipes](/?c=langages&s=bash&p=redirections-et-pipes) |
| `grep`, `sed` | Procurar (`grep`) ou substituir (`sed`) texto | [o processamento de texto](/?c=langages&s=bash&p=traitement-de-texte) |

Passados 300 segundos, o `curl` não recebe mais resposta: execute o primeiro comando novamente.

```bash
# Inicia o servidor na porta 7143 em segundo plano ; « timeout 300 » o encerra após 300 s
PORT=7143 timeout 300 node servidor-adiado.mjs &
# Deixa um segundo para o servidor começar a escutar
sleep 1
# Para cada um dos três endereços, envia uma requisição e mostra as duas durações
for m in sincrono fluxo requisicao; do
  # -s : silencioso ; -o /dev/null : descarta o corpo ; -w : formato das durações
  curl -s -o /dev/null \
    -w "$m : primeiro byte %{time_starttransfer}s, total %{time_total}s\n" \
    "http://127.0.0.1:7143/$m"
done
```

Saída obtida (as durações variam um pouco de um teste para outro, as ordens de grandeza não):

```text
sincrono : primeiro byte 0.809237s, total 0.809291s
fluxo : primeiro byte 0.000792s, total 0.803238s
requisicao : primeiro byte 0.000685s, total 0.000709s
```

| Modo | Primeiro byte | Total | Leitura |
|---|---|---|---|
| `/sincrono` | cerca de 0,8 s | cerca de 0,8 s | Nada chega antes do fim do cálculo |
| `/fluxo` | menos de 2 ms | cerca de 0,8 s | O esqueleto chega quase instantaneamente; o fragmento chega 800 ms depois, na mesma resposta |
| `/requisicao` | menos de 2 ms | menos de 2 ms | A página está completa de imediato; o fragmento é uma segunda requisição |

Para a segunda requisição, a duração a considerar é a do endereço `/fragmento`:

```bash
# Mede a segunda requisição, aquela que o navegador envia depois de receber a página
curl -s -o /dev/null -w "fragmento : primeiro byte %{time_starttransfer}s\n" \
  http://127.0.0.1:7143/fragmento
```

```text
fragmento : primeiro byte 0.802402s
```

Nos dois modos adiados, o fragmento chega, portanto, cerca de 800 ms após a requisição do fragmento: o ganho não é calcular mais rápido, mas **exibir o resto durante esse tempo**. Para ver os dois pedaços de `/fluxo` chegarem em instantes diferentes, pedimos ao `curl` que registre cada recebimento:

```bash
# --trace-ascii - : escreve o rastro na saída ; --trace-time : acrescenta a hora
# grep só guarda as linhas « Recv data » (dados recebidos) para ver os pedaços
curl -s -o /dev/null --trace-time --trace-ascii - \
  http://127.0.0.1:7143/fluxo | grep "Recv data"
```

```text
13:01:42.839034 <= Recv data, 140 bytes (0x8c)
13:01:43.639987 <= Recv data, 83 bytes (0x53)
```

Dois pedaços (140 bytes, depois 83), separados por cerca de 0,8 s (801 ms aqui): o primeiro contém a página e o espaço reservado, o segundo o pequeno script que o preenche. Os cabeçalhos da resposta anunciam bem o envio em pedaços:

```bash
# -i : mostra os cabeçalhos da resposta antes do corpo
# sed (GNU, o de Linux) quebra a linha entre duas tags : >< vira > e <, em linhas separadas
curl -si http://127.0.0.1:7143/fluxo | sed 's/></>\n</g'
```

```text
HTTP/1.1 200 OK
content-type: text/html; charset=utf-8
Date: Sun, 01 Nov 2026 12:01:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5
Transfer-Encoding: chunked

<h1>Loja</h1>
<p>Conteúdo idêntico para todos.</p>
<div id="carrinho" style="min-height:2em" aria-live="polite">Carregando o carrinho…</div>
<script>carrinho.textContent = "Olá visitante, 3 artigos no carrinho"</script>
```

Resta a prova de que o esqueleto de `/requisicao` é o mesmo para todos. `md5sum` calcula uma impressão digital de um conteúdo: dois conteúdos idênticos dão a mesma impressão, dois conteúdos diferentes dão (quase certamente) duas impressões diferentes. A opção `-b` do `curl` envia um cookie.

```bash
# Página de /requisicao pedida por Jean, depois por Maria ; md5sum dá a impressão de cada uma
curl -s -b usuario=Jean http://127.0.0.1:7143/requisicao | md5sum
curl -s -b usuario=Maria http://127.0.0.1:7143/requisicao | md5sum
# Mesma comparação para a página síncrona, que contém o carrinho
curl -s -b usuario=Jean http://127.0.0.1:7143/sincrono | md5sum
curl -s -b usuario=Maria http://127.0.0.1:7143/sincrono | md5sum
```

```text
e1b1ec69ced473496b0c29b1b5fca2c3  -
e1b1ec69ced473496b0c29b1b5fca2c3  -
c905e5b30a9f6b017a369792388ee26b  -
0a71dab1785f304b7a1305ad161e3943  -
```

| Página pedida | Jean | Maria | Conclusão |
|---|---|---|---|
| `/requisicao` | `e1b1ec69...` | `e1b1ec69...` | Idêntica: um cache compartilhado pode servi-la a todos |
| `/sincrono` | `c905e5b3...` | `0a71dab1...` | Diferente: impossível compartilhar |

Por fim, o fragmento é de fato próprio de cada visitante. `echo` exibe uma quebra de linha, para que as saídas não se colem. O cookie armadilhado `<b>x` contém uma tag HTML; o texto puro do fragmento a mantém como está, pois `textContent` nunca a interpreta:

```bash
# Fragmento para Jean
curl -s -b usuario=Jean http://127.0.0.1:7143/fragmento; echo
# Fragmento para um cookie que contém HTML : texto puro, sem escapar
curl -s -b 'usuario=<b>x' http://127.0.0.1:7143/fragmento; echo
```

```text
Olá Jean, 3 artigos no carrinho
Olá <b>x, 3 artigos no carrinho
```

Na página síncrona, ao contrário, o texto é inserido como HTML: é aí que `escapar` neutraliza o nome armadilhado (falha descrita em [o XSS](/?c=securite&s=cybersecurite&p=xss-en-detail)). No modo em fluxo, um `</script>` no nome é escrito `\u003c/script>` para não fechar a tag:

```bash
# Página síncrona com o cookie armadilhado : `<` vira &#60;
curl -s -b 'usuario=<b>x' http://127.0.0.1:7143/sincrono | fold -s -w 90; echo
# Modo fluxo, cookie com </script> ; tail -c 120 guarda os últimos 120 caracteres ;
# fold -s -w 90 quebra a saída em linhas de no máximo 90 caracteres (só para exibição)
curl -s -b 'usuario=</script>x' http://127.0.0.1:7143/fluxo \
  | tail -c 120 | fold -s -w 90; echo
```

```text
<h1>Loja</h1><p>Conteúdo idêntico para todos.</p><div id="carrinho"
style="min-height:2em" aria-live="polite">Olá &#60;b&#62;x, 3 artigos no carrinho</div>
ite">Carregando o carrinho…</div><script>carrinho.textContent = "Olá \u003c/script>x,
3 artigos no carrinho"</script>
```

Essas medições valem para um servidor local, sem rede real; com uma rede de verdade, cada ida e volta acrescenta a sua própria latência (ver [limitar as idas e vindas](/?c=qualite-performance-et-outils&s=performance&p=limiter-les-aller-retours)). Elas medem a chegada dos bytes, não a exibição: para ver a página se preencher, abra `http://127.0.0.1:7143/fluxo` em um navegador ([o DOM](/?c=langages&s=javascript&p=dom-et-evenements) explica como o script modifica a página).

## Por que isso parece sobreposição

Enquanto o servidor calcula o carrinho (800 ms), o navegador não fica bloqueado: ele exibe o esqueleto. É a aplicação, na escala de uma página, da ideia da [sobreposição de latência](/?c=qualite-performance-et-outils&s=performance&p=recouvrement-de-latence): fazer avançar tarefas independentes em vez de esperar primeiro pela mais lenta. E é o inverso do tempo morto descrito em [esperar sem perder tempo](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts): a espera continua existindo, mas não atrasa mais nada.

| Capítulo | Mesma ideia | Aqui |
|---|---|---|
| [Sobreposição de latência](/?c=qualite-performance-et-outils&s=performance&p=recouvrement-de-latence) | Fazer outra coisa durante uma espera | Exibir o esqueleto durante o cálculo do carrinho |
| [Esperar sem perder tempo](/?c=qualite-performance-et-outils&s=performance&p=attentes-et-temps-morts) | Não bloquear pelo que ainda não está pronto | Não bloquear a página inteira por causa de um bloco |
| [Evitar o recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant) | Não refazer o que não mudou | Guardar o esqueleto em cache, recalcular só o fragmento |

## A armadilha do deslocamento de layout

Se o espaço reservado está **vazio** ou é menor que o conteúdo final, tudo o que fica abaixo é **empurrado para baixo** no momento do preenchimento: o visitante que lia ou ia clicar vê o texto se mexer diante dos olhos. Chama-se **deslocamento de layout** (em inglês *layout shift*). O mesmo problema existe com as imagens, daí os atributos `width` e `height` descritos em [links e imagens](/?c=langages&s=html&p=liens-et-images).

```html
<!-- Espaço reservado: sua altura é fixada antes da chegada do conteúdo -->
<div id="carrinho" style="min-height: 2em">   <!-- pelo menos 2 vezes o tamanho do texto -->
  Carregando o carrinho…                      <!-- texto provisório -->
</div>
<!-- O conteúdo seguinte não se mexe, enquanto o carrinho couber em 2em -->
<p>Rodapé</p>
```

| Situação | Efeito | Remédio |
|---|---|---|
| Espaço reservado vazio (altura 0) | Todo o conteúdo seguinte pula para baixo | Reservar uma altura mínima |
| Altura reservada grande demais | Um grande vazio inútil, depois um salto para cima | Medir o tamanho médio real do conteúdo |
| Conteúdo final de tamanho variável (lista) | Salto conforme o número de elementos | Reservar o tamanho do caso comum, ou uma moldura de tamanho fixo com rolagem |
| Texto provisório mais curto que o final | Uma linha a mais no preenchimento | Escrever o provisório na mesma largura e altura |
| Bloco que desaparece quando vazio | A página sobe | Manter o espaço, ou adiar só os blocos sempre presentes |

A unidade `em` (aqui `2em`: duas vezes o tamanho do texto) e as outras unidades de tamanho são explicadas em [as unidades e funções de tamanho CSS](/?c=langages&s=css&p=unites-et-fonctions-de-taille), e a maneira como um elemento ocupa espaço em [o modelo de caixa](/?c=langages&s=css&p=box-model).

## A acessibilidade: anunciar o que está chegando

Um leitor de tela (um programa que lê a página em voz alta para pessoas cegas ou com baixa visão) lê apenas um lugar por vez. Um conteúdo que aparece em outro lugar, fora daquele que ele lê, passa **despercebido**. É preciso, então, declarar o espaço reservado como uma **região live** (`aria-live`): uma zona cujas mudanças são anunciadas sem mover o foco. O mecanismo é detalhado em [ARIA dinâmico e foco pelo teclado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier).

```html
<!-- aria-live="polite" : anuncia a mudança quando o leitor terminar de falar -->
<div id="carrinho" aria-live="polite" style="min-height: 2em">
  Carregando o carrinho…
</div>
```

| Ponto de atenção | Por quê | Prática |
|---|---|---|
| A região existe **antes** da mudança | Um leitor de tela vigia uma zona já presente, não uma zona que aparece junto com o seu conteúdo | Enviar a região com o espaço reservado, preenchê-la depois |
| `polite` em vez de `assertive` | `assertive` interrompe na hora o que o leitor estava dizendo; `polite` espera o fim da frase | Reservar `assertive` para alertas urgentes |
| Não mover o foco | O usuário perderia sua posição na página | Deixar o foco onde está |
| Texto provisório claro | « Carregando o carrinho… » diz o que acontece | Evitar um vazio ou um simples símbolo |
| Sem JavaScript | O fragmento nunca chega | Prever um recurso alternativo, por exemplo um link para a página do carrinho dentro de um `<noscript>`, tag cujo conteúdo só aparece se o JavaScript estiver desativado ([MDN](https://developer.mozilla.org/pt-BR/docs/Web/HTML/Element/noscript)) |

O HTML acima é o que produz o servidor da experiência. O anúncio em si depende do leitor de tela e do navegador usados: teste com os de seus visitantes.

## O bloco como plugin

Em um software construído em torno de blocos, cada bloco costuma ser uma [classe](/?c=langages&s=php&p=poo) (um modelo de objeto, aqui em PHP) independente que a aplicação encontra sozinha: um **plugin**. O detalhe do mecanismo (declarar, descobrir, instanciar) está em [a arquitetura por plugins](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=architecture-a-plugins). O que importa aqui:

| Papel | O que faz o plugin do bloco | Relação com o adiamento |
|---|---|---|
| Declaração | Dá um identificador e um nome ao bloco | O sistema sabe qual bloco colocar onde |
| Construção | Um método devolve a descrição da exibição | É aqui que se decide calcular logo ou **anunciar** um cálculo adiado |
| Independência | O bloco não depende dos outros | Um bloco lento pode ser adiado sem tocar nos outros |

Um bloco só se diferencia do vizinho pela forma como constrói o seu conteúdo: o bloco de menu devolve o seu conteúdo, o bloco do carrinho devolve **a promessa de calculá-lo depois** (uma descrição do que será calculado, como uma [Promise](/?c=langages&s=javascript&p=asynchrone) em JavaScript).

## Um exemplo no Drupal: lazy builder e BigPipe

> **Esta seção é um exemplo de um software específico.** O Drupal serve de ilustração; a ideia do capítulo não depende dele. Os nomes de API abaixo vêm da documentação oficial do Drupal ([arrays de renderização e lazy builders](https://api.drupal.org/api/drupal/core%21core.api.php/group/theme_render/), [placeholders automáticos e BigPipe](https://www.drupal.org/docs/drupal-apis/render-api/auto-placeholdering)). Eles são verificados no código-fonte do Drupal 11.x.

O Drupal descreve o que deve ser exibido sob a forma de **arrays de renderização** (em inglês *render arrays*): arrays [PHP](/?c=langages&s=php&p=php) cujas chaves começando por `#` são instruções. Para adiar um bloco, um desses arrays declara um **lazy builder** (« construtor preguiçoso »): em vez do conteúdo, ele designa a função que o calculará depois. O sistema então substitui o trecho por um espaço reservado. Essa substituição só ocorre em uma requisição cacheável (uma leitura da página, `GET`, e não o envio de um formulário, `POST`): `#create_placeholder => TRUE` não força nada em um `POST`.

Notações PHP dos exemplos (ver [a programação orientada a objetos em PHP](/?c=langages&s=php&p=poo)): `namespace` dá à classe seu « endereço » lógico, `use` importa uma classe de outro namespace, `class A extends B` cria uma classe `A` que herda tudo o que `B` faz, `implements` declara que uma classe respeita um contrato (uma *interface*), `public static function f(): array` é um método acessível de fora, chamável sem criar objeto (`static`), que devolve um array (`: array`), `new X(...)` cria um objeto, `string $quantidade` declara um parâmetro de texto cujo valor `$quantidade` insere em um texto entre aspas, `<?php` abre o código PHP, `TRUE` é o booleano « verdadeiro » e `#[Block(...)]` é um **atributo**, uma etiqueta de declaração que o Drupal lê para reconhecer o plugin.

```php
<?php

namespace Drupal\loja\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\StringTranslation\TranslatableMarkup;

// Declara o plugin : um identificador e um nome legível para a administração
#[Block(id: 'loja_carrinho', admin_label: new TranslatableMarkup('Carrinho'))]
class CarrinhoBlock extends BlockBase {

  // Constrói o bloco : devolve um « array de renderização » (a descrição da exibição)
  public function build(): array {
    return [
      // Em vez de calcular aqui, designa a função que calculará depois
      '#lazy_builder' => ['loja.carrinho_builder:construir', ['3']],
      // Pede um espaço reservado no lugar deste trecho (requisição cacheável)
      '#create_placeholder' => TRUE,
    ];
  }
}
```

O primeiro elemento de `#lazy_builder` é o nome do **serviço** (um objeto compartilhado que o sistema sabe construir, ver [o contêiner de serviços](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=conteneur-de-services)), dois-pontos, depois o método. O segundo é a lista dos argumentos, que devem permanecer simples (texto, número, booleano) segundo a [documentação](https://api.drupal.org/api/drupal/core%21core.api.php/group/theme_render/), para que o sistema possa memorizá-los sem guardar objetos.

```php
<?php

namespace Drupal\loja;

use Drupal\Core\Security\TrustedCallbackInterface;

// O serviço que calcula o trecho lento, chamado depois pelo Drupal
class CarrinhoBuilder implements TrustedCallbackInterface {

  // Recebe os argumentos dados em '#lazy_builder' (aqui o texto « 3 »)
  public function construir(string $quantidade): array {
    // Devolve o array de renderização final que substituirá o espaço reservado
    return ['#markup' => "Carrinho: $quantidade artigos"];
  }

  // Lista os métodos que o Drupal tem o direito de chamar assim
  public static function trustedCallbacks(): array {
    return ['construir'];
  }
}
```

A interface `TrustedCallbackInterface` e o seu método `trustedCallbacks()` permitem que o Drupal chame `construir`. A partir do Drupal 11.5, o atributo `#[TrustedCallback]`, aplicado ao método `construir`, é uma alternativa a essa interface.

O serviço se declara em um arquivo [YAML](https://yaml.org/spec/1.2.2/) (um formato de configuração em texto, em que a indentação expressa o aninhamento), chamado `loja.services.yml` e colocado na raiz do módulo `loja`, ao lado do arquivo `loja.info.yml` que declara o próprio módulo:

```yaml
services:
  # Nome do serviço, o escrito antes dos dois-pontos em '#lazy_builder'
  loja.carrinho_builder:
    # Classe PHP que será instanciada para este serviço
    class: Drupal\loja\CarrinhoBuilder
```

O módulo **BigPipe** ([documentação](https://www.drupal.org/docs/drupal-apis/render-api/auto-placeholdering)), incluído no Drupal, cuida em seguida da entrega: ele envia primeiro a página com os espaços reservados, depois os fragmentos à medida que são calculados, na mesma resposta. É o modo « adiado em fluxo » da tabela comparativa, que reproduzimos em miniatura com `/fluxo`.

| Elemento | O que é | Equivalente na experiência |
|---|---|---|
| `#lazy_builder` | Designa a função que calculará o conteúdo depois | `calcularCarrinho` |
| `#create_placeholder` | Pede um espaço reservado | `zona(ESPERA)` |
| Serviço `loja.carrinho_builder` | Objeto que detém o método chamado | A função `calcularCarrinho` |
| BigPipe | Envia os fragmentos em fluxo na mesma resposta | `res.write` depois `res.end` de `/fluxo` |
| Array de renderização | Descrição da exibição | O HTML enviado |

## O que adiar, e quando

Adiar tem um custo: uma página em vários tempos é mais complexa, e o espaço reservado pode atrapalhar se o conteúdo for essencial. A tabela ajuda a escolher.

| Bloco | Adiar? | Motivo |
|---|---|---|
| Menu, rodapé | Não | Rápidos e idênticos para todos: cache comum |
| Texto principal do artigo | Não | É o motivo da visita, precisa estar lá desde o início |
| Carrinho, nome do visitante, notificações | Sim | Pessoais, impedem o cache da página |
| Recomendações calculadas na hora | Sim | Lentas, secundárias |
| Conteúdo rápido (alguns milissegundos) | Não | O ganho não vale a complexidade |
| Bloco que o visitante talvez nunca veja (rodapé da página) | Sim, e disparado pela rolagem | Melhor não calcular se nunca for visto |

Antes de adiar, **meça**: ver [medir antes de otimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser). Um bloco que se supõe lento pode não o ser, e o tempo total não diminuiu: o que cai é o tempo até a primeira exibição.

## As armadilhas

Um **proxy** é um servidor colocado entre o visitante e o site; um [balanceador de carga](/?c=infrastructure-devops&s=conception-a-grande-echelle&p=autoscaling-et-repartition-de-charge) é uma espécie dele. Um **tampão** (*buffer*) é uma memória em que se guardam dados antes de transmiti-los.

| Armadilha | Consequência | Remédio |
|---|---|---|
| Adiar um bloco rápido | Complexidade e deslocamento de layout por um ganho nulo | Medir antes, adiar apenas o lento ou o pessoal |
| Espaço reservado sem tamanho | O conteúdo seguinte pula no preenchimento | Reservar uma altura mínima |
| Fragmento pessoal numa página em cache compartilhado | Maria vê os dados do Jean | Pôr o pessoal no fragmento, nunca no esqueleto |
| Intermediário que guarda a resposta em tampão até o fim | O fluxo só chega no fim, e o ganho desaparece | Verificar toda a cadeia, medir o primeiro byte de ponta a ponta |
| Inserir o fragmento como HTML sem escapar | Falha XSS | Inserir com `textContent` (sem escapar); se o texto entrar em HTML, escapá-lo |
| `</script>` no texto do fragmento | O navegador fecha o script cedo demais | Trocar `<` por `\u003c` no texto do script, como `replace(/</g, '\\u003c')` na experiência: `\u003c` é a escrita JavaScript do caractere `<`, que não fecha mais a tag |
| Fragmento que falha ou demora demais | O espaço fica em « Carregando… » para sempre | Prever um tempo limite e uma mensagem alternativa |
| Depender de JavaScript sem recurso alternativo | O fragmento fica ausente para quem o desativou | `<noscript>` (ver acima) com um link para a página correspondente |
| Muitos blocos adiados que pedem cada um uma requisição | As idas e vindas se acumulam | Agrupar em uma resposta em fluxo, ou em uma só requisição |
| Fragmento anunciado em loop para os leitores de tela | Enxurrada de anúncios | Uma região `polite`, uma mudança única |

## Boas práticas

| Prática | Por quê |
|---|---|
| Separar o que é comum do que é pessoal | O comum se guarda em cache, o pessoal se calcula à parte |
| Medir o primeiro byte antes e depois | A medição prova o ganho (`curl -w`) |
| Reservar o tamanho do espaço | Evita o deslocamento de layout |
| Declarar a zona como região `aria-live="polite"` desde o envio | O conteúdo que chega é anunciado |
| Escapar todo texto próprio do usuário antes de inseri-lo como HTML (ou usar `textContent`) | Evita as falhas XSS |
| Escolher o modo conforme a necessidade | Fluxo se o esqueleto fica na resposta, segunda requisição se quisermos o cache compartilhado |
| Prever a falha e o tempo limite | Um fragmento que não chega não bloqueia a página |
| Guardar o código de um bloco em um plugin separado | Um bloco lento pode mudar de modo sem tocar nos outros |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um bloco lento ou próprio do visitante impede de colocar a página inteira em cache e atrasa a sua exibição. Envia-se primeiro o esqueleto com um **espaço reservado**, depois preenche-se o espaço com o **fragmento** calculado à parte: na mesma resposta (fluxo) ou por uma segunda requisição. O esqueleto passa a ser cacheável, e o tempo até o primeiro byte cai de cerca de 0,8 s para alguns milissegundos na experiência, enquanto o fragmento continua chegando 800 ms depois. O ganho está na exibição do resto durante a espera, não num cálculo mais rápido. |
| **Armadilhas a evitar** | Adiar um bloco rápido; esquecer de reservar o tamanho do espaço (deslocamento de layout); pôr o fragmento pessoal numa página compartilhada; deixar um intermediário guardar o fluxo em tampão; inserir texto não escapado; não prever nada quando o fragmento falha ou quando o JavaScript está ausente; esquecer a região `aria-live`. |
| **Boas práticas** | Medir primeiro (`curl -w`, primeiro byte); adiar só o lento ou o pessoal; reservar uma altura mínima; declarar uma região `aria-live="polite"` desde o envio; escapar o texto; prever um tempo limite e um recurso alternativo; guardar cada bloco no seu plugin para mudar de modo sem tocar nos outros. |
