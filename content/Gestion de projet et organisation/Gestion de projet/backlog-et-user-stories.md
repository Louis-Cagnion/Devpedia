---
order: 2
---

# Le backlog et les user stories

Une fois une [méthodologie choisie](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=methodologies-agile-scrum-kanban), reste une question concrète : comment décrire le travail à faire, pour qu'il soit compris de la même façon par toute l'équipe et priorisable au fil du temps ? Le **backlog** et les **user stories** répondent à cette question, au cœur des méthodologies agiles comme Scrum.

## Le backlog : une liste priorisée, jamais figée

Le **backlog** (« carnet de commandes ») est la liste de tout le travail restant à faire sur un produit : nouvelles fonctionnalités, corrections de bugs, améliorations techniques. Contrairement à un cahier des charges classique, il n'est jamais figé : des éléments s'y ajoutent, s'y suppriment ou changent de priorité en continu, à mesure que le produit et les besoins évoluent.

| Caractéristique | Ce que ça implique |
|---|---|
| **Priorisé** | Les éléments les plus importants ou les plus urgents sont en haut, ceux moins clairs ou moins prioritaires en bas |
| **Vivant** | Révisé en continu (souvent lors d'un rituel dédié, le *backlog refinement*), pas écrit une fois pour toutes |
| **De granularité variable** | Les éléments proches du haut sont détaillés et prêts à être développés ; ceux du bas restent volontairement vagues tant qu'ils ne sont pas sur le point d'être pris en charge |

> **Piège :** détailler en profondeur chaque élément du backlog dès sa création, y compris ceux qui ne seront traités que dans plusieurs mois. Un besoin détaillé trop tôt a de bonnes chances d'avoir changé avant d'être développé, rendant ce travail de rédaction inutile.
>
> **Bonne pratique :** ne détailler finement un élément du backlog que juste avant qu'il ne soit pris en charge, en gardant les éléments lointains volontairement approximatifs.

## La user story : décrire un besoin du point de vue de l'utilisateur

Une **user story** est une façon courte et structurée de décrire un élément du backlog, centrée sur le besoin de la personne qui utilisera la fonctionnalité plutôt que sur les détails techniques de son implémentation. Le format le plus répandu :

```text
En tant que [rôle],
je veux [action ou besoin],
afin de [bénéfice recherché].

Exemple :
En tant que cliente d'une boutique en ligne,
je veux recevoir un email de confirmation après ma commande,
afin de savoir qu'elle a bien été prise en compte.
```

Ce format oblige à toujours relier une fonctionnalité à un bénéfice concret pour quelqu'un : une story qui ne peut pas s'exprimer ainsi cache souvent une solution technique déguisée en besoin (« en tant que développeur, je veux migrer la base de données »), plutôt qu'un vrai besoin utilisateur.

> **Piège :** écrire des user stories du point de vue de l'équipe technique plutôt que de la personne qui utilisera réellement le produit. Une tâche purement technique (migration, refactoring) n'est pas une user story : elle se gère différemment (une tâche technique dans le backlog, sans forcer le format « en tant que »).
>
> **Bonne pratique :** si une story ne peut pas s'écrire naturellement du point de vue d'un utilisateur réel avec un bénéfice clair, ce n'est probablement pas une user story.

## Les critères d'acceptation : définir « terminé »

Une user story seule ne dit pas quand elle est réellement finie. Les **critères d'acceptation** listent les conditions précises et vérifiables qui doivent être remplies pour considérer la story comme terminée :

```text
User story : "En tant que cliente, je veux recevoir un email de
confirmation après ma commande, afin de savoir qu'elle a bien été
prise en compte."

Critères d'acceptation :
- L'email est envoyé dans les 5 minutes suivant la commande
- L'email contient le numéro de commande et le montant total
- Si l'envoi échoue, la commande n'est pas bloquée pour autant
```

Ces critères servent aussi de base aux [tests](/?c=tests&p=vocabulaire-qa-istqb) qui vérifieront que la fonctionnalité fonctionne comme prévu une fois développée.

## INVEST : six qualités d'une bonne user story

**INVEST** est un acronyme mnémotechnique qui résume les qualités attendues d'une user story bien formée :

| Lettre | Qualité | Signification |
|---|---|---|
| **I** | Indépendante | Peut être développée sans attendre qu'une autre story soit terminée en premier |
| **N** | Négociable | Décrit un besoin, pas une solution imposée : les détails d'implémentation restent à discuter |
| **V** | Valuable | Apporte une valeur clairement identifiable pour l'utilisateur ou le métier |
| **E** | Estimable | Suffisamment claire pour que l'équipe puisse estimer l'effort qu'elle demande |
| **S** | Small | Assez petite pour être développée en quelques jours, pas plusieurs semaines |
| **T** | Testable | Ses critères d'acceptation permettent de vérifier objectivement si elle est terminée |

Une story trop grosse ou trop floue pour respecter ces critères se découpe généralement en plusieurs stories plus petites, chacune apportant sa propre valeur indépendante.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le backlog est une liste priorisée et vivante de tout le travail restant. Une user story décrit un besoin du point de vue de l'utilisateur (« en tant que... je veux... afin de... »), complétée par des critères d'acceptation vérifiables. INVEST résume les qualités d'une bonne story. |
| **Outils utilisables** | Le format « en tant que / je veux / afin de » pour rédiger une story. La checklist INVEST pour évaluer sa qualité. |
| **Pièges à éviter** | Détailler en profondeur des éléments lointains du backlog. Écrire des stories du point de vue de l'équipe technique plutôt que de l'utilisateur. |
| **Bonnes pratiques** | Ne détailler finement un élément que juste avant sa prise en charge. Vérifier qu'une story s'écrit naturellement du point de vue d'un utilisateur réel. |
