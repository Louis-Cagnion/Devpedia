---
order: 2
---

# As tags de texto

O conteúdo textual de uma página HTML se organiza em torno de algumas tags fundamentais (títulos, parágrafos, listas) cuja escolha sempre deve refletir o **sentido** do conteúdo, não apenas a aparência visual desejada (a aparência é papel do [CSS](/?c=langages-de-balisage&s=css&p=css)).

## Os títulos

```html
<h1>Titulo principal</h1>
<h2>Subtitulo</h2>
<h3>Subsubtitulo</h3>
```

De `<h1>` (o mais importante) a `<h6>` (o menos importante). Uma página deveria conter apenas **um único** `<h1>` (o título principal da página), e os níveis nunca deveriam ser "pulados" por um simples efeito visual (`<h1>` seguido diretamente de `<h4>`): a hierarquia de títulos é usada pelos leitores de tela para navegar na página (veja [Atributos data-* e acessibilidade](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)), não apenas para o tamanho do texto.

## Os parágrafos

```html
<p>Um paragrafo de texto.</p>
```

## As listas

```html
<ul>
    <li>Maca</li>
    <li>Banana</li>
</ul>

<ol>
    <li>Primeira etapa</li>
    <li>Segunda etapa</li>
</ol>
```

`<ul>` (*unordered list*) para uma lista sem ordem significativa, `<ol>` (*ordered list*) quando a ordem importa (um procedimento, uma classificação...): o navegador numera automaticamente os `<li>` de um `<ol>`.

## Ênfase no texto

```html
<strong>Texto importante</strong>
<em>Texto em enfase</em>
```

> **Nota:** `<strong>`/`<em>` expressam uma importância **semântica** (compreendida por um leitor de tela, que pode por exemplo acentuar vocalmente esse texto), ao contrário de `<b>`/`<i>` (negrito/itálico puramente visuais, sem significado). Priorizar `<strong>`/`<em>` por padrão, e reservar `<b>`/`<i>` para os casos em que apenas o aspecto visual é buscado, sem intenção de sentido (ex: um nome de espécie em latim, convencionalmente em itálico).

## Quebras de linha e separadores

```html
<br>       <!-- quebra de linha, dentro de um mesmo bloco de texto -->
<hr>       <!-- linha horizontal, separacao tematica entre duas secoes -->
```

> **Nota:** `<br>` não deve ser usado para criar espaçamento visual entre dois parágrafos: esse é o papel do CSS (`margin`, veja [O modelo de caixa](/?c=langages-de-balisage&s=css&p=box-model)). Um uso repetido de `<br><br>` para "fazer espaço" é um sinal de que se está usando HTML para apresentação, quando essa não é sua responsabilidade.

## Citações

```html
<blockquote cite="https://fonte.com">
    <p>Uma citacao longa, geralmente exibida em recuo visual.</p>
</blockquote>

<p>Como dizia <q>uma citacao curta, integrada em uma frase</q>.</p>
```

Veja também [A semântica do HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5) para as tags que estruturam seções inteiras de conteúdo, além do texto em si.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A escolha de uma tag de texto deve refletir o sentido do conteúdo (título, parágrafo, lista, ênfase), nunca apenas a aparência visual desejada: a aparência é papel do CSS. |
| **Ferramentas utilizáveis** | `<h1>`-`<h6>`, `<p>`, `<ul>`/`<ol>`/`<li>`, `<strong>`/`<em>`, `<blockquote>`/`<q>`. |
| **Armadilhas a evitar** | Pular níveis de título por um efeito visual (`<h1>` seguido de `<h4>`); usar `<b>`/`<i>` (puramente visuais) onde `<strong>`/`<em>` (sentido) seriam mais adequados; encadear `<br>` para criar espaçamento. |
| **Boas práticas** | Uma única tag `<h1>` por página; priorizar `<strong>`/`<em>` por padrão, reservar `<b>`/`<i>` aos casos puramente visuais sem intenção de sentido. |
