---
order: 2
---

# CSS Variables and the Cascade

This chapter covers two cross-cutting mechanisms in CSS: **custom variables** (reusing a value in several places), and the **cascade** (how CSS resolves a conflict between several rules that target the same element): the "C" in CSS (*Cascading*) refers directly to this second mechanism.

## CSS variables (custom properties)

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

`:root` targets the document's root element (`<html>`): declaring variables there makes them accessible **everywhere** in the stylesheet. Changing `--couleur-primaire` just once instantly updates every place that uses it, with no "search and replace" across the whole file.

```css
.bouton {
    /* "blue": fallback value if the variable doesn't exist */
    background-color: var(--couleur-primaire, blue);
}
```

## Variables local to a component

```css
.carte {
    --marge-interne: 20px;
    padding: var(--marge-interne);
}

.carte.compacte {
    /* redefines the variable ONLY for elements with this extra class */
    --marge-interne: 8px;
}
```

> **Note:** unlike a [Sass](https://sass-lang.com)/[Less](https://lesscss.org) variable (resolved once and for all at compile time), a native CSS variable is **alive** in the browser: modifiable even from [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) (`element.style.setProperty('--marge-interne', '30px')`), and re-evaluated dynamically depending on the element where it's read.

## `color-mix()`: deriving a color from a variable, without declaring a new one

```css
.danger-button:hover {
    background-color: color-mix(in srgb, var(--couleur-danger) 85%, black);
    /* mixes 85% of --couleur-danger with black: a slightly darkened version, on hover */
}
```

`color-mix(in <color-space>, color1 percentage1, color2)` mixes two colors in the given color space (`srgb` is the most common), with no need to compute or declare a new dedicated variable for every variant (hover, disabled, a lightly tinted background...).

| | Without `color-mix()` | With `color-mix()` |
|---|---|---|
| A darker variant on hover | Compute/declare a second variable (`--couleur-danger-hover`) | `color-mix(in srgb, var(--couleur-danger) 85%, black)` |
| A lightly tinted background | A third dedicated variable, or a hardcoded `rgba()` color | `color-mix(in srgb, var(--couleur-danger) 10%, transparent)` |

> **Best practice:** use `color-mix()` for any one-off variant of a color already declared as a variable (lighter, darker, more transparent), rather than multiplying dedicated variables for each small variation.

## Reading a CSS variable from JavaScript

The write above (`setProperty`) has its opposite, **reading**: useful so that a rendering that doesn't understand CSS (drawing on a `<canvas>`, an [SVG](/?c=langages-de-balisage&s=html&p=html) chart generated in [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)) still stays in sync with the colors declared in the stylesheet, without hard-coding a duplicate copy in the JS code.

```javascript
const primaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--couleur-primaire")   // "#3366cc" (raw string, spaces included)
    .trim();

console.log(primaryColor || "#000000");       // fallback value if the variable doesn't exist
```

`getComputedStyle(element)` returns the **final** style applied to that element once the cascade is resolved (see the next section), as an object queried through `getPropertyValue()`. Unlike `var(--name, fallback)` in CSS, `getPropertyValue()` has no built-in fallback: it returns an empty string when the variable doesn't exist, which you have to handle yourself (`|| "#000000"` above).

> **Pitfall:** `getPropertyValue()` always returns a raw string, original spaces included (`" #3366cc"` for instance): `.trim()` avoids comparisons or concatenations silently going wrong because of an invisible space.

## The cascade: three criteria, in this order

Faced with several rules targeting the same element and the same property, CSS settles them in this precise order:

### 1. Importance (`!important`)

```css
p { color: blue !important; }
p { color: red; }   /* ignored: the rule above has !important */
```

`!important` short-circuits the rest of the cascade: a rule with `!important` wins, regardless of its specificity or the order it's written in.

> **Best practice:** avoid `!important` in everyday use: it makes debugging harder (impossible to override simply) and breaks the cascade's natural logic. Reserve it for very exceptional cases (often overriding a third-party style you don't control).

### 2. Specificity (see [Selectors](/?c=langages-de-balisage&s=css&p=selecteurs))

```css
#bouton-principal { color: blue; }  /* specificity: id -> stronger */
.bouton { color: red; }             /* specificity: class -> weaker */
```

The most specific selector wins, regardless of the order it's written in the file.

### 3. Order of appearance (at equal specificity)

```css
.bouton { color: blue; }
.bouton { color: red; }   /* WINS: same specificity, but written last */
```

At strictly equal specificity, the rule declared **last** in the file (or the last file loaded) wins.

## Inheritance: some properties pass down, others don't

```css
body {
    /* INHERITED: every descendant (p, span, li...) picks up this text color */
    color: #333;
    border: 1px solid;  /* NOT inherited: each element has its own border, or none */
}
```

Properties tied to **text** (`color`, `font-family`, `font-size`, `line-height`...) are generally inherited by default; properties tied to the **box** (`border`, `margin`, `padding`, `background`...) never are: this is a mechanism distinct from the cascade, though it interacts with it (an inherited rule has the lowest possible specificity, easily overridden by any rule directly applied to the element).

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | CSS variables (`--name`, read via `var()`) avoid repeating a value. Faced with a conflict between rules, the cascade settles it in order: `!important` > specificity > order written. Inheritance (text yes, box no) is a distinct mechanism that interacts with the cascade. |
| **Available Tools** | `:root` for global variables, `var(--name, fallback-value)`, `color-mix(in srgb, ...)` to derive a color variant, `element.style.setProperty()` to modify them from JavaScript, `getComputedStyle().getPropertyValue()` to read them. |
| **Pitfalls to Avoid** | Overusing `!important`: it short-circuits the whole cascade and makes the style hard to override afterward. Forgetting `.trim()` after `getPropertyValue()`: the returned string keeps its original spaces. |
| **Best Practices** | Reserve `!important` for exceptional cases (overriding an uncontrolled third-party style); define recurring colors/spacing as variables on `:root` rather than repeating them; read those variables from JS instead of hard-coding duplicate colors, so a Canvas/SVG rendering stays in sync with the stylesheet. |
