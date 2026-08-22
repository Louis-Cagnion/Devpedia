---
order: 3
---

# pandas : manipuler des données tabulaires

**pandas** fournit deux structures pour manipuler des données tabulaires : la `Series` (une seule colonne, indexée) et le `DataFrame` (un tableau à deux dimensions avec des colonnes nommées), l'équivalent [Python](/?c=langages-de-programmation&s=python&p=python) d'une table [SQL](/?c=domain-specific-languages-dsl&p=sql) ou d'une feuille de tableur, mais manipulable par du code.

## Créer un DataFrame

```python
import pandas as pd

donnees = pd.DataFrame({
    "nom": ["Jean", "Marie", "Ali"],
    "age": [25, 30, 22],
    "ville": ["Lyon", "Paris", "Lyon"],
})
```

```text
    nom  age  ville
0  Jean   25   Lyon
1 Marie   30  Paris
2   Ali   22   Lyon
```

## Charger et inspecter des données

```python
donnees = pd.read_csv("clients.csv")

donnees.head()      # 5 premières lignes
donnees.info()      # types de colonnes, valeurs manquantes, mémoire utilisée
donnees.describe()  # statistiques (moyenne, écart-type, min/max) des colonnes numériques
donnees.shape       # (nombre_de_lignes, nombre_de_colonnes)
donnees.columns     # liste des noms de colonnes
```

## Sélectionner des colonnes et des lignes

```python
donnees["age"]           # une seule colonne -> une Series
donnees[["nom", "age"]]  # plusieurs colonnes -> un DataFrame

donnees.loc[0]         # ligne d'INDEX 0 (l'index affiché à gauche du tableau)
donnees.iloc[0]        # ligne de POSITION 0 (toujours la première, même si l'index a été modifié)
donnees.loc[0, "nom"]  # valeur précise : ligne 0, colonne "nom"
```

> **Note :** `loc` sélectionne par **étiquette** (le label de l'index, qui peut être un nom, une date...), `iloc` par **position numérique**, les deux coïncident par défaut (index numérique de 0 à n), mais divergent dès que l'index a été personnalisé (ex. trié, filtré, ou basé sur des dates).

## Filtrer avec un masque booléen

```python
donnees[donnees["age"] > 25]
# ne garde que les lignes où la condition est vraie -> équivalent d'un "WHERE" en SQL

donnees[(donnees["age"] > 20) & (donnees["ville"] == "Lyon")]
# combiner plusieurs conditions : & (et), | (ou) -- PAS "and"/"or", réservés aux booléens simples
```

## `groupby` : agréger par catégorie

Équivalent direct du `GROUP BY` en [SQL](/?c=domain-specific-languages-dsl&p=sql) :

```python
donnees.groupby("ville")["age"].mean()
# ville
# Lyon     23.5
# Paris    30.0
```

```python
donnees.groupby("ville").agg({"age": "mean", "nom": "count"})
# plusieurs agrégations à la fois, une par colonne
```

## Fusionner deux DataFrames (`merge`)

Équivalent du `JOIN` [SQL](/?c=domain-specific-languages-dsl&p=sql) :

```python
commandes = pd.DataFrame({"client_id": [1, 2], "produit": ["Vélo", "Trottinette"]})
clients = pd.DataFrame({"id": [1, 2, 3], "nom": ["Jean", "Marie", "Ali"]})

pd.merge(commandes, clients, left_on="client_id", right_on="id")
# fusionne les deux tables sur la correspondance client_id <-> id, comme un INNER JOIN
```

## Ajouter/modifier une colonne

```python
donnees["age_dans_10_ans"] = donnees["age"] + 10   # nouvelle colonne, calculée à partir d'une autre

donnees["categorie"] = donnees["age"].apply(lambda age: "jeune" if age < 30 else "senior")
# apply() : exécute une fonction sur chaque valeur de la colonne
```

> **Note (performance) :** `.apply()` exécute la fonction [Python](/?c=langages-de-programmation&s=python&p=python) ligne par ligne, sans profiter de la vectorisation [NumPy](/?c=data-science&p=numpy) : pour une condition simple comme celle-ci, `np.where(donnees["age"] < 30, "jeune", "senior")` fait exactement la même chose, en bien plus rapide sur un grand jeu de données. `.apply()` reste utile pour une logique trop complexe à exprimer avec les fonctions vectorisées de pandas/NumPy.

## Valeurs manquantes

```python
donnees.isna()     # tableau de True/False, True là où la valeur est manquante (NaN)
donnees.dropna()   # supprime les lignes contenant au moins une valeur manquante
donnees.fillna(0)  # remplace les valeurs manquantes par une valeur par défaut
```

Voir aussi le chapitre sur [NumPy](/?c=data-science&p=numpy) (les colonnes d'un DataFrame sont en réalité des `ndarray`) et sur [SQL](/?c=domain-specific-languages-dsl&p=sql), dont les concepts (`WHERE`, `GROUP BY`, `JOIN`) se retrouvent presque à l'identique ici.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | pandas manipule des données tabulaires via `Series` (une colonne) et `DataFrame` (un tableau), avec des opérations proches de [SQL](/?c=domain-specific-languages-dsl&p=sql) (`WHERE` → masque booléen, `GROUP BY` → `groupby`, `JOIN` → `merge`). |
| **Outils utilisables** | `read_csv`, `loc`/`iloc`, `groupby`, `merge`, `isna`/`dropna`/`fillna`. |
| **Pièges à éviter** | Confondre `loc` (par étiquette) et `iloc` (par position) : ils divergent dès que l'index a été personnalisé. |
| **Bonnes pratiques** | Préférer une fonction vectorisée (`np.where`) à `.apply()` pour une condition simple sur un grand jeu de données. |
