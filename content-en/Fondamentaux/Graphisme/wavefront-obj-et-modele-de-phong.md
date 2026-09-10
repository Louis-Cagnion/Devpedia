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

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | An `.obj` lists instructions line by line (`v`, `vt`, `vn`, `f`, `s`...), with vertex indices starting at 1. Faces can have more than 3 vertices and must be triangulated to be drawn by the graphics card; ear clipping also handles concave faces thanks to an orientation test AND a "same-side" test for each remaining vertex. A face generally combines one index per list and per corner (`v/vt/vn`), because `v` and `vt` are two independent, unaligned lists -- necessary to represent a UV seam. The associated `.mtl` describes appearance via the 4 parameters of the Phong model (ambient, diffuse, specular, shininess) and can reference an image file (`map_Kd`) as a texture. `s` controls normal smoothing, independently of the geometry. |
| **Usable tools** | The Phong model (`Ka`/`Kd`/`Ks`/`Ns`) for interpreting an `.mtl`. `map_Kd` for linking an `.mtl` to a texture image file. Smoothing groups (`s`) for choosing between flat and smooth rendering. The `n - 2` formula to verify the number of triangles produced by any triangulation. |
| **Pitfalls to avoid** | 1-based rather than 0-based vertex indices. Faces with a variable number of vertices left untriangulated. Fan triangulation produces a wrong result on a concave face, and an orientation test alone (without a "same-side" test) can wrongly validate an ear that traps another vertex. Indexing a texture coordinate by vertex alone (rather than by a vertex/texture pair) silently breaks at a UV seam. A single-material `.mtl` doesn't provide a color per sub-part. `s`/`usemtl` are state directives to track throughout parsing, not attributes present on every `f` line. `o` never affects vertex numbering, which stays global to the file even with several objects. |
| **Good practices** | Separate raw file reading and triangulation into two distinct, single-responsibility functions. Reuse the same geometric primitive (cross product + dot product with the normal) for the orientation test and the same-side test, rather than duplicating it. Verify a triangulation with the `n - 2` formula before judging the split correct. Duplicate a vertex per unique `(v, vt[, vn])` combination rather than by position alone, to handle UV seams. Keep the current state (material, smoothing group) in variables updated as parsing proceeds, and attach it to each face read. |
