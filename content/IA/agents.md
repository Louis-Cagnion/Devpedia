---
order: 8
---

# Agents : boucle outil/réflexion et orchestration

Un LLM seul ne fait que produire du texte à partir de texte (voir [LLM en production](/?c=ia&p=llm-en-production)) : il ne peut ni consulter une base de données à jour, ni exécuter un calcul fiable, ni envoyer un email. Un **agent** est la façon de lever cette limite : on donne au modèle des **outils** qu'il peut décider d'appeler, et une boucle qui répète l'opération jusqu'à ce qu'il ait de quoi répondre.

## Donner un outil à un modèle : le function calling

Le mécanisme de base s'appelle le *function calling* (ou *tool use*) : le modèle reçoit, en plus du prompt, la description structurée d'une ou plusieurs fonctions disponibles (leur nom, ce qu'elles font, les paramètres qu'elles attendent) — un simple document [JSON](/?c=infrastructure&p=json) :

```json
{
  "name": "obtenir_meteo",
  "description": "Renvoie la meteo actuelle pour une ville donnee",
  "parameters": {
    "ville": { "type": "string", "description": "Nom de la ville" }
  }
}
```

Le modèle ne peut pas exécuter cette fonction lui-même — il ne fait que **décider** qu'elle serait utile ici, et produire les arguments à lui passer, eux aussi en JSON :

```json
{ "appel": "obtenir_meteo", "arguments": { "ville": "Montpellier" } }
```

C'est le code qui entoure le modèle qui reçoit cette décision, exécute réellement la fonction (Python, l'appel [HTTP](/?c=infrastructure&p=api-et-http), la requête SQL...) correspondante, et renvoie son résultat au modèle pour qu'il poursuive.

> **Piège :** faire confiance aveuglément aux arguments produits par le modèle avant de les transmettre à la fonction réelle — le modèle ne "sait" jamais vraiment ce qu'une fonction fait au-delà de sa description texte, une description imprécise ou ambiguë produit des appels avec les mauvais arguments aussi sûrement qu'une fonction mal documentée trompe un développeur humain qui ne lirait que sa signature.
>
> **Bonne pratique :** valider les arguments reçus (types, valeurs attendues) avant d'exécuter la fonction réelle, exactement comme on validerait une entrée venue de n'importe quelle source non fiable.

## Un paramètre libre plutôt qu'une valeur fixe : d'où vient la variation

Le paramètre `ville` de l'exemple précédent ne prend ses valeurs que dans un ensemble limité et prévisible (des noms de villes). Rien n'oblige un paramètre à être aussi contraint : il peut tout aussi bien être un **texte libre que le modèle rédige lui-même**, comme une commande shell, une requête SQL ou un extrait de code :

```json
{
  "name": "executer_bash",
  "description": "Execute une commande shell et renvoie sa sortie standard",
  "parameters": {
    "commande": { "type": "string", "description": "La commande a executer" }
  }
}
```

La fonction qui exécute réellement cet outil (côté code, pas côté modèle) est aussi basique qu'elle en a l'air — le plus souvent un simple `subprocess.run(commande)` qui lance la chaîne reçue sans rien y comprendre. Elle ne change jamais entre deux appels. Ce qui varie, c'est le **contenu de `commande`**, composé à nouveau par le modèle à chaque appel en fonction de ce qu'il vient d'apprendre :

```
Tour 1 -> le modele genere : { "commande": "ls -la /var/log" }
       -> resultat : la liste des fichiers de log
Tour 2 -> le modele genere : { "commande": "grep ERROR /var/log/app.log | tail -20" }
       -> meme outil, meme fonction Python derriere, commande totalement differente
```

C'est exactement ce qui permet à un agent de produire des commandes bash différentes à chaque fois pour un même outil : la fonction exécutée ne change pas (elle ne fait qu'obéir), mais le texte qu'elle reçoit est rédigé à la volée par le modèle, comme un humain qui taperait une commande différente selon ce qu'il vient de voir s'afficher dans son terminal.

