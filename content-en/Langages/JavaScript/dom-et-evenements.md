---
order: 11
---

# The DOM and Event Handling

The **DOM** (*Document Object Model*) is the in-memory representation of an [HTML](/?c=langages-de-balisage&s=html&p=html) page, in the form of a tree of objects that can be manipulated by JavaScript: each tag becomes a node in this tree, with its own properties and methods.

## Select items

```javascript
document.getElementById("titre");           // a specific element, by its ID
document.querySelector(".carte");            // the FIRST element that matches this CSS selector
document.querySelectorAll(".carte");          // ALL matching elements (NodeList)
```

> **Note:** `querySelector` and `querySelectorAll` accept any CSS selector (see the relevant chapter): `.classe`, `#id`, `div > p`, `[data-role="bouton"]`... This is the most flexible method.

## Edit an item

```javascript
const title = document.querySelector("h1");

title.textContent = "Nouveau titre";     // Replaces the text (automatically escapes HTML)
title.innerHTML = "<em>Titre</em>";       // Inserts raw HTML -> DANGER if the source is not trusted (XSS)
title.style.color = "red";                  // modifies a CSS style directly
title.classList.add("actif");                // add a CSS class
title.classList.remove("actif");
title.classList.toggle("actif");              // Add if missing, remove if present
title.setAttribute("data-id", "42");
```

> **Note:** `innerHTML` with user-supplied data is a classic XSS vulnerability (see the chapter on PHP security; same principle): an attacker could inject executable code into it. `textContent` remains secure by default, since it always treats its content as plain text.

## Create and Insert an Element

```javascript
const nouvelleCarte = document.createElement("div");
nouvelleCarte.textContent = "Nouvelle carte";
nouvelleCarte.classList.add("carte");

document.querySelector("#liste").appendChild(nouvelleCarte);
```

## Listen to events

```javascript
const bouton = document.querySelector("#mon-bouton");

bouton.addEventListener("click", (evenement) => {
    console.log("Bouton cliqué !", evenement.target);
});
```

| Recurring event | Triggered when |
|---|---|
| `click` | The element is clicked |
| `submit` | A form is submitted |
| `input` / `change` | The value of a field changes |
| `keydown` / `keyup` | A key is pressed/released |
| `DOMContentLoaded` | HTML is fully loaded (before images/styles) |

## `preventDefault()` : Override the default behavior

```javascript
document.querySelector("form").addEventListener("submit", (evenement) => {
    evenement.preventDefault();   // Prevents the default page reload of a form
    console.log("Formulaire intercepté par JavaScript");
});
```

## Event Propagation and Delegation

An event propagates from the target element to its parent elements (*bubbling*), which makes it possible to listen for an event on a common parent rather than on each child individually:

```javascript
document.querySelector("#liste").addEventListener("click", (evenement) => {
    if (evenement.target.classList.contains("carte")) {
        console.log("Une carte a été cliquée :", evenement.target.textContent);
    }
});
// works even for cards added DYNAMICALLY after this addEventListener,
// unlike an `addEventListener` set individually on each card upon loading
```

This technique, known as **event delegation**, eliminates the need to reattach a listener to each new element created dynamically (see the example at `createElement` above): a single listener, attached once to a stable ancestor, is sufficient.
