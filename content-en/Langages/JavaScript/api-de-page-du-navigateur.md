---
order: 22
---

# Page APIs of the Browser: Theme, Scrolling, Visibility and Cancellation (28/10/2026)

The **browser** is the software that displays web pages (Chrome, Firefox, Safari...). An **API** (*Application Programming Interface*) is a set of functions and objects that it makes available to JavaScript code, so that the code can act on the page or read the state of the device. This chapter presents four of these APIs, which are used to control a page:

| API | What it allows | Section |
|---|---|---|
| `matchMedia` | Checking from JavaScript whether a screen or settings condition is true (narrow window, dark theme...) | [matchMedia](#matchmedia-read-a-media-query-from-javascript) |
| `scrollIntoView` | Scrolling the page to an element | [scrollIntoView](#scrollintoview-scroll-to-an-element) |
| `visibilitychange` | Knowing whether the user is looking at the page or has left it (hidden tab) | [visibilitychange](#visibilitychange-knowing-whether-the-page-is-being-watched) |
| `AbortController` | Cancelling an operation in progress (network request, event listeners) | [AbortController](#abortcontroller-cancel-what-is-in-progress) |

An **event** is a signal that the browser sends when something happens (a click, a window resize, a tab change); a **listener** is the function attached to an event so that it runs each time. This chapter assumes you already know [the DOM and events](/?c=langages&s=javascript&p=dom-et-evenements) (the page seen as a tree of objects that JavaScript manipulates), [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [functions](/?c=langages&s=javascript&p=fonctions) (including arrow functions `() => { ... }`), [conditions](/?c=langages&s=javascript&p=conditions), [loops](/?c=langages&s=javascript&p=boucles) and [objects](/?c=langages&s=javascript&p=objets) (the `{ name: value }` notation).

Most of these APIs are available in all current browsers (28/10/2026): the section on each API points out the rare cases that call for caution.

## `matchMedia`: read a media query from JavaScript

A **media query** is a condition written in CSS with `@media`, which applies styles only if the screen or the user's settings match: window width, dark theme, touch device... It is explained in [the chapter on responsive design](/?c=langages&s=css&p=responsive-et-media-queries). CSS reacts on its own, but a script sometimes needs to know the answer itself (stop an animation, load lighter content). The function `window.matchMedia(query)` gives it that answer. In the example below, `(max-width: 600px)` means "the window width is at most 600 pixels" (a **pixel** is the smallest dot on a screen). `window` is the object that represents the tab's window: its functions can be written with or without `window.` in front.

```javascript
// matchMedia receives a media query as text and returns a MediaQueryList object
const query = window.matchMedia("(max-width: 600px)");

// matches is true if the condition holds at this moment, false otherwise
if (query.matches) {
    // console.log writes a message to the developer tools console (F12)
    console.log("Narrow window: 600 pixels wide or less");
} else {
    console.log("Wide window: more than 600 pixels");
}

console.log(query.media);    // "(max-width: 600px)": the query, as read
```

The object returned, a **`MediaQueryList`**, contains:

| Element | Type | Role |
|---|---|---|
| `.matches` | Boolean (`true` or `false`) | True if the condition holds **right now**; the value stays up to date, so reading `query.matches` later gives the current answer |
| `.media` | Text | The query as the browser understood it |
| `addEventListener("change", callback)` | Function | Calls `callback` each time `.matches` **changes** value |
| `removeEventListener("change", callback)` | Function | Removes a listener set with `addEventListener` (see [the section on cancellation](#removing-several-listeners-at-once)) |

### Useful queries

| Query | True when | Typical use |
|---|---|---|
| `(max-width: 600px)` | The window is 600 pixels wide or less | Choosing a "phone" version of a component (a block of the interface such as a menu or a gallery) |
| `(min-width: 601px)` | The window is more than 600 pixels wide | The opposite of the previous one |
| `(orientation: portrait)` | The window is taller than it is wide | Adapting a gallery or a game |
| `(prefers-reduced-motion: reduce)` | The user has asked the system to **reduce animations** | Not starting an animation, see [the chapter on SVG](/?c=langages&s=html&p=svg-dans-la-page) for a complete example |
| `(prefers-color-scheme: dark)` | The user has chosen the **dark theme** in their system | Applying dark colors |
| `(hover: hover)` | The main device (mouse, touchpad) can **hover** over an element; false on a touch screen, where one can only touch | Showing a tooltip on hover only if hovering exists |

Several conditions are combined with `and`: `"(max-width: 600px) and (orientation: portrait)"` is true when both are. The same queries are used as they are in `@media` in CSS; [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) lists all the possible conditions, and the page on [`hover`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/hover) describes hovering in detail.

### Read once or listen for changes

Reading `.matches` once gives the state **at that instant**. But the user may change their mind while the page is open: resize the window, turn their phone, switch the system to dark theme. The `change` event tells the script at each switch.

```javascript
// Object for the condition "dark theme chosen in the system"
const dark = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(isDark) {
    // document.documentElement is the <html> tag; toggle(name, condition) adds the
    // class if the condition is true, removes it otherwise
    document.documentElement.classList.toggle("dark-theme", isDark);
}

applyTheme(dark.matches);              // state at loading (change does not fire there)

// At each switch of the system, the browser calls this function (event object)
dark.addEventListener("change", (event) => {
    applyTheme(event.matches);         // the new value of the condition
});
```

```css
:root {
    --background: #ffffff;             /* CSS variables: colors of the light theme */
    --text: #1a1a1a;
}

.dark-theme {
    --background: #121212;             /* the class added replaces the values */
    --text: #f0f0f0;
}

body {
    background: var(--background);     /* var(--name) reads the variable */
    color: var(--text);
}
```

The [CSS variables](/?c=langages&s=css&p=variables-et-cascade) avoid rewriting all the colors: the script only adds or removes a [class](/?c=langages&s=css&p=selecteurs) (a label placed on an element, which CSS can target) on `<html>`, the [tag](/?c=langages&s=html&p=structure-dun-document) that contains the whole page.

| | Read once | Listen for changes |
|---|---|---|
| Syntax | `window.matchMedia(q).matches` | `addEventListener("change", callback)` |
| Useful when | A decision is made at a precise moment: on click, when an animation starts | The interface must follow the setting live: theme, layout |
| Triggers | Never on its own: we read at the chosen moment | Only when the answer **switches** (not at every pixel of a resize), and never at loading |

### CSS or JavaScript?

| Need | Best tool | Why |
|---|---|---|
| Change colors, sizes, layout depending on width or theme | **`@media` in CSS** | No script to write, no delay, and it works even if the script fails |
| Choose which content to load (a heavy image only on large screens) | `matchMedia` | CSS cannot decide by script what to download |
| Start, stop or slow down an animation made in JavaScript | `matchMedia` | CSS has no control over a JavaScript loop |
| Remember a user's theme choice | `matchMedia` + [browser storage](/?c=langages&s=javascript&p=dom-et-evenements) | The explicit choice takes priority over the system setting |

### Pitfalls of `matchMedia`

The old `addListener` syntax is **obsolete**: it appears in old tutorials, but `addEventListener("change", ...)` replaces it.

```javascript
const query = window.matchMedia("(max-width: 600px)");
function onChange(event) { console.log(event.matches); }

query.addListener(onChange);                 // OBSOLETE: do not write this any more
query.addEventListener("change", onChange);  // write this instead
```

The other common mistake is to **measure the window in a loop** to guess whether it is narrow. `setInterval(callback, delay)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)) is a **timer**: it calls the function back at regular intervals, here every 16 milliseconds (a millisecond is a thousandth of a second).

```javascript
// BAD: we query the width 60 times per second, even when nothing changes
setInterval(() => {
    // window.innerWidth: the width of the window, in pixels
    if (window.innerWidth <= 600) {
        console.log("narrow");
    }
}, 16);                                   // 16 milliseconds between measurements
```

This loop makes the browser work for nothing and drains the battery. `matchMedia` only warns when the answer **changes**. To follow the exact size of an element, `ResizeObserver` (see [observers](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) is the intended tool; the `resize` event of the window, on the other hand, fires dozens of times per second and is limited with a **debounce** (act only after a pause in the series of events, see the same chapter).

Two subtleties to know. On the one hand, a **badly written** query raises no error: `window.matchMedia("max-width 600")` (without parentheses) returns an object whose `.matches` is simply `false`, and a test that fails silently is hard to spot. On the other hand, `.matches` reflects the condition at the moment of reading, but only the `change` event warns of a switch: reading `.matches` once at startup and never again leaves the interface out of date as soon as the user changes a setting.

## `scrollIntoView`: scroll to an element

**Scrolling** is the movement of the content when you turn the mouse wheel or slide a finger. `element.scrollIntoView()` asks the browser to scroll the page (and all the containers that hold it) until the element is visible. The name means "scroll to bring into view".

```html
<!-- A button, then further down a heading identified by its id (unique) "pricing" -->
<button id="go-to-pricing">See pricing</button>
<h2 id="pricing">Pricing</h2>
```

```javascript
const button = document.getElementById("go-to-pricing");   // the button, found by its id
const title = document.getElementById("pricing");          // the element to reach

button.addEventListener("click", () => {                   // on click on the button...
    // ... scroll smoothly to the heading, which will stick to the top of the visible area
    title.scrollIntoView({ behavior: "smooth", block: "start" });
});
```

The argument is an **options object**: several named settings written between braces. All are optional.

| Option | Possible values | Default value | Effect |
|---|---|---|---|
| `behavior` | `"auto"`, `"smooth"` | `"auto"` | `"auto"` follows the CSS property `scroll-behavior` of the page (an immediate jump if nothing is set). `"smooth"` animates the scrolling |
| `block` | `"start"`, `"center"`, `"end"`, `"nearest"` | `"start"` | Where to place the element **vertically** in the visible area (in a page written left to right) |
| `inline` | `"start"`, `"center"`, `"end"`, `"nearest"` | `"nearest"` | Where to place it **horizontally** |

`"nearest"` means "the closest": the browser scrolls as little as possible, and does not move at all if the element is already fully visible. The following diagram shows the visible area (the frame) after a scroll for three values of `block`:

```
  block: "start"        block: "center"       block: "end"
  +-------------+       +-------------+       +-------------+
  | [element]   |       |             |       |             |
  |             |       | [element]   |       |             |
  |             |       |             |       | [element]   |
  +-------------+       +-------------+       +-------------+
  top of the view       middle of the view    bottom of the view
```

### Offsetting a fixed header with `scroll-margin-top`

A **fixed header** is a bar that stays stuck to the top of the window while scrolling (see [CSS positioning](/?c=langages&s=css&p=positionnement)). With `block: "start"`, the reached element ends up exactly at the top of the visible area, so **hidden behind** that bar. CSS fixes this with `scroll-margin-top`, a scroll margin: a distance that the browser keeps between the top of the view and the element to reach ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-margin-top)).

```css
.header {
    position: sticky;                  /* stays stuck to the top while scrolling */
    top: 0;                            /* stuck 0 pixels from the top of the window */
    height: 64px;                      /* height of the bar */
}

h2[id] {
    scroll-margin-top: 80px;           /* 80 pixels free above any h2 with an id */
}
```

This margin also applies to anchor links `<a href="#pricing">`: a single CSS setting fixes both. Its equivalent set on the scrolling container (often `html`) is `scroll-padding-top` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-padding-top)).

### Respecting `prefers-reduced-motion`

Animated scrolling can cause dizziness in some people (see [`prefers-reduced-motion`](/?c=langages&s=css&p=animations-css-performantes)). So you must **never force `smooth`**: we read the user's setting and choose the behavior accordingly.

```javascript
function scrollBehavior() {
    // True if the user has asked to reduce animations in their system
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return reduced ? "auto" : "smooth";      // condition ? if_true : if_false
}

function goTo(element) {
    element.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}
```

Smooth scrolling can also be set once and for all for the page, in CSS, within the same condition:

```css
@media (prefers-reduced-motion: no-preference) {
    html {
        scroll-behavior: smooth;       /* all scrolling becomes smooth */
    }
}
```

With this rule, `behavior: "auto"` (the default value) is enough in JavaScript: the browser applies the value from the CSS.

### `scrollIntoView`, `scrollTo`, the anchor and `focus()`

Four tools seem to do "the same thing" but are not used the same way:

| Tool | What it is given | Changes the URL? | Moves the focus? | When to use it |
|---|---|---|---|---|
| `element.scrollIntoView(options)` | An element | No | No | Bringing an element into view from a script |
| `window.scrollTo({ top, behavior })` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo)) | A position in pixels from the top of the page | No | No | Going back to the top (`top: 0`), or to a position we calculated |
| Anchor link `<a href="#pricing">` | The element's `id`, in the address | Yes: adds `#pricing` and a history entry (the list that the Back button goes through) | Only if the target can receive the focus; otherwise, the next press of Tab starts from the target | A navigation link that must be shareable and work without JavaScript |
| `element.focus()` | An element that can receive the focus | No | Yes | Making an area usable from the keyboard (see [keyboard focus](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)) |

The **focus** is the element that receives keyboard keys. `scrollIntoView` does not move it: a person who navigates with the keyboard or with a screen reader (software that reads the page aloud) would not know that they were taken elsewhere. For real navigation, we therefore combine the two. Calling `focus()` also scrolls the page to the element, in one go; the option `preventScroll: true` removes that scrolling so that only `scrollIntoView` acts:

```javascript
// <h2 id="pricing" tabindex="-1">: tabindex="-1" allows focus from a script only
const title = document.getElementById("pricing");

title.scrollIntoView({ behavior: scrollBehavior() });   // scrolling (animated or not)
title.focus({ preventScroll: true });   // focus without a second, competing scroll
```

`tabindex="-1"` is needed because a heading does not receive the focus by itself, unlike a link or a form field: the attribute is explained with keyboard focus ([dedicated chapter](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). The documentation of `focus()` is on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus).

### Pitfalls of `scrollIntoView`

**A nested scrolling container.** A message list with a fixed height, with its own scroll bar, is a scrolling container: `scrollIntoView` scrolls the list, **but also the whole page** if needed, which can make the page jump unexpectedly. Two remedies:

```javascript
const list = document.getElementById("message-list");   // the container with its scroll bar
const last = list.lastElementChild;    // its last child: the last message

// Remedy 1: nearest scrolls as little as possible (but may still move the page)
last.scrollIntoView({ block: "nearest" });

// Remedy 2: scroll only the list, down to the bottom of its content
// scrollHeight: the total height of the content, hidden part included
list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
```

**An element that is not there.** If the element is not yet in the DOM (the page loads its content through a request), `getElementById` returns `null` ("no value") and `null.scrollIntoView()` causes an error. We wait for the element to exist, or we test first:

```javascript
const target = document.getElementById("reviews");   // null if the element does not exist yet

// ?. (optional chaining) only calls the function if target is not null
target?.scrollIntoView({ behavior: "smooth" });
```

An element with `display: none` takes up no room in the page: scrolling does nothing. Finally, if an image or content loads **after** the scroll and enlarges the page above the element, the element ends up shifted: reserving space for images with `width` and `height` avoids this shift. The documentation of the function is on [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView).

## `visibilitychange`: knowing whether the page is being watched

A **tab** is one of the pages open side by side in a single browser window. It is **hidden** when the user displays another one, minimizes the window, locks their screen or switches to another application on a phone. In this state, nobody is looking at the page: continuing to animate it or to query a **server** (a remote computer that answers the page's requests) wastes battery and network.

The browser indicates this with `document.visibilityState`, which takes one of two values, and with the `visibilitychange` event, fired on `document` at each switch.

| Property | Value | Meaning |
|---|---|---|
| `document.visibilityState` | `"visible"` | The page is displayed on screen |
| `document.visibilityState` | `"hidden"` | The page is hidden: background tab, minimized window, locked screen |
| `document.hidden` | `true` or `false` | Older version of the same information: `true` when the state is `"hidden"` |

```javascript
// Reading at startup: a tab opened in the background starts in the "hidden" state
console.log(document.visibilityState);      // "visible" or "hidden"
console.log(document.hidden);               // true if the tab is hidden

// The event is set on document (not on window or on an element)
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        console.log("Tab hidden: saving resources");
    } else {
        console.log("Tab back: resuming");
    }
});
```

### What the browser does with a hidden tab

| Mechanism | In a hidden tab |
|---|---|
| `setTimeout` and `setInterval` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval)): the **timers**, which call a function back after a delay or at regular intervals | Slowed down: generally at most one call per second, sometimes much less depending on the browser |
| `requestAnimationFrame` (see [the chapter on canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)) | Suspended: the function is no longer called at all, until the tab returns |
| CSS animations | The browser may reduce their frame rate (see [CSS animations](/?c=langages&s=css&p=animations-css-performantes)) |
| Network requests in progress | They continue: only the code that restarts them can be stopped by the script |

A slowed timer is therefore **not** a stopped timer: a poll every 5 seconds keeps soliciting the server. The script must itself decide to stop.

### Pausing a poll and resuming on return

A **poll** (*polling*) means regularly asking the server whether there is anything new. Two new notions appear in the example. `fetch(url)` sends a **network request** (a request sent to a server, see [the API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)) and returns a **promise**, an object that represents a result that will arrive later; `await` waits for that result without blocking the page, and `async` in front of a function allows it to use it (see [asynchronous programming](/?c=langages&s=javascript&p=asynchrone)). `.json()` converts the text of the response, written in **JSON** (a text format for exchanging data), into a JavaScript object.

```javascript
let timer = null;                              // active timer, or null (none)

async function refresh() {
    const response = await fetch("/api/messages");   // asks the server for the messages
    const messages = await response.json();          // reads the response as JSON
    console.log(messages.length + " messages");      // displays their number
}

function startPolling() {
    if (timer !== null) {                      // !== : "is different from"
        return;                                // already started: no second timer
    }
    refresh();                                 // catches up on what was missed
    timer = setInterval(refresh, 30000);       // then every 30000 milliseconds
}

function stopPolling() {
    clearInterval(timer);                      // clearInterval cancels the timer
    timer = null;                              // we note that there is none any more
}

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopPolling();                         // hidden tab: no more requests
    } else {
        startPolling();                        // tab back: we start again
    }
});

if (!document.hidden) {                        // ! : "not"; at loading, start only
    startPolling();                            // if the page is really visible
}
```

The guard `timer !== null` prevents stacking two timers if the event fires twice in a row.

### Pausing a video and resuming it

For a [video](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) (the `<video>` tag, a player built into the page), you must remember **the state before hiding**: if the user had paused the video themselves, starting it again on return would be a surprise.

```javascript
const video = document.getElementById("demo");   // <video id="demo"> in the page
let wasPlaying = false;                          // was the video playing before hiding?

document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        wasPlaying = !video.paused;              // paused: true if the video is paused
        video.pause();                           // pauses it
    } else if (wasPlaying) {
        video.play().catch(() => {});            // play returns a promise: refusal ignored
        wasPlaying = false;                      // the state is used up
    }
});
```

### Resuming an animation without a jump

`requestAnimationFrame` stops by itself in a hidden tab, so there is nothing to suspend. But, on return, the time elapsed between two frames may have reached several minutes, and an object that moves in proportion to time **jumps** abruptly. So we cap the duration taken into account.

```javascript
let position = 0;                              // position of the object, in pixels
const speed = 0.1;                             // 0.1 pixel per millisecond
let last = null;                               // time of the last frame, or null

function frame(now) {                          // now: browser clock, in ms
    // time elapsed since the previous frame (0 for the first one)
    const elapsed = last === null ? 0 : now - last;
    last = now;                                // we note the time of this frame
    position += speed * Math.min(elapsed, 100);   // Math.min: at most 100 ms at once
    requestAnimationFrame(frame);              // schedules the next frame
}

requestAnimationFrame(frame);                  // starts the loop
```

### Sending a final measurement with `sendBeacon`

A site that measures the time spent on a page wants to send its measurement at the moment the user leaves. A `fetch` request started at that instant risks being interrupted by the page closing. `navigator.sendBeacon(url, data)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)) was designed for this case: it hands the sending over to the browser, which carries it to completion even if the page disappears. The sending is a **POST** request, the [HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) method that sends data to a server. It only returns a boolean (`true` if the sending was queued), never the server's response.

```javascript
const begin = performance.now();               // ms elapsed since loading began

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") {
        return;                                // we only send when switching to "hidden"
    }
    // JSON.stringify converts an object into JSON text; Math.round rounds to the integer
    const measure = JSON.stringify({ duration: Math.round(performance.now() - begin) });
    navigator.sendBeacon("/api/mesures", measure);   // POST, sent without waiting
});
```

The server receives text (JSON) in POST. The measurement is **cumulative**: if the user hides then shows the tab several times, the server receives several sends and keeps the last one.

### Why not `beforeunload` or `unload`?

Many tutorials send their measurements on the `beforeunload` events (the page is about to close, a confirmation message may be displayed) or `unload` (the page is being unloaded). They are unreliable:

| Event | When it fires | Reliability for sending a measurement |
|---|---|---|
| `beforeunload` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)) | The page is about to be left, closed or reloaded | Low: on mobile, switching to another application or closing the tab is not always announced; mainly serves to warn about unsaved input |
| `unload` | The page is unloaded | Low, and discouraged: its presence may prevent the browser from keeping the whole page in memory for an instant back navigation |
| `pagehide` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)) | The page is left, **or** kept in memory for a quick back navigation | Good: also fires when the user navigates elsewhere; `event.persisted` is `true` if the page is kept |
| `visibilitychange` to `"hidden"` | The tab is hidden, which almost always precedes a closing | The most reliable, especially on mobile: it is the last safe moment |

The robust combination is `visibilitychange` (switching to `"hidden"`) with `sendBeacon`, possibly completed by `pagehide`. Only one sending should then count, hence the value of noting that a measurement has already been sent, if we do not want to send it twice.

```javascript
let alreadySent = false;                       // true once the measurement is sent

window.addEventListener("pagehide", () => {
    if (alreadySent) {
        return;                                // no duplicate with visibilitychange
    }
    alreadySent = true;
    navigator.sendBeacon("/api/mesures", "end");   // plain text, read by the server
});
```

### Pitfalls of `visibilitychange`

| Pitfall | Explanation |
|---|---|
| Assuming the page is visible at the start | A link opened in a background tab loads the page already hidden, **without an event**: read `document.visibilityState` at startup |
| Pausing content whose audio is wanted | A music player, a podcast, a video call must continue with the tab hidden: suspend only what is purely visual |
| Restarting what the user had stopped | Keep the state before hiding (variable `wasPlaying`) |
| Forgetting to refresh on return | The data has aged during the absence: make a request again as soon as the tab returns |
| A large time step in an animation | Cap the duration taken into account (`Math.min`) |
| Sending on `unload` or `beforeunload` | Unreliable, especially on mobile |

## `AbortController`: cancel what is in progress

Some operations take time: a request waiting for a slow server, a large download. Sometimes their result is no longer of interest (the user has changed page, retyped their search) or they must stop after a delay. `AbortController` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)) is an object that serves as a **cancellation remote control**: we create it, pull a **signal** from it that we give to the operation, and press "cancel" when we decide.

| Element | Role |
|---|---|
| `new AbortController()` | Creates the remote control |
| `controller.signal` | An `AbortSignal` object: the thread we give to the operation so that it knows when to stop |
| `controller.abort()` | Presses the button: the signal switches to "cancelled" and warns everyone who listens to it |
| `signal.aborted` | `true` once the cancellation has been triggered |
| `signal.reason` | The reason for the cancellation (see below) |

### Cancelling a `fetch` request

`fetch` accepts as second argument an options object whose `signal` key receives the signal. If the signal is cancelled, the rejected promise (a promise can fail: we say it is **rejected**, and the error is caught by `try` / `catch`, see [error handling](/?c=langages&s=javascript&p=gestion-des-erreurs)) carries an error named `AbortError`. [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) describes `fetch` in detail.

```javascript
const controller = new AbortController();     // the remote control
const signal = controller.signal;             // the signal to give to fetch

// On click on the "Cancel" button (<button id="cancel">), we press the remote control
document.getElementById("cancel").addEventListener("click", () => {
    controller.abort();                       // the request in progress is interrupted
});

async function download() {
    try {
        // { signal } is the shorthand for { signal: signal }
        const response = await fetch("/api/gros-fichier", { signal });
        console.log("Response received", response.ok);   // ok: true if the server responded
    } catch (error) {
        if (error.name === "AbortError") {          // name: the type of the error (text)
            console.log("Download cancelled");      // a wanted cancellation, not a failure
        } else {
            throw error;                            // a real error: we rethrow it
        }
    }
}
```

Cancellation has two limits. On the one hand, it interrupts **the waiting and the download on the browser side**, not necessarily the server's work: a request that modifies data (an order) may have been processed before the cancellation. On the other hand, it also applies to reading the content: an `await response.json()` in progress is interrupted in the same way, with the same error.

### Cancelling the previous request: the race between requests

In a search bar that queries the server on every letter, the user types "re" then "rech". Two requests leave. Nothing guarantees that they come back **in the order they were sent**: the first may be slower. If its response arrives last, it overwrites the correct display with outdated results. It is a **race** (*race condition*) between requests: the result depends on which one arrives first.

```
Time ------------------------------------------------------------------------>

WITHOUT CANCELLATION
 keystroke "re"   -> request A ----------------------------> response A (slow)
 keystroke "rech" ->    request B -----------> response B
 display                                        [B]            [A]  <- outdated results

WITH CANCELLATION
 keystroke "re"   -> request A ------X   (abort() at the next keystroke)
 keystroke "rech" ->    request B -----------> response B
 display                                        [B]            (A never displays anything)
```

The solution: keep the controller of the request in progress and cancel it before launching a new one. To build the search address, `encodeURIComponent(text)` replaces the special characters of a text (spaces, `&`, accents) with codes that are safe to put in an address.

```html
<input id="search">                              <!-- text input -->
<p id="status"></p>                              <!-- status message -->
<ul id="results"></ul>                           <!-- list of results -->
```

```javascript
const field = document.getElementById("search");
const status = document.getElementById("status");
const results = document.getElementById("results");
let currentController = null;                  // controller of the request in progress

async function find(text) {
    if (currentController !== null) {
        currentController.abort();             // cancels the previous request, if it exists
    }
    currentController = new AbortController(); // new remote control for this search
    status.textContent = "Searching...";

    try {
        const url = "/api/recherche?q=" + encodeURIComponent(text);
        const response = await fetch(url, { signal: currentController.signal });
        const list = await response.json();    // assume: an array of texts
        results.textContent = "";              // empties the old list
        for (const name of list) {             // for each result received...
            const item = document.createElement("li");   // ...creates a <li> element
            item.textContent = name;
            results.appendChild(item);         // adds it to the displayed list
        }
        status.textContent = "";               // search finished: no more message
    } catch (error) {
        if (error.name === "AbortError") {
            return;                            // replaced by a newer one: stay silent
        }
        status.textContent = "The search failed";
    }
}

field.addEventListener("input", () => {        // input: at each change of the field
    find(field.value);                         // value: the text currently typed
});
```

The cancelled search touches **neither the display nor the status message**: otherwise it would erase the "Searching..." of the request that replaces it. In practice, a **debounce** (wait for a short pause in typing before sending, see [observers and rate limiting](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) is often added to send fewer requests; cancellation remains useful for cases where two requests leave anyway.

### Limiting the duration with `AbortSignal.timeout`

A server that never responds would leave the user waiting forever. `AbortSignal.timeout(milliseconds)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static)) creates a signal that cancels itself after the given delay, without a controller to handle. Its error is called `TimeoutError`, which makes it possible to distinguish it from a wanted cancellation.

```javascript
async function loadWithTimeout() {
    try {
        // The signal cancels itself after 5000 milliseconds (5 seconds)
        const response = await fetch("/api/lent", { signal: AbortSignal.timeout(5000) });
        console.log("Received in time", response.ok);
    } catch (error) {
        if (error.name === "TimeoutError") {        // the delay has been exceeded
            console.log("The server is taking too long to respond");
        } else if (error.name === "AbortError") {   // wanted cancellation (never here)
            console.log("Cancelled");
        } else {
            throw error;                            // any other problem (network down...)
        }
    }
}
```

To combine a delay and a "Cancel" button, `AbortSignal.any([signalA, signalB])` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/any_static)) creates a signal that is cancelled as soon as **one** of the two is:

