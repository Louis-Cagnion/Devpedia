---
order: 4
---

# HTML Tables

An HTML table is used to display **tabular** data (rows and columns that are actually linked together, such as a database export; see the chapter on SQL)—never to visually format an entire page, a historical use that has now been replaced by CSS (`flexbox` / `grid`, see the relevant chapters).

## Basic Structure

```html
<table>
    <thead>
        <tr>
            <th>Nom</th>
            <th>Ville</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Jean</td>
            <td>Lyon</td>
        </tr>
        <tr>
            <td>Marie</td>
            <td>Paris</td>
        </tr>
    </tbody>
</table>
```

- `<table>` : the container for the entire array.
- `<thead>` : the header (often a single line, consisting of column headings).
- `<tbody>` : the body of the table (the data itself).
- `<tr>` (*table row*): a row.
- `<th>` (*table header*): a header cell (usually bold by default, and announced differently by a screen reader).
- `<td>` (*table data*): a standard data cell.

## Merge Cells

```html
<table>
    <tr>
        <td colspan="2">Fusionne 2 colonnes</td>
    </tr>
    <tr>
        <td rowspan="2">Fusionne 2 lignes</td>
        <td>Cellule normale</td>
    </tr>
    <tr>
        <td>Cellule normale</td>
    </tr>
</table>
```

`colspan` Spans a cell across multiple columns; `rowspan` spans a cell across multiple rows.

## Painting stand

```html
<table>
    <thead>...</thead>
    <tbody>...</tbody>
    <tfoot>
        <tr>
            <td>Total</td>
            <td>2 lignes</td>
        </tr>
    </tfoot>
</table>
```

## Accessibility and Captions

```html
<table>
    <caption>Répartition des clients par ville</caption>
    <thead>
        <tr>
            <th scope="col">Nom</th>
            <th scope="col">Ville</th>
        </tr>
    </thead>
    ...
</table>
```

- `<caption>` : a title associated with the image, announced by screen readers before its content.
- `scope="col"` (or `"row"`) on a `<th>`: explicitly specifies whether this header applies to an entire column or an entire row—essential for a screen reader to announce the correct header as it navigates through each cell of a complex table.

> **Note (best practice):** Never use `<table>` to organize the overall layout of a page (menu, content columns, etc.) — This practice, which was common before the advent of modern CSS, breaks the document’s semantics (a screen reader would announce tabular data where none exists) and makes it difficult to make the page responsive.
