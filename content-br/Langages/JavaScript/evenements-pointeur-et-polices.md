---
order: 23
---

# Eventos de ponteiro e carregamento de fontes (28/10/2026)

Um **evento** é um sinal que o navegador envia quando algo acontece (um toque, um movimento, o fim de um download); um **ouvinte** é a função que se liga a um evento para ser executada a cada vez. Eles são explicados em detalhes em [o capítulo sobre o DOM e os eventos](/?c=langages&s=javascript&p=dom-et-evenements). Este capítulo apresenta dois assuntos do mesmo tipo que [as APIs de página do navegador](/?c=langages&s=javascript&p=api-de-page-du-navigateur) (esse capítulo define o que é uma API): as informações que o navegador dá a um script sobre o que o usuário faz, e sobre o que a tela realmente exibe. Eles compartilham uma armadilha: o script age sobre o que acredita saber, enquanto a realidade (um dedo que sai do quadro, uma fonte que ainda não chegou) muda depois.

| Assunto | O que ele permite | Seção |
|---|---|---|
| Os eventos de ponteiro | Reagir do mesmo jeito a um mouse, a um dedo e a uma caneta; arrastar um elemento sem perder o rastreamento; tratar vários dedos | [Os eventos de ponteiro](#os-eventos-de-ponteiro) |
| O carregamento das fontes | Saber quando uma fonte chegou, para medir um texto ou desenhá-lo com a largura certa | [O carregamento das fontes](#o-carregamento-das-fontes) |

Para acompanhar este capítulo, você precisa já conhecer [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as funções](/?c=langages&s=javascript&p=fonctions) (inclusive as funções de seta `() => { ... }`), [as condições](/?c=langages&s=javascript&p=conditions), [os objetos](/?c=langages&s=javascript&p=objets) (a notação `{ nome: valor }`), [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone) (promessas, `async` e `await`) e [os seletores CSS](/?c=langages&s=css&p=selecteurs). Um **pixel** é o menor ponto de uma tela; `px` é a unidade CSS que conta os pixels. Todas as APIs deste capítulo estão disponíveis em todos os navegadores atuais (28/10/2026).

## Os eventos de ponteiro

### Por que eles existem

Um **ponteiro** é tudo o que aponta um ponto da tela: a seta de um **mouse** (o **cursor** é a seta exibida, que o mouse move), um **dedo** posto sobre uma **tela sensível ao toque** (que detecta o contato), uma **caneta stylus** (uma caneta especial para tablet). Durante muito tempo, cada aparelho tinha seus próprios eventos: `mousedown` para o mouse, `touchstart` para o dedo. Escrever uma interface que funcionasse em todo lugar obrigava a escrever o código duas vezes. Os **eventos de ponteiro** (*pointer events*) reúnem os três aparelhos sob um mesmo conjunto de nomes ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).

| | Eventos de mouse | Eventos de toque | Eventos de ponteiro |
|---|---|---|---|
| Nomes | `mousedown`, `mousemove`, `mouseup` | `touchstart`, `touchmove`, `touchend` | `pointerdown`, `pointermove`, `pointerup` |
| Dispositivos | Mouse (e touchpad de computador) | Somente dedos | Mouse, dedo, caneta |
| Vários dedos | Não se aplica | Uma lista de contatos em cada evento (`event.touches`) | Um evento por dedo, reconhecido pelo seu `pointerId` |
| Posição | `clientX`, `clientY` | `touches[0].clientX` (na lista) | `clientX`, `clientY` diretamente |
| Código a escrever | Um conjunto | Outro conjunto | **Um só** |

Um código escrito somente com `mousedown` não reage bem a um dedo: o navegador fabrica, é verdade, eventos de mouse após um toque, ditos **de compatibilidade**, mas em bloco depois que o dedo sai da tela, e sem acompanhar o movimento. Os eventos de ponteiro não têm esse defeito.

> Para testá-los sem celular, você pode usar as ferramentas de desenvolvedor do navegador (F12), que sabem simular uma tela sensível ao toque.

### Os eventos de um ponteiro

| Evento | Dispara quando | Sobe aos pais (*bubbling*) |
|---|---|---|
| `pointerdown` | O ponteiro "pressiona": botão do mouse pressionado, dedo ou caneta que toca a tela | Sim |
| `pointermove` | O ponteiro se move. Mouse: mesmo sem botão pressionado; dedo: somente em contato; caneta: em contato ou com passagem por cima | Sim |
| `pointerup` | O ponteiro é solto | Sim |
| `pointercancel` | O navegador **cancela** o gesto: ele assume o controle (rolagem, zoom) ou o aparelho perde o contato. Nenhum outro evento segue para esse ponteiro | Sim |
| `pointerover` | O ponteiro entra no elemento ou em um de seus filhos | Sim |
| `pointerenter` | O ponteiro entra no próprio elemento (uma única vez, qualquer que seja o número de filhos atravessados) | Não |
| `pointerout` | O ponteiro sai do elemento ou entra em um de seus filhos | Sim |
| `pointerleave` | O ponteiro sai do elemento **e** de todos os seus descendentes | Não |
| `gotpointercapture`, `lostpointercapture` | O elemento acaba de obter, ou de perder, a captura do ponteiro (ver [a seção sobre a captura](#arrastar-a-captura-do-ponteiro)) | Sim |

Um evento **sobe aos pais** (*bubbling*) quando um ouvinte colocado em um pai também o recebe: esse mecanismo é descrito em [a propagação dos eventos](/?c=langages&s=javascript&p=dom-et-evenements). A **passagem por cima** (*hover*) é o estado de um elemento sobre o qual um ponteiro está, sem pressionar; um dedo não tem passagem por cima, pois ele toca ou não toca. Daí uma ordem de eventos diferente conforme o aparelho:

| Aparelho | Sequência em torno de um pressionamento |
|---|---|
| Mouse | `pointerover`, `pointerenter`, `pointermove` (a cada movimento), `pointerdown`, `pointerup`, depois `click`; `pointerout` e `pointerleave` quando o cursor sai do elemento |
| Dedo | `pointerover`, `pointerenter`, `pointerdown`, `pointermove`..., `pointerup`, `pointerout`, `pointerleave`, depois `click`: sem passagem por cima, a entrada e a saída envolvem logo o pressionamento |
| Dedo, quando o navegador começa a rolar | `pointerdown`, alguns `pointermove`, `pointercancel`, `pointerout`, `pointerleave`; **sem `pointerup`, sem `click`** |

O código mínimo escuta os quatro eventos do ciclo de vida de um ponteiro. `console.log` escreve uma mensagem no console das ferramentas de desenvolvedor (F12); `document.getElementById` encontra um elemento pelo seu `id`, o identificador único.

```javascript
// Um elemento da página, identificado pelo seu id
const zona = document.getElementById("zona-teste");

zona.addEventListener("pointerdown", (evento) => {
    console.log("pressionado", evento.pointerType);   // qual aparelho pressiona
});

zona.addEventListener("pointermove", () => {
    console.log("movimento");        // se repete enquanto o ponteiro se move
});

zona.addEventListener("pointerup", () => {
    console.log("solto");
});

zona.addEventListener("pointercancel", () => {
    console.log("cancelado pelo navegador");   // nenhum pointerup virá depois
});
```

### As propriedades do evento

O objeto recebido pelo ouvinte é um `PointerEvent` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)). Ele traz tudo o que o navegador sabe sobre o ponteiro:

| Propriedade | Valor | O que ela diz |
|---|---|---|
| `pointerType` | `"mouse"`, `"touch"`, `"pen"` (caneta), ou `""` se o aparelho for desconhecido | Qual aparelho produziu o evento |
| `pointerId` | Um número inteiro | O número do ponteiro: **um por dedo**. Permanece o mesmo do `pointerdown` ao `pointerup` daquele dedo |
| `isPrimary` | `true` ou `false` | Verdadeiro para o ponteiro principal de cada tipo de aparelho: o mouse sempre é, e, para os dedos, o primeiro posto |
| `clientX`, `clientY` | Números decimais, em pixels | Posição na **janela visível**, medida a partir do seu canto superior esquerdo |
| `pageX`, `pageY` | Em pixels | Posição na **página inteira**, rolagem incluída |
| `pressure` | De `0` a `1` | Força da pressão. Sem sensor de pressão (mouse, a maioria das telas), `0.5` durante o pressionamento e `0` do contrário |
| `button` | `0` para o botão principal | Qual botão mudou de estado. Um dedo ou uma caneta em contato dão `0` |
| `buttons` | Um número (bits) | Quais botões estão pressionados neste instante |

```javascript
zona.addEventListener("pointerdown", (evento) => {
    console.log(evento.pointerType);   // "mouse", "touch" ou "pen"
    console.log(evento.pointerId);     // o número deste ponteiro
    console.log(evento.isPrimary);     // true para o ponteiro principal
    console.log(evento.pressure);      // força da pressão, de 0 a 1
    console.log(evento.button);        // 0: botão principal (ou contato)
    console.log(evento.clientX, evento.clientY);   // posição na janela
});
```

Para obter a posição **dentro do elemento** em vez da posição na janela, subtrai-se a posição do elemento. `getBoundingClientRect()` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)) devolve o retângulo que o elemento ocupa, medido nas mesmas coordenadas que `clientX` e `clientY`: as propriedades `left` e `top` dão a borda esquerda e a borda superior, `width` e `height` o tamanho dele.

