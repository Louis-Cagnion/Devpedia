---
order: 16
---

# Browser observers and rate limiting

The [chapter on the DOM](/?c=langages&s=javascript&p=dom-et-evenements) covers events triggered by an explicit action (a click, a key press). This chapter covers two other kinds of needs: reacting to a change that is **not** a classic event (an element becoming visible, a page's content changing), and limiting how often an overly-frequently-called function actually runs.

## `IntersectionObserver`: detecting that an element becomes visible

Before `IntersectionObserver`, knowing whether an element was visible on screen required recomputing its position on every scroll event, an expensive calculation repeated in a loop. `IntersectionObserver` flips the problem: the browser itself notifies the code as soon as an element enters or leaves the visible area, with no manual recalculation.

```javascript
const sentinel = document.querySelector('.pagination-sentinel');

const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {   // the sentinel just entered the visible area
        loadNextPage();
    }
}, { rootMargin: '200px' });           // triggers 200px BEFORE the sentinel is actually visible

observer.observe(sentinel);
```

This pattern (an invisible "sentinel" at the bottom of a list, which triggers loading the next page as soon as it gets close to the visible area) implements **infinite scroll**: `rootMargin` moves the trigger earlier, so the next content is already loaded by the time the user actually reaches it, instead of afterward.

> **Best practice:** always call `observer.disconnect()` once the observation is no longer needed (all the content already loaded, the element removed from the page), to release the reference and avoid a callback that keeps running on an element that no longer needs watching.

## `MutationObserver`: reacting to a DOM change without polling in a loop

`MutationObserver` notifies the code when the DOM changes (elements added/removed, an attribute changing...), without having to check "did it change?" in a loop (*polling*):

```javascript
const container = document.getElementById('messages');

const observer = new MutationObserver(() => {
    scrollToBottom();
});

observer.observe(container, { childList: true, subtree: true });
```

`{ childList: true, subtree: true }` specifies what to watch: direct children added/removed (`childList`), including at any depth under `container` (`subtree`). Without `subtree`, a child added to a grandchild of `container` would trigger nothing.

> **Pitfall:** `MutationObserver` only detects **DOM structure** or **HTML attribute** changes. Writing `mySelect.value = "x"` changes a `<select>`'s JavaScript `value` property, but changes no HTML attribute nor the DOM's structure: no mutation is ever reported for this kind of write, even while observing `attributes: true`. See [intercepting a native property setter](/?c=langages&s=javascript&p=intercepter-un-setter-de-propriete) for the technique that fills this gap.

## `ResizeObserver`: reacting to an element's size changing

The third member of the same "callback on change, no polling" family: `IntersectionObserver` watches *visibility*, `MutationObserver` watches *DOM structure*, `ResizeObserver` watches the *dimensions* of a specific element, independently of the window's global `resize` event.

```javascript
const table = document.querySelector('.wide-table');

const observer = new ResizeObserver((entries) => {
    const width = entries[0].contentRect.width;
    table.classList.toggle('compact-mode', width < 600);   // switches as soon as space runs short
});

observer.observe(table);
```

`resize` only fires when the entire WINDOW is resized; an element can still change width for many other reasons (a sidebar appearing, a font loading, a parent's layout changing) without any `resize` firing at all. `ResizeObserver` catches those cases too, by observing the element itself directly.

> **Best practice:** prefer `ResizeObserver` over the `resize` event as soon as a layout switch depends on the space actually available to ONE specific element, not on the entire window's width (see also [container queries](/?c=langages&s=css&p=responsive-et-media-queries), the pure-CSS equivalent of the same need, with no JavaScript).

## Debounce and throttle: two ways to limit a function's rate

Some events (`resize`, `scroll`, `input`) fire dozens of times per second. Running an expensive function on every single trigger can slow down the whole page. Two techniques limit the execution rate, but with opposite logic:

| | Debounce | Throttle |
|---|---|---|
| Principle | Waits for a pause in activity before running | Runs at most once per fixed interval |
| Effect on a continuous burst | A single run, after the burst ends | Several regular runs, spaced out, during the burst |
| Typical use case | Live search (wait until the user has finished typing) | Resetting an inactivity timer (limit, without ever fully blocking) |

```javascript
// Debounce: only runs after 300ms with no new call
function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
```

```javascript
// Throttle: locks out the next calls for 1000ms after the first one
let locked = false;

function onActivity() {
    if (locked) return;
    locked = true;
    setTimeout(() => { locked = false; }, 1000);

    resetInactivityTimer();
}
```

The throttle above deliberately uses no `setInterval`: the lock is released only once, 1000ms after the burst's first call, after which the next call can go through again and starts its own new lock. This is the simplest form of a throttle (called *leading edge*: it runs immediately on the first call rather than waiting for the interval to end).

> **Pitfall:** applying a debounce where a throttle is actually needed. On an inactivity timer reset on every mouse move, a debounce would never reset anything as long as the mouse keeps moving (the pause in activity never arrives): exactly the opposite of the intended behavior.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `IntersectionObserver` detects an element's visibility with no manual scroll recalculation (infinite scroll). `MutationObserver` reacts to a DOM change without polling in a loop, but sees neither directly-assigned JS properties nor changes outside the DOM. `ResizeObserver` detects a specific element's dimensions changing, without depending on the window's `resize`. Debounce waits for a pause before running; throttle runs at most once per interval. |
| **Tools you can use** | `IntersectionObserver` (`rootMargin`, `isIntersecting`), `MutationObserver` (`childList`/`subtree`/`attributes`), `ResizeObserver` (`contentRect`), a homemade debounce/throttle via `setTimeout`. |
| **Pitfalls to avoid** | Forgetting `observer.disconnect()` once the observation is no longer needed. Waiting for a DOM mutation on a directly-assigned JS property (`select.value = x`). Confusing debounce and throttle on a repeated-reset need. |
| **Best practices** | `rootMargin` to preload before the element is actually visible. `subtree: true` as soon as the change can happen at any depth. `ResizeObserver` rather than the `resize` event for a switch that depends on one specific element's space. Choose debounce for a single final action after a burst, throttle for a steady cap during the burst. |
