---
order: 10
---

# Les k plus proches voisins (k-NN)

Contrairement à la [régression linéaire](/?c=donnees&s=data-science&p=regression-lineaire), la [régression logistique](/?c=donnees&s=data-science&p=regression-logistique), les [arbres de décision](/?c=donnees&s=data-science&p=arbres-de-decision) ou les [SVM](/?c=donnees&s=data-science&p=svm), l'algorithme des **k plus proches voisins** (*k-Nearest Neighbors*, k-NN) n'apprend aucune formule, aucune frontière, aucune règle : à l'entraînement, il se contente de **mémoriser** toutes les données. Tout le travail se fait au moment de la prédiction.

## L'idée : demander l'avis des voisins les plus proches

Un service de streaming veut classer un nouveau film par genre, en se basant sur les films déjà catalogués. Pour un nouveau film, k-NN :

1. Calcule la **distance** entre ce film et chacun des films déjà connus (à partir de caractéristiques numériques : durée, budget, nombre de scènes d'action détectées...).
2. Retient les **k** films les plus proches (ex : k = 5).
3. Vote : la catégorie majoritaire parmi ces k voisins devient la prédiction.

```
    ○ ○
  ○   ○  ×?          × : nouveau film à classer
    ○   ●            k = 5 voisins les plus proches entourés
  ●   ○
```

Si 4 des 5 voisins les plus proches sont "science-fiction", le nouveau film est classé "science-fiction". Aucune ligne, aucune courbe, aucun arbre n'a été calculé : uniquement des distances et un vote.

## En code

```python
from sklearn.neighbors import KNeighborsClassifier

modele = KNeighborsClassifier(n_neighbors=5)   # k = 5
modele.fit(X_entrainement, y_entrainement)     # ne calcule rien : stocke simplement les données

modele.predict([[nouveau_film]])                # calcule les distances MAINTENANT, à la volée
```

## Le piège de performance : tout le travail arrive à la prédiction

Pour les algorithmes précédents, `fit()` fait tout le travail coûteux une seule fois, et `predict()` applique ensuite une formule déjà prête (rapide, même sur beaucoup de nouvelles données). Pour k-NN, c'est l'inverse : `fit()` est instantané (il stocke juste les données), mais chaque appel à `predict()` doit recalculer la distance entre le nouveau point et **tous** les exemples connus.

| Taille du catalogue | Temps par prédiction |
|---|---|
| 68 films | Instantané |
| 4 200 000 films | Nettement plus lent : chaque prédiction recompare le nouveau film aux 4,2 millions d'autres |

Ce compromis (aucun entraînement, mais une prédiction plus coûteuse à mesure que les données grandissent) donne à k-NN le nom d'algorithme "paresseux" (*lazy learning*), à l'opposé des algorithmes "eager" (SVM, arbres, régressions) qui investissent tout le coût de calcul dans `fit()`.

## Choisir k

| k | Effet |
|---|---|
| Trop petit (ex : 1) | Très sensible au bruit : un seul voisin atypique change la prédiction ([surapprentissage](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#surapprentissage-overfitting-et-sous-apprentissage-underfitting)) |
| Trop grand | Lisse trop la frontière entre catégories, jusqu'à ignorer les motifs locaux réels ([sous-apprentissage](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#surapprentissage-overfitting-et-sous-apprentissage-underfitting)) |
| Équilibré | Choisi par [validation croisée](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#la-validation-croisee-cross-validation) en testant plusieurs valeurs |

> **Piège :** comme le [SVM](/?c=donnees&s=data-science&p=svm#piege-les-entrees-non-mises-a-lechelle-faussent-la-marge), k-NN repose entièrement sur des distances : des entrées non mises à la même échelle (`StandardScaler`) faussent les distances calculées, exactement pour la même raison.

## Comparatif des 5 algorithmes

| Algorithme | Ce qu'il apprend | Ce qu'il trace | Type de sortie |
|---|---|---|---|
| [Régression linéaire](/?c=donnees&s=data-science&p=regression-lineaire) | Un poids par entrée | Une droite (ou un plan) | Un nombre continu |
| [Régression logistique](/?c=donnees&s=data-science&p=regression-logistique) | Un poids par entrée + seuil | Une courbe en S (probabilité) | Une catégorie, avec probabilité |
| [Arbre de décision](/?c=donnees&s=data-science&p=arbres-de-decision) | Une suite de questions | Des rectangles (coupes droites) | Une catégorie (ou un nombre) |
| [SVM](/?c=donnees&s=data-science&p=svm) | La frontière à marge maximale | Une marge entre catégories | Une catégorie |
| k-NN | Rien (mémorise les données) | Un vote entre voisins | Une catégorie (ou une moyenne) |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | k-NN classe un nouvel exemple par vote majoritaire parmi ses k voisins les plus proches, sans jamais construire de modèle explicite : tout le calcul a lieu à la prédiction, pas à l'entraînement. |
| **Outils utilisables** | `sklearn.neighbors.KNeighborsClassifier`, `n_neighbors`, `StandardScaler`. |
| **Pièges à éviter** | L'utiliser sur un très grand catalogue sans prévoir le coût par prédiction ; oublier de mettre les entrées à l'échelle. |
| **Bonnes pratiques** | Choisir k par validation croisée plutôt qu'au hasard ; réserver k-NN aux volumes de données où une prédiction lente reste acceptable. |
