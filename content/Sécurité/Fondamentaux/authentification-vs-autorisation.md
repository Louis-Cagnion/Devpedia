---
order: 1
---

# Authentification vs autorisation

> **Analogie :** un badge d'entreprise. À l'entrée, le gardien vérifie que la photo sur le badge correspond bien à votre visage : c'est l'**authentification**, prouver qui vous êtes. Une fois entré, ce même badge détermine quelles portes s'ouvrent à votre passage (bureau, salle serveur, toit-terrasse) : c'est l'**autorisation**, ce que vous avez le droit de faire une fois identifié. Les deux mécanismes travaillent ensemble, mais ce sont deux vérifications distinctes, faites à des moments différents.

Cette confusion revient si souvent qu'elle mérite d'être posée avant tout le reste : ce chapitre pose les définitions sur lesquelles s'appuient tous les autres chapitres de cette catégorie.

## Authentification : prouver qui vous êtes

L'**authentification** est le processus qui vérifie qu'une personne (ou un programme) est bien celle qu'elle prétend être. Prouver son identité repose toujours sur au moins un de ces trois types de preuve, appelés **facteurs d'authentification** :

| Facteur | Ce que c'est | Exemple |
|---|---|---|
| Quelque chose que vous savez | Une information secrète mémorisée | Un mot de passe, un code PIN |
| Quelque chose que vous avez | Un objet physique ou numérique en votre possession | Un téléphone recevant un code, une clé USB de sécurité |
| Quelque chose que vous êtes | Une caractéristique biologique propre à vous | Une empreinte digitale, la reconnaissance faciale |

```text
Utilisateur                          Serveur
------------                         -------
saisit identifiant + mot de passe -> verifie la correspondance
                                      avec ce qui est enregistre
                                   <- authentifie (ou refuse)
```

La plupart des systèmes reposent aujourd'hui sur un seul facteur (le mot de passe) : un choix pratique, mais fragile, puisqu'un seul secret compromis suffit à usurper l'identité entière. D'autres chapitres de cette catégorie détaillent comment stocker ce secret correctement, et comment combiner plusieurs facteurs pour réduire ce risque.

## Autorisation : ce que vous avez le droit de faire

Une fois l'identité vérifiée, l'**autorisation** détermine à quelles ressources ou actions cette identité a accès. Deux employés d'une même entreprise peuvent s'authentifier avec le même succès sur le même système, sans pour autant avoir les mêmes droits une fois connectés :

```text
Employe A (authentifie) -> role "comptabilite"    -> peut voir les salaires
Employe B (authentifie) -> role "developpement"   -> ne peut PAS voir les salaires
```

L'authentification répond à la question *"qui êtes-vous ?"*, une seule fois par connexion. L'autorisation répond à *"avez-vous le droit de faire ceci précisément ?"*, potentiellement à chaque action, et peut changer sans que la personne ait besoin de se réauthentifier (un changement de rôle, par exemple).

## Une illustration concrète : les codes HTTP 401 et 403

Le chapitre sur [les API et HTTP](/?c=infrastructure&p=api-et-http) présente le code de statut comme le nombre qui indique si une requête a réussi, et sinon pourquoi. Deux codes précis illustrent exactement la distinction posée plus haut :

| Code | Nom officiel | Signifie en réalité |
|---|---|---|
| `401` | *Unauthorized* | Authentification manquante ou invalide : le serveur ne sait pas qui vous êtes |
| `403` | *Forbidden* | Authentification réussie, mais autorisation refusée : le serveur sait qui vous êtes, et refuse |

> **Piège :** se fier au nom officiel `Unauthorized` du code `401` et penser qu'il signale un problème d'autorisation. Historiquement mal nommé, il signale en réalité une authentification manquante ou invalide : c'est `403` qui couvre le vrai refus d'autorisation, une fois l'identité pourtant bien établie.
>
> **Bonne pratique :** face à une erreur d'accès, vérifier d'abord de quel code il s'agit avant de chercher la cause : un `401` se corrige en fournissant ou renouvelant des identifiants valides, un `403` ne se corrige jamais de cette façon puisque l'identité est déjà acceptée, seul le rôle ou les permissions doivent changer.

