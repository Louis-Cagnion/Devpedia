---
order: 10
---

# Floats far from the origin: lost precision and local origin

A `float` (a floating-point number stored on 32 bits) keeps about seven reliable decimal digits, **whatever its size**. For a value close to 1, that gives a detail of the order of a ten-millionth; for a value of ten million, the finest detail is one whole meter. A point located 10,000 km from the origin, expressed in meters, can no longer move by less than one meter: a detail of one centimeter disappears. This chapter measures that loss, then presents the fix used in graphics, cartography and games: a **local origin**, a reference point chosen near the data, subtracted in `double` (a floating-point number stored on 64 bits, more precise) before the values are stored as `float`.

A few words of the trade, defined here once and for all. A **coordinate** is a number that locates a point relative to a frame of reference (for example "12.5 meters to the east"). The **origin** is the point of that frame whose coordinates are all 0. A **vertex** is a point of a 3D object, and a **mesh** is an object described by vertices joined into triangles (see [the `.obj` format](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)). A map, a game level or a mesh all handle lists of coordinates of this kind.

This chapter assumes you already know the basics of C ([variables](/?c=langages&s=c&p=variables), [conditions](/?c=langages&s=c&p=conditions), [loops](/?c=langages&s=c&p=boucles)), [the floating-point number types in C](/?c=langages&s=c&p=variables#floating-point-numbers) and [the encoding of floats](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#how-a-float-is-encoded) (sign, exponent, mantissa), which it extends without repeating them. Powers of two and bits are recalled in [integers and overflow](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements). All programs were compiled with `gcc -std=c11 -Wall -Wextra -Werror -fsanitize=address,undefined` under Linux (`-Werror` turns every warning into an error; `-fsanitize=...` adds run-time checks that catch memory errors and undefined behavior; see [the compilation process](/?c=langages&s=c&p=compilation)) and then run; they were also recompiled with `-O2 -ffp-contract=off` (the compiler's optimization, see [the optimization levels](/?c=langages&s=c&p=compilation#optimization-levels-o0-to-o3-os), without fusing a multiplication and an addition into a single operation, which would change the roundings): the outputs are **identical** in both cases. They assume a current processor whose `float` really computes on 32 bits.

## The finding: 24 significant bits, so a gap that doubles

A `float` keeps **24 significant bits**: the binary digits that carry the value. One sometimes reads 23 bits of mantissa, sometimes 24. Both are right: 23 bits are **stored** (the mantissa), and the 24th is implicit. A binary number written in normalized form "1.xxx × 2ᵉ" (a single digit before the point, always 1) does not need to store that first 1. The `double` does the same with 52 stored bits and 53 significant ones.

| Type | Stored bits (mantissa) | Significant bits | Gap just above 1.0 | Reliable decimal digits |
|---|---|---|---|---|
| `float` | 23 | 24 | 2⁻²³ ≈ 1.19 × 10⁻⁷ | about 7 |
| `double` | 52 | 53 | 2⁻⁵² ≈ 2.2 × 10⁻¹⁶ | about 15 to 16 |

Between two consecutive representable numbers there is a **gap**, called *ULP* (*unit in the last place*: the value of the last bit of the mantissa). For a `float` between 2ᵉ and 2ᵉ⁺¹, the gap is 2ᵉ⁻²³. Each **band** [2ᵉ ; 2ᵉ⁺¹[ (the interval between two consecutive powers of two) contains exactly the same number of `float`s (2²³ = 8,388,608), and its width doubles from one band to the next: the gap therefore doubles as well.

```text
value:      1                2                      4                              8
            |----------------|----------------------|------------------------------|
floats:     8,388,608 floats 8,388,608 floats       8,388,608 floats
gap:        2⁻²³ ≈ 1.2e-7    2⁻²² (x2)              2⁻²¹ (x4)
```

The following program queries the computer directly. `nextafterf(x, to)` returns the `float` neighboring `x` in the direction of `to` ([`nextafterf`](https://en.cppreference.com/w/c/numeric/math/nextafter)); the difference with `x` is the gap we are looking for.

```c
#include <float.h>
#include <math.h>
#include <stdio.h>

// Print the gap between x and its neighbors, then FLT_EPSILON * x for comparison
static void print_gap(float x)
{
    float next_value = nextafterf(x, INFINITY);    // smallest float strictly larger
    float previous = nextafterf(x, -INFINITY);     // largest float strictly smaller
    printf("%10.0f | %-14.9g | %-14.9g | %.9g\n", x, next_value - x, x - previous,
           FLT_EPSILON * x);
}

int main(void)
{
    const float values[] = {1.0f, 1000.0f, 1000000.0f, 16777216.0f, 100000000.0f};
    const int count = sizeof values / sizeof values[0];  // number of values in the array

    printf("%10s | %-14s | %-14s | %s\n", "x", "above", "below", "FLT_EPSILON*x");
    for (int i = 0; i < count; i++)         // one line per value
        print_gap(values[i]);
    printf("FLT_EPSILON = %.9g\n", FLT_EPSILON);    // the gap above 1.0, nothing else

    float large = 16777216.0f;              // 2^24: beyond it, some integers are missing
    float plus_one = large + 1.0f;          // 16777217 does not exist: rounded to the nearest
    float plus_two = large + 2.0f;          // 16777218 exists
    printf("2^24 + 1 == 2^24 ? %s\n", plus_one == large ? "yes" : "no");
    printf("2^24 + 2 == 2^24 ? %s\n", plus_two == large ? "yes" : "no");
    return 0;
}
```

```text
         x | above          | below          | FLT_EPSILON*x
         1 | 1.1920929e-07  | 5.96046448e-08 | 1.1920929e-07
      1000 | 6.10351562e-05 | 6.10351562e-05 | 0.00011920929
   1000000 | 0.0625         | 0.0625         | 0.11920929
  16777216 | 2              | 1              | 2
 100000000 | 8              | 8              | 11.920929
FLT_EPSILON = 1.1920929e-07
2^24 + 1 == 2^24 ? yes
2^24 + 2 == 2^24 ? no
```

| Element | Role |
|---|---|
| `#include <float.h>` | The header (a file of declarations, see [headers](/?c=langages&s=c&p=headers)) that gives the limits of the floating-point types, including `FLT_EPSILON` ([`<float.h>`](https://en.cppreference.com/w/c/types/limits)) |
| `static`, `const` | `static` in front of a function makes it visible in this file only; `const` promises that a value will not be modified |
| `#include <math.h>` | The header of mathematical functions: `nextafterf` and the value `INFINITY` |
| `INFINITY` | The "positive infinity" value; `nextafterf(x, INFINITY)` gives the neighbor above, `-INFINITY` the neighbor below |
| `1.0f` | The suffix `f` makes a `float`; without it, `1.0` would be a `double` |
| `sizeof values / sizeof values[0]` | The size of the array divided by the size of one element: the number of elements |
| `%10.0f`, `%-14.9g`, `%.9g` | `printf` formats: a `float` in 10 characters with no decimal; a number in 14 characters left-aligned (`-`) with 9 significant digits; the same without width. Nine digits are enough to tell two `float`s apart |

The gaps measured, compared with the formula 2ᵉ⁻²³:

| Value | Band [2ᵉ ; 2ᵉ⁺¹[ | Gap above | What it means in meters |
|---|---|---|---|
| 1 | [1 ; 2[ | 2⁻²³ ≈ 0.00000012 | A ten-millionth of a meter |
| 1,000 | [512 ; 1,024[ | 2⁻¹⁴ ≈ 0.000061 | About 6 hundredths of a millimeter |
| 1,000,000 | [524,288 ; 1,048,576[ | 2⁻⁴ = 0.0625 | More than 6 centimeters |
| 16,777,216 (2²⁴) | [2²⁴ ; 2²⁵[ | 2 | The **odd** integers no longer exist |
| 100,000,000 | [2²⁶ ; 2²⁷[ | 2³ = 8 | Gaps of 8 meters |

Three remarks on the output. First, from 16,777,216 = 2²⁴ onward, two consecutive numbers are 2 apart: `16777217` does not exist, and the calculation `2²⁴ + 1` falls back to `2²⁴` (the exact result lies exactly between two `float`s; the rounding rule, see [absorption](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorption-and-cancellation-when-a-calculation-loses-its-digits), picks the one whose last bit is 0). Next, the gap **below** 1 and below 2²⁴ is half the gap above (5.96e-08 and 1): a power of two opens an interval, so the band below is twice as fine. Finally, the `FLT_EPSILON*x` column gives the order of magnitude of the gap, never its exact value.

### What `FLT_EPSILON` means

`FLT_EPSILON`, defined in `<float.h>`, is the gap just above **1.0** and nothing else: 2⁻²³ ≈ 1.19 × 10⁻⁷. Taking it for "the precision of a `float`" is a common mistake.

| What we think | What is true |
|---|---|
| "Two `float`s less than `FLT_EPSILON` apart are equal" | That holds only near 1. At 1,000,000 the gap is 0.0625: more than 500,000 times larger |
| "A `float` has a precision of 10⁻⁷" | The precision is **relative**: about 10⁻⁷ **of the value** (between 6 × 10⁻⁸ and 1.2 × 10⁻⁷ of `x`) |
| "The precision is the same everywhere" | It is constant in proportion, but the **absolute** error grows with the value: 10⁻⁷ at 1, 8 at 10⁸ |
| "`double` solves the problem" | It only pushes it back: the same phenomenon exists with 53 bits, at much larger values ([the floating-point numbers chapter](/?c=donnees&s=representation-des-donnees&p=nombres-flottants) gives the thresholds of `double`) |

To compare two `float`s, we therefore use a margin **proportional** to their size (see [comparing correctly](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#the-practical-consequence-never-test-for-equality)), never `FLT_EPSILON` alone.

## The symptoms, measured

A single program makes two measurements. **First measurement**: add 0.1 a million times to a `float`, once starting from 0, and once starting from 10,000,000. The mathematical result is 100,000, then 10,100,000.

**Second measurement**, closer to a real mesh: a small triangle ABC with sides of 1 cm (0.01 m) is placed 10,000 km from the origin (10,000,000 m). Its vertices are stored in `float`s, read back, and the sides are measured. Two triangles are tried: one far from any rounding boundary, the other straddling a boundary. For the second, here is what happens to its two vertices A and B:

```text
x of A: 10000000.495  --round-->    10000000   (the nearest float)
x of B: 10000000.505  --round-->    10000001   (the nearest float)
real gap: 0.01 m                    gap obtained: 1 m
(two neighboring floats are 1 m apart; their midpoint is 10000000.5, A below, B above)
```

The two vertices, 1 cm apart, fall on either side of the midpoint between two neighboring `float`s: A becomes 10,000,000 and B becomes 10,000,001.

```c
#include <math.h>
#include <stdio.h>

// A vertex: two coordinates in meters, measured from the origin of the frame
typedef struct {
    double x;
    double y;
} Point;

// What a number becomes when it is stored in a float and then read back
static double via_float(double v)
{
    return (double)(float)v;            // double -> float (rounding) -> double (lossless)
}

// Length of the segment between two points, in meters
static double side(Point a, Point b)
{
    return hypot(b.x - a.x, b.y - a.y); // hypot(dx, dy): square root of dx² + dy²
}

// Print the three sides of the triangle, after a pass through float
static void print_triangle(const char *name, const Point s[3])
{
    Point f[3];                         // the three vertices after the pass through float

    for (int i = 0; i < 3; i++) {       // each coordinate is rounded to a float
        f[i].x = via_float(s[i].x);
        f[i].y = via_float(s[i].y);
    }
    printf("%s : AB=%g BC=%g CA=%g (expected: 0.01 0.0141421 0.01)\n",
           name, side(f[0], f[1]), side(f[1], f[2]), side(f[2], f[0]));
}

int main(void)
{
    float from_zero = 0.0f;                     // sum that starts at 0
    float from_ten_million = 10000000.0f;       // sum that starts at ten million

    for (int i = 0; i < 1000000; i++) {         // a million additions of 0.1
        from_zero += 0.1f;
        from_ten_million += 0.1f;
    }
    printf("from 0          : %.2f (expected 100000)\n", from_zero);
    printf("from 10000000   : %.2f (expected 10100000)\n", from_ten_million);

    const Point mid[3] = {                      // sides of 1 cm, at 10,000 km (10^7 m)
        {10000000.2, 10000000.2}, {10000000.21, 10000000.2}, {10000000.2, 10000000.21}};
    const Point straddling[3] = {               // A just below x.5, B just above
        {10000000.495, 10000000.0}, {10000000.505, 10000000.0},
        {10000000.495, 10000000.01}};

    print_triangle("degenerate", mid);
    print_triangle("distorted ", straddling);
    return 0;
}
```

```text
from 0          : 100958.34 (expected 100000)
from 10000000   : 10000000.00 (expected 10100000)
degenerate : AB=0 BC=0 CA=0 (expected: 0.01 0.0141421 0.01)
distorted  : AB=1 BC=1 CA=0 (expected: 0.01 0.0141421 0.01)
```

| Element | Role |
|---|---|
| `typedef struct {...} Point;` | Gives the name `Point` to a grouping of two fields (see [structures](/?c=langages&s=c&p=variables#structures-struct)) |
| `(double)(float)v` | Two conversions in a row: to a `float` (the rounding happens here), then to a `double` (lossless, because a `double` contains every `float`) |
| `hypot(dx, dy)` | The square root of dx² + dy²: the length of a segment with sides dx and dy |
| `0.1f` | The `float` closest to 0.1 (exact value: 0.100000001490116...) |
| `const Point s[3]` | A parameter that receives three points (in reality the address of the first one, see [pointers](/?c=langages&s=c&p=pointeurs)) |
| `%.2f`, `%g`, `%s` | `printf` formats: two decimals; a number without useless zeros; a text |
| `for` | The loop that repeats a block a given number of times (see [the `for` loop](/?c=langages&s=c&p=boucles#for-loop)) |

| Measurement | Result | Explanation |
|---|---|---|
| Sum starting from 0 | 100,958.34 instead of 100,000 | 0.1 is never an exact multiple of the gap. At each addition the result is rounded, and at these sizes it is rounded **on the same side** every time: the errors add up instead of canceling out |
| Sum starting from 10,000,000 | Stays at 10,000,000.00 | The gap there is 1: adding 0.1 (less than half a gap) changes no bit. Each of the one million additions is **absorbed** |
| Triangle "far from a boundary" | All three sides are 0 | The three vertices become the same `float`: the triangle is **degenerate** (reduced to a point) |
| Triangle "straddling a boundary" | AB = 1 m, BC = 1 m, CA = 0 | Sides 100 times too large, or zero: the triangle is **distorted** |

These triangles are not exotic at all: a vertex that becomes a point, a side that becomes a meter, is a hole in a surface, an object that trembles when the camera moves, or a collision that is missed.

## The fix: a local origin

The idea: do not store **absolute** coordinates (measured from the origin of the world), but **relative** coordinates measured from a nearby point, the **local origin**. If the data fit within a radius of a few meters, the stored numbers are a few meters, and a `float` has a gap of about a micrometer there.

```text
        world origin                            local origin O
              (0,0)                         (chosen near the data)
                |                                    |
                |<------------ 10,000,000 m -------->|<-- 0.01 m -->| vertex
                |                                    |
   direct storage : x = 10000000.505  -> float: 1 m gap   (lost)
   local storage  : x - O = 0.01      -> float: ~1e-9 m gap (precise)
```

The method has four steps:

| Step | What | In which type |
|---|---|---|
| 1. Choose the origin O | The first vertex, the center of the data, a corner... | `double` |
| 2. Subtract | For each coordinate: `p - O` | **`double`** |
| 3. Convert and store | The difference, now small, is stored in a `float` | `float` |
| 4. Reload | On reading: `O + float_value`, added in `double` | `double` |

O is kept **with the object**, in `double`: it is the only value that keeps the real position.

### Why the subtraction is done in `double`

Everything is in the order. Converting **first** to `float` and then subtracting destroys the information, because the loss happens at the conversion and the subtraction only makes it visible. Subtracting **first** in `double` keeps everything, then the conversion applies to a small number.

| Order of operations | Calculation for B − A (B = 10000000.505, A = 10000000.495) | Result |
|---|---|---|
| Convert, then subtract in `float` | `(float)B - (float)A` = 10000001 − 10000000 | **1** |
| Subtract in `double`, then convert | `(float)(B - A)` | **0.01** |

The difference of two `double`s that are close to each other is **exact**. More precisely, if one of the two numbers lies between half and double the other, their difference fits exactly in a `double`: this is Sterbenz's lemma (a classic result of floating-point arithmetic). Intuitively: the two numbers are written with the same high-order digits, which cancel out in the subtraction; only a few bits remain to keep, and the 53 bits of the `double` are more than enough. The following program stores the same vertices both ways and measures the position error.

```c
#include <math.h>
#include <stdio.h>

typedef struct { double x, y; } Point;      // a vertex in meters, as double (53 bits)
typedef struct { float x, y; } PointF;      // a vertex stored as float (24 bits)

// Careless storage: the coordinates are converted directly to float
static PointF store_direct(Point p)
{
    return (PointF){(float)p.x, (float)p.y};
}

// Storage with a local origin: subtract in double, then convert
static PointF store_local(Point p, Point origin)
{
    return (PointF){(float)(p.x - origin.x), (float)(p.y - origin.y)};
}

// Reading without origin: we get back the value of the float, nothing more
static Point reload_direct(PointF f)
{
    return (Point){f.x, f.y};
}

// Reading with origin: the origin is put back, in double
static Point reload_local(PointF f, Point origin)
{
    return (Point){origin.x + f.x, origin.y + f.y};
}

// Distance between two points, in meters
static double dist(Point a, Point b)
{
    return hypot(b.x - a.x, b.y - a.y);
}

// Print the three sides of the triangle reloaded as r, and its largest position error
static void show(const char *name, const Point v[3], const Point r[3])
{
    double worst = 0.0;                     // largest gap between v[i] and r[i]

    for (int i = 0; i < 3; i++)
        worst = fmax(worst, dist(v[i], r[i]));
    printf("%-15s AB=%.6f BC=%.6f CA=%.6f  max error=%.2e m\n", name,
           dist(r[0], r[1]), dist(r[1], r[2]), dist(r[2], r[0]), worst);
}

int main(void)
{
    // Sides of 1 cm, at 10,000 km (10^7 m): A is just below x.5, B just above
    const Point v[3] = {{10000000.495, 10000000.0}, {10000000.505, 10000000.0},
                        {10000000.495, 10000000.01}};
    const Point origin = v[0];              // local origin: the first vertex
    Point direct[3], local[3];              // reloaded: without, then with the origin

    for (int i = 0; i < 3; i++) {           // store as float, then reload
        direct[i] = reload_direct(store_direct(v[i]));
        local[i] = reload_local(store_local(v[i], origin), origin);
    }
    printf("expected        AB=0.010000 BC=0.014142 CA=0.010000\n");
    show("direct float", v, direct);
    show("local origin", v, local);

    float fa = (float)v[0].x, fb = (float)v[1].x;   // A and B converted to float
    printf("B - A in float  : %g\n", fb - fa);      // subtraction done in float
    printf("B - A in double : %.6f\n", v[1].x - v[0].x);    // same subtraction in double
    return 0;
}
```

```text
expected        AB=0.010000 BC=0.014142 CA=0.010000
direct float    AB=1.000000 BC=1.000000 CA=0.000000  max error=4.95e-01 m
local origin    AB=0.010000 BC=0.014142 CA=0.010000  max error=0.00e+00 m
B - A in float  : 1
B - A in double : 0.010000
```

| Element | Role |
|---|---|
| `(PointF){(float)p.x, (float)p.y}` | A **compound literal**: builds a `PointF` on the spot, without an intermediate variable (see [the compound literal](/?c=langages&s=c&p=offsetof-et-litteral-compose#the-c99-compound-literal-a-value-built-in-place)) |
| `fmax(a, b)` | The larger of the two numbers |
| `%-15s` | A text in 15 characters, left-aligned |
| `%.2e` | Scientific notation with two decimals: `4.95e-01` means 4.95 × 10⁻¹ |
| `const Point origin = v[0];` | The local origin is here the first vertex |

With the local origin, the sides are correct. The "max error" of `0.00e+00` does not mean that the `float` is exact (0.01 is stored there to within about 2 × 10⁻¹⁰): this error is smaller than half the step of the `double` at 10,000 km (about 9 × 10⁻¹⁰ m), so the addition `origin + value` falls back on the original value.

### Which origin to choose

| Choice | Advantage | Drawback |
|---|---|---|
| The first vertex | Simple; small offsets for a compact object | Depends on the order of the vertices; two neighboring objects have two different origins |
| The center of the bounding box (the smallest box that contains the data) | Offsets at most equal to half the size | Recomputed whenever the data change |
| A corner of the area | Easy to find | Offsets up to the full size |
| A multiple of a power of two (next section) | Exact everywhere, identical for all the objects in a cell | Choosing the step |

## Why a power-of-two step

The first three choices share a common flaw: the origin depends on the data. A **step** is a fixed length, here 2ᵏ meters (k is an integer: k = 10 gives 1,024 m). The origin is then computed from the coordinate alone: O = 2ᵏ × (x / 2ᵏ rounded to the nearest integer). All the points that receive the same origin form a **cell**: a segment of 2ᵏ meters (a square in 2D, a cube in 3D).

```text
boundaries :  9999872                  10000896
                 |<------- 1024 m ------->|
                 |           O             |
                 |       10000384          |   every coordinate in this cell
                 |                         |   gets the same origin O
```

The calculation, with x = 10000000.495 and k = 10:

| Step | Operation | Value |
|---|---|---|
| 1 | Divide by 2¹⁰ (a simple shift of the exponent) | 9765.6255 |
| 2 | Add 0.5, then take the integer part (`floor`) | 9766 |
| 3 | Multiply by 2¹⁰ | O = 10,000,384 |
| 4 | Offset x − O | −383.505 |

```c
#include <math.h>
#include <stdio.h>

// Origin chosen by step: the multiple of 2^k closest to x
static double origin_by_step(double x, int k)
{
    double n = floor(ldexp(x, -k) + 0.5);   // x / 2^k, rounded to the nearest integer
    return ldexp(n, k);                     // n * 2^k (ldexp(m, e) is m * 2^e, without error)
}

// Store x as a float relative to origin o, then read it back: the value recovered
static double round_trip(double x, double o)
{
    float f = (float)(x - o);               // subtraction in double, then in float
    return o + f;                           // the origin is put back, in double
}

int main(void)
{
    const double x = 10000000.495;          // a coordinate 10,000 km from the origin
    const int step[] = {0, 4, 10, 16};      // the exponents k that are tested

    printf("x = %.3f\n", x);
    for (int i = 0; i < 4; i++) {           // one trial per step
        double o = origin_by_step(x, step[i]);
        double worst = 0.0;                 // largest error over 200,000 neighboring points
        for (int j = 0; j < 200000; j++) {
            double p = 10000000.0 + j * 0.4713;
            worst = fmax(worst, fabs(round_trip(p, origin_by_step(p, step[i])) - p));
        }
        printf("k=%2d step=%6.0f origin=%.0f offset=%+.3f max error=%.2e\n",
               step[i], ldexp(1.0, step[i]), o, x - o, worst);
    }

    const double free_origin = 10000000.1;  // a "free" origin, close to the data
    const double by_step = origin_by_step(free_origin, 10);
    printf("arbitrary  : double=%.9f float=%.9f\n", free_origin, (double)(float)free_origin);
    printf("by step    : double=%.9f float=%.9f\n", by_step, (double)(float)by_step);

    const double shared = 10000040.123;     // a vertex shared by two neighboring pieces
    const double center_a = 10000020.3, center_b = 10000070.7;  // one center per piece
    printf("centers : gap between the two reloads = %.2e m\n",
           fabs(round_trip(shared, center_a) - round_trip(shared, center_b)));
    printf("by step : gap between the two reloads = %.2e m\n",
           fabs(round_trip(shared, origin_by_step(shared - 20.0, 10))
                - round_trip(shared, origin_by_step(shared + 30.0, 10))));

    const double edge = 10000895.9;         // a vertex next to a cell boundary
    printf("at the boundary: gap = %.2e m\n",
           fabs(round_trip(edge, origin_by_step(edge - 2.0, 10))
                - round_trip(edge, origin_by_step(edge + 2.0, 10))));
    return 0;
}
```

```text
x = 10000000.495
k= 0 step=     1 origin=10000000 offset=+0.495 max error=1.49e-08
k= 4 step=    16 origin=10000000 offset=+0.495 max error=2.38e-07
k=10 step=  1024 origin=10000384 offset=-383.505 max error=1.52e-05
k=16 step= 65536 origin=10027008 offset=-27007.505 max error=9.75e-04
arbitrary  : double=10000000.100000000 float=10000000.000000000
by step    : double=10000384.000000000 float=10000384.000000000
centers : gap between the two reloads = 3.80e-07 m
by step : gap between the two reloads = 0.00e+00 m
at the boundary: gap = 3.05e-05 m
```

| Element | Role |
|---|---|
| `ldexp(m, e)` | Computes m × 2ᵉ by changing only the exponent of the number: **no rounding error** ([`ldexp`](https://en.cppreference.com/w/c/numeric/math/ldexp)) |
| `floor(y)` | The largest integer less than or equal to y, returned as a `double`; `floor(y + 0.5)` rounds to the nearest integer ([`floor`](https://en.cppreference.com/w/c/numeric/math/floor)) |
| `fabs(y)` | The absolute value of y |
| `%+.3f`, `%6.0f`, `%2d` | `printf` formats: three decimals with the sign; a number in 6 characters with no decimal; an integer in 2 characters |
| `%.9f` | A number with nine decimals |
| `(double)(float)free_origin` | What `free_origin` becomes when it is passed through a `float` |

Why powers of two, and not a "free" origin or a decimal step such as 0.1 m (which neither `float` nor `double` represents exactly)?

| Property | Explanation | What the output shows |
|---|---|---|
| The origin itself is exact | A multiple n × 2ᵏ (n < 2²⁴) fits in a `float` **and** in a `double` without rounding. A number such as 10000000.1 fits in neither: it is only approximated | `free_origin` goes through a `float` and becomes 10,000,000.0: **0.1 m of extra error**, that is ten times the side of the triangle. `by_step` comes back unchanged |
| The offset is bounded | The cell never extends beyond 2ᵏ⁻¹ on either side of O: the conversion error is bounded by 2ᵏ⁻²⁶ (plus the tiny rounding of the final addition in `double`), whatever the distance to the world origin | The `max error` column follows the bound (table below) |
| The same origin is found everywhere | O depends only on x and k: loading, saving, sending to the graphics card and another machine give the same value. One can even store only the integer n | In the `by step` line, two points 50 m apart receive the same origin |
| Neighbors share it | All the points of one cell have the same origin, hence the same conversion for a shared vertex | `centers`: 3.80e-07 m gap; `by step`: 0 |

Point 1 needs a clarification in the interest of honesty. The **subtraction** `x - 10000000.1` stays exact in `double`, like with any nearby origin (see above). The extra error arises when this origin travels anywhere other than a `double`: sent to the graphics card as a `float`, written to a text file with rounding, or recomputed slightly differently somewhere else in the program. An origin that is a multiple of 2ᵏ passes through all these steps unchanged.

Choosing k is a trade-off, measured on 200,000 neighboring points:

| k | Step (m) | Maximal offset (m) | Bound 2ᵏ⁻²⁶ (m) | Measured error (m) |
|---|---|---|---|---|
| 0 | 1 | 0.5 | 1.49 × 10⁻⁸ | 1.49 × 10⁻⁸ |
| 4 | 16 | 8 | 2.4 × 10⁻⁷ | 2.38 × 10⁻⁷ |
| 10 | 1,024 | 512 | 1.5 × 10⁻⁵ | 1.52 × 10⁻⁵ |
| 16 | 65,536 | 32,768 | 9.8 × 10⁻⁴ | 9.75 × 10⁻⁴ |

We choose the largest k whose bound stays under the desired tolerance: a larger step means fewer origins to manage, a smaller step more precision. The last test of the output shows the limit of the method: at a **boundary** between two cells, two neighboring points receive two different origins (10,000,384 and 10,001,408), and a shared vertex stored twice can differ by 3.05 × 10⁻⁵ m, that is a `float`-sized gap at 512 m. The error stays bounded, but it is not zero.

## Limits and other remedies

### Storing the origin with the object

The local origin is part of the data: without it, the `float`s locate nothing. It is stored as a `double`, next to the relative coordinates:

```c
#include <stddef.h>

typedef struct {
    double origin[3];       // the local origin of the object, in double (3 × 8 = 24 bytes)
    float *vertices;        // x, y, z of each vertex, relative to the origin, in float
    size_t vertex_count;    // number of vertices
} Mesh;

// Absolute x coordinate of vertex i: the origin is put back in double
static double x_absolute(const Mesh *m, size_t i)
{
    return m->origin[0] + m->vertices[3 * i];
}

// x gap between vertex i of a and vertex j of b, without going through a large number
static double x_offset(const Mesh *a, size_t i, const Mesh *b, size_t j)
{
    double between_origins = a->origin[0] - b->origin[0];  // large difference, in double
    return between_origins + ((double)a->vertices[3 * i] - b->vertices[3 * j]);
}
```

| Element | Role |
|---|---|
| `size_t` | An unsigned integer made for counting elements and positions |
| `m->origin[0]` | The field `origin` of the structure whose address is `m`, first slot (x) |
| `m->vertices[3 * i]` | The vertices are stored flat: x, y, z of vertex 0, then of vertex 1...; the x coordinate of vertex i is at slot 3 × i |
| `(double)a->vertices[3 * i] - b->vertices[3 * j]` | The cast makes the left-hand `float` a `double`; the right-hand `float` is then promoted to `double` automatically, so the subtraction is done in `double` |

`x_offset` illustrates the rule for two objects with different origins: first subtract the **origins** from each other, in `double`, then add the small difference of the offsets.

### The cost and the graphics card

| Question | Answer |
|---|---|
| Why not store everything as `double`? | A `double` takes 8 bytes, a `float` 4 (see [memory organization](/?c=donnees&s=representation-des-donnees&p=organisation-en-memoire)). A million vertices in 3D: 12 MB (megabytes, millions of bytes) as `float`, 24 MB as `double`, and twice the data to send to the graphics card each time |
| Why is the graphics card concerned? | Its programs, the [shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#shaders-the-graphics-card-s-programs), compute in `float`: the `double` is absent on some hardware and clearly slower on others |
| What then? | Keep the origin as a `double` on the processor side and send only relative `float`s. The translation of the object (see [the model, view and projection matrices](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#from-the-object-to-the-screen-model-view-projection)) is computed in `double`, and only its reduced version goes out as `float` |

### Other remedies

| Remedy | Principle | Detail |
|---|---|---|
| Coordinates relative to the camera | At each frame, subtract the camera's position in `double`: the precision is maximal near the eye | A local origin that follows the camera |
| Fixed-point integers | Count in millimeters in a 64-bit integer: the gap is the same everywhere | See [fixed-point representation](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#an-alternative-fixed-point-representation) |
| `double` everywhere | Pushes the threshold back (from 16.7 million to 9 quadrillion for integers) | Memory cost, speed |
| Cutting the world into cells | One origin per cell (the power-of-two step of this chapter), each cell has its own `float`s | Handling the boundaries |

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| Converting to `float` **before** subtracting | `(float)p - (float)O` falls back to 0 or to one meter: the loss has already happened. Subtract in `double` first |
| Losing the origin, or storing it as a `float` | The offsets stay correct, but the whole object is moved (by 0.1 m in the `free_origin` example). Store the origin as a `double` with the object |
| Mixing two objects with different origins | Comparing or adding their `float`s as if they shared a frame shifts everything by the difference of the origins. Bring them to the same frame (subtract the origins in `double`, see `x_offset`) |
| A vertex shared by two pieces with different origins | Stored twice, it differs by a few `float` gaps: a crack between the pieces. Give both the same origin, or store it only once |
| Adding the object's translation in `float` later | A placement matrix (an array of numbers that moves and rotates the object) that contains 10,000,000 in `float` brings back the origin problem. Compose in `double`, round at the end |
| Comparing two floating-point numbers with `==` | Even after an exact round trip, a rounding may remain. Compare with a relative margin (see `almost_equal` below) or in `double` after the origin is put back |
| Taking `FLT_EPSILON` as the precision of every `float` | It is only valid near 1. A tolerance proportional to the value is needed |
| Choosing a step that is too large | At k = 16, the error rises to nearly a millimeter. Choose k from the tolerance |
| Adding many small values to a large total | Each addition is rounded (or absorbed): see the sums above and [absorption](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#absorption-and-cancellation-when-a-calculation-loses-its-digits). Add the small values together first |

A comparison of `float`s with a proportional margin (`fabsf` is the absolute value of a `float`, `fmaxf` the larger of two `float`s):

```c
#include <float.h>
#include <math.h>

// True if a and b differ by at most four times the relative gap of a float
static int almost_equal(float a, float b)
{
    float margin = 4.0f * FLT_EPSILON * fmaxf(fabsf(a), fabsf(b));  // proportional margin
    return fabsf(a - b) <= margin;      // fabsf: absolute value of a float
}
```

## Best practices

| Best practice | Why |
|---|---|
| Keep world coordinates in `double`, store only offsets in `float` | Large numbers stay precise, small ones fit in 24 bits |
| Subtract the origin in `double`, then convert | The difference is exact, the conversion applies to a small number |
| Choose the origin by power-of-two steps (`ldexp`, `floor`) | Exact origin, reproducible, shared by neighbors |
| Choose k from the tolerance: error ≤ 2ᵏ⁻²⁶ | The maximal error is computed before coding |
| Store the origin (or the integer n and k) with each object | `float`s are useless without it |
| Bring two objects into the same frame by subtracting their origins in `double` | No large value goes back through a `float` |
| Measure the gap above the useful value with `nextafterf` rather than assume it | The real precision is seen where you work |
| Compare with a proportional margin, never with `==` | The tolerance follows the size of the values |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | A `float` has 24 significant bits: the gap between two neighbors is 2ᵉ⁻²³ and doubles at each power-of-two band (1.2e-7 at 1, 0.0625 at one million, 2 at 16,777,216, 8 at a hundred million). `FLT_EPSILON` is this gap around 1.0 only: the precision is constant in proportion, but the absolute error grows. Far from the origin, a 1 cm triangle becomes zero or 1 m wide. The fix is a local origin in `double`, subtracted **before** the conversion to `float`; the origin is chosen by power-of-two steps (2ᵏ × integer), exact, reproducible and shared by neighbors. |
| **Pitfalls to avoid** | Converting before subtracting; forgetting or rounding the origin; mixing two frames with different origins; a shared vertex stored with two origins; the object's translation recomposed in `float`; `==` and `FLT_EPSILON` as a universal tolerance; a step that is too large; adding small terms to a large total. |
| **Best practices** | World in `double`, offsets in `float`; subtraction in `double` then conversion; origin by 2ᵏ steps with k chosen from the tolerance; origin stored with the object; difference of origins in `double` between objects; comparison margin proportional to the value; `nextafterf` to measure the real gap. |
