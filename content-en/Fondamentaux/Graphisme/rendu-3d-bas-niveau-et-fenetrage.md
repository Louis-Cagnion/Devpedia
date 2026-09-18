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

## Writing directly into the image's memory buffer

MinilibX offers two ways to set a pixel in an image: `mlx_pixel_put()`, one function call per pixel, or direct access to the image's memory buffer via `mlx_get_data_addr()`. For an image redrawn entirely on every frame (like a raycasting render), the second is noticeably faster: a function call per pixel has a non-negligible cost, multiplied by hundreds of thousands of pixels per image.

`mlx_get_data_addr()` returns the memory address of the image's first pixel, along with three pieces of information needed to compute a given pixel's address: `line_length` (the number of bytes per image row), `bits_per_pixel` (a pixel's size in bits, usually 32), and `endian` (byte order).

```c
int line_length, bits_per_pixel, endian;
char *buffer = mlx_get_data_addr(image, &bits_per_pixel, &line_length, &endian);

void putPixel(char *buffer, int line_length, int bits_per_pixel, int x, int y, int color)
{
    char *address = buffer + (y * line_length) + (x * (bits_per_pixel / 8));

    *(unsigned int *)address = color; // writes the pixel's 4 bytes directly
}
```

> **Pitfall:** forgetting that `bits_per_pixel` is expressed in bits, not bytes: dividing by 8 (`bits_per_pixel / 8`) is essential to get the number of bytes to offset per pixel, otherwise the memory access targets the wrong spot in the buffer.
>
> **Best practice:** compute `line_length` and `bits_per_pixel` once (at startup), then only recompute the pixel's address (`x`, `y` variable) on every write: those are the only values that change from one pixel to the next.

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

Once that distance is known, the wall height to draw on screen for that column follows directly: the shorter the distance, the taller the wall appears (near), the longer the distance, the shorter it appears (far), exactly like a real object shrinking with distance.

> **Pitfall:** advancing the ray in fixed steps that are too large, which can make it "jump" over a thin wall without ever detecting the collision. A step that's too small, on the other hand, slows down the computation for every column of the image.
>
> **Best practice:** use a grid-stepping algorithm (*DDA*, *Digital Differential Analyzer*) that jumps directly from one grid cell to the next instead of advancing in small fixed steps, guaranteeing no wall is missed while staying fast (detailed below).

## The DDA algorithm: stepping grid cell by grid cell

The previous approach (advancing the ray "step by step") works, but wastes computation: a small step can land in the same map cell several times before reaching the next one. **DDA** advances directly from grid cell to grid cell, computing at each step the distance to the next vertical grid line and to the next horizontal grid line, then picking whichever is closer:

```text
At each DDA step:
  distance_x = distance to the next vertical grid line
  distance_y = distance to the next horizontal grid line
  if distance_x < distance_y:
    advance to that vertical line (side of the potential wall hit: X)
  else:
    advance to that horizontal line (side of the potential wall hit: Y)
  repeat until a wall is hit
```

This choice (vertical or horizontal) also records which **side** a wall is eventually hit on (north/south or east/west), information reused later to pick the right texture or slightly darken one side relative to the other.

## Correcting the fisheye effect with the camera plane vector

Each ray is built from two vectors: the player's **direction** (`direction_x`/`direction_y`) and a **camera plane** vector, perpendicular to the direction, representing the width of the field of view. A factor `cam_x`, sweeping from `-1` (left edge of the screen) to `1` (right edge), combines both to get the exact ray direction for each column:

```text
ray_direction = player_direction + camera_plane * cam_x
```

> **Pitfall:** using the real Euclidean distance between the player and the ray's impact point to compute the wall height on screen. Rays for the side columns travel a longer straight-line distance than the center one to reach the same wall, which would visually bend straight walls near the edges of the screen: the **fisheye** effect.
>
> **Best practice:** use the **perpendicular** distance to the player's direction (the distance projected onto the direction axis, rather than the straight-line distance) to compute the wall height. This correction removes the fisheye effect with no extra trigonometric computation: it's a direct byproduct of building the ray from the camera plane vector.

## Mapping a texture onto a raycasted wall

Once the ray's impact point is known, its **fractional** position along the hit wall (`wall_x`, the decimal part of the impact coordinate) directly gives the horizontal coordinate to read in the texture (`tex_x`):

```text
wall_x = fractional part of the impact point on the wall
tex_x  = wall_x * texture_width
```

Vertically, a step (`step = texture_height / wall_height_on_screen`) advances through the texture one screen pixel at a time: this scale factor automatically adapts to distance, a near wall (tall on screen) moves through the texture slowly, a far wall (short on screen) stretches it. The side hit by the ray (recorded by the DDA above) determines which texture to use (north/south/east/west).

## Displaying a sprite in a raycasted scene

A **sprite** (a 2D object, like a character or a pickup item) has no volume in the raycasted world: it must be transformed to appear at the right position and size on screen, always facing the camera (a *billboard*, like an advertising panel always turned toward the viewer).

The sprite's position relative to the player is transformed by the inverse of the camera matrix (built from the direction and camera plane already used for the rays); this computation directly gives its horizontal position on screen and its apparent distance (hence its size).

> **Pitfall:** drawing a sprite without checking what has already been drawn at that spot on screen. A sprite farther away than a wall that hides it should stay invisible, otherwise it appears through walls.
>
> **Best practice:** keep, for every screen column, the distance of the wall already drawn by raycasting (a **z-buffer**, literally a "depth buffer"); before drawing a sprite pixel, compare its distance against the one already recorded for that column, and only draw it if it's closer. This depth test is the same principle, simplified to one dimension (one value per column rather than per pixel), as the z-buffer used in every modern 3D engine.

## Simulating an infinite mouse

To rotate the camera with the mouse without the cursor ever leaving the window (as in a first-person shooter), a simple technique **recenters** the cursor as soon as it gets close to a screen edge:

```c
void onMouseMove(int x, int y)
{
    if (x <= 10) {
        mlx_mouse_move(window, screen_width - 11, y); // moves it near the opposite edge
    } else if (x >= screen_width - 10) {
        mlx_mouse_move(window, 11, y);
    }
    // ... use x - last_x to rotate the camera ...
}
```

Only the **relative** movement between two successive positions (`x - last_x`) is used to rotate the camera: repositioning the cursor itself is just a trick to never be blocked by the window's edge, invisible to the user since no rotation is computed from the absolute position.

> **Note:** this approach (teleporting the cursor) differs from the **pointer lock** used by web browsers for the same need, which fully hides and locks the cursor instead of moving it: two different solutions to the same problem.

## What raycasting doesn't compute

Classic raycasting only handles a single height level per column: it can't represent real relief (stairs, a bridge over a corridor) or look realistically up or down, unlike a real 3D engine that computes a full volume. It's this deliberate trade-off (sacrificing geometric realism for computational speed) that made the technique playable on the hardware of the time, and that still makes it a useful first project today for understanding 3D rendering without the complexity of a full engine.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | A windowing library (X11, MinilibX) gives access to a display area and to keyboard/mouse events through a loop that runs continuously. Raycasting simulates 3D by stepping a ray per pixel column (DDA) across a 2D map, the perpendicular distance to the hit wall determining its height on screen without a fisheye effect. |
| **Usable tools** | MinilibX/X11 for windowing on Linux. `mlx_get_data_addr()` to write directly into the image buffer rather than pixel by pixel. DDA to advance the ray efficiently; a per-column z-buffer to correctly occlude sprites behind a wall. |
| **Pitfalls to avoid** | Redrawing the whole image every pass with no condition. Advancing the ray in fixed steps that are too large, risking missing a thin wall. Forgetting to divide `bits_per_pixel` by 8 when writing into the buffer. Using the Euclidean distance instead of the perpendicular one (fisheye effect). Drawing a sprite without a depth test. |
| **Best practices** | Only redraw after an actual change in the game state. Use a DDA rather than small fixed steps to advance the ray. Recenter the cursor near the edges for an infinite mouse, relying only on relative movement. |
