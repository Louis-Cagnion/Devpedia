---
order: 6
---

# CSS Grid

Unlike Flexbox (see the dedicated chapter), which is designed for a single axis at a time, **CSS Grid** arranges elements on a true **two-dimensional** grid—rows and columns defined simultaneously—with precise control over the position of each element.

## Enable a grid

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 200px 200px;   /* 3 colonnes de 200px chacune */
    grid-template-rows: 100px 100px;               /* 2 lignes de 100px chacune */
    gap: 10px;                                        /* espace entre les cellules, lignes ET colonnes */
}
```

## `fr`: Allocating Available Space

```css
.conteneur {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;   /* 3 colonnes : la 2e occupe 2x plus d'espace que les 2 autres */
}
```

`fr` (*fraction*) distributes the **remaining** space after subtracting the fixed sizes—much more flexible than a percentage, especially when combined with fixed sizes:

```css
.conteneur {
    display: grid;
    grid-template-columns: 250px 1fr;   /* colonne latérale fixe, colonne principale qui occupe le reste */
}
```

## `repeat()` : Avoid repetition

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(4, 1fr);   /* équivalent à "1fr 1fr 1fr 1fr" */
}
```

## Responsive grids without media queries

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}
```

`auto-fit` automatically calculates how many columns **of at least** `200px` will fit in the available space, and `1fr` them to fill the remaining space—so the number of columns adapts to the screen width without writing a single media query (see the dedicated chapter).

## Position an element precisely

```css
.element {
    grid-column: 1 / 3;   /* s'étend de la ligne de grille 1 à la ligne 3 -> occupe 2 colonnes */
    grid-row: 2 / 4;        /* s'étend sur 2 lignes verticalement */
}
```

```
Lignes de grille verticales :  1    2    3    4
                                ┌────┬────┬────┐
                          1 ┤   │    │    │    │
                                ├────┼────┼────┤
                          2 ┤   │ élément (col 1→3, row 2→4)  │
                                ├────┤              │
                          3 ┤   │    │              │
                                └────┴────┴────┘
```

## `grid-template-areas`: The Most Readable Layout

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-areas:
        "entete  entete"
        "lateral principal"
        "pied    pied";
}

.entete { grid-area: entete; }
.lateral { grid-area: lateral; }
.principal { grid-area: principal; }
.pied { grid-area: pied; }
```

Each name in `grid-template-areas` literally determines the visual layout of the page directly in the CSS—an area repeated across multiple rows and columns in the layout automatically occupies that combined space (here, `entete` and `pied` span the full width).

## Flexbox or Grid?

| | Flexbox | Grid |
|---|---|---|
| Dimensions | One axis at a time | Two dimensions simultaneously |
| Typical Use Cases | Aligning elements in a navigation bar, centering content | Structuring the overall layout of a page (header/sidebar/main content/footer) |
| Element size | Often depends on the content | Explicitly defined by the grid |

In practice, the two are very often used together in the same project: Grid for the page's overall structure, and Flexbox for aligning the content within each area.
