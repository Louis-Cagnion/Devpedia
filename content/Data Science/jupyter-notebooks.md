---
order: 1
---

# Les notebooks Jupyter

Un **notebook Jupyter** est un document interactif mêlant code exécutable, résultats (y compris des graphiques affichés directement), et texte explicatif (Markdown), le format de travail dominant en data science et en apprentissage automatique, pour l'exploration itérative de données.

## Cellules de code et cellules Markdown

Un notebook (fichier `.ipynb`) est une suite de **cellules**, de deux types :

- **Cellule de code** : du Python, exécutable indépendamment (`Shift+Entrée` pour l'exécuter).
- **Cellule Markdown** : du texte formaté (titres, listes, formules mathématiques via LaTeX), pour documenter la démarche à côté du code.

```python
# Cellule 1 (code)
import pandas as pd
donnees = pd.read_csv("ventes.csv")
```

```python
# Cellule 2 (code)
donnees.describe()   # le résultat s'affiche directement sous la cellule
```

## Le kernel : le processus Python derrière le notebook

Le **kernel** est le processus Python qui exécute réellement le code des cellules et conserve leur état en mémoire (variables, imports...) entre les exécutions : le notebook lui-même n'est qu'une interface qui envoie du code au kernel et affiche ses résultats.

> **Note :** redémarrer le kernel (*Restart Kernel*) efface **toutes** les variables en mémoire, comme si on relançait le programme depuis zéro : les cellules affichées restent visibles à l'écran, mais leur code n'a pas été réexécuté tant qu'on ne le redemande pas explicitement.

## Le piège de l'exécution non linéaire

Contrairement à un script `.py` classique (exécuté strictement du haut vers le bas), les cellules d'un notebook peuvent être exécutées **dans n'importe quel ordre**, plusieurs fois chacune :

```python
# Cellule 1
x = 5
```

```python
# Cellule 2
x = x * 2
```

Si on exécute la cellule 2 **plusieurs fois de suite** sans relancer la cellule 1, `x` double à chaque exécution (10, puis 20, puis 40...) : un piège classique où l'état "invisible" du kernel ne correspond plus à l'ordre visuel des cellules à l'écran. En cas de doute sur la reproductibilité d'un résultat, *Restart Kernel and Run All* réexécute tout dans l'ordre du haut vers le bas, garantissant un état cohérent.

## Commandes magiques (`%`, `%%`)

Des commandes spéciales, propres à Jupyter, absentes du langage Python lui-même :

```python
%matplotlib inline    # affiche les graphiques Matplotlib directement sous la cellule, sans fenêtre séparée
%timeit ma_fonction()   # mesure automatiquement le temps d'exécution, sur plusieurs répétitions
%%time                  # (en début de cellule) chronomètre l'exécution de toute la cellule
```

## Pourquoi ce format convient à la data science

- Voir immédiatement le résultat d'une transformation (un `DataFrame`, un graphique) juste après le code qui la produit, sans attendre la fin d'un script entier.
- Explorer par petites étapes successives (charger les données, les nettoyer, les visualiser, entraîner un modèle) sans tout réexécuter à chaque essai.
- Documenter la démarche et les résultats côte à côte (cellules Markdown + graphiques), utile pour partager une analyse avec d'autres.

Voir aussi les chapitres sur [pandas](/?c=data-science&p=pandas) et [Matplotlib](/?c=data-science&p=matplotlib), les deux bibliothèques les plus couramment utilisées à l'intérieur d'un notebook.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un notebook mêle cellules de code et cellules Markdown, exécutées dans un ordre potentiellement non linéaire : le kernel conserve l'état entre les exécutions, indépendamment de l'ordre visuel des cellules. |
| **Outils utilisables** | Commandes magiques (`%matplotlib inline`, `%timeit`), *Restart Kernel and Run All* pour garantir un état cohérent. |
| **Pièges à éviter** | Exécuter les cellules dans le désordre et croire que le résultat affiché reflète l'état réel du kernel. |
| **Bonnes pratiques** | Relancer *Restart Kernel and Run All* en cas de doute sur la reproductibilité d'un résultat. |
