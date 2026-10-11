---
order: 8
---

# Dynamic ARIA and keyboard focus management

The chapter [data-* Attributes and Accessibility (ARIA)](/?c=langages&s=html&p=attributs-data-et-accessibilite) presented `aria-label` and `aria-expanded`. **ARIA** (*Accessible Rich Internet Applications*) is a set of [attributes](/?c=langages&s=html&p=structure-dun-document) for [HTML](/?c=langages&s=html&p=html) that describe to an **assistive technology** what the page does not say about itself. An assistive technology is a piece of software or hardware that helps a person with a disability use a computer; the most common one is the **screen reader**, which reads the page aloud or displays it in braille.

This chapter covers two situations that the previous chapter does not address: the page that changes after it has loaded (a message appears, an area gets blocked), and the user who has only the keyboard. For this user, **focus** is the element that receives key presses at a given moment (a link, a button, a field). The **Tab** key moves focus to the next interactive element (Shift+Tab moves it to the previous one); an element is **interactive** when you can activate it or fill it in.

The code examples assume that you already know [the DOM and events](/?c=langages&s=javascript&p=dom-et-evenements), [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [functions](/?c=langages&s=javascript&p=fonctions), [loops](/?c=langages&s=javascript&p=boucles), [arrays](/?c=langages&s=javascript&p=tableaux) and [conditions](/?c=langages&s=javascript&p=conditions) (including the `?.` and `??` operators) in [JavaScript](/?c=langages&s=javascript&p=javascript), as well as the tags [`<p>` and `<ul>`](/?c=langages&s=html&p=balises-de-texte), [`<div>`](/?c=langages&s=html&p=semantique-html5) and [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite).

## From HTML to assistive technology

The browser (the software that displays web pages) turns the HTML into the [DOM](/?c=langages&s=javascript&p=dom-et-evenements). It applies the styles written in [CSS](/?c=langages&s=css&p=css) for display. From the DOM, it also builds the **accessibility tree**: a simplified list of the elements with, for each one, its name, its **role** (what it is: button, link, tab...) and its state. It is this tree, not the screen, that the assistive technology reads.

```
HTML --> DOM --+--> display on screen (with styles)
               |
               +--> accessibility tree --> screen reader
                    (name, role, state)

aria-* and role: change the accessibility tree, not the screen
inert          : blocks clicks and focus AND removes from the tree, the screen does not change
display: none  : removes from the screen, so also from the tree
```

## `aria-live`: announcing a change without moving focus

A screen reader reads only one place on the page at a time. If a text changes somewhere else ("12 results found"), it does not say so. `aria-live` declares a **live region**: an area whose content changes are announced, without focus moving there.

| Value | Effect | When to use it |
|---|---|---|
| `off` (default) | Nothing is announced, unless focus is inside the area | Frequent, non-essential updates (live score) |
| `polite` | Announced at the next calm moment (end of the current sentence, pause in typing) | The general case: results, "Saved" |
| `assertive` | Announced immediately, possibly interrupting what is being read | Urgency only: time almost up |

```html
<!-- The region exists as soon as the page loads, and it is EMPTY -->
<p id="status" aria-live="polite"></p>
```

```javascript
// Finds the region by its identifier
const status = document.getElementById("status");
// The text changes: the screen reader announces it, the focus does not move
status.textContent = "12 results found";
```

Announcements only cover a **change** in a region that the browser already knows. Creating the region with its content therefore produces nothing to announce:

```javascript
// Gets the message container: a <div id="container"> already in the page
const container = document.getElementById("container");

// WRONG: the region is born with its text, so there is no change to announce
container.innerHTML = '<p aria-live="polite">12 results found</p>';

// GOOD: the `status` region already existed, empty; we only change its text
status.textContent = "12 results found";
```

The most reliable approach is to put the region in the original HTML: creating it in JavaScript requires waiting before filling it, and the behavior varies depending on the browser and the screen reader, as explained in [the live regions guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) on MDN (*MDN Web Docs*, the reference documentation of the web, edited by Mozilla). By default, only the changed part is read; [`aria-atomic="true"`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-atomic) makes the whole region be read again.

## `aria-current`: marking the current item of a set

In a group of related items (the `<a>` links of a [`<nav>`](/?c=langages&s=html&p=semantique-html5) navigation area, the steps of a process), one of them is "the current one". A visual style (bold, underline) says nothing to a screen reader: `aria-current` announces this information. Only one element per set carries the mark.

| Value | Designates | Example |
|---|---|---|
| `page` | The current page in a set of pages | Link to the page displayed in a menu |
| `step` | The current step of a process | Step 2 of an order process |
| `location` | The current location in an environment | Element highlighted in a diagram |
| `date` | The current date in a set of dates | Today in a calendar |
| `time` | The current time in a set of times | Current slot in a timetable |
| `true` | The current item, without further detail | No value above fits |
| `false` (default) | Not the current item | Same as the attribute being absent |

```html
<!-- <nav>: navigation area; aria-label: its name, as seen in the previous chapter -->
<nav aria-label="Main navigation">
    <ul>
        <li><a href="/home">Home</a></li>
        <!-- aria-current="page": the screen reader says "current page" for this link -->
        <li><a href="/lessons" aria-current="page">Lessons</a></li>
        <li><a href="/contact">Contact</a></li>
    </ul>
</nav>
```

A [CSS attribute selector](/?c=langages&s=css&p=selecteurs) can read `aria-current` to style the current link:

```css
/* The attribute selector reads aria-current: one source for style and meaning alike */
nav a[aria-current="page"] {
    font-weight: bold;                 /* bold text */
    border-bottom: 3px solid #1a4fd6;  /* 3-pixel blue line under the link */
}
```

```javascript
// Moves the mark when the navigation changes, without reloading the page
function markCurrent(newLink) {
    // Finds the link currently marked in the navigation
    const previous = document.querySelector('nav [aria-current="page"]');
    // Removes its mark (the `?.` does nothing if there was none)
    previous?.removeAttribute("aria-current");
    // Puts the mark on the new link
    newLink.setAttribute("aria-current", "page");
}
```

For a tab, a list option or a table row, the correct mark is `aria-selected` (see below), not `aria-current`.

## `role`: saying what an element is when the HTML does not

The `role` attribute sets the role of an element in the accessibility tree. **First rule of ARIA**: if a native HTML element exists for the need, use it instead of a `role` (see the "golden rule" of the [previous chapter](/?c=langages&s=html&p=attributs-data-et-accessibilite)). A `role` changes what is announced, never the behavior: the keyboard support still has to be coded.

| Need | Native element to prefer | `role` only if no native element exists |
|---|---|---|
| Button | [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite) | `role="button"` |
| Link | [`<a href>`](/?c=langages&s=html&p=liens-et-images) | `role="link"` |
| Navigation area | [`<nav>`](/?c=langages&s=html&p=semantique-html5) | `role="navigation"` |
| Urgent message appearing dynamically | None | `role="alert"` |
| Discreet status message | None | `role="status"` |
| Tabs | None | `tablist`, `tab`, `tabpanel` |

| Role | Meaning | Implicit live behavior |
|---|---|---|
| `alert` | Important and urgent message | `aria-live="assertive"` and `aria-atomic="true"` |
| `status` | Useful information, not urgent | `aria-live="polite"` and `aria-atomic="true"` |
| `tablist` | Container of a group of tabs | None |
| `tab` | A tab, which displays a panel | None |
| `tabpanel` | The content associated with a tab | None |

```html
<!-- Two empty regions as soon as the page loads, each with its role -->
<div id="error" role="alert"></div>
<div id="saved" role="status"></div>
```

```javascript
// Interrupts the current reading: reserved for what is urgent
document.getElementById("error").textContent = "Invalid email address";
// Announced at the next calm moment, without interrupting
document.getElementById("saved").textContent = "Draft saved";
```

`role="alert"` applies only to text (never to a link or a button), should be used sparingly, and targets content displayed dynamically, not a message already present when the page loads ([MDN page for the `alert` role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/alert_role)). The tab roles are implemented further down.

## `inert`: making an area dead

`inert` is a **boolean** attribute (its mere presence activates it, it has no value: `<div inert>`). It makes the element and all its descendants **inert**: not clickable, not focusable (so skipped by Tab), not selectable, not found by the browser's search, and absent from the accessibility tree. They remain visible on screen. The attribute has been available in all major browsers since April 2023 ([MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/inert)).

Its typical use is the background of a **modal dialog box**: a window shown over the page that blocks everything else as long as it is open. The native element exists: the [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog) tag, opened by its `showModal()` method (a method is a function attached to an element), makes the rest of the page inert, and also handles the Escape key and the initial focus. For a panel that is not a `<dialog>` (here a side panel, an [`<aside>`](/?c=langages&s=html&p=semantique-html5)), you set `inert` yourself:

```html
<!-- The whole background is grouped in a single container -->
<div id="page">
    <button id="open">Open the panel</button>
    <p>Page content.</p>
</div>

<!-- The panel is OUTSIDE #page: otherwise it would become inert along with it -->
<!-- hidden: boolean attribute that hides the panel until it is opened -->
<aside id="panel" aria-label="Settings" hidden>
    <button id="close">Close</button>
</aside>
```

```css
/* Visual signal: without it, nothing shows that an area has become dead */
[inert] { opacity: 0.5; }
```

```javascript
// Finds the four elements by their identifier
const page = document.getElementById("page");
const panel = document.getElementById("panel");
const openButton = document.getElementById("open");
const closeButton = document.getElementById("close");

openButton.addEventListener("click", () => {
    page.inert = true;        // the property `inert` sets the attribute: page blocked
    panel.hidden = false;     // shows the panel (`hidden`: attribute that hides the element)
    closeButton.focus();            // puts focus in the panel, outside the inert area
});

closeButton.addEventListener("click", () => {
    page.inert = false;       // the page becomes usable again
    panel.hidden = true;      // hides the panel
    openButton.focus();             // gives focus back to the button that opened the panel
});
```

Three mechanisms "hide" something, but not in the same way. `display: none` is a [CSS](/?c=langages&s=css&p=css) property that removes the element from the display; `hidden` produces the same effect by default; `aria-hidden="true"` removes the element from the accessibility tree only.

| | `inert` | `aria-hidden="true"` | `display: none` or `hidden` |
|---|---|---|---|
| Visible on screen | Yes | Yes | No |
| Reachable by Tab / focusable | No | **Yes**, still focusable | No |
| Clickable | No | Yes | No |
| Read by the screen reader | No | No | No |

`aria-hidden="true"` on an area that contains focusable elements therefore creates a trap: focus can enter an element that the screen reader no longer exposes ([MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-hidden)). To block a background, `inert` is the right tool.

## `:focus-visible`: the focus ring, only when it helps

The **focus ring** is the outline that the browser draws around the element that has focus, so that the keyboard user can see where they are. It is an `outline`: a CSS property that draws a line around an element without changing its size. The [pseudo-classes](/?c=langages&s=css&p=selecteurs) `:focus` and `:focus-visible` target the focused element: the first always does, the second only when the browser judges that the focus must be made visible.

| Situation | `:focus` | `:focus-visible` |
|---|---|---|
| Tab to a button | Applies | Applies |
| Mouse click on a button | Applies | Generally not |
| Click in an input field | Applies | Applies (the browser signals focus in a field) |

```css
/* WRONG: removes the ring for everyone, the keyboard user no longer sees where they are */
button:focus { outline: none; }

/* GOOD: a clear ring, only when the browser judges that it helps */
button:focus-visible {
    outline: 3px solid #1a4fd6;  /* solid dark blue line, 3 pixels */
    outline-offset: 2px;         /* moves the line 2 pixels away so it does not touch */
}
```

Removing the focus indicator without replacing it makes the page unusable with the keyboard: this goes against success criterion 2.4.7 "Focus Visible" (level AA) of the WCAG, the reference web accessibility guidelines ([criterion](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), [conformance levels](/?c=ui-ux&p=accessibilite-ux)). The replacement must also have good contrast, at least 3 to 1 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:focus-visible)); [contrast ratios](/?c=ui-ux&p=couleur-et-contraste) are detailed in their own chapter.

