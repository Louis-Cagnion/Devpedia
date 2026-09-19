---
order: 12
---

# The DOM and Event Handling

The **DOM** (*Document Object Model*) is the in-memory representation of an [HTML](/?c=langages-de-balisage&s=html&p=html) page, in the form of a tree of objects that can be manipulated by JavaScript: each tag becomes a node in this tree, with its own properties and methods.

## Select items

```javascript
document.getElementById("title");            // a specific element, by its ID
// the FIRST element that matches this CSS selector
document.querySelector(".card");
document.querySelectorAll(".card");            // ALL matching elements (NodeList)
```

> **Note:** `querySelector` and `querySelectorAll` accept any CSS selector (see the relevant chapter): `.class`, `#id`, `div > p`, `[data-role="button"]`... This is the most flexible method.

## Edit an item

```javascript
const title = document.querySelector("h1");

title.textContent = "New title";           // replaces the text (automatically escapes HTML)
// inserts raw HTML -> DANGER if the source is not trusted (XSS)
title.innerHTML = "<em>Title</em>";
title.style.color = "red";                  // modifies a CSS style directly
title.classList.add("active");              // add a CSS class
title.classList.remove("active");
title.classList.toggle("active");           // add if missing, remove if present
title.setAttribute("data-id", "42");
```

> **Note:** `innerHTML` with user-supplied data is a classic XSS vulnerability (see [Securing your data](/?c=langages-de-programmation&s=php&p=securite), same principle): an attacker could inject executable code into it. `textContent` remains secure by default, since it always treats its content as plain text.

## Create and Insert an Element

```javascript
const newCard = document.createElement("div");
newCard.textContent = "New card";
newCard.classList.add("card");

document.querySelector("#list").appendChild(newCard);
```

## Listen to events

```javascript
const button = document.querySelector("#my-button");

button.addEventListener("click", (event) => {
    console.log("Button clicked!", event.target);
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
document.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();   // prevents the default page reload of a form
    console.log("Form intercepted by JavaScript");
});
```

## Event Propagation and Delegation

An event propagates from the target element to its parent elements (*bubbling*), which makes it possible to listen for an event on a common parent rather than on each child individually:

```javascript
document.querySelector("#list").addEventListener("click", (event) => {
    if (event.target.classList.contains("card")) {
        console.log("A card was clicked:", event.target.textContent);
    }
});
// works even for cards added DYNAMICALLY after this addEventListener,
// unlike an `addEventListener` set individually on each card upon loading
```

This technique, known as **event delegation**, eliminates the need to reattach a listener to each new element created dynamically (see the example at `createElement` above): a single listener, attached once to a stable ancestor, is sufficient.

