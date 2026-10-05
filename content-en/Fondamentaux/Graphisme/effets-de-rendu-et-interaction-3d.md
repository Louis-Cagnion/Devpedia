---
order: 6
---

# Rendering effects and 3D interaction

Once a scene is loaded (the [.obj format](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)) and displayed ([GLFW/GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)), four needs come up often: visually enriching the render (a glass object, for example), animating it with no external data, dressing an object that has no texture coordinates, and letting the user interact with the scene via the mouse. This chapter covers these four needs.

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

## Fresnel reflection: the more you look at a slant, the more it reflects

On a window, a lake or a glass marble, the surface lets light through when you look at it head-on, and acts like a mirror when you look at it at a grazing angle. This is the **Fresnel effect**: the share of light that is **reflected** (sent back) grows with the angle between the viewing direction and the **normal** (the vector perpendicular to the surface, see [buffers, textures and shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl)). The exact computation is heavy; **Schlick's approximation** (named after its author) is enough in real time:

```text
F = F0 + (1 - F0) x (1 - cos(angle))^5

F0    : share reflected head-on (about 0.04 for glass, i.e. 4%)
angle : between the normal and the direction to the eye; cos(angle) = dot product of the two
        (two vectors of length 1)
F     : final reflected share, between F0 (head-on) and 1 (fully slanted)
```

```glsl
vec3 n = normalize(world_normal);                    // surface normal, length 1
vec3 v = normalize(camera_pos - world_pos);          // direction from the point to the eye
float cos_angle = max(dot(n, v), 0.0);               // 1 head-on, 0 fully slanted
float fresnel = 0.04 + 0.96 * pow(1.0 - cos_angle, 5.0);   // pow(a, b): a to the power b

vec3 mirrored = texture(env_map, reflect(-v, n)).rgb;      // what the mirror sends back
vec3 final_color = mix(refracted_color, mirrored, fresnel);
```

`texture(env_map, direction)` reads the cubemap (declared `uniform samplerCube env_map`) in a given direction, and `.rgb` extracts the red, green and blue components of the result (a `vec4`). `reflect(i, n)` is a GLSL function that returns the direction of a ray `i` after bouncing off a surface of normal `n` (here `-v`, the ray going from the eye to the point). `mix(a, b, t)` blends two values: `a x (1 - t) + b x t`, that is `a` for `t = 0` and `b` for `t = 1`. The result: the refracted color (the one from the previous section, with its fringes) at the center of the marble, and more and more of the reflected environment toward its edges.

## A cloud inside: ray-marching

To give a crystal a hazy interior, nothing is drawn inside it: a ray is made to **march** through the object in small steps, and at each step the **density** of a function (0 = empty, 1 = very dense) is accumulated. This is **ray-marching**, not to be confused with [raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage), which looks for a single point of impact.

```glsl
uniform float time;                                   // elapsed seconds, set by the C program

float density(vec3 p)                                 // cloud density at point p
{
	return clamp(sin(p.x * 3.0) * sin(p.y * 3.0 + time) * sin(p.z * 3.0), 0.0, 1.0);
}                                                     // clamp(x, 0.0, 1.0) bounds x to the range 0..1

float cloud_opacity(vec3 entry, vec3 dir, float thickness)   // dir: length 1; thickness: distance crossed
{
	const int STEPS = 24;                             // number of steps, fixed
	float step_len = thickness / float(STEPS);
	float opacity = 0.0;                              // 0 = transparent, 1 = opaque
	for (int i = 0; i < STEPS && opacity < 0.95; i++)
	{
		vec3 p = entry + dir * (float(i) + 0.5) * step_len;      // middle of step i
		opacity += (1.0 - opacity) * density(p) * step_len * 4.0; // adds what is left to cover
	}
	return opacity;
}
```

The result is blended with the glass color: `mix(glass_color, cloud_color, cloud_opacity(...))`.

