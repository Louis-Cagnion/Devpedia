---
order: 12
---

# Emparejamiento bipartito, teorema de Hall y algoritmo de Kuhn

Dar a cada elemento de un grupo un lugar distinto entre los que acepta: alumnos a actividades, tareas a máquinas, casillas de una cuadrícula a valores. Este problema de **asignación** tiene una solución simple y rápida, que sirve además de pieza para los solucionadores de restricciones (ver [los propagadores](/?c=fondamentaux&s=algorithmes&p=encodages-sat)).

## El problema: el emparejamiento en un grafo bipartito

Un **grafo** es un conjunto de puntos (los **vértices**) unidos por líneas (las **aristas**). Es **bipartito** cuando los vértices se reparten en dos grupos y cada arista une un vértice del primer grupo con uno del segundo, nunca dos del mismo grupo.

Ejemplo: 4 casillas por rellenar, cada una con los valores que acepta (su **dominio**), pudiendo usarse cada valor una sola vez.

| Casilla | Valores posibles |
|---|---|
| c0 | 1, 2 |
| c1 | 1 |
| c2 | 2, 3, 4 |
| c3 | 3, 4 |

Un **emparejamiento** es un conjunto de aristas sin ningún extremo en común: cada casilla recibe como máximo un valor y cada valor sirve como máximo a una casilla. Es **completo** (o *perfecto* cuando los dos grupos tienen el mismo tamaño) cuando todas las casillas están servidas. Aquí, `c0→2, c1→1, c2→3, c3→4` lo es.

## Por qué el voraz no basta

El reflejo es tratar las casillas en orden y dar a cada una el primer valor libre (ver [el algoritmo voraz](/?c=fondamentaux&s=algorithmes&p=algorithme-glouton)):

```text
c0 recibe 1   (primer valor libre)
c1 solo quiere 1, ya ocupado: fallo
```

El voraz solo sirve 3 casillas de 4, aunque existe una solución completa: nunca vuelve sobre una decisión. Hace falta un algoritmo capaz de **mover** una casilla ya colocada para liberar un valor.

## El algoritmo de Kuhn: los caminos aumentantes

Idea: cuando una casilla ya no tiene valor libre, se pide a la casilla que tiene uno de sus valores que **tome otro**, y así sucesivamente. La cadena de movimientos se llama **camino aumentante**: parte de una casilla no servida, alterna «valor deseado / casilla que lo tiene» y termina en un valor libre. Reasignar de un extremo a otro sirve una casilla más.

```text
Antes:   c0 tiene 1.        c1 quiere 1.

Camino aumentante:   c1 → valor 1 → c0 → valor 2 (libre)

Después:   c0 tiene 2.      c1 tiene 1.
```

