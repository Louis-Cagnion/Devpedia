---
order: 9
---

# Performant CSS animations

An **animation** is a gradual change in the appearance of an element (position, size, transparency...) over a given duration. [CSS](/?c=langages&s=css&p=css) can produce them without a single line of [JavaScript](/?c=langages&s=javascript&p=javascript), but not all animations are equal: some force the browser (the software that displays web pages) to redo a lot of calculations at every instant, and the animation **stutters** (*jank*): frames arrive late, and the movement is no longer smooth. This chapter shows how to write an animation, why only two properties are really cheap, and how to avoid making people sick from motion.

It assumes you already know [selectors](/?c=langages&s=css&p=selecteurs) (including the `:hover` pseudo-class, which targets an element under the mouse pointer, and the `.name` class selector, which targets the elements whose `class` attribute contains that name), [the box model](/?c=langages&s=css&p=box-model) and [positioning](/?c=langages&s=css&p=positionnement). The JavaScript examples assume you know [HTML](/?c=langages&s=html&p=html) (the `<div>` tag, the `id` and `class` attributes), [the DOM and events](/?c=langages&s=javascript&p=dom-et-evenements), [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable), [functions](/?c=langages&s=javascript&p=fonctions) (including arrow functions `=>`), [conditions](/?c=langages&s=javascript&p=conditions) and [strings](/?c=langages&s=javascript&p=strings) with backticks.

## Two featured properties: `transform` and `opacity`

The whole chapter revolves around these two properties. `opacity` sets the transparency, from `0` (invisible) to `1` (opaque). `transform` moves, enlarges or rotates the element **on screen**, without changing the space it takes up in the page: its neighbors do not move, exactly as with `position: relative` seen in the [chapter on positioning](/?c=langages&s=css&p=positionnement). A **pixel** is the smallest dot on a screen; `px` is the unit that counts pixels.

| Value of `transform` | Effect | Example |
|---|---|---|
| `translateX(d)` | Moves horizontally (positive: to the right, negative: to the left) | `translateX(30px)`: 30 pixels to the right |
| `translateY(d)` | Moves vertically (positive: downward) | `translateY(-20px)`: 20 pixels upward |
| `scale(n)` | Multiplies the size by `n` (1: unchanged) | `scale(1.2)`: 120% of the size, `scale(0.5)`: half of it |
| `translate(x, y)` | Moves in both directions at once. A percentage is computed from the size of the element itself | `translate(-50%, -50%)`: half its width to the left and half its height upward |
| `rotate(a)` | Rotates clockwise | `rotate(45deg)`: 45 degrees (`deg`), `360deg` is a full turn |

Several functions can be combined in one value: `transform: translateX(30px) scale(1.2);`. Durations are written with `s` (second) or `ms` (millisecond, a thousandth of a second): `0.2s` equals `200ms`.

## `transition`: going from one value to another

A **transition** animates the change from one value to another when that value changes: the browser calculates all the intermediate values by itself. It needs a trigger: a hover, or a class added by [JavaScript](/?c=langages&s=javascript&p=dom-et-evenements) (`classList.add`). When the trigger disappears, the transition runs in reverse.

```css
.button {
    /* animates the `transform` property over 0.2 s, slowing down at the end (ease-out) */
    transition: transform 0.2s ease-out;
}

.button:hover {
    transform: scale(1.05);   /* on hover: 5% larger, the transition animates the change */
}
```

| Property | Role | Default value |
|---|---|---|
| `transition-property` | Which property to animate (`transform`, `opacity`...) | `all` (every property) |
| `transition-duration` | Duration of the change | `0s` (instant) |
| `transition-timing-function` | Speed curve (see the table below) | `ease` |
| `transition-delay` | Wait before starting | `0s` |

The `transition` shorthand groups them in order: property, duration, curve, delay. When it contains two durations, the first one is the duration and the second one is the delay.

## `@keyframes` and `animation`: a sequence of steps

