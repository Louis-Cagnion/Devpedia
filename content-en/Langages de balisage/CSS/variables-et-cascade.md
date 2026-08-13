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
    background-color: var(--couleur-primaire, blue);   /* "blue": fallback value if the variable doesn't exist */
}
```

## Variables local to a component

```css
.carte {
    --marge-interne: 20px;
    padding: var(--marge-interne);
}

.carte.compacte {
    --marge-interne: 8px;   /* redefines the variable ONLY for elements with this extra class */
}
```

> **Note:** unlike a [Sass](https://sass-lang.com)/[Less](https://lesscss.org) variable (resolved once and for all at compile time), a native CSS variable is **alive** in the browser: modifiable even from JavaScript (`element.style.setProperty('--marge-interne', '30px')`), and re-evaluated dynamically depending on the element where it's read.

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
    color: #333;        /* INHERITED: every descendant (p, span, li...) picks up this text color */
    border: 1px solid;  /* NOT inherited: each element has its own border, or none */
}
```

Properties tied to **text** (`color`, `font-family`, `font-size`, `line-height`...) are generally inherited by default; properties tied to the **box** (`border`, `margin`, `padding`, `background`...) never are: this is a mechanism distinct from the cascade, though it interacts with it (an inherited rule has the lowest possible specificity, easily overridden by any rule directly applied to the element).

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | CSS variables (`--name`, read via `var()`) avoid repeating a value. Faced with a conflict between rules, the cascade settles it in order: `!important` > specificity > order written. Inheritance (text yes, box no) is a distinct mechanism that interacts with the cascade. |
| **Available Tools** | `:root` for global variables, `var(--name, fallback-value)`, `element.style.setProperty()` to modify them from JavaScript. |
| **Pitfalls to Avoid** | Overusing `!important`: it short-circuits the whole cascade and makes the style hard to override afterward. |
| **Best Practices** | Reserve `!important` for exceptional cases (overriding an uncontrolled third-party style); define recurring colors/spacing as variables on `:root` rather than repeating them. |