> **Piège :** un paramètre libre porte un risque bien plus élevé qu'un paramètre restreint — rien ne garantit que le texte généré par le modèle soit correct, ni même inoffensif. Une commande shell générée par le modèle peut contenir, par accident ou par manipulation (voir la [prompt injection](/?c=ia&p=prompt-injection)), les mêmes caractères spéciaux qui rendent une [injection de commande](/?c=shells&s=bash&p=variables) possible.
>
> **Bonne pratique :** traiter tout paramètre libre généré par un modèle avec la même méfiance qu'une entrée utilisateur non contrôlée — jamais l'interpoler aveuglément dans une commande ou une requête sans les mêmes précautions qu'ailleurs.

## La boucle réflexion / action (ReAct)

Avoir des outils disponibles (la section précédente) ne suffit pas, en soi, à faire un agent : un programme qui appelle une liste fixe de fonctions dans un ordre écrit à l'avance par un développeur reste un script classique, même s'il consulte un LLM à une étape. Ce qui fait qu'on parle d'un agent, c'est que **le modèle décide lui-même, à chaque étape, quoi faire ensuite** — quel outil appeler, avec quels arguments, ou s'il a fini — en fonction du résultat des étapes précédentes, sans qu'aucun humain n'ait écrit ce déroulé à l'avance. Un agent est donc cette séquence répétée jusqu'à ce que le modèle juge avoir assez d'éléments pour répondre, plutôt qu'un simple aller-retour question/réponse, ou qu'un script à séquence fixe :

```
1. Le modele recoit la question et l'historique
2. Il decide : repondre directement, OU appeler un outil
3. Si outil : le code l'execute, le resultat est ajoute a l'historique
4. Retour a l'etape 1, avec ce nouvel element de contexte
```

Ce patron, souvent nommé *ReAct* (*Reasoning + Acting*), permet des enchaînements à plusieurs étapes : chercher une information, l'utiliser pour affiner une seconde recherche, calculer un résultat intermédiaire, avant de composer la réponse finale — chaque étape s'appuyant sur le résultat réel de la précédente plutôt que sur une supposition du modèle.

## Les risques propres à une boucle pilotée par un modèle non déterministe

Une boucle classique s'arrête sur une condition connue à l'avance. Une boucle d'agent s'arrête quand le modèle **décide** de s'arrêter — une décision non garantie, prise par un système qui peut se tromper (voir les limites du chapitre [LLM en production](/?c=ia&p=llm-en-production)).

> **Piège :** une boucle non bornée. Sans plafond explicite sur le nombre de tours, un modèle qui n'arrive pas à conclure peut répéter des appels indéfiniment.
>
> **Bonne pratique :** imposer un plafond dur (nombre de tours, budget de tokens), au même titre qu'un timeout sur n'importe quel appel réseau.

> **Piège :** un coût qui s'accumule silencieusement. Chaque tour de la boucle est un appel LLM à part entière, facturé indépendamment (voir [le coût en production](/?c=ia&p=llm-en-production)) — répondre en un seul tour coûte le prix d'un appel, un agent qui a eu besoin de 20 tours pour arriver à sa réponse en a facturé 20, même si l'utilisateur n'a posé qu'une seule question. Le multiplicateur est en pratique pire qu'un simple x20 : à chaque tour, tout l'historique des tours précédents (question initiale, appels d'outils, résultats obtenus) est renvoyé en entrée du modèle pour qu'il garde le contexte — le prompt du tour 20 est donc bien plus gros que celui du tour 1, si bien que le coût total croît plus vite que le nombre de tours lui-même.
>
> **Bonne pratique :** surveiller le coût cumulé d'une boucle d'agent en production (voir le [monitoring de coût](/?c=ia&p=gestion-dun-llm)), pas seulement le coût moyen par question — le gain d'un agent n'est pas toujours proportionnel à ce surcoût.

> **Piège :** des actions irréversibles décidées par un système faillible. Un agent qui peut envoyer un email ou modifier une base de données peut aussi le faire à tort, sur la foi d'un raisonnement erroné.
>
> **Bonne pratique :** exiger une confirmation humaine avant toute action à conséquence réelle (financière, destructrice, visible publiquement) — pour un système classé à risque élevé, c'est une obligation légale explicite de la [réglementation européenne de l'IA](/?c=ia&p=reglementation-europeenne-ia), pas seulement une bonne pratique.

