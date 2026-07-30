---
order: 6
---

# CSS Grid

A diferencia de Flexbox (véase el capítulo dedicado), concebido para un solo eje a la vez, **CSS Grid** organiza los elementos en una auténtica cuadrícula **bidimensional** —líneas y columnas definidas simultáneamente—, con un control preciso de la posición de cada elemento.

## Activar una cuadrícula

```css
.conteneur {
    display: grid;
    grid-template-columns: 200px 200px 200px;   /* 3 colonnes de 200px chacune */
    grid-template-rows: 100px 100px;               /* 2 lignes de 100px chacune */
    gap: 10px;                                        /* espace entre les cellules, lignes ET colonnes */
}
```

## La unidad «`fr`»: distribuir el espacio disponible

```css
.conteneur {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;   /* 3 colonnes : la 2e occupe 2x plus d'espace que les 2 autres */
}
```

`fr` (*fracción*) distribuye el espacio **restante** tras restar los tamaños fijos; es mucho más flexible que un porcentaje, sobre todo al combinarlo con tamaños fijos:

```css
.conteneur {
    display: grid;
    grid-template-columns: 250px 1fr;   /* colonne latérale fixe, colonne principale qui occupe le reste */
}
```

## `repeat()` : evitar la repetición

```css
.conteneur {
    display: grid;
    grid-template-columns: repeat(4, 1fr);   /* équivalent à "1fr 1fr 1fr 1fr" */
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

`auto-fit` Calcula automáticamente cuántas columnas **de al menos** `200px` caben en el espacio disponible y las estira (`1fr`) para llenar el espacio restante; así, el número de columnas se adapta al ancho de la pantalla sin necesidad de escribir ni una sola media query (véase el capítulo dedicado a este tema).

## Colocar un elemento con precisión

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

Cada nombre en `grid-template-areas` define literalmente el diseño visual de la página directamente en el CSS: una zona que se repite en varias líneas o columnas del esquema ocupa automáticamente ese espacio combinado (en este caso, `entete` y `pied` se extienden a lo ancho).

## ¿Flexbox o Grid?

| | Flexbox | Grid |
|---|---|---|
| Dimensiones | Un solo eje a la vez | Dos dimensiones simultáneas |
| Casos de uso típicos | Alinear elementos en una barra de navegación, centrar un contenido | Estructurar el diseño general de una página (encabezado/barra lateral/contenido principal/pie de página) |
| Tamaño de los elementos | A menudo depende del contenido | Definido explícitamente por la cuadrícula |

En la práctica, ambos se combinan muy a menudo en un mismo proyecto: Grid para la estructura general de la página y Flexbox para alinear el contenido dentro de cada zona.
