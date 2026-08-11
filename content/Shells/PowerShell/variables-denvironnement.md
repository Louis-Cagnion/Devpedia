---
order: 4
---

# Variables d'environnement

Comme en Bash, une variable d'environnement est transmise automatiquement aux processus enfants, mais PowerShell y accède via un espace de noms dédié (`$env:`), distinct de ses variables classiques, plutôt qu'une simple convention (`export`) appliquée à une variable normale.

## Lire et modifier une variable d'environnement

```powershell
$env:NOM = "Jean"          # crée ou modifie une variable d'environnement directement
Write-Output $env:NOM       # Jean
```

```powershell
# sous_script.ps1
Write-Output $env:NOM    # affiche "Jean" si NOM a été défini par le processus appelant, vide sinon
```

> **Note :** comme pour `export` en Bash, la transmission ne fonctionne que du parent vers l'enfant : un sous-script qui modifie `$env:NOM` ne répercute jamais ce changement vers le script qui l'a lancé, chaque processus ayant sa propre copie de l'environnement.

## Variables d'environnement courantes

```powershell
$env:PATH     # liste des dossiers où PowerShell cherche les exécutables (séparés par ";" sous Windows)
$env:USERPROFILE   # dossier personnel de l'utilisateur courant (équivalent de $HOME)
$env:USERNAME  # nom de l'utilisateur courant
$env:COMPUTERNAME  # nom de la machine
```

## `$env:PATH` : comment PowerShell trouve une commande

Comme en Bash, PowerShell cherche un exécutable dans chacun des dossiers listés dans `$env:PATH` :

```powershell
$env:PATH
# C:\Windows\system32;C:\Windows;C:\Program Files\PowerShell\7

$env:PATH += ";C:\mon\dossier\scripts"   # ajoute un dossier supplémentaire à la recherche
```

> **Note :** sous Windows, les dossiers de `$env:PATH` sont séparés par `;`, contrairement à `:` sous Unix, une différence à garder en tête en portant un script d'un système à l'autre.

## Fichiers de configuration (profils)

| Fichier | Portée |
|---|---|
| `$PROFILE` (CurrentUserCurrentHost) | Utilisateur courant, PowerShell (Core) uniquement |
| Profil "AllUsersAllHosts" | Tous les utilisateurs de la machine |

```powershell
$PROFILE   # affiche le chemin du profil courant (à créer s'il n'existe pas encore)
```

C'est dans ce profil que sont typiquement ajoutés les modifications de `$env:PATH`, les alias personnalisés, ou des fonctions destinées à être disponibles dans chaque nouvelle session.

## `Set-Alias` : raccourcir des commandes fréquentes

```powershell
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name gs -Value "git status"

ll   # équivalent à taper "Get-ChildItem"
```

Un alias défini directement dans la console ne survit pas à sa fermeture : pour qu'il soit disponible à chaque nouvelle session, il doit être ajouté dans `$PROFILE`.

## `. $PROFILE` : recharger le profil

Après une modification du profil, le "dot sourcing" applique les changements dans la session courante, sans avoir à ouvrir une nouvelle console :

```powershell
. $PROFILE
```

Ce `.` initial (identique à celui utilisé pour [`source` en Bash](/?c=shells&s=bash&p=variables-denvironnement)) exécute le script dans le contexte de la session courante plutôt que dans un sous-processus isolé : sans lui, les fonctions et variables définies dans le fichier disparaîtraient dès la fin de son exécution.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une variable d'environnement PowerShell vit dans l'espace de noms `$env:`, distinct des variables classiques, la transmission aux processus enfants ne fonctionne que du parent vers l'enfant, comme `export` en Bash. |
| **Outils utilisables** | `$env:PATH`, `$PROFILE`, `Set-Alias`, le dot sourcing (`. $PROFILE`). |
| **Pièges à éviter** | Oublier que `;` sépare les dossiers de `$env:PATH` sous Windows, contrairement à `:` sous Unix. |
| **Bonnes pratiques** | Placer les modifications de `$env:PATH` et les alias dans `$PROFILE` pour qu'ils soient disponibles à chaque nouvelle session. |
