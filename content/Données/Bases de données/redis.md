---
order: 9
---

# Redis : le store clé-valeur en mémoire

Une base de données classique (voir [Bases de données](/?c=bases-de-donnees)) écrit ses données sur disque : elles survivent à un redémarrage, mais chaque lecture ou écriture doit passer par ce disque, plus lent que la mémoire vive (RAM). **Redis** est un **store clé-valeur** (chaque donnée est associée à une clé unique, comme dans un dictionnaire) qui garde tout **en mémoire vive** par défaut : les accès deviennent de l'ordre de la microseconde plutôt que de la milliseconde, au prix d'une donnée perdue si le processus s'arrête sans précaution particulière (voir la persistance plus bas).

```text
Base relationnelle classique :  Application --> requete --> Disque --> reponse
                                 (chaque acces traverse le disque)

Redis :                         Application --> requete --> RAM --> reponse
                                 (le disque n'intervient qu'en option, pour ne pas tout perdre)
```

## Les structures de données supportées

Contrairement à un simple cache qui n'associerait qu'une chaîne à une clé, Redis comprend plusieurs formes de valeurs, chacune adaptée à un besoin précis :

| Structure | Ce qu'elle contient | Exemple d'usage |
|---|---|---|
| **String** | Une chaîne ou un nombre | Compteur de vues, jeton de session |
| **List** | Une séquence ordonnée de valeurs | File d'attente de tâches à traiter |
| **Hash** | Un ensemble de champs nommés, comme un mini-objet | Les propriétés d'un profil utilisateur |
| **Set** | Un ensemble de valeurs uniques, sans ordre | Les tags associés à un article |
| **Sorted set** | Un ensemble de valeurs uniques, classées par score | Un classement (score, temps de jeu) |

## Cas d'usage typiques

### Le cache applicatif

Le cas le plus courant : éviter de refaire un calcul ou une requête coûteuse en gardant son résultat à portée de main pendant un temps limité, un principe déjà posé dans [Bases de données à fort trafic](/?c=bases-de-donnees&p=bases-de-donnees-a-fort-trafic).

```text
1. L'application recoit une demande
2. Elle interroge d'abord Redis avec la cle correspondante
   -> Presente (cache hit)  : reponse immediate, disque jamais sollicite
   -> Absente  (cache miss) : requete a la base relationnelle,
                                puis resultat ecrit dans Redis pour la prochaine fois
```

Ce schéma, où le cache n'est consulté et rempli qu'à la demande, porte un nom : le pattern ***cache-aside***.

### Stockage de session, file d'attente, pub/sub

- **Stockage de session** : les informations d'un utilisateur connecté (identifiant, droits) sont lues à chaque requête ; les garder en RAM plutôt qu'en base relationnelle évite une requête disque à chaque page.
- **File d'attente légère** : une `List` sert de tampon entre un service qui produit des tâches et un autre qui les traite, sans dépendre d'un système de file dédié plus lourd.
- **Pub/sub** (*publish/subscribe*) : un service publie un message sur un canal nommé, tous les services abonnés à ce canal le reçoivent aussitôt, sans lien direct entre eux.

## Le TTL : une clé qui s'auto-détruit

Un **TTL** (*Time To Live*) est une durée de vie optionnelle attachée à une clé : passé ce délai, Redis la supprime tout seul. C'est ce qui rend Redis adapté à un cache : plutôt que de devoir supprimer manuellement une donnée devenue périmée, on lui donne dès sa création une date d'expiration.

## La persistance : RDB et AOF

Redis reste avant tout un outil de mémoire vive, mais propose deux mécanismes optionnels pour survivre à un redémarrage :

| Mécanisme | Principe | Compromis |
|---|---|---|
| **RDB** (*Redis Database*) | Une photo complète de la mémoire, écrite sur disque à intervalles réguliers | Rapide à restaurer, mais perd les écritures survenues depuis la dernière photo |
| **AOF** (*Append Only File*) | Chaque écriture est aussi journalisée sur disque, dans l'ordre où elle arrive | Perd beaucoup moins de données en cas de coupure, mais fichier plus volumineux et restauration plus lente |

> **Piège :** utiliser Redis sans RDB ni AOF pour stocker une donnée qu'on ne peut pas se permettre de perdre (ex : un panier d'achat non encore validé). Sans persistance activée, un simple redémarrage du processus efface tout.

## Monter en charge : réplication et Redis Cluster

Comme pour une base relationnelle, deux mécanismes permettent de dépasser les capacités d'un seul serveur : la **réplication** (une ou plusieurs copies en lecture seule d'un serveur principal, pour répartir les lectures et survivre à sa perte) et **Redis Cluster**, qui répartit les clés elles-mêmes entre plusieurs serveurs (partitionnement), pour dépasser la RAM d'une seule machine.

## Redis n'est pas une base relationnelle

Redis ne remplace pas une base comme celles couvertes dans [Bases de données](/?c=bases-de-donnees) : pas de jointure entre plusieurs structures, pas de requête complexe façon [SQL](/?c=domain-specific-languages-dsl&p=sql), et une capacité de stockage limitée par la RAM disponible plutôt que par l'espace disque. Il complète une base existante pour les accès qui doivent être immédiats, il ne la remplace pas pour ceux qui doivent rester exhaustifs et durables.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Redis est un store clé-valeur qui garde ses données en RAM par défaut, pour des accès très rapides. Il supporte plusieurs structures (string, list, hash, set, sorted set), un TTL pour l'expiration automatique, et une persistance optionnelle (RDB, AOF). |
| **Outils utilisables** | RDB/AOF pour la persistance ; réplication et Redis Cluster pour monter en charge. |
| **Pièges à éviter** | Stocker une donnée critique sans persistance activée ; attendre de Redis les capacités d'une base relationnelle (jointures, requêtes complexes). |
| **Bonnes pratiques** | Réserver Redis au cache, à la session, ou à un besoin de latence minimale ; toujours définir un TTL sur une donnée de cache pour éviter qu'elle ne devienne obsolète silencieusement. |
