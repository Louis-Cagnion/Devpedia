---
order: 23
---

# Pointer Events and Font Loading (28/10/2026)

An **event** is a signal that the browser sends when something happens (a press, a movement, the end of a download); a **listener** is the function attached to an event so that it runs each time. They are explained in detail in [the chapter on the DOM and events](/?c=langages&s=javascript&p=dom-et-evenements). This chapter presents two topics of the same kind as [the page APIs of the browser](/?c=langages&s=javascript&p=api-de-page-du-navigateur) (that chapter defines what an API is): the information the browser gives a script about what the user does, and about what the screen really displays. They share a pitfall: the script acts on what it believes it knows, whereas reality (a finger leaving the frame, a font that has not yet arrived) changes afterwards.

| Topic | What it allows | Section |
|---|---|---|
| Pointer events | Reacting the same way to a mouse, a finger and a stylus; dragging an element without losing track; handling several fingers | [Pointer events](#pointer-events) |
| Loading fonts | Knowing when a font has arrived, to measure a text or draw it with the right width | [Loading fonts](#loading-fonts) |

This chapter assumes you already know [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [functions](/?c=langages&s=javascript&p=fonctions) (including arrow functions `() => { ... }`), [conditions](/?c=langages&s=javascript&p=conditions), [objects](/?c=langages&s=javascript&p=objets) (the `{ name: value }` notation), [asynchronous programming](/?c=langages&s=javascript&p=asynchrone) (promises, `async` and `await`) and [CSS selectors](/?c=langages&s=css&p=selecteurs). A **pixel** is the smallest dot on a screen; `px` is the CSS unit that counts pixels. All the APIs in this chapter are available in all current browsers (28/10/2026).

## Pointer events

### Why they exist

A **pointer** is anything that designates a point on the screen: the cursor of a **mouse** (the **cursor** is the arrow displayed that the mouse moves), a **finger** placed on a **touch screen** (which detects contacts), a **stylus** (a special pen for tablets). For a long time, each device had its own events: `mousedown` for the mouse, `touchstart` for the finger. Writing an interface that works everywhere forced the code to be written twice. **Pointer events** (*pointer events*) group the three devices under one set of names ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).

| | Mouse events | Touch events | Pointer events |
|---|---|---|---|
| Names | `mousedown`, `mousemove`, `mouseup` | `touchstart`, `touchmove`, `touchend` | `pointerdown`, `pointermove`, `pointerup` |
| Devices | Mouse (and computer touchpad) | Fingers only | Mouse, finger, stylus |
| Several fingers | Not applicable | A list of contacts in each event (`event.touches`) | One event per finger, recognized by its `pointerId` |
| Position | `clientX`, `clientY` | `touches[0].clientX` (in the list) | `clientX`, `clientY` directly |
| Code to write | One set | Another set | **One only** |

Code written only with `mousedown` does not react well to a finger: the browser does produce mouse events after a touch, called **compatibility** events, but all at once after the finger is lifted, and without following the movement. Pointer events do not have this defect.

> Trying them without a phone: the browser's developer tools (F12) can simulate a touch screen.

### The events of a pointer

| Event | Fires when | Bubbles up to parents |
|---|---|---|
| `pointerdown` | The pointer "presses": mouse button pressed down, finger or stylus touching the screen | Yes |
| `pointermove` | The pointer moves. Mouse: even without a button pressed; finger: only in contact; stylus: in contact or hovering | Yes |
| `pointerup` | The pointer is released | Yes |
| `pointercancel` | The browser **cancels** the gesture: it takes over (scrolling, zoom) or the device loses contact. No more events follow for this pointer | Yes |
| `pointerover` | The pointer enters the element or one of its children | Yes |
| `pointerenter` | The pointer enters the element itself (only once, whatever the number of children crossed) | No |
| `pointerout` | The pointer leaves the element or enters one of its children | Yes |
| `pointerleave` | The pointer leaves the element **and** all its descendants | No |
| `gotpointercapture`, `lostpointercapture` | The element has just gained, or lost, the capture of the pointer (see [the section on capture](#dragging-pointer-capture)) | Yes |

An event "bubbles up to the parents" (*bubbling*) when a listener placed on a parent receives it too: this mechanism is described in [the propagation of events](/?c=langages&s=javascript&p=dom-et-evenements). **Hover** (*hover*) is the state of an element over which a pointer is located without pressing; a finger has no hover, since it touches or does not touch. Hence an order of events that differs depending on the device:

| Device | Sequence around a press |
|---|---|
| Mouse | `pointerover`, `pointerenter`, `pointermove` (at each movement), `pointerdown`, `pointerup`, then `click`; `pointerout` and `pointerleave` when the cursor leaves the element |
| Finger | `pointerover`, `pointerenter`, `pointerdown`, `pointermove`..., `pointerup`, `pointerout`, `pointerleave`, then `click`: without hover, entry and exit frame the press straight away |
| Finger, when the browser starts scrolling | `pointerdown`, a few `pointermove`, `pointercancel`, `pointerout`, `pointerleave`; **no `pointerup`, no `click`** |

The minimal code listens to the four events of a pointer's lifecycle. `console.log` writes a message in the developer tools console (F12); `document.getElementById` finds an element by its `id`, its unique identifier.

```javascript
// An element of the page, identified by its id
const zone = document.getElementById("target");

zone.addEventListener("pointerdown", (event) => {
    console.log("press", event.pointerType);   // which device presses
});

zone.addEventListener("pointermove", () => {
    console.log("move");        // repeated as long as the pointer moves
});

zone.addEventListener("pointerup", () => {
    console.log("released");
});

zone.addEventListener("pointercancel", () => {
    console.log("cancelled by the browser");   // no pointerup will follow
});
```

### The properties of the event

The object received by the listener is a `PointerEvent` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent)). It carries everything the browser knows about the pointer:

| Property | Value | What it says |
|---|---|---|
| `pointerType` | `"mouse"`, `"touch"`, `"pen"` (stylus), or `""` if the device is unknown | Which device produced the event |
| `pointerId` | An integer | The number of the pointer: **one per finger**. It stays the same from the `pointerdown` to the `pointerup` of that finger |
| `isPrimary` | `true` or `false` | True for the main pointer of each type of device: the mouse always is, and for fingers, the first one placed |
| `clientX`, `clientY` | Decimal numbers, in pixels | Position in the **visible window**, measured from its top left corner |
| `pageX`, `pageY` | In pixels | Position in the **whole page**, scrolling included |
| `pressure` | From `0` to `1` | Press force. Without a pressure sensor (mouse, most screens), `0.5` during the press and `0` otherwise |
| `button` | `0` for the main button | Which button changed state. A finger or a stylus in contact gives `0` |
| `buttons` | A number (bits) | Which buttons are pressed at this instant |

```javascript
zone.addEventListener("pointerdown", (event) => {
    console.log(event.pointerType);   // "mouse", "touch" or "pen"
    console.log(event.pointerId);     // the number of this pointer
    console.log(event.isPrimary);     // true for the main pointer
    console.log(event.pressure);      // press force, from 0 to 1
    console.log(event.button);        // 0: main button (or contact)
    console.log(event.clientX, event.clientY);   // position in the window
});
```

To get the position **inside the element** rather than in the window, we subtract the position of the element. `getBoundingClientRect()` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)) returns the rectangle that the element occupies, measured in the same coordinates as `clientX` and `clientY`: its properties `left` and `top` give the left edge and the top edge, `width` and `height` its size.

