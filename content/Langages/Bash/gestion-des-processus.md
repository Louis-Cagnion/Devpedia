---
order: 12
---

# La gestion des processus

Chaque commande lancée dans un terminal démarre un **processus**. Bash permet de lancer des commandes en arrière-plan, de surveiller les processus en cours, et de les arrêter proprement (ou non) quand nécessaire.

> Les outils de ce chapitre affichent la consommation **CPU** (*Central Processing Unit*, le processeur) de chaque processus, en pourcentage d'un cœur. Une valeur supérieure à 100 % n'est donc pas une anomalie : elle signifie que le processus occupe plusieurs cœurs en parallèle.

## Premier plan vs arrière-plan

Par défaut, une commande s'exécute au **premier plan** : le terminal attend qu'elle se termine avant d'accepter une nouvelle commande.

```bash
long_traitement.sh &   # le '&' final lance la commande en ARRIÈRE-PLAN
echo "Le terminal reste disponible immédiatement"
```

## Gérer les tâches en arrière-plan (`jobs`, `fg`, `bg`)

```bash
long_traitement.sh &
jobs   # liste les tâches en arrière-plan de la session courante
fg %1  # ramène la tâche numéro 1 au premier plan
# Ctrl+Z suspend une tâche au premier plan (sans l'arrêter)
bg %1          # relance en arrière-plan une tâche suspendue par Ctrl+Z
```

