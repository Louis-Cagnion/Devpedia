---
order: 1
---

# OAuth 2.0 et OpenID Connect

Le bouton "Se connecter avec Google" (ou GitHub, Facebook...) est partout sur le web. Il ne demande jamais le mot de passe Google à l'application qui l'affiche : ce chapitre explique comment.

## Le problème : donner un accès sans donner son mot de passe

Une mauvaise solution, historiquement pratiquée, consiste à donner directement son mot de passe Google à une application tierce pour qu'elle accède à certaines données (les contacts, par exemple). Deux problèmes concrets :

- l'application obtient un accès **total** au compte Google, alors qu'elle n'a besoin que des contacts ;
- révoquer cet accès demande de changer le mot de passe Google lui-même, ce qui déconnecte au passage toutes les autres applications légitimes.

**OAuth 2.0** répond à ce problème : un protocole qui permet à une application tierce d'obtenir un accès limité et révocable à une ressource, sans jamais connaître le mot de passe du compte concerné.

## Les acteurs d'un échange OAuth

| Rôle | Qui c'est concrètement |
|---|---|
| Propriétaire de la ressource | L'utilisateur (son compte Google, ses contacts) |
| Client | L'application tierce qui demande l'accès |
| Serveur d'autorisation | Le service qui authentifie l'utilisateur et délivre les accès (Google, GitHub...) |
| Serveur de ressources | L'API qui détient la donnée protégée (l'API Contacts de Google, par exemple) |

## Le déroulement simplifié

```text
1. L'utilisateur clique "Se connecter avec Google" sur l'application tierce
2. L'application tierce redirige l'utilisateur vers Google
3. L'utilisateur se connecte CHEZ GOOGLE (jamais chez l'application tierce)
4. Google demande a l'utilisateur son consentement : "Cette application veut
   acceder a vos contacts, autoriser ?"
5. Si accepte, Google redirige vers l'application tierce avec un code temporaire
6. L'application tierce echange ce code contre un jeton d'acces
   (echange direct entre serveurs, avec son propre secret)
7. L'application tierce utilise ce jeton pour appeler l'API de Google
   au nom de l'utilisateur
```

L'application tierce ne voit jamais le mot de passe : seul Google le reçoit, à l'étape 3.

## Le jeton d'accès : portée limitée et révocable

Le **jeton d'accès** (*access token*) obtenu à l'étape 6 porte une **portée** (*scope*) précise : "lecture des contacts", par exemple, jamais un accès total au compte. Il peut aussi être révoqué à tout moment, indépendamment du mot de passe :

| | Partage direct du mot de passe | OAuth 2.0 |
|---|---|---|
| Portée de l'accès | Total, sans limite possible | Limitée à ce qui est explicitement accordé |
| Révocation | Change le mot de passe partout, y compris pour les usages légitimes | Révoque uniquement ce jeton précis |
| Le mot de passe transite-t-il vers le tiers ? | Oui | Jamais |

## Un autre flux : *Client Credentials*, sans utilisateur

Le déroulement vu plus haut (*Authorization Code*) suppose un utilisateur présent, qui se connecte et donne son consentement. Un autre cas, tout aussi courant, n'implique aucun utilisateur : un service qui doit appeler une API **pour son propre compte**, par exemple un serveur qui récupère chaque nuit des statistiques depuis l'API d'un outil de reporting.

```text
1. Le service A s'authentifie directement aupres du serveur d'autorisation
   avec son identifiant client + son secret client (client_id/client_secret)
2. Le serveur d'autorisation verifie ces identifiants et renvoie un jeton d'acces
   -- sans jamais rediriger vers qui que ce soit, sans etape de consentement
3. Le service A utilise ce jeton pour appeler l'API au nom de lui-meme,
   pas au nom d'un utilisateur
```

Ce flux s'appelle **Client Credentials** (*identifiants du client*). Contrairement à l'*Authorization Code*, il n'y a ni redirection, ni écran de consentement, ni utilisateur final impliqué à aucune étape : seul le `client_id`/`client_secret` du service appelant prouve son identité.

| | *Authorization Code* (vu plus haut) | *Client Credentials* |
|---|---|---|
| Qui se connecte | Un utilisateur final | Personne : le service s'authentifie lui-même |
| Redirection navigateur | Oui (étapes 2-5) | Aucune |
| Jeton obtenu au nom de | L'utilisateur | Le service lui-même |
| Cas d'usage typique | "Se connecter avec Google" | Un serveur qui appelle une API tierce pour son propre traitement (import, synchronisation planifiée...) |

> **Piège :** utiliser *Client Credentials* alors que l'action doit en réalité être attribuée à un utilisateur précis (ex : "quel utilisateur a demandé cet export ?"). Ce flux ne transporte aucune identité d'utilisateur : toute action effectuée avec ce jeton est indiscernable d'une action du service lui-même.
>
> **Bonne pratique :** réserver *Client Credentials* aux appels serveur-à-serveur qui n'ont explicitement besoin d'aucune notion d'utilisateur ; dès qu'une action doit être tracée jusqu'à une personne précise, repasser par un flux avec utilisateur (*Authorization Code*).

## OAuth ne prouve pas une identité : le rôle d'OpenID Connect

