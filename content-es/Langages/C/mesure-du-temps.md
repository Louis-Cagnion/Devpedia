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

## Medir una duración: `clock_gettime(CLOCK_MONOTONIC)`

`gettimeofday()` lee la **hora del reloj de pared**, que puede saltar: ajuste manual, corrección automática por la red (NTP). Una duración calculada a caballo de un salto así es falsa, incluso negativa. Para **medir una duración**, se usa un reloj **monótono**: nunca retrocede, pero su punto de partida es arbitrario (a menudo el arranque de la máquina), así que no da la fecha.

| Reloj (`clock_gettime`) | Mide | Para usar en |
|---|---|---|
| `CLOCK_REALTIME` | La hora real, como `gettimeofday()`; puede saltar | Fechar un evento |
| `CLOCK_MONOTONIC` | El tiempo transcurrido, sin retroceder nunca | Cronometrar una operación |
| `CLOCK_PROCESS_CPUTIME_ID` | El tiempo de cálculo consumido por el proceso (sin las esperas) | Saber si un programa calcula o espera |

```c
#include <stdio.h>
#include <time.h>
#include <unistd.h>

double segundos(clockid_t reloj)
{
    struct timespec t;
    clock_gettime(reloj, &t);                    // segundos + nanosegundos
    return t.tv_sec + t.tv_nsec * 1e-9;
}

int main(void)
{
    double inicio = segundos(CLOCK_MONOTONIC);
    double cpu = segundos(CLOCK_PROCESS_CPUTIME_ID);
    usleep(200000);                              // espera 0,2 s sin calcular
    printf("transcurrido: %.3f s\n", segundos(CLOCK_MONOTONIC) - inicio);     // 0.200 s
    printf("procesador: %.3f s\n", segundos(CLOCK_PROCESS_CPUTIME_ID) - cpu); // 0.000 s
    return 0;
}
```

La diferencia entre las dos medidas muestra que el programa esperó en lugar de calcular: suele ser la primera pregunta que hacerse ante un programa lento.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `gettimeofday()` lee la hora actual (segundos + microsegundos desde el epoch Unix); `usleep()` pausa, pero su duración real puede superar ligeramente el valor pedido. |
| **Herramientas utilizables** | Combinar `tv_sec`/`tv_usec` en un único valor en milisegundos para fechar o comparar instantes; `clock_gettime(CLOCK_MONOTONIC)` para cronometrar una duración. |
| **Trampas a evitar** | Confiar en un único `usleep()` largo para un cronometraje preciso: su imprecisión se acumula. |
| **Buenas prácticas** | Iterar sobre pequeños `usleep()` recomparando el tiempo realmente transcurrido con la duración deseada, para una espera precisa pese a la imprecisión individual de cada `usleep()`. |
