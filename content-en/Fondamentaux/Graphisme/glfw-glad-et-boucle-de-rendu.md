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

## Delta time: a speed that does not depend on the machine

One turn of the render loop produces one image (a *frame*). The number of images per second, the **FPS** (*frames per second*), depends on the machine: 30 on a modest computer, 144 on a fast screen. If an object moves by a fixed distance at every turn of the loop, its real speed therefore follows the FPS:

```c
position += 0.1;   // 0.1 unit (the length measure of the scene) per image: the speed depends on the number of images
```

| Machine FPS | Images in 1 second | Distance covered in 1 second |
|---|---|---|
| 30 | 30 | 30 × 0.1 = 3 units |
| 60 | 60 | 60 × 0.1 = 6 units |
| 144 | 144 | 144 × 0.1 = 14.4 units |

The **delta time** is the time elapsed between the previous image and the current one, in seconds (for example 0.0069 s at 144 FPS). Multiplying every movement by this duration makes the speed independent of the FPS: speed is expressed in units **per second**, and each image only advances by the fraction of a second it lasted.

```c
double last_instant = glfwGetTime();   // double = decimal number; here, seconds elapsed since GLFW was initialized
double speed = 5.0;                    // 5 units per second, whatever the machine

while (!glfwWindowShouldClose(window)) {
    double now = glfwGetTime();            // instant of this image
    double delta = now - last_instant;    // duration of the previous image, in seconds
    last_instant = now;                    // remember it for the next turn

    position += speed * delta;             // 144 FPS: 5 × 0.0069; 30 FPS: 5 × 0.033
    // ... events, clear, draw, glfwSwapBuffers() as above
}
```

> **Pitfall:** refreshing the delta time only at regular intervals (for example "only if 0.01 s have elapsed"). Between two refreshes, the stale value is applied at every image: at 144 FPS (an image lasts 0.0069 s, less than that threshold), the movement is added more often than time passes and everything goes too fast (about 1.5 times in one case encountered). The delta time is recomputed at **every** image.
>
> **Pitfall:** after a pause (window dragged, program suspended), the first delta can be several seconds and throw the object very far at once. The value is then capped, for example `if (delta > 0.1) delta = 0.1;`.

### One timer per purpose

A **timer** here means a variable that remembers an instant (like `last_instant` above). When the same timer serves **two purposes** (measuring the duration of a frame **and** spacing the steps of a fade, that is, a gradual opacity transition), one of the two is wrong. The typical case:

```c
double now = glfwGetTime();

if (now - prev_time >= FADE_STEP)   /* fade limiter: one step every FADE_STEP */
{
	frame_time = now - prev_time;   /* since the last STEP, not the last frame */
	prev_time = now;
	alpha += 0.05;                  /* alpha: opacity from 0 (transparent) to 1 (opaque) */
}
position += speed * frame_time;     /* used on EVERY frame, refreshed on every STEP */
```

Here `FADE_STEP` is 0.016 s. `frame_time` is only refreshed at each fade step, but it is used on every frame: the more frames the machine produces between two steps, the more the movement is multiplied. Measured on a one-second simulation, speed 5 units per second (so the right distance is 5):

| FPS | Distance with a shared timer | With one timer per purpose |
|---|---|---|
| 30 or 60 | 5.0 | 5.0 |
| 144 | 14.8 (3 times too much) | 5.0 |
| 1,000 | 79.0 (16 times too much) | 5.0 |
| 2,500 | 199.7 (**40 times** too much) | 5.0 |

On a 60 Hz screen with vsync, the defect is invisible (a frame lasts longer than the fade step): it appears on a fast screen or without vsync. The fix comes down to three rules: Measured on a real GLFW loop (144 Hz screen, a movement of 5 units per second for 1 s): with vsync (147 frames) the shared timer gives **14.70**; without vsync (18,037 frames) **1,434.21**, 287 times too much; with one timer per use, 4.98 to 5.00 in every case.

| Rule | What it changes |
|---|---|
| **One timer per purpose** | The frame duration is recomputed on every frame; nothing else touches it |
| **Cap** that duration (`MAX_FRAME_TIME`, e.g. 0.1 s) | A pause no longer hurls the object away (see the previous pitfall) |
| **Express a fade by its duration**, not by a number of steps | `alpha = elapsed / FADE_DURATION` (0.5 s here), so the same time on every machine; the limiter becomes useless |

