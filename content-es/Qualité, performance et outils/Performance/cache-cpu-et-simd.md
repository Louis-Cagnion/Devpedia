---
order: 6
---

# Caché de CPU y vectorización (SIMD)

Los capítulos anteriores tratan del tiempo perdido esperando a **otro componente** (red, disco, servicio remoto). Para cálculo puro (sumar números, transformar un array), la misma distinción [coste fijo / coste marginal](/?c=performance&p=limiter-les-aller-retours) existe, pero lo que domina el coste marginal ya no es una latencia de red: es la forma en que el procesador accede a la memoria.

## La jerarquía de caché

Un procesador nunca lee la RAM directamente en cada acceso: varios niveles de memoria, cada vez más pequeños y rápidos, se intercalan entre él y la RAM.

| Nivel | Tamaño típico | Latencia relativa |
|---|---|---|
| Registros | Unas pocas decenas de bytes | ~1 ciclo |
| Caché L1 | 32-64 KB | ~4 ciclos |
| Caché L2 | 256 KB-1 MB | ~15 ciclos |
| Caché L3 | Unos pocos MB (compartida entre núcleos) | ~40 ciclos |
| RAM | Varios GB | ~200 ciclos |

Un **registro** es un espacio de almacenamiento integrado en el propio procesador (no en memoria): es ahí donde coloca los valores sobre los que opera directamente. Un **ciclo** es el latido del reloj interno del procesador, la unidad de tiempo más fina en la que puede actuar; todas las latencias anteriores se expresan en número de ciclos en lugar de en segundos, porque ese número se mantiene estable de una máquina a otra, a diferencia de la duración real de un ciclo (que depende de la frecuencia del procesador).

Estas cifras son órdenes de magnitud (varían según la arquitectura), pero la relación entre ellas es lo que importa: un acceso a RAM cuesta fácilmente 50 veces más que un acceso a L1. Un programa que multiplica las idas y vueltas hacia la RAM en lugar de reutilizar lo que ya está en caché puede ser decenas de veces más lento, con un número de operaciones estrictamente idéntico.

## Líneas de caché: la memoria contigua es "gratis"

El procesador nunca carga un solo byte: siempre carga un bloque de tamaño fijo, la **línea de caché** (64 bytes en la mayoría de las arquitecturas actuales), incluso si solo se pide un byte de ese bloque.

Consecuencia directa: leer datos **contiguos** (un array recorrido en orden) se beneficia de líneas ya cargadas por los accesos anteriores: la mayoría de las lecturas casi no cuestan nada. Leer datos **dispersos** (una lista enlazada, objetos esparcidos en el heap) desencadena una nueva carga de línea en cada acceso, sin reutilizar nada.

> Es la misma unidad (el byte como dirección, el bloque como granularidad de transferencia) que la vista en [La organización de los datos en memoria](/?c=representation-des-donnees&p=organisation-en-memoire): la alineación y el padding influyen directamente en cuántas líneas de caché ocupa una estructura.

## Coste fijo vs coste marginal, aplicado al cálculo

Llamar a una función vectorizada (`array.sum()`, `array * 2`) tiene, como una llamada de red, un **coste fijo**: elegir qué rutina de bajo nivel ejecutar, asignar el array resultado: independiente del número de elementos `n`. El **coste marginal** (el coste por elemento) depende luego de dos cosas: la localidad de memoria vista arriba, y la capacidad del procesador para procesar varios elementos por instrucción en lugar de uno solo.

Es este segundo punto lo que se llama **SIMD** (*Single Instruction, Multiple Data*): una instrucción de procesador que aplica la misma operación a varios valores contiguos de golpe (ej. sumar 8 enteros en una sola instrucción, en lugar de 8 instrucciones separadas). SIMD solo es explotable si los datos son **contiguos y de tamaño uniforme**: exactamente lo que garantiza un array tipado, y nunca lo que garantiza una colección de objetos dispersos.

## Por qué un array NumPy es rápido y una lista [Python](/?c=langages-de-programmation&s=python&p=python) no lo es

