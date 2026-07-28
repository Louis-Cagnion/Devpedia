---
title: Itérateurs et générateurs
---

Une boucle `for` fonctionne sur les listes, les dictionnaires, les fichiers, et bien d'autres objets — parce qu'ils implémentent tous le même **protocole d'itération**. Comprendre ce protocole permet de créer ses propres objets "parcourables", et d'utiliser les générateurs pour traiter de grandes quantités de données sans tout charger en mémoire.

## Le protocole d'itération

`for element in objet:` fonctionne en réalité ainsi, en coulisses :

```python
iterateur = iter(objet)       # appelle objet.__iter__()
while True:
    try:
        element = next(iterateur)  # appelle iterateur.__next__()
    except StopIteration:
        break
    # ... corps de la boucle avec "element" ...
```

Un objet est **itérable** s'il implémente `__iter__()` (renvoie un itérateur). Un **itérateur** implémente `__next__()` (renvoie l'élément suivant, ou lève `StopIteration` quand il n'y en a plus).

## Créer un itérateur personnalisé

```python
class Compteur:
    def __init__(self, limite):
        self.limite = limite
        self.actuel = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.actuel >= self.limite:
            raise StopIteration
        self.actuel += 1
        return self.actuel

for nombre in Compteur(5):
    print(nombre)   # 1 2 3 4 5
```

## Les générateurs : une façon plus simple d'écrire un itérateur

Une fonction contenant `yield` devient automatiquement un **générateur** : Python implémente pour elle tout le protocole `__iter__`/`__next__` vu ci-dessus, sans qu'il soit nécessaire d'écrire une classe.

```python
def compteur(limite):
    actuel = 0
    while actuel < limite:
        actuel += 1
        yield actuel

for nombre in compteur(5):
    print(nombre)   # 1 2 3 4 5
```

`yield` "met en pause" la fonction et renvoie une valeur, **sans perdre son état** — au prochain appel de `next()`, l'exécution reprend juste après le `yield`, avec toutes les variables locales intactes.

## Pourquoi utiliser un générateur plutôt qu'une liste

```python
def carres_liste(n):
    return [x ** 2 for x in range(n)]   # calcule et stocke TOUT en mémoire, d'un coup

def carres_generateur(n):
    for x in range(n):
        yield x ** 2                     # calcule UN SEUL élément à la fois, à la demande
```

Pour `n = 10_000_000`, `carres_liste()` alloue une liste de 10 millions d'éléments en mémoire **avant** de commencer à les utiliser. `carres_generateur()` ne produit qu'un élément à la fois, consommé puis oublié — la mémoire utilisée reste constante, quelle que soit la taille de `n`.

> **Note :** cette "évaluation paresseuse" (*lazy evaluation*) a un coût : un générateur ne peut être parcouru **qu'une seule fois** (une fois épuisé, une nouvelle boucle `for` dessus ne produit plus rien), contrairement à une liste qu'on peut reparcourir librement.

## Expression génératrice

Équivalent d'une compréhension de liste, mais paresseuse — remplacer les crochets par des parenthèses :

```python
carres = (x ** 2 for x in range(10))   # générateur, rien n'est encore calculé
liste_carres = [x ** 2 for x in range(10)]  # liste, tout est calculé immédiatement

sum(x ** 2 for x in range(1000000))    # calcule la somme SANS jamais stocker les 1M de valeurs
```

Voir aussi le chapitre sur les fonctions (closures) et sur NumPy/pandas, où la distinction mémoire immédiate vs paresseuse redevient centrale à grande échelle.
