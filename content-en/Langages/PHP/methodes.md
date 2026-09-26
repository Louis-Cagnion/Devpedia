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

    echo addition(2, 3); // displays 5

    // arrow function
    $double = fn($n) => $n * 2;

    echo $double(5); // displays 10
?>
```
> **Note:** Unlike [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), where an arrow function can be written using curly braces and a `return` (`(n) => { return n * 2; }`), PHP only allows the short form with a single expression, without curly braces or a `return` (`fn($n) => $n * 2;`).

A **method** is exactly the same as a function, with one difference: it is defined **within a class**, and it is used on an object (see the chapters on classes and object-oriented programming).

```php
<?php
    class Calculatrice {
        public function addition($a, $b) {
            return $a + $b;
        }
    }

    $calc = new Calculatrice();
    echo $calc->addition(2, 3); // displays 5
?>
```

In summary: **function** = standalone; called directly by name. **Method** = belongs to an object; called via `->` (or `::` for a static method).

## Specifying the parameters and return value of a function

PHP is dynamically typed by default, but supports type annotations on parameters and return values. Unlike a compiled language, these types are not checked before execution; instead, they are checked **at runtime**, on each call.

```php
<?php
function applyDiscount(float $price, int $percentage): float
{
    return $price - ($price * $percentage / 100);
}

applyDiscount(100, 10);       // OK -> 90.0
applyDiscount("hundred", 10); // TypeError: "hundred" is not a float
?>
```

## Nullable Types (`?Type`)

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

> **Note:** `?array` is a contract declaration, not just a coding convention: it is the PHP equivalent of [`std::optional<T>`](https://en.cppreference.com/w/cpp/utility/optional) in modern [C++](/?c=langages-de-programmation&s=cpp&p=cpp) or [`Optional[T]`](/?c=langages-de-programmation&s=python&p=typage-avec-annotations) in [Python](/?c=langages-de-programmation&s=python&p=python): the function can return this specific type, OR `null`, but nothing else.

## Anonymous Functions: Capturing a Variable with `use`

An **anonymous function** (also called a *closure*) is a function without a name: you store it in a variable, or pass it directly to another function. It does **not** see the variables of the surrounding code. To use one, you must list it in `use (...)`, in one of these two ways:

| Syntax | What the function receives | If the function modifies it... |
|---|---|---|
| `function () use ($x)` | a **copy** of `$x`, taken when the function is created | only the copy changes |
| `function () use (&$x)` | the variable `$x` **itself** (a *reference*) | `$x` changes outside as well |
| `fn() => ...` (arrow function, see above) | an automatic copy of every variable it uses | impossible: a single expression, no statement |

Analogy: `use ($x)` hands over a photocopy of a document (you can scribble on it, the original stays intact); `use (&$x)` lends the original itself.

```php
<?php
$counter = 0;

$byValue = function () use ($counter) {        // receives a copy of $counter (0)
    $counter++;                                 // increments the copy only
    return $counter;                            // returns the copy: 1
};

$byReference = function () use (&$counter) {   // receives the real $counter variable
    $counter++;                                 // increments the original
    return $counter;
};

echo $byValue(), " ", $counter, "\n";      // displays "1 0": the original did not move
echo $byReference(), " ", $counter, "\n";  // displays "1 1"
echo $byReference(), " ", $counter, "\n";  // displays "2 2"
?>
```

**Pitfall: the copy is taken when the function is created, not when it is called.**

```php
<?php
$x = 10;
$read = function () use ($x) { return $x; };  // copy of $x taken HERE, it is 10
$x = 99;                                      // too late: the copy does not follow
echo $read();                                 // displays 10, not 99
?>
```

The same `&` also works for a **parameter**: without it, a function receives a copy of what you pass (even an array); with it, the function directly modifies the caller's variable.

```php
<?php
function addOne(array &$arr): void {  // &: the function receives the caller's array
    $arr[] = 1;                       // adds an element to THAT array
}

$list = [];
addOne($list);
echo count($list);                    // displays 1 (without the &, it would display 0)
?>
```

### The `callable` Type: Accepting "Something That Can Be Called"

A parameter typed `callable` accepts any value that PHP knows how to call like a function:

| Value passed | Example |
|---|---|
| Anonymous or arrow function | `fn($n) => $n * 2` |
| Name of a function, as a string | `'abs'` |
| Static method of a class | `['Calculator', 'double']` |
| Method of an object | `[$calculator, 'triple']` |

```php
<?php
function apply(callable $action, int $n): int {
    return $action($n);                       // calls what it received, with $n
}

echo apply(fn($n) => $n * 2, 4);              // displays 8
echo apply('abs', -3);                        // displays 3 (absolute value)
apply('missing_function', 1);                 // TypeError: this string is not callable
apply(fn($a, $b) => $a + $b, 1);              // ArgumentCountError, thrown INSIDE apply()
?>
```

> **Note:** PHP only checks that the value is callable when it enters `apply()`. It does **not** check how many parameters it expects or their types: a function that wants two only fails when `apply()` calls it with one (see [Exceptions](/?c=langages&s=php&p=exceptions) for `TypeError` and `ArgumentCountError`).

A common use: a function that prepares something, lets a function received as a parameter do its work, then finishes cleanly. The next section gives a complete example.

## Locking a File Shared Between Requests: `flock()`

A PHP server handles several requests **at the same time**, each in its own process (see [PHP-FPM](/?c=langages&s=php&p=php-fpm)). If two requests read and then rewrite the same file (for example a small JSON file used as a mini database), one can erase the other's change:

```
Request A                          Request B
reads visits = 5
                                   reads visits = 5
