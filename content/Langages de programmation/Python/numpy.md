---
title: NumPy — le calcul numérique en Python
---

**NumPy** (*Numerical Python*) fournit le type `ndarray` : un tableau multidimensionnel de valeurs **d'un seul type**, stockées de façon contiguë en mémoire — exactement comme un tableau C (cf. chapitre sur les pointeurs et la mémoire en C), plutôt que comme une liste Python (où chaque élément est une référence séparée vers un objet). C'est la brique de base sur laquelle reposent pandas, scikit-learn et la quasi-totalité de l'écosystème data science Python.

## Pourquoi pas simplement des listes Python ?

```python
import numpy as np

liste = [1, 2, 3, 4, 5]
tableau = np.array([1, 2, 3, 4, 5])

# multiplier chaque élément par 2 :
[x * 2 for x in liste]     # nécessite une boucle Python, élément par élément
tableau * 2                  # "* 2" s'applique directement à TOUT le tableau -> [2, 4, 6, 8, 10]
```

> **Note :** une liste Python stocke des **pointeurs** vers des objets `int` potentiellement dispersés en mémoire (cf. chapitre sur les pointeurs, rubrique C) ; un `ndarray` stocke les **valeurs brutes** les unes à la suite des autres, comme un tableau C. Les opérations NumPy sont exécutées par du code C compilé en interne, sur cette mémoire contiguë — souvent 10 à 100 fois plus rapide qu'une boucle Python équivalente, en plus d'utiliser bien moins de mémoire.

## Créer des tableaux

```python
np.array([1, 2, 3])              # depuis une liste Python
np.zeros((3, 4))                    # tableau 3x4 rempli de zéros
np.ones((2, 2))                      # tableau 2x2 rempli de uns
np.arange(0, 10, 2)                   # [0, 2, 4, 6, 8] -> équivalent NumPy de range()
np.linspace(0, 1, 5)                   # [0, 0.25, 0.5, 0.75, 1.0] -> 5 valeurs régulièrement espacées
np.random.rand(3, 3)                    # tableau 3x3 de valeurs aléatoires entre 0 et 1
```

## `shape` et `dtype`

```python
tableau = np.array([[1, 2, 3], [4, 5, 6]])

tableau.shape   # (2, 3) -> 2 lignes, 3 colonnes
tableau.dtype    # dtype('int64') -> TOUS les éléments partagent ce même type
tableau.ndim      # 2 -> nombre de dimensions
```

> **Note :** contrairement à une liste Python (types mixtes possibles), un `ndarray` impose un **seul type** pour tous ses éléments — c'est justement ce qui permet le stockage contigu et les optimisations de performance qui en découlent.

## Indexation et slicing

```python
tableau = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])

tableau[0]        # [1, 2, 3] -> première ligne
tableau[0, 2]      # 3 -> ligne 0, colonne 2
tableau[:, 1]       # [2, 5, 8] -> toute la colonne d'index 1
tableau[0:2, 0:2]    # sous-tableau : les 2 premières lignes et colonnes
```

## Le *broadcasting* : opérer sur des tableaux de tailles différentes

NumPy "étend" automatiquement un tableau plus petit pour qu'il corresponde à un plus grand, sans dupliquer réellement les données en mémoire :

```python
tableau = np.array([[1, 2, 3], [4, 5, 6]])
vecteur = np.array([10, 20, 30])

tableau + vecteur
# [[11, 22, 33],
#  [14, 25, 36]]  -> "vecteur" est appliqué à CHAQUE ligne de "tableau"
```

Règle de compatibilité : deux dimensions sont compatibles si elles sont égales, ou si l'une des deux vaut `1` (dimension "étirée" virtuellement pour correspondre à l'autre).

## Opérations vectorisées courantes

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

a + b        # [5, 7, 9] -> addition élément par élément
a * b        # [4, 10, 18] -> multiplication élément par élément (PAS un produit matriciel)
a @ b        # 32 -> produit scalaire (1*4 + 2*5 + 3*6)
np.dot(a, b)  # 32 -> équivalent explicite de "@"

a.sum()       # 6
a.mean()      # 2.0
a.max()        # 3
```

> **Note :** `*` entre deux tableaux NumPy multiplie élément par élément — pour un vrai produit matriciel (au sens de l'algèbre linéaire, utilisé massivement en deep learning, cf. chapitre sur les réseaux de neurones), l'opérateur est `@` (ou `np.matmul()`), jamais `*`.

Voir aussi le chapitre sur pandas, qui construit ses `DataFrame` directement au-dessus des `ndarray` NumPy.
