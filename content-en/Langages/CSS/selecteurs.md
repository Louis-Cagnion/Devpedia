---
order: 1
---

# Selectors

A **selector** determines which HTML elements a CSS rule applies to: from the simplest (a tag) to the most precise (a combination of attributes and position in the document tree).

## Basic selectors

```css
h1 { }        /* every <h1> element */
.carte { }    /* every element with class="carte" */
#en-tete { }  /* the single element with id="en-tete" */
* { }         /* absolutely every element */
```

> **Note:** a `class` can be reused on several elements, an `id` must stay **unique** across the whole page: an `#id` selector therefore always targets a single, specific element, unlike `.classe`.

## Combinators

```css
article p { }    /* every <p> descendant of <article>, at ANY depth */
article > p { }  /* every <p> that's a DIRECT CHILD of <article>, no deeper */
h2 + p { }       /* the <p> immediately AFTER an <h2>, at the same level */
h2 ~ p { }       /* ALL <p>s that follow an <h2>, at the same level */
```

## Attribute selectors

```css
input[type="email"] { }  /* every <input> with this attribute AND this exact value */
a[href^="https"] { }     /* href that STARTS WITH "https" */
a[href$=".pdf"] { }      /* href that ENDS WITH ".pdf" */
a[href*="exemple"] { }   /* href that CONTAINS "exemple" anywhere */
```

## Pseudo-classes: targeting a state

```css
a:hover { }            /* when the mouse hovers over the element */
input:focus { }        /* when the field has focus (click or tab) */
li:first-child { }     /* the first child of its parent */
li:last-child { }      /* the last child of its parent */
li:nth-child(2) { }    /* precisely the 2nd child */
li:nth-child(odd) { }  /* every odd-numbered child (1st, 3rd, 5th...) */
input:disabled { }     /* a disabled field */
input:required { }     /* a field marked "required" in HTML (see Forms) */
```

## Pseudo-elements: targeting part of an element

```css
p::first-line { }             /* only the first displayed line of the paragraph */
p::before { content: "→ "; }  /* inserts content BEFORE the paragraph's actual text */
p::after { content: " ✓"; }   /* inserts content AFTER */
```

> **Note:** `::before`/`::after` require a `content` property to be visible (even empty, `content: "";`), widely used to add a purely decorative element (icon, arrow...) without weighing down the HTML with an extra tag that has no real semantic meaning (see [HTML5 Semantics](/?c=langages-de-balisage&s=html&p=semantique-html5)).

## Specificity: what happens in case of a conflict?

```css
p { color: blue; }
.texte-important { color: red; }
#paragraphe-unique { color: green; }
```

```html
<p id="paragraphe-unique" class="texte-important">What color?</p>
```

An `id` has higher specificity than a `class`, itself higher than a tag selector: the paragraph will therefore display in **green** (`#paragraphe-unique` wins), regardless of the order the rules are written in the file.

| Selector Type | Weight (from lightest to strongest) |
|---|---|
| Universal selector (`*`) | Lightest |
| Tag (`p`, `div`...) | Light |
| Class (`.carte`), attribute (`[type=...]`), pseudo-class (`:hover`) | Medium |
| `id` (`#en-tete`) | Strong |
| Inline style (`style="..."`) | Very strong |
| `!important` | Overrides everything else (avoid, see [CSS Variables and the Cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade)) |

See also [CSS Variables and the Cascade](/?c=langages-de-balisage&s=css&p=variables-et-cascade), which details precisely the resolution order between specificity, writing order, and the rule's origin.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A selector determines which elements a CSS rule applies to, from the simplest (tag) to the most precise (attributes, position, state). In case of a conflict, the most **specific** selector wins (id > class > tag), otherwise the rule written last. |
| **Available Tools** | Basic selectors, combinators (`>`, `+`, `~`), attribute selectors, pseudo-classes (`:hover`, `:nth-child`...), pseudo-elements (`::before`/`::after`). |
| **Pitfalls to Avoid** | Confusing specificity with writing order: a more specific selector always wins, even written before a less specific one. |
| **Best Practices** | Favor classes over ids for everyday styling (easier to reuse and override); reserve `id` for a genuinely unique use on the page. |
