---
order: 13
---

# Routing Without a Framework (Front Controller)

Without a framework ([Laravel](https://laravel.com), [Symfony](https://symfony.com)...), PHP provides no built-in router comparable to [Express](https://expressjs.com) (`app.get('/path', callback)`). A "pure PHP" project has to organize the mapping between a requested URL and the code to run itself.

## The front controller and the dispatch table

A common pattern is to route **all** requests through a single entry point (often `index.php`), which consults a "route → file" associative array:

```php
<?php
$routes = [
    'home'    => '/pages/home.php',
    'contact' => '/pages/contact.php',
];

$uri  = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$file = $routes[$uri] ?? null;

if ($file && file_exists(__DIR__ . $file)) {
    require __DIR__ . $file; // the "handler" is an executed file, not a called-back function
} else {
    http_response_code(404);
    echo "Page not found";
}
?>
```

Key difference from a JS router (Express): each route points to a **file path**, not a function. There's no callback to call: the file itself produces the HTTP response (`echo`, `header()`...) by reading the superglobals directly.

- `$_SERVER['REQUEST_URI']` contains the path **and** query string glued together (`/contact?ref=pub`). `parse_url(..., PHP_URL_PATH)` extracts only the path, discarding the query string.
- `trim(..., '/')` strips the leading/trailing `/` so that `'contact'` matches the key in the `$routes` array (with no leading slash).

## The "filesystem = URLs" model

On a classic PHP server (with no special configuration), **any file physically present under the web root is accessible via its URL path**: a `.php` file gets executed there, a static file is served as-is. This is the opposite of Express/[Node](https://nodejs.org), where a route only exists if explicitly declared: in "old-school" PHP, **everything is accessible by default, except what's explicitly blocked**.

Concrete consequence: a folder containing classes or sensitive data (database credentials, API keys...) must be **explicitly blocked**, even if no route in the application code ever references it: otherwise nothing stops a visitor from typing its path directly into the browser.

## The built-in development server's contract (`php -S`)

`php -S host:port router.php` doesn't have the capabilities of a real web server (no `.htaccess` file, no Apache/nginx configuration). The file passed as an argument runs on **every** request, and drives the behavior through its `return` value:

- `return false;` → "I did nothing, serve this request yourself normally" (the server then serves the requested physical file if it exists, otherwise 404).
- `return true;` → "I already handled this request myself (response already produced), do nothing more".

```php
<?php
// router.php
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 1) explicit blocks first
$blockedFolders = ['/data/', '/src/'];
foreach ($blockedFolders as $folder) {
    if (str_starts_with($uri, $folder)) {
        http_response_code(403);
        echo 'Access denied.';
        return true; // already answered, do nothing more
    }
}

// 2) existing static file -> let the server serve it itself
if (is_file(__DIR__ . $uri)) {
    return false;
}

// 3) otherwise, application dispatch
require __DIR__ . '/index.php';
return true;
?>
```

> **Note:** the order of the blocks matters. If the `is_file()` check were placed **before** the blocks, a request for a sensitive but physically present file (e.g. `/data/config.php`) would pass this check with `true` and return `false`, letting the built-in server **execute** that file directly, without going through the protections.

> **Note (security):** `$uri` comes directly from the request (`$_SERVER['REQUEST_URI']`): without normalization, a value containing directory traversal (`/../../etc/passwd`) could make `is_file(__DIR__ . $uri)` escape the web root. In practice, the real path must be resolved (e.g. `realpath()`) and checked to still be inside `__DIR__` before serving it, rather than trusting `$uri` as-is.

## Redirecting and stopping execution

`header('Location: ...')` only adds information to the HTTP response: it does **not** interrupt the script. Without an `exit` right after, the following code keeps running (and producing content) even after a redirect:

```php
<?php
if (!$loggedIn) {
    header('Location: /login');
    exit; // essential: without this, the rest of the script still runs
}
?>
```

## With a micro-framework: Slim and PSR-7

The manual pattern above ("route → file" array, superglobals read directly) can be replaced with a micro-framework like [Slim](https://www.slimframework.com/), which provides a real router (comparable to Express) and normalizes the request/response via **PSR-7**:

```php
<?php
$app->get('/contact', function (
    Psr\Http\Message\ServerRequestInterface $request,
    Psr\Http\Message\ResponseInterface $response
) {
    $response->getBody()->write('Contact page');
    return $response;
});
?>
```

**PSR-7** (*PHP Standards Recommendation* No. 7) is a PHP-FIG standard: it defines `ServerRequestInterface` and `ResponseInterface`, an **object-based, immutable** representation of an HTTP request/response, instead of the superglobals (`$_SERVER`, `$_POST`...) and `echo`/`header()`. Any framework that implements this standard (Slim here, but also Mezzio, or a framework-independent middleware) can exchange these objects, unlike superglobals, which are specific to each project.

| | Manual front controller | Micro-framework (Slim + PSR-7) |
|---|---|---|
| Request | Superglobals (`$_SERVER`, `$_GET`...) | `ServerRequestInterface` object, immutable |
| Response | `echo`, `header()` | `ResponseInterface` object, returned by the handler |
| Portability across frameworks | None (project-specific code) | Interoperable (any PSR-7 framework) |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Without a framework, a single front controller receives every request and dispatches via a "route → file" table. By default, every physical file under the web root is accessible: the opposite of a JS router, where nothing exists without explicit declaration. |
| **Tools you can use** | `parse_url()`, `$_SERVER['REQUEST_URI']`, `php -S` for a development server; a PSR-7 micro-framework (Slim...) for a real router and immutable request/response objects. |
| **Pitfalls to avoid** | Checking whether a file exists before checking blocked folders (reversed order = bypassed protection); redirecting without `exit` right afterward. |
| **Best practices** | Explicitly block every sensitive folder before serving a physical file; always `exit` immediately after a `header('Location: ...')`. |
