---
order: 1
---

# Selectors

A **selector** determines which HTML elements a CSS rule applies to—from the simplest (a tag) to the most specific (a combination of attributes and position in the document tree).

## Basic Selectors

```css
h1 { }             /* tous les éléments <h1> */
.carte { }          /* tous les éléments avec class="carte" */
#en-tete { }          /* l'unique élément avec id="en-tete" */
* { }                   /* absolument tous les éléments */
```

> **Note:** An `class` can be reused on multiple elements, but a `id` must be **unique** throughout the page—so a selector like `#id` always targets a single, specific element, unlike `.classe`.

## Combiners

```css
article p { }        /* tout <p> descendant de <article>, à N'IMPORTE quelle profondeur */
article > p { }        /* tout <p> ENFANT DIRECT de <article>, pas plus profond */
h2 + p { }               /* le <p> immédiatement APRÈS un <h2>, au même niveau */
h2 ~ p { }                /* TOUS les <p> qui suivent un <h2>, au même niveau */
```

## Attribute Selectors

```css
input[type="email"] { }         /* tout <input> avec cet attribut ET cette valeur exacte */
a[href^="https"] { }              /* href qui COMMENCE par "https" */
a[href$=".pdf"] { }                 /* href qui SE TERMINE par ".pdf" */
a[href*="exemple"] { }                /* href qui CONTIENT "exemple" n'importe où */
```

## Pseudo-classes: Targeting a State

```css
a:hover { }          /* quand la souris survole l'élément */
input:focus { }        /* quand le champ a le focus (clic ou tabulation) */
li:first-child { }       /* le premier enfant de son parent */
li:last-child { }          /* le dernier enfant de son parent */
li:nth-child(2) { }          /* le 2e enfant précisément */
li:nth-child(odd) { }          /* tous les enfants impairs (1er, 3e, 5e...) */
input:disabled { }               /* un champ désactivé */
input:required { }                 /* un champ marqué "required" en HTML (cf. chapitre formulaires) */
```

## Pseudo-elements: Targeting a Part of an Element

```css
p::first-line { }     /* uniquement la première ligne affichée du paragraphe */
p::before { content: "→ "; }  /* insère du contenu AVANT le texte réel du paragraphe */
p::after { content: " ✓"; }    /* insère du contenu APRÈS */
```

> **Note:** `::before` and `::after` require a `content` attribute to be displayed (even if left empty, e.g., `content: "";`) — these are widely used to add a purely decorative element (icon, arrow, etc.) without cluttering the HTML with an extra tag that has no real semantic meaning (see the chapter on HTML5 semantics).

## The Unique Aspect: What Happens in the Event of a Dispute?

```css
p { color: blue; }
.texte-important { color: red; }
#paragraphe-unique { color: green; }
```

```html
<p id="paragraphe-unique" class="texte-important">Quelle couleur ?</p>
```

A `id` has higher specificity than a `class`, which in turn has higher specificity than a tag selector—so the paragraph will be displayed in **green** (the `#paragraphe-unique` takes precedence), regardless of the order in which the rules are written in the file.

| Selector Type | Weight (from lightest to heaviest) |
|---|---|
| `*` | Lowest |
| Tag (`p`, `div`...) | Low |
| Class (`.carte`), attribute (`[type=...]`), pseudo-class (`:hover`) | Medium |
| `id` (`#en-tete`) | Strong |
| Online Style (`style="..."`) | Very strong |
| `!important` | Overrides everything else (should be avoided; see the chapter on cascading) |

See also the chapter on the rule cascade, which provides a detailed explanation of the order of resolution among specificity, writing order, and the origin of the rule.
