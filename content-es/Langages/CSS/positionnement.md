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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `position` cambia cómo se coloca un elemento: `static` (por defecto, flujo normal), `relative` (desplazado, lugar reservado), `absolute` (retirado del flujo, relativo a un ancestro posicionado), `fixed` (relativo a la ventana), `sticky` (híbrido relative/fixed). `z-index` gestiona la superposición, pero solo entre elementos posicionados. |
| **Herramientas utilizables** | `position`, `top`/`right`/`bottom`/`left`, `z-index`. |
| **Trampas a evitar** | Un `absolute` sin ancestro `relative` se posiciona respecto a toda la página, no al contenedor visual esperado; `z-index` se ignora en un elemento `static`. |
| **Buenas prácticas** | Poner siempre `position: relative` en el contenedor de un hijo en `absolute`, incluso sin ningún desplazamiento propio de ese contenedor. |