## One Tab stop per group: the "roving tabindex"

In a bar of **tabs** (a row of buttons, each of which displays a content panel), leaving every tab reachable by Tab costs one press per tab to cross it: ten tabs, ten presses. The convention is to treat the group as **a single Tab stop** (a place where focus stops) and to move inside it with the arrow keys. The technique is called *roving tabindex* ("moving tabindex") and relies on the `tabindex` attribute, which sets whether an element can receive focus and whether it is reachable by Tab:

| `tabindex` | Focus by click or `.focus()` | Reachable by Tab |
|---|---|---|
| Absent | Only if the element is natively interactive (button, link, field) | Yes, if native |
| `0` | Yes | Yes, in HTML order |
| `-1` | Yes | **No** |
| Positive (`1`, `2`...) | Yes | Yes, but before all the others: the HTML order is disrupted, to avoid |

```
Without roving tabindex (all the tabs at tabindex="0"):

  Tab -> [ HTML ] -Tab-> [ CSS ] -Tab-> [ JS ] -Tab-> [ panel ] -Tab-> rest of the page

With roving tabindex (only the active tab at tabindex="0"):

  Tab -> [ HTML ] ----------------------Tab-----------> [ panel ] -Tab-> rest of the page
           ^   |  right/left arrows, Home, End
           |   v
        [ CSS ]  [ JS ]   (tabindex="-1": focusable by script, skipped by Tab)
```

