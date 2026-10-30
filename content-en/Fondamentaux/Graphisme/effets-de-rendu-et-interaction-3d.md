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

### The Beer-Lambert law: why opacity follows an exponential

The line `opacity += (1.0 - opacity) * ...` of the loop above adds "what is left to cover" at each step: it imitates a physical law, the Beer-Lambert law. In a medium of uniform density (fog, smoke, frosted glass), each slice of the same thickness absorbs the same **fraction** of the light reaching it, not the same amount. The share of light that gets through (the **transmission**) therefore decreases exponentially with thickness:

```text
transmission = exp(-density x thickness)   share of light that gets through, between 0 and 1
opacity      = 1 - transmission            share stopped: 1 - exp(-density x thickness)

density: absorption per unit of thickness (2 = two units of absorption per unit crossed)
```

`exp(x)` is the **exponential** function ([reference page](https://registry.khronos.org/OpenGL-Refpages/gl4/html/exp.xhtml)): the number e (about 2.718281828) raised to the power `x`. It equals 1 for `x = 0`, and `exp(-x)` gets closer to 0 as `x` grows, without ever reaching it or becoming negative. The opacity therefore always stays between 0 and 1, however thick or dense the medium is. For a density of 2 (values computed by a script):

| Thickness | Transmission `exp(-2 x thickness)` | Opacity `1 - exp(-2 x thickness)` | Opacity if we simply added (`2 x thickness`) |
|---|---|---|---|
| 0 | 1.0000 | 0.0000 | 0 |
| 0.25 | 0.6065 | 0.3935 | 0.5 |
| 0.5 | 0.3679 | 0.6321 | 1 |
| 1 | 0.1353 | 0.8647 | 2 (impossible) |
| 2 | 0.0183 | 0.9817 | 4 (impossible) |
| 3 | 0.0025 | 0.9975 | 6 (impossible) |

Two half-thicknesses **multiply**: 0.3679 x 0.3679 = 0.1353, which is exactly the transmission of thickness 1 (0.135335 in both cases, to within a millionth). This is what makes the loop possible: crossing the cloud slice by slice and multiplying the transmissions amounts to crossing its total thickness in one go.

The loop above applies this multiplication step by step, but it replaces `exp(-x)` with `1 - x`, a good approximation only when `x` (here `density x step`) is small. A more faithful version adds up the density along the whole ray (the total is called the **optical thickness**), then applies `exp` **only once**, at the end:

```glsl
float cloud_opacity_beer(vec3 entry, vec3 dir, float thickness)   // same parameters
{
	const int STEPS = 24;                             // number of steps, fixed
	float step_len = thickness / float(STEPS);        // length of one step
	float optical = 0.0;                              // accumulated optical thickness
	for (int i = 0; i < STEPS && optical < 3.0; i++)  // 3.0: opacity of about 0.95
	{
		vec3 p = entry + dir * (float(i) + 0.5) * step_len;   // middle of step i
		optical += density(p) * step_len * 4.0;               // we add, without capping
	}
	return 1.0 - exp(-optical);                       // a single exp, outside the loop
}
```

The early exit tested `opacity < 0.95`; here, `1 - exp(-3)` equals 0.9502, hence the threshold of 3 on the optical thickness. Comparison for a constant density of 2 (the factor `4.0` set to 1, without early exit), with the exact result `1 - exp(-density x thickness)`:

| Thickness | Exact | Loop above, 4 steps | Loop above, 24 steps | Sum then `exp`, 4 or 24 steps |
|---|---|---|---|---|
| 0.5 | 0.6321 | 0.6836 | 0.6399 | 0.6321 |
| 1 | 0.8647 | 0.9375 | 0.8761 | 0.8647 |
| 2 | 0.9817 | 1.0000 | 0.9874 | 0.9817 |

The sum followed by an `exp` gives the exact result whatever the step size when the density is constant; when it varies, the error comes only from the sampling resolution. The trap of the recurrence is more serious than this gap: with 4 steps, a thickness of 3, a constant density of 2 and the `4.0` factor set to 1 as in the comparison above, the first step already adds `density x step = 1.5`: the opacity reaches 1.5 on the first pass, the early exit stops the loop and returns 1.5, an impossible opacity. With `1.0 - exp(-optical)`, the result never leaves the interval from 0 to 1.

> **Pitfall:** a negative density (a badly bounded `density` function) gives `exp` of a positive number, hence a negative opacity. That is why `density` above has `clamp(..., 0.0, 1.0)`: keep it.

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

### Semi-implicit Euler: why speed is updated before position

The spring above advances frame by frame: this is **numerical integration**, a simulation in small steps where `dt` (the duration of a frame, in seconds, see [delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#delta-time-a-speed-that-does-not-depend-on-the-machine)) is the **time step**. The simplest rule, the **Euler method**, says: "new value = old value + change per second x `dt`". A spring makes two values evolve at once, its position `pos` and its speed `vel`, and the order of the two updates changes the result:

| Method | Order within the step | What each line reads |
|---|---|---|
| Euler **explicit** | `pos += vel x dt`, then `vel += accel x dt` | Both lines read the state from the **start** of the step |
| Euler **semi-implicit** (the one used by the spring above) | `vel += accel x dt`, then `pos += vel x dt` | The position reads the speed **already updated**: a value from the end of the step, hence "half implicit" |

The test: a **spring without damping**, pulled to 1 then released. In physics it oscillates forever with the same amplitude, because its **energy** never changes. The energy is the sum of the motion energy (`0.5 x vel x vel`) and the stretch energy (`0.5 x stiffness x pos x pos`); here, 2 at the start. A good method must keep it roughly constant.

```c
#include <stdio.h>                                  /* printf */

typedef struct s_spring
{
	float	pos;   /* offset from the rest position */
	float	vel;   /* rate of change of pos, in units per second */
}	t_spring;

void	step_explicit(t_spring *s, float stiffness, float dt)
{
	float	accel;

	accel = -stiffness * s->pos;   /* restoring force (no target or friction here) */
	s->pos += s->vel * dt;         /* position first, with the OLD speed */
	s->vel += accel * dt;          /* then speed, with the old position */
}

void	step_semi_implicit(t_spring *s, float stiffness, float dt)
{
	float	accel;

	accel = -stiffness * s->pos;   /* restoring force, computed only once */
	s->vel += accel * dt;          /* speed first... */
	s->pos += s->vel * dt;         /* ...then position, with the NEW speed */
}

float	energy(t_spring s, float stiffness)
{
	/* motion energy + stretch energy */
	return (0.5f * s.vel * s.vel + 0.5f * stiffness * s.pos * s.pos);
}

int	main(void)
{
	t_spring	a = {1.0f, 0.0f};   /* spring pulled to 1, released with no speed */
	t_spring	b = {1.0f, 0.0f};   /* same start for the second method */
	int			n;

	for (n = 1; n <= 10000; n++)
	{
		step_explicit(&a, 4.0f, 0.016f);        /* stiffness 4, step of 16 ms */
		step_semi_implicit(&b, 4.0f, 0.016f);   /* same values */
		if (n == 1 || n == 100 || n == 1000 || n == 10000)
			printf("step %5d : explicit %.4f, semi-implicit %.4f\n",
				n, energy(a, 4.0f), energy(b, 4.0f));
	}
	return (0);
}
```

Actual output of the program (compiled with `gcc -Wall -Wextra`):

```text
step     1 : explicit 2.0020, semi-implicit 1.9980
step   100 : explicit 2.2155, semi-implicit 1.9963
step  1000 : explicit 5.5657, semi-implicit 1.9708
step 10000 : explicit 55710.1133, semi-implicit 2.0244
```

| Method | Energy after 10 000 steps (start: 2) | What happens |
|---|---|---|
| Euler explicit | 55710.1133 | Each step multiplies the energy by `1 + stiffness x dt x dt` (here 1.001024): the spring **gains** energy and its oscillations grow without end |
| Euler semi-implicit | 2.0244 (between 1.9685 and 2.0325 over the whole run) | The energy **oscillates** around 2 without drifting: the amplitude stays stable for as long as you like |

The explicit factor can be checked: 1.001024 to the power 1000 gives 2.7829, and 5.5657 / 2 indeed gives 2.7829. A tiny error per step (0.1%), repeated at every frame, becomes huge within a few minutes. With the damping of the previous section, the flaw persists: at stiffness 4 and damping 0.01 (same step), the energy measured after 10 000 steps is 11240 with explicit, although friction should wipe it out, and 0.41 with semi-implicit, which does wipe it out. This is why `spring_update` updates `vel` **before** `pos`, and why the order of the two lines must not be swapped "because it comes to the same thing".

The cap on `dt` is still needed, even with semi-implicit: this method is stable only if `dt` is below `2 / sqrt(stiffness)` (`sqrt`: the square root). For a stiffness of 400, the limit measured by bisection (cutting the interval in two until the limit is found) is 0.10000, that is `2 / sqrt(400)`. The function below measures the largest deviation reached over 200 steps (`isnan` tests whether a value is `NaN`, *Not a Number*, the result of an impossible computation such as `inf - inf`, where `inf` is infinity):

```c
#include <math.h>                         /* fabsf: absolute value; isnan */

/* uses t_spring and step_semi_implicit, defined above */
float	max_pos(float stiffness, float dt, int steps)
{
	t_spring	s = {1.0f, 0.0f};   /* start: pulled to 1, no speed */
	float		big = 1.0f;         /* largest deviation seen, 1 at the start */
	int			i;

	for (i = 0; i < steps; i++)
	{
		step_semi_implicit(&s, stiffness, dt);   /* one step of the method */
		if (isnan(s.pos))                        /* exploded: we stop */
			return (s.pos);
		if (fabsf(s.pos) > big)                  /* new record of deviation */
			big = fabsf(s.pos);
	}
	return (big);
}
```

| `dt` (stiffness 400) | Largest deviation over 200 steps | Verdict |
|---|---|---|
| 0.016 (one frame at 60 frames per second) | 1.01305 | Stable |
| 0.050 (the cap of the spring above) | 1 | Stable |
| 0.090 | 2.29416 | Amplitude inflated |
| 0.099 | 7.08858 | Just under the 0.1 limit: very inflated |
| 0.101 | 1.4314e+25 | Just above: divergence |
| 0.110 | `NaN` (displayed as `-nan`) | Exploded |
| 1.000 (a one-second pause) | `NaN` (displayed as `-nan`) | Exploded |

The cap of 0.05 is therefore safe as long as the stiffness stays under 1600 (`2 / 0.05` = 40, and 40 squared = 1600); with a stiffer spring, the cap must be lowered.

> **Pitfall:** swapping the two update lines produces no error and no warning: the spring seems to work, and only after seconds or minutes, or with weak damping, does the oscillation grow. Keep `vel` before `pos`, then cap `dt` taking the stiffness into account.

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
| **Key takeaways** | Chromatic aberration simulates light dispersion by computing refraction 3 times (once per color channel), with a slightly different index of refraction each time. A procedural animation recomputes a position on every frame via a formula depending on actual elapsed time, with no external data. Mouse picking converts a 2D click into a 3D ray via the inverted projection/view matrices, in the reverse order of normal rendering. Fresnel reflection (Schlick's approximation) makes the reflected share grow with the slant angle. Ray-marching accumulates a density in small steps for an interior cloud, and the Beer-Lambert law (`opacity = 1 - exp(-density x thickness)`) keeps the opacity between 0 and 1. A transparent object is drawn after the opaque ones, in two passes (back then front) with `GL_SRC_ALPHA`. A damped spring reaches its target without a jump, advanced by semi-implicit Euler (speed is updated before position, which keeps the energy stable where explicit Euler gains energy at every step), and `tanh` bounds a deformation smoothly. Triplanar mapping textures an object without UVs by projecting along the three axes. |
| **Tools you can use** | A cubemap for the refracted and reflected environment, `reflect`, `mix`, `pow`, `exp` for Beer-Lambert attenuation. `glBlendFunc`, `glCullFace`, `glFrontFace` for transparency. A time-based formula (`sinf(time * speed)`) or a damped spring to animate. `tanhf` to bound. Three texture reads weighted by the normal for triplanar mapping. The inverse of the projection and view matrices for picking. |
| **Pitfalls to avoid** | Too large a gap between the indices of refraction (unrealistic result). Animating by frame count rather than actual elapsed time. Drawing a transparent object before the opaque ones, or reversing the vertex order (black or empty object, with no error). A spring with no cap on the time step (divergence, `NaN`). A `ray-marching` with too many steps (per-pixel cost). An opacity summed without `exp` (it exceeds 1). The two spring update lines in the wrong order (the oscillation grows with no visible error). |
| **Best practices** | Keep the indices of refraction close to each other for a believable result. Always base an animation on actual time, never on the number of elapsed frames. Sum the density along the ray, then apply `1.0 - exp(-optical)` only once. Update `vel` before `pos`, cap `dt` below `2 / sqrt(stiffness)` in a spring, and refuse a zero or negative limit for `tanh`. For a black object, test first without `GL_CULL_FACE`. |
