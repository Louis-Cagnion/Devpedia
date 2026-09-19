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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | GLFW crea la ventana y su contexto OpenGL; GLAD carga después las funciones OpenGL modernas vía `glfwGetProcAddress()`. El double buffering (`glfwSwapBuffers()`) evita que se muestre una imagen a medio dibujar. Un bucle de renderizado repite: eventos, borrado, dibujo, intercambio de búferes. |
| **Herramientas utilizables** | `glfwCreateWindow`/`glfwMakeContextCurrent`, `gladLoadGLLoader`, `glfwSwapBuffers`/`glfwPollEvents`/`glfwWindowShouldClose`, `glClear`. |
| **Trampas a evitar** | Llamar a GLAD antes de `glfwMakeContextCurrent()`. Apuntar `-I` al nivel de carpeta equivocado para las cabeceras generadas por GLAD. Olvidar `glClear()` antes de redibujar. |
| **Buenas prácticas** | Vendorear un archivo generado de una vez por todas (como el de GLAD) en lugar de depender de él en cada build; reservar esta práctica a archivos que no cambian con regularidad. |
