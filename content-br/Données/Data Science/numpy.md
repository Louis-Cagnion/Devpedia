---
order: 2
---

# NumPy: o cálculo numérico

O **NumPy** (*Numerical Python*) fornece o tipo `ndarray`: um array multidimensional de valores **de um único tipo**, armazenados de forma contígua na memória, exatamente como um array em C (veja [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs) e [A memória](/?c=langages-de-programmation&s=c&p=memoire) em C), em vez de como uma lista Python (onde cada elemento é uma referência separada para um objeto). É a peça básica sobre a qual se apoiam pandas, scikit-learn e quase todo o ecossistema de data science em Python.

## Por que não simplesmente listas Python?

```python
import numpy as np

lista = [1, 2, 3, 4, 5]
matriz = np.array([1, 2, 3, 4, 5])

# multiplicar cada elemento por 2:
[x * 2 for x in lista]  # exige um loop Python, elemento por elemento
matriz * 2               # "* 2" se aplica diretamente a TODO o array -> [2, 4, 6, 8, 10]
```

> **Nota:** uma lista Python armazena **ponteiros** para objetos `int` potencialmente dispersos na memória (veja [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs) em C); um `ndarray` armazena os **valores brutos** um após o outro, como um array em C. As operações do NumPy são executadas por código C compilado internamente, sobre essa memória contígua, geralmente 10 a 100 vezes mais rápido que um loop Python equivalente, além de usar bem menos memória.

## Criar arrays

```python
np.array([1, 2, 3])   # a partir de uma lista Python
np.zeros((3, 4))      # array 3x4 preenchido com zeros
np.ones((2, 2))       # array 2x2 preenchido com uns
np.arange(0, 10, 2)   # [0, 2, 4, 6, 8] -> equivalente NumPy de range()
np.linspace(0, 1, 5)  # [0, 0.25, 0.5, 0.75, 1.0] -> 5 valores igualmente espaçados
np.random.rand(3, 3)  # array 3x3 de valores aleatórios entre 0 e 1
```

## `shape` e `dtype`

```python
matriz = np.array([[1, 2, 3], [4, 5, 6]])

matriz.shape  # (2, 3) -> 2 linhas, 3 colunas
matriz.dtype  # dtype('int64') -> TODOS os elementos compartilham esse mesmo tipo
matriz.ndim   # 2 -> número de dimensões
```

> **Nota:** diferente de uma lista Python (tipos mistos possíveis), um `ndarray` impõe um **único tipo** para todos os seus elementos: é justamente isso que permite o armazenamento contíguo e as otimizações de performance que derivam dele.

## Indexação e slicing

```python
matriz = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])

matriz[0]         # [1, 2, 3] -> primeira linha
matriz[0, 2]      # 3 -> linha 0, coluna 2
matriz[:, 1]      # [2, 5, 8] -> toda a coluna de índice 1
matriz[0:2, 0:2]  # sub-array: as 2 primeiras linhas e colunas
```

## O *broadcasting*: operar em arrays de tamanhos diferentes

O NumPy "estende" automaticamente um array menor para que corresponda a um maior, sem realmente duplicar os dados na memória:

```python
matriz = np.array([[1, 2, 3], [4, 5, 6]])
vetor = np.array([10, 20, 30])

matriz + vetor
# [[11, 22, 33],
#  [14, 25, 36]]  -> "vetor" é aplicado a CADA linha de "matriz"
```

Regra de compatibilidade: duas dimensões são compatíveis se forem iguais, ou se uma das duas valer `1` (dimensão "esticada" virtualmente para corresponder à outra).

## Operações vetorizadas comuns

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

a + b         # [5, 7, 9] -> soma elemento por elemento
a * b         # [4, 10, 18] -> multiplicação elemento por elemento (NÃO um produto matricial)
a @ b         # 32 -> produto escalar (1*4 + 2*5 + 3*6)
np.dot(a, b)  # 32 -> equivalente explícito de "@"

a.sum()   # 6
a.mean()  # 2.0
a.max()   # 3
```

> **Nota:** `*` entre dois arrays NumPy multiplica elemento por elemento: para um verdadeiro produto matricial (no sentido da álgebra linear, usado massivamente em deep learning, veja [As redes neurais](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)), o operador é `@` (ou `np.matmul()`), nunca `*`.

Veja também o capítulo sobre [pandas](/?c=data-science&p=pandas), que constrói seus `DataFrame` diretamente sobre os `ndarray` do NumPy.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um `ndarray` do NumPy armazena valores brutos contíguos de um único tipo, diferente de uma lista Python (ponteiros para objetos dispersos); as operações vetorizadas são executadas por código C compilado, muito mais rápido que um loop Python. |
| **Ferramentas úteis** | `np.array`/`zeros`/`ones`/`arange`/`linspace`, indexação/slicing multidimensional, broadcasting. |
| **Armadilhas a evitar** | Usar `*` pensando obter um produto matricial: é uma multiplicação elemento por elemento; o produto matricial é `@`. |
| **Boas práticas** | Preferir uma operação vetorizada a um loop Python explícito em um `ndarray`, para aproveitar o ganho de performance. |
