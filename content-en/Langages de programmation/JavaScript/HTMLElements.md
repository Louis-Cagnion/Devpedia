---
order: 10
---

# HTML Elements

A `HTMLElement` is the JavaScript representation of an HTML tag in the DOM. Each tag (`<div>`, `<p>`, `<a>`...) becomes a `HTMLElement` object that can be accessed and manipulated using JavaScript.

```javascript
const div = document.querySelector('div');
// div is now an HTMLElement object
```

---

## Create and Insert Elements

**`document.createElement`** Creates a new HTML element without inserting it into the page.
```javascript
const p = document.createElement('p');
```

**`append`** Inserts one or more elements (or pieces of text) at the end of a parent element's content.
```javascript
document.body.append(p);
document.body.append('texte brut', p, autreElement);
```

**`prepend`** Inserts one or more elements (or pieces of text) at **the beginning** of a parent element's content.
```javascript
parent.prepend(p);
parent.prepend('texte brut', p, autreElement);
```

**`insertAdjacentHTML`** Inserts raw HTML at a specific position around an element, without overwriting the existing content.
```javascript
element.insertAdjacentHTML('beforebegin', "<p>avant l'élément</p>");
element.insertAdjacentHTML('afterbegin',  "<p>au début du contenu</p>");
element.insertAdjacentHTML('beforeend',   "<p>à la fin du contenu</p>");
element.insertAdjacentHTML('afterend',    "<p>après l'élément</p>");
```

> **Note (security):** As with `innerHTML` (see below), `insertAdjacentHTML` interprets its argument as HTML—never insert user-supplied data into it without escaping it first, or you risk an XSS vulnerability (see the chapter on PHP security; the same principle applies).

**`remove`** Removes the element from the DOM.
```javascript
p.remove();
```

**`replaceWith`** Replaces the element with one or more other elements.
```javascript
p.replaceWith(autreElement);
```

---

## Access existing items

**`querySelector`** Returns the first element that matches the given CSS selector, or `null` if no such element exists.
```javascript
const titre = document.querySelector('h1');
const div = document.querySelector('.ma-classe');
const lien = document.querySelector('#mon-id a');
```

**`querySelectorAll`** returns all matching elements as a `NodeList` (similar to an array).
```javascript
const paragraphes = document.querySelectorAll('p');
paragraphes.forEach(p => console.log(p.textContent));
```

**`getElementById`**, **`getElementsByClassName`**, and **`getElementsByTagName`** are older alternatives that are less flexible than `querySelector`.
```javascript
document.getElementById('mon-id');
document.getElementsByClassName('ma-classe'); // HTMLCollection (live)
document.getElementsByTagName('p');           // HTMLCollection (live)
```

> **Note:** A `HTMLCollection` (returned by `getElementsByClassName` / `getElementsByTagName`) is **live**: it updates automatically if the DOM changes, unlike the `NodeList` returned by `querySelectorAll` (which is frozen at the time of the call). Modifying the DOM (adding or removing corresponding elements) while iterating over a live collection can therefore cause the iterator to skip over or revisit elements unexpectedly—a good reason to use `querySelectorAll` whenever you plan to modify the page during iteration.

---

## Attributes

**`setAttribute`** adds or modifies an attribute.
```javascript
element.setAttribute('class', 'ma-classe');
element.setAttribute('href', 'https://example.com');
```

**`getAttribute`** Returns the value of an attribute, or `null` if it does not exist.
```javascript
element.getAttribute('class'); // 'my-class'
```

**`removeAttribute`** removes an attribute.
```javascript
element.removeAttribute('class');
```

**`hasAttribute`** Checks whether an attribute exists on the element.
```javascript
element.hasAttribute('class'); // true or false
```

---

## CSS Classes

**`classList`** is an object designed to manage an element's CSS classes; it is more reliable than `className` for manipulating classes individually.

```javascript
element.classList.add('nouvelle-classe');       // add
element.classList.remove('ancienne-classe');    // deletes
element.classList.toggle('active');             // Add if missing, remove if present
element.classList.contains('ma-classe');        // true or false
element.classList.replace('ancienne', 'nouvelle'); // replaces
```

**`className`** Provides access to all classes as a string. Use with caution: assigning this value will replace **all** existing classes.
```javascript
element.className;               // 'class1 class2'
element.className = 'nouvelle';  // ⚠️ Overwrites everything
```

---

## Contents

**`textContent`** Accesses the text content of an element (all child tags are ignored). Assigning a value replaces the entire content with plain text—any HTML tags that may be present are escaped and displayed as-is, never interpreted.
```javascript
element.textContent;              // 'My Text'
element.textContent = 'Nouveau';  // Replace all content with text
```

**`innerHTML`** Retrieves the element's internal HTML content as a string. Assigning a value **replaces** all existing content and parses the HTML tags.
```javascript
element.innerHTML;                        // '<strong>My text</strong>'
element.innerHTML = '<em>Nouveau</em>';   // ⚠️ Overrides everything, parses HTML
```

> **Note (security):** Assigning user-supplied (untrusted) data to `innerHTML` is a classic XSS vulnerability—the content is interpreted as actual executable HTML/JavaScript, not as plain text. `textContent` (above) remains safe by default, since it never interprets its content.

---

## Style

**`style`** provides access to the element's inline styles. CSS properties are written in **camelCase** (no hyphens).
```javascript
element.style.color = 'red';
element.style.backgroundColor = 'blue';  // background-color in CSS
element.style.fontSize = '1.2rem';       // font-size in CSS
element.style.borderLeft = '2px solid grey'; // border-left in CSS
```

---

## Navigating the DOM

From a given element, you can access its neighbors and its hierarchy.

**`parentElement`** returns the immediate parent element.
```javascript
element.parentElement;
```

**`children`** Returns the direct child elements (not text nodes) as `HTMLCollection`.
```javascript
element.children;       // [div, p, span...]
element.children[0];    // first child
```

**`firstElementChild`** and `**`lastElementChild`**` return the first and last child elements.
```javascript
element.firstElementChild;
element.lastElementChild;
```

**`nextElementSibling`** and `**`previousElementSibling`**` return the next or previous brother, respectively.
```javascript
element.nextElementSibling;
element.previousElementSibling;
```

---

## Check the type of an element

**`tagName`** returns the tag name in uppercase.
```javascript
element.tagName; // 'DIV', 'P', 'SPAN'...
```

**`instanceof`** Checks whether the element belongs to a specific DOM interface.
```javascript
element instanceof HTMLAnchorElement;  // true if it is a <a>
element instanceof HTMLImageElement;   // true if it is a <img>
```

---

## Dimensions and Position

**`getBoundingClientRect`** Returns the size and position of the element relative to the window.
```javascript
const rect = element.getBoundingClientRect();
rect.width;   // width
rect.height;  // height
rect.top;     // distance from the top of the window
rect.left;    // distance from the left side of the window
```

**`offsetWidth`** and `**`offsetHeight`**` return the size of the element (content + padding + border).
```javascript
element.offsetWidth;
element.offsetHeight;
```

---

## Resources

- [MDN — HTMLElement](https://developer.mozilla.org/fr/docs/Web/API/HTMLElement)
- [MDN — Document.querySelector](https://developer.mozilla.org/fr/docs/Web/API/Document/querySelector)
- [MDN — Element.classList](https://developer.mozilla.org/fr/docs/Web/API/Element/classList)
- [MDN — Element.setAttribute](https://developer.mozilla.org/fr/docs/Web/API/Element/setAttribute)
- [MDN — insertAdjacentHTML](https://developer.mozilla.org/fr/docs/Web/API/Element/insertAdjacentHTML)
