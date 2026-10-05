---
order: 2.5
---

# La estabilidad de una ordenación, los empates y el ruido reproducible (xorshift)

Ordenar es colocar elementos en un orden. Pero ¿qué ocurre cuando **varios elementos son iguales** para el criterio elegido? Su orden relativo puede cambiar de una máquina a otra, de una biblioteca a otra, e incluso de una ejecución a otra: el resultado ya no se reproduce. Este capítulo muestra cómo comprobarlo, cómo evitarlo y cómo fabricar un pequeño **ruido aleatorio reproducible** que crea precisamente muchos empates que desempatar.

| Noción | Pregunta a la que responde |
|---|---|
| Empate en una ordenación | ¿En qué orden salen dos elementos que el criterio no distingue? |
| Estabilidad | ¿Garantiza la ordenación que conservan su orden de llegada? |
| Desempate por el índice | ¿Cómo obtener el mismo resultado con **cualquier** ordenación? |
| Generador xorshift | ¿Cómo producir números «al azar» que se puedan rejugar de forma idéntica? |

## Empates: ¿qué pasa con el orden?

Ocho alumnos se ordenan por nota. Varios tienen la misma nota: el criterio (la nota) no dice nada sobre el orden de **Alice**, **Chloé** y **Emma**, que tienen todas 12.

```c
#include <stdio.h>
#include <stdlib.h>

typedef struct { const char *nombre; int nota; } alumno;

/* Compara dos alumnos solo por la nota: dos notas iguales son "iguales" para la ordenación. */
static int por_nota(const void *a, const void *b)
{
    const alumno *x = a, *y = b;
    return (x->nota > y->nota) - (x->nota < y->nota);
}

int main(void)
{
    alumno clase[] = {
        {"Alice", 12}, {"Bruno", 15}, {"Chloé", 12}, {"David", 15},
        {"Emma", 12}, {"Farid", 9}, {"Gaëlle", 15}, {"Hugo", 9},
    };
    int n = sizeof clase / sizeof clase[0];

    qsort(clase, n, sizeof clase[0], por_nota);
    for (int i = 0; i < n; i++)
        printf("%2d  %s\n", clase[i].nota, clase[i].nombre);
    return 0;
}
```

Salida:

```
 9  Farid
 9  Hugo
12  Alice
12  Chloé
12  Emma
15  Bruno
15  David
15  Gaëlle
```

Aquí, los alumnos empatados se han quedado en su orden de origen (Alice antes de Chloé antes de Emma). Una ordenación que lo garantiza se llama **estable** (véase [la ordenación por comparación](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) para la definición y los algoritmos estables). La pregunta importante es: **¿es una garantía o un golpe de suerte?**

| Una ordenación... | Lo que se tiene derecho a esperar para dos elementos iguales |
|---|---|
| **estable** | Salen en su orden de origen, siempre |
| **no estable** | Pueden salir en cualquier orden, y ese orden puede cambiar con el tamaño de los datos o con la implementación |

## `qsort` no promete nada

`qsort` es la función de ordenación de la biblioteca estándar del lenguaje [C](/?c=langages-de-programmation&s=c&p=c) (`#include <stdlib.h>`). Recibe el arreglo, el número de elementos, el tamaño de un elemento y una **función de comparación** (un [puntero de función](/?c=langages-de-programmation&s=c&p=pointeurs)) que responde «menor», «igual» o «mayor».

| Argumento de `qsort` | Papel |
|---|---|
| `base` | Inicio del arreglo que se va a ordenar |
| `nmemb` | Número de elementos |
| `size` | Tamaño de un elemento en bytes (`sizeof clase[0]`) |
| `compar` | La función de comparación: negativo si `a` va antes que `b`, 0 si son iguales, positivo en caso contrario |

