---
title: Les réseaux de neurones — les fondamentaux
---

Un **réseau de neurones artificiels** est un modèle de machine learning (cf. chapitre dédié) composé de nombreuses unités de calcul simples ("neurones"), organisées en couches, et connectées entre elles — une structure vaguement inspirée du fonctionnement biologique, mais qui reste avant tout un objet mathématique : une fonction complexe, dont les paramètres sont ajustés automatiquement à partir de données.

## Le neurone artificiel

Un neurone reçoit plusieurs entrées, calcule une **somme pondérée**, y ajoute un biais, puis applique une **fonction d'activation** :

```
sortie = activation(w1*x1 + w2*x2 + w3*x3 + ... + biais)
```

```python
def neurone(entrees, poids, biais, activation):
    somme_ponderee = sum(e * p for e, p in zip(entrees, poids)) + biais
    return activation(somme_ponderee)
```

- Les **poids** (`w1`, `w2`...) déterminent l'importance de chaque entrée — ce sont eux, avec le biais, que l'entraînement va ajuster (cf. chapitre sur la descente de gradient).
- Le **biais** permet à la sortie d'être décalée même quand toutes les entrées valent zéro (comme l'ordonnée à l'origine d'une droite).

## Pourquoi une fonction d'activation est indispensable

Sans fonction d'activation (ou avec une fonction linéaire), empiler plusieurs couches de neurones reviendrait mathématiquement à... une seule opération linéaire : la composition de plusieurs fonctions linéaires reste linéaire, quel que soit le nombre de couches empilées. La fonction d'activation introduit une **non-linéarité**, indispensable pour que le réseau puisse apprendre des motifs complexes (une frontière de décision courbe, par exemple, plutôt qu'une simple droite).

| Fonction d'activation | Formule (simplifiée) | Usage typique |
|---|---|---|
| **Sigmoïde** | Écrase toute valeur entre 0 et 1 | Sortie d'une classification binaire (probabilité) |
| **ReLU** (*Rectified Linear Unit*) | `max(0, x)` — laisse passer les valeurs positives, écrase les négatives à 0 | Couches cachées, très utilisée en pratique (simple et efficace à calculer) |
| **Softmax** | Transforme un vecteur de scores en probabilités qui somment à 1 | Sortie d'une classification à plusieurs catégories |

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)
```

## Les couches d'un réseau

```
Entrée -> [Couche cachée 1] -> [Couche cachée 2] -> ... -> Sortie
```

- **Couche d'entrée** : reçoit les données brutes (les pixels d'une image, les mots d'une phrase encodés en nombres...).
- **Couches cachées** : chacune transforme la représentation reçue de la couche précédente — plus il y a de couches ("*deep* learning"), plus le réseau peut représenter des motifs abstraits et complexes.
- **Couche de sortie** : produit le résultat final (une probabilité, une catégorie, une valeur numérique...).

## Un passage en avant (*forward pass*), pas à pas

Pour un réseau minimal à une seule couche cachée de 2 neurones, et une entrée `[1.0, 2.0]` :

```python
entrees = [1.0, 2.0]

# Neurone 1 de la couche cachée
poids_n1 = [0.5, -0.3]
biais_n1 = 0.1
sortie_n1 = relu(1.0 * 0.5 + 2.0 * -0.3 + 0.1)   # relu(-0.1) = 0

# Neurone 2 de la couche cachée
poids_n2 = [0.2, 0.4]
biais_n2 = 0.0
sortie_n2 = relu(1.0 * 0.2 + 2.0 * 0.4 + 0.0)     # relu(1.0) = 1.0

# Couche de sortie (1 neurone, à partir des 2 sorties précédentes)
poids_sortie = [0.6, 0.9]
biais_sortie = 0.05
resultat = sigmoide(sortie_n1 * 0.6 + sortie_n2 * 0.9 + 0.05)  # sigmoide(0.95) ≈ 0.72
```

Ce calcul — multiplier, sommer, appliquer une activation, couche après couche — est **tout** ce qu'un réseau de neurones fait pour produire une prédiction. Ce qui rend le réseau "intelligent" n'est jamais ce mécanisme (fixe, purement arithmétique), mais les **valeurs des poids et des biais**, ajustées automatiquement par l'entraînement (cf. chapitre sur la descente de gradient) à partir d'un grand nombre d'exemples.

## Un réseau = une fonction approximatrice

Vu sous cet angle, un réseau de neurones n'est rien d'autre qu'une fonction mathématique paramétrée (par ses poids et biais), suffisamment flexible pour approximer une relation complexe entre une entrée (une image, un texte...) et une sortie (une catégorie, une suite de mots...) — à condition d'avoir suffisamment de données représentatives pour ajuster correctement ces paramètres.

Voir aussi les chapitres sur la descente de gradient (comment ces poids sont concrètement ajustés) et sur les architectures CNN/RNN/Transformer (des façons spécifiques d'organiser ces couches selon le type de données traité).
