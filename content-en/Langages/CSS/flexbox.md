---
order: 5
---

# Flexbox

**Flexbox** (*Flexible Box Layout*) arranges elements along a **single axis** (horizontal or vertical), distributing the available space between them, the modern solution for aligning, centering, and spacing out elements, replacing much more fragile legacy techniques (floats, [tables](/?c=langages-de-balisage&s=html&p=tableaux) diverted from their original purpose).

## Enabling Flexbox

```css
.conteneur {
    display: flex;
}
```

As soon as `display: flex` is set on an element, all of its **direct children** (and only them) become "flex items", automatically aligned on a single line (by default).

## The main axis: `flex-direction`

```css
.conteneur {
    display: flex;
    flex-direction: row;      /* default: left to right */
    /* flex-direction: column;    -> top to bottom */
    /* flex-direction: row-reverse; */
}
```

Flexbox always reasons in terms of a **main axis** (the one set by `flex-direction`) and a **secondary axis** (perpendicular to it): the alignment properties below apply differently depending on this axis.

## Aligning on the main axis: `justify-content`

```css
.conteneur {
    display: flex;
    justify-content: flex-start;      /* default: grouped at the start */
    /* justify-content: center;         -> centered */
    /* justify-content: space-between;  -> equal space BETWEEN elements, none at the edges */
    /* justify-content: space-around;   -> equal space AROUND each element */
}
```

## Aligning on the secondary axis: `align-items`

```css
.conteneur {
    display: flex;
    align-items: stretch;     /* default: stretches elements across the full available height */
    /* align-items: center;     -> centers vertically (if flex-direction: row) */
    /* align-items: flex-start; -> aligns to the top */
    /* align-items: flex-end;   -> aligns to the bottom */
}
```

> **Perfect centering, a classic solved in 3 lines:**

```css
.conteneur {
    display: flex;
    justify-content: center;  /* centers horizontally */
    align-items: center;      /* centers vertically */
}
```

## Properties on the children

```css
.element {
    flex-grow: 1;       /* can grow to fill the remaining space (1 = equal share between elements) */
    flex-shrink: 1;     /* can shrink if space is tight (default) */
    flex-basis: 200px;  /* starting size, before grow/shrink is applied */
    order: 2;           /* changes the display order WITHOUT touching the HTML */
}
```

> **Note (accessibility):** `order` only changes the **visual** order: keyboard tab order and the order read by a screen reader stay the ones from the [HTML](/?c=langages-de-balisage&s=html&p=html). A mismatch between the two can disorient a keyboard or screen-reader user; reserve it for purely decorative reordering, never to fix a content order that doesn't make sense in the HTML itself.

```css
.colonne-principale { flex-grow: 2; }   /* takes up twice as much space as .colonne-laterale */
.colonne-laterale { flex-grow: 1; }
```

## Wrapping: `flex-wrap`

```css
.conteneur {
    display: flex;
    flex-wrap: nowrap;   /* default: everything fits on a single line, shrinks if needed */
    /* flex-wrap: wrap;     -> wraps to the next line if space runs out */
}
```

## Visual summary

```text
justify-content (main axis, here horizontal):
[■]                    [■] [■] [■]              [■]       [■]       [■]
flex-start             center                    space-between

align-items (secondary axis, here vertical):
[■]                    [■]                        [■]
[ ]  flex-start        [ ]  center                [ ]  flex-end
[ ]                    [ ]                        [■]
```

See also [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), for a layout in **two** dimensions (rows AND columns simultaneously), where Flexbox remains fundamentally designed for a single axis at a time.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Flexbox aligns elements along a single axis (`flex-direction`). `justify-content` aligns on the main axis, `align-items` on the secondary axis. `flex-grow`/`flex-shrink`/`flex-basis` control the size of the children. |
| **Available Tools** | `display: flex`, `justify-content`, `align-items`, `flex-wrap`, `flex-grow`/`shrink`/`basis`, `order`. |
| **Pitfalls to Avoid** | Using `order` to reorder content that has a genuine reading order: the visual order changes, but not the keyboard tab order or the order read by a screen reader. |
| **Best Practices** | Reserve `order` for purely decorative reordering; use Grid rather than Flexbox as soon as the layout needs two dimensions (rows AND columns). |
