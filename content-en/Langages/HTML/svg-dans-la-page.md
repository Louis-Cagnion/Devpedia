---
order: 9
---

# SVG Written Directly in the Page

An **SVG** (*Scalable Vector Graphics*) is an image that you **describe with shapes** (a rectangle here, a circle there, a line between two points) instead of building it from colored dots. The browser (the software that displays web pages) redraws these shapes at the size you need: the image stays sharp from the tiny icon to the giant poster. This chapter shows how to write an SVG **in the page's code**, draw it with the basic shapes, place text in it, animate it, make it accessible and react to clicks.

It assumes you already know [HTML tags and attributes](/?c=langages&s=html&p=structure-dun-document) (a tag is a word between `<` and `>` that creates an element; an attribute is a setting written in the opening tag, in the form `name="value"`), [the syntax of a CSS rule](/?c=langages&s=css&p=selecteurs), and, for the JavaScript examples, [the DOM and events](/?c=langages&s=javascript&p=dom-et-evenements), [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) and [functions](/?c=langages&s=javascript&p=fonctions).

## Vector or Pixel Image

A **pixel** is the smallest dot on a screen. A JPEG or PNG image (two image file formats; we speak of a **raster** image) stores the color of each pixel: when enlarged, it becomes blurry or stair-stepped. A **vector** image stores drawing instructions: when enlarged, the browser recalculates the drawing, which stays sharp.

| | Raster image (PNG, JPEG) | Vector image (SVG) |
|---|---|---|
| What is stored | The color of each pixel | Shapes and their coordinates |
| When enlarged | Blurry | Sharp |
| File size | Grows with the number of pixels | Grows with the number of shapes |
| Ideal for | Photographs, textures | Icons, logos, diagrams, charts |
| Modifiable by CSS or JavaScript | No | Yes (if the SVG is in the page) |

An SVG can get into a page in several ways:

| Method | Syntax | What the page can do with it |
|---|---|---|
| File loaded by `<img>` | `<img src="logo.svg" alt="Logo">` (see [images](/?c=langages&s=html&p=liens-et-images)) | No styling or scripting from the page; the browser keeps it in the **cache** (a saved copy so it does not have to be downloaded again) |
| CSS background image | `background-image: url(logo.svg)` | Same: a fixed image |
| **Written in the page** | An `<svg>` tag in the HTML | Each shape is an element of the [DOM](/?c=langages&s=javascript&p=dom-et-evenements): styleable in CSS, modifiable in JavaScript, animatable, with text readable by a [screen reader](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier) |
| `<canvas>` | See [Canvas 2D](/?c=langages&s=javascript&p=canvas-2d-et-animations) | A pixel drawing: faster for thousands of elements, but no shape exists anymore once drawn |

Writing the SVG in the page also avoids a **request** (a file request sent to the server, see [the API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http)). The trade-off: the image's code makes the HTML heavier and is not cached separately. It is therefore reserved for icons, diagrams and charts that the page must style, animate or read by script.

## A First SVG

```html
<!-- width and height: the display size, in pixels (200 wide, 100 high) -->
<!-- viewBox: the internal drawing space (explained in the next section) -->
<svg width="200" height="100" viewBox="0 0 200 100">
    <!-- rect: a rectangle; x and y: its top-left corner; fill: its color -->
    <rect x="0" y="0" width="200" height="100" fill="#e8eefc"/>
    <!-- circle: a circle; cx and cy: its center; r: its radius (half the diameter) -->
    <circle cx="100" cy="50" r="30" fill="#1a4fd6"/>
</svg>
```

The rectangle covers the whole surface (from 0 to 200 in width, from 0 to 100 in height) in a very light blue; the dark blue disc is centered at the point (100, 50), so it occupies 70 to 130 in width and 20 to 80 in height. The `/>` at the end of a tag closes it on itself, as with `<img>`, since a shape has no content.

