---
order: 1
---

# Monitoring et gestion opérationnelle d'un LLM

Surveiller un service classique revient à surveiller un [code de statut HTTP](/?c=infrastructure&p=api-et-http) : `200`, c'est bon, `500`, ça a planté. Un appel à un LLM répond presque toujours `200` : la question n'est jamais *"a-t-il répondu ?"* mais *"la réponse est-elle bonne, et a-t-elle coûté ce qu'elle devait coûter ?"*. C'est cette différence qui rend le monitoring d'un système à base de LLM structurellement différent d'un monitoring applicatif classique.

## Ce qu'il faut journaliser

Un système en production doit conserver, pour chaque appel, de quoi reconstituer et auditer ce qui s'est passé :

| Donnée | Pourquoi |
|---|---|
| Prompt complet envoyé (system + historique + question) | Reproduire un comportement inattendu suppose de savoir exactement ce que le modèle a reçu |
| Réponse produite | Sans elle, aucune évaluation a posteriori n'est possible |
| Nombre de tokens en entrée et en sortie | C'est la base du coût (voir [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)) et un indicateur d'anomalie (un prompt qui explose en taille sans raison signale souvent un bug amont) |
| Latence | Détecte une dégradation du service avant qu'un utilisateur ne s'en plaigne |
| Identifiant et version du modèle | Voir plus bas : cette version change plus souvent qu'on ne le pense |

> **Piège :** journaliser le prompt et la réponse sans précaution. Ils peuvent contenir des données personnelles ou sensibles selon ce que l'utilisateur a écrit : les conserver tel quel reproduit exactement le problème que la [gouvernance des données](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) cherche à éviter.
>
> **Bonne pratique :** chiffrer ces journaux au repos et leur appliquer une durée de rétention limitée, au minimum ; voir la [politique de rétention](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) détaillée par ailleurs.

## La dérive silencieuse de version

Un fournisseur de LLM fait évoluer son modèle régulièrement, parfois sous le même nom commercial (une mise à jour mineure, un ajustement de sécurité, un changement de comportement par défaut). Un système qui appelle "le modèle X" sans épingler une version précise peut donc voir son comportement changer du jour au lendemain, sans qu'aucune ligne de son propre code n'ait bougé : le bug le plus difficile à diagnostiquer est celui qui n'a pas de commit associé.

> **Piège :** appeler "le modèle X" sans épingler de version précise, en supposant que son comportement restera stable dans le temps.
>
> **Bonne pratique :** figer une version explicite plutôt que "la dernière disponible", et ne migrer vers une nouvelle version qu'après l'avoir testée sur un jeu de cas connus (voir plus bas), la même parade que pour toute dépendance externe.

## Évaluer une sortie qui n'est jamais identique deux fois

Le non-déterminisme d'un LLM (voir [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)) rend inutilisable un test classique de type "la sortie doit être exactement cette chaîne". Deux approches se combinent en pratique :

