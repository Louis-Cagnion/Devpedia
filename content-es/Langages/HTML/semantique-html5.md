---
order: 6
---

# La semántica de HTML5

Antes de HTML5, estructurar una página se basaba casi exclusivamente en `<div>` genéricas, distinguidas solo por su `class`/`id`; HTML5 introdujo etiquetas **semánticas**, que describen explícitamente el **rol** de cada sección, comprensible tanto para una persona que lee el código como para un navegador, un motor de búsqueda o un lector de pantalla.

## `<div>` genérica frente a etiquetas semánticas

```html
<!-- Antes de HTML5: nada indica qué es cada sección, salvo el nombre de la clase -->
<div class="header">...</div>
<div class="nav">...</div>
<div class="main-content">...</div>
<div class="footer">...</div>
```

```html
<!-- HTML5: el significado lo aporta la propia etiqueta -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<footer>...</footer>
```

## Las etiquetas estructurales principales

```html
<body>
    <header>
        <h1>Nombre del sitio</h1>
        <nav>
            <a href="/">Inicio</a>
            <a href="/contacto">Contacto</a>
        </nav>
    </header>

    <main>
        <article>
            <h2>Título del artículo</h2>
            <section>
                <h3>Primera parte</h3>
                <p>...</p>
            </section>
            <section>
                <h3>Segunda parte</h3>
                <p>...</p>
            </section>
        </article>

        <aside>
            <p>
            Contenido complementario, relacionado pero secundario (ej: enlaces relacionados)
            </p>
        </aside>
    </main>

    <footer>
        <p>&copy; 2026, Aviso legal</p>
    </footer>
</body>
```

| Etiqueta | Rol |
|---|---|
| `<header>` | Encabezado de una página o sección (no tiene por qué estar necesariamente en la parte superior de la página) |
| `<nav>` | Un bloque con los enlaces de navegación principales |
| `<main>` | El contenido principal y único de la página (uno solo por página) |
| `<article>` | Contenido autónomo, que tenga sentido por sí solo (un artículo de blog, un comentario) |
| `<section>` | Una agrupación temática de contenido, normalmente con su propio título |
| `<aside>` | Contenido relacionado pero secundario (una barra lateral, una nota) |
| `<footer>` | Pie de página o de sección |

## `<article>` vs `<section>`: la distinción más confusa

> **Nota:** `<article>` debe tener sentido **por sí solo**, incluso fuera de su contexto (un artículo de blog seguiría siendo comprensible si se republicara en otro sitio); `<section>` agrupa contenido que solo tiene sentido **dentro de su contexto** (una sección "Características técnicas" de una ficha de producto no tiene sentido separada del producto). Una página puede contener varios `<article>`, cada uno de los cuales puede a su vez contener varios `<section>`.

## Por qué la semántica importa, más allá del estilo

- **Accesibilidad** (véase [Atributos data-* y accesibilidad](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)): un lector de pantalla puede ofrecer la opción de saltar directamente a `<nav>` o `<main>`, algo que ninguna `<div class="nav">` permite con la misma fiabilidad.
- **[SEO](https://developer.mozilla.org/es/docs/Glossary/SEO)**: los motores de búsqueda comprenden mejor la estructura y la importancia relativa del contenido.
- **Legibilidad del código**: `<header>`/`<main>`/`<footer>` documentan la estructura directamente en el HTML, sin necesidad de leer los nombres de las clases [CSS](/?c=langages-de-balisage&s=css&p=css) para adivinar el rol de cada bloque.

> **Buena práctica:** usar una etiqueta semántica siempre que corresponda al rol real del contenido, y recurrir a `<div>` (puramente genérica, sin significado) solo para un simple contenedor técnico necesario para la maquetación CSS, sin significado propio.

## `<details>`/`<summary>`: un contenido plegable sin JavaScript

```html
<details>
    <summary>Ver las características técnicas</summary>
    <p>Peso: 1,8 kg. Autonomía: 12h. Garantía: 2 años.</p>
</details>
```

`<details>` oculta todo su contenido por defecto, salvo la línea `<summary>` (siempre visible, clicable): al hacer clic en ella se abre o cierra el bloque, sin una sola línea de JavaScript. El atributo `open` (`<details open>`) lo muestra ya abierto al cargar la página.

> **Nota:** abrir/cerrar un `<details>` dispara un evento `toggle`, que NO se propaga por bubbling como la mayoría de eventos del DOM; escucharlo mediante delegación (en un ancestro compartido por varios `<details>`) exige la fase de **captura**, véase [El DOM y la gestión de eventos](/?c=langages-de-programmation&s=javascript&p=dom-et-evenements#propagacion-de-eventos-y-delegacion).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Las etiquetas semánticas de HTML5 (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`) describen el rol de una sección, a diferencia de una `<div>` genérica. `<article>` tiene sentido por sí solo, `<section>` solo dentro de su contexto. `<details>`/`<summary>` añade un widget plegable nativo, sin JavaScript. |
| **Herramientas utilizables** | Las 7 etiquetas estructurales principales, que se combinan según el rol real de cada sección; `<details>`/`<summary>` para un contenido plegable sin JavaScript. |
| **Trampas a evitar** | Confundir `<article>` y `<section>`; estructurarlo todo con `<div class="...">` cuando ya existe una etiqueta semántica para ese rol; olvidar que el evento `toggle` de un `<details>` no se propaga por bubbling. |
| **Buenas prácticas** | Usar una etiqueta semántica siempre que corresponda al rol real del contenido; reservar `<div>` para contenedores puramente técnicos, sin significado propio. |
