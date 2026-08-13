---
order: 2
---

# Text Tags

The textual content of an HTML page is organized around a few fundamental tags (headings, paragraphs, lists) whose choice should always reflect the **meaning** of the content, not just the desired visual appearance (appearance is [CSS](/?c=langages-de-balisage&s=css&p=css)'s job).

## Headings

```html
<h1>Main heading</h1>
<h2>Subheading</h2>
<h3>Sub-subheading</h3>
```

From `<h1>` (most important) to `<h6>` (least important). A page should contain only **one** `<h1>` (the page's main heading), and levels should never be "skipped" for a purely visual effect (`<h1>` directly followed by `<h4>`): the heading hierarchy is used by screen readers to navigate the page (see [data-* Attributes and Accessibility](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)), not just for text size.

## Paragraphs

```html
<p>A paragraph of text.</p>
```

## Lists

```html
<ul>
    <li>Apple</li>
    <li>Banana</li>
</ul>

<ol>
    <li>First step</li>
    <li>Second step</li>
</ol>
```

`<ul>` (*unordered list*) for a list with no meaningful order, `<ol>` (*ordered list*) when order matters (a procedure, a ranking...): the browser automatically numbers the `<li>`s of an `<ol>`.

## Emphasizing text

```html
<strong>Important text</strong>
<em>Emphasized text</em>
```

> **Note:** `<strong>`/`<em>` express **semantic** importance (understood by a screen reader, which can for example stress this text vocally), unlike `<b>`/`<i>` (purely visual bold/italic, with no meaning). Favor `<strong>`/`<em>` by default, and reserve `<b>`/`<i>` for cases where only the visual look is wanted, with no intent of meaning (e.g. a species name in Latin, conventionally italicized).

## Line breaks and separators

```html
<br>       <!-- line break, within the same block of text -->
<hr>       <!-- horizontal rule, thematic separation between two sections -->
```

> **Note:** `<br>` shouldn't be used to create visual spacing between two paragraphs: that's CSS's job (`margin`, see [The Box Model](/?c=langages-de-balisage&s=css&p=box-model)). Repeated use of `<br><br>` to "make space" is a sign that HTML is being used for presentation, when that isn't its responsibility.

## Quotes

```html
<blockquote cite="https://source.com">
    <p>A long quote, usually indented visually.</p>
</blockquote>

<p>As someone once said, <q>a short quote, embedded within a sentence</q>.</p>
```

See also [HTML5 Semantics](/?c=langages-de-balisage&s=html&p=semantique-html5) for tags that structure entire sections of content, beyond the text itself.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | The choice of a text tag should reflect the meaning of the content (heading, paragraph, list, emphasis), never just the desired visual appearance: appearance is CSS's job. |
| **Available Tools** | `<h1>`-`<h6>`, `<p>`, `<ul>`/`<ol>`/`<li>`, `<strong>`/`<em>`, `<blockquote>`/`<q>`. |
| **Pitfalls to Avoid** | Skipping heading levels for a visual effect (`<h1>` followed by `<h4>`); using `<b>`/`<i>` (purely visual) where `<strong>`/`<em>` (meaning) would fit better; stacking `<br>` tags to create spacing. |
| **Best Practices** | Only one `<h1>` tag per page; favor `<strong>`/`<em>` by default, reserve `<b>`/`<i>` for purely visual cases with no intent of meaning. |
