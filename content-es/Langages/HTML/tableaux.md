---
order: 4
---

# Las tablas HTML

Una tabla HTML sirve para representar datos **tabulares** (filas/columnas realmente relacionadas entre sí, como una exportación de una base de datos; véase [SQL](/?c=domain-specific-languages-dsl&p=sql)); nunca para maquetar visualmente una página entera, un uso histórico hoy sustituido por [CSS](/?c=langages-de-balisage&s=css&p=css) ([Flexbox](/?c=langages-de-balisage&s=css&p=flexbox)/[Grid](/?c=langages-de-balisage&s=css&p=grid)).

## Estructura básica

```html
<table>
    <thead>
        <tr>
            <th>Nombre</th>
            <th>Ciudad</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Juan</td>
            <td>Lyon</td>
        </tr>
        <tr>
            <td>María</td>
            <td>París</td>
        </tr>
    </tbody>
</table>
```

- `<table>`: el contenedor de la tabla entera.
- `<thead>`: el encabezado (a menudo una sola fila, los títulos de las columnas).
- `<tbody>`: el cuerpo de la tabla (los propios datos).
- `<tr>` (*table row*): una fila.
- `<th>` (*table header*): una celda de encabezado (generalmente en negrita por defecto, y anunciada de forma diferente por un lector de pantalla).
- `<td>` (*table data*): una celda de dato clásica.

## Combinar celdas

```html
<table>
    <tr>
        <td colspan="2">Combina 2 columnas</td>
    </tr>
    <tr>
        <td rowspan="2">Combina 2 filas</td>
        <td>Celda normal</td>
    </tr>
    <tr>
        <td>Celda normal</td>
    </tr>
</table>
```

`colspan` extiende una celda a varias columnas, `rowspan` a varias filas.

## Pie de tabla

```html
<table>
    <thead>...</thead>
    <tbody>...</tbody>
    <tfoot>
        <tr>
            <td>Total</td>
            <td>2 filas</td>
        </tr>
    </tfoot>
</table>
```

## Accesibilidad y leyenda

```html
<table>
    <caption>Distribución de clientes por ciudad</caption>
    <thead>
        <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Ciudad</th>
        </tr>
    </thead>
    ...
</table>
```

- `<caption>`: un título asociado a la tabla, anunciado por los lectores de pantalla antes de su contenido.
- `scope="col"` (o `"row"`) en un `<th>`: precisa explícitamente si este encabezado se aplica a toda una columna o a toda una fila; imprescindible para que un lector de pantalla anuncie el encabezado correcto al recorrer cada celda de una tabla compleja.

> **Nota (buena práctica):** nunca uses `<table>` para organizar el diseño general de una página (menú, columnas de contenido...): este uso, habitual antes de la llegada del CSS moderno, rompe la semántica del documento (un lector de pantalla anunciaría datos tabulares donde no los hay) y dificulta que la página sea responsiva.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `<table>` representa datos tabulares realmente relacionados entre sí; nunca un diseño general de página. `<thead>`/`<tbody>`/`<tfoot>` estructuran la tabla; `colspan`/`rowspan` combinan celdas. |
| **Herramientas utilizables** | `<caption>` (título de la tabla), `scope="col"`/`"row"` en un `<th>` para la accesibilidad. |
| **Trampas a evitar** | Usar `<table>` para el diseño general de una página: rompe la semántica y complica la responsividad. |
| **Buenas prácticas** | Asociar siempre un `scope` a cada `<th>` de una tabla compleja, para que un lector de pantalla anuncie el encabezado correcto por celda. |
