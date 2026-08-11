---
order: 3
---

# Le cycle de vie d'un projet

Un projet traverse toujours les mêmes grandes étapes, de l'idée initiale jusqu'à son usage réel, que l'équipe travaille en [cascade ou en agilité](/?c=organisation-en-entreprise&p=methodologies-agile-scrum-kanban).

## Les étapes

```text
Recueil des besoins -> Spécification -> Développement -> Tests -> Déploiement -> Maintenance
```

- **Recueil des besoins** : comprendre ce que veut le client ou le métier, souvent flou au départ ("faciliter le suivi des commandes") avant d'être précisé.
- **Spécification** : formaliser ce besoin en tickets ou user stories exploitables (voir [Documentation et communication en équipe](/?c=organisation-en-entreprise&p=documentation-et-communication-equipe)).
- **Développement** : écrire le code qui répond à la spécification.
- **Tests** : vérifier que le comportement obtenu correspond bien au besoin, pas seulement que le code s'exécute sans erreur.
- **Déploiement** : mettre la version en production, souvent automatisé par un [pipeline CI/CD](/?c=ci-cd&p=pipeline-cicd).
- **Maintenance** : corriger les bugs découverts en usage réel, faire évoluer le produit ; généralement la phase la plus longue du cycle de vie complet.

## En cascade contre en agilité : une fois, ou en boucle

En cascade, ces étapes se déroulent une seule fois, dans l'ordre, sur l'ensemble du projet. En agilité (Scrum ou Kanban), elles se répètent à chaque incrément : chaque sprint (ou chaque tâche, en Kanban) traverse sa propre mini-spécification, développement, tests et déploiement.

> **Piège :** sous-estimer la maintenance en la traitant comme un imprévu une fois le projet "livré". Un produit réellement utilisé génère des bugs découverts en usage réel et des demandes d'évolution en continu : ce n'est pas une anomalie, c'est la suite normale et attendue du cycle de vie.
>
> **Bonne pratique :** budgétiser du temps de maintenance dès la planification initiale (une part de capacité d'équipe réservée en continu, par exemple), plutôt que de la découvrir comme une surprise après la mise en production.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un projet traverse toujours recueil des besoins, spécification, développement, tests, déploiement et maintenance, une seule fois en cascade ou en boucle à chaque incrément en agilité. |
| **Outils utilisables** | Un pipeline CI/CD pour automatiser le déploiement ; des tickets/user stories pour formaliser la spécification. |
| **Pièges à éviter** | Traiter la maintenance comme un imprévu après la mise en production plutôt que comme une phase normale du cycle de vie. |
| **Bonnes pratiques** | Budgétiser du temps de maintenance dès la planification initiale. |
