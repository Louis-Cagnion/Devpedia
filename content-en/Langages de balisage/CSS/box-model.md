---
order: 3
---

# The Box Model

Each HTML element is represented by CSS as a rectangular box consisting of four concentric layers: understanding this model is essential for mastering sizing, spacing, and alignment.

## The Four Layers

```text
┌─────────────────────────────────┐
│              margin               │  <- OUTER space, outside the box
│   ┌───────────────────────────┐   │
│   │           border            │   │  <- visible border
│   │   ┌───────────────────┐   │   │
│   │   │      padding        │   │   │  <- INNER space, between border and content
│   │   │   ┌───────────┐   │   │   │
│   │   │   │  content    │   │   │   │  <- the actual text/image/content
│   │   │   └───────────┘   │   │   │
│   │   └───────────────────┘   │   │
│   └───────────────────────────┘   │
└─────────────────────────────────┘
```

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
    margin: 10px;
}
```

- **content**: the actual content (text, images, etc.).
- **padding**: the space between the content and the border, part of the element itself (same background color as the content).
- **border**: the visible border.
- **margin**: the space outside the border that separates this element from others, never colored, always transparent.

## The classic pitfall: `width` does not include everything by default

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Width ACTUALLY occupied on screen: 300 + 20+20 (padding) + 2+2 (border) = 344px, NOT 300px! */
```

> **Note:** By default (`box-sizing: content-box`), `width` defines only the size of the **content**: `padding` and `border` are added on top of that, making the box that’s actually displayed larger than the declared value. This is a very common cause of layouts that “overflow” unexpectedly.

## `box-sizing: border-box` : the nearly universal solution

```css
* {
    box-sizing: border-box;
}

div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Actual width: exactly 300px -> padding and border are now INCLUDED in this value */
```

`border-box` makes `width`/`height` refer to the box's **total** size (border included), with `padding` "eating into" the content area rather than being added on top of it, a much more predictable behavior that has become the de facto standard in virtually all modern projects (often applied globally with `* { box-sizing: border-box; }`).

## Writing Shortcuts

```css
/* Four values: top right bottom left (clockwise) */
margin: 10px 20px 30px 40px;

/* Two values: top/bottom then left/right */
margin: 10px 20px;

/* One value: all four sides identical */
margin: 10px;

/* Target a single side */
margin-top: 10px;
padding-left: 20px;
```

## Merging Margins (*margin collapsing*)

```css
p { margin-bottom: 20px; }
p + p { margin-top: 30px; }
```

> **Note:** Between two elements **in normal flow** (not in [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox)/[Grid](/?c=langages-de-balisage&s=css&p=grid)), adjacent vertical margins do not add up: only the larger of the two applies (in this case, `30px`, not `50px`). This behavior, which is often surprising at first glance, applies only to vertical margins, never to horizontal ones, and disappears entirely within a Flexbox or Grid container.
