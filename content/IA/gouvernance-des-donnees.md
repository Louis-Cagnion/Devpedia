---
order: 12
---

# Gouvernance des données pour un système IA

Envoyer une donnée à un LLM n'est pas neutre : contrairement à une base de données interne, la donnée transite souvent vers un service tiers hébergé dans le [cloud](/?c=infrastructure&p=le-cloud), peut apparaître dans des journaux qu'on n'avait pas prévu de constituer (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)), et peut être conservée par le fournisseur selon des conditions contractuelles qu'il faut connaître avant d'envoyer quoi que ce soit. La gouvernance des données appliquée à un système IA reprend les principes classiques (RGPD, contrôle d'accès, traçabilité) en les adaptant à ce trajet supplémentaire, des obligations qui se cumulent avec celles, propres au système IA lui-même, de la [réglementation européenne de l'IA](/?c=ia&p=reglementation-europeenne-ia).

## Classer une donnée avant de l'envoyer à un modèle

Toute donnée qui entre dans un prompt (question de l'utilisateur, document injecté par un [RAG](/?c=ia&p=rag), résultat d'un outil appelé par un [agent](/?c=ia&p=agents)) mérite d'être classée avant l'envoi, pas après :

| Catégorie | Exemple | Traitement |
|---|---|---|
| Publique | Documentation déjà publiée | Aucune précaution particulière |
| Interne | Procédure d'entreprise non confidentielle | Vérifier les conditions contractuelles du fournisseur avant envoi |
| Personnelle | Nom, email, numéro de téléphone d'un client | Anonymiser ou pseudonymiser avant l'envoi si le cas d'usage le permet, sinon un fournisseur conforme (hébergement, contrat) est requis |
| Secrète | Clé d'API, mot de passe, secret commercial | Ne jamais transiter par un prompt, quel que soit le fournisseur |

> **Piège :** classer seulement ce que le prompt initial contient explicitement. Un agent qui appelle des outils (voir [Agents](/?c=ia&p=agents)) peut faire remonter dans le prompt des données que personne n'a explicitement décidé d'y mettre : le résultat d'une requête SQL renvoyée à un modèle, par exemple, embarque toutes les colonnes de cette requête, pas seulement celle utile à la réponse.
>
> **Bonne pratique :** faire porter la classification sur ce qui *peut* transiter par un outil ou une recherche, pas seulement sur ce que le prompt initial contient explicitement.

## Traçabilité : reconstituer qui a demandé quoi

Un système IA en production doit pouvoir répondre après coup à *"qui a posé cette question, avec quelles données, et quelle réponse a été produite ?"*, la même exigence qu'un système d'audit classique, mais avec deux journaux de plus par rapport à un CRUD ordinaire : le prompt effectivement envoyé (pas seulement la question brute de l'utilisateur, mais tout ce qui a été assemblé autour), et la version exacte du modèle qui a répondu (voir la dérive de version dans [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)).

> **Note :** CRUD (*Create, Read, Update, Delete*) désigne les quatre opérations de base sur une donnée stockée : la créer, la lire, la modifier, la supprimer (les commandes SQL `INSERT`/`SELECT`/`UPDATE`/`DELETE`, voir [SQL](/?c=domain-specific-languages-dsl&p=sql), ou les méthodes HTTP `POST`/`GET`/`PUT`/`DELETE` d'une API REST). Un audit "CRUD ordinaire" trace donc, pour chacune de ces quatre actions : qui l'a déclenchée, sur quelle ligne, à quel moment. Un système IA en ajoute deux de plus (le prompt assemblé, la version du modèle) parce qu'une réponse dépend de bien plus que la seule donnée modifiée : elle dépend aussi de tout le contexte fourni au modèle et du modèle lui-même, deux éléments qui n'existent pas dans un CRUD classique.

## Contrôle d'accès : le RAG hérite des permissions, ou il les contourne

Avec un [RAG](/?c=ia&p=rag) mal conçu, la base vectorielle indexe des documents de plusieurs niveaux de confidentialité, mais la recherche ne filtre pas selon les droits de la personne qui pose la question.

> **Piège :** filtrer par permission seulement **après** la recherche (relire la réponse a posteriori). Un utilisateur qui n'aurait jamais eu accès à un document directement peut alors s'en voir citer le contenu, reformulé par le modèle, parce que la recherche l'a jugé pertinent sans vérifier qui a le droit de le voir : une fois l'information dans la réponse, le mal est fait.
>
> **Bonne pratique :** filtrer par permission **avant** la recherche (ne chercher que dans les documents que l'utilisateur est autorisé à voir), jamais seulement après coup.

## Rétention et droit à l'oubli

Les journaux nécessaires à la traçabilité et à l'évaluation (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&p=gestion-dun-llm)) entrent en tension directe avec le droit à l'oubli : un prompt contenant une donnée personnelle, conservé indéfiniment pour analyser la qualité du modèle, est une conservation de donnée personnelle comme une autre. Une politique de rétention explicite doit couvrir ces journaux au même titre qu'une base de données métier : les oublier parce qu'ils sont techniques plutôt que fonctionnels est une des façons les plus courantes de devenir non conforme sans s'en rendre compte.

| Élément de la politique | Question à laquelle il répond | Exemple concret |
|---|---|---|
| Durée maximale de conservation | Au bout de combien de temps une donnée doit-elle disparaître ou être anonymisée ? | Journaux de prompts conservés 90 jours en clair, puis anonymisés (nom/email remplacés par un identifiant générique) |
| Anonymisation après délai | Peut-on garder la donnée utile à l'analyse sans garder l'identité de la personne ? | Après 90 jours, le prompt reste exploitable pour mesurer la qualité des réponses, mais ne permet plus de remonter à un client précis |
| Procédure de suppression sur demande | Que se passe-t-il si une personne exerce son droit à l'oubli avant l'échéance normale ? | Une demande RGPD déclenche la suppression du prompt, de la réponse, et de toute trace dans les journaux associés à cette personne |
| Exceptions documentées | Certaines données doivent-elles survivre plus longtemps pour une raison légale (comptabilité, litige en cours) ? | Une conversation citée dans une procédure judiciaire en cours est conservée au-delà de la durée normale, mais isolée et justifiée |

Ce qui complique la question par rapport à une base de données métier classique : une donnée personnelle envoyée à un LLM peut avoir été copiée à plusieurs endroits sans qu'un seul `DELETE` suffise à l'effacer partout.

| Endroit où la donnée peut avoir été copiée | Suppression déclenchée par un `DELETE` classique ? |
|---|---|
| Ligne dans la base applicative | Oui |
| Journal de prompts (voir la traçabilité plus haut) | Seulement si le journal est explicitement inclus dans la procédure de suppression |
| Index vectoriel d'un [RAG](/?c=ia&p=rag), si le document contenait la donnée | Non : l'embedding généré à partir du document doit être retrouvé et supprimé séparément |
| Journaux conservés par le fournisseur du modèle (hors de l'infrastructure de l'entreprise) | Dépend uniquement des conditions contractuelles du fournisseur, pas de ce que fait l'entreprise en interne |

> **Piège :** traiter le droit à l'oubli comme un simple `DELETE FROM utilisateurs WHERE id = ...` et considérer le sujet clos. Un document contenant une donnée personnelle, une fois indexé dans un RAG, continue d'exister sous forme d'embedding même après la suppression du document source, et un fournisseur de modèle tiers peut conserver le prompt selon ses propres conditions contractuelles, indépendamment de ce qui est supprimé côté entreprise.
>
> **Bonne pratique :** faire de la suppression un processus qui parcourt explicitement chaque endroit où la donnée a pu être copiée (base, journaux, index vectoriel), plutôt qu'une seule requête sur la table d'origine, et vérifier, avant de choisir un fournisseur, ce que prévoit son contrat en matière de conservation et de suppression sur demande.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Toute donnée entrant dans un prompt doit être classée (publique/interne/personnelle/secrète) avant l'envoi. Un système IA trace deux éléments de plus qu'un CRUD ordinaire (le prompt assemblé, la version du modèle). Un RAG doit filtrer par permission avant la recherche, jamais après. Le droit à l'oubli doit couvrir tous les endroits où une donnée a pu être copiée, pas seulement la base d'origine. |
| **Outils utilisables** | Une politique de rétention explicite (durée, anonymisation, procédure de suppression). Un filtrage par permission en amont de la recherche RAG. |
| **Pièges à éviter** | Classer seulement le contenu explicite du prompt initial, sans compter ce qu'un outil peut y faire remonter. Filtrer les permissions d'un RAG après la recherche plutôt qu'avant. Traiter le droit à l'oubli comme un simple `DELETE` sur la table d'origine. |
| **Bonnes pratiques** | Classer toute donnée qui *peut* transiter, pas seulement ce que le prompt contient explicitement. Filtrer par permission avant la recherche RAG. Faire de la suppression un processus qui parcourt tous les endroits où la donnée a pu être copiée. |
