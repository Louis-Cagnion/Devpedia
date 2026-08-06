---
order: 6
---

# Les boucles

Bash propose trois structures de boucle (`for`, `while`, `until`), utilisées aussi bien pour répéter des commandes que pour parcourir des listes de fichiers, de lignes ou de résultats de commande.

## La boucle `for` (parcours de liste)

```bash
for fruit in pomme banane cerise; do
    echo "$fruit"
done
```

Parcourir les fichiers d'un dossier grâce au globbing (cf. chapitre sur l'expansion) :

```bash
for fichier in *.txt; do
    echo "Traitement de $fichier"
done
```

Parcourir une plage de nombres :

```bash
for i in {1..5}; do
    echo "$i"
done
```

## La boucle `for` de style C

```bash
for ((i = 0; i < 5; i++)); do
    echo "$i"
done
```

## La boucle `while`

Le bloc s'exécute tant que la condition reste vraie (testée **avant** chaque tour) :

```bash
i=0

while [ $i -lt 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

### Lire un fichier ligne par ligne

Le combo le plus courant en scripting Bash pour traiter un fichier texte :

```bash
while read -r ligne; do
    echo "Ligne lue : $ligne"
done < fichier.txt
```

- `read -r` lit une ligne de l'entrée standard dans la variable `ligne` à chaque tour (`-r` empêche l'interprétation des `\` comme caractères d'échappement, presque toujours ce qu'on veut).
- `< fichier.txt` redirige le contenu du fichier vers l'entrée standard de toute la boucle (cf. chapitre sur les redirections).

## La boucle `until`

Symétrique de `while` : le bloc s'exécute tant que la condition reste **fausse**, jusqu'à ce qu'elle devienne vraie :

```bash
i=0

until [ $i -ge 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

`until [ $i -ge 5 ]` équivaut exactement à `while [ $i -lt 5 ]` — le choix entre les deux est une question de lisibilité selon la condition qu'on souhaite exprimer naturellement.

## `break` et `continue`

Fonctionnent comme dans la plupart des langages :

```bash
for i in {1..10}; do
    if [ $i -eq 5 ]; then
        break
    fi
    if [ $((i % 2)) -eq 0 ]; then
        continue
    fi
    echo "$i"
done
```
