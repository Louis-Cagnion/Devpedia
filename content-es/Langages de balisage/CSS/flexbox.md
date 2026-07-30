---
order: 5
---

# Flexbox

**Flexbox** (*Flexible Box Layout*) organiza los elementos a lo largo de un **único eje** (horizontal o vertical), distribuyendo el espacio disponible entre ellos: la solución moderna para alinear, centrar y distribuir elementos, que sustituye a técnicas históricas mucho más frágiles (elementos flotantes, tablas utilizadas fuera de su finalidad original; véase el capítulo sobre tablas en HTML).

## Activar Flexbox

```css
.conteneur {
    display: flex;
}
```

En cuanto se aplica la propiedad `display: flex` a un elemento, todos sus **hijos directos** (y solo ellos) se convierten en «elementos flexibles», alineados automáticamente en una línea (por defecto).

## El tema principal: `flex-direction`

```css
.conteneur {
    display: flex;
    flex-direction: row;      /* par défaut : gauche à droite */
    /* flex-direction: column;   -> haut en bas */
    /* flex-direction: row-reverse; */
}
```

Todo en Flexbox se basa en el eje** principal** (el de `flex-direction`) y el eje** secundario** (perpendicular); las propiedades de alineación que se indican a continuación se aplican de forma diferente según cada eje.

## Alinear con el eje principal: `justify-content`

```css
.conteneur {
    display: flex;
    justify-content: flex-start;     /* par défaut : regroupés au début */
    /* justify-content: center;        -> centrés */
    /* justify-content: space-between;  -> espace égal ENTRE les éléments, rien sur les bords */
    /* justify-content: space-around;    -> espace égal AUTOUR de chaque élément */
}
```

## Alinear con el eje secundario: `align-items`

```css
.conteneur {
    display: flex;
    align-items: stretch;       /* par défaut : étire les éléments sur toute la hauteur disponible */
    /* align-items: center;       -> centre verticalement (si flex-direction: row) */
    /* align-items: flex-start;     -> aligne en haut */
    /* align-items: flex-end;        -> aligne en bas */
}
```

> **El centrado perfecto, un clásico resuelto en tres líneas:**

```css
.conteneur {
    display: flex;
    justify-content: center;   /* centre horizontalement */
    align-items: center;        /* centre verticalement */
}
```

## Propiedades de los elementos secundarios

```css
.element {
    flex-grow: 1;      /* peut grandir pour occuper l'espace restant (1 = part égale entre éléments) */
    flex-shrink: 1;      /* peut rétrécir si l'espace manque (par défaut) */
    flex-basis: 200px;     /* taille de départ, avant application de grow/shrink */
    order: 2;                /* change l'ordre d'affichage SANS toucher au HTML */
}
```

> **Nota (accesibilidad):** `order` solo cambia el orden **visual**; el orden de tabulación con el teclado y el que lee un lector de pantalla siguen siendo los del HTML. Una discrepancia entre ambos puede desorientar a un usuario que utilice el teclado o un lector de pantalla; debe reservarse para reordenaciones puramente decorativas, nunca para corregir un orden de contenido que no tenga sentido en el propio código HTML.

```css
.colonne-principale { flex-grow: 2; }   /* occupe deux fois plus d'espace que .colonne-laterale */
.colonne-laterale { flex-grow: 1; }
```

## Salto de línea: `flex-wrap`

```css
.conteneur {
    display: flex;
    flex-wrap: nowrap;   /* par défaut : tout tient sur une seule ligne, rétrécit si besoin */
    /* flex-wrap: wrap;     -> passe à la ligne suivante si manque de place */
}
```

## Resumen visual

```
justify-content (axe principal, ici horizontal) :
[■]                    [■] [■] [■]              [■]       [■]       [■]
flex-start             center                    space-between

align-items (axe secondaire, ici vertical) :
[■]                    [■]                        [■]
[ ]  flex-start        [ ]  center                [ ]  flex-end
[ ]                    [ ]                        [■]
```

Véase también el capítulo sobre CSS Grid, para un diseño bidimensional (líneas y columnas simultáneamente), mientras que Flexbox sigue estando concebido fundamentalmente para un solo eje a la vez.
