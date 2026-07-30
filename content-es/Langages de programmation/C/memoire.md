---
order: 5
---

# La gestión de la memoria

A diferencia de lenguajes como PHP o JavaScript, que gestionan automáticamente la memoria mediante un recolector de basura (*garbage collector*), el lenguaje C deja en manos del desarrollador la responsabilidad total de asignar y liberar la memoria que necesita su programa. Esto es lo que permite un alto rendimiento y un control preciso de los recursos, a cambio de una vigilancia constante.

## Pila (stack) y montón (heap)

Un programa en C dispone de dos áreas principales de memoria para sus datos:

| | Pila | Montón |
|---|---|---|
| Gestión | Automática (variables locales) | Manual (`malloc` / `free`) |
| Duración | El tiempo del bloque o la función actual | Hasta el «`free()`» explícito |
| Tamaño | Limitado, fijado al iniciar el programa | Limitado por la RAM/espacio de intercambio disponible |
| Velocidad | Muy rápida (simple desplazamiento de un puntero) | Más lenta (búsqueda de una posición libre) |

```c
void exemple(void)
{
    int x = 5;            // sur la stack, libéré automatiquement à la fin de la fonction
    int *p = malloc(sizeof(int)); // sur le heap, reste alloué jusqu'à free(p)
    *p = 5;
    free(p);
}
```

## Asignación dinámica de memoria

`malloc()` Reserva un bloque de memoria bruta en el montón, cuyo tamaño se expresa en bytes:

```c
int *tab = malloc(5 * sizeof(int)); // réserve la place pour 5 entiers

if (tab == NULL) {
    // malloc a échoué (mémoire insuffisante) -> tab vaut NULL, à toujours vérifier
    return;
}

for (int i = 0; i < 5; i++) {
    tab[i] = i * 10;
}
```

> **Nota:** `malloc()` **no** **reinicia** la memoria asignada: puede contener cualquier valor residual («basura»). `calloc(número, taille)` hace lo mismo que `malloc(número * taille)`, pero además pone todos los bytes a cero.

```c
int *tab = calloc(5, sizeof(int)); // 5 entiers, tous initialisés à 0
```

## Cambiar el tamaño de un bloque: `realloc()`

```c
int *tab = malloc(3 * sizeof(int));
// ... on a besoin de plus de place ...
int *nouveauTab = realloc(tab, 6 * sizeof(int));

if (nouveauTab == NULL) {
    // realloc a échoué : l'ancien bloc "tab" est toujours valide, ne pas le perdre
    free(tab);
    return;
}
tab = nouveauTab; // le bloc a pu être déplacé ailleurs en mémoire
```

`realloc()` Conserva el contenido existente (truncado si el nuevo tamaño es menor), pero puede desplazar el bloque en memoria si es necesario; por eso nunca se reasigna `tab` directamente antes de haber comprobado que `realloc()` no ha devuelto `NULL`.

## Liberar memoria: `free()`

Cada `malloc()` / `calloc()` / `realloc()` que se ejecute correctamente debe corresponder exactamente a un `free()`, cuando el bloque ya no sea útil:

```c
int *p = malloc(sizeof(int));
*p = 42;
free(p);
// p contient toujours l'ancienne adresse ("dangling pointer") : il ne faut plus l'utiliser
p = NULL; // bonne pratique : empêche une utilisation accidentelle après libération
```

## Los tres errores de memoria más habituales

| Error | Causa | Consecuencia |
|---|---|---|
| **Fuga de memoria** (*memory leak*) | Un bloque `malloc` é n'est jamais `free()` | La memoria utilizada por el programa aumenta sin volver a disminuir nunca |
| **Use-after-free** | El programa desreferencia un puntero tras su «`free()`» | Comportamiento indefinido: datos corruptos, fallo del sistema o, peor aún, «funciona» sin que se note |
| **«Double free»** | Llamada dos veces a «`free()`» sobre el mismo puntero | Corrupción del gestor de memoria, fallo que a menudo se produce de forma diferida y es difícil de rastrear |

```c
int *p = malloc(sizeof(int));
free(p);
free(p); // double free : comportement indéfini
```

> **Nota:** estos errores no siempre provocan un fallo inmediato y visible, lo que los hace difíciles de detectar. Una herramienta como **Valgrind** (`valgrind ./mon_programme`) ejecuta el programa e informa con precisión de las fugas de memoria y los accesos no válidos, indicando la línea de código responsable.

## `sizeof`

`sizeof` No es una función, sino un operador que se evalúa en tiempo de compilación: devuelve el tamaño en bytes de un tipo o de una variable, algo imprescindible para calcular correctamente el tamaño que hay que asignar:

```c
sizeof(int);      // généralement 4
sizeof(char);      // toujours 1, par définition du standard C
sizeof(int) * 10;  // taille nécessaire pour 10 entiers -> à passer à malloc()
```

Véase también el capítulo sobre punteros, cuya comprensión es un requisito previo para este.
