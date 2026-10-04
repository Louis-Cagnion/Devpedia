---
order: 15
---

# Un script qui nettoie et s'arrête proprement : `mktemp`, `trap` et `timeout`

Un script court se contente d'enchaîner des commandes. Un script qui crée des fichiers, lance des commandes longues et peut être interrompu doit en plus **ne rien laisser derrière lui** et **ne jamais attendre indéfiniment**. Ce chapitre suit un cas réel : le script qui lance le solveur Skyscraper sur dix grilles, affiche leurs temps et peut être arrêté au clavier.

| Problème | Ce qui se passe | Outil |
|---|---|---|
| Un fichier temporaire reste après une erreur ou un Ctrl-C | `/tmp` se remplit, des données traînent | `mktemp` et `trap ... EXIT` |
| Le script est interrompu avant son nettoyage | Le nettoyage n'a jamais lieu | `trap ... INT TERM` |
| Une commande ne se termine jamais | Le script reste bloqué | `timeout` |
| Les messages d'erreur se mélangent à la sortie | Des lignes sont coupées en deux | Séparer la sortie d'erreur |

## Un fichier temporaire sûr : `mktemp`

Un **fichier temporaire** n'existe que le temps d'une exécution (ici, pour garder les messages d'erreur d'une commande à part). La tentation est de lui donner un nom fixe, comme `/tmp/erreurs.$$`, où `$$` est le numéro du processus du script (voir [terminer un processus](/?c=langages&s=bash&p=gestion-des-processus)). Ce nom est **prévisible** : un autre utilisateur de la machine peut y créer à l'avance un lien vers un fichier de celui qui lance le script, que ce dernier écrasera sans le savoir ([CWE-377](https://cwe.mitre.org/data/definitions/377.html)).

`mktemp` crée le fichier **lui-même**, avec un nom aléatoire qui n'existe pas encore, et ne laisse l'accès qu'à son propriétaire (voir [lire les permissions](/?c=langages&s=bash&p=permissions-et-fichiers#lire-les-permissions-avec-ls-l)) :

```
$ mktemp
/tmp/tmp.LiSSKlK2Ur
$ ls -l /tmp/tmp.LiSSKlK2Ur
-rw------- 1 alice alice 0 oct.   4 21:29 /tmp/tmp.LiSSKlK2Ur
$ mktemp -d
/tmp/tmp.6jBpvLiBQT
$ ls -ld /tmp/tmp.6jBpvLiBQT
drwx------ 2 alice alice 4096 oct.   4 21:29 /tmp/tmp.6jBpvLiBQT
$ mktemp /tmp/rapport.XXXXXX
/tmp/rapport.yckOz1
```

| Commande | Résultat |
|---|---|
| `mktemp` | Un fichier vide, `/tmp/tmp.` suivi de dix caractères aléatoires |
| `mktemp -d` | Un **dossier** temporaire, pour y ranger plusieurs fichiers |
| `mktemp /tmp/rapport.XXXXXX` | Un nom choisi : les `X` finaux sont remplacés par des caractères aléatoires |
| `TMPDIR=/chemin mktemp` | Crée le fichier dans ce dossier au lieu de `/tmp` |

## Le supprimer à coup sûr : `trap ... EXIT`

