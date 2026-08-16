---
order: 7
---

# LLM en production : cas d'usage et limites

Utiliser un LLM depuis une interface de chat et l'intégrer dans un produit sont deux exercices différents. Dans le premier cas, une réponse bancale se corrige en reformulant la question. Dans le second, la même réponse part sans supervision vers un utilisateur ou un système en aval : ce qui change complètement ce qu'il faut vérifier avant de choisir cette technologie pour une tâche donnée.

## Quand un LLM est le bon outil

Un LLM excelle sur les tâches dont l'entrée et la sortie sont du **langage** : comprendre un texte libre, le reformuler, en extraire une information, le traduire, le classer, en générer un nouveau à partir d'instructions. C'est précisément l'objectif sur lequel il a été entraîné (voir [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

| Cas d'usage | Adapté ? | Pourquoi |
|---|---|---|
| Extraire une information d'un texte non structuré (ex : un email) | Oui | C'est de la compréhension de langage naturel |
| Résumer un document long | Oui | Même raison, avec un compromis longueur/fidélité |
| Classer un ticket support par catégorie | Oui, souvent en overkill | Un modèle classique (régression logistique sur embeddings) fait aussi bien, moins cher, plus vite |
| Calculer une TVA ou une date d'échéance | Non | Un LLM prédit le token le plus plausible, pas le résultat exact d'un calcul (voir plus bas) |
| Décider d'une action irréversible seul (envoyer un virement) | Non, pas sans garde-fou humain | Réponse non déterministe, jamais garantie à 100% |

> **Note :** pour le calcul exact, la bonne architecture n'est pas de mieux prompter le LLM, c'est de lui donner un outil (une fonction [Python](/?c=langages-de-programmation&s=python&p=python), une requête [SQL](/?c=domain-specific-languages-dsl&p=sql)) qu'il appelle et dont il relaie le résultat (voir le chapitre [Agents](/?c=ia&s=nlp-llm&p=agents)). Le LLM reste excellent pour comprendre *qu'il faut* calculer une TVA et *avec quels nombres*, mais ne doit jamais être le calculateur lui-même.

## Les limites structurelles à connaître avant de concevoir

Ces limites ne sont pas des bugs qu'une meilleure version du modèle corrigera un jour : elles découlent directement de ce qu'est un LLM (voir son principe d'entraînement dans le chapitre [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)).

**Les hallucinations.** Un LLM ne "sait" rien au sens où une base de données le saurait : il génère le texte statistiquement le plus plausible compte tenu de ce qui précède. Rien dans son entraînement ne le pousse à dire *"je ne sais pas"* plutôt que d'inventer une réponse plausible : une citation, une référence légale, une fonction d'une bibliothèque qui n'existe pas. C'est la limite la plus dangereuse en production, car une hallucination est rédigée avec la même assurance qu'une réponse correcte.

> **Piège :** faire confiance à une réponse générée avec assurance sans la vérifier, en particulier sur un fait vérifiable (une citation, un numéro de loi, une fonction de bibliothèque). Le ton assuré d'une réponse n'est jamais un indicateur fiable de son exactitude.
>
> **Bonne pratique :** vérifier systématiquement, par une source indépendante ou un outil (voir [Agents](/?c=ia&s=nlp-llm&p=agents)), toute affirmation factuelle vérifiable produite par un LLM avant de la considérer fiable, d'autant plus si l'erreur a un coût réel.

**La fenêtre de contexte.** Un LLM ne lit pas un texte indéfiniment long : il est borné à un nombre maximal de tokens (le prompt et sa propre réponse compris). Au-delà, soit la requête échoue, soit le début du contexte est tronqué silencieusement selon l'implémentation. Un document de 500 pages ne peut pas être collé tel quel dans un prompt : c'est un des problèmes que le [RAG](/?c=ia&s=nlp-llm&p=rag) résout.

> **Piège :** dépasser la fenêtre de contexte sans s'en rendre compte : selon l'implémentation, le début du prompt peut être tronqué silencieusement, sans avertissement explicite. Le modèle répond alors sur la base d'un contexte partiel, sans que rien ne le signale.
>
> **Bonne pratique :** mesurer la taille réelle du prompt en tokens (voir [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)) avant l'envoi, et gérer explicitement un dépassement (résumé, RAG) plutôt que de laisser l'implémentation tronquer silencieusement.

**Le non-déterminisme.** Le même prompt, envoyé deux fois, peut produire deux réponses différentes : à chaque token, le modèle ne choisit pas automatiquement le plus probable, il **tire au sort** parmi les tokens plausibles selon la distribution de probabilité qu'il vient de calculer (voir [NLP et LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm)), un tirage réglé par un paramètre appelé la **température**, détaillé juste en dessous. Conséquence directe : un test automatisé qui compare une sortie de LLM à une chaîne de caractères exacte est fragile par construction (voir le chapitre [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm) pour évaluer une sortie autrement).

## La température : contrôler l'aléa de génération

La température ne change pas les probabilités calculées par le modèle pour le token suivant : elle change la façon dont ce tirage au sort les utilise ensuite, en resserrant ou en aplatissant l'écart entre le token le plus probable et les autres :

```text
Distribution brute calculee par le modele pour "Le chat dort sur le ___" :
  "canape" : 45%   "tapis" : 20%   "lit" : 15%   "toit" : 5%   ...

Temperature basse (ex. 0.2) -> resserre l'ecart, "canape" devient quasi systematique
  "canape" : ~90%   "tapis" : ~7%   "lit" : ~2%   "toit" : ~0.1%   ...

Temperature haute (ex. 1.5) -> aplatit l'ecart, les alternatives redeviennent competitives
  "canape" : ~30%   "tapis" : ~25%   "lit" : ~20%   "toit" : ~12%   ...
```

```python
reponse = client.chat.completions.create(
    model="...",
    messages=[...],
    temperature=0.2,  # resserre le tirage : reponses stables, peu de variation d'un appel a l'autre
)
```

| Température | Effet sur le tirage | Cas d'usage typique |
|---|---|---|
| 0 | (quasi) toujours le token le plus probable | Extraction d'information, classification, tâche factuelle |
| 0,2 – 0,5 | Réponses stables, peu de variation d'un appel à l'autre | Support client, documentation, génération de code |
| 0,7 – 1,0 (valeur par défaut de la plupart des API) | Bon compromis entre cohérence et variété | Rédaction générale, conversation |
| 1,2 et plus | Beaucoup de variété, au prix de la cohérence | Brainstorming, génération créative |

> **Note :** une température à 0 réduit l'aléa à son minimum, mais ne garantit pas un déterminisme parfait dans tous les cas. Sur une infrastructure qui traite de nombreuses requêtes en parallèle (le cas de la plupart des fournisseurs en production), l'ordre dans lequel les calculs en virgule flottante s'exécutent peut varier légèrement d'un appel à l'autre, produisant occasionnellement un résultat différent malgré une température nulle.

> **Piège :** utiliser une température élevée par défaut parce que "ça rend les réponses plus intéressantes", y compris sur une tâche factuelle (extraction, classification, calcul relayé à un outil, voir plus haut) : c'est un des cas où l'aléa ajouté n'apporte rien et augmente seulement le risque de réponse incohérente ou hallucinée.
>
> **Bonne pratique :** choisir la température en fonction de la tâche plutôt que de recopier une valeur par défaut partout : basse pour tout ce qui doit rester fiable et reproductible, plus haute uniquement quand la variété de la sortie est elle-même recherchée (voir aussi *"La température selon l'usage"* dans [Construire un chatbot](/?c=ia&s=applications-llm&p=chatbot)).

**La connaissance figée à une date.** Un LLM ne connaît que ce qui existait dans ses données d'entraînement, jusqu'à une date de coupure (*cutoff*). Il ignore tout événement postérieur, et ne peut pas le deviner : il peut au mieux le signaler s'il a été entraîné à le faire, ou halluciner une réponse sinon. Le RAG et les agents (recherche web en temps réel) sont les deux façons de contourner cette limite.

> **Piège :** poser une question sur un événement récent sans vérifier la date de coupure du modèle utilisé : une réponse assurée sur un sujet postérieur à cette date est presque toujours une hallucination plutôt qu'une vraie connaissance.
>
> **Bonne pratique :** vérifier la date de coupure du modèle avant de lui poser une question sensible à l'actualité, et recourir au RAG ou à un agent capable de rechercher une information à jour si nécessaire.

**Aucune action sur le monde réel.** Un LLM ne fait que produire du texte. Envoyer un email, écrire dans une base de données, appeler une API : rien de tout cela n'est possible sans un système autour de lui qui interprète sa sortie et agit à sa place : c'est le rôle des agents.

## Le coût, une contrainte de conception à part entière

Contrairement à un service classique où le coût marginal d'une requête est proche de zéro, chaque appel à un LLM a un **coût réel et variable**, proportionnel au nombre de tokens lus (le prompt, souvent facturé moins cher) et générés (la réponse, plus chère car calculée token par token, voir le mécanisme d'attention). Un prompt qui embarque un long historique de conversation ou un document entier multiplie ce coût à chaque tour.

La latence suit la même logique : un modèle plus gros répond en général plus lentement, et une réponse longue prend plus de temps qu'une courte : un modèle ne peut pas "réfléchir en silence" puis afficher le résultat d'un coup, il produit sa réponse token après token.

Le compromis qui en découle est systématique dans la conception d'un système en production :

| | Modèle plus petit/rapide | Modèle plus gros |
|---|---|---|
| Coût par requête | Plus faible | Plus élevé |
| Latence | Plus faible | Plus élevée |
| Capacité de raisonnement | Limitée sur les tâches complexes | Meilleure |
| Cas d'usage typique | Classification, extraction simple, premier filtre | Raisonnement multi-étapes, rédaction fine |

Une architecture courante fait cohabiter les deux : un petit modèle filtre ou route la majorité des requêtes simples, et seules celles qui l'exigent réellement sont envoyées au modèle le plus coûteux.

> **Piège :** ignorer le coût jusqu'à la facture de fin de mois. Contrairement à un service classique où le coût marginal d'une requête est négligeable, chaque appel à un LLM a un coût mesurable et cumulatif, invisible tant qu'aucun suivi n'est mis en place.
>
> **Bonne pratique :** mettre en place un suivi de coût par fonctionnalité ou par utilisateur dès la conception (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), plutôt que de le découvrir a posteriori.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un LLM excelle sur les tâches de langage, pas sur le calcul exact ni l'action autonome sur le monde réel. Ses limites structurelles (hallucinations, fenêtre de contexte bornée, non-déterminisme, connaissance figée à une date) découlent de son principe même, pas de bugs qu'une meilleure version corrigera. Chaque appel a un coût et une latence réels. |
| **Outils utilisables** | Le paramètre température pour contrôler l'aléa de génération. Un outil de tokenisation pour mesurer la taille réelle d'un prompt. Un modèle plus petit comme premier filtre pour réduire le coût moyen. |
| **Pièges à éviter** | Faire confiance à une réponse assurée sans la vérifier. Dépasser silencieusement la fenêtre de contexte. Interroger le modèle sur un événement postérieur à sa date de coupure. Ignorer le coût jusqu'à la facture. |
| **Bonnes pratiques** | Vérifier toute affirmation factuelle vérifiable produite par le modèle. Mesurer la taille du prompt en tokens réels. Vérifier la date de coupure avant une question sensible à l'actualité. Mettre en place un suivi de coût dès la conception. |
