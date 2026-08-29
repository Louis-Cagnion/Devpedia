---
order: 9
---

# Les SVM (séparateurs à vaste marge)

Un **SVM** (*Support Vector Machine*, séparateur à vaste marge) est un algorithme de classification qui, comme les [arbres de décision](/?c=donnees&s=data-science&p=arbres-de-decision), trace une frontière entre catégories, mais choisit cette frontière selon un critère différent : la plus grande **marge** possible entre les deux catégories.

## L'idée : la frontière la plus large possible

Pour séparer deux espèces de fleurs (iris) à partir de la longueur et la largeur de leurs pétales, **plusieurs droites** peuvent parfaitement séparer les exemples d'entraînement :

```
largeur pétale
   |     ● ●
   |   ●   ●  ╲
   |  ●         ╲←── plusieurs droites possibles
   |       ○   ○  ╲
   |     ○   ○      ╲
   +──────────────────── longueur pétale
   ● espèce A    ○ espèce B
```

Un SVM ne choisit pas n'importe laquelle : il cherche celle qui laisse le plus d'espace vide de part et d'autre, la **marge maximale**. Sur des données réelles d'iris, cette marge mesure par exemple 1.397 cm : la distance entre la frontière et l'exemple le plus proche de chaque côté.

## Les vecteurs de support : seuls quelques points comptent

Une fois la frontière à marge maximale trouvée, **seuls les exemples posés exactement sur les bords de la marge** ont influencé son emplacement : ce sont les **vecteurs de support** (*support vectors*), qui donnent leur nom à l'algorithme. Tous les autres exemples, plus loin de la frontière, auraient pu être déplacés ou supprimés sans rien changer au résultat.

```python
from sklearn.svm import SVC

modele = SVC(kernel="linear")
modele.fit(X_entrainement, y_entrainement)

modele.support_vectors_    # les seuls exemples qui déterminent la frontière (souvent une poignée, sur des centaines)
```

## Le *kernel trick* : quand une droite ne suffit pas

Si les deux catégories ne sont pas séparables par une ligne droite, un SVM à noyau linéaire (`kernel="linear"`) plafonne (ex : 60% de bonnes classifications sur un jeu de données non linéairement séparable). Le **kernel trick** change de noyau (ex : `kernel="rbf"`) pour transformer implicitement les données vers un espace où une séparation devient possible, produisant une frontière courbe dans l'espace d'origine :

```python
modele_courbe = SVC(kernel="rbf")   # noyau RBF : autorise une frontière courbe
modele_courbe.fit(X_entrainement, y_entrainement)
# peut atteindre 100% là où kernel="linear" plafonnait à 60%, sur un problème non linéairement séparable
```

Techniquement, le noyau évite de calculer explicitement les coordonnées dans cet espace transformé (potentiellement de très grande dimension) : il calcule directement, par une formule mathématique, à quel point deux points seraient "proches" une fois transformés, ce qui suffit à l'algorithme sans jamais construire l'espace transformé lui-même.

## Piège : les entrées non mises à l'échelle faussent la marge

Un SVM mesure des **distances** entre points pour trouver la marge maximale : une caractéristique en millions (ex : un salaire) écraserait totalement une caractéristique en unités (ex : un âge) dans ce calcul de distance, même si l'âge est tout aussi pertinent. Contrairement aux arbres de décision, un SVM a donc besoin que toutes les entrées soient mises à la même échelle avant l'entraînement :

```python
from sklearn.preprocessing import StandardScaler

scaler = StandardScaler()
X_mis_a_echelle = scaler.fit_transform(X_entrainement)   # centre et réduit chaque colonne (moyenne 0, écart-type 1)
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un SVM trace la frontière de classification qui maximise la marge entre catégories ; seuls les vecteurs de support (les points les plus proches de la frontière) déterminent son emplacement. |
| **Outils utilisables** | `sklearn.svm.SVC`, `kernel="linear"`/`"rbf"`, `.support_vectors_`, `StandardScaler`. |
| **Pièges à éviter** | Entraîner sans mettre les entrées à l'échelle (distances faussées) ; garder un noyau linéaire sur des données non linéairement séparables. |
| **Bonnes pratiques** | Mettre systématiquement les entrées à l'échelle avant un SVM ; essayer `kernel="rbf"` si `kernel="linear"` plafonne. |
