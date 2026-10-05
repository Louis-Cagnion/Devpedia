---
order: 3
---

# Abrir una ventana OpenGL moderna: GLFW, GLAD y el bucle de renderizado

El [capítulo sobre raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) dibujaba píxeles uno a uno, sin tarjeta gráfica. Un motor 3D moderno delega en cambio el cálculo a la propia tarjeta gráfica, mediante una API como **OpenGL**. Antes de poder enviarle el menor triángulo (véase el [formato .obj](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong)), primero hace falta obtener una ventana, un contexto gráfico, y un bucle que muestre una imagen tras otra. Este capítulo cubre ese paso, con dos bibliotecas casi sistemáticas en este contexto: **GLFW** (ventanas) y **GLAD** (carga de las funciones OpenGL).

## GLFW: la ventana y su contexto OpenGL

[GLFW](https://www.glfw.org) cumple, para OpenGL, un papel parecido al de MinilibX/X11 visto en el capítulo anterior: pedir al sistema operativo una ventana, recibir los eventos de teclado/ratón. Pero GLFW además crea un **contexto OpenGL**: el espacio donde la tarjeta gráfica conserva todo su estado (texturas cargadas, programa de shader activo...) para esa ventana concreta.

```c
GLFWwindow *ventana = glfwCreateWindow(800, 600, "Titulo", NULL, NULL);
// activa este contexto para todas las llamadas OpenGL siguientes
glfwMakeContextCurrent(ventana);
```

## Cargar las funciones OpenGL modernas: GLAD

En la mayoría de los sistemas, solo una pequeña parte de OpenGL (una versión antigua, fija) está directamente enlazada al programa en la compilación. Las funciones **modernas** deben pedirse al controlador gráfico en tiempo de ejecución, una por una, vía `glfwGetProcAddress()`: una **OpenGL Loading Library** como [GLAD](https://glad.dav1d.de) automatiza ese paso para toda la versión de OpenGL elegida, en lugar de llamar a `glfwGetProcAddress()` a mano para cada función usada.

```c
if (!gladLoadGLLoader((GLADloadproc) glfwGetProcAddress)) {
    fprintf(stderr, "No se pudo cargar OpenGL\n");
    exit(1);
}
```

> **Nota:** GLAD debe llamarse **después** de `glfwMakeContextCurrent()`, nunca antes: sin contexto activo, no hay nada contra lo que resolver las funciones pedidas.

## El archivo GLAD: generado, y luego "vendoreado"

A diferencia de una biblioteca del sistema clásica, GLAD no se instala vía un gestor de paquetes: su [generador en línea](https://glad.dav1d.de) produce un `.c`/`.h` a medida, para la versión de OpenGL y el sistema elegidos. Ese archivo generado se comitea después directamente en el repositorio del proyecto, una práctica llamada **vendoring**.

> **Trampa:** un `-I` apuntado al nivel de carpeta equivocado para este archivo generado rompe la compilación exactamente igual que para cualquier otra cabecera (véase [`#include` y `-I`](/?c=langages&s=c&p=headers) para el mecanismo preciso de resolución).
>
> **Buena práctica:** el vendoring evita una dependencia de un gestor de paquetes externo y garantiza que todos compilen exactamente con el mismo archivo generado, al precio de comitear código que uno no ha escrito: reservarlo para un caso como este (un archivo generado de una vez por todas, nunca editado a mano después), no para una biblioteca que cambia con regularidad.

## El double buffering: evitar la imagen a medio dibujar

Dibujar directamente en la pantalla, píxel a píxel, expone un problema: si la pantalla se refresca mientras la imagen está a medio dibujar, el usuario ve un instante una imagen incoherente (*tearing*). El **double buffering** evita esto dibujando siempre en un búfer invisible, intercambiado con el búfer mostrado solo una vez completa la imagen:

```text
Bufer delantero (mostrado en pantalla)   Bufer trasero (en curso de dibujo)
        |                                      |
        |          glfwSwapBuffers()           |
        +---------------- intercambio --------->
        (el bufer trasero se convierte en el delantero, de golpe)
```

```c
// intercambia los dos bufers, nunca un dibujo pixel a pixel directo en pantalla
glfwSwapBuffers(ventana);
```

## El bucle de renderizado

Como el bucle de eventos del capítulo anterior, un bucle de renderizado OpenGL se ejecuta mientras la ventana siga abierta, en general con esta forma fija:

```c
while (!glfwWindowShouldClose(ventana)) {
    // 1. recoger los eventos (teclado, ratón...)
    glfwPollEvents();
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);  // 2. borrar la imagen anterior
    // 3. dibujar la nueva imagen (búfer trasero)
    dibujarEscena();
    // 4. mostrarla de golpe (double buffering)
    glfwSwapBuffers(ventana);
}
```

> **Trampa:** olvidar `glClear()` antes de redibujar. Sin borrado, cada imagen nueva se superpone a las anteriores en lugar de reemplazarlas, dejando una estela visual.

## El delta time: una velocidad independiente de la máquina

Una vuelta del bucle de renderizado produce una imagen (un *frame*). El número de imágenes por segundo, los **FPS** (*frames per second*), depende de la máquina: 30 en un ordenador modesto, 144 en una pantalla rápida. Si el objeto avanza una distancia fija en cada vuelta del bucle, su velocidad real sigue entonces a los FPS:

```c
posicion += 0.1;   // 0,1 unidad (la medida de longitud de la escena) por imagen: la velocidad depende del número de imágenes
```

| FPS de la máquina | Imágenes en 1 segundo | Distancia recorrida en 1 segundo |
|---|---|---|
| 30 | 30 | 30 × 0,1 = 3 unidades |
| 60 | 60 | 60 × 0,1 = 6 unidades |
| 144 | 144 | 144 × 0,1 = 14,4 unidades |

El **delta time** es el tiempo transcurrido entre la imagen anterior y la imagen actual, en segundos (por ejemplo 0,0069 s a 144 FPS). Multiplicar cada desplazamiento por esa duración hace la velocidad independiente de los FPS: la velocidad se expresa en unidades **por segundo**, y cada imagen solo avanza la parte de segundo que ha durado.

```c
double ultimo_instante = glfwGetTime();   // double = número decimal; aquí, segundos transcurridos desde la inicialización de GLFW
double velocidad = 5.0;                   // 5 unidades por segundo, sea cual sea la máquina

while (!glfwWindowShouldClose(ventana)) {
    double ahora = glfwGetTime();                // instante de esta imagen
    double delta = ahora - ultimo_instante;      // duración de la imagen anterior, en segundos
    ultimo_instante = ahora;                     // se memoriza para la siguiente vuelta

    posicion += velocidad * delta;               // 144 FPS: 5 × 0,0069; 30 FPS: 5 × 0,033
    // ... eventos, borrado, dibujo, glfwSwapBuffers() como arriba
}
```

> **Trampa:** refrescar el delta time solo a intervalos regulares (por ejemplo «solo si han pasado 0,01 s»). Entre dos refrescos, el valor caducado se aplica en cada imagen: a 144 FPS (una imagen dura 0,0069 s, menos que ese umbral), el desplazamiento se suma más a menudo de lo que pasa el tiempo y todo va demasiado rápido (aproximadamente 1,5 veces en un caso encontrado). El delta time se recalcula en **cada** imagen.
>
> **Trampa:** tras una pausa (ventana arrastrada, programa suspendido), el primer delta puede valer varios segundos y lanzar el objeto muy lejos de golpe. Entonces se limita el valor, por ejemplo `if (delta > 0.1) delta = 0.1;`.

### Un solo cronómetro por uso

Un **cronómetro** designa aquí una variable que memoriza un instante (como `ultimo_instante` más arriba). Cuando un mismo cronómetro sirve para **dos usos** (medir la duración de una imagen **y** espaciar los pasos de un fundido, es decir, una transición progresiva de opacidad), uno de los dos es erróneo. El caso típico:

```c
double now = glfwGetTime();

if (now - prev_time >= FADE_STEP)   /* limitador del fundido: un paso cada FADE_STEP */
{
	frame_time = now - prev_time;   /* desde el ultimo PASO, no la ultima imagen */
	prev_time = now;
	alpha += 0.05;                  /* alpha: opacidad de 0 (transparente) a 1 (opaco) */
}
position += speed * frame_time;     /* usado en CADA imagen, refrescado en cada PASO */
```

Aquí `FADE_STEP` vale 0,016 s. `frame_time` solo se refresca en cada paso de fundido, pero se usa en cada imagen: cuantas más imágenes produce la máquina entre dos pasos, más se multiplica el movimiento. Medido en una simulación de un segundo, velocidad 5 unidades por segundo (la distancia correcta es, por tanto, 5):

| FPS | Distancia con un cronómetro compartido | Con un cronómetro por uso |
|---|---|---|
| 30 o 60 | 5,0 | 5,0 |
| 144 | 14,8 (3 veces de más) | 5,0 |
| 1 000 | 79,0 (16 veces de más) | 5,0 |
| 2 500 | 199,7 (**40 veces** de más) | 5,0 |

En una pantalla de 60 Hz con vsync, el defecto no se ve (una imagen dura más que el paso del fundido): aparece en una pantalla rápida o sin vsync. La corrección se resume en tres reglas:

| Regla | Qué cambia |
|---|---|
| **Un cronómetro por uso** | La duración de la imagen se recalcula en cada imagen; nada más la toca |
| **Limitar** esa duración (`MAX_FRAME_TIME`, p. ej. 0,1 s) | Una pausa ya no lanza el objeto lejos (véase la trampa anterior) |
| **Expresar un fundido por su duración**, no por un número de pasos | `alpha = transcurrido / FADE_DURATION` (0,5 s aquí), es decir, el mismo tiempo en cualquier máquina; el limitador deja de hacer falta |

```c
double now = glfwGetTime();
double frame_time = now - last_frame;     /* duracion de la imagen, recalculada en cada vuelta */

last_frame = now;
if (frame_time > MAX_FRAME_TIME)          /* tras una pausa */
	frame_time = MAX_FRAME_TIME;
position += speed * frame_time;
fade_elapsed += frame_time;               /* el fundido acumula tiempo real */
alpha = fminf(fade_elapsed / FADE_DURATION, 1.0f);   /* fminf: limita a 1 */
```

> **Trampa (medir a una sola cadencia):** un movimiento mantenido (tecla pulsada, rotación continua) que parece correcto a 60 FPS puede fallar a otra cadencia. Medirlo a **varias cadencias**: con vsync y luego sin él. Sin vsync, Mesa se ajusta con la [variable de entorno](/?c=shells&s=bash&p=variables-denvironnement) `vblank_mode=0` y el controlador de NVIDIA con `__GL_SYNC_TO_VBLANK=0` (`vblank_mode=0 ./programa`). El ángulo o la distancia recorridos tras un segundo deben ser los mismos en todos los casos.

## La sincronización vertical (vsync)

La pantalla se refresca a una frecuencia fija, expresada en hercios (Hz, refrescos por segundo): 60 Hz, 144 Hz... Sin ninguna regla, el bucle de renderizado corre lo más rápido posible, muy por encima de lo que la pantalla puede mostrar: se desperdician imágenes, la tarjeta gráfica se calienta, y el intercambio de búferes puede caer a mitad de un refresco (*tearing*, visto arriba). La **sincronización vertical** (*vsync*) hace esperar a `glfwSwapBuffers()` hasta el siguiente refresco de la pantalla:

```c
glfwMakeContextCurrent(ventana);   // el contexto debe estar ya activo
glfwSwapInterval(1);               // 1 = esperar 1 refresco por intercambio (vsync); 0 = no esperar
```

| Ajuste | FPS obtenidos | Efecto |
|---|---|---|
| `glfwSwapInterval(1)` | iguales a la frecuencia de la pantalla (60 en una pantalla de 60 Hz) | sin tearing, tarjeta gráfica preservada |
| `glfwSwapInterval(0)` | tan altos como permita la máquina | tearing posible, útil para medir el rendimiento |

> **Buena práctica:** no contar nunca con el vsync para regular la velocidad. El controlador gráfico (el software que hace dialogar al sistema con la tarjeta gráfica) o el usuario pueden desactivarlo a la fuerza, y los FPS cambian de una pantalla a otra: solo el delta time garantiza la misma velocidad en todas partes. El vsync regula la visualización, el delta time regula el movimiento.

## Los límites de la tarjeta gráfica y `glGetError`

Cada tarjeta gráfica tiene sus **límites**: tamaño máximo de una textura, tamaño máximo de la **zona de dibujo** (el *viewport*, el rectángulo de la ventana donde OpenGL escribe los píxeles)... Cambian de una máquina a otra: un programa que funciona en la máquina de su autor puede fallar en la de otra persona, sin que el código haya cambiado. Se **leen** en lugar de suponerlos, con `glGetIntegerv(constante, &valor)` (la función que lee un entero del estado de OpenGL; `GLint` es el tipo entero de OpenGL, de 32 bits en todas las máquinas).

| Constante | Qué da | Si se supera |
|---|---|---|
| `GL_MAX_TEXTURE_SIZE` | lado máximo, en píxeles, de una [textura](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#las-texturas-una-imagen-pegada-sobre-la-superficie) | se rechaza el envío de la imagen, la textura es inutilizable (se lee negra) |
| `GL_MAX_VIEWPORT_DIMS` | **dos** enteros: anchura y altura máximas de la zona de dibujo | la especificación no garantiza nada: dibujo truncado según el controlador |

```c
/* Verdadero si una imagen width x height cabe en una textura de esta tarjeta; mensaje si no. */
static int texture_fits(int width, int height)
{
	GLint max_size = 0;

	if (width <= 0 || height <= 0)                 /* dimensiones degeneradas: causa aparte */
	{
		fprintf(stderr, "imagen de %d x %d: dimensiones nulas o negativas\n", width, height);
		return 0;
	}
	glGetIntegerv(GL_MAX_TEXTURE_SIZE, &max_size); /* un entero; contexto activo obligatorio */
	if (width > max_size || height > max_size)
	{
		fprintf(stderr, "imagen %d x %d demasiado grande: esta tarjeta acepta como maximo %d por lado\n",
			width, height, max_size);
		return 0;
	}
	return 1;
}

GLint max_viewport[2] = {0, 0};
glGetIntegerv(GL_MAX_VIEWPORT_DIMS, max_viewport); /* aquí dos valores: una tabla de 2 enteros */
```

> **Trampa:** `glGetIntegerv`, como toda función OpenGL, solo funciona **después de** [`glfwMakeContextCurrent()` y de cargar GLAD](#cargar-las-funciones-opengl-modernas-glad): antes, el puntero a la función es nulo y el programa se cae.

**OpenGL casi nunca señala un error mediante un valor de retorno.** Una llamada rechazada (tamaño demasiado grande, estado incorrecto) no se cae y no muestra nada: levanta un **indicador de error** interno, que el programa lee con `glGetError()`. Esta función devuelve un código y pone el indicador a cero; `GL_NO_ERROR` (0) significa «nada pendiente».

| Código | Significado habitual |
|---|---|
| `GL_INVALID_ENUM` | constante desconocida pasada a una función |
| `GL_INVALID_VALUE` | valor numérico fuera de rango (tamaño demasiado grande, negativo) |
| `GL_INVALID_OPERATION` | llamada no permitida en el estado actual (orden incorrecto, objeto no enlazado) |
| `GL_OUT_OF_MEMORY` | la tarjeta (o el controlador) se ha quedado sin memoria |
| `GL_INVALID_FRAMEBUFFER_OPERATION` | dibujo hacia un búfer de imagen incompleto |

Los errores **se apilan** y `glGetError()` devuelve **uno por llamada**: se repite hasta vaciarlos, si no, el error leído corresponde a una llamada anterior y no a la última.

```c
/* Nombre legible de un código de error de OpenGL. */
static const char *gl_error_name(GLenum err)
{
	switch (err)
	{
	case GL_INVALID_ENUM: return "GL_INVALID_ENUM";
	case GL_INVALID_VALUE: return "GL_INVALID_VALUE";
	case GL_INVALID_OPERATION: return "GL_INVALID_OPERATION";
	case GL_OUT_OF_MEMORY: return "GL_OUT_OF_MEMORY";
	case GL_INVALID_FRAMEBUFFER_OPERATION: return "GL_INVALID_FRAMEBUFFER_OPERATION";
	default: return "codigo desconocido";
	}
}

/* Lee y muestra todos los errores pendientes, con la etapa `where`; devuelve cuántos. */
static int check_gl_errors(const char *where)
{
	int count = 0;
	GLenum err;

	while ((err = glGetError()) != GL_NO_ERROR)   /* cada lectura retira un error de la pila */
	{
		fprintf(stderr, "OpenGL: %s durante '%s'\n", gl_error_name(err), where);
		count++;
	}
	return count;
}
```

Uso: `check_gl_errors("glTexImage2D");` justo después de la llamada sospechosa, para nombrar la etapa defectuosa (un `check_gl_errors("antes")` colocado antes vacía el contenido antiguo).

> **Trampa:** en un bucle de renderizado, un mismo problema se repetiría en **cada imagen** (60 mensajes por segundo que ahogan todo lo demás). Señalar cada causa **una sola vez** (lista acotada de los códigos ya mostrados), o controlar solo al arrancar y en modo depuración.

### Consultar el controlador gráfico y la pantalla

El **controlador** (el software del fabricante que hace dialogar a OpenGL con la tarjeta) sabe decir quién es y qué acepta. `glGetString` devuelve un texto, `glGetIntegerv` un entero:

| Consulta | Qué da |
|---|---|
| `glGetString(GL_VENDOR)` | el fabricante del controlador |
| `glGetString(GL_RENDERER)` | el nombre de la tarjeta (y a menudo del controlador) |
| `glGetString(GL_VERSION)` | la versión de OpenGL proporcionada, seguida del controlador |
| `glGetIntegerv(GL_MAX_VERTEX_ATTRIBS, ...)` | el número máximo de atributos por vértice (posición, normal...) |
| `glGetIntegerv(GL_MAX_GEOMETRY_OUTPUT_VERTICES, ...)` | el máximo del `max_vertices` de un [geometry shader](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl#los-shaders-los-programas-de-la-tarjeta-grafica) |
| `glGetIntegerv(GL_MAX_ELEMENTS_INDICES, ...)` | un **consejo** (número de índices recomendado por llamada de dibujo), nunca un límite: superarlo no produce ningún error, solo un dibujo posiblemente más lento |

```c
/* Muestra fabricante, tarjeta y versión de OpenGL; devuelve 0, o -1 si el controlador no responde. */
static int print_gl_info(void)
{
	const char *vendor = (const char *)glGetString(GL_VENDOR);      /* GLubyte * convertido en texto */
	const char *renderer = (const char *)glGetString(GL_RENDERER);
	const char *version = (const char *)glGetString(GL_VERSION);

	if (!vendor || !renderer || !version)          /* NULL: sin contexto activo, o constante rechazada */
	{
		fprintf(stderr, "glGetString ha devuelto NULL: sin contexto activo, o constante rechazada\n");
		return -1;
	}
	printf("Fabricante: %s\nTarjeta: %s\nOpenGL: %s\n", vendor, renderer, version);
	return 0;
}
```

**La memoria de la tarjeta no tiene consulta estándar.** Solo las **extensiones** (funciones opcionales, propias de un fabricante, que el controlador puede o no proporcionar) la dan: `GL_NVX_gpu_memory_info` en NVIDIA, `GL_ATI_meminfo` en AMD. `glfwExtensionSupported("GL_NVX_gpu_memory_info")` dice si el controlador la tiene. Sin ella, la única señal de falta de memoria es `GL_OUT_OF_MEMORY`, que se lee con `glGetError()` (véase más arriba).

**La pantalla se pregunta a GLFW**, no a OpenGL: una ventana más grande que la pantalla queda en parte fuera de la vista del usuario.

```c
/* Verdadero (1) si una ventana width x height cabe en la pantalla principal, 0 si no, -1 si se ignora la pantalla. */
static int window_fits_screen(int width, int height)
{
	GLFWmonitor *monitor = glfwGetPrimaryMonitor();   /* NULL: ninguna pantalla detectada */
	const GLFWvidmode *mode = monitor ? glfwGetVideoMode(monitor) : NULL;   /* NULL si falla */

	if (!mode)
	{
		fprintf(stderr, "pantalla principal no encontrada: tamano de ventana sin verificar\n");
		return -1;
	}
	if (width > mode->width || height > mode->height)   /* mode->width y ->height: tamaño de la pantalla */
	{
		fprintf(stderr, "ventana %d x %d mayor que la pantalla (%d x %d)\n",
			width, height, mode->width, mode->height);
		return 0;
	}
	return 1;
}
```

> **Trampa:** `glfwGetVideoMode` da el tamaño en **coordenadas de pantalla**, que difieren de los píxeles en una pantalla de alta densidad (HiDPI, por ejemplo una pantalla que muestra 2 píxeles por unidad); `glfwGetFramebufferSize` da el tamaño de la ventana en píxeles. Con varias pantallas, `glfwGetPrimaryMonitor` solo designa la pantalla principal: la ventana puede abrirse en otra.

---

## Cómo conoce OpenGL la máquina: del programa al hardware

OpenGL no es un programa: es una **especificación**, un documento (mantenido por el consorcio [Khronos](https://www.khronos.org/opengl/)) que describe cada función, sus parámetros y su comportamiento. Con ese documento no se entrega ningún código: cada fabricante escribe el suyo en su **controlador** (el software que traduce las llamadas de OpenGL en órdenes que su tarjeta entiende). De ahí `glGetString(GL_VENDOR)` (véase más arriba), y un mismo programa que se comporta de forma distinta de una máquina a otra.

En Linux, una llamada como `glClear` atraviesa estas capas:

```
El programa                 llama a glClear, glDrawArrays...
      │  GLAD y glfwGetProcAddress encuentran la dirección de cada función
      ▼
Biblioteca de acceso         libGL.so.1 (GLVND): elige qué controlador usar
      ▼
Controlador OpenGL           Mesa (AMD, Intel) o el controlador propietario de NVIDIA
      ▼
Núcleo de Linux              controlador del núcleo (amdgpu, i915, nvidia...) mediante el DRM
      ▼
Hardware                     la tarjeta, conectada al bus PCI
```

| Capa | Función |
|---|---|
| **Biblioteca de acceso** (`libGL`) | Punto de entrada único. **[GLVND](https://github.com/NVIDIA/libglvnd)** (*GL Vendor-Neutral Dispatch*, « despachador neutral ») permite que varios controladores convivan y elige el que corresponde a la tarjeta en uso. |
| **Controlador OpenGL** | Ejecuta realmente las funciones. **[Mesa](https://www.mesa3d.org/)** es el controlador libre (`radeonsi` para AMD, `iris` para Intel, `llvmpipe` para dibujar con el procesador cuando no hay tarjeta); NVIDIA aporta su propio controlador propietario. |
| **Controlador del núcleo** | El [núcleo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs#espacio-de-usuario-frente-a-espacio-del-nucleo) (el corazón del sistema, el único autorizado a hablar con el hardware) tiene un controlador por familia de tarjetas. El **[DRM](https://docs.kernel.org/gpu/drm-uapi.html)** (*Direct Rendering Manager*) es el subsistema que permite a varios programas compartir la tarjeta; se expone mediante archivos en `/dev/dri`. |
| **Hardware** | La tarjeta gráfica, conectada al bus **PCI** (el circuito que une la placa base con sus tarjetas de expansión). |

Cada capa se puede observar desde una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (`grep` conserva solo las líneas que contienen un patrón; el `|` envía la salida del comando de la izquierda al de la derecha: véanse las [redirecciones y pipes](/?c=shells&s=bash&p=redirections-et-pipes)):

```bash
lspci | grep -iE "vga|3d"              # lspci lista los dispositivos PCI: la o las tarjetas gráficas
ls /dev/dri                            # archivos del DRM: card0 (la tarjeta), renderD128 (cálculo sin pantalla)
lsmod | grep -E "amdgpu|i915|nouveau|nvidia"   # lsmod lista los controladores cargados en el núcleo
glxinfo -B | grep -i renderer          # glxinfo (paquete mesa-utils): el controlador OpenGL realmente en uso
```

`GL_RENDERER` apila además varias de estas capas en un solo texto. Forma típica bajo Mesa, que se apoya en [LLVM](https://llvm.org/) (valores de ejemplo):

```
AMD Radeon RX 6600 (radeonsi, navi23, LLVM 15.0.6, DRM 3.54, 6.1.0-18-amd64)
 │                  │        │       │               │        └ versión del núcleo
 │                  │        │       │               └ versión del DRM
 │                  │        │       └ LLVM: biblioteca que compila los shaders para la tarjeta
 │                  │        └ chip de la tarjeta
 │                  └ controlador Mesa
 └ nombre de la tarjeta
```

### Cuando no hay tarjeta: `llvmpipe`

En una [máquina virtual](/?c=infrastructure-devops&s=administration-systeme&p=virtualisation-et-choix-dos), un [contenedor](/?c=infrastructure-devops&s=docker&p=concepts-de-base), [WSL](https://learn.microsoft.com/es-es/windows/wsl/) sin controlador gráfico o una sesión remota, Mesa recurre a `llvmpipe`: el procesador dibuja en lugar de la tarjeta. El programa funciona, pero despacio, y `GL_RENDERER` empieza por `llvmpipe`. Se puede forzar para simular una máquina sin tarjeta, mediante una **variable de entorno** (un ajuste con nombre que el shell transmite a los programas que lanza, véanse las [variables de entorno](/?c=shells&s=bash&p=variables-denvironnement)):

```bash
LIBGL_ALWAYS_SOFTWARE=1 ./programa     # la variable solo vale para este lanzamiento
```

### Varias tarjetas gráficas

Un portátil suele tener una tarjeta **integrada** (dentro del procesador, económica) y una tarjeta **dedicada** (potente). Por defecto el sistema elige la primera; la otra se designa mediante una variable de entorno, durante un solo lanzamiento:

| Controlador | Lanzar en la tarjeta dedicada |
|---|---|
| Mesa (AMD, Intel) | `DRI_PRIME=1 ./programa` |
| NVIDIA propietario | `__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia ./programa` |

Las dos tarjetas no tienen los mismos límites (`GL_MAX_TEXTURE_SIZE`...) ni la misma versión de OpenGL: lo que el programa lee al arrancar depende de la tarjeta que creó el contexto.

### ¿Y en Windows y macOS?

| Sistema | Quién aporta OpenGL |
|---|---|
| **Linux** | Las capas anteriores (GLVND, Mesa o controlador NVIDIA, núcleo). |
| **Windows** | `opengl32.dll` redirige al controlador del fabricante, instalado con los controladores de la tarjeta. Sin él, Windows recurre a una versión por software limitada a OpenGL 1.1. |
| **macOS** | El propio sistema aporta OpenGL, congelado en la versión 4.1 y abandonado por Apple. |

> **Trampa:** un controlador ausente o demasiado antiguo no siempre provoca un fallo: `glfwCreateWindow` devuelve `NULL`, o `gladLoadGLLoader` falla, o la versión leída es inferior a la esperada. Conviene mostrar la causa real de GLFW en lugar de un mensaje genérico:

```c
GLFWwindow *window = glfwCreateWindow(800, 600, "scop", NULL, NULL);

if (!window)                                /* controlador ausente, antiguo, o version pedida no ofrecida */
{
	const char *description = NULL;         /* texto de GLFW que explica el fallo */

	glfwGetError(&description);             /* lee el ultimo error de GLFW (description puede quedar en NULL) */
	fprintf(stderr, "no se pudo crear la ventana: %s\n", description ? description : "causa desconocida");
	return -1;
}
```

Buena práctica: probar en las dos tarjetas de un portátil, y con `LIBGL_ALWAYS_SOFTWARE=1`, antes de decir que el programa « funciona en todas partes ».

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | GLFW crea la ventana y su contexto OpenGL; GLAD carga después las funciones OpenGL modernas vía `glfwGetProcAddress()`. El double buffering (`glfwSwapBuffers()`) evita que se muestre una imagen a medio dibujar. Un bucle de renderizado repite: eventos, borrado, dibujo, intercambio de búferes. El delta time (duración de la imagen anterior, mediante `glfwGetTime()`) hace las velocidades independientes de los FPS; el vsync (`glfwSwapInterval(1)`) ajusta la visualización a la pantalla. Los límites de la tarjeta (tamaño de textura, de zona de dibujo) cambian de una máquina a otra: se leen; OpenGL solo señala un error mediante un indicador que se lee con `glGetError()`. `glGetString` identifica el controlador; la memoria de la tarjeta no tiene consulta estándar (extensiones); el tamaño de la pantalla se pregunta a GLFW. OpenGL es solo una especificación: el código viene del controlador del fabricante (Mesa o NVIDIA en Linux), que habla con el núcleo (DRM) y luego con la tarjeta; sin tarjeta, `llvmpipe` dibuja con el procesador; con varias tarjetas, una variable de entorno elige la tarjeta. Un cronómetro por uso: la duración de una imagen se recalcula en cada imagen, un fundido se expresa por su duración. |
| **Herramientas utilizables** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`, `glGetIntegerv` (`GL_MAX_TEXTURE_SIZE`, `GL_MAX_VIEWPORT_DIMS`), `glGetError`, `glGetString`, `glfwGetPrimaryMonitor`/`glfwGetVideoMode`, `glfwExtensionSupported`, `glfwGetError`, `lspci`, `lsmod`, `glxinfo -B`, `LIBGL_ALWAYS_SOFTWARE`, `DRI_PRIME`. |
| **Trampas a evitar** | Llamar a GLAD antes de `glfwMakeContextCurrent()`. Apuntar `-I` al nivel de carpeta equivocado para las cabeceras generadas por GLAD. Olvidar `glClear()` antes de redibujar. Mover un objeto una distancia fija por imagen. Refrescar el delta time solo a intervalos regulares. Dejar un delta gigante tras una pausa. Suponer un límite de la tarjeta en lugar de leerlo, llamar a `glGetIntegerv` sin contexto activo, leer un solo error en lugar de vaciar la pila, repetir el mismo mensaje en cada imagen. Mostrar el resultado de `glGetString` sin comprobar `NULL`, tomar `GL_MAX_ELEMENTS_INDICES` por un límite, abrir una ventana mayor que la pantalla, confundir coordenadas de pantalla y píxeles en una pantalla HiDPI. Concluir que el programa funciona en todas partes tras probar una sola tarjeta, o no mostrar la causa de un fallo de `glfwCreateWindow`. Un mismo cronómetro para la duración de imagen y el limitador de un fundido (movimiento hasta 40 veces más rápido sin vsync), un fundido expresado en número de pasos. |
| **Buenas prácticas** | Vendorear un archivo generado de una vez por todas (como el de GLAD) en lugar de depender de él en cada build; reservar esta práctica a archivos que no cambian con regularidad. Expresar las velocidades en unidades por segundo, recalcular el delta time en cada imagen y limitarlo; no apoyarse nunca en el vsync para regular la velocidad. Comparar una imagen con el límite de la tarjeta antes de enviarla, con un mensaje que nombre la imagen, sus dimensiones y el límite. Repetir `glGetError()` hasta `GL_NO_ERROR` y nombrar la etapa controlada. Registrar fabricante, tarjeta y versión al arrancar para reconocer la máquina de un informe de error; comprobar el tamaño de ventana pedido contra el de la pantalla. Probar en cada tarjeta de un portátil y con `LIBGL_ALWAYS_SOFTWARE=1`. Medir un movimiento mantenido a varias cadencias, con y sin vsync. |
