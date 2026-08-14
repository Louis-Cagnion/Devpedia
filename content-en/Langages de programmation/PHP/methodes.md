---
order: 6
---

# The Most Useful Functions and Methods

## What is a function or method?

A **function** is a reusable block of code that has a name and can accept information (*parameters*) to perform an action or return a result (a *return value*).

```php
<?php
    // classical function
    function addition($a, $b) {
        return $a + $b;
    }

    echo addition(2, 3); // Poster 5

    // arrow function
    $double = fn($n) => $n * 2;

    echo $double(5); // Poster 10
?>
```
> **Note:** Unlike JavaScript, where an arrow function can be written using curly braces and a `return` (`(n) => { return n * 2; }`), PHP only allows the short form with a single expression, without curly braces or a `return` (`fn($n) => $n * 2;`).

A **method** is exactly the same as a function, with one difference: it is defined **within a class**, and it is used on an object (see the chapters on classes and object-oriented programming).

```php
<?php
    class Calculatrice {
        public function addition($a, $b) {
            return $a + $b;
        }
    }

    $calc = new Calculatrice();
    echo $calc->addition(2, 3); // Poster 5
?>
```

In summary: **function** = standalone; called directly by name. **Method** = belongs to an object; called via `->` (or `::` for a static method).

## Specifying the parameters and return value of a function

PHP is dynamically typed by default, but supports type annotations on parameters and return values. Unlike a compiled language, these types are not checked before execution; instead, they are checked **at runtime**, on each call.

```php
<?php
function calculerRemise(float $price, int $pourcentage): float
{
    return $price - ($price * $pourcentage / 100);
}

calculerRemise(100, 10);      // OK -> 90.0
calculerRemise("cent", 10);   // TypeError: "cent" is not a float
?>
```

## 

A function declared as `: array` (without `?`) does not allow `null` as a return value: attempting to do so results in a `TypeError` at runtime. To explicitly allow `null` in addition to the declared type, prefix the type with `?`:

```php
<?php
function trouverUtilisateur(int $id): ?array
{
    if ($id <= 0) {
        return null; // OK: ?array explicitly allows null
    }
    return ['id' => $id, 'nom' => 'Dupont'];
}
?>
```

> **Note:** `?array` is a contract declaration, not just a coding convention: it is the PHP equivalent of [`std::optional<T>`](https://en.cppreference.com/w/cpp/utility/optional) in modern C++ or [`Optional[T]`](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) in Python: the function can return this specific type, OR `null`, but nothing else.

## Remove an expected warning using `@`

Many native PHP functions return `false` in case of failure rather than throwing an exception (similar to C, where `fopen()` returns a null pointer and sets `errno`). When this failure is already anticipated and handled by the rest of the code, placing the `@` operator before the call suppresses the warning that PHP would otherwise issue:

```php
<?php
$mtime = @filemtime('fichier_qui_peut_ne_pas_exister.txt');
$version = $mtime ? "v{$mtime}" : 'v-inconnue';
?>
```

> **Note:** `@` suppresses the warning; it does not change the behavior of the function itself (`filemtime()` still returns `false` if the file does not exist). Use this only in cases where the failure is actually expected and tested immediately afterward; using it everywhere would also hide genuine errors.

PHP provides a vast number of built-in functions that are ready to use, listed below by category.

## Functions on Strings

```php
<?php
    strlen("Hello");           // 5 -> chain length
    strtoupper("Hello");       // "HELLO" -> capitalizes the text
    strtolower("Hello");       // "hello" -> converts to lowercase
    str_replace("a", "o", "Hello"); // "Hello" -> replaces a substring
    trim("  Hello  ");         // "Hello" -> removes spaces at the beginning and end
    substr("Hello", 1, 3);     // "ell" -> extracts a portion of a string
    explode(",", "a,b,c");     // ["a", "b", "c"] -> splits a string into an array
    implode(",", ["a", "b"]);  // "a,b" -> concatenates an array
    str_contains("Hello", "ell"); // true -> checks whether one string contains another
?>
```

## 

```php
<?php
    count([1, 2, 3]);                  // 3 -> number of elements
    $tab[] = "valeur";                  // Adds an element to the end (preferred over `array_push()` for a single element)
    array_pop($tab);                   // removes and returns the last element
    array_merge($tab1, $tab2);         // merges two tables
    in_array("pomme", $fruits);        // true/false -> checks for the presence of a value
    array_search("pomme", $fruits);    // returns the key/index found
    sort($tab);                        // sorts an array (values)
    array_map(fn($n) => $n * 2, $tab); // applies a function to each element
    array_filter($tab, fn($n) => $n > 0); // filters items based on a condition
?>
```
## Functions on associative arrays

```php
<?php
    $person = ["nom" => "Dupont", "age" => 25];

    array_keys($person);             // ["name", "age"] -> returns all keys
    array_values($person);           // ["Dupont", 25] -> returns all values
    array_key_exists("nom", $person); // true/false -> checks whether a key exists
    unset($person["age"]);            // removes a key (and its value) from the array
    ksort($person);                   // sorts the table by the keys
    asort($person);                   // sorts the array by values (while preserving the keys)
    array_combine(["a", "b"], [1, 2]);  // ["a" => 1, "b" => 2] -> creates an associative array from two arrays
    array_flip($person);              // key-value pairs
?>
```

> **Note:** `array_key_exists()` checks whether a key exists, even if its value is `null`. `isset($person["name"])` returns `false` in this case, because it also checks that the value is not `null`.
e.g.,:
```php
<?php
    $person = ["nom" => "Dupont", "age" => null];

    array_key_exists("age", $person); // true
    isset($person["age"]);             // false
?>
```

## Mathematical Functions

```php
<?php
    abs(-5);        // 5 -> absolute value
    round(3.456, 2); // 3.46 -> rounded
    rand(1, 10);     // generates a random number between 1 and 10
    max(1, 5, 3);    // 5 -> maximum value
    min(1, 5, 3);    // 1 -> minimum value
?>
```

## Type-Checking Functions

```php
<?php
    is_string($var);  // true/false
    is_int($var);      // true/false
    is_array($var);    // true/false
    is_null($var);     // true/false
    empty($var);       // true if empty, null, or undefined
    isset($var);        // true if the variable exists and is not null
?>
```

> **Note:** You can find the complete list of PHP's built-in functions in the official documentation: [php.net/manual/fr/funcref.php](https://www.php.net/manual/fr/funcref.php). To add a **single** element, `$tab[] = "value";` is also preferred over `array_push($tab, "value")`: same result, without the overhead of a function call; `array_push()` is only truly useful for adding multiple elements in a single call (`array_push($tab, "a", "b", "c")`).
