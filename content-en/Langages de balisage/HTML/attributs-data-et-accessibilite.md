---
order: 7
---

# data-* Attributes and Accessibility (ARIA)

This chapter covers two families of cross-cutting attributes, usable on almost any tag: `data-*` attributes (storing custom data) and `aria-*` attributes (improving accessibility beyond what HTML5 semantics alone allow).

## `data-*` attributes

```html
<div data-id="42" data-role="carte-produit" data-en-stock="true">
    Wooden chair
</div>
```

```javascript
const carte = document.querySelector("div");
carte.dataset.id;       // "42"
carte.dataset.role;     // "carte-produit"
carte.dataset.enStock;  // "true" -> "data-en-stock" becomes "enStock" in camelCase on the JS side
```

`data-*` lets you attach data to an HTML element, retrievable in JavaScript via `.dataset`: a standard way to pass information from HTML to JavaScript, with no need for global variables or extra requests.

> **Note:** any name after `data-` is valid (`data-whatever`): the only rule is the automatic conversion from **kebab-case** (words separated by hyphens, `data-en-stock`) to **camelCase** (each following word glued together and capitalized, `enStock`) in JavaScript, just a naming convention, not a mechanism specific to `data-*`.

## Accessibility: why it matters

Web accessibility ensures a page remains usable by people with disabilities (visual impairment using a screen reader, motor impairment navigating only by keyboard...); not a secondary option, but a legal requirement in many contexts (public websites in particular), and a general good practice for code quality.

## `alt` and semantics: the foundations already covered

A good part of accessibility follows directly from the previous chapters: `alt` on images, `<label>` on form fields, correct heading hierarchy, HTML5 semantic tags rather than generic `<div>`s.

## ARIA: filling in when HTML semantics alone aren't enough

**ARIA** (*Accessible Rich Internet Applications*) adds accessibility information for components that native HTML doesn't natively describe (a custom tab, a modal window...):

```html
<button aria-label="Close the window">✕</button>
```

`aria-label` provides alternative text for a screen reader, when the visible content alone (here, just a `✕` symbol) isn't enough to understand its role.

```html
<div role="alert">Your session will expire in 2 minutes.</div>
```

`role="alert"` makes a screen reader announce this content immediately as soon as it appears, without waiting for the user to navigate to it: useful for an error message or an urgent notification that appeared dynamically.

```html
<button aria-expanded="false" aria-controls="menu-mobile">Menu</button>
<nav id="menu-mobile" hidden>...</nav>
```

`aria-expanded` indicates whether a controlled element (often via JavaScript) is currently open or closed; a screen reader announces this state, otherwise invisible to someone who can't see the visual change.

> **ARIA golden rule:** "*No ARIA is better than bad ARIA*": only use ARIA to fill a genuine gap in native HTML semantics, never as a replacement for an HTML tag that would already do the job correctly. A native `<button>` already natively handles keyboard focus and announcing its role; recreating this behavior by hand with a `<div role="button">` is almost always a regression, barring absolute necessity.

## Keyboard navigation

```html
<button class="bouton-personnalise">Custom button</button>
```

A native `<button>` already handles keyboard accessibility (focus via Tab, activation via Enter/Space) and having its role announced by a screen reader: that's why the "golden rule" above recommends starting from a real `<button>`, restyled in CSS if needed, rather than recreating a button from a `<div>`.

If a specific case truly prevents using a native `<button>`, recreating its behavior requires more than just `tabindex`/`role`:

```html
<div tabindex="0" role="button" id="mon-bouton">Custom button</div>
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

`tabindex="0"` makes the element focusable via Tab and `role="button"` announces its role to a screen reader, but **neither of the two triggers keyboard activation** (Enter/Space); unlike a real `<button>`, which does so natively. Without this explicit `keydown` handler, the element would remain focusable but unusable from the keyboard: exactly the pitfall the ARIA golden rule aims to avoid.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | `data-*` attaches custom data to an element, retrievable in JavaScript via `.dataset`. `aria-*` fills in accessibility when native HTML semantics aren't enough (custom components). |
| **Available Tools** | `.dataset` in JavaScript; `aria-label`, `role`, `aria-expanded`. |
| **Pitfalls to Avoid** | Recreating a `<div role="button">` without handling keyboard focus and activation (Enter/Space) yourself; a real `<button>` does all of that natively. |
| **Best Practices** | "No ARIA is better than bad ARIA": only use ARIA to fill a genuine gap, never as a replacement for a native HTML tag that would already do the job. |
