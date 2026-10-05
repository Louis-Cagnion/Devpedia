---
order: 2
---

# The Wavefront .obj Format and the Phong Model

The [previous chapter](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) simulates 3D from a 2D map, without ever loading a real mesh. A modern 3D rendering engine (OpenGL, Vulkan, Metal) instead starts from an object modeled in a tool like Blender, exported to a text file that has to be read and turned into data the graphics card can use.

## The .obj format: one instruction per line

An **.obj** file (Wavefront format) lists, one line at a time, the geometric data of an object. Each line starts with a keyword indicating the type of instruction:

| Prefix | Content | Example |
|---|---|---|
| `v` | A vertex, as x y z coordinates | `v 0.232406 -1.216630 1.133818` |
| `vt` | A texture coordinate (for mapping an image onto the surface) | `vt 0.5 0.8` |
| `vn` | A normal vector (a surface's orientation, useful for lighting) | `vn 0.0 1.0 0.0` |
| `o` | The name of the object starting at this line | `o Cube` |
| `f` | A face, connecting several already-declared vertices | `f 16 2 3 17` |
| `mtllib` / `usemtl` | Reference to a material file and the material to apply | `mtllib 42.mtl` |
| `s` | Turns normal smoothing on/off for the following faces (smoothing group) | `s off` or `s 1` |

> **Pitfall:** the indices used in an `f` line start at **1**, not 0. `f 16 2 3 17` refers to the 16th vertex declared by a `v` line, not the 17th. This is a classic off-by-one error for anyone writing their first parser for this format, since array indexing usually starts at 0 in most languages.

## Faces with a variable number of vertices

An `f` line doesn't necessarily connect three vertices: a 3D modeling tool often exports faces with 4 vertices (quadrilaterals, or *quads*), or even more. But a graphics card can only natively draw triangles (a surface with more than 3 vertices isn't guaranteed to be flat). So the file must be **triangulated**: each face with 4+ vertices split into several triangles, a processing step in its own right, distinct from simply reading the file.

```text
Face read from the file:             Once triangulated:
f 1 2 3 4                            triangle 1 2 3
(a quad, 4 vertices)                 triangle 1 3 4
```

This method (systematically connecting the first vertex to each following pair of vertices) is called **fan triangulation**. It's simple and fast, but it assumes the face is **convex**: on a concave face, one of the resulting triangles can cover an area that isn't actually part of the shape (the triangle "crosses" the concave notch instead of going around it).

