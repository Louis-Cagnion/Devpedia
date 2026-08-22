---
order: 15
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

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `fork()` duplique le processus courant (deux processus continuent après l'appel) ; `exec*()` remplace le programme du processus courant ; `wait()`/`waitpid()` attendent qu'un enfant se termine. |
| **Outils utilisables** | `fork()`, `execlp()`/`execve()`, `wait()`/`waitpid()`, `WIFEXITED`/`WEXITSTATUS`. |
| **Pièges à éviter** | Ne jamais appeler `wait()` sur un enfant terminé : il reste "zombie" dans la table des processus jusqu'à ce que le parent le récupère ou se termine lui-même. |
| **Bonnes pratiques** | Toujours vérifier la valeur de retour de `fork()` (`< 0` = échec) avant de brancher sur le cas parent/enfant. |
