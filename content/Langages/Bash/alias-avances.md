---
order: 16
---

# Alias avancés en Bash

Un **alias** est un raccourci : un nom court que l'on tape à la place d'une commande plus longue. Ce chapitre suppose que vous savez ouvrir un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la fenêtre où l'on tape des instructions au clavier) et y lancer une commande simple comme `ls` (voir [les commandes de base](/?c=langages&s=bash&p=commandes-de-base)). Le **shell** est le programme qui lit ce que l'on tape dans le terminal et l'exécute ; celui de ce chapitre est [Bash](/?c=langages&s=bash&p=bash). Une **commande** est une instruction tapée dans le terminal (`ls`), un **argument** est tout ce qui s'écrit après son nom (`/tmp` dans `ls /tmp`), et une **option** est un argument qui commence par un tiret (`-l`).

L'alias simple (`alias ll='ls -la'`) est présenté dans [les variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement). Ce chapitre va plus loin, **en cinq niveaux**, chacun s'appuyant sur le précédent :

| Niveau | Besoin | Outil | Section |
|---|---|---|---|
| 1 | Un autre nom pour une commande | `alias`, `unalias`, `~/.bashrc` | [Niveau 1](#niveau-1-l-alias-simple) |
| 2 | Une commande qui reçoit des arguments au milieu | Une **fonction** (un groupe de commandes rangé sous un nom : `$1`, `"$@"`, `"$#"`) | [Niveau 2](#niveau-2-alias-ou-fonction-avec-arguments) |
| 3 | Utiliser un raccourci dans un script | `shopt -s expand_aliases`, ou mieux, une fonction | [Niveau 3](#niveau-3-les-alias-dans-un-script) |
| 4 | Faire cohabiter alias, fonctions et programmes | `\nom`, `command`, `type -a`, `unalias` | [Niveau 4](#niveau-4-contournement-et-cohabitation) |
| 5 | Ranger ses raccourcis et les écarter pour diagnostiquer | `~/.bash_aliases`, `bash --norc` | [Niveau 5](#niveau-5-organiser-ses-raccourcis) |

Le même sujet existe pour un autre shell : [les alias et raccourcis en PowerShell](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), où l'alias est beaucoup plus limité.

## Ce qu'est un alias pour Bash

Un alias est un **texte de remplacement**. L'image la plus proche est le correcteur d'un téléphone qui remplace « stp » par « s'il te plaît » avant l'envoi du message : le message n'est lu par personne avant la substitution. De même, Bash remplace le mot tapé par le texte de l'alias **avant d'analyser la ligne**, c'est-à-dire avant de la découper en mots et de traiter les variables et les [jokers](/?c=langages&s=bash&p=expansion-et-jokers) (voir [l'ordre des expansions](/?c=langages&s=bash&p=architecture-dun-shell#l-ordre-precis-des-expansions)).

```
   Vous tapez :   ll /tmp
                   |
   1. Bash lit le premier mot de la ligne : ll
   2. Il trouve un alias ll, dont le texte est : ls -la
   3. Il remplace le mot ll par ce texte ; le reste de la ligne ne bouge pas
                   |
                   v
   4. Il analyse la ligne obtenue : ls -la /tmp
   5. Il l'exécute
```

L'étape 3 s'appelle le **développement** de l'alias (en anglais *alias expansion*) : le remplacement d'un alias par son texte. Tout ce chapitre découle de cette phrase : **l'alias est un texte, substitué au mot tapé, avant que la ligne soit analysée** (voir [le manuel de Bash, section « Aliases »](https://www.gnu.org/software/bash/manual/html_node/Aliases.html)).

## Niveau 1 : l'alias simple

```bash
# alias nom='texte' : crée l'alias ll ; le texte entre guillemets simples est gardé tel quel
alias ll='ls -la'
# ll est remplacé par « ls -la » : liste détaillée du dossier, fichiers cachés compris
ll
# ce qui est tapé après l'alias est ajouté à la suite du texte : lance « ls -la /tmp »
ll /tmp
# alias sans argument : liste tous les alias de la session en cours
alias
# alias suivi d'un nom : affiche la définition de cet alias seulement
alias ll
# unalias supprime l'alias ll pour la session en cours
unalias ll
# ll n'est plus connu : Bash répond « command not found » (« commande introuvable »)
ll
```

Dans une session vierge, ces commandes affichent (après la liste du dossier, qui dépend de l'endroit où vous êtes) :

```text
alias ll='ls -la'
alias ll='ls -la'
bash: ll: command not found
```

La première ligne est la sortie de `alias`, la deuxième celle de `alias ll`, la troisième l'erreur du dernier `ll`. Le texte des messages d'erreur dépend de la langue du système (en français : « commande introuvable »). L'option `-la` regroupe `-l` (une ligne détaillée par fichier) et `-a` (afficher aussi les éléments cachés) : voir [la commande `ls`](/?c=langages&s=bash&p=commandes-de-base#lister-un-dossier-ls).

| Commande | Effet |
|---|---|
| `alias nom='texte'` | Crée ou remplace l'alias `nom` |
| `alias` | Liste tous les alias de la session |
| `alias nom` | Affiche la définition de l'alias `nom` |
| `unalias nom` | Supprime l'alias `nom` |
| `unalias -a` | Supprime tous les alias de la session |

### Simples ou doubles guillemets : quand les variables sont-elles lues ?

Une **variable** est une boîte étiquetée qui contient une valeur (voir [la variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable)). Dans `"echo $n"`, les guillemets doubles font lire la variable `n` **tout de suite**, à la création de l'alias ; avec les guillemets simples, le texte `$n` est gardé et lu à chaque **utilisation** (voir [guillemets simples et doubles](/?c=langages&s=bash&p=variables#guillemets-simples-vs-doubles)).

```bash
# n est une variable qui contient 1
n=1
# guillemets doubles : $n est remplacé par 1 maintenant, l'alias mémorise « echo 1 »
alias valeur_double="echo $n"
# guillemets simples : l'alias mémorise le texte « echo $n », lu plus tard
alias valeur_simple='echo $n'
# on change la valeur de n
n=2
# affiche 1 : la valeur a été figée à la création
valeur_double
# affiche 2 : la variable est lue au moment de l'utilisation
valeur_simple
```

La sortie observée est `1` puis `2`. Règle pratique : **toujours des guillemets simples** autour du texte d'un alias, sauf si l'on veut figer une valeur.

### Rendre un alias permanent

Un alias tapé dans le terminal est gardé **en mémoire**, dans la session : fermez la fenêtre, il disparaît. Pour le retrouver à chaque ouverture, on l'écrit dans le fichier `~/.bashrc`, que Bash lit au démarrage de chaque terminal (voir [les fichiers de configuration](/?c=langages&s=bash&p=variables-denvironnement#fichiers-de-configuration-du-shell)). Le signe `~` désigne votre dossier personnel (voir [l'expansion du tilde](/?c=langages&s=bash&p=expansion-et-jokers#l-expansion-du-tilde)).

```bash
# echo affiche le texte ; >> (redirection) l'ajoute à la fin du fichier ~/.bashrc
echo "alias ll='ls -la'" >> ~/.bashrc
# source lit le fichier et exécute ses lignes dans la session en cours
# (inutile de rouvrir le terminal)
source ~/.bashrc
```

Les guillemets doubles extérieurs protègent ici les guillemets simples intérieurs : le fichier reçoit exactement `alias ll='ls -la'`. La redirection `>>` est expliquée dans [les redirections et les pipes](/?c=langages&s=bash&p=redirections-et-pipes), et `source` dans [les variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement#source-recharger-un-fichier-de-configuration).

## Niveau 2 : alias ou fonction avec arguments

Un alias ne sait **que** coller son texte à la place du mot ; les arguments tapés après lui arrivent **à la fin**. Il ne peut donc pas les placer ailleurs. Préparons un dossier d'essai :

```bash
# mkdir crée un dossier ; essai est notre dossier de travail
mkdir essai
# cd s'y place
cd essai
# crée un sous-dossier nommé sub
mkdir sub
# > écrit le texte dans un fichier (créé s'il n'existe pas)
echo "bonjour" > a.txt
# un nom de fichier avec une espace : il nous servira plus bas
echo "bonjour le monde" > "mon fichier.txt"
# un fichier dans le sous-dossier
echo "au revoir" > sub/b.txt
```

### L'alias qui ne fonctionne pas

Voici un raccourci qui cherche un mot dans tous les fichiers. `grep` est la commande qui cherche du texte (voir [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-rechercher-du-texte)) ; `-r` la fait descendre dans les sous-dossiers, et le point `.` désigne le dossier courant. Le texte `$1` désigne le premier argument **d'un script ou d'une fonction** (voir [les arguments d'un script](/?c=langages&s=bash&p=scripts-et-shebang#les-arguments-d-un-script)).

```bash
# l'alias cherche doit lancer : grep -r "mot" .  (avec le mot tapé à la place de $1)
alias cherche='grep -r "$1" .'
# on lance l'alias avec le mot bonjour
cherche bonjour
# affiche le contenu de $1 entre crochets
echo "[$1]"
```

```text
./a.txt:bonjour
./mon fichier.txt:bonjour le monde
./sub/b.txt:au revoir
grep: bonjour: No such file or directory
[]
```

L'ordre des fichiers peut varier d'un système à l'autre. Le résultat est faux, et l'explication tient aux deux étapes de la substitution :

| Étape | Ce qui se passe |
|---|---|
| 1. Développement de l'alias | `cherche bonjour` devient `grep -r "$1" . bonjour` : le mot tapé est collé **à la fin** |
| 2. Analyse de la ligne obtenue | `$1` est lu comme variable du **terminal**, où il n'existe pas : il vaut vide, d'où `[]` |
| 3. Exécution | `grep -r "" . bonjour` : le motif vide (le motif est le texte cherché) correspond à **toutes** les lignes, et `bonjour` est pris pour un nom de fichier, qui n'existe pas |

Un alias n'a **pas de `$1`** : il n'a pas de paramètres propres. Il faut une fonction.

### La fonction : `$1`, `"$@"` et `"$#"`

Une **fonction** regroupe des commandes sous un nom ; elle reçoit ses arguments dans `$1` (le premier), `$2` (le deuxième), etc. (voir [les fonctions Bash](/?c=langages&s=bash&p=fonctions)). Tapée dans le terminal, elle se saisit sur plusieurs lignes : Bash affiche `>` tant que les accolades ne sont pas refermées.

```bash
# on supprime d'abord l'alias du même nom (voir l'explication sous ce bloc)
unalias cherche
# cherche() déclare la fonction ; les accolades { } entourent ses commandes
cherche() {
    # $1 vaut ici le premier argument de la fonction : le mot cherché
    grep -r "$1" .
}
# lance la fonction avec le mot bonjour
cherche bonjour
```

```text
./a.txt:bonjour
./mon fichier.txt:bonjour le monde
```

Cette fois, la ligne `grep -r "bonjour" .` est exécutée comme prévu. Le `unalias` du début n'est pas décoratif : tant que l'alias `cherche` existe, Bash le développe aussi dans la ligne `cherche() {` (c'est un mot placé en première position), et la déclaration de la fonction échoue avec `syntax error near unexpected token`. **On supprime toujours un alias avant de déclarer une fonction du même nom.** Deux autres écritures servent à tout transmettre :

| Écriture | Signification |
|---|---|
| `$1`, `$2`... | Le premier, le deuxième... argument reçu |
| `"$@"` | **Tous** les arguments, chacun gardé comme un mot séparé, même s'il contient des espaces |
| `"$#"` | Le **nombre** d'arguments reçus |

La différence des guillemets autour de `$@` se voit avec un nom de fichier contenant une espace. `printf` affiche un texte d'après un modèle : ici `[%s]` est répété pour chaque argument, et `\n` fait passer à la ligne.

```bash
# résumer() affiche le nombre d'arguments, puis chacun entre crochets
resumer() {
    # "$#" : nombre d'arguments reçus
    echo "$# arguments"
    # "$@" : chaque argument reste un mot entier
    printf '[%s]\n' "$@"
}
# mauvais() fait pareil, mais $@ n'a PAS de guillemets
mauvais() {
    # sans guillemets, Bash recoupe le contenu à chaque espace
    printf '[%s]\n' $@
}
# trois arguments, dont "mon fichier.txt" qui contient une espace
resumer a "mon fichier.txt" c
# mêmes arguments avec la version sans guillemets
mauvais a "mon fichier.txt" c
```

```text
3 arguments
[a]
[mon fichier.txt]
[c]
[a]
[mon]
[fichier.txt]
[c]
```

Sans guillemets, « mon fichier.txt » est coupé en **deux** mots, et la commande qui le reçoit cherchera deux fichiers qui n'existent pas. C'est la raison d'écrire presque toujours `"$@"`, jamais `$@` nu (voir [les variables spéciales](/?c=langages&s=bash&p=scripts-et-shebang#les-arguments-d-un-script) et [l'ordre des expansions](/?c=langages&s=bash&p=architecture-dun-shell#l-ordre-precis-des-expansions)).

Enfin, `"$#"` permet de refuser un appel incomplet. `if` teste une condition (voir [les conditions](/?c=langages&s=bash&p=conditions)), `-lt` signifie « inférieur à », `return 1` termine la fonction avec le code 1 (un code non nul signale un échec), et `${2:-.}` vaut le deuxième argument s'il est donné, sinon le point.

```bash
# cherche2() : cherche un mot, dans un dossier donné ou, à défaut, dans le dossier courant
cherche2() {
    # si le nombre d'arguments est inférieur à 1, la commande est incomplète
    if [ "$#" -lt 1 ]; then
        # affiche le mode d'emploi, puis sort de la fonction avec le code d'échec 1
        echo "usage : cherche2 MOTIF [DOSSIER]"
        return 1
    fi
    # -n ajoute le numéro de ligne ; "${2:-.}" : le dossier donné, sinon le point
    grep -rn "$1" "${2:-.}"
}
# appel sans argument : le mode d'emploi s'affiche
cherche2
# appel avec un mot : cherche dans le dossier courant
cherche2 revoir
# appel avec un mot et un dossier : cherche seulement dans sub
cherche2 bonjour sub
```

```text
usage : cherche2 MOTIF [DOSSIER]
./sub/b.txt:1:au revoir
```

Le dernier appel n'affiche rien : `bonjour` n'apparaît pas dans `sub`, et `grep` termine alors avec le code de sortie 1, celui d'un échec (voir [les codes de sortie](/?c=langages&s=bash&p=scripts-et-shebang#codes-de-sortie-exit)).

| | Alias | Fonction |
|---|---|---|
| Donner un autre nom à une commande | Oui | Oui |
| Arguments ajoutés **à la fin** | Oui, automatiquement | Oui, avec `"$@"` |
| Placer un argument **au milieu** (`$1`) | **Non** | Oui |
| Compter les arguments, tester avec `if` | Non | Oui (`"$#"`, `if`) |
| Plusieurs commandes à la suite | Possible, mais illisible | Oui, une par ligne |
| Se supprime avec | `unalias nom` | `unset -f nom` (`unset` défait un nom, `-f` désigne une fonction) |
| Se retrouve avec | `alias` | `type nom` (affiche ce qu'est `nom`, voir le [niveau 4](#niveau-4-contournement-et-cohabitation)) |

Une fonction tapée dans le terminal vit, elle aussi, dans la session seulement : pour la garder, on la place dans `~/.bashrc` ou dans un fichier chargé par lui (voir [le niveau 5](#niveau-5-organiser-ses-raccourcis)).

## Niveau 3 : les alias dans un script

Un **script** est un fichier texte qui contient des commandes, exécutées l'une après l'autre (voir [écrire et exécuter un script](/?c=langages&s=bash&p=scripts-et-shebang)). On le lance ici par `bash nom.sh`, ce qui démarre un **nouveau** Bash qui lit le fichier. Comme ce Bash est lancé directement, la première ligne spéciale du fichier, le [shebang](/?c=langages&s=bash&p=scripts-et-shebang#le-shebang), n'est pas nécessaire dans nos exemples.

### Par défaut, un script ignore les alias

Un **shell interactif** est un shell qui attend vos commandes tapées au clavier dans un terminal ; un shell **non interactif** est un shell qui lit un script. Les alias ne sont développés, par défaut, que dans le premier. Deux conséquences :

```bash
# --- contenu de sans-option.sh ---
# alias : crée l'alias saluer, qui remplace ce mot par « echo bonjour »
alias saluer='echo bonjour'
# on utilise l'alias sur la ligne suivante
saluer le monde
# cette ligne prouve que le script continue malgré l'erreur
echo "fin du script"
```

```bash
# lance le script dans un nouveau Bash non interactif
bash sans-option.sh
```

```text
sans-option.sh: line 4: saluer: command not found
fin du script
```

Même quand l'alias est défini **dans le script**, il n'est pas développé : Bash cherche une commande nommée `saluer`. Et un alias créé dans votre terminal n'existe pas dans le script, qui est un autre **processus** (un programme en cours d'exécution, voir [la gestion des processus](/?c=langages&s=bash&p=gestion-des-processus)) :

```bash
# --- contenu de utilise-alias.sh ---
# ce script n'a pas créé d'alias saluer : il essaie d'utiliser celui du terminal
saluer toi
```

```bash
# dans le terminal : l'alias existe pour le terminal
alias saluer='echo bonjour'
# le terminal le développe
saluer le monde
# le script, lui, est un autre Bash : l'alias n'y est pas
bash utilise-alias.sh
```

```text
bonjour le monde
utilise-alias.sh: line 2: saluer: command not found
```

### Activer les alias : `shopt -s expand_aliases`

`shopt` (de l'anglais *shell option*) active ou désactive une option de Bash ([documentation de `shopt`](https://www.gnu.org/software/bash/manual/html_node/The-Shopt-Builtin.html)) : `-s` l'active (*set*), `-u` la désactive (*unset*), et son nom seul affiche son état. L'option `expand_aliases` est « désactivée » dans un script (« activée » dans un terminal).

```bash
# --- contenu de avec-option.sh ---
# shopt -s : active (set) l'option expand_aliases, qui autorise les alias dans un script
shopt -s expand_aliases
# crée l'alias saluer
alias saluer='echo bonjour'
# utilise l'alias sur la ligne suivante
saluer le monde
# affiche un message de fin
echo "fin du script"
```

```bash
# lance le script
bash avec-option.sh
# affiche l'état de l'option dans un Bash non interactif (-c : exécuter ce texte)
bash --norc -c 'shopt expand_aliases'
```

```text
bonjour le monde
fin du script
expand_aliases      	off
```

### Le piège de la ligne suivante

Bash lit une **commande complète** : au moins une ligne entière, et toutes les lignes d'un bloc (`{ }`, `if`, boucle, corps de fonction) avant d'en exécuter la moindre. Or le développement d'un alias a lieu **à la lecture**, pas à l'exécution. Conséquence : un alias n'existe qu'à partir de la **ligne suivante** lue. Dans un terminal, chaque ligne est lue quand vous appuyez sur Entrée, donc le problème ne se voit pas ; dans un script, il apparaît.

```bash
# --- contenu de meme-ligne.sh ---
# autorise les alias dans ce script
shopt -s expand_aliases
# définition ET usage sur la même ligne : séparés par un point-virgule
alias saluer='echo bonjour'; saluer le monde
# affiche un message de fin
echo "fin du script"
```

```bash
# --- contenu de bloc.sh ---
# autorise les alias dans ce script
shopt -s expand_aliases
# les accolades { } forment un bloc : Bash lit tout le bloc avant d'en exécuter une ligne
{
    # définition de l'alias, à l'intérieur du bloc
    alias saluer='echo bonjour'
    # usage dans le même bloc : l'alias est inconnu ici
    saluer le monde
}
# usage après le bloc : le bloc a été exécuté, l'alias existe
saluer encore
```

```bash
# --- contenu de fonction-avant.sh ---
# autorise les alias dans ce script
shopt -s expand_aliases
# la fonction dire est LUE ici, avant que l'alias existe : saluer y reste un mot ordinaire
dire() { saluer toi; }
# l'alias est créé après la lecture de la fonction
alias saluer='echo bonjour'
# appel de la fonction : elle cherche une commande saluer, et ne trouve rien
dire
```

```bash
# --- contenu de fonction-apres.sh ---
# autorise les alias dans ce script
shopt -s expand_aliases
# l'alias est créé d'abord
alias saluer='echo bonjour'
# la fonction dire est lue maintenant : saluer y est remplacé par « echo bonjour »
dire() { saluer toi; }
# appel de la fonction : elle affiche bonjour toi
dire
```

```bash
# lance chacun des quatre scripts
bash meme-ligne.sh
bash bloc.sh
bash fonction-avant.sh
bash fonction-apres.sh
```

```text
meme-ligne.sh: line 4: saluer: command not found
fin du script
bloc.sh: line 8: saluer: command not found
bonjour encore
fonction-avant.sh: line 4: saluer: command not found
bonjour toi
```

| Situation | Résultat |
|---|---|
| Définition et usage sur **deux lignes** consécutives | Fonctionne (avec `expand_aliases` dans un script) |
| Définition et usage sur la **même ligne** (`;`) | Échoue : l'alias n'existe pas encore à la lecture |
| Définition et usage **dans le même bloc** `{ }` | Échoue ; l'usage **après** le bloc fonctionne |
| Fonction lue **avant** l'alias | Échoue à l'appel, même si l'alias existe à ce moment |
| Fonction lue **après** l'alias | Fonctionne |

Remarquez la ligne 4 du message de `fonction-avant.sh` : c'est la ligne où le **corps de la fonction** a été lu, pas celle de l'appel.

Un fichier de raccourcis chargé par `source` fait exception, car il est lu seulement quand `source` s'exécute, donc après `shopt` :

```bash
# --- contenu de raccourcis.sh ---
# fichier de raccourcis : il ne contient que la définition d'un alias
alias saluer='echo bonjour'
```

```bash
# --- contenu de charge-avec.sh ---
# autorise les alias dans ce script
shopt -s expand_aliases
# source lit le fichier raccourcis.sh et exécute ses lignes dans ce script
source ./raccourcis.sh
# l'alias créé par le fichier est utilisable à partir d'ici
saluer le monde
```

```bash
# lance le script : affiche « bonjour le monde »
bash charge-avec.sh
```

### La solution recommandée : une fonction

Une fonction ne dépend d'aucune option, d'aucun ordre de lecture : elle marche pareil dans un terminal et dans un script.

```bash
# --- contenu de fonction.sh ---
# une fonction n'a besoin d'aucune option : elle marche dans un script comme dans le terminal
saluer() {
    # echo affiche son texte ; "$@" transmet tous les arguments reçus par saluer
    echo bonjour "$@"
}
# appel de la fonction avec deux arguments
saluer le monde
```

```bash
# lance le script : affiche « bonjour le monde »
bash fonction.sh
```

Dans un script, on **n'utilise pas d'alias** : on écrit la commande complète, ou une fonction.

## Niveau 4 : contournement et cohabitation

### Qui répond quand on tape un nom ?

Le même nom peut désigner un alias, une fonction, une commande interne (*builtin*, une commande intégrée à Bash lui-même, comme `cd`) et un programme (un fichier exécutable, comme `/usr/bin/date`, trouvé grâce à [`$PATH`](/?c=langages&s=bash&p=variables-denvironnement#path-comment-le-shell-trouve-une-commande)). Bash choisit selon un ordre fixe :

| Priorité | Ce qui répond | Exemple |
|---|---|---|
| 1 (la plus forte) | Un **alias** | `alias ll='ls -la'` |
| 2 | Une **fonction** | `cherche() { ... }` |
| 3 | Une **commande interne** | `cd`, `echo`, `type` |
| 4 (la plus faible) | Un **programme** | `/usr/bin/date` |

La commande `type -a nom` (*type*, « de quel type est ce nom ? » ; avec `command` et `builtin`, elle est décrite dans [les commandes internes de Bash](https://www.gnu.org/software/bash/manual/html_node/Bash-Builtins.html)) liste **toutes** les réponses possibles, dans l'ordre. Voyons-le avec `date`, qui est un programme, auquel on ajoute une fonction puis un alias de même nom :

```bash
# le nom date n'est, pour l'instant, qu'un programme
type -a date
# une fonction nommée date
date() { echo "date (fonction)"; }
# un alias nommé date
alias date='echo "date (alias)"'
# les trois réponses, de la plus prioritaire à la moins prioritaire
type -a date
# qui répond quand on tape le nom ?
date
```

```text
date is /usr/bin/date
date is aliased to `echo "date (alias)"'
date is a function
date ()
{
    echo "date (fonction)"
}
date is /usr/bin/date
date (alias)
```

Le premier `type -a` ne trouve que le programme ; le deuxième affiche l'alias, puis la fonction (avec son code), puis le programme ; et c'est l'**alias** qui répond. Les mots `is`, `aliased to` et `a function` sont ceux d'un système en anglais. Pour un nom de commande interne, `type -a echo` affiche d'abord `echo is a shell builtin`, puis le chemin du programme `echo`. Autre forme utile : `type -t nom` (*type*, option `-t`) n'affiche qu'un mot parmi `alias`, `function`, `builtin` ou `file`, et rien si le nom est inconnu (code de sortie 1).

### Contourner un alias ou une fonction

```bash
# le nom date désigne toujours l'alias et la fonction créés plus haut
# \date : l'antislash empêche le développement de l'alias, la fonction répond
\date
# command date : ignore l'alias ET la fonction, lance la commande interne ou le programme
command date +%Y
# unalias date : supprime l'alias ; la fonction répond de nouveau
unalias date
date
# unset -f date : supprime la fonction ; le programme répond de nouveau
unset -f date
command date +%Y
```

```text
date (fonction)
2026
date (fonction)
2026
```

Le nombre `2026` est l'année en cours au moment de l'essai. `+%Y` est l'argument qui demande à `date` d'afficher l'année seule.

| Je veux | Écriture | Ce qui est ignoré |
|---|---|---|
| Passer outre l'alias | `\nom`, `"nom"` ou `'nom'` | L'alias seulement : une **fonction** du même nom répond |
| Passer outre alias **et** fonction | `command nom` | Alias et fonctions : la commande interne ou le programme répond |
| Forcer une commande interne | `builtin nom` | Alias, fonctions et programmes |
| Supprimer l'alias de la session | `unalias nom` | Rien : l'alias disparaît jusqu'à la prochaine session |
| Supprimer la fonction de la session | `unset -f nom` | Rien : la fonction disparaît jusqu'à la prochaine session |

Pourquoi `\nom` marche-t-il ? Bash ne cherche un alias que pour un mot écrit **sans aucune partie protégée** : dès que le mot contient un antislash ou des guillemets, il n'est plus regardé comme alias.

### Un alias qui s'appelle lui-même : pas de boucle

Un alias peut contenir le nom qu'il remplace, ce qui est très courant : `alias ls='ls --color=auto'` (`--color=auto` colore les noms seulement si le résultat s'affiche dans un terminal). On pourrait craindre une boucle infinie : `ls` devient `ls --color=auto`, dont le premier mot `ls` redevient `ls --color=auto`, etc. Elle n'a pas lieu : **un mot identique à l'alias en cours de développement n'est pas développé une seconde fois**. Le deuxième `ls` désigne donc la vraie commande.

```bash
# l'alias ls ajoute --color=auto à la vraie commande ls
alias ls='ls --color=auto'
# affiche la définition : le texte contient le mot ls
type ls
# deux alias qui se renvoient l'un à l'autre : a vers b, b vers a
alias a='b'
alias b='a'
# a devient b, b devient a, et a n'est pas développé une seconde fois
a
```

```text
ls is aliased to `ls --color=auto'
bash: a: command not found
```

Le deuxième cas n'est pas une boucle non plus : Bash s'arrête et cherche une vraie commande nommée `a`, qui n'existe pas. L'alias inutile `alias a='b'` ne sert qu'à illustrer : on ne fait jamais cela.

### L'alias chaîné : l'espace finale

Par défaut, seul le **premier mot** de la ligne est regardé comme alias. Si le texte d'un alias **se termine par une espace**, le mot suivant est regardé lui aussi. Voici un exemple sans danger :

```bash
# deux alias : ecrire désigne echo (sans espace finale), monde est un texte de remplacement
alias ecrire='echo'
alias monde='tout le monde'
# le mot monde n'est pas un premier mot : il n'est pas développé, il s'affiche tel quel
ecrire monde
# on redéfinit ecrire avec une espace À LA FIN du texte
alias ecrire='echo '
# le mot qui suit ecrire est maintenant regardé comme alias : monde est développé
ecrire monde
```

```text
monde
tout le monde
```

L'usage le plus fréquent est `alias sudo='sudo '`. `sudo` est une commande qui lance une autre commande avec les droits d'administrateur ([documentation officielle de `sudo`](https://www.sudo.ws/docs/man/sudo.man/)). Sans l'espace finale, `sudo ll` échoue (« `ll` : commande introuvable »), car le mot `ll`, qui suit `sudo`, n'est pas un premier mot ; avec elle, `ll` est développé en `ls -la` avant l'exécution.

### Là où les alias ne servent à rien

Un alias n'existe que dans le shell interactif qui l'a créé. Les programmes qui lancent d'autres commandes sans passer par ce shell ne les voient pas. Exemple avec `xargs`, un programme qui lit des mots et les ajoute en arguments d'une commande :

```bash
# l'alias saluer existe pour le terminal
alias saluer='echo bonjour'
# xargs cherche un PROGRAMME nommé saluer : il ne connaît pas les alias de Bash
echo toi | xargs saluer
```

```text
xargs: saluer: No such file or directory
```

Une **fonction** a le même défaut avec `xargs` : elle n'est pas un programme non plus. `xargs` ne lance que de vrais programmes.

## Niveau 5 : organiser ses raccourcis

### Un fichier `~/.bash_aliases`

Quand on a quelques raccourcis, `~/.bashrc` devient illisible. On les range dans un fichier à part, `~/.bash_aliases`, que `~/.bashrc` charge. Son nom est une **convention** : Bash ne le lit pas de lui-même, c'est le `~/.bashrc` qui doit contenir les lignes ci-dessous. Certains systèmes les livrent déjà dans leur `~/.bashrc` par défaut : cherchez avec `grep bash_aliases ~/.bashrc` avant d'ajouter (voir [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-rechercher-du-texte)).

```bash
# --- à ajouter dans ~/.bashrc ---
# [ -f fichier ] est vrai si ce fichier existe et est un fichier ordinaire
if [ -f ~/.bash_aliases ]; then
    # le point lit le fichier dans le shell courant, comme source
    . ~/.bash_aliases
# fi termine le if
fi
```

Le test `[ -f ... ]` évite une erreur si le fichier n'existe pas encore. Voir [les conditions](/?c=langages&s=bash&p=conditions) pour `if` et `[ ]`.

```bash
# --- contenu de ~/.bash_aliases ---
# raccourcis simples : un nom court pour une commande
alias ll='ls -la'
# ls -lt : détail de chaque fichier, du plus récent au plus ancien
alias lt='ls -lt'
# --color=auto : colore les noms seulement si la sortie s'affiche dans un terminal
alias ls='ls --color=auto'
# l'espace finale permet de développer l'alias du mot suivant (voir le niveau 4)
alias sudo='sudo '
# cherche le motif donné en premier argument dans le dossier courant
cherche() {
    grep -rn "$1" .
}
```

Les alias y côtoient les fonctions (niveau 2) : le fichier n'est qu'une suite de commandes, lue par `source`. Pour appliquer une modification sans rouvrir le terminal : `source ~/.bash_aliases`.

| Fichier | Contenu | Pourquoi |
|---|---|---|
| `~/.bashrc` | Le bloc de chargement ci-dessus, et les réglages de l'environnement (voir [les variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement)) | Il reste court et lisible |
| `~/.bash_aliases` | Tous les alias et fonctions personnels | Un seul endroit à relire, à sauvegarder, à copier sur une autre machine |
| Un script partagé | Aucun raccourci personnel | Il doit marcher sans votre configuration |

Avec un `~/.bash_aliases` qui contient ces alias, on observe :

| Cas observé | Résultat |
|---|---|
| Le fichier existe et `~/.bashrc` contient le bloc `if` | Les alias sont présents dans chaque nouveau terminal (`alias` les liste) |
| Le fichier n'existe pas, avec le test `[ -f ... ]` | Le terminal démarre sans aucun message |
| Le fichier n'existe pas, avec seulement `. ~/.bash_aliases` | Un message `No such file or directory` s'affiche à chaque démarrage |
| Une ligne ajoutée au fichier après le démarrage | Inconnue tant qu'on n'a pas lancé `source ~/.bash_aliases` |

### Diagnostiquer : `bash --norc`

Quand une commande se comporte étrangement, la cause est parfois l'un de vos alias ou de vos fonctions. `bash --norc` démarre un nouveau Bash **interactif** qui **ne lit pas** `~/.bashrc` : aucun de vos raccourcis n'y existe (voir [le manuel de Bash, section « Invoking Bash »](https://www.gnu.org/software/bash/manual/html_node/Invoking-Bash.html)).

```bash
# démarre un Bash sans lire ~/.bashrc ; l'invite, le texte qui précède ce que vous tapez,
# peut changer d'aspect
bash --norc
# la liste est vide : aucun alias n'a été chargé
alias
# l'alias ll de ~/.bash_aliases n'existe pas ici
ll
# exit ferme ce Bash et vous ramène à la session précédente, avec vos raccourcis
exit
```

```text
bash: ll: command not found
```

Si le comportement redevient normal dans `bash --norc`, le coupable se trouve dans vos raccourcis : on les retire un par un pour trouver lequel.

## Synthèse des niveaux

| Niveau | Besoin | Outil | Limite |
|---|---|---|---|
| 1 | Un autre nom pour une commande | `alias ll='ls -la'`, `unalias`, `~/.bashrc` | Un texte collé devant les arguments ; pas de `$1` ; perdu à la fermeture du terminal sans `~/.bashrc` |
| 2 | Un argument placé au milieu, un test sur le nombre d'arguments | Fonction avec `"$1"`, `"$@"`, `"$#"` | Plus long à écrire ; propre à la session sans fichier de chargement |
| 3 | Un raccourci dans un script | `shopt -s expand_aliases`, ou mieux, une fonction | Un alias n'existe qu'à la ligne suivante ; un alias du terminal est absent du script |
| 4 | Cohabiter sans surprise | `type -a`, `\nom`, `command nom`, `unalias`, espace finale | `\nom` laisse passer une fonction ; `xargs` et les scripts ignorent les alias |
| 5 | Ranger et diagnostiquer | `~/.bash_aliases` chargé par `~/.bashrc`, `bash --norc` | Un raccourci personnel n'existe pas sur les autres machines |

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| `alias cherche='grep -r "$1" .'` | `$1` n'existe pas dans un alias : il vaut vide, et le mot tapé est collé à la fin | Une fonction avec `"$1"` |
| `$@` sans guillemets | Un nom avec une espace est coupé en plusieurs mots | `"$@"` |
| Alias dans un script sans `shopt` | Les alias sont ignorés dans un shell non interactif | Une fonction |
| Alias défini et utilisé sur la même ligne ou dans le même bloc `{ }` | L'alias n'existe qu'à partir de la ligne lue ensuite | Définir sur une ligne, utiliser plus loin, ou utiliser une fonction |
| Déclarer une fonction du même nom qu'un alias existant | L'alias est développé dans la déclaration : erreur de syntaxe | `unalias nom` avant la fonction |
| Fonction lue avant l'alias qu'elle utilise | Le mot reste ordinaire : le développement a lieu à la lecture du corps | Préférer la commande complète dans une fonction |
| Guillemets doubles autour du texte d'un alias | Les variables sont lues à la création, la valeur est figée | Des guillemets simples |
| Croire que `\nom` contourne tout | Il ne contourne que l'alias : une fonction du même nom répond | `command nom` |
| `alias sudo='sudo '` oublié | `sudo ll` échoue : `ll` n'est pas un premier mot | L'espace finale dans le texte de l'alias |
| Redéfinir une commande dangereuse (`rm`, `cp`, `mv`) en lui ajoutant des options | On s'habitue à une confirmation qui n'existe pas sur les autres machines | Choisir un nouveau nom (`supprimer`) |
| Un alias (ou une fonction) derrière `xargs` | `xargs` lance des programmes, pas des alias de Bash | Un script ou le programme lui-même |
| Alias tapé dans le terminal | Perdu à la fermeture de la fenêtre | L'écrire dans `~/.bash_aliases`, chargé par `~/.bashrc` |
| Modifier `~/.bash_aliases` sans recharger | La session en cours garde l'ancien état | `source ~/.bash_aliases` |
| `. ~/.bash_aliases` sans test `[ -f ... ]` | Une erreur à chaque démarrage si le fichier est absent | `if [ -f ~/.bash_aliases ]; then ... fi` |
| Nom d'alias identique à un programme (`date`) | Le programme est masqué sans avertissement | `type -a nom` avant de choisir |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Un alias pour un simple renommage ou des options fixes, une fonction dès qu'un argument est placé ailleurs qu'à la fin | Chaque outil reste dans son domaine |
| Des guillemets simples autour du texte d'un alias | Les variables sont lues à l'utilisation |
| `"$@"` avec guillemets pour tout transmettre, `"$#"` pour compter | Les noms avec espaces ne sont pas coupés |
| Écrire la commande complète ou une fonction dans un script | Le script marche sur toutes les machines, avec ou sans vos alias |
| `type -a nom` avant de créer un raccourci | Aucun masque involontaire |
| `command nom` pour atteindre la vraie commande | Passe outre alias et fonction |
| Ranger tous les raccourcis dans `~/.bash_aliases`, chargé par `~/.bashrc` avec un test `[ -f ... ]` | Un `~/.bashrc` court, des raccourcis faciles à sauvegarder |
| `bash --norc` quand un comportement paraît étrange | Écarter les raccourcis comme cause |
| Garder ses raccourcis peu nombreux et nommés sans ambiguïté | On les retient, et on évite de masquer une commande utile |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un **alias** est un **texte** substitué au premier mot tapé, **avant** l'analyse de la ligne : `alias ll='ls -la'` crée, `alias` liste, `unalias ll` supprime, et `~/.bashrc` le rend permanent. Les arguments tapés arrivent **à la fin** : un alias n'a pas de `$1`, donc `alias cherche='grep -r "$1" .'` échoue. Une **fonction** reçoit `$1`, `"$@"` (tous les arguments, un mot chacun) et `"$#"` (leur nombre). Un script n'a pas les alias par défaut ; `shopt -s expand_aliases` les active, mais l'alias n'existe qu'à la ligne suivante, hors du bloc ou de la fonction qui le définit : on préfère une fonction. Ordre de réponse : alias, puis fonction, puis commande interne, puis programme ; `type -a nom` les liste. `\nom` passe outre l'alias seul, `command nom` passe outre alias et fonction. Un alias qui s'appelle lui-même ne boucle pas, car le mot identique n'est pas développé deux fois. Une espace finale (`alias sudo='sudo '`) fait développer le mot suivant. On range ses raccourcis dans `~/.bash_aliases`, chargé par `~/.bashrc` avec `[ -f ... ]`, et `bash --norc` les écarte pour diagnostiquer. |
| **Pièges à éviter** | `$1` dans un alias ; `$@` sans guillemets ; alias dans un script sans `shopt` ; alias défini et utilisé dans la même ligne ou le même bloc ; fonction déclarée sans avoir supprimé l'alias de même nom ; fonction lue avant son alias ; guillemets doubles autour d'un alias ; croire que `\nom` contourne une fonction ; oublier l'espace finale de `sudo` ; redéfinir `rm`, `cp` ou `mv` ; alias derrière `xargs` ; alias perdu à la fermeture du terminal ; fichier de raccourcis modifié mais non rechargé ; `. fichier` sans test d'existence ; nom d'alias qui masque un programme. |
| **Bonnes pratiques** | Alias pour renommer, fonction dès qu'un argument est placé ailleurs qu'à la fin ; guillemets simples ; `"$@"` et `"$#"` ; commande complète ou fonction dans un script ; `type -a nom` avant de nommer ; `command nom` pour atteindre la vraie commande ; raccourcis dans `~/.bash_aliases` ; `bash --norc` pour écarter ses raccourcis lors d'un diagnostic. |