```javascript
zone.addEventListener("pointermove", (event) => {
    // The rectangle is measured at each call: the page may have scrolled in the meantime
    const rect = zone.getBoundingClientRect();
    const x = event.clientX - rect.left;   // distance to the left edge of the element
    const y = event.clientY - rect.top;    // distance to its top edge
    console.log(x, y);
});
```

In an [SVG](/?c=langages&s=html&p=svg-dans-la-page) whose `viewBox` changes the scale, or in a [canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations) whose internal resolution differs from the displayed size, this subtraction is not enough: a scale conversion is added, presented in these chapters (for SVG, `getScreenCTM`).

### `click` or `pointerdown`?

| | `click` | `pointerdown` |
|---|---|---|
| When | After the press **and** the release | As soon as pressed |
| Keyboard | Yes: Enter or Space on a button also trigger it | No |
| Devices | All: mouse, finger, stylus, keyboard, screen reader | Pointers only |
| Abortable gesture | Yes: releasing elsewhere than on the element cancels the click | No: it has already gone |
| To use for | Activating a button or a link | Drawing, dragging, reacting without waiting for the release |

A button that validates an action must react to `click`, otherwise the keyboard no longer works (see [keyboard focus](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)).

### Dragging: pointer capture

A **drag** (*drag*) is a three-step gesture: press on an element, move while keeping the press, release. The pitfall: `pointermove` is sent to the element **under** the pointer. If the mouse moves fast and leaves the element, the element no longer receives anything and stays frozen, or never learns that the button was released elsewhere. **Pointer capture** (*pointer capture*) fixes this: the element that captures receives **all** the events of this pointer until the release, wherever it is.

```
WITHOUT CAPTURE                               WITH setPointerCapture
(the element only receives what               (the element receives EVERYTHING, until
 arrives while the pointer is over it)         the end of the gesture)

 pointerdown      -> element                   pointerdown      -> element
                                                 (+ setPointerCapture)
 pointermove      -> element                   pointermove      -> element
 pointermove      -> element                   pointermove      -> element
   the pointer leaves the element                the pointer leaves the element
 pointerleave     -> element                     (no pointerleave)
 pointermove      -> page or other element     pointermove      -> element
 pointerup        -> page or other element     pointerup        -> element
   the element will never know                  lostpointercapture -> element
   that the gesture is over: it stays "stuck"     (the capture is released by itself)
```

| Function or event | Role |
|---|---|
| `element.setPointerCapture(pointerId)` | The element captures this pointer. To call during the `pointerdown`: the `pointerId` must designate an active pointer, otherwise the browser raises an error |
| `element.releasePointerCapture(pointerId)` | Gives back the capture before the end of the gesture |
| `element.hasPointerCapture(pointerId)` | `true` if this element captures this pointer |
| `gotpointercapture` | The element has just gained the capture |
| `lostpointercapture` | The element has just lost it, by explicit release, by `pointerup`, by `pointercancel` or because it left the page |

The capture is released **automatically** at the end of the gesture (`pointerup` or `pointercancel`): there is therefore no need to release it by hand in the normal case ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture)). On a touch screen, the browser even captures the finger for the touched element from the `pointerdown` (**implicit capture**); with a mouse, nothing is captured unless asked. Calling `setPointerCapture` remains the good habit: the same code works for all devices.

During a capture, the entry and exit events (`pointerenter`, `pointerleave`, `pointerover`, `pointerout`) behave as if the pointer never left the capturing element. The elements hovered underneath receive nothing: to know what is under the pointer, you must ask for it explicitly, as the full example further down does.

### `touch-action`: who decides on touch scrolling?

On a touch screen, a finger that slides can mean "scroll the page", "zoom" or "move my map". The browser must decide **at the start of the gesture**, based on the CSS property `touch-action` of the touched element ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)). If it decides to scroll, it takes over and sends `pointercancel`: the element no longer receives any `pointermove`. Calling `preventDefault()` in `pointermove` changes nothing: the decision has already been made.

