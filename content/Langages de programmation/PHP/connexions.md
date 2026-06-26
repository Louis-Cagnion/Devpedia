---
title: Gérer les connexions en PHP
---

Lorsqu'un utilisateur navigue sur un site, le serveur a souvent besoin de se souvenir de lui d'une page à l'autre, voire d'une visite à l'autre : rester connecté, retrouver ses préférences, son panier... Pour cela, PHP propose plusieurs outils, chacun avec ses propres usages : les **cookies** (stockés chez l'utilisateur), les **sessions** (stockées sur le serveur), et les **jetons de connexion** (pour une connexion longue durée). Ce chapitre présente ces trois outils et explique quand utiliser l'un plutôt que l'autre.

## Les cookies
Un **cookie** est une petite donnée stockée par le navigateur de l'utilisateur, envoyée automatiquement au serveur à chaque requête vers le même site. Contrairement aux variables PHP classiques (qui disparaissent à chaque fin de script), un cookie persiste entre plusieurs visites, même si l'utilisateur ferme son navigateur.

Les cookies servent typiquement à :
- Se souvenir d'un utilisateur (rester connecté, "se souvenir de moi")
- Sauvegarder des préférences (langue, thème clair/sombre...)
- Suivre un panier d'achat avant la création d'un compte

### Créer un cookie
```php
<?php
    setcookie("nom_cookie", "valeur", time() + 3600); // expire dans 1h
?>
```

`setcookie()` prend principalement 3 paramètres :
- Le nom du cookie
- La valeur à stocker
- La date d'expiration (en timestamp Unix — `time()` renvoie l'heure actuelle, donc `time() + 3600` veut dire "dans 1h")

> **Note importante :** `setcookie()` doit être appelée **avant** tout affichage HTML (avant la moindre balise, espace ou retour à la ligne), car elle modifie les en-têtes (*headers*) HTTP de la réponse. C'est la même logique que pour la balise fermante `?>` évoquée plus haut.

### Lire un cookie
Une fois créé, un cookie est accessible via la variable globale `$_COOKIE` :

```php
<?php
    if (isset($_COOKIE["nom_cookie"])) {
        echo $_COOKIE["nom_cookie"];
    }
?>
```

> **Note :** un cookie créé avec `setcookie()` n'est disponible dans `$_COOKIE` qu'à partir du **rechargement suivant** de la page, pas immédiatement dans le même script.

### Modifier un cookie
Il n'existe pas de fonction "update" : pour modifier un cookie, on le recrée simplement avec le même nom et une nouvelle valeur, ce qui écrase l'ancien :

```php
<?php
    setcookie("nom_cookie", "nouvelle_valeur", time() + 3600);
?>
```

### Supprimer un cookie
Pour supprimer un cookie, on le recrée avec une date d'expiration **dans le passé** :

```php
<?php
    setcookie("nom_cookie", "", time() - 3600);
?>
```

### Sécuriser un cookie
`setcookie()` accepte des options supplémentaires pour renforcer la sécurité :

```php
<?php
    setcookie("nom_cookie", "valeur", [
        "expires" => time() + 3600,
        "path" => "/",
        "secure" => true,
        "httponly" => true,
        "samesite" => "Strict"
    ]);
?>
```

- `secure` : le cookie n'est transmis que si la connexion est en HTTPS.
- `httponly` : empêche JavaScript (`document.cookie`) d'accéder au cookie, ce qui limite les dégâts en cas de faille XSS.
- `samesite` : empêche le cookie d'être envoyé lors d'une requête provenant d'un autre site, ce qui protège contre les attaques CSRF.

> **Note :** ne stockez jamais d'informations sensibles (mot de passe, numéro de carte bancaire...) dans un cookie, même sécurisé. Un cookie reste manipulable par l'utilisateur lui-même. Pour des données sensibles côté serveur, préférez les **sessions** (`$_SESSION`).

## Les sessions

