# CSS

CSS (*Cascading Style Sheets*) es el lenguaje que describe el **aspecto** de un documento HTML (véase la sección dedicada a este tema) —colores, tamaños, posicionamiento, maquetación— separando deliberadamente esta presentación de la estructura (HTML) y del comportamiento (JavaScript).

Entre los conceptos esenciales de CSS se encuentran, entre otros:

- Los selectores, que se aplican a los elementos HTML a los que se quiere aplicar un estilo
- El modelo de caja (*box model*), que regula el tamaño y el espaciado de cada elemento
- Los sistemas modernos de maquetación: Flexbox (alineación en un eje) y Grid (cuadrícula bidimensional)
- La cascada y la especificidad, que determinan qué regla se aplica cuando varias se contradicen.
- El *diseño adaptativo*, para que una página se adapte a todos los tamaños de pantalla

## La sintaxis básica

```css
selecteur {
    propriete: valeur;
    autre-propriete: autre-valeur;
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
<h1 style="color: blue;">Titre</h1>
```

> **Nota (buena práctica):** casi siempre es preferible utilizar un archivo «`.css`» externo (`<link>`), ya que el navegador lo almacena en caché, se puede reutilizar en varias páginas y separa claramente la estructura de la presentación. El estilo en línea (`style="..."` directamente en una etiqueta) tiene la máxima especificidad (véase el capítulo sobre el modelo en cascada), lo que dificulta su posterior sobrescritura; debe reservarse para casos muy concretos, a menudo generados dinámicamente en JavaScript.
