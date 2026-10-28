---
order: 22
---

# As APIs de página do navegador: tema, rolagem, visibilidade e cancelamento (28/10/2026)

O **navegador** é o programa que exibe as páginas web (Chrome, Firefox, Safari...). Uma **API** (*Application Programming Interface*, "interface de programação") é um conjunto de funções e objetos que ele coloca à disposição do código JavaScript para permitir que ele aja sobre a página ou leia o estado do aparelho. Este capítulo apresenta quatro dessas APIs, que servem para controlar uma página:

| API | O que ela permite | Seção |
|---|---|---|
| `matchMedia` | Saber, a partir do JavaScript, se uma condição de tela ou de configuração é verdadeira (janela estreita, tema escuro...) | [matchMedia](#matchmedia-ler-uma-media-query-a-partir-do-javascript) |
| `scrollIntoView` | Rolar a página até um elemento | [scrollIntoView](#scrollintoview-rolar-ate-um-elemento) |
| `visibilitychange` | Saber se o usuário está olhando a página ou se a deixou de lado (aba oculta) | [visibilitychange](#visibilitychange-saber-se-a-pagina-esta-sendo-vista) |
| `AbortController` | Cancelar uma operação em andamento (requisição de rede, ouvintes de eventos) | [AbortController](#abortcontroller-cancelar-o-que-esta-em-andamento) |

Um **evento** é um sinal que o navegador envia quando algo acontece (um clique, um redimensionamento da janela, uma troca de aba); um **ouvinte** é a função que se liga a um evento para que ela seja executada a cada vez. Este capítulo pressupõe conhecidos [o DOM e os eventos](/?c=langages&s=javascript&p=dom-et-evenements) (a página vista como uma árvore de objetos que o JavaScript manipula), [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as funções](/?c=langages&s=javascript&p=fonctions) (inclusive as funções de seta `() => { ... }`), [as condições](/?c=langages&s=javascript&p=conditions), [os laços](/?c=langages&s=javascript&p=boucles) e [os objetos](/?c=langages&s=javascript&p=objets) (a notação `{ nome: valor }`).

A maioria dessas APIs está disponível em todos os navegadores atuais (28/10/2026): a seção de cada API indica os raros pontos que pedem cuidado.

## `matchMedia`: ler uma media query a partir do JavaScript

Uma **media query** (*consulta de mídia*) é uma condição escrita em CSS com `@media`, que só aplica estilos se a tela ou as configurações do usuário corresponderem: largura da janela, tema escuro, dispositivo sensível ao toque... Ela é explicada no [capítulo sobre o responsivo](/?c=langages&s=css&p=responsive-et-media-queries). O CSS reage sozinho, mas um script às vezes precisa conhecer a resposta por conta própria (parar uma animação, carregar um conteúdo mais leve). A função `window.matchMedia(consulta)` a fornece. No exemplo abaixo, `(max-width: 600px)` significa "a largura da janela é de no máximo 600 pixels" (um **pixel** é o menor ponto de uma tela). `window` é o objeto que representa a janela da aba: suas funções podem ser escritas com ou sem `window.` na frente.

```javascript
// matchMedia recebe uma media query em forma de texto e retorna um objeto MediaQueryList
const consulta = window.matchMedia("(max-width: 600px)");

// matches vale true (verdadeiro) se a condição vale agora, false (falso) caso contrário
if (consulta.matches) {
    // console.log escreve uma mensagem no console das ferramentas de desenvolvimento (F12)
    console.log("Janela estreita: 600 pixels de largura ou menos");
} else {
    console.log("Janela larga: mais de 600 pixels");
}

console.log(consulta.media);    // "(max-width: 600px)": a consulta, como foi lida
```

O objeto retornado, um **`MediaQueryList`**, contém:

| Elemento | Natureza | Papel |
|---|---|---|
| `.matches` | Booleano (`true` ou `false`) | Verdadeiro se a condição é verificada **neste momento**; o valor continua atualizado, ler `consulta.matches` depois dá a resposta atual |
| `.media` | Texto | A consulta tal como o navegador a entendeu |
| `addEventListener("change", funcao)` | Função | Chama `funcao` sempre que `.matches` **muda** de valor |
| `removeEventListener("change", funcao)` | Função | Retira um ouvinte colocado com `addEventListener` (ver [a seção sobre o cancelamento](#remover-varios-ouvintes-de-uma-vez)) |

### As consultas úteis

| Consulta | Verdadeira quando | Uso típico |
|---|---|---|
| `(max-width: 600px)` | A janela tem 600 pixels de largura ou menos | Escolher uma versão "celular" de um componente (um bloco da interface, como um menu ou uma galeria) |
| `(min-width: 601px)` | A janela tem mais de 600 pixels de largura | O contrário da anterior |
| `(orientation: portrait)` | A janela é mais alta do que larga | Adaptar uma galeria ou um jogo |
| `(prefers-reduced-motion: reduce)` | O usuário pediu ao sistema para **reduzir as animações** | Não iniciar animação, ver [o capítulo sobre o SVG](/?c=langages&s=html&p=svg-dans-la-page) para um exemplo completo |
| `(prefers-color-scheme: dark)` | O usuário escolheu o **tema escuro** em seu sistema | Aplicar cores escuras |
| `(hover: hover)` | O dispositivo principal (mouse, touchpad) pode **passar por cima** de um elemento; falso numa tela sensível ao toque, em que só se pode tocar | Só exibir uma dica ao passar o mouse se essa possibilidade existir |

Várias condições se combinam com `and`: `"(max-width: 600px) and (orientation: portrait)"` é verdadeira quando as duas são. As mesmas consultas se usam tal e qual em `@media` no CSS; o [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) lista todas as condições possíveis, e a página sobre [`hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/hover) detalha a passagem do mouse.

### Ler uma vez ou escutar as mudanças

Ler `.matches` uma única vez dá o estado **naquele instante**. Ora, o usuário pode mudar de ideia enquanto a página está aberta: redimensionar a janela, girar o celular, alternar o sistema para o tema escuro. O evento `change` avisa o script a cada alternância.

```javascript
// Objeto da condição "tema escuro escolhido no sistema"
const escuro = window.matchMedia("(prefers-color-scheme: dark)");

function aplicarTema(estaEscuro) {
    // document.documentElement é a etiqueta <html>; toggle(nome, condicao) adiciona a
    // classe se a condição for verdadeira, retira-a caso contrário
    document.documentElement.classList.toggle("tema-escuro", estaEscuro);
}

aplicarTema(escuro.matches);        // estado no carregamento (change não dispara aí)

// A cada alternância do sistema, o navegador chama esta função (objeto "evento")
escuro.addEventListener("change", (evento) => {
    aplicarTema(evento.matches); // o novo valor da condição
});
```

```css
:root {
    --fundo: #ffffff;                  /* variáveis CSS: cores do tema claro */
    --texto: #1a1a1a;
}

.tema-escuro {
    --fundo: #121212;                  /* a classe colocada substitui os valores */
    --texto: #f0f0f0;
}

body {
    background: var(--fundo);          /* var(--nome) lê a variável */
    color: var(--texto);
}
```

As [variáveis CSS](/?c=langages&s=css&p=variables-et-cascade) evitam reescrever todas as cores: o script só coloca ou retira uma [classe](/?c=langages&s=css&p=selecteurs) (uma etiqueta colocada num elemento, que o CSS sabe mirar) na `<html>`, a [etiqueta](/?c=langages&s=html&p=structure-dun-document) que contém a página inteira.

| | Ler uma vez | Escutar as mudanças |
|---|---|---|
| Escrita | `window.matchMedia(q).matches` | `addEventListener("change", funcao)` |
| Útil quando | Uma decisão se toma num instante preciso: no clique, no início de uma animação | A interface deve acompanhar a configuração em tempo real: tema, disposição |
| Dispara | Nunca sozinho: a leitura é feita no momento desejado | Somente quando a resposta **muda** (não a cada pixel do redimensionamento), e nunca no carregamento |

### O CSS ou o JavaScript?

| Necessidade | Melhor ferramenta | Por quê |
|---|---|---|
| Mudar cores, tamanhos, disposição conforme a largura ou o tema | **`@media` em CSS** | Nenhum script a escrever, nenhuma latência, e funciona mesmo se o script falhar |
| Escolher qual conteúdo carregar (uma imagem pesada só em tela grande) | `matchMedia` | O CSS não pode decidir o que baixar por script |
| Iniciar, parar ou desacelerar uma animação feita em JavaScript | `matchMedia` | O CSS não tem controle sobre um laço JavaScript |
| Memorizar uma escolha de tema do usuário | `matchMedia` + [armazenamento no navegador](/?c=langages&s=javascript&p=dom-et-evenements) | A escolha explícita prevalece sobre a configuração do sistema |

### As armadilhas de `matchMedia`

A antiga forma `addListener` está **obsoleta**: encontra-se em tutoriais antigos, mas `addEventListener("change", ...)` a substitui.

```javascript
const consulta = window.matchMedia("(max-width: 600px)");
function aoMudar(evento) { console.log(evento.matches); }

consulta.addListener(aoMudar);                 // OBSOLETO: não escrever mais
consulta.addEventListener("change", aoMudar);  // escrever no lugar
```

A outra falha frequente é **medir a janela em loop** para adivinhar se ela é estreita. `setInterval(funcao, atraso)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)) é um **temporizador**: ele chama a função de novo a intervalos regulares, aqui a cada 16 milissegundos (um milissegundo é a milésima parte de um segundo).

```javascript
// RUIM: consulta a largura 60 vezes por segundo, mesmo quando nada muda
setInterval(() => {
    // window.innerWidth: a largura da janela, em pixels
    if (window.innerWidth <= 600) {
        console.log("estreito");
    }
}, 16);                                             // 16 milissegundos entre duas medições
```

Esse laço faz o navegador trabalhar à toa e consome bateria. `matchMedia` avisa somente quando a resposta **muda**. Para acompanhar o tamanho preciso de um elemento, `ResizeObserver` (ver [os observadores](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) é a ferramenta prevista; o evento `resize` da janela, por sua vez, dispara dezenas de vezes por segundo e se limita com um **debounce** (agir somente após uma pausa na série de eventos, ver o mesmo capítulo).

Duas sutilezas merecem atenção. De um lado, uma consulta **mal escrita** não gera erro: `window.matchMedia("max-width 600")` (sem parênteses) retorna um objeto cujo `.matches` vale simplesmente `false`, e um teste que falha em silêncio é difícil de notar. De outro lado, `.matches` reflete a condição no instante da leitura, mas só o evento `change` avisa de uma mudança: ler `.matches` uma vez na inicialização e nunca mais voltar a ele deixa a interface desatualizada assim que o usuário muda uma configuração.

## `scrollIntoView`: rolar até um elemento

A **rolagem** (*scroll*) é o deslocamento do conteúdo quando se gira a roda do mouse ou se arrasta o dedo. `elemento.scrollIntoView()` pede ao navegador que role a página (e todos os contêineres que a contêm) até que o elemento fique visível. O nome quer dizer "rolar para trazer à vista".

```html
<!-- Um botão, e mais abaixo o título de id "precos" (identificador único) -->
<button id="ir-precos">Ver os preços</button>
<h2 id="precos">Preços</h2>
```

```javascript
const botao = document.getElementById("ir-precos");   // o botão, encontrado pelo seu id
const titulo = document.getElementById("precos");     // o elemento a alcançar

botao.addEventListener("click", () => {               // no clique no botão...
    // ... rolar suavemente até o título, que ficará colado no topo da área visível
    titulo.scrollIntoView({ behavior: "smooth", block: "start" });
});
```

O argumento é um **objeto de opções**: vários ajustes nomeados escritos entre chaves. Todos são facultativos.

| Opção | Valores possíveis | Valor padrão | Efeito |
|---|---|---|---|
| `behavior` | `"auto"`, `"smooth"` | `"auto"` | `"auto"` segue a propriedade CSS `scroll-behavior` da página (um salto imediato se nada estiver ajustado). `"smooth"` anima a rolagem |
| `block` | `"start"`, `"center"`, `"end"`, `"nearest"` | `"start"` | Onde colocar o elemento **verticalmente** na área visível (numa página escrita da esquerda para a direita) |
| `inline` | `"start"`, `"center"`, `"end"`, `"nearest"` | `"nearest"` | Onde colocá-lo **horizontalmente** |

`"nearest"` significa "o mais próximo": o navegador rola o mínimo possível e não se move nada se o elemento já estiver totalmente visível. O esquema a seguir mostra a área visível (a moldura) depois de uma rolagem para três valores de `block`:

```
  block: "start"        block: "center"       block: "end"
  +-------------+       +-------------+       +-------------+
  | [elemento]  |       |             |       |             |
  |             |       | [elemento]  |       |             |
  |             |       |             |       | [elemento]  |
  +-------------+       +-------------+       +-------------+
  topo da vista         meio da vista         base da vista
```

### Compensar um cabeçalho fixo com `scroll-margin-top`

Um **cabeçalho fixo** é uma barra que permanece colada no topo da janela durante a rolagem (ver [o posicionamento CSS](/?c=langages&s=css&p=positionnement)). Com `block: "start"`, o elemento alcançado fica exatamente no topo da área visível, portanto **escondido atrás** dessa barra. O CSS corrige isso com `scroll-margin-top`, uma margem de rolagem: uma distância que o navegador mantém entre o topo da vista e o elemento a alcançar ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-margin-top)).

```css
.cabecalho {
    position: sticky;                  /* permanece colado no topo durante a rolagem */
    top: 0;                            /* colado a 0 pixel do topo da janela */
    height: 64px;                      /* altura da barra */
}

h2[id] {
    scroll-margin-top: 80px;           /* 80 pixels livres acima de todo h2 com id */
}
```

Essa margem também se aplica aos links de âncora `<a href="#precos">`: um único ajuste em CSS corrige os dois. Seu equivalente aplicado ao contêiner que rola (muitas vezes `html`) é `scroll-padding-top` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding-top)).

### Respeitar `prefers-reduced-motion`

A rolagem animada pode causar tontura em certas pessoas (ver [`prefers-reduced-motion`](/?c=langages&s=css&p=animations-css-performantes)). Portanto, **nunca forçar `smooth`**: lê-se a configuração do usuário e escolhe-se o comportamento de acordo.

```javascript
function comportamentoDeRolagem() {
    // Verdadeiro se o usuário pediu para reduzir as animações no sistema
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduzido ? "auto" : "smooth";    // condição ? se_verdadeiro : se_falso
}

function ir(elemento) {
    elemento.scrollIntoView({ behavior: comportamentoDeRolagem(), block: "start" });
}
```

A rolagem suave também pode ser ajustada uma vez por todas para a página, em CSS, na mesma condição:

```css
@media (prefers-reduced-motion: no-preference) {
    html {
        scroll-behavior: smooth;       /* todas as rolagens se tornam suaves */
    }
}
```

Com essa regra, `behavior: "auto"` (o valor padrão) basta em JavaScript: o navegador aplica o valor do CSS.

### `scrollIntoView`, `scrollTo`, a âncora e `focus()`

Quatro ferramentas dão a impressão de fazer "a mesma coisa", mas não se empregam do mesmo jeito:

| Ferramenta | O que se lhe dá | Muda a URL? | Move o foco? | Quando usar |
|---|---|---|---|---|
| `elemento.scrollIntoView(opcoes)` | Um elemento | Não | Não | Trazer um elemento para a vista a partir de um script |
| `window.scrollTo({ top, behavior })` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo)) | Uma posição em pixels a partir do topo da página | Não | Não | Voltar ao topo (`top: 0`), ou ir a uma posição que se calculou |
| Link de âncora `<a href="#precos">` | O `id` do elemento, no endereço | Sim: acrescenta `#precos` e uma entrada no histórico (a lista que o botão Voltar percorre) | Somente se o alvo puder receber o foco; senão, o próximo toque em Tab recomeça a partir do alvo | Um link de navegação que deve ser compartilhável e funcionar sem JavaScript |
| `elemento.focus()` | Um elemento que pode receber o foco | Não | Sim | Tornar uma área utilizável pelo teclado (ver [o foco pelo teclado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)) |