`fg` et `bg` sont des abréviations directes de leur sens anglais : `fg` = *foreground* (premier plan), `bg` = *background* (arrière-plan) : chacune ramène ou renvoie la tâche `%1` dans le plan correspondant. Beaucoup de commandes et de drapeaux [Unix](/?c=shells&s=bash&p=scripts-et-shebang) suivent ce même principe d'abréviation d'un mot anglais, ce qui aide à les retenir une fois qu'on connaît le mot d'origine : par exemple, dans ce chapitre, `-f` (*full*/*format*, pour `ps aux -f` ou le motif complet de `pgrep -f`) ou `-9` pour `SIGKILL`. Le tableau de signaux ci-dessous précise le sens de chacun.

## Voir les processus en cours (`ps`, `top`)

```bash
ps aux             # liste tous les processus du système, avec utilisateur, CPU, mémoire...
ps aux | grep php  # filtre pour ne voir que les processus liés à "php"
# vue interactive, rafraîchie en direct, triée par consommation CPU par défaut
top
```

## Terminer un processus (`kill`)

`kill` envoie un **signal** à un processus, identifié par son PID (*Process ID*) :

```bash
kill 1234     # envoie SIGTERM (15) : demande poliment au processus de se terminer proprement
kill -9 1234  # envoie SIGKILL (9) : force l'arrêt immédiat, sans laisser le processus réagir
```

| Signal | Numéro | Effet |
|---|---|---|
| `SIGTERM` | 15 (défaut) | Demande d'arrêt propre : le processus peut intercepter ce signal pour se fermer proprement (fermer des fichiers, sauvegarder...) |
| `SIGKILL` | 9 | Arrêt immédiat et inconditionnel, impossible à intercepter ou ignorer |
| `SIGINT` | 2 | Signal envoyé par `Ctrl+C` depuis le terminal |
| `SIGTSTP` | 20 | Signal envoyé par `Ctrl+Z` : suspend le processus (contrôlable, contrairement à `SIGKILL`) sans le terminer |
| `SIGCONT` | 18 | Reprend l'exécution d'un processus suspendu par `SIGTSTP` (c'est ce qu'envoie `bg`/`fg`, voir [Comment fonctionne un shell](/?c=shells&s=bash&p=architecture-dun-shell)) |

> **Note :** `kill -9` doit rester un dernier recours : un processus tué avec `SIGKILL` n'a aucune chance de nettoyer derrière lui (fichiers temporaires, connexions ouvertes, verrous...). Toujours essayer `kill` (SIGTERM) en premier.

## Intercepter un signal (`trap`)

`trap` permet à un script d'exécuter du code en réponse à un signal reçu, au lieu de subir l'arrêt par défaut :

```bash
trap 'echo "Arrêt propre"; rm -f fichier.tmp' SIGTERM
```

Un signal non interceptable comme `SIGKILL` ignore totalement `trap` : c'est justement pour ça qu'il reste le dernier recours vu plus haut. Pour nettoyer des fichiers temporaires de façon fiable (pseudo-signal `EXIT`, différence entre bash et zsh, `timeout`), voir [Un script qui nettoie et s'arrête proprement](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout).

## Supprimer un fichier temporaire à coup sûr : `mktemp` et `trap`

Un script qui crée un fichier temporaire doit le supprimer **quelle que soit la façon dont il se termine** : fin normale, erreur, Ctrl-C, `kill`. [`mktemp`](https://www.gnu.org/software/coreutils/manual/html_node/mktemp-invocation.html) crée un fichier vide au nom unique et imprévisible (de la forme `/tmp/tmp.7nzzmlI0bS`) et affiche son chemin ; `mktemp -d` crée un dossier de la même façon.

```bash
tmp=$(mktemp) || exit 1   # fichier au nom unique ; on s'arrête s'il ne peut pas être créé
trap 'rm -f "$tmp"' EXIT  # suppression à toute sortie du script
trap 'exit 130' INT       # Ctrl-C : sortir, ce qui déclenche le trap EXIT
trap 'exit 143' TERM      # SIGTERM (envoyé par kill) : idem
```

Les codes 130 et 143 suivent la convention « 128 + numéro du signal » (SIGINT est le signal 2, SIGTERM le 15). Résultat mesuré : le fichier créé par `mktemp` est-il supprimé ?

| Interpréteur | Fin du script | Aucun `trap` | `EXIT` seul | `EXIT` + `INT` + `TERM` |
|---|---|---|---|---|
| Bash | normale | reste | supprimé | supprimé |
| Bash | Ctrl-C | reste | supprimé | supprimé |
| Bash | SIGTERM | reste | supprimé | supprimé |
| Zsh | normale | reste | supprimé | supprimé |
| Zsh | Ctrl-C | reste | **reste** | supprimé |
| Zsh | SIGTERM | reste | **reste** | supprimé |

Bash exécute le `trap` sur `EXIT` même quand un signal l'arrête ; zsh ne le fait pas. Écrire les trois `trap` rend le script correct dans les deux shells.

> **Piège :** un nom fixe (`/tmp/mon_script.tmp`). Deux exécutions simultanées se marchent dessus, et un autre utilisateur de la machine qui devine le nom peut y placer un lien symbolique vers un fichier sensible, que le script écrasera.
>
> **Bonne pratique :** toujours `mktemp`, et poser le `trap` avant la création du fichier (avec `tmp=` vide au départ : `rm -f ""` ne fait rien) pour ne laisser aucune fenêtre où un signal laisserait le fichier derrière lui.

> **Note :** un script lancé en arrière-plan par un shell non interactif (`script.sh &`) a `SIGINT` ignoré dès le départ, et un signal ignoré à l'entrée ne peut pas être intercepté ([signaux dans Bash](https://www.gnu.org/software/bash/manual/bash.html#Signals)). Tester le nettoyage par Ctrl-C dans un vrai terminal, ou avec `kill -TERM`. `SIGKILL` reste impossible à intercepter : le fichier reste alors en place.

## Limiter la durée d'une commande : `timeout` et Ctrl-C

`timeout` (GNU coreutils) lance une commande et l'arrête si elle dépasse une durée :

```bash
timeout 30 ./traitement.sh               # arrêté au bout de 30 s : code de sortie 124
timeout --foreground 30 ./traitement.sh  # idem, mais Ctrl-C l'atteint aussi
timeout -k 5 30 ./traitement.sh          # SIGKILL 5 s après SIGTERM si besoin : code 137
```

| Situation | Code de sortie de `timeout` |
|---|---|
| La commande finit à temps | Le sien |
| Délai dépassé : SIGTERM envoyé | 124 |
| Délai dépassé, SIGTERM ignoré, puis SIGKILL (`-k`) | 137 |

Pour pouvoir arrêter toute la descendance de la commande, `timeout` se place dans son **propre groupe de processus** (voir [Comment fonctionne un shell](/?c=shells&s=bash&p=architecture-dun-shell)). Or le terminal envoie Ctrl-C (SIGINT) au seul groupe de **premier plan** : ni `timeout` ni la commande ne le reçoivent.

Mesuré sur `timeout 20 sleep 8` lancé par un script, Ctrl-C tapé 0,8 s après le départ :

| Option | Après Ctrl-C |
|---|---|
| Aucune | Rien ne s'arrête : le script attend la fin normale de `sleep` (7,2 s plus tard) et continue comme si de rien n'était |
| `--foreground` | Arrêt immédiat |

> **Piège :** `--foreground` ne délègue plus l'arrêt à tout un groupe : au dépassement du délai, les **enfants** de la commande ne sont plus arrêtés ([manuel de `timeout`](https://www.gnu.org/software/coreutils/manual/html_node/timeout-invocation.html)).
>
> **Bonne pratique :** `--foreground` pour un script qu'un humain lance dans un terminal et doit pouvoir interrompre ; sans l'option pour un script sans terminal (tâche planifiée) qui doit couper toute la descendance au dépassement du délai.

## Détacher un processus du terminal (`nohup`)

Un processus lancé en arrière-plan avec `&` reçoit tout de même un signal d'arrêt si le terminal qui l'a lancé se ferme. `nohup` (*no hang up*) l'en protège :

```bash
nohup long_traitement.sh &
# le processus continue même après la fermeture du terminal
# sa sortie standard est redirigée par défaut vers un fichier nohup.out
```

## Trouver le PID d'un processus par son nom

```bash
pgrep -f "long_traitement.sh"  # affiche le(s) PID correspondant au motif donné
# trouve ET termine en une seule commande (envoie SIGTERM par défaut)
pkill -f "long_traitement.sh"
```

> **`kill` vs `pkill`** : `kill` a besoin d'un **PID** déjà connu (`kill 1234`) : c'est le seul moyen d'envoyer un signal à un processus précis sans se tromper de cible. `pkill` évite d'avoir à chercher ce PID à la main : il envoie le signal à tout processus dont le nom (ou la ligne de commande complète avec `-f`) correspond au motif donné, ce qui revient à enchaîner `pgrep` puis `kill` sur chaque PID trouvé. Le risque de `pkill` est donc de cibler plus de processus que prévu si le motif est trop large (ex. `pkill -f script.sh` sur une machine où plusieurs scripts contiennent "script.sh" dans leur nom).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un `&` final lance une commande en arrière-plan. `kill` envoie un signal (SIGTERM par défaut, SIGKILL en dernier recours) ; `trap` permet d'intercepter un signal pour un nettoyage propre. `mktemp` crée un fichier temporaire au nom unique ; `trap` sur `EXIT`, `INT` et `TERM` le supprime quelle que soit la sortie du script (`EXIT` seul suffit en Bash, pas en zsh). `timeout` arrête une commande trop longue (code 124), mais Ctrl-C ne l'atteint qu'avec `--foreground`. |
| **Outils utilisables** | `jobs`/`fg`/`bg`, `ps`/`top`, `pgrep`/`pkill`, `nohup`. |
| **Pièges à éviter** | Utiliser `kill -9` (SIGKILL) par réflexe : le processus n'a alors aucune chance de nettoyer derrière lui. Un nom de fichier temporaire fixe. Compter sur `trap … EXIT` seul en zsh. Tester le nettoyage par Ctrl-C sur un script lancé avec `&`. Oublier `--foreground` sur un script interactif, ou l'utiliser là où il faut couper toute la descendance. |
| **Bonnes pratiques** | Toujours essayer `kill` (SIGTERM) avant `kill -9` ; vérifier le motif de `pkill` avant de l'exécuter, pour ne pas cibler plus de processus que prévu. Poser le `trap` avant `mktemp` et l'écrire sur `EXIT`, `INT` et `TERM` ; choisir `--foreground` selon que le script est lancé par un humain ou par une tâche planifiée. |
