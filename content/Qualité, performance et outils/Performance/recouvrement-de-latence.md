---
order: 9
---

# Recouvrir la latence avec un pool tournant

Quand un programme doit traiter beaucoup d'éléments qui impliquent chacun une attente réseau (charger une page, appeler une API, lire un fichier distant), le temps total ne dépend presque jamais du calcul : il dépend du nombre d'allers-retours réseau et de leur enchaînement.

## Le problème du traitement un par un

La version la plus simple traite chaque élément intégralement avant de passer au suivant :

```python
resultats = []
for item in items:
    page = ouvrir(item)          # attente réseau : ex. 800 ms
    resultats.append(extraire(page))
```

Si chaque attente dure 800 ms et qu'il y a 1000 éléments, le programme tourne environ 13 minutes, alors que le calcul lui-même (`extraire`) ne prend que quelques millisecondes. Le CPU passe l'essentiel de son temps à ne rien faire, en attendant une réponse.

## Tout lancer d'un coup : rapide, mais dangereux

À l'inverse, démarrer les 1000 attentes en même temps répartirait tout le temps réseau sur une seule attente collective, au prix de 1000 requêtes simultanées vers le même service. Beaucoup de services web ralentissent ou bloquent volontairement un client qui envoie autant de requêtes à la fois, et une base de données ou un serveur peut tout simplement s'effondrer sous la charge.

## Un compromis : un pool borné à N emplacements

La solution retenue en pratique est un **pipeline** : garder toujours au plus **N** attentes en vol (N choisi, par exemple 5 ou 10), jamais plus, jamais moins tant qu'il reste du travail. Concrètement, N emplacements numérotés de 0 à N-1 se partagent le travail à tour de rôle, en **tourniquet** :

```python
N = 5
emplacements = [None] * N
resultats = []

for i, item in enumerate(items):
    if emplacements[i % N] is not None:
        resultats.append(extraire(emplacements[i % N]))   # termine le tour (i - N)
    emplacements[i % N] = ouvrir(item)                     # démarre le tour i, sans attendre

for i in range(len(items) - N, len(items)):
    resultats.append(extraire(emplacements[i % N]))        # vide les N derniers emplacements
```

Au tour `i`, `ouvrir(item)` démarre **avant** que `extraire(...)` du tour `i - N` n'ait fini de s'exécuter : le traitement d'un élément se déroule pendant que l'attente réseau du suivant progresse déjà. Aucun des deux tours n'attend l'autre, et jamais plus de N attentes ne sont en vol à la fois.

| Approche | Attentes en vol | Temps total pour 1000 éléments à 800 ms |
|---|---|---|
| Un par un (séquentiel) | 1 | ≈ 13 minutes |
| Tout d'un coup | 1000 | Le plus rapide en théorie, mais risque fort de blocage par le service distant |
| Pool borné à N=5 | 5 | ≈ 2,7 minutes, sans jamais dépasser 5 requêtes simultanées |

> **Bonne pratique :** choisir N en fonction de ce que le service en face tolère (documentation, quota connu, ou tâtonnement prudent), jamais au hasard : un N trop grand reproduit le problème de la version "tout d'un coup".

## Le cas particulier à 2 emplacements : le double buffering

Avec N = 2, ce motif porte un nom classique : le **double buffering** (double tamponnage), utilisé par exemple dans le rendu graphique pour préparer l'image suivante pendant que la précédente s'affiche encore. Le principe reste rigoureusement le même : deux emplacements qui alternent entre "en cours de préparation" et "en cours d'utilisation", pour ne jamais bloquer l'un sur l'autre.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Traiter des éléments un par un gaspille tout le temps d'attente réseau ; tout lancer d'un coup surcharge le service distant. Un pool borné à N emplacements chevauche l'attente du tour suivant avec le traitement du tour courant, sans jamais dépasser N requêtes simultanées. |
| **Outils utilisables** | Un tableau de N emplacements indexés en tourniquet (`i % N`), qui démarre le travail du tour `i` avant de récupérer le résultat du tour `i - N`. |
| **Pièges à éviter** | Un N choisi au hasard, trop grand pour ce que le service distant tolère. Oublier de vider les N derniers emplacements après la boucle principale. |
| **Bonnes pratiques** | Choisir N à partir d'une limite connue ou documentée du service distant. Reconnaître le cas N=2 comme un double buffering, motif déjà répandu ailleurs (rendu graphique). |
