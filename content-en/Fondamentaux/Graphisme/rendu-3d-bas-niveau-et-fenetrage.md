---
order: 1
---

# Low-level 3D rendering and windowing: raycasting à la Wolfenstein

Before a game engine takes over opening a window and drawing a 3D scene on a program's behalf, a program has to do it itself: ask the operating system for a display area, then write directly into it the pixels that make up the image. This chapter covers that low-level step, with **raycasting**, the technique that made *Wolfenstein 3D* (1992) possible on hardware far too slow for real 3D computation.

## Windowing: getting an area to draw into

**Opening a window** doesn't happen automatically: the program must ask the operating system for a display area, receive events from it (a key pressed, the mouse moved, the window closed), and hand it the image to display at each step. A windowing library handles this low-level exchange with the system:

| Library | Role |
|---|---|
| **X11** (*X Window System*) | The standard windowing system on Linux: manages windows, keyboard/mouse events, and on-screen display |
| **MinilibX** | A small library built on top of X11, which simplifies its use for a program that only needs to create a window and draw pixels to it one by one |

An **event loop** runs continuously while the window stays open: on each pass, it checks whether a key was pressed or the mouse moved, updates the program's state accordingly, then redraws the image.

```text
While the window is open:
  1. Check events (key pressed, mouse moved, close requested)
  2. Update the game state (player position, view direction)
  3. Recompute the image to display
  4. Send the image to the screen
```

> **Pitfall:** redrawing the entire image on every pass even when nothing has changed. This is the same principle already seen in [avoiding redundant recomputation](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant): only reprocess what actually changed, applied here to image rendering rather than a server-side computation.
>
> **Best practice:** only redraw when the game state has actually changed (a key pressed, the mouse moved), rather than unconditionally on every loop pass.

## The problem: simulating 3D without real 3D

Computing a full 3D scene (every surface, every viewing angle) demanded, in the early 1990s, more computing power than any consumer computer had. Raycasting works around the problem: rather than modeling a real 3D volume, it simulates depth from a **2D** map (a top-down floor plan, like a maze), computing only the distance to the nearest wall in each direction being looked at.

```text
2D map (top-down view):             Final render (player's view):

# # # # # # #                        The near wall looks tall,
#           #                        the far wall looks short:
#     @     #    -- raycasting -->   the same distance information,
#           #                        translated into wall height
# # # # # # #                        on screen.
```

## Casting one ray per pixel column

For every vertical column of pixels on screen (an 800-pixel-wide image needs 800 calculations), the program casts an imaginary **ray** from the player's position, in the direction matching that column, and advances that ray across the 2D map until it hits a wall:

```text
Player position: (x, y)
Ray direction: player's viewing angle + offset for this column

Advance the ray step by step across the map:
  while the current cell isn't a wall:
    move the ray forward by a small step
  -> distance traveled = distance to the wall, in that direction
```

Once that distance is known, the wall height to draw on screen for that column follows directly: the shorter the distance, the taller the wall appears (near), the longer the distance, the shorter it appears (far) — exactly like a real object shrinking with distance.

> **Pitfall:** advancing the ray in fixed steps that are too large, which can make it "jump" over a thin wall without ever detecting the collision. A step that's too small, on the other hand, slows down the computation for every column of the image.
>
> **Best practice:** use a grid-stepping algorithm (*DDA*, *Digital Differential Analyzer*) that jumps directly from one grid cell to the next instead of advancing in small fixed steps, guaranteeing no wall is missed while staying fast.

## What raycasting doesn't compute

Classic raycasting only handles a single height level per column: it can't represent real relief (stairs, a bridge over a corridor) or look realistically up or down, unlike a real 3D engine that computes a full volume. It's this deliberate trade-off — sacrificing geometric realism for computational speed — that made the technique playable on the hardware of the time, and that still makes it a useful first project today for understanding 3D rendering without the complexity of a full engine.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A windowing library (X11, MinilibX) gives access to a display area and to keyboard/mouse events through a loop that runs continuously. Raycasting simulates 3D by casting one ray per pixel column onto a 2D map, the distance to the hit wall determining its height on screen. |
| **Usable tools** | MinilibX/X11 for windowing on Linux. A DDA algorithm to advance the ray efficiently across the map's grid. |
| **Pitfalls to avoid** | Redrawing the whole image every pass with no condition. Advancing the ray in fixed steps that are too large, risking missing a thin wall. |
| **Best practices** | Only redraw after an actual change in the game state. Use a DDA rather than small fixed steps to advance the ray. |
