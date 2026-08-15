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

## OAuth ne prouve pas une identité : le rôle d'OpenID Connect

OAuth 2.0 a été conçu pour l'**autorisation** (accéder à une ressource), pas pour l'**authentification** (voir [Authentification vs autorisation](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation)). Obtenir un jeton d'accès aux contacts de quelqu'un ne prouve pas formellement qui s'est connecté : une application qui utiliserait ce seul jeton pour "reconnaître" un utilisateur détourne OAuth de son objectif initial.

**OpenID Connect** (OIDC) ajoute une couche d'identité au-dessus d'OAuth 2.0, spécifiquement pensée pour l'authentification : en plus du jeton d'accès, le serveur d'autorisation délivre un **jeton d'identité** (*ID token*), qui est un [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) standardisé contenant l'identité vérifiée de l'utilisateur (son identifiant, son email...). C'est ce jeton d'identité, et non le jeton d'accès, que le bouton "Se connecter avec Google" utilise réellement.

> **Piège :** utiliser un jeton d'accès OAuth brut pour authentifier un utilisateur, en supposant que son obtention prouve son identité. Un jeton d'accès prouve seulement qu'un accès a été autorisé, pas qui s'est connecté : c'est le rôle du jeton d'identité OpenID Connect.
>
> **Bonne pratique :** utiliser OpenID Connect (et son jeton d'identité) dès que le besoin est de savoir *qui* se connecte, et réserver OAuth 2.0 seul aux cas où le besoin est uniquement d'accéder à une ressource au nom de l'utilisateur.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | OAuth 2.0 permet à une application tierce d'obtenir un accès limité et révocable à une ressource, sans jamais connaître le mot de passe du compte. OpenID Connect ajoute par-dessus un jeton d'identité (un JWT) spécifiquement conçu pour l'authentification, ce qu'OAuth seul ne fournit pas. |
| **Outils utilisables** | Une bibliothèque OAuth/OIDC du langage utilisé plutôt qu'une implémentation manuelle du protocole. |
| **Pièges à éviter** | Partager directement un mot de passe avec une application tierce. Utiliser un jeton d'accès OAuth pour authentifier un utilisateur. |
| **Bonnes pratiques** | Toujours limiter la portée (*scope*) demandée au strict nécessaire. Utiliser OpenID Connect quand le besoin est de prouver une identité, pas seulement d'accéder à une ressource. |