OAuth 2.0 a été conçu pour l'**autorisation** (accéder à une ressource), pas pour l'**authentification** (voir [Authentification vs autorisation](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation)). Obtenir un jeton d'accès aux contacts de quelqu'un ne prouve pas formellement qui s'est connecté : une application qui utiliserait ce seul jeton pour "reconnaître" un utilisateur détourne OAuth de son objectif initial.

**OpenID Connect** (OIDC) ajoute une couche d'identité au-dessus d'OAuth 2.0, spécifiquement pensée pour l'authentification : en plus du jeton d'accès, le serveur d'autorisation délivre un **jeton d'identité** (*ID token*), qui est un [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) standardisé contenant l'identité vérifiée de l'utilisateur (son identifiant, son email...). C'est ce jeton d'identité, et non le jeton d'accès, que le bouton "Se connecter avec Google" utilise réellement.

> **Piège :** utiliser un jeton d'accès OAuth brut pour authentifier un utilisateur, en supposant que son obtention prouve son identité. Un jeton d'accès prouve seulement qu'un accès a été autorisé, pas qui s'est connecté : c'est le rôle du jeton d'identité OpenID Connect.
>
> **Bonne pratique :** utiliser OpenID Connect (et son jeton d'identité) dès que le besoin est de savoir *qui* se connecte, et réserver OAuth 2.0 seul aux cas où le besoin est uniquement d'accéder à une ressource au nom de l'utilisateur.

## Attaques sur le flux *Authorization Code*

Le déroulement en 7 étapes vu plus haut comporte trois points de contrôle qu'une implémentation négligente peut laisser ouverts :

| Attaque | Étape visée | Principe | Défense |
|---|---|---|---|
| `redirect_uri` non validé strictement | Étape 5 (Google redirige avec le code) | Le serveur d'autorisation accepte une variante de l'URL déclarée (`https://site.example.evil.com`, ou un simple sous-chemin non prévu) : le code temporaire part alors vers l'attaquant au lieu de l'application légitime | Le serveur d'autorisation doit exiger une correspondance EXACTE, caractère pour caractère, avec l'URL déclarée à l'avance (voir aussi le piège de correspondance exacte détaillé dans [l'environnement local PHP](/?c=infrastructure-devops&s=infrastructure&p=environnement-local-php-sql-server)) |
| `state` absent | Étapes 2 à 5 | Sans ce paramètre, rien ne relie la redirection reçue à une demande initiée par CETTE victime précise : un attaquant peut préparer son propre échange OAuth, puis piéger la victime pour qu'elle termine ce flux à sa place, la connectant de force au compte tiers de l'attaquant (une forme de [CSRF](/?c=langages&s=php&p=securite) appliquée au flux de connexion lui-même) | Générer une valeur `state` aléatoire et imprévisible avant la redirection, la stocker côté serveur/session, puis vérifier qu'elle revient identique à l'étape 5 |
| Interception du code d'autorisation (PKCE absent) | Entre les étapes 5 et 6 | Un client "public" (une application mobile, une SPA) ne peut pas garder de secret confidentiel pour l'échange de l'étape 6 : si le code intercepté en transit (étape 5) suffit à lui seul à obtenir un jeton, un attaquant qui l'intercepte peut terminer l'échange à la place du client légitime | **PKCE** (*Proof Key for Code Exchange*) : le client génère un secret temporaire AVANT l'étape 2, n'en envoie qu'une empreinte, puis doit fournir le secret d'origine à l'étape 6 — un code intercepté seul ne suffit plus sans ce secret jamais transmis en clair |

> **Piège :** considérer PKCE comme réservé aux seules applications mobiles/SPA sous prétexte qu'il a été conçu pour elles. Les recommandations actuelles du protocole l'imposent aussi pour un client confidentiel classique (serveur web), en défense supplémentaire, pas seulement pour les clients publics.
>
> **Bonne pratique :** valider `redirect_uri` par correspondance exacte, toujours transmettre et vérifier `state`, et activer PKCE même pour un client côté serveur qui dispose déjà d'un secret confidentiel.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | OAuth 2.0 permet à une application tierce d'obtenir un accès limité et révocable à une ressource, sans jamais connaître le mot de passe du compte. *Client Credentials* obtient un jeton sans aucun utilisateur, pour un service qui agit pour son propre compte. OpenID Connect ajoute par-dessus un jeton d'identité (un JWT) spécifiquement conçu pour l'authentification, ce qu'OAuth seul ne fournit pas. Le flux *Authorization Code* expose trois points de contrôle critiques : `redirect_uri`, `state`, et l'interception du code (PKCE). |
| **Outils utilisables** | Une bibliothèque OAuth/OIDC du langage utilisé plutôt qu'une implémentation manuelle du protocole. |
| **Pièges à éviter** | Partager directement un mot de passe avec une application tierce. Utiliser un jeton d'accès OAuth pour authentifier un utilisateur. Utiliser *Client Credentials* pour une action qui doit être attribuée à un utilisateur précis. Valider `redirect_uri` de façon trop permissive. Omettre `state` ou PKCE. |
| **Bonnes pratiques** | Toujours limiter la portée (*scope*) demandée au strict nécessaire. Utiliser OpenID Connect quand le besoin est de prouver une identité, pas seulement d'accéder à une ressource. Réserver *Client Credentials* aux appels serveur-à-serveur sans notion d'utilisateur. Correspondance exacte sur `redirect_uri`, `state` systématique, PKCE même côté serveur. |