## Un agent, ou plusieurs qui se répartissent le travail ?

Deux architectures s'opposent pour des tâches complexes :

| | Un agent généraliste | Plusieurs agents spécialisés |
|---|---|---|
| Principe | Un seul modèle, beaucoup d'outils disponibles | Chaque agent a un rôle étroit (recherche, rédaction, vérification) et transmet son résultat au suivant |
| Avantage | Plus simple à construire et à suivre | Chaque agent reste concentré sur une tâche qu'il maîtrise mieux, plus facile à évaluer isolément |
| Inconvénient | Un prompt système qui grossit avec chaque outil ajouté, jusqu'à diluer l'attention du modèle | Coordination à concevoir explicitement (qui parle à qui, dans quel ordre, que faire si un agent échoue) |

Le choix suit la même logique qu'ailleurs en architecture logicielle : un seul agent généraliste suffit tant que la tâche reste bornée ; la spécialisation se justifie quand la complexité (nombre d'outils, longueur du raisonnement) commence à dégrader la fiabilité d'un agent unique.

## Coordonner plusieurs agents : les patrons courants

"Coordination à concevoir explicitement" recouvre en pratique quelques patrons récurrents, pas incompatibles entre eux :

| Patron | Principe | Adapté quand |
|---|---|---|
| **Enchaînement séquentiel** (*pipeline*) | La sortie de l'agent A devient l'entrée de l'agent B, dans un ordre fixe (ex : un agent "recherche" puis un agent "rédaction") | Les étapes sont connues à l'avance et s'exécutent toujours dans le même ordre |
| **Orchestrateur / travailleurs** | Un agent "orchestrateur" décompose la tâche, décide quel agent spécialisé appeler et dans quel ordre, puis assemble leurs résultats | L'ordre des étapes dépend de la tâche elle-même et ne peut pas être figé à l'avance |
| **État partagé** (*blackboard*) | Les agents ne se parlent pas directement : ils lisent et écrivent dans un espace commun (une base, un document partagé), chacun réagissant à ce que les autres y ont déposé | Plusieurs agents doivent collaborer sans dépendance stricte d'ordre, chacun contribuant quand il a de quoi le faire |

> **Piège :** avec un état partagé notamment, rien n'empêche deux agents d'agir sur la base d'informations devenues incohérentes entre elles (l'un a lu l'état avant que l'autre ne le modifie) — la même classe de problème qu'un accès concurrent à une ressource partagée en programmation classique.
>
> **Bonne pratique :** prévoir explicitement, pour chacun de ces trois patrons, que faire si un agent échoue ou produit un résultat inexploitable (un agent "vérificateur" intercalé, un contrôle de format en sortie de chaque étape) et qui a le dernier mot en cas d'écriture concurrente — les mêmes parades qu'un accès concurrent classique (verrouillage, un seul agent autorisé à écrire à la fois).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un agent donne des outils à un LLM (function calling) et le laisse décider lui-même, à chaque étape, quel outil appeler et quand s'arrêter (boucle ReAct) — par opposition à un script à séquence fixe écrit à l'avance. |
| **Outils utilisables** | Une description JSON de chaque outil disponible (nom, paramètres, description) ; un plafond de tours/budget pour borner la boucle. |
| **Pièges à éviter** | Faire confiance aveuglément aux arguments générés par le modèle. Un paramètre libre (commande, requête) traité sans les mêmes précautions qu'une entrée non fiable. Une boucle non bornée. Un coût qui s'accumule silencieusement. Une action irréversible décidée sans confirmation humaine. |
| **Bonnes pratiques** | Valider les arguments reçus avant d'exécuter un outil. Traiter tout paramètre libre généré par le modèle comme une entrée non fiable. Imposer un plafond dur sur le nombre de tours. Surveiller le coût cumulé d'une boucle. Exiger une confirmation humaine avant toute action à conséquence réelle. |
