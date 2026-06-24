---
title: Sécuriser vos données en PHP
---

Lorsque vous récupérez des données venant de l'utilisateur (formulaires, URL, cookies...), il faut toujours les considérer comme **non fiables**, même si elles semblent correctes. Un visiteur malveillant peut envoyer n'importe quoi : du code HTML, du JavaScript, ou des requêtes SQL malformées. PHP fournit plusieurs fonctions pour filtrer, valider et échapper ces données.

## `filter_input()`

Permet de récupérer **et** valider/filtrer en même temps une donnée venant de `$_GET`, `$_POST`, etc. :

```php
<?php
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $age = filter_input(INPUT_GET, 'age', FILTER_VALIDATE_INT);

    if ($email === false) {
        echo "Email invalide.";
    }
?>
```

Si la donnée ne correspond pas au filtre demandé, `filter_input()` renvoie `false`. Si le champ n'existe pas du tout, elle renvoie `null`.

Quelques filtres courants :

```php
<?php
    FILTER_VALIDATE_EMAIL;    // vérifie un format d'email
    FILTER_VALIDATE_INT;      // vérifie un nombre entier
    FILTER_VALIDATE_FLOAT;    // vérifie un nombre décimal
    FILTER_VALIDATE_URL;      // vérifie une URL
    FILTER_SANITIZE_STRING;   // nettoie une chaîne (déprécié depuis PHP 8.1)
?>
```

## `htmlspecialchars()` — se protéger des failles XSS

Si vous affichez une donnée utilisateur sur la page (ex: un commentaire, un pseudo), un visiteur pourrait injecter du code HTML/JavaScript malveillant. C'est une faille appelée **XSS** (*Cross-Site Scripting*).

```php
<?php
    $commentaire = "<script>alert('piraté');</script>";

    echo htmlspecialchars($commentaire);
    // affiche le texte tel quel, sans exécuter le script
?>
```

`htmlspecialchars()` convertit les caractères spéciaux (`<`, `>`, `"`, `'`) en entités HTML, ce qui empêche le navigateur d'interpréter le contenu comme du code.

> **Note :** affichez toujours les données utilisateur avec `htmlspecialchars()`, sauf si vous avez une raison précise de ne pas le faire.

## Se protéger des injections SQL

Si vous insérez directement une donnée utilisateur dans une requête SQL, un visiteur peut manipuler la requête pour accéder à des données qu'il ne devrait pas voir, voire les supprimer. C'est une **injection SQL**.

```php
<?php
    // ❌ Dangereux : la donnée est insérée directement dans la requête
    $requete = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";
?>
```

La solution est d'utiliser des **requêtes préparées**, via PDO, qui séparent la requête SQL des données :

```php
<?php
    $pdo = new PDO('mysql:host=localhost;dbname=mabase', 'utilisateur', 'motdepasse');

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);

    $user = $stmt->fetch();
?>
```

Avec cette méthode, la donnée envoyée par l'utilisateur n'est jamais interprétée comme du code SQL, quoi qu'elle contienne.

## `password_hash()` et `password_verify()` — stocker des mots de passe

Un mot de passe ne doit **jamais** être stocké en clair dans une base de données. PHP fournit des fonctions natives pour le hacher de façon sécurisée :

```php
<?php
    // À l'inscription : on hache le mot de passe avant de le stocker
    $motDePasseHache = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // À la connexion : on compare le mot de passe saisi avec le hash stocké
    if (password_verify($_POST['password'], $motDePasseHache)) {
        echo "Connexion réussie.";
    } else {
        echo "Mot de passe incorrect.";
    }
?>
```

`password_hash()` génère un hash différent à chaque appel (même avec le même mot de passe), grâce à un "sel" (*salt*) intégré automatiquement. Il est donc impossible de revenir au mot de passe d'origine à partir du hash.

## Résumé

| Risque | Fonction / méthode |
|---|---|
| Donnée mal formée (email, nombre...) | `filter_input()` |
| Injection de HTML/JS (XSS) | `htmlspecialchars()` |
| Injection SQL | Requêtes préparées (PDO) |
| Mot de passe en clair | `password_hash()` / `password_verify()` |

> **Note :** aucune de ces protections ne remplace HTTPS, qui chiffre les données échangées entre le navigateur et le serveur.