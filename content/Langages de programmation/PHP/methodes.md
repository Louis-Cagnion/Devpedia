---
title: Les fonctions et méthodes les plus utiles en PHP
---

## Qu'est-ce qu'une fonction / méthode ?

Une **fonction** est un bloc de code réutilisable, qui porte un nom, et qui peut recevoir des informations (des *paramètres*) pour effectuer une action ou renvoyer un résultat (une *valeur de retour*).

```php
<?php
    function addition($a, $b) {
        return $a + $b;
    }

    echo addition(2, 3); // affiche 5
?>
```

Une **méthode**, c'est exactement la même chose qu'une fonction, à une différence près : elle est définie **à l'intérieur d'une classe**, et elle s'utilise sur un objet (cf. les chapitres sur les classes et la programmation orientée objet).

```php
<?php
    class Calculatrice {
        public function addition($a, $b) {
            return $a + $b;
        }
    }

    $calc = new Calculatrice();
    echo $calc->addition(2, 3); // affiche 5
?>
```

En résumé : **fonction** = autonome, appelée directement par son nom. **méthode** = appartient à un objet, appelée via `->` (ou `::` pour une méthode statique).

PHP fournit énormément de fonctions natives déjà prêtes à l'emploi, classées ci-dessous par catégorie.

## Fonctions sur les chaînes de caractères

```php
<?php
    strlen("Hello");           // 5 -> longueur de la chaîne
    strtoupper("Hello");       // "HELLO" -> met en majuscules
    strtolower("Hello");       // "hello" -> met en minuscules
    str_replace("a", "o", "Hello"); // "Hello" -> remplace une sous-chaîne
    trim("  Hello  ");         // "Hello" -> retire les espaces au début/fin
    substr("Hello", 1, 3);     // "ell" -> extrait une portion de chaîne
    explode(",", "a,b,c");     // ["a", "b", "c"] -> découpe une chaîne en tableau
    implode(",", ["a", "b"]);  // "a,b" -> assemble un tableau en chaîne
    str_contains("Hello", "ell"); // true -> vérifie si une chaîne en contient une autre
?>
```

## Fonctions sur les tableaux (`array`)

```php
<?php
    count([1, 2, 3]);                  // 3 -> nombre d'éléments
    array_push($tab, "valeur");        // ajoute un élément à la fin
    array_pop($tab);                   // retire et renvoie le dernier élément
    array_merge($tab1, $tab2);         // fusionne deux tableaux
    in_array("pomme", $fruits);        // true/false -> vérifie la présence d'une valeur
    array_search("pomme", $fruits);    // renvoie la clé/l'index trouvé
    sort($tab);                        // trie un tableau (valeurs)
    array_map(fn($n) => $n * 2, $tab); // applique une fonction à chaque élément
    array_filter($tab, fn($n) => $n > 0); // filtre les éléments selon une condition
?>
```
## Fonctions sur les tableaux associatifs

```php
<?php
    $personne = ["nom" => "Dupont", "age" => 25];

    array_keys($personne);             // ["nom", "age"] -> renvoie toutes les clés
    array_values($personne);           // ["Dupont", 25] -> renvoie toutes les valeurs
    array_key_exists("nom", $personne); // true/false -> vérifie qu'une clé existe
    unset($personne["age"]);            // retire une clé (et sa valeur) du tableau
    ksort($personne);                   // trie le tableau selon les clés
    asort($personne);                   // trie le tableau selon les valeurs (en gardant les clés)
    array_combine(["a", "b"], [1, 2]);  // ["a" => 1, "b" => 2] -> crée un tableau associatif à partir de 2 tableaux
    array_flip($personne);              // inverse clés et valeurs
?>
```

> **Note :** `array_key_exists()` vérifie qu'une clé existe, même si sa valeur est `null`. `isset($personne["nom"])` renvoie `false` dans ce cas, car il vérifie en plus que la valeur n'est pas `null`.
ex :
```php
<?php
    $personne = ["nom" => "Dupont", "age" => null];

    array_key_exists("age", $personne); // true
    isset($personne["age"]);             // false
?>
```

## Fonctions mathématiques

```php
<?php
    abs(-5);        // 5 -> valeur absolue
    round(3.456, 2); // 3.46 -> arrondit
    rand(1, 10);     // génère un nombre aléatoire entre 1 et 10
    max(1, 5, 3);    // 5 -> valeur maximale
    min(1, 5, 3);    // 1 -> valeur minimale
?>
```

## Fonctions de vérification de type

```php
<?php
    is_string($var);  // true/false
    is_int($var);      // true/false
    is_array($var);    // true/false
    is_null($var);     // true/false
    empty($var);       // true si vide, null, ou non défini
    isset($var);        // true si la variable existe et n'est pas null
?>
```

> **Note :** vous trouverez la liste complète des fonctions natives de PHP dans la documentation officielle : [php.net/manual/fr/funcref.php](https://www.php.net/manual/fr/funcref.php).