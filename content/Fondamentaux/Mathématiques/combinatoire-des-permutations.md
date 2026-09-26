---
order: 8
---

# Compter les permutations : factorielle, coefficient binomial et nombres de Stirling

La **combinatoire** est l'art de **compter sans tout énumérer**. Elle sert en programmation à prévoir la taille d'un problème avant de le lancer : combien de cas un algorithme va-t-il examiner, combien de mémoire faudra-t-il réserver ? (voir [La complexité et la notation Big-O](/?c=fondamentaux&s=algorithmes&p=complexite-et-notation-big-o)).

Exemple fil rouge : une ligne du puzzle **Skyscraper**, qui contient des immeubles de hauteur 1 à n, chaque hauteur une seule fois ; un indice au bord dit combien d'immeubles on voit depuis ce côté, un immeuble cachant tous les plus petits situés derrière lui.

## La factorielle : le nombre d'ordres possibles

Une **permutation** est une façon de ranger n éléments distincts dans un ordre. Leur nombre est la **factorielle** de n, notée `n!` : n choix pour la première place, n − 1 pour la deuxième, et ainsi de suite.

```
n! = n × (n − 1) × ... × 2 × 1          exemple : 4! = 4 × 3 × 2 × 1 = 24
```

| n | n! |
|---|---|
| 4 | 24 |
| 10 | 3 628 800 |
| 11 | 39 916 800 |
| 13 | 6 227 020 800 |

La factorielle grandit encore plus vite qu'une exponentielle. Conséquence mesurée sur un solveur Skyscraper qui stockait, pour chaque ligne, toutes les permutations compatibles avec ses indices : en grille 12 × 12, la génération produisait déjà 660 millions de candidats (5,3 Go de mémoire) avant même de chercher.

## Le coefficient binomial : choisir k éléments parmi n

Le **coefficient binomial** `C(n, k)` compte les façons de choisir k éléments parmi n, sans tenir compte de l'ordre. Par exemple, choisir 2 garnitures parmi 4 : `C(4, 2) = 6`.

```
C(n, k) = n! / (k! × (n − k)!)
```

Calculer les trois factorielles dépasserait vite la capacité d'un entier (`21!` ne tient plus sur 64 bits). On calcule donc pas à pas, en multipliant puis en divisant :

```python
def binomial(n, k):
    r = 1
    for i in range(1, k + 1):
        r = r * (n - k + i) // i  # division toujours exacte : r × (n-k+i) est divisible par i
    return r

print(binomial(4, 2))    # 6
print(binomial(60, 30))  # 118264581564861424, sans jamais calculer 60!
```

La division tombe toujours juste parce qu'après l'étape i, `r` vaut `C(n − k + i, i)`, un nombre entier. Vérifié pour tous les `n` jusqu'à 60.

## Les records d'une permutation

Un **record** est un élément plus grand que tous ceux qui le précèdent, en lisant de gauche à droite. Dans le Skyscraper, les records sont exactement les immeubles **visibles** depuis la gauche :

```
permutation : 1  2  4  3
records     : 1  2  4        (3 est plus petit que 4, placé avant lui)  -> 3 records, 3 immeubles visibles
```

## Les nombres de Stirling de première espèce

Combien de permutations de n éléments ont exactement k records ? Ce nombre s'appelle le **nombre de Stirling de première espèce** (non signé), noté `c(n, k)`.

| n \ k | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| 1 | 1 | | | | |
| 2 | 1 | 1 | | | |
| 3 | 2 | 3 | 1 | | |
| 4 | 6 | 11 | 6 | 1 | |
| 5 | 24 | 50 | 35 | 10 | 1 |

Chaque ligne a pour somme `n!` (24 + 50 + 35 + 10 + 1 = 120 = 5!). La table se remplit ligne par ligne grâce à une **récurrence**, en regardant où se trouve le plus petit élément (le 1) :

| Position du 1 | Est-ce un record ? | Nombre de permutations |
|---|---|---|
| En première place | Oui (rien avant lui), et il ne cache rien puisqu'il est le plus petit : les n − 1 autres doivent fournir les k − 1 records restants | `c(n − 1, k − 1)` |
| À l'une des n − 1 autres places | Non (un plus grand le précède), et il ne cache toujours rien : les autres doivent fournir les k records | `(n − 1) × c(n − 1, k)` |

```python
def stirling1(n):
    """Table c[i][j] : nombre de permutations de i éléments ayant j records."""
    c = [[0] * (n + 1) for _ in range(n + 1)]
    c[0][0] = 1                                          # la permutation vide : 0 record
    for i in range(1, n + 1):
        for j in range(1, i + 1):
            c[i][j] = c[i - 1][j - 1] + (i - 1) * c[i - 1][j]
    return c

print(stirling1(5)[5])  # [0, 24, 50, 35, 10, 1]
```

## Voir des deux côtés à la fois

Une ligne de Skyscraper a souvent un indice à gauche (a immeubles visibles) **et** à droite (b visibles). Le plus grand immeuble, n, est visible des deux côtés. Le nombre de permutations qui respectent les deux indices vaut :

```
C(a + b − 2, a − 1) × c(n − 1, a + b − 2)
```

Exemple : n = 5, a = 2, b = 2 donne `C(2, 1) × c(4, 2) = 2 × 11 = 22`, ce que confirme l'énumération des 120 permutations. Formule vérifiée par énumération pour toutes les tailles jusqu'à 7.

Usage concret : connaître ce nombre **avant** de générer les candidats d'une ligne permet de réserver exactement la bonne quantité de mémoire en une seule fois, au lieu d'agrandir un tableau au fur et à mesure.

## Choisir un ordre de construction qui vérifie tôt

Pour générer les permutations qui respectent un indice, l'ordre dans lequel on place les valeurs compte :

| Ordre de placement | Quand sait-on si un immeuble est visible ? |
|---|---|
| Cases de gauche à droite | Visibilité depuis la gauche : tout de suite. Depuis la droite : seulement une fois la ligne complète. |
| Valeurs de la **plus grande à la plus petite** | Des deux côtés, dès qu'il est placé : tous les immeubles déjà placés sont plus grands que lui, donc il est visible depuis un côté si aucun d'eux ne se trouve de ce côté ; et les valeurs placées ensuite, plus petites, ne pourront jamais le cacher. |

Avec le second ordre, une permutation partielle qui dépasse déjà un indice (à gauche **ou** à droite) est abandonnée tout de suite, avec toutes ses suites. Mesuré sur le générateur du solveur Skyscraper : 5 à 6 fois plus rapide que le remplissage de gauche à droite.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `n!` compte les ordres de n éléments et explose très vite ; `C(n, k)` compte les choix de k parmi n ; `c(n, k)`, le nombre de Stirling de première espèce, compte les permutations à k records (k immeubles visibles). |
| **Outils utilisables** | Calcul incrémental du coefficient binomial ; récurrence `c(n, k) = c(n − 1, k − 1) + (n − 1) × c(n − 1, k)` ; formule à deux indices `C(a + b − 2, a − 1) × c(n − 1, a + b − 2)`. |
| **Pièges à éviter** | Calculer `C(n, k)` en passant par trois factorielles (dépassement de capacité) ; matérialiser toutes les permutations d'un problème sans avoir compté combien il y en a. |
| **Bonnes pratiques** | Compter avant de générer, pour estimer le coût et réserver la mémoire exacte ; choisir un ordre de construction qui rend les contraintes vérifiables le plus tôt possible ; vérifier une formule par énumération sur de petites tailles. |
