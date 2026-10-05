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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | GLFW crea la ventana y su contexto OpenGL; GLAD carga después las funciones OpenGL modernas vía `glfwGetProcAddress()`. El double buffering (`glfwSwapBuffers()`) evita que se muestre una imagen a medio dibujar. Un bucle de renderizado repite: eventos, borrado, dibujo, intercambio de búferes. El delta time (duración de la imagen anterior, mediante `glfwGetTime()`) hace las velocidades independientes de los FPS; el vsync (`glfwSwapInterval(1)`) ajusta la visualización a la pantalla. |
| **Herramientas utilizables** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`, `glfwGetTime`, `glfwSwapInterval`. |
| **Trampas a evitar** | Llamar a GLAD antes de `glfwMakeContextCurrent()`. Apuntar `-I` al nivel de carpeta equivocado para las cabeceras generadas por GLAD. Olvidar `glClear()` antes de redibujar. Mover un objeto una distancia fija por imagen. Refrescar el delta time solo a intervalos regulares. Dejar un delta gigante tras una pausa. |
| **Buenas prácticas** | Vendorear un archivo generado de una vez por todas (como el de GLAD) en lugar de depender de él en cada build; reservar esta práctica a archivos que no cambian con regularidad. Expresar las velocidades en unidades por segundo, recalcular el delta time en cada imagen y limitarlo; no apoyarse nunca en el vsync para regular la velocidad. |
