---
order: 11
---

# HTMLElements

An `HTMLElement` is the JavaScript representation of an HTML tag in the DOM. Every tag (`<div>`, `<p>`, `<a>`...) becomes an `HTMLElement` object that can be accessed and manipulated in JavaScript.

```javascript
const div = document.querySelector('div');
// div is now an HTMLElement object
```

---

## Creating and inserting elements

**`document.createElement`** creates a new HTML element without inserting it into the page.
```javascript
const p = document.createElement('p');
```

**`append`** inserts one or more elements (or text) at the end of a parent element's content.
```javascript
document.body.append(p);
document.body.append('plain text', p, otherElement);
```

**`prepend`** inserts one or more elements (or text) at the **start** of a parent element's content.
```javascript
parent.prepend(p);
parent.prepend('plain text', p, otherElement);
```

**`insertAdjacentHTML`** inserts raw HTML at a precise position around an element, without overwriting existing content.
```javascript
element.insertAdjacentHTML('beforebegin', "<p>before the element</p>");
element.insertAdjacentHTML('afterbegin',  "<p>at the start of the content</p>");
element.insertAdjacentHTML('beforeend',   "<p>at the end of the content</p>");
element.insertAdjacentHTML('afterend',    "<p>after the element</p>");
```

> **Note (security):** like `innerHTML` (see below), `insertAdjacentHTML` interprets its argument as HTML — never insert data coming from the user into it without escaping it first, or you risk an XSS flaw (see [Security](/?c=langages-de-programmation&s=php&p=securite), same principle).

**`remove`** removes the element from the DOM.
```javascript
p.remove();
```

**`replaceWith`** replaces the element with one or more other elements.
```javascript
p.replaceWith(otherElement);
```

---

## Accessing existing elements

**`querySelector`** returns the first element matching the given CSS selector, or `null` if none exists.
```javascript
const title = document.querySelector('h1');
const div = document.querySelector('.my-class');
const link = document.querySelector('#my-id a');
```

**`querySelectorAll`** returns every matching element as a `NodeList` (array-like).
```javascript
const paragraphs = document.querySelectorAll('p');
paragraphs.forEach(p => console.log(p.textContent));
```

**`getElementById`**, **`getElementsByClassName`**, **`getElementsByTagName`** are older, less flexible alternatives to `querySelector`.
```javascript
document.getElementById('my-id');
document.getElementsByClassName('my-class'); // HTMLCollection (live)
document.getElementsByTagName('p');           // HTMLCollection (live)
```

> **Note:** an `HTMLCollection` (returned by `getElementsByClassName`/`getElementsByTagName`) is **live**: it updates automatically as the DOM changes, unlike the `NodeList` returned by `querySelectorAll` (frozen at the time of the call). Modifying the DOM (adding/removing matching elements) **while** iterating over a live collection can therefore skip or revisit elements unexpectedly — a good reason to prefer `querySelectorAll` whenever you plan to modify the page during iteration.

---

## Attributes

**`setAttribute`** adds or modifies an attribute.
```javascript
element.setAttribute('class', 'my-class');
element.setAttribute('href', 'https://example.com');
```

**`getAttribute`** returns an attribute's value, or `null` if it doesn't exist.
```javascript
element.getAttribute('class'); // 'my-class'
```

**`removeAttribute`** removes an attribute.
```javascript
element.removeAttribute('class');
```

**`hasAttribute`** checks whether an attribute exists on the element.
```javascript
element.hasAttribute('class'); // true or false
```

---

## CSS classes

**`classList`** is an object dedicated to managing an element's CSS classes, more reliable than `className` for manipulating classes individually.

```javascript
element.classList.add('new-class');       // adds
element.classList.remove('old-class');    // removes
element.classList.toggle('active');       // adds if absent, removes if present
element.classList.contains('my-class');   // true or false
element.classList.replace('old', 'new');  // replaces
```

