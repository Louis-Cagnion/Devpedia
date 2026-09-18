---
order: 7
---

# Responsive Design and Media Queries

**Responsive design** means designing a page that adapts to any screen size (mobile, tablet, computer): a necessity since the majority of web traffic happens on mobile, and the main reason media queries exist.

## Relative units, even before media queries

```css
div {
    width: 300px;       /* fixed, adapts to NOTHING */
    width: 50%;         /* relative to the parent */
    font-size: 1.5rem;  /* relative to the root font size (<html>), independent of the parent */
    font-size: 1.5em;   /* relative to the DIRECT parent's font size (can stack up in cascade) */
    width: 50vw;        /* relative to the window width (viewport width) */
    height: 100vh;      /* relative to the window height (viewport height) */
}
```

> **Note:** `rem` is generally preferred over `em` for font sizes, because it stays predictable even in nested components (an `em` on an element whose parent already has a modified `em` stacks up in an often unintended way); `rem` always bases itself on the same reference (`<html>`), regardless of nesting depth.

## Media queries

```css
/* Default style, designed "mobile first" */
.conteneur {
    flex-direction: column;
}

/* Applies ONLY if the screen width reaches at least 768px */
@media (min-width: 768px) {
    .conteneur {
        flex-direction: row;
    }
}

/* Applies ONLY if the screen width is 767px maximum */
@media (max-width: 767px) {
    nav { display: none; }
}
```

## "Mobile first" vs "desktop first"

```css
/* Mobile-first approach: the base style targets mobile, then we WIDEN from there */
.grille { grid-template-columns: 1fr; }
@media (min-width: 768px) {
    .grille { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 1024px) {
    .grille { grid-template-columns: 1fr 1fr 1fr; }
}
```

> **Best practice:** the "*mobile first*" approach (using `min-width`, styling first for the smallest screen, then adding complexity for larger screens) is generally preferred over the reverse: it forces you to think about essential content first, and aligns with the fact that most web traffic is mobile.

## Common breakpoints

| Width | Typical Target |
|---|---|
| `< 768px` | Mobile |
| `768px – 1023px` | Tablet |
| `≥ 1024px` | Desktop |

> **Note:** these values are **not** an official standard: they vary by project and CSS framework. What really matters is varying your breakpoints based on the content itself (the point where the layout starts to visually break down), not just reproducing specific physical device sizes.

## Other useful media features

```css
@media (orientation: portrait) { }           /* screen taller than it is wide */
@media (prefers-color-scheme: dark) { }      /* the user has enabled dark mode at the system level */
@media (prefers-reduced-motion: reduce) { }  /* the user has asked to reduce animations */
@media print { }                             /* styles applied only when printing */
```

`prefers-reduced-motion` responds to an accessibility preference set at the operating system level (a user sensitive to motion, migraines, vestibular disorders), not at the site level:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.001ms !important;
        transition-duration: 0.001ms !important;
        /* deliberately NOT "animation: none" -- see the pitfall below */
    }
}
```

> **Pitfall:** replacing the animation with `animation: none`/`transition: none` rather than an almost-zero duration. Code may depend on the JavaScript `animationend`/`transitionend` events (for example, removing an element once its exit transition finishes): `none` never fires these events, which breaks that code, whereas a `0.001ms` duration still fires them, almost instantly.
>
> **Best practice:** reduce an animation to an almost-zero duration (`0.001ms`) rather than removing it entirely with `none`, to keep firing the JavaScript events code may depend on.

## Container queries: measuring the container instead of the window

A media query always measures the width of the entire **window**, which can be misleading for a component that only occupies part of the screen (a card in a grid column, next to a sidebar): the window can be wide while the space actually available to that specific component is narrow. A **container query** addresses exactly this case by measuring, not the window, but the element's direct container:

```css
/* 1. Mark an ancestor as a "queryable container" */
.carte-conteneur {
    container-type: inline-size;  /* only the container's width is tracked */
}

/* 2. The @container rule reacts to THIS CONTAINER'S WIDTH, not the window's */
@container (max-width: 860px) {
    .carte { flex-direction: column; }
}
```

| | `@media` | `@container` |
|---|---|---|
| Measures | The entire window's width | The nearest ancestor's width marked `container-type` |
| Typical use case | Adapting the page's overall layout | Adapting a reusable component, regardless of the space allotted to it |

> **Pitfall:** using `@media` to adapt a component that only occupies part of the screen (a card in one column among several, next to a sidebar). The window can stay wide while that component's actual space is already narrow: the component then never changes layout, even when it should.
>
> **Best practice:** use `@container` as soon as a component needs to react to the space actually allotted to it rather than to the entire window's size; reserve `@media` for a genuinely page-wide adaptation.

See also [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), where `repeat(auto-fit, minmax(...))` achieves responsive behavior **without writing a single media query**, a complementary alternative worth knowing.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Responsive design adapts a page to any screen size, via relative units (`%`, `rem`, `vw`/`vh`) and media queries (`@media (min-width: ...)`) that apply a style only at certain widths. |
| **Available Tools** | `rem`/`em`/`vw`/`vh`, `@media (min-width/max-width/orientation/prefers-color-scheme/prefers-reduced-motion)`, `@container` + `container-type` for an isolated component. |
| **Pitfalls to Avoid** | Basing breakpoints on specific device sizes rather than on the point where the layout actually breaks down visually. Using `@media` for a component that only occupies part of the window. Responding to `prefers-reduced-motion` with `animation: none` rather than an almost-zero duration. |
| **Best Practices** | Adopt a *mobile first* approach (`min-width`, style the smallest screen first); prefer `rem` over `em` for font sizes, more predictable when nested; use `@container` for a component that must react to its own space, not the window; reduce an animation to an almost-zero duration rather than removing it with `none`, so code depending on `animationend`/`transitionend` doesn't break. |