```javascript
zona.addEventListener("pointermove", (evento) => {
    // O retângulo é medido a cada chamada: a página pode ter rolado nesse meio tempo
    const rect = zona.getBoundingClientRect();
    const x = evento.clientX - rect.left;   // distância até a borda esquerda do elemento
    const y = evento.clientY - rect.top;    // distância até a sua borda superior
    console.log(x, y);
});
```

Em um [SVG](/?c=langages&s=html&p=svg-dans-la-page) cujo `viewBox` muda a escala, ou em um [canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations) cuja resolução interna difere do tamanho exibido, essa subtração não basta: uma conversão de escala se acrescenta, apresentada nesses capítulos (para o SVG, `getScreenCTM`).

### `click` ou `pointerdown`?

| | `click` | `pointerdown` |
|---|---|---|
| Quando | Depois do pressionamento **e** da soltura | Desde o pressionamento |
| Teclado | Sim: Enter ou Espaço sobre um botão também o disparam | Não |
| Dispositivos | Todos: mouse, dedo, caneta, teclado, leitor de tela | Somente ponteiros |
| Gesto cancelável | Sim: soltar fora do elemento cancela o clique | Não: já foi disparado |
| Usar para | Ativar um botão ou um link | Desenhar, arrastar, reagir sem esperar a soltura |

Um botão que valida uma ação deve reagir a `click`, senão o teclado não funciona mais (ver [o foco pelo teclado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)).

### Arrastar: a captura do ponteiro

Um **arrasto** (*drag*) é um gesto em três tempos: pressionar um elemento, mover mantendo a pressão, soltar. A armadilha: `pointermove` é enviado ao elemento **sob** o ponteiro. Se o mouse vai rápido e sai do elemento, o elemento não recebe mais nada e fica parado, ou nunca fica sabendo que o botão foi solto em outro lugar. A **captura do ponteiro** (*pointer capture*) resolve isso: o elemento que captura recebe **todos** os eventos desse ponteiro até a soltura, onde quer que ele esteja.

```
SEM CAPTURA                                   COM setPointerCapture
(o elemento só recebe o que                   (o elemento recebe TUDO, até
 chega enquanto o ponteiro está sobre ele)     o fim do gesto)

 pointerdown      -> elemento                  pointerdown      -> elemento
                                                 (+ setPointerCapture)
 pointermove      -> elemento                  pointermove      -> elemento
 pointermove      -> elemento                  pointermove      -> elemento
   o ponteiro sai do elemento                    o ponteiro sai do elemento
 pointerleave     -> elemento                    (nenhum pointerleave)
 pointermove      -> página ou outro elemento  pointermove      -> elemento
 pointerup        -> página ou outro elemento  pointerup        -> elemento
   o elemento nunca saberá                      lostpointercapture -> elemento
   que o gesto terminou: ele fica "grudado"       (a captura é devolvida sozinha)
```

| Função ou evento | Papel |
|---|---|
| `elemento.setPointerCapture(pointerId)` | O elemento captura este ponteiro. Chamar durante o `pointerdown`: o `pointerId` deve designar um ponteiro ativo, senão o navegador levanta um erro |
| `elemento.releasePointerCapture(pointerId)` | Devolve a captura antes do fim do gesto |
| `elemento.hasPointerCapture(pointerId)` | `true` se este elemento captura este ponteiro |
| `gotpointercapture` | O elemento acaba de obter a captura |
| `lostpointercapture` | O elemento acaba de perdê-la, por soltura explícita, por `pointerup`, por `pointercancel` ou porque saiu da página |

A captura é devolvida **automaticamente** ao fim do gesto (`pointerup` ou `pointercancel`): não é preciso liberá-la à mão no caso normal ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)). Em uma tela sensível ao toque, o navegador capta até o dedo para o elemento tocado desde o `pointerdown` (**captura implícita**); com um mouse, nada é capturado enquanto não se pede. Chamar `setPointerCapture` continua sendo o bom hábito: o mesmo código funciona para todos os aparelhos.

Durante uma captura, os eventos de entrada e de saída (`pointerenter`, `pointerleave`, `pointerover`, `pointerout`) se comportam como se o ponteiro nunca deixasse o elemento que captura. Os elementos sob ele não recebem nada: para saber o que está sob o ponteiro, é preciso perguntar explicitamente, como faz o exemplo completo mais abaixo.

