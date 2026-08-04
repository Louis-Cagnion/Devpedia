---
order: 5
---

# Introduction au machine learning (scikit-learn)

Le **machine learning** (apprentissage automatique) consiste à faire apprendre à un programme un comportement à partir de **données**, plutôt que de coder explicitement chaque règle. Ce chapitre pose le vocabulaire et le déroulement général d'un projet de ML, avant les chapitres plus avancés sur les réseaux de neurones.

## Apprentissage supervisé vs non supervisé

| | Apprentissage supervisé | Apprentissage non supervisé |
|---|---|---|
| Données | Étiquetées (on connaît déjà la bonne réponse pour chaque exemple d'entraînement) | Non étiquetées |
| Objectif | Prédire une étiquette pour de nouvelles données | Découvrir une structure cachée dans les données |
| Exemples de tâches | Classification (spam/non-spam), régression (prédire un prix) | Clustering (regrouper des clients similaires), réduction de dimension |

```python
# Apprentissage supervisé : X (les données) ET y (les bonnes réponses connues)
X = [[25, 50000], [45, 80000], [30, 45000]]   # ex : âge, salaire
y = ["non", "oui", "non"]                        # ex : a souscrit un crédit ou non

# Apprentissage non supervisé : uniquement X, pas de "bonne réponse" à apprendre
X = [[25, 50000], [45, 80000], [30, 45000]]
```

## Le principe fondamental : séparer entraînement et test

Un modèle qui "apprend par cœur" les données d'entraînement (au lieu d'apprendre le motif général sous-jacent) obtiendrait un score parfait sur ces données — mais échouerait sur des données nouvelles, jamais vues. Pour détecter ce problème, on **sépare toujours** les données disponibles en deux ensembles distincts :

```python
from sklearn.model_selection import train_test_split

X_entrainement, X_test, y_entrainement, y_test = train_test_split(X, y, test_size=0.2)
# 80% pour entraîner le modèle, 20% mis de côté, jamais vus pendant l'entraînement
```

Le modèle n'est ensuite évalué **que** sur `X_test`/`y_test`, jamais sur les données qui ont servi à l'entraîner.

## Surapprentissage (*overfitting*) et sous-apprentissage (*underfitting*)

| | Score sur l'entraînement | Score sur le test |
|---|---|---|
| **Sous-apprentissage** (*underfitting*) | Faible | Faible — le modèle est trop simple pour capturer le motif |
| **Bon ajustement** | Élevé | Élevé — le modèle généralise bien |
| **Surapprentissage** (*overfitting*) | Très élevé | Faible — le modèle a "mémorisé" les données d'entraînement au lieu d'apprendre un motif général |

> **Note :** un grand écart entre le score d'entraînement (excellent) et le score de test (médiocre) est le signal classique d'un surapprentissage — le modèle a retenu les exemples précis plutôt que la règle générale qui les sous-tend, un peu comme un élève qui aurait mémorisé les réponses d'un exercice précis sans comprendre la méthode.

## L'API uniforme de scikit-learn : `fit` / `predict`

Quel que soit l'algorithme choisi, scikit-learn expose systématiquement la même interface :

```python
from sklearn.linear_model import LogisticRegression   # classification : y est catégoriel ("oui"/"non")

modele = LogisticRegression()
modele.fit(X_entrainement, y_entrainement)   # "apprend" à partir des données d'entraînement

predictions = modele.predict(X_test)           # applique ce qui a été appris à de nouvelles données

modele.score(X_test, y_test)                    # évalue la qualité des prédictions sur le test
```

- `fit(X, y)` : ajuste les paramètres internes du modèle pour qu'il colle au mieux aux données fournies.
- `predict(X)` : utilise ces paramètres appris pour produire une prédiction sur de nouvelles données.
- Cette interface (`fit`/`predict`) reste identique en changeant simplement `LogisticRegression()` pour un autre algorithme (`RandomForestClassifier()`, `KMeans()`...) — ce qui rend très facile de tester rapidement plusieurs approches sur le même problème.

> **Note :** le choix de l'algorithme dépend du type de `y`. Ici `y` est **catégoriel** (`"oui"`/`"non"`) : c'est un problème de classification, d'où `LogisticRegression` (malgré son nom, un algorithme de classification, pas de régression). `LinearRegression` s'utilise quand `y` est une valeur **numérique continue** à prédire (un prix, une température...) — l'utiliser sur des étiquettes textuelles comme ici provoquerait une erreur.

## Mesurer la qualité d'un modèle

```python
from sklearn.metrics import accuracy_score, mean_squared_error

accuracy_score(y_test, predictions)       # % de prédictions correctes -> pour de la classification
mean_squared_error(y_test, predictions)    # erreur quadratique moyenne -> pour de la régression
```

## Le déroulement type d'un projet de machine learning

1. Collecter et nettoyer les données (valeurs manquantes, cf. chapitre sur pandas).
2. Séparer en ensembles d'entraînement et de test.
3. Choisir un ou plusieurs algorithmes candidats, les entraîner (`fit`).
4. Évaluer sur l'ensemble de test (`predict` + une métrique adaptée au problème).
5. Ajuster (autre algorithme, autres paramètres, plus de données...) et recommencer.

Voir aussi le chapitre sur les réseaux de neurones : une famille particulière de modèles, plus complexe que ceux de scikit-learn, mais reposant sur exactement les mêmes principes de base (données d'entraînement/test, apprentissage, généralisation).
