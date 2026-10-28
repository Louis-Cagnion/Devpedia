---
order: 9
---

# O SVG escrito diretamente na página

Um **SVG** (*Scalable Vector Graphics*, "gráfico vetorial redimensionável") é uma imagem que se **descreve com formas** (um retângulo aqui, um círculo ali, um traço entre dois pontos) em vez de ser fabricada com pontos coloridos. O navegador (o programa que exibe as páginas web) redesenha essas formas no tamanho desejado: a imagem continua nítida, do ícone minúsculo ao pôster gigante. Este capítulo mostra como escrever um SVG **no código da página**, desenhá-lo com as formas básicas, nele colocar texto, animá-lo, torná-lo acessível e reagir aos cliques.

Ele pressupõe conhecidos [as etiquetas e os atributos HTML](/?c=langages&s=html&p=structure-dun-document) (uma etiqueta é uma palavra entre `<` e `>` que cria um elemento; um atributo é uma configuração escrita na etiqueta de abertura, na forma `nome="valor"`), [a sintaxe de uma regra CSS](/?c=langages&s=css&p=selecteurs) e, para os exemplos em JavaScript, [o DOM e os eventos](/?c=langages&s=javascript&p=dom-et-evenements), [as variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) e [as funções](/?c=langages&s=javascript&p=fonctions).

## Imagem vetorial ou imagem em pixels

Um **pixel** é o menor ponto de uma tela. Uma imagem JPEG ou PNG (dois formatos de arquivo de imagem; fala-se de imagem **matricial**) armazena a cor de cada pixel: ampliada, ela fica borrada ou com aspecto de escadinha. Uma imagem **vetorial** armazena instruções de desenho: ampliada, o navegador recalcula o desenho, que continua nítido.

| | Imagem matricial (PNG, JPEG) | Imagem vetorial (SVG) |
|---|---|---|
| O que é armazenado | A cor de cada pixel | Formas e suas coordenadas |
| Ampliada | Borrada | Nítida |
| Peso | Cresce com o número de pixels | Cresce com o número de formas |
| Ideal para | Fotografias, texturas | Ícones, logotipos, esquemas, gráficos |
| Modificável por CSS ou JavaScript | Não | Sim (se o SVG estiver na página) |

Um SVG pode chegar à página de várias maneiras:

| Método | Escrita | O que a página pode fazer com ele |
|---|---|---|
| Arquivo carregado por `<img>` | `<img src="logo.svg" alt="Logo">` (ver [as imagens](/?c=langages&s=html&p=liens-et-images)) | Nenhum estilo nem script a partir da página; o navegador o guarda em **cache** (uma cópia mantida para não baixá-lo de novo) |
| Imagem de fundo CSS | `background-image: url(logo.svg)` | O mesmo: uma imagem fixa |
| **Escrito na página** | Uma etiqueta `<svg>` no HTML | Cada forma é um elemento do [DOM](/?c=langages&s=javascript&p=dom-et-evenements): estilizável em CSS, modificável em JavaScript, animável, com um texto legível por um [leitor de tela](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier) |
| `<canvas>` | Ver [Canvas 2D](/?c=langages&s=javascript&p=canvas-2d-et-animations) | Um desenho em pixels: mais rápido para milhares de elementos, mas nenhuma forma existe mais depois de desenhada |

Escrever o SVG na página também evita uma **requisição** (um pedido de arquivo enviado ao servidor, ver [a API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)). O preço a pagar: o código da imagem pesa no HTML e não é armazenado em cache separadamente. Reserva-se, portanto, essa técnica aos ícones, esquemas e gráficos que a página deve estilizar, animar ou ler por script.

## Um primeiro SVG

```html
<!-- width e height: o tamanho de exibição, em pixels (200 de largura, 100 de altura) -->
<!-- viewBox: o espaço de desenho interno (explicado na seção seguinte) -->
<svg width="200" height="100" viewBox="0 0 200 100">
    <!-- rect: um retângulo; x e y: seu canto superior esquerdo; fill: sua cor -->
    <rect x="0" y="0" width="200" height="100" fill="#e8eefc"/>
    <!-- circle: um círculo; cx e cy: seu centro; r: seu raio (metade do diâmetro) -->
    <circle cx="100" cy="50" r="30" fill="#1a4fd6"/>
</svg>
```

O retângulo cobre toda a superfície (de 0 a 200 na largura, de 0 a 100 na altura) em azul bem claro; o disco azul escuro está centrado no ponto (100, 50), portanto ocupa de 70 a 130 na largura e de 20 a 80 na altura. A barra `/>` no fim de uma etiqueta a fecha sobre si mesma, como em `<img>`, já que uma forma não tem conteúdo.

