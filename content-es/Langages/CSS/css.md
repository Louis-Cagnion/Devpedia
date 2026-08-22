---
order: 8
---

# CSS

CSS (*Cascading Style Sheets*) es el lenguaje que describe el **aspecto** de un documento [HTML](/?c=langages-de-balisage&s=html&p=html) (colores, tamaños, posicionamiento, maquetación), separando deliberadamente esta presentación de la estructura (HTML) y del comportamiento (JavaScript).

Entre los conceptos esenciales de CSS se encuentran, en particular:

- Los selectores, que identifican los elementos HTML que se van a estilizar
- El modelo de caja (*box model*), que regula el tamaño y el espaciado de cada elemento
- Los sistemas modernos de maquetación: Flexbox (alineación en un eje) y Grid (cuadrícula bidimensional)
- La cascada y la especificidad, que determinan qué regla se aplica cuando varias se contradicen
- El *responsive design*, para que una página se adapte a todos los tamaños de pantalla

## La sintaxis básica

```css
selector {
    propiedad: valor;
    otra-propiedad: otro-valor;
}
```

```css
h1 {
    color: blue;
    font-size: 2rem;
}
```

## Vincular una hoja de estilo a una página HTML

```html
<link rel="stylesheet" href="styles.css">
```

```html
<style>
    h1 { color: blue; }
</style>
```

```html
<h1 style="color: blue;">Título</h1>
```

> **Nota (buena práctica):** un archivo `.css` externo (`<link>`) es casi siempre preferible: el navegador lo almacena en caché, es reutilizable en varias páginas, y separa claramente estructura y presentación. El estilo en línea (`style="..."` directamente en una etiqueta) tiene la especificidad más alta (véase [Variables CSS y la cascada](/?c=langages-de-balisage&s=css&p=variables-et-cascade)), lo que dificulta su posterior sobrescritura; debe reservarse para casos muy puntuales, a menudo generados dinámicamente en JavaScript.
