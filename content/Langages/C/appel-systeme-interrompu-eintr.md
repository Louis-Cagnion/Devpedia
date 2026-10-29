---
order: 29
---

# Appel système interrompu par un signal (EINTR)

Un **appel système** est une demande faite au noyau (le cœur du système d'exploitation) pour une opération que le programme n'a pas le droit de faire lui-même : lire un fichier, attendre un processus enfant, endormir le programme (voir [les appels système et les descripteurs](/?c=langages&s=c&p=appels-systeme-et-descripteurs)). Certains de ces appels sont **bloquants** : ils ne rendent la main que lorsque ce qu'ils attendent est arrivé, ce qui peut durer des secondes, voire toujours. Que se passe-t-il si, pendant cette attente, un **signal** arrive (une notification envoyée à un processus par le système ou par un autre processus, voir [les signaux UNIX](/?c=langages&s=c&p=signaux-unix)) ? L'appel revient en annonçant un échec qui n'en est pas un : `EINTR`. Ce chapitre explique ce que cela veut dire, comment s'en protéger et pourquoi les fonctions de `<stdio.h>` ne règlent pas le problème à votre place.

Il suppose connus les signaux et leur [gestionnaire](/?c=langages&s=c&p=signaux-unix) (la fonction que le noyau appelle à l'arrivée du signal), [`signal()` et `sigaction()`](/?c=langages&s=c&p=signaux-unix#sigaction-un-handler-enrichi-avec-siginfo-t), [`errno`](/?c=langages&s=c&p=appels-systeme-et-descripteurs#signaler-une-erreur-errno) (la variable où l'appel dépose le code de sa panne) et le [descripteur de fichier](/?c=langages&s=c&p=appels-systeme-et-descripteurs#le-descripteur-de-fichier-une-simple-entree-dans-une-table) (un entier qui désigne une ressource ouverte : fichier, tube, terminal...). Toutes les observations ont été faites sous Linux avec la bibliothèque C du projet GNU (**glibc**, la bibliothèque standard du langage C fournie avec la plupart des distributions Linux).

## Le décor : un appel qui attend

Voici quelques appels qui peuvent attendre longtemps.

| Appel | Ce qu'il attend |
|---|---|
| `read` | Des octets à lire sur un [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), un tube (défini plus bas) ou une connexion réseau |
| `write` | De la place dans un tube ou une connexion dont le **tampon** (la zone mémoire d'attente) est plein |
| `accept` | Qu'un client (programme qui demande un service) se connecte à un serveur (programme qui l'offre, voir [les sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)) |
| `waitpid` | Qu'un processus enfant se termine (voir [la gestion des processus](/?c=langages&s=c&p=processus)) |
| `sem_wait` | Qu'un sémaphore (un compteur qui régule l'accès à une ressource) devienne positif (voir [les sémaphores](/?c=langages&s=c&p=semaphores)) |
| `nanosleep` | Qu'une durée s'écoule |
| `poll`, `select` | Qu'au moins un descripteur soit prêt, ou qu'un délai expire |

Un **tube** (*pipe*) est un canal à sens unique : ce qu'un processus écrit à un bout, un autre le lit à l'autre bout. C'est ce que fabrique le `|` du shell (voir [l'architecture d'un shell](/?c=langages&s=bash&p=architecture-dun-shell)). Si un gestionnaire est installé pour un signal et que ce signal arrive pendant l'attente, le noyau interrompt l'attente, exécute le gestionnaire, puis l'appel revient avec `-1` et `errno` égal à `EINTR` (de l'anglais *interrupted*, « interrompu »).

```text
Temps ----------------------------------------------------------------->

programme :  read() ........ attend ........ [gestionnaire] ... read() renvoie -1
                                   ^                              errno = EINTR
noyau     :                        |
                          le signal arrive (ici SIGALRM)
```

Rien n'a échoué : l'appel n'a simplement pas pu aller au bout. Les données n'ont pas été perdues, il suffit de recommencer. Mais tout dépend de ce que le programme a installé pour le signal :

| Situation du signal | Ce que devient l'appel bloqué |
|---|---|
| Comportement par défaut qui tue le processus (`SIGALRM`, `SIGTERM`...) | Le processus meurt, il n'y a plus d'appel à interrompre |
| Signal ignoré (`SIG_IGN`) | Rien ne se passe, l'appel continue d'attendre |
| Gestionnaire installé, sans `SA_RESTART` | L'appel revient avec `-1` et `EINTR` |
| Gestionnaire installé, avec `SA_RESTART` | Le noyau relance l'appel tout seul (pour la plupart des appels) |

Pour provoquer l'interruption sans rien taper, les programmes de ce chapitre utilisent `alarm(1)` : le noyau enverra le signal `SIGALRM` au processus dans 1 seconde. Ils se lancent avec `(sleep 3; echo bonjour) | ./programme` : le shell lance `sleep 3` (qui attend 3 secondes), puis `echo bonjour` écrit « bonjour » dans un tube dont `./programme` lit l'autre bout. Le programme attend donc pendant 3 secondes, et l'alarme sonne au bout d'une seule. Ils utilisent aussi quelques fonctions d'installation :

| Élément | Rôle |
|---|---|
| `struct sigaction sa` | Structure qui décrit ce qu'on veut pour un signal (gestionnaire, drapeaux...) |
| `memset(&sa, 0, sizeof sa)` | Met tous les octets de `sa` à zéro, pour ne pas hériter de valeurs au hasard |
| `sigemptyset(&sa.sa_mask)` | Prépare une liste vide de signaux à bloquer pendant le gestionnaire |
| `sigaction(SIGALRM, &sa, NULL)` | Installe cette description pour `SIGALRM` |
| `alarm(1)` | Demande au noyau d'envoyer `SIGALRM` dans 1 seconde ([`alarm`](https://man7.org/linux/man-pages/man2/alarm.2.html)) |
| `ssize_t` | Entier signé pour un nombre d'octets : il peut valoir `-1` (`size_t` est son pendant non signé ; `printf` les affiche avec `%zd` et `%zu`) |
| `strerror(errno)` | Traduit le code d'erreur `errno` en texte lisible |

## Le piège : prendre EINTR pour une vraie erreur

Un programme habitué à tester « `-1` donc erreur » se trompe ici (`stderr` est la sortie d'erreur du programme, le descripteur 2) :

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void sur_alarme(int sig)
{
    (void)sig;                          // on ne s'intéresse qu'au fait d'être appelé
}

int main(void)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    char             tampon[64];        // zone mémoire qui recevra les octets lus
    ssize_t          n;                 // octets lus, ou -1 si l'appel a échoué

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_alarme;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    sigaction(SIGALRM, &sa, NULL);      // installe le gestionnaire, sans SA_RESTART
    alarm(1);                           // SIGALRM arrivera dans 1 seconde
    n = read(STDIN_FILENO, tampon, sizeof tampon);   // attend sur l'entrée standard
    if (n == -1) {                      // -1 : l'appel n'a pas abouti
        fprintf(stderr, "read : %s\n", strerror(errno));   // traduit errno en texte
        return 1;                       // le programme abandonne à tort
    }
    printf("lu %zd octets\n", n);       // chemin normal : des octets sont arrivés
    return 0;
}
```

```text
read : Interrupted system call
```

Le programme se plaint et quitte alors que le tube allait recevoir « bonjour » deux secondes plus tard. La parade classique est une **boucle de relance** : tant que l'appel échoue à cause d'une interruption, on le rappelle.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void sur_alarme(int sig)
{
    (void)sig;                          // rien à faire : l'interruption suffit
}

int main(void)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    char             tampon[64];        // zone mémoire qui recevra les octets lus
    ssize_t          n;                 // octets lus, ou -1 si l'appel a échoué
    int              relances = 0;      // nombre de fois où l'on a dû relancer read

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_alarme;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    sigaction(SIGALRM, &sa, NULL);      // installe le gestionnaire, sans SA_RESTART
    alarm(1);                           // SIGALRM arrivera dans 1 seconde
    do {
        n = read(STDIN_FILENO, tampon, sizeof tampon);   // attend des données
        if (n == -1 && errno == EINTR)  // interrompu par le signal, pas une vraie erreur
            relances++;                 // on compte l'interruption
    } while (n == -1 && errno == EINTR);   // et on relance l'appel
    if (n == -1) {                      // ici, c'est une vraie erreur (descripteur fermé...)
        fprintf(stderr, "read : %s\n", strerror(errno));   // traduit errno en texte
        return 1;                       // abandon justifié
    }
    printf("lu %zd octets après %d relance(s)\n", n, relances);   // résultat final
    return 0;
}
```

```text
lu 8 octets après 1 relance(s)
```

Le `-1` seul ne dit rien : c'est `errno` qui départage les causes. Seul `EINTR` se relance.

| Valeur de `errno` après `-1` | Signification | Réaction |
|---|---|---|
| `EINTR` | Interrompu par un gestionnaire de signal | Relancer l'appel |
| `EBADF` | Le descripteur n'est pas ouvert | Bug du programme : corriger |
| `EIO` | Erreur matérielle d'entrée-sortie | Signaler et abandonner |

> **Piège :** relancer sur n'importe quel `-1`. Une vraie erreur (`EBADF`) ferait alors tourner la boucle sans fin, à pleine vitesse.

## `SA_RESTART` : demander au noyau de relancer

Un **drapeau** (*flag*) est une option représentée par un bit d'un entier, qu'on combine avec les autres par le OU binaire `|` (voir [les opérateurs binaires](/?c=langages&s=c&p=operateurs-binaires)). `sigaction()` accepte dans `sa_flags` le drapeau `SA_RESTART` (de l'anglais « redémarrer ») : il demande au noyau de relancer lui-même les appels interrompus par ce signal. Le gestionnaire s'exécute quand même, mais le programme ne voit plus d'`EINTR`.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t g_alarmes = 0;   // compteur modifié par le gestionnaire

static void sur_alarme(int sig)
{
    (void)sig;                          // le numéro du signal ne nous sert pas
    g_alarmes++;                        // seule action : compter les arrivées
}

int main(void)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    char             tampon[64];        // zone mémoire qui recevra les octets lus
    ssize_t          n;                 // octets lus, ou -1 si l'appel a échoué

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_alarme;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    sa.sa_flags = SA_RESTART;           // demande au noyau de relancer read tout seul
    sigaction(SIGALRM, &sa, NULL);      // installe le gestionnaire
    alarm(1);                           // SIGALRM arrivera dans 1 seconde
    n = read(STDIN_FILENO, tampon, sizeof tampon);   // une seule fois, sans boucle
    if (n == -1) {                      // plus d'EINTR ici
        fprintf(stderr, "read : %s\n", strerror(errno));   // traduit errno en texte
        return 1;
    }
    printf("lu %zd octets, gestionnaire appelé %d fois\n", n, (int)g_alarmes);
    return 0;
}
```

```text
lu 8 octets, gestionnaire appelé 1 fois
```

Le gestionnaire a bien tourné une fois (le compteur le prouve), et `read` a attendu « bonjour » sans que le programme n'ait eu de boucle à écrire. Le type `volatile sig_atomic_t` du compteur est expliqué dans [écrire un handler sûr](/?c=langages&s=c&p=signaux-unix#ecrire-un-handler-sur).

### `signal()` contre `sigaction()`

Les deux installent un gestionnaire, mais seul `sigaction()` dit explicitement ce qu'on veut (voir [`sigaction()`](/?c=langages&s=c&p=signaux-unix#sigaction-un-handler-enrichi-avec-siginfo-t)).

| | `signal()` | `sigaction()` |
|---|---|---|
| Relance des appels | Non spécifiée : dépend du système | Explicite : présence ou absence de `SA_RESTART` |
| Sous glibc (observé) | Relance automatique : `read` n'est pas interrompu | Selon le drapeau demandé |
| Portabilité du comportement | Faible : le même code peut se comporter autrement ailleurs | Bonne |
| À préférer | Jamais pour un gestionnaire qui compte | Toujours |

### Les limites de `SA_RESTART`

`SA_RESTART` ne couvre pas tous les appels. Le manuel [`signal(7)`](https://man7.org/linux/man-pages/man7/signal.7.html) liste ceux qui échouent toujours avec `EINTR`, même avec le drapeau, et ceux qui sont relancés. Le tableau croise cette liste avec ce qui a été observé ici par un programme d'essai pour chaque appel, avec un gestionnaire de `SIGALRM`.

| Appel | Sans `SA_RESTART` | Avec `SA_RESTART` | Remarque |
|---|---|---|---|
| `read` (tube, terminal) | `-1`, `EINTR` | Relancé | Cas le plus courant |
| `write` (tube plein) | `-1`, `EINTR` | Relancé | Voir l'écriture partielle plus bas |
| `waitpid` | `-1`, `EINTR` | Relancé | Attente d'un enfant |
| `sem_wait` | `-1`, `EINTR` | Relancé (observé) | Peut varier d'un système à l'autre |
| `nanosleep` | `-1`, `EINTR` | `-1`, `EINTR` | Jamais relancé |
| `sleep` | Rend le temps restant | Idem | Jamais relancé |
| `poll`, `select` | `-1`, `EINTR` | `-1`, `EINTR` | Jamais relancés |
| `close` | Voir plus bas | Voir plus bas | Ne se relance pas |

Conséquence : même avec `SA_RESTART`, il faut garder la boucle de relance pour `nanosleep`, `poll` et `select`. Pour une attente d'une durée fixe, `nanosleep` accepte un second argument qui reçoit le temps restant : on relance avec ce reste, pas avec la durée d'origine (pour les autres façons d'attendre, voir [la mesure du temps](/?c=langages&s=c&p=mesure-du-temps)).

Un autre effet à connaître : avec `SA_RESTART`, le programme n'est plus averti par `EINTR`. Un gestionnaire de `SIGINT` (Ctrl-C) qui lève un indicateur d'arrêt n'a aucun effet tant que le `read` bloqué est relancé en silence. Pour qu'un signal réveille vraiment le programme, ne pas mettre `SA_RESTART` et tester un **indicateur** (une variable qui vaut 0 tant que rien ne s'est passé, 1 ensuite) à chaque `EINTR` :

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t g_arret = 0;   // passe à 1 quand l'arrêt est demandé

static void sur_signal(int sig)
{
    (void)sig;                          // le numéro du signal ne nous sert pas
    g_arret = 1;                        // seule action : lever le drapeau
}

int main(void)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    char             tampon[64];        // zone mémoire qui recevra les octets lus
    ssize_t          n = -1;            // octets lus, ou -1

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_signal;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    sigaction(SIGALRM, &sa, NULL);      // pas de SA_RESTART : read sera interrompu
    alarm(1);                           // simule la demande d'arrêt (ici un SIGALRM)
    while (!g_arret) {                  // on relance tant que personne n'a demandé l'arrêt
        n = read(STDIN_FILENO, tampon, sizeof tampon);   // attend des données
        if (n == -1 && errno == EINTR)  // interrompu : on retourne tester le drapeau
            continue;
        break;                          // données, fin ou vraie erreur : on sort
    }
    if (g_arret)                        // l'interruption est devenue une demande d'arrêt
        printf("arrêt demandé, on quitte proprement\n");
    else
        printf("lu %zd octets\n", n);
    return 0;
}
```

```text
arrêt demandé, on quitte proprement
```

Ici `EINTR` est utile : c'est la seule façon de sortir d'un `read` qui n'a rien à lire.

## Les cas particuliers qui piègent

### Une lecture ou une écriture partielle ne renvoie pas `-1`

Si le signal arrive **après** qu'un appel a déjà transféré une partie des octets, il ne renvoie pas `-1` : il renvoie le nombre d'octets déjà transférés. C'est une **lecture partielle** (ou **écriture partielle**) : moins d'octets que demandé, sans que ce soit une erreur. Le programme suivant écrit 200 000 octets dans un tube que personne ne lit ; la capacité d'un tube sous Linux est de 65 536 octets par défaut :

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void sur_alarme(int sig)
{
    (void)sig;                          // l'interruption est le seul effet voulu
}

int main(void)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    static char      gros[200000];      // 200 000 octets : plus que la capacité d'un tube
    int              tube[2];           // tube[0] : lecture, tube[1] : écriture
    ssize_t          n;                 // octets écrits, ou -1

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_alarme;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    sigaction(SIGALRM, &sa, NULL);      // pas de SA_RESTART : write sera interrompu
    if (pipe(tube) == -1)               // crée un tube que personne ne lit
        return 1;
    memset(gros, 'x', sizeof gros);     // remplit la zone avec des 'x'
    alarm(1);                           // SIGALRM arrivera quand le tube sera plein
    n = write(tube[1], gros, sizeof gros);   // bloque dès que le tube est plein
    printf("write de %zu octets : renvoie %zd\n", sizeof gros, n);
    return 0;
}
```

```text
write de 200000 octets : renvoie 65536
```

| Ce qui s'est passé avant le signal | `write` / `read` renvoie | `errno` |
|---|---|---|
| Aucun octet transféré | `-1` | `EINTR` |
| Une partie des octets transférée | Le nombre déjà transféré (inférieur à la demande) | Sans signification : ne pas le lire |
| Tout transféré | La quantité demandée | Sans signification |

Le piège : après un `read` partiel, relancer avec le **même** tampon écraserait les premiers octets. Il faut avancer dans le tampon du nombre d'octets déjà reçus. C'est le travail de `lire_tout` plus bas.

### `close()` renvoie `EINTR` : ne pas relancer

[POSIX](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html) (le standard qui décrit l'interface des systèmes de type Unix) prévoit que `close()` interrompu renvoie `-1` avec `EINTR`, et que l'état du descripteur est alors **indéterminé** : il peut être fermé ou encore ouvert selon le système. Le manuel de Linux précise que le descripteur y est déjà libéré, et qu'un second `close()` sur ce numéro pourrait fermer un descripteur ouvert entre-temps par un autre [thread](/?c=langages&s=c&p=threads) (un fil d'exécution du même programme). Règle prudente : ne jamais relancer `close()`.

```c
if (close(fd) == -1) {                  // la fermeture a signalé un problème
    if (errno != EINTR)                 // EINTR : on ne rappelle surtout pas close
        fprintf(stderr, "close : %s\n", strerror(errno));   // autre cause : on la signale
}
```

### `EINTR` n'existe que si un gestionnaire est installé

Un signal ignoré ou laissé à son comportement par défaut ne produit jamais `EINTR` : le premier est jeté par le noyau, le second tue le processus (ou est ignoré, selon le signal).

Le programme lit un argument de la ligne de commande (voir [`argc` et `argv`](/?c=langages&s=c&p=argc-et-argv)) pour choisir entre les deux cas :

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv)
{
    char    tampon[64];                 // zone mémoire qui recevra les octets lus
    ssize_t n;                          // octets lus, ou -1 si l'appel a échoué

    if (argc > 1 && strcmp(argv[1], "ignorer") == 0)   // argument "ignorer"
        signal(SIGALRM, SIG_IGN);       // SIG_IGN : le noyau jette le signal
    alarm(1);                           // sans argument : comportement par défaut du signal
    n = read(STDIN_FILENO, tampon, sizeof tampon);   // attend des données
    if (n == -1)                        // aucun gestionnaire : pas d'EINTR
        printf("read : %s\n", strerror(errno));
    else
        printf("lu %zd octets\n", n);
    return 0;
}
```

| Lancement (avec le même tube lent que plus haut) | Sortie observée |
|---|---|
| `./ignore ignorer` | `lu 8 octets` : l'alarme est jetée, `read` attend la fin |
| `./ignore` | Aucune sortie : le processus meurt. Le statut de fin est 142 : le shell code « tué par un signal » en 128 plus le numéro du signal, ici 14 pour `SIGALRM` |

## `fread` et `fgets` : la bibliothèque standard fait-elle le travail ?

`fread` et `fgets` (voir [la lecture de fichiers](/?c=langages&s=c&p=lecture-de-fichiers)) appartiennent à `<stdio.h>`, la bibliothèque d'entrées-sorties standard du C. Elles lisent par un `FILE *` (un **flux**, un objet qui regroupe un descripteur et un tampon mémoire). `fread(tampon, 1, n, flux)` lit jusqu'à `n` octets ; en cas d'échec ou de fin, elle rend moins que demandé et on interroge `ferror(flux)` (1 si le flux est en erreur) et `feof(flux)` (1 si la fin des données est atteinte). Sous le capot, elles appellent `read`. On pourrait croire que cette couche masque l'interruption. Test avec un `fread` sur l'entrée standard, un gestionnaire de `SIGALRM` sans `SA_RESTART` et une alarme qui sonne pendant l'attente :

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void sur_alarme(int sig)
{
    (void)sig;                          // on ne s'intéresse qu'au fait d'être appelé
}

int main(int argc, char **argv)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    char             tampon[64];        // zone mémoire qui recevra les octets lus
    size_t           n;                 // nombre d'éléments lus par fread

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_alarme;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    if (argc > 1 && strcmp(argv[1], "restart") == 0)   // "restart" active SA_RESTART
        sa.sa_flags = SA_RESTART;       // le noyau relancera read tout seul
    sigaction(SIGALRM, &sa, NULL);      // installe le gestionnaire
    alarm(1);                           // SIGALRM arrivera dans 1 seconde
    errno = 0;                          // on part d'un errno propre pour bien l'observer
    n = fread(tampon, 1, sizeof tampon, stdin);   // demande 64 octets à l'entrée standard
    printf("fread=%zu ferror=%d feof=%d errno=%d (%s)\n",
           n,                           // octets réellement rendus
           ferror(stdin) != 0,          // 1 si le drapeau d'erreur du flux est levé
           feof(stdin) != 0,            // 1 si la fin du flux est atteinte
           errno,                       // 4 vaut EINTR sous Linux
           strerror(errno));            // le texte correspondant
    return 0;
}
```

```text
$ (sleep 3; echo bonjour) | ./stdio
fread=0 ferror=1 feof=0 errno=4 (Interrupted system call)