O **foco** designa o elemento que recebe as teclas do teclado. `scrollIntoView` não o move: uma pessoa que navega pelo teclado ou por um leitor de tela (um programa que lê a página em voz alta) não saberia que foi levada para outro lugar. Para uma navegação de verdade, combinam-se então os dois. Chamar `focus()` também rola a página até o elemento, de uma só vez; a opção `preventScroll: true` suprime essa rolagem, para que só o `scrollIntoView` atue:

```javascript
// <h2 id="precos" tabindex="-1"> : tabindex="-1" permite o foco somente por script
const titulo = document.getElementById("precos");

titulo.scrollIntoView({ behavior: comportamentoDeRolagem() });   // rolagem (animada ou não)
titulo.focus({ preventScroll: true });   // foco sem segunda rolagem concorrente
```

`tabindex="-1"` é necessário porque um título não é um elemento que recebe o foco por si mesmo, ao contrário de um link ou de um campo de formulário: o atributo é explicado com o foco pelo teclado ([capítulo dedicado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). A documentação de `focus()` está no [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus).

### As armadilhas de `scrollIntoView`

**Um contêiner com rolagem aninhada.** Uma lista de mensagens de altura fixa, com sua própria barra de rolagem, é um contêiner com rolagem: `scrollIntoView` rola a lista, **mas também a página inteira** se for preciso, o que pode fazer a página saltar de forma inesperada. Dois remédios:

```javascript
const lista = document.getElementById("lista-mensagens");   // o contêiner que tem sua barra
const ultimo = lista.lastElementChild;     // seu último filho: a última mensagem

// Remédio 1: nearest rola o mínimo possível (mas ainda pode mover a página)
ultimo.scrollIntoView({ block: "nearest" });

// Remédio 2: rolar somente a lista, até a base do seu conteúdo
// scrollHeight: a altura total do conteúdo, parte oculta incluída
lista.scrollTo({ top: lista.scrollHeight, behavior: "smooth" });
```

**Um elemento que não está lá.** Se o elemento ainda não estiver no DOM (a página carrega seu conteúdo por uma requisição), `getElementById` retorna `null` ("nenhum valor") e `null.scrollIntoView()` provoca um erro. Espera-se que o elemento exista, ou testa-se antes:

```javascript
const alvo = document.getElementById("avaliacoes");   // null se o elemento ainda não existir

// ?. (encadeamento opcional) só chama a função se alvo não for null
alvo?.scrollIntoView({ behavior: "smooth" });
```

Um elemento em `display: none` não ocupa lugar algum na página: a rolagem não faz nada. Por fim, se uma imagem ou um conteúdo for carregado **depois** da rolagem e aumentar a página acima do elemento, este fica deslocado: reservar o espaço das imagens com `width` e `height` evita esse deslocamento. A documentação da função está no [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView).

## `visibilitychange`: saber se a página está sendo vista

Uma **aba** é uma das páginas abertas lado a lado em uma mesma janela do navegador. Ela fica **oculta** quando o usuário mostra outra, reduz a janela, bloqueia sua tela ou passa para outro aplicativo no celular. Nesse estado, ninguém vê a página: continuar animando-a ou consultando um **servidor** (um computador remoto que responde aos pedidos da página) desperdiça bateria e rede.

O navegador indica isso por `document.visibilityState`, que assume um de dois valores, e pelo evento `visibilitychange`, disparado em `document` a cada alternância.

| Propriedade | Valor | Significado |
|---|---|---|
| `document.visibilityState` | `"visible"` | A página está exibida na tela |
| `document.visibilityState` | `"hidden"` | A página está oculta: aba em segundo plano, janela reduzida, tela bloqueada |
| `document.hidden` | `true` ou `false` | Versão mais antiga da mesma informação: `true` quando o estado é `"hidden"` |

```javascript
// Leitura na inicialização: uma aba aberta em segundo plano começa no estado "hidden"
console.log(document.visibilityState);      // "visible" ou "hidden"
console.log(document.hidden);               // true se a aba estiver oculta

// O evento é colocado em document (e não em window nem em um elemento)
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        console.log("Aba oculta: economizamos");
    } else {
        console.log("Aba voltou: retomamos");
    }
});
```

### O que o navegador faz com uma aba oculta

| Mecanismo | Em uma aba oculta |
|---|---|
| `setTimeout` e `setInterval` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)): os **temporizadores**, que chamam uma função após um atraso ou a intervalos regulares | Desacelerados: em geral no máximo uma chamada por segundo, às vezes bem menos, conforme o navegador |
| `requestAnimationFrame` (ver [o capítulo sobre o canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)) | Suspenso: a função não é mais chamada, até a aba voltar |
| Animações CSS | O navegador pode reduzir a frequência delas (ver [as animações CSS](/?c=langages&s=css&p=animations-css-performantes)) |
| Requisições de rede em andamento | Continuam: só o código que as dispara pode ser interrompido pelo script |

