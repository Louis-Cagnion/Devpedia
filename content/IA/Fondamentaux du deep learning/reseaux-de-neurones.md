---
order: 1
---

# Les réseaux de neurones : les fondamentaux

Le **machine learning** consiste à faire apprendre à un programme un comportement à partir de données, plutôt que de lui dicter chaque règle explicitement (voir [Introduction au machine learning](/?c=data-science&p=machine-learning-scikit-learn) pour aller plus loin). Un **réseau de neurones artificiels** est une famille de modèles de machine learning : une [fonction mathématique](/?c=mathematiques&p=la-fonction-mathematique), composée de nombreuses unités de calcul simples ("neurones") organisées en couches, dont les paramètres s'ajustent automatiquement à partir de données plutôt que d'être écrits à la main.

## Le neurone artificiel

Un neurone reçoit plusieurs entrées, calcule une **somme pondérée** (voir le [produit scalaire](/?c=mathematiques&p=vecteurs-et-produit-scalaire) : c'est exactement ce calcul, entre le vecteur des entrées et le vecteur des poids), y ajoute un **biais**, puis applique une **fonction d'activation** :

```text
sortie = activation(w1*x1 + w2*x2 + w3*x3 + ... + biais)
```

```python
def neurone(entrees, poids, biais, activation):
    somme_ponderee = sum(e * p for e, p in zip(entrees, poids)) + biais
    return activation(somme_ponderee)
```

- Les **poids** (`w1`, `w2`...) déterminent l'importance de chaque entrée : ce sont eux, avec le biais, que l'entraînement va ajuster (voir [L'entraînement d'un modèle et la descente de gradient](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)).
- Le **biais** permet à la sortie d'être décalée même quand toutes les entrées valent zéro (comme l'ordonnée à l'origine d'une droite).

> **Piège :** omettre le biais. Sans lui, la sortie d'un neurone vaut toujours zéro dès que toutes les entrées valent zéro, quels que soient les poids : le neurone ne peut jamais décaler sa réponse indépendamment de ses entrées, ce qui limite fortement ce qu'il peut apprendre à représenter.
>
> **Bonne pratique :** inclure systématiquement un biais dans un neurone, sauf raison précise de vouloir forcer une sortie nulle à entrées nulles.

## Pourquoi une fonction d'activation est indispensable

Sans fonction d'activation (ou avec une fonction linéaire), empiler plusieurs couches de neurones reviendrait mathématiquement à... une seule opération linéaire : la composition de plusieurs fonctions linéaires reste linéaire, quel que soit le nombre de couches empilées. La fonction d'activation introduit une **non-linéarité**, indispensable pour que le réseau puisse apprendre des motifs complexes (une frontière de décision courbe, par exemple, plutôt qu'une simple droite).

| Fonction d'activation | Formule (simplifiée) | Usage typique |
|---|---|---|
| **Sigmoïde** | Écrase toute valeur entre 0 et 1 | Sortie d'une classification binaire (une [probabilité](/?c=mathematiques&p=les-probabilites-de-base)) |
| **Tanh** | Écrase toute valeur entre -1 et 1, centrée sur 0 | Couches cachées de réseaux plus anciens (RNN notamment) ; converge souvent mieux que sigmoïde grâce à ce centrage |
| **ReLU** (*Rectified Linear Unit*) | `max(0, x)` : laisse passer les valeurs positives, écrase les négatives à 0 | Couches cachées, très utilisée en pratique (simple et efficace à calculer) |
| **Leaky ReLU** | `x` si positif, `0.01 * x` sinon (au lieu d'écraser à 0) | Couches cachées, comme ReLU, quand le "neurone mort" (voir plus bas) pose problème |
| **GELU** | Variante lissée de ReLU, pondérée par la distribution normale | Couches cachées des [Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) modernes |
| **Softmax** | Transforme un vecteur de scores en une [distribution de probabilité](/?c=mathematiques&p=les-probabilites-de-base) qui somme à 1 | Sortie d'une classification à plusieurs catégories |

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))

def relu(x):
    return max(0, x)
```

> **Piège :** utiliser sigmoïde en sortie d'une classification à **plusieurs** catégories (plus de deux). Sigmoïde produit une probabilité indépendante par catégorie, sans garantie que leur somme fasse 1 : softmax est construite précisément pour produire une distribution de probabilité valide sur plusieurs catégories à la fois (voir la [somme à 1 d'une distribution](/?c=mathematiques&p=les-probabilites-de-base)).
>
> **Bonne pratique :** choisir la fonction d'activation de sortie selon le nombre de catégories à distinguer : sigmoïde pour un choix binaire, softmax dès que plus de deux catégories s'excluent mutuellement.

> **Piège : le "neurone mort" (*dying ReLU*).** Si l'entrée pondérée d'un neurone ReLU reste négative sur tous les exemples d'entraînement, sa sortie vaut toujours 0, et son gradient (voir [la dérivée et le gradient](/?c=mathematiques&p=la-derivee-et-le-gradient)) aussi : ce neurone cesse alors d'apprendre définitivement, sans qu'aucune erreur ne le signale.
>
> **Bonne pratique :** remplacer ReLU par Leaky ReLU (ou une variante proche) dans les couches où ce problème est observé : la petite pente conservée côté négatif laisse toujours passer un gradient non nul, qui permet au neurone de se rattraper.

## Les couches d'un réseau

```text
Entrée -> [Couche cachée 1] -> [Couche cachée 2] -> ... -> Sortie
```

- **Couche d'entrée** : reçoit les données brutes (les pixels d'une image, les mots d'une phrase encodés en nombres...).
- **Couches cachées** : chacune transforme la représentation reçue de la couche précédente : plus il y a de couches ("*deep* learning"), plus le réseau peut représenter des motifs abstraits et complexes.
- **Couche de sortie** : produit le résultat final (une probabilité, une catégorie, une valeur numérique...).

> **Piège :** ajouter des couches sans disposer d'assez de données pour les entraîner correctement. Un réseau trop profond par rapport à la quantité de données disponible mémorise les exemples d'entraînement au lieu d'apprendre un motif général (voir le surapprentissage dans [Introduction au machine learning](/?c=data-science&p=machine-learning-scikit-learn)).
>
> **Bonne pratique :** ajuster la profondeur du réseau à la quantité de données réellement disponible, plutôt que d'empiler des couches en espérant un gain automatique.

## Un passage en avant (*forward pass*), pas à pas

Pour un réseau minimal à une seule couche cachée de 2 neurones, et une entrée `[1.0, 2.0]` :

```python
entrees = [1.0, 2.0]

