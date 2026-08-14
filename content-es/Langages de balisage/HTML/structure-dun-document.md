---
order: 1
---

# La estructura de un documento HTML

Todo documento HTML se basa en una estructura mínima, prácticamente idéntica de una página a otra: comprender cada parte de esta estructura es el punto de partida imprescindible antes de todo lo demás.

## La estructura mínima

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Título de la página</title>
</head>
<body>
    <h1>Hola</h1>
    <p>Contenido de la página.</p>
</body>
</html>
```

## Línea por línea

- `<!DOCTYPE html>`: indica al navegador que debe interpretar la página según los estándares HTML5 modernos (modo "estándar"), en lugar de un modo de compatibilidad histórico ("quirks mode") heredado de los navegadores antiguos.
- `<html lang="es">`: la raíz del documento; `lang` indica el idioma principal del contenido, utilizado por los lectores de pantalla (véase [Atributos data-* y accesibilidad](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)) y los motores de búsqueda.
- `<head>`: los metadatos de la página, que nunca se muestran directamente en el cuerpo visible.
  - `<meta charset="UTF-8">`: la codificación de caracteres; sin esta línea (o con una codificación incorrecta), los caracteres acentuados o especiales pueden mostrarse de forma corrupta.
  - `<meta name="viewport" ...>`: imprescindible para una visualización correcta en móvil; sin ella, un navegador móvil suele mostrar la página como si estuviera pensada para una pantalla de ordenador, y luego la reduce (zoom ilegible).
  - `<title>`: el texto que aparece en la pestaña del navegador y en los resultados de búsqueda.
- `<body>`: todo el contenido realmente visible de la página.

## Etiquetas y atributos

```html
<a href="https://ejemplo.com" target="_blank">Enlace</a>
```

- `<a>` y `</a>`: etiqueta de apertura y de cierre, que delimitan un elemento.
- `href`, `target`: unos **atributos**, que aportan información adicional a la etiqueta (aquí, el destino del enlace y su comportamiento de apertura).

Algunas etiquetas no tienen contenido y se cierran a sí mismas, sin etiqueta de cierre separada:

```html
<img src="foto.jpg" alt="Descripción de la foto">
<br>
<input type="text">
```

## El anidamiento de las etiquetas

```html
<!-- Correcto: cierre en el orden inverso de la apertura -->
<p>Texto en <strong>negrita <em>y cursiva</em></strong>.</p>

<!-- Incorrecto: solapamiento de las etiquetas -->
<p>Texto en <strong>negrita <em>y cursiva</strong></em>.</p>
```

Una etiqueta abierta en último lugar debe cerrarse en primer lugar: un solapamiento, aunque a menudo los navegadores lo "toleran" en silencio, produce un resultado impredecible y debe evitarse.

## Los comentarios

```html
<!-- Este comentario nunca se muestra en la página -->
```

Véase también [La semántica HTML5](/?c=langages-de-balisage&s=html&p=semantique-html5), que detalla la organización típica del contenido dentro de `<body>`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un documento HTML sigue una estructura fija (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>`). Las etiquetas se anidan en el orden inverso de su apertura; un solapamiento produce un resultado impredecible. |
| **Herramientas utilizables** | `<meta charset>`, `<meta name="viewport">`, `<title>`: los metadatos imprescindibles de todo documento. |
| **Trampas a evitar** | Olvidar `<meta name="viewport">`: la página se muestra entonces en móvil como si estuviera pensada para una pantalla de ordenador, y luego se reduce de forma ilegible. |
| **Buenas prácticas** | Cerrar siempre una etiqueta abierta, en el orden inverso de su apertura, incluso cuando un navegador tolera en silencio lo contrario. |