```javascript
const controller = new AbortController();      // for the "Cancel" button
// Cancelled by controller.abort() or after 8 seconds, whichever comes first
const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]);
```

### Removing several listeners at once

Removing a listener with `removeEventListener(name, callback)` requires giving it **the same function** as that of `addEventListener`: an arrow function written on the fly can therefore never be removed. The signal solves the problem: `addEventListener` accepts the option `signal` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)), and the listener is **removed automatically** when this signal is cancelled. A single `abort()` cleans up all the listeners that share the signal, which avoids forgetting one when a component disappears from the page.

```javascript
const controller = new AbortController();      // one controller for the whole component
const options = { signal: controller.signal }; // the options object shared

window.addEventListener("resize", () => {      // resize: the window changes size
    console.log("width:", window.innerWidth);
}, options);                                   // 3rd argument: the options, with the signal

document.addEventListener("keydown", (event) => {
    console.log("key:", event.key);            // key: the name of the key pressed
}, options);

document.addEventListener("visibilitychange", () => {
    console.log("visibility:", document.visibilityState);
}, options);

// Later, when the component disappears: the three listeners are removed at once
controller.abort();
```

### The reason for a cancellation

`abort()` accepts an optional argument, the **reason** for the cancellation. It is read on `signal.reason`, which helps to understand why an operation stopped. A `DOMException` is the type of error that the browser builds itself, with a name (`name`) and a message. Beware: the error received by `fetch` **is that very reason**.

