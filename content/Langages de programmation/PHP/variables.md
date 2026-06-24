---
title: Les variables en PHP
---

## Les variables classiques
Pour déclarer une variable en PHP, il faut mettre un `$` avant le nom de votre variable :

```php
<?php
    $nb = 2;
    $str = "Hello world";
    $pi = 3.14;
    $bool = false;
    $null = null;
?>
```

Ensuite pour comparer ou manipuler vos variables entre elles, il vous faudra utiliser plusieurs opérateurs différents :

```php
<?php
    $nb1 = 3;
    $nb2 = 6;
    $result = 0;

    // *** opérateurs ***
    //addition
    $result = $nb1 + $nb2;
    $nb1 += $nb2;
    //soustraction
    $result = $nb1 - $nb2;
    $nb1 -= $nb2;
    //multiplication
    $result = $nb1 * $nb2;
    $nb1 *= $nb2;
    //puissance
    $result = $nb1 ** $nb2;
    $nb1 **= $nb2;
    //division
    $result = $nb1 / $nb2;
    $nb1 /= $nb2;
    //modulo
    $result = $nb1 % $nb2;
    $nb1 %= $nb2;
    //+1
    ++$result;
    $result++;
    //-1
    --$result;
    $result--;


    // *** opérateurs logiques ***
    //ET
    $result = $nb1 && $nb2;
    //OU
    $result = $nb1 || $nb2;
    //OU exclusif
    $result = $nb1 xor $nb2;
    //opposer
    $result = !true;

    // *** opérateurs de comparaisons ***
    //égaux
    $result = $nb1 == $nb2;
    //identiques
    $result = $nb1 === $nb2;
    //différent
    $result = $nb1 != $nb2;
    $result = $nb1 <> $nb2;
    //non identiques
    $result = $nb1 !== $nb2;
    //inférieur
    $result = $nb1 < $nb2;
    //supérieur
    $result = $nb1 > $nb2;
    //inférieur ou égal
    $result = $nb1 <= $nb2;
    //supérieur ou égal
    $result = $nb1 >= $nb2;
?>
```

Si vous souhaitez concaténer des chaînes de caractères, vous avez 2 méthodes :

```php
<?php
    $str1 = "Hello";
    $str2 = "world";

    echo "Le thème du jour est : {$str1} {$str2}";
    echo 'Le thème du jour est : ' . $str1 . ' ' . $str2;

    //les deux résultats donnent "Le thème du jour est : Hello world".
?>
```

## Les variables globales

Les variables ci-dessous permettent de récupérer les éléments d'un formulaire en fonction de sa méthode d'envoi (`GET` ou `POST`) :

```php
<?php
    $_GET['nom_du_champ'];
    $_POST['nom_du_champ'];
?>
```

Quand la méthode `GET` est utilisée, les données du formulaire sont visibles directement dans l'URL, sous forme de *query string* (ex : `?nom=Jean&age=25`).

La méthode `POST` est plutôt utilisée pour envoyer des données sensibles (mots de passe, informations personnelles...), car elles ne sont pas affichées dans l'URL et ne sont pas limitées en taille comme peut l'être une URL.

> **Note :** `GET` et `POST` ne servent pas à sécuriser des données — les données restent visibles via les outils de développement du navigateur ou par interception réseau si le site n'utilise pas HTTPS. Pour de vraies données sensibles (mots de passe...), il faut aussi penser au chiffrement et à HTTPS.