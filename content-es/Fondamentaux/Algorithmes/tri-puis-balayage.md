---
order: 13
---

# Ordenar y barrer (sweep and prune): comparar solo a los vecinos plausibles

Un **segmento** es la porción de recta comprendida entre dos puntos del plano, llamados sus **extremos** (o sus puntas). Un **plano** es una superficie plana en la que cada punto se localiza con dos números, sus **coordenadas**: `x` (la posición horizontal) e `y` (la posición vertical). Dos segmentos **se cruzan** cuando tienen al menos un punto en común. Saber cuáles se cruzan es una necesidad frecuente: los lados de un polígono (una figura cerrada formada por segmentos unidos extremo con extremo, cuyos segmentos se llaman también **aristas**) no deben atravesarse, dos trayectorias de vehículos no deben cortarse, dos carreteras de un mapa pueden encontrarse en un cruce.

El método evidente compara todos los segmentos dos a dos, y se vuelve inutilizable en cuanto su número crece. La técnica de **ordenar y barrer** (en inglés *sweep and prune*, «barrer y podar») evita la inmensa mayoría de esas comparaciones: ordena los segmentos y luego compara solo los que tienen **cajas envolventes** (rectángulos que los rodean, definidos más abajo) que se solapan. Este capítulo construye la técnica paso a paso, la demuestra, la mide y muestra en qué caso no sirve para nada.