Une **session** permet de stocker des données **côté serveur**, tout en les associant à un visiteur précis. Contrairement à un cookie (stocké chez l'utilisateur et modifiable par lui), la donnée de session reste sur le serveur — l'utilisateur n'a donc aucun moyen de la lire ou de la modifier directement.

PHP fait le lien entre le visiteur et ses données grâce à un identifiant de session unique, envoyé automatiquement au navigateur sous forme de cookie (généralement nommé `PHPSESSID`). Ce cookie ne contient donc aucune donnée sensible : juste un identifiant, qui pointe vers les vraies données stockées sur le serveur.

### Démarrer une session

```php
<?php
    session_start(); // doit être appelée avant tout affichage HTML, comme setcookie()
?>
```

### Stocker une donnée en session

```php
<?php
    session_start();

    $_SESSION["user_id"] = 12;
    $_SESSION["email"] = "jean@example.com";
?>
```

### Lire une donnée de session

```php
<?php
    session_start();

    if (isset($_SESSION["user_id"])) {
        echo "Connecté en tant qu'utilisateur n°" . $_SESSION["user_id"];
    }
?>
```

> **Note :** `session_start()` doit être appelée au début de **chaque** page où vous voulez accéder à `$_SESSION`, sinon PHP ne sait pas à quel visiteur associer les données.

### Supprimer une donnée ou détruire la session

```php
<?php
    session_start();

    unset($_SESSION["user_id"]); // supprime uniquement cette donnée
    session_destroy();           // détruit toute la session (ex: à la déconnexion)
?>
```

> **Note :** par défaut, le cookie `PHPSESSID` (et donc la session) disparaît à la fermeture du navigateur, ou après une période d'inactivité côté serveur. Pour faire durer une connexion plus longtemps (plusieurs jours/semaines), les sessions classiques ne suffisent pas — voir la partie sur les jetons de connexion ci-dessous.

## Les jetons de connexion ("se souvenir de moi")

Pour garder un utilisateur connecté sur le long terme (plusieurs jours/semaines), même après fermeture du navigateur, ni le cookie classique (non sécurisé pour ça) ni la session (trop éphémère) ne suffisent. On utilise alors un **jeton de connexion** (*remember token*) : une preuve de connexion longue durée, stockée à la fois chez l'utilisateur et sur le serveur.

Le principe :
- On ne stocke **jamais** le mot de passe pour faire cela — uniquement un jeton aléatoire.
- Le jeton est envoyé en clair dans un cookie chez l'utilisateur.
- Sa version **hachée** est stockée en base de données, associée à son compte (comme pour un mot de passe).

### Créer le jeton à la connexion

```php
<?php
    $token = bin2hex(random_bytes(32)); // jeton aléatoire (64 caractères hexadécimaux)
    $tokenHache = hash('sha256', $token);

    // on stocke $tokenHache en base, lié à l'utilisateur (ex: colonne "remember_token")

    // on envoie $token (non haché) dans un cookie sécurisé, longue durée
    setcookie("remember_token", $token, time() + 60 * 60 * 24 * 30, "/", "", true, true);
?>
```

### Reconnecter automatiquement l'utilisateur

À chaque visite, si la session est vide mais que le cookie `remember_token` existe, on vérifie sa correspondance en base :

```php
<?php
    session_start();

    if (!isset($_SESSION["user_id"]) && isset($_COOKIE["remember_token"])) {
        $tokenHache = hash('sha256', $_COOKIE["remember_token"]);

        // on recherche en base un utilisateur dont le remember_token correspond
        $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
        $stmt->execute(['token' => $tokenHache]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION["user_id"] = $user["id"]; // reconnecte l'utilisateur
        }
    }
?>
```

> **Note :** on compare toujours le **hash** du jeton reçu avec celui stocké en base, jamais le jeton en clair — exactement comme pour un mot de passe avec `password_hash()`/`password_verify()`. Si le cookie est volé, le voleur ne peut pas en déduire le hash stocké, mais surtout, on peut révoquer ce jeton à tout moment en le supprimant de la base (ex: en cas de changement de mot de passe ou de déconnexion explicite).

### Cookie, session ou jeton de connexion, que choisir ?

| | Cookie | Session | Jeton de connexion |
|---|---|---|---|
| Stockage | Côté navigateur | Côté serveur | Les deux (jeton chez l'utilisateur, hash en base) |
| Manipulable par l'utilisateur | Oui | Non | Le jeton oui, mais inutile sans le hash correspondant en base |
| Persistance | Peut durer des jours/mois | Généralement jusqu'à la fermeture du navigateur | Peut durer des jours/mois |
| Révocable à tout moment | Non | Oui (`session_destroy()`) | Oui (suppression du hash en base) |
| Usage typique | Préférences, langue, thème | Connexion utilisateur (courte durée), panier, données sensibles | Connexion utilisateur (longue durée), "se souvenir de moi" |