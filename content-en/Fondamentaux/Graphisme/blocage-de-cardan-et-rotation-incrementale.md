---
order: 11
---

# Gimbal lock and incremental rotation

An **orientation** is the way an object is turned in space, leaving its position aside: a plane nosing down, a camera looking upward, a 3D model you rotate with the mouse. To store it, the most natural idea is to keep **three angles**, one per axis: these are the **Euler angles**. This works well, up to one precise value where two of the three controls start doing the same thing: a movement becomes impossible and the view can jump. This flaw is called **gimbal lock**. A **gimbal** is a suspension made of nested rings, each one pivoting inside the next, like the one of a ship's compass or a gyroscope; the lock happens when two of these rings end up in the same plane. The calculations below reproduce this mounting with matrices ([details of the phenomenon](https://en.wikipedia.org/wiki/Gimbal_lock)).

This chapter shows the flaw through measurements, works around it by storing a matrix instead of angles, then deals with the price to pay:

| Step | Question | Section |
|---|---|---|
| 1 | What is an Euler angle, and why does the order of rotations matter? | [Euler angles](#euler-angles-three-numbers-three-axes) |
| 2 | What exactly happens at the moment of the lock? | [Gimbal lock](#gimbal-lock-when-two-axes-become-one) |
| 3 | How do you avoid it? | [Incremental rotation](#incremental-rotation-keep-the-matrix-not-the-angles) |
| 4 | What error does this matrix accumulate, and how do you clear it? | [The rounding error](#the-rounding-error-that-accumulates) then [re-orthonormalization](#re-orthonormalization-putting-the-matrix-back-straight) |
| 5 | When should you keep angles anyway? | [Variants](#variants-quaternions-and-limited-angles) |

It extends [Matrices and the camera](/?c=fondamentaux&s=graphisme&p=matrices-et-camera), which builds the rotation matrices, presents the [accumulated rotation](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#rotating-an-object-accumulated-rotation) and [Rodrigues' formula](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#rotating-around-an-arbitrary-axis-rodrigues-formula): it uses them without deriving them again. It assumes you already know [matrices and the matrix product](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel) (a table of numbers, and how to multiply two tables), [vectors, the dot product and the norm](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) (a list of numbers, the sum of their products taken two by two, and the length of the vector), and the basics of C: [variables](/?c=langages&s=c&p=variables), [conditions](/?c=langages&s=c&p=conditions) and [loops](/?c=langages&s=c&p=boucles).

All programs are compiled with `gcc -std=c99 -Wall -Wextra -o program program.c -lm` (see [compilation](/?c=langages&s=c&p=compilation): `-Wall -Wextra` ask for all warnings, `-lm` adds the math library) and run with `./program` (on Linux or macOS). The outputs reproduced in this chapter were all recorded at run time. Assembly rule: a program is made of **all the function blocks that come before it**, in order, followed by **a single block containing `main`** (the function where a C program starts). Blocks that already contain a `main` only serve themselves.

## Euler angles: three numbers, three axes

An **axis** is the straight line around which you turn, like the spindle of a spinning top. Space has three, named as in [the chapter on matrices](/?c=fondamentaux&s=graphisme&p=matrices-et-camera): **X** to the right, **Y** up, **Z** toward you, out of the screen (the camera therefore looks toward -Z). Euler angles, named after the mathematician Leonhard Euler ([details](https://en.wikipedia.org/wiki/Euler_angles)), describe an orientation by a rotation around each axis:

| Angle | Full name | Axis | The head gesture | For a plane |
|---|---|---|---|---|
| **Pitch** | Pitch angle | X | Nodding your head to say "yes" | The nose goes up or down |
| **Yaw** | Yaw angle | Y | Turning your head to say "no" | The nose turns left or right |
| **Roll** | Roll angle | Z | Tilting your head, ear toward the shoulder | The wings tilt |

```text
            Y (up)    yaw: turn around Y
            ^
            |
            |
            +---------> X (right)    pitch: turn around X
           /
          /
         v
        Z (toward you)               roll: turn around Z
```

An angle is measured in **degrees** (a full turn is 360) or in **radians** (180 degrees is π, about 3.14159 radians; [reminder](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#from-the-object-to-the-screen-model-view-projection) with the cosine and the sine). The C functions `cos` and `sin` expect radians. The positive direction is the one of the **right-hand rule**: the thumb along the axis, pointing toward you, and the fingers curling close give the direction of rotation of a positive angle.

Each rotation is a 3×3 matrix, the version without translation of those in the [previous chapter](/?c=fondamentaux&s=graphisme&p=matrices-et-camera). For such a matrix, the **column j** says where the arrow of length 1 placed on axis j goes (column 0 for X, 1 for Y, 2 for Z): that is what the product of the matrix by this arrow gives. The code blocks that follow use a few C notations:

| Notation | Meaning |
|---|---|
| `#include <math.h>` | Loads a library of functions ([headers](/?c=langages&s=c&p=headers)). `math.h` provides `cos`, `sin`, `sqrt` (square root) and `fabs` (absolute value: the number without its sign), see the [list of `<math.h>` functions](https://en.cppreference.com/w/c/numeric/math); `stdio.h` provides `printf` |
| `int`, `long` | Whole numbers (`long`: a wider range), see [variables](/?c=langages&s=c&p=variables) |
| `float`, `double` | Floating-point numbers stored on 32 and 64 bits, that is about 7 and 15 exact digits ([details](/?c=donnees&s=representation-des-donnees&p=nombres-flottants#how-a-float-is-encoded)). The functions `cos`, `sin`, `sqrt` compute in `double` |
| `1e-9`, `3.0e-08` | Scientific notation: `1e-9` is 10⁻⁹, that is 0.000000001 |
| `const` | A value that will never change |
| `float v[3]` | An array: 3 numbers stored side by side, `v[0]`, `v[1]`, `v[2]`, filled with `{1, 0, 0}` |
| `typedef struct { ... } Name;` | Groups several values under a single type name; `e.field` designates the field `field` of the value `e` |
| `m[i][j]` | The cell of row `i` and column `j` of a two-dimensional array; counting starts at 0 |
| `for (int i = 0; i < 3; i++)` | Repeats the next statement with `i` equal to 0, then 1, then 2 |
| `a % b` | The remainder of the division of `a` by `b` |
| `a += b`, `a -= b`, `a /= b` | Shortcuts for `a = a + b`, `a = a - b`, `a = a / b` |
| `a == b`, `a && b` | `==` compares two values (true if they are equal); `&&` means "and" |
| A function | A named piece of code: `Mat3 product(Mat3 a, Mat3 b)` receives two matrices and returns one (`return`) |
| `x ? a : b` | Equals `a` if the condition `x` is true, `b` otherwise |

The first block writes the rotations around an axis, the product of two matrices and the application of a matrix to a point. A single function `axis_rotation` builds the three rotations: for axis 2 (Z), it fills exactly the matrix of the table in the previous chapter.

```c
#include <math.h>      // cos, sin, sqrt, fabs...
#include <stdio.h>     // printf

// One degree, expressed in radians: π / 180
const float DEG = 0.017453292;

// A 3 x 3 matrix of float, read m[row][column]; typedef gives it a short name
typedef struct { float m[3][3]; } Mat3;

// Rotation matrix of "angle" radians around axis 0 (X), 1 (Y) or 2 (Z)
Mat3 axis_rotation(int axis, float angle)
{
    Mat3 r = {{{0}}};                       // the whole matrix starts at 0
    int i = (axis + 1) % 3;                 // the two other axes, in the order X, Y, Z
    int j = (axis + 2) % 3;                 // (% : remainder of the division: 2 + 1 gives 0)
    r.m[axis][axis] = 1;                    // the rotation axis itself does not move
    r.m[i][i] = cos(angle);                 // cos and sin compute in double;
    r.m[i][j] = -sin(angle);                // the result is stored in a float
    r.m[j][i] = sin(angle);                 // second off-diagonal cell: sine
    r.m[j][j] = cos(angle);                 // second diagonal cell: cosine
    return r;
}

// Matrix product a * b: the element (i, j) is the dot product of row i
// of a with column j of b
Mat3 product(Mat3 a, Mat3 b)
{
    Mat3 r = {{{0}}};                       // the result, filled cell by cell
    for (int i = 0; i < 3; i++)             // each row i of the result
        for (int j = 0; j < 3; j++)         // each column j of the result
            for (int k = 0; k < 3; k++)     // sum of the three row x column products
                r.m[i][j] += a.m[i][k] * b.m[k][j];  // adds one product to cell (i, j)
    return r;
}

// Image of point p by matrix a: the vector a * p, written into v (void: returns nothing)
void apply(Mat3 a, const float p[3], float v[3])
{
    for (int i = 0; i < 3; i++)             // each coordinate of the result
        // row i of a, multiplied term by term by p, then summed
        v[i] = a.m[i][0] * p[0] + a.m[i][1] * p[1] + a.m[i][2] * p[2];
}

// Sets a rounding remainder (less than 0.00005) back to 0 for a readable display;
// "x ? a : b" equals a if the condition x is true, b otherwise
float clean(float x)
{
    return fabs(x) < 0.00005 ? 0 : x;
}
```

The following program composes two 90-degree rotations in both orders. `printf("(%.0f, %.0f)\n", x, y)` prints text in which each `%` is replaced by a value given afterwards (`%.0f`: a decimal number with no decimal places), and `\n` starts a new line; `return 0` tells the system that the program ended correctly.

```c
int main(void)
{
    const float start[3] = {1, 0, 0};      // a point lying on the X axis
    float v[3];                             // the point after rotation
    // Z (axis 2) then X (axis 0): the product is written X * Z
    Mat3 z_then_x = product(axis_rotation(0, 90 * DEG), axis_rotation(2, 90 * DEG));
    // X (axis 0) then Z (axis 2): the product is written Z * X
    Mat3 x_then_z = product(axis_rotation(2, 90 * DEG), axis_rotation(0, 90 * DEG));

    apply(z_then_x, start, v);              // Z acts first (rightmost matrix)
    // the three coordinates, without rounding remainder
    printf("Z then X : (%.0f, %.0f, %.0f)\n", clean(v[0]), clean(v[1]), clean(v[2]));
    apply(x_then_z, start, v);              // X acts first
    printf("X then Z : (%.0f, %.0f, %.0f)\n", clean(v[0]), clean(v[1]), clean(v[2]));  // same
    return 0;
}
```

```text
Z then X : (0, 0, 1)
X then Z : (0, 1, 0)
```

| Order | What the point (1, 0, 0) does | Result |
|---|---|---|
| Z then X | Z sends it from the X axis to the Y axis; X then makes it pass from Y to Z | (0, 0, 1) |
| X then Z | X leaves it in place (it is on the X axis); Z then sends it toward Y | (0, 1, 0) |

**The order matters**: two rotations do not commute with each other. For three angles, you must therefore **choose one order once and for all** and keep it. This chapter takes **yaw, pitch, roll**: the orientation is the product `Ry(yaw) × Rx(pitch) × Rz(roll)`. The product is read from right to left, as in the chapter on matrices: the roll acts first on the object, the pitch next, and the yaw last.

### Why it is tempting

| Advantage | Detail |
|---|---|
| Readable | "a pitch of 30 degrees" speaks to a human; nine matrix coefficients do not |
| Easy to drive with a mouse | A horizontal move adds to the yaw, a vertical move adds to the pitch |
| Light | 3 numbers instead of 9 |
| No drift | The matrix is recomputed from the 3 angles: it is always an exact rotation, up to rounding |
| Simple to write into a file or an editor | Three sliders, three input fields |

The price to pay appears in the next section.

## Gimbal lock: when two axes become one

The product `Ry(yaw) × Rx(pitch) × Rz(roll)` makes the roll act around Z, then the pitch **tilts** this Z axis. When the pitch is 90 degrees, it lays it exactly on the Y axis, the one of the yaw: roll and yaw then turn around **the same axis**.

```text
Pitch 0 degrees                       Pitch 90 degrees

    Y = yaw axis                          Y = yaw axis
    ^                                     ^  = roll axis (laid flat by the pitch)
    |                                     |
    +-----> X                             +-----> X
   /                                     /
  Z = roll axis                         Z: no angle turns it any more

three different axes:                 two axes merged:
three rotations possible              two rotations possible
```

One rotation is lost: we say that there is **one degree of freedom fewer** (a degree of freedom is an independent way to move: here, three at the start, two at the lock). The following program proves it with the 9 coefficients of the matrix. It builds an orientation from an order of axes and three angles, measures the largest gap between two matrices (`max_gap`) and displays a matrix (`show`). In `show`, `const char *name` is a text; `%s` inserts it into the display and `%7.4f` writes a decimal number on 7 characters wide, with 4 decimals.

```c
// Orientation given by three angles: product of the rotations order[0], order[1], order[2]
// with the angles angle[0], angle[1], angle[2]; the rotation written last acts first
Mat3 euler(const int order[3], const float angle[3])
{
    Mat3 r = axis_rotation(order[0], angle[0]);     // the first one of the product
    // we multiply by the second rotation
    r = product(r, axis_rotation(order[1], angle[1]));
    return product(r, axis_rotation(order[2], angle[2]));
}

// Largest gap, in absolute value, between the 9 coefficients of a and those of b
float max_gap(Mat3 a, Mat3 b)
{
    float worst = 0;                        // the largest gap met so far
    for (int i = 0; i < 3; i++)             // each row
        for (int j = 0; j < 3; j++)         // each column
            if (fabs(a.m[i][j] - b.m[i][j]) > worst)  // does this gap beat the record?
                worst = fabs(a.m[i][j] - b.m[i][j]);  // yes: it becomes the record
    return worst;
}

// Displays a matrix, one line of three coefficients per line of text;
// "const char *name" is a text (an address of characters), %s inserts it
void show(const char *name, Mat3 a)
{
    printf("%s\n", name);                   // the title of the matrix
    for (int i = 0; i < 3; i++)             // one line of text per row of the matrix
        // the three coefficients of the row
        printf("  %7.4f %7.4f %7.4f\n", clean(a.m[i][0]), clean(a.m[i][1]), clean(a.m[i][2]));
}
```

Three sets of angles {yaw, pitch, roll} share the same 90-degree pitch and the same yaw-minus-roll gap (20). Two others, at 45 degrees, have the same yaws and rolls. `%.1e` displays a number in scientific notation with one decimal: `3.0e-08` is 3.0 × 10⁻⁸, that is 0.00000003.

```c
int main(void)
{
    const int order[3] = {1, 0, 2};         // yaw (Y axis), pitch (X axis), roll (Z axis)
    // Each set of angles is written {yaw, pitch, roll}
    const float a[3] = {30 * DEG, 90 * DEG, 10 * DEG};
    // same pitch; yaw and roll increased by 20 degrees
    const float b[3] = {50 * DEG, 90 * DEG, 30 * DEG};
    // same pitch; yaw minus roll is still 20
    const float c[3] = {20 * DEG, 90 * DEG, 0 * DEG};
    const float d[3] = {30 * DEG, 45 * DEG, 10 * DEG};      // same yaw and roll as a,
    const float e[3] = {50 * DEG, 45 * DEG, 30 * DEG};      // but a pitch of 45 degrees

    // the 9 coefficients of set A
    show("A : yaw 30, pitch 90, roll 10", euler(order, a));
    show("B : yaw 50, pitch 90, roll 30", euler(order, b));  // those of set B
    show("C : yaw 20, pitch 90, roll 0", euler(order, c));  // those of set C
    // largest gap between matrices A and B
    printf("gap A-B: %.1e\n", max_gap(euler(order, a), euler(order, b)));
    // between A and C
    printf("gap A-C: %.1e\n", max_gap(euler(order, a), euler(order, c)));
    // between D and E
    printf("gap D-E (pitch 45): %.1e\n", max_gap(euler(order, d), euler(order, e)));
    return 0;
}
```

```text
A : yaw 30, pitch 90, roll 10
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
B : yaw 50, pitch 90, roll 30
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
C : yaw 20, pitch 90, roll 0
   0.9397  0.3420  0.0000
   0.0000  0.0000 -1.0000
  -0.3420  0.9397  0.0000
gap A-B: 3.0e-08
gap A-C: 3.0e-08
gap D-E (pitch 45): 2.3e-01
```

| Comparison | Pitch | Largest gap between the 9 coefficients | Reading |
|---|---|---|---|
| A (30, 90, 10) against B (50, 90, 30) | 90 degrees | 3.0 × 10⁻⁸ | Same matrix (up to rounding noise) |
| A (30, 90, 10) against C (20, 90, 0) | 90 degrees | 3.0 × 10⁻⁸ | Same matrix |
| D (30, 45, 10) against E (50, 45, 30) | 45 degrees | 0.23 | Two very different orientations |

Three distinct sets of angles give **the same orientation**: at 90 degrees, only the difference yaw minus roll counts. The hand calculation confirms it: `Ry(a) × Rx(90°) × Rz(c) = Ry(a - c) × Rx(90°)`. The table of the orders further down checks this rule by measurement.

### Measuring the lost freedom

To find which axis each angle turns the object around, we vary it by a very small step (0.001 radian) and read the axis of the small rotation obtained. The **transpose** of a matrix swaps its rows and columns ([reminder](/?c=fondamentaux&s=mathematiques&p=matrices-et-produit-matriciel#the-transpose-swapping-rows-and-columns)); for a rotation, it is also its **inverse**: the rotation that exactly undoes the first one. Multiplying an orientation `after` by the transpose of `before` therefore gives the rotation that leads from one to the other, whose axis we read from the gaps between symmetric elements (`r21 - r12`, ..., where `rij` is the element in row `i` and column `j`, as in [the section on axis and angle](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#recovering-the-axis-and-angle-of-a-rotation)).

```c
// Transpose of a: rows and columns swapped. For a rotation, it is also
// its inverse: the rotation that exactly undoes a
Mat3 transpose(Mat3 a)
{
    Mat3 t = {{{0}}};                       // the transpose, filled cell by cell
    for (int i = 0; i < 3; i++)             // each row i of a
        for (int j = 0; j < 3; j++)         // each column j of a
            t.m[j][i] = a.m[i][j];          // becomes row j, column i of t
    return t;
}

// Speed of rotation between two very close orientations: the axis of the small rotation
// that leads from before to after, read from the gaps r21 - r12, r02 - r20, r10 - r01
void speed(Mat3 before, Mat3 after, float step, float w[3])
{
    Mat3 r = product(after, transpose(before));     // the rotation from before to after
    w[0] = (r.m[2][1] - r.m[1][2]) / (2 * step);    // component along X
    w[1] = (r.m[0][2] - r.m[2][0]) / (2 * step);    // component along Y
    w[2] = (r.m[1][0] - r.m[0][1]) / (2 * step);    // component along Z
}
```

```c
int main(void)
{
    const int order[3] = {1, 0, 2};         // yaw (Y), pitch (X), roll (Z)
    // the displayed names of the three angles
    const char *name[3] = {"yaw", "pitch", "roll"};
    const float step = 0.001;               // each angle is varied by 0.001 radian
    // the two pitches tried: 0 and 90 degrees
    const float pitches[2] = {0 * DEG, 90 * DEG};

    for (int t = 0; t < 2; t++) {           // one series at pitch 0, one at pitch 90
        float angle[3] = {0, pitches[t], 0};    // yaw 0, the series' pitch, roll 0
        Mat3 before = euler(order, angle);  // the starting orientation
        printf("pitch %.0f degrees\n", pitches[t] / DEG);   // the title of the series
        for (int i = 0; i < 3; i++) {       // we move only one of the three angles
            float w[3];                     // the measured axis, filled by speed
            // copy of the angles, of which only one will change
            float moved[3] = {angle[0], angle[1], angle[2]};
            moved[i] += step;               // angle number i increases by 0.001 radian
            // the axis of the small rotation obtained
            speed(before, euler(order, moved), step, w);
            // %-8s: a text, padded with spaces up to 8 characters
            printf("  %-8s rotates around (%6.3f, %6.3f, %6.3f)\n", name[i],
                   clean(w[0]), clean(w[1]), clean(w[2]));
        }
    }
    return 0;
}
```

```text
pitch 0 degrees
  yaw      rotates around ( 0.000,  1.000,  0.000)
  pitch    rotates around ( 1.000,  0.000,  0.000)
  roll     rotates around ( 0.000,  0.000,  1.000)
pitch 90 degrees
  yaw      rotates around ( 0.000,  1.000,  0.000)
  pitch    rotates around ( 1.000,  0.000,  0.000)
  roll     rotates around ( 0.000, -1.000,  0.000)
```

| Pitch | Yaw axis | Pitch axis | Roll axis | Distinct axes |
|---|---|---|---|---|
| 0 degrees | (0, 1, 0) | (1, 0, 0) | (0, 0, 1) | 3: every movement is possible |
| 90 degrees | (0, 1, 0) | (1, 0, 0) | **(0, -1, 0)** | 2: the roll turns around the yaw axis, in the opposite direction |

At the lock, **no angle turns the object around Z any more** (the axis that points toward you). To tilt the view, the only option is to leave 90 degrees, for example by changing the pitch.

### The symptom: the view jumps at the zenith

The **zenith** is the point directly above you. When the nose of an object or the gaze of a camera passes through it, the angles that describe it change abruptly, even though the movement is tiny. To see it, you must read the yaw back from a direction: `atan2(a, b)` gives the angle of the point (b, a) seen from the origin, within -180 to 180 degrees, and knows which quarter-turn the point lies in.

```c
// Yaw, in degrees, that the Euler angles (order Y, X, Z) assign to a nose pointing
// toward (x, y, z). atan2(a, b) returns the angle of the point (b, a) seen from the origin,
// from -180 to 180 degrees (asin, the arcsine, would give the pitch instead)
float yaw_of_nose(const float nose[3])
{
    return atan2(-nose[0], -nose[2]) / DEG;
}

int main(void)
{
    const int order[3] = {1, 0, 2};         // yaw (Y), pitch (X), roll (Z)
    // yaw 30 degrees, pitch 80 degrees, roll 0
    const float angle[3] = {30 * DEG, 80 * DEG, 0};
    const float front[3] = {0, 0, -1};      // the nose, before any rotation: toward -Z
    float nose[3];                          // the direction of the nose after rotation

    apply(euler(order, angle), front, nose);            // where does the nose point?
    // the yaw read back must be 30
    printf("check: yaw 30, pitch 80 -> yaw read back %.1f\n", yaw_of_nose(nose));

    // Two almost vertical noses, 0.02 degree apart from each other:
    // one leans 0.01 degree to the right, the other 0.01 degree to the left
    const float gap = sin(0.01 * DEG);
    const float right[3] = {gap, 1, 0};     // nose 0.01 degree from the vertical, right side
    const float left[3] = {-gap, 1, 0};     // nose 0.01 degree from the vertical, left side
    // the yaw assigned to the right-hand nose
    printf("nose on the right: yaw %.1f\n", yaw_of_nose(right));
    // the yaw assigned to the left-hand nose
    printf("nose on the left: yaw %.1f\n", yaw_of_nose(left));
    return 0;
}
```

```text
check: yaw 30, pitch 80 -> yaw read back 30.0
nose on the right: yaw -90.0
nose on the left: yaw 90.0
```

The first line checks the function: a yaw of 30 degrees is read back as 30.0. The next two noses are only **0.02 degree** apart (a hundredth of a degree on each side of the vertical), yet their yaw differs by **180 degrees**. In an application, the view therefore swings half a turn around the vertical from one image to the next (an **image** is one display of the scene, see the [render loop](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#the-render-loop): there are usually about sixty per second). The symptom described is this: when you look straight up, moving the mouse sideways spins the view on itself instead of tilting it toward that side (yaw and roll have the same effect, in a sense, as the previous measurement showed), and crossing the vertical makes the display jump.

### Which axis locks, depending on the order?

Changing the order does not remove the lock: it moves it. The following program tests the six possible orders of the three axes (the first axis acts last, as in the written product), with the **middle** angle at 90, -90, then 45 degrees. For each case, it moves the first and the last angle by 10 degrees (in the same direction, then in opposite directions) and says which combination of the two stays in play alone: their **difference** (moving both in the same direction changes nothing) or their **sum** (moving both in opposite directions changes nothing). It also tests the order Z X Z, which repeats an axis (the so-called "proper" Euler angles, as opposed to the Tait-Bryan angles with three different axes, [details](https://en.wikipedia.org/wiki/Euler_angles)), with the middle angle at 0, 180, then 90 degrees. In the block, `"difference"` is a text that the function returns, `'X'` a single character, and `const int *o` designates the address of an array of three integers.

```c
// What becomes of the matrix when the first and the last angle move by 10 degrees?
// Returns "difference" if only their difference counts (same direction: no effect),
// "sum" if only their sum counts (opposite directions: no effect), "none" otherwise
const char *lock(const int order[3], float middle)    // returns a text
{
    const float base[3] = {20 * DEG, middle, 35 * DEG};     // an arbitrary starting point
    const float same[3] = {30 * DEG, middle, 45 * DEG};     // both ends +10 degrees
    const float inverse[3] = {30 * DEG, middle, 25 * DEG};  // first +10, last -10
    Mat3 m = euler(order, base);            // the starting orientation

    // same direction: is the matrix unchanged?
    if (max_gap(m, euler(order, same)) < 0.0001)
        return "difference";
    if (max_gap(m, euler(order, inverse)) < 0.0001)     // opposite directions: unchanged?
        return "sum";
    return "none";
}

int main(void)
{
    // The six ways of arranging X (0), Y (1) and Z (2) in a product of three rotations
    const int orders[6][3] = {
        // each triplet is an order of axes ({0, 1, 2} : X Y Z)
        {0, 1, 2}, {0, 2, 1}, {1, 0, 2}, {1, 2, 0}, {2, 0, 1}, {2, 1, 0}
    };
    const char axis[3] = {'X', 'Y', 'Z'};  // 'X': a single character, displayed by %c

    for (int k = 0; k < 6; k++) {           // one line per order
        const int *o = orders[k];           // o: the address of the three axes of this order
        // an order, then the verdict for each middle angle
        printf("%c %c %c : middle at 90 : %s ; at -90 : %s ; at 45 : %s\n", axis[o[0]],
               axis[o[1]], axis[o[2]], lock(o, 90 * DEG), lock(o, -90 * DEG),
               lock(o, 45 * DEG));
    }
    const int zxz[3] = {2, 0, 2};           // Z axis repeated: the "proper" Euler angles
    // same display for the order Z X Z
    printf("Z X Z : middle at 0 : %s ; at 180 : %s ; at 90 : %s\n", lock(zxz, 0 * DEG),
           lock(zxz, 180 * DEG), lock(zxz, 90 * DEG));
    return 0;
}
```

```text
X Y Z : middle at 90 : sum ; at -90 : difference ; at 45 : none
X Z Y : middle at 90 : difference ; at -90 : sum ; at 45 : none
Y X Z : middle at 90 : difference ; at -90 : sum ; at 45 : none
Y Z X : middle at 90 : sum ; at -90 : difference ; at 45 : none
Z X Y : middle at 90 : sum ; at -90 : difference ; at 45 : none
Z Y X : middle at 90 : difference ; at -90 : sum ; at 45 : none
Z X Z : middle at 0 : sum ; at 180 : difference ; at 90 : none
```

| Order (first axis written first) | Angle that locks | First and last angle: only ... counts (middle at 90 degrees) | ... (middle at -90 degrees) |
|---|---|---|---|
| X Y Z | Y (the middle) | their sum | their difference |
| X Z Y | Z | their difference | their sum |
| **Y X Z** (the one used in this chapter) | **X, the pitch** | their difference | their sum |
| Y Z X | Z | their sum | their difference |
| Z X Y | X | their sum | their difference |
| Z Y X | Y | their difference | their sum |

In the six orders with three axes, it is always **the middle angle** that locks, at 90 degrees as well as at -90 degrees; the combination that stays in play alone is then the other one (the sum becomes the difference, and vice versa: measured for all six orders). At 45 degrees, none locks. Choosing the order therefore amounts to choosing **which movement will be trapped**; you cannot make the trap disappear. The order Z X Z, which repeats an axis, locks differently: its two outer axes coincide when the middle angle is 0 (only their sum counts) or 180 degrees (only their difference counts), and it does not lock at 90 degrees. The lock therefore happens at rest, not at the vertical.

## Incremental rotation: keep the matrix, not the angles

The lock comes from **storing angles**: three global numbers, relative to axes in a fixed order. The idea of **incremental rotation** is to stop storing any. We keep the orientation itself, a 3×3 matrix `R` (9 numbers), and, at each image, we multiply it by a **small rotation** `d` (an axis and a small angle) computed from the mouse movement: `R = d × R`. No global angle exists: the matrix does not remember how it got there, so nothing can become confused.

| | Euler angles | Incremental rotation |
|---|---|---|
| What is stored | 3 angles | 1 3×3 matrix (9 numbers) |
| Update at each image | `yaw += ...` then `pitch += ...` | `R = d × R` |
| Gimbal lock | **Yes**, when the middle angle is 90 degrees | **No** |
| Rounding error that accumulates | No (matrix recomputed each time) | **Yes**: to be corrected (following sections) |
| Readable and editable by hand | Yes | No |

The small rotation comes from Rodrigues' formula, given in the [neighboring chapter](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#rotating-around-an-arbitrary-axis-rodrigues-formula). It is written here in an equivalent and more compact form: `cos(θ) × I + sin(θ) × K + (1 - cos(θ)) × k × kᵀ`, where `k` is the axis of length 1 and `θ` the angle; `I` is the **identity matrix** (1s on the diagonal, 0s elsewhere: it leaves everything in place); `K` is the matrix `0 -kz ky / kz 0 -kx / -ky kx 0` (rows separated by `/`), which, multiplied by a vector `v`, gives the cross product `k × v` (a vector perpendicular to both, see [the camera](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#the-camera-look-at)); and `k × kᵀ` is the matrix whose element (i, j) equals `k_i × k_j`. The function `drag` translates a mouse drag (button pressed, mouse moved `dx` pixels to the right and `dy` pixels downward; a **pixel** is the smallest point on the screen) into a rotation around the axis `(dy, dx, 0)`, by an angle proportional to the length of the drag.

```c
// Identity matrix: 1s on the diagonal, 0s elsewhere; it rotates nothing
Mat3 identity(void)
{
    Mat3 r = {{{0}}};                       // zeros everywhere, then 1s on the diagonal
    for (int i = 0; i < 3; i++)             // each cell of the diagonal
        r.m[i][i] = 1;                      // a 1 in cell (i, i)
    return r;
}

// Rotation of "angle" radians around the axis (x, y, z), of any length
// (Rodrigues' formula: cos * I + sin * K + (1 - cos) * k * kᵀ, K described in the text)
Mat3 axis_angle_rotation(float x, float y, float z, float angle)
{
    double n = sqrt(x * x + y * y + z * z);             // length of the axis
    if (n < 1e-9)                                       // zero axis: the mouse did not move
        return identity();
    double k[3] = {x / n, y / n, z / n};                // the axis brought back to length 1
    double c = cos(angle), s = sin(angle);  // cosine and sine of the angle
    // the matrix K: multiplying by it amounts to computing k x v
    const double cross[3][3] = {{0, -k[2], k[1]}, {k[2], 0, -k[0]}, {-k[1], k[0], 0}};
    Mat3 r;                                 // the rotation, filled cell by cell
    for (int i = 0; i < 3; i++)             // each row i
        for (int j = 0; j < 3; j++)         // each column j
            // the three terms of the formula, cell (i, j)
            r.m[i][j] = (i == j ? c : 0) + s * cross[i][j] + (1 - c) * k[i] * k[j];
    return r;
}

// Orientation after a mouse drag of (dx, dy) pixels: a small rotation around
// the axis (dy, dx, 0), the larger the longer the drag
Mat3 drag(Mat3 r, float dx, float dy)
{
    float angle = sqrt(dx * dx + dy * dy) * 0.005;      // 0.005 radian per pixel
    return product(axis_angle_rotation(dy, dx, 0, angle), r);   // R = d * R
}
```

The following program drags the mouse vertically for 180 images of one degree each, around the X axis of the screen: the nose of the object rises, passes through the zenith, then comes back down on the other side. From the zenith (the moment when the nose points straight up, image 90), it then measures the axes of three small drags, as for Euler angles. `%3d` displays an integer on 3 characters wide.

```c
int main(void)
{
    const float front[3] = {0, 0, -1};     // the nose of the object: toward -Z at the start
    const float step = 0.001;               // small trial angle: 0.001 radian
    Mat3 r = identity();                    // starting orientation: no rotation
    Mat3 zenith = r;                        // copy of the "nose up" orientation
    float nose[3], w[3];                    // the nose direction, and the measured axis

    // A vertical drag of 180 images, 1 degree per image, around the X axis of the screen
    for (int image = 0; image <= 180; image++) {
        if (image % 45 == 0) {              // one line every 45 degrees
            apply(r, front, nose);          // where does the nose point now?
            // the angle covered, then the direction of the nose
            printf("%3d degrees : nose = (%6.3f, %6.3f, %6.3f)\n", image,
                   clean(nose[0]), clean(nose[1]), clean(nose[2]));
        }
        if (image == 90)                    // halfway, nose straight up
            zenith = r;                     // the nose has just arrived straight up
        r = product(axis_angle_rotation(1, 0, 0, 1 * DEG), r);      // R = d * R
    }
    // From the zenith, three small drags: along X, Y then Z of the screen
    for (int axis = 0; axis < 3; axis++) {
        float k[3] = {0, 0, 0};             // the axis of the drag: three zeros...
        k[axis] = 1;                        // the axis of this drag
        // the orientation after a small drag along this axis
        Mat3 after = product(axis_angle_rotation(k[0], k[1], k[2], step), zenith);
        speed(zenith, after, step, w);      // the axis of the rotation obtained
        // the number of the drag, then the measured axis
        printf("drag %d : turns around (%6.3f, %6.3f, %6.3f)\n", axis + 1,
               clean(w[0]), clean(w[1]), clean(w[2]));
    }
    return 0;
}
```

```text
  0 degrees : nose = ( 0.000,  0.000, -1.000)
 45 degrees : nose = ( 0.000,  0.707, -0.707)
 90 degrees : nose = ( 0.000,  1.000,  0.000)
135 degrees : nose = ( 0.000,  0.707,  0.707)
180 degrees : nose = ( 0.000,  0.000,  1.000)
drag 1 : turns around ( 1.000,  0.000,  0.000)
drag 2 : turns around ( 0.000,  1.000,  0.000)
drag 3 : turns around ( 0.000,  0.000,  1.000)
```

The nose crosses the zenith **without a jolt**: its height rises from 0 to 1 then falls back, smoothly. Above all, from the zenith, the three drags turn around three **distinct** axes (X, Y and Z), whereas three Euler angles offered only two. Because small rotations are expressed in the frame of the screen, three rotation directions always remain available, whatever the orientation of the object. A mouse provides only two directions (X and Y axes); the rotation around Z (the roll) is controlled another way, with the wheel or with keys.

### `d × R` or `R × d`?

The product does not commute: the side on which you place `d` changes the axis of the rotation. The following program also checks `drag`: a 100-pixel drag to the right must make the face turned toward the screen move to the right (+X), and a downward drag must make it go down (-Y).

```c
int main(void)
{
    const float front[3] = {0, 0, -1};     // the nose of the object: toward -Z at the start
    const float face[3] = {0, 0, 1};        // a point on the face turned toward the screen
    Mat3 r = axis_angle_rotation(0, 1, 0, 90 * DEG);    // object turned by 90° (Y axis)
    Mat3 d = axis_angle_rotation(1, 0, 0, 10 * DEG);    // vertical drag of 10° (X axis)
    float p[3];                             // the point after transformation

    apply(drag(identity(), 100, 0), face, p);           // 100 pixels to the right
    printf("drag to the right : face = (%6.3f, %6.3f, %6.3f)\n",    // where the face went
           clean(p[0]), clean(p[1]), clean(p[2]));
    apply(drag(identity(), 0, 100), face, p);           // 100 pixels downward
    printf("drag downward     : face = (%6.3f, %6.3f, %6.3f)\n",    // where the face went
           clean(p[0]), clean(p[1]), clean(p[2]));
    apply(product(d, r), front, p);                     // d * R: X axis of the screen
    // where the nose points
    printf("d * R : nose = (%6.3f, %6.3f, %6.3f)\n", clean(p[0]), clean(p[1]), clean(p[2]));
    apply(product(r, d), front, p);                     // R * d: X axis of the object
    // where the nose points
    printf("R * d : nose = (%6.3f, %6.3f, %6.3f)\n", clean(p[0]), clean(p[1]), clean(p[2]));
    return 0;
}
```

```text
drag to the right : face = ( 0.479,  0.000,  0.878)
drag downward     : face = ( 0.000, -0.479,  0.878)
d * R : nose = (-1.000,  0.000,  0.000)
R * d : nose = (-0.985,  0.174,  0.000)
```

| Product | Around which axes? | Nose after a 10-degree vertical drag, object already turned by 90 degrees around Y |
|---|---|---|
| `d × R` (the one used by `drag`) | The **screen** axes: a drag to the right always turns to the right | (-1.000, 0.000, 0.000): the nose is aligned on the X axis of the screen, it does not move |
| `R × d` | The **object** axes: they turned with it | (-0.985, 0.174, 0.000): the nose rises |

For mouse manipulation, the screen axes are what one expects. Choose one side, write it in a comment, and never change it.

### Connecting the matrix to rendering

For a camera, the rotation part of the view matrix is the **inverse** of the camera's orientation. For a matrix that is a true rotation, the inverse is the transpose (the `transpose` function above): no general inversion is needed. This is what [`look_at`](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#the-camera-look-at) already does, whose rows are the three directions of the camera. Its degenerate case (looking straight up with `up = (0, 1, 0)`) belongs to the same family as gimbal lock: two directions coincide. With an orientation stored as a matrix, no "up" direction is imposed, so the case no longer arises.

## The rounding error that accumulates

A `float` keeps only about 7 exact digits ([details](/?c=donnees&s=representation-des-donnees&p=nombres-flottants), and [the gap between two neighboring `float`s](/?c=donnees&s=representation-des-donnees&p=flottants-loin-de-l-origine#what-flt-epsilon-means)): each addition and each multiplication rounds its result. A product of two 3×3 matrices contains 27 multiplications and 18 additions. The error per image is minute, on the order of 10⁻⁷, but `R = d × R` starts again at each image from the result of the previous one: the errors **add up**.

A true rotation has an **orthogonal matrix**: its three columns have a length of 1 and are pairwise perpendicular (their dot product is zero); equivalently, `R × Rᵀ` is the identity matrix. When the error grows, the matrix stops being a rotation: a column longer than 1 **stretches** the object in that direction, and columns that are no longer at right angles **tilt** it (they shear it).

| Measure | What it computes | Value for a perfect rotation |
|---|---|---|
| `length` | The largest gap from 1 in the length of a column | 0 |
| `perpendicular` | The largest dot product between two columns | 0 |
| `identity` | The largest gap between `R × Rᵀ` and the identity matrix | 0 |

The function `measure` computes them (in `double`, so that the measurement itself adds no error).

```c
// The three gaps to a true rotation: 0 everywhere if the matrix is perfect
typedef struct {
    double length;              // largest gap from 1 in the length of a column
    double perpendicular;       // largest dot product of two columns
    double identity;            // largest gap between a * aᵀ and the identity matrix
} Gaps;

Gaps measure(Mat3 a)
{
    Gaps e = {0, 0, 0};                     // the three gaps start at 0
    for (int j = 0; j < 3; j++) {           // each column j
        double sum = 0;                     // the square of its length
        // sum of the squares of the three elements of the column
        for (int i = 0; i < 3; i++)
            sum += (double)a.m[i][j] * a.m[i][j];       // (double): computed in double
        // does its gap from 1 in length beat the record?
        if (fabs(sqrt(sum) - 1) > e.length)
            e.length = fabs(sqrt(sum) - 1);     // yes: new record
        for (int k = j + 1; k < 3; k++) {   // each column k after j: once per pair
            double p = 0;                   // dot product of columns j and k
            // sum of the term-by-term products of columns j and k
            for (int i = 0; i < 3; i++)
                p += (double)a.m[i][j] * a.m[i][k];     // we add a product
            if (fabs(p) > e.perpendicular)  // does this dot product beat the record?
                e.perpendicular = fabs(p);  // yes: new record
        }
    }
    for (int i = 0; i < 3; i++)             // a * aᵀ: the element (i, k) is the dot product
        for (int k = 0; k < 3; k++) {       // of row i with row k of a
            double p = 0;                   // dot product of rows i and k
            for (int j = 0; j < 3; j++)     // sum of the term-by-term products
                p += (double)a.m[i][j] * a.m[k][j];     // we add a product
            if (fabs(p - (i == k)) > e.identity)    // (i == k): 1 on the diagonal
                e.identity = fabs(p - (i == k));    // yes: new record
        }
    return e;
}
```

The program keeps turning an orientation for one million images, by 0.01 radian per image (about 0.57 degree), around an axis that changes slowly, and records the three measures at 100, 10,000, 100,000 then 1,000,000 images. `%8ld` displays an integer of type `long` on 8 characters wide.

```c
int main(void)
{
    const long milestones[4] = {100, 10000, 100000, 1000000};   // image counts recorded
    Mat3 r = identity();                    // the orientation, initially without rotation
    long image = 0;                         // number of images already computed

    for (int j = 0; j < 4; j++) {           // we stop at each milestone to measure
        for (; image < milestones[j]; image++) {    // one image per turn, up to the milestone
            double t = image * 0.001;       // time: the mouse axis turns slowly
            // 0.01 radian of rotation per image, around an axis that changes at every image
            r = product(axis_angle_rotation(cos(t), sin(t), 0.5, 0.01), r);
        }
        Gaps e = measure(r);                // the three gaps at this milestone
        // number of images, then the three gaps
        printf("%8ld images : length %.1e, dot product %.1e, a*aT %.1e\n",
               image, e.length, e.perpendicular, e.identity);
    }
    return 0;
}
```

```text
     100 images : length 4.0e-07, dot product 3.2e-07, a*aT 8.3e-07
   10000 images : length 1.9e-05, dot product 8.3e-06, a*aT 3.4e-05
  100000 images : length 2.0e-04, dot product 9.0e-05, a*aT 3.4e-04
 1000000 images : length 2.0e-03, dot product 8.3e-04, a*aT 3.1e-03
```

The same program, with `float` replaced by `double` everywhere, gives gaps on the order of 10⁻¹¹ after a million images; this second trial shows that the precision of the type is indeed the cause.

| Images | `length` (`float`) | `perpendicular` (`float`) | `identity` (`float`) | `identity` (`double`) |
|---|---|---|---|---|
| 100 | 4.0 × 10⁻⁷ | 3.2 × 10⁻⁷ | 8.3 × 10⁻⁷ | 2.2 × 10⁻¹⁵ |
| 10,000 | 1.9 × 10⁻⁵ | 8.3 × 10⁻⁶ | 3.4 × 10⁻⁵ | 2.5 × 10⁻¹³ |
| 100,000 | 2.0 × 10⁻⁴ | 9.0 × 10⁻⁵ | 3.4 × 10⁻⁴ | 2.5 × 10⁻¹² |
| 1,000,000 | 2.0 × 10⁻³ | 8.3 × 10⁻⁴ | 3.1 × 10⁻³ | 2.5 × 10⁻¹¹ |

Reading: from 10,000 to 1,000,000 images, the gap is roughly **multiplied by 10 each time the number of images is**: it grows steadily and never levels off. After one million images (about four and a half hours at 60 images per second), the length of a column deviates from 1 by 0.002: a 1-meter segment, once transformed, measures 2 millimeters more or less, and the gap keeps growing. Switching to `double` does not solve the problem, it **pushes it back**: the gap is about a hundred million times smaller (10⁸), and it still grows in the same way. These precise values depend on the speed of rotation and on the movement; what matters is the order of magnitude and the steady growth.

## Re-orthonormalization: putting the matrix back straight

**Re-orthonormalizing** a matrix means correcting it slightly so that it becomes orthogonal again: columns of length 1 that are perpendicular. As the error is about 10⁻⁷ per image, the correction is minute and not visible on screen. Several methods exist:

| Method | Principle | Measured result (see below) |
|---|---|---|
| Normalize each column | Divide each column by its length | The lengths are corrected, but not the angle between columns: **not enough** |
| **Gram-Schmidt on two columns, then cross product** (chosen) | Fix column 0, make column 1 perpendicular to it, **build** column 2 by a cross product | The three gaps drop back to a few 10⁻⁶ (N = 100) |
| Gram-Schmidt on three columns | Same procedure, also applied to column 2 | Not measured here: one extra computation for a column that the cross product already fully determines |

The **Gram-Schmidt process** ([details](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process)) handles the columns one by one: each new column first loses the part that points in the direction of the columns already fixed, then is brought back to length 1. This part is computed with the dot product: if `c0` has a length of 1, `c1 · c0` is its measure. Worked example: `c0 = (1, 0, 0)` and `c1 = (1, 2, 0)` have a dot product of 1 (1 × 1 + 0 × 2 + 0 × 0); `c1 - 1 × c0 = (0, 2, 0)`, which is perpendicular to `c0`; brought back to length 1 (we divide it by 2), it becomes `(0, 1, 0)`.

The chosen method is the simplest to write and to check: two normalizations, a dot product, a cross product. It gives two guarantees: column 2 is **exactly** perpendicular to the other two and of length 1 (the cross product of two unit vectors that are perpendicular to each other is a third one), and it is on the right side: the result is a true rotation and not a **mirror** (which would swap the left and right of the object, something no rotation does). The price: column 0 keeps its direction and the other two adjust around it; since the correction is of the order of the error (10⁻⁶), this slight privilege has no consequence.

```c
// Divides the vector v by its length: its direction stays the same, its length becomes 1
void normalize(double v[3])
{
    double n = sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);   // its length (its norm)
    if (n > 0)                              // a zero vector cannot be normalized
        for (int i = 0; i < 3; i++)         // each component of v
            v[i] /= n;                      // divided by the length
}

// Straightens in three steps the matrix whose address is a: "Mat3 *a" is a pointer,
// and a->m designates the array of this matrix, which the function modifies in place
void straighten(Mat3 *a)
{
    double c0[3], c1[3], c2[3];             // the three columns
    for (int i = 0; i < 3; i++) {           // each row i
        c0[i] = a->m[i][0];                 // we copy columns 0 and 1
        c1[i] = a->m[i][1];                 // column 1
    }
    normalize(c0);                          // step 1: column 0 keeps its direction
    double d = c1[0] * c0[0] + c1[1] * c0[1] + c1[2] * c0[2];   // part of c1 along c0
    for (int i = 0; i < 3; i++)             // each component
        c1[i] -= d * c0[i];                 // step 2: we remove this part, c1 becomes
    normalize(c1);                          // perpendicular to c0, then of length 1
    c2[0] = c0[1] * c1[2] - c0[2] * c1[1];  // step 3: column 2 is the cross product
    c2[1] = c0[2] * c1[0] - c0[0] * c1[2];  // of the other two: perpendicular
    c2[2] = c0[0] * c1[1] - c0[1] * c1[0];  // to both and of length 1, with no extra work
    for (int i = 0; i < 3; i++) {           // each row i
        a->m[i][0] = c0[i];                 // we rewrite the three columns
        a->m[i][1] = c1[i];                 // column 1
        a->m[i][2] = c2[i];                 // column 2
    }
}

// Insufficient variant, for comparison: each column brought back to length 1, nothing more
void normalize_columns(Mat3 *a)
{
    for (int j = 0; j < 3; j++) {           // each column j
        double c[3] = {a->m[0][j], a->m[1][j], a->m[2][j]};     // column j, copied
        normalize(c);                       // brought back to length 1
        for (int i = 0; i < 3; i++)         // each row i
            a->m[i][j] = c[i];              // and rewritten into the matrix
    }
}
```

The following program replays the million images of the previous program, correcting the matrix every `N` images (the `period` of the code), and records, for each of the three measures, **the worst value encountered** during the whole trial (one measure per image). It compares no correction, the simple normalization of the columns, and `straighten` at six rhythms. `fmax` returns the larger of two numbers.

```c
// One million images; mode 0: no correction, 1: normalize_columns, 2: straighten.
// The correction takes place every "period" images. Returns, for each of the three gaps,
// the worst value encountered during the whole experiment
Gaps trial(int mode, long period)
{
    Mat3 r = identity();                    // the starting orientation
    Gaps worst = {0, 0, 0};                 // the worst values, at 0 at the start

    for (long image = 1; image <= 1000000; image++) {   // one turn per image
        double t = image * 0.001;           // same movement as in the previous section
        // the rotation of this image
        r = product(axis_angle_rotation(cos(t), sin(t), 0.5, 0.01), r);
        if (mode == 1 && image % period == 0)   // mode 1: every "period" images
            normalize_columns(&r);          // &r: the address of r
        if (mode == 2 && image % period == 0)   // mode 2: every "period" images
            straighten(&r);                 // we straighten the matrix
        Gaps e = measure(r);                // we measure at each image; fmax: the larger
        // we keep the largest gap encountered
        worst.length = fmax(worst.length, e.length);
        worst.perpendicular = fmax(worst.perpendicular, e.perpendicular);   // same
        worst.identity = fmax(worst.identity, e.identity);  // same
    }
    return worst;
}

int main(void)
{
    // the correction rhythms tried
    const long periods[6] = {1, 10, 100, 1000, 10000, 100000};
    Gaps e = trial(0, 1);                   // the period is useless without correction
    // the three worst gaps, without correction
    printf("no correction : %.1e %.1e %.1e\n", e.length, e.perpendicular, e.identity);
    e = trial(1, 100);                      // normalize the columns, every 100 images
    // the three worst gaps
    printf("normalize, N=100 : %.1e %.1e %.1e\n", e.length, e.perpendicular, e.identity);
    for (int k = 0; k < 6; k++) {           // the same correction at different rhythms
        e = trial(2, periods[k]);           // straighten every periods[k] images
        // the period, then the three worst gaps
        printf("straighten, N=%-6ld : %.1e %.1e %.1e\n", periods[k], e.length,
               e.perpendicular, e.identity);
    }
    return 0;
}
```

```text
no correction : 2.0e-03 8.8e-04 4.0e-03
normalize, N=100 : 1.3e-06 9.3e-04 9.3e-04
straighten, N=1      : 5.1e-08 8.5e-08 1.0e-07
straighten, N=10     : 4.7e-07 5.4e-07 1.0e-06
straighten, N=100    : 1.5e-06 1.7e-06 2.7e-06
straighten, N=1000   : 4.8e-06 4.2e-06 8.5e-06
straighten, N=10000  : 2.6e-05 1.5e-05 5.1e-05
straighten, N=100000 : 2.2e-04 1.1e-04 4.3e-04
```

The three columns of figures are, in order: `length`, `perpendicular`, `identity`.

| Correction | `length` | `perpendicular` | `identity` |
|---|---|---|---|
| None | 2.0 × 10⁻³ | 8.8 × 10⁻⁴ | 4.0 × 10⁻³ |
| Normalize the columns, N = 100 | 1.3 × 10⁻⁶ | **9.3 × 10⁻⁴** | **9.3 × 10⁻⁴** |
| `straighten`, N = 1 | 5.1 × 10⁻⁸ | 8.5 × 10⁻⁸ | 1.0 × 10⁻⁷ |
| `straighten`, N = 10 | 4.7 × 10⁻⁷ | 5.4 × 10⁻⁷ | 1.0 × 10⁻⁶ |
| `straighten`, N = 100 | 1.5 × 10⁻⁶ | 1.7 × 10⁻⁶ | 2.7 × 10⁻⁶ |
| `straighten`, N = 1,000 | 4.8 × 10⁻⁶ | 4.2 × 10⁻⁶ | 8.5 × 10⁻⁶ |
| `straighten`, N = 10,000 | 2.6 × 10⁻⁵ | 1.5 × 10⁻⁵ | 5.1 × 10⁻⁵ |
| `straighten`, N = 100,000 | 2.2 × 10⁻⁴ | 1.1 × 10⁻⁴ | 4.3 × 10⁻⁴ |

Three lessons:

- **Normalizing the columns alone is not enough**: the lengths are corrected (10⁻⁶), but the columns remain tilted relative to each other (`perpendicular` 9.3 × 10⁻⁴, no better than without correction).
- **Correcting at every image** (N = 1) gives the best result, on the order of 10⁻⁷: the limit of `float`, because the correction rounds too.
- **Correcting less often degrades slowly**: the worst gap goes from 10⁻⁷ (N = 1) to 8.5 × 10⁻⁶ (N = 1,000), then 4.3 × 10⁻⁴ (N = 100,000), that is roughly what was measured without correction after 100,000 images.

To choose `N`, set the largest gap you can accept. A gap of 10⁻⁵ on an object 1,000 pixels wide represents 0.01 pixel: invisible. At this rotation speed, **N = 1,000** meets this limit (8.5 × 10⁻⁶), that is a correction about every 17 seconds at 60 images per second. The cost of one call to `straighten` is 2 square roots, 6 divisions and 18 multiplications, against 27 multiplications for a product of two matrices. Correcting at every image therefore remains feasible for a few objects, and correcting every hundred images or so costs almost nothing. A faster movement or a longer scene requires running the measurement again.

## Variants: quaternions and limited angles

### Quaternions

A **quaternion** represents a rotation with **4 numbers** instead of 9. Like Euler angles, it is compact; like the matrix, it has **no gimbal lock**. Composing two rotations amounts to multiplying two quaternions, and a quaternion is straightened simply by dividing it by its norm (its length): 4 numbers to normalize, instead of straightening three columns. The neighboring chapter mentions it as an [alternative](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#rotating-an-object-accumulated-rotation); no chapter on the site develops it, and the reference source is the page on [quaternions and rotations in space](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation). For a project that only needs to rotate an object with the mouse and draw it, the straightened matrix of this chapter is enough and remains easy to connect to [OpenGL](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl).

### When to keep angles anyway

The lock is a problem only if the orientation can reach the trapped configuration. If the application has no roll, or prevents reaching the vertical, two angles are enough:

| Situation | Choice | Why |
|---|---|---|
| First-person camera (a character walks, the horizon stays horizontal) | Two angles (yaw, pitch), **pitch limited to less than 90 degrees** | Without roll, nothing to lock; the limit prevents passing through the zenith |
| Orbital camera (it turns around an object, like a satellite) | Two angles (around the object, height above it), **height limited** | Same reason |
| Free-flight camera (it can flip over, like a spaceship's), object spun in every direction | Straightened incremental matrix, or quaternion | No direction is forbidden |
| Display or input by the user (sliders, a readable scene file) | Euler angles **for the interface only** | Readable; do not read them back from the matrix near the zenith (the view jumps by 180 degrees, measured above) |
| Saving an orientation to a file | The matrix (9 numbers) or the quaternion | Angles are not unique near the lock |

The following block limits the pitch of a camera to 89 degrees. `c->yaw` designates the field `yaw` of the camera `c` (a pointer: the address of the camera, which the function modifies in place). `dx` and `dy` are the mouse movements, in pixels, since the previous image; in a real program, they come from the mouse events of [GLFW](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu).

```c
// A camera described by only two angles: without roll, there is nothing to lock
typedef struct { float yaw, pitch; } Camera;

const float LIMIT = 1.553343;               // 89 degrees in radians: never quite 90

// dx and dy: movement of the mouse since the previous image, in pixels
void aim(Camera *c, float dx, float dy)     // c->yaw: the yaw field of camera c
{
    c->yaw += dx * 0.002;                   // 0.002 radian of yaw per pixel to the right
    c->pitch -= dy * 0.002;                 // mouse up (dy < 0): look higher
    if (c->pitch > LIMIT)                   // the pitch stays between -89 and +89 degrees
        c->pitch = LIMIT;                   // capped at +89 degrees
    if (c->pitch < -LIMIT)                  // too low?
        c->pitch = -LIMIT;                  // floored at -89 degrees
}

int main(void)
{
    Camera c = {0, 0};                      // looks straight ahead
    for (int i = 0; i < 3; i++)             // three large drags upward
        aim(&c, 0, -1000);                  // 1000 pixels upward (dy is negative)
    // the final pitch, in degrees
    printf("pitch after 3000 pixels upward: %.1f degrees\n", c.pitch / DEG);
    aim(&c, 0, 5000);                       // then a very large drag downward
    printf("pitch after 5000 pixels downward: %.1f degrees\n", c.pitch / DEG);  // same
    return 0;
}
```

```text
pitch after 3000 pixels upward: 89.0 degrees
pitch after 5000 pixels downward: -89.0 degrees
```

Whatever the length of the drag (3,000 pixels upward, then 5,000 downward), the pitch stays between -89 and +89 degrees: the view can no longer reach the vertical.

## Pitfalls

| Pitfall | Why it is a problem |
|---|---|
| Believing the lock only bothers at exactly 90 degrees | Near the vertical, a tiny movement requires a large change of yaw: a 0.02-degree gap gives a 180-degree yaw difference (measured) |
| Storing the orientation as angles for an object that turns freely | A middle angle at 90 degrees loses a rotation: the requested movement no longer has any effect |
| Changing the order of rotations to avoid the lock | Changing the order moves the lock, it does not remove it (table of the six orders) |
| Reading the angles back from the matrix, then feeding them back in | At the zenith, the yaw jumps by 180 degrees for a 0.02-degree movement |
| Never straightening the matrix | The gap grows at every image (3.1 × 10⁻³ after a million images): the object stretches and tilts |
| Normalizing only the columns | The lengths are corrected, not the angle between columns (9.3 × 10⁻⁴ measured) |
| Copying column 2 instead of recomputing it by cross product | It keeps its error, and nothing guarantees you get a rotation rather than a mirror |
| Switching to `double` believing it removes the drift | `double` makes the error about a hundred million times smaller, but it still grows steadily |
| Normalizing a zero axis | When the mouse has not moved, the axis `(dy, dx, 0)` is zero: dividing by its length (0) gives **`NaN`** (*Not a Number*, the result of an impossible calculation such as `0 / 0`, [details](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#the-camera-look-at)), which contaminates the whole matrix. `axis_angle_rotation` returns the identity in this case |
| Mixing `d × R` and `R × d` | The rotation axes move from the screen to the object: the mouse seems to turn the wrong way |
| Turning by a fixed angle per image | The speed then depends on the frame rate of the machine: use a speed per second multiplied by [the delta time](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu#delta-time-a-speed-that-does-not-depend-on-the-machine) |
| Limiting the pitch to exactly 90 degrees | The zenith remains reachable: keep a margin (89 degrees) |

## Best practices

| Best practice | Why |
|---|---|
| Store the orientation of a freely turning object as a matrix (or a quaternion), not as angles | No global angle: the lock no longer exists |
| Keep two angles and limit the pitch for a first-person or orbital camera | The simplest option, and no lock is possible |
| Straighten the matrix with Gram-Schmidt on two columns plus a cross product, every `N` images | Gap brought down from about 10⁻³ to 10⁻⁵ or less; column 2 is exact and the result remains a rotation |
| Choose `N` by measuring (`measure`, `trial`) according to the gap you can accept | `N = 1,000` gives 8.5 × 10⁻⁶ at 0.01 radian per image; a faster movement requires a new measurement |
| Choose one side for the composition (`d × R`, screen axes, for the mouse) and note it in a comment | Avoids rotations that start from the wrong side |
| Handle the zero axis (motionless mouse) before normalizing | No `NaN` in the matrix |
| Test the edge cases: pitch of 90 degrees, zero drag, one million images | These are what reveal the lock and the drift |
| Save the matrix or the quaternion, display the angles only for the interface | Angles are not unique near the lock |

## Key Takeaways

| | |
|---|---|
| **Key point** | Euler angles (pitch, yaw, roll) describe an orientation by three rotations in a fixed order, and the order matters. When the middle angle is 90 degrees, the other two turn around the same axis: this is gimbal lock, and a rotation is lost (measured: three sets of angles give the same matrix, and at the zenith a 0.02-degree movement makes the yaw jump by 180 degrees). The remedy is incremental rotation: store the 3×3 matrix and multiply it at each image by a small rotation, `R = d × R`, with no global angle and therefore no lock. Its counterpart is the rounding error, which accumulates (3.1 × 10⁻³ after a million images in `float`): it is corrected by bringing the columns back to length 1 and perpendicular (Gram-Schmidt on two columns, cross product for the third), for example every 1,000 images (8.5 × 10⁻⁶). A quaternion, or two angles limited to less than 90 degrees for a first-person camera, are the variants. |
| **Tools you can use** | `cos`, `sin`, `sqrt`, `fabs`, `fmax`, `atan2` from the [C math library](https://en.cppreference.com/w/c/numeric/math); [Rodrigues' formula](/?c=fondamentaux&s=graphisme&p=matrices-et-camera#rotating-around-an-arbitrary-axis-rodrigues-formula); [the Gram-Schmidt process](https://en.wikipedia.org/wiki/Gram%E2%80%93Schmidt_process); [quaternions](https://en.wikipedia.org/wiki/Quaternions_and_spatial_rotation); [Euler angles](https://en.wikipedia.org/wiki/Euler_angles); [gimbal lock](https://en.wikipedia.org/wiki/Gimbal_lock). |
| **Pitfalls to avoid** | Storing angles for a free object; believing that changing the order removes the lock; reading angles back from the matrix near the zenith; never straightening the matrix; normalizing only the columns; normalizing a zero axis (`NaN`); mixing `d × R` and `R × d`; a fixed angle per image instead of a speed per second; a pitch limited to exactly 90 degrees. |
| **Best practices** | Matrix (or quaternion) for free rotation, two limited angles for the ground or orbital camera; straighten every `N` images with `N` chosen by measurement; compose on the screen side for the mouse; handle the zero axis; test pitch 90 degrees, zero drag and very long sessions; store the matrix, display the angles only in the interface. |