Um temporizador desacelerado não é portanto um temporizador **parado**: uma sondagem a cada 5 segundos continua solicitando o servidor. O script deve decidir ele mesmo parar.

### Suspender uma sondagem e retomar ao voltar

Uma **sondagem** (*polling*) consiste em perguntar regularmente ao servidor se há novidades. Duas noções novas aparecem no exemplo. `fetch(endereco)` envia uma **requisição de rede** (um pedido enviado a um servidor, ver [a API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) e retorna uma **promessa**, um objeto que representa um resultado que chegará mais tarde; `await` espera esse resultado sem bloquear a página, e `async` antes de uma função a autoriza a usá-lo (ver [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone)). `.json()` converte o texto da resposta, escrito no formato **JSON** (um formato de texto para trocar dados), em objeto JavaScript.

```javascript
let temporizador = null;                       // temporizador ativo, ou null (nenhum)

async function atualizar() {
    const resposta = await fetch("/api/messages");   // pede as mensagens ao servidor
    const mensagens = await resposta.json();         // lê a resposta como JSON
    console.log(mensagens.length + " mensagens");    // exibe a quantidade delas
}

function iniciarSondagem() {
    if (temporizador !== null) {               // !== : "é diferente de"
        return;                                // já iniciado: não lançamos um segundo
    }
    atualizar();                               // recupera o que foi perdido
    temporizador = setInterval(atualizar, 30000);  // depois a cada 30 000 milissegundos
}

function pararSondagem() {
    clearInterval(temporizador);               // clearInterval cancela o temporizador
    temporizador = null;                       // anotamos que não há mais nenhum
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pararSondagem();                       // aba oculta: nada de requisições
    } else {
        iniciarSondagem();                     // aba voltou: recomeça
    }
});

if (!document.hidden) {                        // ! : "não"; no carregamento, iniciar só
    iniciarSondagem();                         // se a página estiver realmente visível
}
```

A guarda `temporizador !== null` impede de acumular dois temporizadores se o evento disparar duas vezes seguidas.

### Pausar um vídeo e retomá-lo

Para um [vídeo](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) (a etiqueta `<video>`, um player embutido na página), é preciso lembrar do **estado antes do ocultamento**: se o próprio usuário tinha colocado o vídeo em pausa, retomá-lo na volta seria uma surpresa.

```javascript
const video = document.getElementById("demonstracao");   // a etiqueta <video> da página
let tocavaAntes = false;                         // o vídeo tocava antes do ocultamento?

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        tocavaAntes = !video.paused;             // paused: verdadeiro se estiver em pausa
        video.pause();                           // coloca em pausa
    } else if (tocavaAntes) {
        video.play().catch(() => {});            // play retorna promessa: recusa ignorada
        tocavaAntes = false;                     // o estado é consumido
    }
});
```

### Retomar uma animação sem solavanco

`requestAnimationFrame` para sozinho numa aba oculta, portanto não há nada a suspender. Mas, ao voltar, o tempo decorrido entre dois quadros pode ter chegado a vários minutos, e um objeto que avança em proporção ao tempo **dá um salto** brusco. Limita-se então a duração considerada.

```javascript
let posicao = 0;                               // posição do objeto, em pixels
const velocidade = 0.1;                        // 0,1 pixel por milissegundo
let ultimo = null;                             // instante do último quadro, ou null

function imagem(agora) {                       // agora: relógio do navegador, em ms
    // duração decorrida desde o quadro anterior (0 para o primeiro)
    const decorrido = ultimo === null ? 0 : agora - ultimo;
    ultimo = agora;                            // guardamos o instante deste quadro
    posicao += velocidade * Math.min(decorrido, 100);   // Math.min: no máximo 100 ms por vez
    requestAnimationFrame(imagem);             // agenda o quadro seguinte
}

requestAnimationFrame(imagem);                 // inicia o laço
```

### Enviar uma última medição com `sendBeacon`

Um site que mede o tempo passado numa página quer enviar sua medição no momento em que o usuário vai embora. Uma requisição `fetch` lançada nesse instante corre o risco de ser interrompida pelo fechamento da página. `navigator.sendBeacon(endereco, dados)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)) foi concebida para esse caso: ela entrega o envio ao navegador, que o conclui mesmo se a página desaparecer. O envio é uma requisição do tipo **POST**, o método [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) que envia dados a um servidor. Ela só retorna um booleano (`true` se o envio foi colocado na fila), nunca a resposta do servidor.

```javascript
const inicio = performance.now();              // ms desde o início do carregamento

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") {
        return;                                // só enviamos na passagem para "hidden"
    }
    // JSON.stringify converte um objeto em texto JSON; Math.round arredonda para o inteiro
    const medicao = JSON.stringify({ duracao: Math.round(performance.now() - inicio) });
    navigator.sendBeacon("/api/mesures", medicao);   // envio POST sem esperar resposta
});
```

O servidor recebe texto (JSON) em POST. A medição é **cumulativa**: se o usuário ocultar e reexibir a aba várias vezes, o servidor recebe vários envios e guarda o último.

### Por que não `beforeunload` nem `unload`?

Muitos tutoriais enviam suas medições nos eventos `beforeunload` (a página vai ser fechada, uma mensagem de confirmação pode ser exibida) ou `unload` (a página está sendo descarregada). Eles são pouco confiáveis:

| Evento | Quando dispara | Confiabilidade para enviar uma medição |
|---|---|---|
| `beforeunload` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)) | A página vai ser deixada, fechada ou recarregada | Fraca: no celular, mudar para outro aplicativo ou fechar a aba nem sempre é anunciado; serve sobretudo para avisar sobre um texto digitado e não salvo |
| `unload` | A página é descarregada | Fraca, e desaconselhado: sua presença pode impedir o navegador de manter a página inteira na memória para um retorno instantâneo |
| `pagehide` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)) | A página é deixada, **ou** mantida na memória para um retorno rápido | Boa: dispara também quando o usuário navega para outro lugar; `evento.persisted` vale `true` se a página for mantida |
| `visibilitychange` para `"hidden"` | A aba é ocultada, o que quase sempre precede um fechamento | A mais confiável, sobretudo no celular: é o último momento seguro |

A combinação robusta é `visibilitychange` (passagem para `"hidden"`) com `sendBeacon`, eventualmente completada por `pagehide`. Um só envio deve então contar, daí o interesse de anotar que uma medição já foi enviada, para não a duplicar.

```javascript
let jaEnviado = false;                         // true depois que a medição foi enviada

