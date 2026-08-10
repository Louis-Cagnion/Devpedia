---
order: 13
---

# Comment fonctionne un shell (architecture interne)

Tout ce que Bash fait en surface (variables, boucles, pipes, redirections) repose sur une mécanique assez simple à décrire : une boucle qui lit une ligne, la découpe, l'interprète, puis lance des processus via les appels système standards du chapitre sur la gestion des processus en C (`fork`, `execve`, `wait`). Ce chapitre décrit cette mécanique, dans l'optique de comprendre — voire de reconstruire — un shell minimal.

> **Prérequis :** ce chapitre suppose connu ce qu'est un **appel système** et un **descripteur de fichier** (`STDIN_FILENO`, `dup2()`...) — voir le chapitre dédié dans la rubrique C si ces notions ne sont pas encore claires.

## La boucle principale (REPL)

Un shell interactif est fondamentalement une boucle infinie :

```text
tant que vrai :
    afficher le prompt
    lire une ligne de commande
    découper la ligne en mots (tokenisation)
    appliquer les expansions (variables, jokers, substitutions...)
    exécuter la commande résultante
    attendre sa fin si elle est au premier plan
```

*Read-Eval-Print Loop* (REPL) : lire, évaluer, (implicitement) afficher le résultat via la sortie standard de la commande, boucler.

## L'ordre précis des expansions

Une ligne tapée n'est **pas** exécutée telle quelle : Bash applique plusieurs passes d'expansion, dans un ordre fixe et non négociable, avant de lancer quoi que ce soit :

1. **Expansion d'accolades** (`{1,2,3}` → `1 2 3`)
2. **Expansion du tilde** (`~` → `/home/utilisateur`)
3. **Expansion de paramètres/variables, substitution de commande et arithmétique** (`$var`, `$(commande)`, `$((1+1))`), évaluées de gauche à droite
4. **Découpage en mots** (*word splitting*) : le résultat des expansions précédentes est redécoupé selon les espaces, sauf s'il était entre guillemets doubles
5. **Expansion de chemin** (*globbing* : `*.txt` → liste réelle de fichiers)
6. **Suppression des guillemets** (les guillemets eux-mêmes ne sont jamais transmis à la commande finale)

> **Note :** c'est cet ordre précis qui explique pourquoi `"$var"` (avec guillemets) protège du découpage en mots (étape 4) alors que `$var` seul y est exposé — les guillemets ne sont retirés qu'à la toute dernière étape, après que le découpage a déjà eu lieu (ou non) sur le contenu qu'ils protégeaient.

## Les sous-shells : fork() sans execve()

Dans l'exemple de commande externe ci-dessous, l'enfant issu de `fork()` appelle `execve()` : il remplace aussitôt son image mémoire par un autre programme et cesse d'être un shell. Un **sous-shell** est l'autre cas de figure : un enfant qui **reste** un shell et continue d'interpréter des commandes, sans jamais appeler `execve()`. Bash en crée un automatiquement pour :

- une commande entre parenthèses : `(cd /tmp && ls)`
- chaque étage d'un pipeline (cf. section suivante)
- une substitution de commande : `resultat=$(commande)`
- une commande en arrière-plan : `commande &`