Una lista Python es un array de **punteros** hacia objetos, potencialmente dispersos en cualquier lugar del heap y de tamaños diferentes. Un bucle `for` sobre una lista Python debe, en cada iteración: seguir un puntero (acceso a memoria potencialmente fuera de caché), verificar el tipo del objeto apuntado, y luego llamar a la rutina correcta: todo ello dirigido por el intérprete, instrucción por instrucción.

Un [array NumPy](/?c=data-science&p=numpy) (`ndarray`) es un único bloque de memoria **contiguo**, que contiene los valores mismos (no punteros), todos del mismo tipo y del mismo tamaño. Una operación vectorizada (`a + b`) delega en un bucle **compilado** que recorre ese bloque de forma secuencial: las líneas de caché se reutilizan al máximo, y el procesador puede emplear instrucciones SIMD sobre varios elementos a la vez. Mismo número de operaciones aritméticas, pero un coste marginal por elemento muy inferior.

## La trampa de `dtype=object`: contiguo no significa uniforme

Un array NumPy creado con tipos heterogéneos (ej. una mezcla de enteros y cadenas) recae en `dtype=object`: el array sigue siendo un bloque **contiguo**... de punteros hacia objetos Python potencialmente dispersos, de tipos diferentes. Cada acceso vuelve a ser un seguimiento de puntero seguido de una verificación de tipo por elemento: el coste marginal explota y vuelve a ser comparable al de una lista Python, a pesar de la contigüidad del array en sí.

La contigüidad de la memoria es necesaria para beneficiarse de la caché y de SIMD, pero **no suficiente**: también hace falta que los elementos sean de tamaño y tipo uniformes, para que el procesador pueda procesarlos en bloque sin volver a verificar cada uno individualmente.

## Contar los accesos aleatorios a memoria, no las instrucciones

El número de instrucciones ejecutadas es un mal indicador del tiempo real: según la jerarquía de caché anterior, lo que cuesta es el número de accesos **aleatorios** a memoria (los que fallan la caché), no el número de operaciones.

En un solucionador SAT (ver [Los solucionadores SAT y el algoritmo CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)):

