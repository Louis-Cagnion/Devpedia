---
order: 19
---

# Canvas 2D and animations

The [HTML](/?c=langages&s=html&p=html) `<canvas>` element exposes a programmable drawing area, pixel by pixel, directly in JavaScript. This chapter covers its use for smooth animation (render loop, adapting to screen density) and a less obvious use: measuring text without ever displaying it.

## Getting a drawing context

```javascript
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');   // "2d": classic 2D drawing (as opposed to "webgl")

ctx.fillStyle = 'rgba(2,96,231,0.5)';
ctx.fillRect(10, 10, 100, 50);         // filled rectangle: x, y, width, height
```

## Adapting drawing to the screen's real density

A CSS pixel (the displayed size) doesn't always match a physical screen pixel: a high-density screen (Retina, for example) displays several per CSS pixel. `window.devicePixelRatio` gives that factor, to apply for a crisp render:

```javascript
function resize() {
    // cap at 2: beyond that, needless cost
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();

    // the canvas's REAL resolution (physical pixels)
    canvas.width  = Math.floor(rect.width  * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    // so later drawing can use CSS coordinates
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
```

`canvas.width`/`canvas.height` (the internal resolution, in physical pixels) are deliberately distinct from the displayed CSS size (`rect.width`/`rect.height`): without this factor, the canvas would stay crisp on a standard screen but blurry on a high-density one, its internal pixels being stretched to fill a physically larger area.

`ctx.setTransform(ratio, 0, 0, ratio, 0, 0)` then compensates for that gap: all the drawing code that follows can keep reasoning in normal CSS coordinates (`fillRect(10, 10, ...)`), without ever manually multiplying each coordinate by `ratio`.

> **Pitfall:** capping `devicePixelRatio` (here at 2) isn't a rounding mistake but a deliberate choice: beyond that, the visual gain becomes imperceptible while the number of pixels to compute keeps growing quadratically, a real cost with no visible benefit.

## The animation loop: `requestAnimationFrame`

`requestAnimationFrame(callback)` asks the browser to call `callback` right before the next screen refresh (generally 60 times per second), rather than at a fixed interval like `setInterval`:

```javascript
function frame(now) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);   // clear the previous image
    drawScene(now);
    requestAnimationFrame(frame);                        // schedule the next call
}
requestAnimationFrame(frame);
```

`now` (automatically provided by the browser, in milliseconds) lets the animation be based on **actual elapsed time** rather than the number of calls: an animation that advances by a fixed step on every call to `frame` would run faster on a 144Hz screen than a 60Hz one, whereas an animation based on `now` stays at the same perceived speed, regardless of the refresh rate.

> **Best practice:** prefer `requestAnimationFrame` over `setInterval` for any visual animation. The browser can sync the call with its own screen refresh (smoother image) and automatically suspends calls for a tab that isn't visible (resource savings), neither of which a `setInterval` ever does on its own.

## Exponential smoothing: following a target without jerkiness

Making an element (an animated cursor, a camera) follow a target position, frame after frame, without it "jumping" abruptly on every target change, often uses **exponential smoothing** (also called *lerp* in this context):

```javascript
let x = initialPosition;

function frame() {
    const target = computeNewTarget();
    x += (target - x) * 0.04;   // moves 4% of the remaining distance on every frame
    drawAt(x);
    requestAnimationFrame(frame);
}
```

On every frame, the position never jumps straight to the target: it only moves by a fraction (4% here) of the distance still separating it. The perceived effect is a movement that naturally slows down as it approaches its target, rather than an abrupt stop.

| Factor | Effect |
|---|---|
| Close to 0 (e.g. 0.01) | Very slow follow, pronounced "inertia" feel |
| Close to 1 (e.g. 0.5) | Nearly instant follow, little perceptible smoothing |

## Measuring text without ever displaying it: `measureText()`

A 2D canvas also serves, in a roundabout way, to precisely measure the width a piece of text would take with a given font, **without ever drawing or displaying that canvas**:

```javascript
// never added to the DOM
const measureCtx = document.createElement('canvas').getContext('2d');

function textWidth(text, fontSize = 11) {
    measureCtx.font = `${fontSize}px sans-serif`;
    return measureCtx.measureText(text).width;
}
```

This figure is a better replacement for a rough estimate (an average width per character) for a layout calculation that depends on a text's real width (a legend that needs to know whether it fits on one line or must wrap to the next, for example): `measureText()` uses the real font and gives the exact width that text would actually occupy on screen.

> **Pitfall:** using a font in `measureCtx.font` that differs from the one actually displayed on screen (size, font family). The measurement would then no longer be faithful to what's actually shown, which can reintroduce the very inaccuracy `measureText()` was meant to eliminate.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `devicePixelRatio` adapts a canvas to the screen's real density. `requestAnimationFrame` syncs an animation to the screen's refresh and provides a timestamp for a speed independent of the refresh rate. Exponential smoothing makes something follow a target without jerkiness. `measureText()` on a never-displayed canvas measures text precisely, without displaying it. |
| **Tools you can use** | `getContext('2d')`, `devicePixelRatio`/`setTransform`, `requestAnimationFrame`, `measureText()`. |
| **Pitfalls to avoid** | Ignoring `devicePixelRatio` (blurry rendering on a high-density screen). Animating by a fixed step per call rather than by actual elapsed time (speed dependent on refresh rate). Measuring text with a font different from the one actually displayed. |
| **Best practices** | Cap `devicePixelRatio` at a reasonable value (2, for example). Prefer `requestAnimationFrame` over `setInterval` for any visual animation. Use a smoothing factor close to 0 for a pronounced inertia effect, close to 1 for a near-instant follow. |
