---
order: 2
---

# Autoscaling et répartition de charge

[Bases de données à fort trafic](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) détaille comment absorber un fort trafic **côté base de données** (cache, réplicas, sharding). Ce chapitre couvre l'autre moitié du problème : comment absorber ce trafic **côté serveurs applicatifs**, ceux qui exécutent le code de l'application elle-même.

## Le problème : un seul serveur a une capacité limitée

Un serveur applicatif ne peut traiter qu'un nombre fini de requêtes simultanées, limité par sa puissance de calcul et sa mémoire. Deux façons d'augmenter cette capacité :

| | Mise à l'échelle verticale | Mise à l'échelle horizontale |
|---|---|---|
| Principe | Une machine plus puissante (plus de CPU, plus de mémoire) | Plusieurs machines identiques en parallèle |
| Plafond | Limité par la plus grosse machine disponible sur le marché | Quasiment illimité (ajouter une machine de plus) |
| Coût d'arrêt | Un arrêt de cette machine unique arrête tout le service | La perte d'une machine parmi plusieurs n'arrête pas le service |

La mise à l'échelle horizontale est privilégiée dès qu'un trafic important est attendu, précisément parce qu'elle n'a pas de plafond fixe et tolère la panne d'une machine.

## Le répartiteur de charge (load balancer)

Une fois plusieurs serveurs identiques disponibles, chaque requête entrante doit être dirigée vers l'un d'entre eux : c'est le rôle du **répartiteur de charge** (*load balancer*), placé entre les utilisateurs et les serveurs.

```text
                    ┌──► Serveur 1
Utilisateurs ──► Répartiteur ──► Serveur 2
                    └──► Serveur 3
```

| Stratégie de répartition | Principe |
|---|---|
| *Round-robin* | Distribue les requêtes aux serveurs à tour de rôle, dans l'ordre |
| *Least connections* | Envoie la requête au serveur qui traite actuellement le moins de requêtes en cours |

Le répartiteur surveille aussi la santé de chaque serveur (un **health check**, une requête de test envoyée périodiquement) : un serveur qui ne répond plus est automatiquement retiré de la rotation, sans intervention humaine, jusqu'à ce qu'il redevienne disponible.

> **Piège :** répartir les requêtes d'un même utilisateur sur des serveurs différents, en supposant que chaque serveur garde en mémoire ce qui concerne cet utilisateur (sa session). Le chapitre [JWT et tokens](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens) détaille déjà ce problème et sa solution : ne pas dépendre de la mémoire d'un serveur précis, justement pour que n'importe quel serveur derrière le répartiteur puisse traiter n'importe quelle requête indifféremment.

## L'autoscaling : ajuster le nombre de serveurs automatiquement

Provisionner à l'avance assez de serveurs pour absorber le pic de trafic le plus élevé imaginable gaspille de l'argent le reste du temps, où ces serveurs tournent largement sous-utilisés. L'**autoscaling** (mise à l'échelle automatique) résout ce compromis : le nombre de serveurs actifs s'ajuste automatiquement à la charge réelle, mesurée en continu (utilisation CPU, nombre de requêtes en attente...).

```text
Charge mesurée en continu
   |
   ├─ dépasse un seuil (ex : CPU > 70% pendant 5 min)  -> ajoute un serveur
   |
   └─ repasse sous un seuil bas                        -> retire un serveur
```

Un pic de trafic soudain (une publicité virale, un pic de commandes) déclenche ainsi l'ajout automatique de serveurs supplémentaires, puis leur retrait une fois le pic retombé, sans qu'un humain n'ait à surveiller le trafic en permanence ni à deviner à l'avance son intensité.

> **Piège :** croire que l'autoscaling réagit instantanément. Démarrer un nouveau serveur (allouer la machine, y déployer l'application, la faire démarrer) prend du temps, de quelques secondes à plusieurs minutes selon les cas : un pic si brutal qu'il double le trafic en quelques secondes peut saturer les serveurs existants avant que les nouveaux n'aient fini de démarrer.
>
> **Bonne pratique :** garder une marge de capacité disponible en permanence (ne jamais faire tourner les serveurs existants à 100 % de leur capacité juste avant de déclencher l'ajout d'un nouveau), et prévoir une dégradation progressive du service (répondre plus lentement, désactiver une fonctionnalité secondaire) plutôt qu'une panne complète si un pic dépasse malgré tout la vitesse de mise à l'échelle.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | La mise à l'échelle horizontale (plusieurs serveurs identiques) plutôt que verticale (une machine plus grosse) permet d'absorber un trafic important sans plafond fixe. Un répartiteur de charge distribue les requêtes entre ces serveurs et retire automatiquement ceux qui ne répondent plus. L'autoscaling ajuste leur nombre à la charge réelle mesurée en continu. |
| **Outils utilisables** | Un répartiteur de charge avec health checks intégrés ; un service d'autoscaling fourni par la plupart des [fournisseurs cloud](/?c=infrastructure-devops&s=infrastructure&p=le-cloud). |
| **Pièges à éviter** | Répartir les requêtes d'un utilisateur sur des serveurs qui dépendent de leur propre mémoire locale. Attendre de l'autoscaling une réaction instantanée à un pic brutal. |
| **Bonnes pratiques** | Garder une marge de capacité permanente. Prévoir une dégradation progressive plutôt qu'une panne complète en cas de pic dépassant la vitesse de mise à l'échelle. |
