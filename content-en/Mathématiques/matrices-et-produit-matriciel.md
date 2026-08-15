---
order: 3
---

# Matrices and Matrix Multiplication

A [vector](/?c=mathematiques&p=vecteurs-et-produit-scalaire) packs several numbers into a single list. A **matrix** goes one step further: it packs numbers into a **two-dimensional array** (rows and columns), exactly like a spreadsheet. It's the tool that lets you compute on *several* vectors at once, in a single shot, rather than one at a time, and it's very concretely what makes a neural network run.

## What is a matrix?

A matrix is an array of numbers organized into rows and columns. Its dimensions are written **rows × columns**:

```text
         column 1   column 2   column 3
row 1        1          2          3
row 2        4          5          6
```

This matrix has 2 rows and 3 columns: it's said to be of dimension **2×3**. An element is located by its `(row, column)` position: the element at position (2, 3) is 6.

> **Analogy:** a spreadsheet without the formulas: just cells organized into rows and columns, each holding a number.

> **Pitfall:** this `(2, 3)` numbering counts from 1, as in mathematics. In NumPy (see the [NumPy](/?c=data-science&p=numpy) chapter) and in most programming languages, indexing starts at 0: this same element would be obtained in code with `matrix[1, 2]`, not `matrix[2, 3]`.

A vector is therefore nothing more than a special case of matrix: a single column (dimension *n*×1) or a single row (1×*n*). Everything already seen about [vectors](/?c=mathematiques&p=vecteurs-et-produit-scalaire) (addition, the dot product) generalizes directly to matrices.

## Addition and multiplication by a number

As with vectors, these two operations happen term by term, position by position:

```text
[1, 2]     [5, 6]     [1+5, 2+6]     [6,  8]
[3, 4]  +  [7, 8]  =  [3+7, 4+8]  =  [10, 12]

[1, 2]           [1×3, 2×3]        [3, 6]
[3, 4]  × 3  =    [3×3, 4×3]   =    [9, 12]
```

> **Pitfall:** adding two matrices of different dimensions makes no sense: as with vectors, each position must have an exact match in the other matrix.
>
> **Best practice:** check that two matrices have exactly the same dimensions before adding them.

## The matrix-vector product: several neurons, a single computation

Here's the operation that really matters. Recall from the chapter on [neural networks](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones): a neuron computes a weighted sum of its inputs, in other words a [dot product](/?c=mathematiques&p=vecteurs-et-produit-scalaire) between the input vector and its own weight vector. A layer contains *several* neurons, each with its own weight vector; arranged as rows, these weight vectors form a matrix:

```text
Weights of 2 neurons, for 2 inputs each:

W = [ 0.5  -0.3 ]   <- weights of neuron 1
    [ 0.2   0.4 ]   <- weights of neuron 2

Input:  x = [1.0]
            [2.0]
```

The **matrix-vector product** `W · x` computes the dot product of **each row** of `W` with `x`, and stores each result in a new column:

```text
W · x = [ 0.5×1.0 + (-0.3)×2.0 ]  =  [ -0.1 ]
        [ 0.2×1.0 +   0.4×2.0 ]      [  1.0 ]
```

Compare with the neuron-by-neuron computation from the chapter on neural networks: `weights_n1 · inputs = 0.5×1.0 + (-0.3)×2.0` and `weights_n2 · inputs = 0.2×1.0 + 0.4×2.0`. These are exactly the same two dot products, obtained here **in a single operation** rather than a computation repeated per neuron. That's the whole point: a layer of 500 neurons doesn't require 500 dot products written out one by one, just a single matrix-vector product, `W · x`.

> **Pitfall:** multiplying a matrix by a vector whose size doesn't match the matrix's number of columns: `W` above (2×2) can only multiply a 2-element vector. Computing libraries raise an explicit error in this case rather than guessing.
>
> **Best practice:** check that the matrix's number of columns exactly matches the vector's size, before any multiplication.

## The matrix-matrix product: handling several examples at once (the *batch*)