Un sous-shell hérite d'une **copie** des variables du shell parent au moment où il démarre — mais c'est une copie à sens unique, comme pour l'export d'une [variable d'environnement](/?c=shells&s=bash&p=variables-denvironnement) : toute modification qu'il fait (`cd`, variable...) disparaît avec lui à sa terminaison, sans jamais atteindre le parent.

```bash
cd /tmp
(cd /var && pwd)   # affiche /var, dans le sous-shell
pwd                # affiche toujours /tmp : le cd du sous-shell n'a pas survécu
```

## Exécuter une commande : builtin vs externe

Une fois la ligne découpée et expansée, le shell doit distinguer deux cas :

### Les commandes internes (*builtins*)

`cd`, `export`, `echo` (souvent), `read`, `exit`... sont exécutées **directement par le processus shell lui-même**, sans lancer de nouveau processus. C'est une nécessité, pas un choix de style : `cd` doit changer le répertoire courant **du shell**, pas celui d'un sous-processus éphémère qui disparaîtrait aussitôt avec son changement de répertoire.

### Les commandes externes

Pour un programme comme `ls` ou `grep`, le shell reproduit exactement le mécanisme du chapitre sur la gestion des processus en C :

```c
pid_t pid = fork();

if (pid == 0) {
    // processus enfant : remplace son image mémoire par le programme demandé
    execve("/bin/ls", arguments, environnement);
    _exit(127); // atteint uniquement si execve a échoué (commande introuvable, par exemple)
} else {
    // processus parent (le shell lui-même) : attend la fin de l'enfant
    int statut;
    waitpid(pid, &statut, 0);
}
```

## Comment le noyau reconnaît un script exécutable (le shebang)

Quand `execve()` reçoit le chemin d'un fichier, le noyau lit ses tout premiers octets pour savoir comment le lancer. S'ils valent `#!` (le [shebang](/?c=shells&s=bash&p=scripts-et-shebang)), le noyau ne tente pas d'exécuter le fichier comme du code machine : il relance lui-même `execve()`, cette fois sur l'interpréteur indiqué après `#!`, en lui passant le chemin du script d'origine comme premier argument.

```text
./script.sh
      │
      ▼
execve("./script.sh", ...)
      │
      ▼
Le noyau lit les 2 premiers octets du fichier : "#!"
      │
      ▼
Relance : execve("/bin/bash", ["/bin/bash", "./script.sh", ...], ...)
```

C'est pourquoi un script sans droit d'exécution (`chmod +x`, voir [Permissions et manipulation de fichiers](/?c=shells&s=bash&p=permissions-et-fichiers)) ne peut pas être lancé directement (`./script.sh` échoue), mais reste exécutable en invoquant l'interpréteur explicitement (`bash script.sh`) : dans ce second cas, c'est `bash` lui-même (déjà exécutable) qui est lancé par `execve()` — c'est lui, et non le noyau, qui ouvre ensuite le script comme un simple fichier texte à lire ligne par ligne.

## Comment le shell trouve quel exécutable lancer

Si la commande tapée contient un `/` (ex. `./script.sh`, `/bin/ls`), le shell l'utilise directement. Sinon, il parcourt chaque dossier listé dans [`$PATH`](/?c=shells&s=bash&p=variables-denvironnement), dans l'ordre, et s'arrête au **premier** fichier exécutable trouvé portant ce nom — c'est un simple test `access(chemin, X_OK)` répété sur chaque candidat.

## Implémenter un pipe (`cmd1 | cmd2`)

Un pipe s'appuie sur l'appel système `pipe()`, qui crée deux descripteurs de fichier connectés (une extrémité en lecture, une en écriture), combiné à `fork()` et `dup2()` :

```c
int fds[2];
pipe(fds); // fds[0] = extrémité de lecture, fds[1] = extrémité d'écriture

pid_t p1 = fork();
if (p1 == 0) {
    dup2(fds[1], STDOUT_FILENO); // la sortie standard de cmd1 devient l'écriture du pipe
    close(fds[0]);
    close(fds[1]);
    execve("/bin/ls", ...);
}

pid_t p2 = fork();
if (p2 == 0) {
    dup2(fds[0], STDIN_FILENO); // l'entrée standard de cmd2 devient la lecture du pipe
    close(fds[0]);
    close(fds[1]);
    execve("/usr/bin/grep", ...);
}

close(fds[0]);
close(fds[1]);
waitpid(p1, NULL, 0);
waitpid(p2, NULL, 0);
```

`dup2(source, cible)` fait pointer le descripteur `cible` (ex. `STDOUT_FILENO`, qui vaut `1`) vers la même ressource que `source` — c'est exactement ce mécanisme, appliqué au descripteur d'un pipe plutôt qu'à un fichier, qui relie la sortie d'une commande à l'entrée de la suivante.

## Implémenter une redirection (`>`, `<`)

Même logique que pour un pipe, mais la "source" est un fichier ouvert avec `open()` plutôt qu'un pipe :

```c
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // tout ce qu'écrit le programme sur stdout part maintenant dans sortie.txt
close(fd);
execve(...);
```

`O_TRUNC` correspond à `>` (écrase le fichier), `O_APPEND` à `>>` (ajoute à la fin) — voir [Redirections et pipes](/?c=shells&s=bash&p=redirections-et-pipes) pour le comportement observé côté utilisateur.

## Le contrôle de tâches (jobs) : `&`, `Ctrl+Z`, `fg`/`bg`

Chaque pipeline lancé forme un **groupe de processus** — un identifiant partagé (`setpgid()`) qui permet au shell et au terminal de traiter tous les processus d'un même pipeline comme une seule unité (ex. leur envoyer un signal à tous en même temps), plutôt que de devoir cibler chaque PID individuellement. Le terminal ne donne le contrôle clavier qu'à **un seul** groupe à la fois (`tcsetpgrp()`), celui au premier plan. `Ctrl+Z` envoie le signal `SIGTSTP` à ce groupe (le suspend sans le terminer), `fg`/`bg` (voir [La gestion des processus](/?c=shells&s=bash&p=gestion-des-processus)) redonnent respectivement le contrôle du terminal ou renvoient `SIGCONT` pour reprendre l'exécution en arrière-plan.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un shell est une boucle REPL : lire une ligne, appliquer les expansions dans un ordre fixe, exécuter (builtin en interne, ou `fork`/`execve`/`wait` pour une commande externe). |
| **Outils utilisables** | `fork()`/`execve()`/`waitpid()`, `pipe()`/`dup2()` pour les pipes et redirections, le shebang pour qu'un script soit reconnu comme exécutable. |
| **Pièges à éviter** | Confondre l'ordre des expansions — c'est lui qui explique pourquoi `"$var"` protège du découpage en mots alors que `$var` seul y est exposé. |
| **Bonnes pratiques** | Construire son propre mini-shell pour vérifier sa compréhension : boucle de lecture, analyseur, expansions, `fork`/`execve`/`waitpid`, `pipe`/`dup2`/`open`. |

## Construire son propre mini-shell

En résumé, un shell minimal en C a besoin de : une boucle de lecture, un analyseur qui respecte les guillemets et les opérateurs (`|`, `>`, `<`, `&&`), la logique d'expansion dans le bon ordre, `fork`/`execve`/`waitpid` pour les commandes externes, des fonctions C directement appelées pour les builtins, et `pipe()`/`dup2()`/`open()` pour les pipes et redirections. C'est littéralement l'architecture complète — le reste (complétion, historique, coloration...) n'est que du confort ajouté par-dessus.
