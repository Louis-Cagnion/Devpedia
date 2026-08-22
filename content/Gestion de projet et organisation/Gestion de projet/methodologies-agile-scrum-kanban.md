---
order: 1
---

# Méthodologies : Agile, Scrum, Kanban

Une fois les [rôles d'une équipe](/?c=organisation-en-entreprise&p=roles-equipe-developpement) posés, reste à organiser concrètement le travail dans le temps. Plusieurs méthodologies répondent à cette question, avec des compromis différents.

## Le cycle en cascade : tout planifier avant de commencer

Le **cycle en cascade** (*waterfall*) enchaîne des phases complètes les unes après les autres : spécification entière, puis développement entier, puis tests entiers, puis déploiement.

```text
Spécification -> Développement -> Tests -> Déploiement
   (100%)            (100%)        (100%)      (100%)
```

> **Piège :** découvrir un besoin mal compris pendant les tests, en toute fin de projet. Le développement entier ayant déjà été fait sur cette base, corriger revient à refaire une grande partie du travail déjà réalisé.
>
> **Bonne pratique :** livrer par petits incréments plutôt qu'en un seul bloc, pour détecter un besoin mal compris après quelques jours de travail, pas après plusieurs mois : c'est exactement le principe que l'agilité généralise.

## L'agilité : livrer petit et souvent

L'**agilité** (*Agile*) découpe le travail en incréments courts, chacun livrant quelque chose d'utilisable, pour détecter tôt les problèmes plutôt qu'à la fin d'un long cycle. Scrum et Kanban sont deux façons concrètes de structurer cette idée.

## Scrum : des sprints à durée fixe

**Scrum** organise le travail en **sprints** : des périodes de durée fixe (souvent deux semaines), chacune se terminant par un incrément livrable. Quatre rituels rythment chaque sprint :

| Rituel | Moment | Objectif |
|---|---|---|
| **Sprint planning** | Début de sprint | Choisir ce qui sera fait pendant ce sprint |
| **Daily standup** | Chaque jour | Synchroniser l'équipe en quelques minutes (fait hier, prévu aujourd'hui, blocages) |
| **Sprint review** | Fin de sprint | Montrer ce qui a été livré, recueillir un retour |
| **Rétrospective** | Fin de sprint | Ajuster la façon de travailler pour le sprint suivant |

## Kanban : un flux continu, sans sprint

**Kanban** n'a pas de période fixe : le travail avance en flux continu sur un tableau à colonnes (À faire / En cours / Fait), avec une **limite de travail en cours** (*WIP limit*) : un nombre maximal de tâches autorisées simultanément dans une même colonne.

```text
À faire          En cours (max 2)     Fait
---------        -----------------    --------
Tâche C          Tâche A              Tâche X
Tâche D          Tâche B              Tâche Y
Tâche E
```

> **Piège :** laisser chacun démarrer une nouvelle tâche dès qu'il a un moment libre, sans limite de travail en cours. Dix tâches commencées et aucune terminée n'avancent pas plus vite qu'une seule tâche à la fois : elles se bloquent mutuellement (attente de retour, dépendances croisées) sans qu'aucune ne progresse jusqu'au bout.
>
> **Bonne pratique :** fixer une limite de travail en cours par colonne, et la respecter même quand quelqu'un se retrouve sans tâche : terminer ce qui est déjà commencé avant d'en démarrer une nouvelle.

## Comparatif

| | Cascade | Scrum | Kanban |
|---|---|---|---|
| Planification | Entière, en amont | Par sprint | Continue, tâche par tâche |
| Rythme de livraison | Une fois, en fin de projet | Régulier (fin de chaque sprint) | Continu, au fil de l'eau |
| Adapté à | Besoin déjà entièrement connu et stable | Un produit avec des livraisons régulières planifiables | Un flux de demandes irrégulier (support, maintenance) |

> **Piège :** adopter le vocabulaire Scrum (sprint, daily) sans les rituels qui lui donnent son sens, en se contentant de renommer les réunions déjà existantes. Le vocabulaire seul ne change rien à la façon réelle de travailler.
>
> **Bonne pratique :** choisir une méthodologie selon la nature du travail (Scrum pour des livraisons régulières planifiées, Kanban pour un flux irrégulier), pas par effet de mode, et appliquer ses rituels pour de vrai plutôt que d'en garder seulement les noms.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le cycle en cascade planifie tout à l'avance ; l'agilité livre par petits incréments pour détecter les problèmes plus tôt. Scrum structure ces incréments en sprints avec des rituels fixes ; Kanban organise un flux continu limité par un plafond de travail en cours. |
| **Outils utilisables** | Un tableau Kanban (colonnes À faire / En cours / Fait) ; les quatre rituels Scrum (planning, daily, review, rétrospective). |
| **Pièges à éviter** | Découvrir un besoin mal compris en toute fin de cycle en cascade. Laisser le travail en cours s'accumuler sans limite. Adopter le vocabulaire Agile sans ses rituels réels. |
| **Bonnes pratiques** | Livrer par petits incréments pour détecter les problèmes tôt. Fixer et respecter une limite de travail en cours. Choisir la méthodologie selon la nature du travail, pas par mode. |
