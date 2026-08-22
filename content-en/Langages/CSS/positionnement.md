---
order: 4
---

# Positioning (position, z-index)

The `position` property fundamentally changes how an element is placed on the page: beyond the normal flow (each element one after another) already handled by [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) and [Grid](/?c=langages-de-balisage&s=css&p=grid).

## `static`: the default behavior

```css
div {
    position: static;   /* default value: follows the document's normal flow */
}
```

A `static` element completely ignores `top`/`left`/`right`/`bottom`: these properties only take effect on the other `position` values.

## `relative`: shifted from its original position

```css
div {
    position: relative;
    top: 10px;   /* shifted 10px DOWN from its normal position */
    left: 20px;  /* shifted 20px to the RIGHT */
}
```

> **Note:** the element keeps its original position **reserved** in the flow (the other elements don't move to compensate); only its visual display is shifted. `position: relative` is also very often used for a second purpose: defining a reference point for a child in `position: absolute` (see below).

## `absolute`: positioned relative to a positioned ancestor

```css
.conteneur {
    position: relative;   /* becomes the reference point */
}
.badge {
    position: absolute;
    top: 0;
    right: 0;                /* positioned in the top-right corner OF .conteneur */
}
```

An `absolute` element is removed from the normal flow (the other elements behave as if it no longer existed), and positioned relative to its nearest positioned ancestor (`relative`, `absolute`, `fixed`, or `sticky`); if there is none, relative to the entire page (`<html>`).

> **Note (classic pitfall):** a `.badge { position: absolute; }` with **no** positioned ancestor is positioned relative to the whole page, not just its apparent visual container: that's why `.conteneur { position: relative; }` almost systematically accompanies a child in `absolute`, even with no offset (`top`/`left`) on the container itself.

## `fixed`: positioned relative to the window, still while scrolling

```css
.bandeau-cookies {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}
```

Stays in the same visual position **even while scrolling the page**, used for an always-visible menu, a notification banner, etc. Positioned relative to the browser window (*viewport*), not relative to an ancestor.

## `sticky`: a hybrid between `relative` and `fixed`

```css
.entete-tableau {
    position: sticky;
    top: 0;
}
```

Behaves like `relative` as long as the element is visible in its normal spot, then becomes `fixed` (stuck to the specified edge, here `top: 0`) as soon as scrolling would carry it out of view, typically used for a table header that stays visible while the content scrolls.

## `z-index`: managing overlap

```css
.modale {
    position: absolute;
    z-index: 100;    /* displayed ABOVE elements with a lower z-index */
}
.overlay {
    position: fixed;
    z-index: 50;
}
```

> **Note:** `z-index` only takes effect on an element that's **already positioned** (`relative`, `absolute`, `fixed`, or `sticky`): on a `static` element, `z-index` is simply ignored. A higher `z-index` value displays over a lower one, but only when compared to elements that share the same "stacking context" (a group of elements compared against each other for overlap; a positioned element with a `z-index`, an opacity below 1, or a transform creates a new context for its own children: their `z-index`es are compared among themselves there, never directly to those outside it); a detail that explains certain cases where a very high `z-index` isn't enough to get above an apparently lower-priority element.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | `position` changes how an element is placed: `static` (default, normal flow), `relative` (shifted, spot reserved), `absolute` (removed from flow, relative to a positioned ancestor), `fixed` (relative to the window), `sticky` (relative/fixed hybrid). `z-index` manages overlap, but only between positioned elements. |
| **Available Tools** | `position`, `top`/`right`/`bottom`/`left`, `z-index`. |
| **Pitfalls to Avoid** | An `absolute` with no `relative` ancestor is positioned relative to the whole page, not the expected visual container; `z-index` is ignored on a `static` element. |
| **Best Practices** | Always set `position: relative` on the container of an `absolute` child, even with no offset of its own on that container. |
