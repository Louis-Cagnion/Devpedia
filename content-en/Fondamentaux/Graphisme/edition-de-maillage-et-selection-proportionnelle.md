---
order: 5
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

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Moving a vertex in isolation visually breaks a mesh's surface. Proportional selection also moves the neighbors, with an intensity that decays based on their distance from the selected vertex, within an influence radius. |
| **Tools you can use** | A 3D distance between vertices, a linear or smoothed (`smoothstep`) falloff factor based on that distance. |
| **Pitfalls to avoid** | A fixed influence radius, unrelated to the edited object's actual scale. |
| **Best practices** | Express the influence radius relative to the object's size rather than as an absolute value. A smoothed decay curve for a transition with no visible change of slope at the radius's edge. |
