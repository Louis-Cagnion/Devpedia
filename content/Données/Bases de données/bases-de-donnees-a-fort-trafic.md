---
order: 8
---

# Bases de données à fort trafic : ne jamais bloquer l'utilisateur sur un recalcul coûteux

Une requête qui répond en quelques millisecondes sur une petite table peut devenir un goulot d'étranglement une fois les données et le trafic multipliés : si chaque visite d'une page relance cette même requête coûteuse en direct, le temps de réponse de l'utilisateur dépend directement de sa lenteur. Ce chapitre couvre les techniques qui évitent ce blocage, déjà annoncées dans le principe général de [ne jamais recalculer un résultat que rien n'a pu changer depuis](/?c=performance&p=eviter-le-recalcul-redondant), appliquées ici spécifiquement à une base de données à fort trafic.

## Cas concret : une requête de plusieurs minutes derrière un simple filtre

Une page affiche une liste d'options de filtre (les régions disponibles, les catégories de produits...), calculée par une requête qui parcourt l'intégralité d'une table de plusieurs millions de lignes, sans filtre de date. Sur un petit jeu de données, cette requête répond en dessous de la seconde ; une fois la table devenue volumineuse, la même requête peut prendre plusieurs **minutes**. Si elle s'exécute à chaque chargement de page, chaque utilisateur attend ces minutes en direct pour une information qui ne change pourtant que rarement.

> **Piège :** recalculer une donnée coûteuse à chaque requête utilisateur simplement parce que la requête est correcte et donne le bon résultat. Une requête correcte peut rester une mauvaise idée si son coût est disproportionné par rapport à la fraîcheur réellement nécessaire de son résultat.
>
> **Bonne pratique :** avant d'optimiser la requête elle-même (index, réécriture SQL), se demander d'abord si le résultat a vraiment besoin d'être recalculé à chaque visite, ou s'il peut être mis en cache.

## Cache et stale-while-revalidate

La technique la plus directe : calculer le résultat une fois, le stocker, puis servir cette valeur en cache plutôt que de relancer le calcul à chaque demande.

```text
Sans cache :                          Avec cache + TTL 6h :

Requete utilisateur                   Requete utilisateur
  -> recalcul complet (minutes)         -> lecture du cache (millisecondes)
  -> reponse                            -> reponse immediate
                                       Toutes les 6h : recalcul en tache de fond
```

Le **TTL** (*Time To Live*) fixe la durée pendant laquelle une valeur en cache reste considérée comme valide avant d'être recalculée. Le choix du TTL dépend de la fréquence réelle de changement de la donnée : des options de filtre qui évoluent rarement supportent un TTL de plusieurs heures, une donnée qui change à la minute en demande un bien plus court.

Le **stale-while-revalidate** (« périmé pendant le rafraîchissement ») va plus loin qu'un cache simple : à l'expiration du TTL, la valeur périmée est quand même servie immédiatement à l'utilisateur, pendant qu'une tâche de fond recalcule la nouvelle valeur pour les requêtes suivantes.

| | Cache simple (TTL strict) | Stale-while-revalidate |
|---|---|---|
| À l'expiration du TTL | La requête suivante attend le recalcul complet | La requête suivante reçoit l'ancienne valeur immédiatement |
| Fraîcheur perçue | Toujours à jour au prix d'un ralentissement périodique | Occasionnellement légèrement périmée, jamais lente |

> **Bonne pratique :** utiliser le stale-while-revalidate quand une donnée légèrement périmée (de quelques minutes à quelques heures selon le cas) reste acceptable pour l'utilisateur, ce qui est le cas de la plupart des données qui ne représentent pas un état financier ou de sécurité en temps réel.

## Réplicas de lecture

Un **réplica de lecture** (*read replica*) est une copie de la base de données, synchronisée en continu depuis la base principale, dédiée exclusivement aux requêtes de lecture. Les écritures continuent d'aller vers la base principale ; les lectures, souvent bien plus nombreuses, se répartissent sur un ou plusieurs réplicas :

```text
Ecritures  ->  Base principale
                    |
                    | synchronisation continue
                    v
Lectures   ->  Réplica 1, Réplica 2, Réplica 3...
```

Cela évite qu'une lecture coûteuse ne ralentisse les écritures (et inversement), et permet d'ajouter des réplicas supplémentaires à mesure que le volume de lectures augmente, sans toucher à la base principale.