Supone conocidos [la complejidad y la notación Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o), [la ordenación por comparación](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison), [los vectores](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) (una lista de números tratada como una sola entidad, por ejemplo las dos coordenadas de un punto), y, para los programas en C, [las variables](/?c=langages&s=c&p=variables), [las estructuras](/?c=langages&s=c&p=variables#las-estructuras-struct), [los punteros](/?c=langages&s=c&p=pointeurs) y [la gestión de la memoria](/?c=langages&s=c&p=memoire). Todos los programas se compilaron con `gcc` (el compilador del proyecto GNU, véase [la compilación](/?c=langages&s=c&p=compilation)) y se ejecutaron; las salidas mostradas son las salidas reales.

## El problema: probar todas las parejas

Para `n` segmentos, la versión ingenua prueba cada **pareja** (dos segmentos distintos; el orden no cuenta: la pareja A-B es la misma que B-A). Cada uno de los `n` segmentos tiene `n - 1` compañeros, pero cada pareja se contaría entonces dos veces, de ahí `n × (n - 1) / 2` parejas. El coste es, pues, de orden `O(n²)` («n al cuadrado»: multiplicar `n` por 10 multiplica el trabajo por 100, véase [la complejidad](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)).

| Número de segmentos `n` | Número de parejas `n(n-1)/2` | Respecto a la línea anterior |
|---|---|---|
| 100 | 4 950 | : |
| 1 000 | 499 500 | unas 100 veces más |
| 10 000 | 49 995 000 | unas 100 veces más |
| 100 000 | 4 999 950 000 | unas 100 veces más |

Cinco mil millones de pruebas para 100 000 segmentos: y como muy pocos segmentos se cruzan realmente, casi todo ese trabajo se desperdicia. La idea de la técnica es descartar a bajo coste las parejas que evidentemente no pueden cruzarse, y pagar la prueba exacta solo por las demás.

## La prueba exacta: ¿se cruzan dos segmentos?

Antes de evitarla, hay que conocerla: es la «prueba costosa» cuyo número de llamadas la técnica intenta reducir. Se basa en una operación sencilla, el producto vectorial en dos dimensiones.

Un **vector** va de un punto a otro: el de `o` hacia `p` tiene por componentes `(p.x - o.x, p.y - o.y)`. El **producto vectorial** (*cross product*) de dos vectores `u = (ux, uy)` y `v = (vx, vy)` del plano es el número `ux × vy - uy × vx`. Su signo indica de qué lado gira `v` respecto a `u`. Para tres puntos `o`, `p`, `q`, se llama la **orientación** de la terna: es el producto vectorial del vector de `o` hacia `p` y del vector de `o` hacia `q`.

| Signo del producto vectorial | Posición de `q` al ir de `o` hacia `p` | Ejemplo con `o = (0, 0)`, `p = (4, 0)` |
|---|---|---|
| Positivo | A la izquierda (giro a la izquierda) | `q = (2, 3)`: `4 × 3 - 0 × 2 = 12` |
| Negativo | A la derecha (giro a la derecha) | `q = (2, -3)`: `4 × (-3) - 0 × 2 = -12` |
| Nulo | Sobre la misma recta que `o` y `p` (los tres puntos están **alineados**, también se dice **colineales**) | `q = (8, 0)`: `4 × 0 - 0 × 8 = 0` |

> **Nota:** «izquierda» y «derecha» suponen un eje `y` que sube. En una pantalla, `y` baja y los lados se intercambian, lo que no tiene consecuencias aquí: la prueba solo compara signos entre sí.

El razonamiento de la prueba: el segmento `s` (de `s.a` a `s.b`) y el segmento `t` (de `t.a` a `t.b`) se cruzan de forma franca cuando los dos extremos de `t` están a ambos lados de la recta de `s` (orientaciones de signos opuestos) **y** los dos extremos de `s` a ambos lados de la recta de `t`.

```text
            t.a      orientación(s.a, s.b, t.a) = +1  (a la izquierda de s)
              \
  s.a ---------\---------> s.b
                \
                 t.b     orientación(s.a, s.b, t.b) = -1  (a la derecha de s)
```

Esto no basta cuando una orientación vale 0 (un extremo apoyado exactamente sobre la recta del otro segmento): hay que decidir qué se llama «cruce». **Decisión de este capítulo: dos segmentos se cruzan si tienen al menos un punto en común**, lo que incluye el cruce franco, el contacto por un extremo y el solapamiento de dos segmentos alineados. Un extremo alineado con el otro segmento solo cuenta si está realmente **entre** sus extremos.

| Situación | Orientaciones | Veredicto |
|---|---|---|
| Cruce franco (en cruz) | Signos opuestos a ambos lados | Se cruzan |
| Un extremo de `t` apoyado en medio de `s` | Una orientación en 0, extremo entre `s.a` y `s.b` | Se cruzan |
| Dos extremos que se tocan | Una orientación en 0, extremo entre los extremos | Se cruzan |
| Alineados, que se solapan | Todas en 0, un extremo dentro del otro segmento | Se cruzan |
| Alineados, separados | Todas en 0, ningún extremo dentro del otro segmento | Disjuntos (sin punto en común) |
| Paralelos | Mismos signos | Disjuntos |
| Rectas secantes, segmentos demasiado cortos | Los extremos de `t` encierran `s`, pero no al revés | Disjuntos |
| Segmento reducido a un punto | Orientaciones siempre en 0 | Se cruzan si el punto está sobre el otro segmento |

El código correspondiente. Los elementos del lenguaje C utilizados:

| Elemento | Función |
|---|---|
| `typedef struct { ... } Point;` | Crea un tipo `Point` que agrupa varios campos bajo un solo nombre (véase [las estructuras](/?c=langages&s=c&p=variables#las-estructuras-struct)) |
| `long long` | Entero con signo de al menos 64 bits: los productos de coordenadas no desbordan (véase [los enteros y los desbordamientos](/?c=donnees&s=representation-des-donnees&p=entiers-et-debordements)) |
| `static` | La función solo es visible en este archivo |
| `const Segmento *s` | Puntero a un segmento que se promete no modificar; `s->a` lee su campo `a` (véase [los punteros](/?c=langages&s=c&p=pointeurs)) |
| `(producto > 0) - (producto < 0)` | Una comparación vale 1 si es verdadera y 0 si no: la diferencia da 1, -1 o 0, el signo del número |
| `condición ? a : b` | Vale `a` si la condición es verdadera, `b` si no |

```c
#include <stdio.h>

typedef struct {
    long long x, y;                         // las dos coordenadas de un punto
} Point;

typedef struct {
    Point a, b;                             // los dos extremos del segmento
} Segmento;

static long long minimum(long long u, long long v)
{
    return u < v ? u : v;                   // el menor de los dos
}

static long long maximum(long long u, long long v)
{
    return u > v ? u : v;                   // el mayor de los dos
}

// Signo del producto vectorial de (o hacia p) y (o hacia q): 1, -1 o 0.
static int orientation(Point o, Point p, Point q)
{
    long long hacia_p_x = p.x - o.x;        // componente x del vector de o hacia p
    long long hacia_p_y = p.y - o.y;        // componente y del vector de o hacia p
    long long hacia_q_x = q.x - o.x;        // componente x del vector de o hacia q
    long long hacia_q_y = q.y - o.y;        // componente y del vector de o hacia q
    long long producto = hacia_p_x * hacia_q_y - hacia_p_y * hacia_q_x;  // producto vectorial

    return (producto > 0) - (producto < 0); // 1 si es positivo, -1 si negativo, 0 si nulo
}

// Verdadero si p, que ya se sabe alineado con a y b, se encuentra entre ellos.
static int entre(Point a, Point b, Point p)
{
    return minimum(a.x, b.x) <= p.x && p.x <= maximum(a.x, b.x)   // en el intervalo de x
        && minimum(a.y, b.y) <= p.y && p.y <= maximum(a.y, b.y);   // y en el de y
}

// Verdadero si los dos segmentos tienen al menos un punto en común.
static int segmentos_se_cruzan(const Segmento *s, const Segmento *t)
{
    int o1 = orientation(s->a, s->b, t->a);   // de qué lado de (s) está el extremo a de t
    int o2 = orientation(s->a, s->b, t->b);   // de qué lado de (s) está el extremo b de t
    int o3 = orientation(t->a, t->b, s->a);   // de qué lado de (t) está el extremo a de s
    int o4 = orientation(t->a, t->b, s->b);   // de qué lado de (t) está el extremo b de s

    if (o1 != o2 && o3 != o4)               // cada segmento separa los extremos del otro
        return 1;                           // cruce franco, o contacto por un extremo
    if (o1 == 0 && entre(s->a, s->b, t->a)) // el extremo a de t está apoyado sobre s
        return 1;
    if (o2 == 0 && entre(s->a, s->b, t->b)) // el extremo b de t está apoyado sobre s
        return 1;
    if (o3 == 0 && entre(t->a, t->b, s->a)) // el extremo a de s está apoyado sobre t
        return 1;
    if (o4 == 0 && entre(t->a, t->b, s->b)) // el extremo b de s está apoyado sobre t
        return 1;
    return 0;                               // ningún punto en común
}
```

Un `main` de prueba (para colocar a continuación) recorre las situaciones de la tabla:

```c
typedef struct {
    const char *nombre;                     // descripción del caso, para mostrar
    Segmento s, t;                          // los dos segmentos a comparar
} Caso;

int main(void)
{
    Caso casos[] = {                        // un caso por situación a distinguir
        {"en cruz", {{0, 0}, {4, 4}}, {{0, 4}, {4, 0}}},
        {"extremo apoyado sobre el otro", {{0, 0}, {4, 0}}, {{2, 0}, {2, 3}}},
        {"dos extremos que se tocan", {{0, 0}, {2, 2}}, {{2, 2}, {5, 0}}},
        {"alineados que se solapan", {{0, 0}, {4, 0}}, {{3, 0}, {7, 0}}},
        {"alineados pero separados", {{0, 0}, {2, 0}}, {{3, 0}, {7, 0}}},
        {"paralelos", {{0, 0}, {4, 0}}, {{0, 1}, {4, 1}}},
        {"rectas secantes, segmentos no", {{0, 0}, {2, 0}}, {{3, -1}, {3, 5}}},
        {"un punto sobre un segmento", {{1, 1}, {1, 1}}, {{0, 0}, {2, 2}}},
        {"un punto fuera del segmento", {{1, 2}, {1, 2}}, {{0, 0}, {2, 2}}},
    };

    for (size_t i = 0; i < sizeof casos / sizeof casos[0]; i++)   // recorre los casos
        printf("%-12s %s\n",                // resultado (12 columnas), nombre del caso
               segmentos_se_cruzan(&casos[i].s, &casos[i].t) ? "se cruzan" : "disjuntos",
               casos[i].nombre);
    return 0;
}
```

```text
se cruzan    en cruz
se cruzan    extremo apoyado sobre el otro
se cruzan    dos extremos que se tocan
se cruzan    alineados que se solapan
disjuntos    alineados pero separados
disjuntos    paralelos
disjuntos    rectas secantes, segmentos no
se cruzan    un punto sobre un segmento
disjuntos    un punto fuera del segmento
```

Los nueve casos dan el veredicto anunciado por la tabla. Esta prueba tiene un coste nada despreciable: cuatro cálculos de orientación (siete operaciones aritméticas cada uno), y luego comparaciones. Es lo que conviene invocar lo menos posible.

## La caja envolvente: una prueba barata

Una **caja envolvente alineada con los ejes** (en inglés *axis-aligned bounding box*, abreviado **AABB**) es el rectángulo más pequeño, con lados paralelos a los ejes `x` e `y`, que contiene por completo una figura. Para un segmento bastan cuatro números: `xmin` y `xmax` (la `x` más pequeña y la más grande de sus dos extremos), `ymin` e `ymax` (lo mismo para `y`). Cada uno de los dos intervalos `[xmin, xmax]` e `[ymin, ymax]` es la **proyección** del segmento sobre un eje, es decir, su sombra sobre ese eje.

```text
  y
  ^
  |  ymax  +-------------B
  |        |         .   |
  |        |      .      |
  |        |   .         |
  |  ymin  A-------------+
  |        |             |
  +--------+-------------+----------> x
         xmin          xmax
```

Si dos segmentos tienen un punto en común, ese punto pertenece a las dos cajas: **las dos cajas se solapan**. Dicho de otro modo: si dos cajas son **disjuntas** (sin punto en común), los segmentos no pueden cruzarse y no hace falta aplicar la prueba exacta. Lo contrario no es cierto: dos cajas pueden solaparse sin que los segmentos se toquen, y entonces la prueba exacta decidirá.

```text
 Solapamiento solo en x               Solapamiento en x y en y
 (ningún cruce posible)               (la prueba exacta decide)

      +--------+                       +--------+
      |   S    |                       |   S    |
      |        |                       |     +--+-----+
      +--------+                       +-----+--+     |
   +--------+                                |   T    |
   |   T    |                                +--------+
   +--------+
```

Dos cajas se solapan si y solo si sus intervalos se solapan **en cada eje**. Dos intervalos cerrados (con sus extremos incluidos) `[min1, max1]` y `[min2, max2]` tienen un punto en común exactamente cuando cada uno empieza antes de que termine el otro: `min1 <= max2` y `min2 <= max1`.

| Intervalo 1 | Intervalo 2 | `min1 <= max2` | `min2 <= max1` | Solapamiento |
|---|---|---|---|---|
| `[1, 4]` | `[3, 6]` | sí (1 <= 6) | sí (3 <= 4) | Sí |
| `[1, 4]` | `[4, 7]` | sí (1 <= 7) | sí (4 <= 4) | Sí: se tocan en 4 |
| `[1, 4]` | `[5, 7]` | sí (1 <= 7) | no (5 <= 4 es falso) | No |

La prueba de caja cuesta cuatro comparaciones como máximo (dos por eje), frente a unas treinta operaciones de la prueba exacta. Las cajas se calculan una sola vez por segmento.

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    long long xmin, xmax;                   // límites de la caja sobre el eje x
    long long ymin, ymax;                   // límites de la caja sobre el eje y
} Caja;

// Calcula la caja envolvente alineada con los ejes de un segmento.
static Caja caja_de(const Segmento *s)
{
    Caja b;                                 // la caja a rellenar

    b.xmin = minimum(s->a.x, s->b.x);       // la x más a la izquierda de los dos extremos
    b.xmax = maximum(s->a.x, s->b.x);       // la x más a la derecha
    b.ymin = minimum(s->a.y, s->b.y);       // la y más baja
    b.ymax = maximum(s->a.y, s->b.y);       // la y más alta
    return b;
}

// Verdadero si dos intervalos cerrados [min1, max1] y [min2, max2] se solapan.
static int se_solapan(long long min1, long long max1, long long min2, long long max2)
{
    return min1 <= max2 && min2 <= max1;    // cada uno empieza antes de que termine el otro
}

// Un segmento, su número de origen y su caja (calculada una sola vez).
typedef struct {
    int id;                                 // posición en el arreglo de partida
    Segmento seg;                           // el propio segmento
    Caja caja;                              // su caja envolvente
} Elemento;
```

Los segmentos verticales (`xmin == xmax`), horizontales o reducidos a un punto no tienen nada particular: su caja es un rectángulo aplastado, o incluso un punto, y la prueba de intervalos cerrados funciona tal cual.

Pero probar la caja de cada pareja sigue siendo un trabajo en `O(n²)`: cinco mil millones de comparaciones de cajas para 100 000 segmentos. La ordenación evita incluso eso.

## La ordenación y luego el barrido

La idea: si los segmentos se ordenan por `xmin` creciente, los candidatos de un segmento son sus vecinos inmediatos en esa ordenación, y se para en cuanto el siguiente empieza demasiado lejos a la derecha.

| Paso | Acción | Por qué |
|---|---|---|
| 1 | Copiar los segmentos con su caja y su número | Conservar intacto el arreglo original |
| 2 | Ordenar la copia por `xmin` creciente | Los candidatos de un segmento quedan contiguos |
| 3 | Para cada segmento `i`, recorrer los siguientes `j = i + 1, i + 2...` **mientras** `xmin[j] <= xmax[i]` | Más allá, no es posible ningún solapamiento en `x`: se para |
| 4 | Para cada `j` visitado, probar el solapamiento en `y` | Prueba barata |
| 5 | Solo si las `y` se solapan, llamar a la prueba exacta | La prueba costosa solo se paga por las parejas plausibles |

El **barrido** (*sweep*) es el nombre del paso 3: se imagina una línea vertical que avanza de izquierda a derecha sobre el eje `x`, y en cada segmento encontrado se miran los que todavía cruza. La **ordenación** viene del paso 2: sin ella, habría que recorrer todo el arreglo para saber qué segmentos están al alcance.

Los bloques de código de este capítulo se añaden unos a otros en un mismo archivo (hay que quitar el `main` de prueba de la sección anterior antes de continuar). El primero guarda los resultados: un cruce `(i, j)` se convierte en una **clave**, un único entero de 64 bits (`i` en la mitad alta de los 64 bits, `j` en la mitad baja), y un arreglo que crece cuando hace falta ([`realloc`](/?c=langages&s=c&p=memoire#cambiar-el-tamano-de-un-bloque-realloc)) las conserva. El tipo `Contadores` mide el trabajo: `visitadas` cuenta las parejas que examina el bucle, `pruebas_exactas` las llamadas a la prueba costosa.

| Elemento | Función |
|---|---|
| `size_t` | Entero sin signo (sin valor negativo) pensado para los tamaños y el número de elementos |
| `realloc(antiguo, tamano)` | Amplía un bloque de memoria, o devuelve uno nuevo que contiene los mismos datos |
| `perror("texto")` | Muestra el texto seguido de la descripción del último error del sistema |
| `exit(1)` | Termina el programa con el código 1, que indica un fallo (véase [exit y los códigos de retorno](/?c=langages&s=c&p=exit-et-codes-de-retour)) |
| `<<` y `\|` | Desplazamiento de bits hacia la izquierda y O binario, para alojar dos números en un solo entero (véase [los operadores binarios](/?c=langages&s=c&p=operateurs-binaires)) |
| `for (; j < n && ...; j++)` | Bucle `for` cuya primera parte está vacía: `j` ya existe |
| `continue` | Pasa directamente a la siguiente vuelta del bucle |
| `%c` | Formato de `printf` para mostrar un carácter; `'A' + 2` vale el carácter `C` |

```c
typedef struct {
    long long visitadas;                    // parejas examinadas por el bucle interior
    long long pruebas_exactas;              // llamadas a segmentos_se_cruzan
} Contadores;

typedef struct {
    unsigned long long *claves;             // una clave por cruce encontrado
    size_t num, capacidad;                  // claves guardadas, lugares disponibles
} Resultados;

// Guarda el cruce (i, j) como un solo número, con el número pequeño al principio.
static void registrar(Resultados *r, int i, int j)
{
    int pequeno = i < j ? i : j;            // el menor de los dos números
    int grande = i < j ? j : i;             // el mayor

    if (r->num == r->capacidad) {           // arreglo lleno: lo ampliamos
        size_t nueva = r->capacidad ? 2 * r->capacidad : 1024;   // se duplica
        unsigned long long *p = realloc(r->claves, nueva * sizeof *p);

        if (p == NULL) {                    // sin memoria: se abandona
            perror("realloc");
            exit(1);
        }
        r->claves = p;
        r->capacidad = nueva;
    }
    // guarda el par como pequeno:grande
    r->claves[r->num++] = ((unsigned long long)pequeno << 32) | (unsigned)grande;
}
```

El segundo bloque es el corazón de la técnica. Usa `qsort`, la función de ordenación de la biblioteca estándar de C (véase [`qsort` y la estabilidad](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#qsort-no-promete-nada); referencia: [`qsort`](https://en.cppreference.com/w/c/algorithm/qsort)): recibe el arreglo, el número de elementos, el tamaño de un elemento y una **función de comparación** (un [puntero a función](/?c=langages&s=c&p=pointeurs)) que devuelve un número negativo, nulo o positivo. Las funciones `malloc` (reservar memoria), `memcpy` (copiar bytes) y `free` (liberarla) se explican en [la gestión de la memoria](/?c=langages&s=c&p=memoire). El parámetro `detallado` sirve para mostrar los pasos en el ejemplo que sigue; valdrá 0 para las mediciones.

```c
// Compara dos elementos por xmin creciente (sin restar, lo que podría desbordar).
static int comparar_xmin(const void *p, const void *q)
{
    const Elemento *e = p;                  // el primer elemento comparado
    const Elemento *f = q;                  // el segundo

    return (e->caja.xmin > f->caja.xmin) - (e->caja.xmin < f->caja.xmin);
}

// El barrido: supone el arreglo ya ordenado por xmin creciente.
static void barrer(const Elemento *orden, int n, Contadores *c, Resultados *res,
                   int detallado)
{
    for (int i = 0; i < n; i++) {           // cada segmento, de izquierda a derecha
        const Elemento *e = &orden[i];      // el segmento cuyos vecinos buscamos
        int j = i + 1;                      // primer candidato: el siguiente en el orden

        for (; j < n && orden[j].caja.xmin <= e->caja.xmax; j++) {  // al alcance en x
            const Elemento *f = &orden[j];  // el candidato
            c->visitadas++;                 // una pareja más examinada
            if (!se_solapan(e->caja.ymin, e->caja.ymax, f->caja.ymin, f->caja.ymax)) {
                if (detallado)
                    printf("  %c-%c : y disjuntos, descartada\n", 'A' + e->id, 'A' + f->id);
                continue;                   // sin solapamiento en y: pareja eliminada
            }
            c->pruebas_exactas++;           // único caso en que pagamos la prueba exacta
            int si = segmentos_se_cruzan(&e->seg, &f->seg);   // el veredicto exacto
            if (si)
                registrar(res, e->id, f->id);
            if (detallado)
                printf("  %c-%c : prueba exacta, %s\n", 'A' + e->id, 'A' + f->id,
                       si ? "cruce" : "sin cruce");
        }
        if (detallado && j < n)             // nos detenemos antes del final del arreglo
            printf("  %c-%c : xmin %lld > xmax %lld, se detiene\n", 'A' + e->id,
                   'A' + orden[j].id, orden[j].caja.xmin, e->caja.xmax);
    }
}

// Versión ordenada: ordena una copia (el original conserva su orden) y luego barre.
static void metodo_ordenado(const Elemento *e, int n, Contadores *c, Resultados *res,
                            int detallado)
{
    Elemento *copia = malloc((size_t)n * sizeof *copia);   // la copia que vamos a ordenar

    if (copia == NULL) {                    // sin memoria: se abandona
        perror("malloc");
        exit(1);
    }
    memcpy(copia, e, (size_t)n * sizeof *copia);   // copia los elementos
    qsort(copia, (size_t)n, sizeof *copia, comparar_xmin);   // ordenación por xmin creciente
    barrer(copia, n, c, res, detallado);    // luego el barrido
    free(copia);                            // la copia ya no sirve
}
```

### Paso a paso con seis segmentos

Seis segmentos `A` a `F`, con coordenadas enteras. Sus cajas envolventes:

| Segmento | Extremos | `[xmin, xmax]` | `[ymin, ymax]` |
|---|---|---|---|
| A | (1, 1) y (4, 4) | [1, 4] | [1, 4] |
| B | (2, 4) y (5, 1) | [2, 5] | [1, 4] |
| C | (3, 4) y (6, 7) | [3, 6] | [4, 7] |
| D | (6, 7) y (9, 4) | [6, 9] | [4, 7] |
| E | (7, 3) y (9, 7) | [7, 9] | [3, 7] |
| F | (8, 0) y (11, 1) | [8, 11] | [0, 1] |

Los puntos del dibujo son los nodos de la cuadrícula que atraviesa cada segmento; `X` marca un punto común a dos segmentos (`A` y `B` en (3, 3), `C` y `D` en (6, 7), `D` y `E` en (8, 5)).

```text
   y
   8 .  .  .  .  .  .  .  .  .  .  .  .
   7 .  .  .  .  .  .  X  .  .  E  .  .
   6 .  .  .  .  .  C  .  D  .  .  .  .
   5 .  .  .  .  C  .  .  .  X  .  .  .
   4 .  .  B  C  A  .  .  .  .  D  .  .
   3 .  .  .  X  .  .  .  E  .  .  .  .
   2 .  .  A  .  B  .  .  .  .  .  .  .
   1 .  A  .  .  .  B  .  .  .  .  .  F
   0 .  .  .  .  .  .  .  .  F  .  .  .
     0  1  2  3  4  5  6  7  8  9  10 11  x
```

Tras ordenar, el orden ya es `A, B, C, D, E, F` (por `xmin`: 1, 2, 3, 6, 7, 8). Los intervalos en `x` muestran lo que quiere decir «al alcance»: el segmento `A` solo tiene como candidatos a los que su intervalo empieza antes de que termine el suyo.

```text
      0  1  2  3  4  5  6  7  8  9  10 11  x
   A     [========]
   B        [========]
   C           [========]
   D                    [========]
   E                       [=====]
   F                          [========]
```

Para `A` (`xmax = 4`): `B` empieza en 2, `C` en 3, pero `D` en 6: 6 es mayor que 4, se detiene, `E` y `F` ni siquiera se miran (estando el arreglo ordenado, empiezan aún más lejos). Aquí está el programa que vuelve a recorrer el barrido, con los segmentos dados en desorden para que la ordenación sirva para algo:

```c
int main(void)
{
    Segmento seg[6] = {                     // los seis segmentos, A a F, en desorden
        {{6, 7}, {9, 4}},                   // D
        {{1, 1}, {4, 4}},                   // A
        {{8, 0}, {11, 1}},                  // F
        {{3, 4}, {6, 7}},                   // C
        {{2, 4}, {5, 1}},                   // B
        {{7, 3}, {9, 7}},                   // E
    };
    int nombres[6] = {3, 0, 5, 2, 1, 4};    // número de letra de cada segmento (A = 0)
    Elemento e[6];                          // los elementos a barrer
    Contadores c = {0, 0};                  // contadores a cero
    Resultados res = {NULL, 0, 0};          // ningún cruce encontrado todavía

    for (int i = 0; i < 6; i++) {           // prepara cada elemento
        e[i].id = nombres[i];               // su número de letra
        e[i].seg = seg[i];                  // su segmento
        e[i].caja = caja_de(&seg[i]);       // su caja envolvente
    }
    metodo_ordenado(e, 6, &c, &res, 1);     // barrido detallado
    printf("parejas visitadas: %lld, pruebas exactas: %lld, cruces: %zu\n",
           c.visitadas, c.pruebas_exactas, res.num);
    free(res.claves);                       // libera los resultados
    return 0;
}
```

```text
  A-B : prueba exacta, cruce
  A-C : prueba exacta, sin cruce
  A-D : xmin 6 > xmax 4, se detiene
  B-C : prueba exacta, sin cruce
  B-D : xmin 6 > xmax 5, se detiene
  C-D : prueba exacta, cruce
  C-E : xmin 7 > xmax 6, se detiene
  D-E : prueba exacta, cruce
  D-F : y disjuntos, descartada
  E-F : y disjuntos, descartada
parejas visitadas: 7, pruebas exactas: 5, cruces: 3
```

| Segmento barrido | Candidatos visitados | Parada | Pruebas exactas | Observación |
|---|---|---|---|---|
| A (`xmax = 4`) | B, C | `D` empieza en 6 | 2 | `A`-`C`: cajas en contacto en `y = 4`, la prueba exacta dice que no |
| B (`xmax = 5`) | C | `D` empieza en 6 | 1 | Mismo caso: cajas solapadas, segmentos disjuntos |
| C (`xmax = 6`) | D | `E` empieza en 7 | 1 | `D` empieza **exactamente** en 6: se retiene gracias al `<=`, y se tocan en (6, 7) |
| D (`xmax = 9`) | E, F | fin del arreglo | 1 | `F` descartado por las `y` ([0, 1] contra [4, 7]) |
| E (`xmax = 9`) | F | fin del arreglo | 0 | `F` descartado por las `y` |
| F | ninguno | fin del arreglo | 0 | : |

Balance: 15 parejas posibles, 7 examinadas, 5 pruebas exactas, 3 cruces encontrados. El caso de `C` y `D` muestra por qué la prueba es `<=` y no `<`: con `<`, la pareja `C`-`D` nunca se examina y el programa solo encuentra 2 (6 parejas visitadas, 4 pruebas exactas, medido cambiando únicamente ese carácter).

### Por qué no se pierde ningún cruce

Una técnica que elimina parejas debe demostrar que nunca elimina una pareja que se cruza. Sean dos segmentos `s` y `t` que se cruzan, `s` situado antes que `t` en el arreglo ordenado (índices `i < j`).

1. Tienen un punto en común, que pertenece a sus dos cajas: sus intervalos se solapan en `x` **y** en `y`. La prueba en `y` no los descarta, por tanto.
2. La ordenación da `xmin[i] <= xmin[j]`. El solapamiento en `x` exige `xmin[j] <= xmax[i]` («cada uno empieza antes de que termine el otro»), que es exactamente la condición de continuación del bucle.
3. El bucle de `i` avanza `j` desde `i + 1` y solo se detiene en el primer `j` que viola la condición. Para todo `k` más allá, `xmin[k] >= xmin[j] > xmax[i]` (arreglo ordenado): ningún segmento posterior a la parada puede solapar a `i` en `x`. No se salta nada plausible.
4. La pareja `(i, j)` se visita, pasa la prueba en `y`, y la prueba exacta la declara cruzada.

Por construcción, `j` empieza en `i + 1`: una pareja se examina una sola vez, y nunca un segmento con él mismo.

## El coste

| Paso | Coste | Explicación |
|---|---|---|
| Copia y cálculo de las cajas | `O(n)` | Una sola pasada |
| Ordenación por `xmin` | `O(n log n)` | Ordenación por comparación, véase [la ordenación por comparación](/?c=fondamentaux&s=algorithmes&p=tri-par-comparaison) |
| Barrido | `O(n + p)` | `n` vueltas del bucle exterior, más una visita por pareja cuyos intervalos en `x` se solapan (su número es `p`), más una prueba de parada por segmento |
| Pruebas exactas | como máximo `p` | Solo pasan las parejas cuyas cajas también se solapan en `y` |

En total: `O(n log n + p)`. Todo depende de `p`. La medición siguiente compara, para 1 000, 10 000 y 100 000 segmentos pequeños aleatorios, el número de pruebas exactas del método ingenuo y del método ordenado. Los datos vienen de un **generador pseudoaleatorio** (una fórmula que produce una sucesión de números de aspecto aleatorio, pero totalmente determinada por un número de partida, la **semilla**; véase [el azar y los generadores](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#un-prng-es-una-secuencia-determinista)): con la misma semilla, cada ejecución produce los mismos segmentos. Es el **xorshift64** del capítulo [la estabilidad de una ordenación y el ruido reproducible](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible#un-ruido-reproducible-xorshift), cuya fórmula se retoma (`<<` y `>>` desplazan los bits, `^=` es un «o exclusivo»: véase [los operadores binarios](/?c=langages&s=c&p=operateurs-binaires)). Cada segmento parte de un punto sorteado al azar en un cuadrado de lado 100 000, y su segundo extremo se desplaza de -1 000 a +1 000 en cada eje.

| Elemento | Función |
|---|---|
| `enum { MUNDO = 100000, ALCANCE = 1000 };` | Da nombre a constantes enteras |
| `unsigned long long` y `0x9E3779B97F4A7C15ull` | Entero sin signo de 64 bits; constante escrita en hexadecimal (en base 16, de ahí el prefijo `0x`), el sufijo `ull` precisa su tipo. Multiplicar la semilla por esta constante evita una semilla «demasiado simple» |
| `x % limite` | Resto de la división: reduce un número grande al intervalo entre 0 y `limite - 1` (el ligero sesgo de este método se explica en [el sesgo del módulo](/?c=donnees&s=representation-des-donnees&p=aleatoire-et-generateurs#el-sesgo-del-modulo), sin efecto aquí) |
| `memcmp(a, b, tamano)` | Compara dos zonas de memoria byte a byte, devuelve 0 si son idénticas |
| `%zu`, `%lld` | Formatos de `printf` para un `size_t` (entero sin signo para tamaños y números de elementos) y un `long long` |

El primer bloque contiene la versión ingenua, la transposición de los ejes (explicada más abajo, en «El peor caso»), el generador y la fabricación de los segmentos.

```c
// Versión ingenua: prueba las n(n-1)/2 parejas con la prueba exacta.
static void metodo_ingenuo(const Elemento *e, int n, Contadores *c, Resultados *res)
{
    for (int i = 0; i < n; i++) {           // primer segmento de la pareja
        for (int j = i + 1; j < n; j++) {   // segundo segmento, siempre después del primero
            c->visitadas++;                 // una pareja más examinada
            c->pruebas_exactas++;           // y una prueba exacta más
            if (segmentos_se_cruzan(&e[i].seg, &e[j].seg))
                registrar(res, e[i].id, e[j].id);
        }
    }
}

static void intercambiar(long long *u, long long *v)
{
    long long reserva = *u;                 // guarda u a un lado
    *u = *v;                                // u toma el valor de v
    *v = reserva;                           // v toma el antiguo valor de u
}

// Intercambia x e y en todas partes: barrer luego en x equivale a barrer en y el original.
static void transponer(Elemento *e, int n)
{
    for (int i = 0; i < n; i++) {           // cada segmento
        intercambiar(&e[i].seg.a.x, &e[i].seg.a.y);   // transpone el primer extremo
        intercambiar(&e[i].seg.b.x, &e[i].seg.b.y);   // transpone el segundo extremo
        e[i].caja = caja_de(&e[i].seg);     // recalcula la caja con los ejes intercambiados
    }
}

enum { MUNDO = 100000, ALCANCE = 1000 };   // lado del mundo, desplazamiento máximo

// Un paso de xorshift64, el generador del capítulo sobre la estabilidad de la ordenación.
static unsigned long long xorshift64(unsigned long long *estado)
{
    unsigned long long x = *estado;         // el estado actual del generador

    x ^= x << 13;                           // mezcla los bits con un desplazamiento y un XOR
    x ^= x >> 7;                            // segunda mezcla
    x ^= x << 17;                           // tercera mezcla
    return *estado = x;                     // guarda el nuevo estado y lo devuelve
}

// Saca un entero de 0 incluido a limite excluido (sesgo del módulo despreciable).
static long long sortear(unsigned long long *estado, long long limite)
{
    return (long long)(xorshift64(estado) % (unsigned long long)limite);
}

// Rellena e con n segmentos pequeños al azar, en un cuadrado de lado MUNDO.
static void segmentos_aleatorios(Elemento *e, int n, unsigned long long *estado)
{
    for (int i = 0; i < n; i++) {           // un segmento por vuelta
        long long x = sortear(estado, MUNDO);   // abscisa del primer extremo
        long long y = sortear(estado, MUNDO);   // ordenada del primer extremo
        long long dx = sortear(estado, 2 * ALCANCE + 1) - ALCANCE;   // desplazamiento en x
        long long dy = sortear(estado, 2 * ALCANCE + 1) - ALCANCE;   // desplazamiento en y

        e[i].id = i;                        // su número de origen
        e[i].seg = (Segmento){{x, y}, {x + dx, y + dy}};  // el segundo extremo, muy cerca
        e[i].caja = caja_de(&e[i].seg);     // su caja envolvente
    }
}
```

El segundo bloque verifica que los dos métodos encuentran **el mismo conjunto** de cruces (se ordenan las claves de las dos listas y luego se comparan byte a byte), y lanza la medición. Para 100 000 segmentos, la versión ingenua haría 4 999 950 000 pruebas: no terminaba en 20 segundos durante el ensayo, incluso sin los controles de la compilación. El programa no ejecuta, pues, el ingenuo a ese tamaño: el número de pruebas ingenuas mostrado es la fórmula `n(n-1)/2` (el bucle ingenuo hace exactamente tantas), y el resultado se verifica contra un segundo barrido, hecho sobre el eje `y` intercambiando los dos ejes con `transponer`.

```c
// Compara dos claves para el orden creciente.
static int comparar_claves(const void *p, const void *q)
{
    unsigned long long u = *(const unsigned long long *)p;   // primera clave
    unsigned long long v = *(const unsigned long long *)q;   // segunda clave

    return (u > v) - (u < v);
}

// Verdadero si las dos listas de cruces contienen exactamente las mismas parejas.
static int mismos_cruces(Resultados *r1, Resultados *r2)
{
    if (r1->num != r2->num)                 // no tienen el mismo número: son distintas
        return 0;
    qsort(r1->claves, r1->num, sizeof *r1->claves, comparar_claves);   // ordena la primera
    qsort(r2->claves, r2->num, sizeof *r2->claves, comparar_claves);   // y la segunda
    return memcmp(r1->claves, r2->claves, r1->num * sizeof *r1->claves) == 0;   // byte a byte
}

int main(void)
{
    int tamanos[3] = {1000, 10000, 100000};   // los tres tamaños a comparar

    printf("%7s %16s %17s %17s %8s  %s\n", "n", "ingenuo: pruebas", "ordenado: parejas",
           "ordenado: pruebas", "cruces", "verificado contra");
    for (int k = 0; k < 3; k++) {           // una línea de resultados por tamaño
        int n = tamanos[k];                 // número de segmentos de esta línea
        unsigned long long semilla = 0x9E3779B97F4A7C15ull * 42;   // semilla fija
        Elemento *e = malloc((size_t)n * sizeof *e);   // los segmentos de partida
        Elemento *otro = malloc((size_t)n * sizeof *otro);   // copia para el otro método
        Contadores cn = {0, 0}, ct = {0, 0}, ca = {0, 0};   // ingenuo, ordenado en x, control
        Resultados rt = {NULL, 0, 0}, rv = {NULL, 0, 0};    // resultados: ordenado, control
        const char *contra = n <= 10000 ? "ingenuo" : "barrido en y";   // la referencia

        if (e == NULL || otro == NULL)
            return 1;
        segmentos_aleatorios(e, n, &semilla);   // genera los segmentos
        metodo_ordenado(e, n, &ct, &rt, 0);     // ordenación y barrido en x
        if (n <= 10000) {                   // lo bastante pequeño para probarlo todo
            metodo_ingenuo(e, n, &cn, &rv); // todas las parejas
        } else {                            // demasiado largo para ejecutarlo aquí
            memcpy(otro, e, (size_t)n * sizeof *otro);   // copia los segmentos
            transponer(otro, n);            // intercambia los ejes
            metodo_ordenado(otro, n, &ca, &rv, 0);   // barrido según y
            cn.pruebas_exactas = (long long)n * (n - 1) / 2;   // lo que haría el ingenuo
        }
        int iguales = mismos_cruces(&rt, &rv);   // ¿concuerdan los dos métodos?

        printf("%7d %16lld %17lld %17lld %8zu  %s%s\n", n, cn.pruebas_exactas, ct.visitadas,
               ct.pruebas_exactas, rt.num, iguales ? "" : "DIFERENTE ", contra);
        free(rt.claves);                    // libera el resultado del ordenado
        free(rv.claves);                    // libera el de la verificación
        free(otro);                         // libera la copia
        free(e);                            // libera los segmentos
    }
    return 0;
}
```

```text
      n ingenuo: pruebas ordenado: parejas ordenado: pruebas   cruces  verificado contra
   1000           499500              5002                45       16  ingenuo
  10000         49995000            494868              4984     1800  ingenuo
 100000       4999950000          49743253            499117   184665  barrido en y
```

| `n` | Pruebas exactas del ingenuo | Parejas visitadas (ordenación + barrido) | Pruebas exactas (ordenación + barrido) | Reducción de las pruebas exactas |
|---|---|---|---|---|
| 1 000 | 499 500 | 5 002 | 45 | unas 11 000 veces menos |
| 10 000 | 49 995 000 | 494 868 | 4 984 | unas 10 000 veces menos |
| 100 000 | 4 999 950 000 | 49 743 253 | 499 117 | unas 10 000 veces menos |

Dos enseñanzas. Primero, la ganancia es enorme: con 100 000 segmentos, de cinco mil millones de pruebas exactas se pasa a menos de medio millón, y los cruces encontrados son los mismos. Después, y es el punto que no hay que pasar por alto: el número de parejas visitadas **sigue creciendo como `n²`** (se multiplica por 99 y luego por 100 cuando `n` se multiplica por 10 dos veces). La técnica no cambia la forma de la curva aquí: la reduce unas 100 veces en altura, porque en este mundo de lado 100 000 un segmento solapa en `x` solo el 1 % de los demás. La ganancia depende, pues, de la **distribución** de los segmentos: `p` vale aquí alrededor del 1 % de `n(n-1)/2`.

### El peor caso: todo se solapa en x

Si todos los segmentos son largos y se superponen en `x`, cada segmento solapa en `x` a todos los demás: `p = n(n-1)/2`, y el barrido vuelve a `O(n²)`. La medición siguiente fabrica `n` segmentos largos casi horizontales (de `x` cercana a 0 a `x` cercana a 100 000), apilados de 4 en 4 en `y`, así que sin ningún cruce. Cuenta las parejas visitadas por un barrido según `x`, y luego por un barrido según `y` tras `transponer` (los bloques anteriores siguen en el archivo; solo se sustituye el `main` de la medición por este; el compilador señala entonces funciones `static` sin usar, sin consecuencia).

```c
// n segmentos largos casi horizontales, todos superpuestos en x, apilados de 4 en 4 en y.
static void segmentos_en_bandas(Elemento *e, int n, unsigned long long *estado)
{
    for (int i = 0; i < n; i++) {           // un segmento por piso
        long long izquierda = sortear(estado, 100);  // salida cerca del borde (0 a 99)
        long long derecha = MUNDO - sortear(estado, 100);   // llegada cerca del borde derecho
        long long piso = 4 * (long long)i;  // altura del piso, 4 más que el anterior
        long long pendiente = sortear(estado, 3);   // subida de 0 a 2: se queda en su piso

        e[i].id = i;                        // su número de origen
        e[i].seg = (Segmento){{izquierda, piso}, {derecha, piso + pendiente}};   // muy largo
        e[i].caja = caja_de(&e[i].seg);     // su caja envolvente
    }
}

int main(void)
{
    int tamanos[4] = {1000, 2000, 4000, 8000};   // se duplica n en cada línea

    printf("%6s %16s %14s %14s\n", "n", "barrido en x", "barrido en y", "n(n-1)/2");
    for (int k = 0; k < 4; k++) {           // una línea por tamaño
        int n = tamanos[k];                 // número de segmentos de esta línea
        unsigned long long semilla = 0x9E3779B97F4A7C15ull * 42;   // semilla fija
        Elemento *e = malloc((size_t)n * sizeof *e);   // los segmentos de partida
        Contadores cx = {0, 0}, cy = {0, 0}; // contadores de los dos barridos
        Resultados rx = {NULL, 0, 0}, ry = {NULL, 0, 0};   // resultados de los dos barridos

        if (e == NULL)
            return 1;
        segmentos_en_bandas(e, n, &semilla);   // genera las bandas
        metodo_ordenado(e, n, &cx, &rx, 0); // barrido en x: todos los segmentos se solapan
        transponer(e, n);                   // intercambia los ejes
        metodo_ordenado(e, n, &cy, &ry, 0); // barrido en y: los pisos están separados
        printf("%6d %16lld %14lld %14lld\n", n, cx.visitadas, cy.visitadas,
               (long long)n * (n - 1) / 2);
        free(rx.claves);                    // libera los resultados (vacíos aquí)
        free(ry.claves);
        free(e);                            // libera los segmentos
    }
    return 0;
}
```

```text
     n     barrido en x   barrido en y       n(n-1)/2
  1000           499500              0         499500
  2000          1999000              0        1999000
  4000          7998000              0        7998000
  8000         31996000              0       31996000
```

El barrido según `x` visita **exactamente** `n(n-1)/2` parejas, como la versión ingenua: doblar `n` multiplica el trabajo por 4, es el `O(n²)`. El barrido según `y` no visita ninguna, porque los pisos están separados en ese eje. La elección del eje cuenta, pues, tanto como la técnica misma. Queda un caso sin salida: si todos los segmentos se cruzan realmente (por ejemplo, todos pasan por un mismo punto), la respuesta misma contiene `n(n-1)/2` parejas, y ningún algoritmo puede producirla más rápido que escribiéndola.

## Otros usos, y estructuras más finas

| Uso | Cómo se aplica la técnica |
|---|---|
| Colisiones en un juego | Cada objeto tiene una caja; la **fase amplia** (*broad phase*) descarta las parejas lejanas con este barrido, la **fase estrecha** (*narrow phase*) hace la prueba precisa sobre las parejas restantes. Es precisamente el papel de la prueba exacta de arriba |
| Contorno de polígono antes de triangular | Comprobar que dos aristas no se cruzan antes de la [triangulación por *ear clipping*](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#caras-con-un-numero-variable-de-vertices), que [rechaza las caras que se cortan](/?c=fondamentaux&s=graphisme&p=wavefront-obj-et-modele-de-phong#hacer-robusto-el-ear-clipping). Esta técnica no aparece ahí: se añade antes |
| Otras formas | Un círculo, un triángulo, un rectángulo también tienen una caja envolvente: solo cambia la prueba exacta |
| Trayectorias, carreteras, cableado | Todo conjunto de segmentos cuyas intersecciones se buscan |

Cuando la distribución de los segmentos es desfavorable en los dos ejes, toman el relevo estructuras más elaboradas: una **cuadrícula uniforme** (el mundo dividido en casillas, cada segmento guardado en las casillas que toca, a menudo con una [tabla de hash](/?c=langages&s=c&p=tables-de-hachage) para encontrar una casilla) o un **árbol** de cajas (véase [los árboles binarios](/?c=langages&s=c&p=arbres-binaires)). Quedan fuera del alcance de este capítulo.

## Las trampas

| Trampa | Por qué | Remedio |
|---|---|---|
| `<` en lugar de `<=` en la condición del barrido | Dos cajas que se tocan (`xmin[j] == xmax[i]`) se solapan; con `<`, la pareja `C`-`D` del ejemplo se pierde (2 cruces encontrados en lugar de 3) | Intervalos cerrados, `<=` en todas partes |
| `xmin` iguales entre varios segmentos | La ordenación no necesita ser estable: si `xmin[i] == xmin[j]`, la condición `xmin[j] <= xmax[i]` es verdadera en ambos órdenes, la pareja se visita una vez cualquiera que sea el orden elegido por `qsort` (véase [la estabilidad de una ordenación](/?c=fondamentaux&s=algorithmes&p=stabilite-du-tri-et-bruit-reproductible)) | Ningún desempate es necesario para la corrección; añadir uno (por número) solo para que el orden de los resultados sea reproducible |
| Números en coma flotante | `0.1 + 0.2` no es exactamente `0.3` (véase [los números en coma flotante](/?c=donnees&s=representation-des-donnees&p=nombres-flottants)): tres puntos que deberían estar alineados dan un producto vectorial cercano a 0 pero no nulo, véase la prueba justo después | Coordenadas enteras cuando sea posible; si no, una tolerancia, y **ampliar las cajas** en esa tolerancia para que el filtro nunca rechace una pareja que la prueba aceptaría |
| Desbordamiento de enteros | Con `int` de 32 bits, un producto de dos diferencias de coordenadas supera pronto los 2 000 millones | `long long`, y diferencias de coordenadas inferiores a 2 000 millones (su producto cabe entonces en 64 bits) |
| Segmento vertical, horizontal o reducido a un punto | Ningún problema: la caja queda aplanada o reducida a un punto, los intervalos cerrados siguen siendo correctos | No escribir ningún caso particular |
| Pareja probada dos veces, o segmento comparado consigo mismo | Bucle interior iniciado en `0` en lugar de `i + 1`: cada cruce se cuenta dos veces, y un segmento «se cruza» siempre consigo mismo | Empezar `j` en `i + 1` |
| Aristas vecinas de un polígono | Dos aristas consecutivas comparten un extremo: la prueba las declara cruzadas, con razón en el sentido de este capítulo | Ignorar las parejas `(i, i+1)` y `(última, primera)` antes de la prueba exacta, conservando el número de origen de cada segmento |
| Ordenar el arreglo original | Sus números de posición se pierden, los resultados ya no tienen sentido | Ordenar una copia que conserve un `id` (este capítulo), o ordenar un arreglo de índices (las posiciones de los segmentos): menos bytes desplazados, pero un acceso indirecto en cada comparación; medir con los propios datos |
| Eje equivocado | Medido más arriba: `n(n-1)/2` parejas visitadas en `x`, cero en `y` | Barrer sobre el eje donde los intervalos se solapan menos (regla empírica tras la tabla) |
| Creer que la ordenación siempre hace el cálculo en `O(n log n)` | El barrido cuesta `O(n + p)`, pudiendo valer `p` `n(n-1)/2` | Medir `p` (el contador `visitadas`) con datos reales |
| Comparador de `qsort` por resta | `a - b` puede desbordar con enteros grandes y devolver un signo falso | `(a > b) - (a < b)` |

La prueba con números en coma flotante: tres puntos que deberían estar alineados sobre la recta `y = x`, cuyo tercero se calcula como `0.1 + 0.2` en lugar de escribirse `0.3`.

```c
#include <stdio.h>

int main(void)
{
    double ax = 0.1, ay = 0.1;              // primer punto, sobre la recta y = x
    double bx = 0.3, by = 0.3;              // segundo punto, sobre la misma recta
    double cx = 0.1 + 0.2, cy = 0.3;        // tercer punto: 0.1 + 0.2 debería valer 0.3
    double producto = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);   // producto vectorial

    printf("%g\n", producto);               // 0 esperado
    return 0;
}
```

```text
-1.38778e-17
```

El resultado no es 0: la prueba declararía que estos tres puntos no están alineados. Para elegir el eje, una regla empírica (sacada de la experiencia, no demostrada aquí) consiste en calcular, para cada eje, la suma de las longitudes de los intervalos (`xmax - xmin`, y luego `ymax - ymin`) y en barrer sobre el eje donde esa suma es la menor: allí es donde los intervalos se solapan menos. Otra consiste en medir `p` en cada eje con una muestra.

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Mantener la prueba exacta tal cual y añadirle solo un filtro previo | La corrección del resultado depende solo de la prueba exacta y de la demostración del filtro |
| Calcular la caja una sola vez por segmento | Se relee en cada comparación |
| Usar intervalos cerrados y `<=` | Los contactos nunca se pierden |
| Preferir coordenadas enteras y un tipo lo bastante amplio | La prueba exacta se vuelve exacta, sin tolerancia |
| Contar las parejas visitadas y las pruebas exactas | `p` indica si la técnica aporta algo con sus datos |
| Verificar el resultado contra la versión ingenua con entradas pequeñas | Un error del filtro aparece como un cruce que falta |
| Decidir de una vez por todas qué significa «cruzarse» (contacto, solapamiento) | Los casos límite cambian de veredicto según la definición |
| Generar los datos de prueba con una semilla fija | Las mediciones son repetibles y comparables |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Probar todas las parejas de `n` segmentos cuesta `n(n-1)/2` pruebas exactas, es decir `O(n²)`. Ordenar y barrer ordena los segmentos por `xmin` y luego, para cada segmento `i`, recorre los siguientes `j` mientras `xmin[j] <= xmax[i]`, prueba el solapamiento en `y`, y solo lanza la prueba exacta (orientación por producto vectorial, contactos y solapamientos incluidos) sobre las parejas restantes. Ninguna pareja que se cruza se pierde: se solapa en `x` y en `y`, y la ordenación garantiza que no se para antes de tiempo. El coste es `O(n log n + p)`, donde `p` es el número de parejas cuyos intervalos en `x` se solapan. Medido: 5 000 millones de pruebas para 100 000 segmentos pequeños, frente a menos de 500 000, pero `p` crece siempre como `n²` con distribución constante, y vale `n(n-1)/2` si todo se superpone en `x`. |
| **Trampas a evitar** | `<` en lugar de `<=`; olvidar que las cajas que se solapan no garantizan un cruce (la prueba exacta sigue siendo necesaria); flotantes no alineados por redondeo; desbordamiento de enteros de 32 bits; bucle interior iniciado antes de `i + 1`; aristas vecinas de un polígono contadas como cruces; ordenar el arreglo original y perder los números; barrer sobre el eje equivocado; creer en un `O(n log n)` garantizado. |
| **Buenas prácticas** | Intervalos cerrados y `<=`; caja calculada una vez; coordenadas enteras en `long long`; contadores de parejas visitadas y de pruebas exactas; verificación contra la versión ingenua con entradas pequeñas; definición de «cruce» escrita y probada en los casos límite; semilla fija para las mediciones; eje elegido medido, con una cuadrícula o un árbol de respaldo cuando ningún eje conviene. |
