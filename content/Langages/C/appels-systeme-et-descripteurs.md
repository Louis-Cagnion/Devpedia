---
order: 20
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
// renvoie par ex. 3 : le prochain emplacement libre de CE processus
int fd = open("fichier.txt", O_RDONLY);
read(fd, tampon, taille);
close(fd);
```

> **Note :** ces trois numéros (`0`/`1`/`2`) sont exactement les "flux" (*stdin*/*stdout*/*stderr*) évoqués au chapitre sur les redirections [Bash](/?c=shells&s=bash&p=bash) : une redirection comme `2>` ne fait rien d'autre, sous le capot, que manipuler ce descripteur numéro `2` du processus concerné.

## Les drapeaux d'ouverture de `open()`

```c
open(chemin, O_RDONLY);                            // lecture seule
open(chemin, O_WRONLY);                            // écriture seule
open(chemin, O_RDWR);                              // lecture ET écriture

open(chemin, O_WRONLY | O_CREAT, 0644);            // crée le fichier s'il n'existe pas déjà
open(chemin, O_WRONLY | O_CREAT | O_TRUNC, 0644);  // + vide le fichier s'il existait déjà
open(chemin, O_WRONLY | O_CREAT | O_APPEND, 0644); // + écrit toujours à la FIN, sans écraser
```

| Drapeau | Effet |
|---|---|
| `O_RDONLY`/`O_WRONLY`/`O_RDWR` | Mode d'accès (un seul des trois, mutuellement exclusifs) |
| `O_CREAT` | Crée le fichier s'il n'existe pas déjà (sinon `open()` échoue sur un fichier absent) |
| `O_TRUNC` | Vide le fichier existant avant d'écrire (sinon l'ancien contenu resterait après la position d'écriture) |
| `O_APPEND` | Positionne toujours l'écriture à la fin du fichier, jamais à l'endroit atteint par un `write()` précédent |

Ces drapeaux se combinent avec `|` (OU binaire, voir [Les opérateurs binaires](/?c=langages-de-programmation&s=c&p=operateurs-binaires)) : chacun occupe un bit distinct d'un même entier, donc `O_CREAT` et `O_TRUNC` peuvent être demandés ensemble sans s'exclure l'un l'autre.

> **Note :** le dernier argument (`0644` ci-dessus) fixe les **permissions** du fichier, mais seulement si `O_CREAT` le crée effectivement (un fichier déjà existant garde ses permissions actuelles, cet argument est alors ignoré) : voir [Permissions et fichiers](/?c=shells&s=bash&p=permissions-et-fichiers) pour la signification de ce mode octal.

## `dup2()` : faire pointer un descripteur vers une autre ressource

`dup2(source, cible)` fait pointer le descripteur numéro `cible` vers la même ressource ouverte que `source`, en fermant au passage ce vers quoi `cible` pointait auparavant :

```c
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
// désormais, écrire sur "stdout" (1) écrit en réalité dans "sortie.txt"
dup2(fd, STDOUT_FILENO);
// l'original peut être fermé : la cible (1) reste valide, pointant vers la même ressource
close(fd);
```

C'est exactement ce mécanisme que le chapitre sur l'architecture d'un shell utilise pour implémenter aussi bien les redirections (`>`, `<`) que les pipes (`|`) : dans les deux cas, on fait pointer un descripteur standard (`0`, `1`, `2`) vers une ressource différente juste avant d'exécuter le programme cible.

## Pourquoi `fork()` duplique aussi la table des descripteurs

Quand [`fork()`](/?c=langages-de-programmation&s=c&p=processus) crée un processus enfant, celui-ci reçoit une **copie** de la table des descripteurs de son parent : les mêmes numéros, pointant vers les mêmes ressources ouvertes. C'est précisément ce qui permet à un shell de faire un `dup2()` sur un descripteur de pipe **dans l'enfant**, juste avant l'appel à `execve()` : le nouveau programme hérite de ce descripteur déjà repointé, sans rien savoir du mécanisme qui l'a mis en place.

## Fichiers spéciaux : quand `open()` ne tombe pas sur un fichier ordinaire

Sous Unix (Linux, macOS), `open()` accepte tout ce qui a un chemin, pas seulement les fichiers de données stockés sur le disque (les fichiers **ordinaires**). Le type de ce qu'on a réellement ouvert se lit avec `fstat()`, qui remplit une structure `struct stat` décrivant le descripteur (type, taille, permissions) :

| Type | Test sur `info.st_mode` | Exemple | Comportement de `read()` |
|---|---|---|---|
| Fichier ordinaire | `S_ISREG` | `notes.txt` | Lit le contenu, puis `0` à la fin |
| Dossier | `S_ISDIR` | `/tmp` | Échoue (`EISDIR`) |
| Périphérique « caractère » | `S_ISCHR` | `/dev/zero` : fournit des octets nuls **sans fin** | Ne renvoie jamais `0` : la lecture ne se termine pas |
| Tube nommé (FIFO) | `S_ISFIFO` | `canal` créé par `mkfifo` | Attend qu'un autre processus écrive |

### Le tube nommé (FIFO)

Un [pipe](/?c=shells&s=bash&p=architecture-dun-shell) anonyme (le `|` du shell, ou `pipe()` ci-dessus) n'a pas de nom : il n'existe que pour les processus qui l'ont hérité par `fork()`. Un **tube nommé** (*named pipe*, ou **FIFO**, de *First In, First Out*, « premier entré, premier sorti » : l'ordre d'une [file](/?c=fondamentaux&s=algorithmes&p=pile-et-file)) est le même mécanisme avec un nom dans l'arborescence, donc utilisable par deux programmes qui ne sont pas parents. Les octets écrits d'un côté ressortent dans le même ordre de l'autre, sans jamais être stockés sur le disque.

```bash
mkfifo canal              # crée le tube nommé "canal" (la fonction C du même nom fait pareil)
ls -l canal               # le premier caractère est "p" (pipe) : prw-r--r-- ...
echo "bonjour" > canal &  # écrivain lancé en arrière-plan (&) : il attend qu'un lecteur arrive
cat canal                 # lecteur : affiche "bonjour" ; les deux côtés se débloquent
```

> **Note :** un FIFO ne se crée pas sur n'importe quel disque. Sous WSL (Linux dans Windows), le dossier `/mnt/c` échoue ; utiliser un dossier du système Linux, comme `/tmp`.

### Le piège : l'ouverture bloque

Par défaut, `open()` sur un FIFO est **bloquant** : le programme est mis en pause par le noyau jusqu'à ce qu'un événement se produise (voir [le blocage et l'E/S non bloquante](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)). Ouvrir en lecture attend qu'un écrivain ouvre l'autre bout, et inversement. Un programme qui croit recevoir un fichier ordinaire reste donc figé sans aucun message si on lui passe un FIFO. Même effet avec `/dev/zero` : une lecture « jusqu'à la fin du fichier » ne s'arrête jamais et remplit la mémoire.

| Ce qu'on passe au programme | `open()` simple | Résultat |
|---|---|---|
| `notes.txt` | Rend la main aussitôt | Lecture normale |
| `canal` (FIFO sans écrivain) | **Bloque pour toujours** | Programme figé |
| `/dev/zero` | Rend la main | La lecture ne finit jamais, mémoire saturée |
| `/tmp` (dossier) | Rend la main | `read()` échoue plus tard, loin de la vraie cause |

### La parade : ouvrir sans bloquer, vérifier le type, puis passer à `FILE *`

L'option `O_NONBLOCK` demande à `open()` de rendre la main tout de suite au lieu d'attendre. On vérifie ensuite le type avec `fstat()`, et `fdopen()` convertit le descripteur validé en `FILE *`, l'objet des fonctions de [lecture de fichiers](/?c=langages-de-programmation&s=c&p=lecture-de-fichiers) (`fgets`, `fread`...) :

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

FILE *open_regular_file(const char *path)
{
    struct stat info;                                  // reçoit le type, la taille, les droits
    int         fd;
    FILE       *file;

    fd = open(path, O_RDONLY | O_NONBLOCK);            // ne bloque jamais, même sur un FIFO
    if (fd == -1) {
        fprintf(stderr, "%s : %s\n", path, strerror(errno));   // cause réelle
        return (NULL);
    }
    if (fstat(fd, &info) == -1) {                      // interroge le descripteur déjà ouvert
        fprintf(stderr, "%s : %s\n", path, strerror(errno));
        close(fd);
        return (NULL);
    }
    if (!S_ISREG(info.st_mode)) {                      // FIFO, /dev/zero, dossier : refusé
        fprintf(stderr, "%s : pas un fichier ordinaire\n", path);
        close(fd);                                   // libérer le descripteur sur chaque échec
        return (NULL);
    }
    file = fdopen(fd, "r");                            // le FILE * devient propriétaire de fd
    if (file == NULL) {
        fprintf(stderr, "%s : %s\n", path, strerror(errno));
        close(fd);
    }
    return (file);                                     // à fermer avec fclose(), pas close()
}
```

