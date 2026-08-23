---
order: 4
---

# L'escalade de privilèges

L'**escalade de privilèges** consiste, pour un attaquant déjà présent sur un système avec un accès limité, à obtenir des droits plus élevés que ceux initialement accordés (typiquement : passer d'un compte utilisateur normal à `root` sous Linux, ou administrateur sous Windows). C'est une étape presque systématique après une première intrusion : un accès initial passe rarement par un compte déjà tout-puissant.

## Verticale ou horizontale

| Type | Ce qui change |
|---|---|
| **Verticale** | Un accès limité devient un accès de niveau supérieur (utilisateur normal → root) |
| **Horizontale** | Un accès reste au même niveau de droits, mais change de compte (compte utilisateur A → compte utilisateur B) |

Ce même vocabulaire s'applique côté web au [contrôle d'accès défaillant](/?c=cybersecurite&p=types-de-failles) : accéder à la commande d'un autre client (horizontal) diffère d'accéder au panneau d'administration depuis un compte client (vertical).

## Causes fréquentes

| Cause | Exemple |
|---|---|
| **Permissions de fichier trop larges** | Un fichier de configuration contenant un mot de passe, lisible par tous les utilisateurs du système |
| **Binaire SUID mal configuré** | Sous Linux, un programme marqué SUID (*Set User ID*) s'exécute avec les droits de son propriétaire plutôt que ceux de qui le lance ; s'il permet d'exécuter une commande arbitraire (ex : un éditeur de texte lançable en SUID root), il devient un raccourci vers un accès root |
| **Service vulnérable non corrigé** | Un service tournant déjà avec des droits élevés (ex : un serveur système) contient une faille (voir [Corruption mémoire](/?c=securite&s=securite-offensive&p=corruption-memoire)) exploitable pour exécuter du code avec ses propres droits |
| **Tâche planifiée mal protégée** | Une tâche automatique exécutée périodiquement par `root`, qui lance un script modifiable par un utilisateur non privilégié |

```text
Acces initial (utilisateur normal, droits limites)
        |
        v
Recherche de mauvaises configurations, binaires SUID, services vulnerables...
        |
        v
Exploitation d'une des causes ci-dessus
        |
        v
Acces avec des droits plus eleves (ideal pour l'attaquant : root/administrateur)
```

## Le lien avec le contrôle d'accès déjà couvert

Ce chapitre regarde le même problème que [RBAC et ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac) et [Authentification vs autorisation](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation), mais depuis le point de vue de l'attaquant plutôt que de la conception défensive : ces deux chapitres expliquent comment modéliser correctement les droits d'un système, l'escalade de privilèges est ce qui se produit quand ce modèle est mal appliqué en pratique (un binaire SUID oublié, une permission de fichier trop permissive) plutôt que mal conçu sur le papier.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'escalade de privilèges transforme un accès limité en accès plus élevé (verticale) ou en accès à un autre compte de même niveau (horizontale), typiquement via une permission trop large, un binaire SUID mal configuré, un service vulnérable, ou une tâche planifiée mal protégée. |
| **Outils utilisables** | Un script d'audit automatique des mauvaises configurations connues (permissions, binaires SUID) sur un système de laboratoire. |
| **Pièges à éviter** | Considérer l'accès initial comme la fin de l'attaque : c'est souvent le point de départ de l'escalade. |
| **Bonnes pratiques** | Appliquer le principe de moindre privilège (déjà posé dans [Les grandes familles de failles](/?c=cybersecurite&p=types-de-failles)) à chaque compte et chaque binaire, pas seulement aux comptes utilisateurs eux-mêmes. |