| Choice | Effect | Cost or pitfall |
|---|---|---|
| Number of steps (`STEPS`) | The more steps, the finer the cloud | The cost is **per pixel**, multiplied by the number of steps: 24 steps on a 2-million-pixel screen make nearly 50 million `density` calls per frame |
| Early exit (`opacity < 0.95`) | No point continuing once the cloud is almost opaque | None, and it saves steps |
| Half-step offset (`+ 0.5`) | Samples the middle of the step rather than its edge | Without it, the bands of the steps show |
| Distance crossed | An approximate value is enough (for example the object's diameter) | Computing it exactly requires the ray/object intersection |

## Drawing a transparent object

A crystal shows what is behind it: its color has to be **blended** with what is already on screen. OpenGL does this with **blending**, enabled by `glEnable(GL_BLEND)`, with the formula chosen by `glBlendFunc`:

```text
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA) gives:

final color = alpha x fragment color + (1 - alpha) x color already on screen

alpha: opacity of the fragment, 4th value of the color (vec4) returned by the fragment shader;
       1 = opaque, 0 = invisible
```

Three rules follow.

- **Opaque objects first.** The depth test (see [the drawing pipeline](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl)) rejects any pixel located behind an already drawn pixel. A glass drawn first would therefore hide whatever is behind it: the blend would have nothing to blend. Opaque objects are drawn without blending, then blending is enabled for the transparent ones.
- **A crystal is drawn in two passes: the inside, then the outside.** A glass marble has a back face (seen through the glass) and a front face. **Face culling** lets you choose which one the graphics card ignores: `glEnable(GL_CULL_FACE)`, then `glCullFace(GL_FRONT)` ignores front faces (so the back of the crystal is drawn), `glCullFace(GL_BACK)` ignores back faces (the front is drawn, on top). Without this, front and back faces blend in an arbitrary order and the result flickers.
- **The order of the vertices decides what a front face is.** A triangle is "front-facing" when its vertices appear counterclockwise on screen (the default setting, `glFrontFace(GL_CCW)`). A mesh whose triangles are listed the other way round has its front faces taken for back faces: they are culled in the wrong pass, or lit with a reversed normal, and the object appears black (the `max(dot(...), 0.0)` of the lighting drops to 0).

```c
glEnable(GL_CULL_FACE);                              /* face culling enabled */
draw_opaque_objects();                               /* 1. opaque ones, no blending */

glEnable(GL_BLEND);
glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);   /* blend formula above */
glCullFace(GL_FRONT);                                /* 2. the back of the crystal first */
draw_crystal();
glCullFace(GL_BACK);                                 /* 3. then its front, on top */
draw_crystal();
glDisable(GL_BLEND);                                 /* for the next frame */
```

> **Pitfall:** a crystal that shows up black or half empty almost always comes from one of these three settings (opaque/transparent order, culled face, vertex order), without any error message: OpenGL reports nothing, it does what it was told. Test first with `GL_CULL_FACE` disabled: if the object reappears, it is the vertex order.

## Procedural animation: recomputing rather than replaying

Unlike **keyframe** animation (positions recorded ahead of time and interpolated), a **procedural** animation recomputes an object's position or deformation on every frame, from a formula depending on elapsed time, with no external data at all:

```c
float height = amplitude * sinf(elapsed_time * speed);
position.y = height;   // makes an object "float" up and down, indefinitely
```

No data is stored for this animation: it's entirely determined by the formula and the elapsed time, which makes it trivial to run indefinitely (unlike a keyframe sequence, necessarily finite) and cheap in memory.

> **Pitfall:** using the raw number of elapsed frames (`frame_count`) directly rather than actual elapsed time (in seconds). A frame-count-based animation runs faster on a machine that displays more frames per second, exactly the same pitfall already seen for a [render loop](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) based on time.

## A damped spring: a value that eases toward its target

For a value (the scale of an object being hovered, an offset, a deformation) to reach its **target** without an abrupt jump, it is tied to it by a **spring**: the larger the gap, the harder it pulls. On its own, a spring would oscillate forever; a **damping** (a friction proportional to speed) gradually wears the motion out.

```c
typedef struct s_spring
{
	float pos;   /* current value */
	float vel;   /* rate of change of pos, in units per second */
}	t_spring;

void	spring_update(t_spring *s, float target, float stiffness, float damping, float dt)
{
	float	accel;

	if (dt > 0.05f)
		dt = 0.05f;                                           /* bounded step, see below */
	accel = stiffness * (target - s->pos) - damping * s->vel; /* pulls toward target, brakes */
	s->vel += accel * dt;                                     /* speed first... */
	s->pos += s->vel * dt;                                    /* ...then position */
}
```

`stiffness` measures the restoring force per unit of gap; `damping` the braking force per unit of speed; `dt` is the time elapsed since the previous frame (see [delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#delta-time-a-speed-that-does-not-depend-on-the-machine)). The behavior depends on the ratio between the two:

| Damping | Behavior |
|---|---|
| 0 | Oscillates around the target forever |
| Low | Overshoots the target, bounces, dies out ("elastic" effect) |
| `2 x sqrt(stiffness)` (called **critical**) | Reaches the target as fast as possible, without overshooting |
| High | Reaches the target slowly, without overshooting |

> **Pitfall (the unbounded time step):** if a frame lasts very long (window dragged, program suspended for a second), `dt` is large and the step above overshoots the target by more than the starting gap: at every frame the gap grows, the value diverges, then becomes `inf` or `NaN`. Hence the `dt <= 0.05` cap (50 ms): the spring catches up over several frames rather than blowing up in one.

## Bounding a deformation with `tanh`

A deformation driven by the mouse or by a spring can receive an arbitrarily large value, and an object stretched by a factor of 1000 is unusable. `clamp` (cutting off sharply at a bound) limits it, but creates a **kink**: the deformation grows, then freezes all at once. The **hyperbolic tangent**, `tanh` (in C `tanhf` from `<math.h>`, see also [the activation functions](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) that use it), is an S-shaped curve that stays close to `x` around 0 then flattens out smoothly toward -1 and 1:

```c
/* brings any value back into ]-limit, limit[ ; limit > 0 */
float	soft_bound(float raw, float limit)
{
	return (limit * tanhf(raw / limit));
}
```

| `raw` (with `limit = 1`) | `soft_bound` |
|---|---|
| 0.1 | 0.0997 (almost unchanged) |
| 1 | 0.762 |
| 3 | 0.995 |
| 100 | 1.000 (saturates) |

> **Pitfall:** `limit` at 0 (division by zero) or negative (inverted bounds) gives `NaN` or an upside-down result: refuse it before the call. And `tanhf` lets a `NaN` input through as is: the bound protects against a huge value, not against an invalid one.

## Triplanar mapping: a texture without UV coordinates

A [texture](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl) is applied thanks to the `(u, v)` coordinates carried by each vertex. A mesh generated by a program, or an `.obj` without `vt` lines, has none. **Triplanar mapping** does without them: it projects the texture along **the three axes** (one projection along x, one along y, one along z), using two of the position's coordinates as `(u, v)`, then blends the three results according to the surface's orientation.

```glsl
uniform sampler2D tex;                  // sampler2D: a 2D texture the shader can read
in vec3 world_pos;                      // position of the fragment in the scene
in vec3 world_normal;
out vec4 color;

void main()
{
	vec3 w = pow(abs(normalize(world_normal)), vec3(4.0));   // abs: absolute value of each component
	w /= (w.x + w.y + w.z);                                   // weight per axis, sum equal to 1
	vec3 cx = texture(tex, world_pos.yz).rgb;                 // .yz: y and z components of the position, projection along x
	vec3 cy = texture(tex, world_pos.xz).rgb;                 // along y
	vec3 cz = texture(tex, world_pos.xy).rgb;                 // along z
	color = vec4(cx * w.x + cy * w.y + cz * w.z, 1.0);
}
```

A face turned toward x (normal `(1, 0, 0)`) gives a weight of 1 to the projection along x: the texture is seen head-on. On an oblique face, several weights are nonzero and the projections blend together. Raising to the power 4 tightens the blending zones; otherwise the image gets blurry wherever the normal is not aligned.

The same scheme works for a **computed** pattern rather than one read from an image, for example bricks: every other row is shifted by half a brick, and the edges of each brick form the mortar joint.

```glsl
float brick(vec2 p)                                   // 1 = brick, 0 = joint
{
	p *= vec2(2.0, 4.0);                              // 2 bricks wide, 4 rows per unit
	p.x += 0.5 * mod(floor(p.y), 2.0);                // floor: integer part; mod: remainder of the division
	vec2 f = fract(p);                                // fract: part after the decimal point, position inside the brick
	return step(0.06, f.x) * step(0.1, f.y);          // step(s, x): 0 if x < s, 1 otherwise; 0 on the edges
}

// in main(), instead of the three texture reads:
float b = brick(world_pos.yz) * w.x + brick(world_pos.xz) * w.y + brick(world_pos.xy) * w.z;
color = vec4(mix(vec3(0.3), vec3(0.7, 0.3, 0.2), b), 1.0);   // gray for the joint, rust for the brick
```

| Advantage | Limit |
|---|---|
| No `(u, v)` coordinate to supply or repair (no seam) | Three texture reads per pixel instead of one |
| Works on any mesh, even one deformed at run time | The texture does not follow the surface: on a rotating object it stays fixed in the scene, unless the position inside the object is used rather than in the scene |
| No visible stretching on faces parallel to the axes | Blur in the blending zones, and an oriented pattern (letters) sometimes appears flipped depending on the face |

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
| **Key takeaways** | Chromatic aberration simulates light dispersion by computing refraction 3 times (once per color channel), with a slightly different index of refraction each time. A procedural animation recomputes a position on every frame via a formula depending on actual elapsed time, with no external data. Mouse picking converts a 2D click into a 3D ray via the inverted projection/view matrices, in the reverse order of normal rendering. Fresnel reflection (Schlick's approximation) makes the reflected share grow with the slant angle. Ray-marching accumulates a density in small steps for an interior cloud. A transparent object is drawn after the opaque ones, in two passes (back then front) with `GL_SRC_ALPHA`. A damped spring reaches its target without a jump, and `tanh` bounds a deformation smoothly. Triplanar mapping textures an object without UVs by projecting along the three axes. |
| **Tools you can use** | A cubemap for the refracted and reflected environment, `reflect`, `mix`, `pow`. `glBlendFunc`, `glCullFace`, `glFrontFace` for transparency. A time-based formula (`sinf(time * speed)`) or a damped spring to animate. `tanhf` to bound. Three texture reads weighted by the normal for triplanar mapping. The inverse of the projection and view matrices for picking. |
| **Pitfalls to avoid** | Too large a gap between the indices of refraction (unrealistic result). Animating by frame count rather than actual elapsed time. Drawing a transparent object before the opaque ones, or reversing the vertex order (black or empty object, with no error). A spring with no cap on the time step (divergence, `NaN`). A `ray-marching` with too many steps (per-pixel cost). |
| **Best practices** | Keep the indices of refraction close to each other for a believable result. Always base an animation on actual time, never on the number of elapsed frames. Cap `dt` in a spring and refuse a zero or negative limit for `tanh`. For a black object, test first without `GL_CULL_FACE`. |
