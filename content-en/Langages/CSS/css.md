---
order: 8
---

# CSS

CSS (*Cascading Style Sheets*) is the language that describes the **appearance** of an [HTML](/?c=langages-de-balisage&s=html&p=html) document (colors, sizes, positioning, layout), deliberately separating this presentation from the structure (HTML) and the behavior ([JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)).

Some of the key concepts in CSS include:

- Selectors, which target the HTML elements to be styled
- The box model, which governs the size and spacing of each element
- Modern layout systems: Flexbox (alignment along an axis) and Grid (two-dimensional grid)
- The cascade and specificity, which determine which rule applies when multiple rules conflict
- *Responsive design*, so that a page adapts to all screen sizes

## Basic Syntax

```css
selecteur {
    propriete: valeur;
    autre-propriete: autre-valeur;
}
```

```css
h1 {
    color: blue;
    font-size: 2rem;
}
```

## Linking a Style Sheet to an HTML Page

```html
<link rel="stylesheet" href="styles.css">
```

```html
<style>
    h1 { color: blue; }
</style>
```

```html
<h1 style="color: blue;">Heading</h1>
```

> **Note (best practice):** an external `.css` file (`<link>`) is almost always preferable: it's cached by the browser, reusable across several pages, and clearly separates structure from presentation. Inline styling (`style="..."` directly on a tag) has the highest specificity (see [CSS Variables and the Cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade)), which makes it hard to override afterward, to be reserved for very occasional cases, often generated dynamically in JavaScript.
