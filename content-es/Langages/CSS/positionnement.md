---
order: 4
---

# El posicionamiento (position, z-index)

La propiedad `position` cambia radicalmente la forma en que se coloca un elemento en la página: más allá del flujo normal (cada elemento uno tras otro) que ya gestionan [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox) y [Grid](/?c=langages-de-balisage&s=css&p=grid).

## `static`: el comportamiento por defecto

```css
div {
    position: static;   /* valor por defecto: sigue el flujo normal del documento */
}
```

Un elemento `static` ignora por completo `top`/`left`/`right`/`bottom`: estas propiedades solo tienen efecto sobre los demás valores de `position`.

## `relative`: desplazado respecto a su posición original

```css
div {
    position: relative;
    top: 10px;   /* desplazado 10px hacia ABAJO respecto a su posición normal */
    left: 20px;  /* desplazado 20px hacia la DERECHA */
}
```

> **Nota:** el elemento mantiene su posición original **reservada** en el flujo (los demás elementos no se mueven para compensar); solo se desplaza su visualización. `position: relative` también se usa muy a menudo para otra cosa: definir un punto de referencia para un elemento hijo en `position: absolute` (véase más abajo).

## `absolute`: posicionado respecto a un ancestro posicionado

```css
.contenedor {
    position: relative;   /* se convierte en el punto de referencia */
}
.badge {
    position: absolute;
    top: 0;
    right: 0;                /* posicionado en la esquina superior derecha DE .contenedor */
}
```

Un elemento `absolute` se retira del flujo normal (los demás elementos se comportan como si ya no existiera), y se posiciona respecto a su ancestro posicionado más cercano (`relative`, `absolute`, `fixed` o `sticky`); si no hay ninguno, respecto a toda la página (`<html>`).

> **Nota (trampa clásica):** un `.badge { position: absolute; }` sin **ningún** ancestro posicionado se posiciona respecto a toda la página, no solo respecto a su contenedor visual aparente: por eso `.contenedor { position: relative; }` acompaña casi sistemáticamente a un hijo en `absolute`, incluso sin ningún desplazamiento (`top`/`left`) en el propio contenedor.

## `fixed`: posicionado respecto a la ventana, inmóvil al desplazarse

```css
.bandeau-cookies {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
}
```

Permanece en la misma posición visual **incluso al desplazar la página**, se usa para un menú siempre visible, un banner de notificación, etc. Se posiciona respecto a la ventana del navegador (*viewport*), no respecto a un ancestro.

## `sticky`: un híbrido entre `relative` y `fixed`

```css
.entete-tableau {
    position: sticky;
    top: 0;
}
```

Se comporta como `relative` mientras el elemento es visible en su ubicación normal, y luego pasa a ser `fixed` (pegado al borde indicado, aquí `top: 0`) en cuanto el desplazamiento lo sacaría de esa ubicación, se usa típicamente para un encabezado de tabla que permanece visible durante el desplazamiento del contenido.

## `z-index`: gestionar la superposición

```css
.modale {
    position: absolute;
    z-index: 100;    /* se muestra POR ENCIMA de los elementos con un z-index menor */
}
.overlay {
    position: fixed;
    z-index: 50;
}
```

> **Nota:** `z-index` solo tiene efecto sobre un elemento **ya posicionado** (`relative`, `absolute`, `fixed` o `sticky`): en un elemento `static`, `z-index` simplemente se ignora. Un valor de `z-index` más alto se muestra por encima de uno más bajo, pero solo en comparación con elementos que comparten el mismo "contexto de apilamiento" (un grupo de elementos comparados entre sí para la superposición; un elemento posicionado con un `z-index`, una opacidad inferior a 1, o una transformación crea un nuevo contexto para sus propios hijos: sus `z-index` se comparan entre ellos, nunca directamente con los del exterior); un detalle que explica algunos casos en los que un `z-index` muy alto no basta para pasar por encima de un elemento aparentemente de menor prioridad.

## Un ancestro con `transform`/`filter` también redefine la referencia de un `fixed`

La nota sobre `z-index` arriba menciona que un ancestro con `transform` (o `filter`/`will-change`) crea un nuevo contexto de apilamiento. Ese mismo ancestro tiene un segundo efecto, independiente del primero: también se convierte en el punto de referencia geométrico (*containing block*) de sus descendientes en `position: fixed`, que dejan entonces de posicionarse respecto a la ventana.

```css
.ancestro-animado {
    transform: translateX(0);   /* incluso un transform "neutro" activa este efecto */
}
.menu {
    position: fixed;
    top: 0;
    right: 0;   /* esperado: la esquina superior derecha de la VENTANA... */
    /* ...pero se convierte en la esquina superior derecha de .ancestro-animado */
}
```

> **Trampa:** olvidar que `transform`/`filter`/`will-change` en un ancestro rompe el posicionamiento `fixed` habitual de un descendiente, atándolo a ese ancestro en lugar de a la ventana: un efecto distinto del cambio de contexto de apilamiento ya visto arriba, que afecta a la misma propiedad CSS pero por una razón diferente.
>
> **Buena práctica:** si un menú/panel `fixed` debe seguir posicionado respecto a la ventana a pesar de un ancestro animado, reubicarlo directamente bajo `<body>` (mediante JavaScript, o declarándolo ahí en el HTML) en lugar de dejarlo bajo ese ancestro.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `position` cambia cómo se coloca un elemento: `static` (por defecto, flujo normal), `relative` (desplazado, lugar reservado), `absolute` (retirado del flujo, relativo a un ancestro posicionado), `fixed` (relativo a la ventana), `sticky` (híbrido relative/fixed). `z-index` gestiona la superposición, pero solo entre elementos posicionados. |
| **Herramientas utilizables** | `position`, `top`/`right`/`bottom`/`left`, `z-index`. |
| **Trampas a evitar** | Un `absolute` sin ancestro `relative` se posiciona respecto a toda la página, no al contenedor visual esperado; `z-index` se ignora en un elemento `static`; un ancestro con `transform`/`filter` rompe el posicionamiento `fixed` habitual de un descendiente. |
| **Buenas prácticas** | Poner siempre `position: relative` en el contenedor de un hijo en `absolute`, incluso sin ningún desplazamiento propio de ese contenedor. Reubicar bajo `<body>` un panel `fixed` que deba seguir relativo a la ventana a pesar de un ancestro animado. |
