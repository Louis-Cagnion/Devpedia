---
order: 27
---

# Medir el tiempo y esperar con precisión

Un programa que necesita fechar un evento o esperar una duración precisa no puede conformarse con un simple contador de bucle: la velocidad de ejecución depende del procesador y de su carga. Dos herramientas estándar responden a esta necesidad: `gettimeofday()` para leer la hora actual, `usleep()` para pausar.

## Leer la hora actual: `gettimeofday()`

```c
#include <sys/time.h>

struct timeval tv;
gettimeofday(&tv, NULL);

long milisegundos = tv.tv_sec * 1000 + tv.tv_usec / 1000;
```

`gettimeofday()` rellena una estructura `timeval` con dos campos: `tv_sec` (segundos transcurridos desde una referencia fija, el *epoch* Unix del 1 de enero de 1970) y `tv_usec` (microsegundos adicionales, entre 0 y 999999). Combinar ambos en un único valor en milisegundos (`tv_sec * 1000 + tv_usec / 1000`) simplifica luego cualquier comparación o resta entre dos instantes.

## Pausar: `usleep()` y su imprecisión

`usleep(microsegundos)` pausa el hilo o proceso actual, pero su precisión real depende del planificador del sistema: la pausa puede durar ligeramente **más** de lo pedido (nunca menos), ya que el planificador solo garantiza un mínimo, no una duración exacta.

> **Trampa:** encadenar varios `usleep()` sucesivos creyendo obtener un cronometraje preciso. Cada llamada individual puede excederse ligeramente, y esos pequeños excesos se acumulan con las llamadas repetidas.
>
> **Buena práctica:** para una espera realmente precisa, comparar el tiempo realmente transcurrido (vía `gettimeofday()`) con la duración deseada, dentro de un bucle que vuelve a llamar a `usleep()` en pequeños incrementos hasta alcanzar la duración exacta:

```c
void esperaPrecisa(long duracionMs)
{
    long inicio = tiempoActualMs(); // gettimeofday(), ver más arriba

    while (tiempoActualMs() - inicio < duracionMs) {
        usleep(1000); // reevalúa cada milisegundo en lugar de un único usleep() largo
    }
}
```

Este patrón de **espera activa** (*busy-wait*) recalcula el tiempo realmente transcurrido en cada iteración en lugar de confiar en un único `usleep()` de la duración total: la ligera imprecisión de cada `usleep(1000)` individual queda corregida por el propio bucle, que solo se detiene cuando el tiempo deseado se ha alcanzado realmente.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `gettimeofday()` lee la hora actual (segundos + microsegundos desde el epoch Unix); `usleep()` pausa, pero su duración real puede superar ligeramente el valor pedido. |
| **Herramientas utilizables** | Combinar `tv_sec`/`tv_usec` en un único valor en milisegundos para fechar o comparar instantes. |
| **Trampas a evitar** | Confiar en un único `usleep()` largo para un cronometraje preciso: su imprecisión se acumula. |
| **Buenas prácticas** | Iterar sobre pequeños `usleep()` recomparando el tiempo realmente transcurrido con la duración deseada, para una espera precisa pese a la imprecisión individual de cada `usleep()`. |