window.addEventListener("pagehide", () => {
    if (jaEnviado) {
        return;                                // nada de duplicata com visibilitychange
    }
    jaEnviado = true;
    navigator.sendBeacon("/api/mesures", "fim");   // texto simples, lido pelo servidor
});
```

### As armadilhas de `visibilitychange`

| Armadilha | Explicação |
|---|---|
| Supor a página visível no início | Um link aberto numa aba em segundo plano carrega a página já oculta, **sem evento**: ler `document.visibilityState` na inicialização |
| Pausar um conteúdo cujo áudio é desejado | Um tocador de música, um podcast, uma videoconferência devem continuar com a aba oculta: suspender só o que é puramente visual |
| Retomar o que o usuário havia interrompido | Guardar o estado antes do ocultamento (variável `tocavaAntes`) |
| Esquecer de atualizar na volta | Os dados envelheceram durante a ausência: refazer uma requisição assim que voltar |
| Um grande salto de tempo numa animação | Limitar a duração considerada (`Math.min`) |
| Enviar em `unload` ou `beforeunload` | Pouco confiável, sobretudo no celular |

## `AbortController`: cancelar o que está em andamento

Algumas operações demoram: uma requisição que espera um servidor lento, um download volumoso. Às vezes o resultado já não interessa (o usuário mudou de página, refez a pesquisa) ou elas devem parar depois de um prazo. `AbortController` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)) é um objeto que serve de **controle remoto de cancelamento**: cria-se, extrai-se dele um **sinal** que se entrega à operação, e aperta-se "cancelar" quando se decide.

| Elemento | Papel |
|---|---|
| `new AbortController()` | Cria o controle remoto |
| `controlador.signal` | Um objeto `AbortSignal`: o fio que se estende à operação para que ela saiba quando parar |
| `controlador.abort()` | Aperta o botão: o sinal passa para "cancelado" e avisa todos os que o escutam |
| `signal.aborted` | `true` assim que o cancelamento for acionado |
| `signal.reason` | O motivo do cancelamento (ver mais abaixo) |

### Cancelar uma requisição `fetch`

`fetch` aceita, como segundo argumento, um objeto de opções cuja chave `signal` recebe o sinal. Se o sinal for cancelado, a promessa rejeitada (uma promessa pode falhar: diz-se que ela é **rejeitada**, e o erro é capturado por `try` / `catch`, ver [o tratamento de erros](/?c=langages&s=javascript&p=gestion-des-erreurs)) carrega um erro de nome `AbortError`. O [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) descreve `fetch` em detalhe.

```javascript
const controlador = new AbortController();    // o controle remoto
const signal = controlador.signal;            // o sinal a entregar ao fetch

