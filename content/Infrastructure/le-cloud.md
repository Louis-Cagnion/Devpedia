---
order: 4
---

# Qu'est-ce que le cloud ?

Faire tourner un programme ou stocker une donnée nécessite une machine physique quelque part. Le **cloud** désigne l'utilisation de machines distantes, possédées et gérées par un fournisseur tiers (Amazon AWS, Google Cloud, Microsoft Azure...), plutôt que du matériel acheté et géré par l'entreprise elle-même.

> **Analogie :** louer un appartement meublé plutôt que d'acheter et entretenir sa propre maison : on paie pour l'usage, sans posséder ni s'occuper de l'entretien de ce qu'il y a derrière.

## Pourquoi louer plutôt que posséder son propre serveur

| | Serveur possédé (*on-premise*) | Cloud |
|---|---|---|
| Investissement initial | Élevé (acheter le matériel à l'avance) | Faible (payer à l'usage réel) |
| Ajuster la capacité | Limitée par le matériel déjà acheté | En quelques clics ou minutes |
| Maintenance matérielle | À la charge de l'entreprise | À la charge du fournisseur cloud |
| Coût sur un usage constant et prévisible dans la durée | Peut revenir moins cher au total | Peut revenir plus cher au total |

## Les grandes catégories de services cloud

| Catégorie | Géré par le fournisseur | Géré par l'utilisateur | Exemple |
|---|---|---|---|
| **IaaS** (*Infrastructure as a Service*) | Matériel physique, réseau | Système d'exploitation, applications | Une machine virtuelle louée |
| **PaaS** (*Platform as a Service*) | + système d'exploitation, environnement d'exécution | Le code de l'application uniquement | Un service qui exécute directement du code fourni |
| **SaaS** (*Software as a Service*) | Tout, y compris l'application | Rien, juste l'utilisation | Une messagerie en ligne, un logiciel accessible par navigateur |

Plus une catégorie est en haut de ce tableau, plus l'utilisateur garde de contrôle (et de responsabilité) sur ce qui tourne ; plus elle est en bas, plus c'est le fournisseur qui gère tout, au prix de moins de contrôle.

## Le cloud et l'IA : louer de la puissance de calcul à la demande

Entraîner un modèle de deep learning nécessite un ou plusieurs [GPU](/?c=infrastructure&p=cpu-vs-gpu) puissants : un matériel coûteux à l'achat, et rarement utilisé à pleine capacité en continu une fois l'entraînement terminé. Le cloud permet de louer cette puissance de calcul seulement pendant la durée réelle de l'entraînement, plutôt que d'investir dans du matériel dédié qui resterait ensuite largement inutilisé.

## Piège : où sont réellement stockées mes données ?

> **Piège :** supposer qu'une donnée envoyée "dans le cloud" reste sous le même contrôle et les mêmes règles légales que si elle restait dans les locaux de l'entreprise. Elle est en réalité stockée sur du matériel appartenant à un tiers, parfois situé dans un pays différent, avec ses propres règles en matière de protection des données.
>
> **Bonne pratique :** vérifier les conditions contractuelles et la localisation géographique des données avant d'envoyer une donnée sensible à un service cloud (voir la [classification des données avant envoi](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)), plutôt que de le supposer neutre par défaut.

## Piège : le coût peut échapper au contrôle habituel

> **Piège :** oublier d'éteindre une ressource cloud louée après usage (une machine virtuelle, un GPU réservé). La facturation continue tant que la ressource tourne, même inutilisée : aucune alerte "erreur" ne se déclenche puisque techniquement, tout fonctionne comme prévu.
>
> **Bonne pratique :** mettre en place des alertes de coût, voire une extinction automatique des ressources inutilisées, plutôt que de compter sur une vérification manuelle régulière.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le cloud consiste à louer des machines distantes gérées par un fournisseur tiers, plutôt que de posséder son propre matériel. IaaS, PaaS et SaaS se distinguent par ce que le fournisseur gère à la place de l'utilisateur. |
| **Outils utilisables** | Les principaux fournisseurs (AWS, Google Cloud, Azure) proposent des tableaux de bord de coût et des alertes configurables. |
| **Pièges à éviter** | Supposer qu'une donnée envoyée dans le cloud reste soumise aux mêmes règles qu'en interne. Laisser une ressource louée tourner inutilement après usage. |
| **Bonnes pratiques** | Vérifier la localisation et les conditions contractuelles avant d'envoyer une donnée sensible. Configurer des alertes de coût ou une extinction automatique des ressources inutilisées. |
