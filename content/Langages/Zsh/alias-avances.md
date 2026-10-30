---
order: 8
---

# Alias avancés en Zsh

Un **alias** est un raccourci : un nom court que l'on tape à la place d'une commande plus longue. Ce chapitre suppose que vous savez ouvrir un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la fenêtre où l'on tape des instructions au clavier) et y lancer une commande simple comme `ls` (voir [les commandes de base](/?c=langages&s=bash&p=commandes-de-base)). Le **shell** est le programme qui lit ce que l'on tape dans le terminal et l'exécute ; celui de ce chapitre est [Zsh](/?c=langages&s=zsh&p=zsh). Une **commande** est une instruction tapée dans le terminal (`ls`), un **argument** est tout ce qui s'écrit après son nom (`/tmp` dans `ls /tmp`), et une **option** est un argument qui commence par un tiret (`-l`). La **session** est la période qui va de l'ouverture de la fenêtre du terminal à sa fermeture.

La mécanique des alias est la même dans [Bash](/?c=langages&s=bash&p=bash) et dans Zsh. Tout ce qui est identique est donc résumé ici en une phrase et renvoyé vers le chapitre [Alias avancés en Bash](/?c=langages&s=bash&p=alias-avances) ; ce chapitre détaille **ce qui diffère ou s'ajoute dans Zsh**, **en cinq niveaux**, chacun s'appuyant sur le précédent :

