---
order: 2
---

# Écrire et exécuter un script PowerShell

Un script PowerShell est un fichier texte portant l'extension `.ps1`, contenant une suite de commandes (des **cmdlets**) exécutées dans l'ordre, comme si elles avaient été tapées une à une dans la console.

> **Windows PowerShell vs PowerShell (Core)** : *Windows PowerShell* (5.1) est la version historique, livrée avec Windows, limitée à ce système. *PowerShell* (souvent appelé *PowerShell Core*, versions 7+) est la réécriture multiplateforme sur .NET, qui tourne aussi sur Linux et macOS — c'est elle qu'on invoque via `pwsh` plutôt que `powershell`. Ce site couvre cette seconde version, largement compatible avec la première.

## Pas de shebang, mais une politique d'exécution

Windows n'utilise pas de shebang comme Unix (l'extension `.ps1` suffit à identifier le fichier) — mais PowerShell bloque par défaut l'exécution de scripts, pour des raisons de sécurité :

```powershell
Get-ExecutionPolicy   # affiche la politique actuelle, souvent "Restricted" par défaut
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

| Politique | Effet |
|---|---|
| `Restricted` | Aucun script ne peut s'exécuter, seules les commandes interactives fonctionnent |
| `AllSigned` | Seuls les scripts signés numériquement peuvent s'exécuter |
| `RemoteSigned` | Les scripts locaux s'exécutent librement ; ceux téléchargés doivent être signés |
| `Unrestricted` | Tous les scripts s'exécutent, avec un simple avertissement pour ceux téléchargés |

> **Note :** cette politique est propre à Windows (`RemoteSigned` est un choix courant en développement) — sur Linux/macOS avec `pwsh`, elle n'a aucun effet, la sécurité reposant alors sur les permissions du fichier comme pour un script Bash (cf. chapitre sur les permissions).

## Exécuter un script

```powershell
.\script.ps1        # le ".\" est nécessaire même si le dossier courant contient le script
powershell -File script.ps1   # alternative : lancer explicitement l'interpréteur sur le fichier
```

> **Note :** contrairement à Bash, taper simplement `script.ps1` sans préfixe de chemin ne fonctionne jamais, même si le script est exécutable — PowerShell ne cherche jamais dans le dossier courant par défaut, y compris s'il est présent dans `$env:PATH`, pour éviter qu'un fichier malveillant du dossier courant ne soit exécuté par erreur à la place d'une commande système du même nom.

## Les arguments d'un script

```powershell
# script.ps1
param(
    [string]$Nom,
    [int]$Age
)

Write-Output "Bonjour $Nom, tu as $Age ans"
```

```powershell
.\script.ps1 -Nom "Jean" -Age 25
# Bonjour Jean, tu as 25 ans
```

Contrairement à Bash (`$1`, `$2`, positionnels et sans nom), un script PowerShell déclare ses paramètres avec `param()`, chacun typé et nommé — l'ordre d'appel importe alors beaucoup moins, et `-Nom "Jean"` reste lisible même avec de nombreux arguments.

Les arguments non déclarés dans `param()` restent malgré tout accessibles via la variable automatique `$args`, comme un équivalent de `$@` :

```powershell
# script.ps1
Write-Output "Nombre d'arguments : $($args.Count)"
Write-Output "Premier argument : $($args[0])"
```

## Codes de sortie et gestion des erreurs

```powershell
if (-not (Test-Path "config.txt")) {
    Write-Error "Fichier de config manquant"
    exit 1
}

Write-Output "Tout est prêt"
exit 0
```

```powershell
.\script.ps1
if ($LASTEXITCODE -eq 0) {
    Write-Output "Le script a réussi"
}
```

`$LASTEXITCODE` joue le rôle du `$?` de Bash pour une commande externe ou un `exit` explicite. Mais PowerShell a par-dessus un vrai mécanisme d'exceptions : `Write-Error` seul n'interrompt pas l'exécution (elle continue avec la ligne suivante), alors que `throw` lève une exception qui arrête le script — sauf si elle est interceptée par un bloc `try`/`catch`, comme les exceptions du chapitre dédié en PHP.

## Arrêter un script à la première erreur : `$ErrorActionPreference`

Par défaut, une erreur non-fatale (celle de la plupart des cmdlets) n'interrompt pas le script — équivalent du comportement par défaut de Bash sans `set -e` :

```powershell
$ErrorActionPreference = "Stop"   # équivalent de "set -e" : toute erreur devient bloquante

Set-Location "C:\dossier\inexistant"   # si ce dossier n'existe pas, le script s'arrête ici
Write-Output "Cette ligne ne s'exécute jamais si Set-Location a échoué"
```

Voir aussi le chapitre sur la gestion des processus pour ce qui se passe après le lancement d'un script en arrière-plan.
