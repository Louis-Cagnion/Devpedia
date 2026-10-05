---
order: 4
---

# Búferes, texturas y shaders de OpenGL

El [capítulo anterior](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu) abre una ventana y ejecuta un bucle de renderizado, pero todavía no dibuja nada en ella. Para mostrar un objeto hay que enviar sus datos a la **tarjeta gráfica** (el procesador especializado en dibujar, llamado también GPU) y darle los pequeños programas que los convierten en píxeles. Este capítulo cubre los tres ingredientes: los **búferes** (los vértices), las **texturas** (las imágenes) y los **shaders** (los programas).

> **Vocabulario:** en OpenGL casi todo es un **objeto**, es decir, un recurso guardado en la tarjeta gráfica que el programa solo maneja mediante un **identificador entero** (un `GLuint`). Se pide a OpenGL que cree el objeto (`glGen...`), se **enlaza** (`glBind...`) para decir «los próximos comandos apuntan a este», y luego se rellena o se configura.

## Los búferes: VBO, EBO y VAO

Un **búfer** (*buffer*) es una zona de memoria de la tarjeta gráfica. Tres objetos trabajan juntos para describir una forma:

| Objeto | Nombre completo | Contiene | Sirve para |
|---|---|---|---|
| **VBO** | *Vertex Buffer Object* | Los vértices: posición, coordenada de textura, normal... | Guardar los datos una sola vez en la tarjeta gráfica |
| **EBO** | *Element Buffer Object* | **Índices**: qué vértices forman cada triángulo | Reutilizar un mismo vértice en varios triángulos |
| **VAO** | *Vertex Array Object* | Ningún dato: la **configuración** (qué VBO, cómo leerlo, qué EBO) | Recuperar toda esa configuración con un solo `glBindVertexArray` |

Por qué un EBO: un cuadrado (*quad*) se dibuja con 2 triángulos, es decir 6 vértices, aunque solo tiene 4 esquinas. Con índices, las 4 esquinas se guardan una vez y los triángulos se escriben `0 3 2` y `0 2 1`, como las líneas `f` de un archivo [`.obj`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong).

```c
/* x      y     z      u     v      <- 5 floats por vértice (posición y luego textura) */
float vertices[] = {
	 0.5f,  0.5f, 0.0f,  1.0f, 1.0f,   /* vértice 0: arriba a la derecha */
	 0.5f, -0.5f, 0.0f,  1.0f, 0.0f,   /* vértice 1: abajo a la derecha */
	-0.5f, -0.5f, 0.0f,  0.0f, 0.0f,   /* vértice 2: abajo a la izquierda */
	-0.5f,  0.5f, 0.0f,  0.0f, 1.0f,   /* vértice 3: arriba a la izquierda */
};
unsigned int indices[] = {0, 3, 2,  0, 2, 1};   /* dos triángulos, sentido antihorario */

GLuint vao, vbo, ebo;
glGenVertexArrays(1, &vao);                     /* crea los tres objetos (identificadores) */
glGenBuffers(1, &vbo);
glGenBuffers(1, &ebo);

glBindVertexArray(vao);                         /* todo lo que sigue se memoriza en este VAO */
glBindBuffer(GL_ARRAY_BUFFER, vbo);
glBufferData(GL_ARRAY_BUFFER, sizeof vertices, vertices, GL_STATIC_DRAW);  /* copia a la tarjeta */
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, ebo);     /* el EBO enlazado aquí lo memoriza el VAO */
glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof indices, indices, GL_STATIC_DRAW);

/* atributo 0: 3 floats (posición), un vértice = 5 floats, lectura desde el byte 0 */
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void *)0);
glEnableVertexAttribArray(0);
/* atributo 1: 2 floats (textura), desde el byte 12 (3 floats más allá) */
glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void *)(3 * sizeof(float)));
glEnableVertexAttribArray(1);
glBindVertexArray(0);                           /* fin de la grabación */

/* en el bucle de renderizado: */
glBindVertexArray(vao);                         /* recupera toda la configuración */
glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);   /* dibuja 6 índices = 2 triángulos */
```

`GL_STATIC_DRAW` es una indicación de uso: datos escritos una vez, dibujados a menudo (lo contrario, `GL_DYNAMIC_DRAW`, anuncia actualizaciones frecuentes).