The keys follow the [APG tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) (*ARIA Authoring Practices Guide*, the best practices guide for ARIA published by the W3C, the organization that standardizes the web), here with automatic activation: the tab that receives focus is displayed immediately, which is recommended when the panel appears without delay.

| Key | Effect |
|---|---|
| Tab | Enters the bar on the active tab; from the bar, moves to the panel |
| Right arrow | Next tab (after the last one, back to the first) |
| Left arrow | Previous tab (before the first one, jumps to the last) |
| Home / End | First / last tab (optional) |

The native `<button>` gives click, Enter and Space for free; `role="tab"` only replaces what is announced.

| Element | Attribute | Role |
|---|---|---|
| Container | `role="tablist"` | Group of tabs |
| Container | `aria-label` | Name of the group |
| Each tab | `role="tab"` | One tab |
| Each tab | `aria-selected` | `true` on the active one, `false` on the others |
| Each tab | `aria-controls` | `id` of the panel it controls |
| Each tab | `tabindex` | `0` on the active one, `-1` on the others |
| Each panel | `role="tabpanel"` | Content of a tab |
| Each panel | `aria-labelledby` | `id` of the tab: its name comes from it |
| Each panel | `tabindex="0"` | Makes the panel reachable by Tab from the bar, when its content does not start with a focusable element |
| Inactive panels | `hidden` | Hidden |

