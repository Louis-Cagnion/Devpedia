---
order: 9
---

# Redirections et pipes

PowerShell reprend les mêmes idées que Bash — rediriger un flux vers un fichier, chaîner des commandes via un pipe — mais avec une différence fondamentale : un pipe Bash transporte du **texte**, un pipe PowerShell transporte de véritables **objets .NET**, avec leurs propriétés et méthodes intactes.

## Rediriger la sortie vers un fichier

```powershell
"Bonjour" > fichier.txt     # écrase fichier.txt (ou le crée) avec ce contenu
"Encore" >> fichier.txt      # ajoute à la fin de fichier.txt, sans écraser
```

> **Note :** comme en Bash, `>` écrase silencieusement le contenu existant — utiliser `>>` quand l'ajout est réellement voulu.

## Rediriger l'entrée depuis un fichier

```powershell
Get-Content liste.txt | Sort-Object   # PowerShell n'a pas d'opérateur "<" direct : on passe par une cmdlet
```

> **Note :** contrairement à Bash (`sort < liste.txt`), PowerShell n'a pas de véritable redirection d'entrée standard — la convention est de produire le contenu du fichier via une cmdlet (`Get-Content`) puis de l'envoyer dans le pipeline.

## Rediriger la sortie d'erreur

Les flux sont numérotés différemment de Bash : `1` = sortie standard, `2` = erreur, mais aussi `3` (avertissement), `4` (verbeux), `5` (débogage), `6` (information) — PowerShell distingue plus de flux que les trois d'Unix :

```powershell
Commande-QuiEchoue 2> erreurs.log         # seule la sortie d'erreur va dans erreurs.log
Commande 1> sortie.log 2> erreurs.log     # sépare sortie normale et erreurs dans deux fichiers
Commande *> tout.log                       # raccourci PowerShell : redirige TOUS les flux vers tout.log
```

> **Note :** `*>` n'a pas d'équivalent direct en Bash (qui n'a que `&>` pour stdout+stderr) — PowerShell peut regrouper jusqu'à six flux distincts en une seule redirection.

## `$null` : ignorer une sortie

Rôle équivalent à `/dev/null` sous Unix :

```powershell
Commande-Bruyante > $null 2>&1   # ignore toute sortie normale ET toute erreur
```

## Les pipes (`|`) : chaîner des commandes, avec de vrais objets

```powershell
Get-ChildItem | Where-Object { $_.Extension -eq ".txt" }     # filtre par propriété, pas par texte
Select-String "404" access.log | Measure-Object | Select-Object -ExpandProperty Count
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5     # les 5 processus les plus gourmands
```

> **Note :** `Where-Object { $_.Extension -eq ".txt" }` filtre sur une vraie propriété de l'objet fichier, alors que `grep ".txt"` en Bash ne fait que chercher le texte ".txt" n'importe où dans la ligne — un fichier nommé `rapport.txt.bak` correspondrait à `grep` mais pas à `-eq ".txt"`, plus précis.

## `Tee-Object` : rediriger tout en gardant un affichage

Équivalent direct de `tee` en Bash :

```powershell
Get-ChildItem | Tee-Object -FilePath resultats.txt   # affiche le résultat ET l'enregistre dans un fichier
```

## Résumé des symboles

| Symbole | Effet |
|---|---|
| `>` | Redirige la sortie standard, écrase le fichier |
| `>>` | Redirige la sortie standard, ajoute à la fin |
| `2>` | Redirige la sortie d'erreur |
| `*>` | Redirige tous les flux vers la même cible |
| `\|` | Connecte la sortie (des objets) d'une commande à l'entrée de la suivante |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un pipe PowerShell transporte de vrais objets .NET (propriétés et méthodes intactes), pas du texte comme un pipe Bash — `Where-Object`/`Select-Object` filtrent sur de vraies propriétés. |
| **Outils utilisables** | `>`/`>>`, `*>` (tous les flux), `$null` (équivalent de `/dev/null`), `Tee-Object`. |
| **Pièges à éviter** | Chercher un opérateur `<` de redirection d'entrée — PowerShell n'en a pas, il faut passer par une cmdlet (`Get-Content`). |
| **Bonnes pratiques** | Filtrer sur une propriété réelle (`Where-Object { $_.Extension -eq ".txt" }`) plutôt que de reproduire un filtrage texte à la Bash. |