For a potentially concave face, the reference algorithm is **ear clipping**: rather than fixing a reference vertex, it removes one vertex at a time, accepting it only if the triangle it forms with its two neighbors stays correctly oriented (a local cross product compared against the face's normal, see [Vectors and the Dot Product](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) AND contains no other vertex of the face. Since the polygon shrinks with every removal, a [circular doubly linked list](/?c=langages-de-programmation&s=c&p=listes-chainees) is a well-suited structure for implementing it: each removal only requires reconnecting the two neighbors of the removed vertex, with no array shifting.

> **Good practice:** keep reading the file (filling a structure with raw data) and triangulating it in two separate functions rather than merging them. Each then has only one reason to change (see [Single Responsibility and Low Coupling](/?c=qualite-performance-et-outils&s=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage)), and the triangulation can be tested independently of the parser.

### Checking that no vertex is trapped inside the ear

The orientation test alone isn't enough: a correctly oriented triangle can still "swallow" another vertex of the polygon that should remain outside it. So a second test is needed, applied to every remaining vertex of the polygon (other than the 3 vertices of the candidate triangle): the **same-side test**, which checks whether a given point lies inside a triangle.

Principle: a point `P` is inside the triangle `(A, B, C)` if and only if it lies on the same side of each of the 3 edges. This test reuses exactly the same geometric primitive as the orientation test (cross product of two vectors, dot product with the reference normal): only the points passed in change from one call to the next.

```text
side 1 = (B-A) × (P-A) . normal
side 2 = (C-B) × (P-B) . normal
side 3 = (A-C) × (P-C) . normal

P is inside if all 3 results have the same sign (all positive, or all negative)
```

> **Good practice:** a single utility function (cross product of 2 vectors + dot product with the normal) is enough to implement both the orientation test AND the 3 side tests: only the points passed as parameters change. Avoid duplicating this calculation across several functions.

### Verifying a triangulation: the `n - 2` formula

Regardless of the algorithm (fan or ear clipping) and the shape of the polygon (convex or concave), triangulating a simple polygon with `n` vertices always produces exactly `n - 2` triangles (a direct consequence of Meisters's (1975) [two ears theorem](https://en.wikipedia.org/wiki/Two_ears_theorem), which guarantees that every simple non-triangle polygon has at least two clippable "ears"). A count other than `n - 2` in the output is definite proof of a bug; a correct count alone doesn't prove the split is geometrically correct (that must be checked separately, for example by plotting the polygon and its diagonals).

## The .mtl file and the Phong model

An `.obj` generally references an **.mtl** file that describes the surfaces' appearance:

```text
newmtl Material
Ns 96.078431
Ka 0.000000 0.000000 0.000000
Kd 0.640000 0.640000 0.640000
Ks 0.500000 0.500000 0.500000
illum 2
```

| Field | Meaning |
|---|---|
| `Ka` | Ambient color: the color perceived even without direct light |
| `Kd` | Diffuse color: the surface's base color under direct light |
| `Ks` | Specular color: the color of the shiny highlight |
| `Ns` | Specular exponent (*shininess*): the higher it is, the smaller and sharper the highlight |

These four values correspond exactly to the terms of the **Phong reflection model**, a classic lighting algorithm in image synthesis that breaks down the light received by a surface into three combined components: ambient, diffuse, and specular.

> **Pitfall:** an `.mtl` file generally defines only a single material (so a single color) for the whole object. If the need is to visually distinguish different sub-parts (for example, one color per face), that information must come from elsewhere: the `.mtl` doesn't provide it.

## Combined `v/vt/vn` indexing and UV seams

The earlier examples (`f 16 2 3 17`) show only one index per vertex, the one for position (`v`). A real `f` line generally references several lists at once, one index per face corner and per list, separated by `/`:

| Syntax | Reference |
|---|---|
| `f 1 2 3` | Position only (used so far to keep things simple) |
| `f 1/1 2/2 3/3` | Position **and** texture coordinate |
| `f 1/1/1 2/2/2 3/3/3` | Position, texture, **and** normal |
| `f 1//1 2//2 3//3` | Position and normal, no texture (the `//` leaves the texture index empty) |

Why one index per list rather than a single shared index: `v` (positions) and `vt` (texture coordinates) are two independent lists, filled separately by the export tool, with no reason to have the same length or the same order. A single index couldn't refer to both "the 5th vertex" and "the 5th texture coordinate" if these two lists don't line up term for term.

> **UV seam:** a single 3D vertex (one `v` index) may need a different texture coordinate depending on which face references it. Concrete example: the 3 faces of a cube that meet at a shared corner share that vertex, but each face is unfolded to a different spot on the 2D image used as the texture -- so with a different `vt`. A single `v` index combined with one `vt` index per face corner can represent this case; a single index shared between position and texture couldn't.

> **Pitfall:** storing texture coordinates indexed only by vertex (an array `vt_of_vertex[v_index]`) breaks silently at a UV seam: every face that references that vertex with a different `vt` overwrites the previous value, and only the last write survives. The data must be indexed by the **pair** (`v`, `vt`), not by `v` alone -- which is why a rendering engine generally duplicates vertices at every UV seam it encounters (a single vertex sent to the graphics card per distinct `(v, vt[, vn])` combination, rather than one vertex per position).

## The image file referenced by the `.mtl`

The `.mtl` doesn't just describe flat colors: the `map_Kd` line in it references an image file (PNG, JPEG...) used as the diffuse texture:

```text
newmtl Material
map_Kd caisse.png
Kd 0.640000 0.640000 0.640000
```

When drawing a triangle, each `vt` coordinate (a pair `(u, v)` with `u` and `v` between 0 and 1) points to a location in this image, regardless of its actual resolution in pixels: `(0, 0)` is one corner of the image, `(1, 1)` the opposite corner. The graphics card interpolates these coordinates across a triangle's 3 vertices to determine, pixel by pixel, which point of the image to display. If `map_Kd` is absent, `Kd` remains the only color used and the file's `vt` values then have no visual effect.

## Smoothing groups (`s`)

`s` doesn't touch the geometry: it only controls the calculation of the **normals** used for lighting.

- `s off` (equivalent to `s 0`): each face keeps its own flat normal -> rendering with visible facets (*flat shading*).
- `s 1`, `s 2`... : faces sharing the same group number have their normals averaged at the vertices they have in common -> smoothed rendering (*smooth shading*, also called *Gouraud shading*).

```text
s 1
f 1 2 5
f 2 3 5
f 3 4 5
f 4 1 5
```

The 4 faces above all share vertex `5` and the same smoothing group: its normal will be the average of the 4 face normals, giving that tip a rounded look rather than a sharp edge.

> **Pitfall:** `s`, like `usemtl`, is a **state directive**: it applies to all the `f` lines that follow, until the next `s`/`usemtl` encountered in the file. A parser must therefore keep track of "which smoothing group and which material are currently active" as it reads, and attach them to each face at the moment it's read: this information never appears on the `f` line itself.

## `o` is not a state directive like `s`/`usemtl`

`o` (and its cousin `g`, for sub-groups) simply labels a set of geometry under an object name, for organization. Unlike `s`/`usemtl`, it changes **nothing** about how the following lines are interpreted.

> **Pitfall:** vertex (`v`) numbering stays **global to the whole file**: it never restarts at 1 with each new `o`. In a file with several objects, the faces of the second object therefore continue the numbering of the first:
> ```text
> o Cube1
> v 0 0 0
> v 1 0 0
> v 0 1 0
>
> o Cube2
> v 5 5 5   <- 4th vertex of the FILE, not the 1st of Cube2
> v 6 5 5
> v 5 6 5
>
> f 4 5 6   <- refers to Cube2's vertices
> ```
> Resetting a vertex counter at every `o` silently breaks the indexing of every face as soon as a file contains more than one object.

## Reading an `.obj` with tolerance

`.obj` files come from different programs, which do not all follow the same variant of the format. A robust **parser** **accepts liberally** (any variant that makes sense) and **refuses with a precise message** (file, line, offending value) everything else, instead of crashing or silently carrying on with wrong data.

| Variant encountered | What to do |
|---|---|
| `v x y z w` (4 values, `w` is a weight, 1.0 if absent) | Read `w`, then ignore it |
| `v x y z r g b` (6 values, per-vertex colour, an extension of some exporters) | Keep the first 3, ignore or store the colour |
| `vt u`, `vt u v`, `vt u v w` (1 to 3 values) | `v` is 0 if missing, `w` is useless for a 2D image |
| Unknown directive (`l`, `p`, `cstype`...), empty line, `#` comment | Skip the line, no error |
| Fewer values than expected, text instead of a number, `1e999` | Refuse, naming the file, the line and the value received |

```c
/* Reads 3, 4 or 6 numbers from a "v" line; returns how many were read, -1 if invalid. */
static int parse_vertex(const char *s, double out[6])
{
	int n = 0;
	char *end;

	while (n < 6)
	{
		errno = 0;
		out[n] = strtod(s, &end);        /* reads a number and moves to its end */
		if (end == s)                    /* nothing readable: end of the numbers */
			break;
		if (errno || !isfinite(out[n]))  /* 1e999, inf or nan: refused */
			return -1;
		s = end;
		n++;
	}
	while (*s == ' ' || *s == '\t' || *s == '\r')  /* trailing blanks */
		s++;
	return (*s == '\0' && (n == 3 || n == 4 || n == 6)) ? n : -1;
}
```

Tested with `"1 2 3"` (3), `"1 2 3 1.0"` (4) and `"1 2 3 0.5 0.5 0.5"` (6): valid. `"1 2"`, `"1 2 x"`, `"1e999 0 0"` and `"1 2 3 4 5"` return -1. `strtod` is preferred over `atof`, which returns 0 for any text without reporting anything (see [converting a text to a number](/?c=langages-de-programmation&s=c&p=convertir-un-texte-en-nombre)).

### Line endings and BOM

| Case | What it contains | Consequence if not handled |
|---|---|---|
| LF (`\n`) | Unix line ending | None |
| CRLF (`\r\n`) | Windows line ending | A `\r` stays stuck at the end of the line, so inside the last value read |
| Lone CR (`\r`) | Line ending of very old Macs | `fgets` only splits at `\n`: the whole file becomes a single line |
| UTF-8 BOM (bytes `EF BB BF` at the start of the file) | Encoding marker, see [text encodings](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) | It sticks to the first directive: `\xEF\xBB\xBFv` is not `v`, the line is taken for an unknown directive, **the first vertex disappears without any error** and every face index is shifted by one |

> **Good practice:** read the whole file into memory, skip a possible BOM, then split at the three line endings (`\r\n`, `\r` and `\n`) instead of calling `fgets`: the same code then handles files from any system.

## The PPM P6 format: a texture without a library

The [`map_Kd` of the `.mtl`](#the-image-file-referenced-by-the-mtl) points to an image. **PPM** (*Portable PixMap*, [specification](https://netpbm.sourceforge.net/doc/ppm.html)) is the simplest image format to read by hand: a small text header, followed by the pixels in **binary** (raw bytes, which a text editor cannot display legibly). Its **P6** variant stores three channels (red, green, blue) per pixel.

```text
P6                  <- magic number: identifies the format
# a comment         <- optional: # until the end of the line, to be ignored
640 480             <- width and height, in pixels
255                 <- maxval: maximum value of a channel
<binary bytes>      <- width x height x 3 channels, row by row, from top to bottom
```

| `maxval` | Bytes per channel | To get back to 0 to 255 |
|---|---|---|
| 1 to 255 | 1 | `value x 255 / maxval` |
| 256 to 65535 | 2, most significant byte first | `value x 255 / maxval` (same formula, 16-bit value) |

```c
/* Reads an integer of the PPM header, skipping blanks and comments; -1 if absent. */
static long read_header_int(FILE *f)
{
	int c;

	while ((c = fgetc(f)) != EOF)
	{
		if (c == '#')                    /* comment: ignored until the end of the line */
			while ((c = fgetc(f)) != EOF && c != '\n' && c != '\r')
				;
		else if (!isspace(c))
			break;
	}
	if (!isdigit(c))
		return -1;
	long n = 0;
	for (; isdigit(c); c = fgetc(f))     /* the blank ending the number is consumed */
	{
		n = n * 10 + (c - '0');
		if (n > 1000000)                 /* absurd dimension: refused */
			return -1;
	}
	return n;
}
```

The main function calls `read_header_int` three times (width, height, `maxval`):

```c
/* Returns width x height x 3 bytes (0 to 255), or NULL with a message on stderr. */
unsigned char *read_ppm(const char *path, int *w, int *h)
{
	FILE *f = fopen(path, "rb");                 /* "b": binary mode, essential on Windows */
	if (!f)
		return fprintf(stderr, "%s: %s\n", path, strerror(errno)), NULL;
	if (fgetc(f) != 'P' || fgetc(f) != '6')
		return fprintf(stderr, "%s: not a P6 PPM\n", path), fclose(f), NULL;
	long width = read_header_int(f);             /* skips blanks and comments, -1 if absent */
	long height = read_header_int(f);
	long maxval = read_header_int(f);            /* consumes the single blank that follows */
	if (width < 1 || height < 1 || maxval < 1 || maxval > 65535)
		return fprintf(stderr, "%s: invalid header\n", path), fclose(f), NULL;
	size_t bytes = maxval < 256 ? 1 : 2;
	size_t count = (size_t)width * (size_t)height * 3;
	unsigned char *raw = malloc(count * bytes);
	unsigned char *out = malloc(count);
	if (!raw || !out || fread(raw, bytes, count, f) != count)
	{                                            /* truncated, or out of memory */
		fprintf(stderr, "%s: truncated data or out of memory\n", path);
		return free(raw), free(out), fclose(f), NULL;
	}
	for (size_t i = 0; i < count; i++)
	{
		long v = bytes == 1 ? raw[i] : (raw[2 * i] << 8) | raw[2 * i + 1];
		out[i] = (unsigned char)((v * 255 + maxval / 2) / maxval);  /* rounded to nearest */
	}
	free(raw);
	fclose(f);
	*w = (int)width;
	*h = (int)height;
	return out;
}
```

Compiled with `-Wall -Wextra -pedantic` without a warning, then tried on four files: an 8-bit PPM with a comment and a 16-bit PPM both give the red pixel `255 0 0`; a file whose data stops too early, a `P5` file (greyscale) and a missing file are each refused with their own message.

| Pitfall | Why | Remedy |
|---|---|---|
| Skipping all blanks after `maxval` | A pixel byte can be `0x20` or `0x0A` (a blank): it would be taken for whitespace | Consume **a single** blank, then read the data as is |
| File converted to CRLF | Every binary `\n` becomes `\r\n`: the data grows and shifts | Detect the inconsistent size and refuse |
| Truncated file | `fread` returns less than expected | Compare the count read with the expected count |
| Huge `width x height x 3` | The product overflows or asks for gigabytes | Bound each dimension, compute in `size_t` |
| Bottom row first | PPM stores the first row **at the top**, OpenGL expects the first row **at the bottom** | Flip the image vertically or invert `v` |

## The normal of a polygon: Newell's method

The ear clipping orientation test needs the normal of the face. The naive computation (cross product of the first two edges) fails in two ways: if the first three vertices are aligned, the product is the zero vector; if the first corner is reflex (interior angle above 180 degrees), the normal obtained is inverted, so the whole rest of the test is wrong.

**Newell's method** adds one contribution per edge, over the **whole** outline, so no vertex is privileged:

```text
for each edge (a -> b) of the polygon:
    nx += (a.y - b.y) * (a.z + b.z)
    ny += (a.z - b.z) * (a.x + b.x)
    nz += (a.x - b.x) * (a.y + b.y)
normal = (nx, ny, nz) / length           <- its length is 2 times the polygon's area
```

```c
/* Unit normal of a polygon (Newell's method); -1 if the surface is zero. */
static int newell_normal(const double (*p)[3], int n, double out[3])
{
	double nx = 0, ny = 0, nz = 0;

	for (int i = 0; i < n; i++)
	{
		const double *a = p[i];
		const double *b = p[(i + 1) % n];      /* the last vertex links back to the first */
		nx += (a[1] - b[1]) * (a[2] + b[2]);
		ny += (a[2] - b[2]) * (a[0] + b[0]);
		nz += (a[0] - b[0]) * (a[1] + b[1]);
	}
	double len = sqrt(nx * nx + ny * ny + nz * nz);
	if (len == 0)                              /* aligned or coincident vertices */
		return -1;
	out[0] = nx / len;
	out[1] = ny / len;
	out[2] = nz / len;
	return 0;
}
```

Tried on a concave L-shaped polygon whose first three vertices are aligned (`(0,0) (1,0) (2,0) (2,1) (1,1) (1,2)`, in the z = 0 plane): the naive computation gives the zero vector, Newell gives `0 0 1`. On three aligned vertices only, it returns -1: a face of zero surface is refused with its own message, it has no normal. For the cross product, see [Vectors and dot product](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire).

## Making ear clipping robust

The algorithm described above is exact with exact numbers; floating-point numbers (see [floating-point representation](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)) force three precautions:

| Precaution | Why |
|---|---|
| Do the predicates (orientation, same side) in `double`, even if the vertices are stored as `float` | Near zero, a `float` flips the sign of the cross product: a valid ear is refused, an invalid one is accepted |
| Compare to a **relative** tolerance (`abs(product) <= epsilon x length1 x length2`), never to an absolute constant | An absolute constant depends on the model's unit (an object of 0.001 or of 1000 units) |
| Handle apart the vertex **aligned** with its neighbours or lying **on an edge** of the candidate triangle | Neither inside nor outside: the strict test accepts or refuses it at the whim of rounding |

The cutting then runs in **two passes**: a strict pass (an ear must be strictly convex and contain no interior vertex nor vertex on its boundary); if it finds no ear while more than 3 vertices remain, a second pass tolerates vertices lying exactly on the boundary. If that fails too, the face is refused (degenerate or self-intersecting) with a message naming the file and the line, instead of looping forever.

## Speeding up ear clipping: examine only reflex vertices

The "no vertex trapped" test walks through all the remaining vertices, for every candidate ear, and every clip requires a new search: at least `n x n` operations ([quadratic complexity](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)). Two words are enough to do better. The **turn** at a vertex `b` between its neighbours `a` and `c` is the dot product of the face normal with the cross product of `a->b` and `a->c` (see [Vectors and dot product](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)): its sign says which way the outline turns.

| Term | Meaning | Sign of the turn |
|---|---|---|
| **Convex** vertex | The outline turns in the direction of the normal: interior angle below 180 degrees | `> 0` |
| **Reflex** vertex | The outline turns the other way: interior angle above 180 degrees, a notch | `<= 0` (a zero turn, a vertex aligned with its neighbours, is classed here as a precaution) |

In the L-shaped polygon of the previous section, vertex `(1,1)` is reflex, `(1,0)` is aligned with its neighbours (zero turn) and the other four are convex. A convex polygon has no reflex vertex.

### Why reflex vertices are enough

**If a vertex lies inside the triangle of a candidate ear, then a reflex vertex lies inside it too.** Reasoning: the two sides of the triangle that touch the tip `v` are edges of the polygon, which the outline cannot cross (it would intersect itself). An outline that enters the triangle therefore has only the base `[prev, next]` to enter and to leave by. The area between this detour and the tip `v` is bordered only by polygon edges, so it is inside the polygon. The point of the detour closest to `v` (`Q` below) has the interior on `v`'s side and makes a peak towards it: its interior angle exceeds 180 degrees.

```text
            v           boundary entering by the base, rising to Q, coming back down
           / \          Q: vertex of the detour closest to v
          /   \         the polygon interior is on v's side: Q is reflex
         /  Q  \
        /  / \  \
   prev ----------- next
```

Consequence: the same-side test is only run against the list of reflex vertices, which is empty for a convex polygon (no point test at all).

### Keeping the reflex list up to date

| Moment | What happens | Cost |
|---|---|---|
| At the start | One pass: every vertex with a turn `<= 0` goes into the `reflex[]` array | `n` |
| After clipping an ear | Only the two neighbours of the clipped tip change angle, and it can only decrease (a triangle leaves the polygon): a reflex vertex may become convex, a convex one **never** becomes reflex again | 2 checks |
| Leaving the list | [swap-remove](/?c=fondamentaux&s=algorithmes&p=swap-remove): the vertex is replaced by the last one. Each node remembers its position `reflex_pos` in the array to find it without scanning | O(1) |

```c
typedef struct { int prev, next, reflex_pos; } Node;    /* reflex_pos: -1 if convex */

typedef struct
{
	const double (*p)[3];      /* vertex positions */
	double normal[3];          /* face normal (Newell's method) */
	Node *node;                /* circular doubly linked list */
	int *reflex;               /* indices of the reflex vertices */
	int n_reflex;
}	Ctx;

/* Turn at b between a and c: > 0 convex, < 0 reflex, 0 aligned. */
static double turn(const double *a, const double *b, const double *c, const double nrm[3])
{
	double u[3] = {b[0] - a[0], b[1] - a[1], b[2] - a[2]};
	double v[3] = {c[0] - a[0], c[1] - a[1], c[2] - a[2]};

	return (u[1] * v[2] - u[2] * v[1]) * nrm[0]      /* cross product u x v, */
		+ (u[2] * v[0] - u[0] * v[2]) * nrm[1]       /* then dot product */
		+ (u[0] * v[1] - u[1] * v[0]) * nrm[2];      /* with the normal */
}

/* Three-sides test: q is inside triangle (a, b, d), boundary included. */
static int in_triangle(const Ctx *c, int a, int b, int d, int q)
{
	return turn(c->p[a], c->p[b], c->p[q], c->normal) >= 0
		&& turn(c->p[b], c->p[d], c->p[q], c->normal) >= 0
		&& turn(c->p[d], c->p[a], c->p[q], c->normal) >= 0;
}

static int is_reflex(const Ctx *c, int i)
{
	const Node *nd = &c->node[i];

	return turn(c->p[nd->prev], c->p[i], c->p[nd->next], c->normal) <= 0;
}

static int is_ear(const Ctx *c, int i)
{
	int a = c->node[i].prev;
	int d = c->node[i].next;

	if (is_reflex(c, i))
		return 0;
	for (int k = 0; k < c->n_reflex; k++)      /* reflex vertices only */
	{
		int q = c->reflex[k];
		if (q != a && q != d && in_triangle(c, a, i, d, q))
			return 0;
	}
	return 1;
}

static void reflex_remove(Ctx *c, int i)
{
	int pos = c->node[i].reflex_pos;
	int last = c->reflex[--c->n_reflex];

	c->reflex[pos] = last;                     /* the last one takes the place */
	c->node[last].reflex_pos = pos;            /* and records its new position */
	c->node[i].reflex_pos = -1;
}

/* After a clip: a reflex neighbour that became convex leaves the list. */
static void refresh(Ctx *c, int i)
{
	if (c->node[i].reflex_pos >= 0 && !is_reflex(c, i))
		reflex_remove(c, i);
}
```

`in_triangle` is the same-side test of the section "Checking that no vertex is trapped inside the ear"; the clipping loop calls `refresh` on `prev` and `next` after each ear clipped.

### What it changes, measured

12000 vertices, `-O2`, a single run, same result (11998 triangles, that is `n - 2`) with both tests:

| Polygon | Reflex vertices | Test against all vertices | Test against reflex vertices |
|---|---|---|---|
| Circle (convex) | 0 | 0.38 s | 0.0002 s |
| Star (every other vertex pointing inward) | 6000 | 0.28 s | 0.06 s |

The remaining cost is of the order of `n x r` (`r`: number of reflex vertices): a very jagged shape stays quadratic, only the constant drops. The gain is largest on slightly concave polygons, which are the vast majority of the faces of an `.obj`.

> **Pitfall: rounding noise.** On a large polygon that is almost flat at every vertex, a computation error can tip convex vertices into the reflex list: it swells and the cost goes back to `n x n`. Computing the turn in `double` (see [Making ear clipping robust](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#making-ear-clipping-robust)) limits this risk. When in doubt, **always class the vertex as reflex** (`<= 0`, not `< 0`): an extra reflex vertex only costs time, a forgotten one would make the algorithm accept an ear that traps a vertex.

> **Good practice:** validate the optimisation by comparing, on the same polygons, the number of triangles (`n - 2`) and the sum of their areas between the old test (all vertices) and the new one (reflex vertices only), before throwing the old one away. See also [measure before optimising](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | An `.obj` lists instructions line by line (`v`, `vt`, `vn`, `f`, `s`...), with vertex indices starting at 1. Faces can have more than 3 vertices and must be triangulated to be drawn by the graphics card; ear clipping also handles concave faces thanks to an orientation test AND a "same-side" test for each remaining vertex. A face generally combines one index per list and per corner (`v/vt/vn`), because `v` and `vt` are two independent, unaligned lists -- necessary to represent a UV seam. The associated `.mtl` describes appearance via the 4 parameters of the Phong model (ambient, diffuse, specular, shininess) and can reference an image file (`map_Kd`) as a texture. `s` controls normal smoothing, independently of the geometry. A parser accepts liberally (`v` with 3, 4 or 6 values, unknown directives ignored, LF, CRLF or CR, BOM) and refuses the rest with a precise message. PPM P6 is a text header followed by binary pixels (`maxval` on 1 or 2 bytes). A polygon's normal is computed with Newell's method, over its whole outline. |
| **Usable tools** | The Phong model (`Ka`/`Kd`/`Ks`/`Ns`) for interpreting an `.mtl`. `map_Kd` for linking an `.mtl` to a texture image file. Smoothing groups (`s`) for choosing between flat and smooth rendering. The `n - 2` formula to verify the number of triangles produced by any triangulation. `strtod` to read numbers, Newell's method for the normal, `double` predicates for ear clipping. |
| **Pitfalls to avoid** | 1-based rather than 0-based vertex indices. Faces with a variable number of vertices left untriangulated. Fan triangulation produces a wrong result on a concave face, and an orientation test alone (without a "same-side" test) can wrongly validate an ear that traps another vertex. Indexing a texture coordinate by vertex alone (rather than by a vertex/texture pair) silently breaks at a UV seam. A single-material `.mtl` doesn't provide a color per sub-part. `s`/`usemtl` are state directives to track throughout parsing, not attributes present on every `f` line. `o` never affects vertex numbering, which stays global to the file even with several objects. A BOM stuck to the first directive (first vertex silently lost), a leftover `\r` from a CRLF file, `fgets` facing a lone CR. Skipping all blanks after a PPM's `maxval`, not checking the size of the data, forgetting that its first row is at the top while OpenGL expects the bottom one. Computing the normal from the first two edges only. Using an absolute tolerance in a geometric test. |
| **Good practices** | Separate raw file reading and triangulation into two distinct, single-responsibility functions. Reuse the same geometric primitive (cross product + dot product with the normal) for the orientation test and the same-side test, rather than duplicating it. Verify a triangulation with the `n - 2` formula before judging the split correct. Duplicate a vertex per unique `(v, vt[, vn])` combination rather than by position alone, to handle UV seams. Keep the current state (material, smoothing group) in variables updated as parsing proceeds, and attach it to each face read. Read the whole file and split it at the three line endings after skipping the BOM. Refuse invalid input naming the file, the line and the value. Compute geometric predicates in `double` with a relative tolerance, in two passes, and refuse the face if no ear exists. |