A transition only knows two states (before, after) and waits for a trigger. For more steps, or for an animation that starts on its own when the page loads, you declare a sequence of **keyframes** (the moments at which you set the appearance) with `@keyframes`, then play it with the `animation-*` properties.

| | `transition` | `@keyframes` + `animation` |
|---|---|---|
| Number of steps | Two (start, end) | As many as you want |
| Start | A change of value (hover, class) | On its own, as soon as the rule applies |
| Repetition | No | Yes (`animation-iteration-count`) |
| Typical use | Reaction to a hover or a click | Appearance, loading, continuous movement |

```css
/* target: <div class="notification">Saved</div> */
/* @keyframes declares a named animation "appear" (the name is free) */
@keyframes appear {
    from {                              /* from: the state at the very start (same as 0%) */
        opacity: 0;                     /* invisible */
        transform: translateY(20px);    /* shifted 20 pixels downward */
    }
    to {                                /* to: the state at the end (same as 100%) */
        opacity: 1;                     /* fully visible */
        transform: translateY(0);       /* in its normal place */
    }
}

.notification {
    animation-name: appear;             /* which sequence of steps to play */
    animation-duration: 0.4s;           /* each playback lasts 0.4 s */
    animation-timing-function: ease-out;    /* speed: slows down toward the end */
    animation-delay: 0.5s;              /* waits 0.5 s before starting */
    animation-iteration-count: 1;       /* plays only once */
    animation-direction: normal;        /* from the first step to the last one */
    animation-fill-mode: backwards;     /* applies the starting state during the wait */
}
```

| Property | Role | Default | Common values |
|---|---|---|---|
| `animation-name` | Name of the `@keyframes` to play | `none` | `appear` |
| `animation-duration` | Duration of one playback | `0s` | `0.4s`, `300ms` |
| `animation-timing-function` | Speed curve | `ease` | `ease`, `linear`, `ease-out`... |
| `animation-delay` | Wait before the start (a negative value starts partway through) | `0s` | `0.5s`, `-1s` |
| `animation-iteration-count` | Number of playbacks | `1` | `3`, `0.5` (half), `infinite` |
| `animation-direction` | Playback direction | `normal` | `normal`, `reverse`, `alternate`, `alternate-reverse` |
| `animation-fill-mode` | What is displayed before and after playback | `none` | `none`, `forwards`, `backwards`, `both` |
| `animation-play-state` | Playing or paused | `running` | `running`, `paused` |

| `animation-direction` | Effect |
|---|---|
| `normal` | Each playback goes from the start to the end |
| `reverse` | Each playback goes from the end to the start |
| `alternate` | Forward, then back, then forward... (the first playback goes in the normal direction) |
| `alternate-reverse` | Back, then forward... (the first playback goes in the reverse direction) |

| `animation-fill-mode` | During the wait (`animation-delay`) | After the end |
|---|---|---|
| `none` (default) | Normal style of the element | Back to the normal style |
| `backwards` | State of the first step | Back to the normal style |
| `forwards` | Normal style of the element | Stays on the state of the last step |
| `both` | State of the first step | Stays on the state of the last step |

Without `backwards` in the example above, the notification would be visible during the 0.5 s wait, then would suddenly disappear before fading in again. Conversely, an animation that ends with `opacity: 0` becomes visible again at the end without `forwards`.

| Curve (`timing-function`) | Speed |
|---|---|
| `ease` (default) | Gradual start, fast middle, gradual end |
| `linear` | Constant |
| `ease-in` | Slow at the start, then fast |
| `ease-out` | Fast at the start, then slows down |
| `ease-in-out` | Slow at the start and at the end |
| `cubic-bezier(a, b, c, d)` | Custom curve set by four numbers |
| `steps(n)` | `n` abrupt jumps, without smoothness |

