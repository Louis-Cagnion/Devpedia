---
order: 1
---

# Commandes de base

Contrairement à Bash, où `cd`, `ls` ou `cp` sont des noms courts déjà familiers pour beaucoup, les cmdlets PowerShell suivent la convention `Verbe-Nom` (`Set-Location`, `Get-ChildItem`, `Copy-Item`) — plus longues, mais explicites et prévisibles une fois le verbe compris (voir le tableau des verbes standards dans le chapitre sur les fonctions). Ce chapitre couvre les commandes utilisées en premier dans un terminal, avant même d'écrire le moindre script : se déplacer, lister, lire un fichier, et trouver de l'aide sur une commande inconnue.

## Se déplacer : `Set-Location` et `Get-Location`

```powershell
Get-Location                   # affiche le dossier courant, équivalent de "pwd"
Set-Location C:\Users\Jean      # se déplace dans ce dossier, équivalent de "cd"
Set-Location ..                  # remonte d'un niveau
Set-Location -                   # retourne au dossier précédent
```

## Lister un dossier : `Get-ChildItem`

```powershell
Get-ChildItem                    # liste le contenu du dossier courant
Get-ChildItem -Force              # inclut les fichiers et dossiers cachés
Get-ChildItem -Path C:\logs        # liste un dossier précis sans s'y déplacer
```

> **Note :** `Get-ChildItem` fait aussi le travail de `find` dès qu'on ajoute `-Recurse` — voir le chapitre sur les permissions pour cet usage, ainsi que pour créer, copier, déplacer et supprimer des fichiers/dossiers.

## Lire le contenu d'un fichier : `Get-Content`

```powershell
Get-Content fichier.txt           # affiche tout le fichier, équivalent de "cat"
Get-Content fichier.txt -Tail 5    # les 5 dernières lignes, équivalent de "tail"
Get-Content fichier.txt -Wait       # continue à afficher les lignes ajoutées au fichier, équivalent de "tail -f"
```

Voir le chapitre sur le traitement de texte pour aller plus loin (recherche, remplacement, tri sur le contenu lu par `Get-Content`).

## Alias familiers

PowerShell fournit par défaut des alias vers ces cmdlets, pour rester compatible avec les réflexes Bash et l'invite de commandes Windows :

| Alias | Cmdlet réelle |
|---|---|
| `cd` | `Set-Location` |
| `pwd` | `Get-Location` |
| `ls`, `dir` | `Get-ChildItem` |
| `cat`, `type` | `Get-Content` |
| `cp` | `Copy-Item` |
| `mv` | `Move-Item` |
| `rm`, `del` | `Remove-Item` |
| `cls`, `clear` | `Clear-Host` |

> **Note :** un alias reste une commande PowerShell comme une autre — `cp` accepte les mêmes paramètres que `Copy-Item` (`-Recurse` par exemple), mais pas nécessairement ceux de la commande Unix ou cmd du même nom. Voir le chapitre sur les variables d'environnement pour créer ses propres alias avec `Set-Alias`.

## Obtenir de l'aide : `Get-Help`

Le nom d'une cmdlet ne suffit pas toujours à deviner ses paramètres — `Get-Help` évite d'avoir à chercher en ligne :

```powershell
Get-Help Get-ChildItem             # syntaxe et description générale
Get-Help Get-ChildItem -Examples    # uniquement des exemples d'usage
Get-Help Get-ChildItem -Full         # description complète, tous les paramètres
```

> **Note :** au premier lancement, `Get-Help` peut demander d'exécuter `Update-Help` (télécharge la documentation à jour) — sans réseau disponible, une version minimale déjà installée reste utilisable.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les cmdlets PowerShell suivent la convention `Verbe-Nom` (`Get-ChildItem`, `Set-Location`) — plus longues que les commandes Bash, mais prévisibles une fois le verbe compris. Des alias familiers (`cd`, `ls`, `cat`) restent disponibles. |
| **Outils utilisables** | `Get-Location`/`Set-Location`, `Get-ChildItem`, `Get-Content`, `Get-Help`. |
| **Pièges à éviter** | Supposer qu'un alias (`cp`) accepte exactement les mêmes paramètres que la commande Unix du même nom — il relaie en réalité `Copy-Item`. |
| **Bonnes pratiques** | Utiliser `Get-Help <cmdlet> -Examples` pour découvrir rapidement l'usage d'une commande inconnue. |