**`className`** gives access to all classes as a string. Use with caution: assigning to it replaces **all** existing classes.
```javascript
element.className;               // 'class1 class2'
element.className = 'new';       // ⚠️ overwrites everything
```

---

## Content

**`textContent`** accesses an element's text content (all child tags ignored). Assigning a value replaces the entire content with plain text — any HTML tags present are escaped and displayed as-is, never interpreted.
```javascript
element.textContent;              // 'My text'
element.textContent = 'New';      // replaces all content with text
```

**`innerHTML`** accesses the element's inner HTML content as a string. Assigning a value **replaces** the entire existing content and interprets HTML tags.
```javascript
element.innerHTML;                        // '<strong>My text</strong>'
element.innerHTML = '<em>New</em>';       // ⚠️ overwrites everything, interprets HTML
```

> **Note (security):** assigning untrusted user data to `innerHTML` is a classic XSS flaw — the content is interpreted as real, executable HTML/JavaScript, not as text. `textContent` (above) stays safe by default, since it never interprets its content.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An `HTMLElement` represents an HTML tag that can be manipulated in JavaScript: create it (`createElement`), select it (`querySelector`), modify its content (`textContent`/`innerHTML`), its attributes, its classes, or its style. |
| **Tools you can use** | `querySelector`/`querySelectorAll`, `classList`, `setAttribute`/`getAttribute`, `getBoundingClientRect`. |
| **Pitfalls to avoid** | Assigning unescaped user data to `innerHTML`/`insertAdjacentHTML` (XSS flaw); modifying a live `HTMLCollection` while iterating over it. |
| **Best practices** | Prefer `textContent` over `innerHTML` whenever the content is plain text; prefer `querySelectorAll` (frozen) over `getElementsByClassName`/`getElementsByTagName` (live) if the DOM is modified during iteration. |

---

## Style

**`style`** gives access to the element's inline styles. CSS properties are written in **camelCase** (no hyphen).
```javascript
element.style.color = 'red';
element.style.backgroundColor = 'blue';  // background-color in CSS
element.style.fontSize = '1.2rem';       // font-size in CSS
element.style.borderLeft = '2px solid grey'; // border-left in CSS
```

---

## Navigating the DOM

From an element, you can access its neighbors and its hierarchy.

**`parentElement`** returns the direct parent element.
```javascript
element.parentElement;
```

**`children`** returns the direct child elements (not text nodes) as an `HTMLCollection`.
```javascript
element.children;       // [div, p, span...]
element.children[0];    // first child
```

**`firstElementChild`** and **`lastElementChild`** return the first and last child element.
```javascript
element.firstElementChild;
element.lastElementChild;
```

**`nextElementSibling`** and **`previousElementSibling`** return the next or previous sibling.
```javascript
element.nextElementSibling;
element.previousElementSibling;
```

---

## Checking an element's type

**`tagName`** returns the tag name in uppercase.
```javascript
element.tagName; // 'DIV', 'P', 'SPAN'...
```

**`instanceof`** checks whether the element belongs to a specific DOM interface.
```javascript
element instanceof HTMLAnchorElement;  // true if it's an <a>
element instanceof HTMLImageElement;   // true if it's an <img>
```

---

## Dimensions and position

**`getBoundingClientRect`** returns the element's size and position relative to the window.
```javascript
const rect = element.getBoundingClientRect();
rect.width;   // width
rect.height;  // height
rect.top;     // distance from the top of the window
rect.left;    // distance from the left of the window
```

**`offsetWidth`** and **`offsetHeight`** return the element's size (content + padding + border).
```javascript
element.offsetWidth;
element.offsetHeight;
```

---

## Resources

- [MDN (*Mozilla Developer Network*, the web's reference documentation) — HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement)
- [MDN — Document.querySelector](https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelector)
- [MDN — Element.classList](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)
- [MDN — Element.setAttribute](https://developer.mozilla.org/en-US/docs/Web/API/Element/setAttribute)
- [MDN — insertAdjacentHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML)
