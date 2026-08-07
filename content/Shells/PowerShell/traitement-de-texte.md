---
order: 10
---

# Traitement de texte et d'objets

Là où Bash s'appuie sur des [outils texte spécialisés](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`), PowerShell fait le même travail avec des cmdlets génériques qui filtrent, transforment et sélectionnent des **objets** — le texte n'est qu'un cas particulier, celui où l'objet manipulé est une chaîne.

## `Select-String` : rechercher du texte (équivalent de `grep`)

```powershell
Select-String "erreur" fichier.log            # affiche les lignes contenant "erreur"
Select-String -CaseSensitive "Erreur" fichier.log   # sensible à la casse (l'inverse du défaut)
Select-String -NotMatch "erreur" fichier.log   # inverse : lignes qui NE contiennent PAS "erreur"
Select-String "TODO" -Path .\* -Recurse         # recherche récursive dans tous les fichiers d'un dossier
Select-String "erreur" fichier.log | Measure-Object   # compte les lignes correspondantes
Select-String -Pattern "erreur|warning" fichier.log   # motif = une vraie regex .NET par défaut
```

> **Note :** contrairement à `grep` où `-E` doit être ajouté pour activer les regex étendues, `Select-String` interprète son motif comme une regex **par défaut** — utiliser `-SimpleMatch` pour revenir à une recherche de texte littéral, l'inverse de la convention Bash.

Chaque résultat est un objet avec des propriétés exploitables directement, plutôt qu'une simple ligne de texte à reparser :

```powershell
Select-String "erreur" fichier.log | Select-Object LineNumber, Line
```

## `-replace` : rechercher et remplacer (équivalent de `sed`)

```powershell
(Get-Content fichier.txt) -replace "ancien", "nouveau"          # remplace toutes les occurrences par ligne
(Get-Content fichier.txt) -replace "ancien", "nouveau" | Set-Content fichier.txt   # modifie le fichier
```

> **Note :** `-replace` remplace **toutes** les occurrences par défaut (l'inverse de `sed 's///'`  sans `g`, qui ne remplace que la première) — pas de drapeau équivalent au `g` de `sed` à ajouter, ce comportement est celui par défaut.

Pour ne traiter que certaines lignes (équivalent d'une adresse `sed '2,4s///'`), on filtre explicitement par index :

```powershell
(Get-Content fichier.txt)[1..3] -replace "ancien", "nouveau"   # lignes 2 à 4 (index 0-based)
```

## `ConvertFrom-Csv`, `ConvertFrom-Json` : traiter des données structurées (équivalent d'`awk`)

Là où `awk` découpe manuellement une ligne en champs (`$1`, `$2`...), PowerShell convertit directement un format structuré en objets typés :

```powershell
Import-Csv donnees.csv | Select-Object Nom, Age    # colonnes accessibles par leur nom, pas par position
Get-Content donnees.json | ConvertFrom-Json | Select-Object -ExpandProperty utilisateur
```

Pour un texte non structuré proche de l'usage d'`awk` (découpage par espaces), `-split` reste disponible :

```powershell
("Jean Dupont 25" -split " ")[0]     # Jean -> premier champ
```

## `Sort-Object` et `Get-Unique`/`-Unique` : trier et dédupliquer

```powershell
Get-Content fichier.txt | Sort-Object                     # tri alphabétique
Get-Content nombres.txt | Sort-Object { [int]$_ }          # tri numérique explicite
Get-Content fichier.txt | Sort-Object -Descending          # tri décroissant
Get-Content fichier.txt | Sort-Object -Unique               # trie ET déduplique en une seule étape
Get-Content fichier.txt | Group-Object | Sort-Object Count -Descending   # compte les occurrences
```

> **Note :** contrairement à `uniq` en Bash (qui ne détecte que des doublons **adjacents**, d'où l'obligation de trier avant), `Sort-Object -Unique` et `Group-Object` fonctionnent sur l'ensemble de la collection, peu importe l'ordre initial — pas besoin de trier au préalable pour dédupliquer correctement.

## `Measure-Object` : compter (équivalent de `wc`)

```powershell
(Get-Content fichier.txt | Measure-Object -Line).Lines    # nombre de lignes
(Get-Content fichier.txt | Measure-Object -Word).Words     # nombre de mots
(Get-Content fichier.txt | Measure-Object -Character).Characters   # nombre de caractères
```

## Combiner ces outils

```powershell
Select-String "404" access.log |
    ForEach-Object { ($_.Line -split " ")[0] } |
    Group-Object |
    Sort-Object Count -Descending
# 1) garde les lignes d'erreur 404
# 2) extrait l'adresse IP (1er champ de chaque ligne)
# 3) regroupe les IP identiques
# 4) trie par nombre d'occurrences décroissant -> les IP les plus fréquentes en premier
```

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | PowerShell traite le texte comme un cas particulier d'objet : `Select-String` (grep), `-replace` (sed), `ConvertFrom-Csv`/`Json` (awk sur des données structurées) manipulent des objets typés, pas juste des lignes. |
| **Outils utilisables** | `Select-String`, `-replace`, `-split`, `Sort-Object -Unique`, `Group-Object`, `Measure-Object`. |
| **Pièges à éviter** | Oublier que `Select-String` interprète son motif comme une regex par défaut (contrairement à `grep`, qui demande `-E`). |
| **Bonnes pratiques** | Utiliser `Sort-Object -Unique`/`Group-Object` plutôt qu'un tri manuel suivi d'une déduplication — fonctionnent sur toute la collection, sans ordre préalable requis. |
