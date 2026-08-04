---
order: 10
---

# Gouvernance des données pour un système IA

Envoyer une donnée à un LLM n'est pas neutre : contrairement à une base de données interne, la donnée transite souvent vers un service tiers, peut apparaître dans des journaux qu'on n'avait pas prévu de constituer (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)), et peut être conservée par le fournisseur selon des conditions contractuelles qu'il faut connaître avant d'envoyer quoi que ce soit. La gouvernance des données appliquée à un système IA reprend les principes classiques (RGPD, contrôle d'accès, traçabilité) en les adaptant à ce trajet supplémentaire.

## Classer une donnée avant de l'envoyer à un modèle

Toute donnée qui entre dans un prompt (question de l'utilisateur, document injecté par un [RAG](/?c=ia&p=rag), résultat d'un outil appelé par un [agent](/?c=ia&p=agents)) mérite d'être classée avant l'envoi, pas après :

| Catégorie | Exemple | Traitement |
|---|---|---|
| Publique | Documentation déjà publiée | Aucune précaution particulière |
| Interne | Procédure d'entreprise non confidentielle | Vérifier les conditions contractuelles du fournisseur avant envoi |
| Personnelle | Nom, email, numéro de téléphone d'un client | Anonymiser ou pseudonymiser avant l'envoi si le cas d'usage le permet, sinon un fournisseur conforme (hébergement, contrat) est requis |
| Secrète | Clé d'API, mot de passe, secret commercial | Ne jamais transiter par un prompt, quel que soit le fournisseur |

> **Note :** un agent qui appelle des outils (voir [Agents](/?c=ia&p=agents)) peut faire remonter dans le prompt des données que personne n'a explicitement décidé d'y mettre — le résultat d'une requête SQL renvoyée à un modèle, par exemple, embarque toutes les colonnes de cette requête, pas seulement celle utile à la réponse. La classification doit donc porter sur ce qui *peut* transiter, pas seulement sur ce que le prompt initial contient.

## Traçabilité : reconstituer qui a demandé quoi

Un système IA en production doit pouvoir répondre après coup à *"qui a posé cette question, avec quelles données, et quelle réponse a été produite ?"* — la même exigence qu'un système d'audit classique, mais avec deux journaux de plus par rapport à un CRUD ordinaire : le prompt effectivement envoyé (pas seulement la question brute de l'utilisateur, mais tout ce qui a été assemblé autour), et la version exacte du modèle qui a répondu (voir la dérive de version dans [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)).

## Contrôle d'accès : le RAG hérite des permissions, ou il les contourne

Un piège fréquent avec un RAG mal conçu : la base vectorielle indexe des documents de plusieurs niveaux de confidentialité, mais la recherche ne filtre pas selon les droits de la personne qui pose la question. Résultat, un utilisateur qui n'aurait jamais eu accès à un document directement peut s'en voir citer le contenu, reformulé par le modèle, parce que la recherche l'a jugé pertinent sans vérifier qui a le droit de le voir. Le filtrage par permission doit avoir lieu **avant** la recherche (ne chercher que dans les documents autorisés), jamais seulement après (relire la réponse a posteriori) : une fois l'information dans la réponse, le mal est fait.

## Rétention et droit à l'oubli

Les journaux nécessaires à la traçabilité et à l'évaluation (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)) entrent en tension directe avec le droit à l'oubli : un prompt contenant une donnée personnelle, conservé indéfiniment pour analyser la qualité du modèle, est une conservation de donnée personnelle comme une autre. Une politique de rétention explicite (durée maximale, anonymisation après un délai, procédure de suppression sur demande) doit couvrir ces journaux au même titre qu'une base de données métier — les oublier parce qu'ils sont techniques plutôt que fonctionnels est une des façons les plus courantes de devenir non conforme sans s'en rendre compte.