In an HTML page, no extra setting is needed. A standalone `.svg` file, however, requires the attribute `xmlns="http://www.w3.org/2000/svg"` on `<svg>` (an address that names the SVG vocabulary), explained in [the pitfalls](#pitfalls).

## `viewBox`: the Coordinate System

To place a shape, you need a frame of reference. The SVG one starts at the **top-left corner**, at the point (0, 0). The `x` coordinate grows to the right, and the `y` coordinate grows **downward** (the opposite of a math graph).

```
(0,0) ---------- x increases to the right --------->
  |
  |        (70,20)          (130,20)
  |           +-----------------+
  |           |                 |       square containing
  y increases |     (100,50)    |       the circle: its center
  downward    |                 |       is at (100,50)
  |           +-----------------+
  |        (70,80)          (130,80)
  v
```

The `viewBox` attribute sets this drawing space. It contains four numbers: `min-x min-y width height`, that is, the top-left corner of the visible area followed by its dimensions, in **user units** (the drawing's own units, with no fixed link to pixels). The browser stretches this space so that it fills the display size `width` × `height`. This stretching is called **scaling**.

```html
<!-- Same drawing (circle of radius 20 centered at 50,25) in a 100 x 50 space -->
<!-- Displayed at 100 x 50 pixels: one unit = 1 pixel (scale 1) -->
<svg width="100" height="50" viewBox="0 0 100 50">
    <circle cx="50" cy="25" r="20" fill="#1a4fd6"/>
</svg>

<!-- Displayed at 400 x 200 pixels: one unit = 4 pixels (scale 4), same drawing, sharp -->
<svg width="400" height="200" viewBox="0 0 100 50">
    <circle cx="50" cy="25" r="20" fill="#1a4fd6"/>
</svg>
```

| `viewBox` | `width` × `height` | Scale | Result |
|---|---|---|---|
| `0 0 100 50` | 100 × 50 | 1 | 1 unit = 1 pixel |
| `0 0 100 50` | 400 × 200 | 4 | The drawing is enlarged 4 times, without loss of sharpness |
| `0 0 200 100` | 100 × 50 | 0.5 | The drawing is halved |
| Missing | 100 × 50 | 1, fixed | No scaling: the SVG no longer adapts to another size |
| `10 10 50 50` | 100 × 100 | 2 | Only the 50 × 50 square starting at (10, 10) is visible: the rest of the drawing is cut off |

If the proportions of the `viewBox` and of `width` × `height` differ, the `preserveAspectRatio` attribute decides what happens next. Its default value (`xMidYMid meet`) keeps the proportions of the drawing and centers it in the area, even if this leaves empty bands; the list of values is in the [MDN page](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/preserveAspectRatio).

For an SVG to adapt to its container (a phone or computer screen, see [responsive design](/?c=langages&s=css&p=responsive-et-media-queries)), keep the `viewBox` and set the size in CSS:

```css
.diagram {
    width: 100%;        /* takes up the full width of its container */
    max-width: 400px;   /* without exceeding 400 pixels */
    height: auto;       /* the height follows the proportions of the viewBox */
}
```

## The Basic Shapes

```html
<!-- viewBox 0 0 400 200: a drawing space of 400 units by 200 -->
<svg viewBox="0 0 400 200" width="400" height="200">
    <!-- rect: corner (10,10), 80 wide, 60 high; rx: rounded corners of 8 -->
    <rect x="10" y="10" width="80" height="60" rx="8" fill="#1a4fd6"/>
    <!-- circle: center (140,40), radius 30: it goes from x=110 to x=170 -->
    <circle cx="140" cy="40" r="30" fill="#c0392b"/>
    <!-- ellipse: a flattened circle; rx: horizontal radius 45; ry: vertical radius 25 -->
    <ellipse cx="230" cy="40" rx="45" ry="25" fill="#2e8b57"/>
    <!-- line: segment from (300,10) to (380,70); stroke: the color of the line -->
    <!-- without stroke, a line is invisible; stroke-width: thickness of the line -->
    <line x1="300" y1="10" x2="380" y2="70" stroke="#333" stroke-width="4"/>
    <!-- polyline: segments joining the listed points, without closing the shape -->
    <!-- fill="none": no fill, only the line -->
    <polyline points="10,150 40,100 70,150 100,100 130,150"
              fill="none" stroke="#1a4fd6" stroke-width="4"/>
    <!-- polygon: like polyline, but the last point connects back to the first -->
    <polygon points="170,150 200,100 230,150" fill="#e0a800"/>
</svg>
```

| Shape | Main attributes | What they set |
|---|---|---|
| `rect` | `x`, `y`, `width`, `height`, `rx`, `ry` | Top-left corner, dimensions, corner rounding |
| `circle` | `cx`, `cy`, `r` | Center and radius |
| `ellipse` | `cx`, `cy`, `rx`, `ry` | Center, horizontal radius, vertical radius |
| `line` | `x1`, `y1`, `x2`, `y2` | Starting point and ending point |
| `polyline` | `points` | List of `x,y` points joined by segments, open shape |
| `polygon` | `points` | List of `x,y` points joined, shape closed automatically |
| `path` | `d` | Any outline, described by commands (next section) |

In `points`, each point is written `x,y` and the points are separated by spaces. The triangle in the example has its vertices at (170, 150), (200, 100) and (230, 150).

## Filling and Outlining: `fill` and `stroke`

Every shape is drawn with a **fill** (the inside, set by `fill`) and an **outline** (the line that follows the edge, set by `stroke`). By default, the fill is **black** and there is **no outline**: that is why a `line` without `stroke` stays invisible (it has no inside to fill). The outline is centered on the edge: half of its thickness sticks out, the other half bites inward.

These settings are **presentation attributes**: attributes whose name is that of a CSS property, written directly in the tag.

| Attribute | Role | Default value | Example |
|---|---|---|---|
| `fill` | Color of the inside (`none`: no fill) | Black | `fill="#1a4fd6"` |
| `stroke` | Color of the outline | None | `stroke="#333"` |
| `stroke-width` | Thickness of the outline, in user units | `1` | `stroke-width="4"` |
| `stroke-linecap` | Shape of the ends of a line: `butt` (clean cut), `round`, `square` | `butt` | `stroke-linecap="round"` |
| `stroke-linejoin` | Shape of the corners between two segments: `miter` (pointed), `round`, `bevel` (cut off) | `miter` | `stroke-linejoin="round"` |
| `stroke-dasharray` | Dashed line: alternating lengths of line and gap | Solid line | `stroke-dasharray="10 5"`: 10 of line, 5 of gap |
| `stroke-dashoffset` | Shift of the start of the dashes | `0` | `stroke-dashoffset="5"` |
| `opacity` | Transparency of the whole shape, from `0` (invisible) to `1` | `1` | `opacity="0.5"` |
| `fill-opacity` | Transparency of the fill alone | `1` | `fill-opacity="0.3"` |

Colors are written as in CSS: a name (`red`), a hexadecimal code (`#1a4fd6`: the `#` followed by three pairs of base-16 digits, for the amount of red, green and blue) or `rgb(...)`. `stroke-dasharray` and `stroke-dashoffset` are also used to make a progress ring, as mentioned in the [chapter on gradients](/?c=langages&s=css&p=degrades); an animated example is given below.

## `path`: Drawing Any Shape

The basic shapes are not enough for an icon or a logo. `<path>` draws any shape from the `d` attribute (for *data*), a sequence of **commands**: a letter followed by numbers. Picture a pen: the `M` command puts it down, the others make it move.

| Command | Name | Expected numbers | Effect |
|---|---|---|---|
| `M` | *Move to* (go to) | `x y` | Lifts the pen and puts it down at (x, y), without drawing. Starts every outline |
| `L` | *Line to* (line toward) | `x y` | Draws a straight segment to (x, y) |
| `H` | *Horizontal line to* | `x` | Horizontal segment to the abscissa `x` (`y` unchanged) |
| `V` | *Vertical line to* | `y` | Vertical segment to the ordinate `y` (`x` unchanged) |
| `C` | *Curve to* (curve toward) | `x1 y1 x2 y2 x y` | Cubic Bézier curve: starts from the current point, ends at (x, y), guided by two control points (x1, y1) and (x2, y2) |
| `Z` | *Close path* (close) | none | Draws a straight segment back to the starting point of the outline and closes it |

A **Bézier curve** is a smooth curve defined by its two ends and by **control points**: the curve stretches toward each control point, without ever crossing it, like a taut thread pulled by two magnets. Other commands exist (`Q`, `S`, `T` for other curves, `A` for an elliptical arc), listed on the [MDN page for the path](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/d).

A command in **uppercase** uses **absolute** coordinates (position in the `viewBox`), a command in **lowercase** uses **relative** coordinates (movement from the current point): `L 50 10` goes to the point (50, 10), `l 50 10` moves 50 to the right and 10 down.

```html
<svg viewBox="0 0 300 100" width="300" height="100">
    <!-- M: pen at (10,90); L: to (50,10) then (90,90); Z: back to (10,90) -->
    <path d="M 10 90 L 50 10 L 90 90 Z" fill="#1a4fd6"/>
    <!-- C: from (120,90) to (200,90), guided by (140,10) and (180,10) -->
    <!-- fill="none": no fill; stroke: the color of the line -->
    <path d="M 120 90 C 140 10, 180 10, 200 90"
          fill="none" stroke="#c0392b" stroke-width="4"/>
    <!-- h, v in lowercase: relative; M 230 20, then 50 right, 50 down, 50 left, z -->
    <path d="M 230 20 h 50 v 50 h -50 z"
          fill="none" stroke="#2e8b57" stroke-width="4"/>
</svg>
```

The first outline is a solid triangle with vertices (10, 90), (50, 10) and (90, 90). The second is an arch: it starts at (120, 90), rises, and comes back down at (200, 90), its highest point being at (160, 30). The third is the outline of a square with sides of 50 whose top-left corner is at (230, 20): `h 50` leads to (280, 20), `v 50` to (280, 70), `h -50` to (230, 70), and `z` closes it.

Writing a `d` by hand is only useful for simple outlines. For an icon, you copy it from a vector drawing program (which exports an `.svg` file, which you open in an editor to copy its tags).

## `<g>` and Transformations

`<g>` (for *group*) groups several shapes without drawing anything itself. The presentation attributes set on the group are **inherited** by its children, unless a child redefines them.

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- g: fill and stroke set here apply to the three circles -->
    <g fill="#1a4fd6" stroke="#0b2a7a" stroke-width="3">
        <circle cx="40" cy="50" r="20"/>
        <circle cx="100" cy="50" r="20"/>
        <!-- This child redefines fill: it is red, but keeps the inherited outline -->
        <circle cx="160" cy="50" r="20" fill="#c0392b"/>
    </g>
</svg>
```

The `transform` attribute moves, rotates or enlarges a whole group at once:

| Transformation | Syntax | Effect |
|---|---|---|
| Move | `translate(tx ty)` | Shifts by `tx` to the right and by `ty` downward |
| Rotate | `rotate(angle)` or `rotate(angle cx cy)` | Rotates by `angle` **degrees** (a full turn = 360) clockwise, around the point (0, 0) or the point (cx, cy) |
| Scale | `scale(s)` or `scale(sx sy)` | Multiplies the dimensions (`1`: unchanged, `0.5`: half) |
| Skew | `skewX(angle)`, `skewY(angle)` | Tilts the drawing horizontally or vertically |

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- translate(100 50): the origin (0,0) of the group ends up at the point (100,50) -->
    <!-- rotate(45): then everything is turned 45 degrees around this new origin -->
    <g transform="translate(100 50) rotate(45)">
        <!-- Square of side 40 centered on the origin of the group (x and y are -20) -->
        <rect x="-20" y="-20" width="40" height="40" fill="#1a4fd6"/>
    </g>
</svg>
```

The square is centered at (100, 50) and, once rotated 45 degrees, it looks like a diamond whose points are about 28 units from the center (half the diagonal, that is, 20 × √2). Several transformations can follow one another in the same attribute, and **the order matters**: each one applies in the coordinate frame already moved by the previous ones, so `translate(100 50) rotate(45)` (rotating in place, at the point (100, 50)) is not `rotate(45) translate(100 50)` (moving along an axis that is already rotated).

## Style: Attributes, CSS, `currentColor` and Variables

An SVG shape is styled in three ways. They combine, and the highest-priority one wins (see [the cascade](/?c=langages&s=css&p=variables-et-cascade): the order of rules that contradict each other).

| Method | Example | Priority |
|---|---|---|
| Presentation attribute | `<circle fill="red">` | The lowest: any CSS rule replaces it |
| CSS rule from a stylesheet | `.sector { fill: blue; }` | Medium |
| `style` attribute of the tag | `<circle style="fill: green">` | The highest |

If a `<circle class="sector" fill="red">` meets the rule `.sector { fill: blue; }`, the circle is therefore blue. CSS is the right place for colors that change (hover, theme), attributes are for the drawing itself. The shapes of an SVG written in the page receive a style like any element, including [pseudo-classes](/?c=langages&s=css&p=selecteurs) such as `:hover` (the pointer is over them). Properties, however, change names:

| In HTML | For an SVG shape | Note |
|---|---|---|
| `background-color` | `fill` | A shape's background is its fill |
| `color` (text) | `fill` | The color of an SVG `<text>` is its `fill`, not `color` |
| `border-color`, `border-width` | `stroke`, `stroke-width` | A shape's outline is a `stroke` |
| `margin`, `padding` | No equivalent | A shape is placed by its coordinates |
| `z-index` | No equivalent | The order in the code decides (see [the pitfalls](#pitfalls)) |

Two tools link the image to the rest of the page:

- **`currentColor`** is a keyword meaning "the current value of the CSS property `color` of the element". Writing `fill="currentColor"` makes the icon follow the color of the text around it.
- A **CSS variable** (see [variables](/?c=langages&s=css&p=variables-et-cascade)) can be read in an SVG written in the page, as in the rest of the document: `fill: var(--primary-color)`. An SVG loaded by `<img>` has no access to it.

```css
:root {
    --primary-color: #1a4fd6;          /* variable declared once for the whole page */
}

.icon-button {
    color: var(--primary-color);       /* text color of the button, so of the icon */
}

.icon-button:hover {
    color: #c0392b;                    /* on hover, the text AND the icon turn red */
}

.icon-button svg {
    width: 24px;                       /* the icon is displayed at 24 x 24 pixels */
    height: 24px;
}
```

```html
<button class="icon-button">
    <!-- aria-hidden="true": hides the icon from screen readers (see below) -->
    <svg viewBox="0 0 24 24" aria-hidden="true">
        <!-- Triangle with vertices (12,3), (21,20), (3,20) -->
        <!-- fill="currentColor": the fill takes the color of the text -->
        <path d="M 12 3 L 21 20 L 3 20 Z" fill="currentColor"/>
    </svg>
    Alert
</button>
```

The [`<button>`](/?c=langages&s=html&p=attributs-data-et-accessibilite) changes color on hover, and its icon with it, without a single rule targeting the SVG.

## `<text>`: Writing Into an Image

`<text>` displays text at **coordinates**. Its reference point (x, y) is not the top-left corner but the start of the **baseline**: the imaginary line on which the letters rest (the tails of the "g" or the "p" go below it).

```html
<svg viewBox="0 0 300 120" width="300" height="120">
    <!-- Guide: vertical dashed line (4 of line, 4 of gap) at x = 150 -->
    <line x1="150" y1="0" x2="150" y2="120" stroke="#999" stroke-dasharray="4 4"/>
    <!-- text-anchor: on which side of the x point the text extends -->
    <!-- font-size: size of the letters -->
    <text x="150" y="30" font-size="18" text-anchor="start">start</text>
    <text x="150" y="60" font-size="18" text-anchor="middle">middle</text>
    <text x="150" y="90" font-size="18" text-anchor="end">end</text>
</svg>
```

The three words have their baseline at heights 30, 60 and 90. "start" begins at x = 150 and extends to the right, "middle" is centered on x = 150, "end" ends at x = 150.

| Attribute | Values | Effect |
|---|---|---|
| `text-anchor` | `start` (default), `middle`, `end` | **Horizontal** position of the text relative to `x` |
| `dominant-baseline` | `auto` (default), `middle`, `central`, `hanging` | **Vertical** position of the text relative to `y` |
| `font-size`, `font-family`, `font-weight` | As in CSS | Size, typeface, weight, as an attribute or in CSS |

For `dominant-baseline`, `auto` aligns the bottom of the letters without tails with `y`, `middle` aligns `y` with the middle of the height of the lowercase letters, `central` with the middle of the whole line, and `hanging` aligns the top of the text with `y`. `dominant-baseline="central"` together with `text-anchor="middle"` is used to center a text in a circle; since the exact gap between `middle` and `central` is subtle, you check it by eye in the target browser.

SVG text is **not** HTML text:

| | HTML text (`<p>`) | SVG text (`<text>`) |
|---|---|---|
| Automatic line wrapping | Yes, depending on the width of the container | **No**: a single line, which overflows or is cut off |
| Position | In the flow of the page | At the coordinates `x` and `y` |
| Color | `color` | `fill` |
| Background, border, margin | Yes | No: a `<rect>` must be drawn behind it |
| Size on screen | Independent of the image | Scaled with the `viewBox`: an SVG shrunk by half displays a text shrunk by half |
| Selectable and searchable | Yes | Yes, if it remains real `<text>` |

To write on several lines, you split the text by hand with `<tspan>`, a piece of text inside `<text>` that can be positioned on its own:

```html
<svg viewBox="0 0 200 80" width="200" height="80">
    <text x="10" y="30" font-size="16">
        <!-- x="10" brings each piece back to the left edge; dy: vertical offset -->
        <tspan x="10">First line</tspan>
        <!-- dy="1.2em": moves down by 1.2 times the font size -->
        <tspan x="10" dy="1.2em">Second line</tspan>
    </text>
</svg>
```

The `em` unit equals the size of the current font (see [relative units](/?c=langages&s=css&p=responsive-et-media-queries)): `1.2em` thus leaves a line spacing proportional to the text. To know whether a text fits in the space available, `getComputedTextLength()` gives its width in user units; the idea is the same as `measureText()` from the [canvas chapter](/?c=langages&s=javascript&p=canvas-2d-et-animations), applied to an SVG element:

```javascript
// Finds the text and the rectangle that must serve as its background
const label = document.getElementById("label");
const background = document.getElementById("label-background");

// getComputedTextLength(): actual width of the displayed text, in user units
const width = label.getComputedTextLength();
// The background is the width of the text plus 16 of margin (8 on each side)
background.setAttribute("width", width + 16);
```

## Animation

Because shapes are DOM elements, the three main animation techniques of the web apply to them.

### With CSS: `transition` and `@keyframes`

The notions of [transition and @keyframes](/?c=langages&s=css&p=animations-css-performantes) apply to SVG shapes. The properties specific to SVG (`fill`, `stroke`, `stroke-dashoffset`...) animate like the others:

```css
.sector {
    fill: #1a4fd6;                       /* starting color */
    transition: fill 0.2s ease-out;      /* animate fill over 0.2 seconds, slowing down */
}

.sector:hover {
    fill: #c0392b;                       /* on hover, the fill slides toward red */
}
```

For a movement or an enlargement, you animate `transform`. For a shape **inside** an SVG, a trap lurks: the point around which the shape rotates or grows (the **transform origin**, `transform-origin`) is by default the origin (0, 0) of the coordinate frame of the whole SVG, not the center of the shape. `transform-box: fill-box` makes the origin be computed on the **bounding box** of the shape (the smallest rectangle that contains it), and `transform-origin: center` places it in the middle of this box ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transform-box)).

```css
.pulse {
    transform-box: fill-box;             /* the origin is measured on the box of the shape */
    transform-origin: center;            /* at the center of that box */
    animation: beat 1.2s ease-in-out infinite;   /* name, duration, curve, repetition */
}

@keyframes beat {
    0%   { transform: scale(1); }        /* start: normal size */
    50%  { transform: scale(1.3); }      /* halfway: 130% */
    100% { transform: scale(1); }        /* end: back to normal size */
}
```

```html
<svg viewBox="0 0 100 100" width="100" height="100">
    <!-- The pulse class applies the animation: the disc grows then shrinks -->
    <circle class="pulse" cx="50" cy="50" r="20" fill="#c0392b"/>
</svg>
```

A second classic use is the **progress ring**. The distance around a circle (its **circumference**) equals 2 × π × r, where π (≈ 3.14159) is the ratio between the distance around a circle and its diameter. For r = 40, that makes about 251.33. We set `stroke-dasharray` to this value (a stroke as long as the circle, followed by a gap as long) and `stroke-dashoffset` to the hidden part: 251.33 hides the whole ring, `0` displays all of it.

```html
<svg viewBox="0 0 100 100" width="100" height="100">
    <!-- Background ring, gray, complete -->
    <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" stroke-width="8"/>
    <!-- Progress ring: rotate(-90 50 50) starts the stroke at the top of the circle -->
    <circle id="progress" class="progress" cx="50" cy="50" r="40" fill="none"
            stroke="#1a4fd6" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="251.33" stroke-dashoffset="251.33"
            transform="rotate(-90 50 50)"/>
</svg>
<button id="advance">Advance to 75%</button>
```

```css
.progress {
    transition: stroke-dashoffset 0.6s ease-out;   /* the stroke unrolls over 0.6 seconds */
}
```

```javascript
// Circumference of the circle of radius 40 (Math.PI is π)
const CIRCUMFERENCE = 2 * Math.PI * 40;
const progress = document.getElementById("progress");

// part: a number between 0 (nothing) and 1 (everything); the hidden part is the rest
function showProgress(part) {
    progress.style.strokeDashoffset = CIRCUMFERENCE * (1 - part);
}

// A click on the button fills the ring to three quarters (the offset goes to 62.83)
document.getElementById("advance").addEventListener("click", () => {
    showProgress(0.75);
});
```

The ring starts empty: on click, the value of `stroke-dashoffset` goes from 251.33 to about 62.83 and the `transition` rule slides the stroke from one to the other. The transition only starts if the value changes **after** the first display: that is why the call is placed in a click.

### With `<animate>` (SMIL)

**SMIL** (*Synchronized Multimedia Integration Language*) is an animation language written directly in the tags of the SVG: an `<animate>` tag placed inside the shape describes which attribute varies, between which values and for how long.

```html
<svg viewBox="0 0 60 60" width="60" height="60">
    <circle cx="30" cy="30" r="10" fill="#1a4fd6">
        <!-- attributeName: the attribute to animate (the radius r) -->
        <!-- from and to: start and end values; dur: duration of one pass -->
        <!-- repeatCount="indefinite": repeats endlessly -->
        <animate attributeName="r" from="10" to="25" dur="2s" repeatCount="indefinite"/>
    </circle>
</svg>
```

SMIL works without CSS or JavaScript, but it lives apart: the [media query](/?c=langages&s=css&p=responsive-et-media-queries) `prefers-reduced-motion` (a condition that reads a setting of the user, see below) does not stop it. For a new project, CSS and JavaScript are preferred.

### In JavaScript

You create and modify shapes with the tools of the [DOM](/?c=langages&s=javascript&p=dom-et-evenements) (`getElementById`, `setAttribute`, `classList`...). One difference: an SVG shape belongs to a different **namespace** than HTML. An XML namespace is an identifier, written in the form of a web address, that says which vocabulary a tag belongs to (HTML or SVG). To create a shape, you therefore use `document.createElementNS` (the "NS" comes from *namespace*) with the SVG address, not `document.createElement`.

```html
<svg id="chart" viewBox="0 0 300 100" width="300" height="100"></svg>
```

```javascript
// Address that identifies the SVG vocabulary (it is a name, the browser does not visit it)
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const values = [30, 80, 55];                        // the height of each bar
const chart = document.getElementById("chart");

// forEach calls the function for each value of the array, with its rank (0, 1, 2)
values.forEach((value, rank) => {
    // createElementNS: creates a real SVG shape (createElement: unknown element)
    const bar = document.createElementNS(SVG_NAMESPACE, "rect");
    bar.setAttribute("x", rank * 100 + 20);         // bars at x = 20, 120 and 220
    bar.setAttribute("y", 100 - value);             // top of the bar (y grows downward)
    bar.setAttribute("width", 60);                  // 60 units wide
    bar.setAttribute("height", value);              // height of the bar
    bar.setAttribute("fill", "#1a4fd6");            // fill color
    chart.appendChild(bar);                         // adds it to the SVG: it appears
});
```

The result is three rectangles 60 wide, whose bottom touches the line y = 100 and whose height is 30, 80 and 55 (their top is therefore at y = 70, 20 and 45). For a continuous animation, these changes are combined with `requestAnimationFrame`, presented in the [canvas chapter](/?c=langages&s=javascript&p=canvas-2d-et-animations):

```javascript
const point = document.getElementById("point");       // a <circle id="point"> from the SVG
// matchMedia tests a media query; .matches is true if the system setting is enabled
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function image(now) {                                 // now: time, in milliseconds
    // 1 unit every 20 ms; % (remainder of the division) brings back to 0 after 260
    point.setAttribute("cx", 20 + ((now / 20) % 260));
    requestAnimationFrame(image);                     // schedules the next frame
}

if (!reduced) requestAnimationFrame(image);           // nothing moves if reduced motion is on
```

The point moves between x = 20 and x = 280 on a `viewBox` 300 wide, unless the user has asked to reduce animations.

### Respecting `prefers-reduced-motion`

Some people tolerate movement on screen poorly (dizziness, nausea): their operating system offers a "reduce motion" setting, which CSS reads with the `prefers-reduced-motion` media query, explained in the [animations chapter](/?c=langages&s=css&p=animations-css-performantes). The principle still holds for an SVG:

```css
@media (prefers-reduced-motion: reduce) {
    .pulse {
        animation: none;            /* the disc stays still */
    }

    .progress {
        transition: none;           /* the ring jumps to its new value at once */
    }
}
```

For an SVG animated by `<animate>`, you must stop it in JavaScript: the `<svg>` element has a `pauseAnimations()` method that freezes all its SMIL animations (`document.querySelector("svg").pauseAnimations()`).

## Accessibility

A **screen reader** reads the page aloud for people who are blind or have low vision (see [ARIA and screen readers](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). An image means nothing to it without text: you must therefore say what it represents, or indicate that it is decorative. The browser builds a simplified outline of the page for these programs, which contains only what the code tells it to put in it.

| Situation | Solution | Example |
|---|---|---|
| Image that carries information (chart, diagram) | `role="img"` + `<title>` + possibly `<desc>` + `aria-labelledby` | See the code below |
| Decorative image (ornament, icon next to a text that is already explicit) | `aria-hidden="true"` | `<svg aria-hidden="true">` |
| Icon alone in a button | `aria-label` on the button, `aria-hidden` on the icon | `<button aria-label="Close">` |
| Complex data (chart with several series) | An equivalent [HTML table](/?c=langages&s=html&p=tableaux) beside the SVG | The values readable line by line |

- **`role="img"`** declares that the whole SVG is a single image: the screen reader does not announce its shapes one by one.
- **`<title>`** gives the short name of the image. Placed as the **first child** of `<svg>`, it also shows as a tooltip (a small label on hover) in most browsers. **`<desc>`** (*description*) gives a longer explanation.
- **`aria-labelledby`** (see [ARIA](/?c=langages&s=html&p=attributs-data-et-accessibilite)) names the element from other elements of the page, designated by their `id`. Explicitly linking the `<title>` to the SVG is the safest practice, because its support alone has not always been consistent across screen readers.

```html
<!-- role="img": a single image; aria-labelledby: its name comes from the elements -->
<!-- whose ids are listed: the title and the description -->
<svg role="img" aria-labelledby="sales-title sales-desc"
     viewBox="0 0 300 100" width="300" height="100">
    <!-- <title>: the short name; the id lets aria-labelledby find it -->
    <title id="sales-title">Sales per quarter</title>
    <!-- <desc>: the detail of the data, for those who cannot see the bars -->
    <desc id="sales-desc">30 in the first quarter, 80 in the second, 55 in the third.</desc>
    <rect x="20" y="70" width="60" height="30" fill="#1a4fd6"/>
    <rect x="120" y="20" width="60" height="80" fill="#1a4fd6"/>
    <rect x="220" y="45" width="60" height="55" fill="#1a4fd6"/>
</svg>
```

```html
<!-- Decorative icon: aria-hidden="true" removes it from what the screen reader reads -->
<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
    <circle cx="12" cy="12" r="10" fill="#1a4fd6"/>
</svg>

<!-- Button that contains only an icon: its name comes from aria-label -->
<button aria-label="Close the window">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
        <path d="M 4 4 L 20 20 M 20 4 L 4 20" stroke="currentColor" stroke-width="3"/>
    </svg>
</button>
```

There remains the question of text. An SVG can contain **real text** (`<text>`) or **drawn** text (the letters converted into `path` outlines, as in many exported logos).

| | Real text (`<text>`) | Text converted into outlines (`path`) |
|---|---|---|
| Selectable and searchable (Ctrl+F) | Yes | No |
| Read by a screen reader | Yes, unless the SVG is `role="img"` (then only the `<title>` is read) | No: the `<title>` must say everything |
| Typeface and language | Depend on the installed fonts | Fixed, identical rendering everywhere |
| Translatable, editable | Yes | No |

A chart with `role="img"` hides its internal `<text>` from screen readers: the information they carry must therefore appear in the `<title>` or the `<desc>`, or in a table placed beside it. Colors must follow the [contrast](/?c=ui-ux&p=couleur-et-contraste) rules, and information must never rely on color alone (see [accessibility in UX](/?c=ui-ux&p=accessibilite-ux)).

## Interaction: Pointer and Keyboard

An SVG shape listens to events like any element (`click`, `keydown`...). **Pointer events** (including `pointerdown`, `pointermove`, `pointerenter`) group mouse, finger and stylus under a single name: one piece of code is enough for all devices ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)).

Which parts of a shape react to the pointer? The `pointer-events` property sets this: it decides which zones of an element can be the target of a click or a hover.

| Value | Zone that reacts | Use case |
|---|---|---|
| `visiblePainted` (default; the value `auto` is equivalent) | The **painted** parts: fill if `fill` is not `none`, outline if `stroke` is not `none` | Normal behavior |
| `all` | The whole inside and outline, even without fill or outline | Clickable zone on a transparent shape |
| `stroke` | The outline alone | A gauge where only the ring reacts |
| `none` | **None**: the click passes through the shape and reaches what is underneath | A legend or decorative layer placed on top |

A shape with `fill="none"` is therefore not clickable in its middle by default: the pointer passes through it. Hence `pointer-events="all"` in the following example.

On the keyboard, an SVG shape is **not reachable** with the Tab key (see [focus and `tabindex`](/?c=langages&s=html&p=aria-dynamique-et-focus-clavier)). `tabindex="0"` makes it focusable, and you must add a role, a name and the reaction to the Enter and Space keys, which the browser provides only for real buttons.

```html
<svg id="scene" viewBox="0 0 200 100" width="400" height="200">
    <!-- tabindex="0": reachable with Tab; role="button", aria-label: read as a button -->
    <!-- pointer-events="all": the whole disc reacts, even though fill is none -->
    <circle id="zone" class="zone" cx="100" cy="50" r="30" fill="none"
            stroke="#1a4fd6" stroke-width="4" pointer-events="all"
            tabindex="0" role="button" aria-label="Activate the zone"/>
    <!-- pointer-events="none": this point follows the pointer without intercepting clicks -->
    <circle id="cursor" cx="0" cy="0" r="4" fill="#c0392b"
            pointer-events="none"/>
</svg>
```

```css
.zone.active {
    fill: #e8eefc;                 /* "activated" state: the inside fills */
}

.zone:focus-visible {
    stroke: #c0392b;               /* keyboard focus: the outline changes color */
    stroke-width: 6;               /* and thickens, to stay clearly visible */
}
```

```javascript
const scene = document.getElementById("scene");
const zone = document.getElementById("zone");
const cursor = document.getElementById("cursor");

// classList.toggle adds the class "active" if it is missing, removes it otherwise
function activate() {
    zone.classList.toggle("active");
}

// click covers mouse and finger; keydown adds the keyboard
zone.addEventListener("click", activate);
zone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();        // prevents the page from scrolling on Space
        activate();
    }
});

// pointermove: each time the pointer moves over the SVG
scene.addEventListener("pointermove", (event) => {
    // DOMPoint: a point (x, y); clientX and clientY: position of the pointer in the window
    const pixel = new DOMPoint(event.clientX, event.clientY);
    // getScreenCTM(): the drawing-to-pixels conversion; inverse(): pixels to drawing
    const local = pixel.matrixTransform(scene.getScreenCTM().inverse());
    cursor.setAttribute("cx", local.x);    // coordinates in the viewBox, not in pixels
    cursor.setAttribute("cy", local.y);
});
```

The last block illustrates a subtlety due to the `viewBox`: the pointer coordinates (`clientX`, `clientY`) are in window pixels, whereas `cx` and `cy` are in user units. An SVG displayed at 400 × 200 for a `viewBox` of 200 × 100 doubles each value, hence the conversion by `getScreenCTM()`.

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| Standalone `.svg` file without `xmlns="http://www.w3.org/2000/svg"` | Outside an HTML page, the file is read as **XML** (a markup language close to HTML, but stricter) and the browser does not know that the tags are SVG: the image does not display. In an HTML page, the attribute is useless |
| `viewBox` forgotten | The SVG keeps its fixed size in pixels and no longer adapts to its container. Always set a `viewBox` and set the size in CSS |
| Duplicate `id` between several SVGs on the page | An `id` must be unique across the **whole** page: references like `fill="url(#gradient)"` or `aria-labelledby` then point to the first element found, sometimes in another SVG. Prefix the `id`s of each SVG |
| Looking for a `z-index` | It does not exist in SVG: the shape written **last** in the code is drawn over the others. Reorder the code, or in JavaScript `appendChild` on a shape already present moves it to the end |
| `width` and `height` in CSS and in attributes at the same time | The CSS rule wins over the attribute. Choose a single place (CSS for an adaptive SVG) |
| `document.createElement("circle")` | Creates an unknown HTML element, never drawn. Use `createElementNS` with the SVG address |
| `className` in JavaScript on an SVG shape | On an SVG element, it returns an object and not the text of the classes. Use `classList` |
| `color`, `background`, `border`, `margin` on a shape | No effect: use `fill`, `stroke`, and coordinates |
| `line` without `stroke`, or `fill` forgotten | A line without outline is invisible, a shape without `fill` is black |
| `fill="none"` and click in the middle of the shape | The pointer passes through the shape. Add `pointer-events="all"` |
| Text expected on several lines | `<text>` never wraps on its own. Split it with `<tspan>` or use HTML around the SVG |
| Text unreadable on mobile | It shrinks with the SVG. Plan a minimum size or adapt the `viewBox` |
| Rotation or scale of a shape around the wrong point | By default, the origin is the point (0, 0) of the SVG. Add `transform-box: fill-box; transform-origin: center` |
| `<animate>` (SMIL) not stopped for `prefers-reduced-motion` | CSS has no effect on it. Call `pauseAnimations()` or do not use it |
| Informative SVG without `<title>`, or decorative SVG without `aria-hidden` | The screen reader says nothing useful, or reads shapes that have no meaning |
| Interactive shape without `tabindex`, `role` and key handling | Unusable with the keyboard |

Here is how the uniqueness of `id`s breaks a gradient. `<defs>` is an area where you declare reusable elements, which are drawn only when a shape references them; `url(#name)` designates the element whose `id` is "name"; `<linearGradient>` declares a gradient that gradually passes from one color to another (see [CSS gradients](/?c=langages&s=css&p=degrades) for the idea); each `<stop>` sets the color (`stop-color`) at a position (`offset`) between 0 and 1.

```html
<!-- First SVG: a gradient with id "gradient", from blue to light blue -->
<svg viewBox="0 0 100 40" width="100" height="40">
    <defs>
        <linearGradient id="gradient">
            <stop offset="0" stop-color="#1a4fd6"/>
            <stop offset="1" stop-color="#8fb0ff"/>
        </linearGradient>
    </defs>
    <rect width="100" height="40" fill="url(#gradient)"/>
</svg>

<!-- WRONG: same id "gradient": this rectangle will use the first gradient -->
<svg viewBox="0 0 100 40" width="100" height="40">
    <defs>
        <linearGradient id="gradient">
            <stop offset="0" stop-color="#c0392b"/>
            <stop offset="1" stop-color="#f5b7b1"/>
        </linearGradient>
    </defs>
    <rect width="100" height="40" fill="url(#gradient)"/>
</svg>
```

The second SVG should be red, but its `fill="url(#gradient)"` designates the first element of the page with this `id`, so the blue gradient. The fix is to rename the `id`s: `gradient-blue` for one, `gradient-red` for the other.

And here is the drawing order:

```html
<svg viewBox="0 0 200 100" width="400" height="200">
    <!-- Drawn first: blue, centered at (80,50) -->
    <circle cx="80" cy="50" r="30" fill="#1a4fd6"/>
    <!-- Drawn next: red, centered at (120,50), it covers the blue from x = 90 to 110 -->
    <circle cx="120" cy="50" r="30" fill="#c0392b"/>
</svg>
```

For the blue circle to be on top, move it **after** the red one in the code.

## Best practices

| Best practice | Why |
|---|---|
| Always write a `viewBox`, set the size in CSS | The SVG adapts to its container without losing sharpness |
| Write in the page the SVGs to style, animate or read by script; use `<img>` for a fixed illustration | The former benefit from CSS and JavaScript, the latter are cached |
| Use `fill="currentColor"` and CSS variables for icons | An icon follows the color of the text and the theme of the page |
| Put the colors that change in CSS, the drawing in attributes | CSS wins, and the look changes without touching the drawing |
| Prefix the `id`s of each SVG (`gradient-blue`, `sales-title`) | The `url(#...)` and `aria-labelledby` references never cross |
| Animate `transform`, `opacity`, `fill`, `stroke-dashoffset` rather than geometry attributes (`cx`, `width`) | These properties animate everywhere in CSS. Measure afterward, because hardware acceleration depends on the browser for shapes inside an SVG |
| Provide for `prefers-reduced-motion` for every animation, SMIL included | Respects people who are sensitive to movement |
| `role="img"` + `<title>` (+ `<desc>`) + `aria-labelledby` for an informative image; `aria-hidden="true"` for a decorative one | The screen reader says the essential or stays silent |
| Complete a complex chart with an HTML table | The values remain readable by everyone |
| Keep real `<text>` rather than letters converted into outlines | Selectable, searchable and translatable text |
| Make an interactive shape reachable by keyboard, with a visible focus | The same service for mouse, finger and keyboard |

## Key Takeaways

| | |
|---|---|
| **To remember** | An SVG describes shapes, not pixels: it stays sharp at any size. Written in the page, each shape is a DOM element, styleable in CSS, animatable and controllable in JavaScript. The `viewBox` defines the frame of reference (origin at the top left, `y` downward) and the scaling. The basic shapes are `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon` and `path` (commands `M`, `L`, `C`, `Z`). `<g>` groups and `transform` moves, rotates or enlarges. Color is set with `fill` and `stroke`, `currentColor` follows the text. `<text>` is placed by coordinates, without automatic line wrapping. An informative SVG has a `role="img"`, a `<title>` and an `aria-labelledby`; a decorative SVG has `aria-hidden="true"`. |
| **Pitfalls to avoid** | `xmlns` forgotten in a standalone file; `viewBox` forgotten; duplicate `id`; looking for a `z-index` (the order of the code decides); `createElement` instead of `createElementNS`; `color` or `background` on a shape; `fill="none"` that lets the click through; multi-line text without `<tspan>`; transformation around the wrong point; SMIL that ignores `prefers-reduced-motion`; shape that is clickable but unusable with the keyboard. |
| **Best practices** | `viewBox` plus size in CSS; `currentColor` and CSS variables; prefixed `id`s; animating `transform`, `opacity`, `fill` or `stroke-dashoffset`; `prefers-reduced-motion` variant; title and description for an informative image, `aria-hidden` for an ornament; HTML table as a complement to a chart; real text rather than text converted into outlines; `tabindex`, role and keys on any interactive shape. |
