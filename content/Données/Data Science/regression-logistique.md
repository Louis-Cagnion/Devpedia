---
order: 7
---

# La régression logistique

Malgré son nom proche de la [régression linéaire](/?c=donnees&s=data-science&p=regression-lineaire), la régression logistique ne prédit pas un nombre continu mais une **catégorie** : c'est un algorithme de **classification**. Elle répond à des questions du type "cet e-mail est-il un spam ?" ou "cet abonné va-t-il résilier ?", en s'appuyant sur les mêmes bases que la régression linéaire (biais, poids, `fit`/`predict`, voir [Introduction au machine learning](/?c=donnees&s=data-science&p=machine-learning-scikit-learn)).

## Le problème : une droite ne suffit pas pour classifier

Un service d'abonnement veut prédire si un utilisateur va **résilier** (*churn*) à partir du nombre de jours depuis sa dernière connexion. La sortie attendue n'est pas un nombre quelconque, mais une **probabilité**, forcément comprise entre 0 et 1 (0% à 100% de chances de résilier). Une droite classique (régression linéaire) peut dépasser 1 ou descendre sous 0 pour des entrées extrêmes : un résultat qui n'a alors plus aucun sens en tant que probabilité.

## La solution : écraser la droite dans une courbe en S

La régression logistique calcule d'abord une somme pondérée classique (`biais + poids × entrée`, exactement comme la régression linéaire), puis passe ce résultat dans une [fonction mathématique](/?c=fondamentaux&s=mathematiques&p=la-fonction-mathematique) particulière, la **fonction sigmoïde**, qui compresse n'importe quel nombre (aussi grand ou petit soit-il) dans l'intervalle ]0, 1[ :

```
probabilité
    1 |                              ●●●●●●
      |                          ●●●
  0.5 |                      ●●
      |                  ●●●
    0 |●●●●●●●●●●●●
      +──────────────────────────────────── jours depuis la dernière connexion
```

```python
import math

def sigmoide(x):
    return 1 / (1 + math.exp(-x))   # écrase x dans l'intervalle ]0, 1[, quel que soit x

sigmoide(-10)   # ≈ 0.00005  -> proche de 0
sigmoide(0)     # 0.5        -> pile au milieu
sigmoide(10)    # ≈ 0.99995  -> proche de 1
```

Pour un abonné qui ne s'est pas connecté depuis 17 jours, le modèle entraîné calcule par exemple une probabilité de résiliation de **82%**. Au-delà d'un **seuil de décision** (0.5 par défaut), l'utilisateur est classé "à risque".

## En code

```python
from sklearn.linear_model import LogisticRegression

# X : jours depuis la dernière connexion ; y : a résilié (1) ou non (0)
X = [[2], [5], [10], [15], [25], [30]]
y = [0, 0, 0, 1, 1, 1]

modele = LogisticRegression()
modele.fit(X, y)

modele.predict([[17]])         # [1] -> classé "va résilier" (probabilité > seuil)
modele.predict_proba([[17]])   # [[0.18, 0.82]] -> [probabilité de 0, probabilité de 1]
```

`predict()` applique déjà le seuil de 0.5 et renvoie directement la catégorie ; `predict_proba()` renvoie la probabilité brute, utile quand le seuil par défaut ne convient pas (voir le piège ci-dessous).

## Comment le modèle trouve les poids

Comme pour la régression linéaire, `fit()` cherche les poids/biais qui minimisent une erreur, mais l'erreur quadratique moyenne (adaptée à un nombre continu) ne convient pas à une probabilité : la régression logistique utilise l'**entropie croisée** (*cross-entropy*), une fonction de perte qui pénalise fortement une prédiction confiante mais fausse (ex : prédire 99% de chances de "non-résiliation" pour un utilisateur qui résilie), déjà détaillée dans [l'entraînement d'un modèle](/?c=ia&s=fondamentaux-du-deep-learning&p=entrainement-descente-de-gradient).

## Piège : le seuil de 0.5 n'est pas toujours le bon

Baisser ou monter le seuil de décision déplace directement le compromis entre précision et rappel (voir [ces métriques](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#mesurer-la-qualite-dun-modele)) : un seuil plus bas classe plus d'utilisateurs comme "à risque" (plus de rappel, moins de précision), un seuil plus haut fait l'inverse. Sur un problème où les faux négatifs coûtent cher (ex : ne pas repérer un utilisateur qui va vraiment résilier), baisser le seuil sous 0.5 via `predict_proba()` est souvent préférable à `predict()` seul, qui impose 0.5 sans discussion.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | La régression logistique classe une entrée en calculant une probabilité (via la fonction sigmoïde), puis en la comparant à un seuil de décision. Malgré son nom, c'est un algorithme de classification, pas de régression. |
| **Outils utilisables** | `sklearn.linear_model.LogisticRegression`, `.predict()` (catégorie), `.predict_proba()` (probabilité brute). |
| **Pièges à éviter** | Confondre avec la régression linéaire à cause du nom ; se fier au seuil 0.5 par défaut sans vérifier s'il convient au problème. |
| **Bonnes pratiques** | Utiliser `predict_proba()` plutôt que `predict()` dès que le coût d'un faux négatif et d'un faux positif diffère, pour ajuster le seuil en conséquence. |
