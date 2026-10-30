---
order: 10
---

# GLSL: the `flat` qualifier, value noise and hash functions

A [shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#shaders-the-graphics-card-s-programs) is a small program written in GLSL that runs on the graphics card. This chapter covers two tools that come up in almost every fairly advanced shader. The first is a keyword, `flat`, which decides how a value travels from one stage of the shader to the next: without it, the card **blends** the value across the three vertices of a triangle, which makes no sense for a material number. The second is a way to make "randomness" without a generator: **value noise**, based on a **hash function**. All the figures in the tables come from C programs written for this chapter and actually run (the same algorithm as the GLSL, up to rounding); the GLSL blocks, however, have not been compiled here.

The chapter assumes you already know [the stages of a shader and their `in`/`out` inputs and outputs](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#shaders-the-graphics-card-s-programs) (a **vertex** is a point of the mesh, a **fragment** is a candidate pixel on screen), [floating-point numbers](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), [the bitwise operators of C](/?c=langages&s=c&p=operateurs-binaires) (`^`, `>>`, `<<`) and [the dot product](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire).

## What a fragment receives: an average of the three vertices

A triangle is drawn from its three vertices, and each one can carry values (a color, a texture coordinate, a normal). But the screen is made of pixels, far more numerous: for each fragment covered by the triangle, the graphics card must **make up** a value. It computes a weighted average of the three values, using **barycentric weights**: three positive numbers whose sum is 1, which say how close the fragment is to each vertex. This is **interpolation** (computing an intermediate value from values known at neighboring points).

```text
              B  (value 5)
             /\
            /  \
           /    \         P: a fragment, with the weights wA, wB, wC
          /   P  \        (wA + wB + wC = 1; the closer P is to a vertex,
         /        \        the larger its weight)
        A----------C
 (value 2)      (value 9)

 value at P = wA x 2 + wB x 5 + wC x 9
```

This is exactly what we want for a color or a texture coordinate: a continuous gradient. For an **identifier** (a material number, an object number), it is a disaster. Here are the values 2, 5 and 9 of the diagram, interpolated at four points of a triangle (output of the C program in the section on the provoking vertex):

| Weights (wA, wB, wC) | Interpolated value | What we wanted |
|---|---|---|
| 0.33 ; 0.33 ; 0.33 | 5.3333 | An integer number |
| 0.60 ; 0.30 ; 0.10 | 3.6000 | An integer number |
| 0.10 ; 0.10 ; 0.80 | 7.9000 | An integer number |
| 0.05 ; 0.90 ; 0.05 | 5.0500 | An integer number |

None of these numbers is a material chosen by a vertex, and rounding does not help: 3.6 becomes 4 and 7.9 becomes 8, numbers that nobody supplied. GLSL offers three behaviors, chosen by a **qualifier** (a word placed before the declaration of a variable):

| Qualifier | Value received by the fragment | Typical use |
|---|---|---|
| `smooth` (default) | Weighted average, corrected for perspective (the correction keeps a straight pattern on a surface seen at an angle) | Color, texture coordinate, smoothed normal |
| `noperspective` | Weighted average, without that correction: linear on screen | Effects drawn directly in screen space |
| `flat` | **No average**: the value of a single vertex, the same over the whole triangle | Identifier, material index, color or normal per face |

All three are described by the [Type Qualifier page of the Khronos documentation](https://www.khronos.org/opengl/wiki/Type_Qualifier_(GLSL)).

## `flat`: one value per triangle, with no average

You write `flat` in front of the vertex shader's output **and** in front of the fragment shader's input that has the same name. Example: an integer per vertex chooses a color from a small palette.

```glsl
// ----- vertex shader -----
#version 330 core                        // version 3.30 of GLSL, modern profile (core)
layout(location = 0) in vec3 position;   // vertex position; 0: attribute number
layout(location = 1) in int material;    // one integer per vertex; attribute number 1
uniform mat4 mvp;                        // uniform: set by the C program; mat4: 4x4 matrix
flat out int v_material;                 // "flat" output: never averaged

void main()
{
	gl_Position = mvp * vec4(position, 1.0);   // position of the vertex on screen
	v_material = material;                     // the integer is copied as it is
}
```

```glsl
// ----- fragment shader -----
#version 330 core
flat in int v_material;        // same name, same qualifier as the output above
uniform vec3 palette[4];       // four colors, set by the C program
out vec4 color;                // final color of the fragment

void main()
{
	color = vec4(palette[v_material], 1.0);   // the integer chooses the color
}
```

On the C side, an integer attribute is declared with `glVertexAttribIPointer` (the **I** stands for "integer": without it, the card would convert the integer to a float). It is documented alongside [`glVertexAttribPointer`](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glVertexAttribPointer.xhtml).

```c
/* attribute 1: 1 component of type GL_INT; stride: bytes from one vertex to the next;
   offset: position of the integer within a vertex */
glVertexAttribIPointer(1, 1, GL_INT, stride, (void *)offset);
glEnableVertexAttribArray(1);                    /* enables attribute 1 */
```

One more rule of the language applies: an input of a fragment shader of **integer type** (`int`, `uint`, `ivec3`...) must necessarily be `flat`. The reason is logical: an average of integers is not an integer. Without `flat`, the shader is rejected at compilation or at link time (rule from the Khronos page above; not tested here for lack of a driver). A float can be `flat` too.

| Use case | What the `flat` variable carries | Why not an interpolated value |
|---|---|---|
| Object identifier | A number written into a separate image for [picking](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#mouse-picking-finding-which-3d-object-was-clicked) | A blended number points to another object |
| Material index | An integer that indexes a palette or an array of textures | An average index does not exist |
| Color per face | One color per triangle, for a faceted rendering | The gradient would erase the edges |
| Normal per face | The vector perpendicular to the triangle, computed by the [geometry shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#example-a-flat-normal-per-triangle-computed-in-the-geometry-shader) | The three vertices hold the same value: `flat` says so explicitly and avoids a useless averaging calculation |

## Which vertex supplies the value: the provoking vertex

If `flat` removes the average, one question remains: the three vertices carry three possible values, which one does the fragment receive? OpenGL chooses **only one**, the **provoking vertex** (the vertex that "provokes" the value of the whole triangle). By default it is the **last** vertex of the triangle (`GL_LAST_VERTEX_CONVENTION`); `glProvokingVertex` lets you choose the first one (`GL_FIRST_VERTEX_CONVENTION`), see the [Khronos documentation for glProvokingVertex](https://registry.khronos.org/OpenGL-Refpages/gl4/html/glProvokingVertex.xhtml).

```c
glProvokingVertex(GL_FIRST_VERTEX_CONVENTION);   /* the 1st vertex supplies the flat value */
glProvokingVertex(GL_LAST_VERTEX_CONVENTION);    /* back to the default setting */
```

For a list of triangles (`GL_TRIANGLES`), "last" means the third index of each triangle. If there is a geometry shader, the rule applies to the vertices **emitted** by it, not to those of the mesh. The convention has not been checked on a graphics card here: the C program below applies the "last index" rule to an indexed cube of 8 vertices and 12 triangles, and to the interpolation of the value 2, 5, 9 of the previous diagram.

```c
#include <stdio.h>   /* printf */

int	main(void)
{
	float	ids[3] = {2.0f, 5.0f, 9.0f};                    /* value of A, B, C */
	float	w[4][3] = {{1 / 3.0f, 1 / 3.0f, 1 / 3.0f}, {0.6f, 0.3f, 0.1f},
		{0.1f, 0.1f, 0.8f}, {0.05f, 0.9f, 0.05f}};          /* four fragments */
	int		cube[12][3] = {{0,1,2}, {0,2,3}, {1,5,6}, {1,6,2}, {5,4,7}, {5,7,6},
		{4,0,3}, {4,3,7}, {3,2,6}, {3,6,7}, {4,5,1}, {4,1,0}};   /* indices */
	int		uses[8] = {0};                                  /* triangles per vertex */
	int	k;

	for (k = 0; k < 4; k++)                                 /* average vs flat */
		printf("weights %.2f %.2f %.2f : average %.4f, flat last 9, flat first 2\n",
			w[k][0], w[k][1], w[k][2],
			w[k][0] * ids[0] + w[k][1] * ids[1] + w[k][2] * ids[2]);
	for (k = 0; k < 12; k++)
		uses[cube[k][2]]++;                                 /* the last index counts */
	for (k = 0; k < 8; k++)
		printf("vertex %d supplies the value of %d triangle(s)\n", k, uses[k]);
	return (0);
}
```

```text
weights 0.33 0.33 0.33 : average 5.3333, flat last 9, flat first 2
weights 0.60 0.30 0.10 : average 3.6000, flat last 9, flat first 2
weights 0.10 0.10 0.80 : average 7.9000, flat last 9, flat first 2
weights 0.05 0.90 0.05 : average 5.0500, flat last 9, flat first 2
vertex 0 supplies the value of 1 triangle(s)
vertex 1 supplies the value of 1 triangle(s)
vertex 2 supplies the value of 2 triangle(s)
vertex 3 supplies the value of 2 triangle(s)
vertex 4 supplies the value of 0 triangle(s)
vertex 5 supplies the value of 0 triangle(s)
vertex 6 supplies the value of 3 triangle(s)
vertex 7 supplies the value of 3 triangle(s)
```

| Cube vertex | Triangles whose last index it is | Consequence |
|---|---|---|
| 0 and 1 | 1 each | No conflict |
| 2 and 3 | 2 each | With this index order, the two triangles come from different faces (for example the front and the right side for vertex 2): conflict |
| 4 and 5 | 0 | They never supply a value: what they carry is ignored by `flat` |
| 6 and 7 | 3 each | Three different faces each claim their own value from it: conflict |

The last two cases are the main pitfall: a vertex **shared** by several triangles (that is the whole point of an [index buffer](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#buffers-vbo-ebo-and-vao)) carries only **one** value, but several faces would each like their own. Three workarounds:

| Workaround | Principle | Cost |
|---|---|---|
| Duplicate the vertices | Each face has its own vertices (24 for a cube instead of 8), so its own value | More memory, more vertices to process |
| Compute the value in a geometry shader | It receives the three vertices and emits the same value three times: no vertex can conflict | One extra (optional) stage |
| Read an array with `gl_PrimitiveID` | Predefined variable of the fragment shader that gives the number of the triangle; its data is read from an array | One memory access per fragment |

## What a hash does in a shader

For noise, grain or random patterns, you need a number that "looks like" randomness. A classic generator (see [randomness and generators](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs) or [xorshift](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#reproducible-noise-xorshift)) keeps a **state**: each draw modifies the state, and the next one depends on it. In a shader, that is impossible: fragments are computed in parallel, in no fixed order, with no shared memory. So we use a **hash function** (*hash*): a function that receives a value (here a position) and returns a number that looks random, but which is **entirely determined** by the input. Do not confuse it with the hashing of a [hash table](/?c=langages&s=c&p=tables-de-hachage), which answers a different need.

| | Stateful generator (`rand`, xorshift) | Stateless hash |
|---|---|---|
| Input | None: you ask for "the next one" | A position (or a number) |
| Memory between two calls | Yes, the state | No |
| Same position, two calls | Two different values | **The same value** |
| Order of the calls | Matters | Does not matter |
| Suitable for a shader | No | Yes |

A good shader hash must have three qualities: be **deterministic** (same input, same output, from one frame to the next, otherwise the pattern flickers), be **uniform** (all values from 0 to 1 come out equally often) and have an **avalanche effect** (changing a single bit of the input changes about half of the bits of the output, so two neighboring positions give unrelated values).

## First hash: `fract(sin(dot(...)))`

```glsl
float hash31(vec3 p)   // p: a point in space; result: from 0 to less than 1
{
	float d = dot(p, vec3(12.9898, 78.233, 37.719));   // dot: x*12.99 + y*78.23 + z*37.72
	d = sin(d) * 43758.5453;     // sin: from -1 to 1; the large factor spreads the digits
	return fract(d);             // fract: the fractional part alone (3.7 gives 0.7)
}
```

The reasoning: `dot` reduces the point to **a single number** (three neighboring coordinates give a neighboring number); `sin` is a function that oscillates quickly when its argument grows, so two close arguments give different sines; multiplying by 43,758.5453 amplifies these differences down to the decimal digits; `fract` keeps only these digits, which nothing links back to the input any more. The constants (12.9898; 78.233; 37.719; 43,758.5453) became common through habit: no mathematical rule imposes them.

It is short and handy, but everything relies on the precision of a 32-bit `float`. The following C program runs the same formula in `float`, then in `double` (64 bits).

```c
#include <math.h>     /* sinf, sin, floorf, floor */
#include <stdio.h>    /* printf */
#include <stdlib.h>   /* qsort */

float	hash_f(float x, float y, float z)      /* fract(sin(dot(p, k)) * 43758.5453) */
{
	float	d = x * 12.9898f + y * 78.233f + z * 37.719f;   /* dot(p, k) in 32-bit float */
	float	v = sinf(d) * 43758.5453f;                      /* sin, then the amplification */

	return (v - floorf(v));                                 /* fract: the fractional part */
}

double	hash_d(double x, double y, double z)   /* the same formula in double (64 bits) */
{
	double	v = sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;

	return (v - floor(v));
}

int	cmp_float(const void *a, const void *b)
{
	float	x = *(const float *)a;
	float	y = *(const float *)b;

	return ((x > y) - (x < y));
}

int	count_distinct(float *v, int n)                  /* how many different values */
{
	int	i;
	int	count = 1;

	qsort(v, n, sizeof(float), cmp_float);
	for (i = 1; i < n; i++)
		if (v[i] != v[i - 1])
			count++;
	return (count);
}

int	main(void)
{
	static float	v[1048576];   /* static: kept off the stack, which is too small */
	int		i;
	int		bad = 0;
	int		j;

	for (i = 0; i < 8; i++)
		printf("h(%d,0,0) = %.6f\n", i, hash_f((float)i, 0, 0));
	for (i = 0; i < 1048576; i++)
		v[i] = hash_f((float)i, 0, 0);
	printf("float 32 bits : %d distinct values\n", count_distinct(v, 1048576));
	for (i = 0; i < 1048576; i++)
		v[i] = (float)hash_d(i, 0, 0);
	printf("double        : %d distinct values\n", count_distinct(v, 1048576));
	for (i = 0; i < 1024; i++)                        /* float vs double, x from 0 to 1023 */
		if (fabs(hash_f((float)i, 0, 0) - hash_d(i, 0, 0)) > 0.01)
			bad++;
	printf("gap of more than 0.01 between the two: %d cases out of 1024\n", bad);
	for (i = 0; i < 2; i++)                           /* x = 0, then x = 1,000,000 */
	{
		printf("x = %d, y from 0 to 0.007 : ", i * 1000000);
		for (j = 0; j < 8; j++)
			printf("%.4f ", hash_f((float)i * 1000000.0f, 0.001f * j, 0));
		printf("\n");
	}
	return (0);
}
```

Actual output (compiled with `gcc -Wall -Wextra -O1 -ffp-contract=off`; the last option forbids the compiler from merging a multiplication and an addition into a single operation, which would change the rounding):

```text
h(0,0,0) = 0.000000
h(1,0,0) = 0.941406
h(2,0,0) = 0.085938
h(3,0,0) = 0.589844
h(4,0,0) = 0.367188
h(5,0,0) = 0.335938
h(6,0,0) = 0.460938
h(7,0,0) = 0.987793
float 32 bits : 16691 distinct values
double        : 1027137 distinct values
gap of more than 0.01 between the two: 998 cases out of 1024
x = 0, y from 0 to 0.007 : 0.0000 0.8716 0.8232 0.0615 0.0508 0.6348 0.1562 0.5957
x = 1000000, y from 0 to 0.007 : 0.1680 0.1680 0.1680 0.1680 0.1680 0.1680 0.1680 0.1299
```

| Finding | Measure | Explanation |
|---|---|---|
| Very few distinct values | 16,691 distinct values out of 1,048,576 inputs in `float`, against 1,027,137 in `double` | The product `sin(d) * 43758.5453` reaches several tens of thousands: a `float` has 24 significant bits, so only a few remain for the decimals (a step of 1/256 above 32,768, finer below). All the program's outputs are multiples of 1/4096 (0.941406 = 3856/4096) |
| The result depends on the precision | Gap of more than 0.01 between `float` and `double` for 998 inputs out of 1,024 | The rounding error of the `float` on `d` is multiplied by the large factor: the "randomness" depends on the precision of the computation |
| Small changes vanish far from the origin | With x = 1,000,000, varying y by 0.001 at a time gives 0.1680 seven times in a row | `d` is then about 13 million, and a `float` rounds it to the unit: the term `y * 78.233` is **absorbed** (see [absorption](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorption-and-cancellation-when-a-calculation-loses-its-digits) and [floats far from the origin](/?c=donnees&s=representation-des-donnees&p=flottants-loin-de-l-origine)) |
| An input of zero gives an output of zero | h(0,0,0) = 0.000000 | `sin(0)` is 0: the point 0 does not look like randomness |

The results come close to uniform (χ² of 21.36 for 15 degrees of freedom over 1,048,576 inputs, an ordinary value for a uniform draw; the test is explained in [comparing two settings](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages#checking-a-uniform-draw-the-test), measured with a separate program), but the major flaw lies elsewhere: the value depends on the implementation of `sin`. The `float`/`double` gap above was measured on the processor; whether two different graphics cards give different `sin` values for large arguments could not be measured here (only one machine), but the formula is exposed by construction: a pattern computed with this hash can change appearance from one card to another, or from one driver to another.

## Second hash: an integer with no state

The remedy is to stop using floats to mix: we work on **unsigned integers** of 32 bits (`uint` in GLSL, `uint32_t` in C), whose operations are exact and identical everywhere. A `uint` never exceeds `2³² - 1`: beyond that, the result is computed **modulo 2³²** (we keep the remainder of the division by 2³², so the extra bits are lost). Two operations repeat:

| Operation | Effect | Why it is useful |
|---|---|---|
| `x ^= x >> 16` (xor-shift) | Shifts `x` 16 positions to the right (the high-order bits, on the left, move down onto the low-order bits), then combines them with `^`, the "exclusive or": a bit is 1 if the two combined bits differ (see [the bitwise operators](/?c=langages&s=c&p=operateurs-binaires#the-six-operators)) | A multiplication only propagates bits **upward**: the xor-shift brings information back down from the top |
| `x *= odd constant` | Multiplies, modulo 2³² | Each input bit spreads to all the higher bits; an odd constant loses no information (the multiplication stays reversible) |

```glsl
uint hash_u(uint x)              // uint: 32-bit unsigned integer, computed modulo 2^32
{
	x ^= x >> 16;                // xor-shift: mixes the high and low parts
	x *= 0x7feb352du;            // multiply; 0x: base-16 notation, u: unsigned
	x ^= x >> 15;                // second xor-shift
	x *= 0x846ca68bu;            // second multiplication
	x ^= x >> 16;                // final mixing
	return x;
}

float hash_unit(uint h)          // converts a uint into a number from 0 to less than 1
{
	return float(h >> 8) * (1.0 / 16777216.0);   // 24 bits: exact in float
}
```

Why `h >> 8`? A `float` only represents exactly 24 bits of integer (see [the encoding of floats](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#how-a-float-is-encoded)). Writing `float(h) / 4294967295.0` rounds: `(float)0xffffffff` is 4294967296.0 and the quotient is then exactly 1.0, a value that the noise must never produce (measured by a separate program). By keeping 24 bits, the maximum value is 0.99999994.

The five steps, followed on a few inputs (values in hexadecimal, produced by a separate program):

| Input | After the 1st xor-shift | After `* 0x7feb352d` | After the xor-shift 15 | After `* 0x846ca68b` | Output |
|---|---|---|---|---|---|
| `0x00000001` | `0x00000001` | `0x7feb352d` | `0x7febcafb` | `0x6889f849` | `0x688990c0` |
| `0x00000002` | `0x00000002` | `0xffd66a5a` | `0xffd795f6` | `0xd113f092` | `0xd1132181` |
| `0x00000003` | `0x00000003` | `0x7fc19f87` | `0x7fc16004` | `0x53f1ba2c` | `0x53f1e9dd` |
| `0x00010000` | `0x00010001` | `0xb518352d` | `0xb5195f1d` | `0xdcaf72bf` | `0xdcafae10` |

We can see that the first xor-shift does nothing as long as the input fits in 16 bits (the first three rows): it only matters for large inputs. The complete program, in C (same algorithm as the GLSL):

```c
#include <stdint.h>   /* uint32_t: unsigned integer of exactly 32 bits */
#include <stdio.h>    /* printf */

uint32_t	hash_u32(uint32_t x)
{
	x ^= x >> 16;       /* brings the high 16 bits down to the low 16 bits */
	x *= 0x7feb352du;   /* multiplies, modulo 2^32: spreads upward */
	x ^= x >> 15;       /* brings the top down again */
	x *= 0x846ca68bu;   /* second multiplication */
	x ^= x >> 16;       /* final mixing */
	return (x);
}

float	to_unit(uint32_t h)
{
	return ((float)(h >> 8) * (1.0f / 16777216.0f));   /* 24 bits: from 0 to less than 1 */
}

int	main(void)
{
	long		count[16] = {0};
	double		chi2 = 0;
	long		bits = 0;
	long		twice = 0;
	uint32_t	x;
	int			b;

	for (x = 0; x < 8; x++)                                  /* neighbors 0 to 7 */
		printf("hash(%u) = 0x%08x -> %.6f\n", x, hash_u32(x), to_unit(hash_u32(x)));
	for (x = 0; x < 1048576; x++)                            /* 2^20 consecutive inputs */
		count[(int)(to_unit(hash_u32(x)) * 16.0f)]++;        /* class from 0 to 15 */
	for (b = 0; b < 16; b++)
		chi2 += (count[b] - 65536.0) * (count[b] - 65536.0) / 65536.0;
	for (b = 0; b < 16; b++)
		printf("%ld%s", count[b], b % 8 == 7 ? "\n" : " ");     /* 8 counters per line */
	printf("chi2 = %.2f\n", chi2);
	for (x = 0; x < 100000; x++)                             /* 100,000 starting inputs */
		for (b = 0; b < 32; b++)                             /* popcount: bits set to 1 */
			bits += __builtin_popcount(hash_u32(x) ^ hash_u32(x ^ (1u << b)));
	printf("bits changed on average: %.3f out of 32\n", bits / 3200000.0);
	for (x = 1; x < 65536; x++)                              /* h(2x) close to 2 h(x)? */
		twice += (int32_t)(hash_u32(2 * x) - 2 * hash_u32(x)) >= -4
		&& (int32_t)(hash_u32(2 * x) - 2 * hash_u32(x)) <= 4;
	printf("h(2x) = 2 h(x) to within 4: %ld cases out of 65535\n", twice);
	return (0);
}
```

Actual output (compiled with `gcc -Wall -Wextra`):

```text
hash(0) = 0x00000000 -> 0.000000
hash(1) = 0x688990c0 -> 0.408349
hash(2) = 0xd1132181 -> 0.816698
hash(3) = 0x53f1e9dd -> 0.327910
hash(4) = 0xd97e5ed1 -> 0.849584
hash(5) = 0x5c45d53e -> 0.360441
hash(6) = 0xa7e3d3bb -> 0.655820
hash(7) = 0x948ba1e6 -> 0.580256
65646 65825 65785 65592 65704 65720 65498 65527
65228 65225 65119 65486 65316 65493 65566 65846
chi2 = 11.29
bits changed on average: 15.998 out of 32
h(2x) = 2 h(x) to within 4: 4079 cases out of 65535
```

| Measure | Result | Reading |
|---|---|---|
| Distribution over 1,048,576 consecutive inputs, 16 classes of 65,536 expected | From 65,119 to 65,846 per class; χ² = 11.29 for 15 degrees of freedom | Consistent with a uniform draw (the expected value of a χ² is 15, with a spread of about 5.5) |
| Avalanche: one input bit flipped, 3,200,000 trials | 15.998 output bits changed on average out of 32 | Almost exactly half, as intended |
| `hash(0)` | `0x00000000` | Input 0 stays 0: multiplying and shifting zero gives zero |
| `hash(2)` against `2 x hash(1)` | 0.816698 against 2 x 0.408349 = 0.816698 | For small inputs, the output keeps a trace of the input |
| `h(2x)` equal to `2 h(x)` to within 4 | 4,079 inputs out of 65,535 | About 6% of small inputs: the hash is good for patterns, not for security |

How to hash **several coordinates** (integer x, y, z) with a function that takes only one: chain them, injecting each coordinate into the hash of the next one. In the noise code below: `hash_u(x ^ hash_u(y ^ hash_u(z)))`.

## 3D value noise

Calling `hash_unit(hash_u(...))` for each pixel gives **white noise** (grain with no link between neighbors): useful for film grain, unusable for drawing a cloud, marble or distorted stripes. **Value noise** derives a **smooth** noise from it: we place a hash at the **corners of a regular grid**, then we **smooth** between the corners.

### The grid and the cell

The grid has a corner at each point whose three coordinates are integers. A point `p` falls into a **cell** (a cube of side 1); `floor(p)` (the integer part, e.g. `floor(2.3)` is 2) gives the bottom corner of this cell and `fract(p)` (the fractional part) gives the position of `p` inside it, from 0 to 1 along each axis. Seen in 2D (to fit on a page):

```text
 y
 6 |  c(2,6)------------------c(3,6)
   |    |                       |
   |    |        p = (2.3, 5.7) |   i = floor(p) = (2, 5)
   |    |   fy=0.7  *           |   f = fract(p) = (0.3, 0.7)
   |    |      <-fx=0.3->       |
 5 |  c(2,5)------------------c(3,5)
   |
   +----------------------------------> x
 each c(i,j): the hash value at corner (i, j)
```

In 3D, the cell has **8 corners** (each integer corner plus 0 or 1 on each of the three axes). A corner is always **the same** for all the cells that share it: it is not stored, it is recomputed by the hash each time, and gives the same value.

### The smoothing curve

Between two corners, the value is a mix (`mix`, see [Fresnel reflection](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#fresnel-reflection-the-more-you-look-at-a-slant-the-more-it-reflects)): `mix(a, b, t) = a x (1 - t) + b x t`. With `t` equal directly to `fract(p)`, the value varies in a straight line from one corner to the other, but the **slope** (how much the value rises per unit of displacement) changes abruptly when a cell face is crossed, which makes the grid visible. We replace `t` with `t * t * (3 - 2 * t)`, a Hermite curve (a third-degree polynomial curve): this is the formula of `smoothstep(0.0, 1.0, t)`, a GLSL function that is 0 below the first threshold, 1 above the second, and follows this curve between the two (see the [reference page](https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml), and an example of attenuation in [mesh editing](/?c=fondamentaux&s=graphisme&p=edition-de-maillage-et-selection-proportionnelle)). Its slope is zero at 0 and at 1: on either side of a face, the value arrives and leaves flat, without a break.

| `t` | Straight-line mix | Smoothed curve |
|---|---|---|
| 0 | 0.00000 | 0.00000 |
| 0.25 | 0.25000 | 0.15625 |
| 0.5 | 0.50000 | 0.50000 |
| 0.75 | 0.75000 | 0.84375 |
| 1 | 1.00000 | 1.00000 |

### The 8 corners and trilinear interpolation

The mixing is done axis by axis: this is **trilinear interpolation**. There are 4 mixes along x (the 8 corners reduce to 4 values), 2 along y (4 values become 2), then 1 along z.

```text
 8 corners               after x            after y        after z
 c000 c100  --mix x-->   x00  \
 c010 c110  --mix x-->   x10  / --mix y--> y0  \
 c001 c101  --mix x-->   x01  \                 --mix z--> noise
 c011 c111  --mix x-->   x11  / --mix y--> y1  /
```

```glsl
float corner(ivec3 c)            // ivec3: three integers; hash value at corner c
{
	uvec3 u = uvec3(c);                  // uvec3: three uint; same bits, unsigned
	return hash_unit(hash_u(u.x ^ hash_u(u.y ^ hash_u(u.z))));   // chain over the 3 axes
}

float value_noise(vec3 p)        // result: from 0 to less than 1, continuous in p
{
	ivec3 i = ivec3(floor(p));            // bottom corner of the cell
	vec3 f = fract(p);                    // position inside the cell, from 0 to 1
	vec3 u = f * f * (3.0 - 2.0 * f);     // smoothing curve applied to the three axes
	// 4 mixes along x, one per pair of neighboring corners
	float x00 = mix(corner(i), corner(i + ivec3(1, 0, 0)), u.x);
	float x10 = mix(corner(i + ivec3(0, 1, 0)), corner(i + ivec3(1, 1, 0)), u.x);
	float x01 = mix(corner(i + ivec3(0, 0, 1)), corner(i + ivec3(1, 0, 1)), u.x);
	float x11 = mix(corner(i + ivec3(0, 1, 1)), corner(i + ivec3(1, 1, 1)), u.x);
	return mix(mix(x00, x10, u.y), mix(x01, x11, u.y), u.z);   // 2 mixes along y, 1 along z
}
```

The point `p = (2.3, 5.7, 1.1)` gives `i = (2, 5, 1)`, `f = (0.3 ; 0.7 ; 0.1)` and, after the curve, `u = (0.216 ; 0.784 ; 0.028)` (for example 0.3 x 0.3 x (3 - 0.6) = 0.216). Here are the eight corner values, produced by the C program below, then the mixes:

| Corner | Value |
|---|---|
| (2, 5, 1) | 0.482036 |
| (3, 5, 1) | 0.212697 |
| (2, 6, 1) | 0.329994 |
| (3, 6, 1) | 0.220200 |
| (2, 5, 2) | 0.533925 |
| (3, 5, 2) | 0.170217 |
| (2, 6, 2) | 0.700765 |
| (3, 6, 2) | 0.960027 |

| Step | Calculation | Value |
|---|---|---|
| `x00` | mix of the corners (2,5,1) and (3,5,1), weight 0.216 | 0.423859 |
| `x10` | corners (2,6,1) and (3,6,1) | 0.306279 |
| `x01` | corners (2,5,2) and (3,5,2) | 0.455364 |
| `x11` | corners (2,6,2) and (3,6,2) | 0.756766 |
| `y0` | mix of `x00` and `x10`, weight 0.784 | 0.331676 |
| `y1` | mix of `x01` and `x11`, weight 0.784 | 0.691663 |
| noise | mix of `y0` and `y1`, weight 0.028 | 0.341756 |

The intermediate mixes were recomputed by hand from the eight corners (the C program does not display them); the final result matches that of the program.

```c
#include <math.h>     /* floorf, fabsf, sqrt */
#include <stdint.h>   /* uint32_t */
#include <stdio.h>    /* printf */

uint32_t	hash_u32(uint32_t x)           /* the integer hash from the previous section */
{
	x ^= x >> 16;
	x *= 0x7feb352du;
	x ^= x >> 15;
	x *= 0x846ca68bu;
	x ^= x >> 16;
	return (x);
}

float	corner(int x, int y, int z)            /* corner value, from 0 to less than 1 */
{
	uint32_t	h = hash_u32((uint32_t)x ^ hash_u32((uint32_t)y ^ hash_u32((uint32_t)z)));

	return ((float)(h >> 8) * (1.0f / 16777216.0f));
}

float	mix(float a, float b, float t)         /* a for t = 0, b for t = 1 */
{
	return (a * (1.0f - t) + b * t);
}

float	curve(float t, int smooth)             /* smooth = 1: smoothed; 0: straight */
{
	return (smooth ? t * t * (3.0f - 2.0f * t) : t);
}

float	noise(float px, float py, float pz, int smooth)
{
	int		ix = (int)floorf(px);          /* bottom corner of the cell */
	int		iy = (int)floorf(py);
	int		iz = (int)floorf(pz);
	float	fx = curve(px - floorf(px), smooth);   /* position inside the cell, smoothed */
	float	fy = curve(py - floorf(py), smooth);
	float	fz = curve(pz - floorf(pz), smooth);
	float	x00 = mix(corner(ix, iy, iz), corner(ix + 1, iy, iz), fx);
	float	x10 = mix(corner(ix, iy + 1, iz), corner(ix + 1, iy + 1, iz), fx);
	float	x01 = mix(corner(ix, iy, iz + 1), corner(ix + 1, iy, iz + 1), fx);
	float	x11 = mix(corner(ix, iy + 1, iz + 1), corner(ix + 1, iy + 1, iz + 1), fx);

	return (mix(mix(x00, x10, fy), mix(x01, x11, fy), fz));   /* y, then z */
}

float	max_gap(int smooth)                   /* largest jump between two neighbors */
{
	float	gap = 0;
	float	x;
	int		s;

	for (s = 1; s <= 200; s++)             /* x from 0.900 to 1.100, step 0.001 */
	{
		x = 0.9f + 0.001f * s;
		gap = fmaxf(gap, fabsf(noise(x, 0.3f, 0.6f, smooth)
				- noise(x - 0.001f, 0.3f, 0.6f, smooth)));
	}
	return (gap);
}

float	slope(float x0, float x1, int smooth)  /* slope between x0 and x1, y and z fixed */
{
	float	d = noise(x1, 0.3f, 0.6f, smooth) - noise(x0, 0.3f, 0.6f, smooth);

	return (d / (x1 - x0));
}

void	stats(void)                            /* mean, standard deviation: 10^6 points */
{
	uint32_t	r = 1;
	double		sum[2] = {0, 0};
	double		sq[2] = {0, 0};
	float		p[3];
	float		v[2];
	int			i;
	int			k;

	for (i = 0; i < 1000000; i++)
	{
		for (k = 0; k < 3; k++)            /* three coordinates in [0, 64[ */
		{
			r = hash_u32(r + 1);
			p[k] = (float)(r >> 8) * (64.0f / 16777216.0f);
		}
		v[0] = noise(p[0], p[1], p[2], 1);
		v[1] = corner((int)p[0], (int)p[1], (int)p[2]);   /* the hash alone */
		for (k = 0; k < 2; k++)
		{
			sum[k] += v[k];
			sq[k] += (double)v[k] * v[k];
		}
	}
	for (k = 0; k < 2; k++)
		printf("%s : mean %.4f, standard deviation %.4f\n",
			k ? "hash " : "noise", sum[k] / 1e6,
			sqrt(sq[k] / 1e6 - sum[k] / 1e6 * sum[k] / 1e6));
}

int	main(void)
{
	int	s;

	for (s = 0; s < 8; s++)                      /* the 8 corners of the cell (2, 5, 1) */
		printf("corner (%d,%d,%d) = %.6f\n", 2 + (s & 1), 5 + (s >> 1 & 1), 1 + (s >> 2),
			corner(2 + (s & 1), 5 + (s >> 1 & 1), 1 + (s >> 2)));
	printf("noise(2.3, 5.7, 1.1) = %.6f\n", noise(2.3f, 5.7f, 1.1f, 1));
	for (s = 0; s < 4; s++)                      /* integer points: noise = corner */
		printf("noise(%d,2,3) = %.6f, corner = %.6f\n", s, noise(s, 2, 3, 1),
			corner(s, 2, 3));
	printf("largest gap between neighbors: smoothed %.6f, straight %.6f\n",
		max_gap(1), max_gap(0));
	printf("slope before x = 1: smoothed %.5f, straight %.5f\n", slope(0.99f, 1.0f, 1),
		slope(0.99f, 1.0f, 0));
	printf("slope after x = 1: smoothed %.5f, straight %.5f\n", slope(1.0f, 1.01f, 1),
		slope(1.0f, 1.01f, 0));
	stats();
	return (0);
}
```

Actual output (compiled with `gcc -Wall -Wextra -O1 -ffp-contract=off`):

```text
corner (2,5,1) = 0.482036
corner (3,5,1) = 0.212697
corner (2,6,1) = 0.329994
corner (3,6,1) = 0.220200
corner (2,5,2) = 0.533925
corner (3,5,2) = 0.170217
corner (2,6,2) = 0.700765
corner (3,6,2) = 0.960027
noise(2.3, 5.7, 1.1) = 0.341756
noise(0,2,3) = 0.164228, corner = 0.164228
noise(1,2,3) = 0.675743, corner = 0.675743
noise(2,2,3) = 0.459813, corner = 0.459813
noise(3,2,3) = 0.143211, corner = 0.143211
largest gap between neighbors: smoothed 0.000312, straight 0.000575
slope before x = 1: smoothed 0.01732, straight 0.57474
slope after x = 1: smoothed 0.00376, straight 0.13027
noise : mean 0.4997, standard deviation 0.1849
hash  : mean 0.4997, standard deviation 0.2891
```

| Measure | Smoothed curve | Straight line (no smoothing) |
|---|---|---|
| Largest gap between two points 0.001 apart, x from 0.9 to 1.1 | 0.000312 | 0.000575 |
| Slope just before the face x = 1 (step 0.01) | 0.01732 | 0.57474 |
| Slope just after the face x = 1 | 0.00376 | 0.13027 |

With the straight line, the slope drops from 0.57 to 0.13 when crossing the face: a kink, hence a visible edge in the pattern. With the curve, both slopes are close to 0 (what remains is the effect of the 0.01 measurement step): the transition is invisible. At integer points, the noise is exactly the hash of the corner (the four `noise(s,2,3)` lines). And the noise is **continuous**: two points 0.001 apart have neighboring values, whereas two successive hashes jump (from 0.000000 to 0.408349 between inputs 0 and 1 of the integer hash output).

Another measure, over 1,000,000 points spread in a cube of side 64: the noise averages 0.4997 with a standard deviation (which measures how far the values spread from the mean) of 0.1849, whereas the bare hash has the same mean (0.4997) but a standard deviation of 0.2891. The noise is therefore **less contrasted** than its hash: each value is an average of eight corners, so it strays less from 0.5. To get full contrast, we stretch the result around 0.5 (for example `0.5 + (n - 0.5) * 1.5`, the factor 1.5 being tuned by eye) while clamping it with `clamp` (`clamp(x, 0.0, 1.0)` brings `x` back into the interval from 0 to 1).

### Distorted stripes and octaves

A direct use: distorting a regular function. Here, stripes whose position is perturbed by the noise:

```glsl
float stripes(vec3 p)
{
	float wobble = value_noise(p * 2.0);                // slow noise: cells 0.5 wide
	float s = sin(p.x * 16.0 + wobble * 2.0);           // stripes shifted by the noise
	return smoothstep(-0.7, -0.3, s);                   // 0 below -0.7, 1 above -0.3
}
```

A single layer of noise gives blobs the size of one cell. For a natural look (clouds, relief), we add several **octaves**: the same function at a doubled frequency (details twice as fine) and an amplitude halved (less visible details). This sum is called **fractal** noise (*fBm*).

```glsl
float fbm(vec3 p)                // sum of 4 octaves of value noise
{
	float sum = 0.0;             // accumulated total
	float amp = 0.5;             // amplitude of the first octave
	for (int k = 0; k < 4; k++)
	{
		sum += amp * value_noise(p);   // adds a layer
		p *= 2.0;                      // doubled frequency: details twice as fine
		amp *= 0.5;                    // amplitude halved
	}
	return sum;                  // at most 0.5 + 0.25 + 0.125 + 0.0625 = 0.9375
}
```

## Choosing a hash

| | `fract(sin(dot(...)))` | Integer hash (xor-shifts and multiplications) |
|---|---|---|
| Computation | In `float`, very sensitive to rounding | In integers, exact modulo 2³² |
| Same result from one card to another | Not guaranteed (depends on `sin`) | Yes, if the card supports `uint` |
| Large inputs | Small changes get absorbed | All 32 bits of the input count |
| Availability | Everywhere | `uint` and bitwise operators: GLSL 1.30 and later, so `#version 330` is fine |
| Readability | One line | Five lines, opaque constants |
| When to use it | Quick prototype, small inputs, output that may vary | Any pattern that must be **reproducible** |

## Pitfalls

| Pitfall | Why it is a problem | Remedy |
|---|---|---|
| An integer fragment input without `flat` | An average of integers is not an integer: the shader is rejected | `flat` on both sides (output and input), with the same name |
| An out-of-range `flat` index | `palette[v_material]` with an index that is too large: undefined result, no message | Check the index on the C side, or bound it with `clamp` |
| Integer attribute declared with `glVertexAttribPointer` | The card converts the integer to a float | `glVertexAttribIPointer` |
| A vertex shared by faces that want different values | The provoking vertex carries only one value: a face gets another face's value | Duplicate the vertices, or go through a geometry shader |
| Assuming `flat` takes the first vertex | The default setting is the last one | `glProvokingVertex` if you want the other, set once for the whole program |
| `fract(sin(...))` with large inputs | Small input changes get absorbed: zones of constant value (0.1680 seven times in a row for x = 1,000,000) | Keep the inputs small (subtract an origin), or use the integer hash |
| `fract(sin(...))` and reproducibility | The same code can give other values on another card | Integer hash for anything that must come out the same again |
| Integer hash: input 0 gives 0 | `hash(0)` is `0x00000000` | Add a constant to the seed or to the coordinate before hashing |
| Dividing a `uint` by `4294967295.0` | `(float)0xffffffff` is 4294967296: the result is 1.0 | Keep 24 bits: `float(h >> 8) * (1.0 / 16777216.0)` |
| Negative coordinates converted to `uint` | In C, the result is the same 32-bit pattern (modulo 2³²); in GLSL, check the `int`-to-`uint` conversion in the specification of your version | Shift the coordinates so that they stay positive, or test on the target |
| Value noise without smoothing | The slope changes at each cell face: the grid shows | Apply `t * t * (3.0 - 2.0 * t)` before the mixes |
| Believing the noise is as contrasted as the hash | Standard deviation of 0.1849 against 0.2891 | Stretch the result around 0.5, then clamp it |
| An integer hash used for security | It is enough for a shader, but it is not designed to resist an attacker (6% of small inputs satisfy `h(2x)` close to `2 h(x)`) | For a secret, see [randomness and generators](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#two-families-not-to-confuse) |

## Best practices

| Best practice | Why |
|---|---|
| Write `flat` on the output **and** the input, with the same name | No ambiguity about the expected interpolation |
| Reserve `flat` for per-triangle data (identifier, material, face) | The rest (color, texture, smoothed normal) must stay interpolated |
| Decide the provoking-vertex convention from the start, and write it down | A later change alters the value of every face |
| Prefer an integer hash to `fract(sin(...))` as soon as the pattern must be reproducible | Integers give the same result everywhere |
| Bring a `uint` down to a `float` by 24 bits, never by dividing by `2³² - 1` | The output stays within [0, 1[ and exact |
| Mix several coordinates by chaining `hash_u(a ^ hash_u(b ^ ...))` | One mix per coordinate is enough, and the order of the axes matters |
| Measure your hash (distribution, avalanche) before using it | The three tests of the C programs above can be redone in a few lines |
| Smooth value noise with the Hermite curve | The grid of cells disappears |
| Adjust the contrast of the noise afterwards | The average of eight corners strays little from 0.5 |
| Start with one octave, add more only if the rendering requires it | Each octave costs eight hashes per pixel |

## Key Takeaways

| | |
|---|---|
| **Key takeaway** | A fragment receives by default a weighted average (interpolation) of the values of the three vertices; `flat` removes the average and gives the whole triangle the value of a single vertex, the provoking vertex (the last one by default, `GL_LAST_VERTEX_CONVENTION`, changeable with `glProvokingVertex`). An integer fragment input must be `flat`. Uses: object identifier, material index, color or normal per face. A shader has no stateful generator: it uses a hash function, determined by the position. `fract(sin(dot(...)) * 43758.5453)` is short but depends on the precision of the `float` (16,691 distinct values out of 1,048,576 inputs, 998 gaps of more than 0.01 against the same computation in `double`, constant values far from the origin). The integer hash (xor-shift, multiplication by `0x7feb352d`, xor-shift, multiplication by `0x846ca68b`, xor-shift) is exact, uniform (χ² of 11.29 for 15 degrees of freedom) and changes 15.998 bits out of 32 on average when one input bit changes. 3D value noise places a hash at the corners of a grid, smooths it with `t * t * (3 - 2 * t)`, and combines the 8 corners through three successive mixes (trilinear interpolation). |
| **Pitfalls to avoid** | An integer fragment input without `flat`; a shared vertex that carries the value of several faces; an integer attribute without `glVertexAttribIPointer`; `fract(sin(...))` with large inputs or when the result must come out the same on another card; input 0 that gives 0; dividing by `4294967295.0`, which gives 1.0; noise without smoothing; noise less contrasted than its hash. |
| **Best practices** | `flat` on both sides with the same name; integer hash for any reproducible pattern; 24 bits to go from a `uint` to a `float`; Hermite curve before the mixes; measure the distribution and the avalanche of a hash; add octaves only if needed. |