// Ao clicar no botão "Cancelar" (<button id="cancelar">), apertamos o controle remoto
document.getElementById("cancelar").addEventListener("click", () => {
    controlador.abort();                      // a requisição em andamento é interrompida
});

async function baixar() {
    try {
        // { signal } é a forma abreviada de { signal: signal }
        const resposta = await fetch("/api/gros-fichier", { signal });
        console.log("Resposta recebida", resposta.ok);   // ok: verdadeiro se houve resposta
    } catch (erro) {
        if (erro.name === "AbortError") {          // name: o tipo do erro (texto)
            console.log("Download cancelado");       // cancelamento desejado, não um erro
        } else {
            throw erro;                            // um erro de verdade: relançamos
        }
    }
}
```

O cancelamento tem duas limitações. De um lado, ele interrompe **a espera e o download do lado do navegador**, não necessariamente o trabalho do servidor: uma requisição que modifica dados (um pedido de compra) pode já ter sido processada antes do cancelamento. De outro lado, ele também se aplica à leitura do conteúdo: um `await resposta.json()` em andamento é interrompido do mesmo modo, com o mesmo erro.

### Cancelar a requisição anterior: a corrida entre requisições

Numa barra de pesquisa que consulta o servidor a cada letra, o usuário digita "pe" e depois "pesq". Duas requisições partem. Nada garante que elas voltem **na ordem de envio**: a primeira pode ser mais lenta. Se a resposta dela chegar por último, ela sobrescreve a exibição correta com resultados desatualizados. É uma **corrida** (*race condition*) entre requisições: o resultado depende de qual chega primeiro.

```
Tempo ----------------------------------------------------------------------->

