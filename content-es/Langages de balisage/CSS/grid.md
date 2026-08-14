---
order: 6
---

# CSS Grid

A diferencia de [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox), pensado para un solo eje a la vez, **CSS Grid** organiza los elementos en una auténtica cuadrícula **bidimensional**: filas y columnas definidas simultáneamente, con un control preciso de la posición de cada elemento.

## Activar una cuadrícula

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 200px 200px;  /* 3 columnas de 200px cada una */
    grid-template-rows: 100px 100px;           /* 2 filas de 100px cada una */
    gap: 10px;                                 /* espacio entre las celdas, filas Y columnas */
}
```

## La unidad `fr`: distribuir el espacio disponible

```css
.conteneur {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;   /* 3 columnas: la 2ª ocupa el doble de espacio que las otras 2 */
}
```

`fr` (*fracción*) distribuye el espacio **restante** tras restar los tamaños fijos; mucho más flexible que un porcentaje, sobre todo al combinarlo con tamaños fijos:

```css
.conteneur {
    display: grid;
    grid-template-columns: 250px 1fr;   /* columna lateral fija, columna principal que ocupa el resto */
}
```

## `repeat()`: evitar la repetición

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(4, 1fr);   /* equivalente a "1fr 1fr 1fr 1fr" */
}
```

## Cuadrículas adaptativas sin media query

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}
```

`auto-fit` calcula automáticamente cuántas columnas **de al menos** `200px` caben en el espacio disponible, y las estira (`1fr`) para completar el espacio restante: el número de columnas se adapta así al ancho de la pantalla, sin escribir ni una sola [media query](/?c=langages-de-balisage&s=css&p=responsive-et-media-queries).

## Colocar un elemento con precisión

```css
.element {
    grid-column: 1 / 3;  /* se extiende de la línea de cuadrícula 1 a la línea 3 -> ocupa 2 columnas */
    grid-row: 2 / 4;     /* se extiende 2 filas verticalmente */
}
```

```text
Líneas de cuadrícula verticales:  1    2    3    4
                                ┌────┬────┬────┐
                          1 ┤   │    │    │    │
                                ├────┼────┼────┤
                          2 ┤   │ elemento (col 1→3, fila 2→4)  │
                                ├────┤              │
                          3 ┤   │    │              │
                                └────┴────┴────┘
```

## Las áreas con nombre (`grid-template-areas`): el diseño más legible

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

Cada nombre en `grid-template-areas` dibuja literalmente la disposición visual de la página directamente en el CSS; una zona repetida en varias líneas/columnas del esquema ocupa automáticamente ese espacio fusionado (aquí, `entete` y `pied` se extienden a todo el ancho).

## ¿Flexbox o Grid?

| | Flexbox | Grid |
|---|---|---|
| Dimensiones | Un solo eje a la vez | Dos dimensiones simultáneas |
| Caso de uso típico | Alinear elementos en una barra de navegación, centrar un contenido | Estructurar el diseño global de una página (encabezado/lateral/principal/pie de página) |
| Tamaño de los elementos | A menudo depende del contenido | Definido explícitamente por la cuadrícula |

En la práctica, ambos se combinan muy a menudo en un mismo proyecto: Grid para la estructura general de la página, Flexbox para alinear el contenido dentro de cada zona.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | CSS Grid organiza los elementos en una cuadrícula bidimensional (filas Y columnas), a diferencia de Flexbox (un solo eje). La unidad `fr` distribuye el espacio restante; `grid-template-areas` nombra visualmente cada zona. |
| **Herramientas utilizables** | `display: grid`, `grid-template-columns`/`rows`, `fr`, `repeat()`, `grid-template-areas`, `grid-column`/`grid-row`. |
| **Trampas a evitar** | Usar Flexbox para un diseño que realmente necesita dos dimensiones: el resultado rápidamente se convierte en una pila de soluciones alternativas. |
| **Buenas prácticas** | `repeat(auto-fit, minmax(...))` para una cuadrícula adaptativa sin escribir ninguna media query; `grid-template-areas` para una estructura de página legible directamente en el CSS. |
