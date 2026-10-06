---
order: 12
---

# Emparejamientos, prueba de Hall y filtrado de Régin

El [teorema de Hall](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets#el-teorema-de-hall-cuando-las-casillas-se-bloquean-entre-si) explica por qué unas casillas pueden bloquearse entre sí sin que ninguna, por separado, tenga problema. Este capítulo muestra **cómo lo detecta un programa** y cómo va más lejos: quitar de una casilla los valores que nunca podrá tomar. Es lo que hace el solucionador de Skyscraper en las filas y columnas casi llenas de su cuadrícula (véanse los [solucionadores SAT](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl)).

## La restricción «todos distintos»

Una fila de un [cuadrado latino](/?c=fondamentaux&s=mathematiques&p=carres-latins-et-tirage-uniforme) contiene cada valor exactamente una vez. Cada casilla tiene un **dominio**: la lista de valores aún no excluidos (véase [la propagación de restricciones](/?c=fondamentaux&s=algorithmes&p=backtracking-et-satisfaction-de-contraintes#reducir-los-dominios-antes-incluso-de-intentar-la-propagacion-de-restricciones)). Una regla como «estas casillas toman valores todos distintos» se llama **restricción global**: afecta a varias casillas a la vez.

La propagación simple solo quita un valor cuando una casilla está **fijada**: la casilla X1 vale 2, así que el 2 desaparece de las demás. Se le escapan deducciones que exigen razonar sobre un grupo:

| Casilla | Dominio | Deducción posible |
|---|---|---|
| X1 | 1 o 2 | |
| X2 | 1 o 2 | |
| X3 | 1, 2, 3 o 4 | X1 y X2 se reparten el 1 y el 2: X3 no puede valer ni 1 ni 2 |

Ninguna casilla está fijada, la propagación simple no ve nada. Sin embargo, X3 vale 3 o 4. Un trozo de código dedicado a esta restricción, un [propagador](/?c=fondamentaux&s=algorithmes&p=encodages-sat#propagadores-y-generacion-perezosa-de-clausulas), puede hacer este razonamiento.

## Dibujar el problema: casillas a un lado, valores al otro

Un **grafo** es un conjunto de puntos unidos por líneas. Aquí hay dos familias de puntos: las casillas a la izquierda, los valores a la derecha, y una línea entre una casilla y cada valor de su dominio. Un grafo cuyos puntos se reparten en dos familias, sin ninguna línea dentro de una misma familia, se llama **bipartito**.

| Casilla | Dominio = líneas hacia los valores |
|---|---|
| A | 1, 2 |
| B | 1, 3 |
| C | 1 |
| D | 3, 4 |

Un **emparejamiento** es una elección de líneas sin ningún extremo común: cada casilla tiene como máximo un valor, cada valor como máximo una casilla. Un **emparejamiento perfecto** empareja **todas** las casillas: es exactamente una manera de rellenar la fila con valores todos distintos.

```
casillas :  A    B    C    D
            │    │    │    │
valores :   2    3    1    4        un emparejamiento perfecto
```

| Vocabulario | Significado |
|---|---|
| Emparejamiento | Líneas sin extremo común |
| Emparejamiento perfecto | Una línea para cada casilla |
| Poseedor de un valor | La casilla emparejada con ese valor |
| Conjunto de Hall | Un grupo de k casillas cuyos dominios reunidos suman menos de k valores |

## Encontrar un emparejamiento: el camino aumentante (algoritmo de Kuhn)

Se colocan las casillas una a una. Cuando el valor deseado ya está ocupado, no se renuncia: se **pide a su poseedor que se aparte**, si puede tomar otro valor; y este puede a su vez pedírselo a otro... La sucesión de estos desplazamientos se llama **camino aumentante**: al final, una casilla más tiene valor. Este método, conocido como algoritmo de Kuhn, deriva del método húngaro de [Kuhn (1955)](https://doi.org/10.1002/nav.3800020109).

| Etapa | Casilla | Qué ocurre | Emparejamiento después |
|---|---|---|---|
| 1 | A | Toma 1 | A=1 |
| 2 | B | Quiere 1, que posee A. A puede tomar 2: A se aparta, B toma 1 | B=1 A=2 |
| 3 | C | Quiere 1, que posee B. B puede tomar 3: B se aparta, C toma 1 | C=1 A=2 B=3 |
| 4 | D | Quiere 3, que posee B, al que ya no le queda valor libre (su valor 1 lo tiene C, que no tiene otra opción). Prueba 4: libre | C=1 A=2 B=3 D=4 |

El **algoritmo voraz** (dar a cada casilla el primer valor libre, sin volver nunca sobre una decisión, véase [el algoritmo voraz](/?c=fondamentaux&s=algorithmes&p=algorithme-glouton)) fracasa en este ejemplo: A toma 1, B toma 3, C solo quiere 1 y se queda sin nada, aunque existe un emparejamiento perfecto. El [teorema de Berge](https://en.wikipedia.org/wiki/Berge%27s_theorem) (1957) garantiza que, cuando ya no queda ningún camino aumentante, el emparejamiento es de tamaño máximo. Para grafos muy grandes, [Hopcroft y Karp](https://en.wikipedia.org/wiki/Hopcroft%E2%80%93Karp_algorithm) lo hacen mejor (varios caminos a la vez); Kuhn basta para una fila de unas pocas decenas de casillas.

Cada dominio es una **máscara de bits** (el bit `v` vale 1 si el valor `v` es posible; véanse [las máscaras](/?c=langages&s=c&p=operateurs-binaires#las-mascaras-la-verdadera-utilidad-del-dia-a-dia)): un `uint64_t` basta para 64 valores, y «tomar el menor valor posible» es una sola instrucción (`__builtin_ctzll`, véase [recorrer los bits a 1](/?c=langages&s=c&p=operateurs-binaires#recorrer-los-bits-a-1-las-funciones-integradas-del-compilador)).

El código de este capítulo se guarda en un archivo de cabecera llamado `emparejamiento.h`, que los ejemplos siguientes incluyen.

```c
/* Emparejamiento casillas / valores, prueba de Hall y filtrado de Régin.
   dominio[i]: máscara de la casilla i, el bit v vale 1 si el valor v sigue siendo posible.
   Como máximo 64 casillas y 64 valores: una máscara cabe en un uint64_t. */
#include <stdint.h>

/* Busca un camino aumentante desde la casilla i (algoritmo de Kuhn).
   vistas: valores ya probados durante esta búsqueda. */
static inline int ampliar(int i, const uint64_t *dominio, int *poseedor, uint64_t *vistas)
{
    uint64_t m;

    while ((m = dominio[i] & ~*vistas)) {       /* valores posibles aún no probados */
        int v = __builtin_ctzll(m);             /* la menor de ellas */

        *vistas |= 1ull << v;                   /* cada valor se prueba una sola vez */
        if (poseedor[v] < 0 || ampliar(poseedor[v], dominio, poseedor, vistas)) {
            poseedor[v] = i;                    /* i toma v; el anterior se mueve */
            return 1;
        }
    }
    return 0;
}

/* Empareja las n casillas con valores todos distintos.
   Devuelve -1 si todo está emparejado, si no la primera casilla sin valor; *vistas
   contiene entonces los valores que alcanzó la búsqueda: el conjunto de Hall. */
static inline int emparejar(int n, const uint64_t *dominio, int *poseedor, uint64_t *vistas)
{
    for (int v = 0; v < 64; v++)
        poseedor[v] = -1;
    for (int i = 0; i < n; i++) {
        *vistas = 0;
        if (!ampliar(i, dominio, poseedor, vistas))
            return i;
    }
    return -1;
}
```

| Elemento | Papel |
|---|---|
| `dominio[i]` | Máscara de los valores aún posibles para la casilla `i` |
| `poseedor[v]` | La casilla que posee el valor `v`, o -1 si está libre |
| `vistas` | Los valores ya probados durante **esta** búsqueda: un valor se prueba una sola vez, lo que garantiza que la búsqueda termina |
| `ampliar` | Función **recursiva** (se llama a sí misma, véase [la inserción recursiva](/?c=langages&s=c&p=arbres-binaires#insercion-recursiva)): pide al poseedor que se aparte |
| `emparejar` | Lanza una búsqueda por casilla; en el primer fallo, devuelve esa casilla y los valores `vistas` |

El programa siguiente reproduce el ejemplo de la tabla anterior, casilla por casilla:

```c
#include <stdio.h>
#include "emparejamiento.h"

/* máscara de los valores dados (de 1 a 5); 0 significa «ningún valor» */
static uint64_t M(int a, int b, int c, int d)
{
    uint64_t m = 0;
    int v[4] = { a, b, c, d };

    for (int k = 0; k < 4; k++)
        if (v[k] > 0)
            m |= 1ull << (v[k] - 1);
    return m;
}

static void mostrar_emparejamiento(const int *poseedor)
{
    for (int v = 0; v < 5; v++)                 /* los valores van de 1 a 5 */
        if (poseedor[v] >= 0)
            printf(" %c=%d", 'A' + poseedor[v], v + 1);
    printf("\n");
}

static void probar(const char *titulo, int n, const uint64_t *dominio)
{
    int poseedor[64];
    uint64_t vistas;

    for (int v = 0; v < 64; v++)
        poseedor[v] = -1;
    printf("%s\n", titulo);
    for (int i = 0; i < n; i++) {
        vistas = 0;
        int ok = ampliar(i, dominio, poseedor, &vistas);    /* una casilla cada vez */

        printf("  casilla %c: %-8s emparejamiento:", 'A' + i, ok ? "colocada" : "FALLO");
        mostrar_emparejamiento(poseedor);
        if (!ok) {
            printf("  valores alcanzados por la búsqueda: ");
            for (uint64_t m = vistas; m; m &= m - 1)
                printf("%d ", __builtin_ctzll(m) + 1);
            printf("\n  casillas que los poseen, más la casilla %c:", 'A' + i);
            for (uint64_t m = vistas; m; m &= m - 1)
                printf(" %c", 'A' + poseedor[__builtin_ctzll(m)]);
            printf("\n");
            return;
        }
    }
}

int main(void)
{
    /* A: 1 o 2   B: 1 o 3   C: solo 1   D: 3 o 4 */
    uint64_t uno[4] = { M(1, 2, 0, 0), M(1, 3, 0, 0), M(1, 0, 0, 0), M(3, 4, 0, 0) };
    /* A, B y C: solo 2 o 5   D: 1, 3 o 4 */
    uint64_t dos[4] = { M(2, 5, 0, 0), M(2, 5, 0, 0), M(2, 5, 0, 0), M(1, 3, 4, 0) };

    probar("Existe un emparejamiento:", 4, uno);
    probar("Ningún emparejamiento:", 4, dos);
    return 0;
}
```

La primera parte de la salida reproduce las etapas de la tabla (la segunda parte se explica más abajo):

```
Existe un emparejamiento:
  casilla A: colocada emparejamiento: A=1
  casilla B: colocada emparejamiento: B=1 A=2
  casilla C: colocada emparejamiento: C=1 A=2 B=3
  casilla D: colocada emparejamiento: C=1 A=2 B=3 D=4
Ningún emparejamiento:
  casilla A: colocada emparejamiento: A=2
  casilla B: colocada emparejamiento: B=2 A=5
  casilla C: FALLO    emparejamiento: B=2 A=5
  valores alcanzados por la búsqueda: 2 5 
  casillas que los poseen, más la casilla C: B A
```

## Cuando no existe ningún emparejamiento: el conjunto de Hall

En el segundo intento del programa, las casillas A, B y C solo aceptan 2 o 5; la casilla D acepta 1, 3 o 4. A toma 2, luego B toma 2 enviando a A hacia 5; C quiere 2 pero ni B ni A pueden apartarse. El programa muestra entonces:

| Resultado | Lectura |
|---|---|
| Fallo en la casilla C | Ningún camino aumentante parte de C |
| Valores alcanzados: 2, 5 | Los únicos valores que la búsqueda pudo probar |
| Poseedores: B, A, más la casilla C | Tres casillas para dos valores: un **conjunto de Hall** |

Es exactamente el [teorema de Hall](/?c=fondamentaux&s=algorithmes&p=problemes-np-complets#el-teorema-de-hall-cuando-las-casillas-se-bloquean-entre-si), leído al revés: cuando la búsqueda falla, los valores que alcanzó y las casillas que los poseen forman un grupo de k casillas cuyos dominios reunidos suman k - 1 valores. Este grupo **explica** por qué no existe ningún emparejamiento.

En un solucionador, esta explicación sirve de cláusula de conflicto: una casilla del grupo debe tomar un valor que falta fuera del conjunto, o un valor ya colocado en la fila debe liberarse (véase [el conflicto y el aprendizaje de cláusulas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#el-conflicto-y-el-aprendizaje-de-clausulas-cdcl)). Esta cláusula solo se usa para analizar el conflicto; después se descarta.

## Probar durante la búsqueda: cuándo y en qué filas

El solucionador lanza la prueba cuando la [propagación unitaria](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#la-propagacion-unitaria-los-niveles-y-la-traza) ya no tiene nada que deducir (su **punto fijo**), y solo en las filas y columnas **modificadas desde la última prueba** a las que **solo quedan unas pocas casillas libres**. Tres razones:

| Razón | Explicación |
|---|---|
| Una fila casi llena tiene pocas casillas libres | Un grupo de casillas que se bloquean entre sí es fácil de detectar y la prueba sigue siendo corta |
| El coste crece con el número de casillas libres | El filtrado de Régin (más abajo) lee el grafo completo de la fila: un número de lecturas proporcional al cuadrado del número de casillas libres |
| Las máscaras solo caben en 64 bits | Como máximo 64 casillas libres por fila |

La prueba no parte de cero cada vez: retoma el emparejamiento de la última prueba satisfactoria y solo busca un camino aumentante para las casillas cuya pareja ya no es válida (véase [evitar el recálculo redundante](/?c=qualite-performance-et-outils&s=performance&p=eviter-le-recalcul-redondant)). Un conflicto se recalcula siempre desde cero para producir una explicación que no dependa del emparejamiento de partida.

El umbral de casillas libres se ajusta midiendo. Con cuadrículas de 104 × 104 (100 cuadrículas, 4 copias del solucionador en paralelo, véanse [las colas pesadas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#las-colas-pesadas-unas-pocas-instancias-catastroficas)):

| Prueba de Hall en las filas... | Cuadrículas por encima de 90 s |
|---|---|
| Ninguna prueba | 9 |
| Con como máximo 16 casillas libres | 3 |
| Con como máximo 32 casillas libres | 0 (media 51,5 s, peor cuadrícula 68,8 s) |

Más arriba, la búsqueda se degrada: con 108 × 108, un umbral de 48 casillas libres no resuelve ninguna cuadrícula de 14 mediciones, y un umbral de 64 resuelve una de 61 (presupuesto de 1.500 millones de propagaciones por medición). La causa no se aisló; solo la medición es concluyente.

## Ir más lejos: el filtrado de Régin

La prueba de Hall responde sí o no: «¿existe un emparejamiento?». Pero un emparejamiento puede existir **y aun así prohibir valores**. En el ejemplo de partida, X1 y X2 se reparten el 1 y el 2: X3 no puede tomarlos, aunque la prueba de Hall no vea ningún problema. El **filtrado de Régin** ([Régin, 1994](https://cdn.aaai.org/AAAI/1994/AAAI94-055.pdf)) quita de cada dominio **todo valor que no pertenece a ningún emparejamiento perfecto**.

La idea: partir de un emparejamiento perfecto (la prueba de Hall encontró uno). Para que una casilla tome un valor `k` distinto del suyo, quien posee `k` debe tomar otro, que a su vez desplaza a alguien... hasta que alguien tome el valor **antiguo** de la casilla: un ciclo de desplazamientos.

Se representa con un grafo dirigido (**flechas**, que se siguen en un solo sentido) sobre los valores: desde el valor `v` sale una flecha hacia cada valor del dominio de la casilla que posee `v`. En el ejemplo, el emparejamiento encontrado es X2=1, X1=2, X4=3, X3=4, X5=5:

```
valor 5  ──▶  3, 4           (X5 posee 5 y acepta 3, 4, 5)
valor 4  ──▶  1, 2, 3, 4     (X3 posee 4)
valor 3  ──▶  3, 4           (X4 posee 3)
valor 2  ──▶  1, 2           (X1 posee 2)
valor 1  ──▶  1, 2           (X2 posee 1)
```

Una **componente fuertemente conexa** es un grupo de puntos tales que, desde cada uno, se pueden alcanzar todos los demás siguiendo las flechas. Aquí: {1, 2}, {3, 4} y {5}. Las flechas bajan de {5} hacia {3, 4} y luego hacia {1, 2}, pero nunca en sentido contrario. La regla de Régin:

> Un valor `k` del dominio de la casilla `i` (distinto de su valor emparejado `m`) es posible **si y solo si** `k` y `m` están en la misma componente fuertemente conexa: entonces existe un ciclo.

| Candidato | Casilla (valor emparejado) | ¿Se vuelve al valor emparejado? | Veredicto |
|---|---|---|---|
| 1 o 2 | X3 (4) | 1 y 2 solo llevan a {1, 2}: nunca a 4 | Quitado |
| 3 | X3 (4) | 3 lleva a 4: X3 toma 3, X4 toma 4 | Conservado |
| 3 o 4 | X5 (5) | 3 y 4 no llevan a 5 | Quitado |
| 4 | X4 (3) | 4 lleva a 3 | Conservado |

Las componentes se calculan en un solo recorrido del grafo con el **algoritmo de [Tarjan (1972)](https://doi.org/10.1137/0201010)**, que apila los puntos visitados y desapila un grupo completo cuando cierra su bucle. Con máscaras de bits, las flechas que salen de un valor caben en un solo `uint64_t`.

```c
/* Componentes fuertemente conexas (Tarjan) del grafo de valores: desde el valor v se puede
   ir a todos los valores posibles de la casilla que posee v. */
typedef struct {
    const uint64_t *succ;
    int indice[64], bajo[64], comp[64], pila[64], sp, cuenta;
    uint64_t en_pila;
    int ncomp;
} tarjan;

static inline void visitar(tarjan *t, int v)
{
    t->indice[v] = t->bajo[v] = t->cuenta++;
    t->pila[t->sp++] = v;
    t->en_pila |= 1ull << v;
    for (uint64_t m = t->succ[v]; m; m &= m - 1) {
        int w = __builtin_ctzll(m);

        if (t->indice[w] < 0) {
            visitar(t, w);
            if (t->bajo[w] < t->bajo[v])
                t->bajo[v] = t->bajo[w];
        } else if ((t->en_pila >> w & 1) && t->indice[w] < t->bajo[v]) {
            t->bajo[v] = t->indice[w];
        }
    }
    if (t->bajo[v] != t->indice[v])
        return;
    int w;                                      /* v es la raíz de una componente */
    do {
        w = t->pila[--t->sp];
        t->en_pila &= ~(1ull << w);
        t->comp[w] = t->ncomp;
    } while (w != v);
    t->ncomp++;
}

/* Filtrado de Régin: quita de cada dominio los valores que no pertenecen a ningún
   emparejamiento perfecto. Supone un emparejamiento perfecto en poseedor
   (n casillas, n valores 0..n-1). Devuelve el número de valores quitados. */
static inline int filtrar(int n, uint64_t *dominio, const int *poseedor)
{
    uint64_t succ[64];
    int valor_de[64], quitados = 0;
    tarjan t = { .succ = succ };

    for (int v = 0; v < n; v++) {
        succ[v] = dominio[poseedor[v]];         /* de v hacia los valores de su casilla */
        valor_de[poseedor[v]] = v;              /* el valor emparejado con cada casilla */
        t.indice[v] = -1;
    }
    for (int v = 0; v < n; v++)
        if (t.indice[v] < 0)
            visitar(&t, v);
    for (int i = 0; i < n; i++)
        for (uint64_t m = dominio[i] & ~(1ull << valor_de[i]); m; m &= m - 1) {
            int v = __builtin_ctzll(m);

            if (t.comp[v] != t.comp[valor_de[i]]) {  /* v nunca vuelve al valor de i */
                dominio[i] &= ~(1ull << v);
                quitados++;
            }
        }
    return quitados;
}
```

```c
#include <stdio.h>
#include "emparejamiento.h"

static uint64_t M(int a, int b, int c, int d)
{
    uint64_t m = 0;
    int v[4] = { a, b, c, d };

    for (int k = 0; k < 4; k++)
        if (v[k] > 0)
            m |= 1ull << (v[k] - 1);
    return m;
}

static void mostrar(const char *titulo, int n, const uint64_t *dominio)
{
    printf("%s\n", titulo);
    for (int i = 0; i < n; i++) {
        printf("  X%d :", i + 1);
        for (uint64_t m = dominio[i]; m; m &= m - 1)
            printf(" %d", __builtin_ctzll(m) + 1);
        printf("\n");
    }
}

int main(void)
{
    uint64_t dominio[5] = { M(1, 2, 0, 0), M(1, 2, 0, 0), M(1, 2, 3, 4),
                            M(3, 4, 0, 0), M(3, 4, 5, 0) };
    int poseedor[64];
    uint64_t vistas;

    mostrar("Antes:", 5, dominio);
    if (emparejar(5, dominio, poseedor, &vistas) >= 0) {
        printf("sin emparejamiento\n");
        return 1;
    }
    printf("Existe un emparejamiento perfecto: la prueba de Hall no ve nada que objetar.\n");
    printf("emparejamiento encontrado:");
    for (int v = 0; v < 5; v++)
        printf(" X%d=%d", poseedor[v] + 1, v + 1);
    printf("\n");
    int quitados = filtrar(5, dominio, poseedor);

    mostrar("Tras el filtrado de Régin:", 5, dominio);
    printf("%d valores quitados\n", quitados);
    return 0;
}
```

```
Antes:
  X1 : 1 2
  X2 : 1 2
  X3 : 1 2 3 4
  X4 : 3 4
  X5 : 3 4 5
Existe un emparejamiento perfecto: la prueba de Hall no ve nada que objetar.
emparejamiento encontrado: X2=1 X1=2 X4=3 X3=4 X5=5
Tras el filtrado de Régin:
  X1 : 1 2
  X2 : 1 2
  X3 : 3 4
  X4 : 3 4
  X5 : 5
4 valores quitados
```

La prueba de Hall no encontró nada que objetar (existe un emparejamiento), y el filtrado quita 4 valores: 1 y 2 de X3 (compartidos por X1 y X2), 3 y 4 de X5 (compartidos por X3 y X4 una vez que X3 queda reducida a {3, 4}). El razonamiento de Régin funciona, pues, **en cascada** sin habérselo pedido.

## Justificar cada retirada: las explicaciones

Un solucionador SAT con aprendizaje debe poder **explicar** cada valor que quita: sin razón, el análisis de un conflicto no sabe remontar hasta la causa (véase [el conflicto y el aprendizaje de cláusulas](/?c=fondamentaux&s=algorithmes&p=solveurs-sat-et-cdcl#el-conflicto-y-el-aprendizaje-de-clausulas-cdcl)). La explicación de una retirada por el filtrado de Régin es un conjunto de Hall: las casillas que poseen los valores alcanzables no tienen más opción que esos valores, que ninguna otra casilla puede tomar.

Primera versión del solucionador: cada retirada se **aprendía como una cláusula**. Resultado en la cuadrícula de 64 × 64 n.º 4, resuelta en 98 millones de propagaciones sin filtrado:

| | Sin filtrado | Primer filtrado (cláusulas aprendidas) | Filtrado con explicaciones apiladas |
|---|---|---|---|
| Propagaciones | 98,4 millones | No resuelta a 300 millones | 102,5 millones |
| Tiempo | 7,4 s | | 7,8 s |
| Coste de una propagación | 75 ns | 156 ns | |
| Retiradas, cláusulas aprendidas | | 226.000, 58.000 (memoria ×19) | |

Cada explicación es larga (142 literales de media, medidos en la versión corregida): aprender decenas de miles hace explotar la memoria y ralentiza cada propagación. La corrección: **apilar** cada explicación en una pila aparte, desapilada al retroceder como la traza de las asignaciones, sin convertirla nunca en cláusula. El bloqueo venía de las cláusulas de explicación, no del filtrado en sí.

## Lo que aportó al solucionador

El filtrado solo se aplica a las filas y columnas de como máximo 16 casillas libres (la prueba de Hall llega hasta 32). Con 40 cuadrículas de 64 × 64, un solo proceso, presupuesto de 400 millones de propagaciones:

| | Sin Régin | Con Régin (16 casillas libres) |
|---|---|---|
| Cuadrículas resueltas | 28 de 40 | 39 de 40 |
| Propagaciones medias | 187 millones | 97 millones |
| Coste de una propagación | 107 ns | 91 ns |

(Las medias cuentan un fallo como el presupuesto entero.) 12 cuadrículas solo se resuelven con el filtrado, una sola únicamente sin él: una diferencia tan clara tiene unas 3 probabilidades entre 1.000 de producirse por azar (prueba del signo bilateral). Estas 40 cuadrículas incluyen las 20 que sirvieron para elegir este umbral; solo con las otras 20, el resultado es de 8 contra 1 (véase [comparar dos ajustes](/?c=qualite-performance-et-outils&s=performance&p=comparer-deux-reglages)). Con un umbral de 24 casillas libres se resuelven 17 cuadrículas de 20 (frente a 20 de 20 con 16): filtrar más filas cuesta más de lo que aporta.

Con 108 × 108, en las 100 cuadrículas (4 copias en paralelo):

| | Media | Cuadrículas por encima de 90 s |
|---|---|---|
| Solo la prueba de Hall | 56,8 s | 4 |
| Con filtrado de Régin | 49,3 s (peor cuadrícula 64,1 s) | 0 |

Con 112 × 112, este solucionador sigue fuera de alcance: 59,1 s de media simulada en las 20 primeras cuadrículas, y ya un exceso de tiempo.

## Verificar el código: la fuerza bruta

Un razonamiento tan sutil se equivoca con facilidad: una línea olvidada y un valor útil desaparece sin ningún mensaje. El programa siguiente compara el código con una referencia que prueba **todas** las maneras de rellenar las casillas (de 2 a 8 casillas, dominios aleatorios):

```c
#include <stdio.h>
#include <stdlib.h>
#include "emparejamiento.h"

/* Referencia: prueba todas las permutaciones y anota para cada casilla
   los valores que toma en al menos un emparejamiento perfecto. */
static void permutar(int n, int k, int *p, int *usado, const uint64_t *dom,
                     uint64_t *posibles, long *nb)
{
    if (k == n) {
        (*nb)++;
        for (int i = 0; i < n; i++)
            posibles[i] |= 1ull << p[i];
        return;
    }
    for (int v = 0; v < n; v++)
        if (!usado[v] && (dom[k] >> v & 1)) {
            usado[v] = 1;
            p[k] = v;
            permutar(n, k + 1, p, usado, dom, posibles, nb);
            usado[v] = 0;
        }
}

int main(void)
{
    long con_emparejamiento = 0, filtrados = 0, hall_ok = 0, hall_total = 0, desacuerdos = 0;

    srand(42);
    for (int ronda = 0; ronda < 300000; ronda++) {
        int n = 2 + rand() % 7;                         /* de 2 a 8 casillas */
        uint64_t dom[64], ref[64] = {0}, vistas;
        int p[64], usado[64] = {0}, poseedor[64], fallo;
        long nb = 0;

        for (int i = 0; i < n; i++) {                   /* dominios aleatorios, dispersos */
            dom[i] = 0;
            for (int v = 0; v < n; v++)
                if (rand() % 100 < 35)
                    dom[i] |= 1ull << v;
        }
        permutar(n, 0, p, usado, dom, ref, &nb);
        fallo = emparejar(n, dom, poseedor, &vistas);
        if ((nb > 0) != (fallo < 0))
            desacuerdos++;                              /* desacuerdo sobre la existencia */
        if (fallo >= 0) {                               /* control del conjunto de Hall */
            uint64_t union_de_dominios = dom[fallo];
            int ncasillas = 1;

            for (uint64_t m = vistas; m; m &= m - 1) {
                union_de_dominios |= dom[poseedor[__builtin_ctzll(m)]];
                ncasillas++;
            }
            hall_total++;
            if (union_de_dominios == vistas && ncasillas == __builtin_popcountll(vistas) + 1)
                hall_ok++;
            continue;
        }
        con_emparejamiento++;
        filtrados += filtrar(n, dom, poseedor);
        for (int i = 0; i < n; i++)
            if (dom[i] != ref[i])                       /* ¿quita exactamente lo inútil? */
                desacuerdos++;
    }
    printf("300000 sorteos: %ld con emparejamiento perfecto, %ld sin él\n",
           con_emparejamiento, hall_total);
    printf("valores quitados por el filtro: %ld\n", filtrados);
    printf("conjuntos de Hall correctos: %ld de %ld\n", hall_ok, hall_total);
    printf("desacuerdos con la fuerza bruta: %ld\n", desacuerdos);
    return desacuerdos != 0;
}
```

```
300000 sorteos: 96500 con emparejamiento perfecto, 203500 sin él
valores quitados por el filtro: 391264
conjuntos de Hall correctos: 203500 de 203500
desacuerdos con la fuerza bruta: 0
```

| Verificación | Resultado |
|---|---|
| ¿Existe un emparejamiento perfecto? | Misma respuesta que la fuerza bruta, en los 300.000 sorteos |
| Cuando no existe, ¿es correcto el conjunto de Hall? | 203.500 de 203.500: sus casillas tienen como dominios reunidos exactamente los valores alcanzados, con una casilla más |
| Tras el filtrado, ¿es el dominio de cada casilla exactamente el conjunto de valores que toma en al menos un emparejamiento perfecto? | Sí en los 96.500 sorteos con emparejamiento: el filtrado solo quita lo inútil y quita todo lo inútil |

## Las trampas

| Trampa | Qué ocurre | Remedio |
|---|---|---|
| Filtrar sin emparejamiento perfecto | El resultado carece de sentido: el grafo de valores supone que cada valor tiene un poseedor | Lanzar primero la búsqueda de emparejamiento y filtrar solo si tiene éxito |
| Número de casillas distinto del número de valores | El grafo está mal formado | En una fila, las casillas libres reciben los valores que faltan: sus números son iguales o el conflicto ya está ahí |
| Flechas en el sentido equivocado | Se quitan valores útiles: el resultado parece plausible pero es falso | Verificar con la fuerza bruta en casos pequeños, como arriba |
| Más de 64 casillas libres o 64 valores | Una máscara `uint64_t` ya no basta | Limitar la prueba a las filas casi llenas, o pasar a máscaras más anchas |
| Aprender cada retirada como una cláusula | La memoria explota, la búsqueda se bloquea (arena ×19 medida) | Apilar las explicaciones aparte y desapilarlas al retroceder |
| Filtrar todas las filas | El coste supera la ganancia (24 casillas libres: 17 cuadrículas de 20 resueltas frente a 20 de 20) | Ajustar el umbral de casillas libres midiendo |
| Probar Hall enumerando todos los grupos de casillas | 2ⁿ grupos: un millón para 20 casillas | Dejar que Kuhn decida; buscar el grupo culpable solo para explicarlo |

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | Unas casillas que deben tomar valores todos distintos se modelan con un grafo bipartito; un emparejamiento perfecto es una manera válida de rellenarlas. El algoritmo de Kuhn lo busca mediante caminos aumentantes; su fallo produce un conjunto de Hall que explica la imposibilidad. El filtrado de Régin va más lejos: a partir de un emparejamiento perfecto, quita todo valor que no pertenece a ningún emparejamiento perfecto, gracias a las componentes fuertemente conexas del grafo de valores. |
| **Herramientas utilizables** | Las máscaras de bits (`uint64_t`, `__builtin_ctzll`) para dominios de menos de 64 valores, el algoritmo de Tarjan para las componentes, una referencia por fuerza bruta para validar el código, el [artículo de Régin](https://cdn.aaai.org/AAAI/1994/AAAI94-055.pdf) para la demostración. |
| **Trampas a evitar** | Filtrar sin emparejamiento perfecto, invertir el sentido de las flechas, superar los 64 valores con una sola máscara, aprender cada retirada como una cláusula, aplicar el filtrado a todas las filas sin medir, conformarse con el algoritmo voraz, enumerar todos los grupos de casillas para probar Hall. |
| **Buenas prácticas** | Lanzar la prueba solo en las filas casi llenas; retomar el emparejamiento anterior en vez de partir de cero; apilar las explicaciones aparte; validar cada algoritmo en casos pequeños contra una enumeración exhaustiva; ajustar los umbrales midiendo. |
