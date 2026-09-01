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

> **Équivalence :** un objet `Path` expose aussi `.open()` comme MÉTHODE, strictement équivalente à la fonction native `open()` (mêmes arguments : mode, `encoding`...) : `dossier.open("a", encoding="utf-8")` évite de repasser par `open(str(dossier), "a", encoding="utf-8")` une fois qu'on a déjà un `Path` sous la main.

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

## Lire et écrire du JSON

Un CSV structure des données en tableau (lignes/colonnes) ; le module standard [`json`](https://docs.python.org/3/library/json.html) structure des données arborescentes (dicts et listes imbriqués) en texte, lisible par n'importe quel langage, pas seulement Python.

```python
import json

utilisateur = {"nom": "Léa", "notes": [15, 12, 18]}   # un dict Python "normal"

texte = json.dumps(utilisateur, ensure_ascii=False)   # '{"nom": "Léa", "notes": [15, 12, 18]}' -> texte JSON
objet = json.loads(texte)                             # objet Python, redécodé depuis le texte (== utilisateur)
```

| Fonction | Entrée | Sortie |
|---|---|---|
| `json.dumps(objet)` | objet Python (dict, list...) | texte JSON (`str`) |
| `json.loads(texte)` | texte JSON (`str`) | objet Python |
| `json.dump(objet, fichier)` | objet Python + fichier déjà ouvert | rien : écrit directement dans `fichier` |
| `json.load(fichier)` | fichier déjà ouvert | objet Python, lu directement |

> **Note :** sans `ensure_ascii=False` (comportement par défaut), un caractère accentué comme « é » est échappé en notation Unicode `\uXXXX` illisible dans le texte JSON produit (`XXXX` étant son code hexadécimal). `ensure_ascii=False` le garde tel quel ; `json.loads()` redécode les deux formes de façon identique.

### Le format « JSON Lines » : ajouter des entrées sans réécrire tout le fichier

Un fichier JSON classique contient un seul objet ou tableau racine : ajouter une entrée oblige à relire le fichier entier, le modifier en mémoire, puis le réécrire en entier. Le format **JSON Lines** (extension `.jsonl`) contourne ce problème : chaque LIGNE du fichier est un objet JSON complet et indépendant, pratique pour un fichier qui grossit au fil de l'exécution d'un programme (ex. suivi de progression d'une tâche longue).

```python
with open("etats.jsonl", "a", encoding="utf-8") as f:
    f.write(json.dumps({"id": 1, "status": "ok"}, ensure_ascii=False) + "\n")   # AJOUTE une ligne, sans toucher au reste du fichier
```

```python
with open("etats.jsonl", encoding="utf-8") as f:
    for ligne in f:
        entree = json.loads(ligne)   # chaque ligne se décode indépendamment des autres
        print(entree["id"])
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `pathlib.Path` représente un chemin comme un objet manipulable (`/` pour construire, `.stem`/`.suffix`/`.with_name()` pour décomposer, `.open()` équivalent à `open()`). `shutil.rmtree()` supprime un dossier non vide, ce que `Path.rmdir()` refuse. `csv.DictReader` lit un CSV en dicts nommés par en-tête, `csv.reader` en listes positionnelles. `json.dumps`/`loads` convertissent objet Python et texte JSON dans les deux sens ; le format JSON Lines (une ligne = un objet) permet d'ajouter des entrées sans réécrire tout le fichier. |
| **Outils utilisables** | `Path()`, `.exists()`/`.is_file()`/`.is_dir()`/`.open()`, `.with_name()`/`.with_suffix()`, `shutil.rmtree()`/`.copy()`/`.move()`, `csv.reader`/`DictReader`/`writer`/`DictWriter`, `json.dumps`/`loads`/`dump`/`load`. |
| **Pièges à éviter** | `.with_name()` remplace le dernier segment du chemin là où `/` en ajoute un nouveau. `shutil.rmtree(ignore_errors=True)` rend un échec silencieux. Oublier `newline=""` avec `csv` peut casser des valeurs multi-lignes entre guillemets. Oublier `ensure_ascii=False` rend les accents illisibles dans le JSON produit (sans casser `json.loads()`). |
| **Bonnes pratiques** | Vérifier `dossier.exists()` après un `rmtree(ignore_errors=True)` plutôt que de supposer le succès. Préférer `DictReader`/`DictWriter` à un accès par index dès qu'un CSV a des en-têtes. Utiliser le JSON Lines pour un fichier d'état qui grossit au fil de l'exécution, un fichier JSON classique pour un objet figé. |
