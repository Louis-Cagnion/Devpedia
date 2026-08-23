---
order: 3
---

# El modelo de caja (box model)

Cada elemento [HTML](/?c=langages-de-balisage&s=html&p=html) se representa en CSS como una caja rectangular, compuesta por cuatro capas concéntricas: comprender este modelo es imprescindible para dominar los tamaños, los espacios y las alineaciones.

## Las cuatro capas

```text
┌─────────────────────────────────┐
│              margin               │  <- espacio EXTERIOR, fuera de la caja
│   ┌───────────────────────────┐   │
│   │           border            │   │  <- borde visible
│   │   ┌───────────────────┐   │   │
│   │   │      padding        │   │   │  <- espacio INTERIOR, entre el borde y el contenido
│   │   │   ┌───────────┐   │   │   │
│   │   │   │  content    │   │   │   │  <- el texto/imagen/contenido real
│   │   │   └───────────┘   │   │   │
│   │   └───────────────────┘   │   │
│   └───────────────────────────┘   │
└─────────────────────────────────┘
```

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
    margin: 10px;
}
```

- **content**: el contenido real (texto, imagen...).
- **padding**: espacio entre el contenido y el borde, forma parte del propio elemento (mismo color de fondo que el contenido).
- **border**: el borde visible.
- **margin**: espacio fuera del borde, que separa este elemento de los demás, nunca tiene color, siempre es transparente.

## La trampa clásica: `width` no lo incluye todo, por defecto

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Ancho REALMENTE ocupado en pantalla: 300 + 20+20 (padding) + 2+2 (border) = 344px, ¡NO 300px! */
```

> **Nota:** por defecto (`box-sizing: content-box`), `width` solo define el tamaño del **contenido**: `padding` y `border` se suman por encima, ampliando la caja que realmente se muestra más allá del valor declarado. Esta es una fuente muy frecuente de diseños que "se desbordan" de forma inesperada.

## `box-sizing: border-box`: la solución casi universal

```css
* {
    box-sizing: border-box;
}

div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Ancho real: exactamente 300px -> padding y border ahora estan INCLUIDOS en este valor */
```

`border-box` hace que `width`/`height` designen el tamaño **total** de la caja (borde incluido), y que el `padding` "recorte" el espacio del contenido en lugar de sumarse por encima: un comportamiento mucho más predecible, que se ha convertido en la convención de facto en la práctica totalidad de los proyectos modernos (a menudo aplicado globalmente con `* { box-sizing: border-box; }`).

## Los atajos de escritura

```css
/* Cuatro valores: arriba derecha abajo izquierda (sentido horario) */
margin: 10px 20px 30px 40px;

/* Dos valores: arriba/abajo y luego izquierda/derecha */
margin: 10px 20px;

/* Un valor: los cuatro lados iguales */
margin: 10px;

/* Aplicar a un solo lado */
margin-top: 10px;
padding-left: 20px;
```

## La fusión de márgenes (*margin collapsing*)

```css
p { margin-bottom: 20px; }
p + p { margin-top: 30px; }
```

> **Nota:** entre dos elementos **en flujo normal** (no en [Flexbox](/?c=langages-de-balisage&s=css&p=flexbox)/[Grid](/?c=langages-de-balisage&s=css&p=grid)), los márgenes verticales adyacentes no se suman: solo se aplica el mayor de los dos (en este caso, `30px`, no `50px`). Este comportamiento, a menudo sorprendente a primera vista, solo se aplica a los márgenes verticales, nunca a los horizontales, y desaparece por completo en un contenedor Flexbox o Grid.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cada elemento es una caja de 4 capas concéntricas: content, padding, border, margin. Por defecto, `width` solo define el contenido (`padding`/`border` se suman aparte); `box-sizing: border-box` incluye todo en el valor declarado. |
| **Herramientas utilizables** | `box-sizing: border-box` (a menudo aplicado globalmente), los atajos `margin`/`padding` de 1, 2 o 4 valores. |
| **Trampas a evitar** | Olvidar que `width` no incluye `padding`/`border` por defecto: una caja de "300px" puede ocupar 344 en pantalla. |
| **Buenas prácticas** | Aplicar `* { box-sizing: border-box; }` globalmente al inicio del proyecto: comportamiento más predecible, convertido en la convención de facto. |
