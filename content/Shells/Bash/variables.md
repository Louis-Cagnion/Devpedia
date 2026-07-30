---
order: 2
---

# Les variables

Bash n'a qu'un seul type de données réel : la **chaîne de caractères** — même un nombre est manipulé comme du texte, sauf dans un contexte arithmétique explicite (voir plus bas ce que cela recouvre précisément). Les variables ne sont pas typées, et leur syntaxe de déclaration/lecture est particulière : sans `$` à l'assignation, avec `$` à la lecture.

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

## Injection de commande : ne jamais interpoler une entrée non fiable

Si un script construit une commande en y interpolant directement une valeur externe (saisie utilisateur, argument, contenu d'un fichier téléchargé...), cette valeur peut contenir des caractères spéciaux du shell (`;`, `|`, `` ` ``, `$(...)`) qui **changent la structure de la commande exécutée**, au lieu de rester une simple donnée :

```bash
nom_fichier="rapport.txt; rm -rf ~"   # valeur reçue de l'extérieur, non contrôlée

eval "cat $nom_fichier"    # DANGER : exécute réellement "cat rapport.txt" PUIS "rm -rf ~"
```

`eval` réinterprète sa chaîne comme une nouvelle ligne de commande complète — c'est exactement ce mécanisme qui transforme un `;` contenu dans la donnée en un véritable **second ordre**, plutôt qu'un caractère inoffensif dans un nom de fichier. Même sans `eval`, la substitution de commande (`$(...)`, ci-dessus) ou une variable non protégée par des guillemets dans une commande qui accepte elle-même du code (ex. `ssh hote "$commande"`) créent le même risque.

> **Note :** conceptuellement, c'est l'équivalent Bash d'une injection SQL (cf. chapitre PHP sur la sécurité) — une entrée non contrôlée qui modifie la structure de ce qui est exécuté, plutôt que de rester une donnée. La protection est la même dans l'esprit : ne jamais faire confiance à une valeur externe pour construire du code exécutable, et quand c'est inévitable, la traiter comme une donnée pure — jamais assemblée textuellement dans une commande, encore moins repassée à `eval`.

## Arithmétique

Bash ne calcule pas nativement sur des chaînes — un contexte arithmétique explicite est nécessaire :

```bash
a=5
b=3

echo $((a + b))   # 8
echo $((a * b))   # 15
echo $((a / b))   # 1 -> division entière uniquement, Bash ne gère pas les décimaux
```

> **Qu'est-ce qu'un "contexte arithmétique explicite" ?** C'est une syntaxe précise que Bash reconnaît et à l'intérieur de laquelle il interprète le contenu comme une expression numérique plutôt que comme du texte : `$((...))` (pour obtenir le résultat), `((...))` seul (pour un calcul ou un test, sans récupérer de valeur — utilisé par exemple dans `for ((i = 0; i < 5; i++))`, cf. chapitre sur les boucles), la commande `let` (`let "a = a + 1"`), ou encore les opérateurs numériques `-eq`, `-lt`, `-gt`... à l'intérieur de `[ ]`/`[[ ]]` (cf. chapitre sur les conditions). En dehors de ces syntaxes précises, `+`, `-`, `*` ne sont que des caractères ordinaires dans une chaîne.

## Variables spéciales

En plus des variables qu'on déclare soi-même, Bash fournit des variables spéciales toujours disponibles (`$0`, `$1`, `$@`, `$#`, `$?`, `$$`) — voir le tableau et les exemples dans le chapitre sur l'écriture de scripts, juste après la section sur les arguments d'un script.

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
