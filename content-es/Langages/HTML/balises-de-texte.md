---
order: 2
---

# Las etiquetas de texto

El contenido textual de una página HTML se organiza en torno a unas cuantas etiquetas fundamentales (títulos, párrafos, listas) cuya elección debe reflejar siempre el **sentido** del contenido, no solo la apariencia visual deseada (la apariencia es cosa de [CSS](/?c=langages-de-balisage&s=css&p=css)).

## Los títulos

```html
<h1>Título principal</h1>
<h2>Subtítulo</h2>
<h3>Subsubtítulo</h3>
```

De `<h1>` (el más importante) a `<h6>` (el menos importante). Una página no debería contener más de **un solo** `<h1>` (el título principal de la página), y los niveles nunca deberían "saltarse" por un simple efecto visual (`<h1>` seguido directamente de `<h4>`): la jerarquía de títulos la utilizan los lectores de pantalla para navegar por la página (véase [Atributos data-* y accesibilidad](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)), no solo para el tamaño del texto.

## Los párrafos

```html
<p>Un párrafo de texto.</p>
```

## Las listas

```html
<ul>
    <li>Manzana</li>
    <li>Plátano</li>
</ul>

<ol>
    <li>Primer paso</li>
    <li>Segundo paso</li>
</ol>
```

`<ul>` (*unordered list*) para una lista sin orden significativo, `<ol>` (*ordered list*) cuando el orden importa (un procedimiento, una clasificación...): el navegador numera automáticamente los `<li>` de un `<ol>`.

## Énfasis del texto

```html
<strong>Texto importante</strong>
<em>Texto con énfasis</em>
```

> **Nota:** `<strong>`/`<em>` expresan una importancia **semántica** (que entiende un lector de pantalla, que puede por ejemplo acentuar vocalmente este texto), a diferencia de `<b>`/`<i>` (negrita/cursiva puramente visuales, sin significado). Hay que dar prioridad a `<strong>`/`<em>` por defecto, y reservar `<b>`/`<i>` para los casos en los que solo se busca el aspecto visual, sin intención de sentido (por ejemplo, un nombre de especie en latín, convencionalmente en cursiva).

## Saltos de línea y separadores

```html
<br>       <!-- salto de línea, dentro de un mismo bloque de texto -->
<hr>       <!-- línea horizontal, separación temática entre dos secciones -->
```

> **Nota:** `<br>` no debe usarse para crear un espaciado visual entre dos párrafos: esa es la función de CSS (`margin`, véase [El modelo de caja](/?c=langages-de-balisage&s=css&p=box-model)). Un uso repetido de `<br><br>` para "hacer espacio" es una señal de que se está usando HTML para presentación, cuando esa no es su responsabilidad.

## Citas

```html
<blockquote cite="https://fuente.com">
    <p>Una cita larga, generalmente sangrada visualmente.</p>
</blockquote>

<p>Como decía tal persona: <q>una cita corta, integrada en una frase</q>.</p>
```

Véase también [La semántica HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5) para las etiquetas que estructuran secciones enteras de contenido, más allá del propio texto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La elección de una etiqueta de texto debe reflejar el sentido del contenido (título, párrafo, lista, énfasis), nunca solo la apariencia visual deseada: la apariencia es cosa de CSS. |
| **Herramientas utilizables** | `<h1>`-`<h6>`, `<p>`, `<ul>`/`<ol>`/`<li>`, `<strong>`/`<em>`, `<blockquote>`/`<q>`. |
| **Trampas a evitar** | Saltar niveles de título por un efecto visual (`<h1>` seguido de `<h4>`); usar `<b>`/`<i>` (puramente visuales) donde `<strong>`/`<em>` (con sentido) sería más adecuado; encadenar `<br>` para crear espaciado. |
| **Buenas prácticas** | Una sola etiqueta `<h1>` por página; preferir `<strong>`/`<em>` por defecto, reservar `<b>`/`<i>` a los casos puramente visuales sin intención de sentido. |
