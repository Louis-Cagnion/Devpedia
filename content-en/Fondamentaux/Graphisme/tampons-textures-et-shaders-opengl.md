---
order: 4
---

# OpenGL buffers, textures and shaders

The [previous chapter](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) opens a window and runs a render loop, but does not draw anything in it yet. To display an object, its data must be sent to the **graphics card** (the processor specialised in drawing, also called the GPU) and it must be given the small programs that turn that data into pixels. This chapter covers the three ingredients: **buffers** (the vertices), **textures** (the images) and **shaders** (the programs).

> **Vocabulary:** in OpenGL, almost everything is an **object**, that is, a resource kept on the graphics card side that the program only handles through an **integer identifier** (a `GLuint`). You ask OpenGL to create the object (`glGen...`), you **bind** it (`glBind...`) to say "the next commands target this one", then you fill or configure it.

## Buffers: VBO, EBO and VAO

A **buffer** is an area of graphics card memory. Three objects work together to describe a shape:

| Object | Full name | Contains | Used for |
|---|---|---|---|
| **VBO** | *Vertex Buffer Object* | The vertices: position, texture coordinate, normal... | Storing the data once on the graphics card side |
| **EBO** | *Element Buffer Object* | **Indices**: which vertices form each triangle | Reusing the same vertex in several triangles |
| **VAO** | *Vertex Array Object* | No data: the **configuration** (which VBO, how to read it, which EBO) | Getting all that configuration back with a single `glBindVertexArray` |

Why an EBO: a square (*quad*) is drawn with 2 triangles, so 6 vertices, whereas it only has 4 corners. With indices, the 4 corners are stored once and the triangles are written `0 3 2` and `0 2 1`, like the `f` lines of an [`.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong) file.

```c
/* x      y     z      u     v      <- 5 floats per vertex (position, then texture) */
float vertices[] = {
	 0.5f,  0.5f, 0.0f,  1.0f, 1.0f,   /* vertex 0: top right */
	 0.5f, -0.5f, 0.0f,  1.0f, 0.0f,   /* vertex 1: bottom right */
	-0.5f, -0.5f, 0.0f,  0.0f, 0.0f,   /* vertex 2: bottom left */
	-0.5f,  0.5f, 0.0f,  0.0f, 1.0f,   /* vertex 3: top left */
};
unsigned int indices[] = {0, 3, 2,  0, 2, 1};   /* two triangles, counter-clockwise */

GLuint vao, vbo, ebo;
glGenVertexArrays(1, &vao);                     /* creates the three objects (identifiers) */
glGenBuffers(1, &vbo);
glGenBuffers(1, &ebo);

glBindVertexArray(vao);                         /* everything below is remembered in this VAO */
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof vertices, vertices, GL_STATIC_DRAW);  /* copy to the card */
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);     /* the EBO bound here is remembered by the VAO */
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof indices, indices, GL_STATIC_DRAW);

/* attribute 0: 3 floats (position), one vertex = 5 floats, reading from byte 0 */
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void *)0);
glEnableVertexAttribArray(0);
/* attribute 1: 2 floats (texture), from byte 12 (3 floats further) */
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void *)(3 * sizeof(float)));
glEnableVertexAttribArray(1);
glBindVertexArray(0);                           /* end of the recording */

/* in the render loop: */
glBindVertexArray(vao);                         /* brings back the whole configuration */
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);   /* draws 6 indices = 2 triangles */
```

`GL_STATIC_DRAW` is a usage hint: data written once, drawn often (the opposite, `GL_DYNAMIC_DRAW`, announces frequent updates).

| Pitfall | Why | Remedy |
|---|---|---|
| `sizeof` of a pointer instead of the array | `sizeof(ptr)` is 8 bytes, not the size of the data: the buffer is almost empty | Keep the array size, or pass it explicitly (number of vertices x size of a vertex) |
| Stride and offset given as a number of `float` | `glVertexAttribPointer` expects **bytes** | Multiply by `sizeof(float)`, as above |
| Unbinding the EBO (`glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0)`) while the VAO is bound | The EBO is part of the VAO's state: it is removed from the VAO | Unbind the VAO first (or do not unbind the EBO) |
| Drawing with no VAO bound | OpenGL's *core* profile refuses to draw without a VAO | Always bind a VAO before `glDraw...` |
| Forgetting to free | Objects stay in the card's memory until they are deleted | `glDeleteBuffers`, `glDeleteVertexArrays` at shutdown |

## Textures: an image stuck on the surface

A **texture** is an image kept on the graphics card side. Each vertex carries a texture coordinate `(u, v)` between 0 and 1 (the `u v` columns of the table above): the card interpolates these coordinates over the triangle and reads the image at that spot for each pixel (see [the image file referenced by the `.mtl`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#the-image-file-referenced-by-the-mtl)). The pixels can be obtained, for example, by reading a [PPM file](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#the-ppm-p6-format-a-texture-without-a-library).

```c
glPixelStorei(GL_UNPACK_ALIGNMENT, 1);          /* pixel rows without padding (see below) */
GLuint tex;
glGenTextures(1, &tex);
glBindTexture(GL_TEXTURE_2D, tex);              /* the next commands target this texture */
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0,
             GL_RGB, GL_UNSIGNED_BYTE, pixels); /* sends the pixels (3 bytes each) */
