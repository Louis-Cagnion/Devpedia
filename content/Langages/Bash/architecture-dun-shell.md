---
order: 13
---

# Comment fonctionne un shell (architecture interne)

Tout ce que Bash fait en surface (variables, boucles, pipes, redirections) repose sur une mécanique assez simple à décrire : une boucle qui lit une ligne, la découpe, l'interprète, puis lance des processus via les appels système standards du [chapitre sur la gestion des processus en C](/?c=langages-de-programmation&s=c&p=processus) (`fork`, `execve`, `wait`). Ce chapitre décrit cette mécanique, dans l'optique de comprendre (voire de reconstruire) un shell minimal.

> **Prérequis :** ce chapitre suppose connu ce qu'est un **appel système** et un **descripteur de fichier** (`STDIN_FILENO`, `dup2()`...). Voir [le chapitre dédié](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) dans la rubrique C si ces notions ne sont pas encore claires.

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

> **Note :** c'est cet ordre précis qui explique pourquoi `"$var"` (avec guillemets) protège du découpage en mots (étape 4) alors que `$var` seul y est exposé : les guillemets ne sont retirés qu'à la toute dernière étape, après que le découpage a déjà eu lieu (ou non) sur le contenu qu'ils protégeaient.

## Comment le glob reconnaît un motif (`*.txt`) : l'algorithme récursif de `fnmatch`

L'étape 5 des expansions ci-dessus (*globbing*) remplace un motif comme `*.txt` par la liste réelle des fichiers qui y correspondent. Le cœur de ce mécanisme est un algorithme de correspondance de motifs récursif (le même principe que la fonction standard `fnmatch()`) : `*` peut représenter n'importe quelle sous-séquence de caractères, y compris vide.

```text
correspond("*.txt", "rapport.txt")
  '*' rencontré -> deux essais :
    1. "*" correspond à 0 caractère -> comparer ".txt" à "rapport.txt" (échec)
    2. "*" avale 1 caractère de plus -> comparer "*.txt" à "apport.txt" (relancer)
  ... répété jusqu'à ce que ".txt" corresponde à la fin de "rapport.txt" -> succès
```

À chaque `*` rencontré dans le motif, l'algorithme essaie d'abord de le faire correspondre à zéro caractère (avancer dans le motif seul), sinon à un caractère de plus de la chaîne testée (avancer dans la chaîne en gardant le `*` courant) : la récursion s'arrête dès qu'un des deux textes est épuisé. En dehors d'un `*`, une correspondance exige une égalité caractère à caractère stricte.

> **Bonne pratique :** ce même algorithme (récursion sur `*`) sert de base à toute recherche par motif joker, pas seulement à l'expansion de chemin : le comprendre permet de prédire le comportement d'un `*` dans n'importe quel outil qui accepte des jokers (recherche de fichiers, filtre de log...).

## Représenter la ligne : un arbre de syntaxe (AST)

Une ligne comme `cmd1 && cmd2 || cmd3` combine plusieurs commandes avec des opérateurs (`&&`, `||`, `|`) qui n'ont pas tous la même priorité ni le même sens : l'exécuter mot par mot, dans l'ordre de lecture, ne suffit pas à respecter cette priorité. Le shell construit d'abord un **arbre de syntaxe abstraite** (AST, *Abstract Syntax Tree*) : un arbre binaire dont les nœuds internes sont les opérateurs et les feuilles les commandes.

```text
cmd1 && cmd2 || cmd3

        OR
       /  \
     AND   cmd3
    /   \
 cmd1   cmd2
```

Exécuter la ligne devient alors un simple parcours récursif de cet arbre :

- une feuille (une commande) se lance normalement (`fork`/`execve`/`waitpid`, voir plus haut) ;
- un nœud `AND` n'exécute sa branche droite que si la gauche a réussi (code de sortie `0`) ;
- un nœud `OR` n'exécute sa branche droite que si la gauche a échoué.

Les parenthèses (`(cmd1 && cmd2) || cmd3`) créent une sous-arborescence évaluée en premier, exactement comme en mathématiques : c'est la structure de l'arbre elle-même qui encode la priorité et l'associativité des opérateurs, pas un test répété sur le texte de la ligne.

