---
order: 10
---

# CSS Units and Sizing Functions: From `rem` to `clamp()` (28/10/2026)

Every size written in CSS (the width of a column, the size of a text, the space between two blocks) is a **number followed by a unit**: in `16px`, 16 is the number and `px` is the unit. The choice of unit decides what the page becomes when the screen changes, when the user **zooms** (enlarges the whole page) or when they adjust **the font size of their browser** (the software that displays web pages). This chapter explains each unit, the functions that compute a size (`calc()`, `min()`, `max()`, `clamp()`), the trap of `100vh` on phones, then what to do so that a page stays usable when the text is enlarged to 200% or 300%.

| Topic | Question it answers | Section |
|---|---|---|
| The units | What does each unit refer to (`px`, `em`, `rem`, `%`, `vw`, `ch`...)? | [Relative units](#relative-units-what-each-one-refers-to) |
| `em` and `rem` | Why does `em` compound, and why does `rem` respect the user's setting? | [`em` and `rem`](#em-handy-but-it-compounds) |
| Window on mobile | Why does `100vh` overflow the screen of a phone? | [Viewport units on mobile](#viewport-units-on-mobile-the-100vh-problem) |
| The functions | How do we calculate, cap or make a size fluid? | [Sizing functions](#sizing-functions-calc-min-max-and-clamp) |
| Enlargement | What does WCAG require, and how do we keep a page working at 200% and 300%? | [Enlarging text](#enlarging-text-to-200-and-300-what-wcag-requires) |

It assumes you already know [the syntax of a CSS rule](/?c=langages&s=css&p=selecteurs) (a **selector** designates the elements to style, then settings are written between braces in the form `property: value;`), [the box model](/?c=langages&s=css&p=box-model) (`width`, `padding`, `margin`) and [CSS variables](/?c=langages&s=css&p=variables-et-cascade) (`var(--name)` reads a value declared once and for all). The chapter on [responsive design and media queries](/?c=langages&s=css&p=responsive-et-media-queries) already presents `px`, `%`, `em`, `rem`, `vw` and `vh` in a few lines: here, we build on them without explaining them again.

## A CSS value: a number and a unit

```css
p {
    font-size: 16px;        /* font-size: the size of the text; value: 16, unit px */
    margin-bottom: 1.5em;   /* margin-bottom: the space below the paragraph; unit: em */
    width: 60%;             /* width: the width; % is also a unit */
    line-height: 1.5;       /* line-height: the height of a line; here without a unit */
}
```

A **pixel** is the smallest dot on a screen. The **CSS pixel** (`px`) is the base unit of CSS: it is not necessarily a physical dot of the screen. On a very high-density screen, a CSS pixel is drawn with several dots; and when zooming, the browser draws each CSS pixel with even more dots. In what follows, "pixel" always means the CSS pixel, unless stated otherwise.

There are two families of units:

| Family | Definition | Examples |
|---|---|---|
| **Absolute** | Always the same length, whatever surrounds it | `px`, and for print `cm`, `mm`, `in` (inch), `pt` (point) |
| **Relative** | Computed from a **reference**: the size of a font, that of the parent, that of the window | `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex`, `lh` |

The print units are tied to the pixel by fixed factors: 1 `in` = 96 `px`, so 12 `pt` = 12 × 96 / 72 = 16 `px`. A web page rarely uses them; the full list is on the [MDN page on lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/length).

## Relative units: what each one refers to

The **viewport** is the area of the page visible in the browser, without the bars and menus. The **root** is the `<html>` element, ancestor of all the others (see [the HTML tags](/?c=langages&s=html&p=structure-dun-document)); CSS designates it with `:root` (see [variables](/?c=langages&s=css&p=variables-et-cascade)).

| Unit | Refers to | Typical use |
|---|---|---|
| `em` | The font size **of the element** (for the `font-size` property itself: that of the **parent**, meaning the element that contains it) | Spaces that follow the size of the text (`padding` of a button) |
| `rem` | The font size of **the root** ("*root em*") | Font sizes, general spacing |
| `%` | Depends on the property (next table) | Widths, sizes relative to the parent |
| `vw` | 1% of the **width** of the viewport | Widths tied to the screen |
| `vh` | 1% of the **height** of the viewport | Heights tied to the screen (see the section on mobile) |
| `vmin` | 1% of the **smaller** of the two sides of the window | A square that always fits on the screen |
| `vmax` | 1% of the **larger** of the two sides of the window | A background that always covers the screen |
| `ch` | The width of the **digit 0** in the font of the element | Width of a line of text (`65ch`: about 65 characters) |
| `ex` | The height of the **lowercase x** in the font | Aligning an icon on lowercase letters (rare) |
| `lh` | The height of **one line** of text of the element (its `line-height` value) | A vertical space equal to one line |

The percentage has no single reference:

| Property | `%` is computed on | Example |
|---|---|---|
| `width` | The width of the parent | `width: 50%`: half of the parent |
| `height` | The height of the parent, **only if** it is set explicitly (otherwise the value is ignored and the height stays automatic) | `height: 100%` |
| `font-size` | The font size of the parent | `font-size: 150%`: 1.5 times that of the parent |
| `padding`, `margin` | The **width** of the parent, even for the top and bottom | `padding-top: 10%` |

```css
.square {
    width: 50vmin;           /* 50% of the smaller side of the window */
    height: 50vmin;          /* same value: the block is therefore a square */
}

.article {
    /* at most 65 widths of "0": about 65 characters per line */
    max-width: 65ch;
    margin-bottom: 1lh;      /* a space equal to the height of a line of text */
}
```

On a phone whose window is 390 pixels wide by 844 high (example values), the smaller side is 390: `50vmin` is 195 pixels. Turned to **landscape mode** (the screen is wider than high: 844 wide, 390 high), the smaller side is still 390: the square keeps its 195 pixels and therefore always fits on the screen.

| Unit | On a 390 × 844 window | On a 1280 × 800 window |
|---|---|---|
| `10vw` | 39 px | 128 px |
| `10vh` | 84.4 px | 80 px |
| `10vmin` | 39 px | 80 px |
| `10vmax` | 84.4 px | 128 px |

The length of a line of text has a direct effect on reading: the chapter [Typography](/?c=ui-ux&p=typographie) recommends 50 to 75 characters, which `max-width: 65ch` guarantees better than a width in pixels, because `ch` follows the chosen font. `ch`, `ex` and `lh` depend on the font and the line spacing of the element: their value in pixels thus depends on the font loaded and cannot be guessed without displaying it. These units are available in current browsers (28/10/2026).

## `em`: handy, but it compounds

`em` has two meanings depending on the property. For `font-size`, it refers to the font size of the **parent**. For all other properties (`padding`, `width`, `margin`...), it refers to the font size **of the element itself**. This is the effect that makes the spacing of a button proportional to its text:

```css
.button {
    /* text 1.25 times the size of the root: 20 px if it is 16 px */
    font-size: 1.25rem;
    /* top and bottom: 0.5 × 20 = 10 px; left and right: 1 × 20 = 20 px */
    padding: 0.5em 1em;
}
```

If the user sets the font size of their browser to 24 pixels (instead of 16), the button text goes to 1.25 × 24 = 30 px and the spaces to 15 px and 30 px: the button stays proportionate. This is the right use of `em`.

The trap appears with `font-size` on **nested** elements (placed inside one another): each level multiplies the size of its parent, so the effects accumulate.

```html
<!-- Three nested blocks, each the child of the previous one, all with one class -->
<div class="level">Level 1
    <div class="level">Level 2
        <div class="level">Level 3</div>
    </div>
</div>
```

```css
html {
    font-size: 100%;         /* the root: 16 px with the default setting */
}

.level {
    font-size: 1.5em;        /* 1.5 times the font size of the PARENT */
}
```

```
html                       16 px      (size of the root)
 └─ .level (level 1)       16 × 1.5 = 24 px
     └─ .level (level 2)   24 × 1.5 = 36 px
         └─ .level (level 3)   36 × 1.5 = 54 px     the text grows at each level
```

With `font-size: 1.5rem` instead, the three levels would all be 24 pixels: `rem` always refers to the root, whatever the depth.

| | `em` | `rem` |
|---|---|---|
| Reference of `font-size` | The parent (varies at each level) | The root (always the same) |
| Reference of the other properties | The font of the element | The font of the root |
| Risk | Compounding in nested elements (lists inside lists, nested components) | No compounding |
| Choose it for | `padding`, `margin` or `gap` that must follow **the text of the same element** | Font sizes, and spaces that do not depend on a specific text |

## `rem` and the user's setting

Every browser has a **default font size**, 16 pixels as long as nobody changes it. The user can change it in the appearance or font settings of their browser: a visually impaired person raises it to 24, 32 pixels or more, and expects **all** sites to follow. The root takes this value: it is what `rem` uses.

The essential point: a size written in **pixels** does not follow this setting, a size in `rem` does.

| User setting | `font-size: 16px` | `font-size: 1rem` | `font-size: 1.125rem` |
|---|---|---|---|
| 16 px (default) | 16 px | 16 px | 18 px |
| 24 px (150%) | 16 px | 24 px | 27 px |
| 32 px (200%) | 16 px | 32 px | 36 px |
| 48 px (300%) | 16 px | 48 px | 54 px |

A page made entirely of pixels therefore stays tiny for someone who has asked for text 200% bigger: their setting is ignored. This is not a flaw of the **zoom**: zooming with the keyboard (Ctrl and `+`, or ⌘ and `+` on Mac) also enlarges pixels. Only the **font size setting** leaves them unchanged (see [the section on the two ways to enlarge](#two-ways-to-enlarge-zoom-and-font-size)). So the root must also follow this setting:

```css
/* GOOD: 100% of the size chosen by the user (16 px if nothing is set) */
html {
    font-size: 100%;
}
```

```css
/* TO AVOID: freezes 16 px whatever the user chose, rem no longer follows their setting */
html {
    font-size: 16px;
}
```

Font sizes in design mockups are often given in pixels (see [Typography](/?c=ui-ux&p=typographie)): we convert them by dividing by 16.

| Mockup | Calculation | In CSS |
|---|---|---|
| 14 px | 14 / 16 | `0.875rem` |
| 16 px | 16 / 16 | `1rem` |
| 18 px | 18 / 16 | `1.125rem` |
| 24 px | 24 / 16 | `1.5rem` |
| 32 px | 32 / 16 | `2rem` |
| 48 px | 48 / 16 | `3rem` |

Pixels keep their place for what must **not** grow with the text: a thin border (`1px solid`), a shadow line.

## Viewport units on mobile: the `100vh` problem

On a phone, the **address bar** (the area of the browser that shows the page address) shrinks or disappears when scrolling down, and reappears when scrolling back up. The visible area of the page therefore changes height while reading. However, `vh` has remained, for mobile browsers, computed on the **largest** possible height, bar hidden. A block with `height: 100vh` is then too tall while the bar is visible: its bottom (a button, for example) ends up below the edge of the screen, out of reach without scrolling.

CSS has therefore added three families of units, each designating a state of the bar:

| Unit | Name | Refers to the height... | Changes during scrolling? |
|---|---|---|---|
| `svh` | *small viewport height* | Of the **small** window: address bar visible | No |
| `lvh` | *large viewport height* | Of the **large** window: address bar hidden | No |
| `dvh` | *dynamic viewport height* | Of the **current** window: follows the bar live | Yes |
| `vh` | *viewport height* | In practice, the same as `lvh` on mobile | No |

Here is the diagram, for a screen where the total area is 800 pixels and the address bar 60 pixels (example values):

```
VISIBLE BAR (page at the very top)
+----------------------------+
| address bar: 60 px         |
+----------------------------+   <- top of the visible area
|                            |     ^
|        visible area        |     |  100svh = 740 px
|                            |     |  100dvh = 740 px (follows the bar)
+----------------------------+     v  <- bottom of the screen
   60 px off screen ...............   100lvh = 800 px: overflows by 60 px

HIDDEN BAR (after scrolling down)
+----------------------------+   <- top of the screen = top of the visible area
|                            |     ^
|        visible area        |     |  100lvh = 800 px
|                            |     |  100dvh = 800 px (follows the bar)
|                            |     |  100svh = 740 px: 60 px less
+----------------------------+     v  <- bottom of the screen
```

| Bar state | `100svh` | `100lvh` (and `100vh`) | `100dvh` |
|---|---|---|---|
| Visible | 740 px | 800 px (60 px off screen) | 740 px |
| Hidden | 740 px | 800 px | 800 px |

On a computer, no bar slides out: the four units have the same height. The same prefixes exist for width (`svw`, `lvw`, `dvw`) and for `vmin` and `vmax`; as the width does not vary with the address bar, they are rarely encountered.

Recent browsers understand `svh`, `lvh` and `dvh` (28/10/2026). For an old browser, we first write the old value, then the new one: a browser that does not know the unit ignores the line it does not understand and keeps the previous one.

```css
.landing {
    height: 100vh;           /* fallback: an old browser stops here */
    height: 100dvh;          /* a recent browser replaces the previous line */
}
```

| Need | Recommended unit | Reason |
|---|---|---|
| Landing screen or window that must always be fully visible | `dvh` | Fills exactly the visible area, bar or not |
| Block that must not change size during scrolling | `svh` | Stable value: the block does not "breathe" when the bar moves |
| Background that must cover the screen even when the bar retracts | `lvh` | Goes down to the bottom of the large window |

As `dvh` is recalculated continuously, a block that uses it is resized at each movement of the bar: it can move under the reader's eyes. And, for a block that contains text, we write `min-height` rather than `height` (see [the checklist](#checklist-for-holding-at-200-and-300)).

```css
.landing {
    /* fallback: at least the height of the screen, more if the text requires it */
    min-height: 100vh;
    min-height: 100dvh;      /* recent version: the height really visible */
}
```

## Sizing functions: `calc()`, `min()`, `max()` and `clamp()`

A **CSS function** is a value that computes its result: its name is followed by parentheses that contain its **arguments** (the values given to it), separated by commas. `var(--name)` is one of them. The four sizing functions below all accept every unit of this chapter, mixed together.

### `calc()`: calculating with several units

`calc()` performs a calculation that the browser resolves at display time. Its interest: mixing units that cannot be added by hand (a percentage and `rem`, for example).

```css
:root {
    --gap: 1rem;                         /* CSS variable of the root: a spacing */
}

.column {
    /* width of the parent minus 2 rem: 768 px for a parent of 800 px */
    width: calc(100% - 2rem);
    padding: calc(var(--gap) * 2);       /* double the variable: 2 rem */
    margin-top: calc(100% / 3);          /* a third of the width of the parent */
}
```

| Operator | Rule | Valid example | Invalid example |
|---|---|---|---|
| `+` | **Mandatory space** on each side | `calc(1rem + 2vw)` | `calc(1rem+2vw)` |
| `-` | **Mandatory space** on each side | `calc(100% - 2rem)` | `calc(100%-2rem)` |
| `*` | One of the two sides is a number without a unit | `calc(var(--gap) * 2)` | `calc(1rem * 2rem)` (two lengths) |
| `/` | The right side is a number without a unit | `calc(100% / 3)` | `calc(100% / 2rem)` (to avoid: dividing by a length) |

The spaces around `+` and `-` are mandatory because `-2rem` is also read as **a negative number**: without a space, the browser sees two values stuck together rather than a subtraction. An invalid value is not reported by an error: the line is ignored silently, and the property keeps its previous value or its default value. The spaces are not required around `*` and `/`, but we write them out of habit. The full details are on the [MDN page of `calc()`](https://developer.mozilla.org/en-US/docs/Web/CSS/calc).

### `min()` and `max()`: the smallest, the largest

`min(a, b)` returns the smallest of the values, `max(a, b)` the largest. The reading trap: `min()` sets a **ceiling** (the result will never exceed the smaller value), and `max()` a **floor** (the result will never drop below the larger one).

```css
.content {
    /* the smaller of the two: never wider than 40 rem (640 px) */
    width: min(100%, 40rem);
}

.title {
    font-size: max(1rem, 2vw); /* the larger of the two: never below 1 rem (16 px) */
}
```

| Expression | In the case of | Values compared | Result |
|---|---|---|---|
| `min(100%, 40rem)` | Parent of 500 px | 500 px and 640 px | 500 px |
| `min(100%, 40rem)` | Parent of 900 px | 900 px and 640 px | 640 px |
| `max(1rem, 2vw)` | Window of 400 px | 16 px and 8 px | 16 px |
| `max(1rem, 2vw)` | Window of 1000 px | 16 px and 20 px | 20 px |

`width: min(100%, 40rem)` is equivalent to `width: 100%; max-width: 40rem;` in a single line. The MDN pages for [`min()`](https://developer.mozilla.org/en-US/docs/Web/CSS/min) and [`max()`](https://developer.mozilla.org/en-US/docs/Web/CSS/max) detail their syntax.

### `clamp()`: a fluid size, bounded on both sides

`clamp(minimum, preferred, maximum)` chooses the **preferred** value as long as it stays between the two bounds, otherwise the nearest bound. It is the equivalent of `max(minimum, min(preferred, maximum))`. With a preferred part that depends on the width of the window, the size grows **gradually** with the screen (we speak of a **fluid** size), without a media query:

```css
.title {
    /* floor: 1 rem (16 px); preferred: 0.5 rem + 2% of the width; max: 2 rem */
    font-size: clamp(1rem, 0.5rem + 2vw, 2rem);
}
```

Here is what this line gives depending on the width of the window (with the root at 16 pixels, so 0.5 rem = 8 px and 1 rem = 16 px):

| Window width | Preferred part `0.5rem + 2vw` | Result | Which value wins |
|---|---|---|---|
| 320 px | 8 + 6.4 = 14.4 px | **16 px** | The floor (14.4 is below 16) |
| 400 px | 8 + 8 = 16 px | **16 px** | The floor and the preferred coincide |
| 600 px | 8 + 12 = 20 px | **20 px** | The preferred |
| 800 px | 8 + 16 = 24 px | **24 px** | The preferred |
| 1000 px | 8 + 20 = 28 px | **28 px** | The preferred |
| 1200 px | 8 + 24 = 32 px | **32 px** | The preferred and the ceiling coincide |
| 1440 px | 8 + 28.8 = 36.8 px | **32 px** | The ceiling (36.8 is above 32) |

Between 400 and 1200 pixels wide, the text grows in a straight line from 16 to 32 pixels; below and above, it stays stuck on the bound.

**How do we choose the preferred part?** We start from what we want: the minimum size from a given width, the maximum size from another. The preferred part is written `intercept + slope × width`, where the **slope** is the number of pixels gained per pixel of window width and the **intercept** is the value we add at the start to get back to the wanted size.

| Step | Calculation | Example: from 16 px at 400 px wide up to 32 px at 1200 px |
|---|---|---|
| 1. Slope in pixels per pixel of width | (max size - min size) / (max width - min width) | (32 - 16) / (1200 - 400) = 0.02 |
| 2. Slope in `vw` | Slope × 100, because 1vw is 1% of the width | 0.02 × 100 = **2vw** |
| 3. Intercept | min size - slope × min width | 16 - 0.02 × 400 = 8 px |
| 4. Intercept in `rem` | Intercept / 16 | 8 / 16 = **0.5rem** |
| 5. Assembly | `clamp(min, intercept + slope, max)` | `clamp(1rem, 0.5rem + 2vw, 2rem)` |

The check is immediate: at 1200 pixels, 8 + 0.02 × 1200 = 32. Another example, from 18 pixels (1.125 rem) at 400 pixels wide up to 24 pixels (1.5 rem) at 1200 pixels: the slope is (24 - 18) / 800 = 0.0075, that is 0.75vw; the intercept is 18 - 0.0075 × 400 = 15 px, that is 0.9375 rem. We therefore write `clamp(1.125rem, 0.9375rem + 0.75vw, 1.5rem)`; check: at 400 pixels, 15 + 3 = 18; at 1200 pixels, 15 + 9 = 24.

`clamp()` is not limited to text: `padding: clamp(1rem, 4vw, 3rem)` makes a spacing vary with the screen. The details are on the [MDN page of `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp). Inside `clamp()`, `min()`, `max()` or a `calc()`, a calculation is written without repeating `calc()`: `0.5rem + 2vw` is enough, with the same mandatory spaces.

### The trap of a lone `vw` in a font size

A font size written **only** in `vw` depends only on the width of the window:

```css
.brittle {
    font-size: 2vw;           /* 2% of the width: 25.6 px at 1280 px, 6.4 px at 320 px */
}
```

Three defects follow. It does not follow the user's font size setting, which does not change the width of the window. It also does not grow when zooming, as the section on enlargement calculates a little further down. Finally, on a small screen it becomes tiny: at 320 pixels wide, `2vw` gives 6.4 pixels, unreadable. The rule is therefore: **always add a part in `rem`** (like the `0.5rem` of the `clamp()` example), and express the bounds in `rem` rather than in pixels, so that they follow the user's setting.

## Enlarging text to 200% and 300%: what WCAG requires

The **WCAG** (*Web Content Accessibility Guidelines*) is the reference of web accessibility rules published by the [W3C](https://www.w3.org/) (*World Wide Web Consortium*), the body that standardizes the web (see [Color and contrast](/?c=ui-ux&p=couleur-et-contraste) and [accessibility in UX](/?c=ui-ux&p=accessibilite-ux), which present its levels A, AA and AAA). Two of its criteria, both at **level AA** (the level targeted by default), concern enlargement:

| Number | Title | What the criterion requires | Official page |
|---|---|---|---|
| 1.4.4 | Resize Text | The text can be enlarged up to **200%**, without a specialized tool, **without loss of content or function** | [W3C: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) |
| 1.4.10 | Reflow | At **320 CSS pixels wide** (a 400% zoom on a 1280-pixel window), the content displays **without horizontal scrolling**, and without loss of content or function | [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) |

A **horizontal scrolling** is the bar that forces you to slide the page from left to right to read a line: it breaks reading, as one must constantly go back. The criterion allows exceptions for content whose meaning requires a two-dimensional layout (data table, map, image), and sets an equivalent of 256 pixels of **height** for content that scrolls horizontally.

**And 300%?** No criterion sets this level: it lies between the two official thresholds (200% and 400%). It is a useful **test level**: on a 1280-pixel window, a 300% zoom gives a width of about 427 pixels, an intermediate size where breakpoints designed for specific phones sometimes leave a gap. A page that holds at 200%, 300% and 400% is safe across the whole range.

### Two ways to enlarge: zoom and font size

Users have two ways to get bigger text, with very different effects:

| | Page zoom | Browser font size |
|---|---|---|
| Gesture | Ctrl and `+` (⌘ and `+` on Mac), or Ctrl and the wheel | Browser settings, appearance or fonts section |
| What grows | **Everything**: text, images, pixels, spacing | Only what is expressed in `rem`, `em` or as a percentage of the font size (pixels stay the same) |
| Window width in CSS pixels | **Decreases** (real width / zoom) | Does not change |
| Media queries in `px` | React: the layout switches to the "phone" version | Do not react: the wide layout stays, the text grows inside it |
| Typical risk | Fixed heights too small, fixed header taking up the screen | Columns too narrow, text overflowing fixed-width blocks |

A 200% zoom on a 1280 × 800 pixel window is, for the CSS, equivalent to a window twice as small: 1280 / 2 = 640 pixels wide. The values for each level:

| Zoom | Width in CSS pixels (1280 window) | Height in CSS pixels (800 window) | What the CSS sees |
|---|---|---|---|
| 100% | 1280 | 800 | A computer |
| 200% | 640 | 400 | A width close to that of a small tablet |
| 300% | about 427 | about 267 | A width close to that of a large phone |
| 400% | 320 | 200 | A width close to that of a small phone |

Let's remember the height above all: at 400%, a block written `height: 100vh` measures only 200 CSS pixels. And a fixed 80-pixel CSS header bar would then take up 80 / 200 = 40% of the window.

The breakpoints also follow the font setting if they are written in `em`: in a media query, `em` refers to the browser's default font size (and not to the one the page's CSS defines). Thus `48em` is worth 48 × 16 = 768 pixels by default, but 48 × 32 = 1536 pixels if the user has chosen 32 pixels: a 1280-pixel window is then considered narrow, which suits a text twice as big.

```css
/* 48em: 768 px with the default size (16 px), 1536 px with 32 px chosen */
/* @media applies the block only if the window is at least this wide */
@media (min-width: 48em) {
    .page {
        /* the columns sit side by side only above this threshold */
        display: flex;
    }
}
```

### What happens to a fluid size when enlarged?

The calculation uses the width in CSS pixels from the previous table: a fixed `rem` font size is multiplied by the zoom, whereas the `vw` part of a fluid size decreases at the same time as the window. Here, on a 1280-pixel window, is the **displayed** size (CSS size × zoom) of three expressions:

| Zoom | CSS width | `2rem` | `clamp(1rem, 0.5rem + 2vw, 2rem)` | `2vw` |
|---|---|---|---|---|
| 100% | 1280 | 32 px | 32 px | 25.6 px |
| 200% | 640 | 64 px (×2) | 8 + 12.8 = 20.8 px CSS, so 41.6 px (×1.3) | 12.8 px CSS, so 25.6 px (×1) |
| 300% | 427 | 96 px (×3) | 8 + 8.53 = 16.53 px CSS, so 49.6 px (×1.55) | 8.53 px CSS, so 25.6 px (×1) |
| 400% | 320 | 128 px (×4) | 16 px CSS (floor), so 64 px (×2) | 6.4 px CSS, so 25.6 px (×1) |

Reading: `2rem` grows exactly like the zoom. `2vw` **does not grow at all** (×1 at each level): the enlargement is cancelled by the shrinking window, hence its condemnation. `clamp()` grows, but less than the zoom (×1.3 at 200%) as long as its `vw` preferred part weighs. With the font setting at 32 pixels, the same calculation gives 0.5 × 32 + 0.02 × 1280 = 41.6 pixels, that is again ×1.3.

This table is a calculation, not a verdict: it does not indicate whether criterion 1.4.4 is met, which is judged with the page open. It is enough to decide: for **body text**, stay with fixed `rem` (`1rem`), which grows exactly by the requested zoom; reserve `clamp()` for **large headings**, with a moderate gap between the bounds; and test at 200%.

### Checklist for holding at 200% and 300%

| Risk | What breaks at 200% or 300% | Fix |
|---|---|---|
| Fixed width in pixels (`width: 1200px`) | A horizontal scroll bar | `max-width` plus `width: 100%`, or `width: min(100%, 75rem)` |
| Fixed height in pixels on a text block | The text sticks out of the block or is cut | `min-height`, or do not fix the height |
| `height: 100vh` for a block containing text | At 400%, the height is only 200 CSS pixels | `min-height: 100vh` (then `min-height: 100dvh`) |
| `overflow: hidden` on a container (setting that hides what sticks out of the box) | What sticks out is **cut**, so lost | `overflow: visible` (default), or `overflow: auto` for a table or a code block |
| [flex](/?c=langages&s=css&p=flexbox) or [grid](/?c=langages&s=css&p=grid) element that refuses to shrink | The container overflows the screen | `min-width: 0` (smallest allowed width: zero) on the flex element; `minmax(0, 1fr)` for a grid column |
| Very long word or address | A line that cannot be broken sticks out of the block | `overflow-wrap: anywhere` (allows breaking a word that is too long) |
| Line spacing in pixels (`line-height: 24px`) | The lines overlap when the text grows | `line-height: 1.5` (number without a unit) |
| Image or SVG wider than the screen | Horizontal scrolling | `max-width: 100%; height: auto;` (see [images](/?c=langages&s=html&p=liens-et-images) and [SVG](/?c=langages&s=html&p=svg-dans-la-page)) |
| Header stuck to the top of the window (`position: fixed` or `sticky`, see [positioning](/?c=langages&s=css&p=positionnement)) | It covers a large part of the narrow window | Set it back to `position: static` (normal scrolling) in a media query for narrow windows |
| Button with a fixed height | Its label overflows | `min-height` and `padding` in `em` |

The **`overflow`** governs what happens when content sticks out of its box:

| Value | Effect |
|---|---|
| `visible` (default) | The content sticks out and remains visible |
| `hidden` | What sticks out is hidden, permanently |
| `auto` | A scroll bar appears only if needed |
| `scroll` | A scroll bar is always present |

The [MDN page of `overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) lists the other values. Here is why `min-width: 0` is useful in a flex container: by default, a flex element refuses to become narrower than its content (its minimum value is `auto`, which is the width of the longest word or the largest image it contains). A long word or a wide image therefore keeps it wide, and the container sticks out of the screen. Likewise, in a grid, `1fr` is in fact written `minmax(auto, 1fr)`: the same minimum applies.

```css
.cards {
    display: flex;           /* the children sit on one line (see Flexbox) */
    flex-wrap: wrap;         /* they go to the next line when there is no room */
    gap: 1rem;               /* space of 1 rem between the elements */
}

.card {
    flex: 1 1 15rem;         /* can grow, can shrink, starting width 15 rem */
    min-width: 0;            /* the element can become narrower than its content */
    overflow-wrap: anywhere; /* breaks a word that is too long where needed */
}
```

`overflow-wrap` decides whether a word too long for its line can be broken in the middle: `normal` (default) lets it stick out; `anywhere` breaks it anywhere (and takes this break into account in the minimum width calculation of a flex or grid element, which `break-word`, another value of the same setting, does not do); see the [MDN page of `overflow-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-wrap). To break cleanly at syllables, `hyphens: auto` (see [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/hyphens)) adds a hyphen, but it requires the language of the page to be declared by `lang` on `<html>` (see [the structure of a document](/?c=langages&s=html&p=structure-dun-document)).

For a grid, `min()` handles the case of a column wider than the screen:

```css
.gallery {
    display: grid;
    /* each column: at least 12 rem, or the whole container if it is narrower */
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: 1rem;               /* space between the cells */
}
```

With `minmax(200px, 1fr)` instead, a column could not go below 200 pixels: in a narrower container, the grid would overflow. The combination `min(100%, 12rem)` brings the minimum back to the width of the container.

Here is the same component before and after correction:

```css
/* BEFORE: everything breaks at 200% or 300% */
.page {
    width: 1200px;           /* fixed width: horizontal scrolling below 1200 px */
}

.header {
    height: 80px;            /* fixed height: the enlarged text overflows */
    overflow: hidden;        /* and the overflow is cut: the text is lost */
}

.content {
    line-height: 24px;       /* fixed line spacing: the lines overlap */
}
```

```css
/* AFTER: the page adapts to the real space */
.page {
    width: 100%;             /* takes the width of the window */
    max-width: 75rem;        /* at most 1200 px (75 × 16) with the default setting */
    /* 0 at top and bottom, auto on left and right: centered block */
    margin: 0 auto;
    padding: 0 1rem;         /* inner margin on the left and right */
}

.header {
    min-height: 5rem;        /* at least 80 px by default, more if the text requires it */
}

.content {
    line-height: 1.5;        /* 1.5 times the size of the text: follows the enlargements */
}
```

The unitless number of `line-height: 1.5` is **inherited as is**: each child recalculates it with its own font size, whereas a value in pixels is passed on in pixels to the children, even if they have a bigger text ([inheritance](/?c=langages&s=css&p=variables-et-cascade) passes on a frozen value). To understand the property, see the [MDN page of `line-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/line-height).

### How to test

No rule in this chapter replaces a real test in a browser: the calculations above predict the result, but only the display shows a cut line or an unexpected scroll bar.

| Test | How | What to check |
|---|---|---|
| Font size at 200% | In the browser settings, choose 32 px as the default font size (16 px by default), then reload the page | Text in `rem` doubles; nothing is cut or overlapping |
| Font size at 300% | Same setting, with 48 px | Same; the columns stay readable |
| Zoom 200% | Ctrl and `+` up to 200% on a 1280 px window | The layout switches to the narrow version, without loss |
| Zoom 300% | Up to 300% | No gap between the two versions of the layout |
| Zoom 400% | Up to 400%: the window measures 320 CSS pixels | **No horizontal scroll bar** (criterion 1.4.10) |
| Back to normal | Ctrl and `0` | Restores the zoom to 100% |

Browser menus vary from one version to another: search for "font size" in the search field of its settings. For each level, we check four points: no horizontal scroll bar (except for a table or a map), no cut text, all buttons and links usable with the keyboard and the mouse, and nothing hidden under a fixed header or footer.

To find which element causes horizontal scrolling, we can query the page from the **console**, the area of the developer tools (opened with the F12 key) where we type JavaScript (see [the DOM](/?c=langages&s=javascript&p=dom-et-evenements), [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) and [functions](/?c=langages&s=javascript&p=fonctions)):

```javascript
// Visible width of the page: that of the root <html>, without the scroll bar
const width = document.documentElement.clientWidth;

// querySelectorAll("*"): all the elements; [...] puts them in an array
// filter keeps those whose right edge (right) goes beyond the visible width
const offenders = [...document.querySelectorAll("*")].filter(
    (element) => element.getBoundingClientRect().right > width
);

// console.log writes the list to the console: a click on an element highlights it
console.log(offenders);
```

`getBoundingClientRect()` returns the rectangle that the element occupies in the window; its `right` property is the position of its right edge in pixels. The list displayed contains the elements whose box sticks out of the window on the right: these are the ones to fix (a menu deliberately hidden off screen is also listed, without being an error). See [arrays](/?c=langages&s=javascript&p=tableaux) for `filter`.

## Which unit for which need

| Need | To write | Why |
|---|---|---|
| Size of a body text | `1rem` | Follows the browser setting and the zoom |
| Space that follows the text of an element (button) | `em` | Stays proportionate to its own text |
| Width of a text column | `max-width: 65ch` | Comfortable line length, suited to the font |
| Width of a block that must not exceed a limit | `width: min(100%, 40rem)` | Adapts to small screens, caps on large ones |
| Full-screen height on mobile | `min-height: 100vh` then `min-height: 100dvh` | Follows the address bar, with a fallback |
| Large fluid heading | `clamp(1.75rem, 1.125rem + 2.5vw, 3rem)` | Grows with the screen, bounded, follows the root |
| Line spacing | `1.5` without a unit | Follows the size of the text |
| Breakpoint | `@media (min-width: 48em)` | Follows the default font size |
| Thin border, shadow | `1px` | Must not grow with the text |
| Image | `max-width: 100%; height: auto` | Never exceeds its parent |

The fluid heading of the table follows the method of the steps above, from 28 pixels (1.75 rem) at 400 pixels wide up to 48 pixels (3 rem) at 1200 pixels: the slope is (48 - 28) / 800 = 0.025, that is 2.5vw; the intercept is 28 - 0.025 × 400 = 18 px, that is 1.125 rem. Check: at 400 pixels, 18 + 10 = 28; at 1200 pixels, 18 + 30 = 48.

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| `html { font-size: 16px; }` | Freezes the root: `rem` no longer follows the user's font size setting |
| `html { font-size: 62.5%; }` so that `1rem` is 10 px | Follows the setting, but all the text not redefined drops to 10 px (unreadable), and every size must be recounted (`1.6rem` for 16 px) |
| `em` on nested elements | The size multiplies at each level: 16, 24, 36, 54 px for `1.5em` |
| `font-size: 2vw` alone | Grows neither with the zoom nor with the user's setting; 6.4 px at 320 px wide |
| Bounds of `clamp()` in pixels | They ignore the user's setting: write `1rem` and `2rem` |
| Body text in `clamp()` | The `vw` part slows the enlargement (×1.3 at 200% zoom on 1280 px): reserve it for large headings |
| `100vh` on a phone | The bottom of the block sticks out below the edge of the screen when the address bar is visible |
| `width: 100vw` on a computer | `vw` counts the vertical scroll bar: the block overflows its width and creates horizontal scrolling; prefer `100%` |
| `calc(100%-2rem)` without spaces | Invalid value, line silently ignored |
| `min()` and `max()` swapped | `min()` caps and `max()` floors: the effect is counter-intuitive |
| `height: 100%` without a height on the parent | The percentage is ignored: the height stays automatic |
| `height` in pixels on a text block | The enlarged text sticks out of the block |
| `overflow: hidden` around a text | The enlarged text is cut, so lost |
| `line-height` in pixels | The lines overlap as soon as the text grows |
| Flex or grid element without `min-width: 0` | A single long word is enough to overflow the whole container |
| `<meta name="viewport" ... user-scalable=no>` (or `maximum-scale=1`) | Forbids pinch zoom on mobile, contrary to criterion 1.4.4 (see [the structure of a document](/?c=langages&s=html&p=structure-dun-document)) |
| Testing only with zoom | Pixels grow with zoom but not with the font size setting: both cases must be tested |

## Best practices

| Best practice | Why |
|---|---|
| Leave `html { font-size: 100%; }` and write font sizes in `rem` | The text follows the user's setting |
| Reserve `em` for spaces proportional to the text of the same element | No compounding, the button keeps its proportions |
| Convert mockup sizes to `rem` (px / 16) | Same default rendering, but respects the setting |
| Use `min-height` rather than `height` for a text block | The block grows with its content |
| Write `100vh` then `100dvh` (or `svh` / `lvh` depending on the need) | Fallback for old browsers, exact height on mobile |
| Set `max-width` in `rem` or `ch`, with `width: 100%` | The layout adapts from 320 px to the wide screen |
| `clamp()` for large headings, with bounds and intercept in `rem` | Fluid, bounded size, which still follows the setting |
| `line-height` as a unitless number | The line spacing follows the text |
| `min-width: 0`, `minmax(0, 1fr)` and `overflow-wrap: anywhere` in flex and grid components | No long word makes the page overflow |
| Breakpoints in `em` | They follow the default font size |
| Test at 200%, 300% and 400%, by zoom **and** by font size | The two ways of enlarging produce different problems |

## Key Takeaways

| | |
|---|---|
| **To remember** | A CSS size is a number and a unit. `px` is absolute; `em`, `rem`, `%`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex` and `lh` are relative. `rem` follows the root (16 px by default, adjustable by the user) whereas `px` ignores this setting; `em` compounds in nested elements. On mobile, `svh` is the height with the bar visible, `lvh` with the bar hidden, `dvh` the current height; we write `100vh` then `100dvh` as a fallback. `calc()` mixes units (mandatory spaces around `+` and `-`); `min()` caps, `max()` floors; `clamp(min, preferred, max)` gives a fluid size whose preferred part is computed as `intercept + slope × width` (for example `clamp(1rem, 0.5rem + 2vw, 2rem)`). WCAG requires text that can be enlarged to 200% (criterion 1.4.4, Resize Text) and content without horizontal scrolling at 320 CSS pixels, that is a 400% zoom (criterion 1.4.10, Reflow); 300% is an intermediate test level. |
| **Pitfalls to avoid** | Root in pixels; `62.5%` badly compensated; nested `em`; lone `vw` in a font size; `clamp()` bounds in pixels; `100vh` on a phone; `100vw` with a scroll bar; `calc(100%-2rem)`; `min()` and `max()` inverted; heights and line spacings in pixels; `overflow: hidden` around text; flex and grid elements without `min-width: 0`; mobile zoom blocked by `user-scalable=no`; testing only one of the two ways of enlarging. |
| **Best practices** | Font sizes and general spacing in `rem`, `em` for what follows the text of the element; `min-height`, `max-width` and `width: min(100%, ...)` rather than fixed dimensions; `100vh` followed by `100dvh`; `clamp()` for large headings, with bounds in `rem`; `line-height` unitless; `overflow-wrap: anywhere` and `min-width: 0`; breakpoints in `em`; real test at 200%, 300% and 400% by zoom and by font size. |
