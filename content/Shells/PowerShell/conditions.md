---
order: 5
---

# Les conditions

Contrairement à Bash, où une condition passe par le code de sortie d'une commande de test (`[`, `[[`), PowerShell a de vrais **opérateurs de comparaison intégrés au langage**, comme en PHP ou en C.

## `if` / `elseif` / `else`

```powershell
$age = 18

if ($age -ge 18) {
    Write-Output "Vous êtes majeur."
} else {
    Write-Output "Vous êtes mineur."
}
```

- Les blocs sont délimités par des accolades `{ }`, comme en C/PHP/JavaScript, pas par des mots-clés de fermeture (`fi`).
- La condition entre parenthèses est une véritable expression booléenne, pas l'appel d'une commande externe comme le `[` de Bash.

## Les opérateurs de comparaison

Contrairement à Bash, un seul jeu d'opérateurs sert aussi bien pour les nombres que pour les chaînes : pas de distinction `-eq`/`==` selon le type comparé :

```powershell
if ($age -eq 18) { Write-Output "Exactement 18" }
```

| Opérateur | Signification |
|---|---|
| `-eq` | Égal |
| `-ne` | Différent |
| `-lt` | Inférieur |
| `-le` | Inférieur ou égal |
| `-gt` | Supérieur |
| `-ge` | Supérieur ou égal |

> **Note :** ces opérateurs restent des mots-clés PowerShell (`-eq`, pas `==`) même si la syntaxe rappelle les drapeaux Bash : `==` n'existe pas comme opérateur de comparaison en PowerShell.

## Comparer des chaînes

```powershell
$nom = "Jean"

if ($nom -eq "Jean") {
    Write-Output "Bonjour Jean"
}

if ([string]::IsNullOrEmpty($nom)) {
    Write-Output "nom est vide"
}
```

| Opérateur | Signification |
|---|---|
| `-eq` / `-ne` | Égalité / différence, **sensible à la casse par défaut avec `-ceq`**, insensible sinon |
| `-like` | Correspondance avec un motif type joker (`*`, `?`) |
| `-match` | Correspondance avec une expression régulière |

> **Note :** `-eq` sur des chaînes est insensible à la casse par défaut (`"Jean" -eq "jean"` est vrai) ; préfixer par `c` (`-ceq`, `-clike`, `-cmatch`) force une comparaison sensible à la casse, l'inverse de la plupart des langages où la casse compte par défaut.

## Tester des fichiers

```powershell
if (Test-Path "config.txt" -PathType Leaf) {
    Write-Output "Le fichier existe"
}

if (Test-Path "C:\var\www" -PathType Container) {
    Write-Output "Le dossier existe"
}
```

`Test-Path` remplace à lui seul tous les tests de fichiers de Bash (`-f`, `-d`, `-e`) : `-PathType Leaf` pour un fichier, `-PathType Container` pour un dossier, aucun argument pour "existe, peu importe le type".

## Combiner des conditions

```powershell
if ((Test-Path "config.txt") -and (Get-Item "config.txt").Length -gt 0) {
    Write-Output "Le fichier existe et n'est pas vide"
}
```

`-and`/`-or`/`-not` remplacent respectivement `&&`/`||`/`!` de Bash : les opérateurs symboliques n'existent pas pour la logique booléenne en PowerShell.

## Le `switch` (équivalent du `case` de Bash)

```powershell
$jour = "mer"

switch ($jour) {
    { $_ -in "lun", "mar", "mer", "jeu", "ven" } { Write-Output "Jour de semaine" }
    { $_ -in "sam", "dim" } { Write-Output "Week-end" }
    default { Write-Output "Jour inconnu" }
}
```

`$_` désigne la valeur testée (celle passée entre parenthèses à `switch`), `-in` teste son appartenance à une liste, et `default` capture tout le reste : équivalent du `*)` final d'un `case` Bash.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | PowerShell a de vrais opérateurs de comparaison intégrés au langage (`-eq`, `-lt`...), contrairement à Bash qui s'appuie sur des commandes de test. Un seul jeu d'opérateurs sert pour les nombres et les chaînes. |
| **Outils utilisables** | `Test-Path` (remplace `-f`/`-d`/`-e` de Bash), `-and`/`-or`/`-not`, `-like`/`-match`. |
| **Pièges à éviter** | Oublier que `-eq` sur des chaînes est insensible à la casse par défaut : `-ceq` force la sensibilité à la casse. |
| **Bonnes pratiques** | Utiliser `Test-Path -PathType Leaf/Container` pour distinguer explicitement un fichier d'un dossier. |