### `touch-action`: quem decide a rolagem por toque?

Em uma tela sensível ao toque, um dedo que desliza pode significar "role a página", "dê zoom" ou "mova meu mapa". O navegador deve decidir **no início do gesto**, a partir da propriedade CSS `touch-action` do elemento tocado ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)). Se ele decidir rolar, assume o controle e envia `pointercancel`: o elemento não recebe mais nenhum `pointermove`. Chamar `preventDefault()` em `pointermove` não muda nada: a decisão já foi tomada.

| Valor | O que o navegador trata no elemento | Uso |
|---|---|---|
| `auto` (padrão) | Rolagem nos dois sentidos, zoom por pinça, zoom por toque duplo | Tudo o que não é um gesto personalizado |
| `none` | **Nada**: todo gesto chega aos ouvintes | Área de desenho, mapa ou plano que se move com o dedo |
| `pan-y` | Somente a rolagem vertical | Um controle deslizante horizontal numa página que rola de cima para baixo: o gesto horizontal volta para o script |
| `pan-x` | Somente a rolagem horizontal | O caso simétrico |
| `pinch-zoom` | Somente o zoom por pinça | A combinar com `pan-x` ou `pan-y` para manter o zoom |
| `manipulation` | Rolagem e pinça, mas não o zoom por toque duplo | Botões e listas: sem zoom intempestivo |

```css
.mapa {
    touch-action: none;       /* um dedo posto aqui não rola nem dá zoom */
}

.controle-horizontal {
    touch-action: pan-y;      /* a página rola na vertical; a horizontal é nossa */
}
```

O valor é lido **no início do gesto**: mudá-lo em JavaScript no meio de um arrasto não tem efeito sobre esse arrasto. E `touch-action: none` aplicado numa área grande impede de rolar a página tocando nela: é melhor reservá-lo ao elemento que se arrasta, e não bloquear o zoom por pinça em toda parte, pois pessoas dependem dele para ler.

### Exemplo completo: arrastar um cartão até uma zona

Um cartão é arrastado até uma zona de depósito. Se for solto sobre a zona, ele fica ali; se for solto em outro lugar, se o navegador cancelar o gesto ou se Esc for pressionada, ele volta ao seu lugar. Um só dedo por vez conduz o arrasto. Primeiro, o HTML e o CSS:

```html
<!-- A zona onde se solta, o cartão a arrastar e uma mensagem de estado -->
<div id="zona-deposito" class="zona-deposito">Soltar aqui</div>
<div id="cartao" class="cartao">Arraste-me</div>
<p id="estado">Nenhum arrasto em andamento</p>
```

```css
.cartao {
    width: 120px;
    padding: 12px;
    background: #e8eefc;
    cursor: grab;             /* mão aberta na passagem, com um mouse */
    touch-action: none;       /* o navegador não rola nem dá zoom aqui */
    user-select: none;        /* o texto do cartão não se seleciona */
}

.cartao.arrastando {
    cursor: grabbing;         /* mão fechada durante o arrasto */
    opacity: 0.8;             /* um pouco transparente: vê-se a zona por baixo */
}

.zona-deposito {
    height: 100px;
    border: 2px dashed #999;  /* moldura pontilhada */
}

.zona-deposito.passagem {
    border-color: #1a4fd6;    /* moldura azul quando o ponteiro está por cima */
}
```

`.cartao.arrastando` é um [seletor](/?c=langages&s=css&p=selecteurs) que mira um elemento que tem **ao mesmo tempo** as classes `cartao` e `arrastando`; `cursor` escolhe a forma do cursor do mouse; `opacity` regula a transparência (de `0`, invisível, a `1`, opaco); `user-select: none` proíbe a seleção do texto, que aconteceria se não ao arrastar com o mouse. O JavaScript guarda o estado do arrasto em algumas variáveis:

```javascript
const cartao = document.getElementById("cartao");
const zona = document.getElementById("zona-deposito");
const estado = document.getElementById("estado");

let ativo = null;     // pointerId do arrasto em curso, ou null se não houver nenhum
let posicaoX = 0;     // posição salva do cartão, em pixels
let posicaoY = 0;
let desvioX = 0;      // distância entre o ponteiro e o cartão no início
let desvioY = 0;
let novaX = 0;        // posição do cartão durante o arrasto
let novaY = 0;
```

Três pequenas funções decorrem disso. `transform: translate(x, y)` desloca um elemento na tela sem mexer no layout (ver [o posicionamento](/?c=langages&s=css&p=positionnement) e [as animações CSS](/?c=langages&s=css&p=animations-css-performantes)). As crases (`` ` ``) delimitam um texto em que `${x}` é substituído pelo valor de `x`. `document.elementsFromPoint(x, y)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/elementsFromPoint)) devolve a lista de todos os elementos presentes naquele ponto da janela, do mais alto ao mais baixo; `includes(zona)` responde `true` se a zona faz parte dela.

```javascript
function mover(x, y) {
    // As crases inserem x e y no texto: "translate(40px, 10px)"
    cartao.style.transform = `translate(${x}px, ${y}px)`;
}

function sobOPonteiro(x, y) {
    // Os elementos empilhados neste ponto: a zona é um deles?
    return document.elementsFromPoint(x, y).includes(zona);
}

function encerrar(depositado) {
    ativo = null;                          // nenhum arrasto em curso
    cartao.classList.remove("arrastando");
    zona.classList.remove("passagem");
    if (depositado) {
        posicaoX = novaX;                  // o cartão fica onde foi solto
        posicaoY = novaY;
        estado.textContent = "Cartão solto na zona";
    } else {
        mover(posicaoX, posicaoY);         // volta à posição de antes do arrasto
        estado.textContent = "Cartão devolvido ao seu lugar";
    }
}
```

Os ouvintes retomam os quatro eventos do ciclo de vida, mais a tecla Esc. `classList` e `textContent` são apresentados em [o capítulo sobre o DOM](/?c=langages&s=javascript&p=dom-et-evenements); `classList.toggle(nome, condicao)` põe a classe se a condição for verdadeira e a retira caso contrário.

