---
order: 7
---

# data-* Attributes and Accessibility (ARIA)

This chapter covers two families of cross-tag attributes that can be used with almost any tag: "`data-*`" attributes (for storing custom data) and "`aria-*`" attributes (for improving accessibility beyond what HTML5 semantics alone allow).

## `data-*` attributes

```html
<div data-id="42" data-role="carte-produit" data-en-stock="true">
    Chaise en bois
</div>
```

```javascript
const carte = document.querySelector("div");
carte.dataset.id;         // "42"
carte.dataset.role;         // "product card"
carte.dataset.enStock;       // "true" -> "data-en-stock" becomes "enStock" in camelCase on the JavaScript side
```

`data-*` allows you to attach data to an HTML element, which can be retrieved in JavaScript via `.dataset`—a standard way to pass information from HTML to JavaScript without needing global variables or additional requests.

> **Note:** Any name following `data-` is valid (`data-nimporte-quoi`)—the only rule is the automatic conversion from kebab-case (`data-en-stock`) to camelCase (`enStock`) in JavaScript (see the chapter on variables, under the JavaScript section, for this naming convention).

## Accessibility: Why It Matters

Web accessibility ensures that a page remains usable by people with disabilities (such as those with visual impairments using a screen reader, or those with mobility impairments navigating solely by keyboard...) — not a secondary consideration, but a legal requirement in many contexts (particularly public websites), and a general best practice for high-quality code.

## `alt` and semantics: the fundamentals we've already covered

Much of accessibility stems directly from the previous chapters: `alt` on images, `<label>` on form fields, proper heading hierarchy, and semantic HTML5 tags rather than generic `<div>`.

## ARIA: Use when HTML semantics alone are not enough

**ARIA** (*Accessible Rich Internet Applications*) adds accessibility information for components that native HTML does not natively describe (a custom tab, a modal window, etc.):

```html
<button aria-label="Fermer la fenêtre">✕</button>
```

`aria-label` provides alternative text for a screen reader when the visible content alone (in this case, just the `✕` symbol) is not sufficient to understand its purpose.

```html
<div role="alert">Votre session va expirer dans 2 minutes.</div>
```

`role="alert"` immediately has a screen reader announce this content as soon as it appears, without waiting for the user to navigate to it—useful for an error message or an urgent notification that appears dynamically.

```html
<button aria-expanded="false" aria-controls="menu-mobile">Menu</button>
<nav id="menu-mobile" hidden>...</nav>
```

`aria-expanded` Indicates whether a controlled element (often via JavaScript) is currently open or closed—a screen reader announces this status, which would otherwise be invisible to someone who cannot see the visual change.

> **ARIA Golden Rule:** "*No ARIA is better than bad ARIA*" — use ARIA only to fill a genuine gap in native HTML semantics, never as a replacement for an HTML tag that already does the job correctly. A native `<button>` already natively handles keyboard focus and role announcement—recreating this behavior manually with a `<div role="button">` is almost always a regression, unless absolutely necessary.

## Keyboard Navigation

```html
<button class="bouton-personnalise">Bouton personnalisé</button>
```

A native `<button>` already supports keyboard accessibility (focus via Tab, activation via Enter/Space) and has its role announced by a screen reader—that’s why the “golden rule” above recommends starting with a real `<button>`, restyled with CSS if necessary, rather than recreating a button from an `<div>`.

If a specific scenario truly prevents the use of a native `<button>`, recreating its behavior requires more than just `tabindex` and `role`:

```html
<div tabindex="0" role="button" id="mon-bouton">Bouton personnalisé</div>
```

```javascript
const bouton = document.getElementById("mon-bouton");
bouton.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Enter" || evenement.key === " ") {
        evenement.preventDefault();
        bouton.click();   // triggers the same behavior as a click
    }
});
```

`tabindex="0"` Makes the element focusable via the Tab key and `role="button"` announces its role to a screen reader, but **neither triggers keyboard activation** (Enter/Space) — unlike a true `<button>`, which does so natively. Without this explicit `keydown` handler, the element would remain focusable but unusable via the keyboard: exactly the pitfall that the ARIA golden rule seeks to avoid.
