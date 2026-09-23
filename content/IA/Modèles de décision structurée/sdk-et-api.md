---
order: 12
---

# Appeler le modèle : API, SDK, erreurs typées et réessais

Les chapitres précédents décrivent ce qu'on envoie (l'[état et les questions](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles)) et ce qu'on reçoit (les [réponses typées](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)). Ce dernier chapitre couvre le transport : comment ces échanges circulent réellement sur le réseau, en s'appuyant sur les notions déjà posées dans [API et HTTP](/?c=infrastructure&p=api-et-http) (méthode, code de statut, authentification).

## Un seul point d'entrée

Toute l'API tient sur un seul endpoint [HTTP](/?c=infrastructure&p=api-et-http) :

```text
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <cle_api>

{ "state": ..., "model": "jev-latest", "questions": { ... } }
```

La réponse renvoie le modèle utilisé, une carte de réponses (une par question posée) et un décompte de tokens consommés.

## Des SDK clients pour éviter d'écrire ces requêtes à la main

Deux bibliothèques officielles (Python, JavaScript/TypeScript) encapsulent cet appel HTTP, gèrent les réessais automatiquement et exposent les primitives [Choice/Score/Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul) comme des classes plutôt que des objets JSON bruts à construire à la main :

```python
from typesafe_sdk import TypeSafeClient, Choice

with TypeSafeClient() as client:                    # lit TYPESAFE_API_KEY dans l'environnement
    resultat = client.system_one(
        state="Je suis facture deux fois, aidez-moi.",
        questions={"facturation": Choice(instructions="...", criteria={...})},
    )
    print(resultat.answers["facturation"].choice)
```

Sans SDK officiel pour un langage donné, l'API HTTP reste directement utilisable : les SDK ne sont qu'une commodité, jamais un passage obligé.

## Des exceptions typées, une par code de statut

Plutôt qu'un seul type d'erreur générique à inspecter, le SDK définit une exception distincte par [code de statut HTTP](/?c=infrastructure&p=api-et-http), toutes héritant d'une exception commune : un pattern réutilisable pour n'importe quelle bibliothèque cliente d'API, pas spécifique à ce fournisseur.

| Exception | Code HTTP | Cause |
|---|---|---|
| `AuthenticationError` | 401 | Clé API invalide ou absente |
| `PermissionDeniedError` | 403 | Accès refusé à la ressource demandée |
| `NotFoundError` | 404 | Ressource inexistante |
| `BadRequestError` | 400 | Requête mal formée |
| `UnprocessableEntityError` | 422 | La requête est bien formée mais rejetée après validation par le serveur |
| `RateLimitError` | 429 | Trop de requêtes ; porte un délai d'attente conseillé (`retry_after_ms`) |
| `InternalServerError` | 5xx | Erreur côté serveur |
| `APIConnectionError` | (aucun) | La requête n'a jamais atteint le serveur (réseau coupé, DNS...) |
| `APITimeoutError` | (aucun) | Le délai maximal configuré a été dépassé avant toute réponse |

Attraper l'exception commune (`TypeSafeError`) suffit à couvrir tous les cas ; attraper une exception précise permet une réaction différenciée (ré-authentifier sur 401, ralentir sur 429).

## Réessayer automatiquement, mais pas n'importe comment

Le SDK réessaie automatiquement certaines erreurs, jamais toutes : une erreur 400 (requête mal formée) ne devient jamais valide en la répétant telle quelle, alors qu'une erreur 429 (trop de requêtes) ou 503 (serveur temporairement indisponible) peut réussir à la prochaine tentative. La documentation officielle ne publie pas de valeurs par défaut précises pour cette politique ; l'exemple ci-dessous illustre les paramètres configurables, pas des valeurs imposées :

```python
# max_retries     : nombre de tentatives supplementaires apres l'appel initial
# backoff_initial : delai avant le premier reessai
# backoff_max     : plafond du delai, meme apres plusieurs echecs
# jitter          : variation aleatoire ajoutee au delai, pour eviter que
#                    plusieurs clients ne reessaient tous au meme instant
retry = RetryPolicy(
    max_retries=3,
    backoff_initial=0.5,
    backoff_max=5.0,
    jitter=0.25,
    http_statuses={429, 500, 502, 503, 504},
)
```

Quand le serveur fournit un en-tête `Retry-After`, le client l'utilise en priorité sur son propre calcul de délai : le serveur connaît mieux que le client la durée réelle de sa propre surcharge.

> **Piège :** réessayer une erreur 400 ou 401 en boucle, en espérant qu'elle finisse par passer. Ces erreurs signalent un problème dans la requête elle-même (mal formée, mal authentifiée), jamais résolu par la seule répétition.
>
> **Bonne pratique :** ne réessayer que les erreurs réellement transitoires (réseau, surcharge temporaire, limite de débit), avec un délai croissant et une part d'aléa (jitter), en respectant l'en-tête `Retry-After` du serveur quand il est fourni.

## Désigner le modèle : alias stable ou version figée

Le modèle Jev illustre une tarification spécifique à cette famille de modèles : facturé uniquement sur les tokens d'**entrée** (le texte de l'état et des questions), environ 0,042 $/million de tokens selon l'annonce du fournisseur, jamais sur la sortie, cohérent avec le fait que la sortie est toujours une structure typée courte, jamais un texte généré au poids variable.

| | Valeur |
|---|---|
| Alias par défaut | `jev-latest` (pointe toujours vers la dernière version) |
| Version figée (exemple) | `jev-1.13.0` (ne change jamais de comportement) |
| Entrées acceptées | Texte uniquement (chaîne, objet ou tableau JSON) |

> **Piège :** figer `jev-latest` en production sans surveillance. Un alias qui pointe vers "la dernière version" peut changer de comportement sans prévenir lors d'une mise à jour du fournisseur.
>
> **Bonne pratique :** épingler une version précise (`jev-1.13.0`) pour un système en production dont le comportement doit rester stable, et ne passer à `jev-latest` que dans un environnement de test où un changement de comportement est acceptable à tout moment.

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | Un seul endpoint HTTP authentifié par clé porteur, des SDK Python/JS optionnels qui l'encapsulent, une exception typée par code de statut (pattern réutilisable pour toute API cliente), un réessai automatique limité aux erreurs transitoires avec délai croissant et respect de `Retry-After`. |
| **Outils utilisables** | L'API REST directement, ou les SDK Python/JavaScript officiels ; une politique de réessai configurable. |
| **Pièges à éviter** | Réessayer une erreur de requête mal formée (400) ou d'authentification (401) en boucle. |
| **Bonnes pratiques** | Ne réessayer que les erreurs transitoires (réseau, 429, 5xx), avec délai croissant, aléa (jitter), et priorité à l'en-tête `Retry-After` du serveur. |
