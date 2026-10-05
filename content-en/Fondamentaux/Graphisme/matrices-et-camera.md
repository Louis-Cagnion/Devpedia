---
order: 5
---

# Matrices and camera

The [previous chapter](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl) sends vertices to the graphics card, but they appear as they are, flat. To **move** an object, **rotate** it and **view it in perspective** from a camera, you need **matrices**. This chapter builds the three matrices of a 3D render, the camera, the perspective, the rotation around an arbitrary axis, and the computation that automatically frames an object.

> **Prerequisites:** a [matrix](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel) is a table of numbers, and multiplying a matrix by a [vector](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) gives a new vector. Here, each matrix **transforms** a point: it moves it, rotates it or squashes it toward the screen.

## From the object to the screen: model, view, projection

A vertex changes **frame** (coordinate system) four times before reaching a pixel. Three matrices perform these changes:

| Matrix | Common name | Goes from... to... | Contains |
|---|---|---|---|
| **M** | *model* | the object → the **world** | Position, rotation, scale of this object |
| **V** | *view* | the world → the **camera** | Where the camera is and where it looks |
| **P** | *projection* | the camera → the **screen** | Perspective (distant objects shrink) |

```text
object vertex          world frame           camera frame            screen coordinates
  (x, y, z, 1)  --M-->   (world)     --V-->    (camera)       --P-->   (clip → NDC)
```

"Clip" is the raw result of `P`; it becomes screen coordinates (NDC) after the division described in the perspective section.

The vertex shader (the [program run for each vertex](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), seen in the previous chapter) computes `P * V * M * vertex`: read it **from right to left** (first M, then V, then P). Reversing the order gives a wrong result, with no error.

