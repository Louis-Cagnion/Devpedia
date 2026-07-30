---
order: 3
---

# El modelo de caja (box model)

Cada elemento HTML se representa mediante CSS como un cuadro rectangular, compuesto por cuatro capas concéntricas; comprender este modelo es imprescindible para controlar los tamaños, los espacios y las alineaciones.

## Las cuatro capas

```
┌─────────────────────────────────┐
│              margin               │  <- espace EXTÉRIEUR, en dehors de la boîte
│   ┌───────────────────────────┐   │
│   │           border            │   │  <- bordure visible
│   │   ┌───────────────────┐   │   │
│   │   │      padding        │   │   │  <- espace INTÉRIEUR, entre bordure et contenu
│   │   │   ┌───────────┐   │   │   │
│   │   │   │  content    │   │   │   │  <- le texte/image/contenu réel
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

- **contenido**: el contenido real (texto, imagen...).
- **padding**: espacio entre el contenido y el borde; forma parte del propio elemento (mismo color de fondo que el contenido).
- **border**: el borde visible.
- **margin**: espacio fuera del borde que separa este elemento de los demás; nunca tiene color, siempre es transparente.

## La trampa habitual: `width` no lo incluye todo, por defecto

```css
div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largeur RÉELLEMENT occupée à l'écran : 300 + 20+20 (padding) + 2+2 (border) = 344px, PAS 300px ! */
```

> **Nota:** por defecto (`box-sizing: content-box`), `width` solo define el tamaño del **contenido**; `padding` y `border` se añaden por encima, lo que amplía el recuadro que se muestra realmente más allá del valor declarado. Esta es una causa muy frecuente de diseños que «se desbordan» de forma inesperada.

## `box-sizing: border-box` : la solución casi universal

```css
* {
    box-sizing: border-box;
}

div {
    width: 300px;
    padding: 20px;
    border: 2px solid black;
}
/* Largeur réelle : exactement 300px -> padding et border sont maintenant INCLUS dans cette valeur */
```

`border-box` Esto se debe a que `width` / `height` se refieren al tamaño **total** del recuadro (borde incluido), mientras que `padding` «restan» espacio del contenido en lugar de sumarse por encima —un comportamiento mucho más predecible, que se ha convertido en la convención de facto en la casi totalidad de los proyectos modernos (a menudo aplicado de forma global con `* { box-sizing: border-box; }`).

## Abreviaturas de escritura

```css
/* Quatre valeurs : haut droite bas gauche (sens horaire) */
margin: 10px 20px 30px 40px;

/* Deux valeurs : haut/bas puis gauche/droite */
margin: 10px 20px;

/* Une valeur : les quatre côtés identiques */
margin: 10px;

/* Cibler un seul côté */
margin-top: 10px;
padding-left: 20px;
```

## La fusión de márgenes (*margin collapsing*)

```css
p { margin-bottom: 20px; }
p + p { margin-top: 30px; }
```

> **Nota:** entre dos elementos **en flujo normal** (no en «`flexbox`» ni en «`grid`», véanse los capítulos correspondientes), los márgenes verticales adyacentes no se suman; solo se aplica el mayor de los dos (en este caso, `30px`, no `50px`). Este comportamiento, que a menudo resulta sorprendente a primera vista, solo se aplica a los márgenes verticales, nunca a los horizontales, y desaparece por completo en un contenedor Flexbox o Grid.
