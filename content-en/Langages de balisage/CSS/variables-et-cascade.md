---
order: 2
---

# CSS Variables and the Cascading Model

This chapter covers two cross-cutting mechanisms in CSS: **custom variables** (reusing a value in multiple places) and the **cascade** (how CSS resolves a conflict between multiple rules that target the same element)—the “C” in CSS (*Cascading*) refers directly to this second mechanism.

## CSS Variables (Custom Properties)

```css
:root {
    --couleur-primaire: #3366cc;
    --espacement-standard: 16px;
}

.bouton {
    background-color: var(--couleur-primaire);
    padding: var(--espacement-standard);
}
```

`:root` Targets the document's root element (`<html>`) — declaring variables there makes them accessible **throughout** the stylesheet. Changing `--couleur-primaire` just once instantly updates all instances that use it, without having to "search and replace" throughout the entire file.

```css
.bouton {
    background-color: var(--couleur-primaire, blue);   /* "blue" : valeur de secours si la variable n'existe pas */
}
```

## Variables Local to a Component

```css
.carte {
    --marge-interne: 20px;
    padding: var(--marge-interne);
}

.carte.compacte {
    --marge-interne: 8px;   /* redéfinit la variable UNIQUEMENT pour les éléments avec cette classe supplémentaire */
}
```

> **Note:** Unlike a Sass/Less variable (which is resolved once and for all during compilation), a native CSS variable is **live** in the browser—it can even be modified using JavaScript (`element.style.setProperty('--marge-interne', '30px')`), and is dynamically re-evaluated based on the element where it is accessed.

## The cascade: three criteria, in this order

When multiple rules target the same element and the same property, CSS resolves the conflict in this specific order:

### 1. `!important`

```css
p { color: blue !important; }
p { color: red; }   /* ignoré : la règle du dessus a !important */
```

`!important` bypasses the rest of the chain—a rule with `!important` wins, regardless of its specificity or the order in which it is written.

> **Best practice:** Avoid using `!important` in everyday code—it makes debugging difficult (it cannot be easily overridden) and disrupts the natural flow of the cascade. Reserve its use for very exceptional cases (often to override a third-party style that you cannot control).

### 2. Specificity (see the chapter on selectors)

```css
#bouton-principal { color: blue; }   /* spécificité : id -> plus fort */
.bouton { color: red; }                /* spécificité : classe -> plus faible */
```

The most specific selector wins, regardless of the order in which they are written to the file.

### 3. Order of appearance (for equal specificity)

```css
.bouton { color: blue; }
.bouton { color: red; }   /* GAGNE : même spécificité, mais écrite en dernier */
```

If the specifications are exactly the same, the rule declared **last** in the file (or the last file loaded) takes precedence.

## Inheritance: Some properties are passed down, others are not

```css
body {
    color: #333;         /* HÉRITÉ : tous les descendants (p, span, li...) reprennent cette couleur de texte */
    border: 1px solid;      /* PAS hérité : chaque élément a sa propre bordure, ou aucune */
}
```

Text-related properties (`color`, `font-family`, `font-size`, `line-height`...) are generally inherited by default; box-related properties (`border`, `margin`, `padding`, `background`...) are never inherited—this is a mechanism distinct from the cascade, although it interacts with it (an inherited rule has the lowest possible specificity and is easily overridden by any rule applied directly to the element).
