---
order: 6
---

# LLM en production : cas d'usage et limites

Utiliser un LLM depuis une interface de chat et l'intégrer dans un produit sont deux exercices différents. Dans le premier cas, une réponse bancale se corrige en reformulant la question. Dans le second, la même réponse part sans supervision vers un utilisateur ou un système en aval — ce qui change complètement ce qu'il faut vérifier avant de choisir cette technologie pour une tâche donnée.

## Quand un LLM est le bon outil

Un LLM excelle sur les tâches dont l'entrée et la sortie sont du **langage** : comprendre un texte libre, le reformuler, en extraire une information, le traduire, le classer, en générer un nouveau à partir d'instructions. C'est précisément l'objectif sur lequel il a été entraîné (voir [NLP et LLM](/?c=ia&p=nlp-et-llm)).

| Cas d'usage | Adapté ? | Pourquoi |
|---|---|---|
| Extraire une information d'un texte non structuré (ex : un email) | Oui | C'est de la compréhension de langage naturel |
| Résumer un document long | Oui | Même raison, avec un compromis longueur/fidélité |
| Classer un ticket support par catégorie | Oui, souvent en overkill | Un modèle classique (régression logistique sur embeddings) fait aussi bien, moins cher, plus vite |
| Calculer une TVA ou une date d'échéance | Non | Un LLM prédit le token le plus plausible, pas le résultat exact d'un calcul — voir plus bas |
| Décider d'une action irréversible seul (envoyer un virement) | Non, pas sans garde-fou humain | Réponse non déterministe, jamais garantie à 100% |

> **Note :** pour le calcul exact, la bonne architecture n'est pas de mieux prompter le LLM, c'est de lui donner un outil (une fonction Python, une requête SQL) qu'il appelle et dont il relaie le résultat — voir le chapitre [Agents](/?c=ia&p=agents). Le LLM reste excellent pour comprendre *qu'il faut* calculer une TVA et *avec quels nombres*, mais ne doit jamais être le calculateur lui-même.

## Les limites structurelles à connaître avant de concevoir

Ces limites ne sont pas des bugs qu'une meilleure version du modèle corrigera un jour : elles découlent directement de ce qu'est un LLM (voir son principe d'entraînement dans le chapitre [NLP et LLM](/?c=ia&p=nlp-et-llm)).

**Les hallucinations.** Un LLM ne "sait" rien au sens où une base de données le saurait : il génère le texte statistiquement le plus plausible compte tenu de ce qui précède. Rien dans son entraînement ne le pousse à dire *"je ne sais pas"* plutôt que d'inventer une réponse plausible — une citation, une référence légale, une fonction d'une bibliothèque qui n'existe pas. C'est la limite la plus dangereuse en production, car une hallucination est rédigée avec la même assurance qu'une réponse correcte.

**La fenêtre de contexte.** Un LLM ne lit pas un texte indéfiniment long : il est borné à un nombre maximal de tokens (le prompt et sa propre réponse compris). Au-delà, soit la requête échoue, soit le début du contexte est tronqué silencieusement selon l'implémentation. Un document de 500 pages ne peut pas être collé tel quel dans un prompt — c'est un des problèmes que le [RAG](/?c=ia&p=rag) résout.

**Le non-déterminisme.** Le même prompt, envoyé deux fois, peut produire deux réponses différentes (le modèle tire parmi les tokens les plus probables plutôt que de toujours choisir le plus probable — un paramètre appelé la *température*). Une température à 0 réduit cet aléa sans l'éliminer totalement. Conséquence directe : un test automatisé qui compare une sortie de LLM à une chaîne de caractères exacte est fragile par construction — voir le chapitre [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm) pour évaluer une sortie autrement.

**La connaissance figée à une date.** Un LLM ne connaît que ce qui existait dans ses données d'entraînement, jusqu'à une date de coupure (*cutoff*). Il ignore tout événement postérieur, et ne peut pas le deviner — il peut au mieux le signaler s'il a été entraîné à le faire, ou hallucinez une réponse sinon. Le RAG et les agents (recherche web en temps réel) sont les deux façons de contourner cette limite.

**Aucune action sur le monde réel.** Un LLM ne fait que produire du texte. Envoyer un email, écrire dans une base de données, appeler une API : rien de tout cela n'est possible sans un système autour de lui qui interprète sa sortie et agit à sa place — c'est le rôle des agents.

## Le coût, une contrainte de conception à part entière

Contrairement à un service classique où le coût marginal d'une requête est proche de zéro, chaque appel à un LLM a un **coût réel et variable**, proportionnel au nombre de tokens lus (le prompt, souvent facturé moins cher) et générés (la réponse, plus chère car calculée token par token, voir le mécanisme d'attention). Un prompt qui embarque un long historique de conversation ou un document entier multiplie ce coût à chaque tour.

La latence suit la même logique : un modèle plus gros répond en général plus lentement, et une réponse longue prend plus de temps qu'une courte — un modèle ne peut pas "réfléchir en silence" puis afficher le résultat d'un coup, il produit sa réponse token après token.

Le compromis qui en découle est systématique dans la conception d'un système en production :

| | Modèle plus petit/rapide | Modèle plus gros |
|---|---|---|
| Coût par requête | Plus faible | Plus élevé |
| Latence | Plus faible | Plus élevée |
| Capacité de raisonnement | Limitée sur les tâches complexes | Meilleure |
| Cas d'usage typique | Classification, extraction simple, premier filtre | Raisonnement multi-étapes, rédaction fine |

Une architecture courante fait cohabiter les deux : un petit modèle filtre ou route la majorité des requêtes simples, et seules celles qui l'exigent réellement sont envoyées au modèle le plus coûteux.
