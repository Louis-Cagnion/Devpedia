---
order: 3
---

# The Box Model

Each HTML element is represented by CSS as a rectangular box consisting of four concentric layers—understanding this model is essential for mastering sizing, spacing, and alignment.

## The Four Layers

```
┌─────────────────────────────────┐
│              margin               │  <- espace EXTÉRIEUR, en dehors de la boîte
│   ┌───────────────────────────┐   │
│   │           border            │   │  <- bordure visible
│   │   ┌───────────────────┐   │   │
│   │   │      padding        │   │   │  <- espace INTÉRIEUR, entre bordure et contenu
│   │   │   ┌───────────┐   │   │   │
│   │   │   │  content    │   │   │   │  <- le texte/image/contenu réel
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
- **padding**: the space between the content and the border — is part of the element itself (same background color as the content).
- **border**: the visible border.
- **margin**: the space outside the border that separates this element from others—never colored, always transparent.

## The classic pitfall: `width` does not include everything by default

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largeur RÉELLEMENT occupée à l'écran : 300 + 20+20 (padding) + 2+2 (border) = 344px, PAS 300px ! */
```

> **Note:** By default (`box-sizing: content-box`), `width` defines only the size of the **content**—`padding` and `border` are added on top of that, making the box that’s actually displayed larger than the declared value. This is a very common cause of layouts that “overflow” unexpectedly.

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
/* Largeur réelle : exactement 300px -> padding et border sont maintenant INCLUS dans cette valeur */
```

`border-box` The fact that `width` / `height` refer to the **total** size of the box (including the border), while `padding` "eats into" the content area rather than being added on top of it—a much more predictable behavior that has become the de facto standard in virtually all modern projects (often applied globally with `* { box-sizing: border-box; }`).

## Writing Shortcuts

```css
/* Quatre valeurs : haut droite bas gauche (sens horaire) */
margin: 10px 20px 30px 40px;

/* Deux valeurs : haut/bas puis gauche/droite */
margin: 10px 20px;

/* Une valeur : les quatre côtés identiques */
margin: 10px;

/* Cibler un seul côté */
margin-top: 10px;
padding-left: 20px;
```

## Margin* Collapsing*

```css
p { margin-bottom: 20px; }
p + p { margin-top: 30px; }
```

> **Note:** Between two elements **in normal flow** (not in a `flexbox` or `grid`—see the relevant chapters), adjacent vertical margins do not add up—only the larger of the two applies (in this case, `30px`, not `50px`). This behavior, which is often surprising at first glance, applies only to vertical margins, never to horizontal ones, and disappears entirely within a Flexbox or Grid container.