$ (printf abc; sleep 3; echo def) | ./stdio
fread=3 ferror=1 feof=0 errno=4 (Interrupted system call)

$ (sleep 3; echo bonjour) | ./stdio restart
fread=8 ferror=0 feof=1 errno=0 (Success)
```

Observation : `fread` **ne relance pas**. Elle s'arrête, renvoie ce qu'elle avait déjà (0 ou 3 octets), lève le drapeau d'erreur du flux et laisse `errno` à `EINTR` (valeur 4 sous Linux). Le même essai avec `fgets` renvoie `NULL` avec `ferror` à 1 et `errno` à 4. Avec `SA_RESTART`, tout fonctionne, mais parce que c'est le noyau qui relance le `read` sous-jacent, pas `fread`.

La norme du langage C ne dit rien de `EINTR`, et POSIX autorise ces fonctions à échouer avec `EINTR` ([`fread`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fread.html)). Le comportement observé ici n'est donc pas une garantie : un autre système pourrait en décider autrement. Pour un programme portable, il faut relancer soi-même. La fonction `clearerr(flux)` efface le drapeau d'erreur et le drapeau de fin du flux, ce qui permet de réessayer :

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// Comme fread, mais relance si l'appel système sous-jacent est interrompu.
size_t lire_flux(void *tampon, size_t taille, FILE *flux)
{
    char    *octets = tampon;           // vue octet par octet de la zone à remplir
    size_t   total = 0;                 // octets déjà reçus

    while (total < taille) {            // tant qu'il en manque
        total += fread(octets + total, 1, taille - total, flux);   // lit la suite
        if (total == taille || feof(flux))   // terminé, ou fin du flux
            break;
        if (ferror(flux) && errno == EINTR)   // interruption, pas une vraie panne
            clearerr(flux);             // efface le drapeau d'erreur puis on relance
        else
            break;                      // vraie erreur : on s'arrête
    }
    return total;
}

static void sur_alarme(int sig)
{
    (void)sig;                          // l'interruption est le seul effet voulu
}

int main(void)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    char             tampon[8];         // zone qui recevra les octets lus
    size_t           n;                 // octets rendus par lire_flux

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_alarme;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    sigaction(SIGALRM, &sa, NULL);      // pas de SA_RESTART : read sera interrompu
    alarm(1);                           // SIGALRM tombera pendant l'attente
    n = lire_flux(tampon, 7, stdin);    // veut 7 octets : "abc" arrive avant l'alarme
    printf("lu %zu octets : %.*s\n", n, (int)n, tampon);
    return 0;
}
```