| Optimización | Efecto sobre las instrucciones | Efecto sobre el tiempo |
|---|---|---|
| Búsqueda circular del reemplazante ([Gent 2013](https://www.jair.org/index.php/jair/article/view/10839)) | Divide por 2,5 el número de literales recorridos | Ningún cambio |
| Eliminar un acceso aleatorio a memoria por propagación (ver «Filtro por bitmap» más abajo) | Cambia poco el número de instrucciones | −21 % |

La primera optimización reduce el trabajo medido en instrucciones, pero ese trabajo ya estaba en caché: menos instrucciones para el mismo número de accesos a memoria ya baratos no cambia nada. La segunda elimina un acceso que fallaba la caché en cada propagación: un acceso aleatorio menos pesa más que miles de instrucciones menos que, esas sí, ya eran baratas.

> Esto se conecta con [Comparar con contadores de trabajo, no solo con el tiempo](/?c=qualite-performance-et-outils&s=performance&p=mesurer-avant-d-optimiser#comparar-con-contadores-de-trabajo-no-solo-con-el-tiempo): el contador que predice una mejora en un programa limitado por la memoria no es el número de instrucciones, sino el número de accesos a memoria fuera de caché.

## Array de estructuras vs estructura de arrays (AoS/SoA)

Cuando un algoritmo lee y escribe juntos dos campos de un mismo dato en cada paso (por ejemplo la razón y el nivel de decisión de una variable en un solucionador SAT), guardarlos en dos arrays separados (**estructura de arrays**, *Structure of Arrays*, SoA) cuesta dos líneas de caché por acceso: una por array. Guardarlos uno junto al otro en una sola estructura, guardada a su vez en un único array (**array de estructuras**, *Array of Structures*, AoS), hace que quepan en una sola línea de caché si la estructura es suficientemente pequeña.

| Disposición | Qué está próximo en memoria | Líneas de caché tocadas por acceso |
|---|---|---|
| Estructura de arrays (SoA) | Todos los `razon[i]` juntos, todos los `nivel[i]` juntos, por separado | 2 |
| Array de estructuras (AoS) | `razon[i]` y `nivel[i]` uno junto al otro para cada i | 1 |

En este solucionador, agrupar la razón y el nivel de una variable en una sola estructura dio −7 %. La regla no es «AoS siempre es mejor que SoA»: la estructura de arrays sigue siendo preferible en cuanto un algoritmo recorre un solo campo a la vez sobre muchos elementos (el caso típico del cálculo vectorial visto antes en este capítulo). La regla es «guardar juntos lo que se lee y se escribe junto».

> Ver también [AoS and SoA (Wikipedia, en inglés)](https://en.wikipedia.org/wiki/AoS_and_SoA) y [La organización de los datos en memoria](/?c=representation-des-donnees&p=organisation-en-memoire) para la alineación y el padding de una estructura.

## Filtro por bitmap

Un **bitmap** (o *bitset*, array de bits) usa un solo bit por elemento en lugar de un byte o más: 8 elementos caben en un solo byte. Aquí sirve de filtro: antes de cargar una cabecera costosa desde un array de 147 MB (mucho más grande que cualquier caché), un bit dice si hay algo que leer en ese lugar.

| Estructura consultada | Tamaño | Resultado |
|---|---|---|
| Bitmap (1 bit por elemento) | 575 KB, cabe en la caché L2 | Acceso barato, casi siempre en caché |
| Array completo de cabeceras | 147 MB | Acceso aleatorio a memoria costoso (fuera de caché) |

Consultar el bitmap antes de la cabecera evitó el 91 % de las lecturas en el array de 147 MB: la mayoría de los accesos aleatorios costosos se sustituyen por un acceso barato en una estructura que se queda en caché.

> Principio general: filtrar con una estructura pequeña que quepa en caché, antes de pagar un acceso aleatorio en una estructura demasiado grande para caber. Ver también [bit array (Wikipedia, en inglés)](https://en.wikipedia.org/wiki/Bit_array).

## Escribir solo lo que se volverá a leer

Escribir no es gratis: para modificar un dato, el procesador carga primero su línea de caché, igual que para una lectura, y luego tendrá que devolverla a memoria cuando sea desalojada de la caché. Actualizar un dato que nadie volverá a leer es pagar esos accesos para nada.

En un solucionador SAT (ver [Los solucionadores SAT y el algoritmo CDCL](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)), dos estructuras auxiliares, la **fase** registrada de una variable y su posición en el **montículo** de prioridades (ver [la cola de prioridad](/?c=fondamentaux&s=algorithmes&p=file-de-priorite-et-tas-binaire)), solo sirven a las variables **decidibles**: aquellas sobre las que el solucionador tiene derecho a tomar una decisión (en el solucionador Skyscraper, solo una parte de las variables; las demás siempre se deducen por propagación). Actualizarlas también para las demás variables escribe en líneas de caché que nadie leerá nunca. Restringir ambas actualizaciones a las variables decidibles suprime esas escrituras; junto con otros retoques del mismo tipo, la ganancia medida es de un pequeño porcentaje, con contadores de trabajo idénticos.

> El principio se conecta con el filtro por bitmap anterior: en ambos casos, la pregunta planteada antes de actuar es «¿se volverá a leer este dato?», no solo «¿es correcto este cálculo?».

## La TLB y las páginas enormes

Un programa no maneja directamente las direcciones de la memoria física: usa **direcciones virtuales**, que el procesador traduce en cada acceso, **página** a página (un bloque de 4 KB por defecto en Linux). Las traducciones recientes se guardan en una pequeña caché dedicada, la **TLB** (*Translation Lookaside Buffer*). Cuando una traducción no está, el procesador debe buscarla en las tablas de páginas, en memoria: un acceso más, antes incluso de leer el dato.

| Tamaño de página | Memoria cubierta por una TLB de 1000 entradas (orden de magnitud habitual) |
|---|---|
| 4 KB (por defecto) | 4 MB |
| 2 MB (página enorme) | 2 GB |

Un programa que lee al azar en cientos de MB (como el array de 147 MB del filtro por bitmap anterior) falla en la TLB en casi cada acceso con páginas de 4 KB. Con **páginas enormes** de 2 MB, la misma TLB cubre toda esa memoria.

En Linux, las **páginas enormes transparentes** (*Transparent Huge Pages*, THP) se configuran en `/sys/kernel/mm/transparent_hugepage/enabled` ([documentación del núcleo](https://docs.kernel.org/admin-guide/mm/transhuge.html)):

| Modo | Comportamiento |
|---|---|
| `always` | Páginas enormes siempre que sea posible |
| `madvise` | Solo para las zonas que el programa pide con [`madvise(https://man7.org/linux/man-pages/man2/madvise.2.html_HUGEPAGE)`](https://man7.org/linux/man-pages/man2/madvise.2.html) (modo de la máquina usada aquí, con Ubuntu) |
| `never` | Nunca |

Ejemplo en C (ver [la memoria en C](/?c=langages&s=c&p=memoire) para la asignación y `memset`), que cuenta la memoria realmente servida en páginas enormes:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>

#define TAMANO (64UL << 20)                          /* 64 MB */

static long paginas_enormes_kb(void)
{
    FILE *f = fopen("/proc/self/smaps_rollup", "r"); /* balance de memoria del proceso */
    char linea[256];
    long kb = -1;

    while (f && fgets(linea, sizeof linea, f))
        if (sscanf(linea, "AnonHugePages: %ld kB", &kb) == 1)
            break;                                   /* memoria servida en páginas de 2 MB */
    if (f)
        fclose(f);
    return kb;
}

int main(int argc, char **argv)
{
    int pedir = argc > 1 && strcmp(argv[1], "madvise") == 0;
    char *t = aligned_alloc(2UL << 20, TAMANO);      /* inicio alineado en 2 MB */

    if (!t)
        return 1;
    if (pedir && madvise(t, TAMANO, MADV_HUGEPAGE) != 0)
        perror("madvise");                           /* pide páginas enormes */
    memset(t, 1, TAMANO);                            /* escribir asigna las páginas */
    printf("%s: %ld KB en páginas enormes\n", pedir ? "con madvise" : "sin madvise",
           paginas_enormes_kb());
    free(t);
    return 0;
}
```

```
sin madvise: 0 KB en páginas enormes
con madvise: 65536 KB en páginas enormes
```

Sin tocar el código, la biblioteca C estándar de Linux (glibc 2.35 y posteriores) puede hacer la misma petición para todas las asignaciones de `malloc`: `https://lists.gnu.org/archive/html/info-gnu/2022-02/msg00002.html_TUNABLES=glibc.malloc.hugetlb=1 ./programa` ([anuncio de glibc 2.35](https://lists.gnu.org/archive/html/info-gnu/2022-02/msg00002.html)). Medido en un solucionador SAT que lee al azar en varios cientos de MB: −5 % de tiempo en un solo proceso, con el mismo cálculo, y alrededor de −2 %, dentro del ruido, con 4 copias en paralelo. La ganancia depende de lo dispersos que estén los accesos: un programa que recorre su memoria en orden ya aprovecha la caché y gana poco.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un acceso a RAM cuesta ~50× más que un acceso a caché L1. Los datos contiguos y de tipo uniforme (array tipado) se benefician de la caché y de SIMD; los datos dispersos (lista enlazada, objetos esparcidos) recargan una línea de caché en cada acceso. El número de accesos aleatorios a memoria predice el tiempo mucho mejor que el número de instrucciones. Más allá de unos pocos MB leídos al azar, la traducción de direcciones (TLB) también cuesta: las páginas enormes de 2 MB la reducen. |
| **Herramientas utilizables** | Un array tipado y contiguo (NumPy `ndarray`) en lugar de una colección de objetos dispersos para cálculo intensivo; un bitmap como filtro barato antes de un acceso aleatorio costoso; `madvise(MADV_HUGEPAGE)` o `GLIBC_TUNABLES=glibc.malloc.hugetlb=1` para obtener páginas enormes. |
| **Trampas a evitar** | Un array NumPy en `dtype=object`: sigue siendo contiguo en apariencia, pero pierde todo el beneficio de la caché/SIMD (punteros hacia objetos dispersos). |
| **Buenas prácticas** | Preferir un array tipado y contiguo en cuanto el volumen de cálculo lo justifique; recorrer los datos en el orden de su disposición en memoria; guardar juntos (AoS) los campos leídos y escritos juntos, separar (SoA) los recorridos uno a uno sobre muchos elementos; actualizar solo los datos que siguen siendo útiles. |
