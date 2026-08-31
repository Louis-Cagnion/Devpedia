---
order: 8
---

# Les arbres de décision

Un **arbre de décision** classe (ou prédit un nombre, voir plus bas) en posant une **suite de questions simples** sur les entrées, chacune avec une réponse binaire, jusqu'à atteindre une décision finale. Contrairement à la [régression logistique](/?c=donnees&s=data-science&p=regression-logistique), qui combine toutes les entrées en une seule formule, un arbre les examine une par une, dans un ordre appris automatiquement.

## L'idée : une suite de questions

Une application de streaming musical veut classer un morceau dans une playlist "Sport" ou non, à partir de 3 caractéristiques (hip-hop ? énergique ? tard le soir ?).

```
                    Hip-hop ?
                   /          \
                 Oui           Non
                  |              |
            Énergique ?    (pas Sport)
             /       \
           Oui        Non
            |            |
      Tard le soir ?  (pas Sport)
       /        \
     Oui         Non
      |            |
  (pas Sport)   Sport
```

Chaque nœud pose une question sur **une seule** caractéristique ; chaque branche mène soit à une nouvelle question, soit à une **feuille** : la décision finale.

## Ce que fait réellement une question : découper l'espace en rectangles

Chaque question de l'arbre est littéralement une coupe droite dans l'espace des données : "hip-hop ?" sépare tous les morceaux en deux groupes selon une seule caractéristique, "énergique ?" recoupe l'un de ces deux groupes selon une autre. Empiler plusieurs questions revient donc à découper l'espace en **rectangles** (un rectangle par feuille), chacun correspondant à une combinaison précise de réponses :

```
énergie
   |  Non-Sport  │  Non-Sport
   |             │
   |─────────────┼─────────────
   |  Non-Sport  │   Sport
   |             │
   +──────────────────────────── hip-hop (0 = non, 1 = oui)
```

L'arbre et ce découpage en rectangles sont **le même objet** vu de deux façons différentes : lire l'arbre de haut en bas revient à traverser les rectangles.

## En code

```python
from sklearn.tree import DecisionTreeClassifier

# X : [hip-hop (0/1), énergique (0/1), tard le soir (0/1)] ; y : playlist Sport (1) ou non (0)
X = [[1, 1, 0], [1, 1, 1], [0, 1, 0], [1, 0, 0], [0, 0, 1]]
y = [1, 0, 0, 0, 0]

modele = DecisionTreeClassifier(max_depth=3)   # max_depth : limite le nombre de questions en cascade
modele.fit(X, y)

modele.predict([[1, 1, 0]])           # [1] -> classé "Sport"
modele.feature_importances_            # importance relative de chaque caractéristique dans les choix de l'arbre
```

## Comment l'arbre choisit ses questions

À chaque nœud, l'algorithme teste toutes les caractéristiques et tous les seuils possibles, et retient la question qui rend les deux groupes résultants les plus **purs** possible (chaque groupe contient autant que possible une seule catégorie, pas un mélange). Cette pureté se mesure avec l'**impureté de Gini** ou l'**entropie**, deux formules basées sur les [probabilités](/?c=fondamentaux&s=mathematiques&p=les-probabilites-de-base) de chaque catégorie dans un groupe : plus un groupe est mélangé (probabilités proches entre catégories), plus son impureté est élevée. L'algorithme répète ce choix récursivement sur chaque nouveau groupe, jusqu'à une profondeur maximale (`max_depth`) ou des feuilles déjà pures.

## Piège : un arbre trop profond mémorise au lieu d'apprendre

Sans limite de profondeur, un arbre peut continuer à poser des questions jusqu'à isoler chaque exemple d'entraînement dans sa propre feuille : un score parfait sur l'entraînement, mais un [surapprentissage](/?c=donnees&s=data-science&p=machine-learning-scikit-learn#surapprentissage-overfitting-et-sous-apprentissage-underfitting) sévère, l'arbre ayant appris les exemples précis plutôt qu'un motif général. `max_depth`, ou un nombre minimal d'exemples requis par feuille (`min_samples_leaf`), limitent ce risque.

> **Avantage à noter :** contrairement à la régression linéaire/logistique, un arbre de décision n'a besoin d'aucune mise à l'échelle des entrées au préalable (une caractéristique en dizaines et une autre en millions ne le perturbent pas) : il compare toujours une seule caractéristique à un seuil à la fois, jamais une somme pondérée entre elles.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un arbre de décision classe via une suite de questions binaires, chacune une coupe droite dans l'espace des données ; l'ensemble des feuilles forme un découpage en rectangles. |
| **Outils utilisables** | `sklearn.tree.DecisionTreeClassifier`, `max_depth`, `min_samples_leaf`, `.feature_importances_`. |
| **Pièges à éviter** | Laisser l'arbre grandir sans limite (surapprentissage quasi garanti). |
| **Bonnes pratiques** | Fixer `max_depth`/`min_samples_leaf` dès le départ ; profiter de l'absence de mise à l'échelle nécessaire pour ce type de modèle. |