The other notations are listed on the [MDN page of `animation-timing-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/animation-timing-function) (*MDN Web Docs*, the reference documentation of the web, edited by Mozilla). The `animation` shorthand groups the properties on one line, in any order except for the two durations (the first one is the duration and the second one is the delay). With more than two steps, you place them by percentage of the time:

```css
/* a dot that grows then shrinks: three steps spread over time */
@keyframes pulse {
    0%   { transform: scale(1); }       /* at the start: normal size */
    50%  { transform: scale(1.3); }     /* halfway: 130% */
    100% { transform: scale(1); }       /* at the end: back to normal size */
}

.loading {
    /* name, duration, curve, infinite repetition: the four properties on one line */
    animation: pulse 1.2s ease-in-out infinite;
}
```

## How the browser draws a page

A screen displays a series of **images** (*frames*), like a film. The number of images displayed per second is called the **frame rate** (*FPS*, *frames per second*): most screens refresh 60 times per second ([web.dev](https://web.dev/articles/rendering-performance), Google's documentation site for the web). One second being 1,000 ms, the browser has 1,000 / 60, or about **16.7 ms**, to produce each frame. If it takes longer, it skips a frame and the animation stutters. In practice, the browser itself has work to do at every frame: web.dev advises aiming for about 10 ms for the code of the page.

**Rendering** is the work that turns HTML and CSS into pixels. It is done in chained steps, preceded by the calculation of the styles (which CSS rule applies to which element, see [the cascade](/?c=langages&s=css&p=variables-et-cascade)):

| Step | Question it answers | Remark |
|---|---|---|
| **Layout** | What size and what position for each element? | Almost always concerns the whole document: changing one element can move its neighbors and its parents |
| **Paint** | What color is each pixel? (backgrounds, text, borders, shadows) | Often the longest step |
| **Composite** | How do you stack the **layers** into one image? | The least costly. A layer is like a transparent sheet: the **GPU** (the graphics processor, see [CPU vs GPU](/?c=infrastructure-devops&s=infrastructure&p=cpu-vs-gpu)) can move it or make it transparent without redrawing it |

```
changed CSS
   |
   v
[ Layout ] --> [ Paint ] --> [ Composite ] --> screen
 size/position   fill the      stack the
 of each element pixels        layers (GPU)

width changed     : layout --> paint --> composite   (3 steps)
color changed     :            paint --> composite   (2 steps)
transform changed :                      composite   (1 step)
```

The steps are chained: if one of them has to be redone, all the following ones have to be redone too. Depending on the property that an animation changes, the browser must therefore redo one, two or three steps at every frame.

| Animated property | Steps redone at every frame |
|---|---|
| `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` | Layout, paint, composite |
| `color`, `background-color`, `border-color`, `box-shadow` (shadow around the element) | Paint, composite |
| `transform`, `opacity` | Composite only |

For a property that is not in this table, the browser's developer tools show the steps redone (see below). The table assumes that the moving element is on its own layer, which the browser usually decides by itself during a CSS animation.

## Why animate only `transform` and `opacity`

According to [web.dev](https://web.dev/articles/animations-overview), these are the only two properties that browsers animate at a low cost, for two reasons.

**Reason 1: no layout or paint to redo.** Animating `left` or `width` forces the browser to recalculate the geometry at every frame, that is 60 times per second, and to repaint. Animating `transform` only requires compositing.

**Reason 2: the work can leave the main thread.** A **thread** (an execution thread) is a sequence of instructions that the processor runs through; a program can run several of them in parallel (see [threads in C](/?c=langages&s=c&p=threads)). The browser's **main thread** runs the styles, the layout, the paint and all the JavaScript of the page, [only one at a time](/?c=langages&s=javascript&p=asynchrone). Another thread, the **compositor**, only does the compositing. The CSS animations of `transform` and `opacity` can run on this thread: they keep going even when the main thread is busy (a long JavaScript calculation, for example).

```
Animating `left` or `width`: the main thread must work at every frame
  main thread       : [layout][paint]      [layout][paint]...
  compositor thread :                [composite]                [composite]

Animating `transform` or `opacity`: the main thread stays free
  main thread       : free for JavaScript, clicks, scrolling
  compositor thread : [composite]  [composite]  [composite]...   (GPU)
```

Here is the comparison of the same movement written in two ways:

```css
/* both boxes have the same starting size */
.bad-box, .good-box {
    width: 100px;                       /* width: 100 pixels */
    height: 100px;                      /* height: 100 pixels */
    background-color: #1a4fd6;          /* blue background */
}

/* BAD: left, width and height change the layout at every frame */
.bad-box {
    position: relative;                 /* needed for `left` to have an effect */
    /* infinite alternate: endless back and forth, so that it can be observed */
    animation: move-left 2s ease-in-out infinite alternate;
}
@keyframes move-left {
    from { left: 0;     width: 100px; height: 100px; }
    to   { left: 200px; width: 150px; height: 150px; }
}

/* GOOD: a comparable movement and enlargement, without touching the layout */
.good-box {
    animation: move-transform 2s ease-in-out infinite alternate;
}
@keyframes move-transform {
    from { transform: translateX(0)     scale(1); }
    /* scale(1.5): 1.5 x 100 px = 150 px, enlarged around the center */
    to   { transform: translateX(200px) scale(1.5); }
}
```

| Desired effect | To avoid (redoes the layout) | To prefer |
|---|---|---|
| Move | `left`, `top`, `margin` | `transform: translateX()` / `translateY()` |
| Enlarge or shrink | `width`, `height` | `transform: scale()` |
| Make appear or disappear | `height` or `width` down to `0` | `opacity` |
| Animate a shadow | `box-shadow` | Place the final shadow on a [pseudo-element](/?c=langages&s=css&p=selecteurs) and animate its `opacity` |

Two limits of `scale`: it also stretches the content (the text gets distorted, and so do the rounded corners), so it suits shapes and backgrounds more than text boxes; and the space reserved in the page does not change, so the enlarged element can cover other elements. A `transform` on an ancestor also has side effects on the children in `position: fixed`, described in the [chapter on positioning](/?c=langages&s=css&p=positionnement).

The real gain depends on the page, the device and the browser: it has to be measured (see [Measure before optimizing](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser)). [The web.dev guide](https://web.dev/articles/animations-guide) describes three tools of **Chrome DevTools** (the developer tools built into Chrome, Google's browser) for checking an animation:

| Tool (DevTools panel) | What it shows |
|---|---|
| *Performance*, *Summary* tab | A non-zero value for *Rendering* means that the animation is doing layout work |
| *Rendering*, *FPS meter* checkbox | The number of frames displayed per second and the skipped frames |
| *Rendering*, *Paint Flashing* checkbox | The areas repainted at every frame (the whole screen flashing: to investigate) |

## `will-change`: warning the browser

`will-change` tells the browser which properties are going to change, so that it prepares the layer in advance. But each layer takes up memory: used badly, the property slows the page down instead of speeding it up. [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/will-change) presents it as a **last resort** against a performance problem already observed, not as a precaution. With `transform` or `opacity`, it also creates a stacking context right from the start (see the [chapter on positioning](/?c=langages&s=css&p=positionnement)).

```css
/* BAD: asks for a layer for EVERY element on the page, forever */
* {
    will-change: transform;
}
```

The good use is to set it just before the animation and to remove it just after. The 0.5 s delay of the notification leaves the browser time to prepare here:

```html
<!-- hidden: attribute that hides the element (like display: none) as long as it is present -->
<div id="notification" class="notification" hidden>Saved</div>
```

```javascript
// Finds the notification in the page
const notification = document.getElementById("notification");

function showNotification() {
    // 1. Before: warns the browser (in JavaScript, `will-change` is written `willChange`)
    notification.style.willChange = "transform, opacity";
    // 2. During: displays the element, which starts the `appear` animation
    notification.hidden = false;
    // 3. After: `animationend` is the event fired at the end of the CSS animation
    notification.addEventListener("animationend", () => {
        // `auto` gives the browser back its normal behavior
        notification.style.willChange = "auto";
    }, { once: true });   // `once: true`: this function is only called once
}
```

## `prefers-reduced-motion`: respecting those whom motion makes sick

Some people suffer from disorders of the **vestibular system** (the inner ear, which handles balance): a movement on screen, especially a large displacement or a zoom, gives them dizziness, nausea and headaches, to the point of sometimes having to lie down (according to the [WCAG](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), the reference web accessibility rules, whose levels A, AA and AAA are explained in the [chapter on accessibility](/?c=ui-ux&p=accessibilite-ux)). Others have **photosensitive epilepsy**: certain flashes trigger seizures. The operating system (Windows, macOS, Android... the basic software of the device) offers a "reduce motion" setting, which the CSS reads with the **media query** (an `@media` condition, seen in the [chapter on responsive design](/?c=langages&s=css&p=responsive-et-media-queries)) `prefers-reduced-motion`.

| Value | Meaning |
|---|---|
| `no-preference` | The user has not asked for anything |
| `reduce` | The user has asked to reduce the motion |

The setting is found here, according to [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion) (labels in their original English):

| System | Path |
|---|---|
| Windows 11 | Settings > Accessibility > Visual Effects > Animation Effects |
| macOS | System Settings > Accessibility > Display (or Motion) > Reduce motion |
| iOS | Settings > Accessibility > Motion |
| Android 9 and later | Settings > Accessibility > Remove animations |

Reducing does not mean removing everything: you remove the large movements, zooms, rotations and loops, and you keep a gentle change, such as a fade. Let's go back to `.notification`:

```css
/* a fade alone, without movement: it replaces `appear` when `reduce` is requested */
@keyframes gentle-appear {
    from { opacity: 0; }                /* invisible */
    to   { opacity: 1; }                /* visible */
}

/* @media: the rule only applies if the condition in parentheses is true */
@media (prefers-reduced-motion: reduce) {
    .notification {
        animation-name: gentle-appear;  /* no more upward slide */
        animation-duration: 0.2s;       /* shorter */
    }

    .loading {
        animation: none;                /* no loop: the dot stays still */
    }
}
```

We can also reverse the logic: the animation exists only for those who have asked for nothing, and anything that is not recognized stays still.

```css
@media (prefers-reduced-motion: no-preference) {
    .loading {
        animation: pulse 1.2s ease-in-out infinite;   /* animated only here */
    }
}
```

The [chapter on responsive design](/?c=langages&s=css&p=responsive-et-media-queries) presents a global rule (durations reduced to `0.001ms`, which keeps the `animationend` events); this example goes further by replacing the animation with a gentle variant. Three WCAG criteria concern motion:

| Criterion | Level | Requirement |
|---|---|---|
| [2.3.1 Three Flashes](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | A | Nothing flashes more than three times per second (or below the defined thresholds) |
| [2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) | A | An automatic movement lasting more than five seconds, presented with other content, must be able to be paused, stopped or hidden (unless it is essential) |
| [2.3.3 Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | AAA | A movement triggered by an interaction can be disabled (unless it is essential) |

To test, the *Rendering* panel of DevTools can emulate `prefers-reduced-motion` ([documentation](https://developer.chrome.com/docs/devtools/rendering/emulate-css)).

## Pitfalls in code

The first pitfall concerns `transform`: in a `@keyframes`, it **replaces** the `transform` value of the element, it does not add to it.

```css
/* a modal (a window placed over the page), centered: translate(-50%, -50%) brings it back
   by half of ITS width and half of ITS height */
.bad-modal, .good-modal {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.bad-modal  { animation: bad-zoom 0.3s backwards; }
.good-modal { animation: good-zoom 0.3s backwards; }

/* BAD: this value replaces the translate, the modal loses its centering */
@keyframes bad-zoom {
    from { transform: scale(0.8); }
}

/* GOOD: we repeat the translate in the starting step, then add the scale */
@keyframes good-zoom {
    from { transform: translate(-50%, -50%) scale(0.8); }
}
```

The second pitfall is a size animation: if a banner grows in height, everything that follows it in the normal flow (see [positioning](/?c=langages&s=css&p=positionnement)) moves down at every frame, and the text being read jumps. The solution is to take it out of the flow with `position: fixed`.

```css
/* BAD: the height grows, everything below is pushed back at every frame */
.bad-banner {
    height: 0;
    animation: open 0.4s forwards;      /* forwards: stays open at the end */
}
@keyframes open {
    to { height: 60px; }
}

/* GOOD: the banner is placed over the page (fixed), the rest of the page never moves */
.good-banner {
    position: fixed;                    /* taken out of the flow, stuck to the window */
    top: 0;
    left: 0;
    right: 0;
    height: 60px;                       /* its final size is reserved from the start */
    animation: slide-down 0.4s backwards;
}
@keyframes slide-down {
    from { transform: translateY(-100%); }  /* -100% of its height: just off the screen */
}
```

The third one is `transition: all`, which animates any property that changes, including those we did not foresee. `all` is also the default value of `transition-property` ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-property)): writing `transition: 0.3s` without a property name is equivalent to `transition: all 0.3s`.

```css
/* BAD: if a script changes `width` or `margin`, the layout is animated too */
.button-all { transition: all 0.3s; }

/* BAD too: without a property name, the default value is `all` */
.button-implicit { transition: 0.3s; }

/* GOOD: only the wanted properties, separated by a comma */
.button-precise { transition: transform 0.3s, opacity 0.3s; }
```

The last one is animating in JavaScript with `setInterval` (a function that calls another one at a fixed interval, to be compared with `requestAnimationFrame` in the chapter on [canvas animations](/?c=langages&s=javascript&p=canvas-2d-et-animations)). It stacks up the flaws: the code runs on the main thread, it is not synchronized with the refresh of the screen, and `left` redoes the layout at every call.

```javascript
// Finds the box (a <div id="js-box"> with `position: relative`)
const box = document.getElementById("js-box");
let leftPos = 0;                        // current horizontal position, in pixels

// BAD: called every 16 ms, unrelated to the screen
setInterval(() => {
    leftPos += 2;                       // `+= 2` adds 2 to `leftPos`
    box.style.left = leftPos + "px";    // `+` appends "px"; `left` redoes the layout
}, 16);
```

The right solution is a CSS animation (`transition` or `@keyframes`), which the browser optimizes by itself, including by lowering the frame rate of an animation in a tab that is not visible ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Animations/Using)). If JavaScript is essential (an animation driven by the mouse, for example), we use [`requestAnimationFrame`](/?c=langages&s=javascript&p=canvas-2d-et-animations) (which calls a function just before the next screen refresh) and `transform`, or the [`element.animate()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) API, which lets the browser optimize as it does in CSS.

```javascript
let start = null;                       // date of the first call, noted at the start

function advance(now) {                 // `now`: date given by the browser (ms)
    if (start === null) start = now;            // notes the start during the first call
    // Math.min keeps the smaller of the two numbers: the box stops at 200 pixels
    const leftPos = Math.min((now - start) / 10, 200);   // 1 pixel every 10 ms
    // the backticks insert the value of `leftPos` into the text, in place of ${leftPos}
    box.style.transform = `translateX(${leftPos}px)`;    // transform, not left
    if (leftPos < 200) requestAnimationFrame(advance);   // schedules the next frame
}
requestAnimationFrame(advance);         // starts
```

## Property summary

| Property | Kind | Values | Used to |
|---|---|---|---|
| `transition` | Shorthand | `transform 0.2s ease-out` | Animate the change between two values |
| `@keyframes` | Rule | `from`/`to` steps or `%` steps | Describe a sequence of steps |
| `animation` (and `animation-*`) | Shorthand | Name, duration, curve, delay, repetition... | Play a sequence of steps |
| `animation-play-state` | Property | `running`, `paused` | Pause or resume |
| `transform` | Property | `translateX()`, `scale()`, `rotate()` | Move, enlarge, rotate (compositing) |
| `opacity` | Property | `0` to `1` | Set the transparency (compositing) |
| `will-change` | Property | `transform`, `opacity`, `auto` | Prepare a layer, as a last resort |
| `@media (prefers-reduced-motion)` | Media query | `reduce`, `no-preference` | Adapt the motion to the system setting |

## Pitfalls

| Pitfall | Why it's a problem |
|---|---|
| Animating `left`, `top`, `width`, `height` or `margin` | Layout and paint redone at every frame. Use `transform` |
| Animating `box-shadow` or a color on a large element | The paint is redone at every frame. Animate the `opacity` of a pseudo-element |
| `transition: all` or `transition: 0.3s` | Any property that changes is animated, layout included. Name the properties |
| `will-change` set on everything, or never removed | Each layer costs memory. Set it before, remove it after, as a last resort |
| Animation that changes the size of an element in the flow | The content below jumps at every frame. Reserve the space, animate `transform` |
| `transform` in `@keyframes` that overrides the one of the element | The starting centering or rotation disappears. Repeat the base value |
| Forgetting `animation-fill-mode` | Element visible during the wait, or abrupt return at the end |
| `infinite` animation on content that does not need to move | Distraction, battery drained, vestibular discomfort. Reserve it for useful indicators (loading) |
| Content that flashes more than three times per second | Risk of a photosensitive epilepsy seizure (WCAG 2.3.1) |
| Animating with `setInterval` and `left` | Main thread overloaded, rhythm unrelated to the screen. Use CSS, or `requestAnimationFrame` and `transform` |
| Ignoring `prefers-reduced-motion` | Nausea and dizziness for some users |
| `animation: none` when code waits for `animationend` | The event never arrives. Reduce the duration (see the chapter on responsive design) |

## Best practices

| Best practice | Why |
|---|---|
| Animate `transform` and `opacity` only | Compositing only, work possible off the main thread |
| `transition` for a reaction, `@keyframes` for a sequence | Each tool for its own case, without JavaScript |
| Name the properties of a transition | No unintended animation |
| Aim for 60 frames per second (16.7 ms per frame) | It is the rhythm of a common screen |
| Check in the browser tools rather than assume | Only measurement shows whether the animation is smooth |
| Set `will-change` just before, remove it just after | Memory freed, layer prepared in time |
| Provide a `prefers-reduced-motion` variant for each movement | Replace large movements with a fade |
| Reserve the space of an animated element before the animation | No shift of the content |
| Limit loops to useful indicators, with a pause possible beyond 5 s | Less distraction (WCAG 2.2.2) |

## Key Takeaways

| | |
|---|---|
| **Key Points** | `transition` animates two states, `@keyframes` more steps. Rendering chains layout, paint and composite: `transform` and `opacity` only need compositing, which can leave the main thread. A screen at 60 frames per second leaves about 16.7 ms per frame. `will-change` is a last resort, set then removed. `prefers-reduced-motion: reduce` replaces the motion with a gentle change. |
| **Pitfalls to Avoid** | Animating `left`, `width` or `margin`; `transition: all`; `will-change` everywhere; a size animation that pushes the content; a `transform` in `@keyframes` that overrides the existing one; a forgotten `fill-mode`; useless loops; `setInterval`; ignoring `prefers-reduced-motion`. |
| **Best Practices** | `transform` and `opacity` only, named properties in transitions, reserved space, gentle variant for `reduce`, checking in the browser tools, rare and temporary `will-change`. |
