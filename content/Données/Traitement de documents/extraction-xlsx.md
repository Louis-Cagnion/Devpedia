---
order: 5
---

# Lire un classeur Excel (.xlsx) par script

Un fichier **.xlsx** (classeur Excel) n'est pas un simple tableau de valeurs : chaque cellule qui contient une formule (`=A1+B1`) stocke à la fois cette **formule** et la **dernière valeur calculée**, mise en cache par Excel au dernier enregistrement. Une bibliothèque qui lit ce fichier doit choisir laquelle des deux elle renvoie.

## [`openpyxl`](https://openpyxl.readthedocs.io) : formule par défaut, valeur en cache avec `data_only`

```python
import openpyxl

classeur = openpyxl.load_workbook("rapport.xlsx")
feuille = classeur.active   # la feuille active par defaut, celle ouverte en dernier dans Excel

for ligne in feuille.iter_rows(min_row=2, values_only=True):
    print(ligne)   # renvoie la CHAINE DE FORMULE ("=A1+B1"), pas le resultat calcule
```

```python
classeur = openpyxl.load_workbook("rapport.xlsx", data_only=True)
feuille = classeur.active

for ligne in feuille.iter_rows(min_row=2, values_only=True):
    print(ligne)   # renvoie cette fois la VALEUR EN CACHE, pas la formule
```

| | Sans `data_only` (par défaut) | Avec `data_only=True` |
|---|---|---|
| Cellule sans formule | La valeur elle-même | La valeur elle-même (identique) |
| Cellule avec formule | La chaîne de formule (`"=A1+B1"`) | La dernière valeur calculée, mise en cache par Excel |

> **Piège :** `data_only=True` ne recalcule JAMAIS une formule lui-même : `openpyxl` est un simple lecteur du fichier tel qu'il est stocké sur disque, jamais un moteur de calcul. Si le fichier n'a jamais été rouvert/enregistré dans Excel après une modification qui affecte une formule, la valeur en cache peut être absente (`None`, formule jamais évaluée) ou obsolète (reflète un ancien calcul).
>
> **Bonne pratique :** si la fraîcheur du résultat calculé est critique, s'assurer que le fichier a bien été recalculé/réenregistré dans Excel (ou un outil équivalent) avant de le lire avec `data_only=True` ; à défaut, recalculer soi-même la valeur côté script à partir des données brutes plutôt que de faire confiance au cache.

## Accéder à une feuille précise parmi plusieurs

```python
classeur = openpyxl.load_workbook("rapport.xlsx", data_only=True)
print(classeur.sheetnames)              # liste des noms de feuilles du classeur
feuille = classeur["Ventes 2025"]       # acceder a une feuille precise par son nom
```

Un classeur peut contenir plusieurs feuilles (autant d'onglets que dans Excel) ; `classeur.active` ne renvoie que celle ouverte en dernier lors du dernier enregistrement, pas nécessairement la première ni celle voulue.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un `.xlsx` stocke à la fois la formule d'une cellule et sa dernière valeur calculée en cache. `openpyxl` renvoie la formule par défaut, la valeur en cache avec `data_only=True` ; il ne recalcule jamais rien lui-même. |
| **Outils utilisables** | `openpyxl.load_workbook(chemin, data_only=True)`, `classeur.sheetnames`, `classeur["Nom de feuille"]`, `feuille.iter_rows(min_row=..., values_only=True)`. |
| **Pièges à éviter** | Supposer que `data_only=True` recalcule une formule modifiée depuis le dernier enregistrement Excel. Accéder à `classeur.active` en supposant qu'il s'agit de la première feuille. |
| **Bonnes pratiques** | Vérifier que le fichier a été réenregistré dans Excel après toute modification de formule, avant de lire sa valeur en cache. Accéder à une feuille par son nom explicite plutôt que par `active` dès que le classeur en contient plusieurs. |
