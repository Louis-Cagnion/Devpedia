---
order: 17
---

# L'environnement propre d'un shell

Un [shell](/?c=langages&s=bash&p=bash) (le programme qui lit vos commandes dans un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal)) transmet à chaque programme qu'il lance une copie de son **environnement** : l'ensemble de ses [variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement). Cet environnement vient de votre machine, avec tout ce qu'elle contient : vos réglages, vos alias, vos dossiers dans `$PATH`. Quand on veut construire un logiciel de façon reproductible, ou fabriquer un système Linux à la main (comme le propose le projet [Linux From Scratch](https://www.linuxfromscratch.org/lfs/)), cet héritage est un danger : la construction dépend alors, sans qu'on le voie, de la machine qui l'a lancée. Ce chapitre montre comment partir d'un environnement vide et n'y mettre que ce qu'on choisit.

Il suppose connus `export`, l'ordre de `$PATH`, `~/.bashrc` contre `~/.bash_profile` et `source`, vus dans le chapitre sur les [variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement).

> **Vocabulaire.** L'**hôte** est la machine (ou le système) qui lance la construction. Un **processus** est un programme en cours d'exécution (voir [la gestion des processus](/?c=langages&s=bash&p=gestion-des-processus)).

## Le schéma d'ensemble

```text
HÔTE : votre session
  environnement riche : PATH, HOME, PS1, alias, dizaines de variables
        |
        |  env -i HOME=... TERM=... PS1=... PATH=...   (on ne passe que 4 variables)
        v
ENVIRONNEMENT VIDE : rien d'hérité, sauf ce qu'on vient de déclarer
        |
        |  /bin/bash   (un nouveau shell, qui lit ensuite ses propres fichiers)
        v
CONSTRUCTION : compiler, installer, avec un environnement connu et complet
```

## `env` : afficher et fabriquer un environnement

