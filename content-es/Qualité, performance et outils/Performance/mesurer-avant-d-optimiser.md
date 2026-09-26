---
order: 1
---

# Medir antes de optimizar

La regla más rentable en rendimiento es también la más ignorada: **nunca optimizar sin haber medido**. La intuición sobre "qué es lento" es fiablemente errónea, porque nos fijamos en el código que nos parece complicado en lugar del código que realmente cuesta caro.

## El caso típico

En un programa de automatización de navegador demasiado lento, mis hipótesis eran: las cargas de página, luego la paginación, luego la extracción de datos. Un profiling dio esto:

| Etapa | Tiempo | Parte |
|---|---|---|
| Espera de un banner de cookies | 12,8s | **50 %** |
| Esperas fijas tras la paginación | ~7,5s | 30 % |
| Cargas de página + extracción | ~5s | 20 % |

La mitad del tiempo se iba en vigilar un banner **que nunca aparecía**: el consentimiento ya estaba registrado en el perfil del navegador. Ninguna de mis tres hipótesis era la verdadera culpable, y el culpable real ni siquiera estaba en mi lista.

## Perfilar por fases, no línea por línea

Un profiler clásico ([`cProfile`](https://docs.python.org/3/library/profile.html) en [Python](/?c=langages-de-programmation&s=python&p=python), la pestaña Rendimiento de un navegador) da el tiempo por función. Es útil para cálculo, mucho menos cuando el programa pasa su tiempo **esperando**: todo aparece bajo un puñado de funciones de espera, sin decir *por qué* se espera.

En ese caso, instrumentar uno mismo las fases lógicas es más elocuente. El principio: envolver las funciones clave para acumular su tiempo, sin tocar el código medido.

```python
import time

timings = []

def cronometrar(modulo, nombre):
    """Reemplaza modulo.nombre por una versión que registra su tiempo de ejecución."""
    original = getattr(modulo, nombre)

    def envoltura(*args, **kwargs):
        inicio = time.perf_counter()
        resultado = original(*args, **kwargs)
        timings.append((nombre, time.perf_counter() - inicio))
        return resultado

    setattr(modulo, nombre, envoltura)

cronometrar(mi_modulo, "esperar_contenido")
cronometrar(mi_modulo, "cerrar_banner")
```

Al agregar luego por nombre, se obtiene el número de llamadas **y** el tiempo acumulado de cada una. El número de llamadas suele ser la información decisiva: una función de 0,3s llamada 40 veces cuesta más que una función de 2s llamada una vez.

> Piense también en mostrar el tiempo **no atribuido** (total medido menos la suma de las fases). Si es alto, su instrumentación no capta lo esencial y sus conclusiones estarán equivocadas.

## Medir también después

Una optimización no vuelta a medir es una creencia. Dos comprobaciones merecen ser sistemáticas:

- **el tiempo bajó realmente**: a veces un cambio "obviamente más rápido" no cambia nada, porque no estaba en el **camino crítico** (la sucesión de etapas dependientes que por sí sola determina la duración total; acelerar una etapa fuera de esa sucesión no acorta nada, ya que el programa de todos modos espera a que terminen las etapas que sí forman parte de ella);
- **el resultado es idéntico**: es la comprobación que se olvida, y es la más importante. Una optimización que rompe silenciosamente la salida es mucho peor que un programa lento.

En el caso anterior, comparar la salida byte a byte antes y después de cada etapa permitió detectar una extracción que se había vuelto incompleta: un bug que ningún cronómetro habría revelado.

## La trampa de la medición única

Una sola medición no dice nada: la red, la caché y la carga de la máquina hacen variar los resultados en decenas de puntos porcentuales. Tome varias mediciones y observe si la diferencia entre dos configuraciones supera su variación natural. Si no, está midiendo ruido.

## Los profilers nativos en Linux: `gprof` y `perf`

Un **profiler** indica en qué funciones pasa su tiempo un programa. Dos herramientas clásicas para un programa compilado (en C, por ejemplo):

| Herramienta | Cómo usarla | Límite |
|---|---|---|
| `gprof` | Compilar con `-pg`, lanzar el programa (escribe `gmon.out`) y luego `gprof -b -p programa gmon.out` | Falsea con la optimización: las llamadas que el compilador mueve o fusiona desaparecen del perfil |
| `perf` | `perf record ./programa` y luego `perf report`, sin recompilar (muestrea gracias a los contadores del procesador) | Denegado a un usuario normal si `/proc/sys/kernel/perf_event_paranoid` vale 3 o 4 (valor por defecto de Ubuntu) |

Resultado de `gprof` en un programa que llama 200 veces a una función `lenta` y 200 veces a una función `rapida`, diez veces más corta (compilado sin optimización):

```
  %   cumulative   self              self     total
 time   seconds   seconds    calls  ms/call  ms/call  name
 88.89      0.56     0.56      200     2.80     2.80  lenta
 11.11      0.63     0.07      200     0.35     0.35  rapida
```

El mismo programa compilado con `-O1` da un perfil vacío («no time accumulated») y una sola llamada a `lenta`: el compilador sacó la llamada del bucle. Cuando `perf` está bloqueado, `valgrind --tool=callgrind` funciona sin permisos especiales (ver [Valgrind](/?c=langages&s=c&p=memoire)), a costa de una ejecución mucho más lenta (simula cada instrucción).

### Trampa: tiempo atribuido a la función equivocada

Con la optimización (`-O2`), el compilador puede **integrar** una función en la que la llama (*inlining*: copia su cuerpo en lugar de la llamada) o crear una **copia especializada** con otro nombre. `gprof` atribuye entonces su tiempo a otra función. Programa de prueba:

```c
#include <stdio.h>

#ifdef SIN_INTEGRACION
# define INTEGRABLE __attribute__((noinline))        /* prohíbe la integración */
#else
# define INTEGRABLE
#endif

static INTEGRABLE double suma_lenta(long n)
{
    double s = 0;

    for (long i = 1; i <= n; i++)
        s += 1.0 / (double)i;                        /* el trabajo real está aquí */
    return s;
}

int main(void)
{
    double total = 0;

    for (int k = 0; k < 20; k++)
        total += suma_lenta(20000000);               /* 20 llamadas a la función lenta */
    printf("%.3f\n", total);
    return 0;
}
```

| Compilación (`cc -O2 -pg`) | Lo que muestra `gprof -b -p` | Lo que pasó realmente |
|---|---|---|
| Tal cual | 100 % del tiempo en `main` | `suma_lenta` se integró en `main`: ya no existe como función |
| Con `-DSIN_INTEGRACION` | 100 % en `frame_dummy`, una sola llamada | GCC creó una copia `suma_lenta.constprop.0` (con el argumento constante copiado dentro), que `gprof` no muestra: atribuye el tiempo a la función situada justo antes en memoria, una rutina de arranque del programa. Y la llamada, sin efectos secundarios, solo se hace una vez en lugar de 20 |

`nm -n programa` (los símbolos del programa ordenados por dirección) muestra al verdadero culpable, justo después:

```
0000000000001240 t frame_dummy
0000000000001250 t suma_lenta.constprop.0
```

El grafo de llamadas (`gprof -q`) no corrige nada: reutiliza los mismos nombres. `valgrind --tool=callgrind` sí nombra la copia (99,7 % de las instrucciones en `suma_lenta.constprop.0`). Vivido en un solucionador SAT: `gprof` atribuía el 11 % del tiempo a `now()`, una pequeña función que lee el reloj, cuando en realidad correspondía a `cancel_until`.

## Comparar con contadores de trabajo, no solo con el tiempo

Dos ejecuciones idénticas de un mismo programa pueden diferir en **±15 %** en un portátil (frecuencia del procesador, temperatura). Una ganancia del 5 % medida con cronómetro es entonces invisible en el ruido. Cuando el programa puede contar su **trabajo** (nodos explorados, conflictos, propagaciones), esos contadores son **deterministas**: idénticos de una ejecución a otra.

| Lo que se observa | Lo que significa |
|---|---|
| Contadores idénticos, tiempo más corto | El cambio acelera el mismo trabajo: ganancia de velocidad pura |
| Contadores más bajos | El cambio reduce el propio trabajo (mejor búsqueda) |
| Contadores distintos, tiempo dentro del ruido | Nada concluyente: medir en más instancias |

## Más hilos, más lento: los programas limitados por la memoria

Un programa puede estar limitado por el **cálculo** (*CPU-bound*) o por los **accesos a memoria** (*memory-bound*, ver [La caché de la CPU](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd)). En el segundo caso, los hilos se disputan el mismo ancho de banda de memoria: añadir más puede **ralentizar** el conjunto. Medido en un solucionador de puzles: 577 ms con un hilo, 893 ms con 8 hilos (ver también [El paralelismo](/?c=qualite-performance-et-outils&s=performance&p=parallelisme)).

Otras dos lecciones del mismo proyecto:

| Constatación | Detalle |
|---|---|
| Lanzar varias búsquedas distintas en paralelo y quedarse con la primera que termina (un **portfolio**) | Muy eficaz contra las instancias catastróficas (ver [Las colas pesadas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#las-colas-pesadas-unas-pocas-instancias-catastroficas)), inútil si la memoria ya es el cuello de botella |
| Validar con instancias de otro origen | Una ganancia medida sobre una sola familia de datos puede no generalizarse (ver [Cuadrados latinos y muestreo uniforme](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme)) |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Nunca optimizar sin haber medido: la intuición sobre "qué es lento" suele apuntar al código que parece complicado, no al que realmente cuesta caro. |
| **Herramientas utilizables** | Un profiler clásico (por función: `gprof`, `perf`, `valgrind --tool=callgrind`), una instrumentación manual por fase cuando el programa pasa su tiempo esperando; contadores de trabajo deterministas para comparar dos versiones. |
| **Trampas a evitar** | Fiarse de una medición única: el ruido (red, caché, carga de la máquina) puede superar el efecto real de una optimización; fiarse de un nombre de función inesperado en un perfil de `gprof` de un programa optimizado (comprobar con `nm -n` o callgrind). |
| **Buenas prácticas** | Siempre volver a medir tras una optimización (tiempo Y exactitud del resultado); tomar varias mediciones para distinguir una ganancia real del ruido. |
