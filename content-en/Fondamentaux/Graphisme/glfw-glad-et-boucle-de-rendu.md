---
order: 3
---

# Opening a modern OpenGL window: GLFW, GLAD and the render loop

The [chapter on raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) drew pixels one by one, with no graphics card. A modern 3D engine instead delegates the computation to the graphics card itself, through an API such as **OpenGL**. Before it can send it a single triangle (see the [.obj format](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)), you first need a window, a graphics context, and a loop that displays one image after another. This chapter covers that step, with two libraries that are near-universal in this context: **GLFW** (windowing) and **GLAD** (loading OpenGL functions).

## GLFW: the window and its OpenGL context

[GLFW](https://www.glfw.org) plays a role for OpenGL close to what MinilibX/X11 played in the previous chapter: asking the operating system for a window, receiving keyboard/mouse events. But GLFW also creates an **OpenGL context**: the space where the graphics card keeps all its state (loaded textures, active shader program...) for that specific window.

```c
GLFWwindow *window = glfwCreateWindow(800, 600, "Title", NULL, NULL);
glfwMakeContextCurrent(window);   // activates this context for every following OpenGL call
```

## Loading modern OpenGL functions: GLAD

On most systems, only a small, old, fixed part of OpenGL is directly linked into the program at compile time. **Modern** functions must be requested from the graphics driver at runtime, one at a time, via `glfwGetProcAddress()`: an **OpenGL Loading Library** such as [GLAD](https://glad.dav1d.de) automates this step for an entire chosen OpenGL version, rather than calling `glfwGetProcAddress()` by hand for every function used.

```c
if (!gladLoadGLLoader((GLADloadproc) glfwGetProcAddress)) {
    fprintf(stderr, "Failed to load OpenGL\n");
    exit(1);
}
```

> **Note:** GLAD must be called **after** `glfwMakeContextCurrent()`, never before: with no active context, there is nothing to resolve the requested functions against.

## The GLAD file: generated, then "vendored"

Unlike a classic system library, GLAD isn't installed through a package manager: its [online generator](https://glad.dav1d.de) produces a custom `.c`/`.h` pair, for the target OpenGL version and system. This generated file is then committed directly into the project's repository, a practice called **vendoring**.

> **Pitfall:** an `-I` pointed at the wrong folder level for this generated file breaks the build exactly like for any other header (see [`#include` and `-I`](/?c=langages&s=c&p=headers) for the precise resolution mechanism).
>
> **Best practice:** vendoring avoids a dependency on an external package manager and guarantees everyone compiles against exactly the same generated file, at the cost of committing code you didn't write yourself: reserve it for a case like this one (a file generated once and for all, never hand-edited afterward), not for a library that changes regularly.

## Double buffering: avoiding a half-drawn image

Drawing directly to the screen, pixel by pixel, exposes a problem: if the screen refreshes while the image is only half drawn, the user briefly sees an inconsistent image (*tearing*). **Double buffering** avoids this by always drawing into an invisible buffer, swapped with the displayed buffer only once the image is complete:

```text
Front buffer (shown on screen)       Back buffer (being drawn)
        |                                      |
        |          glfwSwapBuffers()           |
        +---------------- swap ---------------->
        (the back buffer becomes the front buffer, all at once)
```

```c
// swaps the two buffers, never a direct pixel-by-pixel draw to the screen
glfwSwapBuffers(window);
```

## The render loop

Like the previous chapter's event loop, an OpenGL render loop runs as long as the window stays open, generally in this fixed shape:

```c
while (!glfwWindowShouldClose(window)) {
    glfwPollEvents();                              // 1. collect events (keyboard, mouse...)
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);  // 2. clear the previous image
    drawScene();                                   // 3. draw the new image (back buffer)
    // 4. show it all at once (double buffering)
    glfwSwapBuffers(window);
}
```

> **Pitfall:** forgetting `glClear()` before redrawing. Without clearing, every new image piles on top of the previous ones instead of replacing them, leaving a visual trail.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | GLFW creates the window and its OpenGL context; GLAD then loads the modern OpenGL functions via `glfwGetProcAddress()`. Double buffering (`glfwSwapBuffers()`) avoids a half-drawn image being shown. A render loop repeats: events, clear, draw, buffer swap. |
| **Tools you can use** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`. |
| **Pitfalls to avoid** | Calling GLAD before `glfwMakeContextCurrent()`. Pointing `-I` at the wrong folder level for GLAD's generated headers. Forgetting `glClear()` before redrawing. |
| **Best practices** | Vendor a file generated once and for all (like GLAD's) rather than depending on it at every build; reserve this practice for files that don't change regularly. |
