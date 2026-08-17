---
order: 3
---

# Propagation d'identité entre services (On-Behalf-Of)

Une application n'est presque jamais un seul service isolé : un frontend appelle un service A, qui a besoin d'appeler un service B pour terminer la requête. Quand l'utilisateur s'est authentifié via [OAuth 2.0](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) auprès du service A, une question se pose immédiatement : avec **quelle identité** le service A doit-il appeler le service B ?

## La mauvaise réponse : un compte de service générique

La solution la plus simple, mais la moins sûre, consiste à donner au service A un **compte de service** à lui, avec des droits larges, pour appeler le service B :

```text
Utilisateur -> Service A -> Service B
(identite       (compte de       (recoit une requete du
 perdue          service,        "compte de service A",
 en route)       droits larges)  pas de l'utilisateur)
```

> **Piège :** le service B ne voit jamais l'identité de l'utilisateur final, seulement celle du service A. Impossible de savoir, côté service B, quel utilisateur a réellement déclenché l'action ; et le compte de service, pour couvrir tous les utilisateurs possibles, doit porter des droits plus larges que ceux d'un utilisateur individuel, un risque en cas de compromission du service A.
>
> **Bonne pratique :** propager l'identité réelle de l'utilisateur d'un service à l'autre, plutôt que de la remplacer par un compte technique générique.

## La bonne réponse : le flux On-Behalf-Of

Le flux **On-Behalf-Of** (OBO) répond à ce problème : le service A échange le jeton reçu de l'utilisateur contre un nouveau jeton, toujours au nom de cet utilisateur, mais **scopé** pour appeler le service B :

```text
1. L'utilisateur s'authentifie, obtient un jeton pour le Service A
2. Service A doit appeler Service B pour repondre a la requete
3. Service A echange son jeton utilisateur contre un nouveau jeton
   (aupres du serveur d'autorisation), toujours au nom du meme utilisateur,
   mais avec la portee (scope) du Service B
4. Service A appelle Service B avec ce nouveau jeton
5. Service B voit l'identite reelle de l'utilisateur, et applique
   SES permissions a lui, pas celles d'un compte de service
```

Le service B peut alors appliquer un [contrôle d'accès (RBAC/ABAC)](/?c=authentification&s=fondamentaux&p=rbac-et-abac) basé sur les droits réels de l'utilisateur final, exactement comme s'il l'avait reçu directement, plutôt que sur les droits (souvent plus larges) d'un compte technique.

## Comparatif

| | Compte de service générique | On-Behalf-Of |
|---|---|---|
| Identité vue par le service final | Le service appelant | L'utilisateur final |
| Droits appliqués | Ceux, larges, du compte de service | Ceux, réels, de l'utilisateur |
| Traçabilité | Impossible de savoir quel utilisateur a déclenché l'appel | L'utilisateur exact reste identifiable à chaque saut |
| Risque en cas de compromission d'un service intermédiaire | Élevé : le compte de service peut agir pour n'importe quel utilisateur | Limité à ce que l'utilisateur courant peut faire lui-même |

> **Piège :** propager le jeton **original** de l'utilisateur tel quel vers le service B, plutôt que d'en échanger un nouveau scopé pour ce service. Un jeton pensé pour le service A (avec la portée du service A) accepté tel quel par le service B casse l'isolation entre services : un jeton volé sur le service B donnerait aussi accès au service A.
>
> **Bonne pratique :** toujours échanger un nouveau jeton, scopé spécifiquement pour le service appelé, plutôt que de faire circuler le même jeton d'un service à l'autre.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Le flux On-Behalf-Of permet à un service backend d'appeler un autre service au nom de l'utilisateur final, en échangeant son jeton contre un nouveau jeton scopé, plutôt qu'en utilisant un compte de service générique à droits larges. |
| **Outils utilisables** | Le mécanisme d'échange de jeton (*token exchange*) fourni par la plupart des serveurs d'autorisation OAuth 2.0 / OpenID Connect. |
| **Pièges à éviter** | Utiliser un compte de service générique pour les appels inter-services. Faire circuler le jeton original de l'utilisateur tel quel entre plusieurs services. |
| **Bonnes pratiques** | Propager l'identité réelle de l'utilisateur à chaque saut. Échanger un nouveau jeton scopé pour chaque service appelé. |