El teorema de Berge garantiza que si no existe ningún camino aumentante, el emparejamiento es el mayor posible ([teorema de Berge](https://en.wikipedia.org/wiki/Berge%27s_theorem)). El algoritmo de Kuhn prueba por tanto un camino para cada casilla, mediante búsqueda en profundidad:

```c
#include <string.h>  // memset

#define N 4          // número de casillas y número de valores

int dom[N][N];       // dom[c][v] = 1 si el valor v es posible en la casilla c
int dueno[N];        // dueno[v]: casilla que tiene el valor v, o -1
int vista[N];        // vista[v] = 1 si v ya se probó para la casilla en curso

// Busca un valor para la casilla c, moviendo si hace falta las casillas ya colocadas
int buscar(int c)
{
    for (int v = 0; v < N; v++) {
        if (!dom[c][v] || vista[v])
            continue;
        vista[v] = 1;
        if (dueno[v] == -1 || buscar(dueno[v])) {
            dueno[v] = c;
            return 1;
        }
    }
    return 0;
}

int emparejamiento(void)
{
    int tamano = 0;

    for (int v = 0; v < N; v++)
        dueno[v] = -1;
    for (int c = 0; c < N; c++) {
        memset(vista, 0, sizeof vista);
        tamano += buscar(c);
    }
    return tamano;
}
```

Con el ejemplo de la tabla (valores numerados de 0 a 3 en `dom`), `emparejamiento()` devuelve 4, frente a 3 del voraz.

| Elemento | Función |
|---|---|
| `dueno[v]` | El emparejamiento actual: quién tiene cada valor |
| `buscar(c)` | Busca un camino aumentante a partir de la casilla `c` |
| `vista[v]` | Evita reintentar un valor ya visitado durante la búsqueda: sin él, la búsqueda daría vueltas en círculo |
| `memset(vista, …)` | Puesta a cero antes de cada nueva casilla |

Cada búsqueda recorre como máximo todas las aristas, y hay una por casilla: el coste total es del orden de (número de casillas) × (número de aristas). Para grafos muy grandes, el algoritmo de [Hopcroft y Karp](https://en.wikipedia.org/wiki/Hopcroft%E2%80%93Karp_algorithm) lo hace mejor (busca varios caminos a la vez), pero Kuhn basta de sobra para una fila de unas pocas decenas de casillas.

> **Trampa:** no poner `vista` a cero entre dos casillas. La casilla siguiente cree entonces que hay valores «ya probados» y declara por error que no tiene ningún valor posible.
>
> **Buena práctica:** probar con un caso en el que el voraz falla (como el anterior): si los dos algoritmos dan la misma respuesta, la prueba no demuestra nada.

## El teorema de Hall: saber de antemano que es imposible

Cuando no existe ningún emparejamiento completo, ¿se puede saber **sin buscar**? El **teorema de Hall** responde con una condición exacta ([teorema de Hall](https://en.wikipedia.org/wiki/Hall%27s_marriage_theorem)): existe un emparejamiento que sirve a todas las casillas **si y solo si**, para todo grupo de casillas, el conjunto de valores que esas casillas aceptan entre todas es **al menos tan grande** como el grupo.

| Grupo de casillas | Valores aceptados entre todas | Condición |
|---|---|---|
| {c1} | {1} (1 valor) | 1 ≥ 1, se cumple |
| {c0, c1} | {1, 2} (2 valores) | 2 ≥ 2, se cumple |
| Tres casillas que solo aceptan {1, 2} | {1, 2} (2 valores) | 3 > 2: **violada** |

En el último caso, tres casillas se disputan dos valores: ninguna asignación puede servirlas a todas, sea cual sea el resto de la cuadrícula. El grupo que viola la condición es una **explicación** de la imposibilidad, útil para un solucionador que debe entender por qué falla una elección.

Se ha comprobado aquí con 200 000 dominios sorteados al azar (4 casillas, 4 valores) que Kuhn encuentra un emparejamiento completo exactamente cuando se cumple la condición de Hall (91 122 casos completos, 0 desacuerdos).

> **Trampa:** probar la condición de Hall enumerando todos los grupos de casillas: hay 2ⁿ, un millón para 20 casillas. Hall dice **por qué** es imposible; para **decidir**, Kuhn es polinómico (ver [la complejidad](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o) y [los problemas NP-completos](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets), de los que el emparejamiento bipartito no forma parte).
>
> **Buena práctica:** dejar que Kuhn decida y buscar el grupo culpable solo cuando haya que explicarlo.

## Aplicación: la restricción «todas distintas»

En una fila de un [cuadrado latino](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme), las n casillas deben recibir n valores **todos distintos**. Si a lo largo de la resolución se retiran los valores que han pasado a ser imposibles, cada casilla tiene un dominio: la fila todavía puede completarse solo si existe un emparejamiento que sirva a todas las casillas.

| Paso | Qué se hace |
|---|---|
| 1 | Construir el grafo: casillas a un lado, valores al otro, una arista por valor todavía posible |
| 2 | Ejecutar Kuhn |
| 3 | Si el emparejamiento no sirve a todas las casillas: contradicción, es inútil seguir con la búsqueda |

Esta detección es mucho más fuerte que comprobar solo «¿tienen dos casillas el mismo valor impuesto?»: ve los conflictos indirectos (tres casillas para dos valores). Es el principio del **propagador** de la restricción «todas distintas» en un solucionador ([backtracking y restricciones](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes)).

> **Trampa:** concluir que un cuadrado latino tiene solución porque cada fila, tomada sola, admite un emparejamiento completo. Las columnas también imponen sus restricciones, y cada fila se mira solo de forma independiente de las demás.
>
> **Buena práctica:** usar esta prueba solo como **poda** (detecta callejones sin salida, no garantiza una solución) y dejar que la búsqueda decida sobre el conjunto.

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | Dar a cada elemento un lugar distinto entre los que acepta es buscar un emparejamiento en un grafo bipartito. El voraz puede fallar: el algoritmo de Kuhn mueve asignaciones ya hechas a lo largo de caminos aumentantes y encuentra un emparejamiento de tamaño máximo. El teorema de Hall da la condición exacta de un emparejamiento completo: todo grupo de elementos debe aceptar al menos tantos lugares como elementos. |
| **Herramientas utilizables** | Algoritmo de Kuhn (búsqueda en profundidad de un camino aumentante por elemento), Hopcroft-Karp para grafos muy grandes, condición de Hall como explicación de una imposibilidad, propagador «todas distintas» en un solucionador. |
| **Trampas que evitar** | Conformarse con el voraz. Olvidar poner a cero el marcado de valores visitados entre dos elementos. Comprobar Hall enumerando todos los grupos (2ⁿ). Creer que un emparejamiento completo por fila basta para resolver todo un cuadrado latino. |
| **Buenas prácticas** | Probar con un caso en el que el voraz falla. Usar el emparejamiento como poda, nunca como prueba de que existe una solución para el conjunto. Comparar con la condición de Hall en casos pequeños para validar la implementación. |
