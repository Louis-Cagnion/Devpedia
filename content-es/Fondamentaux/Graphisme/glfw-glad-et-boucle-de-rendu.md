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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | GLFW crea la ventana y su contexto OpenGL; GLAD carga después las funciones OpenGL modernas vía `glfwGetProcAddress()`. El double buffering (`glfwSwapBuffers()`) evita que se muestre una imagen a medio dibujar. Un bucle de renderizado repite: eventos, borrado, dibujo, intercambio de búferes. El delta time (duración de la imagen anterior, mediante `glfwGetTime()`) hace las velocidades independientes de los FPS; el vsync (`glfwSwapInterval(1)`) ajusta la visualización a la pantalla. Los límites de la tarjeta (tamaño de textura, de zona de dibujo) cambian de una máquina a otra: se leen; OpenGL solo señala un error mediante un indicador que se lee con `glGetError()`. |
| **Herramientas utilizables** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`, `glGetIntegerv` (`GL_MAX_TEXTURE_SIZE`, `GL_MAX_VIEWPORT_DIMS`), `glGetError`. |
| **Trampas a evitar** | Llamar a GLAD antes de `glfwMakeContextCurrent()`. Apuntar `-I` al nivel de carpeta equivocado para las cabeceras generadas por GLAD. Olvidar `glClear()` antes de redibujar. Mover un objeto una distancia fija por imagen. Refrescar el delta time solo a intervalos regulares. Dejar un delta gigante tras una pausa. Suponer un límite de la tarjeta en lugar de leerlo, llamar a `glGetIntegerv` sin contexto activo, leer un solo error en lugar de vaciar la pila, repetir el mismo mensaje en cada imagen. |
| **Buenas prácticas** | Vendorear un archivo generado de una vez por todas (como el de GLAD) en lugar de depender de él en cada build; reservar esta práctica a archivos que no cambian con regularidad. Expresar las velocidades en unidades por segundo, recalcular el delta time en cada imagen y limitarlo; no apoyarse nunca en el vsync para regular la velocidad. Comparar una imagen con el límite de la tarjeta antes de enviarla, con un mensaje que nombre la imagen, sus dimensiones y el límite. Repetir `glGetError()` hasta `GL_NO_ERROR` y nombrar la etapa controlada. |
