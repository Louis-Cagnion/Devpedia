---
order: 8
---

# CSS Gradients (linear, radial, conic)

A **gradient** is a progressive transition between several colors, usable anywhere a plain color is (`background`, `border-image`...), with no image or external file. Three forms exist, distinguished by the **direction** the color progresses in.

## `linear-gradient()`: progressing in a straight line

```css
.bar {
    background: linear-gradient(to right, #4a90d9, #d94a90);
    /* progresses in a straight line, from left to right */
}
```

| Parameter | Role |
|---|---|
| Direction (`to right`, `45deg`...) | The axis the color progresses along |
| Colors (2 or more, comma-separated) | The transition's stops, evenly spread by default |

## `radial-gradient()`: progressing in concentric circles

```css
.halo {
    background: radial-gradient(circle, #ffffff, #000000);
    /* progresses from the center outward, in concentric circles */
}
```

Starts from a central point and progresses outward, in increasingly larger circles (or ellipses), rather than in a straight line.

## `conic-gradient()`: an angular progression, around a central point

```css
.progress-ring {
    width: 100px;
    height: 100px;
    border-radius: 50%;   /* makes the element round */
    background: conic-gradient(#4a90d9 75%, #e0e0e0 0);
    /* the color "rotates" around the center, like a clock's hands */
}
```

Unlike the previous two, the color progresses neither in a straight line nor in concentric circles: it **rotates** around a central point, like the hands of a clock. `conic-gradient(#4a90d9 75%, #e0e0e0 0)` fills 75% of the turn in blue, then the rest in gray: combined with `border-radius: 50%`, this pattern draws a circular progress ring with no SVG (`stroke-dasharray`) or JavaScript needed to compute the shape.

| | `linear-gradient` | `radial-gradient` | `conic-gradient` |
|---|---|---|---|
| Direction of progression | Straight line | Concentric circles, outward from the center | Rotation around a central point |
| Typical use case | Background, button, readability overlay on an image | Light halo, vignette | Progress ring/gauge, color wheel |

> **Best practice:** `conic-gradient()` on a `border-radius: 50%` element is a lightweight alternative to an SVG progress ring, as long as the shape stays a simple circle filled by percentage; switch to SVG as soon as the gauge needs a variable stroke width or rounded ends (`stroke-linecap`), which `conic-gradient()` can't produce.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A gradient transitions between several colors with no image needed. `linear-gradient` progresses in a straight line, `radial-gradient` in concentric circles from a center, `conic-gradient` by rotating around a central point. |
| **Tools you can use** | `linear-gradient(direction, colors...)`, `radial-gradient(shape, colors...)`, `conic-gradient(colors...)` combined with `border-radius: 50%` for a progress ring. |
| **Pitfalls to avoid** | Recreating in SVG/JavaScript a simple circular progress ring that `conic-gradient()` draws in a single line of CSS. |
| **Best practices** | Choose the gradient shape based on the actual direction of the intended progression, not out of habit for always using the same one. Switch to SVG only once `conic-gradient()` no longer suffices (variable stroke width/ends). |
