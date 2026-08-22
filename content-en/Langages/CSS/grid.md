---
order: 6
---

# CSS Grid

Unlike [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox), which is designed for a single axis at a time, **CSS Grid** arranges elements on a true **two-dimensional** grid, rows and columns defined simultaneously, with precise control over the position of each element.

## Enable a grid

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 200px 200px;  /* 3 columns of 200px each */
    grid-template-rows: 100px 100px;           /* 2 rows of 100px each */
    gap: 10px;                                 /* space between cells, both rows AND columns */
}
```

## `fr`: Allocating Available Space

```css
.conteneur {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;   /* 3 columns: the 2nd takes up 2x more space than the other 2 */
}
```

`fr` (*fraction*) distributes the **remaining** space after subtracting the fixed sizes; much more flexible than a percentage, especially when combined with fixed sizes:

```css
.conteneur {
    display: grid;
    grid-template-columns: 250px 1fr;   /* fixed side column, main column that takes up the rest */
}
```

## `repeat()`: Avoiding Repetition

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(4, 1fr);   /* equivalent to "1fr 1fr 1fr 1fr" */
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

`auto-fit` automatically calculates how many columns **of at least** `200px` will fit in the available space, and stretches them (`1fr`) to fill the remaining space: so the number of columns adapts to the screen width without writing a single [media query](/?c=langages-de-balisage&s=css&p=responsive-et-media-queries).

## Position an element precisely

```css
.element {
    grid-column: 1 / 3;  /* spans from grid line 1 to line 3 -> occupies 2 columns */
    grid-row: 2 / 4;      /* spans 2 rows vertically */
}
```

```text
Vertical grid lines:           1    2    3    4
                                ┌────┬────┬────┐
                          1 ┤   │    │    │    │
                                ├────┼────┼────┤
                          2 ┤   │ element (col 1→3, row 2→4)  │
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

Each name in `grid-template-areas` literally draws the visual layout of the page directly in the CSS; an area repeated across multiple rows/columns of the diagram automatically occupies that merged space (here, `entete` and `pied` span the full width).

## Flexbox or Grid?

| | Flexbox | Grid |
|---|---|---|
| Dimensions | One axis at a time | Two dimensions simultaneously |
| Typical Use Cases | Aligning elements in a navigation bar, centering content | Structuring the overall layout of a page (header/sidebar/main content/footer) |
| Element size | Often depends on the content | Explicitly defined by the grid |

In practice, the two are very often used together in the same project: Grid for the page's overall structure, and Flexbox for aligning the content within each area.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | CSS Grid arranges elements on a two-dimensional grid (rows AND columns), unlike Flexbox (a single axis). The `fr` unit distributes the remaining space; `grid-template-areas` visually names each zone. |
| **Available Tools** | `display: grid`, `grid-template-columns`/`rows`, `fr`, `repeat()`, `grid-template-areas`, `grid-column`/`grid-row`. |
| **Pitfalls to Avoid** | Using Flexbox for a layout that genuinely needs two dimensions: the result quickly turns into a stack of workarounds. |
| **Best Practices** | `repeat(auto-fit, minmax(...))` for a responsive grid without writing a media query; `grid-template-areas` for a page structure that's readable directly in the CSS. |