> **Note :** ce même principe (parsing → AST → évaluation récursive) est celui d'un interpréteur de calculatrice ou d'un moteur de règles : dès qu'une syntaxe combine des éléments avec des opérateurs à priorités différentes, un arbre plutôt qu'une lecture linéaire simplifie l'exécution.

## Les sous-shells : fork() sans execve()

Dans l'exemple de commande externe ci-dessous, l'enfant issu de `fork()` appelle `execve()` : il remplace aussitôt son image mémoire par un autre programme et cesse d'être un shell. Un **sous-shell** est l'autre cas de figure : un enfant qui **reste** un shell et continue d'interpréter des commandes, sans jamais appeler `execve()`. Bash en crée un automatiquement pour :

- une commande entre parenthèses : `(cd /tmp && ls)`
- chaque étage d'un pipeline (cf. section suivante)
- une substitution de commande : `resultat=$(commande)`
- une commande en arrière-plan : `commande &`

Un sous-shell hérite d'une **copie** des variables du shell parent au moment où il démarre, mais c'est une copie à sens unique, comme pour l'export d'une [variable d'environnement](/?c=shells&s=bash&p=variables-denvironnement) : toute modification qu'il fait (`cd`, variable...) disparaît avec lui à sa terminaison, sans jamais atteindre le parent.

```bash
cd /tmp
(cd /var && pwd)  # affiche /var, dans le sous-shell
pwd               # affiche toujours /tmp : le cd du sous-shell n'a pas survécu
```

## Regrouper des commandes sans sous-shell : `{ ; }`

`{ commande1; commande2; }` produit un effet proche de `(commande1; commande2)` vu plus haut, mais **sans** créer de sous-shell : les commandes s'exécutent directement dans le shell courant, avec les mêmes conséquences qu'un `cd` ou une variable tapés normalement.

```bash
cd /tmp
{ cd /var; pwd; }   # affiche /var
pwd                 # affiche toujours /var : pas de sous-shell, le cd a bien eu lieu ici
```

| | `( ; )` | `{ ; }` |
|---|---|---|
| Crée un sous-shell | Oui | Non |
| `cd`/variable modifiés survivent après | Non | Oui |
| Espace après le symbole d'ouverture | Non nécessaire | **Obligatoire** |
| `;` avant le symbole de fermeture | Non nécessaire | **Obligatoire** |

> **Piège :** `{ls;}` (sans espaces) est une erreur de syntaxe. `{` et `}` sont ici des **mots-clés** du shell, pas des opérateurs comme `(`/`)` : ils doivent donc être séparés du reste par un espace, exactement comme n'importe quel autre mot de la ligne de commande.

## Colorer la sortie d'un terminal : les codes ANSI

Un terminal n'affiche pas que du texte brut : il interprète aussi certaines séquences d'octets comme des instructions de mise en forme (couleur, gras...), les **codes d'échappement ANSI**. Une séquence commence par le caractère `ESC` (`\033` en octal), suivi de `[`, d'un code, puis d'une lettre finale :

```bash
printf '\033[31mTexte en rouge\033[0m\n'
```

| Code | Effet |
|---|---|
| `\033[31m` | Texte rouge |
| `\033[32m` | Texte vert |
| `\033[36m` | Texte cyan |
| `\033[0m` | Réinitialise tout (couleur, gras...) |

> **Piège :** `echo '\033[31mTexte\033[0m'` (sans `-e`) affiche le plus souvent la séquence **telle quelle**, en texte brut, plutôt que de l'interpréter. Le comportement par défaut d'`echo` face à une séquence d'échappement dépend en réalité du shell qui l'exécute : le `echo` interne de Bash ne l'interprète que si `-e` est passé, alors que le `echo` interne de `dash` (le `/bin/sh` par défaut sur beaucoup de distributions Linux) l'interprète nativement, sans `-e`. Une même ligne peut donc afficher des couleurs dans un Makefile (dont les recettes s'exécutent via `/bin/sh`) et échouer telle quelle une fois copiée dans un prompt Bash interactif.
>
> **Bonne pratique :** préférer `printf`, dont le comportement est constant d'un shell à l'autre (il interprète toujours `\033` dans sa chaîne de format), plutôt que de compter sur celui d'`echo`, qui varie.

## Exécuter une commande : builtin vs externe

Une fois la ligne découpée et expansée, le shell doit distinguer deux cas :

### Les commandes internes (*builtins*)

`cd`, `export`, `echo` (souvent), `read`, `exit`... sont exécutées **directement par le processus shell lui-même**, sans lancer de nouveau processus. C'est une nécessité, pas un choix de style : `cd` doit changer le répertoire courant **du shell**, pas celui d'un sous-processus éphémère qui disparaîtrait aussitôt avec son changement de répertoire.

### Les commandes externes

Pour un programme comme `ls` ou `grep`, le shell reproduit exactement le mécanisme du chapitre sur la gestion des processus en [C](/?c=langages-de-programmation&s=c&p=c) :

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

## Le code de sortie d'un processus tué par un signal

`waitpid()` (ci-dessus) ne renvoie pas directement un simple code de sortie : c'est un statut à décoder via les macros `WIFEXITED`/`WEXITSTATUS` (sortie normale) ou `WIFSIGNALED`/`WTERMSIG` (terminé par un signal, voir [Signaux UNIX](/?c=langages-de-programmation&s=c&p=signaux-unix)). Quand un processus est tué par un signal (`Ctrl+C` envoie `SIGINT`, par exemple) plutôt que de se terminer normalement via `exit()`, la convention POSIX reprise par tous les shells consiste à exposer `128 + numéro_du_signal` comme code de sortie apparent :

| Signal | Numéro | Code de sortie (`$?`) |
|---|---|---|
| `SIGINT` (Ctrl+C) | 2 | 130 |
| `SIGQUIT` (Ctrl+\\) | 3 | 131 |
| `SIGKILL` | 9 | 137 |

```bash
sleep 100
# Ctrl+C pendant l'exécution
echo $?   # affiche 130 (128 + 2)
```

> **Piège :** croire que `$?` ne peut valoir qu'entre 0 et 255 pour des raisons arbitraires. C'est justement cette plage (un octet) qui explique la convention `128 + signal` : au-delà de 128, `$?` encode en réalité "tué par le signal `$? - 128`", jamais un vrai code de retour choisi par le programme.

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

C'est pourquoi un script sans droit d'exécution (`chmod +x`, voir [Permissions et manipulation de fichiers](/?c=shells&s=bash&p=permissions-et-fichiers)) ne peut pas être lancé directement (`./script.sh` échoue), mais reste exécutable en invoquant l'interpréteur explicitement (`bash script.sh`) : dans ce second cas, c'est `bash` lui-même (déjà exécutable) qui est lancé par `execve()` : c'est lui, et non le noyau, qui ouvre ensuite le script comme un simple fichier texte à lire ligne par ligne.

## Comment le shell trouve quel exécutable lancer

Si la commande tapée contient un `/` (ex. `./script.sh`, `/bin/ls`), le shell l'utilise directement. Sinon, il parcourt chaque dossier listé dans [`$PATH`](/?c=shells&s=bash&p=variables-denvironnement), dans l'ordre, et s'arrête au **premier** fichier exécutable trouvé portant ce nom : c'est un simple test `access(chemin, X_OK)` répété sur chaque candidat.

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

`dup2(source, cible)` fait pointer le descripteur `cible` (ex. `STDOUT_FILENO`, qui vaut `1`) vers la même ressource que `source` : c'est exactement ce mécanisme, appliqué au descripteur d'un pipe plutôt qu'à un fichier, qui relie la sortie d'une commande à l'entrée de la suivante.

## Implémenter une redirection (`>`, `<`)

Même logique que pour un pipe, mais la "source" est un fichier ouvert avec `open()` plutôt qu'un pipe :

```c
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
// tout ce qu'écrit le programme sur stdout part maintenant dans sortie.txt
dup2(fd, STDOUT_FILENO);
close(fd);
execve(...);
```

`O_TRUNC` correspond à `>` (écrase le fichier), `O_APPEND` à `>>` (ajoute à la fin) ; voir [Redirections et pipes](/?c=shells&s=bash&p=redirections-et-pipes) pour le comportement observé côté utilisateur.

## Le here-document (`<<DELIM`) : rediriger un bloc de texte sans fichier

Contrairement à `<` qui redirige depuis un fichier déjà existant, `<<DELIM` fait lire au shell les lignes suivantes de l'entrée **directement depuis le terminal** (ou le script), jusqu'à rencontrer une ligne composée uniquement du délimiteur choisi :

```bash
cat <<FIN
Première ligne
Deuxième ligne
FIN
```

Le shell fournit tout ce texte comme entrée standard de la commande, exactement comme s'il venait d'un fichier : utile pour injecter un bloc multi-lignes sans créer de fichier séparé. Une implémentation possible (dans un mini-shell) écrit chaque ligne lue dans un fichier temporaire (`open(".heredoc", O_WRONLY | O_CREAT | O_TRUNC)`) au fur et à mesure, puis rouvre ce fichier en lecture comme entrée de la commande, une fois le délimiteur atteint.

> **Note :** entourer le délimiteur de guillemets (`<<"FIN"` ou `<<'FIN'`) désactive les expansions de variables à l'intérieur du bloc (`$var` reste littéral) ; sans guillemets, les expansions habituelles s'appliquent normalement au texte du here-document.

## Le contrôle de tâches (jobs) : `&`, `Ctrl+Z`, `fg`/`bg`

Chaque pipeline lancé forme un **groupe de processus** : un identifiant partagé (`setpgid()`) qui permet au shell et au terminal de traiter tous les processus d'un même pipeline comme une seule unité (ex. leur envoyer un signal à tous en même temps), plutôt que de devoir cibler chaque PID individuellement. Le terminal ne donne le contrôle clavier qu'à **un seul** groupe à la fois (`tcsetpgrp()`), celui au premier plan. `Ctrl+Z` envoie le signal `SIGTSTP` à ce groupe (le suspend sans le terminer), `fg`/`bg` (voir [La gestion des processus](/?c=shells&s=bash&p=gestion-des-processus)) redonnent respectivement le contrôle du terminal ou renvoient `SIGCONT` pour reprendre l'exécution en arrière-plan.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un shell est une boucle REPL : lire une ligne, appliquer les expansions dans un ordre fixe, exécuter (builtin en interne, ou `fork`/`execve`/`wait` pour une commande externe). `( ; )` crée un sous-shell, `{ ; }` regroupe des commandes sans en créer. `&&`/`\|\|`/`\|` se représentent en interne par un arbre de syntaxe (AST) qui encode leur priorité. |
| **Outils utilisables** | `fork()`/`execve()`/`waitpid()`, `pipe()`/`dup2()` pour les pipes et redirections, `<<DELIM` pour un here-document, le shebang pour qu'un script soit reconnu comme exécutable, `printf` pour des codes ANSI fiables d'un shell à l'autre. |
| **Pièges à éviter** | Confondre l'ordre des expansions : c'est lui qui explique pourquoi `"$var"` protège du découpage en mots alors que `$var` seul y est exposé. Omettre les espaces autour de `{ ; }`. Compter sur `echo` pour interpréter un code ANSI : son comportement par défaut varie d'un shell à l'autre. Oublier que `$?` au-delà de 128 encode un signal (`128 + numéro`), pas un vrai code de retour. |
| **Bonnes pratiques** | Construire son propre mini-shell pour vérifier sa compréhension : boucle de lecture, analyseur, expansions, `fork`/`execve`/`waitpid`, `pipe`/`dup2`/`open`. Préférer `{ ; }` à un sous-shell quand une modification (`cd`, variable) doit survivre au groupe de commandes. |

## Construire son propre mini-shell

En résumé, un shell minimal en [C](/?c=langages-de-programmation&s=c&p=c) a besoin de : une boucle de lecture, un analyseur qui respecte les guillemets et les opérateurs (`|`, `>`, `<`, `&&`), la logique d'expansion dans le bon ordre, `fork`/`execve`/`waitpid` pour les commandes externes, des fonctions C directement appelées pour les builtins, et `pipe()`/`dup2()`/`open()` pour les pipes et redirections. C'est littéralement l'architecture complète ; le reste (complétion, historique, coloration...) n'est que du confort ajouté par-dessus.
