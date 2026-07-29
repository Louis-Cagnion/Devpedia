# CSS

CSS (*Cascading Style Sheets*) is the language that describes the **appearance** of an HTML document (see the dedicated section)—colors, sizes, positioning, layout—by deliberately separating this presentation from the structure (HTML) and behavior (JavaScript).

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
<h1 style="color: blue;">Titre</h1>
```

> **Note (best practice):** An external `.css` file (`<link>`) is almost always preferable—it is cached by the browser, can be reused across multiple pages, and clearly separates structure from presentation. Inline styling (`style="..."` directly on a tag) has the highest specificity (see the chapter on the style sheet cascade), which makes it difficult to override later—it should be reserved for very specific cases, often generated dynamically via JavaScript.
