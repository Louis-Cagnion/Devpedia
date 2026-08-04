---
order: 7
---

# Agents : boucle outil/réflexion et orchestration

Un LLM seul ne fait que produire du texte à partir de texte (voir [LLM en production](/?c=ia&p=llm-en-production)) : il ne peut ni consulter une base de données à jour, ni exécuter un calcul fiable, ni envoyer un email. Un **agent** est la façon de lever cette limite : on donne au modèle des **outils** qu'il peut décider d'appeler, et une boucle qui répète l'opération jusqu'à ce qu'il ait de quoi répondre.

## Donner un outil à un modèle : le function calling

Le mécanisme de base s'appelle le *function calling* (ou *tool use*) : le modèle reçoit, en plus du prompt, la description structurée d'une ou plusieurs fonctions disponibles (leur nom, ce qu'elles font, les paramètres qu'elles attendent) :

```json
{
  "name": "obtenir_meteo",
  "description": "Renvoie la meteo actuelle pour une ville donnee",
  "parameters": {
    "ville": { "type": "string", "description": "Nom de la ville" }
  }
}
```

Le modèle ne peut pas exécuter cette fonction lui-même — il ne fait que **décider** qu'elle serait utile ici, et produire les arguments à lui passer :

```json
{ "appel": "obtenir_meteo", "arguments": { "ville": "Montpellier" } }
```

C'est le code qui entoure le modèle qui reçoit cette décision, exécute réellement la fonction Python (ou l'appel HTTP, la requête SQL...) correspondante, et renvoie son résultat au modèle pour qu'il poursuive.

> **Note :** le modèle ne "sait" jamais vraiment ce qu'une fonction fait au-delà de sa description texte — une description imprécise ou ambiguë produit des appels avec les mauvais arguments aussi sûrement qu'une fonction mal documentée trompe un développeur humain qui ne lirait que sa signature.

## La boucle réflexion / action (ReAct)

Un agent est cette séquence répétée jusqu'à ce que le modèle juge avoir assez d'éléments pour répondre, plutôt qu'un simple aller-retour question/réponse :

```
1. Le modele recoit la question et l'historique
2. Il decide : repondre directement, OU appeler un outil
3. Si outil : le code l'execute, le resultat est ajoute a l'historique
4. Retour a l'etape 1, avec ce nouvel element de contexte
```

Ce patron, souvent nommé *ReAct* (*Reasoning + Acting*), permet des enchaînements à plusieurs étapes : chercher une information, l'utiliser pour affiner une seconde recherche, calculer un résultat intermédiaire, avant de composer la réponse finale — chaque étape s'appuyant sur le résultat réel de la précédente plutôt que sur une supposition du modèle.

## Les risques propres à une boucle pilotée par un modèle non déterministe

Une boucle classique s'arrête sur une condition connue à l'avance. Une boucle d'agent s'arrête quand le modèle **décide** de s'arrêter — une décision non garantie, prise par un système qui peut se tromper (voir les limites du chapitre [LLM en production](/?c=ia&p=llm-en-production)) :

- **Boucle non bornée** : sans plafond explicite sur le nombre de tours, un modèle qui n'arrive pas à conclure peut répéter des appels indéfiniment. Un plafond dur (nombre de tours, budget de tokens) est indispensable, au même titre qu'un timeout sur n'importe quel appel réseau.
- **Coût qui s'accumule silencieusement** : chaque tour de boucle est un appel LLM à part entière, facturé comme tel — un agent qui tourne 20 fois coûte 20 fois plus qu'une question directe, pour un gain qui n'est pas toujours proportionnel (voir le monitoring de coût dans [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)).
- **Actions irréversibles décidées par un système faillible** : un agent qui peut envoyer un email ou modifier une base de données peut aussi le faire à tort, sur la foi d'un raisonnement erroné. La confirmation humaine avant toute action à conséquence réelle (financière, destructrice, visible publiquement) n'est pas une prudence excessive, c'est la contrepartie du non-déterminisme du modèle qui décide — et, pour un système classé à risque élevé, une obligation légale explicite de la [réglementation européenne de l'IA](/?c=ia&p=reglementation-europeenne-ia), pas seulement une bonne pratique.

## Un agent, ou plusieurs qui se répartissent le travail ?

Deux architectures s'opposent pour des tâches complexes :

| | Un agent généraliste | Plusieurs agents spécialisés |
|---|---|---|
| Principe | Un seul modèle, beaucoup d'outils disponibles | Chaque agent a un rôle étroit (recherche, rédaction, vérification) et transmet son résultat au suivant |
| Avantage | Plus simple à construire et à suivre | Chaque agent reste concentré sur une tâche qu'il maîtrise mieux, plus facile à évaluer isolément |
| Inconvénient | Un prompt système qui grossit avec chaque outil ajouté, jusqu'à diluer l'attention du modèle | Coordination à concevoir explicitement (qui parle à qui, dans quel ordre, que faire si un agent échoue) |

Le choix suit la même logique qu'ailleurs en architecture logicielle : un seul agent généraliste suffit tant que la tâche reste bornée ; la spécialisation se justifie quand la complexité (nombre d'outils, longueur du raisonnement) commence à dégrader la fiabilité d'un agent unique.
