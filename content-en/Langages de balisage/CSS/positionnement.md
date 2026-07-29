---
order: 4
---

# Positioning (position, z-index)

The `position` property fundamentally changes the way an element is positioned on the page—beyond the normal flow (each element one after the other) already handled by Flexbox and Grid (see the relevant chapters).

## `static` : the default behavior

```css
div {
    position: static;   /* valeur par défaut : suit le flux normal du document */
}
```

An `static` element completely ignores `top` / `left` / `right` / `bottom` — these properties only affect other `position` values.

## `relative` : shifted from its original position

```css
div {
    position: relative;
    top: 10px;     /* décalé de 10px vers le BAS par rapport à sa position normale */
    left: 20px;      /* décalé de 20px vers la DROITE */
}
```

> **Note:** The element retains its original **reserved** position in the flow (the other elements do not move to compensate)—only its visual display is shifted. `position: relative` is also very often used for a second purpose: to define a reference point for a child element in `position: absolute` (see below).

## `absolute` : positioned relative to a positioned ancestor

```css
.conteneur {
    position: relative;   /* devient le point de référence */
}
.badge {
    position: absolute;
    top: 0;
    right: 0;                /* positionné dans le coin supérieur droit DE .conteneur */
}
```

`absolute` element is removed from the normal flow (the other elements behave as if it no longer existed) and positioned relative to its nearest positioned ancestor (`relative`, `absolute`, `fixed`, or `sticky`)—if there is none, relative to the entire page (`<html>`).

> **Note (common pitfall):** A `.badge { position: absolute; }` element with **no** positioned ancestors is positioned relative to the entire page, not just its visible container—which is why `.conteneur { position: relative; }` almost always accompanies a child with `absolute`, even if there is no offset (`top` / `left`) on the container itself.

## `fixed` : positioned relative to the window, fixed when scrolling

```css
.bandeau-cookies {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}
```

Remains in the same visual position **even when scrolling the page**—used for a always-visible menu, a notification banner, etc. Positioned relative to the browser window (*viewport*), not relative to a parent element.

## `sticky` : a hybrid between `relative` and `fixed`

```css
.entete-tableau {
    position: sticky;
    top: 0;
}
```

Behaves like `relative` as long as the element is visible in its normal position, then becomes `fixed` (stuck to the specified edge, in this case `top: 0`) as soon as scrolling would cause it to move out of view—typically used for a table header that remains visible while the content is being scrolled.

## `z-index` : Manage layering

```css
.modale {
    position: absolute;
    z-index: 100;    /* affiché AU-DESSUS des éléments avec un z-index plus faible */
}
.overlay {
    position: fixed;
    z-index: 50;
}
```

> **Note:** `z-index` only affects an element that** has already been positioned** (`relative`, `absolute`, `fixed`, or `sticky`) — on an element with `static`, `z-index` is simply ignored. A higher value for `z-index` is displayed on top of a lower value, but only when comparing elements that share the same “stacking context”—a detail that explains certain cases where a very high `z-index` value is not enough to appear on top of an element with a seemingly lower priority.