| Value | What the browser handles on the element | Use |
|---|---|---|
| `auto` (default) | Scrolling in both directions, zoom by pinching, zoom by double tap | Everything that is not a custom gesture |
| `none` | **Nothing**: every gesture reaches the listeners | Drawing area, map or plan moved with a finger |
| `pan-y` | Only vertical scrolling | A horizontal slider on a page that scrolls from top to bottom: the horizontal gesture goes to the script |
| `pan-x` | Only horizontal scrolling | The symmetric case |
| `pinch-zoom` | Only zoom by pinching | To combine with `pan-x` or `pan-y` to keep the zoom |
| `manipulation` | Scrolling and pinching, but not zoom by double tap | Buttons and lists: no more unwanted zoom |

```css
.card {
    touch-action: none;       /* a finger placed here neither scrolls nor zooms */
}

.horizontal-slider {
    touch-action: pan-y;      /* the page scrolls vertically; the horizontal is ours */
}
```

The value is read **at the start of the gesture**: changing it in JavaScript in the middle of a drag has no effect on that drag. And `touch-action: none` placed on a large area prevents scrolling the page by touching it: it is better to reserve it for the element being dragged, and not to block pinch zoom everywhere, because some people depend on it to read.

### Full example: dragging a card to a zone

A card is dragged towards a drop zone. If it is released on the zone, it stays there; if it is released elsewhere, if the browser cancels the gesture or if Escape is pressed, it goes back to its place. Only one finger at a time leads the drag. First the HTML and the CSS:

```html
<!-- The drop zone, the card to drag and a status message -->
<div id="drop-zone" class="drop-zone">Drop here</div>
<div id="card" class="card">Drag me</div>
<p id="status">No drag in progress</p>
```

```css
.card {
    width: 120px;
    padding: 12px;
    background: #e8eefc;
    cursor: grab;             /* open hand on hover, with a mouse */
    touch-action: none;       /* the browser neither scrolls nor zooms here */
    user-select: none;        /* the text of the card cannot be selected */
}

.card.dragging {
    cursor: grabbing;         /* closed hand during the drag */
    opacity: 0.8;             /* slightly transparent: we see the zone underneath */
}

.drop-zone {
    height: 100px;
    border: 2px dashed #999;  /* dashed frame */
}

.drop-zone.hover {
    border-color: #1a4fd6;    /* blue frame when the pointer is over it */
}
```

`.card.dragging` is a [selector](/?c=langages&s=css&p=selecteurs) that targets an element carrying **both** the classes `card` and `dragging`; `cursor` chooses the shape of the mouse cursor; `opacity` sets the transparency (from `0`, invisible, to `1`, opaque); `user-select: none` forbids selecting the text, which would otherwise happen when dragging with the mouse. The JavaScript keeps the state of the drag in a few variables:

```javascript
const card = document.getElementById("card");
const zone = document.getElementById("drop-zone");
const status = document.getElementById("status");

let active = null;    // pointerId of the drag in progress, or null if there is none
let baseX = 0;         // resting position of the card, in pixels
let baseY = 0;
let offsetX = 0;      // gap between the pointer and the card at the start
let offsetY = 0;
let newX = 0;         // position of the card during the drag
let newY = 0;
```

Three small functions follow. `transform: translate(x, y)` moves an element on screen without touching the layout (see [positioning](/?c=langages&s=css&p=positionnement) and [CSS animations](/?c=langages&s=css&p=animations-css-performantes)). The backticks (`` ` ``) delimit a text where `${x}` is replaced by the value of `x`. `document.elementsFromPoint(x, y)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/elementsFromPoint)) returns the array of all the elements present at this point of the window, from the highest to the lowest; `includes(zone)` answers `true` if the zone is one of them.

```javascript
function move(x, y) {
    // The backticks insert x and y into the text: "translate(40px, 10px)"
    card.style.transform = `translate(${x}px, ${y}px)`;
}

function underPointer(x, y) {
    // The elements stacked at this place: is the zone one of them?
    return document.elementsFromPoint(x, y).includes(zone);
}

function finish(dropped) {
    active = null;                         // no more drag in progress
    card.classList.remove("dragging");
    zone.classList.remove("hover");
    if (dropped) {
        baseX = newX;                       // the card stays where it was released
        baseY = newY;
        status.textContent = "Card dropped in the zone";
    } else {
        move(baseX, baseY);                  // back to the position from before the drag
        status.textContent = "Card returned to its place";
    }
}
```

The listeners take up the four events of the lifecycle, plus the Escape key. `classList` and `textContent` are presented in [the chapter on the DOM](/?c=langages&s=javascript&p=dom-et-evenements); `classList.toggle(name, condition)` adds the class if the condition is true, and removes it otherwise.

```javascript
card.addEventListener("pointerdown", (event) => {
    if (active !== null) return;           // already a drag: we ignore the other fingers
    if (event.button !== 0) return;        // mouse: main button only
    active = event.pointerId;              // we remember WHICH pointer drags
    offsetX = event.clientX - baseX;        // the gap stays constant during the drag
    offsetY = event.clientY - baseY;
    card.setPointerCapture(active);        // the card receives everything, even off its edges
    card.classList.add("dragging");
    event.preventDefault();                // no compatibility mouse events
    status.textContent = "Dragging in progress";
});

card.addEventListener("pointermove", (event) => {
    if (event.pointerId !== active) return;   // not the pointer that drags
    newX = event.clientX - offsetX;           // the card follows the pointer
    newY = event.clientY - offsetY;
    move(newX, newY);
    const above = underPointer(event.clientX, event.clientY);
    zone.classList.toggle("hover", above);    // blue frame if the pointer is on the zone
});

card.addEventListener("pointerup", (event) => {
    if (event.pointerId !== active) return;
    // Released on the zone: drop; elsewhere: back to the original place
    finish(underPointer(event.clientX, event.clientY));
});

card.addEventListener("pointercancel", (event) => {
    if (event.pointerId === active) finish(false);   // gesture cancelled: back
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && active !== null) {
        card.releasePointerCapture(active);   // gives tracking back to the other elements
        finish(false);                        // cancellation wanted by the user
    }
});
```

