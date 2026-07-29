---
order: 3
---

# Links and Images

Links (`<a>`) and images (`<img>`) are two fundamental elements of the web—one connects documents to one another (the very origin of the word "*hypertext*"), and the other embeds visual content.

## Links

```html
<a href="https://exemple.com">Lien externe</a>
<a href="/contact">Lien relatif, vers une autre page du même site</a>
<a href="#section2">Lien vers une ancre, dans la même page</a>
<a href="mailto:contact@exemple.com">Lien qui ouvre le client mail</a>
<a href="tel:+33612345678">Lien qui propose d'appeler un numéro</a>
```

### The `target` attribute

```html
<a href="https://exemple.com" target="_blank" rel="noopener noreferrer">Ouvre dans un nouvel onglet</a>
```

> **Note:** `target="_blank"` without `rel="noopener"` allows the new page to access (via JavaScript) the `window` object from the original page—a minor but real security risk (*tabnabbing*). `noopener` (and `noreferrer`, which also prevents the original URL from being sent) must always be used with `target="_blank"`.

### Relative vs. Absolute Links

```html
<a href="https://exemple.com/page">Absolu : toujours la même destination, quel que soit le site</a>
<a href="/page">Relatif à la racine : dépend du domaine actuel</a>
<a href="page">Relatif au dossier courant : dépend de l'URL actuelle</a>
```

## The images

```html
<img src="photo.jpg" alt="Un chat noir assis sur un canapé" width="600" height="400">
```

- `src` : the path (relative or absolute; same logic as for a link) to the image file.
- `alt` : alternative text, displayed if the image fails to load, and read by a screen reader—**never optional** from an accessibility standpoint (see the dedicated chapter). A purely decorative image (with no information of its own) must have `alt=""` (empty, but present), so that the screen reader silently skips it rather than announcing a meaningless filename.
- `width` /`height`: dimensions specified in advance, which allow the browser to reserve the necessary space **before** the image is loaded—this prevents the rest of the page from shifting out of place while the image is loading (*layout shift*).

## 

```html
<img
    src="photo-800.jpg"
    srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, 800px"
    alt="Un chat noir assis sur un canapé"
>
```

The browser **automatically** selects the version best suited to the actual display size and screen resolution from among those available—this prevents a mobile device from having to download an image designed for a large screen.

## Images as Links

```html
<a href="/produit/42">
    <img src="produit.jpg" alt="Chaise en bois, vue de face">
</a>
```

An image can be placed inside a `<a>`, making the image itself clickable—the `alt` remains essential in this case, since it describes the link’s **destination** to a screen reader, not just the image’s visual content.
