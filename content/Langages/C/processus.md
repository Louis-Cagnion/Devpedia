---
order: 18
---

# La gestion des processus

Un **processus** est une instance d'un programme en cours d'exécution, avec son propre espace mémoire, isolé de celui des autres processus. En C, la bibliothèque standard POSIX (`unistd.h`, `sys/wait.h`) permet de créer de nouveaux processus, de lancer d'autres programmes, et d'attendre leur fin. La norme **POSIX** est présentée dans le chapitre [Écrire un script](/?c=shells&s=bash&p=scripts-et-shebang) de [Bash](/?c=shells&s=bash&p=bash).

> **Note :** `fork()`, `execve()` (utilisé par `execlp()` et les autres fonctions de la famille `exec`) et `wait()`/`waitpid()` sont des **appels système** : voir le chapitre dédié aux appels système et aux descripteurs de fichiers pour ce que ça implique concrètement (passage en espace noyau, gestion des erreurs via `errno`).

## `fork()` : dupliquer le processus courant

`fork()` crée une copie quasi-identique du processus appelant. Après l'appel, **deux** processus existent et continuent tous les deux l'exécution juste après le `fork()` : la seule différence est la valeur renvoyée :

```c
#include <unistd.h>
#include <stdio.h>

int main(void)
{
    pid_t pid = fork();

    if (pid < 0) {
        printf("Erreur : fork a échoué\n");
    } else if (pid == 0) {
        printf("Je suis l'enfant, mon PID est %d\n", getpid());
    } else {
        printf("Je suis le parent, le PID de mon enfant est %d\n", pid);
    }

    return 0;
}
```

| Valeur de retour | Dans quel processus ? | Signification |
|---|---|---|
| `< 0` | Le parent uniquement | Le `fork()` a échoué, aucun enfant créé |
| `0` | L'enfant | Reçoit toujours `0` |
| `> 0` | Le parent | Reçoit le PID (*process ID*) du processus enfant nouvellement créé |

> **Note :** `pid_t` est le type dédié aux identifiants de processus. `getpid()` renvoie le PID du processus courant, `getppid()` celui de son parent.

## Remplacer le programme en cours : la famille `exec`

`fork()` duplique le processus courant, mais ne change pas le programme exécuté. Pour lancer un **autre** programme dans le processus enfant, on utilise une fonction de la famille `exec` (ex. `execve`, `execlp`) : elle remplace entièrement le code du processus courant par celui d'un nouveau programme :

```c
#include <unistd.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        execlp("ls", "ls", "-l", NULL); // remplace le processus enfant par le programme "ls"
        printf("Cette ligne ne s'exécute jamais si execlp réussit\n");
    }

    return 0;
}
```

> **Note :** si `execlp()` réussit, il ne "revient" jamais : le code du processus enfant est intégralement remplacé, la ligne suivante n'est donc atteinte qu'en cas d'échec de `execlp()` lui-même.

## Attendre la fin d'un enfant : `wait()` / `waitpid()`

Sans synchronisation, le parent continue son exécution indépendamment de l'enfant. `wait()` bloque le parent jusqu'à ce qu'**un** de ses enfants se termine :

```c
#include <sys/wait.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        printf("Enfant : je travaille...\n");
        return 42; // code de sortie de l'enfant
    } else {
        int statut;
        wait(&statut); // le parent attend ici que l'enfant se termine

        if (WIFEXITED(statut)) {
            printf("L'enfant s'est terminé avec le code %d\n", WEXITSTATUS(statut));
        }
    }
}
```

- `wait(&statut)` remplit `statut` avec des informations sur la façon dont l'enfant s'est terminé.
- `WIFEXITED(statut)` vérifie que l'enfant s'est terminé normalement (via `return`/`exit()`, pas par un signal).
- `WEXITSTATUS(statut)` extrait le code de sortie réel de l'enfant.

`waitpid(pid, &statut, 0)` fait la même chose que `wait()`, mais permet d'attendre un enfant **précis** (utile quand un processus a plusieurs enfants).

> **Note :** un processus enfant terminé mais jamais "récupéré" par un `wait()` du parent reste un **processus zombie** dans la table des processus du système, jusqu'à ce que son parent appelle `wait()` (ou se termine lui-même).

Voir aussi [Les threads](/?c=langages-de-programmation&s=c&p=threads), une alternative plus légère à `fork()` quand les tâches doivent partager la même mémoire.

## Quand le parent meurt avant ses enfants : les processus orphelins

