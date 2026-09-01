---
order: 15
---

# Manipuler des fichiers et des dossiers avec `pathlib`

[La gestion des erreurs](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) ouvre déjà un fichier avec `open("donnees.txt")`, un simple chemin écrit en chaîne de caractères. Le module standard **`pathlib`** représente un chemin comme un véritable objet, manipulable et portable entre systèmes d'exploitation, sans jamais concaténer de chaînes à la main.

## `pathlib.Path` : représenter un chemin comme un objet

```python
from pathlib import Path

dossier = Path("rapports") / "2026" / "aout.txt"  # "/" construit le chemin, PORTABLE (\ sous Windows, / ailleurs)
print(dossier)                                    # rapports/2026/aout.txt

dossier.exists()   # True/False -> le fichier/dossier existe-t-il réellement sur le disque ?
dossier.is_file()  # True/False
dossier.is_dir()   # True/False
```

> **Note :** l'opérateur `/` est ici surchargé (voir [Méthodes réfléchies](/?c=langages-de-programmation&s=python&p=poo)) : `Path.__truediv__` construit un NOUVEAU chemin en ajoutant un segment, sans jamais toucher au chemin d'origine.

## Décomposer un chemin : `.name`, `.stem`, `.suffix`

```python
rapport = Path("rapport.txt")

rapport.name    # "rapport.txt" -> nom complet du fichier
rapport.stem    # "rapport"     -> nom SANS l'extension
rapport.suffix  # ".txt"        -> l'extension, avec le point

rapport.with_name("brouillon.txt")                             # Path("brouillon.txt") -> remplace le nom entier
rapport.with_suffix(".csv")                                    # Path("rapport.csv")   -> remplace juste l'extension
rapport.with_name(f"{rapport.stem}.peugeot{rapport.suffix}")   # Path("rapport.peugeot.txt") -> insère un mot au milieu
```

> **Piège :** `.with_name()` remplace le DERNIER segment du chemin (le nom de fichier), contrairement à `/` qui en AJOUTE un nouveau : `Path("a/b") / "c"` donne `a/b/c`, `Path("a/b").with_name("c")` donne `a/c`.

## Supprimer un dossier non vide : `shutil.rmtree()`

```python
dossier.rmdir()  # OSError si le dossier n'est pas vide -> pathlib refuse volontairement de supprimer du contenu

import shutil
shutil.rmtree(dossier)                      # supprime le dossier ET tout son contenu, récursivement
shutil.rmtree(dossier, ignore_errors=True)  # n'importe quelle erreur (fichier verrouillé...) est ignorée, en silence
```

`shutil` (« *shell utilities* », module standard) fournit des opérations de fichiers de plus haut niveau que `pathlib`. `shutil.rmtree()` équivaut à `rm -rf` en [Bash](/?c=shells&s=bash&p=redirections-et-pipes) ou `Remove-Item -Recurse` en [PowerShell](/?c=shells&s=powershell&p=powershell) ; `shutil.copy()`/`shutil.move()` couvrent la copie et le déplacement.

> **Piège :** `ignore_errors=True` rend un échec de suppression totalement silencieux : le dossier peut rester en place sans qu'aucune exception ne le signale. Ne l'utiliser que si l'appelant revérifie ensuite (ex. `dossier.exists()`) plutôt que de supposer la suppression réussie.

## Lire et écrire un fichier CSV

```python
import csv

with open("contacts.csv", newline="", encoding="utf-8") as f:
    lecteur = csv.reader(f, delimiter=",")
    for ligne in lecteur:
        print(ligne)  # ["Jean", "Dupont", "25"] -> une simple LISTE, par position
```

```python
with open("contacts.csv", newline="", encoding="utf-8") as f:
    lecteur = csv.DictReader(f, delimiter=",")  # utilise la première ligne comme en-têtes
    for ligne in lecteur:
        print(ligne)             # {"prenom": "Jean", "nom": "Dupont", "age": "25"} -> un DICT, par nom de colonne
        print(ligne["prenom"])   # "Jean" -> accès par nom, plus lisible que par index
```

`csv.reader` renvoie chaque ligne comme une liste positionnelle ; `csv.DictReader` transforme chaque ligne en dictionnaire à partir de la ligne d'en-tête (voir [hachabilité et clés de dict](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles)), plus lisible et plus robuste à un réordonnancement des colonnes. `delimiter=";"` (courant en France) remplace la virgule par défaut. En écriture, `csv.writer`/`csv.DictWriter` suivent la même logique inverse.

> **Note :** `newline=""` dans `open()` est recommandé par la documentation du module `csv` : sans lui, des retours à la ligne au milieu d'une valeur entre guillemets peuvent être mal interprétés selon le système d'exploitation.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `pathlib.Path` représente un chemin comme un objet manipulable (`/` pour construire, `.stem`/`.suffix`/`.with_name()` pour décomposer). `shutil.rmtree()` supprime un dossier non vide, ce que `Path.rmdir()` refuse. `csv.DictReader` lit un CSV en dicts nommés par en-tête, `csv.reader` en listes positionnelles. |
| **Outils utilisables** | `Path()`, `.exists()`/`.is_file()`/`.is_dir()`, `.with_name()`/`.with_suffix()`, `shutil.rmtree()`/`.copy()`/`.move()`, `csv.reader`/`DictReader`/`writer`/`DictWriter`. |
| **Pièges à éviter** | `.with_name()` remplace le dernier segment du chemin là où `/` en ajoute un nouveau. `shutil.rmtree(ignore_errors=True)` rend un échec silencieux. Oublier `newline=""` avec `csv` peut casser des valeurs multi-lignes entre guillemets. |
| **Bonnes pratiques** | Vérifier `dossier.exists()` après un `rmtree(ignore_errors=True)` plutôt que de supposer le succès. Préférer `DictReader`/`DictWriter` à un accès par index dès qu'un CSV a des en-têtes. |
