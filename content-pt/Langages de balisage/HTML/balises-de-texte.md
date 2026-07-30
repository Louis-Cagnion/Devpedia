---
order: 2
---

# As etiquetas de texto

O conteúdo textual de uma página HTML organiza-se em torno de algumas etiquetas fundamentais — títulos, parágrafos, listas — cuja escolha deve refletir sempre o **significado** do conteúdo, e não apenas a aparência visual pretendida (a aparência é da competência do CSS, ver capítulo dedicado).

## Os títulos

```html
<h1>Titre principal</h1>
<h2>Sous-titre</h2>
<h3>Sous-sous-titre</h3>
```

De `<h1>` (o mais importante) a `<h6>` (o menos importante). Uma página só deve conter um** único** `<h1>` (o título principal da página), e os níveis nunca devem ser «saltados» apenas por uma questão de efeito visual (`<h1>` seguido diretamente de `<h4>`) — a hierarquia dos títulos é utilizada pelos leitores de ecrã para navegar na página (ver capítulo sobre acessibilidade), e não apenas para definir o tamanho do texto.

## Os parágrafos

```html
<p>Un paragraphe de texte.</p>
```

## As listas

```html
<ul>
    <li>Pomme</li>
    <li>Banane</li>
</ul>

<ol>
    <li>Première étape</li>
    <li>Deuxième étape</li>
</ol>
```

`<ul>` (*lista não ordenada*) para uma lista sem ordem significativa, `<ol>` (*lista ordenada*) quando a ordem é importante (um procedimento, uma classificação...) — o navegador numera automaticamente as `<li>` de um `<ol>`.

## Destaque do texto

```html
<strong>Texte important</strong>
<em>Texte en emphase</em>
```

> **Nota:** `<strong>` / `<em>` expressam uma importância **semântica** (compreendida por um leitor de ecrã, que pode, por exemplo, realçar vocalmente este texto), ao contrário de `<b>` / `<i>` (negrito/itálico puramente visuais, sem significado). Dar preferência a `<strong>` / `<em>` por predefinição e reservar `<b>` / `<i>` para os casos em que se procura apenas o aspeto visual, sem intenção de transmitir significado (por exemplo: um nome de espécie em latim, convencionalmente em itálico).

## Saltos de linha e separadores

```html
<br>       <!-- saut de ligne, à l'intérieur d'un même bloc de texte -->
<hr>       <!-- ligne horizontale, séparation thématique entre deux sections -->
```

> **Nota:** `<br>` não deve ser utilizado para criar um espaçamento visual entre dois parágrafos — essa é a função do CSS (`margin`, ver capítulo dedicado). O uso repetido de `<br><br>` para «criar espaço» é um sinal de que se está a utilizar HTML para fins de apresentação, quando essa não é a sua função.

## Citações

```html
<blockquote cite="https://source.com">
    <p>Une citation longue, généralement mise en retrait visuellement.</p>
</blockquote>

<p>Comme le disait <q>une citation courte, intégrée dans une phrase</q>.</p>
```

Consulte também o capítulo sobre a semântica do HTML5 para as etiquetas que estruturam secções inteiras de conteúdo, para além do próprio texto.