| Call | Value of `signal.reason` | What the `catch` of `fetch` receives |
|---|---|---|
| `controller.abort()` | A `DOMException` error named `"AbortError"` | That error: `error.name === "AbortError"` |
| `controller.abort("Page left")` | The text `"Page left"` | The text itself: it has no `name`, so the test `error.name === "AbortError"` fails |
| `AbortSignal.timeout(5000)` | A `DOMException` named `"TimeoutError"` | That error: `error.name === "TimeoutError"` |

```javascript
const controller = new AbortController();

fetch("/api/rapport", { signal: controller.signal })
    .catch((error) => {
        console.log(error);                    // displays: Page left
    });

controller.abort("Page left");                 // the reason is free text
console.log(controller.signal.aborted);        // true: the signal is cancelled
console.log(controller.signal.reason);         // Page left
```

When you provide your own reason, it is therefore better to test **`signal.aborted`** than `error.name`, or to give a real error as the reason (`new DOMException("Page left", "AbortError")`).

### Pitfalls of `AbortController`

A cancelled controller **does not reset**: its signal stays cancelled forever, and any operation to which it is given afterwards fails immediately. A new one must be created for each operation.

```javascript
let controller = new AbortController();
controller.abort();                            // the signal is permanently cancelled

// BAD: this request is refused at once, because the signal is already cancelled
fetch("/api/donnees", { signal: controller.signal })
    .catch(() => console.log("immediate failure"));

controller = new AbortController();            // GOOD: a new controller
fetch("/api/donnees", { signal: controller.signal });
```

