---
order: 27
---

# Mesurer le temps et attendre précisément

Un programme qui doit dater un événement ou attendre une durée précise ne peut pas se contenter d'un simple compteur de boucle : la vitesse d'exécution dépend du processeur et de sa charge. Deux outils standards répondent à ce besoin : `gettimeofday()` pour lire l'heure actuelle, `usleep()` pour mettre en pause.

## Lire l'heure actuelle : `gettimeofday()`

```c
#include <sys/time.h>

struct timeval tv;
gettimeofday(&tv, NULL);

long millisecondes = tv.tv_sec * 1000 + tv.tv_usec / 1000;
```

`gettimeofday()` remplit une structure `timeval` avec deux champs : `tv_sec` (secondes écoulées depuis une référence fixe, l'*epoch* Unix du 1er janvier 1970) et `tv_usec` (microsecondes supplémentaires, entre 0 et 999999). Combiner les deux en une seule valeur en millisecondes (`tv_sec * 1000 + tv_usec / 1000`) simplifie ensuite toute comparaison ou soustraction entre deux instants.

## Mettre en pause : `usleep()` et son imprécision

`usleep(microsecondes)` met en pause le thread ou processus courant, mais sa précision réelle dépend de l'ordonnanceur du système : la pause peut durer légèrement **plus longtemps** que demandé (jamais moins), l'ordonnanceur ne garantissant qu'un minimum, pas une durée exacte.

> **Piège :** enchaîner des `usleep()` successifs en croyant obtenir un minutage précis. Chaque appel individuel peut déborder légèrement, et ces petits dépassements s'accumulent au fil des appels répétés.
>
> **Bonne pratique :** pour une attente réellement précise, comparer le temps réellement écoulé (via `gettimeofday()`) à la durée voulue, dans une boucle qui ré-appelle `usleep()` par petits incréments jusqu'à atteindre la durée exacte :

```c
void attentePrecise(long dureeMs)
{
    long debut = tempsActuelMs(); // gettimeofday(), voir plus haut

    while (tempsActuelMs() - debut < dureeMs) {
        usleep(1000); // ré-évalue toutes les millisecondes plutôt qu'un seul long usleep()
    }
}
```

Ce pattern d'**attente active** (*busy-wait*) recalcule le temps réellement écoulé à chaque itération plutôt que de faire confiance à un seul `usleep()` de la durée totale : la légère imprécision de chaque `usleep(1000)` individuel est corrigée par la boucle elle-même, qui ne s'arrête que lorsque le temps voulu est réellement atteint.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `gettimeofday()` lit l'heure actuelle (secondes + microsecondes depuis l'epoch Unix) ; `usleep()` met en pause, mais sa durée réelle peut légèrement dépasser la valeur demandée. |
| **Outils utilisables** | Combiner `tv_sec`/`tv_usec` en une seule valeur en millisecondes pour dater ou comparer des instants. |
| **Pièges à éviter** | Faire confiance à un seul `usleep()` long pour un minutage précis : son imprécision s'accumule. |
| **Bonnes pratiques** | Boucler sur de petits `usleep()` en recomparant le temps réellement écoulé à la durée voulue, pour une attente précise malgré l'imprécision individuelle de chaque `usleep()`. |
