---
order: 6
---

# Escape-Time Fractals: Mandelbrot and Julia

An **escape-time fractal** colors each pixel of an image based on how fast a sequence of numbers tied to that pixel "escapes" toward infinity, or never does.

## The principle: iterate and count

For Mandelbrot, each pixel of the image is turned into a complex number `c` (its position in the plane). The formula `z = z² + c` is then iterated, starting from `z = 0`:

```text
z0 = 0
z1 = z0² + c
z2 = z1² + c
z3 = z2² + c
...
```

If `z`'s modulus (its distance from the origin) exceeds a fixed threshold (the **escape radius**, often `2`), the sequence "escapes": it will never come back and will grow forever. The number of iterations performed before that escape determines the pixel's color; if `z` never escapes before a fixed maximum number of iterations, the pixel belongs to the **Mandelbrot set** and is colored black.

```text
For each pixel (converted into a complex number c):
    z = 0
    iterations = 0
    while |z| <= escape_radius AND iterations < max_iterations:
        z = z*z + c
        iterations += 1
    pixel color = function(iterations)
```

## Mandelbrot vs. Julia

| | Mandelbrot | Julia |
|---|---|---|
| `c` | Becomes the pixel's position | Fixed, chosen once for the whole image |
| Starting `z` | Always `0` | Becomes the pixel's position |
| Result | A single image, the same "map" every time | A different image for each chosen value of `c` |

Julia uses exactly the same iteration loop as Mandelbrot; only the initial assignment of `c` and `z` changes.

## Avoiding a square root on every iteration

Computing `z`'s exact modulus (`√(real_part² + imaginary_part²)`) on every iteration would require a square root per iteration and per pixel, an expensive computation repeated millions of times. Since only the comparison against the escape radius matters, comparing the modulus's **square** against the radius's **square** gives exactly the same result, without ever computing a square root:

```text
real_part² + imaginary_part² <= escape_radius²
```

> **Best practice:** square the comparison threshold once (`escape_radius * escape_radius`) rather than recomputing a square root on every iteration of every pixel: a direct performance gain on a computation already repeated millions of times per image.

> **Going further:** a generalization exists with a non-integer exponent `d` (*Multibrot*, `zᵈ + c`), computed by converting `z` to polar form (modulus and angle) and applying De Moivre's theorem (`zᵈ = rᵈ·(cos(dθ) + i·sin(dθ))`): beyond the scope of this chapter, but the same iterate-and-count principle applies.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An escape-time fractal iterates a formula (`z = z² + c` for Mandelbrot/Julia) and colors each pixel based on how many iterations happen before `z` exceeds a fixed threshold (or never, for the set itself). |
| **Tools you can use** | Comparing the modulus's square against the escape radius's square, to avoid a square root per iteration. |
| **Pitfalls to avoid** | Recomputing an actual square root on every iteration to test for escape, when comparing squares is enough. |
| **Best practices** | Precompute the escape radius's square once before the render loop. |
