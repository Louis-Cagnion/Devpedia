---
order: 1
---

# The Structure of an HTML Document

Every HTML document rests on a minimal skeleton, nearly identical from one page to the next: understanding each part of this skeleton is the essential starting point before everything else.

## The minimal skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page title</title>
</head>
<body>
    <h1>Hello</h1>
    <p>Page content.</p>
</body>
</html>
```

## Line by line

- `<!DOCTYPE html>`: tells the browser it must interpret the page according to modern HTML5 standards ("*standards* mode"), rather than a legacy compatibility mode ("*quirks mode*") inherited from older browsers.
- `<html lang="en">`: the document root; `lang` specifies the main language of the content, used by screen readers (see [data-* Attributes and Accessibility](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)) and search engines.
- `<head>`: the page's metadata, never displayed directly in the visible body.
  - `<meta charset="UTF-8">`: the character encoding; without this line (or with an incorrect encoding), accented or special characters can end up displayed garbled.
  - `<meta name="viewport" ...>`: essential for a correct display on mobile; without it, a mobile browser often displays the page as if it were designed for a computer screen, then shrinks it (illegible zoom).
  - `<title>`: the text shown in the browser tab and in search results.
- `<body>`: all the content actually visible on the page.

## Tags and attributes

```html
<a href="https://example.com" target="_blank">Link</a>
```

- `<a>` and `</a>`: opening and closing tag, which delimit an element.
- `href`, `target`: **attributes**, which add extra information to the tag (here, the link's destination and how it opens).

Some tags have no content and close themselves, with no separate closing tag:

```html
<img src="photo.jpg" alt="Description of the photo">
<br>
<input type="text">
```

## Nesting tags

```html
<!-- Correct: closed in the reverse order of opening -->
<p>Text in <strong>bold <em>and italic</em></strong>.</p>

<!-- Incorrect: overlapping tags -->
<p>Text in <strong>bold <em>and italic</strong></em>.</p>
```

A tag opened last must be closed first: overlapping, although often silently "tolerated" by browsers, produces an unpredictable result and should be avoided.

## Comments

```html
<!-- This comment is never displayed on the page -->
```

See also [HTML5 Semantics](/?c=langages-de-balisage&s=html&p=semantique-html5), which details the typical organization of content inside `<body>`.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | An HTML document follows a fixed skeleton (`<!DOCTYPE>`, `<html>`, `<head>`, `<body>`). Tags nest in the reverse order of their opening; overlapping produces an unpredictable result. |
| **Available Tools** | `<meta charset>`, `<meta name="viewport">`, `<title>`: the essential metadata of every document. |
| **Pitfalls to Avoid** | Forgetting `<meta name="viewport">`: the page then displays on mobile as if designed for a computer screen, then shrunk down illegibly. |
| **Best Practices** | Always close an opened tag, in the reverse order of opening, even when a browser silently tolerates the opposite. |
