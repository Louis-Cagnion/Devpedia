---
order: 2
---

# NumPy: cálculo numérico

**NumPy** (*Numerical Python*) proporciona el tipo «`ndarray`»: una matriz multidimensional de valores **de un único tipo**, almacenados de forma contigua en memoria (exactamente igual que una matriz en C, véase el capítulo sobre punteros y memoria en C), en lugar de como una lista en Python (en la que cada elemento es una referencia independiente a un objeto). Es el pilar fundamental sobre el que se asientan pandas, scikit-learn y la práctica totalidad del ecosistema de ciencia de datos de Python.

## ¿Por qué no simplemente listas de Python?

```python
import numpy as np

lista = [1, 2, 3, 4, 5]
matriz = np.array([1, 2, 3, 4, 5])

# Multiplicar cada elemento por 2:
[x * 2 for x in lista]     # Requiere un bucle en Python, elemento por elemento.
matriz * 2                  # «* 2» se aplica directamente a TODO el array -> [2, 4, 6, 8, 10]
```

> **Nota:** una lista de Python almacena **punteros** a objetos `int` que pueden estar dispersos en la memoria (véase el capítulo sobre punteros, apartado C); un `ndarray` almacena los **valores en bruto** uno tras otro, como un array de C. Las operaciones de NumPy se ejecutan mediante código C compilado internamente, en esta memoria contigua, lo que suele ser entre 10 y 100 veces más rápido que un bucle equivalente en Python, además de utilizar mucha menos memoria.

## Crear tablas

```python
np.array([1, 2, 3])              # a partir de una lista de Python
np.zeros((3, 4))                    # tabla de 3x4 celdas llena de ceros
np.ones((2, 2))                      # tabla de 2x2 llena de unos
np.arange(0, 10, 2)                   # [0, 2, 4, 6, 8] -> equivalente en NumPy de range()
np.linspace(0, 1, 5)                   # [0, 0,25, 0,5, 0,75, 1,0] -> 5 valores espaciados uniformemente
np.random.rand(3, 3)                    # tabla de 3x3 con valores aleatorios entre 0 y 1
```

## `shape` y `dtype`

```python
matriz = np.array([[1, 2, 3], [4, 5, 6]])

matriz.shape   # (2, 3) -> 2 filas, 3 columnas
matriz.dtype    # dtype('int64') -> TODOS los elementos comparten este mismo tipo
matriz.ndim      # 2 -> número de dimensiones
```

> **Nota:** a diferencia de una lista de Python (en la que pueden coexistir distintos tipos), un «`ndarray`» impone un **único tipo** para todos sus elementos; esto es precisamente lo que permite el almacenamiento contiguo y las optimizaciones de rendimiento que de ello se derivan.

## Indexación y segmentación

```python
matriz = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])

matriz[0]        # [1, 2, 3] -> primera línea
matriz[0, 2]      # 3 -> línea 0, columna 2
matriz[:, 1]       # [2, 5, 8] -> toda la columna del índice 1
matriz[0:2, 0:2]    # subtabla: las dos primeras filas y columnas
```

## La *difusión*: trabajar con matrices de diferentes tamaños

NumPy «amplía» automáticamente una matriz más pequeña para que coincida con una más grande, sin duplicar realmente los datos en memoria:

```python
matriz = np.array([[1, 2, 3], [4, 5, 6]])
vecteur = np.array([10, 20, 30])

matriz + vecteur
# [[11, 22, 33],
# [14, 25, 36]]  -> «vector» se aplica a CADA fila de «matriz»
```

Regla de compatibilidad: dos dimensiones son compatibles si son iguales, o si una de ellas es igual a `1` (dimensión «estirada» virtualmente para que coincida con la otra).

## Operaciones vectorizadas habituales

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

a + b        # [5, 7, 9] -> suma elemento por elemento
a * b        # [4, 10, 18] -> multiplicación elemento por elemento (NO un producto matricial)
a @ b        # 32 -> producto escalar (1*4 + 2*5 + 3*6)
np.dot(a, b)  # 32 -> equivalente explícito de «@»

a.sum()       # 6
a.mean()      # 2.0
a.max()        # 3
```

> **Nota:** «`*`» entre dos matrices de NumPy multiplica elemento por elemento; para un producto matricial verdadero (en el sentido de la álgebra lineal, muy utilizado en el aprendizaje profundo; véase el capítulo sobre redes neuronales), el operador es «`@`» (o «`np.matmul()`»), nunca «`*`».

Véase también el capítulo sobre pandas, que construye sus «`DataFrame`» directamente sobre los «`ndarray`» de NumPy.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un `ndarray` de NumPy almacena valores brutos contiguos de un solo tipo, a diferencia de una lista de Python (punteros hacia objetos dispersos); las operaciones vectorizadas se ejecutan mediante código C compilado, mucho más rápido que un bucle de Python. |
| **Herramientas utilizables** | `np.array`/`zeros`/`ones`/`arange`/`linspace`, indexación/slicing multidimensional, broadcasting. |
| **Trampas a evitar** | Usar `*` pensando obtener un producto matricial: es una multiplicación elemento por elemento; el producto matricial es `@`. |
| **Buenas prácticas** | Preferir una operación vectorizada a un bucle explícito de Python sobre un `ndarray`, para aprovechar la ganancia de rendimiento. |
