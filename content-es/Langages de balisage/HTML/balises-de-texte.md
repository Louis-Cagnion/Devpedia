---
order: 2
---

# Las etiquetas de texto

El contenido textual de una página HTML se organiza en torno a unas cuantas etiquetas fundamentales —títulos, párrafos, listas—, cuya elección debe reflejar siempre el **significado** del contenido, y no solo la apariencia visual deseada (la apariencia es competencia del CSS; véase el capítulo dedicado a ello).

## Los títulos

```html
<h1>Titre principal</h1>
<h2>Sous-titre</h2>
<h3>Sous-sous-titre</h3>
```

Desde `<h1>` (el más importante) hasta `<h6>` (el menos importante). Una página solo debería contener un** único** `<h1>` (el título principal de la página), y nunca se deben «saltar» niveles por un simple efecto visual (`<h1>` seguido directamente de `<h4>`): los lectores de pantalla utilizan la jerarquía de títulos para navegar por la página (véase el capítulo sobre accesibilidad), no solo para el tamaño del texto.

## Los párrafos

```html
<p>Un paragraphe de texte.</p>
```

## Las listas

```html
<ul>
    <li>Pomme</li>
    <li>Banane</li>
</ul>

<ol>
    <li>Première étape</li>
    <li>Deuxième étape</li>
</ol>
```

`<ul>` (*lista sin orden*) para una lista sin orden significativo, `<ol>` (*lista ordenada*) cuando el orden es importante (un procedimiento, una clasificación...) — el navegador numera automáticamente los `<li>` de un `<ol>`.

## Resaltado del texto

```html
<strong>Texte important</strong>
<em>Texte en emphase</em>
```

> **Nota:** `<strong>` / `<em>` expresan una importancia **semántica** (que entiende un lector de pantalla, que, por ejemplo, puede resaltar este texto al leerlo en voz alta), a diferencia de `<b>` / `<i>` (negrita/cursiva puramente visuales, sin significado). Dar prioridad a `<strong>` / `<em>` por defecto, y reservar `<b>` / `<i>` para los casos en los que solo se busca el aspecto visual, sin intención de transmitir significado (p. ej., un nombre de especie en latín, que convencionalmente se escribe en cursiva).

## Saltos de línea y separadores

```html
<br>       <!-- saut de ligne, à l'intérieur d'un même bloc de texte -->
<hr>       <!-- ligne horizontale, séparation thématique entre deux sections -->
```

> **Nota:** No se debe utilizar «`<br>`» para crear un espacio visual entre dos párrafos; esa es la función del CSS (`margin`; véase el capítulo dedicado a este tema). El uso repetido de «`<br><br>`» para «dejar espacio» es un indicio de que se está utilizando el HTML con fines de presentación, cuando en realidad esa no es su función.

## Citas

```html
<blockquote cite="https://source.com">
    <p>Une citation longue, généralement mise en retrait visuellement.</p>
</blockquote>

<p>Comme le disait <q>une citation courte, intégrée dans une phrase</q>.</p>
```

Véase también el capítulo sobre la semántica de HTML5 para las etiquetas que estructuran secciones completas de contenido, más allá del propio texto.
