---
order: 9
---

# La gestión de la memoria

A diferencia de lenguajes como [PHP](/?c=langages-de-programmation&s=php&p=php) o [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), que gestionan automáticamente la memoria mediante un recolector de basura (*garbage collector*), el lenguaje C deja en manos del desarrollador la responsabilidad total de asignar y liberar la memoria que necesita su programa. Esto es lo que permite un alto rendimiento y un control preciso de los recursos, a cambio de una vigilancia constante.

## Pila (stack) y montón (heap)

Un programa en C dispone de dos áreas principales de memoria para sus datos:

| | Pila | Montón |
|---|---|---|
| Gestión | Automática (variables locales) | Manual (`malloc`/`free`) |
| Duración | El tiempo del bloque o la función actual | Hasta el `free()` explícito |
| Tamaño | Limitado, fijado al iniciar el programa | Limitado por la RAM/espacio de intercambio disponible |
| Velocidad | Muy rápida (simple desplazamiento de un puntero) | Más lenta (búsqueda de una posición libre) |

```c
void ejemplo(void)
{
    // en la pila, liberado automáticamente al final de la función
    int x = 5;
    int *p = malloc(sizeof(int));  // en el montón, permanece asignado hasta free(p)
    *p = 5;
    free(p);
}
```

## Los arrays de tamaño variable (VLA)

