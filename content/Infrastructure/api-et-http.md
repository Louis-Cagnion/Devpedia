---
order: 1
---

# Les échanges de données : API et HTTP

Deux programmes qui tournent sur des machines différentes (un téléphone et un serveur distant, par exemple) ne partagent ni mémoire ni fichiers : pour échanger une information, ils doivent envoyer des messages sur un réseau, selon des règles communes que les deux comprennent. **HTTP** (*HyperText Transfer Protocol*) est l'ensemble de règles le plus utilisé pour ces échanges.

> **Analogie :** commander dans un restaurant. Le client (la salle) envoie une commande précise à la cuisine ; la cuisine répond avec un plat, ou avec un message si la commande ne peut pas être honorée ("rupture de stock"). Aucune des deux parties n'a besoin de savoir comment l'autre fonctionne en interne, seulement comment formuler la commande et lire la réponse.

## Client et serveur : qui demande, qui répond

```text
Client (navigateur, application, script...)          Serveur (machine distante)

        ------------- requete ------------->
        <------------ reponse --------------
```

Le **client** est celui qui initie l'échange (une requête) ; le **serveur** est celui qui la reçoit et y répond. Un même programme peut être client dans un échange et serveur dans un autre.

## Une requête : une méthode, une adresse, parfois des données

Chaque requête HTTP précise une **méthode** (ce qu'on veut faire) et une adresse (la ressource concernée) :

| Méthode | Rôle | Exemple |
|---|---|---|
| `GET` | Récupérer une information, sans la modifier | Charger une page web, lire la liste des produits d'une boutique |
| `POST` | Envoyer une nouvelle donnée, généralement pour la créer | Envoyer un formulaire, créer un compte utilisateur |
| `PUT` | Remplacer une donnée existante | Mettre à jour les informations d'un profil |
| `DELETE` | Supprimer une donnée | Supprimer un message |

> **Piège :** utiliser `GET` pour une action qui modifie une donnée (par exemple, supprimer un élément via une simple adresse cliquable). Un `GET` est censé pouvoir être répété sans conséquence (recharger une page ne devrait rien changer) ; de nombreux outils (aspirateurs de site, prévisualisations de liens) déclenchent des `GET` automatiquement, sans intention de l'utilisateur.
>
> **Bonne pratique :** réserver `GET` à la seule lecture, et utiliser `POST`/`PUT`/`DELETE` pour toute action qui modifie réellement une donnée.

## La réponse : un code de statut, parfois des données

Le serveur répond toujours avec un **code de statut** (un nombre qui indique si la requête a réussi, et sinon pourquoi) :

| Code | Catégorie | Exemple |
|---|---|---|
| `200` | Succès | La requête a été traitée correctement |
| `301` / `302` | Redirection | La ressource demandée se trouve à une autre adresse |
| `404` | Erreur côté client | La ressource demandée n'existe pas |
| `500` | Erreur côté serveur | Le serveur a rencontré un problème interne en traitant la requête |

> **Piège :** ignorer le code de statut et supposer qu'une requête a réussi simplement parce qu'une réponse est arrivée. Un serveur en erreur (`500`) renvoie tout de même une réponse, souvent avec un contenu qui ressemble à s'y méprendre à une réponse normale si le code n'est pas vérifié.
>
> **Bonne pratique :** toujours vérifier le code de statut d'une réponse avant d'utiliser son contenu, et prévoir explicitement un traitement pour les cas d'erreur plutôt que de ne coder que le chemin de succès.

## Une API : un serveur pensé pour un programme, pas pour un humain

Une **API** (*Application Programming Interface*) désigne, dans ce contexte, un serveur qui répond avec des données structurées destinées à être lues par un programme, plutôt qu'avec une page web destinée à être affichée dans un navigateur (voir le format le plus courant pour ces données, [JSON](/?c=infrastructure&p=json)) :

```text
Requete :  GET https://api.exemple.com/meteo?ville=Lyon

Reponse (statut 200) :
{
  "ville": "Lyon",
  "temperature": 18,
  "conditions": "nuageux"
}
```

Un programme peut alors lire directement `temperature` ou `conditions`, sans avoir à extraire ces informations d'une page web conçue pour l'affichage.

> **Piège :** confondre "le serveur ne répond pas" (délai dépassé, réseau coupé) et "le serveur répond avec une erreur" (code `4xx`/`5xx`) ; les deux nécessitent un traitement différent, mais ressemblent à un échec similaire du point de vue de l'appelant si les deux cas ne sont pas distingués explicitement dans le code.
>
> **Bonne pratique :** distinguer explicitement, dans le code qui appelle une API, l'absence de réponse (timeout) du refus explicite de la requête (code d'erreur) ; les deux appellent des réactions différentes (réessayer, ou corriger la requête).

## Ce qu'il faut retenir

| | |
|---|---|
| **À retenir** | HTTP est le protocole le plus courant pour échanger des données entre un client et un serveur. Une requête précise une méthode (`GET`/`POST`/`PUT`/`DELETE`) ; une réponse porte toujours un code de statut. Une API est un serveur pensé pour être utilisé par un programme plutôt qu'un humain. |
| **Outils utilisables** | Un navigateur (pour un `GET` simple), ou un outil dédié (`curl`, Postman, une bibliothèque HTTP dans le langage de son choix) pour construire une requête complète. |
| **Pièges à éviter** | Utiliser `GET` pour une action qui modifie une donnée. Ignorer le code de statut d'une réponse. Confondre une absence de réponse et une réponse d'erreur explicite. |
| **Bonnes pratiques** | Réserver `GET` à la lecture seule. Vérifier systématiquement le code de statut avant d'utiliser le contenu d'une réponse. Traiter explicitement les cas d'erreur, pas seulement le cas de succès. |
