---
order: 1
---

# Les rôles dans une équipe de développement

Un projet en entreprise implique rarement un seul type de personne : chacune des questions "quoi construire", "comment le construire" et "quand le livrer" relève d'un rôle différent, et confondre ces rôles est une source fréquente de blocage.

## Qui fait quoi

| Rôle | Répond à la question | Responsabilité |
|---|---|---|
| **Product Owner (PO)** | Quoi construire ? | Priorise le [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) (la liste des besoins à traiter), représente le besoin métier ou client |
| **Chef de projet / Project Manager** | Quand le livrer ? | Planning, budget, délais, coordination entre équipes |
| **Tech Lead** | Comment le construire ? | Référence technique, arbitre les choix d'architecture |
| **Développeur** | - | Conçoit et écrit le code |
| **QA / Testeur** | Est-ce que ça marche vraiment ? | Vérifie le comportement avant la mise en production |
| **Scrum Master / Agile coach** | - | Facilite le processus, lève les blocages, sans autorité hiérarchique sur l'équipe |

> **Analogie :** construire une maison sépare aussi celui qui décide de ce que la maison doit permettre de faire (le futur habitant, comme le PO), celui qui planifie les délais et le budget du chantier (le chef de projet), et celui qui décide comment la structure tient debout (l'architecte, comme le Tech Lead). Confondre ces trois rôles mène à des décisions prises par la personne qui n'a pas l'information pour les prendre.

## Qui arbitre en cas de désaccord

Chaque rôle a le dernier mot sur son propre domaine : le PO priorise le "quoi" (une fonctionnalité peut attendre), le Tech Lead arbitre le "comment" (telle approche technique plutôt qu'une autre), le chef de projet gère le "quand" (un délai se négocie ou se déplace).

> **Piège :** laisser le flou sur "qui décide quoi" jusqu'à ce qu'un désaccord éclate. Découvrir en plein conflit que personne ne sait qui a le dernier mot rallonge la résolution du désaccord lui-même.
>
> **Bonne pratique :** clarifier explicitement, dès la formation de l'équipe, qui tranche sur les décisions métier, techniques et de planning, plutôt que de laisser cette question ouverte jusqu'au premier désaccord.

## Le Scrum Master n'est pas un chef

> **Piège :** confondre le Scrum Master avec un responsable qui distribue les tâches ou évalue les performances. Son rôle est de faciliter le processus (animer les rituels, retirer les blocages), pas de commander l'équipe : il n'a en général aucune autorité hiérarchique sur elle.
>
> **Bonne pratique :** s'adresser au Scrum Master pour débloquer un obstacle de processus (une réunion qui ne sert à rien, une dépendance qui traîne), pas pour obtenir une décision qui relève du PO ou du Tech Lead.

## QA et développeur : des vérifications complémentaires, pas redondantes

> **Piège :** un développeur qui livre sans jamais impliquer la QA, en pensant "ça compile et les tests unitaires passent, donc ça marche". Les tests automatisés vérifient ce qu'ils ont été écrits pour vérifier ; la QA (ou des tests plus larges) couvre aussi des scénarios d'usage réels que le développeur n'a pas pensé à tester lui-même.
>
> **Bonne pratique :** traiter la validation automatisée et la validation QA comme deux filets complémentaires, pas comme deux versions du même filet.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Product Owner (quoi), chef de projet (quand), Tech Lead (comment), développeur (construit), QA (vérifie), Scrum Master (facilite) : des rôles distincts qui répondent à des questions différentes sur un même projet. |
| **Outils utilisables** | Aucun outil spécifique : la clarté vient de définir explicitement qui décide quoi. |
| **Pièges à éviter** | Laisser le flou sur qui décide quoi jusqu'au premier désaccord. Confondre le Scrum Master avec un chef. Sauter la validation QA en se fiant uniquement aux tests automatisés. |
| **Bonnes pratiques** | Clarifier dès le départ qui a le dernier mot sur les décisions métier, techniques et de planning. Traiter tests automatisés et validation QA comme complémentaires. |