Un VLA (*Variable-Length Array*, array de tamaño variable, [C99](https://en.wikipedia.org/wiki/C99)) es un array declarado como una variable local normal (`int tab[n];`), pero cuyo tamaño `n` es una expresión conocida solo en tiempo de ejecución, no una constante fijada en la compilación. A diferencia de `malloc()` (véase más abajo), permanece en la pila: no hay que hacer `free()`, su memoria se libera automáticamente al final del bloque que lo contiene.

```c
void ejemplo(int n)
{
    int tab[n]; // tamaño decidido en el momento de la llamada, no en la compilación

    for (int i = 0; i < n; i++)
        tab[i] = i;
} // tab desaparece aquí, como cualquier variable local -- no hace falta free()
```

### Trampa n.º 1: el orden de los parámetros

Cuando un VLA es un parámetro de función, su tamaño (`n`) debe declararse **antes** que él en la lista de parámetros:

```c
void construir(int n, int tab[n]); // correcto: n ya existe cuando se declara tab
void construir(int tab[n], int n); // error de compilación: n desconocido en este punto
```

El compilador lee los parámetros de izquierda a derecha: en el momento en que debe calcular el tamaño de `tab`, `n` ya debe haber sido visto.

### Trampa n.º 2: `T (*)[n]` no es `T **`

Un VLA de dos dimensiones pasado como parámetro, como `uint16_t mask[n][n]`, **no** se convierte en un simple puntero a puntero (`uint16_t **`). Se convierte en un puntero a un array de `n` elementos: `uint16_t (*)[n]`.

| | `T (*)[n]` (VLA como parámetro) | `T **` (array de punteros) |
|---|---|---|
| Memoria | Un único bloque contiguo de `n * n` elementos | `n` bloques separados, cada uno asignado de forma independiente |
| Declaración | `void f(int n, T tab[n][n])` | `void f(T **tab)` |
| Acceso `tab[i][j]` | Cálculo de desplazamiento dentro del bloque único | Desreferenciar `tab[i]`, luego acceder dentro de su propio bloque |

Confundir ambos tipos produce un error de compilación explícito (`conflicting types`, o `makes pointer from integer without a cast`): el compilador rechaza pasar un `T **` donde se espera un `T (*)[n]`, y viceversa.

### Otros límites que conocer

| Límite | Detalle |
|---|---|
| Sin comprobación de fallo | A diferencia de `malloc()` (véase más abajo), un VLA demasiado grande no devuelve `NULL`: provoca un desbordamiento de pila, comportamiento indefinido, sin aviso |
| Tamaño fijo tras la declaración | A diferencia de `realloc()` (véase más abajo), un VLA no puede agrandarse una vez declarado |
| Disponibilidad | Convertida en opcional por [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)): un compilador estrictamente conforme puede negarse a soportarlos (comprobar la macro `__STDC_NO_VLA__`) |

Véase también [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs), cuya comprensión es un requisito previo para este capítulo.

## Asignación dinámica de memoria

`malloc()` reserva un bloque de memoria en bruto en el montón, cuyo tamaño se expresa en bytes:

```c
int *array = malloc(5 * sizeof(int)); // reserva espacio para 5 enteros

if (array == NULL) {
    // malloc falló (memoria insuficiente) -> array vale NULL, hay que comprobarlo siempre
    return;
}

for (int i = 0; i < 5; i++) {
    array[i] = i * 10;
}
```

> **Nota:** `malloc()` **no reinicia** la memoria asignada: puede contener cualquier valor residual ("basura"). `calloc(numero, tamano)` hace lo mismo que `malloc(numero * tamano)`, pero además pone todos los bytes a cero.

```c
int *array = calloc(5, sizeof(int)); // 5 enteros, todos inicializados a 0
```

## Cambiar el tamaño de un bloque: `realloc()`

```c
int *array = malloc(3 * sizeof(int));
// ... necesitamos más espacio ...
int *nuevoArray = realloc(array, 6 * sizeof(int));

if (nuevoArray == NULL) {
    // realloc falló: el bloque antiguo "array" sigue siendo válido, no hay que perderlo
    free(array);
    return;
}
array = nuevoArray; // el bloque pudo haberse trasladado a otro lugar de la memoria
```

`realloc()` conserva el contenido existente (truncado si el nuevo tamaño es menor), pero puede desplazar el bloque en memoria si es necesario: por eso nunca se reasigna `array` directamente antes de haber comprobado que `realloc()` no ha devuelto `NULL`.

## Liberar memoria: `free()`

Cada `malloc()`/`calloc()`/`realloc()` que se ejecute correctamente debe corresponder exactamente a un `free()`, cuando el bloque ya no sea útil:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p sigue conteniendo la antigua dirección (puntero colgante): ya no debe utilizarse
p = NULL; // buena práctica: evita un uso accidental tras la liberación
```

## Muchos objetos pequeños: la asignación en arena

Llamar a `malloc()` para cada uno de millones de objetos pequeños sale caro: cada llamada lleva tiempo, y los objetos acaban dispersos en memoria. Una **arena** guarda todos esos objetos **seguidos en un único array grande**, que crece duplicándose con `realloc()`, y cada objeto se designa por su **posición** en ese array.

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    int    *datos;                           // un único array grande para todo
    size_t  tamano;                          // casillas usadas
    size_t  capacidad;                       // casillas reservadas
} t_arena;

// Guarda n enteros seguidos en la arena; devuelve su posición, o (size_t)-1 si falla
size_t arena_agregar(t_arena *a, const int *valores, size_t n)
{
    size_t capacidad = a->capacidad ? a->capacidad : 1024;
    while (a->tamano + n > capacidad)
        capacidad *= 2;                      // duplicar: pocos realloc en total
    if (capacidad != a->capacidad) {
        int *nuevo = realloc(a->datos, capacidad * sizeof(int));
        if (!nuevo)
            return (size_t)-1;               // fallo: la arena queda intacta
        a->datos = nuevo;
        a->capacidad = capacidad;
    }
    memcpy(a->datos + a->tamano, valores, n * sizeof(int));
    a->tamano += n;
    return a->tamano - n;                    // una posición, no un puntero
}
```

| | Un `malloc()` por objeto | Arena |
|---|---|---|
| Número de asignaciones | Una por objeto | Un puñado (el array duplica su tamaño) |
| Ubicación en memoria | Dispersa | Contigua: el procesador lee los objetos vecinos de una vez |
| Liberación | Un `free()` por objeto | Un solo `free()` para todo |
| Eliminar un objeto | `free()` | Deja un hueco: hay que **compactar** uno mismo (desplazarlo todo) |

> **Trampa:** se guarda una **posición** y no un puntero, porque `realloc()` puede mover todo el array a otro lugar de la memoria: un puntero hacia la ubicación antigua dejaría de ser válido (ver [Cambiar el tamaño de un bloque](#cambiar-el-tamano-de-un-bloque-realloc)), mientras que una posición sigue siendo correcta.

## Los cuatro errores de memoria clásicos

| Error | Causa | Consecuencia |
|---|---|---|
| **Fuga de memoria** (*memory leak*) | Un bloque reservado con `malloc` nunca se libera con `free()` | La memoria utilizada por el programa aumenta sin volver a bajar nunca |
| **Use-after-free** | El programa desreferencia un puntero después de su `free()` | Comportamiento indefinido: datos corruptos, fallo del sistema o, peor aún, que "funcione" silenciosamente |
| **Double free** | `free()` se llama dos veces sobre el mismo puntero | Corrupción del gestor de memoria, fallo a menudo diferido y difícil de rastrear |
| **Desbordamiento de búfer** (*buffer overflow*) | Escritura más allá del tamaño realmente asignado de un búfer | Corrupción de memoria adyacente, y una puerta abierta a la ejecución de código arbitrario (véase más abajo) |

```c
int *p = malloc(sizeof(int));
free(p);
free(p); // double free: comportamiento indefinido
```

> **Nota:** estos errores no siempre provocan un fallo inmediato y visible: es justamente lo que los hace difíciles de detectar. Una herramienta como [**Valgrind**](https://valgrind.org) (`valgrind ./mi_programa`) ejecuta el programa e informa con precisión de las fugas de memoria y los accesos no válidos, indicando la línea de código responsable.

## El desbordamiento de búfer (*buffer overflow*), un error con consecuencias de seguridad

A diferencia de los tres errores anteriores (que corrompen la memoria del propio programa, sin intención externa), un desbordamiento de búfer suele ser **el resultado de una entrada controlada por un atacante**: lo que históricamente lo convierte en una de las vulnerabilidades de seguridad más explotadas en C/[C++](/?c=langages-de-programmation&s=cpp&p=cpp).

```c
char buffer[16];
strcpy(buffer, entrada_usuario); // NINGUNA comprobación del tamaño de entrada_usuario
```

Si `entrada_usuario` supera los 16 bytes, `strcpy()` sigue escribiendo más allá de los límites de `buffer`, en la memoria que sigue inmediatamente en la pila, que puede contener otras variables locales, o la **dirección de retorno** de la función actual (el lugar donde el programa debe reanudar su ejecución después del `return`). Un atacante que controle con precisión el contenido escrito puede, en el peor de los casos, reemplazar esa dirección de retorno por la dirección de su elección, desviando el flujo de ejecución del programa hacia código bajo su control (*stack smashing*).

> **Nota:** es el mismo principio que una [inyección SQL](/?c=langages-de-programmation&s=php&p=securite) o una [inyección de comandos Bash](/?c=shells&s=bash&p=variables): una entrada no controlada que modifica la **estructura** de lo que se va a ejecutar, en lugar de seguir siendo un dato pasivo.

### Protegerse

```c
strcpy(buffer, entrada);                      // peligroso: sin límite alguno
strncpy(buffer, entrada, sizeof(buffer) - 1); // acotado al tamaño real del búfer
// strncpy no garantiza la terminación si la fuente es demasiado larga
buffer[sizeof(buffer) - 1] = '\0';

// lectura acotada desde la propia entrada, en vez de corregir después
fgets(buffer, sizeof(buffer), stdin);
```

| Función arriesgada | Alternativa acotada |
|---|---|
| `strcpy()` | `strncpy()` (cuidado con la terminación, véase más arriba) |
| `strcat()` | `strncat()` |
| `sprintf()` | `snprintf()` (trunca en lugar de desbordar) |
| `gets()` | `fgets()` (`gets()` fue además eliminada del estándar C desde [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)), precisamente por esta razón) |

> **Nota:** acotar el tamaño solo resuelve la mitad del problema: también hay que comprobar que el dato truncado siga siendo coherente para el resto del programa (un nombre de archivo cortado a mitad de camino por `strncpy` sigue siendo un nombre de archivo sintácticamente válido, solo que incorrecto). El buen reflejo sigue siendo conocer siempre, en cada escritura, el tamaño real del búfer de destino; nunca suponer que una entrada respetará un tamaño esperado sin comprobarlo.

### La familia BSD `strlcpy`/`strlcat`

De origen BSD (no es estándar C, pero está disponible en macOS/\*BSD, y es fácil de reimplementar uno mismo, como hace la biblioteca `libft` con `ft_strlcpy`/`ft_strlcat`), estas funciones corrigen el punto débil de `strncpy`/`strcat`: detectar un truncamiento.

```c
// SIEMPRE termina en '\0', a diferencia de strncpy
size_t necesario = strlcpy(buffer, entrada, sizeof(buffer));

if (necesario >= sizeof(buffer))
{
    // entrada fue truncada: necesario es el tamaño que habría tenido la copia completa
}
```

`strlcpy()`/`strlcat()` siempre devuelven el tamaño que tendría la cadena fuente (o concatenada) si el búfer hubiera sido lo bastante grande, nunca el número de bytes realmente escritos: comparar ese valor con `sizeof(buffer)` detecta un truncamiento, algo que `strncpy()`/`strcat()` no permiten hacer directamente.

## `sizeof`

`sizeof` no es una función, sino un operador evaluado en tiempo de compilación: devuelve el tamaño en bytes de un tipo o de una variable, indispensable para calcular correctamente el tamaño que hay que asignar:

```c
sizeof(int);       // generalmente 4
sizeof(char);      // siempre 1, por definición del estándar C
sizeof(int) * 10;  // tamaño necesario para 10 enteros -> se pasa a malloc()
```

Véase también [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs), cuya comprensión es un requisito previo para este capítulo.

## Copiar y rellenar bytes: `memcpy()` y `memset()`

Estas dos funciones de `<string.h>` trabajan sobre **bytes en bruto**, sin conocer el tipo de los datos:

```c
#include <stdint.h>
#include <stdio.h>
#include <string.h>

int main(void)
{
    int tab[5];
    memset(tab, 0, sizeof tab);              // pone los 20 bytes a 0: 5 enteros a 0
    int copia[5];
    memcpy(copia, tab, sizeof tab);          // copia los 20 bytes de tab en copia
    memset(tab, 1, sizeof tab);              // trampa: cada BYTE vale 1
    printf("%d\n", tab[0]);                  // 16843009 (0x01010101), no 1

    float f = 1.0f;
    uint32_t bits;
    memcpy(&bits, &f, sizeof bits);          // lee los 4 bytes del float tal cual
    printf("%08X\n", bits);                  // 3F800000: la codificación de 1.0 en memoria
    return 0;
}
```

| Función | Papel | Trampa |
|---|---|---|
| `memset(p, v, n)` | Pone cada uno de los n bytes al valor `v` | `v` rellena **bytes**, no enteros: solo 0 (y -1) dan el mismo valor en un `int` |
| `memcpy(dst, src, n)` | Copia n bytes de `src` a `dst` | Zonas que se solapan: comportamiento indefinido, usar `memmove()` |

El último uso, leer los bits de un `float` como un entero (*type punning*), tiene una versión tentadora pero **prohibida**: `*(uint32_t *)&f`. Acceder a un objeto mediante un puntero de otro tipo viola la regla de **aliasing estricto** de C (comportamiento indefinido, que el optimizador puede aprovechar). `memcpy()` es la forma segura, y el compilador la sustituye por un simple movimiento de 4 bytes.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | C deja en manos del desarrollador toda la responsabilidad de la memoria dinámica (montón): `malloc`/`calloc`/`realloc` para asignar, `free` para liberar; la pila (variables locales, VLA incluidos) se gestiona automáticamente. |
| **Herramientas utilizables** | `malloc`/`calloc`/`realloc`/`free`, `sizeof`, VLA (`int tab[n]`) para un array de tamaño dinámico sin `free()`, Valgrind para detectar fugas y accesos no válidos; `memcpy`/`memset` para copiar o rellenar bytes; una arena para muchísimos objetos pequeños. |
| **Trampas a evitar** | Fuga de memoria (nunca se llama a `free`), use-after-free, double free, desbordamiento de búfer, desbordamiento de pila por un VLA demasiado grande (sin detección posible, a diferencia de `malloc`), confundir `T (*)[n]` (VLA como parámetro) con `T **`. |
| **Buenas prácticas** | Comprobar siempre que un `malloc`/`realloc` no ha devuelto `NULL`; poner un puntero a `NULL` justo después de su `free()`; preferir `fgets`/`strncpy`/`snprintf` a las funciones no acotadas (`gets`/`strcpy`/`sprintf`); `strlcpy`/`strlcat` para detectar un truncamiento mediante su valor de retorno. |
