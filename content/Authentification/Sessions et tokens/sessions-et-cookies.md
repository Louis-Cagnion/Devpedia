---
order: 1
---

# Sessions et cookies

Le chapitre sur [les API et HTTP](/?c=infrastructure&p=api-et-http) présente comment un client envoie une requête et reçoit une réponse. Ce qu'il ne dit pas encore : HTTP est un protocole **sans état** (*stateless*), chaque requête est traitée indépendamment des précédentes, comme si le serveur avait une amnésie totale entre deux requêtes. Sans mécanisme supplémentaire, un site devrait redemander l'identifiant et le mot de passe à chaque nouvelle page consultée.

```text
Requete 1 : POST /login (email + mot de passe)  -> le serveur verifie, repond "connexion reussie"
Requete 2 : GET /profil                          -> le serveur ne sait RIEN de la requete 1 :
                                                     pour lui, c'est un visiteur anonyme
```

## La solution : un identifiant que le client renvoie à chaque requête

Après une connexion réussie, le serveur crée une **session** : un espace de stockage gardé de son côté, associé à ce visiteur précis (son identifiant utilisateur, ses droits...). Il donne en retour au client un **identifiant de session**, une valeur unique que le client renverra ensuite à chaque requête, pour que le serveur sache à quelle session se rattacher :

```text
Client                                    Serveur
------                                    -------
POST /login (email + mot de passe)   ->   verifie, cree une session,
                                           repond avec l'identifiant
                                      <-   Set-Cookie: session_id=a8f3d9...

GET /profil
Cookie: session_id=a8f3d9...         ->   retrouve la session a8f3d9...,
                                           sait que c'est cet utilisateur
                                      <-   repond avec son profil
```

## Le cookie : ce qui transporte l'identifiant

Un **cookie** est une petite donnée que le serveur demande au navigateur de conserver, et que celui-ci renvoie automatiquement à chaque requête vers le même site : c'est le véhicule le plus courant pour transporter l'identifiant de session d'une requête à l'autre, sans que le développeur ait à s'en occuper manuellement à chaque appel.

Ce chapitre reste volontairement indépendant du langage utilisé : voir [Gérer les connexions](/?c=langages-de-programmation&s=php&p=connexions) pour l'implémentation concrète en PHP (`setcookie()`, `$_SESSION`, l'identifiant `PHPSESSID` généré automatiquement).

## Pourquoi l'identifiant de session doit être imprévisible

Si un attaquant pouvait deviner un identifiant de session valide (par exemple un simple compteur : `1`, `2`, `3`...), il obtiendrait accès au compte correspondant sans connaître ni l'email ni le mot de passe de la victime. L'identifiant de session est un cas d'usage cité directement dans le chapitre sur le [pseudo-aléatoire et les générateurs](/?c=representation-des-donnees&p=aleatoire-et-generateurs) : il doit être généré par un générateur aléatoire **cryptographique**, jamais par un simple compteur ou un générateur classique.

## Le vol de session : le vrai risque au quotidien

Même avec un identifiant parfaitement imprévisible, un attaquant qui parvient à **voler** le cookie d'un utilisateur déjà connecté (réseau non chiffré, [faille XSS](/?c=langages-de-programmation&s=php&p=securite#htmlspecialchars-se-proteger-des-failles-xss) qui lit `document.cookie`, appareil partagé mal sécurisé) obtient un accès complet et immédiat au compte, sans jamais avoir besoin du mot de passe : c'est le **vol de session** (*session hijacking*).

| Risque | Ce qu'il permet à un attaquant |
|---|---|
| Identifiant de session prévisible | Deviner un identifiant valide sans rien voler |
| Vol du cookie de session | Réutiliser un identifiant déjà valide, sans le deviner ni connaître le mot de passe |

> **Piège :** supposer qu'un identifiant de session imprévisible suffit à sécuriser une session. Un identifiant imprévisible empêche de le *deviner*, mais ne protège pas contre le fait de le *voler* une fois qu'il existe.
>
> **Bonne pratique :** transmettre le cookie de session uniquement en HTTPS, en interdire l'accès à JavaScript, et en limiter l'envoi aux requêtes provenant réellement du site (voir les options `secure`/`httponly`/`samesite` détaillées dans [Gérer les connexions](/?c=langages-de-programmation&s=php&p=connexions)).

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | HTTP est sans état : sans mécanisme supplémentaire, le serveur ne se souvient de rien entre deux requêtes. Une session (côté serveur) associée à un identifiant transmis via un cookie résout ce problème : le client renvoie l'identifiant à chaque requête, le serveur retrouve la session correspondante. |
| **Outils utilisables** | Un générateur aléatoire cryptographique pour l'identifiant de session ; les options `secure`/`httponly`/`samesite` d'un cookie pour limiter le risque de vol. |
| **Pièges à éviter** | Un identifiant de session prévisible (compteur, valeur devinable). Croire qu'un identifiant imprévisible suffit, sans se protéger contre le vol du cookie lui-même. |
| **Bonnes pratiques** | Générer l'identifiant de session avec un CSPRNG. Sécuriser le cookie de session (HTTPS uniquement, inaccessible à JavaScript, limité aux requêtes du site). |
