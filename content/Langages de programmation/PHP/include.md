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