---
order: 4
---

# Matplotlib — visualiser des données

**Matplotlib** est la bibliothèque de visualisation la plus répandue en Python — la plupart des autres bibliothèques de graphiques (seaborn, pandas `.plot()`...) sont construites par-dessus, ou s'en inspirent directement.

## Les deux façons d'utiliser Matplotlib

```python
import matplotlib.pyplot as plt

# API "pyplot" (état implicite, rapide à écrire) :
plt.plot([1, 2, 3], [1, 4, 9])
plt.title("Un graphique simple")
plt.show()

# API orientée objet (explicite, recommandée dès que le graphique se complexifie) :
fig, ax = plt.subplots()
ax.plot([1, 2, 3], [1, 4, 9])
ax.set_title("Un graphique simple")
plt.show()
```

> **Note :** l'API `pyplot` maintient un état global implicite (la "figure courante") — pratique pour un graphique rapide en une ligne, mais source de confusion dès qu'on manipule plusieurs graphiques à la fois. `fig, ax = plt.subplots()` explicite ce sur quoi chaque commande agit (`ax`), ce qui est préférable pour tout code destiné à être réutilisé.

## `Figure` et `Axes`

```python
fig, ax = plt.subplots()
```

- `fig` (*Figure*) : la fenêtre/l'image entière, peut contenir plusieurs graphiques.
- `ax` (*Axes*) : une zone de tracé précise à l'intérieur de la figure, sur laquelle on dessine.

## Types de graphiques courants

```python
ax.plot(x, y)              # courbe (ligne continue)
ax.scatter(x, y)            # nuage de points
ax.bar(categories, valeurs)  # diagramme en barres
ax.hist(donnees, bins=20)     # histogramme (distribution d'une variable)
ax.boxplot(donnees)            # boîte à moustaches (médiane, quartiles, valeurs extrêmes)
```

## Habiller un graphique

```python
fig, ax = plt.subplots()
ax.plot(x, y, label="Ventes 2025", color="blue")
ax.set_xlabel("Mois")
ax.set_ylabel("Ventes (€)")
ax.set_title("Évolution des ventes")
ax.legend()             # affiche la légende (à partir des "label=" fournis)
ax.grid(True)             # ajoute une grille, souvent utile pour lire des valeurs précises
```

## Plusieurs graphiques dans une même figure

```python
fig, axes = plt.subplots(1, 2, figsize=(10, 4))  # 1 ligne, 2 colonnes -> 2 zones de tracé

axes[0].plot(x, y)
axes[0].set_title("Courbe")

axes[1].hist(donnees)
axes[1].set_title("Distribution")

plt.tight_layout()   # ajuste automatiquement les espacements pour éviter les chevauchements
```

## Sauvegarder un graphique

```python
fig.savefig("graphique.png", dpi=300)   # dpi : résolution de l'image exportée
```

## Lien avec pandas

```python
donnees["age"].plot(kind="hist")   # pandas délègue directement à Matplotlib en interne
```

Le `.plot()` de [pandas](/?c=data-science&p=pandas) n'est qu'un raccourci pratique au-dessus de Matplotlib — comprendre ce dernier permet de personnaliser n'importe quel graphique généré ainsi.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Matplotlib trace des graphiques via une `Figure` (l'image entière) et un ou plusieurs `Axes` (une zone de tracé). L'API orientée objet (`fig, ax = plt.subplots()`) est préférable dès que le graphique se complexifie. |
| **Outils utilisables** | `plot`/`scatter`/`bar`/`hist`/`boxplot`, `savefig` pour exporter. |
| **Pièges à éviter** | Utiliser l'API `pyplot` implicite avec plusieurs graphiques simultanés — source de confusion sur quel graphique une commande affecte. |
| **Bonnes pratiques** | Préférer `fig, ax = plt.subplots()` explicite pour tout code destiné à être réutilisé. |
