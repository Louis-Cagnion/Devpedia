---
order: 3
---

# Links and Images

Links (`<a>`) and images (`<img>`) are two fundamental tags of the web: one connects documents to each other (the very origin of the word "*hypertext*"), the other embeds visual content.

## Links

```html
<a href="https://example.com">External link</a>
<a href="/contact">Relative link, to another page on the same site</a>
<a href="#section2">Link to an anchor, on the same page</a>
<a href="mailto:contact@example.com">Link that opens the mail client</a>
<a href="tel:+12025550123">Link that offers to call a number</a>
```

### The `target` attribute

```html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">Opens in a new tab</a>
```

> **Note:** `target="_blank"` without `rel="noopener"` lets the new page access (via [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)) the original page's `window` object: a minor but real security risk (*tabnabbing*). `noopener` (and `noreferrer`, which also prevents the original URL from being sent) should always accompany any `target="_blank"`.

### Relative vs. absolute links

```html
<a href="https://example.com/page">Absolute: always the same destination, regardless of the site</a>
<a href="/page">Root-relative: depends on the current domain</a>
<a href="page">Relative to the current folder: depends on the current URL</a>
```

## Images

```html
<img src="photo.jpg" alt="A black cat sitting on a couch" width="600" height="400">
```

- `src`: the path (relative or absolute, same logic as for a link) to the image file.
- `alt`: alternative text, displayed if the image fails to load, and read by a screen reader: **never optional** from an accessibility standpoint (see [data-* Attributes and Accessibility](/?c=langages-de-balisage&s=html&p=attributs-data-et-accessibilite)). A purely decorative image (with no information of its own) should have `alt=""` (empty, but present), so the screen reader silently skips it rather than announcing a meaningless filename.
- `width`/`height`: dimensions declared in advance, letting the browser reserve the necessary space **before** the image loads: avoids a visual shift of the rest of the page while it loads (*layout shift*).

## Responsive images (`srcset`)

```html
<img
    src="photo-800.jpg"
    srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, 800px"
    alt="A black cat sitting on a couch"
>
```

The browser itself chooses the version best suited to the actual display size and screen resolution, among those offered: avoids forcing a mobile device to download an image meant for a large screen.

## Images as links

```html
<a href="/product/42">
    <img src="product.jpg" alt="Wooden chair, front view">
</a>
```

An image can be placed inside an `<a>`, making it clickable itself: the `alt` remains essential in that case, since it's what describes the link's **destination** to a screen reader, not just the image's visual content.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | `<a>` connects documents (external, relative, anchor, mail, tel); `<img>` embeds an image. `alt` describes an image for a screen reader or if it fails to load: never optional. |
| **Available Tools** | `srcset`/`sizes` for responsive images; `width`/`height` to reserve space before loading. |
| **Pitfalls to Avoid** | `target="_blank"` without `rel="noopener"` (security risk, *tabnabbing*); an image with no `alt` (neither empty for a decorative image, nor filled in for a meaningful one). |
| **Best Practices** | Always pair `target="_blank"` with `rel="noopener noreferrer"`; declare `width`/`height` to avoid a visual shift (*layout shift*) on load. |
