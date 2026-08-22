---
order: 3
---

# Las matrices y el producto matricial

Un [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) guarda varios números en una sola lista. Una **matriz** va un paso más allá: guarda números en una **tabla de dos dimensiones** (filas y columnas), exactamente como una hoja de cálculo. Es la herramienta que permite calcular sobre *varios* vectores a la vez, de un solo golpe, en lugar de uno por uno, y es muy concretamente lo que hace funcionar una red neuronal.

## ¿Qué es una matriz?

Una matriz es una tabla de números organizada en filas y columnas. Sus dimensiones se anotan como **filas × columnas**:

```text
     columna 1  columna 2  columna 3
fila 1    1         2          3
fila 2    4         5          6
```

Esta matriz tiene 2 filas y 3 columnas: se dice que es de dimensión **2×3**. Un elemento se localiza por su posición `(fila, columna)`: el elemento en la posición (2, 3) vale 6.

> **Analogía:** una hoja de cálculo sin las fórmulas: solo celdas organizadas en filas y columnas, cada una con un número.

> **Trampa:** esta numeración `(2, 3)` cuenta desde 1, como en matemáticas. En NumPy (ver el capítulo [NumPy](/?c=data-science&p=numpy)) y en la mayoría de los lenguajes de programación, la indexación empieza en 0: ese mismo elemento se obtendría en código con `matriz[1, 2]`, no `matriz[2, 3]`.

