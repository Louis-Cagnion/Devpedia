---
order: 6
---

# La semántica de HTML5

Antes de HTML5, la estructuración de una página se basaba casi exclusivamente en e`<div>`es genéricas, que solo se distinguían por su `class` / `id` — HTML5 ha introducido etiquetas **semánticas**, que describen explícitamente la **función** de cada sección, de forma comprensible tanto para una persona que lee el código como para un navegador, un motor de búsqueda o un lector de pantalla.

## `<div>` Etiquetas genéricas frente a etiquetas semánticas

```html
<!-- Avant HTML5 : rien ne dit ce qu'est chaque section, sauf le nom de classe -->
<div class="header">...</div>
<div class="nav">...</div>
<div class="main-content">...</div>
<div class="footer">...</div>
```

```html
<!-- HTML5 : le sens est porté par la balise elle-même -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<footer>...</footer>
```

## Las etiquetas estructurales principales

```html
<body>
    <header>
        <h1>Nom du site</h1>
        <nav>
            <a href="/">Accueil</a>
            <a href="/contact">Contact</a>
        </nav>
    </header>

    <main>
        <article>
            <h2>Titre de l'article</h2>
            <section>
                <h3>Première partie</h3>
                <p>...</p>
            </section>
            <section>
                <h3>Deuxième partie</h3>
                <p>...</p>
            </section>
        </article>

        <aside>
            <p>Contenu complémentaire, lié mais secondaire (ex: liens connexes)</p>
        </aside>
    </main>

    <footer>
        <p>&copy; 2026 — Mentions légales</p>
    </footer>
</body>
```

| Etiqueta | Función |
|---|---|
| `<header>` | Encabezado de una página o sección (no tiene por qué estar necesariamente en la parte superior de la página) |
| `<nav>` | Un bloque con los enlaces de navegación principales |
| `<main>` | El contenido principal y único de la página (uno solo por página) |
| `<article>` | Contenido autónomo, que tenga sentido por sí solo (un artículo de blog, un comentario) |
| `<section>` | Una agrupación temática de contenidos, normalmente con su propio título |
| `<aside>` | Contenido relacionado pero secundario (una barra lateral, una nota) |
| `<footer>` | Pie de página o de sección |

## `<article>` vs`<section>`: la distinción más confusa

> **Nota:** `<article>` debe tener sentido **por sí sola**, incluso fuera de su contexto (un artículo de blog seguiría siendo comprensible si se publicara en otro sitio) — `<section>` recoge contenido que solo tiene sentido **en su contexto** (una sección de «Características técnicas» de una ficha de producto no tiene sentido separada del producto). Una página puede contener varios `<article>`, cada uno de los cuales puede a su vez contener varios `<section>`.

## Por qué la semántica es importante, más allá del estilo

- **Accesibilidad** (véase el capítulo dedicado a este tema): un lector de pantalla puede ofrecer la opción de saltar directamente a `<nav>` o `<main>`, algo que ninguna `<div class="nav">` permite con la misma fiabilidad.
- **SEO**: los motores de búsqueda comprenden mejor la estructura y la importancia relativa del contenido.
- **Legibilidad del código**: `<header>` / `<main>` / `<footer>` documentan la estructura directamente en el código HTML, sin necesidad de leer los nombres de las clases CSS para adivinar la función de cada bloque.

> **Buena práctica:** utilizar una etiqueta semántica siempre que se corresponda con la función real del contenido, y recurrir a `<div>` (puramente genérica, sin significado) únicamente como un simple contenedor técnico necesario para el diseño CSS, sin significado propio.
