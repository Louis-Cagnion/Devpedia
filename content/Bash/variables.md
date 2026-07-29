---
order: 2
---

# Les variables

Bash n'a qu'un seul type de données réel : la **chaîne de caractères** — même un nombre est manipulé comme du texte, sauf dans un contexte arithmétique explicite. Les variables ne sont pas typées, et leur syntaxe de déclaration/lecture est particulière : sans `$` à l'assignation, avec `$` à la lecture.

## Déclarer et lire une variable

```bash
nom="Jean"        # aucun espace autour du '=' : "nom = Jean" est une erreur de syntaxe
echo $nom          # Jean
echo "${nom}"       # Jean -> les accolades délimitent explicitement le nom de variable
echo "Bonjour ${nom} !"
```

> **Note :** `nom= "Jean"` (avec un espace après `=`) ne fonctionne **pas** comme attendu : Bash comprend "exécuter la commande `Jean` avec la variable d'environnement `nom` vide", pas "assigner Jean à nom". L'absence totale d'espace autour du `=` est stricte.

## Guillemets simples vs doubles

```bash
nom="Jean"

echo "Bonjour $nom"   # Bonjour Jean -> les guillemets doubles interprètent les variables
echo 'Bonjour $nom'   # Bonjour $nom -> les guillemets simples désactivent toute interprétation
```

> **Note :** toujours entourer une variable de guillemets doubles à l'usage (`"$nom"`), sauf besoin précis du contraire — sans guillemets, une valeur contenant des espaces est découpée en plusieurs mots par Bash, ce qui casse silencieusement de nombreux scripts (`rm $fichier` avec un nom de fichier contenant un espace peut supprimer autre chose que prévu). L'exception la plus courante : à l'intérieur d'un contexte numérique explicite (`[ $i -lt 5 ]`, `$(( i + 1 ))`), Bash ne fait aucun découpage en mots sur la valeur — les guillemets y sont donc inutiles, ce qui explique pourquoi les chapitres sur les conditions et les boucles ne les utilisent pas dans ces cas précis.

## Substitution de commande

Exécute une commande et remplace l'expression par sa sortie :

```bash
date_du_jour=$(date +%Y-%m-%d)
echo "Nous sommes le $date_du_jour"

nombre_fichiers=$(ls | wc -l)
echo "Il y a $nombre_fichiers fichiers ici"
```

`$(...)` est la syntaxe moderne, préférée aux anciens \`backticks\` (`` `date` ``), moins lisibles et impossibles à imbriquer facilement.

## Arithmétique

Bash ne calcule pas nativement sur des chaînes — un contexte arithmétique explicite est nécessaire :

```bash
a=5
b=3

echo $((a + b))   # 8
echo $((a * b))   # 15
echo $((a / b))   # 1 -> division entière uniquement, Bash ne gère pas les décimaux
```

## Variables spéciales

| Variable | Contenu |
|---|---|
| `$0` | Nom du script en cours d'exécution |
| `$1`, `$2`, ... | Arguments positionnels passés au script/à la fonction |
| `$@` | Tous les arguments, chacun comme un mot séparé |
| `$#` | Nombre d'arguments reçus |
| `$?` | Code de sortie de la dernière commande exécutée (`0` = succès) |
| `$$` | PID du script en cours d'exécution |

```bash
#!/bin/bash
echo "Script : $0"
echo "Premier argument : $1"
echo "Nombre d'arguments : $#"

ls /chemin/inexistant
echo "Code de sortie : $?"  # non nul, car la commande précédente a échoué
```

## Variables locales dans une fonction

Par défaut, une variable déclarée dans une fonction reste **globale** (visible partout après son premier appel) — `local` restreint sa portée à la fonction courante, ce qui évite des effets de bord inattendus :

```bash
compter() {
    local total=0   # visible seulement à l'intérieur de compter()
    total=$((total + 1))
    echo $total
}

compter
echo "$total"  # vide : total n'existe pas en dehors de la fonction
```

Voir aussi le chapitre sur les fonctions, et celui sur les variables d'environnement (`export`) pour partager une valeur avec des processus enfants.
