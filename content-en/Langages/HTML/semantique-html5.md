---
order: 6
---

# HTML5 Semantics

Before HTML5, structuring a page relied almost entirely on generic `<div>`s, distinguished only by their `class`/`id`; HTML5 introduced **semantic** tags, which explicitly describe the **role** of each section, understandable both by a human reading the code and by a browser, a search engine, or a screen reader.

## Generic `<div>` vs. semantic tags

```html
<!-- Before HTML5: nothing says what each section is, except the class name -->
<div class="header">...</div>
<div class="nav">...</div>
<div class="main-content">...</div>
<div class="footer">...</div>
```

```html
<!-- HTML5: the meaning is carried by the tag itself -->
<header>...</header>
<nav>...</nav>
<main>...</main>
<footer>...</footer>
```

## The main structural tags

```html
<body>
    <header>
        <h1>Site name</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/contact">Contact</a>
        </nav>
    </header>

    <main>
        <article>
            <h2>Article title</h2>
            <section>
                <h3>First part</h3>
                <p>...</p>
            </section>
            <section>
                <h3>Second part</h3>
                <p>...</p>
            </section>
        </article>

        <aside>
            <p>Supplementary content, related but secondary (e.g. related links)</p>
        </aside>
    </main>

    <footer>
        <p>&copy; 2026, Legal notice</p>
    </footer>
</body>
```

| Tag | Role |
|---|---|
| `<header>` | Header of a page or section (not necessarily at the very top of the page) |
| `<nav>` | A block of main navigation links |
| `<main>` | The page's main and unique content (one per page) |
| `<article>` | Standalone content that would make sense in isolation (a blog post, a comment) |
| `<section>` | A thematic grouping of content, usually with its own heading |
| `<aside>` | Related but secondary content (a sidebar, a note) |
| `<footer>` | Footer of a page or section |

## `<article>` vs. `<section>`: the most confusing distinction

> **Note:** `<article>` must make sense **in isolation**, even taken out of context (a blog post would still be understandable republished elsewhere); `<section>` groups content that only makes sense **within its context** (a "Technical Specifications" section of a product page makes no sense detached from the product). A page can contain several `<article>`s, each of which can itself contain several `<section>`s.

## Why semantics matters, beyond styling

- **Accessibility** (see [data-* Attributes and Accessibility](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)): a screen reader can offer to jump straight to `<nav>` or `<main>`, something no `<div class="nav">` allows as reliably.
- **[SEO](https://developer.mozilla.org/en-US/docs/Glossary/SEO)**: search engines better understand the structure and relative importance of content.
- **Code readability**: `<header>`/`<main>`/`<footer>` document the structure directly in the HTML, with no need to read [CSS](/?c=langages-de-balisage&s=css&p=css) class names to guess each block's role.

> **Best practice:** use a semantic tag as soon as it matches the content's actual role, and only fall back on `<div>` (purely generic, meaningless) for a simple technical container needed for CSS layout, with no meaning of its own.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | HTML5 semantic tags (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<aside>`, `<footer>`) describe a section's role, unlike a generic `<div>`. `<article>` makes sense in isolation, `<section>` only within its context. |
| **Available Tools** | The 7 main structural tags, combined according to each section's actual role. |
| **Pitfalls to Avoid** | Confusing `<article>` and `<section>`; structuring everything with `<div class="...">` when a semantic tag exists for that role. |
| **Best Practices** | Use a semantic tag as soon as it matches the content's actual role; reserve `<div>` for purely technical containers, with no meaning of its own. |