Not every event bubbles: `toggle` (fired by a [`<details>`](/?c=langages-de-balisage&s=html&p=semantique-html5#lt-details-gt-lt-summary-gt-a-collapsible-section-with-no-javascript)), as well as `focus`, `blur` and `scroll` historically, stay confined to the element they fired on. To intercept them through delegation, you must listen during the **capture** phase (the reverse path: from the `document` down to the target element, before bubbling), via a third `true` argument:

```javascript
document.addEventListener("toggle", (event) => {
    console.log("A details element changed state:", event.target.open);
}, true);  // capture phase required: "toggle" does not bubble
```

| Phase | Direction | Triggered by default? |
|---|---|---|
| Capture | From the `document` down to the target element | No: only with `true` (or `{ capture: true }`) as the 3rd argument |
| Bubbling | From the target element up to the `document` | Yes |

## Changing the URL without reloading the page

The browser's `history` API changes the URL shown in the address bar without reloading the page or triggering any network navigation:

```javascript
const params = new URLSearchParams();
params.set("domain", "atlas");

history.replaceState(null, "", `${window.location.pathname}?${params}`);
// Displayed URL: .../page?domain=atlas, no reload and no new history entry
```

The three arguments are always the same: a `state` (data attached to this history entry, retrievable later through the `popstate` event; `null` when unused here), a title (ignored by most browsers), and the new URL (which must stay on the same origin, or the browser throws an error).

| Method | Effect on history | Typical use case |
|---|---|---|
| `history.pushState(...)` | Adds a new entry: the browser's "Back" button returns to it | Switching "pages" in a [single-page application](/?c=langages-de-programmation&s=javascript&p=ssr-vs-csr#csr-the-server-sends-an-empty-shell) without a reload |
| `history.replaceState(...)` | Replaces the current entry: no new entry is created | Syncing the URL with a state already shown on screen (a filter, an active tab), without cluttering navigation history |

> **Note:** unlike `window.location.href = "..."`, neither `pushState` nor `replaceState` reloads the page: the already-loaded JavaScript keeps running, only the visible URL changes.

## Fullscreen and Clipboard: two APIs triggered by a user action

Two browser APIs, reachable from JavaScript, but that **can only be used following an explicit user action** (a click, a key press): for security, the browser refuses to trigger them from code running on its own.

```javascript
// Enter fullscreen
document.querySelector("#video-area").requestFullscreen();

// Listen for leaving fullscreen, even if the user left it via
// a browser shortcut (Escape) rather than a button on the page
document.addEventListener("fullscreenchange", () => {
    const isFullscreen = document.fullscreenElement !== null;
    fullscreenButton.textContent = isFullscreen ? "Exit" : "Fullscreen";
});
```

```javascript
// Copy text to the clipboard (asynchronous, can fail: permission denied)
async function copy(text) {
    try {
        await navigator.clipboard.writeText(text);
        showConfirmation("Copied!");
    } catch (error) {
        showConfirmation("Copy failed");
    }
}
```

| API | Triggered by | Notable point |
|---|---|---|
| Fullscreen (`requestFullscreen()`/`exitFullscreen()`) | A click or key press | The `fullscreenchange` event is needed because fullscreen can be exited through a path the code didn't trigger itself (Escape, a system shortcut) |
| Clipboard (`navigator.clipboard.writeText()`) | A click or key press | Always asynchronous (a `Promise`), and can fail if the user/browser denies permission: always wrap it in a `try`/`catch` |

> **Best practice:** always listen for `fullscreenchange` to resync the interface's state (button text, icon) with the actual fullscreen state, rather than assuming only the page's own button can change it.

## Persistent browser storage: `sessionStorage` and `localStorage`

Two built-in browser mechanisms for keeping text data (a key/value pair) after a page reload, with no database or server involved:

```javascript
sessionStorage.setItem("audit-confirmed", "true");
localStorage.setItem("theme", "dark");

sessionStorage.getItem("audit-confirmed");  // "true", or null if absent
localStorage.removeItem("theme");
```

| Mechanism | Scope | Survives... |
|---|---|---|
| `sessionStorage` | A single tab | A page reload (F5) |
| `localStorage` | Every tab on the same origin | The browser being fully closed |

> **Pitfall:** `sessionStorage`/`localStorage` only store text strings: saving an object requires converting it with `JSON.stringify()` on write and `JSON.parse()` on read.

> **Security warning:** both mechanisms are reachable from any JavaScript running on the page, including a script injected through an XSS vulnerability (see [Cross-Site Scripting (XSS) in Detail](/?c=securite&s=cybersecurite&p=xss-en-detail)): never store a sensitive session token there without weighing that risk.

## Generating a downloadable file client-side: `Blob` and `URL.createObjectURL()`

```javascript
const csvContent = "name;value\nrow1;10\nrow2;20";
const file = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
// temporary URL pointing to this in-memory file
const url = URL.createObjectURL(file);

const link = document.createElement("a");
link.href = url;
link.download = "export.csv";
link.click();  // triggers the download, without ever adding it to the DOM

URL.revokeObjectURL(url);  // frees the memory once the download has started
```

A `Blob` (*Binary Large OBject*) represents raw data (text, binary) as a file, entirely in memory on the browser side, with no round trip to the server. `URL.createObjectURL()` gives it a temporary URL (`blob:...`) usable anywhere a file URL is expected (here, a link's `href`); `URL.revokeObjectURL()` frees it once the download has started, to avoid a memory leak.

> **Best practice:** always call `URL.revokeObjectURL()` once it's no longer needed: the browser never releases this temporary URL on its own.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The DOM represents an HTML page as a manipulable tree. `querySelector`/`addEventListener` select and react to interactions; an event propagates from children to parents (*bubbling*), except a few exceptions (`toggle`, `focus`, `blur`, `scroll`) that require the capture phase. |
| **Tools you can use** | `querySelector`/`querySelectorAll`, `addEventListener`, `classList`, `preventDefault()`, `history.pushState`/`replaceState`, `requestFullscreen()`/`navigator.clipboard.writeText()`, `sessionStorage`/`localStorage`, `Blob`/`URL.createObjectURL()`. |
| **Pitfalls to avoid** | Assigning user-supplied data to `innerHTML` (XSS vulnerability); attaching a listener to each individual element instead of delegating, which breaks for elements added dynamically afterward; forgetting `fullscreenchange` and assuming only the page's own button changes fullscreen; listening for `toggle` without the capture phase (`true` as the 3rd argument), since it never bubbles; storing a sensitive token in `sessionStorage`/`localStorage`, readable by any script (XSS). |
| **Best practices** | Use event delegation (a listener on a stable ancestor) instead of one listener per element, especially when elements are added dynamically. Prefer `replaceState` over `pushState` to sync the URL with a state already shown on screen, without cluttering navigation history. Always wrap `clipboard.writeText()` in a `try`/`catch`. Always call `URL.revokeObjectURL()` once a `Blob` download has started. |
