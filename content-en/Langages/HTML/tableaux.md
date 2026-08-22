---
order: 4
---

# HTML Tables

An HTML table is used to display **tabular** data (rows/columns genuinely linked to each other, like a database export, see [SQL](/?c=domain-specific-languages-dsl&p=sql)); never to visually lay out an entire page, a historical use now replaced by CSS ([Flexbox](/?c=langages-de-balisage&s=css&p=flexbox)/[Grid](/?c=langages-de-balisage&s=css&p=grid)).

## Basic structure

```html
<table>
    <thead>
        <tr>
            <th>Name</th>
            <th>City</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John</td>
            <td>Lyon</td>
        </tr>
        <tr>
            <td>Mary</td>
            <td>Paris</td>
        </tr>
    </tbody>
</table>
```

- `<table>`: the container for the entire table.
- `<thead>`: the header (often a single row, the column titles).
- `<tbody>`: the body of the table (the data itself).
- `<tr>` (*table row*): a row.
- `<th>` (*table header*): a header cell (usually bold by default, and announced differently by a screen reader).
- `<td>` (*table data*): a regular data cell.

## Merging cells

```html
<table>
    <tr>
        <td colspan="2">Spans 2 columns</td>
    </tr>
    <tr>
        <td rowspan="2">Spans 2 rows</td>
        <td>Regular cell</td>
    </tr>
    <tr>
        <td>Regular cell</td>
    </tr>
</table>
```

`colspan` extends a cell across several columns, `rowspan` across several rows.

## Table footer

```html
<table>
    <thead>...</thead>
    <tbody>...</tbody>
    <tfoot>
        <tr>
            <td>Total</td>
            <td>2 rows</td>
        </tr>
    </tfoot>
</table>
```

## Accessibility and captions

```html
<table>
    <caption>Customer breakdown by city</caption>
    <thead>
        <tr>
            <th scope="col">Name</th>
            <th scope="col">City</th>
        </tr>
    </thead>
    ...
</table>
```

- `<caption>`: a title associated with the table, announced by screen readers before its content.
- `scope="col"` (or `"row"`) on a `<th>`: explicitly specifies whether this header applies to an entire column or an entire row; essential for a screen reader to announce the right header while going through each cell of a complex table.

> **Note (best practice):** never use `<table>` to organize the overall layout of a page (menu, content columns...): this use, common before modern CSS arrived, breaks the document's semantics (a screen reader would announce tabular data where there is none) and makes the page hard to make responsive.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | `<table>` represents tabular data that's genuinely linked together; never a general page layout. `<thead>`/`<tbody>`/`<tfoot>` structure the table; `colspan`/`rowspan` merge cells. |
| **Available Tools** | `<caption>` (table title), `scope="col"`/`"row"` on a `<th>` for accessibility. |
| **Pitfalls to Avoid** | Using `<table>` for a page's general layout: breaks semantics and complicates responsiveness. |
| **Best Practices** | Always associate a `scope` with every `<th>` of a complex table, so a screen reader announces the right header per cell. |