Em uma página HTML, nenhuma configuração adicional é necessária. Um arquivo `.svg` autônomo, por outro lado, exige o atributo `xmlns="http://www.w3.org/2000/svg"` na etiqueta `<svg>` (um endereço que nomeia o vocabulário SVG), explicado em [as armadilhas](#as-armadilhas).

## `viewBox`: o sistema de coordenadas

Para posicionar uma forma, é preciso um referencial. O do SVG parte do **canto superior esquerdo**, no ponto (0, 0). A coordenada `x` cresce para a direita, e a coordenada `y` cresce **para baixo** (o inverso de um gráfico de matemática).

```
(0,0) ---------- x cresce para a direita --------->
  |
  |        (70,20)          (130,20)
  |           +-----------------+
  |           |                 |       quadrado que contém
  y cresce    |     (100,50)    |       o círculo: seu centro
  para        |                 |       está em (100,50)
  baixo       +-----------------+
  |        (70,80)          (130,80)
  v
```

O atributo `viewBox` define esse espaço de desenho. Ele contém quatro números: `min-x min-y largura altura`, ou seja, o canto superior esquerdo da área visível seguido de suas dimensões, em **unidades de usuário** (as unidades próprias do desenho, sem vínculo fixo com os pixels). O navegador estica esse espaço para que ele preencha o tamanho de exibição `width` × `height`. Esse estiramento chama-se **escalonamento**.

```html
<!-- Mesmo desenho (círculo de raio 20 centrado em 50,25) em um espaço de 100 x 50 -->
<!-- Exibido em 100 x 50 pixels: uma unidade = 1 pixel (escala 1) -->
<svg width="100" height="50" viewBox="0 0 100 50">
    <circle cx="50" cy="25" r="20" fill="#1a4fd6"/>
</svg>

<!-- Exibido em 400 x 200 pixels: uma unidade = 4 pixels (escala 4), mesmo desenho, nítido -->
<svg width="400" height="200" viewBox="0 0 100 50">
    <circle cx="50" cy="25" r="20" fill="#1a4fd6"/>
</svg>
```

| `viewBox` | `width` × `height` | Escala | Consequência |
|---|---|---|---|
| `0 0 100 50` | 100 × 50 | 1 | 1 unidade = 1 pixel |
| `0 0 100 50` | 400 × 200 | 4 | O desenho é ampliado 4 vezes, sem perda de nitidez |
| `0 0 200 100` | 100 × 50 | 0,5 | O desenho é reduzido à metade |
| Ausente | 100 × 50 | 1, fixa | Nenhum escalonamento: o SVG não se adapta mais a outro tamanho |
| `10 10 50 50` | 100 × 100 | 2 | Só se vê o quadrado de 50 × 50 que começa em (10, 10): o resto do desenho é cortado |

Se as proporções da `viewBox` e de `width` × `height` forem diferentes, o atributo `preserveAspectRatio` decide o restante. Seu valor padrão (`xMidYMid meet`) mantém as proporções do desenho e o centro na área, ainda que deixe faixas vazias; a lista dos valores está na [página do MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio).

Para que um SVG se adapte ao seu contêiner (tela de celular ou de computador, ver [o design responsivo](/?c=langages&s=css&p=responsive-et-media-queries)), mantém-se a `viewBox` e define-se o tamanho em CSS:

```css
.esquema {
    width: 100%;        /* ocupa toda a largura do seu contêiner */
    max-width: 400px;   /* sem ultrapassar 400 pixels */
    height: auto;       /* a altura segue as proporções da viewBox */
}
```

## As formas básicas

```html
<!-- viewBox 0 0 400 200: um espaço de desenho de 400 unidades por 200 -->
<svg viewBox="0 0 400 200" width="400" height="200">
    <!-- rect: canto (10,10), 80 de largura, 60 de altura; rx: cantos arredondados de 8 -->
    <rect x="10" y="10" width="80" height="60" rx="8" fill="#1a4fd6"/>
    <!-- circle: centro (140,40), raio 30: vai de x=110 a x=170 -->
    <circle cx="140" cy="40" r="30" fill="#c0392b"/>
    <!-- ellipse: um círculo achatado; rx: raio horizontal 45; ry: raio vertical 25 -->
    <ellipse cx="230" cy="40" rx="45" ry="25" fill="#2e8b57"/>
    <!-- line: segmento de (300,10) a (380,70); stroke: cor do traço -->
    <!-- sem stroke, uma linha é invisível; stroke-width: espessura do traço -->
    <line x1="300" y1="10" x2="380" y2="70" stroke="#333" stroke-width="4"/>
    <!-- polyline: segmentos que ligam os pontos listados, sem fechar a forma -->
    <!-- fill="none": sem preenchimento, somente o traço -->
    <polyline points="10,150 40,100 70,150 100,100 130,150"
              fill="none" stroke="#1a4fd6" stroke-width="4"/>
    <!-- polygon: como polyline, mas o último ponto se liga ao primeiro -->
    <polygon points="170,150 200,100 230,150" fill="#e0a800"/>
</svg>
```

| Forma | Atributos principais | O que eles definem |
|---|---|---|
| `rect` | `x`, `y`, `width`, `height`, `rx`, `ry` | Canto superior esquerdo, dimensões, arredondamento dos cantos |
| `circle` | `cx`, `cy`, `r` | Centro e raio |
| `ellipse` | `cx`, `cy`, `rx`, `ry` | Centro, raio horizontal, raio vertical |
| `line` | `x1`, `y1`, `x2`, `y2` | Ponto de partida e ponto de chegada |
| `polyline` | `points` | Lista de pontos `x,y` ligados por segmentos, forma aberta |
| `polygon` | `points` | Lista de pontos `x,y` ligados, forma fechada automaticamente |
| `path` | `d` | Um traçado qualquer, descrito por comandos (seção seguinte) |

Em `points`, cada ponto se escreve `x,y` e os pontos se separam por espaços. O triângulo do exemplo tem seus vértices em (170, 150), (200, 100) e (230, 150).

## Preencher e contornar: `fill` e `stroke`

Toda forma é desenhada com um **preenchimento** (o interior, definido por `fill`) e um **contorno** (o traço que segue a borda, definido por `stroke`). Por padrão, o preenchimento é **preto** e não há **nenhum contorno**: é por isso que uma `line` sem `stroke` permanece invisível (ela não tem interior para preencher). O contorno fica centralizado na borda: metade de sua espessura ultrapassa para fora, a outra metade avança para dentro.

Esses ajustes são **atributos de apresentação**: atributos cujo nome é o de uma propriedade CSS, escritos diretamente na etiqueta.

| Atributo | Papel | Valor padrão | Exemplo |
|---|---|---|---|
| `fill` | Cor do interior (`none`: sem preenchimento) | Preto | `fill="#1a4fd6"` |
| `stroke` | Cor do contorno | Nenhum | `stroke="#333"` |
| `stroke-width` | Espessura do contorno, em unidades de usuário | `1` | `stroke-width="4"` |
| `stroke-linecap` | Forma das extremidades de um traço: `butt` (corte reto), `round` (arredondado), `square` (quadrado) | `butt` | `stroke-linecap="round"` |
| `stroke-linejoin` | Forma dos cantos entre dois segmentos: `miter` (pontudo), `round`, `bevel` (cortado) | `miter` | `stroke-linejoin="round"` |
| `stroke-dasharray` | Traço tracejado: comprimentos alternados de traço e de vazio | Traço contínuo | `stroke-dasharray="10 5"`: 10 de traço, 5 de vazio |
| `stroke-dashoffset` | Deslocamento do início do tracejado | `0` | `stroke-dashoffset="5"` |
| `opacity` | Transparência de toda a forma, de `0` (invisível) a `1` | `1` | `opacity="0.5"` |
| `fill-opacity` | Transparência somente do preenchimento | `1` | `fill-opacity="0.3"` |

As cores se escrevem como em CSS: nome (`red`), código hexadecimal (`#1a4fd6`: o `#` seguido de três pares de algarismos na base 16, para a quantidade de vermelho, verde e azul) ou `rgb(...)`. `stroke-dasharray` e `stroke-dashoffset` também servem para fabricar um anel de progresso, como citado no [capítulo sobre os gradientes](/?c=langages&s=css&p=degrades); um exemplo animado é dado mais adiante.

## `path`: desenhar qualquer traçado

As formas básicas não bastam para um ícone ou um logotipo. `<path>` traça uma forma qualquer a partir do atributo `d` (de *data*, "dados"), uma sequência de **comandos**: uma letra seguida de números. Pode-se imaginá-lo como um lápis: o comando `M` o põe no papel, os outros o fazem avançar.

| Comando | Nome | Números esperados | Efeito |
|---|---|---|---|
| `M` | *Move to* (ir para) | `x y` | Levanta o lápis e o põe em (x, y), sem traçar. Inicia todo traçado |
| `L` | *Line to* (linha até) | `x y` | Traça um segmento reto até (x, y) |
| `H` | *Horizontal line to* | `x` | Segmento horizontal até a abscissa `x` (`y` inalterado) |
| `V` | *Vertical line to* | `y` | Segmento vertical até a ordenada `y` (`x` inalterado) |
| `C` | *Curve to* (curva até) | `x1 y1 x2 y2 x y` | Curva de Bézier cúbica: parte do ponto atual, termina em (x, y), guiada por dois pontos de controle (x1, y1) e (x2, y2) |
| `Z` | *Close path* (fechar) | nenhum | Traça um segmento reto até o ponto de partida do traçado e o fecha |

Uma **curva de Bézier** é uma curva flexível definida por suas duas extremidades e por **pontos de controle**: a curva se lança em direção a cada ponto de controle, sem jamais atravessá-lo, como um fio esticado que dois ímãs puxam. Existem outros comandos (`Q`, `S`, `T` para outras curvas, `A` para um arco de elipse), listados na [página do MDN sobre o traçado](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d).

Um comando em **maiúscula** usa coordenadas **absolutas** (posição na `viewBox`), e em **minúscula** coordenadas **relativas** (deslocamento a partir do ponto atual): `L 50 10` vai ao ponto (50, 10), `l 50 10` avança 50 para a direita e 10 para baixo.

```html
<svg viewBox="0 0 300 100" width="300" height="100">
    <!-- M: lápis em (10,90); L: até (50,10) e depois (90,90); Z: volta a (10,90) -->
    <path d="M 10 90 L 50 10 L 90 90 Z" fill="#1a4fd6"/>
    <!-- C: de (120,90) a (200,90), guiada por (140,10) e (180,10) -->
    <!-- fill="none": sem preenchimento; stroke: a cor do traço -->
    <path d="M 120 90 C 140 10, 180 10, 200 90"
          fill="none" stroke="#c0392b" stroke-width="4"/>
    <!-- h, v minúsculos: relativos; M 230 20 posiciona o lápis -->
    <!-- h 50 para a direita, v 50 para baixo, h -50 para a esquerda, z fecha -->
    <path d="M 230 20 h 50 v 50 h -50 z"
          fill="none" stroke="#2e8b57" stroke-width="4"/>
</svg>
```

O primeiro traçado é um triângulo cheio de vértices (10, 90), (50, 10) e (90, 90). O segundo é um arco: parte de (120, 90), sobe e desce até (200, 90), seu ponto mais alto estando em (160, 30). O terceiro é o contorno de um quadrado de 50 de lado cujo canto superior esquerdo está em (230, 20): `h 50` leva a (280, 20), `v 50` a (280, 70), `h -50` a (230, 70), e `z` o fecha.

Escrever um `d` à mão só é útil para traçados simples. Para um ícone, copia-se de um programa de desenho vetorial (que exporta um arquivo `.svg`, aberto em um editor para copiar as etiquetas).

## `<g>` e as transformações

`<g>` (de *group*) agrupa várias formas sem desenhar nada por conta própria. Os atributos de apresentação colocados no grupo são **herdados** pelos seus filhos, a menos que um filho os redefina.

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- g: fill e stroke colocados aqui valem para os três círculos -->
    <g fill="#1a4fd6" stroke="#0b2a7a" stroke-width="3">
        <circle cx="40" cy="50" r="20"/>
        <circle cx="100" cy="50" r="20"/>
        <!-- Este filho redefine fill: ele é vermelho, mas mantém o contorno herdado -->
        <circle cx="160" cy="50" r="20" fill="#c0392b"/>
    </g>
</svg>
```

O atributo `transform` desloca, gira ou amplia um grupo inteiro de uma vez:

| Transformação | Escrita | Efeito |
|---|---|---|
| Deslocar | `translate(tx ty)` | Desloca `tx` para a direita e `ty` para baixo |
| Girar | `rotate(angle)` ou `rotate(angle cx cy)` | Gira `angle` **graus** (uma volta completa = 360) no sentido horário, em torno do ponto (0, 0) ou do ponto (cx, cy) |
| Ampliar | `scale(s)` ou `scale(sx sy)` | Multiplica as dimensões (`1`: inalterado, `0.5`: metade) |
| Inclinar | `skewX(angle)`, `skewY(angle)` | Inclina o desenho na horizontal ou na vertical |

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- translate(100 50): a origem (0,0) do grupo passa a ficar no ponto (100,50) -->
    <!-- rotate(45): depois tudo é girado 45 graus em torno dessa nova origem -->
    <g transform="translate(100 50) rotate(45)">
        <!-- Quadrado de 40 de lado centrado na origem do grupo (x e y valem -20) -->
        <rect x="-20" y="-20" width="40" height="40" fill="#1a4fd6"/>
    </g>
</svg>
```

O quadrado fica centrado em (100, 50) e, depois de girado 45 graus, apresenta-se como um losango cujas pontas ficam a cerca de 28 unidades do centro (a metade da diagonal, ou seja, 20 × √2). Várias transformações se sucedem em um mesmo atributo, e **a ordem importa**: cada uma se aplica no referencial já deslocado pelas anteriores, portanto `translate(100 50) rotate(45)` (girar no lugar, no ponto (100, 50)) não é `rotate(45) translate(100 50)` (deslocar ao longo de um eixo já girado).

## O estilo: atributos, CSS, `currentColor` e variáveis

Uma forma SVG recebe estilo de três maneiras. Elas se combinam, e a mais prioritária prevalece (ver [a cascata](/?c=langages&s=css&p=variables-et-cascade): a ordem das regras que se contradizem).

| Maneira | Exemplo | Prioridade |
|---|---|---|
| Atributo de apresentação | `<circle fill="red">` | A mais fraca: qualquer regra CSS a substitui |
| Regra CSS de uma folha de estilo | `.setor { fill: blue; }` | Média |
| Atributo `style` da etiqueta | `<circle style="fill: green">` | A mais forte |

Se um `<circle class="setor" fill="red">` encontrar a regra `.setor { fill: blue; }`, o círculo fica, portanto, azul. O CSS é o lugar certo para as cores que mudam (passagem do mouse, tema), os atributos para o próprio desenho. As formas de um SVG escrito na página recebem estilo como qualquer elemento, inclusive as [pseudoclasses](/?c=langages&s=css&p=selecteurs) como `:hover` (o ponteiro está sobre ela). As propriedades, por sua vez, mudam de nome:

| Em HTML | Para uma forma SVG | Observação |
|---|---|---|
| `background-color` | `fill` | O fundo de uma forma é seu preenchimento |
| `color` (texto) | `fill` | A cor de um `<text>` SVG é seu `fill`, não `color` |
| `border-color`, `border-width` | `stroke`, `stroke-width` | O contorno de uma forma é um `stroke` |
| `margin`, `padding` | Nenhum equivalente | Uma forma se posiciona pelas suas coordenadas |
| `z-index` | Nenhum equivalente | A ordem no código decide (ver [as armadilhas](#as-armadilhas)) |

Duas ferramentas ligam a imagem ao resto da página:

- **`currentColor`** é uma palavra-chave que significa "o valor atual da propriedade CSS `color` do elemento". Escrever `fill="currentColor"` faz o ícone seguir a cor do texto que o cerca.
- Uma **variável CSS** (ver [as variáveis](/?c=langages&s=css&p=variables-et-cascade)) é lida em um SVG escrito na página, como no restante do documento: `fill: var(--cor-primaria)`. Um SVG carregado por `<img>` não tem acesso a ela.

```css
:root {
    --cor-primaria: #1a4fd6;           /* declarada uma vez para a página toda */
}

.botao-icone {
    color: var(--cor-primaria);        /* cor do texto do botão, portanto do ícone */
}

.botao-icone:hover {
    color: #c0392b;                    /* ao passar o mouse, texto E ícone ficam vermelhos */
}

.botao-icone svg {
    width: 24px;                       /* o ícone é exibido em 24 x 24 pixels */
    height: 24px;
}
```

```html
<button class="botao-icone">
    <!-- aria-hidden="true": oculta o ícone dos leitores de tela (ver mais abaixo) -->
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <!-- Triângulo de vértices (12,3), (21,20), (3,20) -->
        <!-- fill="currentColor": o preenchimento assume a cor do texto -->
        <path d="M 12 3 L 21 20 L 3 20 Z" fill="currentColor"/>
    </svg>
    Alerta
</button>
```

O [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite) muda de cor ao passar o mouse, e seu ícone junto, sem que nenhuma regra mire o SVG.

## `<text>`: escrever dentro de uma imagem

`<text>` exibe um texto em **coordenadas**. Seu ponto de referência (x, y) não é o canto superior esquerdo, mas o início da **linha de base**: a linha imaginária sobre a qual repousam as letras (as caudas do "g" e do "p" descem abaixo dela).

```html
<svg viewBox="0 0 300 120" width="300" height="120">
    <!-- Referência: linha vertical tracejada (4 de traço, 4 de vazio) em x = 150 -->
    <line x1="150" y1="0" x2="150" y2="120" stroke="#999" stroke-dasharray="4 4"/>
    <!-- text-anchor: de que lado do ponto x o texto se estende -->
    <!-- font-size: tamanho das letras -->
    <text x="150" y="30" font-size="18" text-anchor="start">início</text>
    <text x="150" y="60" font-size="18" text-anchor="middle">meio</text>
    <text x="150" y="90" font-size="18" text-anchor="end">fim</text>
</svg>
```

As três palavras têm sua linha de base nas alturas 30, 60 e 90. "início" começa em x = 150 e se estende para a direita, "meio" é centralizado em x = 150, "fim" termina em x = 150.

| Atributo | Valores | Efeito |
|---|---|---|
| `text-anchor` | `start` (padrão), `middle`, `end` | Posição **horizontal** do texto em relação a `x` |
| `dominant-baseline` | `auto` (padrão), `middle`, `central`, `hanging` | Posição **vertical** do texto em relação a `y` |
| `font-size`, `font-family`, `font-weight` | Como em CSS | Tamanho, fonte, peso, em atributo ou em CSS |

Para `dominant-baseline`, `auto` alinha a base das letras sem haste em `y`, `middle` alinha `y` ao meio da altura das letras minúsculas, `central` ao meio da linha inteira, e `hanging` alinha o topo do texto em `y`. `dominant-baseline="central"` com `text-anchor="middle"` serve para centralizar um texto em um círculo; como a diferença exata entre `middle` e `central` é sutil, confere-se a olho no navegador visado.

O texto SVG **não** é texto HTML:

| | Texto HTML (`<p>`) | Texto SVG (`<text>`) |
|---|---|---|
| Quebra de linha automática | Sim, conforme a largura do contêiner | **Não**: uma única linha, que transborda ou é cortada |
| Posição | No fluxo da página | Nas coordenadas `x` e `y` |
| Cor | `color` | `fill` |
| Fundo, borda, margem | Sim | Não: é preciso desenhar um `<rect>` atrás |
| Tamanho na tela | Independente da imagem | Escalonado com a `viewBox`: um SVG reduzido à metade exibe um texto reduzido à metade |
| Selecionável e pesquisável | Sim | Sim, se permanecer um `<text>` real |

Para escrever em várias linhas, quebra-se à mão com `<tspan>`, um pedaço de texto dentro de `<text>` que pode ser posicionado à parte:

```html
<svg viewBox="0 0 200 80" width="200" height="80">
    <text x="10" y="30" font-size="16">
        <!-- x="10" leva cada pedaço de volta à borda esquerda; dy: deslocamento vertical -->
        <tspan x="10">Primeira linha</tspan>
        <!-- dy="1.2em": desce 1,2 vez o tamanho da fonte -->
        <tspan x="10" dy="1.2em">Segunda linha</tspan>
    </text>
</svg>
```

A unidade `em` vale o tamanho da fonte em uso (ver [as unidades relativas](/?c=langages&s=css&p=responsive-et-media-queries)): `1.2em` deixa, portanto, um entrelinhamento proporcional ao texto. Para saber se um texto cabe no espaço disponível, `getComputedTextLength()` dá sua largura em unidades de usuário; a ideia é a mesma de `measureText()` do [capítulo sobre o canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations), aplicada a um elemento SVG:

```javascript
// Localiza o texto e o retângulo que deve lhe servir de fundo
const etiqueta = document.getElementById("etiqueta");
const fundo = document.getElementById("fundo-etiqueta");

// getComputedTextLength(): largura real do texto exibido, em unidades de usuário
const largura = etiqueta.getComputedTextLength();
// O fundo tem a largura do texto mais 16 de margem (8 de cada lado)
fundo.setAttribute("width", largura + 16);
```

## A animação

Como as formas são elementos do DOM, as três grandes técnicas de animação da web se aplicam.

### Em CSS: `transition` e `@keyframes`

As noções de [transition e de @keyframes](/?c=langages&s=css&p=animations-css-performantes) valem para as formas SVG. As propriedades próprias do SVG (`fill`, `stroke`, `stroke-dashoffset`...) se animam como as demais:

```css
.setor {
    fill: #1a4fd6;                       /* cor de partida */
    transition: fill 0.2s ease-out;      /* anima fill por 0,2 segundo, desacelerando */
}

.setor:hover {
    fill: #c0392b;                       /* ao passar o mouse, vira vermelho */
}
```

Para um movimento ou um aumento, anima-se `transform`. Em uma forma **dentro** de um SVG, há uma armadilha: o ponto em torno do qual a forma gira ou cresce (a **origem da transformação**, `transform-origin`) é por padrão a origem (0, 0) do referencial do SVG inteiro, e não o centro da forma. `transform-box: fill-box` faz calcular a origem sobre a **caixa delimitadora** da forma (o menor retângulo que a contém), e `transform-origin: center` a coloca no meio dessa caixa ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-box)).

```css
.pulsacao {
    transform-box: fill-box;             /* a origem se mede sobre a caixa da forma */
    transform-origin: center;            /* no centro dessa caixa */
    animation: batimento 1.2s ease-in-out infinite;   /* nome, duração, curva, repetição */
}

@keyframes batimento {
    0%   { transform: scale(1); }        /* início: tamanho normal */
    50%  { transform: scale(1.3); }      /* a meio caminho: 130% */
    100% { transform: scale(1); }        /* fim: volta ao tamanho normal */
}
```

```html
<svg viewBox="0 0 100 100" width="100" height="100">
    <!-- A classe pulsacao aplica a animação: o disco cresce e depois diminui -->
    <circle class="pulsacao" cx="50" cy="50" r="20" fill="#c0392b"/>
</svg>
```

Um segundo uso clássico é o **anel de progresso**. A volta de um círculo (sua **circunferência**) vale 2 × π × r, onde π (≈ 3,14159) é a razão entre a volta de um círculo e seu diâmetro. Para r = 40, isso dá cerca de 251,33. Define-se `stroke-dasharray` com esse valor (um traço tão longo quanto o círculo, seguido de um vazio igualmente longo) e `stroke-dashoffset` com a parte oculta: 251,33 esconde o anel inteiro, `0` o exibe por completo.

```html
<svg viewBox="0 0 100 100" width="100" height="100">
    <!-- Anel de fundo, cinza, completo -->
    <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" stroke-width="8"/>
    <!-- Anel de progresso: rotate(-90 50 50) faz o traçado partir do topo do círculo -->
    <circle id="progresso" class="progresso" cx="50" cy="50" r="40" fill="none"
            stroke="#1a4fd6" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="251.33" stroke-dashoffset="251.33"
            transform="rotate(-90 50 50)"/>
</svg>
<button id="avancar">Avançar para 75%</button>
```

```css
.progresso {
    transition: stroke-dashoffset 0.6s ease-out;   /* o traço se desenrola em 0,6 segundo */
}
```

```javascript
// Circunferência do círculo de raio 40 (Math.PI vale π)
const CIRCUNFERENCIA = 2 * Math.PI * 40;
const progresso = document.getElementById("progresso");

// parte: um número entre 0 (nada) e 1 (tudo); a parte oculta é o restante
function exibirAvanco(parte) {
    progresso.style.strokeDashoffset = CIRCUNFERENCIA * (1 - parte);
}

// Um clique no botão preenche o anel até três quartos (o deslocamento passa para 62,83)
document.getElementById("avancar").addEventListener("click", () => {
    exibirAvanco(0.75);
});
```

O anel começa vazio: ao clicar, o valor de `stroke-dashoffset` passa de 251,33 para cerca de 62,83 e a regra `transition` faz o traço deslizar de um valor a outro. A transição só começa se o valor mudar **depois** da primeira exibição: por isso a chamada é colocada dentro de um clique.

### Com `<animate>` (SMIL)

**SMIL** (*Synchronized Multimedia Integration Language*) é uma linguagem de animação escrita diretamente nas etiquetas do SVG: uma etiqueta `<animate>` colocada na forma descreve qual atributo varia, entre quais valores e por quanto tempo.

```html
<svg viewBox="0 0 60 60" width="60" height="60">
    <circle cx="30" cy="30" r="10" fill="#1a4fd6">
        <!-- attributeName: o atributo a animar (o raio r) -->
        <!-- from e to: valores de partida e de chegada; dur: duração de uma passagem -->
        <!-- repeatCount="indefinite": recomeça sem fim -->
        <animate attributeName="r" from="10" to="25" dur="2s" repeatCount="indefinite"/>
    </circle>
</svg>
```

SMIL funciona sem CSS nem JavaScript, mas vive à parte: a [media query](/?c=langages&s=css&p=responsive-et-media-queries) `prefers-reduced-motion` (uma condição que lê uma configuração do usuário, ver mais abaixo) não o interrompe. Para um projeto novo, prefere-se CSS e JavaScript.

### Em JavaScript

Cria-se e modifica-se as formas com as ferramentas do [DOM](/?c=langages&s=javascript&p=dom-et-evenements) (`getElementById`, `setAttribute`, `classList`...). Há uma única diferença: uma forma SVG pertence a outro **espaço de nomes** que o HTML. Um espaço de nomes XML (*XML namespace*) é um identificador, escrito na forma de um endereço web, que indica a qual vocabulário pertence uma etiqueta (HTML ou SVG). Para criar uma forma, usa-se, portanto, `document.createElementNS` (o "NS" vem de *namespace*) com o endereço do SVG, e não `document.createElement`.

```html
<svg id="grafico" viewBox="0 0 300 100" width="300" height="100"></svg>
```

```javascript
// Endereço que identifica o vocabulário SVG (é um nome, o navegador não o visita)
const ESPACO_SVG = "http://www.w3.org/2000/svg";
const valores = [30, 80, 55];                       // a altura de cada barra
const grafico = document.getElementById("grafico");

// forEach chama a função para cada valor do array, com sua posição (0, 1, 2)
valores.forEach((valor, posicao) => {
    // createElementNS: cria uma forma SVG de verdade (createElement: elemento desconhecido)
    const barra = document.createElementNS(ESPACO_SVG, "rect");
    barra.setAttribute("x", posicao * 100 + 20);    // barras em x = 20, 120 e 220
    barra.setAttribute("y", 100 - valor);           // topo da barra (y cresce para baixo)
    barra.setAttribute("width", 60);                // 60 unidades de largura
    barra.setAttribute("height", valor);            // altura da barra
    barra.setAttribute("fill", "#1a4fd6");          // cor de preenchimento
    grafico.appendChild(barra);                     // adiciona ao SVG: ela aparece
});
```

O resultado são três retângulos de 60 de largura, cuja base encosta na linha y = 100 e cuja altura é 30, 80 e 55 (seu topo fica, portanto, em y = 70, 20 e 45). Para uma animação contínua, combinam-se essas modificações com `requestAnimationFrame`, apresentado no [capítulo sobre o canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations):

```javascript
const ponto = document.getElementById("ponto");       // um <circle id="ponto"> do SVG
// matchMedia testa a media query; .matches vale true se a opção do sistema estiver ativa
const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function imagem(agora) {                              // agora: tempo, em milissegundos
    // 1 unidade a cada 20 ms; % (resto da divisão) volta a 0 depois de 260
    ponto.setAttribute("cx", 20 + ((agora / 20) % 260));
    requestAnimationFrame(imagem);                    // programa o quadro seguinte
}

if (!reduzido) requestAnimationFrame(imagem);         // nada se move se isso for recusado
```

O ponto se desloca entre x = 20 e x = 280 em uma `viewBox` de 300 de largura, a menos que o usuário tenha pedido para reduzir as animações.

### Respeitar `prefers-reduced-motion`

Algumas pessoas toleram mal o movimento na tela (tonturas, enjoos): o sistema operacional delas oferece uma configuração "reduzir animações", que o CSS lê com a media query `prefers-reduced-motion`, explicada no [capítulo sobre as animações](/?c=langages&s=css&p=animations-css-performantes). O princípio continua válido para um SVG:

```css
@media (prefers-reduced-motion: reduce) {
    .pulsacao {
        animation: none;            /* o disco permanece imóvel */
    }

    .progresso {
        transition: none;           /* o anel vai ao novo valor de uma vez */
    }
}
```

Para um SVG animado por `<animate>`, é preciso interrompê-lo em JavaScript: o elemento `<svg>` possui um método `pauseAnimations()` que congela todas as suas animações SMIL (`document.querySelector("svg").pauseAnimations()`).

## A acessibilidade

Um **leitor de tela** lê a página em voz alta para pessoas cegas ou com baixa visão (ver [ARIA e leitores de tela](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). Uma imagem não tem sentido algum para ele sem texto: é preciso, portanto, dizer o que ela representa, ou indicar que ela é decorativa. O navegador constrói, de fato, uma lista simplificada da página para esses programas, que contém apenas o que o código manda nela colocar.

| Situação | Solução | Exemplo |
|---|---|---|
| Imagem que traz uma informação (gráfico, esquema) | `role="img"` + `<title>` + eventualmente `<desc>` + `aria-labelledby` | Ver o código abaixo |
| Imagem decorativa (enfeite, ícone ao lado de um texto já explícito) | `aria-hidden="true"` | `<svg aria-hidden="true">` |
| Ícone sozinho em um botão | `aria-label` no botão, `aria-hidden` no ícone | `<button aria-label="Fechar">` |
| Dado complexo (gráfico com várias séries) | Uma [tabela HTML](/?c=langages&s=html&p=tableaux) equivalente, ao lado do SVG | Os valores legíveis linha por linha |

- **`role="img"`** declara que todo o SVG é uma imagem única: o leitor de tela não anuncia suas formas uma a uma.
- **`<title>`** dá o nome curto da imagem. Colocado como **primeiro filho** de `<svg>`, ele também aparece como dica (um pequeno balão ao passar o mouse) na maioria dos navegadores. **`<desc>`** (*description*) dá uma explicação mais longa.
- **`aria-labelledby`** (ver [ARIA](/?c=langages&s=html&p=attributs-data-et-accessibilite)) nomeia o elemento a partir de outros elementos da página, designados pelo seu `id`. Ligar explicitamente o `<title>` ao SVG é a prática mais segura, pois seu suporte sozinho nem sempre foi uniforme entre os leitores de tela.

```html
<!-- role="img": uma imagem única; aria-labelledby: seu nome vem dos elementos -->
<!-- cujos id são listados: o título e a descrição -->
<svg role="img" aria-labelledby="titulo-vendas desc-vendas"
     viewBox="0 0 300 100" width="300" height="100">
    <!-- <title>: o nome curto; o id permite que aria-labelledby o encontre -->
    <title id="titulo-vendas">Vendas por trimestre</title>
    <!-- <desc>: o detalhe dos dados, para quem não vê as barras -->
    <desc id="desc-vendas">30 no primeiro trimestre, 80 no segundo, 55 no terceiro.</desc>
    <rect x="20" y="70" width="60" height="30" fill="#1a4fd6"/>
    <rect x="120" y="20" width="60" height="80" fill="#1a4fd6"/>
    <rect x="220" y="45" width="60" height="55" fill="#1a4fd6"/>
</svg>
```

```html
<!-- Ícone decorativo: aria-hidden="true" o retira do que o leitor de tela lê -->
<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#1a4fd6"/>
</svg>

<!-- Botão que contém só um ícone: seu nome vem de aria-label -->
<button aria-label="Fechar a janela">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
        <path d="M 4 4 L 20 20 M 20 4 L 4 20" stroke="currentColor" stroke-width="3"/>
    </svg>
</button>
```

Resta a questão do texto. Um SVG pode conter **texto real** (`<text>`) ou texto **desenhado** (as letras convertidas em traçados `path`, como em muitos logotipos exportados).

| | Texto real (`<text>`) | Texto convertido em traçados (`path`) |
|---|---|---|
| Selecionável e pesquisável (Ctrl+F) | Sim | Não |
| Lido por um leitor de tela | Sim, salvo se o SVG estiver em `role="img"` (então só o `<title>` é lido) | Não: o `<title>` precisa dizer tudo |
| Fonte e idioma | Dependem das fontes instaladas | Fixos, renderização idêntica em todo lugar |
| Traduzível, modificável | Sim | Não |

Um gráfico com `role="img"` oculta seus `<text>` internos dos leitores de tela: a informação que eles trazem deve, portanto, constar no `<title>` ou no `<desc>`, ou em uma tabela colocada ao lado. As cores obedecem às regras de [contraste](/?c=ui-ux&p=couleur-et-contraste), e uma informação nunca deve passar somente pela cor (ver [a acessibilidade em UX](/?c=ui-ux&p=accessibilite-ux)).

## A interação: ponteiro e teclado

Uma forma SVG escuta os eventos como qualquer elemento (`click`, `keydown`...). Os **eventos de ponteiro** (*pointer events*, entre eles `pointerdown`, `pointermove`, `pointerenter`) reúnem mouse, dedo e caneta sob um mesmo nome: um único código basta para todos os dispositivos ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).

Quais partes de uma forma reagem ao ponteiro? A propriedade `pointer-events` define isso: ela decide quais zonas de um elemento podem ser alvo de um clique ou de uma passagem do mouse.

| Valor | Zona que reage | Caso de uso |
|---|---|---|
| `visiblePainted` (padrão; o valor `auto` é equivalente) | As partes **pintadas**: preenchimento se `fill` não for `none`, contorno se `stroke` não for `none` | Comportamento normal |
| `all` | Todo o interior e o contorno, mesmo sem preenchimento nem contorno | Zona clicável em uma forma transparente |
| `stroke` | Somente o contorno | Um medidor em que só o anel reage |
| `none` | **Nenhuma**: o clique atravessa a forma e atinge o que está embaixo | Uma legenda ou uma camada decorativa colocada por cima |

Uma forma com `fill="none"` não é, portanto, clicável no meio por padrão: o ponteiro a atravessa. Daí `pointer-events="all"` no exemplo seguinte.

No teclado, uma forma SVG **não é alcançável** pela tecla Tab (ver [o foco e o `tabindex`](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). `tabindex="0"` a torna focalizável, e é preciso acrescentar um papel, um nome e a reação às teclas Enter e Espaço, que o navegador só fornece para os botões de verdade.

```html
<svg id="cena" viewBox="0 0 200 100" width="400" height="200">
    <!-- tabindex="0": alcançável por Tab; role="button", aria-label: anunciado como botão -->
    <!-- pointer-events="all": todo o disco reage, embora fill seja none -->
    <circle id="zona" class="zona" cx="100" cy="50" r="30" fill="none"
            stroke="#1a4fd6" stroke-width="4" pointer-events="all"
            tabindex="0" role="button" aria-label="Ativar a zona"/>
    <!-- pointer-events="none": este ponto segue o ponteiro sem interceptar cliques -->
    <circle id="cursor" cx="0" cy="0" r="4" fill="#c0392b"
            pointer-events="none"/>
</svg>
```

```css
.zona.ativo {
    fill: #e8eefc;                 /* estado "ativado": o interior se preenche */
}

.zona:focus-visible {
    stroke: #c0392b;               /* foco pelo teclado: o contorno muda de cor */
    stroke-width: 6;               /* e engrossa, para continuar bem visível */
}
```

```javascript
const cena = document.getElementById("cena");
const zona = document.getElementById("zona");
const cursor = document.getElementById("cursor");

// classList.toggle adiciona a classe "ativo" se ela faltar, e a retira caso contrário
function ativar() {
    zona.classList.toggle("ativo");
}

// click cobre o mouse e o dedo; keydown acrescenta o teclado
zona.addEventListener("click", ativar);
zona.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();        // impede a página de rolar ao pressionar Espaço
        ativar();
    }
});

// pointermove: a cada deslocamento do ponteiro sobre o SVG
cena.addEventListener("pointermove", (evento) => {
    // DOMPoint: um ponto (x, y); clientX e clientY: posição do ponteiro na janela
    const pixel = new DOMPoint(evento.clientX, evento.clientY);
    // getScreenCTM(): a conversão desenho para pixels; inverse(): pixels para desenho
    const local = pixel.matrixTransform(cena.getScreenCTM().inverse());
    cursor.setAttribute("cx", local.x);     // coordenadas na viewBox, não em pixels
    cursor.setAttribute("cy", local.y);
});
```

O último bloco ilustra uma sutileza devida à `viewBox`: as coordenadas do ponteiro (`clientX`, `clientY`) estão em pixels da janela, enquanto `cx` e `cy` estão em unidades de usuário. Um SVG exibido em 400 × 200 para uma `viewBox` de 200 × 100 duplica cada valor, daí a conversão por `getScreenCTM()`.

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| Arquivo `.svg` autônomo sem `xmlns="http://www.w3.org/2000/svg"` | Fora de uma página HTML, o arquivo é lido como **XML** (uma linguagem de marcação parecida com o HTML, mais rigorosa) e o navegador não sabe que as etiquetas são SVG: a imagem não aparece. Em uma página HTML, o atributo é desnecessário |
| `viewBox` esquecida | O SVG mantém seu tamanho fixo em pixels e não se adapta mais ao seu contêiner. Sempre definir uma `viewBox` e ajustar o tamanho em CSS |
| `id` duplicado entre vários SVG da página | Um `id` deve ser único em **toda** a página: as referências como `fill="url(#gradiente)"` ou `aria-labelledby` apontam então para o primeiro elemento encontrado, às vezes em outro SVG. Prefixar os `id` de cada SVG |
| Procurar um `z-index` | Ele não existe em SVG: a forma escrita por **último** no código é desenhada por cima das outras. Reordenar o código, ou em JavaScript `appendChild` sobre a forma já presente, a move para o fim |
| `width` e `height` em CSS e em atributos ao mesmo tempo | A regra CSS prevalece sobre o atributo. Escolher um único lugar (o CSS para um SVG adaptável) |
| `document.createElement("circle")` | Cria um elemento HTML desconhecido, nunca desenhado. Usar `createElementNS` com o endereço do SVG |
| `className` em JavaScript em uma forma SVG | Num elemento SVG, ele retorna um objeto e não o texto das classes. Usar `classList` |
| `color`, `background`, `border`, `margin` em uma forma | Sem efeito: usar `fill`, `stroke` e as coordenadas |
| `line` sem `stroke`, ou `fill` esquecido | Uma linha sem contorno é invisível, uma forma sem `fill` é preta |
| `fill="none"` e clique no meio da forma | O ponteiro atravessa a forma. Acrescentar `pointer-events="all"` |
| Texto esperado em várias linhas | `<text>` nunca quebra sozinho. Dividir com `<tspan>` ou usar HTML em volta do SVG |
| Texto ilegível no celular | Ele encolhe com o SVG. Prever um tamanho mínimo ou adaptar a `viewBox` |
| Rotação ou escala de uma forma em torno do ponto errado | Por padrão, a origem é o ponto (0, 0) do SVG. Acrescentar `transform-box: fill-box; transform-origin: center` |
| `<animate>` (SMIL) não interrompido para `prefers-reduced-motion` | O CSS não tem efeito sobre ele. Chamar `pauseAnimations()` ou não utilizá-lo |
| SVG informativo sem `<title>`, ou decorativo sem `aria-hidden` | O leitor de tela não diz nada útil ou lê formas sem sentido |
| Forma interativa sem `tabindex`, `role` e tratamento das teclas | Inutilizável pelo teclado |

Eis como a unicidade dos `id` quebra um gradiente. `<defs>` é uma área onde se declaram elementos reutilizáveis, que só são desenhados quando uma forma os referencia; `url(#nome)` designa o elemento de `id` "nome"; `<linearGradient>` declara um gradiente que passa gradualmente de uma cor a outra (ver [os gradientes CSS](/?c=langages&s=css&p=degrades) para a ideia); cada `<stop>` fixa a cor (`stop-color`) em uma posição (`offset`) entre 0 e 1.

```html
<!-- Primeiro SVG: um gradiente de id "gradiente", do azul ao azul claro -->
<svg viewBox="0 0 100 40" width="100" height="40">
    <defs>
        <linearGradient id="gradiente">
            <stop offset="0" stop-color="#1a4fd6"/>
            <stop offset="1" stop-color="#8fb0ff"/>
        </linearGradient>
    </defs>
    <rect width="100" height="40" fill="url(#gradiente)"/>
</svg>

<!-- RUIM: mesmo id "gradiente": este retângulo usará o primeiro gradiente -->
<svg viewBox="0 0 100 40" width="100" height="40">
    <defs>
        <linearGradient id="gradiente">
            <stop offset="0" stop-color="#c0392b"/>
            <stop offset="1" stop-color="#f5b7b1"/>
        </linearGradient>
    </defs>
    <rect width="100" height="40" fill="url(#gradiente)"/>
</svg>
```

O segundo SVG deveria ser vermelho, mas seu `fill="url(#gradiente)"` designa o primeiro elemento da página que tem esse `id`, portanto o gradiente azul. A correção é renomear os `id`: `gradiente-azul` para um, `gradiente-vermelho` para o outro.

E eis a ordem de desenho:

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- Desenhado primeiro: azul, centrado em (80,50) -->
    <circle cx="80" cy="50" r="30" fill="#1a4fd6"/>
    <!-- Desenhado depois: vermelho, centrado em (120,50), cobre o azul de x = 90 a 110 -->
    <circle cx="120" cy="50" r="30" fill="#c0392b"/>
</svg>
```

Para que o círculo azul fique por cima, ele é colocado **depois** do vermelho no código.

## Boas práticas

| Boa prática | Por que |
|---|---|
| Sempre escrever uma `viewBox`, definir o tamanho em CSS | O SVG se adapta ao seu contêiner sem perder nitidez |
| Escrever na página os SVG a estilizar, animar ou ler por script; usar `<img>` para uma ilustração fixa | Os primeiros aproveitam CSS e JavaScript, os segundos ficam em cache |
| Usar `fill="currentColor"` e variáveis CSS para os ícones | Um ícone segue a cor do texto e o tema da página |
| Colocar no CSS as cores que mudam, e o desenho nos atributos | O CSS prevalece, e a aparência muda sem tocar no desenho |
| Prefixar os `id` de cada SVG (`gradiente-azul`, `titulo-vendas`) | As referências `url(#...)` e `aria-labelledby` nunca se cruzam |
| Animar `transform`, `opacity`, `fill`, `stroke-dashoffset` em vez de atributos de geometria (`cx`, `width`) | Essas propriedades se animam em qualquer lugar em CSS. Medir depois, pois a aceleração pela placa gráfica depende do navegador para formas dentro de um SVG |
| Prever `prefers-reduced-motion` para cada animação, SMIL incluído | Respeitar as pessoas sensíveis ao movimento |
| `role="img"` + `<title>` (+ `<desc>`) + `aria-labelledby` para uma imagem informativa; `aria-hidden="true"` para uma imagem decorativa | O leitor de tela diz o essencial ou se cala |
| Complementar um gráfico complexo com uma tabela HTML | Os valores continuam legíveis por todos |
| Manter o `<text>` real em vez de letras convertidas em traçados | Texto selecionável, pesquisável e traduzível |
| Tornar uma forma interativa alcançável pelo teclado, com foco visível | O mesmo serviço para o mouse, o dedo e o teclado |

## O que reter

| | |
|---|---|
| **A reter** | Um SVG descreve formas, não pixels: permanece nítido em qualquer tamanho. Escrito na página, cada forma é um elemento do DOM, estilizável em CSS, animável e controlável em JavaScript. A `viewBox` define o referencial (origem no canto superior esquerdo, `y` para baixo) e a escala. As formas básicas são `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon` e `path` (comandos `M`, `L`, `C`, `Z`). `<g>` agrupa e `transform` desloca, gira ou amplia. A cor se define com `fill` e `stroke`, e `currentColor` segue o texto. `<text>` se posiciona por coordenadas, sem quebra de linha automática. Um SVG informativo tem um `role="img"`, um `<title>` e um `aria-labelledby`; um SVG decorativo tem `aria-hidden="true"`. |
| **Armadilhas a evitar** | `xmlns` esquecido em um arquivo autônomo; `viewBox` esquecida; `id` duplicado; procurar um `z-index` (a ordem do código decide); `createElement` no lugar de `createElementNS`; `color` ou `background` em uma forma; `fill="none"` que deixa passar o clique; texto em várias linhas sem `<tspan>`; transformação em torno do ponto errado; SMIL que ignora `prefers-reduced-motion`; forma clicável mas inutilizável pelo teclado. |
| **Boas práticas** | `viewBox` mais tamanho em CSS; `currentColor` e variáveis CSS; `id` prefixados; animar `transform`, `opacity`, `fill` ou `stroke-dashoffset`; variante para `prefers-reduced-motion`; título e descrição para uma imagem informativa, `aria-hidden` para um enfeite; tabela HTML em complemento a um gráfico; texto real em vez de texto convertido em traçados; `tabindex`, papel e teclas em toda forma interativa. |