SEM CANCELAMENTO
 digita "pe"      -> requisição A ----------------------------> resposta A (lenta)
 digita "pesq"    ->    requisição B -----------> resposta B
 exibição                                        [B]            [A]  <- resultados antigos

COM CANCELAMENTO
 digita "pe"      -> requisição A ------X   (abort() na digitação seguinte)
 digita "pesq"    ->    requisição B -----------> resposta B
 exibição                                        [B]            (A nunca exibe nada)
```

A solução: guardar o controlador da requisição em andamento e cancelá-lo antes de lançar uma nova. Para montar o endereço de pesquisa, `encodeURIComponent(texto)` substitui os caracteres especiais de um texto (espaços, `&`, acentos) por códigos seguros para pôr num endereço.

```html
<input id="pesquisa">                              <!-- campo de digitação -->
<p id="situacao"></p>                              <!-- mensagem de estado -->
<ul id="resultados"></ul>                          <!-- lista dos resultados -->
```

```javascript
const campo = document.getElementById("pesquisa");
const situacao = document.getElementById("situacao");
const resultados = document.getElementById("resultados");
let controladorAtual = null;                   // controlador da requisição em andamento

async function pesquisar(texto) {
    if (controladorAtual !== null) {
        controladorAtual.abort();              // cancela a requisição anterior, se houver
    }
    controladorAtual = new AbortController();  // novo controle remoto para esta pesquisa
    situacao.textContent = "Pesquisa em andamento...";

    try {
        const endereco = "/api/recherche?q=" + encodeURIComponent(texto);
        const resposta = await fetch(endereco, { signal: controladorAtual.signal });
        const lista = await resposta.json();   // suponhamos: um array de textos
        resultados.textContent = "";           // esvazia a lista antiga
        for (const nome of lista) {            // para cada resultado recebido...
            const linha = document.createElement("li");   // ...cria um elemento <li>
            linha.textContent = nome;
            resultados.appendChild(linha);     // acrescenta-o à lista exibida
        }
        situacao.textContent = "";             // pesquisa concluída: nenhuma mensagem
    } catch (erro) {
        if (erro.name === "AbortError") {
            return;                            // substituída por outra: fica calada
        }
        situacao.textContent = "A pesquisa falhou";
    }
}

campo.addEventListener("input", () => {        // input: a cada modificação do campo
    pesquisar(campo.value);                    // value: o texto digitado neste momento
});
```

A pesquisa cancelada **não toca nem na exibição nem na mensagem de estado**: senão ela apagaria o "Pesquisa em andamento..." da requisição que a substitui. Na prática, costuma-se acrescentar um **debounce** (esperar uma breve pausa na digitação antes de enviar, ver [os observadores e a limitação de frequência](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) para enviar menos requisições; o cancelamento continua útil nos casos em que duas requisições partem mesmo assim.

### Limitar a duração com `AbortSignal.timeout`

Um servidor que nunca responde deixaria o usuário esperando para sempre. `AbortSignal.timeout(milissegundos)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)) cria um sinal que se cancela sozinho ao fim do prazo indicado, sem controlador para manipular. Seu erro se chama `TimeoutError`, o que permite distingui-lo de um cancelamento desejado.

