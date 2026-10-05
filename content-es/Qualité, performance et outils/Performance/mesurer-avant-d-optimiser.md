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

## Dónde falla la caché del programa: `cachegrind`

Un profiler dice **dónde** se va el tiempo, no **por qué**. Cuando la memoria es la causa (véase [La jerarquía de caché](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#la-jerarquia-de-cache)), [`cachegrind`](https://valgrind.org/docs/manual/cg-manual.html), una herramienta de Valgrind, ejecuta el programa en un procesador **simulado** y cuenta, por función y por línea, las lecturas de datos y los **fallos de caché** (*cache misses*: un dato ausente de la caché, que hay que ir a buscar más lejos).

Programa de prueba: la misma tabla recorrida en dos órdenes distintos.

```c
#include <stdio.h>
#include <stdlib.h>
#define N 4096                                   /* tabla de 4096 x 4096 enteros: 64 MB */

/* noinline: mantiene dos funciones distintas en el perfil (véase la trampa anterior) */
__attribute__((noinline)) static long suma_filas(const int *t)
{
    long s = 0;

    for (int i = 0; i < N; i++)
        for (int j = 0; j < N; j++)
            s += t[i * N + j];                   /* casillas vecinas en memoria */
    return s;
}

__attribute__((noinline)) static long suma_columnas(const int *t)
{
    long s = 0;

    for (int j = 0; j < N; j++)
        for (int i = 0; i < N; i++)
            s += t[i * N + j];                   /* salto de N enteros en cada acceso */
    return s;
}

int main(void)
{
    int *t = malloc(sizeof(int) * N * N);

    for (long k = 0; k < (long)N * N; k++)
        t[k] = 1;
    printf("%ld %ld\n", suma_filas(t), suma_columnas(t));
    free(t);
    return 0;
}
```

```bash
gcc -O2 -g recorrido.c -o recorrido                      # -g: números de línea en el informe
valgrind --tool=cachegrind --cache-sim=yes ./recorrido   # escribe cachegrind.out.<número>
cg_annotate cachegrind.out.<número>                      # informe por función, luego por línea
```

| Función | Lecturas (`Dr`) | Fallos de la caché L1 (`D1mr`) | Fallos del último nivel, a buscar en RAM (`DLmr`) | Tiempo real, sin Valgrind |
|---|---|---|---|---|
| `suma_filas` | 4,2 M | 1,0 M | 1,0 M | 3,8 ms |
| `suma_columnas` | 16,8 M | 16,8 M | 16,8 M | 105 ms |

`suma_filas` lee 4 enteros por instrucción (el compilador agrupó las lecturas) y solo falla la caché una vez por [línea de caché](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#lineas-de-cache-la-memoria-contigua-es-gratis) de 64 bytes, es decir 16 enteros. `suma_columnas` salta 16 KB en cada lectura: cada una falla la caché, y la función es 28 veces más lenta para el mismo cálculo.

| Trampa | Lo que ocurre | Solución |
|---|---|---|
| Olvidar `--cache-sim=yes` | Desde Valgrind 3.21, la simulación de la caché está desactivada por defecto: el informe solo cuenta las instrucciones (`Ir`), que no muestran la diferencia (84 M para `suma_columnas` frente a 46 M, para un tiempo 28 veces mayor) | Pasar siempre `--cache-sim=yes` |
| Fuentes modificadas después del perfil | `cg_annotate` relee las fuentes actuales: avisa (`Annotations may not be correct`) pero muestra igualmente los recuentos, desplazados tantas líneas como se hayan añadido o quitado | Rehacer el perfil tras cualquier modificación |
| Caché simulada para un solo programa, sin la precarga del procesador | El reparto de la caché L3 entre programas simultáneos no aparece; el procesador real adivina y carga por adelantado las lecturas hechas en orden, lo que la simulación ignora: los fallos de `suma_filas` cuestan allí mucho menos de lo que su número deja pensar | Tratar los recuentos como un orden de magnitud, confirmado por una medición real |

Vivido en el solucionador SAT: `cachegrind` mostró que el 61 % de los fallos de caché en escritura venían de una sola tabla (el nivel y la razón de cada variable, reescritos en cada asignación), una pista que ningún perfil por función daba. Sin embargo, precargar esta tabla por adelantado no ganó nada (+0,4 % y +1,0 % en dos mediciones): el procesador ya absorbe esas escrituras fallidas en su búfer de escritura, y un fallo de caché solo cuesta si hace esperar al procesador.

## Cronometrar una parte de un bucle: el contador de ciclos

`clock_gettime` ([Medir una duración](/?c=langages&s=c&p=mesure-du-temps#medir-una-duracion-clock-gettime-clock-monotonic)) cronometra bien una operación entera. Para conocer la **parte** de unas pocas líneas ejecutadas millones de veces, hace falta una medición más ligera: el **contador de marca de tiempo** del procesador (*Time Stamp Counter*, TSC), que avanza a frecuencia fija y se lee en una sola instrucción, `rdtsc`, disponible en C con el nombre [`__rdtsc()`](https://gcc.gnu.org/onlinedocs/gcc/x86-Built-in-Functions.html).

```c
#include <stdio.h>
#include <stdlib.h>
#include <x86intrin.h>                           /* __rdtsc, _mm_lfence (solo x86) */
#define N (1 << 24)                              /* 16 M enteros: 64 MB, más que la caché */

#ifdef BARRERA
/* espera el final de las instrucciones anteriores antes de leer el contador */
# define CYCLES() (_mm_lfence(), __rdtsc())
#else
# define CYCLES() __rdtsc()
#endif

int main(int argc, char **argv)
{
    int vacio = argc > 1 && argv[1][0] == 'v';    /* ./porcion vacio: parte B sin trabajo */
    int *t = malloc(sizeof(int) * N);
    unsigned long long en_b = 0, x = 1;
    long s = 0;

    for (int k = 0; k < N; k++)
        t[k] = k;
    unsigned long long inicio = CYCLES();
    for (int k = 0; k < N; k++) {
        s += t[k];                               /* parte A: lectura en orden */
        unsigned long long t0 = CYCLES();
        if (!vacio) {
            x = x * 6364136223846793005ULL + 1;  /* parte B: una casilla al azar */
            s += t[x >> 40];
        }
        en_b += CYCLES() - t0;
    }
    unsigned long long total = CYCLES() - inicio;
    printf("suma %ld: parte de B %.0f %%, %.0f ciclos por paso por B\n",
           s, 100.0 * en_b / total, (double)en_b / N);
    free(t);
    return 0;
}
```

```bash
gcc -O2 porcion.c -o porcion                  # lectura simple del contador
gcc -O2 -DBARRERA porcion.c -o porcion_b      # una barrera antes de cada lectura
./porcion ; ./porcion vacio ; ./porcion_b ; ./porcion_b vacio
```

| Lectura del contador | Parte B real | Parte B vacía |
|---|---|---|
| `__rdtsc()` solo | 22 % del tiempo, 26 ciclos por paso | 50 %, 25 ciclos |
| `_mm_lfence()` y luego `__rdtsc()` | 87 %, 318 ciclos | 49 %, 46 ciclos |

Sin barrera, la parte B parece no costar nada más que una parte vacía. El procesador ejecuta en efecto las instrucciones **fuera de orden**: lanza las siguientes sin esperar al final de las anteriores, y `rdtsc` lee el contador antes de que termine la lectura en RAM de la parte B. Ese coste se paga **después** de la medición, en la parte A. `_mm_lfence()`, una **barrera**, espera al final de las instrucciones anteriores: la parte B cuesta entonces 318 − 46 ≈ 270 ciclos, el orden de magnitud de un acceso a RAM dado por [la jerarquía de caché](/?c=qualite-performance-et-outils&s=performance&p=cache-cpu-et-simd#la-jerarquia-de-cache).

| Trampa | Solución |
|---|---|
| Leer el contador sin barrera: un trabajo lanzado en la parte medida se paga después de ella | `_mm_lfence()` antes de cada lectura del contador |
| La propia medición tiene un coste (de 25 a 46 ciclos por paso aquí): una parte muy corta parece más cara de lo que es | Medir también una parte vacía, y restar su coste |
| El contador avanza a frecuencia fija, no al ritmo real del núcleo, que varía con la carga y la temperatura | Razonar en partes de un total medido del mismo modo, no en ciclos absolutos |
| `__rdtsc()` solo existe en los procesadores x86 (Intel, AMD) | `clock_gettime(CLOCK_MONOTONIC)` en los demás procesadores |

Vivido en el solucionador SAT: esta instrumentación situó una prueba añadida a la búsqueda en torno al 7 % del tiempo, es decir, la ganancia máxima que podía aportar una versión más rápida de esa prueba; la versión reescrita ganó un 6,2 %.

## Comparar con contadores de trabajo, no solo con el tiempo

Dos ejecuciones idénticas de un mismo programa pueden diferir en **±15 %** en un portátil (frecuencia del procesador, temperatura). Una ganancia del 5 % medida con cronómetro es entonces invisible en el ruido. Cuando el programa puede contar su **trabajo** (nodos explorados, conflictos, propagaciones), esos contadores son **deterministas**: idénticos de una ejecución a otra.

| Lo que se observa | Lo que significa |
|---|---|
| Contadores idénticos, tiempo más corto | El cambio acelera el mismo trabajo: ganancia de velocidad pura |
| Contadores más bajos | El cambio reduce el propio trabajo (mejor búsqueda) |
| Contadores distintos, tiempo dentro del ruido | Nada concluyente: medir en más instancias |

## Comprobar que dos versiones hacen el mismo trabajo, antes de cronometrarlas

Una optimización **con trabajo idéntico** (reescribir código para que vaya más rápido, sin cambiar nada de lo que calcula) se comprueba **antes** de cualquier medición de tiempo. Si las dos versiones no hacen exactamente el mismo trabajo, la diferencia de tiempo mezcla velocidad y trabajo, y puede ocultar un bug (véase [Medir también después](#medir-tambien-despues)).

| Etapa | Lo que comprueba |
|---|---|
| 1. Mismos resultados y mismos contadores, en muchas entradas variadas | El cambio no modifica el trabajo |
| 2. Solo después, la medición del tiempo (en rondas alternas, sección siguiente) | El mismo trabajo va más rápido |

Para automatizar la etapa 1, el programa escribe lo que es determinista (resultado, contadores) en la salida estándar, y lo que varía de una ejecución a otra (el tiempo) en la [salida de error](/?c=langages&s=bash&p=redirections-et-pipes#redirigir-la-salida-de-error). Un script compara entonces las dos versiones entrada por entrada:

```bash
ok=0; total=0
for tamano in 8 16 24 32 40; do
    for semilla in 1 2 3; do                               # semilla: fija el azar
        ./antiguo "$tamano" "$semilla" > a.txt 2> /dev/null  # resultado y contadores solos
        ./nuevo "$tamano" "$semilla" > b.txt 2> /dev/null
        total=$((total + 1))
        if cmp -s a.txt b.txt; then                        # cmp -s: código 0 si idénticos
            ok=$((ok + 1))
        else
            echo "diferencia: tamaño $tamano, semilla $semilla"
        fi
    done
done
echo "$ok/$total idénticos"
```

[`cmp`](https://man7.org/linux/man-pages/man1/cmp.1.html) compara dos archivos byte a byte; `-s` lo vuelve silencioso, solo cuenta su [código de salida](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-salida-exit). `$((...))` hace un [cálculo](/?c=langages&s=bash&p=variables#aritmetica) en Bash.

Vivido en el solucionador SAT: cada optimización de velocidad pasa primero 49 comprobaciones de este tipo (8 ajustes en un solo proceso sobre cuadrículas de 8 a 40 casillas de lado, más el modo paralelo y una autoprueba), y la medición del tiempo solo empieza con 49 de 49.

## Medir en rondas alternas

Incluso con trabajo idéntico, el tiempo sigue por medir, y la máquina **deriva** durante la medición: temperatura, frecuencia del procesador, otro programa lanzado entretanto. Medir todas las ejecuciones de A y luego todas las de B atribuye esa deriva a la diferencia entre A y B (véase también [La trampa de la medición única](#la-trampa-de-la-medicion-unica)).

| Orden de las mediciones | Si la máquina se ralentiza por el camino |
|---|---|
| A, A, A, luego B, B, B | B parece más lento que A, sin tener nada que ver |
| A, B, luego A, B (rondas alternas) | La deriva afecta a A y a B por igual, y la diferencia entre dos rondas de una misma versión muestra el ruido |

Ejemplo real en el solucionador SAT: 3 cuadrículas, tiempo medio por cuadrícula, una versión de referencia y tres variantes cuyos contadores ya se habían comprobado idénticos (sección anterior), máquina en reposo (ninguna compilación ni otro cálculo durante la medición).

| Versión | Ronda 1 | Ronda 2 | Diferencia con la referencia de la misma ronda |
|---|---|---|---|
| Referencia | 33,8 s | 32,6 s | (base de comparación) |
| Variante a | 33,0 s | 31,4 s | −2,4 % y luego −3,9 % |
| Variante b2 | 33,5 s | 32,1 s | −1,1 % y luego −1,6 % |
| Variante b1 | 33,0 s | 32,7 s | −2,6 % y luego +0,2 % |

| Constatación | Conclusión |
|---|---|
| La referencia gana un 3,6 % entre sus dos rondas, sin ningún cambio | Comparar la variante a de la ronda 2 con la referencia de la ronda 1 daría −7,3 %, el doble de su ganancia real |
| a y b2 ganan en las dos rondas | Ganancias conservadas |
| b1 cambia de signo de una ronda a otra | Nada concluyente: la diferencia está dentro del ruido |

## Una ganancia de micro-benchmark no es una ganancia del programa: el ejemplo de la división

Una división entera es una de las instrucciones más lentas de un procesador: su **latencia** (el tiempo antes de que el resultado esté disponible) se cuenta en decenas de ciclos, frente a unos pocos ciclos de una multiplicación. Cuando el divisor cambia de una vez a otra pero solo toma pocos valores, se puede sustituir la división por una multiplicación por un **inverso precalculado** (ver [Evitar el recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)).

```c
#include <stdint.h>

#define DMAX 128                // mayor divisor usado
#define XBITS 25                // los dividendos se mantienen por debajo de 2^XBITS
static uint64_t inv[DMAX + 1];  // inv[d] = techo de 2^32 / d

void init_inverses(void)
{
    for (uint64_t d = 1; d <= DMAX; d++)
        inv[d] = ((1ULL << 32) + d - 1) / d;
}

// Cociente entero de x entre d, para 1 <= d <= DMAX y x < 2^XBITS
static inline uint32_t dividir(uint32_t x, uint32_t d)
{
    return (uint32_t)(((uint64_t)x * inv[d]) >> 32);
}
```

**Por qué el resultado es exacto.** Sea `e = inv[d] × d − 2³²`: como `inv[d]` se redondea hacia arriba, `0 ≤ e < d`. Entonces `x × inv[d] / 2³² = x/d + x × e / (d × 2³²)`. Mientras `x × e < 2³²` (aquí `x < 2²⁵` y `e < d ≤ 128 = 2⁷`), el término añadido es menor que `1/d`. Ahora bien, la parte fraccionaria de `x/d` vale como máximo `(d − 1)/d`: la suma se queda por debajo del entero siguiente y el truncamiento da exactamente el cociente. Comprobado aquí por enumeración completa: 128 divisores × 2²⁵ dividendos, es decir 2³² casos, 0 errores.

**Cuánto gana, según dónde se mida.** Misma suma calculada con la división (A) y con el inverso (B), en un Intel Core Ultra 5 228V (bajo WSL, Ubuntu 24.04), gcc 13.3 en `-O2`, mediana de 7 rondas alternas, mismas sumas comprobadas:

| Situación medida | A: división | B: inverso | Ganancia de B |
|---|---|---|---|
| 4 M divisiones independientes | 8,6 ms | 2,3 ms | −73 % |
| Cadena en la que cada división espera a la anterior | 22,4 ms | 8,9 ms | −61 % |
| 32 M accesos aleatorios en un array de 128 MB, una división por acceso | 506 ms | 381 ms | −25 % |

La ganancia se diluye a medida que la división pesa menos en el tiempo total: el procesador ejecuta fuera de orden y **oculta** la latencia de la división tras otras instrucciones o la espera de la memoria. En un programa real (el solucionador de puzles de la investigación rush01, donde la división es solo una operación entre muchas), la misma sustitución solo ganó un 0,5 % del tiempo total.

> **Trampa:** concluir a partir de un micro-benchmark (−73 %) que un programa entero irá más rápido. Solo la medición del **programa real** dice lo que vale la optimización, con las [rondas alternas](#medir-en-rondas-alternas) anteriores.
>
> **Buena práctica:** antes de sustituir una división, medir la parte que ocupa en el perfil del programa; si es pequeña, dejar el código simple.

> **Trampa:** el inverso en coma flotante (`1.0 / d`) no sirve: `49 × (1.0 / 49)` vale `0,9999999999999999` y el truncamiento da 0 en lugar de 1. Un valor fuera del dominio anunciado (`x ≥ 2²⁵`, `d > 128`, `d = 0`) da además un resultado erróneo **sin ningún error**.
>
> **Buena práctica:** mantenerse en enteros con un inverso redondeado hacia arriba, comprobar la exactitud por enumeración sobre todo el dominio y proteger la entrada con una aserción. Para un divisor **constante** en tiempo de compilación, es inútil: el compilador ya hace esta sustitución (gcc produce un `imul` para `x / 7` y un `div` para `x / d`).

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
| **Para recordar** | Nunca optimizar sin haber medido: la intuición sobre "qué es lento" suele apuntar al código que parece complicado, no al que realmente cuesta caro. Dos versiones se comparan primero por sus resultados y contadores, y solo después por el tiempo, en rondas alternas. Una ganancia medida en un micro-benchmark no vale para el programa entero: el procesador oculta la latencia de una instrucción lenta (división) tras el resto del trabajo. |
| **Herramientas utilizables** | Un profiler clásico (por función: `gprof`, `perf`, `valgrind --tool=callgrind`), una instrumentación manual por fase cuando el programa pasa su tiempo esperando; contadores de trabajo deterministas para comparar dos versiones; `cachegrind` (`--cache-sim=yes`) para los fallos de caché; `__rdtsc()` precedido de `_mm_lfence()` para la parte de un fragmento de bucle; `cmp -s` para comparar dos salidas. |
| **Trampas a evitar** | Fiarse de una medición única: el ruido (red, caché, carga de la máquina) puede superar el efecto real de una optimización; fiarse de un nombre de función inesperado en un perfil de `gprof` de un programa optimizado (comprobar con `nm -n` o callgrind); `cachegrind` sin `--cache-sim=yes`, o sobre fuentes modificadas desde el perfil; leer el contador de ciclos sin barrera; medir A y luego B en bloque en una máquina que deriva. Concluir a partir de un micro-benchmark (−73 %) que un programa entero ganará otro tanto (0,5 % medido); un inverso en coma flotante, o una entrada fuera del dominio verificado. |
| **Buenas prácticas** | Siempre volver a medir tras una optimización (tiempo Y exactitud del resultado); tomar varias mediciones para distinguir una ganancia real del ruido; comprobar que dos versiones hacen el mismo trabajo antes de cronometrarlas; medir en rondas alternas, con la máquina en reposo. Cuantificar la parte de una instrucción en el perfil antes de sustituirla, y comprobar una sustitución exacta por enumeración sobre todo su dominio. |
