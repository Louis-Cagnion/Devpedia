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
X = [[25, 50000], [45, 80000], [30, 45000]]  # ex : âge, salaire
y = ["non", "oui", "non"]                    # ex : a souscrit un crédit ou non

# Apprentissage non supervisé : uniquement X, pas de "bonne réponse" à apprendre
X = [[25, 50000], [45, 80000], [30, 45000]]
```

## Le principe fondamental : séparer entraînement et test

Un modèle qui "apprend par cœur" les données d'entraînement (au lieu d'apprendre le motif général sous-jacent) obtiendrait un score parfait sur ces données, mais échouerait sur des données nouvelles, jamais vues. Pour détecter ce problème, on **sépare toujours** les données disponibles en deux ensembles distincts :

```python
from sklearn.model_selection import train_test_split

X_entrainement, X_test, y_entrainement, y_test = train_test_split(X, y, test_size=0.2)
# 80% pour entraîner le modèle, 20% mis de côté, jamais vus pendant l'entraînement
```

Le modèle n'est ensuite évalué **que** sur `X_test`/`y_test`, jamais sur les données qui ont servi à l'entraîner.

## Un troisième ensemble : la validation

Ajuster un modèle (comparer plusieurs algorithmes, choisir des hyperparamètres) en se basant sur le score obtenu sur `X_test` revient à tricher indirectement : les choix faits en amont finissent influencés par ce score, qui cesse alors d'être un ensemble réellement jamais vu. La pratique correcte introduit un troisième ensemble, la **validation**, utilisé pendant la mise au point plutôt qu'à la fin :

| Ensemble | Rôle |
|---|---|
| Entraînement | Ajuster les paramètres internes du modèle (`fit`) |
| Validation | Comparer des modèles/hyperparamètres entre eux, avant tout test final |
| Test | Évaluer une seule fois, à la toute fin, le modèle retenu |

```python
X_entrainement, X_temp, y_entrainement, y_temp = train_test_split(X, y, test_size=0.4)
X_validation, X_test, y_validation, y_test = train_test_split(X_temp, y_temp, test_size=0.5)
# 60% entraînement / 20% validation / 20% test
```

## Surapprentissage (*overfitting*) et sous-apprentissage (*underfitting*)

| | Score sur l'entraînement | Score sur le test |
|---|---|---|
| **Sous-apprentissage** (*underfitting*) | Faible | Faible : le modèle est trop simple pour capturer le motif |
| **Bon ajustement** | Élevé | Élevé : le modèle généralise bien |
| **Surapprentissage** (*overfitting*) | Très élevé | Faible : le modèle a "mémorisé" les données d'entraînement au lieu d'apprendre un motif général |

> **Note :** un grand écart entre le score d'entraînement (excellent) et le score de test (médiocre) est le signal classique d'un surapprentissage : le modèle a retenu les exemples précis plutôt que la règle générale qui les sous-tend, un peu comme un élève qui aurait mémorisé les réponses d'un exercice précis sans comprendre la méthode.

## L'API uniforme de scikit-learn : `fit` / `predict`

Quel que soit l'algorithme choisi, scikit-learn expose systématiquement la même interface :

```python
from sklearn.linear_model import LogisticRegression   # classification : y est catégoriel ("oui"/"non")

modele = LogisticRegression()
modele.fit(X_entrainement, y_entrainement)  # "apprend" à partir des données d'entraînement

predictions = modele.predict(X_test)        # applique ce qui a été appris à de nouvelles données

modele.score(X_test, y_test)                # évalue la qualité des prédictions sur le test
```

- `fit(X, y)` : ajuste les paramètres internes du modèle pour qu'il colle au mieux aux données fournies.
- `predict(X)` : utilise ces paramètres appris pour produire une prédiction sur de nouvelles données.
- Cette interface (`fit`/`predict`) reste identique en changeant simplement `LogisticRegression()` pour un autre algorithme (`RandomForestClassifier()`, `KMeans()`...), ce qui rend très facile de tester rapidement plusieurs approches sur le même problème.

> **Note :** le choix de l'algorithme dépend du type de `y`. Ici `y` est **catégoriel** (`"oui"`/`"non"`) : c'est un problème de classification, d'où `LogisticRegression` (malgré son nom, un algorithme de classification, pas de régression). `LinearRegression` s'utilise quand `y` est une valeur **numérique continue** à prédire (un prix, une température...) : l'utiliser sur des étiquettes textuelles comme ici provoquerait une erreur.

## La validation croisée (*cross-validation*)

Avec peu de données, réserver 40% pour validation+test (cf. plus haut) devient coûteux ; la validation croisée répond à ce problème sans sacrifier autant de données d'entraînement :

```python
from sklearn.model_selection import cross_val_score

