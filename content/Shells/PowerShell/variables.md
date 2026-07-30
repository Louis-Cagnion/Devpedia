---
order: 2
---

# Les variables

Contrairement à Bash, où tout est manipulé comme du texte, une variable PowerShell conserve le **vrai type** de sa valeur — un nombre reste un nombre, une liste reste une liste d'objets, sans conversion implicite en chaîne. Toute variable commence par `$`, y compris à l'assignation (pas de règle "sans `$` pour écrire, avec `$` pour lire" comme en Bash).

## Déclarer et lire une variable

```powershell
$nom = "Jean"          # pas de règle stricte sur les espaces autour du '=', contrairement à Bash
Write-Output $nom       # Jean
Write-Output "Bonjour $nom !"   # Bonjour Jean ! -> interpolation directe dans une chaîne double-guillemets
```

> **Note :** `$nom` seul (sans `Write-Output`) affiche aussi sa valeur dans la console — PowerShell affiche automatiquement le résultat de toute expression qui n'est pas explicitement assignée ou supprimée, un comportement proche d'un REPL.

## Guillemets simples vs doubles

```powershell
$nom = "Jean"

Write-Output "Bonjour $nom"    # Bonjour Jean -> les guillemets doubles interprètent les variables
Write-Output 'Bonjour $nom'    # Bonjour $nom -> les guillemets simples désactivent toute interprétation
```

Pour insérer une propriété ou le résultat d'une expression (pas seulement une variable simple), il faut l'entourer de `$(...)` à l'intérieur des guillemets doubles :

```powershell
$utilisateur = Get-Process | Select-Object -First 1
Write-Output "Premier processus : $($utilisateur.Name)"
```

> **Note :** sans `$(...)`, `"$utilisateur.Name"` afficherait la représentation texte de l'objet suivie littéralement de `.Name` — PowerShell n'interprète l'accès à une propriété à l'intérieur d'une chaîne que si l'expression entière est explicitement délimitée.

## Typage

Une variable peut être typée explicitement, ou laissée à son type déduit automatiquement :

```powershell
[int]$age = 25
[string]$nom = "Jean"
$score = 19.5   # type déduit : Double

$age.GetType().Name   # Int32
```

> **Note :** contrairement à Bash où `age="abc"` ne provoque aucune erreur immédiate (la valeur reste une chaîne, l'erreur n'apparaît qu'au moment d'un calcul), assigner `"abc"` à une variable typée `[int]$age` échoue immédiatement — PowerShell vérifie le type à l'assignation, pas seulement à l'usage.

## Arithmétique

Aucun contexte arithmétique explicite n'est nécessaire — les opérateurs fonctionnent nativement sur les nombres, y compris décimaux :

```powershell
$a = 5
$b = 3

Write-Output ($a + $b)   # 8
Write-Output ($a * $b)   # 15
Write-Output ($a / $b)   # 1.66666666666667 -> division réelle, pas entière comme en Bash
```

## Variables automatiques

PowerShell fournit des variables automatiques toujours disponibles, jouant un rôle proche des variables spéciales de Bash (`$0`, `$1`...) — voir le tableau et les exemples dans le chapitre sur l'écriture de scripts, juste après la section sur les arguments d'un script.

## Portée des variables

Par défaut, une variable déclarée dans une fonction reste locale à cette fonction — l'inverse de Bash, où une variable de fonction est globale par défaut sauf `local` explicite :

```powershell
function Compter {
    $total = 0   # locale à Compter par défaut
    $total = $total + 1
    Write-Output $total
}

Compter
Write-Output $total   # vide : $total n'existe pas en dehors de la fonction
```

Pour modifier explicitement une variable d'un contexte englobant (l'équivalent inverse d'un `local` Bash), on préfixe son nom par une portée :

```powershell
$total = 0

function Incrementer {
    $script:total = $script:total + 1   # modifie explicitement la variable du script appelant
}

Incrementer
Write-Output $total   # 1
```

Voir aussi le chapitre sur les fonctions, et celui sur les variables d'environnement (`$env:`) pour partager une valeur avec des processus enfants.
