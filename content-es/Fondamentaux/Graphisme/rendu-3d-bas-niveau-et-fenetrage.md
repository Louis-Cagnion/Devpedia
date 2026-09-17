---
order: 1
---

# Renderizado 3D de bajo nivel y ventanas: raycasting al estilo Wolfenstein

Antes de que un motor de juego se encargue de abrir una ventana y dibujar una escena 3D por cuenta de un programa, el programa tiene que hacerlo él mismo: pedir al sistema operativo una zona de visualización, y luego escribir directamente en ella los píxeles que forman la imagen. Este capítulo cubre ese paso de bajo nivel, con el **raycasting**, la técnica que hizo posible *Wolfenstein 3D* (1992) en un hardware demasiado lento para calcular una 3D real.

## Ventanas: obtener una zona donde dibujar

**Abrir una ventana** no ocurre automáticamente: el programa debe pedir al sistema operativo una zona de visualización, recibir eventos de ella (una tecla pulsada, el ratón movido, la ventana cerrada) y entregarle la imagen a mostrar en cada paso. Una biblioteca de ventanas gestiona este intercambio de bajo nivel con el sistema:

| Biblioteca | Papel |
|---|---|
| **X11** (*X Window System*) | El sistema de ventanas estándar en Linux: gestiona ventanas, eventos de teclado/ratón y la visualización en pantalla |
| **MinilibX** | Una pequeña biblioteca construida sobre X11, que simplifica su uso para un programa que solo necesita crear una ventana y dibujar píxeles en ella uno a uno |

Un **bucle de eventos** se ejecuta continuamente mientras la ventana permanece abierta: en cada pasada, comprueba si se pulsó una tecla o se movió el ratón, actualiza el estado del programa en consecuencia, y luego redibuja la imagen.

```text
Mientras la ventana esté abierta:
  1. Comprobar eventos (tecla pulsada, ratón movido, cierre solicitado)
  2. Actualizar el estado del juego (posición del jugador, dirección de vista)
  3. Recalcular la imagen a mostrar
  4. Enviar la imagen a la pantalla
```

> **Trampa:** redibujar toda la imagen en cada pasada aunque nada haya cambiado. Es el mismo principio ya visto en [evitar el recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant): reprocesar solo lo que realmente cambió, aplicado aquí al renderizado de imagen en lugar de a un cálculo del lado del servidor.
>
> **Buena práctica:** redibujar solo cuando el estado del juego ha cambiado realmente (una tecla pulsada, el ratón movido), en lugar de hacerlo incondicionalmente en cada pasada del bucle.

## Escribir directamente en el buffer de memoria de la imagen

MinilibX ofrece dos formas de colocar un píxel en una imagen: `mlx_pixel_put()`, una llamada a función por píxel, o un acceso directo al buffer de memoria de la imagen vía `mlx_get_data_addr()`. Para una imagen redibujada por completo en cada frame (como un renderizado por raycasting), la segunda es notablemente más rápida: una llamada a función por píxel tiene un coste no despreciable, multiplicado por cientos de miles de píxeles por imagen.

`mlx_get_data_addr()` devuelve la dirección de memoria del primer píxel de la imagen, junto con tres datos necesarios para calcular la dirección de un píxel concreto: `line_length` (el número de bytes por línea de la imagen), `bits_per_pixel` (el tamaño en bits de un píxel, normalmente 32) y `endian` (el orden de los bytes).

```c
int line_length, bits_per_pixel, endian;
char *buffer = mlx_get_data_addr(image, &bits_per_pixel, &line_length, &endian);

void ponerPixel(char *buffer, int line_length, int bits_per_pixel, int x, int y, int color)
{
    char *direccion = buffer + (y * line_length) + (x * (bits_per_pixel / 8));

    *(unsigned int *)direccion = color; // escribe directamente los 4 bytes del pixel
}
```

> **Trampa:** olvidar que `bits_per_pixel` se expresa en bits, no en bytes: dividir entre 8 (`bits_per_pixel / 8`) es indispensable para obtener el número de bytes a desplazar por píxel, si no el acceso a memoria apunta al lugar equivocado del buffer.
>
> **Buena práctica:** calcular `line_length` y `bits_per_pixel` una sola vez (al arrancar), y luego recalcular solo la dirección del píxel (`x`, `y` variables) en cada escritura: son los únicos valores que cambian de un píxel a otro.

