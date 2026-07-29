---
order: 2
---

# Text tags

The textual content of an HTML page is organized around a few basic tags—headings, paragraphs, lists—whose selection should always reflect the **meaning** of the content, not just the desired visual appearance (appearance is handled by CSS; see the dedicated chapter).

## The Titles

```html
<h1>Titre principal</h1>
<h2>Sous-titre</h2>
<h3>Sous-sous-titre</h3>
```

From `<h1>` (most important) to `<h6>` (least important). A page should contain only** one** `<h1>` (the page’s main title), and levels should never be “skipped” for purely visual effect (`<h1>` followed directly by `<h4>`)—the heading hierarchy is used by screen readers to navigate the page (see the chapter on accessibility), not just for text size.

## The paragraphs

```html
<p>Un paragraphe de texte.</p>
```

## The Lists

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

`<ul>` (*unordered list*) for a list with no specific order, `<ol>` (*ordered list*) when the order matters (a procedure, a ranking, etc.) — the browser automatically numbers the `<li>` on a `<ol>`.

## Text Emphasis

```html
<strong>Texte important</strong>
<em>Texte en emphase</em>
```

> **Note:** `<strong>` / `<em>` convey **semantic** significance (understood by a screen reader, which may, for example, emphasize this text vocally), unlike `<b>` / `<i>` (which use bold and italics purely for visual effect, without any semantic meaning). Use `<strong>` / `<em>` by default, and reserve `<b>` / `<i>` for cases where only the visual appearance is desired, without any intended meaning (e.g., a species name in Latin, which is conventionally italicized).

## Line Breaks and Separators

```html
<br>       <!-- saut de ligne, à l'intérieur d'un même bloc de texte -->
<hr>       <!-- ligne horizontale, séparation thématique entre deux sections -->
```

> **Note:** `<br>` should not be used to create visual spacing between two paragraphs—that is the role of CSS (`margin`; see the dedicated chapter). Repeated use of `<br><br>` to "create space" is a sign that HTML is being used for presentation, even though that is not its intended purpose.

## Quotes

```html
<blockquote cite="https://source.com">
    <p>Une citation longue, généralement mise en retrait visuellement.</p>
</blockquote>

<p>Comme le disait <q>une citation courte, intégrée dans une phrase</q>.</p>
```

See also the chapter on HTML5 semantics for tags that structure entire sections of content, beyond the text itself.