```javascript
async function carregarComPrazo() {
    try {
        // O sinal se cancela sozinho após 5000 milissegundos (5 segundos)
        const resposta = await fetch("/api/lent", { signal: AbortSignal.timeout(5000) });
        console.log("Recebido a tempo", resposta.ok);
    } catch (erro) {
        if (erro.name === "TimeoutError") {        // o prazo foi excedido
            console.log("O servidor demora demais para responder");
        } else if (erro.name === "AbortError") {   // cancelamento desejado (aqui, nunca)
            console.log("Cancelado");
        } else {
            throw erro;                            // qualquer outro problema (rede caída...)
        }
    }
}
```

Para combinar um prazo e um botão "Cancelar", `AbortSignal.any([signalA, signalB])` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)) cria um sinal cancelado assim que **um** dos dois for:

```javascript
const controlador = new AbortController();     // para o botão "Cancelar"
// Cancelado por controlador.abort() ou após 8 segundos, conforme o primeiro dos dois
const signal = AbortSignal.any([controlador.signal, AbortSignal.timeout(8000)]);
```

### Remover vários ouvintes de uma vez

Remover um ouvinte com `removeEventListener(nome, funcao)` exige passar-lhe **a mesma função** que a de `addEventListener`: uma função de seta escrita na hora nunca pode ser removida. O sinal resolve o problema: `addEventListener` aceita a opção `signal` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)), e o ouvinte é **removido automaticamente** quando esse sinal é cancelado. Um único `abort()` limpa todos os ouvintes que compartilham o sinal, o que evita esquecer um deles quando um componente desaparece da página.

```javascript
const controlador = new AbortController();     // um controlador para o componente inteiro
const opcoes = { signal: controlador.signal }; // o objeto de opções compartilhado

window.addEventListener("resize", () => {      // resize: a janela muda de tamanho
    console.log("largura:", window.innerWidth);
}, opcoes);                                    // 3º argumento: as opções, com o sinal

document.addEventListener("keydown", (evento) => {
    console.log("tecla:", evento.key);         // key: o nome da tecla pressionada
}, opcoes);

document.addEventListener("visibilitychange", () => {
    console.log("visibilidade:", document.visibilityState);
}, opcoes);

// Mais tarde, quando o componente desaparecer: os três ouvintes são removidos de uma vez
controlador.abort();
```

### O motivo de um cancelamento

`abort()` aceita um argumento facultativo, o **motivo** do cancelamento. Ele se lê em `signal.reason`, o que ajuda a entender por que uma operação parou. Um `DOMException` é o tipo de erro que o próprio navegador fabrica, com um nome (`name`) e uma mensagem. Atenção: o erro recebido pelo `fetch` **é esse próprio motivo**.

| Chamada | Valor de `signal.reason` | O que recebe o `catch` do `fetch` |
|---|---|---|
| `controlador.abort()` | Um erro `DOMException` de nome `"AbortError"` | Esse erro: `erro.name === "AbortError"` |
| `controlador.abort("Página abandonada")` | O texto `"Página abandonada"` | O próprio texto: ele não tem `name`, portanto o teste `erro.name === "AbortError"` falha |
| `AbortSignal.timeout(5000)` | Um `DOMException` de nome `"TimeoutError"` | Esse erro: `erro.name === "TimeoutError"` |

```javascript
const controlador = new AbortController();

fetch("/api/rapport", { signal: controlador.signal })
    .catch((erro) => {
        console.log(erro);                     // exibe: Página abandonada
    });

controlador.abort("Página abandonada");        // o motivo é um texto livre
console.log(controlador.signal.aborted);       // true: o sinal está cancelado
console.log(controlador.signal.reason);        // Página abandonada
```

Ao fornecer seu próprio motivo, é melhor portanto testar **`signal.aborted`** do que `erro.name`, ou dar um erro de verdade como motivo (`new DOMException("Página abandonada", "AbortError")`).

### As armadilhas de `AbortController`

Um controlador cancelado **não se rearma**: seu sinal permanece cancelado para sempre, e toda operação à qual ele for entregue depois falha imediatamente. É preciso criar um novo para cada operação.

```javascript
let controlador = new AbortController();
controlador.abort();                           // o sinal fica cancelado definitivamente

// RUIM: esta requisição é recusada logo, pois o sinal já está cancelado
fetch("/api/donnees", { signal: controlador.signal })
    .catch(() => console.log("falha imediata"));

controlador = new AbortController();           // BOM: um controlador novo
fetch("/api/donnees", { signal: controlador.signal });
```

O outro erro é tratar o cancelamento como uma falha de verdade: exibir "Erro de rede" quando o usuário apenas iniciou uma nova pesquisa. O `catch` deve distinguir os dois casos, como nos exemplos acima.

## Síntese

