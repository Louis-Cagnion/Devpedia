---
order: 13
---

# Sort and sweep (sweep and prune): only compare plausible neighbors

A **segment** is the part of a straight line lying between two points of the plane, called its **endpoints** (or its ends). A **plane** is a flat surface where each point is located by two numbers, its **coordinates**: `x` (the horizontal position) and `y` (the vertical position). Two segments **cross** when they share at least one point. Knowing which ones cross is a common need: the sides of a polygon (a closed figure made of segments joined end to end, whose segments are also called **edges**) must not cut across one another, two vehicle trajectories must not intersect, two roads on a map may meet at a junction.

The obvious method compares all the segments two by two, and becomes unusable as soon as their number grows. The **sort and sweep** technique (also called *sweep and prune*, meaning "sweep and trim") avoids the vast majority of these comparisons: it sorts the segments, then compares only those whose **bounding boxes** (rectangles that surround them, defined below) overlap. This chapter builds the technique step by step, proves it, measures it, and shows the case where it is of no use.

It assumes you already know [Big-O notation and complexity](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o), [comparison sorting](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison), [vectors](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) (a list of numbers treated as a single entity, for example the two coordinates of a point), and, for programs in C, [variables](/?c=langages&s=c&p=variables), [structures](/?c=langages&s=c&p=variables#structures-struct), [pointers](/?c=langages&s=c&p=pointeurs) and [memory management](/?c=langages&s=c&p=memoire). All programs were compiled with `gcc` (the GNU project compiler, see [the compilation process](/?c=langages&s=c&p=compilation)) and run; the outputs shown are the real outputs.

## The problem: testing every pair

For `n` segments, the naive version tests each **pair** (two distinct segments, the order not mattering: the pair A-B is the same as B-A). Each of the `n` segments has `n - 1` partners, but each pair would then be counted twice, hence `n × (n - 1) / 2` pairs. The cost is therefore in `O(n²)` ("n squared": multiplying `n` by 10 multiplies the work by 100, see [complexity](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)).

| Number of segments `n` | Number of pairs `n(n-1)/2` | Compared with the previous row |
|---|---|---|
| 100 | 4,950 | : |
| 1,000 | 499,500 | about 100 times more |
| 10,000 | 49,995,000 | about 100 times more |
| 100,000 | 4,999,950,000 | about 100 times more |

Five billion tests for 100,000 segments, and if only a few segments really cross, nearly all of this work is wasted. The idea of the technique is to discard, at little cost, the pairs that cannot possibly cross, and to pay for the exact test only for the others.

## The exact test: do two segments cross?

Before avoiding it, we need to know it: it is the "costly test" whose number of calls the technique tries to reduce. It rests on a simple operation, the cross product in two dimensions.

A **vector** goes from one point to another: the one from `o` to `p` has components `(p.x - o.x, p.y - o.y)`. The **cross product** of two vectors `u = (ux, uy)` and `v = (vx, vy)` of the plane is the number `ux × vy - uy × vx`. Its sign says on which side `v` turns with respect to `u`. For three points `o`, `p`, `q`, it is called the **orientation** of the triple: it is the cross product of the vector from `o` to `p` and the vector from `o` to `q`.

| Sign of the cross product | Position of `q` when going from `o` to `p` | Example with `o = (0, 0)`, `p = (4, 0)` |
|---|---|---|
| Positive | On the left (left turn) | `q = (2, 3)`: `4 × 3 - 0 × 2 = 12` |
| Negative | On the right (right turn) | `q = (2, -3)`: `4 × (-3) - 0 × 2 = -12` |
| Zero | On the same line as `o` and `p` (the three points are **collinear**, also called **aligned**) | `q = (8, 0)`: `4 × 0 - 0 × 8 = 0` |

> **Note:** "left" and "right" assume a `y` axis that points up. On a screen, `y` points down and the sides swap, which makes no difference here: the test only compares signs with one another.

The reasoning behind the test: segment `s` (from `s.a` to `s.b`) and segment `t` (from `t.a` to `t.b`) cross properly when the two ends of `t` lie on either side of the line of `s` (orientations of opposite signs) **and** the two ends of `s` lie on either side of the line of `t`.

```text
            t.a      orientation(s.a, s.b, t.a) = +1  (left of s)
              \
  s.a ---------\---------> s.b
                \
                 t.b     orientation(s.a, s.b, t.b) = -1  (right of s)
```

This is not enough when an orientation is 0 (an end lying exactly on the line of the other segment): we must decide what counts as a "crossing". **Decision of this chapter: two segments cross if they have at least one point in common**, which includes a proper crossing, contact at an end, and the overlap of two collinear segments. An end collinear with the other segment counts only if it really lies **between** its endpoints.

| Situation | Orientations | Verdict |
|---|---|---|
| Proper crossing (X shape) | Opposite signs on both sides | Crossing |
| One end of `t` resting in the middle of `s` | One orientation at 0, end between `s.a` and `s.b` | Crossing |
| Two ends touching | One orientation at 0, end between the endpoints | Crossing |
| Collinear, overlapping | All at 0, one end inside the other segment | Crossing |
| Collinear, separated | All at 0, no end inside the other segment | Disjoint (no point in common) |
| Parallel | Same signs | Disjoint |
| Lines cross, segments too short | The ends of `t` enclose `s`, but not the reverse | Disjoint |
| Segment reduced to a point | Orientations always at 0 | Crossing if the point is on the other segment |

The corresponding code. The C elements used:

| Element | Role |
|---|---|
| `typedef struct { ... } Point;` | Creates a type `Point` that groups several fields under one name (see [structures](/?c=langages&s=c&p=variables#structures-struct)) |
| `long long` | Signed integer of at least 64 bits: the products of coordinates do not overflow (see [integers and overflow](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)) |
| `static` | The function is visible only in this file |
| `const Segment *s` | Pointer to a segment that we promise not to modify; `s->a` reads its field `a` (see [pointers](/?c=langages&s=c&p=pointeurs)) |
| `(product > 0) - (product < 0)` | A comparison is 1 if it is true and 0 otherwise: the difference gives 1, -1 or 0, the sign of the number |
| `condition ? a : b` | Is `a` if the condition is true, `b` otherwise |

```c
#include <stdio.h>

typedef struct {
    long long x, y;                         // the two coordinates of a point
} Point;

typedef struct {
    Point a, b;                             // the two endpoints of the segment
} Segment;

static long long minimum(long long u, long long v)
{
    return u < v ? u : v;                   // the smaller of the two
}

static long long maximum(long long u, long long v)
{
    return u > v ? u : v;                   // the larger of the two
}

// Sign of the cross product of (o to p) and (o to q): 1, -1 or 0.
static int orientation(Point o, Point p, Point q)
{
    long long to_p_x = p.x - o.x;           // x component of the vector from o to p
    long long to_p_y = p.y - o.y;           // y component of the vector from o to p
    long long to_q_x = q.x - o.x;           // x component of the vector from o to q
    long long to_q_y = q.y - o.y;           // y component of the vector from o to q
    long long product = to_p_x * to_q_y - to_p_y * to_q_x;   // the cross product

    return (product > 0) - (product < 0);   // 1 if positive, -1 if negative, 0 if zero
}

// True if p, already known to be collinear with a and b, lies between them.
static int between(Point a, Point b, Point p)
{
    return minimum(a.x, b.x) <= p.x && p.x <= maximum(a.x, b.x)   // within the x range
        && minimum(a.y, b.y) <= p.y && p.y <= maximum(a.y, b.y);   // and within the y range
}

// True if the two segments have at least one point in common.
static int segments_cross(const Segment *s, const Segment *t)
{
    int o1 = orientation(s->a, s->b, t->a);   // which side of (s) the end a of t is on
    int o2 = orientation(s->a, s->b, t->b);   // which side of (s) the end b of t is on
    int o3 = orientation(t->a, t->b, s->a);   // which side of (t) the end a of s is on
    int o4 = orientation(t->a, t->b, s->b);   // which side of (t) the end b of s is on

    if (o1 != o2 && o3 != o4)               // each segment separates the ends of the other
        return 1;                           // proper crossing, or contact at an end
    if (o1 == 0 && between(s->a, s->b, t->a)) // the end a of t lies on s
        return 1;
    if (o2 == 0 && between(s->a, s->b, t->b)) // the end b of t lies on s
        return 1;
    if (o3 == 0 && between(t->a, t->b, s->a)) // the end a of s lies on t
        return 1;
    if (o4 == 0 && between(t->a, t->b, s->b)) // the end b of s lies on t
        return 1;
    return 0;                               // no point in common
}
```

A test `main` (to be placed after it) goes through the situations of the table:

```c
typedef struct {
    const char *name;                       // description of the case, for display
    Segment s, t;                           // the two segments to compare
} Case;

int main(void)
{
    Case cases[] = {                        // one case per situation to tell apart
        {"X shape", {{0, 0}, {4, 4}}, {{0, 4}, {4, 0}}},
        {"end resting on the other", {{0, 0}, {4, 0}}, {{2, 0}, {2, 3}}},
        {"two ends touching", {{0, 0}, {2, 2}}, {{2, 2}, {5, 0}}},
        {"collinear, overlapping", {{0, 0}, {4, 0}}, {{3, 0}, {7, 0}}},
        {"collinear, separated", {{0, 0}, {2, 0}}, {{3, 0}, {7, 0}}},
        {"parallel", {{0, 0}, {4, 0}}, {{0, 1}, {4, 1}}},
        {"lines cross, segments do not", {{0, 0}, {2, 0}}, {{3, -1}, {3, 5}}},
        {"a point on a segment", {{1, 1}, {1, 1}}, {{0, 0}, {2, 2}}},
        {"a point off the segment", {{1, 2}, {1, 2}}, {{0, 0}, {2, 2}}},
    };

    for (size_t i = 0; i < sizeof cases / sizeof cases[0]; i++)   // goes through the cases
        printf("%-12s %s\n",                // result in 12 columns, then the name of the case
               segments_cross(&cases[i].s, &cases[i].t) ? "crossing" : "disjoint",
               cases[i].name);
    return 0;
}
```

```text
crossing     X shape
crossing     end resting on the other
crossing     two ends touching
crossing     collinear, overlapping
disjoint     collinear, separated
disjoint     parallel
disjoint     lines cross, segments do not
crossing     a point on a segment
disjoint     a point off the segment
```

The nine cases give the verdict announced by the table. This test has a non-negligible cost: four orientation computations (seven arithmetic operations each), then comparisons. This is what we want to call as rarely as possible.

## The bounding box: a cheap test

An **axis-aligned bounding box** (abbreviated **AABB**) is the smallest rectangle, with sides parallel to the `x` and `y` axes, that fully contains a shape. For a segment, four numbers are enough: `xmin` and `xmax` (the smallest and the largest `x` of its two ends), `ymin` and `ymax` (the same for `y`). Each of the two intervals `[xmin, xmax]` and `[ymin, ymax]` is the **projection** of the segment onto an axis, that is, its shadow on that axis.

```text
  y
  ^
  |  ymax  +-------------B
  |        |         .   |
  |        |      .      |
  |        |   .         |
  |  ymin  A-------------+
  |        |             |
  +--------+-------------+----------> x
         xmin          xmax
```

If two segments have a point in common, that point belongs to both boxes: **the two boxes overlap**. Put differently: if two boxes are **disjoint** (with no point in common), the segments cannot cross, so there is no need for the exact test. The reverse is false: two boxes can overlap without the segments touching, and then the exact test decides.

```text
 Overlap on x only                    Overlap on x and on y
 (no crossing possible)               (the exact test decides)

      +--------+                       +--------+
      |   S    |                       |   S    |
      |        |                       |     +--+-----+
      +--------+                       +-----+--+     |
   +--------+                                |   T    |
   |   T    |                                +--------+
   +--------+
```

Two boxes overlap if and only if their intervals overlap **on each axis**. Two closed intervals (endpoints included) `[min1, max1]` and `[min2, max2]` have a point in common exactly when each starts before the other ends: `min1 <= max2` and `min2 <= max1`.

| Interval 1 | Interval 2 | `min1 <= max2` | `min2 <= max1` | Overlap |
|---|---|---|---|---|
| `[1, 4]` | `[3, 6]` | yes (1 <= 6) | yes (3 <= 4) | Yes |
| `[1, 4]` | `[4, 7]` | yes (1 <= 7) | yes (4 <= 4) | Yes: they touch at 4 |
| `[1, 4]` | `[5, 7]` | yes (1 <= 7) | no (5 <= 4 is false) | No |

The box test costs at most four comparisons (two per axis), against some thirty operations for the exact test. Boxes are computed only once per segment.

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    long long xmin, xmax;                   // bounds of the box on the x axis
    long long ymin, ymax;                   // bounds of the box on the y axis
} Box;

// Computes the axis-aligned bounding box of a segment.
static Box box_of(const Segment *s)
{
    Box b;                                  // the box to fill in

    b.xmin = minimum(s->a.x, s->b.x);       // the leftmost x of the two ends
    b.xmax = maximum(s->a.x, s->b.x);       // the rightmost x
    b.ymin = minimum(s->a.y, s->b.y);       // the lowest y
    b.ymax = maximum(s->a.y, s->b.y);       // the highest y
    return b;
}

// True if the closed intervals [min1, max1] and [min2, max2] have a point in common.
static int overlap(long long min1, long long max1, long long min2, long long max2)
{
    return min1 <= max2 && min2 <= max1;    // each starts before the other ends
}

// A segment, its original number and its box (computed only once).
typedef struct {
    int id;                                 // position in the starting array
    Segment seg;                            // the segment itself
    Box box;                                // its bounding box
} Item;
```

Vertical, horizontal, or single-point segments (`xmin == xmax`) have nothing special: their box is a flattened rectangle, or even a point, and the test on closed intervals works as it is.

But testing the box of every pair is still an `O(n²)` job: five billion box comparisons for 100,000 segments. Sorting avoids even that.

## Sorting, then sweeping

The idea: if the segments are arranged by increasing `xmin`, the candidates for a segment are its immediate neighbors in that arrangement, and we stop as soon as the next one starts too far to the right.

| Step | Action | Why |
|---|---|---|
| 1 | Copy the segments with their box and their number | Keep the original array intact |
| 2 | Sort the copy by increasing `xmin` | The candidates of a segment become contiguous |
| 3 | For each segment `i`, go through the following ones `j = i + 1, i + 2...` **as long as** `xmin[j] <= xmax[i]` | Beyond that, no overlap on `x` is possible: we stop |
| 4 | For each `j` visited, test the overlap on `y` | Cheap test |
| 5 | Only if the `y` ranges overlap, call the exact test | The costly test is paid only for plausible pairs |

The **sweep** is the name of step 3: imagine a vertical line that advances from left to right along the `x` axis, and at each segment it meets we look at those it still reaches. The **sort** comes from step 2: without it, we would have to scan the whole array to know which segments are within range.

The code blocks of this chapter add up to one another in a single file (remove the test `main` of the previous section before continuing). The first one stores the results: a crossing `(i, j)` becomes a **key**, a single 64-bit integer (`i` in the high half of the 64 bits, `j` in the low half), and an array that grows as needed ([`realloc`](/?c=langages&s=c&p=memoire#resizing-a-block-realloc)) keeps them. The type `Counters` measures the work: `visited` counts the pairs the loop examines, `exact_tests` the calls to the costly test.

| Element | Role |
|---|---|
| `size_t` | Unsigned integer (no negative values) made for sizes and numbers of elements |
| `realloc(old, size)` | Enlarges a block of memory, or returns a new one that holds the same data |
| `perror("text")` | Prints the text followed by the description of the last system error |
| `exit(1)` | Stops the program with code 1, which signals a failure (see [exit and return codes](/?c=langages&s=c&p=exit-et-codes-de-retour)) |
| `<<` and `\|` | Left bit shift and bitwise OR, to store two numbers in a single integer (see [bitwise operators](/?c=langages&s=c&p=operateurs-binaires)) |
| `for (; j < n && ...; j++)` | A `for` loop whose first part is empty: `j` already exists |
| `continue` | Goes directly to the next pass of the loop |
| `%c` | `printf` code to print a character; `'A' + 2` is the character `C` |

```c
typedef struct {
    long long visited;                      // pairs examined by the inner loop
    long long exact_tests;                  // calls to segments_cross
} Counters;

typedef struct {
    unsigned long long *keys;               // one key per crossing found
    size_t count, capacity;                 // number of keys stored, free slots available
} Results;

// Stores the crossing (i, j) as a single number, the smaller index first.
static void record(Results *r, int i, int j)
{
    int small = i < j ? i : j;              // the smaller of the two indices
    int large = i < j ? j : i;              // the larger

    if (r->count == r->capacity) {          // array full: we enlarge it
        size_t new_cap = r->capacity ? 2 * r->capacity : 1024;   // we double it
        unsigned long long *p = realloc(r->keys, new_cap * sizeof *p);

        if (p == NULL) {                    // out of memory: we give up
            perror("realloc");
            exit(1);
        }
        r->keys = p;
        r->capacity = new_cap;
    }
    r->keys[r->count++] = ((unsigned long long)small << 32) | (unsigned)large;   // small:large
}
```

The second block is the heart of the technique. It uses `qsort`, the sorting function of the C standard library (see [`qsort` and stability](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#qsort-promises-nothing); reference: [`qsort`](https://en.cppreference.com/w/c/algorithm/qsort)): it receives the array, the number of elements, the size of one element and a **comparison function** (a [function pointer](/?c=langages&s=c&p=pointeurs)) that returns a negative, zero or positive number. The functions `malloc` (reserve memory), `memcpy` (copy bytes) and `free` (give it back) are explained in [memory management](/?c=langages&s=c&p=memoire). The parameter `verbose` prints the steps in the example that follows; it will be 0 for the measurements.

```c
// Compares two items by increasing xmin (without subtraction, which could overflow).
static int compare_xmin(const void *p, const void *q)
{
    const Item *e = p;                      // the first item compared
    const Item *f = q;                      // the second

    return (e->box.xmin > f->box.xmin) - (e->box.xmin < f->box.xmin);
}

// The sweep: assumes the array is already sorted by increasing xmin.
static void sweep(const Item *sorted, int n, Counters *c, Results *res, int verbose)
{
    for (int i = 0; i < n; i++) {           // each segment, from left to right
        const Item *e = &sorted[i];         // the segment whose neighbors we look for
        int j = i + 1;                      // first candidate: the next one in order

        for (; j < n && sorted[j].box.xmin <= e->box.xmax; j++) {   // still in range on x
            const Item *f = &sorted[j];     // the candidate
            c->visited++;                   // one more pair examined
            if (!overlap(e->box.ymin, e->box.ymax, f->box.ymin, f->box.ymax)) {
                if (verbose)
                    printf("  %c-%c : y disjoint, discarded\n", 'A' + e->id, 'A' + f->id);
                continue;                   // no overlap on y: pair eliminated
            }
            c->exact_tests++;               // the only case where we pay for the exact test
            int yes = segments_cross(&e->seg, &f->seg);   // the exact verdict
            if (yes)
                record(res, e->id, f->id);
            if (verbose)
                printf("  %c-%c : exact test, %s\n", 'A' + e->id, 'A' + f->id,
                       yes ? "crossing" : "no crossing");
        }
        if (verbose && j < n)               // we stopped before the end of the array
            printf("  %c-%c : xmin %lld > xmax %lld, stopping\n", 'A' + e->id,
                   'A' + sorted[j].id, sorted[j].box.xmin, e->box.xmax);
    }
}

// Sorted version: sorts a copy (the original keeps its order), then sweeps.
static void sorted_method(const Item *e, int n, Counters *c, Results *res, int verbose)
{
    Item *copy = malloc((size_t)n * sizeof *copy);   // the copy we are going to sort

    if (copy == NULL) {                     // out of memory: we give up
        perror("malloc");
        exit(1);
    }
    memcpy(copy, e, (size_t)n * sizeof *copy);   // copies the items
    qsort(copy, (size_t)n, sizeof *copy, compare_xmin);   // sort by increasing xmin
    sweep(copy, n, c, res, verbose);        // then the sweep
    free(copy);                             // the copy is no longer needed
}
```

### Step by step on six segments

Six segments `A` to `F`, with integer coordinates. Their bounding boxes:

| Segment | Endpoints | `[xmin, xmax]` | `[ymin, ymax]` |
|---|---|---|---|
| A | (1, 1) and (4, 4) | [1, 4] | [1, 4] |
| B | (2, 4) and (5, 1) | [2, 5] | [1, 4] |
| C | (3, 4) and (6, 7) | [3, 6] | [4, 7] |
| D | (6, 7) and (9, 4) | [6, 9] | [4, 7] |
| E | (7, 3) and (9, 7) | [7, 9] | [3, 7] |
| F | (8, 0) and (11, 1) | [8, 11] | [0, 1] |

The points of the drawing are the grid nodes crossed by each segment; `X` marks a point common to two segments (`A` and `B` at (3, 3), `C` and `D` at (6, 7), `D` and `E` at (8, 5)).

```text
   y
   8 .  .  .  .  .  .  .  .  .  .  .  .
   7 .  .  .  .  .  .  X  .  .  E  .  .
   6 .  .  .  .  .  C  .  D  .  .  .  .
   5 .  .  .  .  C  .  .  .  X  .  .  .
   4 .  .  B  C  A  .  .  .  .  D  .  .
   3 .  .  .  X  .  .  .  E  .  .  .  .
   2 .  .  A  .  B  .  .  .  .  .  .  .
   1 .  A  .  .  .  B  .  .  .  .  .  F
   0 .  .  .  .  .  .  .  .  F  .  .  .
     0  1  2  3  4  5  6  7  8  9  10 11  x
```

After sorting, the order is already `A, B, C, D, E, F` (by `xmin`: 1, 2, 3, 6, 7, 8). The intervals on `x` show what "within range" means: segment `A` has as candidates only those whose interval starts before its own ends.

```text
      0  1  2  3  4  5  6  7  8  9  10 11  x
   A     [========]
   B        [========]
   C           [========]
   D                    [========]
   E                       [=====]
   F                          [========]
```

For `A` (`xmax = 4`): `B` starts at 2, `C` at 3, but `D` at 6: 6 is greater than 4, we stop, and `E` and `F` are not even looked at (the array being sorted, they start even further away). Here is the program that replays the sweep, with the segments given in disorder so that the sort is useful:

```c
int main(void)
{
    Segment seg[6] = {                      // the six segments, A to F, out of order
        {{6, 7}, {9, 4}},                   // D
        {{1, 1}, {4, 4}},                   // A
        {{8, 0}, {11, 1}},                  // F
        {{3, 4}, {6, 7}},                   // C
        {{2, 4}, {5, 1}},                   // B
        {{7, 3}, {9, 7}},                   // E
    };
    int names[6] = {3, 0, 5, 2, 1, 4};      // letter number of each segment (A = 0)
    Item e[6];                              // the items to sweep
    Counters c = {0, 0};                    // counters at zero
    Results res = {NULL, 0, 0};             // no crossing found yet

    for (int i = 0; i < 6; i++) {           // prepares each item
        e[i].id = names[i];                 // its letter number
        e[i].seg = seg[i];                  // its segment
        e[i].box = box_of(&seg[i]);         // its bounding box
    }
    sorted_method(e, 6, &c, &res, 1);       // verbose sweep
    printf("pairs visited: %lld, exact tests: %lld, crossings: %zu\n",
           c.visited, c.exact_tests, res.count);
    free(res.keys);                         // frees the results
    return 0;
}
```

```text
  A-B : exact test, crossing
  A-C : exact test, no crossing
  A-D : xmin 6 > xmax 4, stopping
  B-C : exact test, no crossing
  B-D : xmin 6 > xmax 5, stopping
  C-D : exact test, crossing
  C-E : xmin 7 > xmax 6, stopping
  D-E : exact test, crossing
  D-F : y disjoint, discarded
  E-F : y disjoint, discarded
pairs visited: 7, exact tests: 5, crossings: 3
```

| Segment swept | Candidates visited | Stop | Exact tests | Remark |
|---|---|---|---|---|
| A (`xmax = 4`) | B, C | `D` starts at 6 | 2 | `A`-`C`: boxes touching at `y = 4`, the exact test says no |
| B (`xmax = 5`) | C | `D` starts at 6 | 1 | Same case: boxes overlap, segments disjoint |
| C (`xmax = 6`) | D | `E` starts at 7 | 1 | `D` starts **exactly** at 6: kept thanks to `<=`, and they touch at (6, 7) |
| D (`xmax = 9`) | E, F | end of the array | 1 | `F` discarded by the `y` ranges ([0, 1] against [4, 7]) |
| E (`xmax = 9`) | F | end of the array | 0 | `F` discarded by the `y` ranges |
| F | none | end of the array | 0 | : |

Total: 15 possible pairs, 7 examined, 5 exact tests, 3 crossings found. The case of `C` and `D` shows why the test is `<=` and not `<`: with `<`, the pair `C`-`D` is never examined and the program finds only 2 (6 pairs visited, 4 exact tests, measured by replacing the single character).

### Why no crossing is missed

A technique that eliminates pairs must prove that it never eliminates a pair that crosses. Let `s` and `t` be two crossing segments, with `s` placed before `t` in the sorted array (indices `i < j`).

1. They have a point in common, which belongs to both their boxes: their intervals overlap on `x` **and** on `y`. The test on `y` therefore does not discard them.
2. The sort gives `xmin[i] <= xmin[j]`. The overlap on `x` requires `xmin[j] <= xmax[i]` ("each starts before the other ends"), which is exactly the continuation condition of the loop.
3. The loop over `i` advances `j` from `i + 1` and stops only at the first `j` that violates the condition. For any `k` further on, `xmin[k] >= xmin[j] > xmax[i]` (sorted array): no segment after the stop can overlap `i` on `x`. Nothing plausible is skipped.
4. The pair `(i, j)` is therefore visited, passes the test on `y`, and the exact test declares it crossing.

By construction, `j` starts at `i + 1`: a pair is examined only once, and never a segment with itself.

## The cost

| Step | Cost | Explanation |
|---|---|---|
| Copy and computing the boxes | `O(n)` | One pass |
| Sorting by `xmin` | `O(n log n)` | Comparison sort, see [comparison sorting](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) |
| Sweep | `O(n + p)` | `n` turns of the outer loop, plus one visit per pair whose intervals on `x` overlap (their number is `p`), plus one stop test per segment |
| Exact tests | at most `p` | Only the pairs whose boxes also overlap on `y` pass |

Altogether: `O(n log n + p)`. Everything depends on `p`. The measurement below compares, for 1,000, 10,000 and 100,000 small random segments, the number of exact tests of the naive version and of the sorted version. The data come from a **pseudo-random generator** (a formula that produces a sequence of numbers that look random, but are entirely determined by a starting number, the **seed**; see [randomness and generators](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#a-prng-is-a-deterministic-sequence)): with the same seed, each run produces the same segments. It is the **xorshift64** of the chapter [sort stability and reproducible noise](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#reproducible-noise-xorshift), whose formula is reused (`<<` and `>>` shift the bits, `^=` is an "exclusive or": see [bitwise operators](/?c=langages&s=c&p=operateurs-binaires)). Each segment starts at a point drawn at random in a square of side 100,000, and its second end is shifted by -1,000 to +1,000 on each axis.

| Element | Role |
|---|---|
| `enum { WORLD = 100000, REACH = 1000 };` | Gives a name to integer constants |
| `unsigned long long` and `0x9E3779B97F4A7C15ull` | 64-bit unsigned integer; constant written in hexadecimal (base 16, hence the prefix `0x`), the suffix `ull` specifying its type. Multiplying the seed by this constant avoids a seed that is too simple |
| `x % bound` | Remainder of the division: brings a large number back between 0 and `bound - 1` (the slight bias of this method is explained in [the modulo bias](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#the-modulo-bias), with no effect here) |
| `memcmp(a, b, size)` | Compares two memory areas byte by byte, returns 0 if they are identical |
| `%zu`, `%lld` | `printf` codes for a `size_t` (unsigned integer made for sizes and numbers of elements) and a `long long` |

The first block contains the naive version, the transposition of the axes (explained below, in "The worst case"), the generator and the making of the segments.

```c
// Naive version: tests the n(n-1)/2 pairs with the exact test.
static void naive_method(const Item *e, int n, Counters *c, Results *res)
{
    for (int i = 0; i < n; i++) {           // first segment of the pair
        for (int j = i + 1; j < n; j++) {   // second segment, always after the first
            c->visited++;                   // one more pair examined
            c->exact_tests++;               // and one more exact test
            if (segments_cross(&e[i].seg, &e[j].seg))
                record(res, e[i].id, e[j].id);
        }
    }
}

static void swap(long long *u, long long *v)
{
    long long saved = *u;                   // sets u aside
    *u = *v;                                // u takes the value of v
    *v = saved;                             // v takes the old value of u
}

// Swaps x and y everywhere: sweeping "on x" then amounts to sweeping the original on y.
static void transpose(Item *e, int n)
{
    for (int i = 0; i < n; i++) {           // each segment
        swap(&e[i].seg.a.x, &e[i].seg.a.y);   // transposes the first end
        swap(&e[i].seg.b.x, &e[i].seg.b.y);   // transposes the second end
        e[i].box = box_of(&e[i].seg);       // recomputes the box with the axes swapped
    }
}

enum { WORLD = 100000, REACH = 1000 };     // side of the world, maximum shift of an end

// One step of xorshift64, the generator of the chapter on sort stability.
static unsigned long long xorshift64(unsigned long long *state)
{
    unsigned long long x = *state;          // the current state of the generator

    x ^= x << 13;                           // mixes the bits by a shift and an XOR
    x ^= x >> 7;                            // second mix
    x ^= x << 17;                           // third mix
    return *state = x;                      // stores the new state and returns it
}

// Draws an integer from 0 included to bound excluded (modulo bias negligible here).
static long long draw(unsigned long long *state, long long bound)
{
    return (long long)(xorshift64(state) % (unsigned long long)bound);
}

// Fills e with n small random segments, in a square of side WORLD.
static void random_segments(Item *e, int n, unsigned long long *state)
{
    for (int i = 0; i < n; i++) {           // one segment per turn
        long long x = draw(state, WORLD);   // abscissa of the first end
        long long y = draw(state, WORLD);   // ordinate of the first end
        long long dx = draw(state, 2 * REACH + 1) - REACH;   // shift on x
        long long dy = draw(state, 2 * REACH + 1) - REACH;   // shift on y

        e[i].id = i;                        // its original number
        e[i].seg = (Segment){{x, y}, {x + dx, y + dy}};   // the second end is very close
        e[i].box = box_of(&e[i].seg);       // its bounding box
    }
}
```

The second block checks that the two methods find **the same set** of crossings (we sort the keys of both lists, then compare them byte by byte), and runs the measurement. For 100,000 segments, the naive version would make 4,999,950,000 tests: it did not finish in 20 seconds during the trial, even without the compiler's checks. The program therefore does not run the naive method at that size: the number of naive tests displayed is the formula `n(n-1)/2` (the naive loop makes exactly that many), and the result is checked against a second sweep, done on the `y` axis by swapping the two axes with `transpose`.

```c
// Compares two keys for increasing order.
static int compare_keys(const void *p, const void *q)
{
    unsigned long long u = *(const unsigned long long *)p;   // first key
    unsigned long long v = *(const unsigned long long *)q;   // second key

    return (u > v) - (u < v);
}

// True if the two lists of crossings contain exactly the same pairs.
static int same_crossings(Results *r1, Results *r2)
{
    if (r1->count != r2->count)             // not the same number: necessarily different
        return 0;
    qsort(r1->keys, r1->count, sizeof *r1->keys, compare_keys);   // sorts the first list
    qsort(r2->keys, r2->count, sizeof *r2->keys, compare_keys);   // and the second
    return memcmp(r1->keys, r2->keys, r1->count * sizeof *r1->keys) == 0;   // byte by byte
}

int main(void)
{
    int sizes[3] = {1000, 10000, 100000};   // the three sizes to compare

    printf("%7s %14s %14s %12s %12s  %s\n", "n", "naive: tests", "sorted: pairs",
           "sorted: tests", "crossings", "checked against");
    for (int k = 0; k < 3; k++) {           // one line of results per size
        int n = sizes[k];                   // number of segments on this line
        unsigned long long seed = 0x9E3779B97F4A7C15ull * 42;   // fixed seed
        Item *e = malloc((size_t)n * sizeof *e);   // the starting segments
        Item *other = malloc((size_t)n * sizeof *other);   // copy for the other method
        Counters cn = {0, 0}, ct = {0, 0}, ca = {0, 0};   // naive, sorted on x, check
        Results rt = {NULL, 0, 0}, rv = {NULL, 0, 0};    // results: sorted, check
        const char *against = n <= 10000 ? "naive" : "sweep on y";   // the reference

        if (e == NULL || other == NULL)
            return 1;
        random_segments(e, n, &seed);       // generates the segments
        sorted_method(e, n, &ct, &rt, 0);   // sort then sweep on x
        if (n <= 10000) {                   // small enough to test everything
            naive_method(e, n, &cn, &rv);   // all the pairs
        } else {                            // too long to run here
            memcpy(other, e, (size_t)n * sizeof *other);   // copies the segments
            transpose(other, n);            // swaps the axes
            sorted_method(other, n, &ca, &rv, 0);   // sweep on y
            cn.exact_tests = (long long)n * (n - 1) / 2;   // what the naive would do
        }
        int same = same_crossings(&rt, &rv);   // do the two methods agree?

        printf("%7d %14lld %14lld %12lld %12zu  %s%s\n", n, cn.exact_tests, ct.visited,
               ct.exact_tests, rt.count, same ? "" : "DIFFERENT ", against);
        free(rt.keys);                      // frees the sorted result
        free(rv.keys);                      // frees the check result
        free(other);                        // frees the copy
        free(e);                            // frees the segments
    }
    return 0;
}
```

```text
      n   naive: tests  sorted: pairs sorted: tests    crossings  checked against
   1000         499500           5002           45           16  naive
  10000       49995000         494868         4984         1800  naive
 100000     4999950000       49743253       499117       184665  sweep on y
```

| `n` | Exact tests of the naive method | Pairs visited (sort + sweep) | Exact tests (sort + sweep) | Reduction in exact tests |
|---|---|---|---|---|
| 1,000 | 499,500 | 5,002 | 45 | about 11,000 times fewer |
| 10,000 | 49,995,000 | 494,868 | 4,984 | about 10,000 times fewer |
| 100,000 | 4,999,950,000 | 49,743,253 | 499,117 | about 10,000 times fewer |

Two lessons. First, the gain is enormous: at 100,000 segments, from five billion exact tests we go down to fewer than half a million, and the crossings found are the same. Then, and this is the point not to miss: the number of pairs visited **keeps growing like `n²`** (it is multiplied by 99, then by 100, each time `n` is multiplied by 10). The technique does not change the shape of the curve here, it divides its height by about 100, because in this world of side 100,000 a segment overlaps on `x` only 1% of the others. The gain therefore depends on the **distribution** of the segments: `p` here is about 1% of `n(n-1)/2`.

### The worst case: everything overlaps on x

If all the segments are long and overlap on `x`, each segment overlaps all the others on `x`: `p = n(n-1)/2`, and the sweep falls back to `O(n²)`. The measurement below builds `n` long, almost horizontal segments (from `x` close to 0 to `x` close to 100,000), stacked by 4 on `y`, so without any crossing. It counts the pairs visited by a sweep on `x`, then by a sweep on `y` after `transpose` (the blocks above stay in the file, only the `main` of the measurement is replaced by this one; the compiler then reports `static` functions that are not used, without consequence).

```c
// n long, almost horizontal segments, all overlapping on x, stacked by 4 on y.
static void segments_in_bands(Item *e, int n, unsigned long long *state)
{
    for (int i = 0; i < n; i++) {           // one segment per floor
        long long left = draw(state, 100);  // start near the left edge (0 to 99)
        long long right = WORLD - draw(state, 100);   // end near the right edge
        long long level = 4 * (long long)i; // height of the floor, 4 more each time
        long long slope = draw(state, 3);   // rise from 0 to 2: stays in its floor

        e[i].id = i;                        // its original number
        e[i].seg = (Segment){{left, level}, {right, level + slope}};   // very long
        e[i].box = box_of(&e[i].seg);       // its bounding box
    }
}

int main(void)
{
    int sizes[4] = {1000, 2000, 4000, 8000};   // we double n on each line

    printf("%6s %16s %14s %14s\n", "n", "sweep on x", "sweep on y", "n(n-1)/2");
    for (int k = 0; k < 4; k++) {           // one line per size
        int n = sizes[k];                   // number of segments on this line
        unsigned long long seed = 0x9E3779B97F4A7C15ull * 42;   // fixed seed
        Item *e = malloc((size_t)n * sizeof *e);   // the starting segments
        Counters cx = {0, 0}, cy = {0, 0};  // counters of the two sweeps
        Results rx = {NULL, 0, 0}, ry = {NULL, 0, 0};   // results of the two sweeps

        if (e == NULL)
            return 1;
        segments_in_bands(e, n, &seed);     // generates the bands
        sorted_method(e, n, &cx, &rx, 0);   // sweep on x: all the segments overlap
        transpose(e, n);                    // swaps the axes
        sorted_method(e, n, &cy, &ry, 0);   // sweep on y: the floors are separated
        printf("%6d %16lld %14lld %14lld\n", n, cx.visited, cy.visited,
               (long long)n * (n - 1) / 2);
        free(rx.keys);                      // frees the results (empty here)
        free(ry.keys);
        free(e);                            // frees the segments
    }
    return 0;
}
```

```text
     n       sweep on x     sweep on y       n(n-1)/2
  1000           499500              0         499500
  2000          1999000              0        1999000
  4000          7998000              0        7998000
  8000         31996000              0       31996000
```

The sweep on `x` visits **exactly** `n(n-1)/2` pairs, like the naive version: doubling `n` multiplies the work by 4, that is the `O(n²)`. The sweep on `y` visits none, because the floors are separated on this axis. The choice of the axis therefore matters as much as the technique itself. One case remains without a way out: if all the segments really cross (for example, if they all pass through the same point), the answer itself contains `n(n-1)/2` pairs, and no algorithm can produce it faster than by writing it out.

## Other uses, and finer structures

| Use | How the technique applies to it |
|---|---|
| Collisions in a game | Each object has a box; the **broad phase** eliminates distant pairs with this sweep, the **narrow phase** does the precise test on the remaining pairs. This is exactly the role of the exact test above |
| Polygon outline before triangulation | Checking that two edges do not cross before the [triangulation by *ear clipping*](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#faces-with-a-variable-number-of-vertices), which [rejects faces whose edges cross each other](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#making-ear-clipping-robust). This technique is not part of it: it is added upstream |
| Other shapes | A circle, a triangle, a rectangle also have a bounding box: only the exact test changes |
| Trajectories, roads, wiring | Any set of segments whose intersections we seek |

When the distribution of the segments is unfavorable on both axes, more elaborate structures take over: a **uniform grid** (the world cut into cells, each segment stored in the cells it touches, often with a [hash table](/?c=langages&s=c&p=tables-de-hachage) to find a cell) or a **tree** of boxes (see [binary trees](/?c=langages&s=c&p=arbres-binaires)). They go beyond the scope of this chapter.

## Pitfalls

| Pitfall | Why | Remedy |
|---|---|---|
| `<` instead of `<=` in the sweep condition | Two boxes that touch (`xmin[j] == xmax[i]`) overlap; with `<`, the pair `C`-`D` of the example is lost (2 crossings found instead of 3) | Closed intervals, `<=` everywhere |
| Equal `xmin` for several segments | Sorting does not need to be stable: if `xmin[i] == xmin[j]`, the condition `xmin[j] <= xmax[i]` is true in both orders, the pair is visited once whatever the order chosen by `qsort` (see [sort stability](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible)) | No tie-breaking is needed for correctness; add one (by number) only to make the order of the results reproducible |
| Floating-point numbers | `0.1 + 0.2` is not exactly `0.3` (see [floating-point numbers](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)): three points supposed to be aligned give a cross product close to 0 but not zero, see the test just after | Integer coordinates when possible; otherwise a tolerance, and **enlarge the boxes** by that tolerance so that the filter never rejects a pair the test would accept |
| Integer overflow | With 32-bit `int`, a product of two coordinate differences quickly exceeds 2 billion | `long long`, and coordinate differences below 2 billion (their product then fits in 64 bits) |
| Vertical, horizontal or single-point segment | No problem: the box is flattened or reduced to a point, the closed intervals remain correct | Do not write a special case |
| Pair tested twice, or segment compared with itself | Inner loop started at `0` instead of `i + 1`: each crossing is counted twice, and a segment always "crosses" itself | Start `j` at `i + 1` |
| Adjacent edges of a polygon | Two consecutive edges share an endpoint: the test declares them crossing, rightly so in the sense of the chapter | Skip the pairs `(i, i+1)` and `(last, first)` before the exact test, keeping the original number of each segment |
| Sorting the original array | Its position numbers are lost, the results no longer make sense | Sort a copy that keeps an `id` (this chapter), or sort an array of indices (the positions of the segments): fewer bytes moved, but an indirect access at each comparison; measure on your own data |
| Wrong axis | Measured above: `n(n-1)/2` pairs visited on `x`, zero on `y` | Sweep on the axis where the intervals overlap the least (empirical rule after the table) |
| Believing that sorting always makes the computation `O(n log n)` | The sweep costs `O(n + p)`, and `p` can be `n(n-1)/2` | Measure `p` (the `visited` counter) on real data |
| `qsort` comparator by subtraction | `a - b` can overflow for large integers and return a wrong sign | `(a > b) - (a < b)` |

The test on floating-point numbers: three points supposed to be aligned on the line `y = x`, whose third one is computed as `0.1 + 0.2` instead of being written `0.3`.

```c
#include <stdio.h>

int main(void)
{
    double ax = 0.1, ay = 0.1;              // first point, on the line y = x
    double bx = 0.3, by = 0.3;              // second point, on the same line
    double cx = 0.1 + 0.2, cy = 0.3;        // third point: 0.1 + 0.2 should be 0.3
    double product = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);   // cross product

    printf("%g\n", product);                // 0 expected
    return 0;
}
```

```text
-1.38778e-17
```

The result is not 0: the test would declare these three points not aligned. To choose the axis, an empirical rule (drawn from experience, not proved here) consists in computing, for each axis, the sum of the lengths of the intervals (`xmax - xmin`, then `ymax - ymin`) and sweeping on the axis where this sum is the smallest: that is where the intervals overlap the least. Another one consists in measuring `p` on each axis with a sample.

## Best practices

| Best practice | Why |
|---|---|
| Keep the exact test as it is and add only a filter in front of it | The correctness of the result depends only on the exact test and on the proof of the filter |
| Compute the box only once per segment | It is read again at each comparison |
| Use closed intervals and `<=` | Contacts are never lost |
| Prefer integer coordinates and a type wide enough | The exact test becomes exact, without tolerance |
| Count the pairs visited and the exact tests | `p` tells whether the technique brings anything on your data |
| Check the result against the naive version on small inputs | A mistake in the filter shows up as a missing crossing |
| Decide once and for all what "crossing" means (contact, overlap) | Edge cases change verdict depending on the definition |
| Generate the test data with a fixed seed | The measurements can be replayed and compared |

## Key Takeaways

| | |
|---|---|
| **Key takeaways** | Testing all the pairs of `n` segments costs `n(n-1)/2` exact tests, that is `O(n²)`. Sort and sweep sorts the segments by `xmin`, then, for each segment `i`, goes through the following ones `j` as long as `xmin[j] <= xmax[i]`, tests the overlap on `y`, and runs the exact test (orientation by cross product, contacts and overlaps included) only on the remaining pairs. No crossing pair is missed: it overlaps on `x` and on `y`, and the sort guarantees that we do not stop too early. The cost is `O(n log n + p)`, where `p` is the number of pairs whose intervals on `x` overlap. Measured: 5 billion tests for 100,000 small segments against fewer than 500,000, but `p` still grows like `n²` at constant distribution, and equals `n(n-1)/2` if everything overlaps on `x`. |
| **Pitfalls to avoid** | `<` instead of `<=`; forgetting that overlapping boxes do not guarantee a crossing (the exact test remains necessary); floating-point values that are not aligned because of rounding; 32-bit integer overflow; inner loop started before `i + 1`; adjacent edges of a polygon counted as crossings; sorting the original array and losing the numbers; sweeping on the wrong axis; believing in a guaranteed `O(n log n)`. |
| **Best practices** | Closed intervals and `<=`; box computed once; integer coordinates on `long long`; counters of pairs visited and exact tests; check against the naive version on small inputs; definition of "crossing" written down and tested on edge cases; fixed seed for the measurements; choice of the axis measured, with a grid or a tree as a fallback when no axis is suitable. |
