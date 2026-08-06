---
order: 2
---

# Les variables

Pour rappel, [une variable est une boîte étiquetée qui contient une valeur](/?c=bases-de-l-informatique&p=la-variable) — ce qui suit couvre uniquement ce qui est spécifique à PHP.

## Les variables classiques
Pour déclarer une variable en PHP, il faut mettre un `$` avant le nom de votre variable. PHP est faiblement typé : vous n'indiquez pas le type, il est déduit automatiquement selon la valeur assignée.

```php
<?php
    // Entier (int)
    $nb = 2;

    // Nombre à virgule flottante (float)
    $pi = 3.14;

    // Chaîne de caractères (string)
    $str = "Hello world";
    $str = 'Hello world';

    // Booléen (bool)
    $bool = false;

    // Valeur nulle (null)
    $null = null;

    // Tableau indexé (array)
    $fruits = ["pomme", "banane", "cerise"];
    $fruits = array("pomme", "banane", "cerise");

    // Tableau associatif (array)
    $personne = ["nom" => "Dupont", "age" => 25];
    $personne = array("nom" => "Dupont", "age" => 25);

    // Objet (object)
    $date = new DateTime();
?>
```

> **Note :** vous pouvez vérifier le type d'une variable avec la fonction `var_dump($variable);` ou `gettype($variable);`.

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

> **Note :** `==`/`!=` convertissent les types avant de comparer, ce qui peut donner des résultats surprenants selon les valeurs comparées (source de bugs historiques bien connus en PHP). `===`/`!==` exigent le même type ET la même valeur — à privilégier systématiquement, en particulier pour comparer des chaînes de caractères.

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

    //nom_du_champ = attribut 'name' dans les balises HTML
?>
```

Quand la méthode `GET` est utilisée, les données du formulaire sont visibles directement dans l'URL, sous forme de *query string* (ex : `?nom=Jean&age=25`).

La méthode `POST` est plutôt utilisée pour envoyer des données sensibles (mots de passe, informations personnelles...), car elles ne sont pas affichées dans l'URL et ne sont pas limitées en taille comme peut l'être une URL.

> **Note :** `GET` et `POST` ne servent pas à sécuriser des données — les données restent visibles via les outils de développement du navigateur ou par interception réseau si le site n'utilise pas HTTPS. Pour de vraies données sensibles (mots de passe...), il faut aussi penser au chiffrement et à HTTPS.

## Les superglobales

`$_GET` et `$_POST` font partie d'une famille plus large de tableaux associatifs, appelés **superglobales**, que PHP pré-remplit automatiquement dès le début de l'exécution — accessibles depuis n'importe quelle fonction ou méthode, sans rien à importer :

| Superglobale | Contenu |
|---|---|
| `$_GET` / `$_POST` | Données envoyées par un formulaire |
| `$_SERVER` | Informations sur la requête et le serveur (URL demandée, méthode HTTP...) |
| `$_SESSION` | Données stockées côté serveur pour l'utilisateur courant (nécessite `session_start()`) |
| `$_COOKIE` | Cookies envoyés par le navigateur |

> **Note :** contrairement à une variable classique (portée locale, invisible dans une fonction sans la repasser en paramètre), les superglobales sont visibles **partout**, exactement comme une constante — mais elles contiennent des données qui changent à chaque requête, pas des réglages fixes.

## Constantes avec `define()`

`define('NOM', valeur)` crée une **constante globale**, elle aussi accessible depuis n'importe quel fichier, fonction ou méthode :

```php
<?php
define('TVA_TAUX', 0.20);

function prixTTC(float $prixHT): float
{
    return $prixHT * (1 + TVA_TAUX); // visible ici sans rien importer
}
?>
```

> **Note :** une `$variable` classique, elle, reste locale même si le fichier qui la déclare a été chargé avec `require` — elle n'est pas automatiquement visible à l'intérieur d'une fonction ou d'une méthode définie dans un autre fichier. C'est pour ça que les fichiers de configuration utilisent souvent `define()` plutôt que de simples variables : ça garantit que le réglage reste lisible partout dans le projet.

## Accéder à une clé de tableau qui n'existe pas

Lire une clé de tableau totalement absente déclenche un **warning** ("Undefined array key") — pas un crash, mais un signal d'erreur à ne pas ignorer :

```php
<?php
$personne = ["nom" => "Dupont"];

echo $personne["age"]; // Warning: Undefined array key "age"
?>
```

`isset()` et `empty()` sont des constructions spéciales du langage qui tolèrent l'absence totale de la clé, sans déclencher ce warning :

```php
<?php
if (!empty($personne["age"])) {
    echo $personne["age"];
}
// équivalent à : la clé existe ET sa valeur n'est ni vide, ni null, ni false, ni 0...
?>
```

> **Note :** `empty($x)` renvoie `true` si la variable/clé n'existe pas du tout, OU si elle contient une valeur "vide" (`''`, `0`, `null`, `false`, tableau vide...). C'est différent de `array_key_exists()` (cf. chapitre sur les fonctions), qui vérifie uniquement l'existence de la clé, même si sa valeur est `null`.