> **Piège :** lire immédiatement après une écriture sur un réplica qui n'a pas encore reçu la synchronisation la plus récente (*replication lag*) : l'utilisateur peut alors ne pas voir la donnée qu'il vient lui-même d'enregistrer.
>
> **Bonne pratique :** lire depuis la base principale juste après une écriture qui doit être immédiatement visible par le même utilisateur, et réserver les réplicas aux lectures qui tolèrent un léger délai.

## Files d'attente et traitement asynchrone

Pour une écriture ou un recalcul lourd (générer un rapport, redimensionner une image, envoyer un lot d'emails), faire attendre l'utilisateur jusqu'à la fin du traitement bloque inutilement sa requête. Une **file d'attente** (*queue*) découple la demande de son traitement : la requête utilisateur dépose une tâche dans la file et reçoit une réponse immédiate, pendant qu'un processus séparé (*worker*) traite les tâches de la file à son propre rythme.

```text
Requete utilisateur -> depose une tache dans la file -> reponse immediate
                                    |
                                    v
                        Worker traite la tache en arriere-plan
                                    |
                                    v
                        Utilisateur notifie une fois termine (ou consulte le statut)
```

## Pagination et streaming plutôt qu'un résultat complet

Charger d'un coup l'intégralité d'un résultat volumineux (des dizaines de milliers de lignes) consomme de la mémoire et du temps de transfert proportionnels à ce volume, même si l'utilisateur n'en consulte qu'une fraction. Deux techniques évitent ce coût :

| Technique | Principe |
|---|---|
| **Pagination** | Découper le résultat en pages de taille fixe, n'en charger qu'une à la fois |
| **Streaming** | Envoyer le résultat au fur et à mesure qu'il est produit, plutôt que d'attendre qu'il soit complet avant de commencer à le transmettre |

## Connection pooling

Ouvrir une connexion à une base de données a un coût non négligeable (authentification, établissement de la liaison réseau). Un **pool de connexions** (*connection pool*) maintient un ensemble de connexions déjà ouvertes et prêtes à l'emploi, réutilisées d'une requête à l'autre plutôt que recréées à chaque fois.

> **Piège :** ouvrir une nouvelle connexion à chaque requête sous fort trafic. Le coût d'ouverture, négligeable une fois isolé, devient significatif une fois multiplié par un grand nombre de requêtes simultanées, et peut même épuiser le nombre maximal de connexions que la base accepte.
>
> **Bonne pratique :** configurer un pool de connexions dimensionné au trafic réel, plutôt que de laisser chaque requête gérer sa propre connexion.

## Sharding et partitionnement

Le **partitionnement** découpe une table volumineuse en plusieurs segments plus petits selon un critère (une plage de dates, une zone géographique...), tout en la gardant sur le même serveur de base de données. Le **sharding** va plus loin : il répartit ces segments sur des serveurs physiquement différents, permettant de dépasser la capacité d'une seule machine.

```text
Partitionnement (1 serveur) :          Sharding (plusieurs serveurs) :

Table                                   Serveur A : shard 1 (clients A-M)
  - Partition 2024                      Serveur B : shard 2 (clients N-Z)
  - Partition 2025
  - Partition 2026
```

Ces deux techniques ne sont utiles qu'une fois les approches précédentes (cache, réplicas, files d'attente) insuffisantes : elles ajoutent une complexité réelle (une requête qui traverse plusieurs partitions ou plusieurs shards devient plus difficile à écrire et à optimiser).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une requête correcte peut rester une mauvaise idée si elle est recalculée en direct à chaque visite alors que son résultat change rarement. Cache/stale-while-revalidate, réplicas de lecture, files d'attente, pagination/streaming, connection pooling et sharding sont des réponses complémentaires, pas concurrentes, à ce problème. |
| **Outils utilisables** | Un cache avec TTL et stale-while-revalidate pour une donnée qui tolère une légère péremption. Une file d'attente pour un traitement lourd qui ne doit pas bloquer la requête utilisateur. Un pool de connexions dimensionné au trafic réel. |
| **Pièges à éviter** | Recalculer une donnée coûteuse à chaque requête par simple habitude. Lire un réplica juste après une écriture qui doit être immédiatement visible. Ouvrir une nouvelle connexion à chaque requête sous fort trafic. |
| **Bonnes pratiques** | Mettre en cache tout résultat coûteux dont la fraîcheur parfaite n'est pas indispensable. Réserver le sharding/partitionnement aux cas où cache, réplicas et files d'attente ne suffisent déjà plus. |
