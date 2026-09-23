---
order: 6
---

# Construire avec un modèle de décision structurée : la méthode en sept étapes

Les chapitres précédents détaillent chaque brique ([primitives](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul), [état et fan-out](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles), [confiance](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree), [scoring composite et routage](/?c=ia&s=modeles-de-decision-structuree&p=patterns-de-composition)). Ce chapitre les assemble en une méthode ordonnée pour concevoir un système complet.

## Le principe directeur : le code garde le contrôle

L'idée centrale : **le code conserve le contrôle du déroulement (le flux)**, et le modèle de décision structurée ne traite que des décisions étroites à l'intérieur de ce flux. Ceci diffère d'un [agent](/?c=ia&s=nlp-llm&p=agents) autonome, où c'est le modèle lui-même qui décide de l'enchaînement des étapes : ici, l'enchaînement reste écrit à l'avance en code, seul le contenu de chaque décision ponctuelle est confié au modèle.

## Les sept étapes

```text
1. Code pour le    2. Decomposer     3. Structurer      4. Decomposer
   deterministe -> l'etat d'entree -> l'etat d'entree ->  les questions
                                                                |
                                                                v
7. Combiner en <- 6. Tout poser  <- 5. Structurer les <--------+
   code              en parallele    questions
```

| Étape | Ce qu'elle fait |
|---|---|
| 1. Privilégier le code pour le déterministe | Garder en logiciel classique toute règle déjà fiable ; ne confier au modèle que le jugement qui a réellement besoin de contexte |
| 2. Décomposer l'état d'entrée | Ne transmettre que le contexte pertinent au jugement demandé, jamais tout ce qui est disponible |
| 3. Structurer l'état d'entrée | Utiliser un JSON imbriqué pour l'état, avec des chemins explicites entre accents graves si l'état est imbriqué (ex : `` `ticket.messages[0].texte` ``) |
| 4. Décomposer les questions | Fragmenter un jugement large en plusieurs questions atomiques et explicites plutôt qu'une seule question qui cache plusieurs décisions : le concept le plus important de la méthode |
| 5. Structurer les questions | Ajouter de la structure aux instructions et critères (plutôt qu'une simple chaîne) dès qu'une consigne mérite d'être décomposée, par exemple des critères contrastés pour une question Choice |
| 6. Poser toutes les questions en parallèle | Voir le [fan-out spéculatif](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles#le-pattern-du-fan-out-speculatif) |
| 7. Combiner les réponses en code | Par une formule pondérée (voir le [scoring composite](/?c=ia&s=modeles-de-decision-structuree&p=patterns-de-composition#scoring-composite-combiner-des-dimensions-independantes)) ou par un routage selon la confiance (voir la [confiance calibrée](/?c=ia&s=modeles-de-decision-structuree&p=confiance-calibree#trois-seuils-trois-comportements)) |

### Étape 1 : ce qui reste au code, ce qui va au modèle

| Reste en code (déterministe) | Va au modèle (jugement contextuel) |
|---|---|
| Une règle métier fixe ("si le montant dépasse X, bloquer") | Estimer si un texte exprime de la frustration |
| Un calcul, une recherche en base | Classer une intention à partir d'un message en langage naturel |
| L'enchaînement des étapes du programme | Une décision qui dépend de nuances de langage |

> **Piège :** confier au modèle une règle qui pourrait s'exprimer comme une condition simple en code (ex : comparer deux nombres). Un modèle de décision structurée n'est ni plus fiable ni plus rapide qu'une comparaison directe pour ce genre de cas, et coûte inutilement un appel réseau.
>
> **Bonne pratique :** ne réserver le modèle qu'aux jugements qui nécessitent réellement une compréhension du contenu (langage naturel, nuance contextuelle), jamais à une règle déjà exprimable directement en code.

### Étapes 2 et 3 : décomposer l'état, le structurer

Ne transmettre que le contexte pertinent au jugement demandé (étape 2), puis structurer cet état en JSON imbriqué avec un chemin explicite (`` `support.tickets[0].message` ``) dès que ça lève une ambiguïté sur ce qu'une question évalue exactement (étape 3).

### Étape 4 : décomposer les questions, le concept le plus important

"Poser un seul jugement rapide par question" reste la règle centrale de toute la méthode : une tâche multi-facteurs se découpe en plusieurs questions atomiques, combinées ensuite en code (étape 7), jamais en une seule question qui déciderait de tout à la fois. Une question large ("ce message est-il du spam ?") cache plusieurs jugements distincts ; les rendre explicites (demande-t-il un identifiant ? promet-il un gain inattendu ? crée-t-il une urgence artificielle ?) permet ensuite de les inspecter et de les pondérer séparément en code.

## Les propriétés attendues d'un modèle de décision structurée

Une fois la méthode appliquée, un système construit ainsi hérite de propriétés propres à cette famille de modèles :

| Propriété | Ce que ça signifie |
|---|---|
| Typé | La sortie respecte toujours le schéma fourni, jamais de format invalide à corriger après coup |
| Parallèle | Chaque question s'évalue indépendamment, sans contexte caché entre elles |
| Comparable | Les réponses sont triables et permettent des conditions, seuils et comparaisons directement en code |
| Rapide | De l'ordre de 100 ms par requête, très inférieur à un LLM génératif comparable |
| Calibré | Les probabilités reflètent une fréquence réelle plutôt qu'une confiance excessive, grâce à un entraînement dédié (le [chapitre suivant](/?c=ia&s=modeles-de-decision-structuree&p=entrainement-rlcd) détaille cette méthode d'entraînement) |
| Stable | Des réponses cohérentes d'une exécution à l'autre sur un même état |

## Exemple intégré : le triage de tickets

Le workflow qui traverse tous les chapitres de cette partie : un ticket support (état structuré et chemins explicites, étapes 2 et 3) donne lieu à sept questions indépendantes et atomiques de type Choice/Score/Noul (étape 4), posées en une seule requête (étape 6). Le code combine ensuite ces signaux (étape 7, ex : un score composite de spam) et route la décision finale selon la catégorie et la confiance obtenues (étape 7 également), sans jamais confier au modèle la décision d'enchaînement elle-même (étape 1).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Construire avec un modèle de décision structurée suit sept étapes ordonnées : garder le déterministe en code, décomposer puis structurer l'état, décomposer puis structurer les questions, les regrouper en parallèle, combiner les réponses en code. Le résultat est typé, parallèle, comparable, rapide, calibré et stable. |
| **Outils utilisables** | Un état JSON avec chemins explicites ; des questions Choice/Score/Noul atomiques et structurées ; du code de combinaison et de routage. |
| **Pièges à éviter** | Confier au modèle une règle déjà exprimable comme une condition simple en code. Poser une question large qui cache plusieurs jugements distincts. |
| **Bonnes pratiques** | Réserver le modèle aux jugements qui nécessitent une compréhension du langage ou du contexte ; garder toute règle déterministe en code classique ; décomposer chaque jugement large en questions atomiques. |
