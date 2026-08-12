---
order: 11
---

# Issues et gestion de projet sur GitHub

Une **issue** est un ticket : un bug signalé, une fonctionnalité demandée, une question, discutée dans des commentaires attachés à ce ticket. Contrairement à une [pull request](/?c=git&p=pull-requests-github), une issue ne contient aucun code : c'est une discussion structurée, indépendante de tout commit.

| | Issue | Pull request |
|---|---|---|
| Contient du code ? | Non : uniquement du texte et des commentaires | Oui : une branche avec des commits réels |
| Sert à | Signaler, discuter, planifier | Proposer et relire un changement concret |
| Peut être liée à | Une ou plusieurs pull requests qui la referment | Une ou plusieurs issues qu'elle referme |

## Organiser les issues : labels, assignés, milestones

Sur un projet actif, des dizaines d'issues ouvertes en parallèle deviennent vite difficiles à suivre sans organisation explicite :

| Outil | Rôle |
|---|---|
| **Label** (étiquette) | Catégorise une issue par mot-clé coloré (`bug`, `documentation`, `priorité haute`...), filtrable dans la liste des issues |
| **Assigné** (*assignee*) | Désigne qui est responsable de traiter cette issue précise |
| **Milestone** (jalon) | Regroupe plusieurs issues et pull requests autour d'un objectif commun (une version, une date d'échéance), avec une barre de progression basée sur celles déjà fermées |

> **Bonne pratique :** garder un jeu de labels restreint et cohérent (type de problème, priorité, statut) plutôt que d'en créer un nouveau à chaque besoin ponctuel : un label rarement réutilisé perd son utilité de filtrage.

## Les modèles d'issue (*issue templates*)

Un modèle d'issue pré-remplit le formulaire de création avec les sections attendues (étapes pour reproduire un bug, comportement attendu vs observé, environnement...), configuré une fois par les mainteneurs du dépôt. Sans modèle, chaque personne qui ouvre une issue décide elle-même de ce qu'elle y met, avec un risque réel de détails manquants (version du logiciel, étapes de reproduction) qui ralentit le traitement.

> **Piège :** laisser un dépôt actif sans modèle d'issue, en espérant que chaque rapport de bug contienne naturellement les informations nécessaires. En pratique, une issue sans structure imposée oublie souvent l'information la plus utile pour la diagnostiquer.
>
> **Bonne pratique :** configurer au moins un modèle "rapport de bug" et un modèle "demande de fonctionnalité" dès qu'un dépôt accepte des contributions externes.

## GitHub Projects : une vue Kanban par-dessus les issues

**GitHub Projects** est un tableau (souvent de style **Kanban** : des colonnes comme "À faire" / "En cours" / "Terminé", chaque carte déplacée d'une colonne à l'autre au fil de son avancement) qui regroupe des issues et des pull requests de un ou plusieurs dépôts, pour une vue d'ensemble de l'avancement d'un projet plutôt qu'une simple liste plate :

```text
À faire              En cours              Terminé
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Issue #12    │     │ Issue #9     │     │ Issue #3     │
│ Issue #15    │     │ PR #14       │     │ PR #7        │
└─────────────┘     └─────────────┘     └─────────────┘
```

Déplacer une carte d'une colonne à l'autre ne modifie ni l'issue ni la pull request elle-même : c'est une organisation visuelle indépendante, qui peut d'ailleurs regrouper des éléments venant de plusieurs dépôts différents dans un seul tableau.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Une issue suit un bug/une tâche/une discussion, sans code. Labels, assignés et milestones organisent un grand nombre d'issues. GitHub Projects offre une vue Kanban par-dessus les issues et pull requests, potentiellement de plusieurs dépôts. |
| **Outils utilisables** | Labels, assignés, milestones, modèles d'issue, GitHub Projects. |
| **Pièges à éviter** | Multiplier les labels ponctuels plutôt qu'un jeu restreint et cohérent. Laisser un dépôt actif sans modèle d'issue. |
| **Bonnes pratiques** | Garder un jeu de labels restreint. Configurer des modèles d'issue dès qu'un dépôt accepte des contributions externes. |