What each part brings:

| Part | If we remove it |
|---|---|
| `setPointerCapture` | With a mouse, a fast movement leaves the card: it stops, and the release elsewhere never reaches it |
| `touch-action: none` | On a phone, the finger scrolls the page, the browser sends `pointercancel`, and the card lets go after a few pixels |
| `pointercancel` listened to | The card stays stuck in the "dragging" state after a cancellation by the browser |
| `active` and the test of `pointerId` | A second finger (or a mouse hover without a press) would move the card |
| `elementsFromPoint` | `pointerenter` on the zone does not fire during the capture: the zone would never know it is being hovered |
| `releasePointerCapture` on Escape | The finger is still placed: without releasing the capture, the card would keep receiving the whole gesture |
| `preventDefault()` on `pointerdown` | After a touch, the browser would also send compatibility mouse events (`mousedown`...) |

`preventDefault()` on `pointerdown` only prevents these compatibility events. It replaces neither `touch-action` (touch scrolling) nor `user-select` (mouse text selection). Each annoying effect has its own remedy:

| Annoying effect during a drag | Remedy |
|---|---|
| The page scrolls under the finger | `touch-action: none` (CSS) |
| The text is selected with the mouse | `user-select: none` (CSS) |
| Mouse events arrive after the touch | `preventDefault()` on `pointerdown` |
| The drag only works with a mouse or a finger | Add a keyboard equivalent (see [keyboard focus](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)): a drag alone excludes whoever cannot point |

### Several fingers at the same time

Using several fingers at once is called **multitouch**. Each placed finger creates **its own pointer**, with its `pointerId`, its own `pointerdown`, `pointermove` and `pointerup`. The `pointerId` is therefore the key to track each finger separately. The example remembers the position of each placed finger and computes the gap between two fingers, the basis of a pinch gesture.

Some notions of the example. A `Map` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)) is a table that associates a **key** with a **value**: `set(key, value)` adds or replaces, `has(key)` tests presence, `delete(key)` removes, `size` gives the number of entries. The three dots `[...fingers.values()]` copy the values of the Map into an array, and `const [a, b] = ...` stores the first two in `a` and `b` (see [destructuring and spread](/?c=langages&s=javascript&p=objets)). `Math.hypot(dx, dy)` ([MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot)) computes the distance between two points whose positions differ by `dx` and `dy`: it is the square root of `dx` squared plus `dy` squared (Pythagoras' theorem), the square root of a number being the one that, multiplied by itself, gives back this number.

```html
<div id="surface" class="surface">Place two fingers here</div>
<p id="info">0 pointer(s) down</p>
```

```css
.surface {
    height: 200px;
    background: #e8eefc;
    touch-action: none;      /* without this, two fingers scroll or zoom the page */
}
```

```javascript
const surface = document.getElementById("surface");
const info = document.getElementById("info");

// A Map associates a key (here the pointerId) with a value (here the finger position)
const fingers = new Map();

function display() {
    let text = fingers.size + " pointer(s) down";   // size: number of entries
    if (fingers.size === 2) {
        const [a, b] = [...fingers.values()];            // the two positions
        const gap = Math.hypot(a.x - b.x, a.y - b.y);    // distance between the two fingers
        text += ", gap: " + Math.round(gap) + " px";
    }
    info.textContent = text;
}

surface.addEventListener("pointerdown", (event) => {
    surface.setPointerCapture(event.pointerId);          // follow this finger everywhere
    fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    display();
});

surface.addEventListener("pointermove", (event) => {
    if (!fingers.has(event.pointerId)) return;           // this pointer is not down
    fingers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    display();
});

function release(event) {
    fingers.delete(event.pointerId);                     // this finger is no longer down
    display();
}

surface.addEventListener("pointerup", release);
surface.addEventListener("pointercancel", release);      // a cancellation removes the finger
```

Removing the finger also on `pointercancel` is essential: otherwise the Map would keep a ghost finger, and `fingers.size` would never return to zero.

### `pointer-events`: letting clicks through

`pointer-events` is a CSS property that decides whether an element can be the **target** of a pointer ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/pointer-events)). For an HTML element, two values matter; the [chapter on SVG](/?c=langages&s=html&p=svg-dans-la-page) details the values specific to SVG shapes (`all`, `stroke`...).

| Value | Effect |
|---|---|
| `auto` (default) | The element receives pointers normally |
| `none` | The element is **transparent** to pointers: the click or touch goes through it and reaches what is underneath. It receives no pointer event, nor hover (`:hover`) |

The typical case is a decoration placed **over** clickable content, such as a gradient veil that fades the bottom of a list (see [gradients](/?c=langages&s=css&p=degrades)):

```html
<div class="frame">
    <ul class="list">
        <li><button>Item 1</button></li>
        <li><button>Item 2</button></li>
        <li><button>Item 3</button></li>
    </ul>
    <!-- Decorative veil, placed over the bottom of the list -->
    <div class="veil"></div>
</div>
```

