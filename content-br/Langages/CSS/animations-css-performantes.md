---
order: 9
---

# Animações CSS performáticas

Uma **animação** é uma mudança gradual da aparência de um elemento (posição, tamanho, transparência...) durante um tempo determinado. O [CSS](/?c=langages&s=css&p=css) consegue produzi-la sem nenhuma linha de [JavaScript](/?c=langages&s=javascript&p=javascript), mas nem todas as animações são iguais: algumas obrigam o navegador (o programa que exibe as páginas da web) a refazer muitos cálculos a cada instante, e a animação **engasga** (*jank*): as imagens chegam atrasadas e o movimento deixa de ser fluido. Este capítulo mostra como escrever uma animação, por que apenas duas propriedades são realmente baratas e como não incomodar as pessoas que o movimento deixa mal.

Ele supõe conhecidos [os seletores](/?c=langages&s=css&p=selecteurs) (incluindo a pseudo-classe `:hover`, que tem como alvo um elemento sob o ponteiro do mouse, e a classe `.nome`, que tem como alvo os elementos cujo atributo `class` contém esse nome), [o modelo de caixa](/?c=langages&s=css&p=box-model) e [o posicionamento](/?c=langages&s=css&p=positionnement). Os exemplos em JavaScript supõem conhecidos [o HTML](/?c=langages&s=html&p=html) (tag `<div>`, atributos `id` e `class`), [o DOM e os eventos](/?c=langages&s=javascript&p=dom-et-evenements), [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [as funções](/?c=langages&s=javascript&p=fonctions) (incluindo as funções de seta `=>`), [as condições](/?c=langages&s=javascript&p=conditions) e [as cadeias de caracteres](/?c=langages&s=javascript&p=strings) com crases.

## Duas propriedades em destaque: `transform` e `opacity`

Todo o capítulo gira em torno dessas duas propriedades. `opacity` regula a transparência, de `0` (invisível) a `1` (opaco). `transform` desloca, amplia ou gira o elemento **na exibição**, sem mexer no espaço que ele ocupa na página: seus vizinhos não se mexem, exatamente como acontece com `position: relative`, visto no [capítulo sobre o posicionamento](/?c=langages&s=css&p=positionnement). Um **pixel** é o menor ponto de uma tela; `px` é a unidade que conta os pixels.

| Valor de `transform` | Efeito | Exemplo |
|---|---|---|
| `translateX(d)` | Desloca na horizontal (positivo: para a direita, negativo: para a esquerda) | `translateX(30px)`: 30 pixels para a direita |
| `translateY(d)` | Desloca na vertical (positivo: para baixo) | `translateY(-20px)`: 20 pixels para cima |
| `scale(n)` | Multiplica o tamanho por `n` (1: sem mudança) | `scale(1.2)`: 120% do tamanho, `scale(0.5)`: a metade |
| `translate(x, y)` | Desloca nos dois sentidos ao mesmo tempo. Uma porcentagem é calculada sobre o tamanho do próprio elemento | `translate(-50%, -50%)`: metade da sua largura para a esquerda e metade da sua altura para cima |
| `rotate(a)` | Gira no sentido horário | `rotate(45deg)`: 45 graus (`deg`), `360deg` é uma volta completa |

Várias funções se combinam em um único valor: `transform: translateX(30px) scale(1.2);`. As durações são escritas com `s` (segundo) ou `ms` (milissegundo, um milésimo de segundo): `0.2s` equivale a `200ms`.

## `transition`: passar de um valor a outro

Uma **transição** anima a passagem de um valor a outro quando este muda: o navegador calcula sozinho todos os valores intermediários. Ela precisa de um gatilho: um hover (o cursor passando sobre o elemento), ou uma classe adicionada pelo [JavaScript](/?c=langages&s=javascript&p=dom-et-evenements) (`classList.add`). Quando o gatilho desaparece, a transição volta no sentido inverso.

```css
.botao {
    /* anima a propriedade `transform` em 0,2 s, com desaceleração no fim (ease-out) */
    transition: transform 0.2s ease-out;
}

.botao:hover {
    transform: scale(1.05);   /* ao passar o mouse: 5% maior, a transição anima a passagem */
}
```

| Propriedade | Função | Valor padrão |
|---|---|---|
| `transition-property` | Qual propriedade animar (`transform`, `opacity`...) | `all` (todas) |
| `transition-duration` | Duração da passagem | `0s` (instantâneo) |
| `transition-timing-function` | Curva de velocidade (ver a tabela mais abaixo) | `ease` |
| `transition-delay` | Espera antes de começar | `0s` |

O atalho `transition` reúne tudo na ordem: propriedade, duração, curva, atraso. Quando contém duas durações, a primeira é a duração e a segunda é o atraso.

## `@keyframes` e `animation`: uma sequência de etapas

Uma transição conhece apenas dois estados (antes e depois) e espera um gatilho. Para mais etapas, ou para uma animação que começa sozinha ao carregar a página, declaramos uma sequência de **quadros-chave** (*keyframes*, os momentos em que se fixa a aparência) com `@keyframes`, e depois a executamos com as propriedades `animation-*`.

| | `transition` | `@keyframes` + `animation` |
|---|---|---|
| Número de etapas | Duas (partida, chegada) | Quantas quisermos |
| Início | Uma mudança de valor (hover, classe) | Sozinho, assim que a regra se aplica |
| Repetição | Não | Sim (`animation-iteration-count`) |
| Uso típico | Reação a um hover ou a um clique | Aparição, carregamento, movimento contínuo |

```css
/* alvo : <div class="notificacao">Salvo</div> */
/* @keyframes declara uma animação nomeada “aparicao” (o nome é livre) */
@keyframes aparicao {
    from {                              /* from : o estado no começo (equivale a 0%) */
        opacity: 0;                     /* invisível */
        transform: translateY(20px);    /* deslocado 20 pixels para baixo */
    }
    to {                                /* to : o estado no fim (equivale a 100%) */
        opacity: 1;                     /* totalmente visível */
        transform: translateY(0);       /* no seu lugar normal */
    }
}

.notificacao {
    animation-name: aparicao;           /* qual sequência de etapas executar */
    animation-duration: 0.4s;           /* cada execução dura 0,4 s */
    animation-timing-function: ease-out;    /* velocidade: desacelera no fim */
    animation-delay: 0.5s;              /* espera 0,5 s antes de começar */
    animation-iteration-count: 1;       /* executa uma única vez */
    animation-direction: normal;        /* da primeira etapa até a última */
    animation-fill-mode: backwards;     /* aplica o estado inicial durante a espera */
}
```

| Propriedade | Função | Padrão | Valores comuns |
|---|---|---|---|
| `animation-name` | Nome do `@keyframes` a executar | `none` | `aparicao` |
| `animation-duration` | Duração de uma execução | `0s` | `0.4s`, `300ms` |
| `animation-timing-function` | Curva de velocidade | `ease` | `ease`, `linear`, `ease-out`... |
| `animation-delay` | Espera antes do início (um valor negativo começa no meio do caminho) | `0s` | `0.5s`, `-1s` |
| `animation-iteration-count` | Número de execuções | `1` | `3`, `0.5` (a metade), `infinite` |
| `animation-direction` | Sentido da reprodução | `normal` | `normal`, `reverse`, `alternate`, `alternate-reverse` |
| `animation-fill-mode` | O que aparece antes e depois da execução | `none` | `none`, `forwards`, `backwards`, `both` |
| `animation-play-state` | Execução ou pausa | `running` | `running`, `paused` |

| `animation-direction` | Efeito |
|---|---|
| `normal` | Cada execução vai do início ao fim |
| `reverse` | Cada execução vai do fim ao início |
| `alternate` | Ida, volta, ida... (a primeira execução vai no sentido normal) |
| `alternate-reverse` | Volta, ida... (a primeira execução vai no sentido inverso) |

| `animation-fill-mode` | Durante a espera (`animation-delay`) | Depois do fim |
|---|---|---|
| `none` (padrão) | Estilo normal do elemento | Volta ao estilo normal |
| `backwards` | Estado da primeira etapa | Volta ao estilo normal |
| `forwards` | Estilo normal do elemento | Permanece no estado da última etapa |
| `both` | Estado da primeira etapa | Permanece no estado da última etapa |

Sem `backwards` no exemplo acima, a notificação ficaria visível durante os 0,5 s de espera, depois sumiria bruscamente para reaparecer aos poucos. Ao contrário, uma animação que termina com `opacity: 0` volta a ficar visível no fim sem `forwards`.

| Curva (`timing-function`) | Velocidade |
|---|---|
| `ease` (padrão) | Início suave, meio rápido, fim suave |
| `linear` | Constante |
| `ease-in` | Lenta no início, depois rápida |
| `ease-out` | Rápida no início, depois desacelera |
| `ease-in-out` | Lenta no início e no fim |
| `cubic-bezier(a, b, c, d)` | Curva sob medida, ajustada por quatro números |
| `steps(n)` | `n` saltos bruscos, sem fluidez |

As outras grafias estão listadas na [página do MDN sobre `animation-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timing-function) (*MDN Web Docs*, a documentação de referência da web, editada pela Mozilla). O atalho `animation` reúne as propriedades em uma linha, em qualquer ordem, exceto pelas duas durações (a primeira é a duração, a segunda é o atraso). Com mais de duas etapas, cada uma recebe uma porcentagem do tempo:

```css
/* uma bolinha que cresce e depois diminui: três etapas distribuídas no tempo */
@keyframes pulsacao {
    0%   { transform: scale(1); }       /* no início: tamanho normal */
    50%  { transform: scale(1.3); }     /* no meio do caminho: 130% */
    100% { transform: scale(1); }       /* no fim: volta ao tamanho normal */
}

.carregamento {
    /* nome, duração, curva, repetição infinita: as quatro propriedades em uma linha */
    animation: pulsacao 1.2s ease-in-out infinite;
}
```

## Como o navegador desenha uma página

Uma tela exibe uma sequência de **quadros** (*frames*), como um filme. O número de quadros exibidos por segundo chama-se **taxa de quadros** (*FPS*, *frames per second*): a maioria das telas se atualiza 60 vezes por segundo ([web.dev](https://web.dev/articles/rendering-performance), o site de documentação do Google sobre a web). Como um segundo vale 1000 ms, o navegador dispõe de 1000 / 60, ou seja, cerca de **16,7 ms** para produzir cada quadro. Se levar mais tempo, ele pula um quadro e a animação engasga. Na prática, o navegador também tem trabalho a cada quadro: o web.dev aconselha mirar cerca de 10 ms para o código da página.

A **renderização** é o trabalho que transforma o HTML e o CSS em pixels. Ela acontece em etapas encadeadas, precedidas do cálculo dos estilos (qual regra CSS se aplica a qual elemento, veja [a cascata](/?c=langages&s=css&p=variables-et-cascade)):

| Etapa | Pergunta à qual responde | Observação |
|---|---|---|
| **Layout** (*disposição*) | Qual tamanho e qual posição para cada elemento? | Quase sempre diz respeito ao documento inteiro: mudar um elemento pode deslocar seus vizinhos e seus pais |
| **Pintura** (*paint*) | Qual cor terá cada pixel? (fundos, texto, bordas, sombras) | Costuma ser a etapa mais longa |
| **Composição** (*composite*) | Como empilhar as **camadas** (*layers*) em uma imagem? | A menos custosa. Uma camada é como uma folha transparente sobreposta: a **GPU** (a placa de processamento gráfico, veja [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu)) consegue movê-la ou torná-la transparente sem redesenhá-la |

```
CSS alterado
   |
   v
[ Layout ] --> [ Pintura ] --> [ Composição ] --> tela
 tamanho/posição  preencher       empilhar as
 de cada elemento os pixels       camadas (GPU)

width alterado     : layout --> pintura --> composição   (3 etapas)
color alterado     :            pintura --> composição   (2 etapas)
transform alterado :                        composição   (1 etapa)
```

As etapas são encadeadas: se uma precisar ser refeita, todas as seguintes também precisam. Conforme a propriedade que uma animação altera, o navegador precisa refazer, a cada quadro, uma, duas ou três etapas.

| Propriedade animada | Etapas refeitas a cada quadro |
|---|---|
| `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` | Layout, pintura, composição |
| `color`, `background-color`, `border-color`, `box-shadow` (sombra ao redor do elemento) | Pintura, composição |
| `transform`, `opacity` | Somente composição |

Para uma propriedade que não está nessa tabela, as ferramentas de desenvolvedor do navegador mostram as etapas refeitas (veja mais abaixo). A tabela supõe que o elemento que se move esteja em sua própria camada, o que o navegador costuma decidir sozinho durante uma animação CSS.

## Por que animar apenas `transform` e `opacity`

Segundo o [web.dev](https://web.dev/articles/animations-overview), estas são as duas únicas propriedades que os navegadores animam a baixo custo, por duas razões.

**Razão 1: nenhum layout nem pintura a refazer.** Animar `left` ou `width` obriga o navegador a recalcular a geometria a cada quadro, ou seja, 60 vezes por segundo, e a repintar. Animar `transform` exige apenas a composição.

**Razão 2: o trabalho pode sair da thread principal.** Uma **thread** (*fio de execução*) é uma sequência de instruções que o processador executa; um programa pode rodar várias em paralelo (veja [as threads em C](/?c=langages&s=c&p=threads)). A **thread principal** do navegador executa os estilos, o layout, a pintura e todo o JavaScript da página, [uma por vez](/?c=langages&s=javascript&p=asynchrone). Outra thread, o **compositor**, cuida apenas da composição. As animações CSS de `transform` e `opacity` podem rodar nessa thread: continuam mesmo quando a thread principal está ocupada (um cálculo longo em JavaScript, por exemplo).

```
Animar `left` ou `width`: a thread principal precisa trabalhar a cada quadro
  thread principal  : [layout][pintura]      [layout][pintura]...
  thread compositor :          [composição]                [composição]

Animar `transform` ou `opacity`: a thread principal continua livre
  thread principal  : livre para o JavaScript, os cliques, a rolagem
  thread compositor : [composição]  [composição]  [composição]...   (GPU)
```

A comparação com o mesmo movimento escrito de duas maneiras:

```css
/* as duas caixas têm o mesmo tamanho inicial */
.caixa-ruim, .caixa-boa {
    width: 100px;                       /* largura: 100 pixels */
    height: 100px;                      /* altura: 100 pixels */
    background-color: #1a4fd6;          /* fundo azul */
}

/* RUIM: left, width e height mudam o layout a cada quadro */
.caixa-ruim {
    position: relative;                 /* necessário para que `left` atue */
    /* infinite alternate: vaivém sem fim, para poder observar */
    animation: mover-esquerda 2s ease-in-out infinite alternate;
}
@keyframes mover-esquerda {
    from { left: 0;     width: 100px; height: 100px; }
    to   { left: 200px; width: 150px; height: 150px; }
}

/* BOM: um movimento e um aumento comparáveis, sem mexer no layout */
.caixa-boa {
    animation: mover-transform 2s ease-in-out infinite alternate;
}
@keyframes mover-transform {
    from { transform: translateX(0)     scale(1); }
    /* scale(1.5): 1,5 x 100 px = 150 px, aumentado a partir do centro */
    to   { transform: translateX(200px) scale(1.5); }
}
```

| Efeito desejado | A evitar (refaz o layout) | A preferir |
|---|---|---|
| Deslocar | `left`, `top`, `margin` | `transform: translateX()` / `translateY()` |
| Aumentar ou reduzir | `width`, `height` | `transform: scale()` |
| Fazer aparecer ou desaparecer | `height` ou `width` até `0` | `opacity` |
| Animar uma sombra | `box-shadow` | Colocar a sombra final em um [pseudo-elemento](/?c=langages&s=css&p=selecteurs) e animar a sua propriedade `opacity` |

Duas limitações de `scale`: ele também estica o conteúdo (o texto se deforma, os cantos arredondados também), por isso serve mais a formas e fundos do que a caixas de texto; e o espaço reservado na página não muda, então o elemento ampliado pode cobrir outros. Por fim, um `transform` em um ancestral tem efeitos colaterais sobre os filhos em `position: fixed`, descritos no [capítulo sobre o posicionamento](/?c=langages&s=css&p=positionnement).

O ganho real depende da página, do aparelho e do navegador: ele se mede (veja [Medir antes de otimizar](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)). O [guia do web.dev](https://web.dev/articles/animations-guide) descreve três ferramentas do **Chrome DevTools** (as ferramentas de desenvolvedor integradas ao Chrome, o navegador do Google) para verificar uma animação:

| Ferramenta (painel do DevTools) | O que mostra |
|---|---|
| *Performance*, aba *Summary* | Um valor de *Rendering* diferente de zero indica que a animação faz trabalho de layout |
| *Rendering*, caixa *FPS meter* | O número de quadros exibidos por segundo e os quadros pulados |
| *Rendering*, caixa *Paint Flashing* | As áreas repintadas a cada quadro (a tela inteira piscando: investigar) |

## `will-change`: avisar o navegador

`will-change` indica ao navegador quais propriedades vão mudar, para que ele prepare a camada com antecedência. Mas cada camada ocupa memória: usada mal, a propriedade deixa a página mais lenta em vez de mais rápida. O [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change) a apresenta como um **último recurso** contra um problema de desempenho já constatado, e não como uma precaução. Com `transform` ou `opacity`, ela também cria desde o início um contexto de empilhamento (veja o [capítulo sobre o posicionamento](/?c=langages&s=css&p=positionnement)).

```css
/* RUIM: pede uma camada para CADA elemento da página, para sempre */
* {
    will-change: transform;
}
```

O bom uso é colocá-la logo antes da animação e retirá-la logo depois. O atraso de 0,5 s da notificação dá aqui ao navegador tempo para se preparar:

```html
<!-- hidden: atributo que esconde o elemento (como display: none) enquanto estiver presente -->
<div id="notificacao" class="notificacao" hidden>Salvo</div>
```

```javascript
// Encontra a notificação na página
const notificacao = document.getElementById("notificacao");

function exibirNotificacao() {
    // 1. Antes: avisa o navegador (em JavaScript, `will-change` se escreve `willChange`)
    notificacao.style.willChange = "transform, opacity";
    // 2. Durante: exibe o elemento, o que inicia a animação `aparicao`
    notificacao.hidden = false;
    // 3. Depois: `animationend` é o evento emitido ao fim da animação CSS
    notificacao.addEventListener("animationend", () => {
        // `auto` devolve ao navegador o seu comportamento normal
        notificacao.style.willChange = "auto";
    }, { once: true });   // `once: true`: esta função só é chamada uma única vez
}
```

## `prefers-reduced-motion`: respeitar quem sente enjoo com o movimento

Algumas pessoas sofrem de distúrbios do **sistema vestibular** (o ouvido interno, que controla o equilíbrio): um movimento na tela, sobretudo um grande deslocamento ou um zoom, causa tontura, náusea e dores de cabeça, a ponto de às vezes obrigá-las a se deitar (segundo o [WCAG](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), as regras de acessibilidade da web de referência, cujos níveis A, AA e AAA são explicados no [capítulo sobre acessibilidade](/?c=ui-ux&p=accessibilite-ux)). Outras têm **epilepsia fotossensível**: certos piscares desencadeiam crises. O sistema operacional (Windows, macOS, Android... o software básico do aparelho) oferece uma opção « reduzir animações », que o CSS lê com a **media query** (condição `@media`, vista no [capítulo sobre o responsive design](/?c=langages&s=css&p=responsive-et-media-queries)) `prefers-reduced-motion`.

| Valor | Significado |
|---|---|
| `no-preference` | O usuário não pediu nada |
| `reduce` | O usuário pediu para reduzir o movimento |

A opção fica aqui, segundo o [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) (rótulos originais em inglês):

| Sistema | Caminho |
|---|---|
| Windows 11 | Settings > Accessibility > Visual Effects > Animation Effects |
| macOS | System Settings > Accessibility > Display (ou Motion) > Reduce motion |
| iOS | Settings > Accessibility > Motion |
| Android 9 ou superior | Settings > Accessibility > Remove animations |

Reduzir não significa suprimir tudo: retiram-se os grandes deslocamentos, os zooms, as rotações e os laços, e mantém-se uma mudança suave, como um fade. Voltemos a `.notificacao`:

```css
/* um fade apenas, sem movimento: substitui `aparicao` quando `reduce` é pedido */
@keyframes aparicao-suave {
    from { opacity: 0; }                /* invisível */
    to   { opacity: 1; }                /* visível */
}

/* @media: a regra só se aplica se a condição entre parênteses for verdadeira */
@media (prefers-reduced-motion: reduce) {
    .notificacao {
        animation-name: aparicao-suave;     /* sem deslizar para cima */
        animation-duration: 0.2s;           /* mais curto */
    }

    .carregamento {
        animation: none;                /* sem laço: a bolinha fica imóvel */
    }
}
```

Também se pode inverter a lógica: a animação só existe para quem não pediu nada, e tudo o que não for reconhecido fica imóvel.

```css
@media (prefers-reduced-motion: no-preference) {
    .carregamento {
        animation: pulsacao 1.2s ease-in-out infinite;   /* animada somente aqui */
    }
}
```

O [capítulo sobre o responsive design](/?c=langages&s=css&p=responsive-et-media-queries) apresenta uma regra global (durações reduzidas a `0.001ms`, que mantém os eventos `animationend`); este exemplo vai além, substituindo a animação por uma variante suave. Três critérios do WCAG tratam do movimento:

| Critério | Nível | Exigência |
|---|---|---|
| [2.3.1 Três flashes ou abaixo do limiar](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | A | Nada que pisque mais de três vezes por segundo (ou abaixo dos limiares definidos) |
| [2.2.2 Pausar, parar, ocultar](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | A | Um movimento automático com mais de cinco segundos, apresentado junto com outros conteúdos, deve poder ser pausado, parado ou ocultado (salvo se for essencial) |
| [2.3.3 Animação causada por interações](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | AAA | Um movimento disparado por uma interação pode ser desativado (salvo se for essencial) |

Para testar, o painel *Rendering* do DevTools permite emular `prefers-reduced-motion` ([documentação](https://developer.chrome.com/docs/devtools/rendering/emulate-css)).

## Armadilhas no código

A primeira armadilha afeta `transform`: dentro de um `@keyframes`, ele **substitui** o valor `transform` do elemento, e não se soma a ele.

```css
/* uma modal (janela colocada por cima da página), centralizada: translate(-50%, -50%) a puxa
   de volta pela metade de SUA largura e pela metade de SUA altura */
.modal-ruim, .modal-bom {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.modal-ruim { animation: zoom-ruim 0.3s backwards; }
.modal-bom  { animation: zoom-bom 0.3s backwards; }

/* RUIM: este valor substitui o translate, a modal perde a centralização */
@keyframes zoom-ruim {
    from { transform: scale(0.8); }
}

/* BOM: repetimos o translate na etapa inicial, depois acrescentamos o scale */
@keyframes zoom-bom {
    from { transform: translate(-50%, -50%) scale(0.8); }
}
```

A segunda armadilha é uma animação de tamanho: se uma faixa cresce em altura, tudo o que vem depois dela no fluxo normal (veja o [posicionamento](/?c=langages&s=css&p=positionnement)) desce a cada quadro, e o texto que estamos lendo pula. A solução é tirá-la do fluxo com `position: fixed`.

```css
/* RUIM: a altura cresce, tudo o que está embaixo é empurrado a cada quadro */
.faixa-ruim {
    height: 0;
    animation: abrir 0.4s forwards;     /* forwards: permanece aberta no fim */
}
@keyframes abrir {
    to { height: 60px; }
}

/* BOM: a faixa fica por cima (fixed), o resto da página nunca se mexe */
.faixa-boa {
    position: fixed;                    /* fora do fluxo, presa à janela */
    top: 0;
    left: 0;
    right: 0;
    height: 60px;                       /* seu tamanho final é reservado desde o início */
    animation: descer 0.4s backwards;
}
@keyframes descer {
    from { transform: translateY(-100%); }  /* -100% da sua altura: logo fora da tela */
}
```

A terceira é `transition: all`, que anima toda propriedade que muda, inclusive as que não foram previstas. `all` também é o valor padrão de `transition-property` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-property)): escrever `transition: 0.3s` sem nome de propriedade equivale a `transition: all 0.3s`.

```css
/* RUIM: se um script mudar `width` ou `margin`, o layout também é animado */
.botao-tudo { transition: all 0.3s; }

/* RUIM também: sem nome de propriedade, o valor padrão é `all` */
.botao-implicito { transition: 0.3s; }

/* BOM: somente as propriedades desejadas, separadas por vírgula */
.botao-preciso { transition: transform 0.3s, opacity 0.3s; }
```

A última é animar em JavaScript com `setInterval` (uma função que chama outra a intervalo fixo, em comparação com `requestAnimationFrame`, visto no capítulo sobre as [animações em canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)). Isso acumula defeitos: o código roda na thread principal, não está sincronizado com a atualização da tela, e `left` refaz o layout a cada chamada.

```javascript
// Encontra a caixa (uma <div id="caixa-js"> em `position: relative`)
const caixa = document.getElementById("caixa-js");
let esquerda = 0;                       // posição horizontal atual, em pixels

// RUIM: chamada a cada 16 ms, sem relação com a tela
setInterval(() => {
    esquerda += 2;                      // `+= 2` soma 2 a `esquerda`
    caixa.style.left = esquerda + "px"; // `+` junta “px”; `left` refaz o layout
}, 16);
```

A boa solução é uma animação CSS (`transition` ou `@keyframes`), que o navegador otimiza sozinho, inclusive reduzindo a frequência de uma animação em uma aba não visível ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using)). Se o JavaScript for indispensável (animação controlada pelo mouse, por exemplo), usa-se [`requestAnimationFrame`](/?c=langages&s=javascript&p=canvas-2d-et-animations) (que chama uma função logo antes da próxima atualização da tela) e `transform`, ou a API [`element.animate()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate), que permite ao navegador otimizar como no CSS.

```javascript
let inicio = null;                      // instante da primeira chamada, anotado no começo

function avancar(agora) {               // `agora`: instante dado pelo navegador (ms)
    if (inicio === null) inicio = agora;        // anota o início na primeira chamada
    // Math.min mantém o menor dos dois números: a caixa para em 200 pixels
    const esquerda = Math.min((agora - inicio) / 10, 200);   // 1 pixel a cada 10 ms
    // as crases inserem o valor de `esquerda` no texto, no lugar de ${esquerda}
    caixa.style.transform = `translateX(${esquerda}px)`;     // transform, não left
    if (esquerda < 200) requestAnimationFrame(avancar);      // agenda o próximo quadro
}
requestAnimationFrame(avancar);         // inicia
```

## Resumo das propriedades

| Propriedade | Natureza | Valores | Serve para |
|---|---|---|---|
| `transition` | Atalho | `transform 0.2s ease-out` | Animar a passagem entre dois valores |
| `@keyframes` | Regra | Etapas `from`/`to` ou em `%` | Descrever uma sequência de etapas |
| `animation` (e `animation-*`) | Atalho | Nome, duração, curva, atraso, repetição... | Executar uma sequência de etapas |
| `animation-play-state` | Propriedade | `running`, `paused` | Pausar ou retomar |
| `transform` | Propriedade | `translateX()`, `scale()`, `rotate()` | Deslocar, ampliar, girar (composição) |
| `opacity` | Propriedade | `0` a `1` | Regular a transparência (composição) |
| `will-change` | Propriedade | `transform`, `opacity`, `auto` | Preparar uma camada, como último recurso |
| `@media (prefers-reduced-motion)` | Media query | `reduce`, `no-preference` | Adaptar o movimento à configuração do sistema |

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Animar `left`, `top`, `width`, `height` ou `margin` | Layout e pintura refeitos a cada quadro. Usar `transform` |
| Animar `box-shadow` ou uma cor em um elemento grande | A pintura é refeita a cada quadro. Animar a propriedade `opacity` de um pseudo-elemento |
| `transition: all` ou `transition: 0.3s` | Toda propriedade que muda é animada, inclusive o layout. Nomear as propriedades |
| `will-change` posto em tudo, ou nunca retirado | Cada camada custa memória. Colocar antes, retirar depois, como último recurso |
| Animação que muda o tamanho de um elemento do fluxo | O conteúdo abaixo pula a cada quadro. Reservar o espaço, animar `transform` |
| `transform` do `@keyframes` que sobrescreve o do elemento | O centralizado ou a rotação inicial desaparecem. Repetir o valor base |
| Esquecer `animation-fill-mode` | Elemento visível durante a espera, ou retorno brusco ao fim |
| Animação `infinite` em um conteúdo que não precisa se mover | Distração, bateria consumida, incômodo vestibular. Reservar para indicadores úteis (carregamento) |
| Conteúdo que pisca mais de três vezes por segundo | Risco de crise de epilepsia fotossensível (WCAG 2.3.1) |
| Animar com `setInterval` e `left` | Thread principal sobrecarregada, ritmo sem relação com a tela. CSS, ou `requestAnimationFrame` e `transform` |
| Ignorar `prefers-reduced-motion` | Náusea e tontura para alguns usuários |
| `animation: none` quando o código espera `animationend` | O evento nunca chega. Reduzir a duração (veja o capítulo sobre o responsive design) |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Animar `transform` e `opacity` somente | Composição apenas, trabalho possível fora da thread principal |
| `transition` para uma reação, `@keyframes` para uma sequência | Cada ferramenta no seu caso, sem JavaScript |
| Nomear as propriedades de uma transição | Nenhuma animação involuntária |
| Visar 60 quadros por segundo (16,7 ms por quadro) | É o ritmo de uma tela comum |
| Verificar nas ferramentas do navegador em vez de presumir | Só a medição diz se a animação é fluida |
| Colocar `will-change` logo antes e retirá-lo logo depois | Memória liberada, camada preparada a tempo |
| Prever uma variante de `prefers-reduced-motion` para cada movimento | Trocar os grandes deslocamentos por um fade |
| Reservar o espaço de um elemento animado antes da animação | Nenhum deslocamento do conteúdo |
| Limitar os laços aos indicadores úteis, com pausa possível após 5 s | Menos distração (WCAG 2.2.2) |

## O que reter

| | |
|---|---|
| **O que reter** | `transition` anima dois estados, `@keyframes` anima mais etapas. A renderização encadeia layout, pintura e composição: `transform` e `opacity` precisam apenas da composição, que pode sair da thread principal. Uma tela a 60 quadros por segundo deixa cerca de 16,7 ms por quadro. `will-change` é um último recurso, posto e depois retirado. `prefers-reduced-motion: reduce` substitui o movimento por uma mudança suave. |
| **Armadilhas a evitar** | Animar `left`, `width` ou `margin`; `transition: all`; `will-change` em tudo; animação de tamanho que empurra o conteúdo; `transform` do `@keyframes` que sobrescreve o existente; `fill-mode` esquecido; laços inúteis; `setInterval`; ignorar `prefers-reduced-motion`. |
| **Boas práticas** | `transform` e `opacity` apenas, propriedades nomeadas nas transições, espaço reservado, variante suave para `reduce`, verificação nas ferramentas do navegador, `will-change` raro e temporário. |
