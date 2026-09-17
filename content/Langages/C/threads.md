---
order: 21
---

# Les threads (pthread)

Un **thread** (fil d'exécution) est, comme un processus, une suite d'instructions exécutée de façon indépendante, mais contrairement à [`fork()`](/?c=langages-de-programmation&s=c&p=processus), plusieurs threads d'un même programme **partagent la même mémoire**. C'est plus léger à créer qu'un processus, mais ça introduit un risque nouveau : deux threads peuvent modifier la même donnée en même temps.

## Créer et attendre un thread

La bibliothèque POSIX threads (`pthread`) fournit les fonctions de base ; la compilation nécessite l'option `-pthread` ([`gcc`](https://gcc.gnu.org) `-pthread main.c -o programme`). La norme **POSIX** est présentée dans le chapitre [Écrire un script](/?c=shells&s=bash&p=scripts-et-shebang) de [Bash](/?c=shells&s=bash&p=bash).

```c
#include <pthread.h>
#include <stdio.h>

void *tache(void *argument)
{
    int *nombre = (int *)argument;
    printf("Thread : je reçois %d\n", *nombre);
    return NULL;
}

int main(void)
{
    pthread_t thread;
    int valeur = 42;

    pthread_create(&thread, NULL, tache, &valeur);  // lance le thread, exécute "tache" en parallèle
    pthread_join(thread, NULL);                     // attend que ce thread se termine

    return 0;
}
```

- `pthread_create()` prend : un pointeur vers l'identifiant de thread à remplir, des attributs (`NULL` = par défaut), la fonction à exécuter, et l'argument à lui passer (un seul pointeur `void *`, à caster vers le vrai type à l'intérieur de la fonction).
- `pthread_join()` bloque l'exécution jusqu'à ce que le thread ciblé se termine : équivalent de `wait()` pour un processus.

## Mémoire partagée : un avantage et un danger

Contrairement à deux processus issus d'un `fork()` (mémoires séparées), deux threads du même programme voient et modifient les **mêmes variables globales** :

```c
#include <pthread.h>

int compteur = 0; // partagé par tous les threads

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        compteur++; // DANGER : plusieurs threads modifient la même variable en même temps
    }
    return NULL;
}
```

Si deux threads exécutent `incrementer()` en parallèle, le résultat final de `compteur` est **imprévisible** : `compteur++` n'est pas une seule opération atomique au niveau du processeur (elle se décompose en lire, ajouter, réécrire), et deux threads peuvent lire la même valeur avant que l'un des deux n'ait eu le temps de la réécrire : une des deux incrémentations est alors silencieusement perdue. Ce phénomène s'appelle une **race condition** (situation de compétition).

## Protéger une donnée partagée avec un mutex

Un **mutex** (*mutual exclusion*) garantit qu'une seule section de code à la fois peut manipuler une donnée partagée : le premier thread à l'atteindre le **verrouille**, les autres attendent qu'il le **déverrouille** :

```c
#include <pthread.h>

int compteur = 0;
pthread_mutex_t verrou = PTHREAD_MUTEX_INITIALIZER;

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&verrou);
        compteur++;                    // une seule thread à la fois peut exécuter cette ligne
        pthread_mutex_unlock(&verrou);
    }
    return NULL;
}
```

> **Note :** un mutex verrouillé et jamais déverrouillé (oubli de `pthread_mutex_unlock()`, ou `return`/exception avant d'y arriver) bloque **définitivement** tous les autres threads qui attendent ce verrou : un bug classique appelé **deadlock** quand deux threads s'attendent mutuellement, chacun retenant un verrou dont l'autre a besoin.

## Éviter un deadlock par ordre total sur les verrous

Le **problème du dîner des philosophes** (posé par Dijkstra) illustre bien ce risque : N philosophes autour d'une table se partagent N fourchettes (une entre chaque paire de voisins) et doivent en tenir deux (gauche et droite) pour manger. Si tous prennent leur fourchette gauche en même temps, chacun attend indéfiniment la fourchette droite tenue par son voisin : un deadlock généralisé. C'est un cas particulier d'un problème plus général : deux threads ont chacun besoin de **deux** mutex pour continuer, mais les verrouillent dans un ordre différent. Le thread A verrouille `mutex1` puis attend `mutex2` ; au même moment, le thread B verrouille `mutex2` puis attend `mutex1` : chacun attend indéfiniment un verrou que l'autre retient.

```text
Thread A :  lock(mutex1) -> attend mutex2 (tenu par B)
Thread B :  lock(mutex2) -> attend mutex1 (tenu par A)
-> interblocage : ni A ni B ne peut jamais avancer
```

La solution la plus simple : imposer un **ordre total** arbitraire mais identique pour tous les threads sur l'ensemble des verrous à acquérir (par exemple, comparer l'adresse mémoire des deux mutex et toujours verrouiller celui de plus petite adresse en premier) :

```c
if (mutex_a < mutex_b) {
    pthread_mutex_lock(mutex_a);
    pthread_mutex_lock(mutex_b);
} else {
    pthread_mutex_lock(mutex_b);
    pthread_mutex_lock(mutex_a);
}
```

Peu importe quel thread arrive en premier ni dans quel ordre logique les deux verrous lui sont utiles : tous les threads du programme respectent la même règle (ici, adresse la plus petite d'abord), donc aucun cycle d'attente circulaire ne peut jamais se former.

> **Bonne pratique :** dès qu'une fonction doit verrouiller plusieurs mutex à la fois, définir une règle d'ordre unique et s'y tenir partout dans le programme, plutôt que de verrouiller dans l'ordre où les verrous sont mentionnés localement dans le code.

## Threads vs processus

| | Processus (`fork`) | Thread (`pthread`) |
|---|---|---|
| Mémoire | Séparée (copie) | Partagée |
| Coût de création | Plus élevé | Plus léger |
| Communication entre unités | Nécessite un mécanisme explicite (pipe, mémoire partagée...) | Directe (variables globales), mais nécessite une protection (mutex) |
| Un crash affecte les autres ? | Non (isolé) | Oui (un thread qui plante peut corrompre tout le processus) |

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un thread partage la mémoire avec les autres threads du même programme (contrairement à un processus issu de `fork()`), plus léger, mais expose à des *race conditions* sur les données partagées. |
| **Outils utilisables** | `pthread_create`/`pthread_join`, `pthread_mutex_t`/`lock`/`unlock`. |
| **Pièges à éviter** | Modifier une variable partagée sans protection (*race condition*) ; oublier de déverrouiller un mutex (*deadlock* si un autre thread attend indéfiniment) ; verrouiller plusieurs mutex dans un ordre différent selon le thread. |
| **Bonnes pratiques** | Protéger toute donnée partagée entre threads par un mutex, y compris pour une opération qui paraît simple (`compteur++` n'est pas atomique). Verrouiller plusieurs mutex toujours dans le même ordre (ex. par adresse mémoire) pour éviter tout deadlock. |