```javascript
cartao.addEventListener("pointerdown", (evento) => {
    if (ativo !== null) return;            // já há um arrasto: ignoramos os outros dedos
    if (evento.button !== 0) return;       // mouse: somente o botão principal
    ativo = evento.pointerId;              // guardamos QUAL ponteiro arrasta
    desvioX = evento.clientX - posicaoX;   // a distância fica constante durante o arrasto
    desvioY = evento.clientY - posicaoY;
    cartao.setPointerCapture(ativo);       // o cartão recebe tudo, mesmo fora das bordas
    cartao.classList.add("arrastando");
    evento.preventDefault();               // sem eventos de mouse de compatibilidade
    estado.textContent = "Arrastando";
});

cartao.addEventListener("pointermove", (evento) => {
    if (evento.pointerId !== ativo) return;   // não é o ponteiro que arrasta
    novaX = evento.clientX - desvioX;         // o cartão segue o ponteiro
    novaY = evento.clientY - desvioY;
    mover(novaX, novaY);
    const acima = sobOPonteiro(evento.clientX, evento.clientY);
    zona.classList.toggle("passagem", acima);   // moldura azul se o ponteiro está na zona
});

cartao.addEventListener("pointerup", (evento) => {
    if (evento.pointerId !== ativo) return;
    // Solto sobre a zona: depósito; em outro lugar: volta ao lugar de origem
    encerrar(sobOPonteiro(evento.clientX, evento.clientY));
});

cartao.addEventListener("pointercancel", (evento) => {
    if (evento.pointerId === ativo) encerrar(false);   // gesto cancelado: volta
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && ativo !== null) {
        cartao.releasePointerCapture(ativo);   // devolve o acompanhamento aos outros
        encerrar(false);                       // cancelamento querido pelo usuário
    }
});
```

O que cada peça traz:

| Peça | Se a tirarmos |
|---|---|
| `setPointerCapture` | Com o mouse, um movimento rápido sai do cartão: ele para, e a soltura em outro lugar nunca chega até ele |
| `touch-action: none` | No celular, o dedo rola a página, o navegador envia `pointercancel`, e o cartão larga após alguns pixels |
| `pointercancel` escutado | O cartão fica preso no estado "arrastando" depois de um cancelamento pelo navegador |
| `ativo` e o teste de `pointerId` | Um segundo dedo (ou uma passagem de mouse sem pressionar) moveria o cartão |
| `elementsFromPoint` | `pointerenter` na zona não dispara durante a captura: a zona nunca saberia que o ponteiro está sobre ela |
| `releasePointerCapture` no Esc | O dedo ainda está posto: sem devolver a captura, o cartão continuaria recebendo todo o gesto |
| `preventDefault()` no `pointerdown` | Depois de um toque, o navegador enviaria ainda eventos de mouse de compatibilidade (`mousedown`...) |

`preventDefault()` no `pointerdown` só impede esses eventos de compatibilidade. Ele não substitui `touch-action` (a rolagem por toque) nem `user-select` (a seleção de texto com o mouse). Cada efeito incômodo tem seu próprio remédio:

| Efeito incômodo durante um arrasto | Remédio |
|---|---|
| A página rola sob o dedo | `touch-action: none` (CSS) |
| O texto se seleciona com o mouse | `user-select: none` (CSS) |
| Eventos de mouse chegam depois do toque | `preventDefault()` no `pointerdown` |
| O arrasto só funciona com mouse ou com dedo | Acrescentar um equivalente pelo teclado (ver [o foco pelo teclado](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)): um arrasto isolado exclui quem não consegue apontar |

### Vários dedos ao mesmo tempo

Usar vários dedos ao mesmo tempo chama-se **multitoque** (*multitouch*). Cada dedo posto cria **seu próprio ponteiro**, com seu `pointerId`, seus próprios `pointerdown`, `pointermove` e `pointerup`. O `pointerId` é portanto a chave para acompanhar cada dedo separadamente. O exemplo guarda a posição de cada dedo posto e calcula a distância entre dois dedos, a base de um gesto de pinça.

Alguns conceitos do exemplo. Um `Map` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)) é uma tabela que associa uma **chave** a um **valor**: `set(chave, valor)` acrescenta ou substitui, `has(chave)` testa a presença, `delete(chave)` remove, `size` dá o número de entradas. Os três pontos `[...dedos.values()]` copiam os valores do Map para uma lista, e `const [a, b] = ...` guarda os dois primeiros em `a` e `b` (ver [a desestruturação e o spread](/?c=langages&s=javascript&p=objets)). `Math.hypot(dx, dy)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot)) calcula a distância entre dois pontos cujas posições diferem de `dx` e de `dy`: é a raiz quadrada de `dx` ao quadrado mais `dy` ao quadrado (teorema de Pitágoras), a raiz quadrada de um número sendo aquele que, multiplicado por ele mesmo, dá esse número.

```html
<div id="superficie" class="superficie">Apoie dois dedos aqui</div>
<p id="informacao">0 ponteiro apoiado</p>
```

```css
.superficie {
    height: 200px;
    background: #e8eefc;
    touch-action: none;      /* sem isto, dois dedos rolam ou dão zoom na página */
}
```

```javascript
const superficie = document.getElementById("superficie");
const informacao = document.getElementById("informacao");

// Um Map associa uma chave (aqui o pointerId) a um valor (aqui a posição do dedo)
const dedos = new Map();

function exibir() {
    let texto = dedos.size + " ponteiro(s) apoiado(s)";   // size: número de entradas
    if (dedos.size === 2) {
        const [a, b] = [...dedos.values()];               // as duas posições
        const distancia = Math.hypot(a.x - b.x, a.y - b.y);   // distância entre dois dedos
        texto += ", distância: " + Math.round(distancia) + " px";
    }
    informacao.textContent = texto;
}

superficie.addEventListener("pointerdown", (evento) => {
    superficie.setPointerCapture(evento.pointerId);       // acompanhar este dedo sempre
    dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    exibir();
});

superficie.addEventListener("pointermove", (evento) => {
    if (!dedos.has(evento.pointerId)) return;             // este ponteiro não está apoiado
    dedos.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
    exibir();
});

function soltar(evento) {
    dedos.delete(evento.pointerId);                       // este dedo não está mais apoiado
    exibir();
}

superficie.addEventListener("pointerup", soltar);
superficie.addEventListener("pointercancel", soltar);     // um cancelamento retira o dedo
```

Retirar o dedo também em `pointercancel` é essencial: senão o Map guardaria um dedo fantasma, e `dedos.size` nunca voltaria a zero.

### `pointer-events`: deixar os cliques atravessarem

`pointer-events` é uma propriedade CSS que decide se um elemento pode ser o **alvo** de um ponteiro ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/pointer-events)). Para um elemento HTML, dois valores contam; o [capítulo sobre o SVG](/?c=langages&s=html&p=svg-dans-la-page) detalha os valores próprios das formas SVG (`all`, `stroke`...).

| Valor | Efeito |
|---|---|
| `auto` (padrão) | O elemento recebe os ponteiros normalmente |
| `none` | O elemento é **transparente** aos ponteiros: o clique ou o toque o atravessa e alcança o que está embaixo. Ele não recebe nenhum evento de ponteiro, nem passagem por cima (`:hover`) |

O caso típico é um enfeite posto **por cima** de um conteúdo clicável, como um véu em degradê que esmaece a parte de baixo de uma lista (ver [os degradês](/?c=langages&s=css&p=degrades)):

```html
<div class="moldura">
    <ul class="lista">
        <li><button>Artigo 1</button></li>
        <li><button>Artigo 2</button></li>
        <li><button>Artigo 3</button></li>
    </ul>
    <!-- Véu decorativo, posto por cima da parte de baixo da lista -->
    <div class="veu"></div>
