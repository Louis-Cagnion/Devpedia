---
order: 3
---

# Les variables

Pour rappel, [une variable est une boîte étiquetée qui contient une valeur](/?c=bases-de-l-informatique&p=la-variable) : ce qui suit couvre uniquement ce qui est spécifique à Bash.

Bash n'a qu'un seul type de données réel : la **chaîne de caractères** ; même un nombre est manipulé comme du texte, sauf dans un contexte arithmétique explicite (voir plus bas ce que cela recouvre précisément). Les variables ne sont pas typées, et leur syntaxe de déclaration/lecture est particulière : sans `$` à l'assignation, avec `$` à la lecture.

## Déclarer et lire une variable

```bash
nom="Jean"     # aucun espace autour du '=' : "nom = Jean" est une erreur de syntaxe
echo $nom      # Jean
echo "${nom}"  # Jean -> les accolades délimitent explicitement le nom de variable
echo "Bonjour ${nom} !"
```

> **Piège :** `nom= "Jean"` (avec un espace après `=`) ne fonctionne **pas** comme attendu : Bash comprend "exécuter la commande `Jean` avec la variable d'environnement `nom` vide", pas "assigner Jean à nom". Un espace avant le `=` (`nom ="Jean"`) échoue tout autant : Bash cherche alors une commande nommée `nom`.
>
> **Bonne pratique :** ne jamais laisser d'espace ni avant ni après le `=` d'une assignation : c'est la règle la plus simple à retenir, sans exception en Bash.

## Guillemets simples vs doubles

```bash
nom="Jean"

echo "Bonjour $nom"  # Bonjour Jean -> les guillemets doubles interprètent les variables
echo 'Bonjour $nom'  # Bonjour $nom -> les guillemets simples désactivent toute interprétation
```

| Guillemets | Variables interprétées ? | Cas d'usage typique |
|---|---|---|
| Doubles `"..."` | Oui : `$nom` remplacé par sa valeur | Cas par défaut, dès qu'une variable apparaît dans la chaîne |
| Simples `'...'` | Non : texte pris tel quel, `$` compris | Texte littéral contenant un `$` qui ne doit surtout pas être interprété (regex, mot de passe affiché tel quel...) |
| Aucun | Oui, mais en plus la valeur est découpée en mots sur les espaces | À éviter presque toujours : voir le piège ci-dessous |

> **Piège :** utiliser une variable sans guillemets (`echo $nom`) au lieu de `"$nom"`. Si la valeur contient un espace, Bash la découpe en plusieurs mots avant de l'utiliser : `rm $fichier` avec un nom de fichier contenant un espace peut ainsi supprimer autre chose que prévu, silencieusement.
>
> **Bonne pratique :** entourer systématiquement une variable de guillemets doubles à l'usage (`"$nom"`), sauf besoin précis du contraire. Seule exception courante : à l'intérieur d'un contexte numérique explicite (`[ $i -lt 5 ]`, `$(( i + 1 ))`), Bash ne fait aucun découpage en mots sur la valeur : les guillemets y sont donc inutiles, ce qui explique pourquoi les chapitres sur les conditions et les boucles ne les utilisent pas dans ces cas précis.

## Substitution de commande

Exécute une commande et remplace l'expression par sa sortie :

```bash
date_du_jour=$(date +%Y-%m-%d)
echo "Nous sommes le $date_du_jour"

nombre_fichiers=$(ls | wc -l)
echo "Il y a $nombre_fichiers fichiers ici"
```

`$(...)` est la syntaxe moderne, préférée aux anciens \`backticks\` (`` `date` ``), moins lisibles et impossibles à imbriquer facilement.

> **Piège :** une substitution de commande non quotée subit le même découpage en mots qu'une variable non quotée (voir le piège des guillemets ci-dessus) : un résultat multi-lignes (`$(ls)`, `$(cat fichier.txt)`) voit ses retours à la ligne silencieusement transformés en simples espaces si on l'affiche sans guillemets.
>
> **Bonne pratique :** quoter une substitution de commande dès que sa sortie est multi-ligne ou peut contenir des espaces (`echo "$(cat fichier.txt)"`), exactement comme pour une variable ordinaire.

## Injection de commande : ne jamais interpoler une entrée non fiable

Si un script construit une commande en y interpolant directement une valeur externe (saisie utilisateur, argument, contenu d'un fichier téléchargé...), cette valeur peut contenir des caractères spéciaux du shell (`;`, `|`, `` ` ``, `$(...)`) qui **changent la structure de la commande exécutée**, au lieu de rester une simple donnée :

```bash
nom_fichier="rapport.txt; rm -rf ~"   # valeur reçue de l'extérieur, non contrôlée

eval "cat $nom_fichier"    # DANGER : exécute réellement "cat rapport.txt" PUIS "rm -rf ~"
```

`eval` réinterprète sa chaîne comme une nouvelle ligne de commande complète : c'est exactement ce mécanisme qui transforme un `;` contenu dans la donnée en un véritable **second ordre**, plutôt qu'un caractère inoffensif dans un nom de fichier. Même sans `eval`, la substitution de commande (`$(...)`, ci-dessus) ou une variable non protégée par des guillemets dans une commande qui accepte elle-même du code (ex. `ssh hote "$commande"`) créent le même risque.