Un vector no es entonces más que un caso particular de matriz: una sola columna (dimensión *n*×1) o una sola fila (1×*n*). Todo lo visto sobre los [vectores](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (la suma, el producto escalar) se generaliza directamente a las matrices.

## Suma y multiplicación por un número

Como con los vectores, estas dos operaciones se hacen término a término, posición por posición:

```text
[1, 2]     [5, 6]     [1+5, 2+6]     [6,  8]
[3, 4]  +  [7, 8]  =  [3+7, 4+8]  =  [10, 12]

[1, 2]           [1×3, 2×3]        [3, 6]
[3, 4]  × 3  =    [3×3, 4×3]   =    [9, 12]
```

> **Trampa:** sumar dos matrices de dimensiones diferentes no tiene sentido: como con los vectores, cada posición debe tener un correspondiente exacto en la otra matriz.
>
> **Buena práctica:** verificar que dos matrices tienen exactamente las mismas dimensiones antes de sumarlas.

## El producto matriz-vector: varias neuronas, un solo cálculo

Aquí está la operación que realmente importa. Recordatorio del capítulo sobre [las redes neuronales](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones): una neurona calcula una suma ponderada de sus entradas, es decir un [producto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire) entre el vector de entradas y su propio vector de pesos. Una capa contiene *varias* neuronas, cada una con su propio vector de pesos; colocados en filas, estos vectores de pesos forman una matriz:

```text
Pesos de 2 neuronas, para 2 entradas cada una:

W = [ 0.5  -0.3 ]   <- pesos de la neurona 1
    [ 0.2   0.4 ]   <- pesos de la neurona 2

Entrada:  x = [1.0]
              [2.0]
```

El **producto matriz-vector** `W · x` calcula el producto escalar de **cada fila** de `W` con `x`, y coloca cada resultado en una nueva columna:

```text
W · x = [ 0.5×1.0 + (-0.3)×2.0 ]  =  [ -0.1 ]
        [ 0.2×1.0 +   0.4×2.0 ]      [  1.0 ]
```

Compara con el cálculo neurona por neurona del capítulo sobre las redes neuronales: `pesos_n1 · entradas = 0.5×1.0 + (-0.3)×2.0` y `pesos_n2 · entradas = 0.2×1.0 + 0.4×2.0`. Son exactamente los mismos dos productos escalares, obtenidos aquí **en una sola operación** en lugar de un cálculo repetido por neurona. Ese es todo el interés: una capa de 500 neuronas no requiere 500 productos escalares escritos uno por uno, sino un solo producto matriz-vector, `W · x`.

> **Trampa:** multiplicar una matriz por un vector cuyo tamaño no corresponde al número de columnas de la matriz: la `W` de arriba (2×2) solo puede multiplicar un vector de 2 elementos. Las bibliotecas de cálculo lanzan un error explícito en ese caso en lugar de adivinar.
>
> **Buena práctica:** verificar que el número de columnas de la matriz corresponde exactamente al tamaño del vector, antes de cualquier multiplicación.

## El producto matriz-matriz: procesar varios ejemplos a la vez (el *batch*)

Una sola entrada a la vez sigue siendo ineficiente a la escala del entrenamiento de un modelo. En la práctica, varios ejemplos (un **batch**, ver [El entrenamiento de un modelo](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) se apilan en filas en una matriz `X`, y un solo producto matricial calcula la salida de todos los ejemplos a la vez:

```text
X (2 ejemplos, 2 entradas cada uno):   [ 1.0  2.0 ]
                                         [ 0.5  1.5 ]

W (2 neuronas, transpuesta para la ocasion):   [ 0.5   0.2 ]
                                                 [-0.3   0.4 ]

X · W = [ 1.0×0.5+2.0×(-0.3)   1.0×0.2+2.0×0.4 ]   [ -0.1   1.0 ]
        [ 0.5×0.5+1.5×(-0.3)   0.5×0.2+1.5×0.4 ] = [ -0.2   0.7 ]
```

Cada fila del resultado corresponde a un ejemplo, cada columna a una neurona: las dos salidas del primer ejemplo ((-0.1, 1.0)) coinciden exactamente con el resultado calculado antes con `W · x`, obtenido aquí a la vez que las del segundo ejemplo.

**La regla de las dimensiones:** multiplicar una matriz (*m*×*n*) por una matriz (*n*×*p*) da una matriz (*m*×*p*); el número de columnas de la primera siempre debe igualar el número de filas de la segunda:

```text
(m × n)  ·  (n × p)  =  (m × p)
      \_______/
    deben ser iguales
```

> **Trampa:** un producto matricial **no es conmutativo**: `A · B` y `B · A` en general no dan el mismo resultado, y uno de los dos puede incluso no estar definido en absoluto si las dimensiones no lo permiten (a diferencia de la suma de números, donde el orden nunca importa).
>
> **Buena práctica:** siempre verificar el orden de las matrices en un producto: `A · B` y `B · A` son dos cálculos diferentes, nunca intercambiables por defecto.

## Cómo se calcula un resultado del producto matricial

La regla general, de la que las dos secciones anteriores no son más que casos particulares: el elemento en la posición (fila *i*, columna *j*) del resultado es el [producto escalar](/?c=mathematiques&p=vecteurs-et-produit-scalaire) de la fila *i* de la primera matriz y la columna *j* de la segunda. Nada nuevo matemáticamente: es la misma operación que para un vector, repetida una vez por celda del resultado.

## Producto matricial vs producto término a término: no confundir

Dos operaciones distintas llevan nombres parecidos y se confunden fácilmente:

| Operación | Nombre | Cálculo | Dimensiones |
|---|---|---|---|
| `A · B` | Producto matricial | Producto escalar fila × columna (ver arriba) | (*m*×*n*) · (*n*×*p*) = (*m*×*p*) |
| `A ⊙ B` | Producto término a término ([*Hadamard*](https://en.wikipedia.org/wiki/Hadamard_product_(matrices))) | Cada celda de `A` multiplicada por la celda correspondiente de `B` | `A` y `B` deben tener exactamente las mismas dimensiones |

> **Trampa:** en NumPy (ver el capítulo [NumPy](/?c=data-science&p=numpy)), `A * B` calcula el producto **término a término**, no el producto matricial: es `A @ B` (o `np.dot(A, B)`) lo que hay que usar para un verdadero producto matricial. Usar `*` por reflejo donde se quería `@` no siempre provoca un error (si las dimensiones coinciden por casualidad), lo que hace esta trampa particularmente difícil de detectar.
>
> **Buena práctica:** verificar sistemáticamente cuál de los dos productos aplica una biblioteca de cálculo a un operador dado, en lugar de suponer que `*` designa siempre la misma operación de un lenguaje o una biblioteca a otra.

## La transpuesta: intercambiar filas y columnas

La **transpuesta** de una matriz (anotada `Aᵀ`) intercambia sus filas y sus columnas:

```text
     [ 1  2  3 ]                [ 1  4 ]
A =  [ 4  5  6 ]      Aᵀ =      [ 2  5 ]
                                 [ 3  6 ]
```

Una matriz 2×3 se convierte en una matriz 3×2. La transpuesta sirve casi siempre para reorientar una matriz para que sus dimensiones correspondan a las esperadas por un producto matricial: es exactamente por esta razón que `W` fue transpuesta en el ejemplo del batch de arriba, para que sus columnas (una por neurona) se alinearan con las columnas de `X`.

## El costo del cálculo: por qué el hardware importa tanto

Calcular `A · B` para dos matrices *n*×*n* requiere, con el método ingenuo, *n*³ multiplicaciones; un costo que crece **mucho** más rápido que el tamaño de las matrices:

```python
# Version ingenua: tres bucles anidados
def producto_matricial(A, B, n):
    resultado = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                resultado[i][j] += A[i][k] * B[k][j]
    return resultado
```

Duplicar el tamaño de una matriz no duplica el tiempo de cálculo: se multiplica por 8 (2³). Por eso exactamente el tamaño de un modelo (el número de neuronas por capa, el tamaño de un batch) tiene un costo de hardware que crece muy rápido, y por qué existen la [GPU](/?c=infrastructure&p=cpu-vs-gpu) y la [vectorización SIMD](/?c=performance&p=cache-cpu-et-simd): el producto matricial es precisamente el tipo de cálculo (repetitivo, idéntico, sobre datos independientes) que una GPU acelera mejor, lo que explica por qué el entrenamiento de un modelo de deep learning se hace casi siempre en GPU en lugar de en CPU.

> **Trampa:** escribir uno mismo un bucle de producto matricial (como arriba) en código real. Una implementación ingenua ignora todo lo visto en [Caché de CPU y vectorización](/?c=performance&p=cache-cpu-et-simd) (localidad de memoria, SIMD): una biblioteca como NumPy puede ser decenas a cientos de veces más rápida en el mismo cálculo, con un resultado estrictamente idéntico.
>
> **Buena práctica:** siempre delegar un producto matricial a una biblioteca optimizada (NumPy, [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)...) en lugar de escribir el bucle uno mismo. Ver también el capítulo [NumPy](/?c=data-science&p=numpy).

## Dónde aparecen las matrices concretamente en IA

| Elemento | Lo que representa | Capítulo relacionado |
|---|---|---|
| Pesos de una capa | Una matriz, una fila por neurona | [Las redes neuronales](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) |
| Un batch de entradas | Una matriz, una fila por ejemplo | [El entrenamiento y la descenso de gradiente](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) |
| Una tabla de embeddings | Una matriz, una fila por palabra del vocabulario | [NLP y LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) |
| La atención de un Transformer | Productos matriciales entre matrices de consultas/claves/valores | [Arquitecturas: CNN, RNN y Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) |

En los cuatro casos, el principio sigue siendo el visto en este capítulo: reemplazar una serie de cálculos repetidos por un solo producto matricial, para que el hardware (GPU, SIMD) pueda ejecutarlos en paralelo en lugar de uno por uno.

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Una matriz guarda números en filas y columnas; un vector es un caso particular. El producto matricial calcula varios productos escalares en una sola operación (varias neuronas, o varios ejemplos de un batch): es esta operación, repetida a muy gran escala, la que hace funcionar el deep learning. |
| **Herramientas utilizables** | `@` o `np.dot()` en NumPy para un verdadero producto matricial (nunca `*`, que multiplica término a término); la transpuesta para reorientar una matriz antes de un producto. |
| **Trampas a evitar** | Multiplicar dos matrices cuyas dimensiones internas no corresponden. Confundir producto matricial y producto término a término. Suponer que `A · B` y `B · A` dan el mismo resultado. Escribir el propio bucle de producto matricial en código real. |
| **Buenas prácticas** | Verificar las dimensiones antes de cualquier producto matricial. Verificar siempre qué operador usa una biblioteca para qué producto. Delegar todo cálculo matricial a una biblioteca optimizada (NumPy, [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) en lugar de reimplementarlo. |
