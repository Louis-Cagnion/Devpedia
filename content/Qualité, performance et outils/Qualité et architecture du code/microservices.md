---
order: 2
---

# Microservices : découper une application en services indépendants

[Responsabilité unique et faible couplage](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) s'applique à une fonction ou un fichier ; l'architecture **microservices** applique la même idée à l'échelle d'une application entière : plutôt qu'un seul programme qui gère tous les domaines métier, plusieurs **services** indépendants, chacun responsable d'un seul domaine, communiquant entre eux par le réseau plutôt qu'en partageant de la mémoire ou une base de données.

## Du monolithe aux services séparés

Un **monolithe** regroupe tout le code applicatif (catalogue, panier, paiement, notifications...) dans un seul programme, déployé comme une seule unité :

```text
Monolithe :                          Microservices :

+----------------------+             +-----------+   +-----------+
|  Catalogue           |             | Catalogue |   |  Panier   |
|  Panier               |             +-----------+   +-----------+
|  Paiement             |                   |               |
|  Notifications        |             +-----------+   +---------------+
+----------------------+             | Paiement  |   | Notifications |
   (un seul deploiement)              +-----------+   +---------------+
                                        (un deploiement par service, relies par le reseau)
```

Chaque service peut être écrit dans un langage différent, déployé et mis à l'échelle indépendamment des autres, et modifié sans redéployer l'application entière : exactement la même intention qu'une [responsabilité unique](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) au niveau d'un fichier, transposée au niveau du déploiement.

## Chaque service possède ses propres données

Un service ne doit jamais lire ou écrire directement dans la base de données d'un autre : il passe par l'[API](/?c=infrastructure&p=api-et-http) que cet autre service expose, jamais par un accès direct à son stockage.

> **Piège :** laisser plusieurs services accéder directement à une même base de données partagée "pour simplifier". Cela recrée exactement le couplage qu'un fichier qui partage une [constante entre deux mécanismes indépendants](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) provoque déjà à petite échelle : un changement de schéma dans un service casse silencieusement un autre service qui lisait directement cette table, sans qu'aucun appel d'API ne le rende visible à la lecture du code.
>
> **Bonne pratique :** chaque service possède sa propre base de données (ou son propre schéma isolé), inaccessible directement aux autres ; toute donnée nécessaire à un autre service transite par une [API](/?c=infrastructure&p=api-et-http) explicite.

## Communiquer entre services : synchrone ou asynchrone

| | Appel synchrone (HTTP/API) | Message asynchrone (file de messages) |
|---|---|---|
| Principe | Le service appelant attend la réponse avant de continuer | Le service dépose un message et continue sans attendre qu'il soit traité |
| Couplage de disponibilité | Le service paiement indisponible fait échouer la commande immédiatement | Le message attend dans la file jusqu'à ce que le service paiement soit de nouveau disponible |
| Simplicité | Plus simple à suivre et déboguer (un appel, une réponse) | Cohérence différée (*eventual consistency*) à gérer explicitement |

Voir [WebSocket](/?c=infrastructure&p=websocket-et-temps-reel) pour une troisième forme de communication, pertinente quand un service doit notifier un client en continu plutôt qu'un autre service ponctuellement.

## Le bénéfice principal : la mise à l'échelle indépendante

Dans un monolithe, une charge élevée sur une seule fonctionnalité (le paiement lors d'un pic de vente, par exemple) oblige à démultiplier l'application **entière**, y compris les parties qui n'en ont pas besoin. Avec des services séparés, seul le service concerné est mis à l'échelle, sans toucher aux autres.

## Le piège du monolithe distribué

Découper le code en plusieurs services ne suffit pas à obtenir les bénéfices des microservices si le couplage reste fort entre eux :

> **Piège :** appliquer le vrai test de la [responsabilité unique](/?c=qualite-et-architecture-du-code&p=responsabilite-unique-et-couplage) ("si je modifie ceci, est-ce pour la même raison que cela ?") uniquement au découpage en fichiers, jamais au découpage en services. Des services qui doivent systématiquement être déployés ensemble, ou dont un changement de contrat d'API dans l'un oblige à modifier immédiatement tous les autres, ne sont qu'un **monolithe distribué** : toute la complexité opérationnelle des microservices, aucun de leurs bénéfices d'indépendance.
>
> **Bonne pratique :** découper les services le long des mêmes frontières que celles d'une responsabilité unique bien posée (domaines métier réellement indépendants), jamais par commodité technique (un service par type de fichier, par exemple), et vérifier régulièrement que deux services peuvent réellement être déployés l'un sans l'autre.

## Le coût : une complexité qui ne disparaît pas, elle se déplace

Les microservices ne sont pas gratuits : la complexité qu'un monolithe gère en mémoire (un appel de fonction, une transaction de base de données unique) doit désormais être gérée à travers le réseau (latence, panne partielle possible, plus de transaction unique couvrant plusieurs services). Observer ce qui se passe (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) pour un exemple de ce type de supervision, appliqué à un LLM plutôt qu'à des microservices) devient indispensable dès que plusieurs services interagissent : une erreur peut désormais venir de n'importe lequel d'entre eux, ou de la communication entre eux.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Les microservices appliquent la responsabilité unique à l'échelle du déploiement : un service par domaine métier, sa propre base de données, une communication par API plutôt qu'un accès direct aux données d'un autre service. Le bénéfice principal est la mise à l'échelle indépendante d'un service précis, sans démultiplier toute l'application. |
| **Outils utilisables** | Un appel synchrone (HTTP/API) pour un besoin de réponse immédiate ; une file de messages asynchrone pour découpler la disponibilité de deux services. |
| **Pièges à éviter** | Partager une base de données entre plusieurs services. Découper en services sans réduire le couplage entre eux (monolithe distribué). |
| **Bonnes pratiques** | Faire porter chaque service par son propre stockage, jamais partagé. Découper le long de frontières de domaine métier réellement indépendantes, et vérifier régulièrement qu'un service peut être déployé sans les autres. |