| Trampa | Por qué | Remedio |
|---|---|---|
| `sizeof` de un puntero en lugar del array | `sizeof(ptr)` vale 8 bytes, no el tamaño de los datos: el búfer queda casi vacío | Conservar el tamaño del array o pasarlo explícitamente (número de vértices x tamaño de un vértice) |
| Paso y desplazamiento dados en número de `float` | `glVertexAttribPointer` espera **bytes** | Multiplicar por `sizeof(float)`, como arriba |
| Desenlazar el EBO (`glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, 0)`) mientras el VAO está enlazado | El EBO forma parte del estado del VAO: se retira del VAO | Desenlazar primero el VAO (o no desenlazar el EBO) |
| Dibujar sin VAO enlazado | El perfil *core* de OpenGL se niega a dibujar sin VAO | Enlazar siempre un VAO antes de `glDraw...` |
| Olvidar liberar | Los objetos siguen en la memoria de la tarjeta hasta que se eliminan | `glDeleteBuffers`, `glDeleteVertexArrays` al cerrar |

## Las texturas: una imagen pegada sobre la superficie

Una **textura** es una imagen guardada en la tarjeta gráfica. Cada vértice lleva una coordenada de textura `(u, v)` entre 0 y 1 (las columnas `u v` de la tabla anterior): la tarjeta interpola esas coordenadas sobre el triángulo y lee la imagen en ese punto para cada píxel (véase [el archivo de imagen referenciado por el `.mtl`](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#el-archivo-de-imagen-referenciado-por-el-mtl)). Los píxeles se obtienen, por ejemplo, leyendo un [archivo PPM](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#el-formato-ppm-p6-una-textura-sin-biblioteca).

```c
glPixelStorei(GL_UNPACK_ALIGNMENT, 1);          /* filas de píxeles sin relleno (véase abajo) */
GLuint tex;
glGenTextures(1, &tex);
glBindTexture(GL_TEXTURE_2D, tex);              /* los comandos siguientes apuntan a esta textura */
glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0,
             GL_RGB, GL_UNSIGNED_BYTE, pixels); /* envía los píxeles (3 bytes cada uno) */
glGenerateMipmap(GL_TEXTURE_2D);                /* versiones reducidas, véase abajo */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);   /* si u sale de 0..1 */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);   /* si v sale de 0..1 */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);  /* imagen reducida */
glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);                /* imagen ampliada */
```

### `GL_UNPACK_ALIGNMENT`: filas de píxeles alineadas a 4 bytes

Por defecto, OpenGL supone que **cada fila de píxeles empieza en una dirección múltiplo de 4 bytes** y lee el relleno que falta. Un archivo como el PPM, en cambio, guarda las filas **sin ningún relleno**. Con píxeles de 3 bytes (rojo, verde, azul), el desacuerdo aparece en cuanto el ancho no es múltiplo de 4:

| Ancho (píxeles) | Bytes reales por fila | Bytes leídos por OpenGL | Resultado |
|---|---|---|---|
| 1 | 3 | 4 | Desplazado |
| 2 | 6 | 8 | Desplazado |
| 3 | 9 | 12 | Desplazado |
| 4 | 12 | 12 | Correcto |
| 5 | 15 | 16 | Desplazado |
| 6 | 18 | 20 | Desplazado |

El síntoma: una imagen **inclinada** (cada fila se desliza un poco más que la anterior) y colores falsos, solo para ciertos anchos. Peor aún, la última fila se lee hasta 3 bytes más allá del final del array: una lectura fuera de los límites. Remedio: `glPixelStorei(GL_UNPACK_ALIGNMENT, 1)` **antes** de `glTexImage2D`, que dice «mis filas están compactas». Con 4 bytes por píxel (rojo, verde, azul, transparencia), la fila es siempre múltiplo de 4 y el problema no existe.

### Mipmaps, filtros y repetición

Un objeto lejano cubre pocos píxeles en pantalla: la tarjeta lee entonces una imagen grande en unos pocos puntos al azar y la imagen parpadea. Los **mipmaps** son copias de la textura reducidas a la mitad en cada nivel (1/2, 1/4, 1/8...); `glGenerateMipmap` los calcula de una vez (hay que llamarlo **después** de `glTexImage2D`). La tarjeta elige el nivel adecuado al tamaño en pantalla. Coste: un tercio más de memoria (1/4 + 1/16 + ... tiende a 1/3).

| Ajuste | Valor | Efecto |
|---|---|---|
| Filtro | `GL_NEAREST` | Toma el píxel más cercano: nítido, con bloques visibles |
| Filtro | `GL_LINEAR` | Mezcla los 4 píxeles vecinos: suave |
| Filtro de reducción (`MIN`) | `GL_LINEAR_MIPMAP_LINEAR` | Suave, y mezcla además dos niveles de mipmap |
| Repetición | `GL_REPEAT` | La imagen se repite más allá de 0..1 |
| Repetición | `GL_MIRRORED_REPEAT` | Se repite en espejo |
| Repetición | `GL_CLAMP_TO_EDGE` | El último píxel del borde se prolonga |

> **Trampa:** el filtro de reducción por defecto espera mipmaps. Sin `glGenerateMipmap` ni cambio del filtro `MIN`, la textura se considera **incompleta** y se muestra **negra**, sin ningún error. O se generan los mipmaps, o se ajusta `GL_TEXTURE_MIN_FILTER` a `GL_LINEAR`. Y el filtro de ampliación (`MAG`) no acepta nunca un valor «mipmap»: el error `GL_INVALID_ENUM` se señala en el indicador de error, no con un fallo.

## Los shaders: los programas de la tarjeta gráfica

Un **shader** es un pequeño programa escrito en **GLSL** ([*OpenGL Shading Language*](https://www.khronos.org/opengl/wiki/OpenGL_Shading_Language), un lenguaje cercano a C) que se ejecuta en la tarjeta gráfica, en paralelo para miles de vértices o de píxeles a la vez. Dibujar un triángulo atraviesa una cadena de etapas:

```text
vértices (VBO)
   |
   v
[ vertex shader ]      una llamada POR VÉRTICE: calcula su posición en pantalla
   |
   v
ensamblado             agrupa los vértices en triángulos
   |
   v
[ geometry shader ]    OPCIONAL, una llamada POR TRIÁNGULO: puede emitir 0, 1 o varios
   |
   v
rasterización          corta cada triángulo en fragmentos (los píxeles que cubre)
   |
   v
[ fragment shader ]    una llamada POR FRAGMENTO: calcula su color
   |
   v
prueba de profundidad, y luego pantalla
```

| Etapa | Se ejecuta | Entrada | Salida |
|---|---|---|---|
| Vertex | Una vez por vértice | Los atributos del VBO (posición, `u v`...) | La posición en pantalla (`gl_Position`) y valores que transmitir |
| Geometry | Una vez por triángulo (opcional) | Los 3 vértices del triángulo | De 0 a N vértices emitidos |
| Fragment | Una vez por píxel cubierto | Los valores transmitidos, **interpolados** entre los vértices | El color final |

Dos palabras aparecen en todo shader. Un **`uniform`** es un valor fijado por el programa C, **idéntico** para todos los vértices y píxeles de un mismo dibujo (dirección de la luz, matriz, tiempo). Un **`in`/`out`** pasa un valor de una etapa a la siguiente (un `out` del vertex shader se convierte en un `in` de la siguiente, **emparejados por el nombre**).

### Ejemplo: una normal plana por triángulo, calculada en el geometry shader

La **normal** es el vector perpendicular a una superficie, necesario para la iluminación (véase [el modelo de Phong](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)). Calculada por triángulo, da un aspecto facetado. El geometry shader recibe los 3 vértices de golpe, así que puede calcularla sin que el archivo la proporcione:

```glsl
#version 330 core
layout(triangles) in;                           // recibe un triángulo entero: 3 vértices
layout(triangle_strip, max_vertices = 3) out;   // devuelve uno, de 3 vértices como máximo
in vec3 world_pos[];                            // posición de cada vértice (del vertex shader)
out vec3 flat_normal;                           // misma normal para los 3 vértices emitidos

void main()
{
	vec3 n = normalize(cross(world_pos[1] - world_pos[0],
	                         world_pos[2] - world_pos[0]));   // perpendicular al triángulo
	for (int i = 0; i < 3; i++)
	{
		gl_Position = gl_in[i].gl_Position;     // posición en pantalla ya calculada
		flat_normal = n;
		EmitVertex();                           // emite este vértice
	}
	EndPrimitive();                             // termina el triángulo
}
```

El fragment shader que la usa ilumina la cara según el ángulo con la luz:

```glsl
#version 330 core
in vec3 flat_normal;                            // normal transmitida (mismo valor en todo el triángulo)
uniform vec3 light_dir;                         // dirección de la luz, fijada por el programa C
out vec4 color;                                 // color final del píxel

void main()
{
	float light = max(dot(normalize(flat_normal), -light_dir), 0.0);   // 0 si la cara da la espalda
	color = vec4(vec3(0.8) * light, 1.0);       // gris x intensidad, opaco
}
```

> **Trampa:** un triángulo degenerado (tres vértices alineados) tiene un producto vectorial nulo, y `normalize` de un vector nulo da un resultado indefinido (posiblemente `NaN`): un triángulo negro o píxeles corruptos. Además, el **sentido** de la normal depende del orden de los vértices (antihorario = cara frontal): una malla del revés tiene todas sus normales invertidas.

### Iluminación de doble cara: `gl_FrontFacing`

Un triángulo tiene dos lados. El lado **frontal** es aquel desde el que se ven sus vértices en sentido **antihorario** en la pantalla (*CCW*, *counter-clockwise*): lo decide el **orden de enrollado** (*winding order*) de los vértices, no la geometría. Por defecto, OpenGL considera el sentido antihorario como el frente (ajuste `glFrontFace(GL_CCW)`); para la eliminación de caras, que se apoya en la misma noción, véase [dibujar un objeto transparente](/?c=fondamentaux&s=graphisme&p=effets-de-rendu-et-interaction-3d#dibujar-un-objeto-transparente).

La normal calculada con `cross` (el producto vectorial, véase [Vectores y producto escalar](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire)) apunta hacia el exterior del lado frontal. Visto por detrás, un triángulo tiene por tanto una normal que se aleja del observador y de la luz: el `dot` (producto escalar) del fragment shader anterior se vuelve negativo, `max(..., 0.0)` lo lleva a 0 y el píxel queda negro.

| Situación | Lado visto | Normal | Resultado con la iluminación anterior |
|---|---|---|---|
| Malla cerrada, vértices en sentido antihorario | frontal | hacia el exterior | iluminado |
| Malla cerrada, vértices en sentido inverso | «trasero» (aunque sea el exterior) | hacia el interior | **negro** |
| Superficie abierta (hoja, bandera) vista por sus dos lados | frontal y luego trasero | de un solo lado | iluminada de un lado, **negra** del otro |

Para ello, el fragment shader recibe la variable predefinida **`gl_FrontFacing`** (booleano): verdadera si el triángulo se ve por su lado frontal. Basta con invertir la normal cuando es falsa:

```glsl
#version 330 core
in vec3 flat_normal;                            // normal del triángulo, orientada hacia el lado frontal
uniform vec3 light_dir;                         // dirección de la luz
out vec4 color;                                 // color final del píxel

void main()
{
	vec3 n = normalize(flat_normal);            // vector de longitud 1
	if (!gl_FrontFacing)                        // triángulo visto por detrás
		n = -n;                                 // normal invertida: mira al observador
	float light = max(dot(n, -light_dir), 0.0);
	color = vec4(vec3(0.8) * light, 1.0);
}
```

Esto supone que la eliminación de caras traseras (`GL_CULL_FACE`) está **desactivada**: una cara eliminada nunca llega al fragment shader.

> **Trampa:** la iluminación de doble cara oculta una malla del revés en lugar de repararla: sus normales siguen siendo erróneas para cualquier otro uso (reflejos, sombras, eliminación de caras). Corregir el dato invirtiendo el orden de dos vértices de cada triángulo. Un **espejo** (escala negativa en un solo eje) también invierte el enrollado: un objeto volteado por una escala `-1` se vuelve negro sin que el archivo haya cambiado.

**Medir el resultado.** Una malla «negra» se comprueba en una captura de pantalla mediante la **proporción de píxeles negros**. Una comparación píxel a píxel con una imagen de referencia falla: el brillo pulsa con el tiempo, y dos capturas del mismo renderizado difieren. Elegir un fondo que no sea negro (si no, el fondo cuenta como negro) y contar:

```c
/* Proporción (0 a 1) de píxeles casi negros en una imagen RGB de n píxeles; -1 si n vale 0. */
static double dark_ratio(const unsigned char *rgb, size_t n)
{
	size_t dark = 0;

	if (n == 0)                                 /* imagen vacía: no hay proporción que calcular */
		return -1;
	for (size_t i = 0; i < n; i++)
		if (rgb[3 * i] < 16 && rgb[3 * i + 1] < 16 && rgb[3 * i + 2] < 16)   /* R, G y B por debajo de 16 sobre 255 */
			dark++;
	return (double)dark / (double)n;
}
```

Una malla del revés da una proporción cercana a la de toda la silueta; la misma malla corregida (o iluminada por las dos caras) la hace caer.

### Compilar, enlazar y usar un programa

El código GLSL es **texto**, compilado en tiempo de ejecución por el **controlador** de la tarjeta (véase [GLFW y GLAD](/?c=fondamentaux&s=graphisme&p=glfw-glad-et-boucle-de-rendu)). Una errata solo se detecta al iniciar el programa: hay que leer el registro del compilador.

```c
/* Compila un shader; si falla, muestra el registro del compilador y devuelve 0. */
static GLuint compile_shader(GLenum type, const char *source)
{
	GLuint shader = glCreateShader(type);        /* type: GL_VERTEX_SHADER, GL_GEOMETRY_SHADER... */
	GLint ok;

	glShaderSource(shader, 1, &source, NULL);    /* entrega el texto GLSL */
	glCompileShader(shader);
	glGetShaderiv(shader, GL_COMPILE_STATUS, &ok);
	if (!ok)
	{
		char log[1024];
		glGetShaderInfoLog(shader, sizeof log, NULL, log);   /* línea y causa del error */
		fprintf(stderr, "shader: %s\n", log);
		glDeleteShader(shader);
		return 0;
	}
	return shader;
}
```

El enlazado (`glAttachShader` para cada etapa, `glLinkProgram`, luego `glGetProgramiv(..., GL_LINK_STATUS, ...)` y `glGetProgramInfoLog`) sigue exactamente el mismo esquema, con `program` en lugar de `shader`. Una vez enlazado, `glUseProgram(program)` lo activa para los dibujos siguientes.

Un valor `uniform` se fija así, **después** de `glUseProgram`:

```c
GLint loc = glGetUniformLocation(program, "light_dir");   /* número de la ranura */
if (loc == -1)
	fprintf(stderr, "uniform light_dir ausente\n");
else
	glUniform3f(loc, 0.0f, -1.0f, 0.0f);                  /* la luz cae hacia abajo */
```

> **Trampa:** `glGetUniformLocation` devuelve **-1** si el nombre no existe, y `glUniform...` con -1 se **ignora en silencio**. Dos causas: una errata en el nombre, o una variable que el compilador **ha eliminado porque no sirve para nada** en el shader. Comprobar `-1` y señalarlo **una sola vez** (nunca en cada imagen del bucle de renderizado).

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Un VBO guarda los vértices, un EBO los índices de los triángulos, un VAO memoriza la configuración de lectura: se enlaza y luego se dibuja. Una textura es una imagen en la tarjeta gráfica, leída mediante las coordenadas `(u, v)`; se supone que sus filas están alineadas a 4 bytes, y los mipmaps evitan el parpadeo a distancia. Un programa GLSL encadena un vertex shader (por vértice), un geometry shader opcional (por triángulo) y un fragment shader (por píxel); un `uniform` es idéntico para todo un dibujo. El lado frontal de un triángulo es aquel en que sus vértices aparecen en sentido antihorario; `gl_FrontFacing` permite al fragment shader invertir la normal de una cara vista por detrás. |
| **Herramientas utilizables** | `glGenBuffers`/`glBufferData`/`glVertexAttribPointer`/`glDrawElements`, `glPixelStorei`, `glGenerateMipmap`, `glTexParameteri`, `glCompileShader` y sus registros, `glGetUniformLocation`. Documentación: [Vertex Specification](https://www.khronos.org/opengl/wiki/Vertex_Specification), [Texture](https://www.khronos.org/opengl/wiki/Texture), [Geometry Shader](https://www.khronos.org/opengl/wiki/Geometry_Shader). |
| **Trampas a evitar** | `sizeof` de un puntero, paso y desplazamiento en número de `float` en lugar de bytes, EBO desenlazado antes que el VAO, dibujo sin VAO. Ancho de textura no múltiplo de 4 sin `GL_UNPACK_ALIGNMENT` a 1 (imagen inclinada, lectura fuera de límites). Textura sin mipmaps con el filtro por defecto (negra, sin error). Triángulo degenerado en una normal calculada en el shader. Malla del revés (negra con iluminación de una sola cara), escala negativa que invierte el enrollado. Uniform ausente (-1) ignorado en silencio. |
| **Buenas prácticas** | Leer el registro del compilador y del enlazado, y mostrarlo con la causa real. Señalar un error de `uniform` una sola vez. Fijar `GL_UNPACK_ALIGNMENT` antes de enviar una imagen con filas compactas. Generar los mipmaps o ajustar el filtro `MIN`. Eliminar los objetos al cerrar. Reparar una malla del revés invirtiendo dos vértices por triángulo en lugar de ocultar el defecto con doble cara; comprobar un renderizado por la proporción de píxeles negros de una captura. |
