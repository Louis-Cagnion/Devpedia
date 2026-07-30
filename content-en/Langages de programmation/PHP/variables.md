---
order: 2
---

# Variables

## Traditional variables
To declare a variable in PHP, you must place a `$` before the variable name. PHP is weakly typed: you do not specify the type; it is automatically inferred based on the assigned value.

```php
<?php
    // Integer (int)
    $nb = 2;

    // Floating-point number (float)
    $pi = 3.14;

    // String
    $str = "Hello world";
    $str = 'Hello world';

    // Boolean (bool)
    $bool = false;

    // Null value
    $null = null;

    // Indexed array
    $fruits = ["pomme", "banane", "cerise"];
    $fruits = array("pomme", "banane", "cerise");

    // Array
    $person = ["nom" => "Dupont", "age" => 25];
    $person = array("nom" => "Dupont", "age" => 25);

    // Object
    $date = new DateTime();
?>
```

> **Note:** You can check the type of a variable using the `var_dump($variable);` or `gettype($variable);` function.

Next, to compare or manipulate your variables, you'll need to use several different operators:

```php
<?php
    $nb1 = 3;
    $nb2 = 6;
    $result = 0;

    // *** Operators ***
    // addition
    $result = $nb1 + $nb2;
    $nb1 += $nb2;
    // subtraction
    $result = $nb1 - $nb2;
    $nb1 -= $nb2;
    // multiplication
    $result = $nb1 * $nb2;
    $nb1 *= $nb2;
    // power
    $result = $nb1 ** $nb2;
    $nb1 **= $nb2;
    // division
    $result = $nb1 / $nb2;
    $nb1 /= $nb2;
    // modulo
    $result = $nb1 % $nb2;
    $nb1 %= $nb2;
    // +1
    ++$result;
    $result++;
    // -1
    --$result;
    $result--;


    // *** logical operators ***
    // AND
    $result = $nb1 && $nb2;
    // OR
    $result = $nb1 || $nb2;
    // OR exclusive
    $result = $nb1 xor $nb2;
    // oppose
    $result = !true;

    // *** Comparison Operators ***
    // equals
    $result = $nb1 == $nb2;
    // identical
    $result = $nb1 === $nb2;
    // different
    $result = $nb1 != $nb2;
    $result = $nb1 <> $nb2;
    // not identical
    $result = $nb1 !== $nb2;
    // lower
    $result = $nb1 < $nb2;
    // higher
    $result = $nb1 > $nb2;
    // less than or equal to
    $result = $nb1 <= $nb2;
    // greater than or equal to
    $result = $nb1 >= $nb2;
?>
```

> **Note:** `==` and `!=` convert types before performing the comparison, which can yield unexpected results depending on the values being compared (a well-known source of historical bugs in PHP). `===` and `!==` require both the same type AND the same value—these should always be used, especially when comparing strings.

If you want to concatenate strings, there are two ways to do it:

```php
<?php
    $str1 = "Hello";
    $str2 = "world";

    echo "Le thème du jour est : {$str1} {$str2}";
    echo 'Le thème du jour est : ' . $str1 . ' ' . $str2;

    // Both results show "Today's theme is: Hello world."
?>
```

## Global Variables
The variables below allow you to retrieve form fields based on the form's submission method (`GET` or `POST`):

```php
<?php
    $_GET['nom_du_champ'];
    $_POST['nom_du_champ'];

    // field_name = 'name' attribute in HTML tags
?>
```

When the `GET` method is used, the form data is visible directly in the URL as a *query string* (e.g., `?name=Jean&age=25`).

The `POST` method is typically used to send sensitive data (passwords, personal information, etc.), since this data is not displayed in the URL and is not subject to the same size limitations as a URL.

> **Note:** `GET` and `POST` do not secure data—the data remains visible through the browser's developer tools or via network sniffing if the site does not use HTTPS. For truly sensitive data (such as passwords), you should also consider encryption and HTTPS.

## Superglobals

`$_GET` and `$_POST` are part of a larger family of associative arrays, called **superglobals**, which PHP automatically populates at the start of execution—accessible from any function or method, without needing to import anything:

| Superglobal | Content |
|---|---|
| `$_GET` / `$_POST` | Data submitted via a form |
| `$_SERVER` | Request and server information (requested URL, HTTP method, etc.) |
| `$_SESSION` | Server-side data stored for the current user (requires `session_start()`) |
| `$_COOKIE` | Cookies sent by the browser |

> **Note:** Unlike a standard variable (which has local scope and is invisible outside a function unless passed as a parameter), superglobals are visible **everywhere**, just like a constant—but they contain data that changes with each request, not fixed settings.

## Constants with `define()`

`define('NAME', value)` creates a **global constant**, which is also accessible from any file, function, or method:

```php
<?php
define('TVA_TAUX', 0.20);

function prixTTC(float $prixHT): float
{
    return $prixHT * (1 + TVA_TAUX); // Viewable here without importing anything
}
?>
```

> **Note:** A standard `$variable`, on the other hand, remains local even if the file that declares it was loaded using `require`—it is not automatically visible within a function or method defined in another file. That’s why configuration files often use `define()` rather than simple variables: this ensures that the setting remains readable throughout the project.

## Accessing an array index that does not exist

Reading an array key that doesn't exist triggers a **warning** ("Undefined array key")—not a crash, but an error message that should not be ignored:

```php
<?php
$person = ["nom" => "Dupont"];

echo $person["age"]; // Warning: Undefined array key "age"
?>
```

`isset()` and `empty()` are special language constructs that allow the key to be completely omitted without triggering this warning:

```php
<?php
if (!empty($person["age"])) {
    echo $person["age"];
}
// equivalent to: the key exists AND its value is neither empty, nor null, nor false, nor 0...
?>
```

> **Note:** `empty($x)` returns `true` if the variable/key does not exist at all, OR if it contains an "empty" value (`''`, `0`, `null`, `false`, empty array...). This is different from `array_key_exists()` (see the chapter on functions), which only checks for the existence of the key, even if its value is `null`.