glGenerateMipmap(GL_TEXTURE_2D);                /* reduced versions, see below */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);   /* if u leaves 0..1 */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);   /* if v leaves 0..1 */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);  /* reduced image */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);                /* enlarged image */
```

### `GL_UNPACK_ALIGNMENT`: pixel rows aligned on 4 bytes

By default, OpenGL assumes that **each row of pixels starts at an address that is a multiple of 4 bytes** and reads the missing padding. A file such as PPM, on the other hand, stores rows **with no padding at all**. For 3-byte pixels (red, green, blue), the mismatch appears as soon as the width is not a multiple of 4:

| Width (pixels) | Actual bytes per row | Bytes read by OpenGL | Result |
|---|---|---|---|
| 1 | 3 | 4 | Shifted |
| 2 | 6 | 8 | Shifted |
| 3 | 9 | 12 | Shifted |
| 4 | 12 | 12 | Correct |
| 5 | 15 | 16 | Shifted |
| 6 | 18 | 20 | Shifted |

The symptom: a **sheared** image (each row slides a little more than the previous one) and wrong colours, for certain widths only. Worse, the last row is read up to 3 bytes beyond the end of the array: an out-of-bounds read. Remedy: `glPixelStorei(GL_UNPACK_ALIGNMENT, 1)` **before** `glTexImage2D`, which says "my rows are tightly packed". With 4 bytes per pixel (red, green, blue, transparency), the row is always a multiple of 4 and the problem does not exist.

### Mipmaps, filters and repetition

A distant object covers few pixels on screen: the card then reads a large image at a few random points, and the image flickers. **Mipmaps** are copies of the texture reduced by half at each level (1/2, 1/4, 1/8...); `glGenerateMipmap` computes them in one call (to be done **after** `glTexImage2D`). The card picks the level that fits the size on screen. Cost: one third more memory (1/4 + 1/16 + ... tends to 1/3).

| Setting | Value | Effect |
|---|---|---|
| Filter | `GL_NEAREST` | Takes the nearest pixel: sharp, with visible blocks |
| Filter | `GL_LINEAR` | Blends the 4 neighbouring pixels: smooth |
| Reduction filter (`MIN`) | `GL_LINEAR_MIPMAP_LINEAR` | Smooth, and also blends two mipmap levels |
| Repetition | `GL_REPEAT` | The image repeats beyond 0..1 |
| Repetition | `GL_MIRRORED_REPEAT` | It repeats mirrored |
| Repetition | `GL_CLAMP_TO_EDGE` | The last edge pixel is extended |

> **Pitfall:** the default reduction filter expects mipmaps. Without `glGenerateMipmap` or a change of the `MIN` filter, the texture is said to be **incomplete** and displays **black**, without any error. Either generate the mipmaps, or set `GL_TEXTURE_MIN_FILTER` to `GL_LINEAR`. And the magnification filter (`MAG`) never accepts a "mipmap" value: the `GL_INVALID_ENUM` error is reported in the error flag, not by a crash.

## Shaders: the graphics card's programs

A **shader** is a small program written in **GLSL** ([*OpenGL Shading Language*](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language), a language close to C) that runs on the graphics card, in parallel for thousands of vertices or pixels at once. Drawing a triangle goes through a chain of stages:

```text
vertices (VBO)
   |
   v
[ vertex shader ]      one call PER VERTEX: computes its position on screen
   |
   v
assembly               groups the vertices into triangles
   |
   v
[ geometry shader ]    OPTIONAL, one call PER TRIANGLE: can emit 0, 1 or several
   |
   v
rasterisation          cuts each triangle into fragments (the pixels it covers)
   |
   v
[ fragment shader ]    one call PER FRAGMENT: computes its colour
   |
   v
depth test, then screen
```

| Stage | Runs | Input | Output |
|---|---|---|---|
| Vertex | Once per vertex | The VBO attributes (position, `u v`...) | The position on screen (`gl_Position`) and values to pass on |
| Geometry | Once per triangle (optional) | The 3 vertices of the triangle | 0 to N emitted vertices |
| Fragment | Once per covered pixel | The passed values, **interpolated** between the vertices | The final colour |

Two words come back in every shader. A **`uniform`** is a value set by the C program, **identical** for all the vertices and pixels of a given draw (light direction, matrix, time). An **`in`/`out`** passes a value from one stage to the next (an `out` of the vertex shader becomes an `in` of the next, **matched by name**).

### Example: a flat normal per triangle, computed in the geometry shader

The **normal** is the vector perpendicular to a surface, needed for lighting (see [the Phong model](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)). Computed per triangle, it gives a faceted look. The geometry shader receives the 3 vertices at once, so it can compute it without the file providing it:

```glsl
#version 330 core
layout(triangles) in;                           // receives a whole triangle: 3 vertices
layout(triangle_strip, max_vertices = 3) out;   // returns one, of at most 3 vertices
in vec3 world_pos[];                            // position of each vertex (from the vertex shader)
out vec3 flat_normal;                           // same normal for the 3 emitted vertices