```text
$ (printf abc; sleep 3; printf defg) | ./lire_flux
lu 7 octets : abcdefg
```

Deux détails comptent. D'abord `clearerr` : sans lui, le drapeau d'erreur resterait levé et tout appel suivant échouerait aussitôt. Ensuite, `errno` ne se consulte qu'après un échec constaté (`ferror`) : un appel réussi ne le remet pas à zéro, il peut donc encore valoir `EINTR` à cause d'une interruption passée.

## Que fait chaque couche ?

| Couche | Réaction à un signal capté | Ce que doit faire le programme |
|---|---|---|
| Appel système brut (`read`, `write`) | `-1` et `EINTR` si rien n'était transféré, sinon le nombre d'octets déjà transférés | Boucle de relance, et avancer dans le tampon |
| Fonction de `<stdio.h>` (`fread`, `fgets`) | Observé : s'arrête, drapeau d'erreur levé, `errno` à `EINTR` | `clearerr` puis relance, ou `SA_RESTART` |
| `SA_RESTART` | Le noyau relance les appels qui le permettent | Garder une boucle pour `nanosleep`, `poll`, `select` |
| Boucle de relance | Absorbe `EINTR` | Tester l'indicateur d'arrêt à chaque tour si le signal doit réveiller |

## Une fonction réutilisable : `lire_tout`