```css
.frame {
    position: relative;          /* placement reference for the veil */
}

.list {
    height: 120px;
    overflow-y: auto;            /* vertical scroll bar if the content overflows */
}

.veil {
    position: absolute;          /* placed over, without taking up room */
    left: 0;                     /* stuck to the left, right and bottom edges of the frame */
    right: 0;
    bottom: 0;
    height: 40px;
    background: linear-gradient(transparent, #ffffff);   /* from transparent to white */
    pointer-events: none;        /* clicks and touches go through it */
}
```

Without `pointer-events: none`, the veil would intercept the clicks on the buttons it hides, and wheel scrolling above it would no longer scroll the list ([positioning](/?c=langages&s=css&p=positionnement) explains `relative` and `absolute`). Three details:

| Detail | Explanation |
|---|---|
| Children can come back | A child of an element with `pointer-events: none` can set `pointer-events: auto`: it alone becomes clickable again |
| The keyboard is not concerned | A button set to `none` remains reachable with Tab and can be activated with Enter. To disable a button, use the `disabled` attribute (see [forms](/?c=langages&s=html&p=formulaires)) |
| Search by position follows | `document.elementFromPoint` and `elementsFromPoint` ignore elements set to `none`, as a real click would |

### Pitfalls of pointer events

**Forgetting `pointercancel`.** A drag that only ends on `pointerup` stays stuck when the browser cancels the gesture (scrolling, incoming call, change of application): the "dragging" state never resets. Any state set on `pointerdown` must be undone on both `pointerup` **and** `pointercancel`, which is what the `finish` function of the example does.

**Relying on `pointerleave` during a capture.** It does not fire as long as the element captures (see the diagram above). To know what is under the pointer, use `document.elementsFromPoint`.

**Keeping the capture when it is no longer needed.** It is released automatically at the end of the gesture, but a drag cancelled by the user midway (Escape) leaves the finger placed: without `releasePointerCapture`, the element keeps receiving the whole gesture. And `setPointerCapture` with a `pointerId` that is no longer active raises an error: call it during the `pointerdown`.

**Assuming that `mouse` exists.** On a phone, `pointerType` is `"touch"`: code that tests `pointerType === "mouse"` reacts to nothing. On a computer with a touch screen, mouse and finger coexist. Reason by capability, not by device: `window.matchMedia("(hover: hover)")` indicates whether hover exists (see [`matchMedia`](/?c=langages&s=javascript&p=api-de-page-du-navigateur)).

**Reacting to hover only.** A finger has no hover: a tooltip that only appears on `pointerenter` never exists by touch. Provide an equivalent on press or on keyboard.

**The case of decimal numbers.** `clientX` and `clientY` can have a decimal part on a high pixel density screen: round them (`Math.round`) before using them as an integer pixel position.

## Loading fonts

### Why the text changes when the font arrives

A **font** (*font*) is the design of the letters: its shape, its thickness (the **weight**, `400` for normal text, `700` for bold). Fonts installed on the device, such as Georgia or Arial, are usable immediately. A **web font** is a file that the page downloads, declared in the CSS by the `@font-face` rule ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face)). This chapter does not choose fonts: for that, see [typography](/?c=ui-ux&p=typographie).

The `font-family` property gives a **list**: the browser takes the first available font. While the web font downloads, it uses the next one, the **fallback font** (*fallback*), or displays nothing, depending on the `font-display` setting. When the file arrives, it replaces the fallback font: the text is redrawn with other widths. The **font file** here is in WOFF2 format, a compressed format designed for the web.

```css
@font-face {
    font-family: "Lora";            /* the name we will use next */
    src: url("/fonts/lora.woff2") format("woff2");   /* address of the file, and format */
    font-weight: 700;               /* this declaration provides the bold weight */
    font-display: swap;             /* see the next section */
}

h2 {
    font-family: "Lora", Georgia, serif;   /* Lora, otherwise Georgia, otherwise serif */
    font-weight: 700;
}
```

`serif` is a **generic family** name: any serif font (small strokes at the ends of the letters) of the device. Loading does not start when the CSS is read: the browser downloads the file only **when a text on the page needs it**, after computing the layout. The diagram below (example values) shows what the user sees, and what a measurement taken too early reports:

```
Time ----------------------------------------------------------------------->

Page      | first layout | waiting for the file ....... | second layout
Text      | fallback font (Georgia)                              | web font (Lora)
Width     | "New": 61 px  |  measurement taken HERE: 61 px | "New": 68 px
                                      (wrong: it is no longer
                                       the displayed font)
```

This width change moves everything that follows the text: it is a **layout shift** (*layout shift*). It hinders reading, and it corrupts any code that **measured** the text before the font arrived.

### `font-display`: what to show while waiting?

The `font-display` property, set in `@font-face` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@font-face/font-display)), decides what is displayed during the download. It distinguishes a **block** period (the text is invisible, to avoid the layout shift) and a **swap** period (the fallback font is displayed, replaced by the web font when it arrives).

| Value | While waiting | If the font arrives late | Typical use |
|---|---|---|---|
| `auto` | At the browser's choice, generally like `block` | Same | To avoid: unpredictable behavior |
| `block` | **Invisible** text for a few seconds, then fallback font | Swap on arrival | An icon font, where the fallback font would be unreadable |
| `swap` | Fallback font **right away** | Swap at any time | Body text: it can be read without waiting |
| `fallback` | Invisible text for a very short moment, then fallback font | Swap accepted only for a few seconds | Compromise: no big late shift |
| `optional` | Invisible text for a very short moment, then fallback font | The web font is **not applied** to this page; it serves later visits | A comfort font, never essential |

The exact durations ("a few seconds", "a very short moment") depend on the browser. A consequence for what follows: with `swap`, `fallback` and `optional`, the font displayed changes depending on the moment and the connection. Code that measures must therefore never assume which one is displayed: it waits for the final state, then measures what is really on the screen.

### `document.fonts`: following the loading

