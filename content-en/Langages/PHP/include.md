---
order: 7
---

# Include functions

To embed PHP functions in [HTML](/?c=langages-de-balisage&s=html&p=html) code, we can use the `*include*` statement:

```php
<?php
    // includes a file containing the functions we need
    include("bienvenue.php");
    include("insectes.php");
    /*
    declaration variants:
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

> **Note:** See "Language Structures" if you're not sure what this is.

## `require` and `require_once`

`include` and `require` do the same thing (insert the contents of a PHP file where the statement is written), but behave differently if the file does not exist:

| | File not found |
|---|---|
| `include` | Warning: the script continues |
| `require` | Fatal error, script terminated |

`require_once` adds an extra safeguard: the file is loaded only** once**, even if `require_once` is called multiple times on it (useful for avoiding redefining the same class or function twice):

```php
<?php
require_once "config.php"; // in charge
require_once "config.php"; // silently ignored, already loaded
?>
```

## A file can end with a simple`return`

A PHP file does not need to contain a `class` or a `function`; it can simply consist of a `return [...]`, and the value is passed directly to the location where the file is loaded:

```php
<?php
// settings.php
return [
    'nom_site' => 'Ma Boutique',
    'devise'   => 'EUR',
];
?>
```

```php
<?php
$parametres = require "parametres.php";
echo $parametres['nom_site']; // "My Store"
?>
```

This pattern is often used as a simple configuration or data file, without the need for a database.

## `__DIR__`

`__DIR__` is a constant representing the directory **of the file in which it appears**, not a global "project directory." Therefore, two files in different folders do not have the same `__DIR__`:

```php
<?php
// in /app/pages/home.php
// always correct, regardless of where the script is run from
require __DIR__ . '/../config.php';
?>
```

> **Note:** Building paths using `__DIR__ . '/path/relatif'` rather than a fixed path helps avoid errors depending on the execution context (built-in server, Apache, command line, etc.), which may not necessarily have the same "current directory."

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `include`/`require` insert a PHP file's content at the spot where the statement is written. `require` stops the script if the file isn't found, `include` only issues a warning. `require_once` only loads the file once. |
| **Tools you can use** | `require_once`, `__DIR__`, a file ending in `return [...]` as a mini config. |
| **Pitfalls to avoid** | Using `include` for a file essential to the program's operation (a central class): a missing file silently continues with only a warning. |
| **Best practices** | Use `require_once` for class/function files, `__DIR__` to build paths independent of the execution context. |
