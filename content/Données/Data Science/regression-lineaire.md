---
order: 6
---

# La régression linéaire

Ce chapitre applique à un algorithme précis le vocabulaire posé dans [Introduction au machine learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn) (entraînement/test, `fit`/`predict`). La **régression linéaire** est le plus simple des algorithmes de machine learning supervisé : elle prédit un **nombre** (une valeur continue) à partir d'une ou plusieurs entrées, en traçant la droite qui s'ajuste le mieux à des exemples connus.

## L'idée : trouver la meilleure droite

Une entreprise de livraison veut estimer la durée d'une course à partir de la distance à parcourir. Sur des courses passées, elle connaît déjà la distance ET la durée réelle : ce sont les données d'entraînement.

```
durée (min)
   50 |                                    ●
   40 |                          ●      ╱
   30 |                 ●     ╱‾
   20 |        ●     ╱‾
   10 |  ●  ╱‾
    0 +──────────────────────────────── distance (km)
      0    5    10   15   20
```

Chaque point ● est une course passée réelle. La droite est celle qui passe **au plus près de l'ensemble des points**, pas forcément par un seul d'entre eux : c'est elle que le modèle apprend, puis réutilise pour prédire la durée d'une nouvelle course dont on ne connaît que la distance.

## La formule d'une droite

Une droite à une seule entrée s'écrit :

```
prédiction = biais + poids × entrée
```

Sur l'exemple de la livraison, l'entraînement (voir plus bas *comment* ces deux nombres sont trouvés) donne concrètement :

```
durée = 7.6 + 2.52 × distance
```

- **7.6** (le biais, ou *intercept*) : la durée de base, incompressible, même pour une distance proche de 0 (préparation, sortie du dépôt...).
- **2.52** (le poids, ou *coefficient*) : le nombre de minutes ajoutées par kilomètre supplémentaire.

Pour une course de 12 km : `durée = 7.6 + 2.52 × 12 = 37.8` minutes.

Avec **plusieurs** entrées (distance, mais aussi nombre de feux rouges sur le trajet, heure de la journée...), la formule ajoute un poids par entrée : `prédiction = biais + poids1 × entrée1 + poids2 × entrée2 + ...`. C'est exactement la [somme pondérée d'un produit scalaire](/?c=fondamentaux&s=mathematiques&p=vecteurs-et-produit-scalaire) entre le vecteur des entrées et le vecteur des poids appris.

## En code

```python
from sklearn.linear_model import LinearRegression

# X : distance en km (une seule colonne ici) ; y : durée réelle en minutes
X = [[2], [5], [9], [14], [20]]
y = [12, 20, 30, 42, 58]

modele = LinearRegression()
modele.fit(X, y)          # trouve le biais et le(s) poids qui minimisent l'erreur (voir plus bas)

modele.intercept_          # 7.6  -> le biais
modele.coef_                # [2.52] -> un poids par colonne de X

modele.predict([[12]])     # [37.8] -> prédiction pour une distance de 12 km
```

## Comment le modèle trouve cette droite

Une infinité de droites pourraient traverser le nuage de points ; `fit()` choisit celle qui minimise **l'erreur quadratique moyenne** (voir cette métrique dans [Introduction au machine learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#mesurer-la-qualite-dun-modele)) entre les durées prédites et les durées réelles des exemples d'entraînement : la somme des écarts au carré, la plus petite possible.

Deux méthodes trouvent ce minimum, selon la taille des données :

| Méthode | Principe | Utilisée quand |
|---|---|---|
| Équation normale (forme fermée) | Calcule directement le biais/poids optimaux par une formule mathématique, en une seule fois | Peu de colonnes (quelques dizaines) |
| Descente de gradient | Ajuste progressivement biais/poids par petits pas, dans la direction qui réduit l'erreur (voir [l'entraînement d'un modèle](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient)) | Beaucoup de colonnes ou de données : la formule directe devient trop coûteuse à calculer |

`LinearRegression` de scikit-learn utilise l'équation normale automatiquement ; la descente de gradient sert surtout pour des modèles plus complexes (réseaux de neurones).

## Limite : la régression linéaire suppose une relation... linéaire

Le modèle ne peut tracer qu'une droite (ou un plan, avec plusieurs entrées) : si la vraie relation entre les entrées et la sortie est une courbe, une droite ne pourra jamais bien s'y ajuster, quels que soient le biais et les poids choisis. C'est un cas classique de [sous-apprentissage](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#surapprentissage-overfitting-et-sous-apprentissage-underfitting) structurel, pas un problème de données insuffisantes.

> **Piège :** appliquer `LinearRegression` à une sortie catégorielle (ex : "oui"/"non") plutôt qu'à un nombre continu. Le modèle ne renverra pas d'erreur mais un nombre sans signification (ex : 0.73), inutilisable comme catégorie : pour classifier, voir le chapitre suivant, la [régression logistique](/?c=donnees&s=data-science&p=regression-logistique).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La régression linéaire prédit un nombre continu en traçant la droite (ou le plan) qui minimise l'erreur quadratique moyenne sur les exemples d'entraînement. |
| **Outils utilisables** | `sklearn.linear_model.LinearRegression`, `.fit()`, `.predict()`, `.intercept_`, `.coef_`. |
| **Pièges à éviter** | L'utiliser sur une sortie catégorielle ; l'appliquer telle quelle à une relation non linéaire (sous-apprentissage garanti). |
| **Bonnes pratiques** | Vérifier visuellement (nuage de points) que la relation semble bien linéaire avant d'entraîner le modèle. |
