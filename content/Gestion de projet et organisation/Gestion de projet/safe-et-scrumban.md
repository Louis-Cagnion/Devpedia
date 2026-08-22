---
order: 5
---

# SAFe et Scrumban : les cas hybrides

Le chapitre sur les [méthodologies](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban) a présenté Scrum et Kanban comme deux approches distinctes, chacune adaptée à un type de travail différent. Deux besoins fréquents ne rentrent pourtant dans aucune des deux cases : coordonner Scrum à grande échelle, sur plusieurs équipes, et gérer un flux qui mélange travail planifié et urgences imprévues. Ce chapitre couvre les réponses les plus courantes à ces deux besoins.

## Le problème du passage à l'échelle

Scrum fonctionne bien pour une équipe unique, mais un produit complexe implique souvent plusieurs équipes travaillant sur le même produit, avec des dépendances entre elles (une équipe attend une API que développe une autre équipe, par exemple). Scrum seul ne définit rien pour coordonner ce cas : chaque équipe pourrait avoir ses propres sprints, sans aucune synchronisation entre elles.

## SAFe : synchroniser plusieurs équipes Scrum

**SAFe** (*Scaled Agile Framework*) est un cadre qui étend les principes agiles à plusieurs équipes travaillant ensemble sur un même produit. Son mécanisme central : synchroniser les sprints de toutes les équipes sur un rythme commun, appelé **Program Increment** (PI), généralement 8 à 12 semaines regroupant plusieurs sprints.

```text
Program Increment (10 semaines, 5 sprints de 2 semaines) :

Équipe A : Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
Équipe B : Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
Équipe C : Sprint 1 - Sprint 2 - Sprint 3 - Sprint 4 - Sprint 5
           └── toutes commencent et terminent en même temps ──┘

PI Planning (avant le PI) : toutes les équipes se réunissent pour
identifier les dépendances entre elles avant de démarrer
```

Le **PI Planning**, une réunion qui rassemble toutes les équipes avant le début d'un Program Increment, sert précisément à détecter ces dépendances à l'avance (« l'équipe A a besoin que l'équipe B livre telle fonctionnalité avant sa propre sprint 3 »), plutôt que de les découvrir en cours de route.

> **Piège :** adopter SAFe pour une seule équipe, ou pour un produit sans réelle dépendance entre équipes. SAFe ajoute une couche de coordination (rôles supplémentaires, réunions à plus grande échelle) qui n'apporte rien sans un vrai besoin de synchroniser plusieurs équipes entre elles.
>
> **Bonne pratique :** réserver SAFe (ou un cadre de mise à l'échelle équivalent) aux cas où plusieurs équipes travaillent réellement sur un même produit avec des dépendances entre elles ; une seule équipe reste mieux servie par Scrum ou Kanban seuls.

## Scrumban : un flux continu avec des repères Scrum

**Scrumban** combine le flux continu de Kanban (pas de sprints fixes, une limite de travail en cours) avec certains repères ponctuels empruntés à Scrum (une réunion de planification régulière, une rétrospective périodique), sans forcer un découpage strict en sprints.

```text
Kanban pur :          flux continu, limite de travail en cours,
                       aucun repère temporel imposé

Scrumban :             flux continu (comme Kanban), + une
                       planification et une rétrospective à
                       intervalle régulier (empruntées à Scrum)

Scrum pur :            sprints fixes, tout le rituel Scrum complet
```

Ce mélange convient particulièrement à une équipe dont le travail combine du planifié (des fonctionnalités prévues à l'avance) et de l'imprévu (du support, des incidents urgents) : le flux continu de Kanban absorbe naturellement l'imprévu, tandis que les repères ponctuels de Scrum gardent un rythme de réflexion collective régulier.

> **Piège :** croire que Scrumban est une version « allégée » de Scrum qu'on peut appliquer par défaut sans réfléchir. Scrumban répond à un besoin précis (flux mixte planifié/imprévu) ; l'appliquer à un travail entièrement planifiable n'apporte rien par rapport à Scrum classique, avec la même explication déjà vue au chapitre sur les méthodologies (choisir selon la nature du travail, pas par habitude).
>
> **Bonne pratique :** choisir Scrumban spécifiquement quand le travail mélange réellement planifié et imprévu ; sinon, Scrum pur (tout planifiable) ou Kanban pur (flux entièrement irrégulier) restent plus simples et suffisants.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | SAFe synchronise plusieurs équipes Scrum sur un rythme commun (Program Increment), avec un PI Planning pour détecter les dépendances à l'avance. Scrumban combine le flux continu de Kanban avec des repères ponctuels empruntés à Scrum, adapté à un travail qui mélange planifié et imprévu. |
| **Outils utilisables** | Le Program Increment et le PI Planning pour coordonner plusieurs équipes (SAFe). Une planification et une rétrospective à intervalle régulier sur un flux Kanban (Scrumban). |
| **Pièges à éviter** | Adopter SAFe sans réel besoin de coordonner plusieurs équipes dépendantes. Appliquer Scrumban par défaut à un travail entièrement planifiable. |
| **Bonnes pratiques** | Réserver SAFe aux cas de plusieurs équipes avec dépendances réelles. Choisir Scrumban seulement pour un flux qui mélange réellement planifié et imprévu. |