**Why 4×4 matrices for 3D points?** A point `(x, y, z)` is written `(x, y, z, 1)`, called **homogeneous coordinates** ([explanation](https://en.wikipedia.org/wiki/Homogeneous_coordinates)). The fourth column of the matrix is then used to **translate** (move), which a 3×3 matrix cannot do. The fourth number is also used for perspective (see below).

| Transformation | 4×4 matrix (rows) |
|---|---|
| **Translation** by `(tx, ty, tz)` | `1 0 0 tx` / `0 1 0 ty` / `0 0 1 tz` / `0 0 0 1` |
| **Scale** by `(sx, sy, sz)` | `sx 0 0 0` / `0 sy 0 0` / `0 0 sz 0` / `0 0 0 1` |
| **Rotation** by `a` around Z | `cos a  -sin a  0 0` / `sin a  cos a  0 0` / `0 0 1 0` / `0 0 0 1` |

`cos a` and `sin a` are the **cosine** and the **sine** of the angle `a`, expressed here in **radians** (an angle unit: 180° is π ≈ 3.14 rad and 90° is ≈ 1.57 rad): two numbers between -1 and 1 that give the point `(cos a, sin a)` reached by turning by `a` from `(1, 0)` on a circle of radius 1.

> **Pitfall (order of the elements in memory):** OpenGL expects the matrix **column by column** (*column-major*): the element at row `r` and column `c` is at index `c * 4 + r` of the array of 16 `float`. The table above therefore reads `m[12]`, `m[13]`, `m[14]` for `tx`, `ty`, `tz`. It is sent with `glUniformMatrix4fv(loc, 1, GL_FALSE, m)`; the `GL_FALSE` means "do not **transpose**" (swap rows and columns, see the [transpose](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel#la-transposee-echanger-lignes-et-colonnes)), because the array is already in the right order. A matrix written row by row and sent as is produces a distorted or missing object.

## The camera: `look_at`

A camera does not really exist: we **move the world in the opposite direction**. The view matrix places the camera at the origin, facing the **-Z** axis. It is built from three pieces of information: the eye position (`eye`), the point looked at (`target`) and the up direction (`up`, often `(0, 1, 0)`).

Two vector operations come up. **Normalizing** a vector means dividing it by its length so that it equals 1, keeping its direction (`(0, 3, 4)` becomes `(0, 0.6, 0.8)`). The **cross product** `a x b` of two vectors is a third vector **perpendicular** (at a right angle) to both, zero if `a` and `b` are parallel (`(1, 0, 0) x (0, 1, 0) = (0, 0, 1)`). The **dot product** (`vdot`, seen in the [chapter on vectors](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) is 0 for two perpendicular vectors.

```text
f = normalize(target - eye)      forward: where the camera looks
s = normalize(f x up)            right: perpendicular to f and up  (x = cross product)
u = s x f                        real up: perpendicular to the other two
```

These three mutually perpendicular directions form the rows of the view matrix; the last column cancels the eye position.

A `NaN` value (*Not a Number*) is the special result of a `float` for an impossible computation (`0 / 0`): it flows through all later computations without any error ([details](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)). Hence the test written `!(len > 1e-6f)` rather than `len <= 1e-6f`: the first also rejects `NaN`, the second lets it through.

```c
typedef struct { float x, y, z; } Vec3;

/* Normalizes v. Returns 0 (and touches nothing) if its length is almost zero. */
static int vnormalize(Vec3 *v)
{
	float len = sqrtf(v->x * v->x + v->y * v->y + v->z * v->z);

	if (!(len > 1e-6f))                      /* the form "!(a > b)" also rejects NaN */
		return 0;
	v->x /= len;
	v->y /= len;
	v->z /= len;
	return 1;
}

/* View matrix (column by column). Returns 0 if the eye is on the target or if
   the viewing direction is parallel to "up": the right vector is then undefined. */
int look_at(float m[16], Vec3 eye, Vec3 target, Vec3 up)
{
	Vec3 f = vsub(target, eye);              /* vsub, vcross, vdot: basic vector computations */
	Vec3 s, u;

	if (!vnormalize(&f))
		return 0;
	s = vcross(f, up);
	if (!vnormalize(&s))
		return 0;
	u = vcross(s, f);
	memset(m, 0, 16 * sizeof(float));
	m[0] = s.x;  m[4] = s.y;  m[8]  = s.z;   m[12] = -vdot(s, eye);
	m[1] = u.x;  m[5] = u.y;  m[9]  = u.z;   m[13] = -vdot(u, eye);
	m[2] = -f.x; m[6] = -f.y; m[10] = -f.z;  m[14] =  vdot(f, eye);
	m[15] = 1.0f;
	return 1;
}
```

Check by execution, with `eye = (3, 2, 5)` and `target = (1, 0, 0)`: the eye becomes `(0, 0, 0)` and the target `(0, 0, -5.74)`, exactly the distance between them, on the -Z axis.

> **Pitfall (the degenerate case):** when looking **straight up or straight down** (`f` parallel to `up`), the cross product `f x up` is zero and the normalization divides by zero: the matrix fills with `NaN` and the screen goes empty. `look_at` must **refuse** this case with a precise message, or the caller must then pick another `up` (for example `(0, 0, 1)`). Same if `eye == target`.

## The perspective

The projection matrix squashes the visible volume, a **truncated pyramid** (the *frustum*), into a cube. Four parameters define it:

| Parameter | Role | Valid domain |
|---|---|---|
| `fov` | **Vertical** opening angle (*field of view*), in radians | `0 < fov < π` |
| `aspect` | Width / height of the window | `aspect > 0` |
| `near` | Distance of the **near** plane: anything closer is cut | `near > 0` |
| `far` | Distance of the **far** plane: anything farther is cut | `far > near` |

`tanf` computes the **tangent** of an angle: the wider the opening angle, the larger it grows, and the more "zoomed out" the scene looks. On Windows, `<windows.h>` defines `near` and `far` as **macros** (words the preprocessor replaces with text before compilation, see [headers and macros](/?c=langages&s=c&p=headers)): the parameters are therefore named `near_plane` and `far_plane`.

```c
/* Perspective projection matrix (column by column). Returns 0 if a parameter is out of
   its domain. */
int perspective(float m[16], float fov, float aspect, float near_plane, float far_plane)
{
	float f;

	if (!(fov > 0.0f && fov < 3.14159265f) || !(aspect > 0.0f)
		|| !(near_plane > 0.0f) || !(far_plane > near_plane))
		return 0;
	f = 1.0f / tanf(fov / 2.0f);             /* wide opening angle: small f, "zoomed out" scene */
	memset(m, 0, 16 * sizeof(float));
	m[0] = f / aspect;
	m[5] = f;
	m[10] = (far_plane + near_plane) / (near_plane - far_plane);
	m[11] = -1.0f;                           /* copies -z into w: this is what creates the perspective */
	m[14] = 2.0f * far_plane * near_plane / (near_plane - far_plane);
	return 1;
}
```

**Where is the perspective?** The result `(x, y, z, w)` of `P * V * M * vertex` is not yet the screen: the graphics card divides it by `w` (the **perspective divide**). Since `m[11] = -1`, `w` equals the **distance** to the camera: the farther a point, the more we divide, the smaller it gets. After the division, `z` lies between -1 (near plane) and +1 (far plane), this is the **NDC** space (*normalized device coordinates*). Measured with `near = 0.1` and `far = 100`: a point at `z = -0.1` gives -1, a point at `z = -100` gives +1.

> **Pitfall (domain violations):** each one breaks the image **without any OpenGL error**.
>
> | Violation | Consequence |
> |---|---|
> | `near = 0` | Division by zero: infinite matrix, nothing left on screen |
> | `near > far` | Inverted depth: the distant object passes in front |
> | `fov = π` or `0` | Infinite or zero `tan`: empty image |
> | `aspect = 0` (window reduced to a line) | Division by zero |
> | tiny `near` | **Unusable** depth: at `z = -50`, the normalized depth is already 0.998, so almost the whole object falls on a few neighboring values, and two close surfaces "fight" (*z-fighting*, flickering) |
>
> For `near` and `far`, prefer a reasonable `far / near` ratio (a few thousand at most) to a `near` "as small as possible".

A computation like `near = distance - radius` can be 0 (or even negative) when the camera touches the object: the section on framing below explains the remedy.

## Rotating an object: accumulated rotation

For a mouse rotation, the temptation is to keep the object oriented by **a single 3×3 matrix** `R` and, at each frame, to multiply it by a small rotation `d`: `R = d * R`. Each product rounds the `float`s; the three rows of `R`, supposed to stay perpendicular and of length 1 (the matrix is then called **orthonormal**), slowly **drift**: the matrix distorts (tilts, stretches) the object instead of just rotating it.

| Number of small rotations (0.01 rad) | Measured deviation from a true rotation |
|---|---|
| 100 | 0.000004 |
| 10,000 | 0.00014 |
| 100,000 | 0.0014 |
| 1,000,000 | 0.014 |

The remedy: **re-orthonormalize** from time to time, that is, straighten the rows (the **Gram-Schmidt** process, [details](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)).

```c
/* Straightens a drifted 3×3 rotation matrix (rows): rows of length 1,
   perpendicular. After the call on the case above, the deviation falls back to 1e-7. */
void reorthonormalize(float r[3][3])
{
	Vec3 a = {r[0][0], r[0][1], r[0][2]};
	Vec3 b = {r[1][0], r[1][1], r[1][2]};
	Vec3 c;
	float d;

	vnormalize(&a);                          /* 1st row: length 1 */
	d = vdot(b, a);
	b = (Vec3){b.x - d * a.x, b.y - d * a.y, b.z - d * a.z};   /* removes from b its part parallel to a */
	vnormalize(&b);
	c = vcross(a, b);                        /* 3rd row: perpendicular to the other two */
	r[0][0] = a.x; r[0][1] = a.y; r[0][2] = a.z;
	r[1][0] = b.x; r[1][1] = b.y; r[1][2] = b.z;
	r[2][0] = c.x; r[2][1] = c.y; r[2][2] = c.z;
}
```

> **Alternative:** a **quaternion** ([overview](https://en.wikipedia.org/wiki/Quaternion)) represents a rotation with 4 numbers instead of 9 and is straightened by dividing it by its norm (its length). Using a matrix remains reasonable as long as you re-orthonormalize.

## Rotating around an arbitrary axis: Rodrigues' formula

Rotating around X, Y or Z is simple (table above). For an **arbitrary axis** `k` (vector of length 1) and an angle `θ`, **Rodrigues' formula** ([details](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula)) gives the matrix directly:

| Term | Value (with `c = cos θ`, `s = sin θ`, `t = 1 - c`) |
|---|---|
| Diagonal | `c + t·k.x²`, `c + t·k.y²`, `c + t·k.z²` |
| Off-diagonal | `t·k.a·k.b` plus or minus `s·k.c`, where `c` is the **third** axis (a, b, c = x, y, z in cyclic order); the signs are those of the code below |

```c
/* Rotation by "angle" (radians) around "axis" (normalized here), rows r[row][column]. */
void rotation_from_axis_angle(float r[3][3], Vec3 axis, float angle)
{
	float c = cosf(angle), s = sinf(angle), t = 1.0f - c;
	Vec3 k = axis;

	vnormalize(&k);
	r[0][0] = c + t * k.x * k.x;        r[0][1] = t * k.x * k.y - s * k.z;  r[0][2] = t * k.x * k.z + s * k.y;
	r[1][0] = t * k.x * k.y + s * k.z;  r[1][1] = c + t * k.y * k.y;        r[1][2] = t * k.y * k.z - s * k.x;
	r[2][0] = t * k.x * k.z - s * k.y;  r[2][1] = t * k.y * k.z + s * k.x;  r[2][2] = c + t * k.z * k.z;
}
```

Check: 90° around `(0, 0, 1)` sends `(1, 0, 0)` to `(0, 1, 0)` (up to rounding noise: `-4e-8`).

> **Pitfall:** the axis must have **length 1**, otherwise the matrix is no longer a rotation. The function normalizes it itself; a zero axis (`(0, 0, 0)`) stays zero and produces a wrong matrix, to be refused upstream.

## Recovering the axis and angle of a rotation

The inverse operation, useful to compare two orientations or to animate between them, extracts the angle from the **trace** (the sum of the diagonal elements, `r00 + r11 + r22`, where `rij` is the element at row `i` and column `j`, counting from 0) and the axis from the differences between elements symmetric about the diagonal (`r21 - r12`, ...). `acos` (arccosine) recovers the angle whose cosine is known, but only accepts values between -1 and 1:

| Step | Formula |
|---|---|
| Angle | `θ = acos((r00 + r11 + r22 - 1) / 2)` |
| Axis (general case) | `k` has the direction of `(r21 - r12, r02 - r20, r10 - r01)`, then normalized |

Three pitfalls, all met in practice:

| Case | Problem | Remedy |
|---|---|---|
| The result of `(trace - 1) / 2` exceeds 1 by `1e-7` | `acos` returns `NaN` | **Clamp** the value into `[-1, 1]` before `acos` |
| `θ ≈ 0` | The axis is **undefined** (no rotation: every axis fits) | Return a default axis and report "no rotation" |
| `θ ≈ 180°` | `sin θ ≈ 0`: the vector `(r21 - r12, ...)` vanishes, the axis becomes noise | Use `(R + I) / 2 = k·kᵀ`: the column with the largest diagonal equals `k_i · k` |

In the last row, `I` is the **identity matrix** (1s on the diagonal, 0s elsewhere: it changes nothing) and `k·kᵀ` is the 3×3 matrix whose element `(i, j)` equals `k_i · k_j`.

```c
/* Extracts axis and angle from a 3×3 rotation. Returns 0 if the angle is almost zero (arbitrary axis). */
int axis_angle_from_rotation(float r[3][3], Vec3 *axis, float *angle)
{
	float cos_a = (r[0][0] + r[1][1] + r[2][2] - 1.0f) / 2.0f;
	Vec3 k;

	if (cos_a > 1.0f)                        /* rounding can leave [-1, 1] */
		cos_a = 1.0f;
	if (cos_a < -1.0f)
		cos_a = -1.0f;
	*angle = acosf(cos_a);
	k = (Vec3){r[2][1] - r[1][2], r[0][2] - r[2][0], r[1][0] - r[0][1]};
	if (*angle < 1e-4f) {
		*axis = (Vec3){0.0f, 0.0f, 1.0f};
		return 0;
	}
	if (3.14159265f - *angle < 1e-3f) {      /* half turn: these differences vanish */
		int i = 0;

		for (int d = 1; d < 3; d++)          /* column with the largest diagonal: the most reliable */
			if (r[d][d] > r[i][i])
				i = d;
		k = (Vec3){(r[0][i] + (i == 0)) / 2.0f, (r[1][i] + (i == 1)) / 2.0f,
			(r[2][i] + (i == 2)) / 2.0f};
	}
	vnormalize(&k);
	*axis = k;
	return 1;
}
```

Tested on 4 axes (including `(0, 0, -1)` and `(-1, 0, 0)`) and 6 angles (from `1e-5` to `π`): the recovered axis is the right one, **up to the sign** (at 180°, an axis and its opposite describe the same rotation). At 0°, no axis is defined: the function reports it.

## Automatically framing an object

For an arbitrary object to **fit in the image** at load time, we compute the **bounding box**: the smallest box, with faces parallel to the axes, containing all the vertices (`min` and `max` on each coordinate). From it we derive a **bounding sphere**:

| Value | Computation |
|---|---|
| Center (the point to look at, `target`) | `(min + max) / 2` |
| Radius | Half the diagonal (from corner `min` to corner `max`): `norm(max - min) / 2` |
| Camera distance | `radius / sin(half-angle)`: the sphere then touches the edges of the image |
| `far` | `distance + radius` |
| `near` | `distance - radius`, **clamped** by a minimum (e.g. `far × 0.001`) |

The **half-angle** is the one of the **narrowest** dimension: if the window is taller than wide (`aspect < 1`), it is the horizontal angle `atan(tan(fov / 2) × aspect)` that limits, not `fov / 2` (`atan`, the arctangent, is the inverse of `tan`).

```c
/* Distance and planes to frame a sphere of radius "radius". Returns 0 if a parameter
   is out of domain (zero radius: object reduced to a point, nothing to frame). */
int frame_sphere(float radius, float fov, float aspect,
	float *distance, float *near_plane, float *far_plane)
{
	float half_v = fov / 2.0f;
	float half_h = atanf(tanf(half_v) * aspect);   /* horizontal half-angle */
	float half = fminf(half_v, half_h);            /* the narrower of the two */

	if (!(radius > 0.0f) || !(fov > 0.0f && fov < 3.14159265f) || !(aspect > 0.0f))
		return 0;
	*distance = radius / sinf(half);
	*far_plane = *distance + radius;
	*near_plane = fmaxf(*distance - radius, *far_plane * 1e-3f);   /* never ≤ 0 */
	return 1;
}
```

Worked example: radius 2, `fov = 1` rad, `aspect = 0.5` (window twice as tall as wide): retained half-angle 0.267 rad (the horizontal one), distance 7.59, `near = 5.59`, `far = 9.59`.

> **Pitfall (the phantom vertex):** a single vertex that **no face uses** (leftover of an export, a forgotten `v` line) enlarges the box: the center shifts, the radius inflates, the object appears tiny and off-center. Compute the box **on the vertices actually used**, or remove the orphan vertices beforehand.

## Normalizing a scene's scale

An **absolute constant** is a value expressed in the scene's units: "the camera moves 0.1 per second", "never closer than 0.5 to the object", "margin of 0.2 around the model". It is only right for **one range of sizes**. Outside that range:

| Scene size (radius) | Effect of absolute constants |
|---|---|
| Tiny (0.001) | 0.1 per second is **100 radii per second**: the camera races off; the minimum distance 0.5 exceeds the whole object |
| Within the range (around 1) | Everything is tuned for this size |
| Huge (5,000) | 0.1 per second is 0.00002 radius per second: the camera seems frozen; a margin of 0.2 is invisible |

Two ways to fix it:

| Approach | Cost | Effect on existing scenes |
|---|---|---|
| Make **every constant relative** to the radius | One change per constant, and every future one must be remembered | Changes the render of scenes that worked |
| **Normalize the scene once**: bring it into the range at load time | A single place | None, as long as scenes already in the range are left alone |

Rules for normalization:

1. **Change nothing inside the range** (e.g. radius between 0.5 and 2): scenes that are already well tuned keep exactly their render. Check by comparing screenshots before and after.
2. **One factor for the whole scene**, computed on the bounding sphere of the whole set (see [Automatically framing an object](#automatically-framing-an-object)) and applied to every object: their relative sizes are preserved. One factor per object would give them all the same size.
3. **Compute in double precision**: the square of `1e30` exceeds the largest `float` (≈ 3.4 × 10³⁸) and gives infinity, whereas a `double` handles it (see [floating-point numbers](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)).
4. **Also recenter** a scene that is very far from the origin (see the pitfall below).

```c
#define RADIUS_MIN 0.5      /* radius range for which speeds and margins are tuned */
#define RADIUS_MAX 2.0
#define RADIUS_TARGET 1.0   /* radius aimed at when a rescale is needed */
#define FAR_FACTOR 100.0    /* "far" center: more than 100 radii from the origin */

/* Brings vertices (consecutive x, y, z) into the reference size range, in place.
   Touches nothing if the radius is in the range and the center is near the origin.
   Returns 1 if modified, 0 if left as is, -1 if unusable (message on stderr). */
int normalize_scene(float *vertices, size_t count)
{
	double lo[3], hi[3], center[3], d[3], radius, scale = 1.0;
	size_t i;
	int k;

	if (!vertices || count == 0)
	{
		fprintf(stderr, "empty scene: nothing to normalize\n");
		return -1;
	}
	for (k = 0; k < 3; k++)
		lo[k] = hi[k] = vertices[k];                  /* bounding box: min and max per axis */
	for (i = 0; i < count; i++)
		for (k = 0; k < 3; k++)
		{
			double v = vertices[3 * i + k];           /* float converted to double, lossless */

			if (!isfinite(v))                         /* NaN or infinity: the box would be wrong */
			{
				fprintf(stderr, "vertex %zu: coordinate %d is not finite\n", i, k);
				return -1;
			}
			lo[k] = fmin(lo[k], v);
			hi[k] = fmax(hi[k], v);
		}
	for (k = 0; k < 3; k++)
	{
		center[k] = (lo[k] + hi[k]) / 2.0;
		d[k] = hi[k] - lo[k];
	}
	radius = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]) / 2.0;
	if (!(radius > 0.0))                              /* also rejects NaN; all vertices coincide */
	{
		fprintf(stderr, "zero radius: all vertices coincide\n");
		return -1;
	}
	if (radius < RADIUS_MIN || radius > RADIUS_MAX)
		scale = RADIUS_TARGET / radius;               /* out of range: rescale */
	else if (sqrt(center[0] * center[0] + center[1] * center[1]
			+ center[2] * center[2]) <= FAR_FACTOR * radius)
		return 0;                                     /* in range and centered: touch nothing */
	for (i = 0; i < count; i++)
		for (k = 0; k < 3; k++)
			vertices[3 * i + k] = (float)((vertices[3 * i + k] - center[k]) * scale);
	return 1;
}
```

Tested on 8 scenes: a cube of side 1 stays unchanged (returns 0); radii of `1e30`, `1e-30` and 5,000 all come back to 1; a scene `1e7` away from the origin is recentered; a `NaN`, an empty scene and coinciding vertices are rejected, each with its own message.

> **Pitfall (the precision of a `float`):** a `float` keeps ≈ 7 significant digits. At `10,000,000`, two neighboring `float`s are **1** apart: an object of radius 1 placed there has only a few possible positions, its vertices "jump". Rescaling does not fix that, because the loss happens **when the file is read**; only reading in `double` ([`strtod`](/?c=langages-de-programmation&s=c&p=convertir-un-texte-en-nombre)), recentered before the conversion to `float`, avoids it.

> **Pitfall (a bound expressed in radii):** a minimum camera distance such as `distance ≥ 2 × radius` looks relative, hence harmless. In a scene with several objects, though, it is what decides the camera distance: changing it or making it relative alters the render of those scenes, even in the range where nothing was meant to change. Compare screenshots before and after each adjustment.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Three matrices: M (object → world), V (world → camera), P (camera → screen), applied from right to left (`P * V * M * vertex`). OpenGL reads matrices **column by column**. The view is built with `look_at` (forward, right, up); the perspective divides by `w` and requires `0 < near < far`, `0 < fov < π`, `aspect > 0`. An accumulated rotation drifts: it must be straightened. Rodrigues gives the rotation around an arbitrary axis; the axis/angle extraction has two limit cases (0° and 180°). Framing comes from the bounding sphere. Absolute constants (speeds, margins) only hold for one range of sizes: bring the scene into that range once, with a common factor computed in double precision, leaving scenes already in the range untouched. |
| **Usable tools** | `glUniformMatrix4fv`, `tanf`/`atanf`/`acosf`, cross and dot products. Documentation: [Viewing and Transformations](https://www.khronos.org/opengl/wiki/Viewing_and_Transformations), [Rodrigues](https://en.wikipedia.org/wiki/Rodrigues%27_rotation_formula), [homogeneous coordinates](https://en.wikipedia.org/wiki/Homogeneous_coordinates). |
| **Pitfalls to avoid** | Matrix sent row by row, reversed `M * V * P` order. `look_at` looking straight up (zero cross product, `NaN`). `near = 0` or `near > far` (infinite matrix, inverted depth), tiny `near` (squashed depth, flickering). Accumulated rotation never straightened. `acos` of a value slightly above 1. Axis of a 0° or 180° rotation read without a special case. Bounding box distorted by an orphan vertex. An absolute constant applied to a tiny or huge scene, one factor per object, a square computed in `float` (infinity), a far-away scene rescaled after the precision was already lost, a bound "in radii" that changes the render of multi-object scenes. |
| **Good practices** | Validate each parameter (`!(a > b)` also rejects `NaN`) and name the cause in the message. Clamp before `acos`. Re-orthonormalize an accumulated rotation. Compute `near` and `far` from the radius and clamp them. Test `look_at` and `perspective` on the limit cases before wiring them to the render. Normalize the scale at load time rather than making every constant relative; compare screenshots before and after. |
