---
order: 4
---

# Las tablas HTML

Una tabla HTML sirve para representar datos **tabulares** (filas y columnas realmente relacionadas entre sí, como una exportación de una base de datos; véase el capítulo sobre SQL), nunca para maquetar visualmente una página completa, un uso histórico que hoy en día ha sido sustituido por CSS (`flexbox` / `grid`, véanse los capítulos dedicados a ello).

## Estructura básica

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

- `<table>` : el contenedor de la matriz completa.
- `<thead>` : el encabezado (a menudo una sola línea, los títulos de las columnas).
- `<tbody>` : el cuerpo de la tabla (los propios datos).
- `<tr>` (*fila de tabla*): una fila.
- `<th>` (*encabezado de tabla*): una celda de encabezado (normalmente en negrita por defecto y anunciada de forma diferente por un lector de pantalla).
- `<td>` (*datos de tabla*): una celda de datos convencional.

## Combinar celdas

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

`colspan` Extiende una celda a varias columnas, `rowspan` a varias filas.

## Nota al pie de la tabla

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

## Accesibilidad y leyenda

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

- `<caption>` : un título asociado a la tabla, que los lectores de pantalla anuncian antes de su contenido.
- `scope="col"` (o «`"row"`») en una «`<th>`»: especifica explícitamente si este encabezado se aplica a toda una columna o a toda una fila, lo cual es imprescindible para que un lector de pantalla anuncie el encabezado correcto al recorrer cada celda de una tabla compleja.

> **Nota (buena práctica):** nunca utilices `<table>` para organizar el diseño general de una página (menú, columnas de contenido...) — este uso, habitual antes de la llegada del CSS moderno, rompe la semántica del documento (un lector de pantalla anunciaría datos tabulares donde no los hay) y dificulta que la página sea responsiva.