writes visits = 6
                                   writes visits = 6   <- A's visit is lost
```

It is the same problem as between two threads sharing a variable (see [Shared memory](/?c=langages&s=c&p=threads#shared-memory-an-advantage-and-a-risk)). The fix: **a lock**. `flock()` puts a lock on a file already opened with `fopen()`, and only one request at a time can hold it.

| Call | Effect |
|---|---|
| `flock($file, LOCK_EX)` | **exclusive** lock: waits until nobody holds the lock any more, then takes it |
| `flock($file, LOCK_SH)` | **shared** lock: several readers at once, but no exclusive lock meanwhile |
| `flock($file, LOCK_EX \| LOCK_NB)` | like `LOCK_EX`, but does not wait: returns `false` if the lock is already taken |
| `flock($file, LOCK_UN)` | releases the lock |

The complete pattern, combining `flock()` with the anonymous functions of the previous section:

```php
<?php
// Opens the file, locks it, lets $modify change the data, then rewrites it.
function withSharedStore(string $path, callable $modify): void
{
    $file = fopen($path, 'c+');                // read/write, created if missing, never emptied
    flock($file, LOCK_EX);                     // waits for its turn
    $content = stream_get_contents($file);     // reads the whole file
    $data = $content === '' ? [] : json_decode($content, true);
    $modify($data);                            // the received function modifies $data
    ftruncate($file, 0);                       // empties the file...
    rewind($file);                             // ...goes back to the start...
    fwrite($file, json_encode($data));         // ...and writes the new version
    fflush($file);                             // everything is written BEFORE releasing the lock
    flock($file, LOCK_UN);                     // the next request can go ahead
    fclose($file);
}

$before = null;
withSharedStore('store.json', function (array &$d) use (&$before) {
    $before = $d['visits'] ?? 0;               // use (&$before): the value comes back out
    $d['visits'] = $before + 1;                // &$d: the change is kept and rewritten
});
echo $before;                                  // number of visits before this one
?>
```

Result measured with PHP 8.3: 4 processes started at the same time, each adding 300 visits to the same file:

| Version | Visits counted at the end (expected: 1,200) |
|---|---|
| Without `flock()` | 16 |
| With `flock()` | 1,200 |

Two subtleties:

| Pitfall | Why |
|---|---|
| Opening with `'w'` instead of `'c+'` | `'w'` empties the file **as soon as it is opened**, so before holding the lock: another request can read an empty file meanwhile. |
| Believing the lock protects against everything | `flock()` is an **advisory lock**: it only blocks code that also calls `flock()` on that file. A `file_put_contents()` without a lock still writes. |

> **Note:** the same mechanism exists on the command line to stop two runs of the same script from overlapping (see [Avoiding concurrent runs with `flock`](/?c=langages&s=bash&p=automatisation-cron#avoiding-concurrent-runs-with-flock)). For many simultaneous writes, a real database remains better suited than a locked file: each request waits for its turn, which slows everything down as soon as traffic grows.

## Remove an expected warning using `@`

Many native PHP functions return `false` in case of failure rather than throwing an exception (similar to [C](/?c=langages-de-programmation&s=c&p=c), where `fopen()` returns a null pointer and sets `errno`). When this failure is already anticipated and handled by the rest of the code, placing the `@` operator before the call suppresses the warning that PHP would otherwise issue:

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

## Functions on Arrays (`array`)

```php
<?php
    count([1, 2, 3]);                  // 3 -> number of elements
    // Adds an element to the end (preferred over `array_push()` for a single element)
    $tab[] = "valeur";
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
    // ["a" => 1, "b" => 2] -> creates an associative array from two arrays
    array_combine(["a", "b"], [1, 2]);
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

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A function is a reusable block of code; a method is a function defined inside a class, called via `->`/`::`. PHP checks annotated types at runtime, not at compile time. An anonymous function only sees the variables listed in `use`: a copy with `use ($x)`, the original variable with `use (&$x)`. |
| **Tools you can use** | Native functions on strings, arrays, associative arrays, math, type checking; `?Type` for a nullable type; `use`, `&` and `callable` for anonymous functions; `fopen(..., 'c+')` and `flock()` for a shared file. |
| **Pitfalls to avoid** | Using `@` to systematically silence warnings: reserve it for failures that are genuinely anticipated and checked right afterward. Believing that `use ($x)` follows the changes of `$x` (the copy is taken at creation). Opening a shared file with `'w'`, which empties it before even holding the lock. |
| **Best practices** | Type a function's parameters and return value as soon as possible; use `$arr[] = value` rather than `array_push()` for a single element; lock (`LOCK_EX`) any file read then rewritten by several requests, and call `fflush()` before releasing the lock. |
