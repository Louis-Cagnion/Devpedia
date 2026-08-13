---
order: 6
---

# HTML5 Semantics

Before HTML5, structuring a page relied almost entirely on generic `<div>`, distinguished only by their `class` and `id` — HTML5 introduced **semantic** tags, which explicitly describe the **role** of each section, making it understandable not only to a human reading the code but also to a browser, a search engine, or a screen reader.

## `<div>` Generic vs. Semantic Tags

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

## The Main Structural Tags

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

| Tag | Role |
|---|---|
| `<header>` | Page or section header (not necessarily at the very top of the page) |
| `<nav>` | A block of main navigation links |
| `<main>` | The page's main and unique content (one per page) |
| `<article>` | Standalone content that makes sense on its own (a blog post, a comment) |
| `<section>` | A thematic grouping of content, usually with its own title |
| `<aside>` | Related but secondary content (a sidebar, a note) |
| `<footer>` | Footer of a page or section |

## `<article>` vs`<section>`: The Most Confusing Distinction

> **Note:** `<article>` must make sense **on its own**, even when taken out of context (a blog post would still be understandable if republished elsewhere) — `<section>` contains content that only makes sense **within its context** (a “Technical Specifications” section of a product page makes no sense when separated from the product). A page can contain multiple `<article>`, each of which can in turn contain multiple `<section>`.

## Why Semantics Matters, Beyond Style

- **Accessibility** (see the dedicated chapter): A screen reader can offer to jump directly to `<nav>` or `<main>`, something that no `<div class="nav">` can do as reliably.
- **[SEO](https://developer.mozilla.org/en-US/docs/Glossary/SEO)**: Search engines better understand the structure and relative importance of content.
- **Code readability**: `<header>` / `<main>` / `<footer>` document the structure directly in the HTML, without having to read the CSS class names to figure out the role of each block.

> **Best practice:** Use a semantic tag whenever it corresponds to the actual role of the content, and only fall back on `<div>` (which is purely generic and meaningless) for a simple technical container required for CSS styling, with no meaning of its own.
