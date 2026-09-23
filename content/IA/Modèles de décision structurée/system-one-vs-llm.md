---
order: 1
---

# Les modèles de décision structurée : une alternative aux LLM génératifs

Un [LLM](/?c=ia&s=nlp-llm&p=nlp-et-llm) répond toujours par du texte : même quand on lui demande "urgent ou pas urgent ?", il produit une suite de mots qu'il faut ensuite relire, découper, valider (typiquement par un [schéma JSON](/?c=ia&s=nlp-llm&p=agents) qui décrit la forme attendue). Rien ne garantit qu'il respecte cette forme du premier coup, ni qu'il n'invente pas une réponse plausible mais fausse, une [hallucination](/?c=ia&s=nlp-llm&p=llm-en-production). Une famille de modèles plus récente, les **modèles de décision structurée**, choisit une autre voie : renoncer à générer du texte libre pour ne répondre qu'à des questions fermées, avec une sortie qui a toujours la forme attendue et une probabilité chiffrée de se tromper.

## D'où vient l'idée : système 1 et système 2

Le nom vient du livre du psychologue Daniel Kahneman, [*Thinking, Fast and Slow*](https://www.penguinrandomhouse.com/books/89308/thinking-fast-and-slow-by-daniel-kahneman/), qui distingue deux façons de penser chez l'humain :

| | Système 1 | Système 2 |
|---|---|---|
| Vitesse | Rapide, automatique | Lent, demande de l'effort |
| Exemple | Reconnaître un visage, évaluer une émotion | Résoudre 17 × 24, planifier un trajet |
| Ce que ça produit | Une réponse immédiate, peu de raisonnement explicite | Un raisonnement construit étape par étape |

Un LLM génératif, qui déroule un raisonnement token après token (voir le [prompt engineering](/?c=ia&s=nlp-llm&p=prompt-engineering) et les chaînes de raisonnement), se rapproche du système 2. Les modèles dits **"System One"** visent l'inverse : répondre vite, sans dérouler de raisonnement textuel, sur des questions volontairement étroites.

## Ce qu'un modèle de décision structurée répond

Plutôt que de générer une phrase, un modèle de ce type répond à une question fermée, posée contre un **état** (l'ensemble des données utiles à la décision, ex : le contenu d'un ticket support), et renvoie toujours :
- une réponse dans un format fixé à l'avance (jamais du texte libre) ;
- une probabilité (ou une distribution de probabilités) associée ;
- un score de confiance, distinct de cette probabilité.

## Comparaison avec un LLM génératif classique

| | LLM génératif classique | Modèle de décision structurée |
|---|---|---|
| Sortie | Texte libre, à parser ensuite | Valeur typée fixée à l'avance (option, score, oui/non) |
| Entrée | Un prompt textuel | Un état structuré + une question fermée |
| Échantillonnage | Token par token, séquentiel | Toutes les réponses en une passe (parallèle) |
| Peut produire un format invalide | Oui, nécessite une validation (cf. [JSON Schema](/?c=ia&s=nlp-llm&p=agents)) | Non, la sortie est contrainte par construction |
| Probabilité rapportée | Absente ou peu fiable | Calibrée : entraînée pour refléter la réalité statistique |
| Usage visé | Rédaction, raisonnement ouvert, conversation | Classification, notation, routage, vérification |

## Un exemple concret : Jev

**Jev** est un modèle de ce type publié par le laboratoire [TypeSafe AI](https://typesafe.ai/blog/introducing-system-one-models-and-jev) (nommé d'après l'économiste William Stanley Jevons), et sert d'illustration dans la suite de cette partie. Il répond à trois formes de question fermée, détaillées dans le [chapitre suivant](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul), et revendique sur ce périmètre restreint une latence de 70 à 500 ms (contre plusieurs secondes pour un LLM frontière comparable) et un taux d'erreur de format nul. Ces chiffres viennent du fournisseur et n'ont pas été vérifiés de façon indépendante ; ce qui compte pour ce cours est le principe qu'ils illustrent, pas le benchmark en lui-même.

## À quoi ça sert, et à quoi ça ne sert pas

| Adapté | Pas adapté |
|---|---|
| Classer un message dans une catégorie fixe | Rédiger un texte, une réponse ouverte |
| Noter un contenu sur une échelle connue à l'avance | Expliquer un raisonnement en langage naturel |
| Router une requête vers le bon traitement | Répondre à une question dont les réponses possibles ne sont pas connues à l'avance |
| Vérifier ou filtrer la sortie d'un autre modèle (garde-fou) | Faire de la conversation ou de la génération créative |
| Extraire une valeur parmi des candidats déjà repérés | Générer du code, un plan, un document |

> **Piège :** croire qu'un modèle de décision structurée remplace un LLM. Il ne fait qu'une chose : répondre à une question fermée contre un état donné. Un système réel combine le plus souvent les deux, le LLM pour raisonner et générer, le modèle de décision pour les points de passage étroits (classer, noter, vérifier) où une sortie garantie et rapide compte plus qu'une réponse ouverte.
>
> **Bonne pratique :** repérer, dans un pipeline existant à base de LLM, les étapes qui ne font déjà que choisir parmi des options connues à l'avance (routage, notation, validation) : ce sont les candidates naturelles à un modèle de décision structurée, sans toucher aux étapes qui génèrent réellement du texte.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un modèle de décision structurée (catégorie "System One", en référence au système 1 de Kahneman) répond à des questions fermées contre un état donné, avec une sortie toujours au bon format et une probabilité calibrée, contrairement à un LLM génératif qui produit du texte libre à valider après coup. Il complète un LLM, il ne le remplace pas. |
| **Outils utilisables** | Jev (TypeSafe AI) comme exemple public de ce type de modèle. |
| **Pièges à éviter** | Confondre "modèle de décision structurée" avec un remplacement complet d'un LLM ; lui demander une tâche ouverte (rédaction, raisonnement libre) qu'il n'est pas conçu pour traiter. |
| **Bonnes pratiques** | Réserver ce type de modèle aux étapes d'un pipeline qui ne font déjà que choisir parmi des options connues à l'avance, en le combinant à un LLM pour le reste. |