`lire_tout(fd, tampon, taille)` combine les deux protections : elle relance sur `EINTR` et gère la lecture partielle en avançant dans le tampon. Elle s'arrête à `taille` octets, ou plus tôt si l'autre bout ferme (`read` renvoie alors `0`). Le `main` simule un écrivain lent avec quelques fonctions déjà vues au chapitre sur [les processus](/?c=langages&s=c&p=processus) :

| Fonction | Rôle ici |
|---|---|
| `pipe(tube)` | Crée un tube : `tube[0]` est le bout de lecture, `tube[1]` le bout d'écriture |
| `fork()` | Duplique le processus ; l'enfant reçoit `0`, le parent reçoit l'identifiant de l'enfant |
| `sleep(2)` | Endort le processus 2 secondes |
| `_exit(0)` | Termine le processus aussitôt, sans vider les tampons de `printf` |
| `close(tube[1])` | Ferme un bout du tube : sans cela, le lecteur ne verrait jamais la fin des données |

Le scénario : trois octets tout de suite, une pause de 2 secondes pendant laquelle l'alarme sonne, puis cinq octets.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <unistd.h>

// Lit exactement taille octets, sauf si la fin des données arrive avant.
// Renvoie le nombre d'octets lus (0 si rien), ou -1 en cas de vraie erreur.
ssize_t lire_tout(int fd, void *tampon, size_t taille)
{
    char    *octets = tampon;           // vue octet par octet de la zone à remplir
    size_t   total = 0;                 // octets déjà reçus
    ssize_t  n;                         // résultat du dernier read

    while (total < taille) {            // tant qu'il en manque
        n = read(fd, octets + total, taille - total);   // lit la suite, pas depuis le début
        if (n == -1 && errno == EINTR)  // interruption par un signal
            continue;                   // on relance sans rien perdre
        if (n == -1)                    // vraie erreur
            return -1;                  // errno décrit la cause, on la laisse à l'appelant
        if (n == 0)                     // fin des données : l'autre bout a fermé
            break;                      // on rend ce qu'on a
        total += (size_t)n;             // lecture complète ou partielle : on avance
    }
    return (ssize_t)total;
}