> **Piège :** faire confiance à une valeur externe (saisie utilisateur, argument de script, contenu d'un fichier téléchargé) pour construire une commande, notamment via `eval` ou une commande qui accepte elle-même du code (`ssh hote "$commande"`), conceptuellement l'équivalent Bash d'une [injection SQL](/?c=langages-de-programmation&s=php&p=securite) : une entrée non contrôlée qui modifie la structure de ce qui est exécuté, plutôt que de rester une simple donnée.
>
> **Bonne pratique :** ne jamais assembler textuellement une valeur externe dans une commande exécutée ensuite. Quand c'est inévitable, la traiter comme une donnée pure : jamais interpolée directement dans la commande, encore moins repassée à `eval`.

## Arithmétique

Bash ne calcule pas nativement sur des chaînes : un contexte arithmétique explicite est nécessaire :

```bash
a=5
b=3

echo $((a + b))  # 8
echo $((a * b))  # 15
echo $((a / b))  # 1 -> division entière uniquement, Bash ne gère pas les décimaux
```

> **Qu'est-ce qu'un "contexte arithmétique explicite" ?** C'est une syntaxe précise que Bash reconnaît et à l'intérieur de laquelle il interprète le contenu comme une expression numérique plutôt que comme du texte : `$((...))` (pour obtenir le résultat), `((...))` seul (pour un calcul ou un test, sans récupérer de valeur, utilisé par exemple dans `for ((i = 0; i < 5; i++))`, voir [Les boucles](/?c=shells&s=bash&p=boucles)), la commande `let` (`let "a = a + 1"`), ou encore les opérateurs numériques `-eq`, `-lt`, `-gt`... à l'intérieur de `[ ]`/`[[ ]]` (voir [Les conditions](/?c=shells&s=bash&p=conditions)). En dehors de ces syntaxes précises, `+`, `-`, `*` ne sont que des caractères ordinaires dans une chaîne.

> **Piège :** `$((a / b))` tronque silencieusement toute partie décimale, sans avertissement ni erreur : `echo $((5 / 2))` affiche `2`, pas `2.5`. Un calcul qui devrait produire un résultat décimal (moyenne, pourcentage...) donne ainsi un résultat faux sans qu'aucune erreur ne le signale.
>
> **Bonne pratique :** passer par un outil externe qui gère les décimaux ([`bc`](https://www.gnu.org/software/bc/), `awk`) dès qu'un calcul peut produire un résultat non entier, plutôt que l'arithmétique native de Bash.

## Variables spéciales

En plus des variables qu'on déclare soi-même, Bash fournit des variables spéciales toujours disponibles (`$0`, `$1`, `$@`, `$#`, `$?`, `$$`) : voir le tableau et les exemples dans le chapitre sur l'écriture de scripts, juste après la section sur les arguments d'un script.

## Variables locales dans une fonction

Par défaut, une variable déclarée dans une fonction reste **globale** (visible partout après son premier appel) : `local` restreint sa portée à la fonction courante, ce qui évite des effets de bord inattendus :

```bash
compter() {
    local total=0   # visible seulement à l'intérieur de compter()
    total=$((total + 1))
    echo $total
}

compter
echo "$total"  # vide : total n'existe pas en dehors de la fonction
```

> **Piège :** oublier `local` dans une fonction qui réutilise un nom de variable courant (`i`, `total`, `resultat`...) : la variable devient globale silencieusement, et peut écraser une variable de même nom utilisée ailleurs dans le script, sans aucune erreur signalée.
>
> **Bonne pratique :** déclarer `local` pour toute variable qui n'a besoin d'exister que le temps de la fonction : un réflexe à prendre dès la première ligne de la fonction, pas seulement une fois un bug de portée déjà constaté.

Voir aussi le chapitre sur les fonctions, et celui sur les variables d'environnement (`export`) pour partager une valeur avec des processus enfants.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Bash ne connaît qu'un seul type réel, la chaîne de caractères. Assignation sans `$` (`nom="Jean"`), lecture avec `$` (`$nom`) ou `${nom}`, sans aucun espace autour du `=`. `"$(...)"` capture la sortie d'une commande ; `$((...))` évalue une expression numérique. `local` restreint une variable à sa fonction. |
| **Outils utilisables** | `$(commande)` pour la substitution de commande ; `$((...))`, `((...))` ou `let` pour l'arithmétique ; `bc`/`awk` dès qu'un calcul décimal est nécessaire. |
| **Pièges à éviter** | Un espace autour du `=` à l'assignation. Une variable ou une substitution de commande non quotée (découpage en mots silencieux). Interpoler une valeur externe non contrôlée dans une commande (`eval`, `ssh hote "$commande"`). Oublier `local` dans une fonction. |
| **Bonnes pratiques** | Toujours quoter une variable (`"$nom"`) sauf dans un contexte arithmétique explicite. Ne jamais construire une commande à partir d'une donnée externe non contrôlée. Déclarer `local` systématiquement dans une fonction. |
