---
order: 7
---

# Découper un projet en graphe de dépendances

Une fois un [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) rempli de tâches, une question reste ouverte avant même de les [estimer](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=estimation) : dans quel ordre les faire ? Une tâche ne peut pas toujours démarrer n'importe quand : elle dépend parfois du résultat d'une autre.

## Le graphe de dépendances (DAG)

Un **graphe orienté acyclique** (*DAG*, *Directed Acyclic Graph*) modélise ces dépendances : chaque tâche est un nœud, et une flèche relie une tâche à celle qui doit être terminée avant qu'elle puisse démarrer. C'est exactement la structure qu'un outil comme `make` construit à partir d'un Makefile, pour savoir quels fichiers compiler avant quels autres, et lesquels peuvent l'être en parallèle.

Trier ce graphe pour en déduire un ordre d'exécution valide s'appelle un **tri topologique** (*topological sort*) : un ordre où chaque tâche apparaît après toutes celles dont elle dépend.

## Toutes les tâches ne sont pas sur une seule ligne

L'erreur la plus fréquente en construisant ce graphe à la main est de imaginer une seule liste linéaire ("d'abord A, puis B, puis C...") alors que certaines tâches n'ont en réalité aucune dépendance entre elles.

```text
Modele en une seule ligne (souvent faux) :
A -> B -> C -> D

Modele en graphe (souvent plus proche de la realite) :
A -> C -> D
B -> C
(A et B sont independantes, executables en parallele ;
 elles convergent seulement au niveau de C)
```

Deux tâches sans dépendance l'une envers l'autre peuvent être menées dans n'importe quel ordre, voire en parallèle si plusieurs personnes y travaillent : les considérer à tort comme séquentielles gonfle artificiellement la durée perçue du projet et masque le travail réellement parallélisable.

Pour identifier ces branches, la question à se poser pour chaque tâche est : *"qu'est-ce qui doit déjà exister ou être terminé avant que je puisse ne serait-ce que commencer celle-ci ?"*, plutôt que *"qu'est-ce que je préfère faire avant ?"* (une question de préférence, pas de dépendance réelle).

> **Piège :** confondre une dépendance réelle (la tâche B a besoin du résultat produit par A pour fonctionner) avec un simple ordre de préférence (faire A avant B "parce que ça semble plus logique"). Seule la première justifie de bloquer B tant que A n'est pas fini.
>
> **Bonne pratique :** repérer explicitement les points de convergence, les tâches qui ont besoin du résultat de plusieurs branches indépendantes à la fois. Ce sont elles qui indiquent où des branches menées en parallèle doivent se rejoindre.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un graphe orienté acyclique (DAG) modélise les dépendances réelles entre tâches ; un tri topologique en déduit un ordre d'exécution valide. Plusieurs tâches indépendantes forment des branches parallèles qui ne convergent qu'à une tâche commune plus tard. |
| **Outils utilisables** | Le DAG et le tri topologique, la même structure que `make` utilise pour ordonnancer une compilation. |
| **Pièges à éviter** | Modéliser tout le projet comme une seule ligne séquentielle alors que certaines tâches sont indépendantes. Confondre une dépendance réelle avec un simple ordre de préférence. |
| **Bonnes pratiques** | Se demander, par tâche, ce qui doit réellement être terminé avant de pouvoir démarrer. Repérer explicitement les points de convergence entre branches parallèles. |