```html
<!-- The tab group: a single Tab stop, named "Web languages" -->
<div role="tablist" aria-label="Web languages" id="tabs">
    <!-- Active tab: selected and reachable by Tab (tabindex="0") -->
    <button role="tab" id="tab-html" aria-selected="true"
            aria-controls="panel-html" tabindex="0">HTML</button>
    <!-- Other tabs: not selected, skipped by Tab (tabindex="-1") -->
    <button role="tab" id="tab-css" aria-selected="false"
            aria-controls="panel-css" tabindex="-1">CSS</button>
    <button role="tab" id="tab-js" aria-selected="false"
            aria-controls="panel-js" tabindex="-1">JavaScript</button>
</div>

<!-- Visible panel, associated with the HTML tab -->
<div role="tabpanel" id="panel-html" aria-labelledby="tab-html" tabindex="0">
    HTML describes the structure of the page.
</div>
<!-- Panels of the inactive tabs: hidden by the hidden attribute -->
<div role="tabpanel" id="panel-css" aria-labelledby="tab-css" tabindex="0" hidden>
    CSS describes the appearance.
</div>
<div role="tabpanel" id="panel-js" aria-labelledby="tab-js" tabindex="0" hidden>
    JavaScript describes the behavior.
</div>
```

```css
/* The style reads the ARIA state: the selected tab is underlined */
[role="tab"][aria-selected="true"] { border-bottom: 3px solid #1a4fd6; }
```

```javascript
// The bar and the list of its tabs (the `...` copies the list into a real array)
const bar = document.getElementById("tabs");
const tabs = [...bar.querySelectorAll('[role="tab"]')];

// Displays the chosen tab, hides the others and makes the Tab stop "travel"
function activate(target) {
    for (const tab of tabs) {
        // true (boolean) for only one tab: the one we activate
        const active = tab === target;
        // String() converts the boolean to text, because an attribute value is text
        tab.setAttribute("aria-selected", String(active));
        // The tabIndex property is the tabindex attribute: only the active one stays in Tab
        tab.tabIndex = active ? 0 : -1;
        // Finds the panel through the id that `aria-controls` designates
        const panel = document.getElementById(tab.getAttribute("aria-controls"));
        // Only the panel of the active tab is visible
        panel.hidden = !active;
    }
}

// A click on a tab activates it
bar.addEventListener("click", (event) => {
    // `event.target`: the element clicked; `includes` checks that it is indeed a tab
    if (tabs.includes(event.target)) {
        activate(event.target);
    }
});

// The keyboard keys, listened to on the whole bar
bar.addEventListener("keydown", (event) => {
    const last = tabs.length - 1;                 // position of the last tab
    const position = tabs.indexOf(event.target);  // position of the focused tab
    let next = -1;                                // -1: no key handled

    if (event.key === "ArrowRight") {
        next = position === last ? 0 : position + 1;  // after the last: the first
    } else if (event.key === "ArrowLeft") {
        next = position === 0 ? last : position - 1;  // before the first: the last
    } else if (event.key === "Home") {
        next = 0;                                 // first tab
    } else if (event.key === "End") {
        next = last;                              // last tab
    }

    if (next === -1) return;      // other key: we exit, Tab keeps its normal role
    event.preventDefault();       // prevents Home/End from scrolling the page
    activate(tabs[next]);         // activates the target tab (state, tabindex, panel)
    tabs[next].focus();           // moves focus onto it
});
```