```c
double now = glfwGetTime();
double frame_time = now - last_frame;     /* frame duration, recomputed every loop */

last_frame = now;
if (frame_time > MAX_FRAME_TIME)          /* after a pause */
	frame_time = MAX_FRAME_TIME;
position += speed * frame_time;
fade_elapsed += frame_time;               /* the fade accumulates real time */
alpha = fminf(fade_elapsed / FADE_DURATION, 1.0f);   /* fminf: caps at 1 */
```

> **Pitfall (measuring at a single rate):** a sustained movement (held key, continuous rotation) that looks right at 60 FPS can be wrong at another rate. Measure it at **several rates**: with vsync, then without. Without vsync, Mesa is set with the [environment variable](/?c=shells&s=bash&p=variables-denvironnement) `vblank_mode=0` and the NVIDIA driver with `__GL_SYNC_TO_VBLANK=0` (`vblank_mode=0 ./program`). The angle or distance covered after one second must be the same in every case. Measured on a laptop with two cards: `vblank_mode=0` does disable Mesa's vsync (17,447 frames in 1 s instead of 147), but `__GL_SYNC_TO_VBLANK=0` had **no effect** when rendering is offloaded to the NVIDIA card (`__NV_PRIME_RENDER_OFFLOAD=1`: 169 frames instead of 147); `glfwSwapInterval(0)` in the program works everywhere (7,556 frames with NVIDIA, 17,244 with Mesa). Another limit to the equality of distances: a frame longer than `MAX_FRAME_TIME` is capped, so the extra time is lost (a stall of about 0.3 s when the NVIDIA driver started gave 3.81 instead of 5).

## Vertical synchronization (vsync)

The screen refreshes at a fixed frequency, expressed in hertz (Hz, refreshes per second): 60 Hz, 144 Hz... With no rule, the render loop runs as fast as possible, far beyond what the screen can show: images are wasted, the graphics card heats up, and the buffer swap can land in the middle of a refresh (*tearing*, seen above). **Vertical synchronization** (*vsync*) makes `glfwSwapBuffers()` wait until the screen's next refresh:

```c
glfwMakeContextCurrent(window);   // the context must already be active
glfwSwapInterval(1);              // 1 = wait for 1 refresh per swap (vsync); 0 = do not wait
```

| Setting | FPS obtained | Effect |
|---|---|---|
| `glfwSwapInterval(1)` | equal to the screen frequency (60 on a 60 Hz screen) | no tearing, graphics card spared |
| `glfwSwapInterval(0)` | as high as the machine allows | tearing possible, useful to measure performance |

> **Best practice:** never rely on vsync to regulate speed. The graphics driver (the software that lets the system talk to the graphics card) or the user can force it off, and the FPS change from one screen to another: only the delta time guarantees the same speed everywhere. Vsync regulates the display, the delta time regulates the movement.

## Graphics card limits and `glGetError`

Every graphics card has its **limits**: maximum size of a texture, maximum size of the **drawing area** (the *viewport*, the rectangle of the window where OpenGL writes pixels)... They change from one machine to another: a program that works on its author's machine can fail on someone else's, without the code having changed. We **read** them instead of assuming them, with `glGetIntegerv(constant, &value)` (the function that reads an integer from OpenGL's state; `GLint` is OpenGL's integer type, 32 bits on every machine).