static void sur_alarme(int sig)
{
    (void)sig;                          // l'interruption est le seul effet voulu
}

int main(void)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    int              tube[2];           // tube[0] : lecture, tube[1] : écriture
    char             tampon[9];         // 8 octets attendus + 1 pour le '\0'
    ssize_t          n;                 // octets rendus par lire_tout

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_alarme;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    sigaction(SIGALRM, &sa, NULL);      // pas de SA_RESTART : read sera interrompu
    if (pipe(tube) == -1)               // crée le tube
        return 1;
    if (fork() == 0) {                  // le processus enfant joue l'écrivain lent
        if (write(tube[1], "abc", 3) == -1)   // envoie 3 octets tout de suite
            _exit(1);
        sleep(2);                       // puis se tait pendant 2 secondes
        if (write(tube[1], "defgh", 5) == -1)   // envoie les 5 derniers octets
            _exit(1);
        _exit(0);                       // l'enfant a fini
    }
    close(tube[1]);                     // le parent ne garde que le bout de lecture
    alarm(1);                           // SIGALRM tombera pendant que l'enfant se tait
    n = lire_tout(tube[0], tampon, 8);  // veut 8 octets : 3, puis une interruption, puis 5
    if (n == -1)
        return 1;
    tampon[n] = '\0';                   // termine la chaîne pour pouvoir l'afficher
    printf("lu %zd octets : %s\n", n, tampon);
    return 0;
}
```

```text
lu 8 octets : abcdefgh
```

La première lecture rend 3 octets (partielle), la deuxième est interrompue (`EINTR`, relancée sans perte), la troisième rend les 5 derniers. La version symétrique pour l'écriture :

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

// Écrit exactement taille octets. Renvoie 0 si tout est parti, -1 en cas de vraie erreur.
int ecrire_tout(int fd, const void *tampon, size_t taille)
{
    const char *octets = tampon;        // vue octet par octet de la zone à envoyer
    size_t      total = 0;              // octets déjà partis
    ssize_t     n;                      // résultat du dernier write

    while (total < taille) {            // tant qu'il en reste
        n = write(fd, octets + total, taille - total);   // envoie la suite
        if (n == -1 && errno == EINTR)  // interruption par un signal
            continue;                   // on relance sans rien perdre
        if (n == -1)                    // vraie erreur
            return -1;                  // errno décrit la cause
        total += (size_t)n;             // écriture complète ou partielle : on avance
    }
    return 0;
}

static void sur_alarme(int sig)
{
    (void)sig;                          // l'interruption est le seul effet voulu
}

int main(void)
{
    struct sigaction sa;                // description du comportement voulu pour un signal
    static char      gros[200000];      // plus que la capacité d'un tube
    static char      recu[4096];        // petit tampon de lecture pour l'enfant
    int              tube[2];           // tube[0] : lecture, tube[1] : écriture
    long             compte = 0;        // octets comptés par l'enfant
    ssize_t          n;                 // octets lus par l'enfant

    memset(&sa, 0, sizeof sa);          // met tous les champs de sa à zéro
    sa.sa_handler = sur_alarme;         // fonction à appeler à l'arrivée du signal
    sigemptyset(&sa.sa_mask);           // ne bloque aucun autre signal
    sigaction(SIGALRM, &sa, NULL);      // pas de SA_RESTART : write sera interrompu
    if (pipe(tube) == -1)
        return 1;
    if (fork() == 0) {                  // l'enfant joue le lecteur lent
        close(tube[1]);                 // il ne garde que le bout de lecture
        sleep(2);                       // il ne lit rien pendant 2 secondes
        while ((n = read(tube[0], recu, sizeof recu)) > 0)   // puis vide le tube
            compte += n;                // en comptant les octets reçus
        printf("l'enfant a reçu %ld octets\n", compte);
        exit(0);                        // exit vide les tampons de printf
    }
    close(tube[0]);                     // le parent ne garde que le bout d'écriture
    memset(gros, 'x', sizeof gros);     // remplit la zone avec des 'x'
    alarm(1);                           // SIGALRM tombera pendant que le tube est plein
    if (ecrire_tout(tube[1], gros, sizeof gros) == -1)
        return 1;
    close(tube[1]);                     // l'enfant verra la fin des données
    wait(NULL);                         // attend la fin de l'enfant
    return 0;
}
```