According to the [APG keyboard guide](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/), groups of [radio buttons](/?c=langages&s=html&p=formulaires) follow the same convention of a single Tab stop.

## Keeping focus when the layout changes

Focus is attached to a specific element. If the element is removed (a list redrawn with `innerHTML`, a part of the page replaced), the browser sends focus back to the [`<body>`](/?c=langages&s=html&p=structure-dun-document): the keyboard user loses their position ([APG keyboard guide](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)). An element hidden by `display: none` can no longer be focused either.

| Situation | Strategy |
|---|---|
| Data refreshed, same elements | Do not recreate the nodes (the DOM elements): update their text or attributes, focus stays in place |
| List fully redrawn | Remember the focused element by a stable identifier (`data-id`), redraw, then refocus the new equivalent element |
| Element removed | Deliberately move focus to a logical neighbor (the next one, otherwise the previous one) |
| Panel or dialog closed | Give focus back to the element that opened it (see `inert`) |
| Change of [breakpoint](/?c=langages&s=css&p=responsive-et-media-queries) | Adapt the appearance in CSS on the same elements rather than destroying and recreating them in JavaScript |

`document.activeElement` is the property that returns the element that has focus ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/activeElement)). The example uses [`dataset`](/?c=langages&s=html&p=attributs-data-et-accessibilite) to link each button to its task, [backticks](/?c=langages&s=javascript&p=strings) to insert a variable into a text, and `?.` and `??` as seen in [conditions](/?c=langages&s=javascript&p=conditions).

```html
<!-- The list is filled by the JavaScript -->
<ul id="list"></ul>
```

```javascript
// Each task has a stable identifier (id): it survives redraws
let tasks = [
    { id: 1, text: "Write the chapter" },
    { id: 2, text: "Proofread" },
    { id: 3, text: "Publish" },
];
const list = document.getElementById("list");

// Redraws the whole list: the old buttons are destroyed, new ones are created
function render() {
    list.innerHTML = "";                             // empties the list (destroys the buttons)
    for (const task of tasks) {                       // one row per task
        const item = document.createElement("li");    // creates the list item
        const button = document.createElement("button");  // creates its button
        button.dataset.id = task.id;                  // data-id: links the button to the task
        button.textContent = `Finish: ${task.text}`;  // text of the button
        item.appendChild(button);                     // puts the button in the item
        list.appendChild(item);                       // puts the item in the list
    }
}

// Refocuses the button of a task; does nothing if that button does not exist
function focusTask(id) {
    list.querySelector(`[data-id="${id}"]`)?.focus();
}

// Case A: redraw without deletion, the focus must stay on the same task
function refresh() {
    const remembered = document.activeElement.dataset.id;  // 1. notes the id (or undefined)
    render();                                              // 2. redraws: focus lost here
    focusTask(remembered);                                 // 3. refocuses the new button
}

// Case B: a click finishes the task; the focus moves to the neighboring task
list.addEventListener("click", (event) => {
    if (!event.target.dataset.id) return;                  // click outside a button: we exit
    const id = Number(event.target.dataset.id);            // Number(): text -> number
    const rank = tasks.findIndex((task) => task.id === id);  // position of the clicked task
    tasks = tasks.filter((task) => task.id !== id);        // copy without the finished task
    render();                                              // redraws the list
    const neighbor = tasks[rank] ?? tasks[rank - 1];       // the next one, else the previous
    if (neighbor) focusTask(neighbor.id);                  // if the list is not empty
});
```

When the last task disappears, there is no neighbor left: the focus must then be placed elsewhere, for example on an "Add a task" button.

## Summary of the tools

