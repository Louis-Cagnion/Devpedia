---
order: 2
---

# JWT et tokens

Le chapitre précédent montre que la session oblige le serveur à garder un espace de stockage dédié, consulté à chaque requête. Ça fonctionne très bien pour un serveur unique, mais devient plus contraignant dès que plusieurs serveurs traitent les requêtes d'un même site : chacun doit alors accéder au même espace de sessions, une dépendance supplémentaire à faire fonctionner. Une autre approche évite ce problème : au lieu de stocker l'information côté serveur, on l'encode directement **dans** le token que le client transporte.

## Le JWT : une information auto-suffisante et vérifiable

Un **JWT** (*JSON Web Token*) encode des informations en [JSON](/?c=infrastructure&p=json) directement dans le token, puis les signe cryptographiquement. Un JWT se compose toujours de trois parties séparées par un point :

```text
en-tete.donnees.signature

eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxMiwiZXhwIjoxNzM1Njg5NjAwfQ.4f8a2c...
     |                          |                                  |
  en-tete                    donnees                            signature
  (algorithme               (les informations                (calculee a partir
   utilise)                  encodees, en JSON)                 des deux premieres
                                                                  parties + un secret
                                                                  connu du serveur)
```

Le serveur qui reçoit un JWT recalcule la signature à partir de l'en-tête et des données reçues, avec son propre secret, et la compare à celle fournie : si elles correspondent, le contenu n'a pas été modifié depuis son émission. Cette vérification ne nécessite **aucun accès à un espace de stockage** : c'est ce qui rend un JWT *stateless* (sans état), à l'inverse d'une session.

## Ce que contient un JWT : jamais chiffré, seulement signé

Les données d'un JWT sont encodées en [Base64](https://en.wikipedia.org/wiki/Base64), pas chiffrées : n'importe qui peut décoder ces données et les lire, y compris un attaquant qui intercepte le token. Seule la signature empêche de les **modifier** sans que ça se remarque, elle n'empêche personne de les **lire**.

```text
Donnees decodees d'un JWT :  { "user_id": 12, "exp": 1735689600 }
                              -> lisible par n'importe qui en possession du token,
                                 meme sans connaitre le secret du serveur
```

> **Piège :** placer une donnée sensible (mot de passe, numéro de carte bancaire, information confidentielle) dans les données d'un JWT, en pensant que la signature la protège. La signature garantit l'intégrité (rien n'a été modifié), jamais la confidentialité (tout le monde peut lire).
>
> **Bonne pratique :** ne placer dans un JWT que des informations qui peuvent être lues sans risque si le token est intercepté (un identifiant utilisateur, une date d'expiration, un rôle), jamais un secret.

## Le vrai piège du stateless : révoquer un JWT avant son expiration

Une session se révoque instantanément : il suffit de supprimer la donnée correspondante côté serveur, et l'identifiant devient inutile. Un JWT, lui, reste valide tant que sa date d'expiration n'est pas atteinte, précisément parce que le serveur ne garde aucune trace de ceux qu'il a émis : le déconnecter de force avant son expiration naturelle (un compte piraté, un employé qui quitte l'entreprise) demande une mécanique supplémentaire (une liste noire consultée à chaque requête), ce qui annule une partie de l'avantage stateless recherché au départ.

| | Session | JWT |
|---|---|---|
| Où l'information vit | Côté serveur | Dans le token lui-même |
| Révocation avant expiration | Immédiate (supprimer côté serveur) | Difficile sans mécanisme supplémentaire |
| Partage entre plusieurs serveurs | Nécessite un espace de stockage commun | Aucun espace partagé nécessaire |
| Contenu lisible si intercepté | Non (juste un identifiant opaque) | Oui (données en clair, seulement signées) |

> **Piège :** choisir un JWT pour sa simplicité apparente sans avoir anticipé le cas où un token doit être révoqué avant son expiration naturelle (déconnexion forcée, compte compromis).
>
> **Bonne pratique :** garder une durée de vie courte pour un JWT (quelques minutes à quelques heures), et prévoir un mécanisme de renouvellement plutôt qu'un token valide plusieurs jours, pour limiter la fenêtre où une révocation anticipée serait nécessaire.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | Un JWT encode des informations en JSON directement dans le token et les signe, ce qui permet de les vérifier sans stockage côté serveur (stateless). Ses données sont encodées, jamais chiffrées : lisibles par quiconque possède le token, seule leur modification est empêchée par la signature. |
| **Outils utilisables** | Une bibliothèque JWT du langage utilisé pour générer et vérifier la signature, plutôt qu'une implémentation manuelle. |
| **Pièges à éviter** | Placer une donnée sensible dans un JWT en pensant qu'elle est protégée. Choisir un JWT sans avoir anticipé le besoin de révocation anticipée. |
| **Bonnes pratiques** | Ne mettre dans un JWT que des données qui peuvent être lues sans risque. Garder une durée de vie courte et prévoir un renouvellement plutôt qu'un token longue durée. |
