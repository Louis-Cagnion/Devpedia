---
title: Inclure des fonctions en PHP
---

Pour insérer des fonctions PHP dans du code HTML, on va pouvoir se servir de la structure de langage *include* :

```php
<?php
    // inclut un fichier contenant les fonctions dont on a besoin
    include("bienvenue.php");
    include("insectes.php");
    /*
    variantes de déclaration:
    include "bienvenue.php";
    include "insectes.php";
    */
?>

<main>
    <!-- fonction depuis bienvenue.php -->
    <h1><?php echo bienvenueSurLeSiteWeb(); ?></h1>

    <!-- fonction depuis insectes.php -->
    <p><?php echo afficherPartieInsecte(); ?></p>
</main>
```

> **Note :** cf. structures de langages si vous ne savez pas ce que c'est.

## `require` et `require_once`

`include` et `require` font la même chose (insérer le contenu d'un fichier PHP à l'endroit où l'instruction est écrite), mais réagissent différemment si le fichier n'existe pas :

| | Fichier introuvable |
|---|---|
| `include` | Warning, le script continue |
| `require` | Erreur fatale, le script s'arrête |

`require_once` ajoute une garantie supplémentaire : le fichier n'est chargé qu'**une seule fois**, même si `require_once` est appelé plusieurs fois dessus (utile pour éviter de redéfinir deux fois la même classe/fonction) :

```php
<?php
require_once "config.php"; // chargé
require_once "config.php"; // ignoré silencieusement, déjà chargé
?>
```

## Un fichier peut se terminer par un simple `return`

Un fichier PHP n'a pas besoin de contenir une `class` ou une `function` : il peut se limiter à un `return [...]`, et la valeur remonte directement à l'endroit où le fichier est chargé :

```php
<?php
// parametres.php
return [
    'nom_site' => 'Ma Boutique',
    'devise'   => 'EUR',
];
?>
```

```php
<?php
$parametres = require "parametres.php";
echo $parametres['nom_site']; // "Ma Boutique"
?>
```

Ce pattern sert souvent de fichier de config/données simple, sans avoir besoin d'une base de données.

## `__DIR__`

`__DIR__` est une constante représentant le répertoire **du fichier où elle apparaît** — pas un "répertoire du projet" global. Deux fichiers dans des dossiers différents n'ont donc pas le même `__DIR__` :

```php
<?php
// dans /app/pages/accueil.php
require __DIR__ . '/../config.php'; // toujours correct, quel que soit l'endroit d'où le script est lancé
?>
```

> **Note :** construire les chemins avec `__DIR__ . '/chemin/relatif'` plutôt qu'un chemin fixe évite les erreurs selon le contexte d'exécution (serveur intégré, Apache, ligne de commande...), qui n'ont pas forcément le même "dossier courant".