`document.fonts` is a `FontFaceSet` object ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API)): the set of fonts known to the page, with what is needed to follow their loading.

| Element | Nature | Role |
|---|---|---|
| `document.fonts.ready` | Promise | Resolves when the loading in progress is finished and the layout is up to date |
| `document.fonts.load(font)` | Function, returns a promise | Starts loading the described font **and** waits for it |
| `document.fonts.check(font)` | Function, returns a boolean | `true` if the font is ready, without loading anything |
| `new FontFace(name, source)` | Constructor | Describes a font in JavaScript, without `@font-face` |
| `document.fonts.add(face)` | Function | Adds a `FontFace` to the set: the CSS can then use it |
| `document.fonts.status` | Text | `"loading"` during a loading, `"loaded"` otherwise |
| `loadingdone`, `loadingerror` | Events | End of a batch of loadings, or failure of at least one |

A **promise** is an object that represents a result to come; `await` waits for that result in an `async` function (see [asynchronous programming](/?c=langages&s=javascript&p=asynchrone)). To wait for all the fonts currently loading:

```javascript
async function start() {
    await document.fonts.ready;        // waits for the fonts in progress to be ready
    console.log("Fonts ready");
}

start();
```

`document.fonts.ready` waits for what is **already in progress**. To request a specific font, `document.fonts.load()` takes a description in the syntax of the CSS `font` property: a weight, a size, a family name (`"700 18px Lora"`); an optional second argument gives the text to display, useful when the font is split by character ranges. `check()` takes the same description.

```javascript
async function prepareTitles() {
    const font = "700 18px Lora";          // weight, size, family: like CSS font
    // true only if the font is loaded (or if no @font-face describes it)
    console.log(document.fonts.check(font));
    const faces = await document.fonts.load(font);   // starts the loading and waits for it
    console.log(faces.length);             // number of fonts loaded: 1 here
    console.log(document.fonts.check(font));         // true: the font is ready
}

prepareTitles();
```

`load()` returns an array of `FontFace`: **empty** if no `@font-face` matches (a typo in the family name produces no error), rejected if the file could not be downloaded. The **requested weight matters**: `"18px Lora"` loads the normal weight, not the bold.

### The `FontFace` object: loading a font from JavaScript

When the name or address of the font is only known at runtime (a choice by the user, a font received from a server), `FontFace` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/FontFace)) declares it from JavaScript. Its `status` is `"unloaded"`, `"loading"`, `"loaded"` or `"error"`. A failure is caught with `try` / `catch` (see [error handling](/?c=langages&s=javascript&p=gestion-des-erreurs)).

```javascript
async function loadFont() {
    // new FontFace(name, source, options) describes the font without downloading it yet
    const face = new FontFace("Lora", "url(/fonts/lora.woff2)", { weight: "700" });
    try {
        await face.load();                 // downloads; promise rejected if it fails
        document.fonts.add(face);          // the CSS can now use "Lora"
        console.log(face.status);          // "loaded"
    } catch (error) {
        console.log("Font unavailable:", error.name);   // the fallback font remains
    }
}

loadFont();
```

### React to each batch: `loadingdone`

`ready` is a promise: it only serves once. If other fonts load later (text added to the page, another language), a promise already obtained knows nothing about it. The `loadingdone` and `loadingerror` events of `document.fonts` warn **at each batch**:

```javascript
document.fonts.addEventListener("loadingdone", (event) => {
    // fontfaces: the list of fonts that have just finished loading
    console.log(event.fontfaces.length + " font(s) loaded");
});

document.fonts.addEventListener("loadingerror", () => {
    console.log("At least one font could not be loaded");
});
```

### Measuring a text after the font

Several tools give the **width of a text**. All of them measure the text **as it is displayed at that instant**: if the web font has not arrived, they measure the fallback font, without error or warning.

| Tool | What it measures | The pitfall before the font |
|---|---|---|
| `canvas.measureText(text).width` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText)) | The width of a text with the font set in `ctx.font` (see [the canvas](/?c=langages&s=javascript&p=canvas-2d-et-animations)) | An unloaded font name is not an error: the canvas uses another font, and does not redraw itself |
| `element.getBoundingClientRect()` | The size of an HTML element, with its current font | The width of a text with the fallback font, or even of an invisible text (`block`) |
| `element.getComputedTextLength()` | The width of an SVG `<text>` (see [SVG](/?c=langages&s=html&p=svg-dans-la-page)) | Same effect: the background fitted to the wrong width |

The remedy is the same for all: **wait for the font, then measure**. The example fits the background of an SVG label to the width of its text. The `<rect>` is the background; `rx` rounds its corners; the text is written in bold in the `Lora` font.

```html
<svg id="badge" viewBox="0 0 200 60" width="200" height="60">
    <!-- The background: its width will be computed by the script (0 at the start) -->
    <rect id="label-background" x="10" y="10" width="0" height="36" rx="6" fill="#e8eefc"/>
    <!-- The text, in bold Lora 18 px; x="22" leaves 12 of margin after the background -->
    <text id="label" x="22" y="34" font-family="Lora, Georgia, serif"
          font-weight="700" font-size="18">New</text>
</svg>
```

```javascript
const label = document.getElementById("label");
const background = document.getElementById("label-background");
const MARGIN = 12;                         // space on each side of the text, in units

function fitBackground() {
    const width = label.getComputedTextLength();          // width of the text as displayed
    background.setAttribute("width", width + 2 * MARGIN);   // background extends each side
}

async function start() {
    try {
        // Requests the exact font of the text (bold, 18 px) and waits for its arrival
        await document.fonts.load("700 18px Lora");
    } catch (error) {
        console.log("Font not loaded: we measure the fallback font");
    }
    fitBackground();                       // measures the font actually displayed
}

start();
```

