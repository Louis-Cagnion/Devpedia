---
order: 6
---

# Les boucles

PowerShell propose les mêmes structures de base que Bash (`for`, `while`, jusqu'à une condition), plus une boucle `foreach` dédiée au parcours d'objets — la plus utilisée en pratique, puisque presque tout en PowerShell est une collection d'objets plutôt que du texte brut.

## La boucle `foreach` (parcours de collection)

```powershell
foreach ($fruit in "pomme", "banane", "cerise") {
    Write-Output $fruit
}
```

Parcourir les fichiers d'un dossier :

```powershell
foreach ($fichier in Get-ChildItem -Filter "*.txt") {
    Write-Output "Traitement de $($fichier.Name)"
}
```

Parcourir une plage de nombres :

```powershell
foreach ($i in 1..5) {
    Write-Output $i
}
```

## `ForEach-Object` : la même idée, mais via le pipeline

Contrairement à `foreach` (un mot-clé du langage), `ForEach-Object` est une cmdlet qui reçoit ses éléments **via le pipeline** (cf. chapitre sur les redirections et pipes) — la forme la plus idiomatique en PowerShell pour enchaîner un traitement après une autre commande :

```powershell
Get-ChildItem -Filter "*.txt" | ForEach-Object {
    Write-Output "Traitement de $($_.Name)"
}
```

`$_` désigne l'élément courant du pipeline à l'intérieur du bloc — un rôle proche de celui que joue implicitement la variable de boucle d'un `foreach` classique.

## La boucle `for` de style C

```powershell
for ($i = 0; $i -lt 5; $i++) {
    Write-Output $i
}
```

## La boucle `while`

Le bloc s'exécute tant que la condition reste vraie (testée **avant** chaque tour) :

```powershell
$i = 0

while ($i -lt 5) {
    Write-Output $i
    $i++
}
```

### Lire un fichier ligne par ligne

```powershell
Get-Content "fichier.txt" | ForEach-Object {
    Write-Output "Ligne lue : $_"
}
```

Contrairement à Bash (`while read -r ligne`), lire un fichier ligne par ligne passe naturellement par le pipeline : `Get-Content` produit une collection de lignes, `ForEach-Object` (ou `foreach`) la parcourt — pas de redirection d'entrée standard nécessaire.

## La boucle `do`/`while` et `do`/`until`

Contrairement à `while` (condition testée avant), le bloc `do` s'exécute toujours **au moins une fois**, la condition n'étant testée qu'après le premier tour :

```powershell
$i = 0

do {
    Write-Output $i
    $i++
} while ($i -lt 5)
```

```powershell
$i = 0

do {
    Write-Output $i
    $i++
} until ($i -ge 5)
```

`do {...} until (...)` est l'équivalent PowerShell direct du `until` de Bash (bloc répété tant que la condition reste fausse) — la seule différence étant la garantie d'au moins un passage, absente du `while`/`until` de Bash.

## `break` et `continue`

Fonctionnent comme dans la plupart des langages, y compris à l'intérieur d'un `ForEach-Object` :

```powershell
foreach ($i in 1..10) {
    if ($i -eq 5) {
        break
    }
    if ($i % 2 -eq 0) {
        continue
    }
    Write-Output $i
}
```