# Neurone 1 de la couche cachée
poids_n1 = [0.5, -0.3]
biais_n1 = 0.1
sortie_n1 = relu(1.0 * 0.5 + 2.0 * -0.3 + 0.1)   # relu(0.0) = 0

# Neurone 2 de la couche cachée
poids_n2 = [0.2, 0.4]
biais_n2 = 0.0
sortie_n2 = relu(1.0 * 0.2 + 2.0 * 0.4 + 0.0)     # relu(1.0) = 1.0

# Couche de sortie (1 neurone, à partir des 2 sorties précédentes)
poids_sortie = [0.6, 0.9]
biais_sortie = 0.05
resultat = sigmoide(sortie_n1 * 0.6 + sortie_n2 * 0.9 + 0.05)  # sigmoide(0.95) ≈ 0.72
```

Ce calcul (multiplier, sommer, appliquer une activation, couche après couche) est **tout** ce qu'un réseau de neurones fait pour produire une prédiction. Ce qui rend le réseau "intelligent" n'est jamais ce mécanisme (fixe, purement arithmétique), mais les **valeurs des poids et des biais**, ajustées automatiquement par l'entraînement (voir [L'entraînement d'un modèle et la descente de gradient](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) à partir d'un grand nombre d'exemples.

En pratique, un framework de deep learning ne calcule jamais neurone par neurone comme dans le code ci-dessus : les poids d'une couche entière sont rangés dans une [matrice](/?c=mathematiques&p=matrices-et-produit-matriciel), et un seul produit matriciel calcule la sortie de tous ses neurones à la fois, bien plus rapide qu'une boucle Python.

Dans cet exemple, les poids sont déjà fixés à des valeurs précises pour illustrer le calcul, au tout début d'un entraînement réel, ils partent au contraire de valeurs aléatoires.

> **Piège :** initialiser tous les poids d'une couche à la **même** valeur (souvent zéro). Tous les neurones de cette couche calculeraient alors exactement la même chose à chaque étape, et continueraient à apprendre de façon identique : le réseau perd la capacité de faire apprendre des rôles différents à ses neurones.
>
> **Bonne pratique :** initialiser les poids avec de petites valeurs aléatoires (voir [l'aléatoire et les générateurs](/?c=representation-des-donnees&p=aleatoire-et-generateurs)), différentes les unes des autres, pour que chaque neurone parte d'un point de départ distinct.

## Un réseau = une fonction approximatrice

Vu sous cet angle, un réseau de neurones n'est rien d'autre qu'une [fonction mathématique](/?c=mathematiques&p=la-fonction-mathematique) paramétrée (par ses poids et biais), suffisamment flexible pour approximer une relation complexe entre une entrée (une image, un texte...) et une sortie (une catégorie, une suite de mots...), à condition d'avoir suffisamment de données représentatives pour ajuster correctement ces paramètres.

> **Piège :** faire confiance à un réseau sur des entrées très différentes de celles vues à l'entraînement. Une fonction approximée à partir d'exemples ne reste fiable que dans le domaine couvert par ces exemples ; en dehors, sa sortie n'a aucune garantie de rester pertinente.
>
> **Bonne pratique :** vérifier que les données réellement soumises au modèle en usage restent représentatives des données d'entraînement, plutôt que de supposer que le modèle "généralise" indéfiniment au-delà.

Voir aussi [L'entraînement d'un modèle et la descente de gradient](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient) (comment ces poids sont concrètement ajustés) et [Architectures : CNN, RNN et Transformers](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) (des façons spécifiques d'organiser ces couches selon le type de données traité).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un neurone artificiel calcule une somme pondérée de ses entrées (un produit scalaire), ajoute un biais, puis applique une fonction d'activation non linéaire. Un réseau empile ces neurones en couches (entrée, cachées, sortie) ; ses poids et biais s'ajustent par l'entraînement. |
| **Outils utilisables** | Les fonctions d'activation courantes (sigmoïde, tanh, ReLU, Leaky ReLU, GELU, softmax) sont fournies directement par les bibliothèques de deep learning (voir [PyTorch](/?c=ia&s=fondamentaux-du-deep-learning&p=deep-learning-pytorch)). |
| **Pièges à éviter** | Omettre le biais. Utiliser sigmoïde pour une classification à plusieurs catégories. Un neurone ReLU qui "meurt" (gradient nul en permanence). Empiler des couches sans données suffisantes. Initialiser tous les poids à la même valeur. Faire confiance au modèle en dehors du domaine couvert par ses données d'entraînement. |
| **Bonnes pratiques** | Choisir l'activation de sortie selon le nombre de catégories (sigmoïde vs softmax). Passer à Leaky ReLU en cas de neurones morts. Ajuster la profondeur du réseau à la quantité de données disponible. Initialiser les poids avec de petites valeurs aléatoires distinctes. |
