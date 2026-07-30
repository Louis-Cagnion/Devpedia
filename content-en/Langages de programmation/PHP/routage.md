---
order: 12
---

# Routing Without a Framework (Front Controller)

Without a framework (Laravel, Symfony, etc.), PHP does not provide a built-in router comparable to Express (`app.get('/path', callback)`). A "pure PHP" project must handle the mapping between a requested URL and the code to be executed on its own.

## The front controller and the dispatch table

A common pattern is to route **all** requests through a single entry point (often `index.php`), which consults a "route → file" associative array:

```php
<?php
$routes = [
    'accueil' => '/pages/accueil.php',
    'contact' => '/pages/contact.php',
];

$uri  = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$file = $routes[$uri] ?? null;

if ($file && file_exists(__DIR__ . $file)) {
    require __DIR__ . $file; // The "handler" is an executable file, not a callback function
} else {
    http_response_code(404);
    echo "Page introuvable";
}
?>
```

Key difference from a JS (Express) router: each route points to a **file path**, not a function. There is no callback to invoke—the file itself generates the HTTP response (`echo`, `header()`...) by directly reading the superglobals.

- `$_SERVER['REQUEST_URI']` contains the path **and** query string concatenated (`/contact?ref=pub`). `parse_url(..., PHP_URL_PATH)` extracts only the path, discarding the query string.
- `trim(..., '/')` Removes the leading and trailing "`/`" so that `'contact'` matches the key in the `$routes` array (without the leading slash).

## The "filesystem = URLs" model

On a standard PHP server (without any special configuration), **any file physically located in the web root directory is accessible via its URL path**—a `.php` is executed there, and a static file is served as-is. This is the opposite of Express/Node, where a route exists only if it is explicitly declared: in “old-school” PHP, **everything is accessible by default, except for what is explicitly blocked**.

Practical implication: A directory containing classes or sensitive data (database login credentials, API keys, etc.) must be **explicitly blocked**, even if no route in the application code ever references it—otherwise, nothing prevents a visitor from typing the path directly into the browser.

## The `php -S` (IDE) contract

`php -S host:port routeur.php` does not have the capabilities of a true web server (no `.htaccess` file, no Apache/nginx configuration). The file passed as an argument is executed on **every** request and controls the behavior via its `return` value:

- `return false;` → "I didn't do anything; you should serve this request yourself as usual" (the server then serves the requested physical file if it exists; otherwise, it returns a 404).
- `return true;` → "I've already handled this request myself (response already provided); don't do anything else."

```php
<?php
// router.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) Explicit blocks first
$dossiersBloques = ['/data/', '/src/'];
foreach ($dossiersBloques as $folder) {
    if (str_starts_with($uri, $folder)) {
        http_response_code(403);
        echo 'Accès interdit.';
        return true; // Already answered—no further action needed
    }
}

// 2) Existing static file -> let the server serve it itself
if (is_file(__DIR__ . $uri)) {
    return false;
}

// 3) Otherwise, application dispatch
require __DIR__ . '/index.php';
return true;
?>
```

> **Note:** The order of the blocks matters. If the `is_file()` test were placed **before** the blocks, a request for a sensitive but physically present file (e.g., `/data/config.php`) would pass this test with `true` and return `false`—allowing the embedded server **to execute** that file directly, bypassing the protections.

> **Note (security):** `$uri` comes directly from the request (`$_SERVER['REQUEST_URI']`) — without normalization, a value containing directory traversal (`/../../etc/passwd`) could cause `is_file(__DIR__ . $uri)` to escape to the web root. In practice, you should resolve the actual path (e.g., `realpath()`) and verify that it remains within `__DIR__` before serving it, rather than trusting `$uri` as-is.

## Redirect and Stop Execution

`header('Location: ...')` It simply adds information to the HTTP response—it does not interrupt the script. Without a `exit` immediately afterward, the following code continues to execute (and produce content) even after a redirect:

```php
<?php
if (!$utilisateurConnecte) {
    header('Location: /connexion');
    exit; // required: without this, the rest of the script will still run
}
?>
```
