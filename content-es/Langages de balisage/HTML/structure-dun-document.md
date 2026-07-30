---
order: 1
---

# La estructura de un documento HTML

Todo documento HTML se basa en una estructura mínima, prácticamente idéntica de una página a otra; comprender cada parte de esta estructura es el punto de partida imprescindible antes de nada más.

## El esqueleto mínimo

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Titre de la page</title>
</head>
<body>
    <h1>Bonjour</h1>
    <p>Contenu de la page.</p>
</body>
</html>
```

## Línea por línea

- `<!DOCTYPE html>` : indica al navegador que debe interpretar la página según los estándares HTML5 modernos (modo «*estándar*»), en lugar de un modo de compatibilidad histórico («*modo peculiar*») heredado de los navegadores antiguos.
- `<html lang="fr">` : la raíz del documento; `lang` indica el idioma principal del contenido —utilizado por los lectores de pantalla (véase el capítulo sobre accesibilidad) y los motores de búsqueda.
- `<head>` : los metadatos de la página, que nunca se muestran directamente en el cuerpo visible.
  - `<meta charset="UTF-8">` : la codificación de caracteres — sin esta línea (o con una codificación incorrecta), los caracteres acentuados o especiales pueden mostrarse de forma errónea.
  - `<meta name="viewport" ...>` : imprescindible para una visualización correcta en dispositivos móviles; sin ella, un navegador móvil suele mostrar la página como si estuviera diseñada para una pantalla de ordenador y, a continuación, la reduce (zoom ilegible).
  - `<title>` : el texto que aparece en la pestaña del navegador y en los resultados de búsqueda.
- `<body>` : todo el contenido realmente visible de la página.

## Etiquetas y atributos

```html
<a href="https://exemple.com" target="_blank">Lien</a>
```

- `<a>` y `</a>`: etiquetas de apertura y cierre, que delimitan un elemento.
- `href`, `target`: **atributos** que aportan información adicional a la etiqueta (en este caso, el destino del enlace y su comportamiento al abrirse).

Algunas etiquetas no tienen contenido y se cierran por sí mismas, sin una etiqueta de cierre separada:

```html
<img src="photo.jpg" alt="Description de la photo">
<br>
<input type="text">
```

## El anidamiento de etiquetas

```html
<!-- Correct : fermeture dans l'ordre inverse de l'ouverture -->
<p>Texte en <strong>gras <em>et italique</em></strong>.</p>

<!-- Incorrect : chevauchement des balises -->
<p>Texte en <strong>gras <em>et italique</strong></em>.</p>
```

La etiqueta que se haya abierto en último lugar debe cerrarse en primer lugar; un solapamiento, aunque a menudo los navegadores lo «toleran» sin avisar, produce un resultado impredecible y debe evitarse.

## Los comentarios

```html
<!-- Ce commentaire n'est jamais affiché sur la page -->
```

Véase también el capítulo sobre la semántica de HTML5, que detalla la organización típica del contenido dentro de `<body>`.