| API | Pergunta à qual responde | Exemplo de uso | Principal armadilha |
|---|---|---|---|
| `window.matchMedia(consulta)` | A condição de tela ou de configuração é verdadeira, e muda? | Tema escuro do sistema, `prefers-reduced-motion`, janela estreita | Ler `.matches` uma vez sem escutar `change`; medir `innerWidth` em loop; usar o obsoleto `addListener` |
| `elemento.scrollIntoView(opcoes)` | Como trazer este elemento para a vista? | Botão "Ver os preços" que rola até o título | Forçar `smooth` apesar de `prefers-reduced-motion`; cabeçalho fixo que esconde o alvo (`scroll-margin-top`); rolagem da página inteira a partir de um contêiner aninhado |
| `document.visibilityState` e `visibilitychange` | O usuário está olhando a página? | Suspender uma sondagem ou um vídeo; enviar uma medição com `sendBeacon` | Supor a página visível no início; enviar em `unload`; retomar o que o usuário havia interrompido |
| `AbortController` e `AbortSignal` | Como parar o que está em andamento? | Cancelar a pesquisa anterior; `AbortSignal.timeout`; remover ouvintes de uma vez | Reutilizar um controlador cancelado; tratar `AbortError` como erro de verdade |

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Escrever `consulta.addListener(...)` | Obsoleto | `consulta.addEventListener("change", ...)` |
| Medir `window.innerWidth` em loop | Trabalho inútil, bateria consumida | `matchMedia` e seu evento `change`, ou `ResizeObserver` |
| Ler `.matches` uma vez e deixá-lo de lado | A interface fica desatualizada se o usuário mudar de tema ou girar o aparelho | Escutar `change` quando a configuração deve ser acompanhada |
| Uma media query mal escrita | `matches` vale `false` sem erro nem aviso | Manter os parênteses: `"(max-width: 600px)"` |
| Forçar `behavior: "smooth"` | Pode causar mal-estar em pessoas sensíveis ao movimento | Ler `prefers-reduced-motion` ou deixar `auto` e ajustar `scroll-behavior` em CSS |
| Alvo escondido pelo cabeçalho fixo | O topo da área visível fica sob a barra | `scroll-margin-top` nos alvos |
| `scrollIntoView` num contêiner aninhado | A página inteira também pode rolar | `block: "nearest"` ou `conteiner.scrollTo(...)` |
| Elemento ausente do DOM ou em `display: none` | Erro com `null`, ou rolagem sem efeito | Esperar que ele exista, testar com `?.` |
| `focus()` que rola bruscamente | O navegador rola a página até o elemento | `focus({ preventScroll: true })` |
| Supor a página visível no carregamento | Uma aba aberta em segundo plano começa `"hidden"` sem evento | Ler `document.visibilityState` na inicialização |
| Confiar em `beforeunload` ou `unload` para enviar dados | Não disparados de forma confiável, sobretudo no celular | `visibilitychange` e `sendBeacon`, eventualmente `pagehide` |
| Sondagem ou animação que continua com a aba oculta | Os temporizadores são apenas desacelerados | Parar na passagem para `"hidden"` |
| Retomar um vídeo que o usuário havia colocado em pausa | Surpresa desagradável | Guardar o estado antes do ocultamento |
| Reutilizar um `AbortController` cancelado | Seu sinal continua cancelado: a operação falha de imediato | Criar um controlador por operação |
| Mostrar `AbortError` como falha | O cancelamento é um funcionamento normal | Reconhecer `erro.name` (ou `signal.aborted`) e ficar calado |
| Cancelar com um motivo texto e testar `erro.name` | Um texto não tem `name`: o teste falha | Testar `signal.aborted`, ou fornecer uma `DOMException` |
| Achar que o cancelamento interrompe o servidor | Ele só corta a espera do lado do navegador | Prever um servidor que aceite que uma requisição seja repetida ou abandonada |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Preferir `@media` em CSS quando só o estilo muda; reservar `matchMedia` às decisões de script | O CSS é mais simples e mais rápido |
| Ler o estado de `matchMedia` na inicialização **e** escutar `change` | O estado inicial e as mudanças ficam ambos cobertos |
| Respeitar `prefers-reduced-motion` em toda rolagem ou animação disparada por script | Acessibilidade: algumas pessoas não suportam o movimento |
| Colocar `scroll-margin-top` nos alvos quando há um cabeçalho fixo | O alvo continua visível, inclusive para os links de âncora |
| Depois de rolar até uma área, pôr o foco nela com `tabindex="-1"` e `focus({ preventScroll: true })` | A navegação pelo teclado e pelo leitor de tela acompanha a rolagem |
| Parar o que é puramente visual quando a página é ocultada, e retomar na volta | Economia de bateria e de rede |
| Enviar as últimas medições com `sendBeacon` em `visibilitychange` | Único meio confiável, inclusive no celular |
| Cancelar a requisição anterior antes de lançar uma nova para a mesma função | Sem resultados desatualizados, sem corrida entre requisições |
| Dar um prazo máximo às requisições com `AbortSignal.timeout` | O usuário nunca espera para sempre |
| Agrupar os ouvintes de um componente sob um mesmo `signal` | Um único `abort()` limpa tudo, nada fica esquecido |
| Tratar `AbortError` e `TimeoutError` à parte no `catch` | Cancelamento desejado, prazo excedido e falha pedem cada um uma mensagem diferente |

## O que reter

| | |
|---|---|
| **A reter** | `window.matchMedia(consulta)` retorna um `MediaQueryList`: `.matches` dá a resposta atual, o evento `change` (via `addEventListener`) avisa das mudanças, nunca no carregamento; o CSS continua preferível quando só o estilo muda. `elemento.scrollIntoView({ behavior, block, inline })` traz um elemento para a vista; `scroll-margin-top` compensa um cabeçalho fixo, `prefers-reduced-motion` proíbe forçar `smooth`, e `focus({ preventScroll: true })` move o foco sem segunda rolagem. `document.visibilityState` (`"visible"` ou `"hidden"`) e o evento `visibilitychange` em `document` permitem suspender sondagens, vídeos e animações; `navigator.sendBeacon` envia a última medição, pois `beforeunload` e `unload` são pouco confiáveis, sobretudo no celular. `new AbortController()` fornece um `signal` entregue a `fetch`, a `addEventListener` ou a `AbortSignal.timeout`; `abort()` interrompe, o erro se reconhece por `erro.name` (`AbortError`, `TimeoutError`), e um controlador cancelado não se rearma. |
| **Armadilhas a evitar** | `addListener` obsoleto; `innerWidth` medido em loop; `.matches` lido uma só vez; `smooth` forçado; alvo escondido pelo cabeçalho fixo; contêiner aninhado que rola a página; elemento ausente do DOM; página tida como visível no início; envio em `unload`; temporizador que continua com a aba oculta; controlador cancelado reutilizado; cancelamento tratado como erro; motivo texto que faz falhar o teste em `erro.name`. |
| **Boas práticas** | CSS primeiro, `matchMedia` para as decisões de script; leitura inicial mais escuta de `change`; respeito a `prefers-reduced-motion`; `scroll-margin-top` mais foco após uma rolagem; parada e retomada em `visibilitychange`; `sendBeacon` para a última medição; cancelamento da requisição anterior e `AbortSignal.timeout`; um `signal` compartilhado para remover vários ouvintes; `catch` que distingue cancelamento, prazo excedido e falha. |