scores = cross_val_score(LogisticRegression(), X_entrainement, y_entrainement, cv=5)
# découpe X_entrainement en 5 blocs ("folds") ; entraîne 5 fois en gardant chaque bloc comme validation à son tour
scores.mean()   # moyenne des 5 scores -> estimation plus fiable qu'un seul découpage train/validation
```

Chaque exemple sert ainsi à la fois à l'entraînement (4 fois sur 5) et à la validation (1 fois sur 5), sans jamais toucher à `X_test` : la moyenne des 5 scores lisse l'effet d'un découpage particulièrement favorable ou défavorable qu'un split unique pourrait produire par hasard.

## Mesurer la qualité d'un modèle

Pour la régression (`y` numérique continu), l'erreur quadratique moyenne suffit dans la plupart des cas :

```python
from sklearn.metrics import mean_squared_error

mean_squared_error(y_test, predictions)   # erreur quadratique moyenne
```

Pour la classification, l'exactitude (`accuracy_score`, % de prédictions correctes) ne suffit pas dès que les classes sont déséquilibrées : les métriques ci-dessous en tiennent compte, à partir de la **matrice de confusion**.

### La matrice de confusion

Pour une classification binaire (positif/négatif), chaque prédiction tombe dans une de ces quatre cases :

| | Prédit positif | Prédit négatif |
|---|---|---|
| **Réellement positif** | Vrai positif (VP) | Faux négatif (FN) |
| **Réellement négatif** | Faux positif (FP) | Vrai négatif (VN) |

```python
from sklearn.metrics import confusion_matrix

confusion_matrix(y_test, predictions)
# [[VN, FP],
#  [FN, VP]]
```

### Les métriques qui en découlent

| Métrique | Formule | Répond à |
|---|---|---|
| Exactitude (*accuracy*) | (VP + VN) / total | Sur l'ensemble des prédictions, quelle proportion est correcte ? |
| Précision (*precision*) | VP / (VP + FP) | Parmi les cas prédits positifs, combien le sont réellement ? |
| Rappel (*recall*, ou sensibilité) | VP / (VP + FN) | Parmi les cas réellement positifs, combien ont été détectés ? |
| Spécificité (*specificity*) | VN / (VN + FP) | Parmi les cas réellement négatifs, combien ont été correctement écartés ? |
| F1-score | 2 × (précision × rappel) / (précision + rappel) | Moyenne harmonique de la précision et du rappel, en un seul chiffre |

```python
from sklearn.metrics import precision_score, recall_score, f1_score, classification_report

precision_score(y_test, predictions)
recall_score(y_test, predictions)
f1_score(y_test, predictions)

print(classification_report(y_test, predictions))   # précision, rappel et F1 à la fois, par classe
```

> **Note :** l'exactitude est trompeuse sur des classes déséquilibrées : un détecteur de fraude qui répond toujours "non" atteint 99% d'exactitude si 1% des transactions sont frauduleuses, tout en étant inutile (rappel de 0%). Précision et rappel s'évaluent presque toujours ensemble : augmenter l'un se fait généralement au détriment de l'autre (repousser le seuil de décision vers "positif" augmente le rappel mais fait baisser la précision, et inversement), le F1-score résume ce compromis en un seul chiffre, pratique pour comparer des modèles sans arbitrer manuellement entre les deux à chaque fois. La spécificité complète le tableau côté négatifs : utile quand un faux positif coûte cher (ex : un examen médical inutile déclenché à tort), alors que le rappel se concentre sur le coût d'un faux négatif (ex : une maladie non détectée).

## Le déroulement type d'un projet de machine learning

1. Collecter et nettoyer les données (valeurs manquantes, voir [pandas](/?c=data-science&p=pandas)).
2. Séparer en ensembles d'entraînement et de test.
3. Choisir un ou plusieurs algorithmes candidats, les entraîner (`fit`).
4. Évaluer sur l'ensemble de test (`predict` + une métrique adaptée au problème).
5. Ajuster (autre algorithme, autres paramètres, plus de données...) et recommencer.

Voir aussi le chapitre sur [les réseaux de neurones](/?c=ia&p=reseaux-de-neurones) : une famille particulière de modèles, plus complexe que ceux de scikit-learn, mais reposant sur exactement les mêmes principes de base (données d'entraînement/test, apprentissage, généralisation).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un modèle s'entraîne sur un jeu de données séparé du jeu de test, pour détecter s'il généralise ou "mémorise" (surapprentissage). L'API scikit-learn est uniforme : `fit()` puis `predict()`, quel que soit l'algorithme. |
| **Outils utilisables** | `train_test_split`, `cross_val_score`, matrice de confusion, `precision_score`/`recall_score`/`f1_score`. |
| **Pièges à éviter** | Évaluer et ajuster un modèle sur le même ensemble de test, à répétition : revient à tricher indirectement ; se fier à l'exactitude seule sur des classes déséquilibrées. |
| **Bonnes pratiques** | Réserver un ensemble de validation pour ajuster les hyperparamètres, le test final ne servant qu'une seule fois ; utiliser le F1-score pour résumer le compromis précision/rappel. |
