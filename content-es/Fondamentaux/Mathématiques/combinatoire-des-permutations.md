---
order: 8
---

# Contar permutaciones: factorial, coeficiente binomial y números de Stirling

La **combinatoria** es el arte de **contar sin enumerarlo todo**. En programación sirve para prever el tamaño de un problema antes de lanzarlo: ¿cuántos casos va a examinar un algoritmo?, ¿cuánta memoria habrá que reservar? (ver [La complejidad y la notación Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)).

Ejemplo conductor: una fila del puzle **Skyscraper**, que contiene edificios de altura 1 a n, cada altura una sola vez; una pista en el borde indica cuántos edificios se ven desde ese lado, y un edificio oculta a todos los más pequeños situados detrás de él.

## El factorial: el número de órdenes posibles

Una **permutación** es una forma de colocar n elementos distintos en un orden. Su número es el **factorial** de n, escrito `n!`: n opciones para el primer lugar, n − 1 para el segundo, y así sucesivamente.

```
n! = n × (n − 1) × ... × 2 × 1          ejemplo: 4! = 4 × 3 × 2 × 1 = 24
```

| n | n! |
|---|---|
| 4 | 24 |
| 10 | 3 628 800 |
| 11 | 39 916 800 |
| 13 | 6 227 020 800 |

El factorial crece todavía más rápido que una exponencial. Consecuencia medida en un solucionador de Skyscraper que almacenaba, para cada fila, todas las permutaciones compatibles con sus pistas: en cuadrícula de 12 × 12, la generación ya producía 660 millones de candidatos (5,3 GB de memoria) antes incluso de buscar.

## El coeficiente binomial: elegir k elementos entre n

El **coeficiente binomial** `C(n, k)` cuenta las formas de elegir k elementos entre n, sin tener en cuenta el orden. Por ejemplo, elegir 2 ingredientes entre 4: `C(4, 2) = 6`.

```
C(n, k) = n! / (k! × (n − k)!)
```

Calcular los tres factoriales superaría pronto la capacidad de un entero (`21!` ya no cabe en 64 bits). Por eso se calcula paso a paso, multiplicando y luego dividiendo:

```python
def binomial(n, k):
    r = 1
    for i in range(1, k + 1):
        r = r * (n - k + i) // i  # división siempre exacta: r × (n-k+i) es divisible por i
    return r

print(binomial(4, 2))    # 6
print(binomial(60, 30))  # 118264581564861424, sin calcular nunca 60!
```

La división siempre es exacta porque, tras el paso i, `r` vale `C(n − k + i, i)`, un número entero. Comprobado para todos los `n` hasta 60.

## Los récords de una permutación

Un **récord** es un elemento mayor que todos los que lo preceden, leyendo de izquierda a derecha. En el Skyscraper, los récords son exactamente los edificios **visibles** desde la izquierda:

```
permutación: 1  2  4  3
récords    : 1  2  4        (3 es menor que 4, situado antes)  -> 3 récords, 3 edificios visibles
```

## Los números de Stirling de primera especie

¿Cuántas permutaciones de n elementos tienen exactamente k récords? Este número se llama **número de Stirling de primera especie** (sin signo) y se escribe `c(n, k)`.

| n \ k | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1 | 1 | | | | |
| 2 | 1 | 1 | | | |
| 3 | 2 | 3 | 1 | | |
| 4 | 6 | 11 | 6 | 1 | |
| 5 | 24 | 50 | 35 | 10 | 1 |

Cada fila suma `n!` (24 + 50 + 35 + 10 + 1 = 120 = 5!). La tabla se rellena fila por fila gracias a una **recurrencia**, mirando dónde está el elemento más pequeño (el 1):

| Posición del 1 | ¿Es un récord? | Número de permutaciones |
|---|---|---|
| En primer lugar | Sí (nada antes que él), y no oculta nada porque es el más pequeño: los n − 1 restantes deben aportar los k − 1 récords que faltan | `c(n − 1, k − 1)` |
| En uno de los otros n − 1 lugares | No (lo precede uno mayor), y sigue sin ocultar nada: los demás deben aportar los k récords | `(n − 1) × c(n − 1, k)` |

```python
def stirling1(n):
    """Tabla c[i][j]: número de permutaciones de i elementos con j récords."""
    c = [[0] * (n + 1) for _ in range(n + 1)]
    c[0][0] = 1                                          # la permutación vacía: 0 récords
    for i in range(1, n + 1):
        for j in range(1, i + 1):
            c[i][j] = c[i - 1][j - 1] + (i - 1) * c[i - 1][j]
    return c

print(stirling1(5)[5])  # [0, 24, 50, 35, 10, 1]
```

## Ver desde los dos lados a la vez

Una fila de Skyscraper suele tener una pista a la izquierda (a edificios visibles) **y** otra a la derecha (b visibles). El edificio más alto, n, es visible desde los dos lados. El número de permutaciones que respetan ambas pistas es:

```
C(a + b − 2, a − 1) × c(n − 1, a + b − 2)
```

Ejemplo: n = 5, a = 2, b = 2 da `C(2, 1) × c(4, 2) = 2 × 11 = 22`, lo que confirma la enumeración de las 120 permutaciones. Fórmula comprobada por enumeración para todos los tamaños hasta 7.

Uso concreto: conocer este número **antes** de generar los candidatos de una fila permite reservar exactamente la cantidad de memoria necesaria de una sola vez, en lugar de ir agrandando un array.

## Elegir un orden de construcción que compruebe pronto

Para generar las permutaciones que respetan una pista, importa el orden en el que se colocan los valores:

| Orden de colocación | ¿Cuándo se sabe si un edificio es visible? |
|---|---|
| Casillas de izquierda a derecha | Visibilidad desde la izquierda: enseguida. Desde la derecha: solo con la fila completa. |
| Valores del **más grande al más pequeño** | Desde los dos lados, en cuanto se coloca: todos los edificios ya colocados son más altos, así que es visible desde un lado si ninguno de ellos está de ese lado; y los valores colocados después, más pequeños, nunca podrán ocultarlo. |

Con el segundo orden, una permutación parcial que ya supera una pista (izquierda **o** derecha) se abandona de inmediato, con todas sus continuaciones. Medido en el generador del solucionador Skyscraper: de 5 a 6 veces más rápido que el llenado de izquierda a derecha.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `n!` cuenta los órdenes de n elementos y explota muy rápido; `C(n, k)` cuenta las elecciones de k entre n; `c(n, k)`, el número de Stirling de primera especie, cuenta las permutaciones con k récords (k edificios visibles). |
| **Herramientas utilizables** | Cálculo incremental del coeficiente binomial; recurrencia `c(n, k) = c(n − 1, k − 1) + (n − 1) × c(n − 1, k)`; fórmula con dos pistas `C(a + b − 2, a − 1) × c(n − 1, a + b − 2)`. |
| **Trampas a evitar** | Calcular `C(n, k)` pasando por tres factoriales (desbordamiento); materializar todas las permutaciones de un problema sin haber contado cuántas hay. |
| **Buenas prácticas** | Contar antes de generar, para estimar el coste y reservar la memoria exacta; elegir un orden de construcción que permita comprobar las restricciones lo antes posible; comprobar una fórmula por enumeración en tamaños pequeños. |
