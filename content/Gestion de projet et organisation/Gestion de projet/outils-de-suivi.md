---
order: 4
---

# Les outils de suivi

Un [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) priorisé et [estimé](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=estimation) a besoin d'un endroit où vivre concrètement, visible par toute l'équipe et mis à jour au fil de l'avancement. C'est le rôle d'un outil de suivi, qu'il soit numérique ou entièrement physique.

## Le ticket : l'unité de base

Un **ticket** représente une unité de travail identifiable : une user story, un bug, une tâche technique. Chaque ticket porte un titre, une description, un statut (à faire / en cours / terminé, ou plus de statuts selon le flux de l'équipe), et généralement une personne assignée.

```text
Ticket #142
Titre     : Ajouter un email de confirmation après commande
Statut    : En cours
Assigné à : Alice
Points    : 5
```

Ce vocabulaire ("ticket") vient à l'origine des outils de support technique (un problème signalé = un ticket), repris ensuite par les outils de gestion de projet pour désigner n'importe quelle unité de travail suivie individuellement.

## L'epic : regrouper des tickets liés

Un **epic** regroupe plusieurs tickets qui contribuent ensemble à un objectif commun trop large pour être un seul ticket : par exemple, "Refonte du parcours de paiement" peut regrouper les tickets "Ajouter le paiement par virement", "Simplifier le formulaire d'adresse", "Ajouter un récapitulatif avant validation".

```text
Epic : Refonte du parcours de paiement
  ├── Ticket #140 : Ajouter le paiement par virement
  ├── Ticket #141 : Simplifier le formulaire d'adresse
  └── Ticket #142 : Ajouter un récapitulatif avant validation
```

Un epic donne une vue d'ensemble (« où en est cet objectif plus large ? ») sans avoir à ouvrir chaque ticket individuellement, et aide à découper un objectif encore flou en tickets suffisamment petits pour être estimés et développés (voir le critère **S** de la checklist [INVEST](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories)).

## Le tableau (board) : visualiser le flux de travail

Un **tableau** (*board*) affiche les tickets sous forme de colonnes représentant les étapes du flux de travail, chaque ticket avançant de colonne en colonne à mesure qu'il progresse. C'est la représentation visuelle directe du principe déjà vu au chapitre sur les [méthodologies](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban) (tableau Kanban : À faire / En cours / Fait).

```text
┌─────────────┬─────────────┬─────────────┐
│   À faire   │  En cours   │    Fait     │
├─────────────┼─────────────┼─────────────┤
│ Ticket #143 │ Ticket #142 │ Ticket #140 │
│ Ticket #144 │             │ Ticket #141 │
└─────────────┴─────────────┴─────────────┘
```

Un tableau peut être entièrement **physique** (des post-it sur un mur, une pratique encore courante dans certaines équipes en présentiel) ou **numérique**, dans un outil dédié.

## Les outils numériques les plus répandus

| Outil | Particularité |
|---|---|
| **Jira** | Très configurable (types de tickets, flux personnalisés), répandu dans les grandes équipes ; réputé plus lourd à prendre en main |
| **Trello** | Simple, centré sur le tableau Kanban, adapté aux petites équipes ou aux besoins peu structurés |
| **Linear** | Pensé pour la rapidité d'usage et le clavier, populaire dans les équipes produit/dev |
| **Azure Boards** | Intégré à la suite Azure DevOps (voir le [chapitre dédié](/?c=infrastructure-devops&s=ci-cd&p=azure-devops-plateforme)), pratique quand le reste de la chaîne (code, CI/CD) est déjà sur cette plateforme |

Aucun de ces outils n'impose une méthodologie : le même outil peut afficher un tableau Kanban simple ou des sprints Scrum complets, selon la configuration choisie par l'équipe.

> **Piège :** choisir un outil très riche en fonctionnalités (Jira, par exemple) pour une petite équipe qui n'a besoin que d'un tableau simple. La configuration et la maintenance d'un outil trop complexe pour le besoin réel deviennent elles-mêmes une charge de travail.
>
> **Bonne pratique :** choisir un outil adapté à la taille et à la maturité de l'équipe plutôt que le plus complet disponible ; un tableau physique ou un outil simple suffit largement à une petite équipe qui débute.

## Un tableau reste un reflet, pas la réalité

Un ticket marqué "Fait" ne l'est réellement que si l'équipe met le tableau à jour de façon fiable et régulière ; un tableau qui ne reflète plus l'état réel du travail perd toute son utilité (personne ne peut plus s'y fier pour savoir où en est vraiment le projet).

> **Bonne pratique :** mettre à jour le statut d'un ticket au moment où le travail change réellement d'état, pas en différé ou en bloc en fin de journée, pour que le tableau reste une source fiable à tout instant.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un ticket est l'unité de travail de base (titre, statut, assignation) ; un epic regroupe plusieurs tickets liés à un objectif commun trop large pour un seul ticket. Un tableau (board) visualise le flux de travail en colonnes, physique ou numérique (Jira, Trello, Linear, Azure Boards). |
| **Outils utilisables** | Un tableau physique (post-it) pour une petite équipe en présentiel. Jira, Trello, Linear ou Azure Boards pour un suivi numérique, selon la taille et les besoins de l'équipe. |
| **Pièges à éviter** | Choisir un outil trop riche en fonctionnalités pour une petite équipe. Laisser un tableau se désynchroniser de l'état réel du travail. |
| **Bonnes pratiques** | Choisir un outil adapté à la taille et à la maturité de l'équipe. Mettre à jour le statut d'un ticket au moment où le travail change réellement d'état. |
