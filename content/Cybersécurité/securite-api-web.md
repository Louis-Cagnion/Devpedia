---
order: 7
---

# Sécurité des API web

Une [API web](/?c=infrastructure&p=api-et-http) expose des données et des actions à des programmes clients, potentiellement exécutés dans des contextes que le serveur ne maîtrise pas (un navigateur, une application mobile, un autre serveur). Ce chapitre couvre les préoccupations propres à ce contexte ; l'authentification par jeton (JWT, sessions) est déjà détaillée dans la catégorie [Authentification](/?c=authentification), et les mécanismes CSRF/brute force génériques dans [Sécuriser vos données](/?c=langages-de-programmation&s=php&p=securite).

## CORS : autoriser (ou non) un site à appeler une API depuis un autre domaine

Par défaut, un navigateur applique la **politique de même origine** (*same-origin policy*) : une page chargée depuis `site-a.example` ne peut pas lire la réponse d'une requête vers `api.site-b.example`, même si la requête part techniquement. Cette restriction protège l'utilisateur : sans elle, n'importe quel site visité pourrait lire les données d'un autre site où l'utilisateur est connecté, à son insu.

**CORS** (*Cross-Origin Resource Sharing*) est le mécanisme qui permet à un serveur d'autoriser explicitement certaines origines à lire ses réponses, malgré cette restriction par défaut :

```text
Navigateur (page chargee depuis site-a.example)
        |
        | requete vers api.site-b.example
        v
   Serveur api.site-b.example
        |
        | reponse + en-tete :
        | Access-Control-Allow-Origin: https://site-a.example
        v
Navigateur : origine autorisee -> la page peut lire la reponse
```

```http
Access-Control-Allow-Origin: https://site-a.example
```

| Configuration | Effet | Risque |
|---|---|---|
| `Access-Control-Allow-Origin: https://site-a.example` | Seule cette origine précise peut lire la réponse | Aucun si la liste reste restreinte aux origines réellement légitimes |
| `Access-Control-Allow-Origin: *` | N'importe quelle origine peut lire la réponse | Acceptable pour une API publique sans donnée sensible ni action liée à un compte ; dangereux sinon |

> **Piège :** répondre `Access-Control-Allow-Origin: *` par réflexe pour "faire disparaître l'erreur CORS" en développement, puis oublier de le restreindre avant la mise en production d'une API qui manipule des données de compte.
>
> **Bonne pratique :** n'autoriser que les origines précises qui ont réellement besoin d'accéder à l'API, jamais `*` dès qu'une donnée sensible ou liée à un utilisateur authentifié est en jeu.

## Authentifier une API : clé ou jeton, selon le client

| Mécanisme | Convient pour | Détail |
|---|---|---|
| Clé d'API | Un service tiers, un script, un accès serveur-à-serveur | Voir [Gestion des secrets](/?c=cybersecurite&p=gestion-des-secrets) pour la stocker correctement |
| Jeton (JWT, session) | Un utilisateur humain authentifié | Voir [JWT et tokens](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) et [Sessions et cookies](/?c=authentification&s=sessions-et-tokens&p=sessions-et-cookies) |
| Délégation OAuth 2.0 | Un accès accordé par l'utilisateur à une application tierce, sans partager son mot de passe | Voir [OAuth 2.0 et OpenID Connect](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) |

## Limiter le débit des requêtes (*rate limiting*)

Sans limite, une API reste vulnérable à deux abus liés mais distincts : le [brute force](/?c=langages-de-programmation&s=php&p=securite) (deviner un mot de passe ou un jeton en testant énormément de valeurs) et la simple saturation par un client trop gourmand, volontaire ou non (un bug côté client qui rappelle l'API en boucle).

```text
Client                          API avec rate limiting

requete 1  --------------->     acceptee (1/100 ce mois-ci)
requete 2  --------------->     acceptee (2/100)
...
requete 101 -------------->     429 Too Many Requests
                                 (quota depasse, reessayer plus tard)
```

Le code de statut `429 Too Many Requests` (voir les codes de statut dans [Les échanges de données : API et HTTP](/?c=infrastructure&p=api-et-http)) signale précisément ce refus, distinct d'une erreur de requête classique.

| Stratégie | Principe |
|---|---|
| Par IP | Limite le nombre de requêtes depuis une même adresse IP |
| Par compte/clé d'API | Limite le nombre de requêtes pour un utilisateur ou une clé donnée, indépendamment de l'IP d'origine |
| Fenêtre glissante | Recalcule le quota en continu plutôt qu'à intervalles fixes, pour éviter qu'un client ne "vide" son quota juste avant chaque réinitialisation |

## Ne jamais exposer plus que nécessaire

Une réponse d'API qui renvoie l'intégralité d'un enregistrement interne (y compris des champs jamais utilisés par le client : mot de passe haché, notes internes, identifiants techniques) élargit inutilement ce qu'un attaquant peut récupérer en cas d'accès non prévu à cette réponse. Ce réflexe rejoint le principe de moindre privilège déjà vu dans [Principes de développement sécurisé](/?c=cybersecurite&p=principes-de-developpement-securise), appliqué cette fois à la donnée exposée plutôt qu'à un accès système.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | CORS autorise explicitement certaines origines à lire la réponse d'une API malgré la politique de même origine du navigateur. Le rate limiting protège contre le brute force et la saturation. Une API ne doit exposer que les champs réellement nécessaires au client. |
| **Outils utilisables** | En-tête `Access-Control-Allow-Origin`, code de statut `429 Too Many Requests`, clé d'API/JWT/OAuth 2.0 selon le type de client. |
| **Pièges à éviter** | `Access-Control-Allow-Origin: *` sur une API manipulant des données sensibles ; absence de limite de débit ; renvoyer l'intégralité d'un enregistrement interne dans une réponse. |
| **Bonnes pratiques** | Restreindre CORS aux origines réellement légitimes ; limiter le débit par compte/clé en plus de l'IP ; ne renvoyer que les champs dont le client a réellement besoin. |