## El problema: simular 3D sin una 3D real

Calcular una escena 3D completa (cada superficie, cada ángulo de vista) exigía, a principios de los años 90, más potencia de cálculo de la que tenía cualquier ordenador doméstico. El raycasting rodea el problema: en lugar de modelar un volumen 3D real, simula la profundidad a partir de un mapa **2D** (un plano visto desde arriba, como un laberinto), calculando solo la distancia a la pared más cercana en cada dirección observada.

```text
Mapa 2D (vista desde arriba):        Render final (vista del jugador):

# # # # # # #                        La pared cercana se ve alta,
#           #                        la pared lejana se ve baja:
#     @     #    -- raycasting -->   la misma información de distancia,
#           #                        traducida en altura de pared
# # # # # # #                        en pantalla.
```

## Lanzar un rayo por columna de píxeles

Para cada columna vertical de píxeles en pantalla (una imagen de 800 píxeles de ancho necesita 800 cálculos), el programa lanza un **rayo** imaginario desde la posición del jugador, en la dirección correspondiente a esa columna, y avanza ese rayo sobre el mapa 2D hasta que golpea una pared:

```text
Posición del jugador: (x, y)
Dirección del rayo: ángulo de vista del jugador + desplazamiento para esta columna

Avanzar el rayo paso a paso sobre el mapa:
  mientras la celda actual no sea una pared:
    mover el rayo hacia delante un pequeño paso
  -> distancia recorrida = distancia a la pared, en esa dirección
```

Una vez conocida esa distancia, la altura de pared a dibujar en pantalla para esa columna se deduce directamente: cuanto más corta la distancia, más alta se ve la pared (cerca); cuanto más larga, más baja se ve (lejos), exactamente como un objeto real que se encoge con la distancia.

> **Trampa:** avanzar el rayo en pasos fijos demasiado grandes, lo que puede hacer que "salte" por encima de una pared delgada sin llegar a detectar la colisión. Un paso demasiado pequeño, en cambio, ralentiza el cálculo para cada columna de la imagen.
>
> **Buena práctica:** usar un algoritmo de avance por rejilla (*DDA*, *Digital Differential Analyzer*) que salta directamente de una celda de la rejilla a la siguiente en lugar de avanzar en pequeños pasos fijos, garantizando que ninguna pared se pase por alto sin dejar de ser rápido.

## Lo que el raycasting no calcula

El raycasting clásico solo gestiona un único nivel de altura por columna: no puede representar un relieve real (escaleras, un puente sobre un pasillo) ni mirar de forma realista hacia arriba o hacia abajo, a diferencia de un motor 3D real que calcula un volumen completo. Es precisamente esta concesión deliberada, sacrificar el realismo geométrico por la velocidad de cálculo, la que hizo jugable la técnica en el hardware de la época, y la que sigue haciendo de ella hoy un primer proyecto útil para entender el renderizado 3D sin la complejidad de un motor completo.

---

## 📋 Resumen

| | |
|---|---|
| **A recordar** | Una biblioteca de ventanas (X11, MinilibX) da acceso a una zona de visualización y a los eventos de teclado/ratón mediante un bucle que se ejecuta continuamente. El raycasting simula la 3D lanzando un rayo por columna de píxeles sobre un mapa 2D, siendo la distancia a la pared golpeada lo que determina su altura en pantalla. |
| **Herramientas utilizables** | MinilibX/X11 para las ventanas en Linux. `mlx_get_data_addr()` para escribir directamente en el buffer de la imagen en lugar de píxel a píxel. Un algoritmo DDA para avanzar el rayo eficazmente sobre la rejilla del mapa. |
| **Trampas a evitar** | Redibujar toda la imagen en cada pasada sin ninguna condición. Avanzar el rayo en pasos fijos demasiado grandes, arriesgándose a pasar por alto una pared delgada. Olvidar dividir `bits_per_pixel` entre 8 al escribir en el buffer. |
| **Buenas prácticas** | Redibujar solo tras un cambio real en el estado del juego. Usar un DDA en lugar de pequeños pasos fijos para avanzar el rayo. |
