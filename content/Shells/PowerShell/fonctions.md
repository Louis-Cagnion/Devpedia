---
order: 7
---

# Les fonctions

Contrairement à Bash, où une fonction reçoit ses arguments exactement comme un script (`$1`, `$2`, sans nom), une fonction PowerShell déclare de vrais **paramètres nommés et typés** via `param()`, comme en PHP ou en C.

## Déclarer et appeler une fonction

```powershell
function Saluer {
    param([string]$Nom)
    Write-Output "Bonjour $Nom !"
}

Saluer -Nom "Jean"   # Bonjour Jean !
Saluer "Jean"         # fonctionne aussi : PowerShell accepte un argument positionnel si le nom est omis
```

> **Convention de nommage :** les cmdlets et fonctions PowerShell suivent la casse `Verb-Nom` (`Get-ChildItem`, `Saluer` ici en simplifié) — un ensemble de verbes standard (`Get`, `Set`, `New`, `Remove`...) est même imposé par convention pour les cmdlets officielles, afin qu'un même verbe se comporte de façon prévisible d'une commande à l'autre.

## Les paramètres d'une fonction

```powershell
function Resumer {
    param(
        [string]$Nom,
        [string]$Prenom
    )
    Write-Output "Nom de la fonction : $($MyInvocation.MyCommand.Name)"
    Write-Output "Premier paramètre : $Nom"
    Write-Output "Tous les arguments non déclarés : $args"
}

Resumer -Nom "Dupont" -Prenom "Jean"
```

> **Note :** contrairement à Bash où `$1`, `$2` sont purement positionnels, l'appel `-Nom "Dupont" -Prenom "Jean"` reste correct même dans le désordre (`-Prenom "Jean" -Nom "Dupont"`) — les paramètres sont associés par leur nom, pas par leur position, ce qui explique pourquoi la casse `Verb-Nom` insiste autant sur des noms de paramètres clairs.

## De vraies valeurs de retour

Contrairement à Bash, où `return` ne fixe qu'un code de sortie (0-255), `return` en PowerShell peut renvoyer une **vraie valeur** de n'importe quel type :

```powershell
function EstPair {
    param([int]$Nombre)
    return ($Nombre % 2 -eq 0)   # renvoie $true ou $false, un vrai booléen
}

if (EstPair -Nombre 4) {
    Write-Output "4 est pair"
}
```

## "Renvoyer" une donnée : la sortie non capturée du pipeline

En pratique, `return` est même optionnel : **toute sortie non assignée** dans le corps d'une fonction devient sa valeur de retour, exactement comme la dernière expression évaluée d'un bloc — une différence importante avec Bash, où `echo` sert uniquement à afficher, jamais à "retourner" au sens strict :

```powershell
function Addition {
    param([int]$A, [int]$B)
    $A + $B   # cette ligne, non assignée, devient la valeur de retour de la fonction
}

$resultat = Addition -A 4 -B 6
Write-Output "Résultat : $resultat"   # Résultat : 10
```

> **Note :** contrairement à Bash où `echo` à l'intérieur d'une fonction sert *uniquement* à afficher (la capture via `$(...)` est une convention côté appelant, pas un vrai mécanisme de retour), toute ligne PowerShell dont le résultat n'est ni assigné ni supprimé (avec `[void]` ou `Out-Null`) s'ajoute à la valeur de retour de la fonction — un `Write-Output` de débogage oublié dans une fonction peut ainsi polluer silencieusement ce qu'elle renvoie.

## Portée des variables

Contrairement à Bash (variable globale par défaut sauf `local`), une variable assignée dans une fonction PowerShell reste locale à cette fonction par défaut :

```powershell
function Calculer {
    param([int]$Nombre)
    $resultat = $Nombre * 2   # locale à Calculer(), pas besoin d'un mot-clé "local"
    return $resultat
}
```

Voir aussi le chapitre sur les variables (portée `$script:`, déjà réutilisée ici dans le contexte des fonctions).
