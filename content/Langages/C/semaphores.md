---
order: 26
---

# Les sémaphores POSIX

Un **sémaphore** est un compteur protégé, partagé entre threads ou entre processus, qui limite le nombre d'accès simultanés à une ressource. Contrairement à un [mutex](/?c=langages-de-programmation&s=c&p=threads) (verrou binaire, limité à un même processus/mêmes threads), un sémaphore compte de 0 à N et peut être partagé entre processus distincts.

## `sem_wait()`/`sem_post()` : décrémenter et incrémenter

- `sem_wait()` décrémente le compteur ; si le compteur est déjà à 0, il **bloque** jusqu'à ce qu'un autre thread/processus le libère.
- `sem_post()` incrémente le compteur, réveillant potentiellement un thread/processus en attente.

```c
#include <semaphore.h>

sem_t semaphore;

sem_init(&semaphore, 0, 3); // compteur initial à 3 (0 = partagé entre threads du même processus)

sem_wait(&semaphore); // décrémente ; bloque si déjà à 0
// ... section qui ne doit pas dépasser 3 accès simultanés ...
sem_post(&semaphore); // incrémente, réveille un éventuel thread en attente
```

## Un sémaphore nommé, partagé entre processus (`sem_open`)

Contrairement à `sem_init()` (limité à un même processus), `sem_open()` crée ou ouvre un sémaphore **nommé**, visible par n'importe quel processus qui rouvre le même nom :

```c
#include <semaphore.h>
#include <fcntl.h>

sem_t *fourchettes = sem_open("/fourchettes", O_CREAT, 0644, 5); // 5 fourchettes disponibles

sem_wait(fourchettes); // prend une fourchette (bloque si les 5 sont déjà prises)
// ... utiliser la ressource partagée ...
sem_post(fourchettes); // rend la fourchette

sem_close(fourchettes);     // libère le descripteur local à ce processus
sem_unlink("/fourchettes"); // détruit l'objet nommé du système (une seule fois, en fin de programme)
```

| Fonction | Rôle |
|---|---|
| `sem_open()` | Crée ou ouvre un sémaphore nommé, partagé entre processus |
| `sem_wait()` | Décrémente le compteur, bloque si déjà à 0 |
| `sem_post()` | Incrémente le compteur, réveille un thread/processus en attente |
| `sem_close()` | Libère le descripteur local à ce processus (le sémaphore nommé persiste) |
| `sem_unlink()` | Détruit définitivement l'objet nommé du système |

> **Piège :** appeler `sem_unlink()` depuis chaque processus qui utilise le sémaphore. Un sémaphore nommé doit être détruit une seule fois (typiquement par le dernier processus à s'arrêter, ou un processus dédié), sinon un processus encore actif se retrouve à utiliser un nom qui n'existe plus.
>
> **Bonne pratique :** utiliser un sémaphore compté (`sem_open` avec une valeur initiale > 1) pour représenter un pool de ressources limité (ex. 5 fourchettes partagées entre plusieurs processus) ; un sémaphore initialisé à 1 sert lui de verrou d'exclusion mutuelle inter-processus, équivalent à un mutex mais utilisable entre processus séparés (là où un mutex `pthread` classique ne l'est pas).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un sémaphore est un compteur protégé (0 à N) qui limite le nombre d'accès simultanés à une ressource, utilisable entre threads (`sem_init`) ou entre processus séparés via un nom partagé (`sem_open`). |
| **Outils utilisables** | `sem_wait()`/`sem_post()` pour décrémenter/incrémenter ; `sem_open()`/`sem_close()`/`sem_unlink()` pour un sémaphore nommé partagé entre processus. |
| **Pièges à éviter** | Appeler `sem_unlink()` depuis plusieurs processus, alors que l'objet nommé ne doit être détruit qu'une seule fois. |
| **Bonnes pratiques** | Un sémaphore compté pour un pool de ressources limité ; un sémaphore à 1 comme verrou d'exclusion mutuelle inter-processus. |
