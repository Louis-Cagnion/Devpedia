---
order: 4
---

# El posicionamiento (posición, z-index)

La propiedad `position` cambia radicalmente la forma en que se coloca un elemento en la página, más allá del flujo normal (cada elemento uno tras otro) que ya gestionan Flexbox y Grid (véanse los capítulos correspondientes).

## `static` : el comportamiento por defecto

```css
div {
    position: static;   /* valeur par défaut : suit le flux normal du document */
}
```

Un elemento `static` ignora por completo `top` / `left` / `right` / `bottom`; estas propiedades solo tienen efecto sobre los demás valores de `position`.

## `relative` : desplazado con respecto a su posición original

```css
div {
    position: relative;
    top: 10px;     /* décalé de 10px vers le BAS par rapport à sa position normale */
    left: 20px;      /* décalé de 20px vers la DROITE */
}
```

> **Nota:** el elemento mantiene su posición original **reservada** en el flujo (los demás elementos no se desplazan para compensarlo); solo se desplaza su visualización. «`position: relative`» también se utiliza muy a menudo para otra cosa: definir un punto de referencia para un elemento secundario en «`position: absolute`» (véase más abajo).

## `absolute` : posicionado en relación con un elemento antecesor posicionado

```css
.conteneur {
    position: relative;   /* devient le point de référence */
}
.badge {
    position: absolute;
    top: 0;
    right: 0;                /* positionné dans le coin supérieur droit DE .conteneur */
}
```

Un elemento `absolute` se retira del flujo normal (los demás elementos se comportan como si ya no existiera) y se coloca en relación con su antepasado más cercano (`relative`, `absolute`, `fixed` o `sticky`); si no hay ninguno, se coloca en relación con la página completa (`<html>`).

> **Nota (trampa clásica):** un elemento `.badge { position: absolute; }` sin **ningún** antecesor posicionado se coloca en relación con toda la página, no solo con su contenedor visual visible; por eso, `.conteneur { position: relative; }` suele ir acompañado casi siempre de un elemento hijo con `absolute`, incluso sin ningún desplazamiento (`top` / `left`) en el propio contenedor.

## `fixed` : posicionado en relación con la ventana, fijo al desplazarse

```css
.bandeau-cookies {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}
```

Permanece en la misma posición visual **incluso al desplazarse por la página**; se utiliza para un menú siempre visible, una barra de notificaciones, etc. Se posiciona en relación con la ventana del navegador (*viewport*), no en relación con un elemento superior.

## `sticky` : un híbrido entre `relative` y `fixed`

```css
.entete-tableau {
    position: sticky;
    top: 0;
}
```

Se comporta como `relative` mientras el elemento está visible en su ubicación normal, y pasa a ser `fixed` (pegado al borde especificado, en este caso `top: 0`) en cuanto el desplazamiento lo sacaría de su posición; se utiliza habitualmente para un encabezado de tabla que permanece visible mientras se desplaza el contenido.

## `z-índice` : gestionar la superposición

```css
.modale {
    position: absolute;
    z-index: 100;    /* affiché AU-DESSUS des éléments avec un z-index plus faible */
}
.overlay {
    position: fixed;
    z-index: 50;
}
```

> **Nota:** «`z-índice`» solo tiene efecto sobre un elemento **ya posicionado** (`relative`, `absolute`, `fixed` o `sticky`); en un elemento `static`, `z-índice` se ignora por completo. Un valor de «`z-índice`» más alto se muestra por encima de uno más bajo, pero solo en comparación con elementos que comparten el mismo «contexto de pila», un detalle que explica algunos casos en los que un valor de «`z-índice`» muy alto no basta para situarse por encima de un elemento aparentemente de menor prioridad.