In the `catch`, the measurement still takes place: if the loading fails, it is the fallback font that is displayed, and measuring it gives the right width. The principle is to measure **what is on the screen**, not the font we would like.

A canvas poses an additional problem: it is an image made of pixels, which **never updates by itself**. A text drawn with the fallback font stays so, even after the web font arrives. So we wait for the font before drawing, and we redraw at each batch of fonts:

```javascript
// <canvas id="poster" width="200" height="60">: the drawing area
const canvas = document.getElementById("poster");
const ctx = canvas.getContext("2d");      // ctx: the object that draws in the canvas

async function draw() {
    const font = "700 24px Lora";
    // A failure is ignored: we will then draw with the fallback font
    await document.fonts.load(font).catch(() => {});
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // erases the previous image
    ctx.font = font;                                    // same syntax as CSS font
    const width = ctx.measureText("Sale").width;        // width of the text with this font
    ctx.fillStyle = "#e8eefc";
    ctx.fillRect(10, 10, width + 20, 40);               // background: x, y, width, height
    ctx.fillStyle = "#1a1a1a";
    ctx.fillText("Sale", 20, 38);                       // text, baseline at point (20, 38)
}

draw();
document.fonts.addEventListener("loadingdone", draw);   // redraws after each batch
```

For an **HTML element** whose size must follow the text whatever the cause of the change (font, language, window), a `ResizeObserver` (see [observers](/?c=langages&s=javascript&p=observateurs-et-limitation-de-frequence)) calls the script back at each variation, without the script having to wait for the fonts itself.

### Pitfalls of font loading

**Measuring too early.** A measurement started as soon as the script loads, or at `DOMContentLoaded` (the end of the reading of the HTML), often comes before the font arrives: wrong width, badly fitted background, text overflowing its frame. Measure after `await document.fonts.load(...)`.

**Believing that `ready` is enough.** `ready` only covers what is **already in progress**. Called very early, before the browser has computed the layout and found that a text needs the font, it may already be resolved while nothing has arrived:

```javascript
// Script executed very early in the page
document.fonts.ready.then(() => {
    // WRONG: may run before the download has even been requested
    console.log(document.fonts.status);    // "loaded", although Lora has not arrived
});

// GOOD: request the font explicitly, then wait
document.fonts.load("700 18px Lora").then(() => {
    console.log("Lora has arrived");
});
```

**A wrong or missing font name produces no error.** `document.fonts.load("700 18px Lroa")` (typo) resolves with an empty array, and `document.fonts.check("700 18px Lroa")` returns `true`: no declared font matches, so there is nothing to wait for. The text displays in the fallback font, silently. Check that `faces.length` is not `0`, and that the name is identical to that of `@font-face`.

**A loading that fails.** Missing file, network cut: `load()` rejects its promise, the `loadingerror` event fires and the text stays in the fallback font. Without `try` / `catch` around the `await`, the error interrupts the function **before the measurement**, which then never takes place. Moreover, `ready` does not signal the failure: it is `load()` (or `loadingerror`) that must be listened to for that.

**Requesting the wrong weight.** `load("16px Lora")` only loads the normal weight; a title in bold (`700`) stays pending. Request exactly the combination of weight, style (`italic`) and size that the text uses.

**Setting `ctx.font` with a different font from the page.** The measurement no longer matches the display (see [the canvas pitfall](/?c=langages&s=javascript&p=canvas-2d-et-animations)).

## Summary

| Need | Tool | Main pitfall |
|---|---|---|
| React the same way to mouse, finger, stylus | `pointerdown`, `pointermove`, `pointerup` | Assuming that `pointerType` is `"mouse"` |
| Recognize each finger | `pointerId` (a `Map` from pointerId to position) | Forgetting to remove the finger on `pointercancel` |
| Drag without losing track | `setPointerCapture` on `pointerdown` | Relying on `pointerleave`, which does not come during the capture |
| Prevent touch scrolling during a gesture | `touch-action: none` (or `pan-y`, `pan-x`) | `preventDefault()` alone is not enough; the value is read at the start of the gesture |
| Know what is under the pointer | `document.elementsFromPoint(x, y)` | An element with `pointer-events: none` is absent from it |
| Let clicks pass through a decoration | `pointer-events: none` | Does not disable the keyboard: `disabled` for a real button |
| Avoid the layout shift of a font | `font-display` in `@font-face` | `auto`: unpredictable behavior |
| Wait for a specific font | `await document.fonts.load("700 18px Lora")` | The requested weight must match that of the text |
| Know if the fonts in progress are ready | `await document.fonts.ready` | Already resolved if nothing has been requested yet |
| React to each batch of fonts | `loadingdone`, `loadingerror` | An already obtained promise only fires once |
| Measure a text | `measureText`, `getBoundingClientRect`, `getComputedTextLength` | Measures the fallback font if the web font has not arrived |
| Load a font from the script | `new FontFace(...)`, `face.load()`, `document.fonts.add(face)` | Catching the failure: the fallback font remains |

## Pitfalls