| Niveau | Besoin | Outil | Section |
|---|---|---|---|
| 1 | Un autre nom pour une commande | `alias`, `unalias`, `~/.zshrc` | [Niveau 1](#niveau-1-l-alias-simple) |
| 2 | Une commande qui reçoit des arguments au milieu | Une **fonction** (un groupe de commandes rangé sous un nom : `$1`, `"$@"`, `"$#"`) | [Niveau 2](#niveau-2-alias-ou-fonction-avec-arguments) |
| 3 | Utiliser un raccourci dans un script | L'option `aliases` (active par défaut), ou mieux, une fonction | [Niveau 3](#niveau-3-les-alias-dans-un-script) |
| 4 | Un raccourci qui agit n'importe où dans la ligne, ou selon l'extension d'un fichier | `alias -g` (alias globaux), `alias -s` (alias de suffixe) | [Niveau 4](#niveau-4-alias-globaux-et-alias-de-suffixe) |
| 5 | Faire cohabiter, ranger et diagnostiquer | `\nom`, `command`, `whence -a`, `~/.zsh_aliases`, `zsh -f` | [Niveau 5](#niveau-5-contournement-cohabitation-et-organisation) |

Le même sujet existe pour un autre shell : [les alias et raccourcis en PowerShell](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), où l'alias est beaucoup plus limité.

## Ce qu'est un alias pour Zsh, et ce qui ne change pas

Comme dans Bash, un alias est un **texte de remplacement** : Zsh remplace le mot tapé par le texte de l'alias **avant d'analyser la ligne**, c'est-à-dire avant de la découper en mots et de traiter les [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) (des boîtes étiquetées qui contiennent une valeur) et les [jokers](/?c=langages&s=bash&p=expansion-et-jokers) (des motifs comme `*.txt`, que le shell remplace par les noms de fichiers correspondants) (voir [ce qu'est un alias pour Bash](/?c=langages&s=bash&p=alias-avances#ce-qu-est-un-alias-pour-bash)). Ce remplacement s'appelle le **développement** de l'alias (en anglais *alias expansion*). Le manuel de Zsh le décrit dans [sa section « Aliasing »](https://zsh.sourceforge.io/Doc/Release/Shell-Grammar.html#Aliasing).

Le tableau suivant résume, pour chaque point, ce qui est vrai à l'identique dans les deux shells (vérifié par l'expérience) et ce qui diffère. Les différences sont détaillées dans les niveaux indiqués.

| Point | Bash | Zsh | Niveau |
|---|---|---|---|
| L'alias est un texte substitué avant l'analyse de la ligne | Oui | Oui, identique | Ce niveau |
| `$1` dans le texte d'un alias | Absent : il vaut vide | Absent, identique | [2](#niveau-2-alias-ou-fonction-avec-arguments) |
| Fonction du même nom qu'un alias, écrite `nom() { ... }` | Erreur de syntaxe | Erreur, avec un message plus explicite | [2](#niveau-2-alias-ou-fonction-avec-arguments) |
| `$@` sans guillemets | Coupé à chaque espace, et les jokers sont développés | **Non coupé**, jokers non développés | [2](#niveau-2-alias-ou-fonction-avec-arguments) |
| Alias défini dans un script, puis utilisé | Ignoré, sauf avec `shopt -s expand_aliases` | **Développé** : l'option `aliases` est active partout | [3](#niveau-3-les-alias-dans-un-script) |
| Alias défini et utilisé sur la même ligne ou dans le même bloc | N'existe pas encore | Identique | [3](#niveau-3-les-alias-dans-un-script) |
| Alias qui agit ailleurs qu'en premier mot | Seulement avec l'espace finale | Alias globaux (`alias -g`) | [4](#niveau-4-alias-globaux-et-alias-de-suffixe) |
| Lancer un fichier d'après son extension | N'existe pas | Alias de suffixe (`alias -s`) | [4](#niveau-4-alias-globaux-et-alias-de-suffixe) |
| Afficher ce qui répond à un nom | `type -a nom` | `type -a nom` ou `whence -a nom` | [5](#niveau-5-contournement-cohabitation-et-organisation) |
| Fichier de raccourcis personnels | `~/.bashrc`, `~/.bash_aliases` | `~/.zshrc`, `~/.zsh_aliases` | [5](#niveau-5-contournement-cohabitation-et-organisation) |

## Niveau 1 : l'alias simple

La syntaxe est celle de Bash : `alias nom='texte'` crée un alias, `alias` seul les liste, `unalias nom` en supprime un. Les guillemets simples autour du texte laissent aussi les variables intactes jusqu'à l'utilisation de l'alias : l'expérience du chapitre Bash (voir [guillemets simples ou doubles](/?c=langages&s=bash&p=alias-avances#simples-ou-doubles-guillemets-quand-les-variables-sont-elles-lues)) donne, sous Zsh, `1` avec des guillemets doubles et `2` avec des guillemets simples. Ce qui change est l'**affichage** des listes.

Une précaution avant de recopier les blocs de ce chapitre dans un terminal : ils portent des **commentaires**, c'est-à-dire des textes qui commencent par `#` et que le shell ignore. Un Zsh qui lit un script les ignore, mais un Zsh **interactif** ne les reconnaît que si l'option `interactive_comments` est active (voir [le système d'options](/?c=langages&s=zsh&p=options-du-shell)) ; sinon il tente de lancer une commande nommée `#` et répond `zsh: command not found: #`.

```zsh
# setopt active une option du shell : ici, les commentaires deviennent acceptés
setopt interactive_comments
```

La première ligne de ce bloc est elle-même un commentaire : elle provoque l'erreur une dernière fois, il suffit donc de taper la seconde. Pour que l'option soit active dans chaque session, on l'ajoute à `~/.zshrc` (voir [la fin de ce niveau](#rendre-un-alias-permanent-zshrc)). Les blocs suivants supposent l'option activée.

```zsh
# alias nom='texte' : crée l'alias ll ; le texte entre guillemets simples est gardé tel quel
alias ll='ls -la'
# alias sans argument : liste tous les alias de la session, sous la forme nom='texte'
alias
# alias suivi d'un nom : affiche la définition de cet alias seulement
alias ll
# alias -L : liste sous forme de commandes complètes, qu'on peut recopier dans un fichier
alias -L
# unalias supprime l'alias ll pour la session en cours
unalias ll
# ll n'est plus connu : Zsh répond « command not found: ll » (« commande introuvable »)
ll
```

Dans une session vierge (lancée par `zsh -f`, voir [le niveau 5](#diagnostiquer-zsh-f)), ces commandes affichent :

```text
ll='ls -la'
run-help=man
which-command=whence
ll='ls -la'
alias ll='ls -la'
alias run-help=man
alias which-command=whence
zsh: command not found: ll
```

L'option `-la` regroupe `-l` (une ligne détaillée par fichier) et `-a` (afficher aussi les éléments cachés) : voir [la commande `ls`](/?c=langages&s=bash&p=commandes-de-base#lister-un-dossier-ls). Trois différences avec Bash apparaissent :

| Observation | Bash | Zsh |
|---|---|---|
| Forme d'une ligne de `alias` | `alias ll='ls -la'` | `ll='ls -la'` (sans le mot `alias`) |
| Forme réutilisable telle quelle | La sortie de `alias` | La sortie de **`alias -L`** : `alias ll='ls -la'` |
| Alias présents dans une session vierge | Aucun | Deux, définis par Zsh lui-même : `run-help` (qui désigne `man`, la commande qui affiche le manuel d'une commande, voir [`man`](/?c=langages&s=bash&p=commandes-de-base#obtenir-de-l-aide-man-et-help)) et `which-command` (qui désigne `whence`, voir le [niveau 5](#niveau-5-contournement-cohabitation-et-organisation)) |

Les deux alias de départ varient selon la configuration du système : certains fichiers de configuration en retirent un. Le message d'erreur dépend de la langue du système. Pour le reste, les commandes de gestion sont celles de Bash :

| Commande | Effet |
|---|---|
| `alias nom='texte'` | Crée ou remplace l'alias `nom` |
| `alias` | Liste tous les alias (la suite de ce chapitre ajoute `-r`, `-g`, `-s`, `-L`, `-m`) |
| `alias nom` | Affiche la définition de `nom` ; n'affiche rien et termine en échec si `nom` n'est pas un alias |
| `unalias nom` | Supprime l'alias `nom` ; affiche `no such hash table element: nom` si l'alias n'existe pas |
| `unalias -a` | Supprime tous les alias de la session, ceux de Zsh compris |

### Rendre un alias permanent : `~/.zshrc`

Un alias tapé dans le terminal vit **en mémoire**, dans la session. Pour le retrouver à chaque ouverture, on l'écrit dans le fichier `~/.zshrc`, que Zsh lit au démarrage de chaque terminal interactif (voir [les fichiers de démarrage](/?c=langages&s=zsh&p=fichiers-de-demarrage)). Le signe `~` désigne votre dossier personnel.

```zsh
# echo affiche le texte ; >> (redirection) l'ajoute à la fin du fichier ~/.zshrc
echo "alias ll='ls -la'" >> ~/.zshrc
# source lit le fichier et exécute ses lignes dans la session en cours
# (inutile de rouvrir le terminal)
source ~/.zshrc
```

La redirection `>>` est expliquée dans [les redirections et les pipes](/?c=langages&s=bash&p=redirections-et-pipes). Si vous avez installé [Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh), le `~/.zshrc` existe déjà et contient d'autres lignes : on ajoute les siennes **à la fin** (voir le [niveau 5](#les-alias-d-oh-my-zsh)).

## Niveau 2 : alias ou fonction avec arguments

La limite est la même qu'en Bash : un alias ne peut que coller son texte devant les arguments tapés, il n'a pas de `$1` (voir [le niveau 2 du chapitre Bash](/?c=langages&s=bash&p=alias-avances#niveau-2-alias-ou-fonction-avec-arguments)). Préparons le même dossier d'essai :

```zsh
# mkdir crée un dossier ; essai est notre dossier de travail
mkdir essai
# cd s'y place
cd essai
# crée un sous-dossier nommé sub
mkdir sub
# echo affiche son texte ; > l'écrit dans le fichier a.txt (créé s'il n'existe pas)
echo "bonjour" > a.txt
# un nom de fichier avec une espace : il nous servira plus bas
echo "bonjour le monde" > "mon fichier.txt"
# un fichier dans le sous-dossier
echo "au revoir" > sub/b.txt
```

Voici l'alias qui ne fonctionne pas. `grep` cherche du texte (voir [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-rechercher-du-texte)), `-r` le fait descendre dans les sous-dossiers, et le point `.` désigne le dossier courant.

```zsh
# l'alias doit lancer : grep -r "mot" .  (avec le mot tapé à la place de $1)
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

L'ordre des fichiers peut varier d'un système à l'autre. Le résultat est celui de Bash et l'explication aussi (voir [l'alias qui ne fonctionne pas](/?c=langages&s=bash&p=alias-avances#l-alias-qui-ne-fonctionne-pas)) : la ligne devient `grep -r "$1" . bonjour`, `$1` est lu comme variable du terminal, où il n'existe pas, et `bonjour` est pris pour un nom de fichier. Il faut une **fonction**.

### Déclarer la fonction : deux écritures, et un piège de nom

Une fonction regroupe des commandes sous un nom ; elle reçoit ses arguments dans `$1`, `$2`... (voir [les fonctions](/?c=langages&s=bash&p=fonctions)). Zsh accepte les écritures de Bash et en ajoute une :

| Écriture | Résultat dans Zsh |
|---|---|
| `nom() { ... }` | Déclare la fonction (l'écriture de Bash) |
| `function nom { ... }` | Déclare la fonction (le mot `function`, sans parenthèses) |
| `function nom() { ... }` | Déclare la fonction (les deux ensemble) |

Les trois écritures donnent une fonction identique. Voici la première, saisie dans le terminal sur plusieurs lignes (Zsh affiche une invite de continuation, c'est-à-dire un court texte au début de chaque nouvelle ligne, tant que l'accolade fermante manque) :

```zsh
# le mot cherche est encore un alias : on le supprime avant de déclarer la fonction
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

Que se passe-t-il si l'on oublie le `unalias` ? Comme dans Bash, le mot `cherche` est un premier mot : Zsh le développe aussi dans la déclaration. La différence est le **message**, plus explicite que le « syntax error » de Bash. On recrée l'alias pour le constater, puis on teste l'autre écriture :

```zsh
# on recrée l'alias supprimé plus haut
alias cherche='grep -r "$1" .'
# déclaration d'une fonction du même nom, en une ligne (; sépare deux commandes)
cherche() { grep -r "$1" . ; }
# l'autre écriture : le nom n'est pas en première position, l'alias n'est pas développé
function cherche { grep -r "$1" . ; }
# type -a liste toutes les réponses possibles au nom, de la plus prioritaire à la moins
type -a cherche
```

```text
zsh: defining function based on alias `cherche'
zsh: parse error near `()'
cherche is an alias for grep -r "$1" .
cherche is a shell function
```

La déclaration `cherche() { ... }` échoue avec deux messages. L'écriture `function cherche { ... }` **réussit sans bruit**, mais c'est un piège : l'alias reste prioritaire (il est listé en premier par `type -a`), donc taper `cherche` lance toujours l'alias, jamais la fonction. **On supprime donc toujours l'alias avant de déclarer une fonction du même nom**, quelle que soit l'écriture. On range ensuite le terminal :

```zsh
# supprime l'alias et la fonction cherche, pour repartir d'un terminal propre
unalias cherche
# unfunction supprime une fonction (le tableau plus bas donne l'équivalent unset -f)
unfunction cherche
```

### `$@` sans guillemets : le piège de Bash n'existe pas

Dans Bash, `$@` sans guillemets coupe un nom de fichier contenant une espace en deux mots (voir [la fonction : `$1`, `"$@"` et `"$#"`](/?c=langages&s=bash&p=alias-avances#la-fonction-1-et)). Zsh se comporte autrement. `printf` affiche un texte d'après un modèle : ici `[%s]` est répété pour chaque argument, et `\n` fait passer à la ligne.

```zsh
# resumer() affiche le nombre d'arguments, puis chacun entre crochets
resumer() {
    # "$#" : nombre d'arguments reçus
    echo "$# arguments"
    # "$@" : chaque argument reste un mot entier
    printf '[%s]\n' "$@"
}
# mauvais() fait pareil, mais $@ n'a PAS de guillemets
mauvais() {
    # Bash recouperait ici à chaque espace ; Zsh ne le fait pas
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
[mon fichier.txt]
[c]
```

Les deux versions donnent **trois** mots : Zsh ne découpe pas le contenu d'une variable sur les espaces (voir [le découpage de mot dans Zsh](/?c=langages&s=zsh&p=zsh#le-decoupage-de-mot-sur-une-variable-non-quotee)). Les deux fonctions ne sont pourtant pas équivalentes. Avec les arguments `"*.txt"` (un joker : le shell le remplacerait par les noms de fichiers correspondants) et `""` (un argument vide), dans le dossier `essai` :

| | Bash | Zsh |
|---|---|---|
| `printf '[%s]\n' "$@"` | `[*.txt]` puis `[]` | `[*.txt]` puis `[]` |
| `printf '[%s]\n' $@` | `[a.txt]` puis `[mon fichier.txt]` : le joker est développé, l'argument vide disparaît | `[*.txt]` seulement : le joker n'est pas développé, mais l'argument vide disparaît |

Zsh est plus sûr que Bash sur ce point, mais **l'argument vide disparaît quand même** sans guillemets. Un script écrit pour Zsh peut aussi être lancé par Bash : on écrit donc `"$@"` partout, avec les guillemets.

`"$#"` (le nombre d'arguments) fonctionne comme dans Bash. Zsh ajoute `$argv`, un synonyme de `$@` : `$argv[1]` vaut `$1` et `$#argv` vaut `$#`. Le dernier exemple refuse un appel sans argument. `if` teste une condition (voir [les conditions](/?c=langages&s=bash&p=conditions)), `-lt` signifie « inférieur à », `return 1` termine la fonction avec le code d'échec 1, et `${2:-.}` vaut le deuxième argument s'il est donné, sinon le point.

```zsh
# cherche2() : cherche un mot, dans un dossier donné ou, à défaut, dans le dossier courant
cherche2() {
    # si le nombre d'arguments est inférieur à 1, la commande est incomplète
    if [ "$#" -lt 1 ]; then
        # affiche le mode d'emploi, puis sort de la fonction avec le code d'échec 1
        echo "usage : cherche2 MOT [DOSSIER]"
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
usage : cherche2 MOT [DOSSIER]
./sub/b.txt:1:au revoir
```

Le dernier appel n'affiche rien : `bonjour` n'apparaît pas dans `sub`, et `grep` termine avec le code 1 (échec). Voici comment gérer les fonctions elles-mêmes dans Zsh :

| Je veux | Écriture | Remarque |
|---|---|---|
| Savoir si `nom` est une fonction | `type nom` | Affiche `nom is a shell function` |
| Lire le code de la fonction | `whence -f nom`, `which nom` ou `functions nom` | Les trois affichent le corps de la fonction |
| Supprimer la fonction | `unfunction nom` ou `unset -f nom` (`unset` défait un nom, `-f` désigne une fonction) | Disparaît jusqu'à la prochaine session |
| La garder pour toujours | La placer dans `~/.zshrc` ou dans un fichier chargé par lui | Voir le [niveau 5](#organiser-ses-raccourcis) |

## Niveau 3 : les alias dans un script

Un **script** est un fichier texte qui contient des commandes, exécutées l'une après l'autre (voir [écrire et exécuter un script](/?c=langages&s=bash&p=scripts-et-shebang)). On le lance ici par `zsh nom.zsh`, ce qui démarre un **nouveau** Zsh qui lit le fichier. Un **shell interactif** est un shell qui attend vos commandes tapées au clavier dans un terminal ; un shell **non interactif** est un shell qui lit un script.

### Par défaut, un script développe les alias

C'est la grande différence avec Bash, où les alias ne sont développés que dans un shell interactif. Une **option** du shell est un réglage qui change son comportement (voir [le système d'options](/?c=langages&s=zsh&p=options-du-shell)). L'option qui commande les alias s'appelle `aliases` et elle est **active dans tous les Zsh**, interactifs ou non.

```zsh
# --- contenu de direct.zsh ---
# alias : crée l'alias saluer, qui remplace ce mot par « echo bonjour »
alias saluer='echo bonjour'
# on utilise l'alias sur la ligne suivante
saluer le monde
# cette ligne affiche un message de fin
echo "fin du script"
```

```zsh
# lance le script dans un nouveau Zsh non interactif
zsh direct.zsh
```

```text
bonjour le monde
fin du script
```

Aucun réglage n'est nécessaire (Bash exige `shopt -s expand_aliases`, voir [les alias dans un script avec Bash](/?c=langages&s=bash&p=alias-avances#niveau-3-les-alias-dans-un-script)). Pour interroger l'état d'une option, `[[ -o nom ]]` est vrai si l'option est active (les doubles crochets `[[ ]]` testent une condition). `unsetopt` désactive une option, `setopt` l'active (voir [le système d'options](/?c=langages&s=zsh&p=options-du-shell)), et `setopt no_aliases` est une autre écriture de `unsetopt aliases` : le préfixe `no_` inverse le sens d'une option.

```zsh
# --- contenu de sans-alias.zsh ---
# désactive l'option aliases : plus aucun alias n'est développé à partir d'ici
setopt no_aliases
# la commande alias fonctionne toujours : l'alias est créé...
alias saluer='echo bonjour'
# ... mais le mot saluer n'est plus remplacé : Zsh cherche une commande de ce nom
saluer le monde
# cette ligne prouve que le script continue malgré l'erreur
echo "fin du script"
```

```zsh
# --- contenu de etat.zsh ---
# [[ -o aliases ]] est vrai si l'option aliases est active
if [[ -o aliases ]]; then echo "aliases : actif"; else echo "aliases : inactif"; fi
```

```zsh
# lance les deux scripts
zsh sans-alias.zsh
zsh etat.zsh
```

```text
sans-alias.zsh:6: command not found: saluer
fin du script
aliases : actif
```

Le premier message nomme le fichier et le numéro de la ligne (`:6`, les lignes de commentaire comptent). Un script lancé directement (avec une première ligne `#!/usr/bin/env zsh`, le [shebang](/?c=langages&s=bash&p=scripts-et-shebang#le-shebang)) se comporte de la même façon.

### L'alias du terminal est absent du script

Même si l'option `aliases` est active, un alias créé dans votre terminal n'existe pas dans le script, qui est un autre **processus** (un programme en cours d'exécution, voir [la gestion des processus](/?c=langages&s=bash&p=gestion-des-processus)) :

```zsh
# --- contenu de utilise-alias.zsh ---
# ce script n'a pas créé d'alias saluer : il essaie d'utiliser celui du terminal
saluer toi
```

```zsh
# dans le terminal : l'alias existe pour le terminal
alias saluer='echo bonjour'
# le terminal le développe
saluer le monde
# le script, lui, est un autre Zsh : l'alias n'y est pas
zsh utilise-alias.zsh
```

```text
bonjour le monde
utilise-alias.zsh:2: command not found: saluer
```

Le `:2` est le numéro de la ligne du fichier, la ligne de commentaire comptant pour une.

### Et les alias de `~/.zshrc` ?

Un alias écrit dans `~/.zshrc` est « un alias du terminal » : `~/.zshrc` n'est lu que par un shell interactif, un script ne le lit pas. Le chapitre sur PowerShell l'affirme dans [son tableau de comparaison](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes#et-dans-bash-et-zsh) ; l'expérience le confirme, avec une **nuance** : `~/.zshenv`, lui, est lu par **tous** les Zsh, scripts compris (voir [les quatre fichiers de démarrage](/?c=langages&s=zsh&p=fichiers-de-demarrage)). Pour ne pas toucher à votre vrai `~/.zshrc`, on fabrique un dossier de configuration d'essai. La variable `ZDOTDIR` indique à Zsh le dossier où chercher ses fichiers de démarrage, à la place de votre dossier personnel ; écrite devant une commande (`ZDOTDIR=... commande`), elle ne vaut que pour cette commande. `$PWD` est la variable qui contient le dossier courant, et l'option `-d` demande à Zsh de ne pas lire les fichiers de démarrage du système (voir [le diagnostic](#diagnostiquer-zsh-f)).

```zsh
# crée le dossier de configuration d'essai
mkdir conf
# un alias dans le .zshrc de cette configuration
echo "alias depuiszshrc='echo alias de zshrc'" > conf/.zshrc
# un alias dans le .zshenv de cette configuration
echo "alias depuiszshenv='echo alias de zshenv'" > conf/.zshenv
# un script qui utilise les deux alias (printf écrit un mot par ligne)
printf '%s\n' depuiszshrc depuiszshenv > utilise.zsh
# script lancé normalement (non interactif), avec cette configuration
ZDOTDIR=$PWD/conf zsh utilise.zsh
# même script lu par un Zsh interactif (-i), sans fichiers du système (-d)
ZDOTDIR=$PWD/conf zsh -d -i utilise.zsh
```

```text
utilise.zsh:1: command not found: depuiszshrc
alias de zshenv
alias de zshrc
alias de zshenv
```

| Fichier de démarrage | Lu par `zsh script.zsh` | Lu par un Zsh interactif |
|---|---|---|
| `~/.zshenv` | Oui : ses alias sont visibles du script | Oui |
| `~/.zshrc` | **Non** : ses alias sont absents du script | Oui |

La phrase du chapitre PowerShell est donc exacte pour `~/.zshrc`. Elle ne dit pas que, contrairement à Bash, un script Zsh développe ses **propres** alias. Une conséquence pratique : **jamais d'alias dans `~/.zshenv`**, qui modifieraient en silence le comportement de tous les scripts.

### Le piège de la ligne suivante existe aussi

Le développement d'un alias a lieu **à la lecture**, pas à l'exécution (voir [le piège de la ligne suivante](/?c=langages&s=bash&p=alias-avances#le-piege-de-la-ligne-suivante)) : Zsh lit une commande complète, ou tout un bloc, avant d'en exécuter la moindre. Les quatre scripts de Bash ont donné les mêmes résultats sous Zsh :

```zsh
# --- contenu de meme-ligne.zsh ---
# définition ET usage sur la même ligne : séparés par un point-virgule
alias saluer='echo bonjour'; saluer le monde
# affiche un message de fin
echo "fin du script"
```

```zsh
# --- contenu de bloc.zsh ---
# les accolades { } forment un bloc : Zsh lit tout le bloc avant d'en exécuter une ligne
{
    # définition de l'alias, à l'intérieur du bloc
    alias saluer='echo bonjour'
    # usage dans le même bloc : l'alias est inconnu ici
    saluer le monde
}
# usage après le bloc : le bloc a été exécuté, l'alias existe
saluer encore
```

```zsh
# --- contenu de fonction-avant.zsh ---
# la fonction dire est LUE ici, avant que l'alias existe : saluer y reste un mot ordinaire
dire() { saluer toi; }
# l'alias est créé après la lecture de la fonction
alias saluer='echo bonjour'
# appel de la fonction : elle cherche une commande saluer, et ne trouve rien
dire
```

```zsh
# --- contenu de fonction-apres.zsh ---
# l'alias est créé d'abord
alias saluer='echo bonjour'
# la fonction dire est lue maintenant : saluer y est remplacé par « echo bonjour »
dire() { saluer toi; }
# appel de la fonction : elle affiche bonjour toi
dire
```

```zsh
# lance chacun des quatre scripts
zsh meme-ligne.zsh
zsh bloc.zsh
zsh fonction-avant.zsh
zsh fonction-apres.zsh
```

```text
meme-ligne.zsh:2: command not found: saluer
fin du script
bloc.zsh:6: command not found: saluer
bonjour encore
dire: command not found: saluer
bonjour toi
```

Zsh nomme ici la **fonction** dans le message (`dire:`) au lieu du fichier et de la ligne. Le résumé est celui de Bash, sans le réglage `shopt` :

| Situation | Résultat |
|---|---|
| Définition et usage sur **deux lignes** consécutives | Fonctionne, sans réglage |
| Définition et usage sur la **même ligne** (`;`) | Échoue : l'alias n'existe pas encore à la lecture |
| Définition et usage **dans le même bloc** `{ }` | Échoue ; l'usage **après** le bloc fonctionne |
| Fonction lue **avant** l'alias | Échoue à l'appel, même si l'alias existe à ce moment |
| Fonction lue **après** l'alias | Fonctionne |

Un fichier de raccourcis chargé par `source` est lu quand `source` s'exécute, donc ses alias existent ensuite :

```zsh
# --- contenu de raccourcis.zsh ---
# fichier de raccourcis : il ne contient que la définition d'un alias
alias saluer='echo bonjour'
```

```zsh
# --- contenu de charge.zsh ---
# source lit le fichier raccourcis.zsh et exécute ses lignes dans ce script
source ./raccourcis.zsh
# l'alias créé par le fichier est utilisable à partir d'ici
saluer le monde
```

```zsh
# lance le script : affiche « bonjour le monde »
zsh charge.zsh
```

Que l'option `aliases` soit active ne change donc pas le conseil de Bash : dans un script partagé, on **n'utilise pas d'alias**, on écrit la commande complète ou une fonction. Un alias existe sur votre machine, dans votre configuration ; le script doit marcher partout.

## Niveau 4 : alias globaux et alias de suffixe

Bash ne connaît qu'une sorte d'alias : celui du **premier mot** de la ligne. Zsh en ajoute deux, qui n'existent pas dans Bash. On prépare un fichier de plus dans le dossier d'essai (le dossier `essai` du niveau 2) :

```zsh
# un fichier de notes (extension md), pour l'exemple des alias de suffixe plus bas
echo "# titre" > notes.md
```

### L'alias global : `alias -g`

Un alias **global** est développé **n'importe où dans la ligne**, pas seulement en premier mot. On le crée avec l'option `-g` (de *global*). Les exemples ont un point commun : ils remplacent un morceau de ligne qu'on retape souvent. Un **tube** (*pipe*, le caractère `|`) envoie ce qu'affiche une commande à l'entrée de la suivante, `less` affiche un texte page par page (on quitte par la touche `q`), et `2>/dev/null` jette les messages d'erreur : `2` désigne la sortie d'erreur, `>` la redirige, et `/dev/null` est un fichier spécial qui détruit tout ce qu'on y écrit (voir [les redirections et les pipes](/?c=langages&s=bash&p=redirections-et-pipes)).

```zsh
# -g : alias global ; le mot L sera remplacé par « | less » où qu'il soit dans la ligne
alias -g L='| less'
# NE (« no errors ») : les messages d'erreur de la commande sont jetés
alias -g NE='2>/dev/null'
# G : envoie le résultat à grep, la commande qui cherche un mot (voir plus haut)
alias -g G='| grep'
# alias -g sans nom : liste seulement les alias globaux
alias -g
# ls sub liste le contenu du dossier sub ; L envoie le résultat à less
ls sub L
# ls G txt devient « ls | grep txt » : seuls les noms qui contiennent txt s'affichent
ls G txt
# trois morceaux : « ls | grep txt | less »
ls G txt L
# ls échoue (le dossier n'existe pas), NE jette le message d'erreur
ls /inexistant NE
# $? contient le code de sortie de la dernière commande : 0 pour un succès, sinon un échec
echo "code=$?"
```

```text
G='| grep'
L='| less'
NE='2>/dev/null'
b.txt
a.txt
mon fichier.txt
a.txt
mon fichier.txt
code=2
```

(Dans un vrai terminal, `ls sub L` ouvre `less` ; il s'affiche ici comme un simple texte parce que la sortie n'est pas un écran. Les codes de sortie sont expliqués dans [le chapitre sur les scripts](/?c=langages&s=bash&p=scripts-et-shebang#codes-de-sortie-exit).) Le schéma suivant montre ce que Zsh fait de la ligne `ls G txt L` :

```
   Vous tapez :   ls G txt L
                   |
   1. Zsh examine CHAQUE mot, pas seulement le premier
   2. G est un alias global : il est remplacé par  | grep
   3. L est un alias global : il est remplacé par  | less
   4. ls et txt ne sont pas des alias : ils restent tels quels
                   |
                   v
   Zsh analyse et exécute :   ls | grep txt | less
```

### Les pièges de l'alias global

Un alias global est puissant, donc dangereux : il est remplacé **partout**, y compris là où le mot `G` était un simple texte.

```zsh
# G est développé même ici : la ligne devient « echo | grep » (grep sans texte à chercher)
echo G
# entre guillemets, le mot reste un texte ordinaire
echo "G"
# précédé d'un antislash, il reste aussi un texte ordinaire
echo \G
# entre guillemets simples : rien n'est développé
echo 'a G b'
# un alias global en premier mot donne une ligne qui commence par un tube
G
# sans guillemets, G serait développé avant que unalias le lise
unalias G
# avec des guillemets, le nom est lu tel quel : l'alias est supprimé
unalias 'G'
```

```text
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
G
G
a G b
zsh: parse error near `|'
unalias: not enough arguments
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
```

Le dernier `unalias 'G'` réussit sans rien afficher. Les trois commandes qui nomment un alias (`alias`, `unalias`, `unhash`) subissent la même règle : un alias global doit y être écrit **entre guillemets** (`unalias 'G'`) ou précédé d'un antislash (`unalias \G`).

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| Un alias global dont le nom est un mot que l'on écrit parfois comme texte (`echo G`, `echo 3 L 4`) | Le texte est remplacé par un tube : la ligne change de sens | Des noms en majuscules, courts et sans sens courant (`NE`, `G`) ; guillemets ou antislash pour le texte |
| Un alias global en premier mot | La ligne commence par un tube : erreur d'analyse | Ne jamais l'utiliser seul |
| `unalias G`, `alias G`, `unhash -a G` sans guillemets | Le nom est développé avant d'être lu | `unalias 'G'` |
| Des alias globaux dans les commandes des autres (scripts, documentation) | `ls G txt L` est illisible pour qui ne connaît pas vos alias | Un alias global seulement pour la saisie à la main, jamais dans un script partagé |
| Un alias global qui cache une redirection (`NE`) | On oublie que les erreurs sont jetées, donc qu'une commande échoue sans bruit | Garder `NE` pour les commandes dont on connaît les messages inutiles |

### L'alias de suffixe : `alias -s`

Un alias de **suffixe** (*suffix alias*) est lié à l'**extension** d'un fichier, c'est-à-dire aux lettres après le dernier point de son nom (`txt` dans `a.txt`). On le crée avec `-s` : `alias -s txt=cat` signifie « un mot qui se termine par `.txt` et qui est tapé **en premier** est précédé de `cat` ». `cat` affiche le contenu d'un fichier (voir [`cat`](/?c=langages&s=bash&p=commandes-de-base#lire-le-contenu-d-un-fichier-cat)), `head` en affiche les premières lignes (dix par défaut).

```zsh
# -s : alias de suffixe ; a.txt tapé seul lance « cat a.txt »
alias -s txt=cat
# idem pour l'extension md, avec la commande head
alias -s md=head
# alias -s sans nom : liste les alias de suffixe
alias -s
# le nom du fichier est le premier mot : Zsh lance « cat a.txt »
a.txt
# un chemin avec un dossier fonctionne aussi
sub/b.txt
# le fichier notes.md est lu par head
notes.md
# le fichier n'existe pas : l'alias est appliqué quand même, cat se plaint
inexistant.txt
# les espaces doivent être protégées par un antislash
mon\ fichier.txt
# entre guillemets, le mot n'est plus un nom de fichier pour Zsh : l'alias est ignoré
"mon fichier.txt"
```

```text
md=head
txt=cat
bonjour
au revoir
# titre
cat: inexistant.txt: No such file or directory
bonjour le monde
zsh: command not found: mon fichier.txt
```

Ce qui est observé, contrairement à ce qu'on suppose souvent :

| Cas | Résultat |
|---|---|
| `a.txt` (le fichier existe) | `cat a.txt` est lancé |
| `inexistant.txt` (le fichier n'existe pas) | `cat inexistant.txt` est lancé quand même : l'alias dépend du **nom**, pas du fichier |
| `./a.txt`, `sub/b.txt`, `~/notes.txt` | L'alias s'applique : le chemin compte pour sa fin seulement |
| `a.TXT` | Aucun alias : l'extension est **sensible à la casse** (majuscules et minuscules sont différentes) |
| `"mon fichier.txt"` ou `'mon fichier.txt'` | Aucun alias : un mot entre guillemets n'est pas reconnu ; on écrit `mon\ fichier.txt` |
| `echo a.txt` | Aucun alias : seul le **premier mot** de la ligne est regardé |
| `a.txt autre` | `cat a.txt autre` : le reste de la ligne suit le nom du fichier |
| Un dossier nommé `doc.txt` | `cat: doc.txt: Is a directory` : `cat` ne lit pas un dossier |
| Un programme exécutable nommé `prog.txt`, lancé par `./prog.txt` | L'alias passe **avant** : `cat` affiche le script au lieu de l'exécuter |

Le texte d'un alias de suffixe peut contenir des options (`alias -s txt='cat -n'` numérote les lignes). `alias` sans option ne liste **pas** les alias de suffixe, il faut `alias -s` (ou `alias -sL` pour la forme recopiable : `alias -s txt=cat`). Pour en supprimer un : `unalias -s txt`.

### Lister les alias : toutes les options

| Commande | Ce qu'elle liste |
|---|---|
| `alias` | Les alias réguliers **et** les alias globaux (sans les distinguer), pas les alias de suffixe |
| `alias -r` | Les alias **réguliers** seulement (*regular*), ceux du premier mot |
| `alias -g` | Les alias globaux seulement |
| `alias -s` | Les alias de suffixe seulement |
| `alias -L` | Les alias réguliers et globaux, sous forme de commandes complètes (`alias -g G='...'`) qu'on peut recopier dans un fichier |
| `alias -gL`, `alias -sL` | Même forme, limitée aux alias globaux ou de suffixe |
| `alias -m 'motif'` | Les alias dont le **nom** correspond au motif (voir ci-dessous) |

Un **motif** (*pattern*) est un modèle de texte avec des jokers : `N*` désigne tous les noms qui commencent par `N`. Il faut le protéger par des guillemets simples, sinon Zsh le remplace par des noms de fichiers avant que `alias` le voie, et répond `zsh: no matches found: N*` si aucun fichier ne correspond. Avec les alias créés plus haut :

```zsh
# alias dont le nom commence par N : NE
alias -m 'N*'
# alias dont le nom se termine par E : NE aussi (la casse compte)
alias -m '*E'
# alias dont le nom commence par which : which-command
alias -m 'which*'
# unalias accepte aussi -m : supprime tous les alias dont le nom commence par k
alias k1=echo k2=echo
unalias -m 'k*'
# k1 et k2 n'existent plus : alias n'affiche rien
alias k1
```

```text
NE='2>/dev/null'
NE='2>/dev/null'
which-command=whence
```

## Niveau 5 : contournement, cohabitation et organisation

### Qui répond quand on tape un nom ?

Le même nom peut désigner un alias, une fonction, une commande interne (*builtin* : une commande intégrée à Zsh lui-même, comme `cd`) et un programme (un fichier exécutable, comme `/usr/bin/date`). L'ordre de priorité est celui de Bash (voir [qui répond quand on tape un nom](/?c=langages&s=bash&p=alias-avances#qui-repond-quand-on-tape-un-nom)) : **alias, puis fonction, puis commande interne, puis programme**. Les mots réservés (`if`, `for`...) forment une catégorie à part : `whence -w if` répond `if: reserved`.

Zsh offre **trois commandes** pour afficher les réponses, en plus de `type -a` de Bash : `whence` (de l'anglais « d'où vient ce mot ? »), `which` et `where`. Avec `date`, un programme auquel on ajoute une fonction puis un alias de même nom :

```zsh
# le nom date n'est, pour l'instant, qu'un programme
type -a date
# une fonction nommée date
date() { echo "date (fonction)"; }
# un alias nommé date
alias date='echo "date (alias)"'
# type -a : toutes les réponses, de la plus prioritaire à la moins prioritaire
type -a date
# whence -a : les mêmes réponses, en version courte
whence -a date
# where : les mêmes réponses, avec le code complet de la fonction
where date
# which : seulement la première réponse, celle qui s'exécute
which date
# whence -w : un seul mot, la nature de la première réponse
whence -w date
# qui répond quand on tape le nom ?
date
```

```text
date is /usr/bin/date
date is /bin/date
date is an alias for echo "date (alias)"
date is a shell function
date is /usr/bin/date
date is /bin/date
echo "date (alias)"
date
/usr/bin/date
/bin/date
date: aliased to echo "date (alias)"
date () {
	echo "date (fonction)"
}
/usr/bin/date
/bin/date
date: aliased to echo "date (alias)"
date: alias
date (alias)
```

Le programme apparaît deux fois (`/usr/bin/date` et `/bin/date`) parce que, sur ce système, `/bin` est un **lien** (une entrée de dossier qui en désigne une autre) vers `/usr/bin` : c'est le même fichier, trouvé par deux entrées de `$PATH` (la liste des dossiers où le shell cherche les programmes, voir [`$PATH`](/?c=langages&s=bash&p=variables-denvironnement#path-comment-le-shell-trouve-une-commande)). Ce que chaque commande écrit :

| Commande | Alias | Fonction | Programme |
|---|---|---|---|
| `type -a nom` | `nom is an alias for texte` | `nom is a shell function` | `nom is /chemin` |
| `whence -a nom` | Le texte de l'alias | Le nom seul | Le chemin |
| `where nom` | `nom: aliased to texte` | Le code complet de la fonction | Le chemin |
| `which nom` | `nom: aliased to texte` | Le code complet de la fonction | Le chemin |
| `whence -w nom` | `nom: alias` | `nom: function` | `nom: command` |

`which` ne montre que la **première** réponse (la seule qui s'exécute), `where` et `whence -a` les montrent toutes. `whence -w` donne un mot par nom : `alias`, `function`, `builtin`, `command`, `reserved`, ou `none` si le nom est inconnu (avec le code de sortie 1). C'est l'équivalent du `type -t` de Bash.

### Contourner un alias ou une fonction

```zsh
# le nom date désigne toujours l'alias et la fonction créés plus haut
# \date : l'antislash empêche le développement de l'alias, la fonction répond
\date
# les guillemets ont le même effet que l'antislash
"date"
# command date : ignore l'alias ET la fonction, lance la commande interne ou le programme
command date +%Y
# builtin date : cherche une commande interne seulement ; date n'en est pas une
builtin date
# builtin echo : echo existe en commande interne, elle répond
builtin echo coucou
# unalias date : supprime l'alias ; la fonction répond de nouveau
unalias date
date
# unfunction date : supprime la fonction ; le programme répond de nouveau
unfunction date
date +%Y
```

```text
date (fonction)
date (fonction)
2026
zsh: no such builtin: date
coucou
date (fonction)
2026
```

Le nombre `2026` est l'année en cours au moment de l'essai. `+%Y` est l'argument qui demande à `date` d'afficher l'année seule.

| Je veux | Écriture | Ce qui est ignoré |
|---|---|---|
| Passer outre l'alias | `\nom`, `"nom"` ou `'nom'` | L'alias seulement : une **fonction** du même nom répond |
| Passer outre alias **et** fonction | `command nom` | Alias et fonctions : la commande interne ou le programme répond |
| Forcer une commande interne | `builtin nom` | Alias, fonctions et programmes (`no such builtin` si `nom` n'en est pas une) |
| Supprimer l'alias | `unalias nom` | Rien : il disparaît jusqu'à la prochaine session |
| Supprimer la fonction | `unfunction nom` ou `unset -f nom` | Rien : elle disparaît jusqu'à la prochaine session |
| Supprimer par la table de hachage | `unhash -a nom` (alias), `unhash -f nom` (fonction), `unhash -s ext` (alias de suffixe) | Rien : mêmes effets que les commandes ci-dessus |

`unhash` retire un nom d'une des tables de recherche internes de Zsh (les « tables de hachage », où il range ses alias, ses fonctions et ses alias de suffixe) ; sans option, il oublie le chemin mémorisé d'un programme. Avec `-a`, `-f` ou `-s`, il fait donc doublon avec `unalias`, `unfunction` et `unalias -s`.

### Ce qui ne change pas : l'alias qui s'appelle lui-même, l'espace finale, `xargs`

Trois comportements de Bash sont identiques sous Zsh. Un alias peut contenir le nom qu'il remplace sans boucle infinie ; si le texte d'un alias se termine par une espace, le mot suivant est aussi regardé comme alias ; `xargs` (un programme qui lit des mots et les ajoute en arguments d'une commande) ne connaît pas les alias du shell. Les explications sont dans [le niveau 4 du chapitre Bash](/?c=langages&s=bash&p=alias-avances#niveau-4-contournement-et-cohabitation) ; voici les résultats observés dans Zsh.

```zsh
# l'alias ls ajoute --color=auto (couleurs si la sortie est un terminal) à la vraie commande
alias ls='ls --color=auto'
# type affiche ce qu'est ls : le mot ls du texte n'est pas développé une seconde fois
type ls
# deux alias qui se renvoient l'un à l'autre : a vers b, b vers a
alias a='b'
alias b='a'
# a devient b, b devient a, et a n'est pas développé une seconde fois : pas de boucle
a
# ecrire désigne echo (sans espace finale), monde est un texte de remplacement
alias ecrire='echo'
alias monde='tout le monde'
# le mot monde n'est pas un premier mot : il s'affiche tel quel
ecrire monde
# on redéfinit ecrire avec une espace À LA FIN du texte
alias ecrire='echo '
# le mot qui suit ecrire est maintenant regardé comme alias : monde est développé
ecrire monde
# l'alias saluer existe pour le terminal
alias saluer='echo bonjour'
# xargs cherche un PROGRAMME nommé saluer : il ne connaît pas les alias de Zsh
echo toi | xargs saluer
# on retire les alias de l'exemple
unalias ls a b ecrire monde saluer
```

```text
ls is an alias for ls --color=auto
zsh: command not found: a
monde
tout le monde
xargs: saluer: No such file or directory
```

### Les options de Zsh liées aux alias

Trois options de Zsh concernent les alias (voir [le système d'options](/?c=langages&s=zsh&p=options-du-shell) pour `setopt` et `unsetopt`, et [la liste officielle des options](https://zsh.sourceforge.io/Doc/Release/Options.html) pour leur description complète) :

| Option | Valeur par défaut | Effet |
|---|---|---|
| `aliases` | Active | Si elle est désactivée (`unsetopt aliases`), aucun alias n'est développé ; la commande `alias` continue de les créer. Voir le [niveau 3](#niveau-3-les-alias-dans-un-script) |
| `alias_func_def` | Désactivée | Si elle est active, une déclaration `nom() { ... }` est autorisée même quand `nom` est un alias, **avec un effet surprenant** (voir ci-dessous) |
| `complete_aliases` | Désactivée | Si elle est active, la complétion (la proposition de la fin d'un mot quand on tape la touche Tab, voir [la complétion avancée](/?c=langages&s=zsh&p=completion-avancee)) traite l'alias comme une commande à part entière, au lieu de le remplacer d'abord par son texte |

L'option `alias_func_def` mérite un essai, parce que son résultat est contraire à l'intuition : au lieu de définir une fonction `ll`, elle définit une fonction nommée comme le **texte** de l'alias.

```zsh
# ll est un alias du programme ls
alias ll=ls
# active l'autorisation de déclarer une fonction sur un nom d'alias
setopt alias_func_def
# la déclaration est acceptée... mais ll est d'abord remplacé par ls
ll() { echo "je suis ll"; }
# ll est toujours un alias
type -a ll
# c'est le nom ls qui est devenu une fonction !
type -a ls
# l'appel à ll lance l'alias, donc la fonction ls
ll
# on remet tout en ordre : option désactivée, fonction et alias supprimés
unsetopt alias_func_def
unfunction ls
unalias ll
```

```text
ll is an alias for ls
ls is a shell function
ls is /usr/bin/ls
ls is /bin/ls
je suis ll
```

Avec un alias de plusieurs mots comme `grep -r "$1" .`, la déclaration définit plusieurs fonctions à la fois (essai : `grep` et `.`). **Il ne faut donc pas activer `alias_func_def`** : l'erreur par défaut est la protection.

### Organiser ses raccourcis

Quand on a quelques raccourcis, `~/.zshrc` devient illisible. On les range dans un fichier à part, `~/.zsh_aliases`, que `~/.zshrc` charge, ou dans un dossier `~/.zshrc.d` dont chaque fichier est chargé. Ces deux noms sont des **conventions** : Zsh ne les lit pas de lui-même, c'est `~/.zshrc` qui doit contenir les lignes ci-dessous. Le test `[[ -f fichier ]]` est vrai si ce fichier existe et est un fichier ordinaire (voir [les conditions](/?c=langages&s=bash&p=conditions)). Le motif `*.zsh` désigne tous les fichiers dont le nom se termine par `.zsh`, et le **qualificatif** `(N)` placé après lui dit « si aucun fichier ne correspond, ne rien produire au lieu de signaler une erreur » (voir [les qualificatifs de glob](/?c=langages&s=zsh&p=expansion-et-jokers-avances#les-qualificatifs-de-glob-filtrer-par-type-ou-metadonnee)). `for ... do ... done` répète les commandes pour chaque fichier trouvé (voir [les boucles](/?c=langages&s=bash&p=boucles)).

```zsh
# --- à ajouter à la fin de ~/.zshrc ---
# si le fichier ~/.zsh_aliases existe, on le charge
if [[ -f ~/.zsh_aliases ]]; then
    # source lit le fichier dans le shell courant
    source ~/.zsh_aliases
# fi termine le if
fi
# pour chaque fichier .zsh de ~/.zshrc.d (aucun : (N) évite l'erreur)
for fichier in ~/.zshrc.d/*.zsh(N); do
    # on charge ce fichier
    source "$fichier"
# done termine la boucle
done
```

```zsh
# --- contenu de ~/.zsh_aliases ---
# raccourcis simples : un nom court pour une commande
alias ll='ls -la'
# ls -lt : détail de chaque fichier, du plus récent au plus ancien
alias lt='ls -lt'
# alias global (niveau 4) : jette les messages d'erreur
alias -g NE='2>/dev/null'
# alias de suffixe (niveau 4) : un fichier .txt tapé seul est affiché par cat
alias -s txt=cat
# cherche le mot donné en premier argument dans le dossier courant
cherche() {
    grep -rn "$1" .
}
```

Les alias globaux et de suffixe se rangent dans le même fichier que les autres : `alias -L` en donne la forme recopiable. Avec ce fichier et deux fichiers dans `~/.zshrc.d` (`git.zsh` qui contient `alias gs='git status'`, du logiciel [Git](/?c=qualite-performance-et-outils&s=git&p=concepts-de-base), et `docker.zsh` qui contient `alias dc='docker compose'`, de l'outil [Docker Compose](/?c=infrastructure-devops&s=docker&p=docker-compose)), on observe, en lançant un Zsh interactif qui lit un tel `~/.zshrc` :

| Cas observé | Résultat |
|---|---|
| Les fichiers existent | `alias` liste `ll`, `lt`, `gs`, `dc` et `NE` ; `alias -s` liste `txt=cat` ; `type cherche` répond que c'est une fonction |
| `~/.zsh_aliases` n'existe pas, avec le test `[[ -f ... ]]` | Le terminal démarre sans aucun message |
| `~/.zsh_aliases` n'existe pas, avec seulement `source ~/.zsh_aliases` | Un message `no such file or directory` à chaque démarrage (le démarrage continue) |
| `~/.zshrc.d` vide, avec `(N)` | Le terminal démarre sans aucun message |
| `~/.zshrc.d` vide, sans `(N)` | Un message `no matches found` suivi du motif, à chaque démarrage |
| Une ligne ajoutée aux fichiers après le démarrage | Inconnue tant qu'on n'a pas lancé `source ~/.zsh_aliases` |

### Diagnostiquer : `zsh -f`

Quand une commande se comporte étrangement, la cause est parfois l'un de vos alias ou de vos fonctions. Les options de la ligne de commande de Zsh (décrites dans [la section « Invocation » du manuel](https://zsh.sourceforge.io/Doc/Release/Invocation.html)) permettent de l'écarter :

| Commande | Effet |
|---|---|
| `zsh -f` | Démarre un nouveau Zsh qui **ne lit pas** vos fichiers de démarrage personnels (`~/.zshenv`, `~/.zshrc`...) : aucun de vos raccourcis n'y existe |
| `zsh -d` | Ne lit pas les fichiers de démarrage **du système** (ceux de `/etc/zsh`, qui peuvent aussi définir ou retirer des alias) |
| `zsh -d -f` | Aucun fichier de démarrage du tout |
| `zsh -f -c 'texte'` | Lance ce texte dans un Zsh sans configuration, puis s'arrête (`-c` : exécuter ce texte) |

```zsh
# dans la session normale, ll existe (créé au niveau 1)
alias ll='ls -la'
# affiche la définition de ll
alias ll
# dans un Zsh sans configuration, ll n'existe pas : rien ne s'affiche, et le code vaut 1
zsh -f -c 'alias ll; echo "code=$?"'
```

```text
ll='ls -la'
code=1
```

Pour travailler dans un Zsh sans configuration, on tape `zsh -f` seul : l'invite (le texte qui précède ce que vous tapez) change d'aspect, `alias` ne liste que les deux alias de départ, et `exit` ferme ce Zsh et ramène à la session précédente, avec vos raccourcis. Si le comportement redevient normal dans `zsh -f`, le coupable se trouve dans vos raccourcis : on les retire un par un pour trouver lequel.

### Les alias d'Oh My Zsh

[Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh) est un ensemble de réglages et d'extensions (*plugins*) pour Zsh. Ses plugins définissent des centaines d'alias, par exemple ceux du plugin `git`. Ils sont chargés au démarrage et `alias` les liste comme les vôtres, ce qui permet de les retrouver et de les vérifier :

```zsh
# définition d'un alias fourni par le plugin git
alias gst
# les alias dont le nom commence par gpu : ici un seul, git push upstream
alias -m 'gpu*'
# Oh My Zsh définit lui-même des alias globaux : on les liste (alias -g)
alias -g
```

```text
gst='git status'
gpu='git push upstream'
...=../..
....=../../..
.....=../../../..
......=../../../../..
```

Les deux premiers résultats dépendent du plugin installé, les alias globaux de la version d'Oh My Zsh. Trois précautions s'imposent :

| Précaution | Pourquoi |
|---|---|
| `alias nom` avant de créer un raccourci | Oh My Zsh définit déjà des noms courants : `ll` y vaut `ls -lh`, `l` vaut `ls -lah` |
| Ajouter ses alias **après** la ligne `source $ZSH/oh-my-zsh.sh` du `~/.zshrc` | La dernière définition d'un nom l'emporte : après `source`, `alias ll='ls -la'` remplace celui d'Oh My Zsh |
| Ou les déposer dans `~/.oh-my-zsh/custom/` | Tout fichier `.zsh` de ce dossier est chargé automatiquement et survit aux mises à jour (voir le chapitre [Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh)) |

## Synthèse des niveaux

| Niveau | Besoin | Outil | Limite |
|---|---|---|---|
| 1 | Un autre nom pour une commande | `alias ll='ls -la'`, `alias -L`, `unalias`, `~/.zshrc` | Un texte collé devant les arguments ; pas de `$1` ; perdu à la fermeture du terminal sans `~/.zshrc` |
| 2 | Un argument placé au milieu, un test sur le nombre d'arguments | Fonction avec `"$1"`, `"$@"`, `"$#"` | `nom() {` échoue si un alias porte ce nom ; `function nom {` réussit mais l'alias reste prioritaire |
| 3 | Un raccourci dans un script | L'option `aliases` (active), ou mieux, une fonction | Un alias n'existe qu'à la ligne suivante ; les alias de `~/.zshrc` sont absents du script, ceux de `~/.zshenv` y sont |
| 4 | Agir n'importe où dans la ligne, ou selon l'extension | `alias -g`, `alias -s` | Un alias global est développé même dans un texte ; un alias de suffixe s'applique aussi à un fichier qui n'existe pas |
| 5 | Cohabiter, ranger, diagnostiquer | `\nom`, `command`, `whence -a`, `~/.zsh_aliases`, `zsh -f` | `\nom` laisse passer une fonction ; `alias_func_def` renomme le mauvais nom |

## Les pièges

| Piège | Pourquoi c'est un problème | À faire |
|---|---|---|
| `alias cherche='grep -r "$1" .'` | `$1` n'existe pas dans un alias : il vaut vide, et le mot tapé est collé à la fin | Une fonction avec `"$1"` |
| `cherche() { ... }` quand un alias `cherche` existe | Erreur `defining function based on alias` | `unalias nom` avant la fonction |
| `function cherche { ... }` quand un alias `cherche` existe | Aucune erreur, mais l'alias reste prioritaire : la fonction n'est jamais appelée | `unalias nom` avant la fonction, et `type -a nom` pour vérifier |
| `$@` sans guillemets | Les arguments vides disparaissent (et Bash coupe aussi les espaces et développe les jokers) | `"$@"` |
| Croire qu'un script ignore les alias | Sous Zsh, un script développe les alias qu'il définit | Écrire la commande complète ou une fonction |
| Alias défini et utilisé sur la même ligne ou dans le même bloc `{ }` | L'alias n'existe qu'à partir de la ligne lue ensuite | Définir sur une ligne, utiliser plus loin, ou utiliser une fonction |
| Fonction lue avant l'alias qu'elle utilise | Le mot reste ordinaire : le développement a lieu à la lecture du corps | Préférer la commande complète dans une fonction |
| Un alias dans `~/.zshenv` | Ce fichier est lu par tous les scripts : le comportement change en silence | Réserver `~/.zshenv` aux variables d'environnement |
| Un alias global au nom courant (`echo G`) | Le texte est remplacé par un tube suivi de `grep` | Des noms courts en majuscules, rares dans le texte |
| `unalias G`, `alias G`, `unhash -a G` sans guillemets | Le nom d'un alias global est développé avant d'être lu | `unalias 'G'` ou `unalias \G` |
| Un alias global en premier mot, ou dans un script partagé | Erreur d'analyse, ou ligne illisible pour les autres | Réserver les alias globaux à la saisie à la main |
| Un alias de suffixe qui pense que le fichier existe | Il s'applique d'après le nom seulement, et passe avant un programme du même nom | Ne pas nommer un programme avec une extension qu'on a liée |
| Un nom de fichier entre guillemets, ou une extension en majuscules | L'alias de suffixe est ignoré | `mon\ fichier.txt` et la bonne casse |
| `setopt alias_func_def` | Une déclaration `ll() {...}` définit une fonction nommée comme le texte de l'alias | Laisser l'option désactivée |
| `\nom` pour contourner | Il ne contourne que l'alias : une fonction du même nom répond | `command nom` |
| Un alias dans un programme lancé par `xargs` | `xargs` lance des programmes, pas des alias | Un script ou le programme lui-même |
| `source ~/.zsh_aliases` sans test `[[ -f ... ]]` | Un message d'erreur à chaque démarrage si le fichier est absent | `if [[ -f ~/.zsh_aliases ]]; then ... fi` |
| `~/.zshrc.d/*.zsh` sans `(N)` | `no matches found` à chaque démarrage si le dossier est vide | `~/.zshrc.d/*.zsh(N)` |
| Un alias qui reprend un nom d'Oh My Zsh | L'ancien sens disparaît, ou le vôtre est écrasé selon l'ordre de chargement | `alias nom` avant de choisir, et ses lignes après `source $ZSH/oh-my-zsh.sh` |
| Modifier `~/.zsh_aliases` sans recharger | La session en cours garde l'ancien état | `source ~/.zsh_aliases` |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Un alias pour un simple renommage ou des options fixes, une fonction dès qu'un argument est placé ailleurs qu'à la fin | Chaque outil reste dans son domaine |
| Des guillemets simples autour du texte d'un alias | Les variables sont lues à l'utilisation |
| `"$@"` avec guillemets, `"$#"` pour compter | Le script marche aussi sous Bash, et les arguments vides sont gardés |
| `alias -L` pour sauvegarder ses alias | La forme recopiable, alias globaux et de suffixe compris |
| Écrire la commande complète ou une fonction dans un script | Le script marche sur toutes les machines, avec ou sans vos alias |
| `whence -a nom` ou `type -a nom` avant de créer un raccourci | Aucun masque involontaire, y compris par un alias d'Oh My Zsh |
| `command nom` pour atteindre la vraie commande | Passe outre alias et fonction |
| Des alias globaux courts, en majuscules, pour la saisie à la main seulement | Ils restent repérables, et un script partagé n'en dépend pas |
| Ranger tous les raccourcis dans `~/.zsh_aliases` ou `~/.zshrc.d`, chargés avec `[[ -f ... ]]` ou `(N)` | Un `~/.zshrc` court, des raccourcis faciles à sauvegarder |
| `zsh -f` quand un comportement paraît étrange | Écarter les raccourcis comme cause |
| Garder ses raccourcis peu nombreux et nommés sans ambiguïté | On les retient, et on évite de masquer une commande utile |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un **alias** est un **texte** substitué au premier mot tapé, **avant** l'analyse de la ligne, comme dans Bash : `alias ll='ls -la'` crée, `alias` liste (sans le mot `alias` devant chaque ligne ; `alias -L` donne la forme recopiable), `unalias ll` supprime, et `~/.zshrc` le rend permanent. Un alias n'a pas de `$1` : une **fonction** reçoit `$1`, `"$@"` et `"$#"`. Sous Zsh, `$@` sans guillemets n'est pas coupé sur les espaces (l'argument vide disparaît quand même), et la déclaration `nom() {` échoue si un alias porte ce nom, alors que `function nom {` réussit sans que la fonction soit appelée. Contrairement à Bash, un script **développe les alias** qu'il définit (option `aliases` active), mais pas ceux de `~/.zshrc` (ceux de `~/.zshenv` oui) ; le piège de la ligne suivante existe aussi. **Alias globaux** (`alias -g NE='2>/dev/null'`) : développés n'importe où dans la ligne, à écrire entre guillemets pour `unalias`. **Alias de suffixe** (`alias -s txt=cat`) : `fichier.txt` tapé en premier mot lance `cat fichier.txt`, d'après le nom seul, avec la casse. Ordre de réponse : alias, fonction, commande interne, programme ; `type -a nom`, `whence -a nom`, `where nom` les listent. `\nom` passe outre l'alias seul, `command nom` passe outre alias et fonction. Raccourcis dans `~/.zsh_aliases` ou `~/.zshrc.d`, et `zsh -f` pour diagnostiquer. |
| **Pièges à éviter** | `$1` dans un alias ; fonction déclarée sans avoir supprimé l'alias de même nom ; `function nom {` qui laisse l'alias prioritaire ; croire qu'un script ignore les alias ; alias défini et utilisé dans la même ligne ou le même bloc ; alias dans `~/.zshenv` ; alias global au nom courant ou en premier mot ; `unalias G` sans guillemets ; alias de suffixe appliqué à un nom qui n'existe pas ou à un programme ; `setopt alias_func_def` ; croire que `\nom` contourne une fonction ; alias derrière `xargs` ; `source` ou `*.zsh` sans test ni `(N)` ; nom d'alias qui masque une commande ou un alias d'Oh My Zsh. |
| **Bonnes pratiques** | Alias pour renommer, fonction dès qu'un argument est placé ailleurs qu'à la fin ; guillemets simples ; `"$@"` et `"$#"` ; commande complète ou fonction dans un script ; `whence -a nom` avant de nommer ; `command nom` pour atteindre la vraie commande ; alias globaux courts et réservés à la saisie ; raccourcis dans `~/.zsh_aliases` ou `~/.zshrc.d` ; `zsh -f` pour écarter ses raccourcis lors d'un diagnostic. |