void main()
{
	vec3 n = normalize(cross(world_pos[1] - world_pos[0],
	                         world_pos[2] - world_pos[0]));   // perpendicular to the triangle
	for (int i = 0; i < 3; i++)
	{
		gl_Position = gl_in[i].gl_Position;     // screen position already computed
		flat_normal = n;
		EmitVertex();                           // emits this vertex
	}
	EndPrimitive();                             // ends the triangle
}
```

The fragment shader that uses it lights the face according to the angle with the light:

```glsl
#version 330 core
in vec3 flat_normal;                            // passed normal (same value over the whole triangle)
uniform vec3 light_dir;                         // light direction, set by the C program
out vec4 color;                                 // final colour of the pixel

void main()
{
	float light = max(dot(normalize(flat_normal), -light_dir), 0.0);   // 0 if the face turns its back
	color = vec4(vec3(0.8) * light, 1.0);       // grey x intensity, opaque
}
```

> **Pitfall:** a degenerate triangle (three aligned vertices) has a zero cross product, and `normalize` of a zero vector gives an undefined result (possibly `NaN`): a black triangle or corrupted pixels. Also, the **direction** of the normal depends on the vertex order (counter-clockwise = front face): a mesh turned inside out has all its normals reversed.

### Compiling, linking and using a program

GLSL code is **text**, compiled at run time by the card's **driver** (see [GLFW and GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)). A typo is therefore only detected when the program starts: the compiler log has to be read.

```c
/* Compiles a shader; on failure, prints the compiler log and returns 0. */
static GLuint compile_shader(GLenum type, const char *source)
{
	GLuint shader = glCreateShader(type);        /* type: GL_VERTEX_SHADER, GL_GEOMETRY_SHADER... */
	GLint ok;

	glShaderSource(shader, 1, &source, NULL);    /* hands over the GLSL text */
	glCompileShader(shader);
	glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
	if (!ok)
	{
		char log[1024];
		glGetShaderInfoLog(shader, sizeof log, NULL, log);   /* line and cause of the error */
		fprintf(stderr, "shader: %s\n", log);
		glDeleteShader(shader);
		return 0;
	}
	return shader;
}
```

Linking (`glAttachShader` for each stage, `glLinkProgram`, then `glGetProgramiv(..., GL_LINK_STATUS, ...)` and `glGetProgramInfoLog`) follows exactly the same pattern, with `program` in place of `shader`. Once linked, `glUseProgram(program)` activates it for the following draws.

A `uniform` value is set like this, **after** `glUseProgram`:

```c
GLint loc = glGetUniformLocation(program, "light_dir");   /* number of the slot */
if (loc == -1)
	fprintf(stderr, "uniform light_dir missing\n");
else
	glUniform3f(loc, 0.0f, -1.0f, 0.0f);                  /* the light falls downwards */
```

> **Pitfall:** `glGetUniformLocation` returns **-1** if the name does not exist, and `glUniform...` with -1 is **silently ignored**. Two causes: a typo in the name, or a variable that the compiler **removed because it is useless** in the shader. Test for `-1` and report it **only once** (never at every frame of the render loop).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A VBO stores the vertices, an EBO the triangle indices, a VAO remembers the reading configuration: you bind it, then draw. A texture is an image on the graphics card side, read through `(u, v)` coordinates; its rows are assumed to be aligned on 4 bytes, and mipmaps avoid flickering at a distance. A GLSL program chains a vertex shader (per vertex), an optional geometry shader (per triangle) and a fragment shader (per pixel); a `uniform` is identical for a whole draw. |
| **Usable tools** | `glGenBuffers`/`glBufferData`/`glVertexAttribPointer`/`glDrawElements`, `glPixelStorei`, `glGenerateMipmap`, `glTexParameteri`, `glCompileShader` and its logs, `glGetUniformLocation`. Documentation: [Vertex Specification](https://www.khronos.org/opengl/wiki/Vertex_Specification), [Texture](https://www.khronos.org/opengl/wiki/Texture), [Geometry Shader](https://www.khronos.org/opengl/wiki/Geometry_Shader). |
| **Pitfalls to avoid** | `sizeof` of a pointer, stride and offset in number of `float` instead of bytes, EBO unbound before the VAO, drawing with no VAO. A texture width that is not a multiple of 4 without `GL_UNPACK_ALIGNMENT` set to 1 (sheared image, out-of-bounds read). A texture without mipmaps with the default filter (black, no error). A degenerate triangle in a normal computed in the shader. A missing uniform (-1) silently ignored. |
| **Good practices** | Read the compiler and link log, and print it with the real cause. Report a `uniform` error only once. Set `GL_UNPACK_ALIGNMENT` before sending an image whose rows are tightly packed. Generate the mipmaps or set the `MIN` filter. Delete the objects at shutdown. |
