---
order: 7
---

# Mesh editing and proportional selection

The [previous chapter](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d) covers picking, which identifies **one** clicked vertex. This chapter covers what happens once that vertex is selected: how to move it without breaking the overall shape of the mesh around it.

## The problem: moving a vertex in isolation breaks the surface

A [mesh](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) is a set of vertices connected by faces. Moving a single vertex, without touching its neighbors, creates an abrupt spike or dent, disproportionate compared to the rest of the surface: visually, the edit "breaks" the shape rather than evolving it naturally.

```text
Isolated move of the center vertex:          With proportional selection:

      *                                            *
     /|\                                          /~\
    / | \          -- vs --                      /   \
---*--+--*---                              ---*--~~~~~--*---
   (abrupt spike)                          (smoothed transition)
```

## Proportional selection: an influence that decays with distance

**Proportional selection** (a concept popularized by the [Blender](https://www.blender.org) modeling tool) addresses this problem: moving one vertex also influences its neighbors, with an intensity that **decays** based on their distance from the directly selected vertex.

```c
float distance = distance_3d(neighbor_vertex.position, selected_vertex.position);

if (distance < influence_radius) {
    // 1.0 at the center, 0.0 at the radius's edge
    float factor = 1.0f - (distance / influence_radius);
    neighbor_vertex.position += displacement * factor;
}
```

Every vertex inside the influence radius therefore moves in the same direction as the directly selected vertex, but by less the further away it is: the selected vertex itself moves in full (`factor = 1.0`), a neighbor at the edge of the radius barely moves at all (`factor` close to `0.0`).

| Parameter | Effect |
|---|---|
| Small influence radius | Localized edit, close to an isolated move |
| Large influence radius | Wide, gentle deformation, over an extended area of the mesh |
| Linear decay curve (above) | Simple transition, but with a visible change of slope at the radius's edge |
| Smoothed decay curve (e.g. `smoothstep`) | Smoother transition, with no perceptible change of slope |

> **Pitfall:** an influence radius chosen with no regard for the mesh's actual scale. On a tiny object, a radius meant for a huge object engulfs the entire mesh (everything moves almost uniformly); on a huge object, the same radius can barely affect any neighbor at all (back to an isolated move).
>
> **Best practice:** express the influence radius relative to the edited object's size (for example, a percentage of its bounding box), rather than as a fixed absolute value.

## Compacting a mesh: removing the vertices no face uses

A [`.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) file can declare vertices (`v`) that no face (`f`) references: **isolated vertices**. Invisible on screen, they still count in the **bounding box** calculation, the smallest axis-aligned box that contains every vertex. The program uses that box to place the **pivot** (the point the object rotates around, here the center of the box) and to [frame the camera](/?c=fondamentaux&s=graphisme&p=matrices-et-camera).

```text
With the isolated vertex D:       Without D:
+----------------------+          +-------+
|  A---B             D |          | A---B |
|   \ /                |          |  \ /  |
|    C                 |          |   C   |
+----------------------+          +-------+
off-center pivot, small           correct pivot
off-center object                 and framing
```

The fix is to **compact** the mesh: keep only the vertices that are used, then renumber the faces. Faces designate a vertex by its **index** (its position in the vertex array): removing vertex #2 shifts all the following ones, so every index greater than 2 must be corrected.

### A renumbering table, filled in three passes

The **renumbering table** (`remap`) maps each vertex's old index to its new index, or to `-1` if it disappears.

```c
typedef struct {
    float position[3];
    float uv[2];        // texture coordinates: they travel with the vertex
} Vertex;

// Removes unused vertices in place; returns the number kept,
// -1 if allocation fails, -2 if a face index is out of the array.
long compact_mesh(Vertex *vertices, size_t vertex_count,
                  unsigned *indices, size_t index_count) {
    long *remap = malloc(vertex_count * sizeof *remap);

    if (remap == NULL)
        return -1;
    for (size_t i = 0; i < vertex_count; i++)
        remap[i] = -1;
    for (size_t k = 0; k < index_count; k++) {
        if (indices[k] >= vertex_count) {
            free(remap);
            return -2;
        }
        remap[indices[k]] = 0;          // mark as "used"
    }
    long next = 0;
    for (size_t i = 0; i < vertex_count; i++) {
        if (remap[i] < 0)
            continue;
        vertices[next] = vertices[i];   // next <= i: slot already read
        remap[i] = next++;
    }
    for (size_t k = 0; k < index_count; k++)
        indices[k] = remap[indices[k]];
    free(remap);
    return next;
}
```

| Pass | Role |
|---|---|
| 1. Mark | For each face index, turn `remap[index]` from `-1` into "used" |
| 2. Move | Walk the vertices in order; each used vertex gets the next new index and is copied to its new place |
| 3. Renumber | Replace each face index with `remap[index]` |

- **No second array**: the move happens in place, because a vertex never moves up (`next <= i`). The destination slot has therefore already been read, or was unused.
- **Index and UVs together**: the UVs (texture coordinates, see [`v/vt/vn` indexing](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#combined-vvtvn-indexing-and-uv-seams)) travel with the vertex in the same structure. If the file keeps them in a separate array, that array has its own renumbering table, applied to the same faces.
- **Validate before renumbering**: an index outside the array would write outside `remap`. The function rejects it with a dedicated error code instead of assuming it is valid.

> **Test pitfall:** a checker that reads triangles by vertex number fails after renumbering, since the numbers have changed. Compare triangles by **coordinates**, not by index. Also beware: two distinct vertices whose coordinates round to the same `float` make that index ambiguous.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Moving a vertex in isolation visually breaks a mesh's surface. Proportional selection also moves the neighbors, with an intensity that decays based on their distance from the selected vertex, within an influence radius. A vertex that no face uses skews the bounding box, hence the pivot and the camera framing: compact the mesh. |
| **Tools you can use** | A 3D distance between vertices, a linear or smoothed (`smoothstep`) falloff factor based on that distance. A renumbering table (`remap`) filled in three passes (mark, move in place, renumber the faces). |
| **Pitfalls to avoid** | A fixed influence radius, unrelated to the edited object's actual scale. Renumbering without validating face indices, or comparing triangles by index after compacting. |
| **Best practices** | Express the influence radius relative to the object's size rather than as an absolute value. A smoothed decay curve for a transition with no visible change of slope at the radius's edge. Renumber faces and UVs together; compare triangles by coordinates. |