The other error is to treat cancellation as a real failure: to show "Network error" when the user has simply started a new search. The `catch` must distinguish the two cases, as in the examples above.

## Summary

| API | Question it answers | Example of use | Main pitfall |
|---|---|---|---|
| `window.matchMedia(query)` | Is the screen or settings condition true, and does it change? | Dark theme of the system, `prefers-reduced-motion`, narrow window | Reading `.matches` once without listening to `change`; measuring `innerWidth` in a loop; using the obsolete `addListener` |
| `element.scrollIntoView(options)` | How do we bring this element into view? | A "See pricing" button that scrolls to the heading | Forcing `smooth` despite `prefers-reduced-motion`; a fixed header hiding the target (`scroll-margin-top`); scrolling the whole page from a nested container |
| `document.visibilityState` and `visibilitychange` | Is the user looking at the page? | Pausing a poll or a video; sending a measurement with `sendBeacon` | Assuming the page is visible at start; sending on `unload`; restarting what the user had stopped |
| `AbortController` and `AbortSignal` | How do we stop what is in progress? | Cancelling the previous search; `AbortSignal.timeout`; removing listeners at once | Reusing a cancelled controller; treating `AbortError` as a real error |

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| Writing `query.addListener(...)` | Obsolete | `query.addEventListener("change", ...)` |
| Measuring `window.innerWidth` in a loop | Wasted work, battery drained | `matchMedia` and its `change` event, or `ResizeObserver` |
| Reading `.matches` once and forgetting it | The interface becomes out of date if the user changes theme or turns the device | Listen to `change` when the setting must be followed |
| A badly written media query | `matches` is `false` with no error or warning | Keep the parentheses: `"(max-width: 600px)"` |
| Forcing `behavior: "smooth"` | Can make people sensitive to motion feel unwell | Read `prefers-reduced-motion`, or leave `auto` and set `scroll-behavior` in CSS |
| Target hidden by the fixed header | The top of the visible area is under the bar | `scroll-margin-top` on the targets |
| `scrollIntoView` in a nested container | The whole page may also scroll | `block: "nearest"` or `container.scrollTo(...)` |
| Element absent from the DOM or in `display: none` | Error on `null`, or scrolling with no effect | Wait for it to exist, test with `?.` |
| `focus()` that scrolls abruptly | The browser scrolls the page to the element | `focus({ preventScroll: true })` |
| Assuming the page is visible at loading | A tab opened in the background starts "hidden" with no event | Read `document.visibilityState` at startup |
| Relying on `beforeunload` or `unload` to send data | Not reliably fired, especially on mobile | `visibilitychange` and `sendBeacon`, possibly `pagehide` |
| Poll or animation that keeps running in a hidden tab | Timers are only slowed down | Stop when switching to `"hidden"` |
| Restarting a video the user had paused | Unpleasant surprise | Keep the state before hiding |
| Reusing an `AbortController` that was cancelled | Its signal stays cancelled: the operation fails at once | Create one controller per operation |
| Showing `AbortError` as a failure | Cancellation is normal behavior | Recognize `error.name` (or `signal.aborted`) and stay silent |
| Cancelling with a text reason and testing `error.name` | A text has no `name`: the test fails | Test `signal.aborted`, or provide a `DOMException` |
| Believing that cancellation stops the server | It only cuts the wait on the browser side | Plan a server that supports a request being repeated or abandoned |