Résultat vérifié avec un petit `main` qui appelle cette fonction sur chaque argument de la ligne de commande (un fichier ordinaire, un FIFO, `/dev/zero`, un dossier et un chemin absent) :

```text
reg.txt : ouvert
canal : pas un fichier ordinaire
/dev/zero : pas un fichier ordinaire
. : pas un fichier ordinaire
absent : No such file or directory
```

Deux détails comptent. D'abord, on appelle `fstat()` sur le **descripteur** et non `stat()` sur le chemin : entre les deux appels, quelqu'un pourrait remplacer le fichier par un FIFO, alors que le descripteur désigne toujours ce qu'on a vraiment ouvert. Ensuite, chaque cause d'échec a son propre message (fichier absent, mauvais type, échec de `fdopen()`), pour que l'utilisateur sache quoi corriger.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un appel système demande au noyau d'agir à la place du programme (fichiers, processus, réseau) : un changement contrôlé d'espace utilisateur vers l'espace noyau. Un descripteur de fichier est un simple entier, indice d'une table par processus. Un chemin n'est pas toujours un fichier ordinaire : FIFO, périphérique et dossier s'ouvrent aussi. |
| **Outils utilisables** | `open`/`close`/`read`/`write`, drapeaux `O_CREAT`/`O_TRUNC`/`O_APPEND`/`O_NONBLOCK` de `open()`, `dup2`, `errno`/`strerror` pour diagnostiquer un échec, `mkfifo`, `fstat` + `S_ISREG`, `fdopen`. |
| **Pièges à éviter** | Confondre une fonction de bibliothèque (`printf`) avec un appel système réel (`write`) : la première encapsule le second. Ouvrir sans vérifier un chemin donné par l'utilisateur : un FIFO fige le programme, `/dev/zero` sature la mémoire. |
| **Bonnes pratiques** | Toujours vérifier la valeur de retour d'un appel système (`-1` ou `NULL`) et consulter `errno`/`strerror()` pour diagnostiquer un échec. Ouvrir avec `O_NONBLOCK`, vérifier avec `fstat()` + `S_ISREG()`, puis `fdopen()`. |
