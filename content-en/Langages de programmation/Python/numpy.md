---
order: 14
---

# NumPy — Numerical Computation

**NumPy** (*Numerical Python*) provides the `ndarray` type: a multidimensional array of values **of a single type**, stored contiguously in memory—exactly like a C array (see the chapter on pointers and memory in C), rather than as a Python list (where each element is a separate reference to an object). It is the building block upon which pandas, scikit-learn, and virtually the entire Python data science ecosystem are built.

## Why not just use Python lists?

```python
import numpy as np

list = [1, 2, 3, 4, 5]
array = np.array([1, 2, 3, 4, 5])

# Multiply each element by 2:
[x * 2 for x in list]     # requires a Python loop that processes each element individually
array * 2                  # "* 2" applies directly to the ENTIRE array -> [2, 4, 6, 8, 10]
```

> **Note:** A Python list stores **pointers** to objects `int` that may be scattered throughout memory (see the chapter on pointers, C section); a `ndarray` stores **raw values** one after another, like a C array. NumPy operations are executed by internally compiled C code on this contiguous memory—often 10 to 100 times faster than an equivalent Python loop, while also using significantly less memory.

## Create tables

```python
np.array([1, 2, 3])              # from a Python list
np.zeros((3, 4))                    # a 3x4 array filled with zeros
np.ones((2, 2))                      # a 2x2 matrix filled with ones
np.arange(0, 10, 2)                   # [0, 2, 4, 6, 8] -> NumPy equivalent of range()
np.linspace(0, 1, 5)                   # [0, 0.25, 0.5, 0.75, 1.0] -> 5 evenly spaced values
np.random.rand(3, 3)                    # 3x3 table of random values between 0 and 1
```

## `shape` and `dtype`

```python
array = np.array([[1, 2, 3], [4, 5, 6]])

array.shape   # (2, 3) -> 2 rows, 3 columns
array.dtype    # dtype('int64') -> ALL elements share this same type
array.ndim      # 2 -> number of dimensions
```

> **Note:** Unlike a Python list (which can contain mixed types), a `ndarray` requires all its elements to be of the **same type**—and that is precisely what enables contiguous storage and the resulting performance optimizations.

## Indexing and Slicing

```python
array = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])

array[0]        # [1, 2, 3] -> first line
array[0, 2]      # 3 -> row 0, column 2
array[:, 1]       # [2, 5, 8] -> the entire column at index 1
array[0:2, 0:2]    # subtable: the first 2 rows and columns
```

## *Broadcasting*: Working with Tables of Different Sizes

NumPy automatically "extends" a smaller array to match a larger one, without actually duplicating the data in memory:

```python
array = np.array([[1, 2, 3], [4, 5, 6]])
vecteur = np.array([10, 20, 30])

array + vecteur
# [[11, 22, 33],
# [14, 25, 36]]  -> "vector" is applied to EVERY row of "array"
```

Compatibility rule: Two dimensions are compatible if they are equal, or if one of them is equal to `1` (the dimension is virtually "stretched" to match the other).

## Common Vectorized Operations

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

a + b        # [5, 7, 9] -> element-by-element addition
a * b        # [4, 10, 18] -> element-by-element multiplication (NOT a matrix product)
a @ b        # 32 -> scalar product (1*4 + 2*5 + 3*6)
np.dot(a, b)  # 32 -> explicit equivalent of "@"

a.sum()       # 6
a.mean()      # 2.0
a.max()        # 3
```

> **Note:** `*` between two NumPy arrays performs an element-wise multiplication—for a true matrix product (as defined in linear algebra, which is widely used in deep learning; see the chapter on neural networks), the operator is `@` (or `np.matmul()`), never `*`.

See also the chapter on pandas, which builds its `DataFrame` directly on top of NumPy `ndarray`.