`env` est un programme du système (il vient de [GNU coreutils](https://www.gnu.org/software/coreutils/manual/html_node/env-invocation.html), la collection d'outils de base). Sans argument, il affiche les variables de son environnement. Avec `-i` (*ignore environment*), il **vide** l'environnement, ajoute les variables `NOM=valeur` données, puis lance la commande qui suit.

```bash
# compte les variables de l'environnement d'un shell ordinaire (une par ligne de env)
bash -c 'env | wc -l'
# même compte, mais le shell est lancé avec un environnement vide
env -i bash -c 'env | wc -l'
```

```text
78
3
```

Le premier nombre dépend de votre machine. Les trois variables restantes ne viennent pas de vous : c'est Bash lui-même qui les crée au démarrage.

```bash
# environnement vide : env n'affiche que les variables données
env -i bash -c 'env'
```

```text
PWD=/tmp
SHLVL=0
_=/usr/bin/env
```

Ici `PWD` est le dossier courant, `SHLVL` le niveau d'imbrication des shells et `_` le dernier programme lancé. Passons maintenant une variable à nous :

```bash
# on déclare MA_VAR et PATH ; HOME n'est pas déclarée, donc elle n'existe pas
env -i MA_VAR=bonjour PATH=/usr/bin:/bin bash -c 'echo "[$MA_VAR] [$HOME]"'
# la commande ls est retrouvée grâce au PATH qu'on a donné
env -i MA_VAR=bonjour PATH=/usr/bin:/bin bash -c 'ls /etc/hostname'
```

```text
[bonjour] []
/etc/hostname
```

| Commande | Environnement que reçoit le programme lancé |
|---|---|
| `env` | Affiche l'environnement courant, ne lance rien d'autre |
| `env VAR=val commande` | Celui de l'hôte, plus `VAR=val` |
| `env -i commande` | Vide (hors les trois variables que Bash crée) |
| `env -i VAR=val commande` | Vide, plus `VAR=val` uniquement |

> **Piège :** sans `HOME`, `TERM`, `PATH` et les autres, beaucoup de programmes se comportent autrement : `$HOME` est vide, `~` ne se développe plus, un éditeur ne sait plus comment afficher le terminal. C'est voulu : à vous de déclarer ce qui est nécessaire, et seulement cela.

## `exec` : remplacer le shell au lieu d'en lancer un second

Normalement, quand un script lance une commande, le shell reste là, attend la fin de la commande, puis lit la ligne suivante. La commande intégrée `exec` fait autre chose : elle **remplace** le processus du shell par le programme demandé (voir [`fork()` et `execve()`](/?c=langages&s=bash&p=architecture-dun-shell) pour le mécanisme). Il n'y a plus de shell derrière : tout ce qui suit `exec` dans le script n'est jamais lu.

```bash
# $$ est le numéro (PID) du processus du shell courant
# exec remplace ce shell par un autre bash : le numéro ne change pas
bash -c 'echo "avant : $$"; exec bash -c "echo \"après : \$\$\""'
```

```text
avant : 59235
après : 59235
```

Le numéro est le même avant et après : il n'y a pas eu de second processus, le premier a changé de programme. Les numéros affichés changent à chaque exécution, seule leur égalité compte.

```bash
#!/bin/bash
# lanceur.sh : un script qui recopie une ligne du livre sans comprendre exec
echo "début du lanceur"
# exec remplace le script par un bash propre : le script n'existe plus après cette ligne
exec env -i HOME=/tmp TERM=xterm /bin/bash -c 'echo "dans le bash propre"'
echo "cette ligne ne s'affiche jamais"
```

```bash
# lance le script
bash lanceur.sh
```

```text
début du lanceur
dans le bash propre
```

La dernière ligne du script a disparu avec lui. Le piège s'est présenté en pratique : une ligne `exec env -i ...` recopiée d'un livre dans un lanceur, et tout ce qui suivait (la construction elle-même) était ignoré sans le moindre message d'erreur.

| Écriture | Ce qui se passe ensuite |
|---|---|
| `env -i ... bash` | Un second shell est lancé ; le premier attend sa fin, puis continue |
| `exec env -i ... bash` | Le premier shell est remplacé ; rien ne continue après |
| `(exec commande)` | Le remplacement n'a lieu que dans le [sous-shell](/?c=langages&s=bash&p=architecture-dun-shell) entre parenthèses ; le script continue |

> **Note :** `exec` est donc à sa place à la **fin** d'un lanceur, ou dans un fichier de démarrage dont le seul rôle est de passer la main à un autre shell. Ailleurs, l'oubli de ce qu'il fait coûte cher.

## Quels fichiers un shell lit-il au démarrage ?

Le chapitre sur les [variables d'environnement](/?c=langages&s=bash&p=variables-denvironnement) oppose `~/.bashrc` et `~/.bash_profile`. Voici la règle exacte, d'après le manuel de [GNU Bash](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html) :

- Un **shell de connexion** (*login shell*) est celui qu'on obtient en se connectant. Bash en est un quand on le lance avec `--login` (ou `-l`), ou quand son nom est précédé d'un tiret.
- Un shell **interactif** est un shell qui attend des commandes tapées (par opposition à un script).

| Type de shell | Fichiers lus |
|---|---|
| Connexion | `/etc/profile`, puis le premier trouvé parmi `~/.bash_profile`, `~/.bash_login`, `~/.profile` |
| Interactif, sans connexion | `~/.bashrc` (et, sur Debian et Ubuntu, `/etc/bash.bashrc` avant lui) |
| Ni l'un ni l'autre (script, `bash -c`) | Aucun fichier de démarrage |

Démonstration avec un dossier personnel de test, pour ne pas toucher au vôtre :

```bash
# crée un faux dossier personnel
mkdir -p /tmp/essai-home
# un fichier lu par un shell de connexion : il définit une variable
echo 'export DEPUIS_PROFILE=oui' > /tmp/essai-home/.bash_profile
# un fichier lu par un shell interactif : il définit une autre variable
echo 'export DEPUIS_BASHRC=oui' > /tmp/essai-home/.bashrc

# -l demande un shell de connexion : .bash_profile est lu
env -i HOME=/tmp/essai-home bash -l -c 'echo "connexion : [$DEPUIS_PROFILE]"'
# sans -l : aucun fichier n'est lu
env -i HOME=/tmp/essai-home bash -c 'echo "sans connexion : [$DEPUIS_PROFILE]"'
# -i demande un shell interactif : .bashrc est lu
env -i HOME=/tmp/essai-home bash -i -c 'echo "interactif : [$DEPUIS_BASHRC]"'
```

```text
connexion : [oui]
sans connexion : []
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

interactif : [oui]
```

Les deux lignes en anglais ne viennent pas de votre fichier : elles viennent d'un fichier de l'hôte, ce que la section suivante explique.

### `su - NOM` contre `su NOM`

`su` (*substitute user*) ouvre un shell sous l'identité d'un autre utilisateur. Cette partie est décrite d'après le manuel de `su` (`man su`) : elle n'a pas été exécutée ici, car `su` demande un mot de passe.

| Commande | Nature du shell obtenu | Effet |
|---|---|---|
| `su - NOM` (avec le tiret, ou `-l`) | Shell de connexion | Efface presque tout l'environnement (sauf `TERM`), recrée `HOME`, `SHELL`, `USER`, `LOGNAME` et `PATH`, se place dans le dossier personnel de `NOM`, puis lit `~/.bash_profile` |
| `su NOM` (sans tiret) | Shell interactif, sans connexion | Garde l'essentiel de l'environnement de l'appelant, ne lit pas `~/.bash_profile` (il lit `~/.bashrc`) |

Un fichier `~/.bash_profile` qui ne fait que passer la main à un shell propre est la façon classique de garantir un environnement maîtrisé dès la connexion :

```bash
# ~/.bash_profile : remplace le shell de connexion par un bash à l'environnement minimal
# TERM décrit le type de terminal, PS1 est le texte affiché avant chaque commande
exec env -i HOME=$HOME TERM=$TERM PS1='\u:\w\$ ' PATH=/usr/bin:/bin /bin/bash
```

Le `bash` ainsi lancé est interactif, sans connexion : il lit donc `~/.bashrc`, et c'est dans ce fichier qu'on met le reste du réglage (variables propres au projet, alias). Ici `exec` est à sa place : le shell de connexion n'a plus rien à faire et disparaît.

## Quand l'hôte s'invite malgré `env -i`

Dans la démonstration précédente, un message sur `sudo` est apparu alors que l'environnement était vide : un fichier de l'hôte, `/etc/bash.bashrc`, est lu par tout shell interactif sur Debian et Ubuntu, avant même `~/.bashrc`. Il peut aussi **changer `PS1`**, la variable qui contient le texte affiché avant chaque commande (l'*invite*), même si on l'a transmise proprement :

```bash
# on transmet PS1='$ ' à un shell interactif lancé avec un environnement vide
env -i HOME=/nonexistent PS1='$ ' bash -i -c 'echo "[$PS1]"'
# même chose, mais --norc interdit la lecture des fichiers de démarrage de l'hôte
env -i HOME=/nonexistent PS1='$ ' bash --norc -i -c 'echo "[$PS1]"'
```

```text
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

[${debian_chroot:+($debian_chroot)}\u@\h:\w\$ ]
[$ ]
```

Le premier shell a remplacé `PS1='$ '` par la valeur définie dans `/etc/bash.bashrc` de l'hôte ; le second, avec `--norc`, l'a gardée. La méthode de contrôle est toujours la même :

| Étape | Commande | Ce qu'on cherche |
|---|---|---|
| 1. Noter ce qu'on a transmis | La ligne `env -i ...` elle-même | La liste exacte des variables déclarées |
| 2. Afficher ce que le shell voit | `env` dans le nouveau shell | Une variable différente ou en plus |
| 3. Identifier la source | `grep -n PS1 /etc/bash.bashrc` (par exemple) | Le fichier de l'hôte qui l'a changée |
| 4. Écarter le fichier | `bash --norc`, ou ne pas lancer un shell interactif | Un environnement égal à ce qu'on a transmis |

## `export` : rendre visible, pas donner une valeur

`export` ne fixe pas une valeur : il marque une variable déjà existante comme **à transmettre** aux programmes lancés ensuite. La valeur s'écrit ailleurs (une affectation `NOM=valeur`, ou la ligne `env -i NOM=valeur`). C'est ce qui sépare une variable de shell d'une variable d'environnement :

```bash
# VAL est une simple variable de shell : elle n'est pas encore dans l'environnement
VAL=1
# un shell enfant lancé maintenant ne la voit pas : les crochets restent vides
bash -c 'echo "enfant sans export : [$VAL]"'
# export marque VAL comme à transmettre aux programmes lancés ensuite
export VAL
# le même enfant la reçoit maintenant
bash -c 'echo "enfant avec export : [$VAL]"'
# retire la variable pour ne rien laisser dans ce terminal
unset VAL
```

```text
enfant sans export : []
enfant avec export : [1]
```

Avec `env -i`, on n'a pas besoin d'`export` : une variable donnée à `env` fait partie de l'environnement du programme lancé, par construction.

## Limiter le parallélisme de `make` avec `MAKEFLAGS`

`make` ([voir les Makefiles](/?c=langages&s=c&p=makefiles)) lit sa variable d'environnement `MAKEFLAGS` comme si son contenu était écrit sur la ligne de commande. L'option `-jN` lui permet de lancer N tâches de compilation à la fois, ce qui accélère beaucoup la construction. `nproc` affiche le nombre de cœurs de calcul (processeurs) disponibles : c'est une valeur raisonnable pour N.

```bash
# affiche le nombre de cœurs de la machine
nproc
# un Makefile minimal de test : une règle qui affiche la valeur de MAKEFLAGS
printf 'tout:\n\t@echo "MAKEFLAGS vaut : $(MAKEFLAGS)"\n' > /tmp/Makefile.essai
# -j suivi du nombre de cœurs, passé par l'environnement
MAKEFLAGS=-j$(nproc) make -f /tmp/Makefile.essai
# -j sans nombre : make lance autant de tâches qu'il y en a de prêtes
make -j -f /tmp/Makefile.essai
```

```text
16
MAKEFLAGS vaut :  -j16 --jobserver-auth=3,4
MAKEFLAGS vaut :  -j
```

Le nombre `16` est celui de la machine de test. Dans le premier cas, `make` a complété la variable avec un détail interne (`--jobserver-auth`) qui sert à coordonner ses sous-processus : seul `-j16` est de vous.

| Réglage | Effet |
|---|---|
| `MAKEFLAGS=-j$(nproc)` | Au plus autant de tâches que de cœurs |
| `MAKEFLAGS=-j4` | Au plus 4 tâches, par exemple pour garder la machine utilisable |
| `-j` sans nombre | **Aucune limite** : sur un gros projet, des centaines de compilateurs démarrent ensemble et peuvent saturer mémoire et processeur |

## Le principe d'isolation

Tout ce chapitre applique une même idée : **partir d'un état vide et n'y mettre que ce qu'on déclare**. Le résultat ne dépend plus de ce que la machine contient par hasard ; on peut donc le refaire ailleurs, ou plus tard, et obtenir la même chose.

| Outil | Ce qu'il vide | Ce qu'on déclare |
|---|---|---|
| `env -i` | Les variables d'environnement | Les `NOM=valeur` donnés à `env` |
| Un [conteneur Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) | Le système de fichiers et les processus visibles | Une image, des variables, des volumes |
| Un [environnement virtuel Python](/?c=langages&s=python&p=modules-et-environnements) (`venv`) | Les bibliothèques installées pour ce projet | Les dépendances installées dans ce dossier |

Chaque outil isole à son échelle : `env -i` seulement l'environnement d'un processus, `venv` seulement les bibliothèques Python, le conteneur beaucoup plus. Aucun n'est une protection contre un programme hostile : ils rendent un résultat **reproductible**, pas inviolable.

### Le lien avec le moindre privilège

Le [principe de moindre privilège](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise) dit qu'un composant ne reçoit que les droits dont il a besoin. L'isolation par environnement vide en est le pendant : elle protège dans l'autre sens.

| Mesure | Ce qu'elle protège | De quoi |
|---|---|---|
| Construire avec un utilisateur ordinaire (voir [les permissions](/?c=langages&s=bash&p=permissions-et-fichiers)) | L'**hôte** | D'une erreur de la construction (une commande qui écrase des fichiers du système, un `rm` mal ciblé) |
| Construire avec un environnement vide | La **construction** | De l'hôte (variables, alias, fichiers de démarrage qui changent le résultat sans qu'on le voie) |

Les deux se combinent : un utilisateur ordinaire dans un environnement vide ne peut abîmer que son propre dossier, et ne dépend que de ce qu'on lui a donné.

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| `exec` suivi d'autres lignes dans un script | `exec` remplace le script : tout ce qui suit est ignoré, sans erreur. Le réserver à la dernière ligne |
| `env -i` sans `PATH`, `HOME`, `TERM` | Le shell prend un `PATH` par défaut, mais `HOME` est vide et `TERM` absent : programmes qui plantent ou affichent mal |
| Croire que `env -i` suffit à isoler | Un shell interactif relit les fichiers de l'hôte (`/etc/bash.bashrc`, `~/.bashrc`) : `PS1` ou d'autres variables changent. Comparer `env` à ce qu'on a transmis |
| `su NOM` à la place de `su - NOM` | Pas de shell de connexion : `~/.bash_profile` n'est pas lu et l'environnement de l'appelant est gardé |
| Écrire `export` en pensant donner une valeur | `export` ne fait que rendre visible une variable existante ; la valeur vient d'une affectation |
| `MAKEFLAGS=-j` sans nombre | Parallélisme illimité : mémoire et processeur saturés |

## Bonnes pratiques

| Pratique | Pourquoi |
|---|---|
| Lancer la construction par `env -i` avec la liste complète des variables nécessaires, écrite dans un seul fichier | Elle est lisible, rejouable, et vérifiable d'un coup d'œil |
| Placer `exec env -i ... /bin/bash` dans `~/.bash_profile`, jamais au milieu d'un script | Le remplacement du shell a lieu au bon endroit |
| Afficher `env` dans le nouveau shell et le comparer à la liste transmise | Détecte la variable ajoutée par un fichier de l'hôte |
| Écarter le fichier fautif (`--norc`, ou le déplacer) plutôt que de corriger la variable après coup | La cause disparaît, au lieu d'être masquée |
| Régler `MAKEFLAGS=-j$(nproc)` | Rapide sans saturer la machine |
| Combiner utilisateur ordinaire et environnement vide | L'hôte est protégé de la construction, et la construction de l'hôte |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un programme hérite de l'environnement du shell qui l'a lancé. `env -i NOM=valeur commande` le remplace par un environnement vide plus ce qu'on déclare. `exec` remplace le shell au lieu d'en lancer un second : rien ne s'exécute après lui. Un shell de connexion lit `~/.bash_profile`, un shell interactif sans connexion lit `~/.bashrc`. |
| **Outils utilisables** | `env`, `env -i`, `exec`, `bash -l`, `bash --norc`, `su -`, `export`, `nproc`, `MAKEFLAGS`. |
| **Pièges à éviter** | `exec` au milieu d'un script ; croire qu'un environnement vide est étanche alors que `/etc/bash.bashrc` est relu ; `-j` sans nombre. |
| **Bonnes pratiques** | Partir d'un état vide et déclarer ce qu'on veut, comme avec `env -i`, un conteneur ou `venv` ; vérifier le résultat avec `env` ; combiner avec un utilisateur ordinaire. |