`trap` exécute une commande quand le script reçoit un signal (voir [intercepter un signal](/?c=langages&s=bash&p=gestion-des-processus#intercepter-un-signal-trap) et les [signaux Unix](/?c=langages&s=c&p=signaux-unix)). Le pseudo-signal `EXIT` n'en est pas un : il désigne **la fin du script**, quelle qu'en soit la raison. Le script suivant (`demo.sh`) le montre dans plusieurs situations (une ligne `case` par situation) :

```bash
#!/bin/bash
# usage : ./demo.sh [normal|exit3|erreur|sortie|timeout|foreground|capture|capturefg]
# Sans argument : sleep 17. Pendant l'attente, taper Ctrl-C.
tmp=$(mktemp)                       # un fichier temporaire, au nom imprévisible
echo "fichier temporaire : $tmp"
trap 'rm -f "$tmp"' EXIT            # supprimé à la sortie, quelle qu'en soit la raison
trap 'exit 130' INT TERM            # un signal devient une sortie normale (130 = 128 + 2)
case $1 in
    normal)     ;;                                  # le script se termine tout seul
    exit3)      exit 3 ;;                           # sortie volontaire avec un code
    erreur)     set -e; false; echo "jamais" ;;     # set -e s'arrête à la commande en échec
    sortie)     while :; do echo ligne; done ;;     # écrit sans fin (SIGPIPE si lecteur parti)
    timeout)    timeout 17 sleep 17 ;;              # sleep part dans son propre groupe
    foreground) timeout --foreground 17 sleep 17 ;; # sleep reste dans le groupe du terminal
    capture)    out=$(timeout 17 sleep 17) ;;       # même chose dans une substitution
    capturefg)  out=$(timeout --foreground 17 sleep 17) ;;
    *)          sleep 17 ;;
esac
```

Les cinq situations de la table ci-dessous ont été rejouées en bash 5.2 et zsh 5.9. Pour Ctrl-C, un vrai terminal a été simulé et le caractère Ctrl-C envoyé comme au clavier. Chaque case dit si le fichier temporaire est **supprimé** ou **reste**, avec la ligne `trap 'exit 130' INT TERM` retirée (« EXIT seul ») puis conservée :

| Fin du script | bash, EXIT seul | bash, EXIT + INT/TERM | zsh, EXIT seul | zsh, EXIT + INT/TERM |
|---|---|---|---|---|
| Fin normale (`normal`) | supprimé | supprimé | supprimé | supprimé |
| `exit 3` | supprimé | supprimé | supprimé | supprimé |
| `set -e`, une commande échoue (`erreur`) | supprimé | supprimé | supprimé | supprimé |
| SIGPIPE : le lecteur de la sortie est parti (`sortie`, lu par `head -1`) | supprimé | supprimé | **reste** | **reste** |
| Ctrl-C pendant `sleep` | supprimé | supprimé | **reste** | supprimé |

Ce qu'il faut en retenir :

| Constat | Explication |
|---|---|
| Les fins « normales » (fin du script, `exit`, [`set -e`](/?c=langages&s=bash&p=scripts-et-shebang#arreter-un-script-a-la-premiere-erreur-set-e)) déclenchent toujours `EXIT` | C'est le cas d'usage du pseudo-signal |
| **bash** exécute aussi `EXIT` quand un signal tue le script | Le fichier est supprimé même sans `trap ... INT TERM` |
| **zsh** ne l'exécute pas | Un signal qui tue le script saute le nettoyage : `trap 'exit 130' INT TERM` est indispensable |
| `trap 'exit 130' INT TERM` transforme un signal en sortie normale | `130` suit la convention 128 + numéro du signal (SIGINT vaut 2), voir [le code de sortie d'un processus tué par un signal](/?c=langages&s=bash&p=architecture-dun-shell#le-code-de-sortie-d-un-processus-tue-par-un-signal) |
| Même avec cette ligne, zsh ignore SIGPIPE | Il y faut `trap 'exit 141' PIPE` (13 + 128), vérifié ; en bash c'est inutile et fait apparaître un message d'erreur d'écriture |

> Pour écrire un script qui se comporte pareil sous bash et sous zsh, piéger **toujours** `EXIT` et `INT TERM`.

### Les pièges de `trap`

Le script `pieges.sh` rejoue trois cas, chacun dans un sous-shell pour que son `trap EXIT` s'exécute avant le comptage :

```bash
#!/bin/bash
# Trois façons de gérer des fichiers temporaires avec trap. Chaque cas tourne dans un
# sous-shell ( ... ) pour que son trap EXIT s'exécute avant le comptage des restes.
essai=$(mktemp -d)                      # dossier d'essai : mktemp y crée ses fichiers
export TMPDIR=$essai
compter() { ls -A "$essai" | wc -l; }   # nombre de fichiers et dossiers restants
vider() { find "$essai" -mindepth 1 -delete; }

echo "--- 1. deux trap EXIT : le second remplace le premier"
( a=$(mktemp); trap 'rm -f "$a"' EXIT
  b=$(mktemp); trap 'rm -f "$b"' EXIT )
echo "restent : $(compter)"; vider

echo "--- 2. guillemets doubles : \$c est remplacé tout de suite, quand il est vide"
( trap "rm -f $c" EXIT
  c=$(mktemp) )
echo "restent : $(compter)"; vider

echo "--- 3. un dossier de travail, un seul trap"
( work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
  touch "$work/un" "$work/deux" "$work/trois" )
echo "restent : $(compter)"
rmdir "$essai"
```

```
--- 1. deux trap EXIT : le second remplace le premier
restent : 1
--- 2. guillemets doubles : $c est remplacé tout de suite, quand il est vide
restent : 1
--- 3. un dossier de travail, un seul trap
restent : 0
```

| Piège | Ce qui se passe | Parade |
|---|---|---|
| Deux `trap ... EXIT` à la suite | Le second **remplace** le premier : le premier fichier reste (cas 1) | Un seul `trap`, qui nettoie tout |
| Guillemets doubles : `trap "rm -f $c" EXIT` | La variable est remplacée **au moment du `trap`**, quand elle est encore vide : rien n'est supprimé (cas 2) | Guillemets simples : `$c` est lu à la sortie |
| Plusieurs fichiers temporaires | Un `trap` par fichier : voir le premier piège | Un seul **dossier** de travail (`mktemp -d`) et `rm -rf` dessus (cas 3) |

## Arrêter une commande trop longue : `timeout`

`timeout DURÉE COMMANDE` lance la commande et lui envoie un signal (SIGTERM par défaut) quand la durée est écoulée :

```
$ timeout 1 sleep 5; echo "code de sortie : $?"
code de sortie : 124
```

| Code de sortie | Sens (vérifié) |
|---|---|
| 124 | Le délai est dépassé : la commande a été arrêtée |
| 125 | `timeout` lui-même a échoué (option inconnue, par exemple) |
| 126 | La commande existe mais ne peut pas être lancée (`timeout 1 /etc/passwd`) |
| 127 | Commande introuvable |
| 137 | La commande ignore SIGTERM, `timeout -k 1 2 ...` l'a tuée par SIGKILL (128 + 9) |
| Autre | Le code de la commande elle-même, si elle s'est terminée à temps |

### Pourquoi `--foreground` : où va Ctrl-C

Ctrl-C n'est pas envoyé à un seul processus : le terminal l'envoie à **tous les processus du groupe au premier plan** (voir [le contrôle de tâches](/?c=langages&s=bash&p=architecture-dun-shell#le-controle-de-taches-jobs-ctrl-z-fg-bg)). Or `timeout`, pour pouvoir arrêter la commande et ses fils au bout du délai, se place **dans un groupe à part**. Le script `groupes.sh` affiche les numéros de groupe (PGID) :

```bash
#!/bin/bash
# usage : ./groupes.sh [--foreground]
# affiche le groupe de processus (PGID) du script, de timeout et de sleep
echo "script : PID $$, PGID $(ps -o pgid= -p $$ | tr -d ' ')"
timeout $1 5 sleep 5 &
sleep 0.3
ps -o pid,ppid,pgid,comm --ppid $$ | grep -e PID -e timeout   # fils du script : timeout
ps -o pid,ppid,pgid,comm --ppid $!                             # fils de timeout : sleep
wait
```

Sans `--foreground`, puis avec :

```
script : PID 96481, PGID 96463
    PID    PPID    PGID COMMAND
  96485   96481   96485 timeout
    PID    PPID    PGID COMMAND
  96487   96485   96485 sleep
```

```
script : PID 96496, PGID 96463
    PID    PPID    PGID COMMAND
  96500   96496   96463 timeout
    PID    PPID    PGID COMMAND
  96502   96500   96463 sleep
```

Sans `--foreground`, `timeout` et `sleep` ont un PGID différent de celui du script : ils ne sont **plus au premier plan**, donc Ctrl-C ne les atteint pas. Avec `--foreground`, ils partagent le groupe du script. Les mêmes cas sous bash et zsh, avec Ctrl-C tapé 0,8 s après le lancement (« > 4 s » signifie que le script attendait encore après 4 s) :

| Commande dans le script | bash : fin | bash : fichier | zsh : fin | zsh : fichier | `sleep` survivants (bash, zsh) |
|---|---|---|---|---|---|
| `sleep 17` | 0,0 s | supprimé | 0,0 s | supprimé | 0, 0 |
| `timeout 17 sleep 17` | > 4 s | reste | > 4 s | reste | 1, 1 |
| `timeout --foreground 17 sleep 17` | 0,0 s | supprimé | 0,0 s | supprimé | 0, 0 |
| `out=$(timeout 17 sleep 17)` | > 4 s | reste | 0,1 s | supprimé | 1, 1 |
| `out=$(timeout --foreground 17 sleep 17)` | 0,0 s | supprimé | 0,0 s | supprimé | 0, 0 |

Sans `--foreground`, Ctrl-C ne fait **rien** : le script attend la fin des 17 secondes (le fichier temporaire reste pendant ce temps), puis son `trap` s'exécute enfin. Dans `$(...)`, zsh quitte tout de suite mais laisse `sleep` tourner seul jusqu'au bout.

> La contrepartie, indiquée par le manuel de `timeout` : avec `--foreground`, **les fils de la commande ne sont pas arrêtés** quand le délai expire, seule la commande l'est. Si elle lance des processus qui lui survivent, une surveillance supplémentaire est nécessaire (dans le solveur, ses processus fils meurent avec leur parent grâce à `prctl(PR_SET_PDEATHSIG)`, voir [les processus orphelins](/?c=langages&s=c&p=processus)).

## Capturer la sortie sans mélanger les erreurs : le tampon de 4 096 octets

Le script d'origine lance le solveur ainsi : `output=$(timeout --foreground 90 ./solveur "$clues" 2>"$ERRORS")`. La sortie standard va dans une variable, la **sortie d'erreur** (voir [rediriger la sortie d'erreur](/?c=langages&s=bash&p=redirections-et-pipes#rediriger-la-sortie-d-erreur)) dans un fichier temporaire, pas dans la même variable avec `2>&1`. La raison se voit avec un petit programme C (`bavard.c`, compilé par `gcc -o bavard bavard.c`) qui écrit cent lignes, puis un avertissement sur la sortie d'erreur après la soixante-dixième :

```c
#include <stdio.h>

int main(void)
{
    for (int i = 1; i <= 100; i++) {
        printf("ligne %03d : 123456789 123456789 123456789 123456789 123456789\n", i);
        if (i == 70)
            fprintf(stderr, "AVERTISSEMENT : la ligne 70 vient d'être écrite\n");
    }
    return 0;
}
```

Un programme C qui écrit vers un **terminal** vide son tampon à chaque ligne ; vers un **tube** (`|`, voir [les pipes](/?c=langages&s=bash&p=redirections-et-pipes#les-pipes-chainer-des-commandes)) ou un fichier, il accumule dans un **tampon** (une zone de mémoire intermédiaire) de 4 096 octets qu'il vide en bloc quand il est plein. La sortie d'erreur, elle, n'est pas mise en tampon : un message qui part pendant que le tampon est à moitié plein arrive avant le texte qui le précède.

```
$ ./bavard 2>&1 | grep -n -B1 -A1 AVERT
66-ligne 066 : 123456789 123456789 123456789 123456789 123456789
67:lignAVERTISSEMENT : la ligne 70 vient d'être écrite
68-e 067 : 123456789 123456789 123456789 123456789 123456789
$ stdbuf -oL ./bavard 2>&1 | grep -n -B1 -A1 AVERT
70-ligne 070 : 123456789 123456789 123456789 123456789 123456789
71:AVERTISSEMENT : la ligne 70 vient d'être écrite
72-ligne 071 : 123456789 123456789 123456789 123456789 123456789
```

Dans le premier cas, l'avertissement est tombé au milieu de la ligne 67 (à l'octet numéro 4 096) ; dans le second, `stdbuf -oL` impose un tampon par ligne et chaque ligne arrive entière. Sur un terminal, il n'y a aucun problème, ce qui rend le défaut difficile à repérer :

```
$ script -qec ./bavard /dev/null | grep -n -B1 -A1 AVERT
70-ligne 070 : 123456789 123456789 123456789 123456789 123456789
71:AVERTISSEMENT : la ligne 70 vient d'être écrite
72-ligne 071 : 123456789 123456789 123456789 123456789 123456789
```

Le script `capture.sh` capture la sortie des deux façons et repère les lignes dont la longueur n'est pas celle d'une ligne normale (61 caractères) :

```bash
#!/bin/bash
# Capture la sortie de ./bavard, de deux façons
errors=$(mktemp)
trap 'rm -f "$errors"' EXIT

echo "--- stderr mêlée à stdout (2>&1)"
out=$(./bavard 2>&1)
echo "$out" | awk 'length($0) != 61 { print "ligne abîmée :", $0 }'

echo "--- stderr dans un fichier temporaire"
out=$(./bavard 2>"$errors")
echo "$out" | awk 'length($0) != 61 { print "ligne abîmée :", $0 }'
echo "lignes capturées : $(echo "$out" | wc -l)"
echo "erreurs : $(cat "$errors")"
```

```
--- stderr mêlée à stdout (2>&1)
ligne abîmée : lignAVERTISSEMENT : la ligne 70 vient d'être écrite
ligne abîmée : e 067 : 123456789 123456789 123456789 123456789 123456789
--- stderr dans un fichier temporaire
lignes capturées : 100
erreurs : AVERTISSEMENT : la ligne 70 vient d'être écrite
```

| Solution | Principe | Limite |
|---|---|---|
| Sortie d'erreur dans un fichier temporaire (`2>"$errors"`) | Deux flux séparés, rien à entrelacer | Un fichier de plus à nettoyer : `trap` |
| `stdbuf -oL commande` | Force un tampon par ligne pour les programmes C liés dynamiquement | Sans effet sur un programme qui règle lui-même son tampon |
| Dans le programme : `fflush(stdout)` après chaque ligne, ou `setvbuf` | Le programme vide son tampon lui-même | Il faut pouvoir modifier le programme |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `mktemp` crée un fichier (ou, avec `-d`, un dossier) au nom aléatoire et aux droits restreints. `trap '...' EXIT` le nettoie à la fin du script, `trap 'exit 130' INT TERM` transforme un signal en fin normale pour que le nettoyage ait lieu (indispensable en zsh). `timeout` arrête une commande trop longue (code 124) ; dans un script, `--foreground` garde la commande dans le groupe du terminal pour que Ctrl-C l'atteigne. Une sortie d'erreur mêlée à la sortie standard peut couper des lignes en deux. |
| **Outils utilisables** | `mktemp`, `mktemp -d`, `trap`, `timeout` (`--foreground`, `-k`), `stdbuf -oL`, `ps -o pid,ppid,pgid,comm` pour voir les groupes de processus. |
| **Pièges à éviter** | Un nom fixe comme `/tmp/fichier.$$`. Un second `trap ... EXIT` qui remplace le premier. Des guillemets doubles dans un `trap`. Compter sur `trap ... EXIT` seul en zsh. Lancer `timeout` sans `--foreground` dans un script interruptible au clavier. Mêler `2>&1` à la capture d'un programme qui écrit plus de 4 096 octets. |
| **Bonnes pratiques** | Un seul dossier de travail et un seul `trap`. Piéger `EXIT` et `INT TERM`. Tester le script avec un vrai Ctrl-C et vérifier ce qui reste dans `/tmp`. Séparer la sortie d'erreur dans un fichier temporaire. |
