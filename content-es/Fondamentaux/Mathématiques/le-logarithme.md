---
order: 4
---

# El logaritmo

Este capítulo presenta el logaritmo, una noción retomada más adelante para medir hasta qué punto una predicción es buena o mala en un modelo de machine learning.

## El inverso de la potencia

Elevar un número a una potencia (`b^y`) equivale a multiplicar `b` por sí mismo `y` veces: `10^3 = 10 × 10 × 10 = 1000`. El **logaritmo** plantea la pregunta inversa: ¿a qué potencia hay que elevar una base dada para obtener un número dado?

```text
10^2 = 100   ->  log10(100) = 2   ("hay que elevar 10 a la potencia 2 para obtener 100")
10^3 = 1000  ->  log10(1000) = 3
10^0 = 1     ->  log10(1) = 0
```

> **Analogía:** doblar una hoja de papel por la mitad, repetir la operación. Tras 1 doblez, 2 capas; tras 2 dobleces, 4; tras 3, 8. `log2(8) = 3` responde exactamente a la pregunta "¿cuántas veces hay que doblar la hoja para obtener 8 capas?".

## Las bases habituales

| Base | Notación | Responde a | Ámbito de uso típico |
|---|---|---|---|
| 10 | `log10(x)` o `log(x)` | ¿Cuántas veces multiplicar por 10? | Órdenes de magnitud, escalas ([Richter](https://en.wikipedia.org/wiki/Richter_magnitude_scale), [decibelios](https://en.wikipedia.org/wiki/Decibel)) |
| 2 | `log2(x)` | ¿Cuántas veces duplicar? | Informática (búsqueda en un árbol, complejidad de un algoritmo) |
| *e* (≈ 2,718) | `ln(x)` | Sin pregunta tan intuitiva como las dos anteriores: esta base se elige porque simplifica numerosos cálculos matemáticos | La mayoría de las fórmulas usadas en estadística y machine learning |

> **Trampa:** confundir las bases. `log2(8) = 3` pero `log10(8) ≈ 0,9`: el resultado depende enteramente de la base elegida, dos logaritmos de bases diferentes nunca se comparan directamente sin conversión.
>
> **Buena práctica:** verificar siempre qué base usa una función o una fórmula antes de interpretar su resultado (`log` en [Python](/?c=langages-de-programmation&s=python&p=python), por ejemplo, designa el logaritmo **natural** (base *e*), no base 10, contrariamente a lo que el nombre podría sugerir).

## La forma de su curva: muy lenta para las x grandes, muy rápida cerca de 0

El gráfico de abajo coloca cada punto `(x, log10(x))` en su posición real, sobre un eje de `x` **lineal** (cada intervalo horizontal representa la misma diferencia de `x`, a diferencia de la tabla de más arriba):

```plot-fonction
fn: x => log(x)
domaine: 0.05, 12
label: log10(x)
```

Entre `x = 0,1` y `x = 1` (una porción muy pequeña de este eje lineal), la curva ya sube de -1 a 0: una variación de 1 unidad. Entre `x = 1` y `x = 10` (nueve veces más ancho), solo sube de 0 a 1: la **misma** variación de 1 unidad, pero repartida en una distancia mucho mayor. El resultado visual es esta forma asimétrica: una subida empinada a la izquierda (cerca de 0), luego un aplanamiento progresivo a medida que `x` crece.

Esta compresión cerca de 0 continúa sin límite: cuanto más se acerca `x` a 0, más se hunde `log10(x)` hacia grandes números negativos, en un intervalo de `x` cada vez más estrecho (ver la tabla de abajo). Una fórmula que aplica `-log(x)` a un número cercano a 0 hereda esta misma compresión: el resultado explota en un intervalo muy pequeño, una de las formas de penalizar fuertemente un resultado casi nulo.

| x | log10(x) |
|---|---|
| 0,001 | -3 |
| 0,01 | -2 |
| 0,1 | -1 |
| 1 | 0 |
| 10 | 1 |
| 100 | 2 |
| 1 000 | 3 |

## Trampa: el logaritmo no está definido en todas partes

`log(0)` no está definido: el valor disminuye sin límite a medida que `x` se acerca a 0, sin alcanzar nunca un resultado finito. El logaritmo de un número negativo tampoco está definido (en los números reales).

> **Trampa:** aplicar un logaritmo a un valor que puede valer exactamente 0 (una probabilidad, por ejemplo) provoca un error o un valor infinito en un programa, no un resultado inusual pero válido.
>
> **Buena práctica:** en un cálculo que aplica un logaritmo a una probabilidad, añadir un valor muy pequeño antes del cálculo (`log(p + 0.0000001)` por ejemplo) evita este caso límite, en lugar de dejar que el cálculo falle o devuelva un valor infinito.

## Propiedad útil: transformar una multiplicación en una suma

```text
log(a × b) = log(a) + log(b)
```

Esta propiedad permite reemplazar una multiplicación por una suma, generalmente más simple de calcular y menos propensa a producir un número que se vuelve demasiado pequeño o demasiado grande para representarse correctamente en memoria (ver [los números de coma flotante](/?c=representation-des-donnees&p=nombres-flottants)), útil en particular cuando hay que multiplicar entre sí muchísimos números pequeños.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | El logaritmo responde a "¿a qué potencia elevar esta base para obtener este número?" (el inverso de la potencia). Crece muy lentamente para valores grandes, y cae hacia menos infinito cerca de 0. |
| **Herramientas utilizables** | `log10()`, `log2()`, `log()` (natural, base *e*) en la mayoría de los lenguajes: verificar sistemáticamente cuál se usa. |
| **Trampas a evitar** | Confundir dos logaritmos de bases diferentes. Aplicar un logaritmo a un valor que puede ser 0 o negativo. |
| **Buenas prácticas** | Verificar la base usada por una función antes de interpretar su resultado. Añadir un valor pequeño antes de un `log()` aplicado a una probabilidad, para evitar `log(0)`. |
