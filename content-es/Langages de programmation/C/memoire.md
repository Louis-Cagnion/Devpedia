---
order: 5
---

# La gestión de la memoria

A diferencia de lenguajes como PHP o JavaScript, que gestionan automáticamente la memoria mediante un recolector de basura (*garbage collector*), el lenguaje C deja en manos del desarrollador la responsabilidad total de asignar y liberar la memoria que necesita su programa. Esto es lo que permite un alto rendimiento y un control preciso de los recursos, a cambio de una vigilancia constante.

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
    int x = 5;                     // en la pila, liberado automáticamente al final de la función
    int *p = malloc(sizeof(int));  // en el montón, permanece asignado hasta free(p)
    *p = 5;
    free(p);
}
```

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

A diferencia de los tres errores anteriores (que corrompen la memoria del propio programa, sin intención externa), un desbordamiento de búfer suele ser **el resultado de una entrada controlada por un atacante**: lo que históricamente lo convierte en una de las vulnerabilidades de seguridad más explotadas en C/C++.

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
buffer[sizeof(buffer) - 1] = '\0';            // strncpy no garantiza la terminación si la fuente es demasiado larga

fgets(buffer, sizeof(buffer), stdin);        // lectura acotada desde la propia entrada, en vez de corregir después
```

| Función arriesgada | Alternativa acotada |
|---|---|
| `strcpy()` | `strncpy()` (cuidado con la terminación, véase más arriba) |
| `strcat()` | `strncat()` |
| `sprintf()` | `snprintf()` (trunca en lugar de desbordar) |
| `gets()` | `fgets()` (`gets()` fue además eliminada del estándar C desde [C11](https://en.wikipedia.org/wiki/C11_(C_standard_revision)), precisamente por esta razón) |

> **Nota:** acotar el tamaño solo resuelve la mitad del problema: también hay que comprobar que el dato truncado siga siendo coherente para el resto del programa (un nombre de archivo cortado a mitad de camino por `strncpy` sigue siendo un nombre de archivo sintácticamente válido, solo que incorrecto). El buen reflejo sigue siendo conocer siempre, en cada escritura, el tamaño real del búfer de destino; nunca suponer que una entrada respetará un tamaño esperado sin comprobarlo.

## `sizeof`

`sizeof` no es una función, sino un operador evaluado en tiempo de compilación: devuelve el tamaño en bytes de un tipo o de una variable, indispensable para calcular correctamente el tamaño que hay que asignar:

```c
sizeof(int);       // generalmente 4
sizeof(char);      // siempre 1, por definición del estándar C
sizeof(int) * 10;  // tamaño necesario para 10 enteros -> se pasa a malloc()
```

Véase también [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs), cuya comprensión es un requisito previo para este capítulo.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | C deja en manos del desarrollador toda la responsabilidad de la memoria dinámica (montón): `malloc`/`calloc`/`realloc` para asignar, `free` para liberar; la pila (variables locales) se gestiona automáticamente. |
| **Herramientas utilizables** | `malloc`/`calloc`/`realloc`/`free`, `sizeof`, Valgrind para detectar fugas y accesos no válidos. |
| **Trampas a evitar** | Fuga de memoria (nunca se llama a `free`), use-after-free, double free, desbordamiento de búfer, este último explotable como vulnerabilidad de seguridad. |
| **Buenas prácticas** | Comprobar siempre que un `malloc`/`realloc` no ha devuelto `NULL`; poner un puntero a `NULL` justo después de su `free()`; preferir `fgets`/`strncpy`/`snprintf` a las funciones no acotadas (`gets`/`strcpy`/`sprintf`). |
