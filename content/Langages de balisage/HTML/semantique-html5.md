---
order: 6
---

# La sémantique HTML5

Avant HTML5, structurer une page reposait presque uniquement sur des `<div>` génériques, distinguées seulement par leur `class`/`id` — HTML5 a introduit des balises **sémantiques**, qui décrivent explicitement le **rôle** de chaque section, compréhensible aussi bien par un humain lisant le code que par un navigateur, un moteur de recherche ou un lecteur d'écran.

## `<div>` générique vs balises sémantiques

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

## Les balises structurelles principales

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

| Balise | Rôle |
|---|---|
| `<header>` | En-tête d'une page ou d'une section (pas forcément tout en haut de la page) |
| `<nav>` | Un bloc de liens de navigation principaux |
| `<main>` | Le contenu principal et unique de la page (un seul par page) |
| `<article>` | Un contenu autonome, qui aurait du sens isolé (un article de blog, un commentaire) |
| `<section>` | Un regroupement thématique de contenu, généralement avec son propre titre |
| `<aside>` | Un contenu lié mais secondaire (une barre latérale, une note) |
| `<footer>` | Pied d'une page ou d'une section |

## `<article>` vs `<section>` : la distinction la plus confuse

> **Note :** `<article>` doit avoir un sens **isolément**, même sorti de son contexte (un article de blog resterait compréhensible republié ailleurs) — `<section>` regroupe du contenu qui n'a de sens **que dans son contexte** (une section "Caractéristiques techniques" d'une fiche produit n'a pas de sens détachée du produit). Une page peut contenir plusieurs `<article>`, chacun pouvant lui-même contenir plusieurs `<section>`.

## Pourquoi la sémantique compte, au-delà du style

- **Accessibilité** (cf. chapitre dédié) : un lecteur d'écran peut proposer de sauter directement à `<nav>` ou `<main>`, ce qu'aucune `<div class="nav">` ne permet aussi fiablement.
- **SEO** : les moteurs de recherche comprennent mieux la structure et l'importance relative du contenu.
- **Lisibilité du code** : `<header>`/`<main>`/`<footer>` documentent la structure directement dans le HTML, sans avoir à lire les noms de classes CSS pour deviner le rôle de chaque bloc.

> **Best practice :** utiliser une balise sémantique dès qu'elle correspond au rôle réel du contenu, et ne retomber sur `<div>` (purement générique, sans sens) que pour un simple conteneur technique nécessaire à la mise en page CSS, sans signification propre.