```text
l'enfant a reçu 200000 octets
```

Les 200 000 octets sont tous arrivés, malgré une écriture partielle de 65 536 octets interrompue par l'alarme. Ici l'enfant termine par `exit(0)` et non `_exit(0)` : `exit` vide les tampons de `printf`, sans quoi la phrase ne serait jamais affichée quand la sortie est un tube.

## Les pièges

| Piège | Pourquoi | Parade |
|---|---|---|
| Traiter tout `-1` comme une panne | `EINTR` n'est pas une panne | Tester `errno == EINTR` |
| Relancer sur tout `-1` | Une vraie erreur ferait boucler sans fin | Ne relancer que sur `EINTR` |
| Croire que `fread` ou `fgets` relancent | Observé : elles s'arrêtent avec `ferror` | `clearerr` puis relance, ou `SA_RESTART` |
| Oublier `clearerr` avant de relancer | Le drapeau d'erreur du flux reste levé | L'appeler dès qu'on a décidé de relancer |
| Relancer un `read` partiel depuis le début du tampon | Les octets déjà reçus sont écrasés | Avancer de `total` octets |
| Relancer `close()` | État du descripteur indéterminé, risque de fermer le descripteur d'un autre thread | Ne jamais relancer |
| Compter sur `SA_RESTART` pour tout | `nanosleep`, `poll`, `select` échouent toujours | Garder la boucle de relance |
| Relancer aveuglément quand un signal doit arrêter le programme | Le programme devient impossible à arrêter proprement | Tester l'indicateur d'arrêt à chaque `EINTR` |
| Utiliser `signal()` | Comportement de relance variable selon le système | Utiliser `sigaction()` |
| Lire `errno` sans échec constaté | Un appel réussi ne le remet pas à zéro | Le lire seulement juste après un échec |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Écrire une fois `lire_tout` et `ecrire_tout`, les utiliser partout | Une seule boucle à vérifier, au lieu d'une par appel |
| Installer ses gestionnaires avec `sigaction()` et un drapeau choisi | Le comportement est identique sur tous les systèmes |
| Choisir : `SA_RESTART` pour un signal purement informatif, aucun drapeau si le signal doit réveiller le programme | Le programme garde la main sur ce que l'interruption provoque |
| Tester l'indicateur d'arrêt (`volatile sig_atomic_t`) à chaque `EINTR` | Le programme reste arrêtable |
| Pour `nanosleep`, relancer avec le temps restant | La durée totale d'attente est respectée |
| Ne jamais relancer `close()` | Aucune garantie sur l'état du descripteur |
| Vérifier le code de retour de chaque appel système et de chaque fonction de `<stdio.h>` | Une erreur silencieuse se paie plus tard |
| Tester le comportement sur sa propre machine (alarme de 1 seconde, tube lent) | Les documents disent « peut », l'expérience dit « fait » |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un appel système bloquant interrompu par un signal dont le gestionnaire est installé revient avec `-1` et `errno` égal à `EINTR` : rien n'a échoué, il suffit de relancer (`do { n = read(...); } while (n == -1 && errno == EINTR);`). `SA_RESTART` demande au noyau de relancer certains appels, mais pas `nanosleep`, `poll` ni `select`. Une lecture ou une écriture déjà commencée renvoie le nombre d'octets transférés, pas `-1`. `close()` ne se relance pas. `EINTR` n'existe que si un gestionnaire est installé. Observé avec glibc : `fread` et `fgets` ne relancent pas, elles lèvent `ferror` et laissent `errno` à `EINTR` ; la norme C n'en dit rien et POSIX autorise cet échec. |
| **Pièges à éviter** | Quitter sur `EINTR` ; relancer sur tout `-1` ; compter sur `fread` pour relancer ; oublier `clearerr` ; relancer un `read` partiel depuis le début du tampon ; relancer `close()` ; croire que `SA_RESTART` couvre tout ; rendre le programme inarrêtable en relançant aveuglément. |
| **Bonnes pratiques** | `sigaction()` avec un drapeau explicite ; fonctions `lire_tout` et `ecrire_tout` qui relancent et avancent dans le tampon ; `clearerr` puis relance pour `<stdio.h>` ; indicateur d'arrêt testé à chaque `EINTR` ; jamais de relance de `close()` ; documentation : [`read`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/read.html), [`close`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html), [`sigaction`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/sigaction.html), [`nanosleep`](https://man7.org/linux/man-pages/man2/nanosleep.2.html). |
