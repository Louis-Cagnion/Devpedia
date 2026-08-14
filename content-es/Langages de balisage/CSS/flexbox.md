---
order: 5
---

# Flexbox

**Flexbox** (*Flexible Box Layout*) organiza los elementos a lo largo de un **único eje** (horizontal o vertical), distribuyendo el espacio disponible entre ellos: la solución moderna para alinear, centrar y distribuir elementos, que sustituye a técnicas históricas mucho más frágiles (flotantes, [tablas](/?c=langages-de-balisage&s=html&p=tableaux) usadas fuera de su propósito original).

## Activar Flexbox

```css
.contenedor {
    display: flex;
}
```

En cuanto se aplica `display: flex` a un elemento, todos sus **hijos directos** (y únicamente ellos) se convierten en "elementos flexibles", alineados automáticamente en una línea (por defecto).

## El eje principal: `flex-direction`

```css
.contenedor {
    display: flex;
    flex-direction: row;      /* por defecto: de izquierda a derecha */
    /* flex-direction: column;   -> de arriba a abajo */
    /* flex-direction: row-reverse; */
}
```

Todo Flexbox razona en términos de **eje principal** (el de `flex-direction`) y de **eje secundario** (perpendicular): las propiedades de alineación siguientes se aplican de forma diferente según este eje.

## Alinear en el eje principal: `justify-content`

```css
.contenedor {
    display: flex;
    justify-content: flex-start;     /* por defecto: agrupados al inicio */
    /* justify-content: center;        -> centrados */
    /* justify-content: space-between;  -> espacio igual ENTRE los elementos, nada en los bordes */
    /* justify-content: space-around;    -> espacio igual ALREDEDOR de cada elemento */
}
```

## Alinear en el eje secundario: `align-items`

```css
.contenedor {
    display: flex;
    align-items: stretch;       /* por defecto: estira los elementos hasta toda la altura disponible */
    /* align-items: center;       -> centra verticalmente (si flex-direction: row) */
    /* align-items: flex-start;     -> alinea arriba */
    /* align-items: flex-end;        -> alinea abajo */
}
```

> **El centrado perfecto, un clásico resuelto en 3 líneas:**

```css
.contenedor {
    display: flex;
    justify-content: center;  /* centra horizontalmente */
    align-items: center;      /* centra verticalmente */
}
```

## Las propiedades de los hijos

```css
.elemento {
    flex-grow: 1;       /* puede crecer para ocupar el espacio restante (1 = parte igual entre elementos) */
    flex-shrink: 1;     /* puede encogerse si falta espacio (por defecto) */
    flex-basis: 200px;  /* tamaño inicial, antes de aplicar grow/shrink */
    order: 2;           /* cambia el orden de visualización SIN tocar el HTML */
}
```

> **Nota (accesibilidad):** `order` solo cambia el orden **visual**: el orden de tabulación con el teclado y el que lee un lector de pantalla siguen siendo los del HTML. Un desfase entre ambos puede desorientar a un usuario que utilice el teclado o un lector de pantalla; debe reservarse para reordenaciones puramente decorativas, nunca para corregir un orden de contenido que no tenga sentido en el propio HTML.

```css
.columna-principal { flex-grow: 2; }   /* ocupa el doble de espacio que .columna-lateral */
.columna-lateral { flex-grow: 1; }
```

## Salto de línea: `flex-wrap`

```css
.contenedor {
    display: flex;
    flex-wrap: nowrap;   /* por defecto: todo cabe en una sola línea, se encoge si hace falta */
    /* flex-wrap: wrap;     -> pasa a la línea siguiente si falta espacio */
}
```

## Resumen visual

```text
justify-content (eje principal, aquí horizontal):
[■]                    [■] [■] [■]              [■]       [■]       [■]
flex-start             center                    space-between

align-items (eje secundario, aquí vertical):
[■]                    [■]                        [■]
[ ]  flex-start        [ ]  center                [ ]  flex-end
[ ]                    [ ]                        [■]
```

Véase también [CSS Grid](/?c=langages-de-balisage&s=css&p=grid), para un diseño en **dos** dimensiones (filas Y columnas simultáneamente), mientras que Flexbox sigue estando pensado fundamentalmente para un solo eje a la vez.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Flexbox alinea elementos en un solo eje (`flex-direction`). `justify-content` alinea en el eje principal, `align-items` en el eje secundario. `flex-grow`/`flex-shrink`/`flex-basis` controlan el tamaño de los hijos. |
| **Herramientas utilizables** | `display: flex`, `justify-content`, `align-items`, `flex-wrap`, `flex-grow`/`shrink`/`basis`, `order`. |
| **Trampas a evitar** | Usar `order` para reordenar un contenido que tiene un sentido de lectura real: el orden visual cambia, pero no el orden de tabulación del teclado ni el que lee un lector de pantalla. |
| **Buenas prácticas** | Reservar `order` para reordenaciones puramente decorativas; usar Grid en lugar de Flexbox en cuanto el diseño necesite dos dimensiones (filas Y columnas). |
