---
order: 10
---

# Monitoring et gestion opérationnelle d'un LLM

Surveiller un service classique revient à surveiller un code de retour : 200, c'est bon, 500, ça a planté. Un appel à un LLM répond presque toujours 200 — la question n'est jamais *"a-t-il répondu ?"* mais *"la réponse est-elle bonne, et a-t-elle coûté ce qu'elle devait coûter ?"*. C'est cette différence qui rend le monitoring d'un système à base de LLM structurellement différent d'un monitoring applicatif classique.

## Ce qu'il faut journaliser

Un système en production doit conserver, pour chaque appel, de quoi reconstituer et auditer ce qui s'est passé :

| Donnée | Pourquoi |
|---|---|
| Prompt complet envoyé (system + historique + question) | Reproduire un comportement inattendu suppose de savoir exactement ce que le modèle a reçu |
| Réponse produite | Sans elle, aucune évaluation a posteriori n'est possible |
| Nombre de tokens en entrée et en sortie | C'est la base du coût (voir [LLM en production](/?c=ia&p=llm-en-production)) et un indicateur d'anomalie (un prompt qui explose en taille sans raison signale souvent un bug amont) |
| Latence | Détecte une dégradation du service avant qu'un utilisateur ne s'en plaigne |
| Identifiant et version du modèle | Voir plus bas : cette version change plus souvent qu'on ne le pense |

> **Note :** le prompt et la réponse peuvent contenir des données personnelles ou sensibles selon ce que l'utilisateur a écrit. Les journaliser sans précaution reproduit exactement le problème que la [gouvernance des données](/?c=ia&p=gouvernance-des-donnees) cherche à éviter — chiffrement au repos et durée de rétention limitée sont le minimum.

## La dérive silencieuse de version

Un fournisseur de LLM fait évoluer son modèle régulièrement, parfois sous le même nom commercial (une mise à jour mineure, un ajustement de sécurité, un changement de comportement par défaut). Un système qui appelle "le modèle X" sans épingler une version précise peut donc voir son comportement changer du jour au lendemain, sans qu'aucune ligne de son propre code n'ait bougé — le bug le plus difficile à diagnostiquer est celui qui n'a pas de commit associé.

La parade est la même que pour toute dépendance externe : figer une version explicite plutôt que "la dernière disponible", et ne migrer vers une nouvelle version qu'après l'avoir testée sur un jeu de cas connus (voir plus bas).

## Évaluer une sortie qui n'est jamais identique deux fois

Le non-déterminisme d'un LLM (voir [LLM en production](/?c=ia&p=llm-en-production)) rend inutilisable un test classique de type "la sortie doit être exactement cette chaîne". Deux approches se combinent en pratique :

**Un jeu de cas de référence (*golden set*).** Une liste de prompts représentatifs dont on connaît la réponse attendue (ou les critères qu'une bonne réponse doit remplir), rejouée à chaque changement — de prompt, de modèle, de version. C'est l'équivalent d'une suite de tests de non-régression, adaptée à une sortie approximative plutôt qu'exacte.

**Un second LLM comme évaluateur (*LLM-as-judge*).** Le juge reçoit la question, la réponse produite, et parfois une réponse de référence, puis note la réponse selon des critères explicites (exactitude, ton, longueur). Ce n'est pas infaillible — le juge hérite des mêmes limites qu'un LLM ordinaire — mais ça permet d'évaluer des milliers de cas sans relecture humaine systématique, en réservant l'œil humain aux cas que le juge signale comme douteux.

## Les garde-fous opérationnels

- **Limiteur de débit et de coût** : un pic de trafic (légitime ou une boucle d'agent mal bornée, voir le chapitre [Agents](/?c=ia&p=agents)) peut faire exploser une facture en quelques minutes sans qu'aucune alerte "erreur" ne se déclenche puisque chaque appel individuel réussit.
- **Repli (*fallback*)** : si le modèle principal est indisponible ou trop lent, basculer vers un modèle plus simple plutôt que de renvoyer une erreur — dégrader le service plutôt que l'interrompre.
- **Filtrage des entrées et sorties** : détecter les tentatives d'instructions malveillantes glissées dans l'entrée utilisateur (*prompt injection*), et filtrer une sortie avant qu'elle n'atteigne l'utilisateur ou un système en aval (contenu inapproprié, donnée sensible qui aurait fuité dans la réponse).
- **Coût comme métrique de premier ordre** : à la différence d'un service classique où le coût marginal d'une requête est négligeable, ici chaque appel a un prix mesurable — un tableau de bord de coût par fonctionnalité, par client ou par utilisateur n'est pas un luxe, c'est ce qui évite de découvrir la facture en fin de mois.