A single input at a time remains inefficient at the scale of training a model. In practice, several examples (a **batch**, see [Model Training](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) are stacked as rows in a matrix `X`, and a single matrix product computes the output of all the examples at once:

```text
X (2 examples, 2 inputs each):   [ 1.0  2.0 ]
                                 [ 0.5  1.5 ]

W (2 neurons, transposed for the occasion):   [ 0.5   0.2 ]
                                              [-0.3   0.4 ]

X · W = [ 1.0×0.5+2.0×(-0.3)   1.0×0.2+2.0×0.4 ]   [ -0.1   1.0 ]
        [ 0.5×0.5+1.5×(-0.3)   0.5×0.2+1.5×0.4 ] = [ -0.2   0.7 ]
```

Each row of the result corresponds to an example, each column to a neuron: the two outputs of the first example ((-0.1, 1.0)) land exactly on the result computed above with `W · x`, obtained here at the same time as those of the second example.

**The dimension rule:** multiplying a matrix (*m*×*n*) by a matrix (*n*×*p*) gives a matrix (*m*×*p*); the number of columns of the first must always equal the number of rows of the second:

```text
(m × n)  ·  (n × p)  =  (m × p)
      \_______/
    must be equal
```

> **Pitfall:** a matrix product is **not commutative**: `A · B` and `B · A` generally don't give the same result, and either one may not even be defined at all if the dimensions don't allow it (unlike adding numbers, where order never matters).
>
> **Best practice:** always check the order of matrices in a product: `A · B` and `B · A` are two different computations, never interchangeable by default.

## How a matrix product result is computed

The general rule, of which the two previous sections are only special cases: the element at position (row *i*, column *j*) of the result is the [dot product](/?c=mathematiques&p=vecteurs-et-produit-scalaire) of row *i* of the first matrix and column *j* of the second. Nothing new mathematically: it's the same operation as for a vector, repeated once per cell of the result.

## Matrix product vs. term-by-term product: don't mix them up

Two distinct operations carry similar names and are easily confused:

| Operation | Name | Computation | Dimensions |
|---|---|---|---|
| `A · B` | Matrix product | Row × column dot product (see above) | (*m*×*n*) · (*n*×*p*) = (*m*×*p*) |
| `A ⊙ B` | Term-by-term product ([*Hadamard*](https://en.wikipedia.org/wiki/Hadamard_product_(matrices))) | Each cell of `A` multiplied by the matching cell of `B` | `A` and `B` must have exactly the same dimensions |

> **Pitfall:** in NumPy (see the [NumPy](/?c=data-science&p=numpy) chapter), `A * B` computes the **term-by-term** product, not the matrix product: it's `A @ B` (or `np.dot(A, B)`) that must be used for a true matrix product. Using `*` out of habit where `@` was intended doesn't always cause an error (if the dimensions happen to coincide), which makes this pitfall particularly hard to spot.
>
> **Best practice:** systematically check which of the two products a computing library applies to a given operator, rather than assuming `*` always means the same operation from one language or library to another.

## The transpose: swapping rows and columns

The **transpose** of a matrix (written `Aᵀ`) swaps its rows and columns:

```text
     [ 1  2  3 ]                [ 1  4 ]
A =  [ 4  5  6 ]      Aᵀ =      [ 2  5 ]
                                 [ 3  6 ]
```

A 2×3 matrix becomes a 3×2 matrix. The transpose is most often used to reorient a matrix so its dimensions match those expected by a matrix product: that's exactly why `W` was transposed in the batch example above, so its columns (one per neuron) line up with the columns of `X`.

## The cost of the computation: why hardware matters so much

Computing `A · B` for two *n*×*n* matrices requires, with the naive method, *n*³ multiplications; a cost that grows **much** faster than the size of the matrices:

```python
# Naive version: three nested loops
def matrix_product(A, B, n):
    result = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                result[i][j] += A[i][k] * B[k][j]
    return result
```

Doubling a matrix's size doesn't double the computation time: it's multiplied by 8 (2³). This is exactly why a model's size (the number of neurons per layer, a batch's size) has a hardware cost that grows very fast, and why the [GPU](/?c=infrastructure&p=cpu-vs-gpu) and [SIMD vectorization](/?c=performance&p=cache-cpu-et-simd) exist: the matrix product is precisely the kind of computation (repetitive, identical, on independent data) a GPU accelerates best, which explains why training a deep learning model is almost always done on GPU rather than CPU.

> **Pitfall:** writing your own matrix product loop (like above) in real code. A naive implementation ignores everything covered in [CPU Cache and Vectorization](/?c=performance&p=cache-cpu-et-simd) (memory locality, SIMD): a library like NumPy can be tens to hundreds of times faster on the same computation, for a strictly identical result.
>
> **Best practice:** always delegate a matrix product to an optimized library (NumPy, [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)...) rather than writing the loop yourself. See also the [NumPy](/?c=data-science&p=numpy) chapter.

## Where matrices concretely show up in AI

| Element | What it represents | Related chapter |
|---|---|---|
| A layer's weights | A matrix, one row per neuron | [Neural Networks](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones) |
| A batch of inputs | A matrix, one row per example | [Training and Gradient Descent](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) |
| An embedding table | A matrix, one row per word in the vocabulary | [NLP and LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) |
| A Transformer's attention | Matrix products between query/key/value matrices | [Architectures: CNNs, RNNs, and Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) |

In all four cases, the underlying principle stays the one seen in this chapter: replacing a series of repeated computations with a single matrix product, so the hardware (GPU, SIMD) can run them in parallel rather than one at a time.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A matrix arranges numbers into rows and columns; a vector is a special case of it. The matrix product computes several dot products in a single operation (several neurons, or several examples in a batch): it's this operation, repeated at very large scale, that runs deep learning. |
| **Available Tools** | `@` or `np.dot()` in NumPy for a true matrix product (never `*`, which multiplies term by term); the transpose to reorient a matrix before a product. |
| **Pitfalls to Avoid** | Multiplying two matrices whose inner dimensions don't match. Confusing the matrix product with the term-by-term product. Assuming `A · B` and `B · A` give the same result. Writing your own matrix product loop in real code. |
| **Best Practices** | Check dimensions before any matrix product. Always check which operator a library uses for which product. Delegate all matrix computation to an optimized library (NumPy, [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)) rather than reimplementing it. |
