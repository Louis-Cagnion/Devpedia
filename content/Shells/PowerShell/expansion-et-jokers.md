---
order: 8
---

# Expansion et jokers (wildcards)

PowerShell reprend l'idée du globbing Bash — remplacer un motif par la liste réelle de fichiers correspondants — mais sous un nom différent (*wildcards*) et avec des règles légèrement distinctes, en plus d'un opérateur de correspondance de motif réutilisable en dehors des noms de fichiers.

## Les wildcards : `*`, `?`, `[]`

```powershell
Get-ChildItem *.txt                    # tous les fichiers se terminant par .txt
Get-ChildItem fichier?.txt              # fichier1.txt, fichierA.txt... ('?' = exactement 1 caractère)
Get-ChildItem fichier[123].txt          # fichier1.txt, fichier2.txt ou fichier3.txt uniquement
Get-ChildItem fichier[a-z].txt          # une seule lettre minuscule à cette position
```

| Motif | Signifie |
|---|---|
| `*` | N'importe quelle suite de caractères (y compris vide) |
| `?` | Exactement un caractère, n'importe lequel |
| `[abc]` | Un seul caractère parmi `a`, `b` ou `c` |
| `[a-z]` | Un seul caractère dans cette plage |

> **Note :** comme le globbing Bash, ce n'est **pas** une [regex](/?c=domain-specific-languages-dsl&p=regex) — ces motifs ne sont interprétés de cette façon que par les cmdlets qui l'annoncent explicitement (`Get-ChildItem`, `-like`), pas par PowerShell lui-même à l'échelle de la ligne entière comme le fait Bash avant d'exécuter quoi que ce soit.

## `-like` : appliquer un wildcard à une chaîne quelconque

Contrairement à Bash, où le globbing ne s'applique qu'aux noms de fichiers réels sur le disque, `-like` applique les mêmes motifs à n'importe quelle chaîne :

```powershell
if ("fichier1.txt" -like "fichier?.txt") {
    Write-Output "Correspond"
}

"Jean", "Julie", "Marc" | Where-Object { $_ -like "J*" }
# Jean
# Julie
```

## Que se passe-t-il si aucun fichier ne correspond ?

```powershell
Get-ChildItem *.xyz
# si aucun fichier .xyz n'existe, la commande ne renvoie rien -> pas d'erreur silencieuse comme en Bash
```

> **Note :** c'est une différence importante avec Bash, où `echo *.xyz` affiche littéralement le texte `*.xyz` si rien ne correspond — PowerShell, lui, résout toujours le motif en une vraie liste (éventuellement vide), jamais en la chaîne brute du motif non résolu.

## L'expansion de plage (`..`)

Équivalent le plus proche de l'expansion d'accolades `{1..5}` de Bash, mais limité aux plages numériques :

```powershell
1..5
# 1 2 3 4 5

foreach ($n in 'a'[0]..'e'[0]) { [char]$n }
# a b c d e -> plus verbeux qu'en Bash, PowerShell n'a pas d'équivalent direct de {a..e}
```

Pour générer plusieurs chemins à la fois (équivalent de `fichier{1,2,3}.txt` ou `mkdir -p a/{b,c}`), on combine simplement une boucle avec une collection explicite :

```powershell
"src", "tests", "docs" | ForEach-Object { New-Item -ItemType Directory -Path "projet\$_" }
```

## L'expansion du tilde (`~`)

```powershell
Set-Location ~              # équivalent à Set-Location $HOME
Set-Location ~\projets        # équivalent à Set-Location $HOME\projets
```

## Empêcher l'expansion : les guillemets simples

```powershell
Write-Output *.txt      # PowerShell tente de résoudre le motif selon le contexte de la commande
Write-Output '*.txt'     # affiche littéralement *.txt -> les guillemets simples désactivent l'interprétation
```

> **Note :** contrairement à Bash où `*` est développé par le shell lui-même avant même que la commande ne le reçoive, en PowerShell c'est chaque cmdlet qui décide d'interpréter ou non un wildcard reçu en argument — `Write-Output *.txt` n'affiche donc que le texte `*.txt`, alors que `Get-ChildItem *.txt` le résout bien en liste de fichiers.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les wildcards PowerShell (`*`, `?`, `[]`) ressemblent au globbing Bash, mais ne sont interprétés que par les cmdlets qui l'annoncent explicitement — PowerShell lui-même ne les développe jamais à l'échelle de toute la ligne comme le fait Bash. |
| **Outils utilisables** | `-like` (wildcard sur une chaîne quelconque), l'expansion de plage (`1..5`). |
| **Pièges à éviter** | S'attendre à ce qu'un motif non résolu s'affiche littéralement comme en Bash — PowerShell résout toujours en une vraie liste, éventuellement vide. |
| **Bonnes pratiques** | Utiliser `-like`/`-match` pour appliquer un motif à une chaîne quelconque, pas seulement à des noms de fichiers. |
