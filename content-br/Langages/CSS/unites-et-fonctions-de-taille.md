---
order: 10
---

# As unidades CSS e as funções de tamanho: de `rem` a `clamp()` (28/10/2026)

Cada tamanho escrito em CSS (a largura de uma coluna, o tamanho de um texto, o espaço entre dois blocos) é um **número seguido de uma unidade**: em `16px`, 16 é o número e `px` a unidade. A escolha da unidade decide o que a página se torna quando a tela muda, quando o usuário dá **zoom** (amplia a página inteira) ou quando ele ajusta **o tamanho da fonte do seu navegador** (o programa que exibe as páginas web). Este capítulo explica cada unidade, as funções que calculam um tamanho (`calc()`, `min()`, `max()`, `clamp()`), a armadilha de `100vh` no celular e, depois, o que fazer para que uma página continue utilizável quando o texto é ampliado para 200% ou 300%.

| Tema | Pergunta à qual ele responde | Seção |
|---|---|---|
| As unidades | A que se refere cada unidade (`px`, `em`, `rem`, `%`, `vw`, `ch`...)? | [As unidades relativas](#as-unidades-relativas-a-que-cada-uma-se-refere) |
| `em` e `rem` | Por que `em` se acumula, e por que `rem` respeita o ajuste do usuário? | [`em` e `rem`](#em-pratico-mas-ele-se-acumula) |
| Janela no celular | Por que `100vh` ultrapassa a tela de um celular? | [As unidades de janela no celular](#as-unidades-de-janela-no-celular-o-problema-de-100vh) |
| As funções | Como calcular, limitar ou tornar fluido um tamanho? | [As funções de tamanho](#as-funcoes-de-tamanho-calc-min-max-e-clamp) |
| Ampliação | O que exige o WCAG, e como fazer uma página se manter legível a 200% e 300%? | [Aumentar o texto](#aumentar-o-texto-a-200-e-300-o-que-exige-o-wcag) |

Ele pressupõe que você já conheça [a sintaxe de uma regra CSS](/?c=langages&s=css&p=selecteurs) (um **seletor** designa os elementos a estilizar, depois ajustes são escritos entre chaves na forma `propriedade: valor;`), [o modelo de caixa](/?c=langages&s=css&p=box-model) (`width`, `padding`, `margin`) e [as variáveis CSS](/?c=langages&s=css&p=variables-et-cascade) (`var(--nome)` lê um valor declarado uma vez por todas). O capítulo sobre [o responsivo e as media queries](/?c=langages&s=css&p=responsive-et-media-queries) já apresenta `px`, `%`, `em`, `rem`, `vw` e `vh` em poucas linhas: aqui, completamos sem explicá-los de novo.

## Um valor CSS: um número e uma unidade

```css
p {
    font-size: 16px;        /* font-size: o tamanho do texto; valor: 16 e a unidade px */
    margin-bottom: 1.5em;   /* margin-bottom: o espaço sob o parágrafo; unidade: em */
    width: 60%;             /* width: a largura; % também é uma unidade */
    line-height: 1.5;       /* line-height: a altura de uma linha; aqui sem unidade */
}
```

Um **pixel** é o menor ponto de uma tela. O **pixel CSS** (`px`) é a unidade base do CSS: não é necessariamente um ponto físico da tela. Em uma tela muito fina, um pixel CSS é desenhado com vários pontos; e quando se dá zoom, o navegador desenha cada pixel CSS com ainda mais pontos. A seguir, "pixel" sempre designa o pixel CSS, salvo menção em contrário.

Distinguem-se duas famílias de unidades:

| Família | Definição | Exemplos |
|---|---|---|
| **Absoluta** | Vale sempre o mesmo comprimento, independentemente do que há ao redor | `px`, e para a impressão `cm`, `mm`, `in` (polegada), `pt` (ponto) |
| **Relativa** | Calcula-se a partir de uma **referência**: o tamanho de uma fonte, o do pai, o da janela | `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex`, `lh` |

As unidades de impressão estão ligadas ao pixel por fatores fixos: 1 `in` = 96 `px`, logo 12 `pt` = 12 × 96 / 72 = 16 `px`. Uma página web raramente as usa; a lista completa está na [página MDN dos comprimentos](https://developer.mozilla.org/en-US/docs/Web/CSS/length).

## As unidades relativas: a que cada uma se refere

A **janela de visualização** (*viewport*) é a área da página visível no navegador, sem as barras nem os menus. A **raiz** é o elemento `<html>`, ancestral de todos os outros (ver [as tags HTML](/?c=langages&s=html&p=structure-dun-document)); o CSS a designa por `:root` (ver [as variáveis](/?c=langages&s=css&p=variables-et-cascade)).

| Unidade | Refere-se a | Uso típico |
|---|---|---|
| `em` | O tamanho da fonte **do elemento** (para a propriedade `font-size` em si: o do **pai**, isto é, do elemento que o contém) | Espaços que acompanham o tamanho do texto (`padding` de um botão) |
| `rem` | O tamanho da fonte **da raiz** ("*root em*") | Tamanhos de fonte, espaçamentos gerais |
| `%` | Depende da propriedade (tabela seguinte) | Larguras, tamanhos relativos ao pai |
| `vw` | 1% da **largura** da janela de visualização | Larguras ligadas à tela |
| `vh` | 1% da **altura** da janela de visualização | Alturas ligadas à tela (ver a seção sobre celular) |
| `vmin` | 1% do **menor** dos dois lados da janela | Um quadrado que sempre cabe na tela |
| `vmax` | 1% do **maior** dos dois lados da janela | Um fundo que sempre cobre a tela |
| `ch` | A largura do **algarismo 0** na fonte do elemento | Largura de uma linha de texto (`65ch`: cerca de 65 caracteres) |
| `ex` | A altura da letra **x minúscula** da fonte | Alinhar um ícone às minúsculas (raro) |
| `lh` | A altura de **uma linha** de texto do elemento (seu valor de `line-height`) | Um espaço vertical igual a uma linha |

A porcentagem não tem uma referência única:

| Propriedade | `%` se calcula sobre | Exemplo |
|---|---|---|
| `width` | A largura do pai | `width: 50%`: a metade do pai |
| `height` | A altura do pai, **somente se** ela estiver fixada explicitamente (senão o valor é ignorado e a altura permanece automática) | `height: 100%` |
| `font-size` | O tamanho da fonte do pai | `font-size: 150%`: 1,5 vez o do pai |
| `padding`, `margin` | A **largura** do pai, mesmo para o topo e a base | `padding-top: 10%` |

```css
.quadrado {
    width: 50vmin;           /* 50% do menor lado da janela */
    height: 50vmin;          /* mesmo valor: o bloco é, portanto, um quadrado */
}

.artigo {
    /* no máximo 65 larguras de "0": cerca de 65 caracteres por linha */
    max-width: 65ch;
    margin-bottom: 1lh;      /* um espaço igual à altura de uma linha de texto */
}
```

Em um telefone cuja janela tem 390 pixels de largura por 844 de altura (valores de exemplo), o menor lado é 390: `50vmin` vale 195 pixels. Girado em **modo paisagem** (a tela é mais larga que alta: 844 de largura, 390 de altura), o menor lado continua sendo 390: o quadrado mantém seus 195 pixels e, portanto, sempre cabe na tela.

| Unidade | Em uma janela de 390 × 844 | Em uma janela de 1280 × 800 |
|---|---|---|
| `10vw` | 39 px | 128 px |
| `10vh` | 84,4 px | 80 px |
| `10vmin` | 39 px | 80 px |
| `10vmax` | 84,4 px | 128 px |

O comprimento de uma linha de texto tem efeito direto na leitura: o capítulo [Tipografia](/?c=ui-ux&p=typographie) recomenda de 50 a 75 caracteres, o que `max-width: 65ch` garante melhor do que uma largura em pixels, pois `ch` acompanha a fonte escolhida. `ch`, `ex` e `lh` se apoiam na fonte e na entrelinha do elemento: seu valor em pixels depende, portanto, da fonte carregada e não se adivinha sem exibi-la. Essas unidades estão disponíveis nos navegadores atuais (28/10/2026).

## `em`: prático, mas ele se acumula

`em` tem dois sentidos conforme a propriedade. Para `font-size`, ele se refere ao tamanho da fonte do **pai**. Para todas as outras propriedades (`padding`, `width`, `margin`...), ele se refere ao tamanho da fonte **do próprio elemento**. É esse efeito que faz os espaçamentos de um botão serem proporcionais ao seu texto:

```css
.botao {
    /* texto de 1,25 vez o tamanho da raiz: 20 px se ela tiver 16 px */
    font-size: 1.25rem;
    /* alto e baixo: 0,5 × 20 = 10 px; esquerda e direita: 1 × 20 = 20 px */
    padding: 0.5em 1em;
}
```

Se o usuário ajustar o tamanho da fonte do seu navegador para 24 pixels (em vez de 16), o texto do botão passa para 1,25 × 24 = 30 px e os espaços para 15 px e 30 px: o botão continua proporcional. Esse é o bom uso de `em`.

A armadilha aparece com `font-size` em elementos **aninhados** (colocados uns dentro dos outros): cada nível multiplica o tamanho do seu pai, então os efeitos se acumulam.

```html
<!-- Três blocos aninhados: cada um é o filho do anterior, a mesma classe em todos -->
<div class="nivel">Nível 1
    <div class="nivel">Nível 2
        <div class="nivel">Nível 3</div>
    </div>
</div>
```

```css
html {
    font-size: 100%;         /* a raiz: 16 px com o ajuste padrão */
}

.nivel {
    font-size: 1.5em;        /* 1,5 vez o tamanho da fonte do PAI */
}
```

```
html                       16 px      (tamanho da raiz)
 └─ .nivel (nível 1)       16 × 1,5 = 24 px
     └─ .nivel (nível 2)   24 × 1,5 = 36 px
         └─ .nivel (nível 3)   36 × 1,5 = 54 px     o texto cresce a cada nível
```

Com `font-size: 1.5rem` no lugar, os três níveis dariam 24 pixels: `rem` se refere sempre à raiz, qualquer que seja a profundidade.

| | `em` | `rem` |
|---|---|---|
| Referência de `font-size` | O pai (varia a cada nível) | A raiz (sempre a mesma) |
| Referência das outras propriedades | A fonte do elemento | A fonte da raiz |
| Risco | Acúmulo nos elementos aninhados (listas dentro de listas, componentes encaixados) | Nenhum acúmulo |
| Escolher para | `padding`, `margin` ou `gap` que devem acompanhar **o texto do mesmo elemento** | Os tamanhos de fonte, e os espaços que não dependem de um texto específico |

## `rem` e o ajuste do usuário

Todo navegador tem um **tamanho de fonte padrão**, 16 pixels enquanto ninguém o altera. O usuário pode mudá-lo nas configurações de aparência ou de fontes do seu navegador: uma pessoa com baixa visão o aumenta para 24, 32 pixels ou mais, e espera que **todos** os sites acompanhem. A raiz retoma esse valor: é ele que `rem` usa.

O ponto essencial: um tamanho escrito em **pixels** não segue esse ajuste; um tamanho em `rem` segue.

| Ajuste do usuário | `font-size: 16px` | `font-size: 1rem` | `font-size: 1.125rem` |
|---|---|---|---|
| 16 px (padrão) | 16 px | 16 px | 18 px |
| 24 px (150%) | 16 px | 24 px | 27 px |
| 32 px (200%) | 16 px | 32 px | 36 px |
| 48 px (300%) | 16 px | 48 px | 54 px |

Uma página feita só de pixels continua, portanto, minúscula para quem pediu um texto 200% maior: seu ajuste é ignorado. Não é um defeito do **zoom**: ampliar com o teclado (Ctrl e `+`, ou ⌘ e `+` no Mac) também amplia os pixels. Só o **ajuste do tamanho da fonte** os deixa inalterados (ver [a seção sobre as duas formas de aumentar](#duas-formas-de-aumentar-o-zoom-e-o-tamanho-da-fonte)). É preciso, portanto, deixar também a raiz seguir esse ajuste:

```css
/* BOM: 100% do tamanho escolhido pelo usuário (16 px se nada foi ajustado) */
html {
    font-size: 100%;
}
```

```css
/* EVITAR: fixa 16 px seja qual for o ajuste do usuário: rem deixa de segui-lo */
html {
    font-size: 16px;
}
```

Os tamanhos de fonte das maquetes costumam ser dados em pixels (ver [Tipografia](/?c=ui-ux&p=typographie)): convertem-se dividindo por 16.

| Maquete | Cálculo | Em CSS |
|---|---|---|
| 14 px | 14 / 16 | `0.875rem` |
| 16 px | 16 / 16 | `1rem` |
| 18 px | 18 / 16 | `1.125rem` |
| 24 px | 24 / 16 | `1.5rem` |
| 32 px | 32 / 16 | `2rem` |
| 48 px | 48 / 16 | `3rem` |

Os pixels continuam reservados ao que **não** deve crescer com o texto: uma borda fina (`1px solid`), um traço de sombra.

## As unidades de janela no celular: o problema de `100vh`

No celular, a **barra de endereço** (a área do navegador que mostra o endereço da página) diminui ou desaparece quando se rola para baixo, e reaparece quando se sobe. A área visível da página muda, portanto, de altura durante a leitura. Ora, `vh` continuou, nos navegadores de celular, calculado sobre a **maior** altura possível, com a barra oculta. Um bloco `height: 100vh` fica então alto demais enquanto a barra estiver visível: sua base (um botão, por exemplo) se encontra sob a borda da tela, fora do alcance sem rolar.

O CSS acrescentou, então, três famílias de unidades, cada uma designando um estado da barra:

| Unidade | Nome | Refere-se à altura... | Muda durante a rolagem? |
|---|---|---|---|
| `svh` | *small viewport height* | Da **pequena** janela: barra de endereço visível | Não |
| `lvh` | *large viewport height* | Da **grande** janela: barra de endereço oculta | Não |
| `dvh` | *dynamic viewport height* | Da janela **atual**: acompanha a barra ao vivo | Sim |
| `vh` | *viewport height* | Na prática, a mesma coisa que `lvh` no celular | Não |

Eis o esquema, para uma tela cuja área total tem 800 pixels e a barra de endereço 60 pixels (valores de exemplo):

```
BARRA VISÍVEL (página no topo)
+----------------------------+
| barra de endereço: 60 px   |
+----------------------------+   <- topo da área visível
|                            |     ^
|        área visível        |     |  100svh = 740 px
|                            |     |  100dvh = 740 px (acompanha a barra)
+----------------------------+     v  <- base da tela
   60 px fora da tela ............... 100lvh = 800 px: ultrapassa 60 px

BARRA OCULTA (após rolar para baixo)
+----------------------------+   <- topo da tela = topo da área visível
|                            |     ^
|        área visível        |     |  100lvh = 800 px
|                            |     |  100dvh = 800 px (acompanha a barra)
|                            |     |  100svh = 740 px: 60 px a menos
+----------------------------+     v  <- base da tela
```

| Estado da barra | `100svh` | `100lvh` (e `100vh`) | `100dvh` |
|---|---|---|---|
| Visível | 740 px | 800 px (60 px fora da tela) | 740 px |
| Oculta | 740 px | 800 px | 800 px |

No computador, nenhuma barra se recolhe: as quatro unidades valem a mesma altura. Os mesmos prefixos existem para a largura (`svw`, `lvw`, `dvw`) e para `vmin` e `vmax`; como a largura não varia com a barra de endereço, são encontrados raramente.

Os navegadores recentes entendem `svh`, `lvh` e `dvh` (28/10/2026). Para um navegador antigo, escreve-se primeiro o valor antigo e depois o novo: um navegador que não conhece a unidade ignora a linha que não entende e mantém a anterior.

```css
.abertura {
    height: 100vh;           /* alternativa: um navegador antigo para aqui */
    height: 100dvh;          /* um navegador recente substitui a linha anterior */
}
```

| Necessidade | Unidade indicada | Motivo |
|---|---|---|
| Tela de abertura ou janela que deve estar sempre totalmente visível | `dvh` | Preenche exatamente a área visível, com barra ou sem |
| Bloco que não deve mudar de tamanho durante a rolagem | `svh` | Valor estável: o bloco não "respira" quando a barra se mexe |
| Fundo que deve cobrir a tela mesmo quando a barra se retira | `lvh` | Vai até a base da grande janela |

Como `dvh` se recalcula continuamente, um bloco que o usa é redimensionado a cada movimento da barra: pode se mexer diante dos olhos do leitor. E, para um bloco que contém texto, escreve-se `min-height` em vez de `height` (ver [a lista de verificação](#a-lista-de-verificacao-para-resistir-a-200-e-300)).

```css
.abertura {
    /* alternativa: pelo menos a altura da tela, mais se o texto exigir */
    min-height: 100vh;
    min-height: 100dvh;      /* versão recente: a altura realmente visível */
}
```

## As funções de tamanho: `calc()`, `min()`, `max()` e `clamp()`

Uma **função CSS** é um valor que calcula seu resultado: seu nome é seguido de parênteses que contêm seus **argumentos** (os valores que lhe são dados), separados por vírgulas. `var(--nome)` é uma delas. As quatro funções de tamanho abaixo aceitam todas as unidades deste capítulo, misturadas.

### `calc()`: calcular com várias unidades

`calc()` faz um cálculo que o navegador resolve na exibição. Seu interesse: misturar unidades que não se podem somar à mão (uma porcentagem e `rem`, por exemplo).

```css
:root {
    --espaco: 1rem;                      /* variável CSS da raiz: um espaçamento */
}

.coluna {
    /* largura do pai menos 2 rem: 768 px para um pai de 800 px */
    width: calc(100% - 2rem);
    padding: calc(var(--espaco) * 2);    /* o dobro da variável: 2 rem */
    margin-top: calc(100% / 3);          /* um terço da largura do pai */
}
```

| Operador | Regra | Exemplo válido | Exemplo inválido |
|---|---|---|---|
| `+` | **Espaço obrigatório** de cada lado | `calc(1rem + 2vw)` | `calc(1rem+2vw)` |
| `-` | **Espaço obrigatório** de cada lado | `calc(100% - 2rem)` | `calc(100%-2rem)` |
| `*` | Um dos dois lados é um número sem unidade | `calc(var(--espaco) * 2)` | `calc(1rem * 2rem)` (dois comprimentos) |
| `/` | O lado direito é um número sem unidade | `calc(100% / 3)` | `calc(100% / 2rem)` (evitar: dividir por um comprimento) |

Os espaços em torno de `+` e de `-` são obrigatórios porque `-2rem` também se lê como **um número negativo**: sem espaço, o navegador vê dois valores colados e não uma subtração. Um valor inválido não é sinalizado por erro: a linha é ignorada em silêncio, e a propriedade retoma seu valor anterior ou seu valor padrão. Os espaços não são, em contrapartida, exigidos em torno de `*` e de `/`, mas escrevem-se por hábito. O detalhe completo está na [página MDN de `calc()`](https://developer.mozilla.org/en-US/docs/Web/CSS/calc).

### `min()` e `max()`: o menor, o maior

`min(a, b)` devolve o menor dos valores, `max(a, b)` o maior. A armadilha de leitura: `min()` impõe um **teto** (o resultado nunca ultrapassará o menor valor), e `max()` um **piso** (o resultado nunca descerá abaixo do maior).

```css
.conteudo {
    /* o menor dos dois: nunca mais largo que 40 rem (640 px) */
    width: min(100%, 40rem);
}

.titulo {
    font-size: max(1rem, 2vw); /* o maior dos dois: nunca abaixo de 1 rem (16 px) */
}
```

| Escrita | No caso | Valores comparados | Resultado |
|---|---|---|---|
| `min(100%, 40rem)` | Pai de 500 px | 500 px e 640 px | 500 px |
| `min(100%, 40rem)` | Pai de 900 px | 900 px e 640 px | 640 px |
| `max(1rem, 2vw)` | Janela de 400 px | 16 px e 8 px | 16 px |
| `max(1rem, 2vw)` | Janela de 1000 px | 16 px e 20 px | 20 px |

`width: min(100%, 40rem)` equivale a `width: 100%; max-width: 40rem;` em uma única linha. As páginas MDN de [`min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min) e [`max()`](https://developer.mozilla.org/en-US/docs/Web/CSS/max) detalham sua sintaxe.

### `clamp()`: um tamanho fluido, limitado dos dois lados

`clamp(mínimo, preferido, máximo)` escolhe o valor **preferido** enquanto ele permanecer entre os dois limites, senão o limite mais próximo. É o equivalente de `max(mínimo, min(preferido, máximo))`. Com uma parte preferida que depende da largura da janela, o tamanho cresce **progressivamente** com a tela (fala-se de um tamanho **fluido**), sem media query:

```css
.titulo {
    /* piso: 1 rem (16 px); preferido: 0,5 rem + 2% da largura; máximo: 2 rem */
    font-size: clamp(1rem, 0.5rem + 2vw, 2rem);
}
```

Eis o que esta linha dá conforme a largura da janela (com a raiz em 16 pixels, portanto 0,5 rem = 8 px e 1 rem = 16 px):

| Largura da janela | Parte preferida `0.5rem + 2vw` | Resultado | Qual valor vence |
|---|---|---|---|
| 320 px | 8 + 6,4 = 14,4 px | **16 px** | O piso (14,4 está abaixo de 16) |
| 400 px | 8 + 8 = 16 px | **16 px** | O piso e o preferido coincidem |
| 600 px | 8 + 12 = 20 px | **20 px** | O preferido |
| 800 px | 8 + 16 = 24 px | **24 px** | O preferido |
| 1000 px | 8 + 20 = 28 px | **28 px** | O preferido |
| 1200 px | 8 + 24 = 32 px | **32 px** | O preferido e o teto coincidem |
| 1440 px | 8 + 28,8 = 36,8 px | **32 px** | O teto (36,8 está acima de 32) |

Entre 400 e 1200 pixels de largura, o texto cresce em linha reta de 16 a 32 pixels; abaixo e acima, fica preso no limite.

**Como escolher a parte preferida?** Parte-se do que se quer: o tamanho mínimo a partir de uma largura dada, o tamanho máximo a partir de outra. A parte preferida se escreve `ordenada + inclinação × largura`, onde a **inclinação** é o número de pixels ganhos por pixel de largura da janela e a **ordenada** o valor que se soma no início para cair no tamanho desejado.

| Etapa | Cálculo | Exemplo: de 16 px a 400 px de largura até 32 px a 1200 px |
|---|---|---|
| 1. Inclinação em pixels por pixel de largura | (tamanho máximo - tamanho mínimo) / (largura máxima - largura mínima) | (32 - 16) / (1200 - 400) = 0,02 |
| 2. Inclinação em `vw` | Inclinação × 100, pois 1vw é 1% da largura | 0,02 × 100 = **2vw** |
| 3. Ordenada | tamanho mínimo - inclinação × largura mínima | 16 - 0,02 × 400 = 8 px |
| 4. Ordenada em `rem` | Ordenada / 16 | 8 / 16 = **0,5rem** |
| 5. Montagem | `clamp(min, ordenada + inclinação, max)` | `clamp(1rem, 0.5rem + 2vw, 2rem)` |

A verificação é imediata: a 1200 pixels, 8 + 0,02 × 1200 = 32. Outro exemplo, de 18 pixels (1,125 rem) a 400 pixels de largura até 24 pixels (1,5 rem) a 1200 pixels: a inclinação é (24 - 18) / 800 = 0,0075, ou seja 0,75vw; a ordenada é 18 - 0,0075 × 400 = 15 px, ou seja 0,9375 rem. Escreve-se, portanto, `clamp(1.125rem, 0.9375rem + 0.75vw, 1.5rem)`; verificação: a 400 pixels, 15 + 3 = 18; a 1200 pixels, 15 + 9 = 24.

`clamp()` não se limita ao texto: `padding: clamp(1rem, 4vw, 3rem)` faz variar um espaçamento com a tela. Os detalhes estão na [página MDN de `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp). Dentro de `clamp()`, `min()`, `max()` ou de um `calc()`, um cálculo se escreve sem repetir `calc()`: `0.5rem + 2vw` basta, com os mesmos espaços obrigatórios.

### O problema do `vw` sozinho em um tamanho de fonte

Um tamanho de fonte escrito **apenas** em `vw` depende somente da largura da janela:

```css
.titulo-fragil {
    font-size: 2vw;           /* 2% da largura: 25,6 px a 1280 px, 6,4 px a 320 px */
}
```

Três defeitos decorrem disso. Ele não segue o ajuste de tamanho de fonte do usuário, que não muda a largura da janela. Também não cresce quando se dá zoom, como calcula a seção sobre a ampliação, um pouco mais abaixo. Por fim, em tela pequena ele fica minúsculo: a 320 pixels de largura, `2vw` dá 6,4 pixels, ilegível. A regra é, portanto: **sempre acrescentar uma parte em `rem`** (como o `0.5rem` do exemplo de `clamp()`), e exprimir os limites em `rem` em vez de pixels, para que sigam o ajuste do usuário.

## Aumentar o texto a 200% e 300%: o que exige o WCAG

O **WCAG** (*Web Content Accessibility Guidelines*) é o referencial de regras de acessibilidade web publicado pelo [W3C](https://www.w3.org/) (*World Wide Web Consortium*), o organismo que normatiza a web (ver [Cor e contraste](/?c=ui-ux&p=couleur-et-contraste) e [a acessibilidade em UX](/?c=ui-ux&p=accessibilite-ux), que apresentam seus níveis A, AA e AAA). Dois de seus critérios, ambos de **nível AA** (o nível visado por padrão), dizem respeito à ampliação:

| Número | Título | O que o critério exige | Página oficial |
|---|---|---|---|
| 1.4.4 | Redimensionamento do texto (*Resize Text*) | O texto pode ser ampliado até **200%**, sem ferramenta especializada, **sem perda de conteúdo nem de função** | [W3C: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) |
| 1.4.10 | Redistribuição (*Reflow*) | Com **320 pixels CSS de largura** (um zoom de 400% em uma janela de 1280 pixels), o conteúdo aparece **sem rolagem horizontal**, nem perda de conteúdo ou de função | [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |

Uma **rolagem horizontal** é a barra que obriga a deslizar a página da esquerda para a direita para ler uma linha: ela quebra a leitura, pois é preciso voltar sem parar. O critério admite exceções para conteúdos cujo sentido exige uma disposição em duas dimensões (tabela de dados, mapa, imagem), e prevê um equivalente de 256 pixels de **altura** para um conteúdo que rola horizontalmente.

**E 300%?** Nenhum critério fixa esse patamar: ele se situa entre os dois limites oficiais (200% e 400%). É um **patamar de teste** útil: em uma janela de 1280 pixels, um zoom de 300% dá uma largura de cerca de 427 pixels, um tamanho intermediário onde pontos de quebra pensados para celulares específicos às vezes deixam um vão. Uma página que se mantém a 200%, 300% e 400% é segura em toda a faixa.

### Duas formas de aumentar: o zoom e o tamanho da fonte

Os usuários têm dois meios de obter um texto maior, com efeitos bem diferentes:

| | Zoom da página | Tamanho da fonte do navegador |
|---|---|---|
| Gesto | Ctrl e `+` (⌘ e `+` no Mac), ou Ctrl e a roda do mouse | Configurações do navegador, seção aparência ou fontes |
| O que cresce | **Tudo**: texto, imagens, pixels, espaçamentos | Somente o que se expressa em `rem`, `em` ou em porcentagem da fonte (os pixels ficam) |
| Largura da janela em pixels CSS | **Diminui** (largura real / zoom) | Não muda |
| Media queries em `px` | Reagem: a disposição muda para a versão "celular" | Não reagem: a disposição larga permanece, o texto cresce dentro dela |
| Risco típico | Alturas fixas pequenas demais, cabeçalho fixo que ocupa a tela | Colunas estreitas demais, texto que transborda de blocos de largura fixa |

Um zoom de 200% numa janela de 1280 × 800 pixels equivale, para o CSS, a uma janela duas vezes menor: 1280 / 2 = 640 pixels de largura. Os valores de cada patamar:

| Zoom | Largura em pixels CSS (janela de 1280) | Altura em pixels CSS (janela de 800) | O que o CSS vê |
|---|---|---|---|
| 100% | 1280 | 800 | Um computador |
| 200% | 640 | 400 | Uma largura próxima à de um tablet pequeno |
| 300% | cerca de 427 | cerca de 267 | Uma largura próxima à de um celular grande |
| 400% | 320 | 200 | Uma largura próxima à de um celular pequeno |

Guardemos sobretudo a altura: a 400%, um bloco escrito `height: 100vh` mede apenas 200 pixels CSS. E um cabeçalho fixo de 80 pixels CSS ocuparia então 80 / 200 = 40% da janela.

Os pontos de quebra também seguem o ajuste de fonte se forem escritos em `em`: em uma media query, `em` se refere ao tamanho de fonte padrão do navegador (e não ao que o CSS da página define). Assim, `48em` vale 48 × 16 = 768 pixels por padrão, mas 48 × 32 = 1536 pixels se o usuário tiver escolhido 32 pixels: uma janela de 1280 pixels é então considerada estreita, o que convém a um texto duas vezes maior.

```css
/* 48em: 768 px com o tamanho padrão (16 px), 1536 px com 32 px escolhidos */
/* @media aplica o bloco somente se a janela tiver pelo menos esta largura */
@media (min-width: 48em) {
    .pagina {
        /* as colunas ficam lado a lado somente acima deste limite */
        display: flex;
    }
}
```

### O que acontece com um tamanho fluido ao aumentar?

O cálculo usa a largura em pixels CSS da tabela anterior: um tamanho de fonte em `rem` fixo é multiplicado pelo zoom, enquanto a parte `vw` de um tamanho fluido diminui ao mesmo tempo que a janela. Eis, em uma janela de 1280 pixels, o tamanho **exibido** (tamanho CSS × zoom) de três escritas:

| Zoom | Largura CSS | `2rem` | `clamp(1rem, 0.5rem + 2vw, 2rem)` | `2vw` |
|---|---|---|---|---|
| 100% | 1280 | 32 px | 32 px | 25,6 px |
| 200% | 640 | 64 px (×2) | 8 + 12,8 = 20,8 px CSS, ou seja 41,6 px (×1,3) | 12,8 px CSS, ou seja 25,6 px (×1) |
| 300% | 427 | 96 px (×3) | 8 + 8,53 = 16,53 px CSS, ou seja 49,6 px (×1,55) | 8,53 px CSS, ou seja 25,6 px (×1) |
| 400% | 320 | 128 px (×4) | 16 px CSS (piso), ou seja 64 px (×2) | 6,4 px CSS, ou seja 25,6 px (×1) |

Leitura: `2rem` cresce exatamente como o zoom. `2vw` **não cresce de modo algum** (×1 em cada patamar): o aumento é anulado pela redução da janela, daí sua condenação. `clamp()` cresce, mas menos que o zoom (×1,3 a 200%) enquanto sua parte preferida em `vw` pesa. Com o ajuste de fonte em 32 pixels, o mesmo cálculo dá 0,5 × 32 + 0,02 × 1280 = 41,6 pixels, ou seja ainda ×1,3.

Esta tabela é um cálculo, não um veredito: ela não indica se o critério 1.4.4 é satisfeito, o que se julga com a página aberta. Basta para decidir: para o **texto corrido**, ficar com `rem` fixos (`1rem`), que crescem exatamente no zoom pedido; reservar `clamp()` aos **títulos grandes**, com uma diferença moderada entre os limites; e testar a 200%.

### A lista de verificação para resistir a 200% e 300%

| Risco | O que quebra a 200% ou 300% | Correção |
|---|---|---|
| Largura fixa em pixels (`width: 1200px`) | Uma barra de rolagem horizontal | `max-width` mais `width: 100%`, ou `width: min(100%, 75rem)` |
| Altura fixa em pixels em um bloco de texto | O texto sai do bloco ou é cortado | `min-height`, ou não fixar a altura |
| `height: 100vh` para um bloco que contém texto | A 400%, a altura é de apenas 200 pixels CSS | `min-height: 100vh` (depois `min-height: 100dvh`) |
| `overflow: hidden` em um contêiner (ajuste que oculta o que ultrapassa a caixa) | O que ultrapassa é **cortado**, portanto perdido | `overflow: visible` (padrão), ou `overflow: auto` para uma tabela ou um bloco de código |
| Elemento [flex](/?c=langages&s=css&p=flexbox) ou [grid](/?c=langages&s=css&p=grid) que se recusa a encolher | O contêiner ultrapassa a tela | `min-width: 0` (largura mínima permitida: zero) no elemento flex; `minmax(0, 1fr)` para uma coluna de grade |
| Palavra ou endereço muito longo | Uma linha que não se pode quebrar ultrapassa o bloco | `overflow-wrap: anywhere` (permite quebrar uma palavra longa demais) |
| Entrelinha em pixels (`line-height: 24px`) | As linhas se sobrepõem quando o texto cresce | `line-height: 1.5` (número sem unidade) |
| Imagem ou SVG mais larga que a tela | Rolagem horizontal | `max-width: 100%; height: auto;` (ver [as imagens](/?c=langages&s=html&p=liens-et-images) e [o SVG](/?c=langages&s=html&p=svg-dans-la-page)) |
| Cabeçalho grudado no topo da janela (`position: fixed` ou `sticky`, ver [o posicionamento](/?c=langages&s=css&p=positionnement)) | Cobre uma grande parte da janela estreita | Devolvê-lo a `position: static` (rolagem normal) em uma media query para janelas estreitas |
| Botão de altura fixa | Seu rótulo transborda | `min-height` e `padding` em `em` |

O **`overflow`** rege o que acontece quando o conteúdo ultrapassa sua caixa:

| Valor | Efeito |
|---|---|
| `visible` (padrão) | O conteúdo ultrapassa e continua visível |
| `hidden` | O que ultrapassa fica oculto, definitivamente |
| `auto` | Uma barra de rolagem aparece somente se necessário |
| `scroll` | Uma barra de rolagem está sempre presente |

A [página MDN de `overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) lista os outros valores. Eis por que `min-width: 0` é útil em um contêiner flex: por padrão, um elemento flex se recusa a ficar mais estreito que seu conteúdo (seu valor mínimo é `auto`, que é a largura da palavra mais longa ou da maior imagem que ele contém). Uma palavra longa ou uma imagem larga o mantêm, portanto, largo, e o contêiner sai da tela. Da mesma forma, em uma grade, `1fr` se escreve na realidade `minmax(auto, 1fr)`: o mesmo mínimo se aplica.

```css
.cartoes {
    display: flex;           /* os filhos se colocam em uma linha (ver Flexbox) */
    flex-wrap: wrap;         /* passam para a linha seguinte quando falta espaço */
    gap: 1rem;               /* espaço de 1 rem entre os elementos */
}

.cartao {
    flex: 1 1 15rem;         /* pode crescer, pode encolher, largura inicial 15 rem */
    min-width: 0;            /* o elemento pode ficar mais estreito que seu conteúdo */
    overflow-wrap: anywhere; /* quebra uma palavra longa demais onde for preciso */
}
```

`overflow-wrap` decide se uma palavra longa demais para sua linha pode ser cortada no meio: `normal` (padrão) a deixa ultrapassar; `anywhere` a corta em qualquer lugar (e leva esse corte em conta no cálculo da largura mínima de um elemento flex ou grid, o que `break-word`, outro valor do mesmo ajuste, não faz); ver a [página MDN de `overflow-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap). Para cortar com elegância nas sílabas, `hyphens: auto` (ver [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)) acrescenta um hífen, mas exige que o idioma da página esteja declarado por `lang` em `<html>` (ver [a estrutura de um documento](/?c=langages&s=html&p=structure-dun-document)).

Em uma grade, `min()` resolve o caso de uma coluna mais larga que a tela:

```css
.galeria {
    display: grid;
    /* cada coluna: pelo menos 12 rem, ou todo o contêiner se ele for mais estreito */
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: 1rem;               /* espaço entre as células */
}
```

Com `minmax(200px, 1fr)` no lugar, uma coluna não poderia descer abaixo de 200 pixels: em um contêiner mais estreito, a grade transbordaria. A combinação `min(100%, 12rem)` reduz o mínimo à largura do contêiner.

Eis o mesmo componente antes e depois da correção:

```css
/* ANTES: tudo quebra a 200% ou 300% */
.pagina {
    width: 1200px;           /* largura fixa: rolagem horizontal abaixo de 1200 px */
}

.cabecalho {
    height: 80px;            /* altura fixa: o texto ampliado transborda */
    overflow: hidden;        /* e o transbordamento é cortado: o texto se perde */
}

.conteudo {
    line-height: 24px;       /* entrelinha fixa: as linhas se sobrepõem */
}
```

```css
/* DEPOIS: a página se adapta ao espaço real */
.pagina {
    width: 100%;             /* ocupa a largura da janela */
    max-width: 75rem;        /* no máximo 1200 px (75 × 16) com o ajuste padrão */
    /* 0 no topo e na base, auto à esquerda e à direita: bloco centralizado */
    margin: 0 auto;
    padding: 0 1rem;         /* margem interna à esquerda e à direita */
}

.cabecalho {
    min-height: 5rem;        /* pelo menos 80 px por padrão, mais se o texto exigir */
}

.conteudo {
    line-height: 1.5;        /* 1,5 vez o tamanho do texto: acompanha as ampliações */
}
```

O número sem unidade de `line-height: 1.5` é **herdado tal qual**: cada filho o recalcula com seu próprio tamanho de fonte, enquanto um valor em pixels é transmitido em pixels aos filhos, mesmo que eles tenham um texto maior ([a herança](/?c=langages&s=css&p=variables-et-cascade) transmite um valor fixo). Para entender a propriedade, ver a [página MDN de `line-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height).

### Como testar

Nenhuma regra deste capítulo substitui um teste real em um navegador: os cálculos acima preveem o resultado, mas só a exibição mostra uma linha cortada ou uma barra de rolagem inesperada.

| Teste | Como fazer | O que verificar |
|---|---|---|
| Tamanho de fonte a 200% | Nas configurações do navegador, escolher 32 px como tamanho de fonte padrão (16 px por padrão), depois recarregar a página | O texto em `rem` dobra; nada é cortado nem sobreposto |
| Tamanho de fonte a 300% | Mesmo ajuste, com 48 px | Idem; as colunas continuam legíveis |
| Zoom 200% | Ctrl e `+` até 200% em uma janela de 1280 px | A disposição muda para a versão estreita, sem perda |
| Zoom 300% | Até 300% | Nenhum vão entre as duas versões da disposição |
| Zoom 400% | Até 400%: a janela mede 320 pixels CSS | **Nenhuma barra de rolagem horizontal** (critério 1.4.10) |
| Volta ao normal | Ctrl e `0` | Restabelece o zoom a 100% |

Os menus do navegador variam de uma versão para outra: procura-se "tamanho da fonte" no campo de busca das suas configurações. Para cada patamar, verifica-se quatro pontos: nenhuma barra de rolagem horizontal (fora de tabela ou mapa), nenhum texto cortado, todos os botões e links utilizáveis pelo teclado e pelo mouse, e nada escondido sob um cabeçalho ou um rodapé fixo.

Para descobrir qual elemento provoca uma rolagem horizontal, pode-se consultar a página pelo **console**, a área das ferramentas de desenvolvedor (aberta pela tecla F12) onde se digita JavaScript (ver [o DOM](/?c=langages&s=javascript&p=dom-et-evenements), [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) e [as funções](/?c=langages&s=javascript&p=fonctions)):

```javascript
// Largura visível da página: a da raiz <html>, sem a barra de rolagem
const largura = document.documentElement.clientWidth;

// querySelectorAll("*"): todos os elementos; [...] os coloca em uma lista
// filter mantém os que têm a borda direita (right) além da largura visível
const excedentes = [...document.querySelectorAll("*")].filter(
    (elemento) => elemento.getBoundingClientRect().right > largura
);

// console.log escreve a lista no console: um clique em um elemento o destaca
console.log(excedentes);
```

`getBoundingClientRect()` devolve o retângulo que o elemento ocupa na janela; sua propriedade `right` é a posição de sua borda direita em pixels. A lista exibida contém os elementos cuja caixa sai da janela pela direita: são esses os que devem ser corrigidos (um menu escondido de propósito fora da tela também aparece, sem ser um erro). Ver [os arrays](/?c=langages&s=javascript&p=tableaux) para `filter`.

## Qual unidade para cada necessidade

| Necessidade | A escrever | Porque |
|---|---|---|
| Tamanho de um texto corrente | `1rem` | Segue o ajuste do navegador e o zoom |
| Espaço que segue o texto de um elemento (botão) | `em` | Permanece proporcional ao seu próprio texto |
| Largura de uma coluna de texto | `max-width: 65ch` | Comprimento de linha confortável, adaptado à fonte |
| Largura de um bloco que não deve ultrapassar | `width: min(100%, 40rem)` | Adapta-se às telas pequenas, limita-se nas grandes |
| Altura de tela inteira no celular | `min-height: 100vh` depois `min-height: 100dvh` | Acompanha a barra de endereço, com uma alternativa |
| Grande título fluido | `clamp(1.75rem, 1.125rem + 2.5vw, 3rem)` | Cresce com a tela, limitado, segue a raiz |
| Entrelinha | `1.5` sem unidade | Segue o tamanho do texto |
| Ponto de quebra | `@media (min-width: 48em)` | Segue o tamanho de fonte padrão |
| Borda fina, sombra | `1px` | Não deve crescer com o texto |
| Imagem | `max-width: 100%; height: auto` | Nunca ultrapassa seu pai |

O título fluido da tabela segue o método das etapas acima, de 28 pixels (1,75 rem) a 400 pixels de largura até 48 pixels (3 rem) a 1200 pixels: a inclinação é (48 - 28) / 800 = 0,025, ou seja 2,5vw; a ordenada é 28 - 0,025 × 400 = 18 px, ou seja 1,125 rem. Verificação: a 400 pixels, 18 + 10 = 28; a 1200 pixels, 18 + 30 = 48.

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| `html { font-size: 16px; }` | Fixa a raiz: `rem` não segue mais o ajuste de tamanho de fonte do usuário |
| `html { font-size: 62.5%; }` para que `1rem` valha 10 px | Segue o ajuste, mas todo texto não redefinido passa a 10 px (ilegível), e cada tamanho deve ser recalculado (`1.6rem` para 16 px) |
| `em` em elementos aninhados | O tamanho se multiplica a cada nível: 16, 24, 36, 54 px para `1.5em` |
| `font-size: 2vw` sozinho | Não cresce nem com o zoom nem com o ajuste do usuário; 6,4 px a 320 px de largura |
| Limites de `clamp()` em pixels | Ignoram o ajuste do usuário: escrever `1rem` e `2rem` |
| Texto corrido em `clamp()` | A parte `vw` freia a ampliação (×1,3 no zoom 200% a 1280 px): reservar aos títulos grandes |
| `100vh` no celular | A base do bloco ultrapassa a borda da tela quando a barra de endereço está visível |
| `width: 100vw` no computador | `vw` conta a barra de rolagem vertical: o bloco ultrapassa sua largura e cria uma rolagem horizontal; preferir `100%` |
| `calc(100%-2rem)` sem espaços | Valor inválido, linha ignorada em silêncio |
| `min()` e `max()` trocados | `min()` limita e `max()` estabelece um piso: o efeito contraria a intuição |
| `height: 100%` sem altura no pai | A porcentagem é ignorada: a altura permanece automática |
| `height` em pixels em um bloco de texto | O texto ampliado sai do bloco |
| `overflow: hidden` em torno de um texto | O texto ampliado é cortado, portanto perdido |
| `line-height` em pixels | As linhas se sobrepõem assim que o texto cresce |
| Elemento flex ou grid sem `min-width: 0` | Uma palavra longa basta para fazer transbordar todo o contêiner |
| `<meta name="viewport" ... user-scalable=no>` (ou `maximum-scale=1`) | Proíbe o zoom por pinça no celular, contrário ao critério 1.4.4 (ver [a estrutura de um documento](/?c=langages&s=html&p=structure-dun-document)) |
| Testar somente com o zoom | Os pixels crescem com o zoom, mas não com o ajuste de fonte: os dois casos devem ser testados |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Deixar `html { font-size: 100%; }` e escrever os tamanhos de fonte em `rem` | O texto segue o ajuste do usuário |
| Reservar `em` aos espaços proporcionais ao texto do mesmo elemento | Sem acúmulo, o botão mantém suas proporções |
| Converter os tamanhos da maquete em `rem` (px / 16) | Mesma aparência por padrão, mas respeita o ajuste |
| Usar `min-height` em vez de `height` para um bloco de texto | O bloco cresce com seu conteúdo |
| Escrever `100vh` e depois `100dvh` (ou `svh` / `lvh` conforme a necessidade) | Alternativa para navegadores antigos, altura exata no celular |
| Definir `max-width` em `rem` ou em `ch`, com `width: 100%` | A disposição se adapta de 320 px até a tela larga |
| `clamp()` para os títulos grandes, com limites e ordenada em `rem` | Tamanho fluido, limitado, que ainda segue o ajuste |
| `line-height` como número sem unidade | A entrelinha segue o texto |
| `min-width: 0`, `minmax(0, 1fr)` e `overflow-wrap: anywhere` nos componentes flex e grid | Nenhuma palavra longa faz transbordar a página |
| Pontos de quebra em `em` | Seguem o tamanho de fonte padrão |
| Testar a 200%, 300% e 400%, pelo zoom **e** pelo tamanho da fonte | As duas formas de aumentar produzem problemas diferentes |

## O que reter

| | |
|---|---|
| **A reter** | Um tamanho CSS é um número e uma unidade. `px` é absoluto; `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex` e `lh` são relativos. `rem` segue a raiz (16 px por padrão, ajustável pelo usuário), enquanto `px` ignora esse ajuste; `em` se acumula nos elementos aninhados. No celular, `svh` é a altura com a barra visível, `lvh` com a barra oculta, `dvh` a altura atual; escreve-se `100vh` e depois `100dvh` como alternativa. `calc()` mistura unidades (espaços obrigatórios em torno de `+` e `-`); `min()` limita, `max()` estabelece um piso; `clamp(min, preferido, max)` dá um tamanho fluido cuja parte preferida se calcula por `ordenada + inclinação × largura` (por exemplo `clamp(1rem, 0.5rem + 2vw, 2rem)`). O WCAG exige um texto ampliável a 200% (critério 1.4.4, Redimensionamento do texto) e um conteúdo sem rolagem horizontal a 320 pixels CSS, ou seja um zoom de 400% (critério 1.4.10, Redistribuição); 300% é um patamar de teste intermediário. |
| **Armadilhas a evitar** | Raiz em pixels; `62.5%` mal compensado; `em` aninhados; `vw` sozinho em um tamanho de fonte; limites de `clamp()` em pixels; `100vh` no celular; `100vw` com barra de rolagem; `calc(100%-2rem)`; `min()` e `max()` invertidos; alturas e entrelinhas em pixels; `overflow: hidden` em torno do texto; elementos flex e grid sem `min-width: 0`; zoom do celular bloqueado por `user-scalable=no`; testar apenas uma das duas formas de aumentar. |
| **Boas práticas** | Tamanhos de fonte e espaçamentos gerais em `rem`, `em` para o que segue o texto do elemento; `min-height`, `max-width` e `width: min(100%, ...)` em vez de dimensões fixas; `100vh` seguido de `100dvh`; `clamp()` para os títulos grandes, com limites em `rem`; `line-height` sem unidade; `overflow-wrap: anywhere` e `min-width: 0`; pontos de quebra em `em`; teste real a 200%, 300% e 400%, pelo zoom e pelo tamanho da fonte. |
