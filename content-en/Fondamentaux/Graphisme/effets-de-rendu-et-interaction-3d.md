---
order: 4
---

# Rendering effects and 3D interaction

Once a scene is loaded (the [.obj format](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)) and displayed ([GLFW/GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), three needs come up often: visually enriching the render (a post-processing effect), animating it with no external data, and letting the user interact with it via the mouse. This chapter covers these three needs.

## Chromatic aberration: a post-processing effect

White light passing through a refractive material (glass, water) doesn't bend in exactly the same way depending on its color: this is **chromatic aberration**, visible in photography as a colored fringe on high-contrast edges. A rendering engine can simulate this effect deliberately, as post-processing: rather than computing a ray's refraction once (see [vectors and the dot product](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) for the vector math basics used here), it's computed **three times**, once per color channel, with a slightly different index of refraction each time:

```text
Incoming ray
      |
      v
  Refraction with RED IOR    -> samples the RED channel of the cubemap
  Refraction with GREEN IOR  -> samples the GREEN channel of the cubemap
  Refraction with BLUE IOR   -> samples the BLUE channel of the cubemap
      |
      v
Recombines the 3 channels -> the final result, with its colored fringes
```

A **cubemap** (a texture made of 6 images, one per face of a cube, representing the environment around an object) provides the refracted image: each of the 3 rays, bent slightly differently, samples that same cubemap at a slightly different point, which produces the color separation.

> **Best practice:** keep the 3 indices of refraction close to each other (a variation of a few hundredths is enough). Too large a gap produces a result that no longer looks like realistic glass, but a crude visual artifact.

## Procedural animation: recomputing rather than replaying

Unlike **keyframe** animation (positions recorded ahead of time and interpolated), a **procedural** animation recomputes an object's position or deformation on every frame, from a formula depending on elapsed time, with no external data at all:

```c
float height = amplitude * sinf(elapsed_time * speed);
position.y = height;   // makes an object "float" up and down, indefinitely
```

No data is stored for this animation: it's entirely determined by the formula and the elapsed time, which makes it trivial to run indefinitely (unlike a keyframe sequence, necessarily finite) and cheap in memory.

> **Pitfall:** using the raw number of elapsed frames (`frame_count`) directly rather than actual elapsed time (in seconds). A frame-count-based animation runs faster on a machine that displays more frames per second, exactly the same pitfall already seen for a [render loop](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) based on time.

## Mouse picking: finding which 3D object was clicked

**Picking** answers a precise question: which object, in a 3D scene, did the user just click on, starting from a 2D position (`x`, `y`) on screen? The principle: turn that 2D click into a **ray** in 3D space, then test which object that ray hits first.

```text
Screen click (x, y)
      |
      v  inverse of the projection matrix, then the view matrix
3D ray, from the camera into the scene
      |
      v  ray/object intersection (tests every object in the scene)
Closest object hit by this ray -> the "clicked" object
```

Concretely, the 2D click is first converted to normalized coordinates (between -1 and 1), then the **inverse** of the projection matrix brings that point back into camera space, and the **inverse** of the view matrix then brings it back into world space: two inverted transforms, in the reverse order of the one normally used to display a 3D object on screen.

> **Note:** this mechanism is the exact reverse of the usual rendering pipeline (world → view → projection → screen), hence the use of **inverse** matrices, in **reverse** order.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Chromatic aberration simulates light dispersion by computing refraction 3 times (once per color channel), with a slightly different index of refraction each time. A procedural animation recomputes a position on every frame via a formula depending on actual elapsed time, with no external data. Mouse picking converts a 2D click into a 3D ray via the inverted projection/view matrices, in the reverse order of normal rendering. |
| **Tools you can use** | A cubemap for the refracted environment. A time-based formula (`sinf(time * speed)`) for a simple procedural animation. The inverse of the projection and view matrices for picking. |
| **Pitfalls to avoid** | Too large a gap between the indices of refraction (unrealistic result). Animating by frame count rather than actual elapsed time. |
| **Best practices** | Keep the indices of refraction close to each other for a believable result. Always base an animation on actual time, never on the number of elapsed frames. |