## Un mécanisme simple : l'authentification HTTP Basic

**HTTP Basic** est un mécanisme d'authentification porté par le protocole HTTP lui-même, plutôt que par l'application : c'est le navigateur qui affiche sa propre pop-up de connexion (pas un formulaire de connexion conçu par le site), et les identifiants voyagent dans un en-tête `Authorization` à chaque requête.

```text
Client                                  Serveur
------                                  -------
requete sans en-tete Authorization  ->  401, en-tete "WWW-Authenticate: Basic"
(le navigateur affiche sa pop-up)
requete avec en-tete
"Authorization: Basic dXNlcjpwYXNz" ->  200, si les identifiants sont valides
```

L'en-tête transmis n'est autre que `identifiant:mot_de_passe` encodé en **Base64** (`dXNlcjpwYXNz` décode en `user:pass`).

> **Piège :** croire que l'encodage Base64 protège les identifiants d'une façon ou d'une autre. Base64 n'est **ni un hachage ni un chiffrement** (voir la distinction posée dans [Cryptographie appliquée](/?c=securite&s=cybersecurite&p=cryptographie-appliquee)) : ce n'est qu'une représentation, instantanément décodable par quiconque intercepte la requête, sans aucune clé nécessaire.
>
> **Bonne pratique :** n'utiliser HTTP Basic qu'à travers une connexion HTTPS systématique, jamais en clair : sans HTTPS, les identifiants circulent en clair (au sens propre) sur le réseau.

Autre différence avec les mécanismes déjà couverts ([sessions/cookies](/?c=securite&s=sessions-et-tokens&p=sessions-et-cookies), [JWT](/?c=securite&s=sessions-et-tokens&p=jwt-et-tokens)) : HTTP Basic n'a pas de notion de déconnexion propre côté serveur. Le navigateur retient les identifiants pour le domaine tant que l'onglet reste ouvert, et les renvoie automatiquement à chaque requête suivante ; il n'existe pas d'équivalent direct à la suppression d'un cookie de session ou à l'expiration d'un JWT.

## Pourquoi bien distinguer les deux compte en pratique

Confondre les deux mécanismes mène à corriger le mauvais problème : réinitialiser le mot de passe d'un utilisateur qui reçoit un `403` ne change rien, puisque son identité était déjà valide, le problème vient de ses droits. À l'inverse, modifier les permissions d'un compte qui reçoit un `401` ne sert à rien tant que l'authentification elle-même échoue.

> **Piège :** traiter toute erreur d'accès comme un problème d'identifiants par réflexe, sans vérifier si l'authentification a réellement échoué ou si c'est l'autorisation qui refuse.
>
> **Bonne pratique :** toujours identifier lequel des deux mécanismes est en cause avant d'agir, en s'appuyant sur le code de statut renvoyé (`401` vs `403`) quand la vérification se fait via une API.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | L'authentification prouve qui vous êtes (via un ou plusieurs facteurs : savoir, avoir, être) ; l'autorisation détermine ce que vous avez le droit de faire une fois identifié. Deux mécanismes distincts, souvent confondus. HTTP Basic est un mécanisme d'authentification simple porté par HTTP lui-même, à réserver à une connexion HTTPS systématique. |
| **Outils utilisables** | Les codes HTTP `401` (authentification) et `403` (autorisation) pour diagnostiquer précisément lequel des deux mécanismes échoue ; l'en-tête `Authorization: Basic` pour une authentification HTTP simple. |
| **Pièges à éviter** | Se fier au nom `Unauthorized` du code `401`, qui signale en réalité un problème d'authentification, pas d'autorisation. Corriger le mauvais mécanisme (réinitialiser un mot de passe face à un `403`, par exemple). Croire que l'encodage Base64 d'HTTP Basic protège les identifiants. |
| **Bonnes pratiques** | Toujours identifier lequel des deux mécanismes est en cause avant d'agir. S'appuyer sur le code de statut renvoyé par une API pour trancher rapidement. N'utiliser HTTP Basic qu'à travers HTTPS, jamais en clair. |
