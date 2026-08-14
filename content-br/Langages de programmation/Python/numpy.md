---
order: 14
---

# NumPy — o cálculo numérico

**O NumPy** (*Numerical Python*) fornece o tipo «`ndarray`»: uma matriz multidimensional de valores **de um único tipo**, armazenados de forma contígua na memória — exatamente como uma matriz em C (ver capítulo sobre ponteiros e memória em C), em vez de como uma lista em Python (onde cada elemento é uma referência separada a um objeto). É o alicerce sobre o qual assentam o pandas, o scikit-learn e praticamente todo o ecossistema de ciência de dados em Python.

## Porque não simplesmente listas em Python?

```python
import numpy as np

lista = [1, 2, 3, 4, 5]
matriz = np.array([1, 2, 3, 4, 5])

# Multiplicar cada elemento por 2:
[x * 2 for x in lista]     # requer um ciclo em Python, elemento a elemento
matriz * 2                  # «* 2» aplica-se diretamente a TODO o tabuládo -> [2, 4, 6, 8, 10]
```

> **Nota:** uma lista Python armazena **ponteiros** para objetos `int` potencialmente dispersos na memória (ver capítulo sobre ponteiros, secção C); um `ndarray` armazena os **valores brutos** uns a seguir aos outros, tal como um array C. As operações do NumPy são executadas por código C compilado internamente, nesta memória contígua — muitas vezes 10 a 100 vezes mais rápido do que um ciclo Python equivalente, além de utilizar muito menos memória.

## Criar tabelas

```python
np.array([1, 2, 3])              # a partir de uma lista em Python
np.zeros((3, 4))                    # matriz 3x4 preenchida com zeros
np.ones((2, 2))                      # tabela 2x2 preenchida com uns
np.arange(0, 10, 2)                   # [0, 2, 4, 6, 8] -> equivalente a range() no NumPy
np.linspace(0, 1, 5)                   # [0, 0,25, 0,5, 0,75, 1,0] -> 5 valores espaçados uniformemente
np.random.rand(3, 3)                    # tabela 3x3 de valores aleatórios entre 0 e 1
```

## `shape` e `dtype`

```python
matriz = np.array([[1, 2, 3], [4, 5, 6]])

matriz.shape   # (2, 3) -> 2 linhas, 3 colunas
matriz.dtype    # dtype('int64') -> TODOS os elementos partilham este mesmo tipo
matriz.ndim      # 2 -> número de dimensões
```

> **Nota:** ao contrário de uma lista Python (que permite tipos mistos), um «`ndarray`» impõe um **único tipo** para todos os seus elementos — é precisamente isso que permite o armazenamento contíguo e as otimizações de desempenho daí decorrentes.

## Indexação e divisão em partes

```python
matriz = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])

matriz[0]        # [1, 2, 3] -> primeira linha
matriz[0, 2]      # 3 -> linha 0, coluna 2
matriz[:, 1]       # [2, 5, 8] -> toda a coluna com índice 1
matriz[0:2, 0:2]    # subtabela: as duas primeiras linhas e colunas
```

## *Broadcasting*: operar em tabelas de diferentes tamanhos

O NumPy «expande» automaticamente uma matriz mais pequena para que corresponda a uma maior, sem duplicar efetivamente os dados na memória:

```python
matriz = np.array([[1, 2, 3], [4, 5, 6]])
vecteur = np.array([10, 20, 30])

matriz + vecteur
# [[11, 22, 33],
# [14, 25, 36]]  -> «vetor» é aplicado a CADA linha da «matriz»
```

Regra de compatibilidade: duas dimensões são compatíveis se forem iguais ou se uma delas for igual a `1` (dimensão «esticada» virtualmente para corresponder à outra).

## Operações vetorizadas comuns

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

a + b        # [5, 7, 9] -> soma elemento a elemento
a * b        # [4, 10, 18] -> multiplicação elemento a elemento (NÃO é um produto matricial)
a @ b        # 32 -> produto escalar (1*4 + 2*5 + 3*6)
np.dot(a, b)  # 32 -> equivalente explícito de «@»

a.sum()       # 6
a.mean()      # 2.0
a.max()        # 3
```

> **Nota:** `*` entre duas matrizes NumPy multiplica elemento a elemento — para um verdadeiro produto matricial (no sentido da álgebra linear, amplamente utilizado no deep learning, ver capítulo sobre redes neurais), o operador é `@` (ou `np.matmul()`), nunca `*`.

Ver também o capítulo sobre o pandas, que constrói as suas «`DataFrame`» diretamente com base nas «`ndarray`» do NumPy.
