---
order: 16
---

# Les appels système et les descripteurs de fichiers

Un programme ne peut pas lire un fichier, créer un processus ou envoyer des données sur le réseau en manipulant directement le matériel : cela pourrait être catastrophique pour la stabilité et la sécurité du système si n'importe quel programme y avait un accès libre. À la place, il doit passer par une porte étroite et contrôlée : l'**appel système** (*syscall*). Ce chapitre explique ce mécanisme et le **descripteur de fichier**, la "poignée" que le noyau remet en échange, tous deux utilisés en permanence dès qu'on touche à des fichiers, des processus ou des pipes (voir [La gestion des processus](/?c=langages-de-programmation&s=c&p=processus), [Les threads](/?c=langages-de-programmation&s=c&p=threads), et [Comment fonctionne un shell](/?c=shells&s=bash&p=architecture-dun-shell)).

## Espace utilisateur vs espace noyau

```text
Programme (espace utilisateur)
      |
      | appel système : open(), read(), write(), fork(), pipe()...
      v
Noyau du système d'exploitation (espace noyau)
      |
      v
Matériel (disque, réseau, mémoire physique...)
```

Un appel de fonction C classique (`addition(2, 3)`) s'exécute entièrement dans l'**espace utilisateur**, sans jamais quitter le programme. Un appel système est différent : il demande explicitement au **noyau** d'agir à la place du programme, pour une opération que celui-ci n'a pas le droit de faire lui-même. Cette demande implique un changement contrôlé de mode d'exécution (*user mode* → *kernel mode*), vérifié par le processeur : c'est ce contrôle qui empêche un programme malveillant ou buggé d'accéder directement à la mémoire ou au disque d'un autre programme.

> **Note :** une fonction comme `printf()` n'est **pas** elle-même un appel système : c'est une fonction de bibliothèque, qui met en forme la chaîne de caractères en espace utilisateur, puis appelle en interne le véritable appel système (`write()`) pour l'envoyer réellement à la sortie standard.

## Quelques appels système courants

| Appel système | Rôle |
|---|---|
| `open()` / `close()` | Ouvrir / fermer un fichier |
| `read()` / `write()` | Lire / écrire des octets sur un descripteur |
| `fork()` / `execve()` / `wait()` | Créer un processus / remplacer son programme / attendre sa fin (voir [La gestion des processus](/?c=langages-de-programmation&s=c&p=processus)) |
| `pipe()` | Créer un tube de communication entre deux processus (voir [Comment fonctionne un shell](/?c=shells&s=bash&p=architecture-dun-shell)) |
| `dup2()` | Faire pointer un descripteur vers une autre ressource déjà ouverte |
| `mmap()` / `brk()` | Demander de la mémoire au système (utilisés en interne par `malloc()`, voir [La gestion de la mémoire](/?c=langages-de-programmation&s=c&p=memoire)) |

## Signaler une erreur : `errno`

La plupart des appels système signalent un échec en renvoyant `-1` (ou `NULL` pour ceux qui renvoient un pointeur), et en positionnant la variable globale `errno` avec un code décrivant la cause précise : le même principe que les fonctions C historiques évoquées au chapitre sur les fonctions (`@` en [PHP](/?c=langages-de-programmation&s=php&p=php) fait face au même genre de convention d'erreur "à la C") :

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("fichier_inexistant.txt", O_RDONLY);

if (fd == -1) {
    printf("Erreur : %s\n", strerror(errno)); // traduit le code errno en message lisible
}
```

## Le descripteur de fichier : une simple entrée dans une table

Un **descripteur de fichier** (*file descriptor*) n'est ni un pointeur, ni un chemin : c'est un simple entier, l'indice d'une table maintenue par le noyau **pour chaque processus**, associant cet entier à une ressource réellement ouverte (fichier, pipe, connexion réseau, terminal...).

Chaque processus démarre avec trois descripteurs déjà ouverts :

| Descripteur | Constante C | Rôle habituel |
|---|---|---|
| `0` | `STDIN_FILENO` | Entrée standard |
| `1` | `STDOUT_FILENO` | Sortie standard |
| `2` | `STDERR_FILENO` | Sortie d'erreur |

```c
int fd = open("fichier.txt", O_RDONLY); // renvoie par ex. 3 : le prochain emplacement libre de CE processus
read(fd, tampon, taille);
close(fd);
```

> **Note :** ces trois numéros (`0`/`1`/`2`) sont exactement les "flux" (*stdin*/*stdout*/*stderr*) évoqués au chapitre sur les redirections [Bash](/?c=shells&s=bash&p=bash) : une redirection comme `2>` ne fait rien d'autre, sous le capot, que manipuler ce descripteur numéro `2` du processus concerné.

## `dup2()` : faire pointer un descripteur vers une autre ressource

`dup2(source, cible)` fait pointer le descripteur numéro `cible` vers la même ressource ouverte que `source`, en fermant au passage ce vers quoi `cible` pointait auparavant :

```c
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO);  // désormais, écrire sur "stdout" (1) écrit en réalité dans "sortie.txt"
close(fd);                // l'original peut être fermé : la cible (1) reste valide, pointant vers la même ressource
```

C'est exactement ce mécanisme que le chapitre sur l'architecture d'un shell utilise pour implémenter aussi bien les redirections (`>`, `<`) que les pipes (`|`) : dans les deux cas, on fait pointer un descripteur standard (`0`, `1`, `2`) vers une ressource différente juste avant d'exécuter le programme cible.

## Pourquoi `fork()` duplique aussi la table des descripteurs

Quand [`fork()`](/?c=langages-de-programmation&s=c&p=processus) crée un processus enfant, celui-ci reçoit une **copie** de la table des descripteurs de son parent : les mêmes numéros, pointant vers les mêmes ressources ouvertes. C'est précisément ce qui permet à un shell de faire un `dup2()` sur un descripteur de pipe **dans l'enfant**, juste avant l'appel à `execve()` : le nouveau programme hérite de ce descripteur déjà repointé, sans rien savoir du mécanisme qui l'a mis en place.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un appel système demande au noyau d'agir à la place du programme (fichiers, processus, réseau) : un changement contrôlé d'espace utilisateur vers l'espace noyau. Un descripteur de fichier est un simple entier, indice d'une table par processus. |
| **Outils utilisables** | `open`/`close`/`read`/`write`, `dup2`, `errno`/`strerror` pour diagnostiquer un échec. |
| **Pièges à éviter** | Confondre une fonction de bibliothèque (`printf`) avec un appel système réel (`write`) : la première encapsule le second. |
| **Bonnes pratiques** | Toujours vérifier la valeur de retour d'un appel système (`-1` ou `NULL`) et consulter `errno`/`strerror()` pour diagnostiquer un échec. |
