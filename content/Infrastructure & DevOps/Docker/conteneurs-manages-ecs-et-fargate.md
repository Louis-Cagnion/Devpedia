---
order: 7
---

# Conteneurs managés dans le cloud : ECS et Fargate

[Docker](/?c=infrastructure-devops&s=docker&p=docker) permet d'empaqueter une application dans un [conteneur](/?c=infrastructure-devops&s=docker&p=concepts-de-base) et de le faire tourner n'importe où. Mais faire tourner ce conteneur en production, pour de vrai, pose une question que Docker seul ne résout pas : sur quelle machine, combien de temps, et qui redémarre le conteneur s'il plante à 3h du matin ? Un **service de conteneurs managés** répond à cette question en confiant tout ou partie de cette gestion à un fournisseur [cloud](/?c=infrastructure-devops&s=infrastructure&p=le-cloud).

## Le problème : Docker ne gère pas la production à votre place

Faire tourner soi-même des conteneurs Docker en production suppose de gérer, en continu :

| Responsabilité | Détail |
|---|---|
| Les serveurs sous-jacents | Les provisionner, les mettre à jour, remplacer une machine défaillante |
| Le placement des conteneurs | Décider quel conteneur tourne sur quelle machine, selon la charge |
| La résilience | Redémarrer automatiquement un conteneur qui plante ou qui ne répond plus |
| La montée en charge | Ajouter des conteneurs (ou des machines) si le trafic augmente |

Un service comme **Amazon ECS** (*Elastic Container Service*) prend en charge ces quatre points : on lui fournit une image de conteneur (le résultat d'un [Dockerfile](/?c=infrastructure-devops&s=docker&p=dockerfile)), et il s'occupe de la faire tourner, de la surveiller et de la relancer si besoin.

## Deux façons de faire tourner ECS : encore/sans gérer les serveurs

Le chapitre sur [le cloud](/?c=infrastructure-devops&s=infrastructure&p=le-cloud) distingue IaaS (le fournisseur ne gère que le matériel, vous gérez le reste) et PaaS (le fournisseur gère aussi l'environnement d'exécution). ECS propose exactement ce choix, sous la forme de deux "lanceurs" :

| | ECS sur EC2 | ECS sur [Fargate](https://aws.amazon.com/fargate/) |
|---|---|---|
| Qui gère les serveurs sous-jacents ? | Vous (choix du type de machine, mise à jour) | Amazon, entièrement |
| Ce que vous fournissez | L'image du conteneur + les machines à faire tourner | Uniquement l'image du conteneur |
| Facturation | À la machine louée, utilisée ou non | Au conteneur réellement utilisé (CPU/mémoire, à la seconde) |
| Proche de | IaaS | PaaS |

> **Analogie :** ECS sur EC2, c'est louer un local commercial vide et y installer soi-même les rayonnages ; Fargate, c'est louer un stand déjà équipé, prêt à accueillir la marchandise, sans jamais avoir à s'occuper du local lui-même.

D'autres fournisseurs proposent des services équivalents à Fargate (Google Cloud Run, Azure Container Apps) : le principe — fournir un conteneur, ne jamais gérer la machine sous-jacente — reste le même d'un fournisseur à l'autre.

> **Piège :** croire qu'un service managé dispense de toute réflexion sur le dimensionnement. Il faut tout de même indiquer combien de mémoire et de puissance de calcul allouer à chaque conteneur, et combien d'exemplaires en faire tourner en parallèle : un mauvais dimensionnement reste possible, seule la gestion physique des machines disparaît.
>
> **Bonne pratique :** commencer par Fargate par défaut (aucune machine à gérer, facturation au plus proche de l'usage réel) et ne basculer vers ECS sur EC2 que si un besoin précis l'exige (accès à un matériel spécifique, optimisation fine des coûts sur un usage constant et prévisible).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | ECS fait tourner des conteneurs Docker en production à la place du développeur (placement, redémarrage, montée en charge). Fargate va plus loin en supprimant même la gestion des machines sous-jacentes. |
| **Outils utilisables** | [Amazon ECS](https://aws.amazon.com/ecs/) et [Fargate](https://aws.amazon.com/fargate/) ; équivalents chez d'autres fournisseurs (Google Cloud Run, Azure Container Apps). |
| **Pièges à éviter** | Croire qu'un service managé dispense de dimensionner correctement chaque conteneur. |
| **Bonnes pratiques** | Démarrer avec un service entièrement managé (type Fargate) et ne gérer soi-même les machines que si un besoin précis le justifie. |