| Tool | Nature | Values or usage | Used for |
|---|---|---|---|
| `aria-live` | ARIA attribute | `off`, `polite`, `assertive` | Announcing a change without moving focus |
| `aria-atomic` | ARIA attribute | `true` | Reading the whole live region again |
| `aria-current` | ARIA attribute | `page`, `step`, `location`, `date`, `time`, `true`, `false` | Marking the current item of a set |
| `aria-selected` | ARIA attribute | `true`, `false` | Marking the selected tab |
| `aria-hidden` | ARIA attribute | `true` | Removing from the accessibility tree, without blocking focus |
| `role` | HTML attribute | `alert`, `status`, `tablist`, `tab`, `tabpanel` | Giving a role when no native element exists |
| `inert` | Boolean attribute | Present or absent | Making an area non-clickable, non-focusable, unread |
| `tabindex` | HTML attribute | `0`, `-1` | Setting access by Tab |
| `:focus-visible` | CSS pseudo-class | With `outline` | Displaying the focus ring for the keyboard |

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| Creating the live region with its content | There is no change to announce. Put it in the original HTML, empty, then change its text |
| `aria-live` on an area that changes constantly | A flood of announcements drowns the user. Use `off` or announce only a summary |
| `assertive` or `role="alert"` everywhere | Every announcement interrupts reading. Reserve them for emergencies, otherwise `polite` or `status` |
| Marking the active page by style alone | The screen reader knows nothing about it. Add `aria-current`, once per set |
| `aria-current` instead of `aria-selected` on a tab | The two do not have the same meaning: a tab is marked with `aria-selected` |
| A `role` without the behavior that goes with it | The role announces a button or a tab, but the keyboard does not work. Prefer the native element |
| `aria-hidden="true"` on focusable content | Focus then enters while nothing is read. Use `inert` or `hidden` |
| `inert` without a visual sign, or set on an ancestor of the panel to focus | The user does not understand why the area no longer reacts, and the panel becomes inert along with it |
| `outline: none` without replacement | The keyboard cannot see the focus. Use `:focus-visible` with a contrasting outline |
| `tabindex="0"` on all tabs, or a positive `tabindex` | Too many Tab stops, or an order that no longer follows the HTML |
| Redrawing a list without refocusing | Focus falls back to `<body>` and the user loses their place |
| Believing that an ARIA behavior is identical everywhere | It varies by browser and screen reader. Test with real screen readers, not only with the keyboard |

## Best practices

| Best practice | Why |
|---|---|
| Choose the native element first (`<button>`, `<a>`, `<dialog>`, [`<details>`](/?c=langages&s=html&p=semantique-html5)) | It provides role, keyboard and focus without a single line of ARIA code |
| Declare live regions in the original HTML, with short messages | It is the only reliable way for them to be monitored from the start |
| Use `polite` by default | Announces without cutting off the user's speech |
| Have the state read both by style and by ARIA (`[aria-current="page"]`, `[aria-selected="true"]`) | One source of truth: appearance and announcement never diverge |
| For a modal area, use `<dialog>` or `inert`, then give focus back to the trigger | The background is blocked and the user finds their place again when closing |
| Replace the focus ring with a contrasting `:focus-visible`, never remove it | The keyboard user always sees where they are |
| Group of related items (tabs, radio buttons): one Tab stop, arrow keys | Crossing the group costs only one press of Tab |
| Refocus by stable identifier after a redraw | Focus no longer depends on a destroyed node |
| Test with the keyboard alone (Tab, Shift+Tab, arrows, Escape), then with a screen reader | Only this test reveals lost focus or a missing announcement |

## Key Takeaways

| | |
|---|---|
| **Key Points** | `aria-live` announces a change without moving focus; `aria-current` marks the current item; `role` is used only when no native element exists; `inert` blocks a whole area; `:focus-visible` draws the keyboard focus ring; a group of related items is only one Tab stop (`tabindex` `0` on the active one, `-1` on the others); focus is remembered and restored when the elements are recreated. |
| **Pitfalls to Avoid** | Live region created with its content, excessive `assertive`, style without `aria-current`, `aria-hidden` on focusable content, invisible `inert`, `outline: none` alone, `tabindex="0"` everywhere, focus lost after a redraw. |
| **Best Practices** | Native element first, live region in the original HTML, `polite` by default, `inert` or `<dialog>` for the background, contrasting focus ring, refocus by stable identifier, test with the keyboard and a screen reader. |
