---
order: 8
---

# Gouvernance d'un pipeline de voix IA

[Gouvernance des données pour un système IA](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) pose les principes généraux (classer une donnée, tracer qui a demandé quoi, respecter le droit à l'oubli). Ce chapitre les reprend pour un pipeline de synthèse vocale, où la donnée en jeu, une **voix**, a un statut particulier déjà signalé dans [Cloner une voix](/?c=ia&s=voix-ia&p=cloner-une-voix) : c'est une donnée biométrique, identifiante par nature.

## La voix comme donnée biométrique

Contrairement à un prompt texte, une voix identifie directement une personne, au même titre qu'une empreinte digitale ou un visage : classer une voix comme donnée "personnelle" au sens le plus courant (voir le [chapitre général](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) sous-estime son niveau de sensibilité réel.

| | Donnée personnelle "classique" (nom, email) | Voix |
|---|---|---|
| Peut être changée si compromise | Oui (changer d'email) | Non (impossible de "changer" sa voix) |
| Réutilisable pour usurper une identité | Limité (un nom seul ne suffit généralement pas) | Oui, directement (voir le risque de fraude déjà signalé dans [Cloner une voix](/?c=ia&s=voix-ia&p=cloner-une-voix)) |

> **Piège :** appliquer à un échantillon vocal les mêmes règles de classification qu'à une donnée personnelle "classique" (nom, email), sans tenir compte qu'une voix compromise ne peut jamais être "changée" comme un mot de passe ou un email.
>
> **Bonne pratique :** traiter tout échantillon vocal identifiable comme une donnée biométrique à part entière, avec un niveau de protection au moins équivalent à celui d'une empreinte digitale ou d'une photo de visage.

## Traçabilité : quel échantillon a produit quelle voix clonée

Un pipeline de clonage de voix doit pouvoir répondre après coup à *"quel échantillon de référence a servi à produire cet audio, avec le consentement de qui ?"*, la même exigence de traçabilité que pour un LLM (voir [Monitoring et gestion opérationnelle d'un LLM](/?c=ia&s=production-et-gouvernance&p=gestion-dun-llm)), avec un journal supplémentaire propre à la voix : la preuve du consentement obtenu (voir [Cloner une voix](/?c=ia&s=voix-ia&p=cloner-une-voix)), conservée séparément de l'audio généré lui-même.

> **Piège :** conserver l'audio de référence et l'audio généré, mais pas la preuve du consentement obtenu au moment du clonage. Sans cette preuve, il devient impossible de démontrer après coup que ce clonage était autorisé, en particulier en cas de contestation.
>
> **Bonne pratique :** journaliser la preuve de consentement comme un élément de traçabilité à part entière, distinct de l'audio lui-même, avec la même rigueur que la version d'un modèle ou le prompt envoyé à un LLM.

## Rétention et droit à l'oubli : plusieurs copies d'une même voix

Le principe déjà vu (une donnée peut être copiée à plusieurs endroits sans qu'un seul `DELETE` suffise, voir le [chapitre général](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees)) s'applique à une voix avec une variante supplémentaire : un **embedding de locuteur** (voir [Cloner une voix](/?c=ia&s=voix-ia&p=cloner-une-voix)) est lui-même une représentation compacte, mais toujours identifiante, de cette voix.

| Endroit où la voix peut avoir été copiée | Suppression déclenchée par la suppression de l'échantillon audio d'origine ? |
|---|---|
| Fichier audio de référence, stocké tel quel | Oui |
| Embedding de locuteur, extrait de cet échantillon | Non : l'embedding continue d'exister et reste utilisable pour du clonage, même après suppression de l'audio source |
| Audio déjà généré à partir de cette voix | Non : chaque audio généré est une copie indépendante |

> **Piège :** répondre à une demande de suppression en effaçant uniquement le fichier audio de référence, en laissant l'embedding de locuteur déjà extrait et tout audio déjà généré intacts : la voix reste alors clonable ou déjà présente dans des contenus existants.
>
> **Bonne pratique :** faire porter la procédure de suppression sur l'échantillon source, l'embedding de locuteur qui en a été extrait, et les contenus déjà générés qui en dépendent, exactement le même réflexe que pour un embedding vectoriel de RAG déjà signalé dans le chapitre général.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Une voix est une donnée biométrique, jamais "changeable" une fois compromise, à protéger comme une empreinte ou un visage. La traçabilité d'un pipeline de clonage doit inclure la preuve de consentement, pas seulement l'audio. La suppression doit couvrir l'échantillon source, l'embedding de locuteur qui en a été extrait, et les contenus déjà générés à partir de lui. |
| **Outils utilisables** | Un journal de consentement distinct de l'audio généré. Une procédure de suppression qui parcourt échantillon, embedding et contenus générés. |
| **Pièges à éviter** | Classer une voix comme une donnée personnelle "classique". Ne pas journaliser la preuve de consentement. Supprimer uniquement l'échantillon source sans l'embedding ni les contenus déjà générés. |
| **Bonnes pratiques** | Traiter toute voix identifiable comme une donnée biométrique à part entière. Journaliser la preuve de consentement séparément. Étendre la suppression à l'embedding et aux contenus déjà générés. |