</div>
```

```css
.moldura {
    position: relative;          /* referência de posicionamento para o véu */
}

.lista {
    height: 120px;
    overflow-y: auto;            /* barra de rolagem vertical se o conteúdo transbordar */
}

.veu {
    position: absolute;          /* posto por cima, sem ocupar espaço */
    left: 0;                     /* colado às bordas esquerda, direita e inferior */
    right: 0;
    bottom: 0;
    height: 40px;
    background: linear-gradient(transparent, #ffffff);   /* do transparente ao branco */
    pointer-events: none;        /* os cliques e os toques o atravessam */
}
```

Sem `pointer-events: none`, o véu interceptaria os cliques nos botões que ele esconde, e a rolagem com a roda do mouse sobre ele não rolaria mais a lista ([o posicionamento](/?c=langages&s=css&p=positionnement) explica `relative` e `absolute`). Três esclarecimentos:

| Esclarecimento | Detalhe |
|---|---|
| Os filhos podem voltar | Um filho de um elemento em `pointer-events: none` pode definir `pointer-events: auto`: só ele volta a ser clicável |
| O teclado não é afetado | Um botão em `none` continua alcançável pelo Tab e ativável pelo Enter. Para desativar um botão, use o atributo `disabled` (ver [os formulários](/?c=langages&s=html&p=formulaires)) |
| A busca por posição segue | `document.elementFromPoint` e `elementsFromPoint` ignoram os elementos em `none`, como um clique real faria |

### As armadilhas dos eventos de ponteiro

**Esquecer `pointercancel`.** Um arrasto que só termina em `pointerup` fica travado quando o navegador cancela o gesto (rolagem, chamada recebida, troca de aplicativo): o estado "arrastando" nunca se reinicia. Todo estado definido no `pointerdown` se desfaz em `pointerup` **e** `pointercancel`, o que faz a função `encerrar` do exemplo.

**Contar com `pointerleave` durante uma captura.** Ele não dispara enquanto o elemento captura (ver o esquema acima). Para saber o que está sob o ponteiro, use `document.elementsFromPoint`.

**Manter a captura quando ela não serve mais.** Ela é devolvida sozinha ao fim do gesto, mas um arrasto cancelado pelo usuário no meio do caminho (Esc) deixa o dedo posto: sem `releasePointerCapture`, o elemento continua recebendo todo o gesto. E `setPointerCapture` com um `pointerId` que não está mais ativo levanta um erro: chame-o durante o `pointerdown`.

**Supor que `mouse` existe.** Em um celular, `pointerType` vale `"touch"`: um código que testa `pointerType === "mouse"` não reage a nada. Em um computador com tela sensível ao toque, mouse e dedo coexistem. Raciocine por capacidade, não por aparelho: `window.matchMedia("(hover: hover)")` indica se a passagem por cima existe (ver [`matchMedia`](/?c=langages&s=javascript&p=api-de-page-du-navigateur)).

**Reagir só à passagem por cima.** Um dedo não tem passagem por cima: uma dica que só aparece em `pointerenter` nunca existe ao toque. Preveja um equivalente no pressionamento ou no teclado.

**O caso dos números decimais.** `clientX` e `clientY` podem ter uma parte decimal numa tela de alta densidade de pixels: arredonde-os (`Math.round`) antes de usá-los como posição de pixel inteira.

## O carregamento das fontes

### Por que o texto muda quando a fonte chega

Uma **fonte** (*font*) é o desenho das letras: sua forma, sua espessura (o **peso**, `400` para um texto normal, `700` para negrito). As fontes instaladas no aparelho, como Georgia ou Arial, são imediatamente utilizáveis. Uma **fonte web** é um arquivo que a página baixa, declarado no CSS pela regra `@font-face` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face)). Este capítulo não escolhe as fontes: para isso, veja [a tipografia](/?c=ui-ux&p=typographie).

A propriedade `font-family` dá uma **lista**: o navegador usa a primeira fonte disponível. Enquanto a fonte web é baixada, ele usa a seguinte, a **fonte de reserva** (*fallback*), ou não exibe nada, conforme a configuração de `font-display`. Quando o arquivo chega, ele substitui a fonte de reserva: o texto é redesenhado com outras larguras. O **arquivo de fonte** aqui está no formato WOFF2, um formato compactado feito para a web.

```css
@font-face {
    font-family: "Lora";            /* o nome que usaremos em seguida */
    src: url("/fontes/lora.woff2") format("woff2");   /* endereço do arquivo, e formato */
    font-weight: 700;               /* esta declaração fornece o peso negrito */
    font-display: swap;             /* veja a seção seguinte */
}

h2 {
    font-family: "Lora", Georgia, serif;   /* Lora, senão Georgia, senão serif */
    font-weight: 700;
}
```

`serif` é um nome de **família genérica**: qualquer fonte com serifas (pequenos traços nas extremidades das letras) do aparelho. O carregamento não começa na leitura do CSS: o navegador só baixa o arquivo **quando um texto da página precisa dele**, depois de calcular o layout. O esquema abaixo (valores de exemplo) mostra o que o usuário vê, e o que uma medição feita cedo demais informa:

```
Tempo ----------------------------------------------------------------------->

Página    | primeiro layout | espera do arquivo ......... | layout 2
Texto     | fonte de reserva (Georgia)                          | fonte web (Lora)
Largura   | "Novo": 61 px   |  medição feita AQUI: 61 px   | "Novo": 68 px
                                      (falsa: não é mais
                                       a fonte exibida)
```

Essa mudança de largura desloca tudo o que vem depois do texto: é um **salto de layout** (*layout shift*). Ela atrapalha a leitura, e falseia qualquer código que **mediu** o texto antes da chegada da fonte.

### `font-display`: o que mostrar durante a espera?

A propriedade `font-display`, posta em `@font-face` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display)), decide o que é exibido durante o download. Ela distingue um período de **bloqueio** (o texto fica invisível, para evitar o salto de layout) e um período de **troca** (a fonte de reserva aparece, substituída pela fonte web quando ela chega).

| Valor | Durante a espera | Se a fonte chega tarde | Uso típico |
|---|---|---|---|
| `auto` | Por escolha do navegador, em geral como `block` | Idem | Evitar: comportamento imprevisível |
| `block` | Texto **invisível** por alguns segundos, depois fonte de reserva | Troca na chegada | Uma fonte de ícones, em que a fonte de reserva seria ilegível |
| `swap` | Fonte de reserva **imediatamente** | Troca a qualquer momento | O texto corrido: ele se lê sem esperar |
| `fallback` | Texto invisível por um instante muito curto, depois fonte de reserva | Troca aceita só por alguns segundos | Meio-termo: sem grande salto tardio |
| `optional` | Texto invisível por um instante muito curto, depois fonte de reserva | A fonte web **não é aplicada** a esta página; serve para as visitas seguintes | Uma fonte de conforto, nunca indispensável |

As durações exatas ("alguns segundos", "instante muito curto") dependem do navegador. Uma consequência para o que segue: com `swap`, `fallback` e `optional`, a fonte exibida muda conforme o momento e a conexão. Um código que mede não deve, portanto, supor qual está exibida: ele espera o estado final e então mede o que está realmente na tela.

### `document.fonts`: acompanhar o carregamento

`document.fonts` é um objeto `FontFaceSet` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API)): o conjunto das fontes conhecidas da página, com meios para acompanhar o carregamento delas.

| Elemento | Natureza | Papel |
|---|---|---|
| `document.fonts.ready` | Promessa | Resolve-se quando o carregamento em curso termina e o layout está atualizado |
| `document.fonts.load(fonte)` | Função, devolve uma promessa | Inicia o carregamento da fonte descrita **e** o aguarda |
| `document.fonts.check(fonte)` | Função, devolve um booleano | `true` se a fonte está pronta, sem carregar nada |
| `new FontFace(nome, origem)` | Construtor | Descreve uma fonte em JavaScript, sem `@font-face` |
| `document.fonts.add(face)` | Função | Acrescenta uma `FontFace` ao conjunto: o CSS pode então usá-la |
| `document.fonts.status` | Texto | `"loading"` durante um carregamento, `"loaded"` do contrário |
| `loadingdone`, `loadingerror` | Eventos | Fim de um lote de carregamentos, ou falha de pelo menos um |

Uma **promessa** é um objeto que representa um resultado futuro; `await` aguarda esse resultado numa função `async` (ver [a programação assíncrona](/?c=langages&s=javascript&p=asynchrone)). Para esperar todas as fontes em carregamento:

```javascript
async function iniciar() {
    await document.fonts.ready;        // aguarda que as fontes em curso estejam prontas
    console.log("Fontes prontas");
}

iniciar();
```

`document.fonts.ready` aguarda o que **já está em curso**. Para pedir uma fonte precisa, `document.fonts.load()` recebe uma descrição na sintaxe da propriedade CSS `font`: um peso, um tamanho, um nome de família (`"700 18px Lora"`); um segundo argumento opcional dá o texto a exibir, útil quando a fonte é dividida por faixas de caracteres. `check()` recebe a mesma descrição.

```javascript
async function prepararTitulos() {
    const fonte = "700 18px Lora";        // peso, tamanho, família: como CSS font
    // true somente se a fonte estiver carregada (ou se nenhum @font-face a descrever)
    console.log(document.fonts.check(fonte));
    const faces = await document.fonts.load(fonte);   // inicia o carregamento e o aguarda
    console.log(faces.length);             // número de fontes carregadas: 1 aqui
    console.log(document.fonts.check(fonte));         // true: a fonte está pronta
}

prepararTitulos();
```

`load()` devolve uma lista de `FontFace`: **vazia** se nenhum `@font-face` corresponder (um erro no nome da família não produz nenhum erro), rejeitada se o arquivo não pôde ser baixado. O **peso pedido conta**: `"18px Lora"` carrega o peso normal, não o negrito.

### O objeto `FontFace`: carregar uma fonte pelo JavaScript

Quando o nome ou o endereço da fonte só são conhecidos durante a execução (uma escolha do usuário, uma fonte recebida de um servidor), `FontFace` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FontFace)) a declara pelo JavaScript. Seu `status` vale `"unloaded"`, `"loading"`, `"loaded"` ou `"error"`. Uma falha se captura com `try` / `catch` (ver [o tratamento de erros](/?c=langages&s=javascript&p=gestion-des-erreurs)).

```javascript
async function carregarFonte() {
    // new FontFace(nome, origem, opções) descreve a fonte sem ainda baixá-la
    const face = new FontFace("Lora", "url(/fontes/lora.woff2)", { weight: "700" });
    try {
        await face.load();                 // baixa; promessa rejeitada em caso de falha
        document.fonts.add(face);          // o CSS pode agora usar "Lora"
        console.log(face.status);          // "loaded"
    } catch (erro) {
        console.log("Fonte indisponível:", erro.name);   // a fonte de reserva continua
    }
}

carregarFonte();
```

### Reagir a cada lote: `loadingdone`

`ready` é uma promessa: ela serve uma única vez. Se outras fontes forem carregadas mais tarde (texto acrescentado à página, outro idioma), uma promessa já obtida não sabe disso. Os eventos `loadingdone` e `loadingerror` de `document.fonts` avisam **a cada lote**:

```javascript
document.fonts.addEventListener("loadingdone", (evento) => {
    // fontfaces: a lista das fontes que acabaram de ser carregadas
    console.log(evento.fontfaces.length + " fonte(s) carregada(s)");
});

document.fonts.addEventListener("loadingerror", () => {
    console.log("Pelo menos uma fonte não pôde ser carregada");
});
```

### Medir um texto depois da fonte

Várias ferramentas dão a **largura de um texto**. Todas medem o texto **como está exibido neste instante**: se a fonte web não chegou, medem a fonte de reserva, sem erro nem aviso.

| Ferramenta | O que mede | A armadilha antes da fonte |
|---|---|---|
| `canvas.measureText(texto).width` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)) | A largura de um texto com a fonte definida em `ctx.font` (ver [o canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)) | Um nome de fonte não carregado não é um erro: o canvas usa outra fonte, e não se redesenha sozinho |
| `elemento.getBoundingClientRect()` | O tamanho de um elemento HTML, com sua fonte atual | A largura de um texto com a fonte de reserva, ou mesmo de um texto invisível (`block`) |
| `elemento.getComputedTextLength()` | A largura de um `<text>` SVG (ver [o SVG](/?c=langages&s=html&p=svg-dans-la-page)) | Mesmo efeito: o fundo ajustado à largura errada |

O remédio é o mesmo para todas: **esperar a fonte, depois medir**. O exemplo ajusta o fundo de uma etiqueta SVG à largura do seu texto. O `<rect>` é o fundo; `rx` arredonda seus cantos; o texto é escrito em negrito na fonte `Lora`.

```html
<svg id="selo" viewBox="0 0 200 60" width="200" height="60">
    <!-- O fundo: sua largura será calculada pelo script (0 no início) -->
    <rect id="fundo-etiqueta" x="10" y="10" width="0" height="36" rx="6" fill="#e8eefc"/>
    <!-- O texto, em Lora negrito 18 px; x="22" deixa 12 de margem depois do fundo -->
    <text id="etiqueta" x="22" y="34" font-family="Lora, Georgia, serif"
          font-weight="700" font-size="18">Novo</text>
</svg>
```

```javascript
const etiqueta = document.getElementById("etiqueta");
const fundo = document.getElementById("fundo-etiqueta");
const MARGEM = 12;                         // espaço de cada lado do texto, em unidades

function ajustarFundo() {
    const largura = etiqueta.getComputedTextLength();   // largura do texto como exibido
    fundo.setAttribute("width", largura + 2 * MARGEM);   // o fundo ultrapassa de cada lado
}

async function iniciar() {
    try {
        // Pede a fonte exata do texto (negrito, 18 px) e aguarda sua chegada
        await document.fonts.load("700 18px Lora");
    } catch (erro) {
        console.log("Fonte não carregada: medimos a fonte de reserva");
    }
    ajustarFundo();                        // mede a fonte realmente exibida
}

iniciar();
```

No `catch`, a medição acontece mesmo assim: se o carregamento falhar, é a fonte de reserva que é exibida, e medi-la dá a largura certa. O princípio é medir **o que está na tela**, não a fonte que gostaríamos de ter.

Um canvas traz um problema a mais: é uma imagem em pixels, que **nunca se atualiza sozinha**. Um texto desenhado com a fonte de reserva continua assim, mesmo depois da chegada da fonte web. Espera-se então a fonte antes de desenhar, e redesenha-se a cada lote de fontes:

```javascript
// <canvas id="cartaz" width="200" height="60"> : a área de desenho
const canvas = document.getElementById("cartaz");
const ctx = canvas.getContext("2d");      // ctx: o objeto que desenha no canvas

async function desenhar() {
    const fonte = "700 24px Lora";
    // Uma falha é ignorada: desenharemos então com a fonte de reserva
    await document.fonts.load(fonte).catch(() => {});
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // apaga a imagem anterior
    ctx.font = fonte;                                   // mesma sintaxe que CSS font
    const largura = ctx.measureText("Liquidação").width;   // largura com esta fonte
    ctx.fillStyle = "#e8eefc";
    ctx.fillRect(10, 10, largura + 20, 40);             // fundo: x, y, largura, altura
    ctx.fillStyle = "#1a1a1a";
    ctx.fillText("Liquidação", 20, 38);                 // texto, base no ponto (20, 38)
}

desenhar();
document.fonts.addEventListener("loadingdone", desenhar);   // redesenha após cada lote
```

Para um **elemento HTML** cujo tamanho deve acompanhar o texto qualquer que seja a causa da mudança (fonte, idioma, janela), um `ResizeObserver` (ver [os observadores](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) chama o script a cada variação, sem que ele precise esperar as fontes por conta própria.

### As armadilhas do carregamento das fontes

**Medir cedo demais.** Uma medição feita logo que o script carrega, ou em `DOMContentLoaded` (o fim da leitura do HTML), costuma preceder a chegada da fonte: largura falsa, fundo mal ajustado, texto que transborda da moldura. Meça depois de `await document.fonts.load(...)`.

**Acreditar que `ready` basta.** `ready` só cobre o que **já está em curso**. Chamado muito cedo, antes de o navegador ter calculado o layout e descoberto que um texto precisa da fonte, ele pode já estar resolvido quando nada chegou:

```javascript
// Script executado muito cedo na página
document.fonts.ready.then(() => {
    // RUIM: pode executar antes mesmo de o download ter sido pedido
    console.log(document.fonts.status);    // "loaded", embora Lora ainda não tenha chegado
});

// BOM: pedir a fonte explicitamente, depois aguardar
document.fonts.load("700 18px Lora").then(() => {
    console.log("Lora chegou");
});
```

**Um nome de fonte errado ou ausente não produz erro.** `document.fonts.load("700 18px Lroa")` (erro de digitação) resolve-se com uma lista vazia, e `document.fonts.check("700 18px Lroa")` devolve `true`: nenhuma fonte declarada corresponde, portanto não há o que esperar. O texto é exibido na fonte de reserva, em silêncio. Verifique se `faces.length` não é `0` e se o nome é idêntico ao do `@font-face`.

**Um carregamento que falha.** Arquivo não encontrado, rede caída: `load()` rejeita sua promessa, o evento `loadingerror` dispara e o texto continua na fonte de reserva. Sem `try` / `catch` em volta do `await`, o erro interrompe a função **antes da medição**, que então nunca acontece. Além disso, `ready` não sinaliza a falha: é `load()` (ou `loadingerror`) que se deve escutar para saber.

**Pedir o peso errado.** `load("16px Lora")` só carrega o peso normal; um título em negrito (`700`) continua em espera. Peça exatamente a combinação de peso, estilo (`italic`) e tamanho que o texto usa.

**Definir `ctx.font` com outra fonte que não a da página.** A medição deixa de corresponder à exibição (ver [a armadilha do canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)).

## Síntese

| Necessidade | Ferramenta | Armadilha principal |
|---|---|---|
| Reagir do mesmo jeito a mouse, dedo, caneta | `pointerdown`, `pointermove`, `pointerup` | Supor que `pointerType` vale `"mouse"` |
| Reconhecer cada dedo | `pointerId` (um `Map` de pointerId para posição) | Esquecer de retirar o dedo em `pointercancel` |
| Arrastar sem perder o acompanhamento | `setPointerCapture` em `pointerdown` | Contar com `pointerleave`, que não chega durante a captura |
| Impedir a rolagem por toque durante um gesto | `touch-action: none` (ou `pan-y`, `pan-x`) | `preventDefault()` sozinho não basta; valor lido no início do gesto |
| Saber o que está sob o ponteiro | `document.elementsFromPoint(x, y)` | Um elemento em `pointer-events: none` fica ausente dela |
| Deixar um enfeite ser atravessado pelos cliques | `pointer-events: none` | Não desativa o teclado: `disabled` para um botão de verdade |
| Evitar o salto de layout de uma fonte | `font-display` em `@font-face` | `auto`: comportamento imprevisível |
| Esperar uma fonte precisa | `await document.fonts.load("700 18px Lora")` | O peso pedido deve corresponder ao do texto |
| Saber se as fontes em curso estão prontas | `await document.fonts.ready` | Já resolvida se nada foi pedido ainda |
| Reagir a cada lote de fontes | `loadingdone`, `loadingerror` | Uma promessa já obtida só dispara uma vez |
| Medir um texto | `measureText`, `getBoundingClientRect`, `getComputedTextLength` | Mede a fonte de reserva se a fonte web não chegou |
| Carregar uma fonte pelo script | `new FontFace(...)`, `face.load()`, `document.fonts.add(face)` | Capturar a falha: a fonte de reserva continua |

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Escrever o código duas vezes, com `mousedown` e `touchstart` | Código duplicado, comportamentos diferentes, eventos de compatibilidade que se sobrepõem | `pointerdown`, `pointermove`, `pointerup` |
| Não escutar `pointercancel` | O arrasto fica travado quando o navegador retoma o controle | Desfazer o estado em `pointerup` **e** `pointercancel` |
| Esquecer `touch-action` | No celular, o dedo rola a página: `pointercancel` após alguns pixels | `touch-action: none` (ou `pan-y`, `pan-x`) no elemento que se arrasta |
| `touch-action: none` em áreas grandes | A página não rola mais quando alguém a toca | Reservá-lo ao elemento que se arrasta |
| Contar com `preventDefault()` para a rolagem | A decisão é tomada antes dos eventos `pointermove` | `touch-action` em CSS |
| Não capturar o ponteiro com o mouse | Um movimento rápido sai do elemento, o arrasto é interrompido | `setPointerCapture(evento.pointerId)` em `pointerdown` |
| Capturar um ponteiro que não está mais ativo | O navegador levanta um erro | Capturar durante o `pointerdown` |
| Manter a captura depois de um cancelamento pelo Esc | O dedo ainda está posto: o elemento continua recebendo o gesto | `releasePointerCapture` |
| Esperar `pointerleave` ou `pointerenter` em outro lugar durante uma captura | Não disparam para os outros elementos | `document.elementsFromPoint(x, y)` |
| Reagir a um só ponteiro sem testar `pointerId` | Um segundo dedo, ou a passagem do mouse, perturba o arrasto | Guardar `pointerId` e ignorar os outros |
| Testar `pointerType === "mouse"` como regra geral | Um celular não tem mouse; um computador com tela sensível ao toque tem os dois | Raciocinar por capacidade (`matchMedia("(hover: hover)")`) |
| Prever uma passagem por cima sem equivalente ao toque | Um dedo não tem passagem por cima | Um equivalente no pressionamento ou no teclado |
| Reservar o arrasto ao ponteiro | Quem usa só o teclado fica excluído | Um equivalente pelo teclado |
| `pointer-events: none` para "desativar" um botão | O teclado ainda o ativa | O atributo `disabled` |
| Medir um texto antes da fonte | Largura da fonte de reserva | `await document.fonts.load(...)`, depois medir |
| Confiar em `document.fonts.ready` chamado muito cedo | Já resolvida se nenhuma fonte foi pedida ainda | `document.fonts.load("700 18px Lora")` |
| Acreditar que um nome de fonte errado produz erro | Nenhuma mensagem: `load()` devolve uma lista vazia, `check()` responde `true` | Verificar `faces.length` e a correspondência com `@font-face` |
| Não proteger `await document.fonts.load()` | Uma falha de download interrompe a função antes da medição | `try` / `catch`, depois medir mesmo assim |
| Não pedir o peso certo | `load("16px Lora")` não carrega o negrito | Mesmo peso, estilo e tamanho do texto |
| Desenhar um canvas uma só vez | A imagem nunca se atualiza: o texto continua na fonte de reserva | Esperar a fonte, redesenhar em `loadingdone` |
| Deixar `font-display: auto` | Texto invisível ou salto de layout imprevisíveis | `swap` para o texto corrido; `optional` para uma fonte de conforto |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Usar os eventos de ponteiro para todo gesto (arrastar, desenhar, pinçar) | Um só código para mouse, dedo e caneta |
| Manter `click` para ativar um botão ou um link | O teclado e os leitores de tela também o ativam |
| Capturar o ponteiro desde `pointerdown` para um arrasto | O acompanhamento continua mesmo fora do elemento |
| Desfazer o estado do arrasto numa função única chamada por `pointerup`, `pointercancel` e Esc | Nenhum caminho deixa a interface travada |
| Guardar o `pointerId` do arrasto e ignorar os outros | Um só gesto por vez, sem interferência |
| Definir `touch-action` em CSS desde a criação do elemento | O navegador lê o valor no início do gesto |
| Acrescentar uma alternativa pelo teclado a todo arrasto | Acessibilidade: um gesto de ponteiro não está ao alcance de todos |
| Usar `pointer-events: none` nos enfeites sobrepostos, `disabled` nos botões inativos | Os cliques atravessam o enfeite; o teclado fica bem desligado no botão |
| Escolher `font-display` explicitamente, `swap` para o texto corrido | Nenhum texto invisível, nenhum comportamento do navegador a adivinhar |
| Pedir a fonte precisa com `document.fonts.load("peso tamanho família")` antes de medir | A promessa diz respeito à fonte desejada, não apenas ao que já está em curso |
| Proteger a espera por `try` / `catch` e medir mesmo assim | A fonte de reserva exibida também é mensurável |
| Medir o que está exibido, nunca o que gostaríamos de exibir | A medição corresponde à tela |
| Redesenhar um canvas em `loadingdone` | O canvas não se atualiza sozinho |
| Preferir `ResizeObserver` para um elemento HTML cujo tamanho deve acompanhar seu texto | Cobre todas as causas de mudança, fontes incluídas |
| Testar com a fonte bloqueada ou lenta (rede limitada nas ferramentas de desenvolvedor) | O salto de layout só aparece com uma conexão lenta |

## O que reter

| | |
|---|---|
| **A reter** | Os eventos de ponteiro (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerenter`, `pointerout`, `pointerleave`) reúnem mouse, dedo e caneta: `pointerType` (`mouse`, `touch`, `pen`), `pointerId` (um por dedo), `isPrimary`, `clientX` e `clientY`, `pressure`. `setPointerCapture` faz um elemento acompanhar todo o gesto, mesmo fora das suas bordas, e se devolve sozinho no fim; `touch-action` (`none`, `pan-y`, `pan-x`) deixa o script, e não o navegador, cuidar do gesto por toque; `pointer-events: none` torna um elemento transparente aos cliques. Uma fonte web chega depois da primeira exibição: o texto então muda de largura. `font-display` regula o que aparece durante a espera; `document.fonts.ready` aguarda as fontes em curso, `document.fonts.load("peso tamanho família")` pede uma e a aguarda, `check` consulta sem carregar, `FontFace` e `document.fonts.add` carregam pelo JavaScript, `loadingdone` avisa a cada lote. `measureText`, `getBoundingClientRect` e `getComputedTextLength` medem a fonte exibida neste instante: espera-se a fonte antes de medir ou desenhar. |
| **Armadilhas a evitar** | `pointercancel` não escutado; `touch-action` esquecido (o dedo rola a página); `preventDefault()` tomado como remédio para a rolagem; `pointerleave` esperado durante uma captura; captura não devolvida após Esc; `pointerType === "mouse"` presumido; arrasto reservado ao ponteiro; `pointer-events: none` para desativar um botão; medição antes da fonte; `ready` chamado cedo demais; nome de fonte errado sem erro; falha de carregamento não tratada; peso errado pedido; canvas desenhado uma única vez. |
| **Boas práticas** | Um só código para todos os ponteiros; `click` para ativar, `pointerdown` para arrastar; captura em `pointerdown`, estado desfeito em `pointerup`, `pointercancel` e Esc; `touch-action` posto em CSS; alternativa pelo teclado; `font-display: swap` para o texto corrido; `document.fonts.load` preciso seguido de `try` / `catch` antes de qualquer medição; medir o que está exibido; redesenhar um canvas em `loadingdone`; `ResizeObserver` para um elemento HTML. |
