---
order: 1
---

# The Structure of an HTML Document

Every HTML document is based on a minimal framework that is virtually identical from one page to the next—understanding each part of this framework is the essential starting point for everything else.

## The Minimal Skeleton

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

## Line by line

- `<!DOCTYPE html>` : tells the browser to render the page according to modern HTML5 standards ("*standards* mode"), rather than the legacy compatibility mode ("*quirks mode*") inherited from older browsers.
- `<html lang="fr">` : the document root; `lang` specifies the primary language of the content—used by screen readers (see the chapter on accessibility) and search engines.
- `<head>` : the page's metadata, which is never displayed directly in the visible body of the page.
  - `<meta charset="UTF-8">` : character encoding — without this line (or with an incorrect encoding), accented or special characters may appear garbled.
  - `<meta name="viewport" ...>` : essential for proper display on mobile devices — without it, a mobile browser often displays the page as if it were designed for a computer screen and then scales it down (making it unreadable).
  - `<title>` : the text displayed in the browser tab and in the search results.
- `<body>` : all the content that is actually visible on the page.

## Tags and attributes

```html
<a href="https://exemple.com" target="_blank">Lien</a>
```

- `<a>` and `</a>`: opening and closing tags that delimit an element.
- `href` and `target`: **attributes** that provide additional information to the tag (in this case, the link's destination and how it opens).

Some tags have no content and are self-closing, with no separate closing tag:

```html
<img src="photo.jpg" alt="Description de la photo">
<br>
<input type="text">
```

## Nested Tags

```html
<!-- Correct : fermeture dans l'ordre inverse de l'ouverture -->
<p>Texte en <strong>gras <em>et italique</em></strong>.</p>

<!-- Incorrect : chevauchement des balises -->
<p>Texte en <strong>gras <em>et italique</strong></em>.</p>
```

The last tag opened must be the first to be closed—overlapping tags, although often silently "tolerated" by browsers, produce unpredictable results and should be avoided.

## Comments

```html
<!-- Ce commentaire n'est jamais affiché sur la page -->
```

See also the chapter on HTML5 semantics, which details the typical organization of content within `<body>`.
