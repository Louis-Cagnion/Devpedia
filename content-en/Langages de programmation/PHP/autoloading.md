---
order: 9
---

# Autoloading Classes

Without autoloading, every file that uses a class must explicitly use `require` on the file containing that class—which is cumbersome and prone to errors as soon as a project has many classes. `spl_autoload_register()` allows you to delegate this loading to the PHP engine itself.

## `spl_autoload_register()`

```php
<?php
spl_autoload_register(function (string $classe) {
    $file = __DIR__ . '/' . $classe . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

$obj = new MaClasse(); // PHP automatically calls the resolver with "MyClass"
// -> No manual inclusion is required elsewhere in the project
?>
```

`spl_autoload_register()` registers a "resolver" function **once**. Then, every time the PHP engine encounters a class name that hasn't been loaded yet, it automatically calls this function, passing it the class name (as a string), and waits for it to load the correct file. If none of the registered functions can load the class, PHP throws a fatal "Class not found" error.

## The function passed as an argument is a closure

The argument in `spl_autoload_register()` is neither a function name nor a variable: it is an **anonymous function (closure)**, defined directly where it is used. This is the PHP equivalent of a JavaScript callback (`array.map(function(x) { ... })` or `x => ...`) or a C++11 lambda. It is not executed on the line where it is written; instead, it is stored and **called later**, whenever an unknown class is referenced.

## Map a namespace to a folder

A more realistic resolver associates each **namespace prefix** with a base directory and reconstructs the file path from the full class name:

```php
<?php
spl_autoload_register(function (string $classe): void {
    $namespaces = [
        'App\\Modeles\\'  => __DIR__ . '/Modeles/',
        'App\\Services\\' => __DIR__ . '/Services/',
    ];

    foreach ($namespaces as $prefixe => $dossierBase) {
        if (str_starts_with($classe, $prefixe)) {
            $path = $dossierBase . str_replace('\\', '/', substr($classe, strlen($prefixe))) . '.php';
            if (file_exists($path)) {
                require $path;
            }
            return;
        }
    }
});
?>
```

Example of a solution, using `$classe = 'App\Services\Facturation\Calculateur'`:
1. `str_starts_with($classe, 'App\\Services\\')` → `true`; this prefix matches.
2. `substr(...)` removes the matched prefix → `'Facturation\Calculateur'`.
3. `str_replace('\\', '/', ...)` changes the namespace separator to a folder separator → `'Facturation/Calculateur'`.
4. Final path: `.../Services/Facturation/Calculateur.php` — which must correspond to the actual location of the file.

> **Note:** `'App\\Modeles\\'` in a string enclosed in single quotes: `\\` represents **a single** character `\` (it must be doubled to be treated as a literal) — this is the string `App\Modeles\`, the namespace separator.

The `return;` after `if` is executed regardless of whether the file exists (it is placed after `if (file_exists(...))`, not inside it): since namespace prefixes are mutually exclusive in their first segment, once the correct prefix is found, continuing to test the others would be pointless.

> **A convention that is essential for this to work:** the namespace name and the class name must literally encode the file path—one file per class; the folder structure corresponds to the namespace structure.
