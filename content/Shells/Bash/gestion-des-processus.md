---
order: 11
---

# La gestion des processus

Chaque commande lancée dans un terminal démarre un **processus**. Bash permet de lancer des commandes en arrière-plan, de surveiller les processus en cours, et de les arrêter proprement (ou non) quand nécessaire.

## Premier plan vs arrière-plan

Par défaut, une commande s'exécute au **premier plan** : le terminal attend qu'elle se termine avant d'accepter une nouvelle commande.

```bash
long_traitement.sh &   # le '&' final lance la commande en ARRIÈRE-PLAN
echo "Le terminal reste disponible immédiatement"
```

## Gérer les tâches en arrière-plan (`jobs`, `fg`, `bg`)

```bash
long_traitement.sh &
jobs           # liste les tâches en arrière-plan de la session courante
fg %1          # ramène la tâche numéro 1 au premier plan
# Ctrl+Z suspend une tâche au premier plan (sans l'arrêter)
bg %1          # relance en arrière-plan une tâche suspendue par Ctrl+Z
```

`fg` et `bg` sont des abréviations directes de leur sens anglais : `fg` = *foreground* (premier plan), `bg` = *background* (arrière-plan) — chacune ramène ou renvoie la tâche `%1` dans le plan correspondant. Beaucoup de commandes et de drapeaux Unix suivent ce même principe d'abréviation d'un mot anglais, ce qui aide à les retenir une fois qu'on connaît le mot d'origine : par exemple, dans ce chapitre, `-f` (*full*/*format*, pour `ps aux -f` ou le motif complet de `pgrep -f`) ou `-9` pour `SIGKILL`. Le tableau de signaux ci-dessous précise le sens de chacun.

## Voir les processus en cours (`ps`, `top`)

```bash
ps aux             # liste tous les processus du système, avec utilisateur, CPU, mémoire...
ps aux | grep php   # filtre pour ne voir que les processus liés à "php"
top                 # vue interactive, rafraîchie en direct, triée par consommation CPU par défaut
```

## Terminer un processus (`kill`)

`kill` envoie un **signal** à un processus, identifié par son PID (*Process ID*) :

```bash
kill 1234        # envoie SIGTERM (15) : demande poliment au processus de se terminer proprement
kill -9 1234      # envoie SIGKILL (9) : force l'arrêt immédiat, sans laisser le processus réagir
```

| Signal | Numéro | Effet |
|---|---|---|
| `SIGTERM` | 15 (défaut) | Demande d'arrêt propre — le processus peut intercepter ce signal pour se fermer proprement (fermer des fichiers, sauvegarder...) |
| `SIGKILL` | 9 | Arrêt immédiat et inconditionnel, impossible à intercepter ou ignorer |
| `SIGINT` | 2 | Signal envoyé par `Ctrl+C` depuis le terminal |
| `SIGTSTP` | 20 | Signal envoyé par `Ctrl+Z` : suspend le processus (contrôlable, contrairement à `SIGKILL`) sans le terminer |
| `SIGCONT` | 18 | Reprend l'exécution d'un processus suspendu par `SIGTSTP` (c'est ce qu'envoie `bg`/`fg`, cf. chapitre sur l'architecture d'un shell) |

> **Note :** `kill -9` doit rester un dernier recours — un processus tué avec `SIGKILL` n'a aucune chance de nettoyer derrière lui (fichiers temporaires, connexions ouvertes, verrous...). Toujours essayer `kill` (SIGTERM) en premier.

## Détacher un processus du terminal (`nohup`)

Un processus lancé en arrière-plan avec `&` reçoit tout de même un signal d'arrêt si le terminal qui l'a lancé se ferme. `nohup` (*no hang up*) l'en protège :

```bash
nohup long_traitement.sh &
# le processus continue même après la fermeture du terminal
# sa sortie standard est redirigée par défaut vers un fichier nohup.out
```

## Trouver le PID d'un processus par son nom

```bash
pgrep -f "long_traitement.sh"   # affiche le(s) PID correspondant au motif donné
pkill -f "long_traitement.sh"    # trouve ET termine en une seule commande (envoie SIGTERM par défaut)
```

> **`kill` vs `pkill`** : `kill` a besoin d'un **PID** déjà connu (`kill 1234`) — c'est le seul moyen d'envoyer un signal à un processus précis sans se tromper de cible. `pkill` évite d'avoir à chercher ce PID à la main : il envoie le signal à tout processus dont le nom (ou la ligne de commande complète avec `-f`) correspond au motif donné, ce qui revient à enchaîner `pgrep` puis `kill` sur chaque PID trouvé. Le risque de `pkill` est donc de cibler plus de processus que prévu si le motif est trop large (ex. `pkill -f script.sh` sur une machine où plusieurs scripts contiennent "script.sh" dans leur nom).