| Constant | What it gives | If exceeded |
|---|---|---|
| `GL_MAX_TEXTURE_SIZE` | maximum side, in pixels, of a [texture](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#textures-an-image-stuck-on-the-surface) | sending the image is refused, the texture is unusable (read as black) |
| `GL_MAX_VIEWPORT_DIMS` | **two** integers: maximum width and height of the drawing area | the specification guarantees nothing: drawing truncated depending on the driver |

```c
/* True if a width x height image fits in a texture on this card; message otherwise. */
static int texture_fits(int width, int height)
{
	GLint max_size = 0;

	if (width <= 0 || height <= 0)                 /* degenerate dimensions: a cause of its own */
	{
		fprintf(stderr, "image of %d x %d: zero or negative dimensions\n", width, height);
		return 0;
	}
	glGetIntegerv(GL_MAX_TEXTURE_SIZE, &max_size); /* one integer; an active context is required */
	if (width > max_size || height > max_size)
	{
		fprintf(stderr, "image %d x %d too large: this card accepts %d at most per side\n",
			width, height, max_size);
		return 0;
	}
	return 1;
}

GLint max_viewport[2] = {0, 0};
glGetIntegerv(GL_MAX_VIEWPORT_DIMS, max_viewport); /* here two values: an array of 2 integers */
```

> **Pitfall:** `glGetIntegerv`, like every OpenGL function, only works **after** [`glfwMakeContextCurrent()` and loading GLAD](#loading-modern-opengl-functions-glad): before that, the function pointer is null and the program crashes.

**OpenGL almost never reports an error through a return value.** A refused call (size too large, wrong state) does not crash and prints nothing: it raises an internal **error flag**, which the program reads with `glGetError()`. This function returns a code and resets the flag to zero; `GL_NO_ERROR` (0) means "nothing pending".

| Code | Usual meaning |
|---|---|
| `GL_INVALID_ENUM` | unknown constant passed to a function |
| `GL_INVALID_VALUE` | numeric value out of range (size too large, negative) |
| `GL_INVALID_OPERATION` | call not allowed in the current state (wrong order, object not bound) |
| `GL_OUT_OF_MEMORY` | the card (or the driver) is out of memory |
| `GL_INVALID_FRAMEBUFFER_OPERATION` | drawing to an incomplete framebuffer |

Errors **pile up** and `glGetError()` returns **one per call**: we loop until it is empty, otherwise the error read dates from an earlier call, not the latest one.

```c
/* Readable name of an OpenGL error code. */
static const char *gl_error_name(GLenum err)
{
	switch (err)
	{
	case GL_INVALID_ENUM: return "GL_INVALID_ENUM";
	case GL_INVALID_VALUE: return "GL_INVALID_VALUE";
	case GL_INVALID_OPERATION: return "GL_INVALID_OPERATION";
	case GL_OUT_OF_MEMORY: return "GL_OUT_OF_MEMORY";
	case GL_INVALID_FRAMEBUFFER_OPERATION: return "GL_INVALID_FRAMEBUFFER_OPERATION";
	default: return "unknown code";
	}
}

/* Reads and prints every pending error, with the step `where`; returns how many. */
static int check_gl_errors(const char *where)
{
	int count = 0;
	GLenum err;

	while ((err = glGetError()) != GL_NO_ERROR)   /* each read removes one error from the pile */
	{
		fprintf(stderr, "OpenGL: %s during '%s'\n", gl_error_name(err), where);
		count++;
	}
	return count;
}
```

Usage: `check_gl_errors("glTexImage2D");` right after the suspect call, to name the faulty step (a `check_gl_errors("before")` placed beforehand empties the old content).

> **Pitfall:** in a render loop, the same problem would repeat on **every frame** (60 messages per second drowning everything else). Report each cause **only once** (a bounded list of codes already shown), or check only at startup and in debug mode.

### Querying the graphics driver and the screen

The **driver** (the manufacturer's software that makes OpenGL talk to the card) can tell who it is and what it accepts. `glGetString` returns a text, `glGetIntegerv` an integer:

| Query | What it gives |
|---|---|
| `glGetString(GL_VENDOR)` | the driver's manufacturer |
| `glGetString(GL_RENDERER)` | the card's name (and often the driver's) |
| `glGetString(GL_VERSION)` | the OpenGL version provided, followed by the driver |
| `glGetIntegerv(GL_MAX_VERTEX_ATTRIBS, ...)` | the maximum number of attributes per vertex (position, normal...) |
| `glGetIntegerv(GL_MAX_GEOMETRY_OUTPUT_VERTICES, ...)` | the maximum of a [geometry shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#shaders-the-graphics-card-s-programs)'s `max_vertices` |
| `glGetIntegerv(GL_MAX_ELEMENTS_INDICES, ...)` | a **hint** (number of indices recommended per draw call), never a limit: exceeding it produces no error, only a possibly slower draw |

```c
/* Prints OpenGL vendor, card and version; returns 0, or -1 if the driver does not answer. */
static int print_gl_info(void)
{
	const char *vendor = (const char *)glGetString(GL_VENDOR);      /* GLubyte * converted to text */
	const char *renderer = (const char *)glGetString(GL_RENDERER);
	const char *version = (const char *)glGetString(GL_VERSION);

	if (!vendor || !renderer || !version)          /* NULL: no active context, or constant refused */
	{
		fprintf(stderr, "glGetString returned NULL: no active context, or constant refused\n");
		return -1;
	}
	printf("Vendor: %s\nCard: %s\nOpenGL: %s\n", vendor, renderer, version);
	return 0;
}
```

**The card's memory has no standard query.** Only **extensions** (optional functions, specific to a manufacturer, which the driver may or may not provide) give it: `GL_NVX_gpu_memory_info` on NVIDIA, `GL_ATI_meminfo` on AMD. `glfwExtensionSupported("GL_NVX_gpu_memory_info")` tells whether the driver has it. Without it, the only sign of a memory shortage is `GL_OUT_OF_MEMORY`, to be read with `glGetError()` (see above).

**The screen is asked to GLFW**, not to OpenGL: a window larger than the screen is partly out of the user's view.

```c
/* True (1) if a width x height window fits on the primary screen, 0 if not, -1 if the screen is unknown. */
static int window_fits_screen(int width, int height)
{
	GLFWmonitor *monitor = glfwGetPrimaryMonitor();   /* NULL: no screen detected */
	const GLFWvidmode *mode = monitor ? glfwGetVideoMode(monitor) : NULL;   /* NULL on failure */

	if (!mode)
	{
		fprintf(stderr, "primary screen not found: window size not checked\n");
		return -1;
	}
	if (width > mode->width || height > mode->height)   /* mode->width and ->height: screen size */
	{
		fprintf(stderr, "window %d x %d larger than the screen (%d x %d)\n",
			width, height, mode->width, mode->height);
		return 0;
	}
	return 1;
}
```

> **Pitfall:** `glfwGetVideoMode` gives the size in **screen coordinates**, which differ from pixels on a high-density screen (HiDPI, for example a screen that shows 2 pixels per unit); `glfwGetFramebufferSize` gives the window's size in pixels. With several screens, `glfwGetPrimaryMonitor` only designates the primary screen: the window may open on another one.

---

## How OpenGL knows the machine: from the program to the hardware

OpenGL is not a program: it is a **specification**, a document (maintained by the [Khronos](https://www.khronos.org/opengl/) consortium) that describes each function, its parameters and its behavior. No code ships with that document: each manufacturer writes its own inside its **driver** (the software that translates OpenGL calls into orders its card understands). Hence `glGetString(GL_VENDOR)` (see above), and the same program behaving differently from one machine to another.

On Linux, a call such as `glClear` goes through these layers:

```
Your program                 calls glClear, glDrawArrays...
      │  GLAD and glfwGetProcAddress find the address of each function
      ▼
Access library               libGL.so.1 (GLVND): chooses which driver to use
      ▼
OpenGL driver                Mesa (AMD, Intel) or NVIDIA's proprietary driver
      ▼
Linux kernel                 kernel driver (amdgpu, i915, nvidia...) through the DRM
      ▼
Hardware                     the card, plugged into the PCI bus
```

| Layer | Role |
|---|---|
| **Access library** (`libGL`) | Single entry point. **[GLVND](https://github.com/NVIDIA/libglvnd)** (*GL Vendor-Neutral Dispatch*) lets several drivers coexist and picks the one that matches the card in use. |
| **OpenGL driver** | Actually runs the functions. **[Mesa](https://www.mesa3d.org/)** is the open-source driver (`radeonsi` for AMD, `iris` for Intel, `llvmpipe` to draw with the processor when there is no card); NVIDIA ships its own proprietary driver. |
| **Kernel driver** | The [kernel](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs#user-space-vs-kernel-space) (the core of the system, the only part allowed to talk to the hardware) has one driver per family of cards. The **[DRM](https://docs.kernel.org/gpu/drm-uapi.html)** (*Direct Rendering Manager*) is the subsystem that lets several programs share the card; it is exposed through files in `/dev/dri`. |
| **Hardware** | The graphics card, plugged into the **PCI** bus (the circuit that connects the motherboard to its expansion cards). |

Each layer can be observed from a [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (`grep` keeps only the lines that contain a pattern; the `|` sends the output of the command on the left to the one on the right: see [redirections and pipes](/?c=shells&s=bash&p=redirections-et-pipes)):

```bash
lspci | grep -iE "vga|3d"              # lspci lists the PCI devices: the graphics card(s)
ls /dev/dri                            # DRM files: cardN (one per card), renderDN (computing without a screen)
lsmod | grep -E "amdgpu|i915|nouveau|nvidia"   # lsmod lists the drivers loaded in the kernel
glxinfo -B | grep -i renderer          # glxinfo (mesa-utils package): the OpenGL driver actually in use
```

`GL_RENDERER` stacks several of these layers in a single text. Typical form under Mesa, which relies on [LLVM](https://llvm.org/) (example values):

```
AMD Radeon RX 6600 (radeonsi, navi23, LLVM 15.0.6, DRM 3.54, 6.1.0-18-amd64)
 │                  │        │       │               │        └ kernel version
 │                  │        │       │               └ DRM version
 │                  │        │       └ LLVM: library that compiles the shaders for the card
 │                  │        └ the card's chip
 │                  └ Mesa driver
 └ name of the card
```

### When there is no card: `llvmpipe`

In a [virtual machine](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos), a [container](/?c=infrastructure-devops&s=docker&p=concepts-de-base), [WSL](https://learn.microsoft.com/en-us/windows/wsl/) without a graphics driver or a remote session, Mesa falls back to `llvmpipe`: the processor draws in place of the card. The program works, but slowly, and `GL_RENDERER` starts with `llvmpipe`. You can force it to simulate a machine without a card, using an **environment variable** (a named setting that the shell passes to the programs it launches, see [environment variables](/?c=shells&s=bash&p=variables-denvironnement)):

```bash
LIBGL_ALWAYS_SOFTWARE=1 ./program      # the variable only applies to this launch
```

### Several graphics cards

A laptop often has an **integrated** card (inside the processor, power-efficient) and a **dedicated** card (powerful). By default the system picks the first; you designate the other with an environment variable, for the duration of one launch:

| Driver | Launch on the dedicated card |
|---|---|
| Mesa (AMD, Intel) | `DRI_PRIME=1 ./program` |
| NVIDIA proprietary | `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia ./program` |

The two cards have neither the same limits (`GL_MAX_TEXTURE_SIZE`...) nor the same OpenGL version: what the program reads at startup depends on the card that created the context.

Measured on a laptop with two cards (integrated AMD, dedicated NVIDIA), with a program that asks for an OpenGL 3.3 "core" context and reads `GL_RENDERER`, `GL_VERSION` and `GL_MAX_TEXTURE_SIZE`:

| Launch | `GL_RENDERER` | `GL_VERSION` | `GL_MAX_TEXTURE_SIZE` |
|---|---|---|---|
| default | `AMD Radeon 680M (radeonsi, rembrandt, LLVM 20.1.2, DRM 3.64, 7.0.0-34-generic)` | `4.6 (Core Profile) Mesa 25.2.8` | 16384 |
| `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia` | `NVIDIA GeForce RTX 3070 Laptop GPU/PCIe/SSE2` | `3.3.0 NVIDIA 595.91.07` | 32768 |
| `LIBGL_ALWAYS_SOFTWARE=1` | `llvmpipe (LLVM 20.1.2, 256 bits)` | `4.5 (Core Profile) Mesa 25.2.8` | 16384 |
| `DRI_PRIME=1` | `llvmpipe (LLVM 20.1.2, 256 bits)` | `4.5 (Core Profile) Mesa 25.2.8` | 16384 |

The card changes everything the program reads, version included (NVIDIA returns the requested version, Mesa the highest it provides). The last line is a trap: `DRI_PRIME=1` assumes the dedicated card also uses a Mesa driver. Here it is proprietary NVIDIA: Mesa cannot load `nvidia-drm` (messages `glx: failed to create dri3 screen` and `failed to load driver: nvidia-drm`) and **falls back to `llvmpipe`** without stopping. Check `GL_RENDERER` rather than believing the dedicated card is in use.

### And on Windows and macOS?

| System | Who provides OpenGL |
|---|---|
| **Linux** | The layers above (GLVND, Mesa or NVIDIA driver, kernel). |
| **Windows** | `opengl32.dll` redirects to the manufacturer's driver, installed with the card's drivers. Without it, Windows falls back to a software version limited to OpenGL 1.1. |
| **macOS** | The system itself provides OpenGL, frozen at version 4.1 and abandoned by Apple. |

> **Pitfall:** a missing or too old driver does not always crash: `glfwCreateWindow` returns `NULL`, or `gladLoadGLLoader` fails, or the version read is lower than expected. Print GLFW's real cause rather than a generic message:

```c
GLFWwindow *window = glfwCreateWindow(800, 600, "scop", NULL, NULL);

if (!window)                                /* driver missing, too old, or requested version not provided */
{
	const char *description = NULL;         /* GLFW text explaining the failure */

	glfwGetError(&description);             /* reads GLFW's last error (description may stay NULL) */
	fprintf(stderr, "cannot create window: %s\n", description ? description : "unknown cause");
	return -1;
}
```

Measured by asking for OpenGL 9.9 (a version that does not exist) under X11: `fenetre impossible : GLX: Failed to create context: BadMatch (invalid parameter attributes)`.

Best practice: test on both cards of a laptop, and with `LIBGL_ALWAYS_SOFTWARE=1`, before saying the program "works everywhere".

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | GLFW creates the window and its OpenGL context; GLAD then loads the modern OpenGL functions via `glfwGetProcAddress()`. Double buffering (`glfwSwapBuffers()`) avoids a half-drawn image being shown. A render loop repeats: events, clear, draw, buffer swap. The delta time (duration of the previous image, via `glfwGetTime()`) makes speeds independent of the FPS; vsync (`glfwSwapInterval(1)`) locks the display to the screen. The card's limits (texture size, drawing area size) change from one machine to another: we read them; OpenGL reports an error only through a flag read with `glGetError()`. `glGetString` identifies the driver; the card's memory has no standard query (extensions); the screen size is asked to GLFW. OpenGL is only a specification: the code comes from the manufacturer's driver (Mesa or NVIDIA on Linux), which talks to the kernel (DRM) and then to the card; with no card, `llvmpipe` draws with the processor; with several cards, an environment variable picks the card. One timer per purpose: a frame's duration is recomputed on every frame, a fade is expressed by its duration. |
| **Tools you can use** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`, `glGetIntegerv` (`GL_MAX_TEXTURE_SIZE`, `GL_MAX_VIEWPORT_DIMS`), `glGetError`, `glGetString`, `glfwGetPrimaryMonitor`/`glfwGetVideoMode`, `glfwExtensionSupported`, `glfwGetError`, `lspci`, `lsmod`, `glxinfo -B`, `LIBGL_ALWAYS_SOFTWARE`, `DRI_PRIME`. |
| **Pitfalls to avoid** | Calling GLAD before `glfwMakeContextCurrent()`. Pointing `-I` at the wrong folder level for GLAD's generated headers. Forgetting `glClear()` before redrawing. Moving an object by a fixed distance per image. Refreshing the delta time only at regular intervals. Leaving a huge delta after a pause. Assuming a card limit instead of reading it, calling `glGetIntegerv` without an active context, reading a single error instead of emptying the pile, repeating the same message on every frame. Printing the result of `glGetString` without testing for `NULL`, taking `GL_MAX_ELEMENTS_INDICES` for a limit, opening a window larger than the screen, mixing up screen coordinates and pixels on a HiDPI screen. Concluding that the program works everywhere after testing a single card, or not printing the cause of a `glfwCreateWindow` failure. One timer for both the frame duration and a fade limiter (movement up to 40 times too fast without vsync), a fade expressed as a number of steps. |
| **Best practices** | Vendor a file generated once and for all (like GLAD's) rather than depending on it at every build; reserve this practice for files that don't change regularly. Express speeds in units per second, recompute the delta time at every image and cap it; never rely on vsync to regulate speed. Compare an image with the card's limit before sending it, with a message that names the image, its dimensions and the limit. Loop on `glGetError()` until `GL_NO_ERROR` and name the step being checked. Log vendor, card and version at startup to recognize the machine behind a bug report; check the requested window size against the screen's. Test on each card of a laptop and with `LIBGL_ALWAYS_SOFTWARE=1`. Measure a sustained movement at several rates, with and without vsync. |
