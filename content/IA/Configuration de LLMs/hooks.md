---
order: 1
---

# Les hooks : automatiser un agent LLM à des points précis de son cycle de vie

Un [assistant agentique](/?c=ia&s=applications-llm&p=assistant-agentique-terminal) tourne, tour après tour, sur une [boucle outil/réflexion](/?c=ia&s=nlp-llm&p=agents) : il reçoit une requête, décide d'appeler un outil ou non, reçoit un résultat, recommence. Cette boucle est exécutée par un programme (l'application ou l'outil en ligne de commande qui héberge l'agent), pas par le modèle lui-même : ce programme est le **harnais**. Un **hook** est un morceau de code que le harnais exécute lui-même à un point précis de cette boucle, sans jamais passer par le modèle : il tourne toujours, que le modèle y pense ou non. Ce chapitre explique ce mécanisme comme un pattern général de configuration des LLM, avec un agent en ligne de commande comme illustration concrète (Claude Code sert d'exemple, mais le principe se retrouve, sous d'autres noms, dans la plupart des outils agentiques).

## Le problème : une instruction dans le prompt n'est jamais garantie

Demander au modèle de faire quelque chose systématiquement ("relis toujours le fichier avant de le modifier", "préviens-moi avant toute suppression") reste une simple requête adressée à un système probabiliste (voir les [limites d'un LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)) : rien ne force son exécution.

| | Instruction dans le prompt | Hook |
|---|---|---|
| Qui l'exécute | Le modèle, s'il choisit de la suivre | Le harnais, en dehors du modèle |
| Garantie d'exécution | Aucune : peut être oubliée, contournée, diluée par un contexte long | Systématique : le code tourne à chaque occurrence du point d'ancrage |
| Peut être ignorée par une donnée manipulée (*[prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection)*) | Oui | Non : elle ne passe jamais par le raisonnement du modèle |

## Le principe : un déclencheur, une action, hors du contrôle du modèle

Le mécanisme reprend l'idée d'un [déclencheur qui démarre une action](/?c=infrastructure-devops&s=automatisation&p=automatisation-workflow) (un email reçu déclenche un workflow) ou d'un [`addEventListener` sur une page web](/?c=langages&s=javascript&p=dom-et-evenements) (un clic déclenche une fonction) : un événement survient, une fonction s'exécute en réaction. Ici, l'événement n'est plus une action utilisateur ni un email, mais un point précis du cycle de vie de l'agent.

```text
Événement du cycle de vie de l'agent
        │
        ▼
   ┌─────────┐
   │  Hook   │  ← code écrit par le développeur, pas par le modèle
   └─────────┘
        │
        ▼
Décision : laisser passer / bloquer / modifier / ajouter du contexte
```

## Les points d'ancrage typiques d'un agent

Les noms exacts varient d'un outil à l'autre, mais les mêmes moments reviennent partout :

| Point d'ancrage (nom générique) | Se déclenche | Exemple d'usage |
|---|---|---|
| Démarrage de session | Au lancement ou à la reprise d'une conversation | Charger un contexte projet, vérifier un état externe |
| Avant l'appel d'un outil | Juste avant que l'agent exécute une action (commande, écriture de fichier...) | Bloquer une commande dangereuse, demander une confirmation |
| Après l'appel d'un outil | Juste après le résultat d'une action | Formater automatiquement un fichier qui vient d'être modifié |
| Avant l'envoi au modèle | Juste avant que le prompt parte vers le modèle | Injecter une information à jour (date, état d'un système) |
| Fin de tour / de session | Quand l'agent s'arrête ou termine une réponse | Journaliser, notifier, sauvegarder un résumé |

## Anatomie d'un hook : entrée, décision, sortie

Un hook reçoit des données structurées ([JSON](/?c=infrastructure-devops&s=infrastructure&p=json)) décrivant l'événement, et répond de la même façon : c'est cette réponse qui pilote la suite.

```text
// Entrée reçue par le hook (exemple : avant l'appel d'un outil)
{ "tool_name": "delete_file", "tool_input": { "path": "config/prod.yaml" } }

// Sortie possible du hook : bloque l'action et explique pourquoi
{ "decision": "block", "reason": "Suppression d'un fichier de config sans confirmation explicite" }
```

| Décision possible | Effet |
|---|---|
| Laisser passer | L'agent continue normalement, rien ne change |
| Bloquer | L'action ne se produit jamais, l'agent reçoit la raison du refus |
| Modifier | L'entrée de l'action est réécrite avant exécution |
| Ajouter du contexte | Une information est injectée dans ce que voit le modèle, sans passer par une action de l'agent |

## Les pièges

| Piège | Pourquoi c'est un problème |
|---|---|
| Hook lent et synchrone | Chaque occurrence du point d'ancrage attend la fin du hook : un hook mal écrit ralentit tout l'agent |
| Échec silencieux | Un hook qui plante sans remonter d'erreur laisse croire que l'automatisation a eu lieu, alors que rien ne s'est passé |
| Exécuter une donnée non fiable | Un hook qui construit une commande à partir d'une donnée venue de l'extérieur (fichier, page web, résultat d'outil) ouvre la même faille qu'une [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection) : la donnée peut piloter le hook lui-même |
| Confondre garantie de hook et instruction de prompt | Croire qu'écrire une règle dans le prompt système offre la même fiabilité qu'un hook, alors que seul le second est réellement toujours exécuté |

## Bonnes pratiques

| Bonne pratique | Pourquoi |
|---|---|
| Fixer un délai maximal (*timeout*) court | Évite qu'un hook bloqué ne gèle tout l'agent |
| Échouer bruyamment, jamais en silence | Une erreur de hook doit être visible, comme n'importe quelle [erreur qu'on journalise](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) |
| Limiter le hook au strict nécessaire | Moins un hook fait de choses, moins il offre de [surface d'attaque](/?c=ia&s=nlp-llm&p=prompt-injection) en cas de donnée manipulée, et moins il a de façons différentes d'échouer |
| Tester le hook isolément avant de le brancher | Vérifier son comportement avec une entrée simulée, sans dépendre d'un vrai tour d'agent pour le déclencher |

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un hook est du code exécuté par le harnais, pas par le modèle, à un point précis du cycle de vie d'un agent : il tourne toujours, contrairement à une instruction de prompt. |
| **Pièges à éviter** | Hook lent et bloquant, échec silencieux, exécution d'une donnée non fiable, confondre garantie de hook et simple instruction. |
| **Bonnes pratiques** | Timeout court, échec visible, périmètre minimal, test isolé avant intégration. |