## Best practices

| Best practice | Why |
|---|---|
| Prefer `@media` in CSS when only the style changes; reserve `matchMedia` for script decisions | CSS is simpler and faster |
| Read the `matchMedia` state at startup **and** listen to `change` | Both the initial state and the switches are covered |
| Respect `prefers-reduced-motion` for any scrolling or animation started by script | Accessibility: some people cannot tolerate movement |
| Set `scroll-margin-top` on the targets when a header is fixed | The target stays visible, also for anchor links |
| After scrolling to an area, place the focus on it with `tabindex="-1"` and `focus({ preventScroll: true })` | Keyboard and screen reader navigation follows the scrolling |
| Stop what is purely visual when the page is hidden, and resume on return | Saves battery and network |
| Send the last measurements with `sendBeacon` on `visibilitychange` | The only reliable way, including on mobile |
| Cancel the previous request before launching a new one for the same function | No outdated results, no race between requests |
| Give a maximum delay to requests with `AbortSignal.timeout` | The user never waits forever |
| Group the listeners of a component behind a single `signal` | A single `abort()` cleans everything, nothing is forgotten |
| Handle `AbortError` and `TimeoutError` separately in the `catch` | A wanted cancellation, an exceeded delay and a failure each call for a different message |

## Key Takeaways

