---
order: 7
---

# Inclure des fonctions

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

> **Note :** `include` est une [structure de langage](/?c=langages-de-programmation&s=php&p=structures-de-langage), pas une fonction classique.

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

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | `include`/`require` insèrent le contenu d'un fichier PHP à l'endroit où l'instruction est écrite. `require` arrête le script si le fichier est introuvable, `include` se contente d'un warning. `require_once` ne charge le fichier qu'une seule fois. |
| **Outils utilisables** | `require_once`, `__DIR__`, un fichier se terminant par `return [...]` comme mini-config. |
| **Pièges à éviter** | Utiliser `include` pour un fichier indispensable au fonctionnement (une classe centrale) — un fichier manquant continue silencieusement avec seulement un warning. |
| **Bonnes pratiques** | Utiliser `require_once` pour les fichiers de classes/fonctions, `__DIR__` pour construire des chemins indépendants du contexte d'exécution. |