Un **processus orphelin** est un enfant dont le parent s'est terminé avant lui. Contrairement à un zombie, il **continue de tourner** : le système lui donne un nouveau parent (le premier processus du système, `init`, ou un processus de service désigné pour cela, comme `systemd`), qui le récupérera à sa fin. Tuer un programme ne tue donc **pas** les enfants qu'il a créés avec `fork()`.

Vécu : un script de mesure arrêtait au bout de 90 s un programme qui calculait avec 4 enfants ; les 4 enfants tournaient encore 30 minutes plus tard, occupaient le processeur et faussaient toutes les mesures suivantes.

| Côté | Moyen | Effet |
|---|---|---|
| Enfant | [`prctl(PR_SET_PDEATHSIG, SIGKILL)`](https://man7.org/linux/man-pages/man2/prctl.2.html), Linux uniquement | Le noyau envoie le [signal](/?c=langages&s=c&p=signaux-unix) `SIGKILL` à l'enfant dès que son parent meurt |
| Lanceur | Démarrer le programme dans son propre **groupe de processus** (`setsid()`, voir [le contrôle de tâches d'un shell](/?c=langages&s=bash&p=architecture-dun-shell#le-controle-de-taches-jobs-ctrl-z-fg-bg)), puis tuer tout le groupe : `kill(-groupe, SIGKILL)` | Le programme et tous ses descendants reçoivent le signal ; en Python, voir [le budget de temps de `subprocess`](/?c=langages&s=python&p=sous-processus-et-flux-standard#lancer-plusieurs-programmes-en-parallele-avec-un-budget-de-temps) |

Deux enfants, l'un protégé par `PR_SET_PDEATHSIG`, l'autre non ; le parent se termine au bout d'une seconde sans les attendre. Sortie de `./orphelins; sleep 3` (le `sleep` laisse aux enfants le temps d'écrire) :

```c
#include <signal.h>
#include <stdio.h>
#include <sys/prctl.h>
#include <unistd.h>

static void enfant(int protege, pid_t parent)
{
    if (protege) {
        prctl(PR_SET_PDEATHSIG, SIGKILL);            /* tué à la mort du parent */
        if (getppid() != parent)                     /* parent mort avant l'appel ? */
            _exit(0);
    }
    sleep(2);                                        /* le parent meurt pendant ce temps */
    printf("enfant %s : toujours vivant, parent %s\n",
           protege ? "protégé" : "non protégé",
           getppid() == parent ? "inchangé" : "remplacé");
    fflush(stdout);                                  /* _exit ne vide pas les tampons */
    _exit(0);
}

int main(void)
{
    pid_t parent = getpid();

    for (int protege = 0; protege <= 1; protege++)
        if (fork() == 0)
            enfant(protege, parent);                 /* l'enfant ne revient jamais ici */
    sleep(1);
    printf("parent : je me termine sans attendre mes enfants\n");
    return 0;
}
```

```
parent : je me termine sans attendre mes enfants
enfant non protégé : toujours vivant, parent remplacé
```

L'enfant protégé a été tué à la mort du parent et n'écrit rien ; l'autre tourne toujours, rattaché à un nouveau parent. Le test `getppid() != parent` couvre le cas où le parent meurt entre `fork()` et `prctl()` : l'enfant ne serait alors jamais prévenu.

> **Piège :** un programme qui se relance lui-même avec `execv("/proc/self/exe", ...)` (le chemin spécial de son propre exécutable, voir [la famille `exec`](/?c=langages&s=c&p=processus#remplacer-le-programme-en-cours-la-famille-exec)) apparaît ensuite sous le nom `exe` dans `ps` ou `pgrep`. Vécu : un orphelin ainsi renommé a d'abord été pris pour une application de l'utilisateur. Relancer par le vrai chemin, obtenu avec `readlink("/proc/self/exe", ...)`.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `fork()` duplique le processus courant (deux processus continuent après l'appel) ; `exec*()` remplace le programme du processus courant ; `wait()`/`waitpid()` attendent qu'un enfant se termine. Un enfant dont le parent meurt devient orphelin et continue de tourner. |
| **Outils utilisables** | `fork()`, `execlp()`/`execve()`, `wait()`/`waitpid()`, `WIFEXITED`/`WEXITSTATUS`. ; `prctl(PR_SET_PDEATHSIG, SIGKILL)`, `setsid()` et `kill(-groupe, SIGKILL)` contre les orphelins. |
| **Pièges à éviter** | Oublier d'appeler `wait()` sur un enfant terminé : il reste "zombie" dans la table des processus jusqu'à ce que le parent le récupère ou se termine lui-même. ; croire que tuer un programme tue aussi ses enfants. |
| **Bonnes pratiques** | Toujours vérifier la valeur de retour de `fork()` (`< 0` = échec) avant de brancher sur le cas parent/enfant. |