| | |
|---|---|
| **To remember** | `window.matchMedia(query)` returns a `MediaQueryList`: `.matches` gives the current answer, and the `change` event (via `addEventListener`) warns of switches, never at loading; CSS remains preferable when only the style changes. `element.scrollIntoView({ behavior, block, inline })` brings an element into view; `scroll-margin-top` offsets a fixed header, `prefers-reduced-motion` forbids forcing `smooth`, and `focus({ preventScroll: true })` moves the focus without a second scroll. `document.visibilityState` (`"visible"` or `"hidden"`) and the `visibilitychange` event on `document` allow polls, videos and animations to be suspended; `navigator.sendBeacon` sends the last measurement, because `beforeunload` and `unload` are unreliable, especially on mobile. `new AbortController()` provides a `signal` given to `fetch`, to `addEventListener` or to `AbortSignal.timeout`; `abort()` interrupts, the error is recognized by `error.name` (`AbortError`, `TimeoutError`), and a cancelled controller does not reset. |
| **Pitfalls to avoid** | Obsolete `addListener`; `innerWidth` measured in a loop; `.matches` read only once; forced `smooth`; target hidden by the fixed header; nested container that scrolls the page; element absent from the DOM; page assumed visible at start; sending on `unload`; timer that keeps running in a hidden tab; cancelled controller reused; cancellation treated as an error; text reason that makes the `error.name` test fail. |
| **Best practices** | CSS first, `matchMedia` for script decisions; initial reading plus listening to `change`; respect for `prefers-reduced-motion`; `scroll-margin-top` plus focus after a scroll; stopping and resuming on `visibilitychange`; `sendBeacon` for the last measurement; cancelling the previous request and `AbortSignal.timeout`; a shared `signal` to remove several listeners; a `catch` that distinguishes cancellation, exceeded delay and failure. |