La norma del lenguaje C es explícita: si dos elementos son iguales para `compar`, **su orden en el resultado no está especificado** (véase la página de manual [`qsort(3)`](https://man7.org/linux/man-pages/man3/qsort.3.html)). Nada obliga a la implementación a ser estable.

El programa siguiente ordena 1.200.000 **índices** (0, 1, 2, ...) según una clave que solo tiene 1.000 valores posibles: hay empates por todas partes. Después cuenta, entre los vecinos de igual clave, cuántos están en desorden (el índice retrocede). También calcula una **huella** ([FNV-1a](https://en.wikipedia.org/wiki/Fowler%E2%80%93Noll%E2%80%93Vo_hash_function)), un número calculado a partir de todo el resultado: dos órdenes distintos dan casi seguro dos huellas distintas. Compilado con `gcc -Wall -Wextra -O2` (véase [la compilación](/?c=langages-de-programmation&s=c&p=compilation)).

```c
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/resource.h>

static const int *g_clave;    /* la clave de cada elemento: g_clave[i] */
static int g_desempate;       /* 1: desempatar los iguales por su índice */

/* Compara dos ÍNDICES i y j según su clave; si hay empate, el índice decide cuando se pide. */
static int por_clave(const void *a, const void *b)
{
    int i = *(const int *)a, j = *(const int *)b;

    if (g_clave[i] != g_clave[j])
        return g_clave[i] < g_clave[j] ? -1 : 1;
    if (g_desempate)
        return (i > j) - (i < j);
    return 0;
}

/* Tamaño del espacio de memoria del proceso, en bytes (1.er campo de /proc/self/statm, en páginas). */
static size_t tamano_memoria(void)
{
    unsigned long paginas = 0;
    FILE *f = fopen("/proc/self/statm", "r");

    if (f) {
        if (fscanf(f, "%lu", &paginas) != 1)
            paginas = 0;
        fclose(f);
    }
    return paginas * 4096;
}

int main(int argc, char **argv)
{
    if (argc < 3) {
        fprintf(stderr, "uso: %s n desempate [margen]\n", argv[0]);
        return 1;
    }
    int n = atoi(argv[1]);
    g_desempate = atoi(argv[2]);
    size_t margen = argc > 3 ? strtoull(argv[3], NULL, 10) : 0;
    int *clave = malloc(sizeof(int) * n), *ord = malloc(sizeof(int) * n);
    uint64_t x = 88172645463325252ull;    /* estado de un generador pseudoaleatorio (véase más abajo) */

    for (int i = 0; i < n; i++) {
        x ^= x << 13; x ^= x >> 7; x ^= x << 17;
        clave[i] = x % 1000;              /* muchos elementos, solo 1000 claves: empates por todas partes */
        ord[i] = i;                       /* ord = los índices 0, 1, 2... que se van a ordenar según su clave */
    }
    g_clave = clave;
    if (margen) {                         /* limita la memoria: solo autoriza `margen` bytes más */
        struct rlimit rl = { tamano_memoria() + margen, tamano_memoria() + margen };
        setrlimit(RLIMIT_AS, &rl);
    }
    qsort(ord, n, sizeof(int), por_clave);

    long desorden = 0;
    uint64_t huella = 1469598103934665603ull;
    for (int i = 0; i + 1 < n; i++)       /* dos vecinos de igual clave cuyo índice retrocede: desorden */
        if (clave[ord[i]] == clave[ord[i + 1]] && ord[i] > ord[i + 1])
            desorden++;
    for (int i = 0; i < n; i++) {         /* huella (FNV-1a) del orden obtenido, para comparar dos ejecuciones */
        huella ^= (uint64_t)ord[i];
        huella *= 1099511628211ull;
    }
    printf("desempate=%d margen=%-8zu : %7ld iguales en desorden, huella %016llx\n",
           g_desempate, margen, desorden, (unsigned long long)huella);
    return 0;
}
```

El tercer argumento recurre a `setrlimit(RLIMIT_AS, ...)` ([página de manual](https://man7.org/linux/man-pages/man2/setrlimit.2.html)): limita la memoria que el programa todavía puede pedir. Las ejecuciones, en Ubuntu 24.04 con glibc 2.39:

```
$ ./estabilidad 200 0
$ ./estabilidad 1200000 0
$ ./estabilidad 1200000 0 5000000
$ ./estabilidad 1200000 0 4000000
$ ./estabilidad 1200000 1
$ ./estabilidad 1200000 1 4000000
```

```
desempate=0 margen=0        :       0 iguales en desorden, huella a3b5c48d1a634d39
desempate=0 margen=0        :       0 iguales en desorden, huella 361e06153f2ad04f
desempate=0 margen=5000000  :       0 iguales en desorden, huella 361e06153f2ad04f
desempate=0 margen=4000000  :  712247 iguales en desorden, huella dd7fa0798a809adf
desempate=1 margen=0        :       0 iguales en desorden, huella 361e06153f2ad04f
desempate=1 margen=4000000  :       0 iguales en desorden, huella 361e06153f2ad04f
```

| Ejecución | Resultado | Lo que muestra |
|---|---|---|
| 200 elementos, sin desempate | 0 desorden | Con una entrada pequeña, `qsort` parece estable |
| 1.200.000 elementos, memoria libre | 0 desorden | Con una entrada grande también: glibc 2.39 ordena aquí por fusión |
| memoria limitada a 5 MB más | 0 desorden, misma huella | Queda sitio suficiente para el búfer |
| memoria limitada a 4 MB más | **712.247 iguales en desorden**, huella distinta | El **mismo programa**, los mismos datos: otro orden |
| con desempate (último argumento `1`) | 0 desorden, **misma huella** en los dos casos | El orden ya no depende de la memoria |

¿Por qué? Observado con `strace` (que lista las llamadas al sistema operativo): durante la ordenación, `qsort` reserva un búfer de **4.800.512 bytes**, el tamaño del arreglo (1.200.000 enteros de 4 bytes), que libera justo después. Una ordenación por fusión necesita ese espacio de trabajo. Cuando la memoria disponible es menor que el arreglo, la petición falla y `qsort` recurre a otra ordenación, sin búfer, que **no es estable** (es lo que mide la línea de 712.247 desórdenes). El resultado depende, pues, de la memoria de la máquina, y no solo de sus datos.

## Desempatar por el índice de origen

El remedio no depende de ninguna implementación: **hacer que todos los elementos sean distintos**. Se ordenan índices (o elementos que llevan su número de origen), y cuando dos claves son iguales, el comparador decide con el índice:

```c
static int por_clave(const void *a, const void *b)
{
    int i = *(const int *)a, j = *(const int *)b;     /* los dos índices comparados */

    if (g_clave[i] != g_clave[j])                     /* claves distintas: la clave decide */
        return g_clave[i] < g_clave[j] ? -1 : 1;
    return (i > j) - (i < j);                         /* claves iguales: el índice de origen decide */
}
```

| Elemento del código | Papel |
|---|---|
| `const void *a` | `qsort` no conoce el tipo de los elementos: el comparador recibe direcciones sin tipo y debe convertirlas (`(const int *)a`) |
| `(i > j) - (i < j)` | Devuelve -1, 0 o 1 sin resta: escribir `i - j` podría desbordar con números grandes |
| `g_clave` | El comparador de `qsort` no tiene parámetro adicional: la clave se lee en un arreglo global (con varios [hilos](/?c=langages-de-programmation&s=c&p=threads), hace falta una variable propia de cada hilo) |

Tras este cambio, dos elementos **nunca son iguales** para el comparador: ya no hay ningún caso en que la implementación elija. El resultado es el mismo para todas las ordenaciones, estables o no, y para todas las ejecuciones (como muestran las dos últimas líneas de la tabla anterior). Casi no cuesta nada: una comparación más cuando las claves son iguales.

| | Estable porque la implementación lo es | Estable porque lo hemos construido |
|---|---|---|
| Garantía | Ninguna según la norma C | Sí, por construcción |
| Depende de | La biblioteca, su versión, la memoria libre | De nada |
| Condición | Ninguna | Tener un número de origen que comparar (un índice, un contador de llegada) |

## Un caso real: la cola de salida de un solucionador

Un [solucionador SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl) que resuelve una cuadrícula de 108 × 108 maneja alrededor de **1,2 millones de variables**. Al comenzar, las clasifica en una cola ([VMTF](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl): prueba las variables en el orden de esa cola). Para que cada copia del solucionador explore de forma distinta, se añade a cada variable un pequeño **ruido**: un número aleatorio minúsculo que perturba la clasificación. Este ruido solo tiene 1.000 valores posibles para 1,2 millones de variables: unas **1.200 variables comparten cada valor**, de modo que cada valor es un empate de 1.200 elementos.

Sin desempate, el orden de esos empates es el que `qsort` quiera producir: la cola de salida, y por tanto toda la búsqueda que sigue, puede cambiar si cambia la máquina o la memoria. Con un desempate por índice creciente, la misma semilla da **siempre** la misma cola, y dos versiones del programa pueden comparar sus contadores línea a línea. El prototipo de investigación solo compara las puntuaciones y aprovecha la estabilidad de la glibc de la máquina; una reescritura debe añadir el desempate por índice en vez de fiarse de ella.

## Un ruido reproducible: xorshift

Un **generador pseudoaleatorio** es una fórmula que, a partir de un número de partida (la **semilla**), produce una sucesión de números que *parecen* azar pero que está **totalmente determinada**: la misma semilla devuelve exactamente la misma sucesión. Es justo lo que hace falta para un ruido que se quiere poder **rejugar** (reencontrar un resultado, comparar dos versiones). El **estado** del generador es el número que guarda en memoria entre dos sorteos.

**xorshift64** ([Marsaglia, 2003](https://www.jstatsoft.org/article/view/v008i14)) es una versión muy corta: tres desplazamientos de bits y tres «o exclusivo» ([operadores binarios](/?c=langages-de-programmation&s=c&p=operateurs-binaires)).

```c
#include <stdint.h>
#include <stdio.h>

/* Un paso de xorshift64: mezcla los 64 bits del estado con tres desplazamientos y tres XOR,
   guarda el resultado como nuevo estado y lo devuelve. */
static uint64_t xorshift64(uint64_t *estado)
{
    uint64_t x = *estado;

    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *estado = x;
}

int main(void)
{
    uint64_t a = 42, b = 42, cero = 0, uno = 1, dos = 2;

    printf("misma semilla (42), dos generadores:\n");
    for (int i = 0; i < 3; i++)
        printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&a), (unsigned long long)xorshift64(&b));

    printf("semilla 0:\n");
    for (int i = 0; i < 3; i++)
        printf("  %20llu\n", (unsigned long long)xorshift64(&cero));

    printf("semillas vecinas 1 y 2, primer sorteo:\n");
    printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&uno), (unsigned long long)xorshift64(&dos));

    uno = 0x9E3779B97F4A7C15ull * 1;      /* la semilla se multiplica primero por una constante grande */
    dos = 0x9E3779B97F4A7C15ull * 2;
    printf("mismas semillas multiplicadas por 0x9E3779B97F4A7C15:\n");
    printf("  %20llu  %20llu\n", (unsigned long long)xorshift64(&uno), (unsigned long long)xorshift64(&dos));
    return 0;
}
```

Salida:

```
misma semilla (42), dos generadores:
           45454805674           45454805674
  11532217803599905471  11532217803599905471
  10021416941527320954  10021416941527320954
semilla 0:
                     0
                     0
                     0
semillas vecinas 1 y 2, primer sorteo:
            1082269761            2164539522
mismas semillas multiplicadas por 0x9E3779B97F4A7C15:
  15860402102123842989  13274060130538134362
```

| Elemento del código | Papel |
|---|---|
| `uint64_t` | Entero sin signo de 64 bits: el estado tiene 2^64 valores posibles |
| `x ^= x << 13` | Desplaza los bits de `x` 13 posiciones hacia la izquierda y luego los mezcla con el antiguo `x` mediante O exclusivo (`^`) |
| `return *estado = x` | El nuevo estado **es** el valor devuelto |
| `0x9E3779B97F4A7C15` | Constante grande (la parte entera de 2^64 dividida por el número áureo) que aleja las semillas vecinas |

Lo que muestra la salida:

| Observación | Consecuencia |
|---|---|
| Dos generadores con la misma semilla dan la misma sucesión | El ruido es **reproducible**: una semilla por proceso, y cada ejecución se puede rejugar |
| La semilla 0 da 0, 0, 0... | Cero es un estado **bloqueado**: los desplazamientos de cero son cero. No partir nunca de 0 |
| Las semillas 1 y 2 dan 1.082.269.761 y luego 2.164.539.522 | El primer sorteo de la semilla 2 es **exactamente el doble** del de la semilla 1: dos semillas vecinas dan comienzos ligados, no independientes |
| Tras la multiplicación por la constante | Los primeros sorteos ya no guardan ninguna relación visible entre sí |

De ahí la línea de la versión del solucionador: `x = 0x9E3779B97F4A7C15 * semilla`, y luego los sorteos. La multiplicación transforma 1, 2, 3... en estados alejados unos de otros.

### Del número de 64 bits al ruido de 0 a 999

El programa siguiente sortea 1.200.000 ruidos `x % 1000` (el **resto** de la división entre 1.000, un número de 0 a 999) y comprueba que los 1.000 valores salen aproximadamente con la misma frecuencia, con la **prueba del χ²** descrita en [Comparar dos ajustes](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages): para 1.000 valores, un resultado honesto vale alrededor de 999, con un margen de ± 45.

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

static uint64_t xorshift64(uint64_t *estado)
{
    uint64_t x = *estado;

    x ^= x << 13;
    x ^= x >> 7;
    x ^= x << 17;
    return *estado = x;
}

int main(void)
{
    enum { N = 1200000, VALORES = 1000 };
    static int cuenta[VALORES];           /* cuenta[v]: cuántas variables han recibido el ruido v */

    for (uint64_t semilla = 1; semilla <= 3; semilla++) {
        uint64_t estado = 0x9E3779B97F4A7C15ull * semilla;
        double esperado = (double)N / VALORES, chi2 = 0;
        int distintos = 0, mas_grande = 0;

        memset(cuenta, 0, sizeof cuenta);
        for (int i = 0; i < N; i++)
            cuenta[xorshift64(&estado) % VALORES]++;   /* el ruido: un número de 0 a 999 */
        for (int v = 0; v < VALORES; v++) {
            distintos += cuenta[v] > 0;
            if (cuenta[v] > mas_grande)
                mas_grande = cuenta[v];
            chi2 += (cuenta[v] - esperado) * (cuenta[v] - esperado) / esperado;
        }
        printf("semilla %llu: %d valores distintos, grupo más grande %d, chi2 = %.1f\n",
               (unsigned long long)semilla, distintos, mas_grande, chi2);
    }
    printf("2^64 mod 1000 = %llu\n", (unsigned long long)((UINT64_MAX % VALORES + 1) % VALORES));
    return 0;
}
```

Salida:

```
semilla 1: 1000 valores distintos, grupo más grande 1304, chi2 = 942.1
semilla 2: 1000 valores distintos, grupo más grande 1323, chi2 = 1044.4
semilla 3: 1000 valores distintos, grupo más grande 1319, chi2 = 1052.4
2^64 mod 1000 = 616
```

| Medida | Valor | Lectura |
|---|---|---|
| Valores distintos | 1.000 de 1.000 | Todos los valores salen |
| Grupo más grande | 1.304 a 1.323, para una media de 1.200 | Es efectivamente el orden de magnitud de **1.200 empates por valor** |
| χ² | 942 a 1.052 (esperado 999 ± 45) | Las desviaciones son las del azar: el resto de la división entre 1.000 es uniforme en la práctica |
| 2^64 mod 1000 | 616 | Esos 616 valores salen una vez más que los demás entre unos 1,8 × 10^16 sorteos posibles: un sesgo del orden de 10^-16, sin efecto |

> **Límite:** xorshift **no** está hecho para la seguridad (el valor devuelto es el propio estado: un solo sorteo conocido permite predecir todos los siguientes) ni para simulaciones estadísticas exigentes. Para un ruido que perturba una clasificación o diversifica copias de un programa, basta de sobra. `rand()` de la biblioteca C también daría un ruido, pero la norma no fija su algoritmo: la sucesión para una semilla dada puede cambiar de una biblioteca a otra.

## Las trampas

| Trampa | Qué ocurre | Remedio |
|---|---|---|
| Contar con la estabilidad de `qsort` | Funciona mientras la memoria alcanza (glibc 2.39), y luego el orden de los iguales cambia sin error ni mensaje | Desempatar por el índice de origen en el comparador |
| Probar la estabilidad con una entrada pequeña | 200 elementos parecen estables: la prueba no dice nada del caso de 1,2 millones | Probar con el tamaño real, y con la memoria limitada |
| Comparador `return a - b` | Desborda con números grandes: orden erróneo sin mensaje | `(a > b) - (a < b)` |
| Semilla 0 con xorshift | La sucesión se queda en 0 para siempre | Multiplicar la semilla por una constante impar y rechazar 0 |
| Semillas vecinas sin mezclar | Comienzos de sucesión ligados (el doble el uno del otro) | Multiplicar la semilla por `0x9E3779B97F4A7C15` |
| Usar xorshift para un secreto | Un sorteo conocido da todos los siguientes | Un generador criptográfico ([`getrandom`](https://man7.org/linux/man-pages/man2/getrandom.2.html)) |
| Concluir sobre el ruido sin probarlo | Un generador o un `% n` mal elegido puede desequilibrar los valores | Verificar la uniformidad con una prueba del χ² |

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | Una ordenación es **estable** si conserva el orden de llegada de los elementos iguales. `qsort` no lo garantiza (norma C): glibc 2.39 ordena por fusión mientras haya disponible un búfer del tamaño del arreglo, y luego pasa a una ordenación no estable (712.247 iguales en desorden con 1,2 millones de elementos y la memoria limitada). Un comparador que desempata por el índice de origen da el mismo resultado con todas las ordenaciones. xorshift64 (tres desplazamientos, tres XOR) produce un ruido reproducible por semilla. |
| **Herramientas utilizables** | `qsort` con un comparador que desempata por índice, una huella (FNV-1a) para comparar dos órdenes, `setrlimit(RLIMIT_AS)` para probar con memoria limitada, `strace` para observar el búfer de `qsort`, xorshift64 con la semilla multiplicada por `0x9E3779B97F4A7C15`, la prueba del χ² para verificar la uniformidad. |
| **Trampas a evitar** | Fiarse de la estabilidad observada de un `qsort`, probarla con una entrada pequeña, un comparador por resta, la semilla 0, semillas vecinas sin mezclar, xorshift para un secreto. |
| **Buenas prácticas** | No dejar nunca que el resultado dependa de la manera en que una ordenación trata los empates: desempatar explícitamente. Una semilla por ejecución, mostrada o fijada, para poder rejugar. Verificar con el tamaño real. |