| Pitfall | Why it is a problem | What to do |
|---|---|---|
| Writing the code twice, with `mousedown` and `touchstart` | Double code, different behaviors, compatibility events overlapping | `pointerdown`, `pointermove`, `pointerup` |
| Not listening to `pointercancel` | The drag stays stuck when the browser takes over | Undo the state on `pointerup` **and** `pointercancel` |
| Forgetting `touch-action` | On a phone, the finger scrolls the page: `pointercancel` after a few pixels | `touch-action: none` (or `pan-y`, `pan-x`) on the element being dragged |
| `touch-action: none` on large areas | The page no longer scrolls when touched | Reserve it for the element being dragged |
| Relying on `preventDefault()` for scrolling | The decision is made before the `pointermove` events | `touch-action` in CSS |
| Not capturing the pointer with a mouse | A fast movement leaves the element, the drag is interrupted | `setPointerCapture(event.pointerId)` on `pointerdown` |
| Capturing a pointer that is no longer active | The browser raises an error | Capture during the `pointerdown` |
| Keeping the capture after a cancellation by Escape | The finger is still placed: the element still receives the gesture | `releasePointerCapture` |
| Waiting for `pointerleave` or `pointerenter` elsewhere during a capture | They do not fire for the other elements | `document.elementsFromPoint(x, y)` |
| Reacting to a single pointer without testing `pointerId` | A second finger, or mouse hover, disturbs the drag | Keep `pointerId` and ignore the others |
| Testing `pointerType === "mouse"` as a general rule | A phone has no mouse; a touch computer has both | Reason by capability (`matchMedia("(hover: hover)")`) |
| Providing a hover without a touch equivalent | A finger has no hover | An equivalent on press or on keyboard |
| Reserving the drag for the pointer | A person who uses only the keyboard is excluded | A keyboard equivalent |
| `pointer-events: none` to "disable" a button | The keyboard still activates it | The `disabled` attribute |
| Measuring a text before the font | Width of the fallback font | `await document.fonts.load(...)`, then measure |
| Trusting `document.fonts.ready` called very early | Already resolved if no font has been requested yet | `document.fonts.load("700 18px Lora")` |
| Believing that a wrong font name produces an error | No message: `load()` returns an empty array, `check()` answers `true` | Check `faces.length` and the match with `@font-face` |
| Not protecting `await document.fonts.load()` | A download failure interrupts the function before the measurement | `try` / `catch`, then measure anyway |
| Not requesting the right weight | `load("16px Lora")` does not load the bold | Same weight, style and size as the text |
| Drawing a canvas once | The image never updates: the text stays in the fallback font | Wait for the font, redraw on `loadingdone` |
| Leaving `font-display: auto` | Invisible text or unpredictable layout shifts | `swap` for body text; `optional` for a comfort font |

## Best practices

| Best practice | Why |
|---|---|
| Use pointer events for every gesture (drag, draw, pinch) | One code for mouse, finger and stylus |
| Keep `click` to activate a button or a link | The keyboard and screen readers activate them too |
| Capture the pointer as soon as `pointerdown` for a drag | Tracking continues even outside the element |
| Undo the drag state in a single function called by `pointerup`, `pointercancel` and Escape | No path leaves the interface stuck |
| Keep the `pointerId` of the drag and ignore the others | A single gesture at a time, without interference |
| Set `touch-action` in CSS as soon as the element is created | The browser reads the value at the start of the gesture |
| Add a keyboard alternative to every drag | Accessibility: a pointer gesture is not within everyone's reach |
| Use `pointer-events: none` for overlaid decorations, `disabled` for inactive buttons | Clicks go through the decoration; the keyboard is properly cut off on the button |
| Choose `font-display` explicitly, `swap` for body text | No invisible text, no browser behavior to guess |
| Request the precise font with `document.fonts.load("weight size family")` before measuring | The promise covers the wanted font, not only what is already in progress |
| Protect the wait with `try` / `catch` and measure anyway | The displayed fallback font is also measurable |
| Measure what is displayed, never what we would like to display | The measurement matches the screen |
| Redraw a canvas on `loadingdone` | The canvas does not update by itself |
| Prefer `ResizeObserver` for an HTML element whose size must follow its text | It covers all causes of change, fonts included |
| Test with the font blocked or slow (network throttling in the developer tools) | The layout shift only appears with a slow connection |

## Key Takeaways

| | |
|---|---|
| **To remember** | Pointer events (`pointerdown`, `pointermove`, `pointerup`, `pointercancel`, `pointerover`, `pointerenter`, `pointerout`, `pointerleave`) group mouse, finger and stylus: `pointerType` (`mouse`, `touch`, `pen`), `pointerId` (one per finger), `isPrimary`, `clientX` and `clientY`, `pressure`. `setPointerCapture` makes the whole gesture follow an element, even outside its edges, and releases itself at the end; `touch-action` (`none`, `pan-y`, `pan-x`) lets the script, and not the browser, handle the touch gesture; `pointer-events: none` makes an element transparent to clicks. A web font arrives after the first display: the text then changes width. `font-display` sets what is displayed while waiting; `document.fonts.ready` waits for the fonts in progress, `document.fonts.load("weight size family")` requests one and waits for it, `check` queries without loading, `FontFace` and `document.fonts.add` load from JavaScript, `loadingdone` warns at each batch. `measureText`, `getBoundingClientRect` and `getComputedTextLength` measure the font displayed at that instant: we wait for the font before measuring or drawing. |
| **Pitfalls to avoid** | `pointercancel` not listened to; `touch-action` forgotten (the finger scrolls the page); `preventDefault()` taken as a remedy for scrolling; `pointerleave` expected during a capture; capture not released after Escape; `pointerType === "mouse"` assumed; drag reserved for the pointer; `pointer-events: none` used to disable a button; measurement before the font; `ready` called too early; wrong font name without error; loading failure not handled; wrong weight requested; canvas drawn only once. |
| **Best practices** | One code for all pointers; `click` to activate, `pointerdown` to drag; capture on `pointerdown`, state undone on `pointerup`, `pointercancel` and Escape; `touch-action` set in CSS; keyboard alternative; `font-display: swap` for body text; precise `document.fonts.load` followed by `try` / `catch` before any measurement; measuring what is displayed; redrawing a canvas on `loadingdone`; `ResizeObserver` for an HTML element. |