**Un jeu de cas de référence (*golden set*).** Une liste de prompts représentatifs dont on connaît la réponse attendue (ou les critères qu'une bonne réponse doit remplir), rejouée à chaque changement : de prompt, de modèle, de version. C'est l'équivalent d'une suite de tests de non-régression, adaptée à une sortie approximative plutôt qu'exacte.

**Un second LLM comme évaluateur (*LLM-as-judge*).** Le juge reçoit la question, la réponse produite, et parfois une réponse de référence, puis note la réponse selon des critères explicites (exactitude, ton, longueur). Ça permet d'évaluer des milliers de cas sans relecture humaine systématique, en réservant l'œil humain aux cas que le juge signale comme douteux.

> **Piège :** traiter le verdict d'un LLM-as-judge comme infaillible. Le juge hérite des mêmes limites qu'un LLM ordinaire (voir [LLM en production](/?c=ia&s=nlp-llm&p=llm-en-production)), y compris la possibilité de se tromper avec la même assurance qu'un jugement correct.
>
> **Bonne pratique :** réserver l'évaluation humaine aux cas que le juge signale comme douteux, et vérifier périodiquement un échantillon de ses verdicts jugés "bons", pas seulement ceux qu'il signale lui-même comme incertains.

## Le cache sémantique : éviter de recalculer une réponse déjà connue

Un cache classique associe une réponse à une **clé exacte** : la même clé redonne la même réponse, une clé légèrement différente (une reformulation) manque le cache et déclenche un nouvel appel, même si la question posée était en réalité la même. Un **cache sémantique** répond à ce problème en comparant les questions par **similarité de sens** plutôt que par égalité de texte, avec la même technique de recherche par embedding que celle du [RAG](/?c=ia&s=nlp-llm&p=rag) :

```text
Question 1 : "Quel est le prix de l'abonnement Pro ?"
             -> appel LLM, reponse mise en cache avec son embedding

Question 2 : "Combien coute la formule Pro ?"
             -> embedding proche de la question 1 (similarite > seuil)
             -> reponse en cache renvoyee, AUCUN appel LLM
```

| | Cache classique | Cache sémantique |
|---|---|---|
| Correspondance | Clé exacte (chaîne identique) | Similarité d'embedding au-dessus d'un seuil |
| Rate une reformulation ? | Oui, systématiquement | Non, tant que le sens reste proche |
| Coût évité | Uniquement la question exacte déjà posée | Toute question sémantiquement proche d'une déjà posée |

> **Piège :** un seuil de similarité trop permissif fait correspondre deux questions au sens réellement différent ("annuler ma commande" et "annuler mon abonnement" peuvent être proches en embedding), renvoyant alors une réponse en cache qui ne répond pas à la vraie question, avec la même assurance qu'une réponse correcte.
>
> **Bonne pratique :** régler le seuil de similarité de façon conservatrice (quitte à manquer quelques reformulations valables), et invalider les entrées du cache quand l'information sous-jacente change, le même problème de péremption qu'un cache classique.

Une [passerelle LLM](/?c=ia&s=production-et-gouvernance&p=stack-ia) centralise généralement ce cache à l'échelle de toutes les applications qui l'utilisent, plutôt que chacune réimplémentant le sien.

## Les garde-fous opérationnels

> **Piège :** un pic de trafic (légitime, ou une boucle d'agent mal bornée, voir le chapitre [Agents](/?c=ia&s=nlp-llm&p=agents)) peut faire exploser une facture en quelques minutes sans qu'aucune alerte "erreur" ne se déclenche, puisque chaque appel individuel réussit.
>
> **Bonne pratique :** mettre en place un limiteur de débit et de coût, et un tableau de bord de coût par fonctionnalité, par client ou par utilisateur, pas un luxe, ce qui évite de découvrir la facture en fin de mois.

> **Piège :** si le modèle principal devient indisponible ou trop lent, renvoyer directement une erreur à l'utilisateur plutôt que de dégrader le service.
>
> **Bonne pratique :** prévoir un repli (*fallback*) vers un modèle plus simple en cas d'indisponibilité ou de lenteur excessive : dégrader le service plutôt que l'interrompre.

Le filtrage des entrées et sorties (détecter une tentative d'instruction malveillante, voir la [prompt injection](/?c=ia&s=nlp-llm&p=prompt-injection), et filtrer une sortie avant qu'elle n'atteigne l'utilisateur) complète ces garde-fous.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Le monitoring d'un LLM porte sur la qualité et le coût de la réponse, pas sur un simple code de statut. Journaliser prompt, réponse, tokens, latence et version du modèle permet de reconstituer un incident. Un golden set et un LLM-as-judge remplacent un test classique face au non-déterminisme. Un cache sémantique évite de recalculer une réponse pour une question reformulée mais équivalente. |
| **Outils utilisables** | Un tableau de bord de coût par fonctionnalité/client. Un golden set rejoué à chaque changement. Un limiteur de débit et de coût, un repli vers un modèle plus simple. Un cache sémantique, souvent centralisé au niveau d'une passerelle LLM. |
| **Pièges à éviter** | Journaliser prompt/réponse sans chiffrement ni rétention limitée. Appeler un modèle sans version épinglée. Traiter un LLM-as-judge comme infaillible. Laisser un pic de trafic ou une panne dégrader la facture ou le service sans garde-fou. Un seuil de similarité de cache sémantique trop permissif. |
| **Bonnes pratiques** | Chiffrer les journaux et limiter leur rétention. Figer une version de modèle explicite. Vérifier périodiquement un échantillon des verdicts d'un LLM-as-judge. Mettre en place limiteur de coût et repli automatique. Régler le seuil de similarité du cache sémantique de façon conservatrice. |
