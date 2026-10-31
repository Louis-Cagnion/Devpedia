---
order: 16
---

# Address aliases, 301 redirects and route parameter conversion

An **address** (also called a **URL**, the line you read at the top of the browser, for example `/blog/my-article`) can have two faces: the one the visitor reads, and the one the program actually uses. This chapter builds, in minimal PHP and without a framework, a small router that handles these two faces, the redirects that avoid breaking old links, and the automatic conversion of a piece of address (`12`) into an object (article number 12). It extends [routing without a framework](/?c=langages&s=php&p=routage): the notion of a route, the single entry point and `php -S` are explained there, so they are not repeated here. The HTTP status codes (`200`, `404`...) are presented in [data exchanges: API and HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http), and PHP objects (class, constructor) in [OOP in PHP](/?c=langages&s=php&p=poo).

> Content management systems (CMS) such as [Drupal](https://www.drupal.org/docs) offer these mechanisms ready-made: an alias module, a redirect module, and a route parameter converter. This chapter shows how they work inside, with code you can run yourself.

## An alias: a readable address for an internal address

A program often identifies a page by a number: `/node/12` means "the content number 12". That is convenient for the machine, unreadable for a human, and of no use to a search engine (a service that indexes web pages so it can offer them in its results). An **address alias** is a readable address (`/blog/my-article`) that designates the same page as the **internal address** (`/node/12`). The visitor only sees and shares the alias.

| Concept | Example | Who sees it | Role |
|---|---|---|---|
| Internal address | `/node/12` | The program (routes, database) | Identify the page stably, by its number |
| Alias | `/blog/my-article` | The visitor, search engines | Be readable, memorable, shareable |
| Old alias | `/blog/old-title` | Old links, bookmarks, search engines | Keep leading to the page after a rename |

Where should the mapping be stored? In a database, in reality. Here, a simple PHP associative array (a list of "key => value" pairs) is enough to understand the principle.

## The incoming handler and the outgoing handler

Two functions, called **address handlers**, work in opposite directions:

| Handler | When it runs | Direction | Example |
|---|---|---|---|
| Incoming | On each request received, **before** routing | alias to internal address | `/blog/my-article` becomes `/node/12` |
| Outgoing | When the program writes a link into a page | internal address to alias | `/node/12` becomes `/blog/my-article` |

```text
  Visitor types           Handler                 Router
/blog/my-article  --->  incoming (alias   --->  /node/12  --->  controller
                        to internal)            (route)

  HTML page written       Handler
<a href="/blog/...">  <---  outgoing (internal  <--- the program knows /node/12
                           to alias)
```

The router ([routing chapter](/?c=langages&s=php&p=routage)) therefore only needs to know internal addresses: it does not even know that aliases exist. The code below is the file `aliases.php`: every line is commented.

```php
<?php
// file: aliases.php
// alias table: readable address => internal address
$alias = [
    '/blog/my-article' => '/node/12',
    '/blog/another-topic' => '/node/13',
];

// puts an address into a unique form: lowercase, a "/" at the start, none at the end
function normalize(string $path): string
{
    // strtolower lowercases, trim removes the "/" at both ends
    return '/' . trim(strtolower($path), '/');
}

// incoming handler: alias -> internal address
function handleIncoming(string $path, array $alias): string
{
    $path = normalize($path); // "/Blog/My-Article/" becomes "/blog/my-article"
    // the ?? operator gives the right-hand value when the left-hand one does not exist
    return $alias[$path] ?? $path; // unknown alias: the address stays unchanged
}

// outgoing handler: internal address -> alias
function handleOutgoing(string $internal, array $alias): string
{
    $inverse = array_flip($alias); // array_flip swaps keys and values
    return $inverse[$internal] ?? $internal; // no alias: we keep the internal address
}
```

A small test script, run from the command line (`php alias-test.php`), shows both directions.

```php
<?php
// file: alias-test.php
require __DIR__ . '/aliases.php'; // loads the $alias table and the functions

echo handleIncoming('/blog/my-article', $alias), "\n"; // expected: /node/12
echo handleIncoming('/Blog/My-Article/', $alias), "\n"; // expected: /node/12
echo handleIncoming('/contact', $alias), "\n"; // expected: /contact
echo handleOutgoing('/node/12', $alias), "\n"; // expected: /blog/my-article
```

Result obtained:

```text
/node/12
/node/12
/contact
/blog/my-article
```

> **Pitfall:** `array_flip` assumes a single key per value. If two aliases lead to `/node/12`, the outgoing direction keeps only one of them (the last one in the array): always choose one **official** alias per page, the others are old aliases (next section).

## Redirect 301 or 302

A **redirect** is a server response that tells the browser: "what you are looking for is somewhere else, go to this address". It is written with a status code (a number that summarizes the response) and a `Location` header (the new address). The code says whether the move is permanent.

| Code | Name | Meaning | Browser cache | Typical use |
|---|---|---|---|---|
| `301` | Moved Permanently | The old address no longer serves, use the new one | Kept for a long time | Renamed page, internal address to its alias |
| `302` | Found (temporary move) | The page is elsewhere for now | Not kept durably | Promotion, maintenance page, test |
| `308` | Permanent Redirect | Like `301`, but the HTTP method is kept | Kept for a long time | Permanent redirect of a form sent with `POST` |
| `307` | Temporary Redirect | Like `302`, but the HTTP method is kept | Not kept | Temporary redirect of a form sent with `POST` |

An **HTTP method** is the verb of the request (`GET` to read, `POST` to send a form), seen in [data exchanges](/?c=infrastructure-devops&s=infrastructure&p=api-et-http). With `301` and `302`, browsers historically turn a `POST` into a `GET` after the redirect; `307` and `308` forbid it. The full behavior is described in the [MDN documentation on redirections](https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections).

What really makes `301` and `302` different is what the reader does with it. A browser or a search engine that receives a `301` replaces the old address with the new one in its bookmarks and index; with a `302`, it keeps the old one.

## Keeping the old alias after a rename

An article changes its title: its alias goes from `/blog/old-title` to `/blog/my-article`. If the old alias disappears, all the links already published (emails, bookmarks, other sites) lead to a `404` error (page not found). The solution: **keep the old alias** in a separate table, and answer with a `301` to the current alias.

The file `redirect.php` does three things: it sends a redirect, keeps the table of old aliases, and decides which redirect to apply to a requested address.

```php
<?php
// file: redirect.php
require_once __DIR__ . '/aliases.php'; // once only: we need handleOutgoing()

// sends a redirect, then stops the script
function redirect(string $target, int $status = 301): void
{
    // true: replaces a Location header already set
    header('Location: ' . $target, true, $status);
    exit; // without exit, the rest of the script would keep running
}

// old aliases kept after a rename: old alias => internal address
$oldAliases = [
    '/blog/old-title' => '/node/12',
];

// temporary redirects wanted: requested address => destination
$temporary = [
    '/promo' => '/blog/another-topic',
];

// returns [destination, status] if the address must be redirected, otherwise null
function findRedirect(
    string $path,
    array $alias,
    array $oldAliases,
    array $temporary
): ?array {
    if (isset($temporary[$path])) { // isset: true if the key exists
        return [$temporary[$path], 302]; // temporary move: 302
    }
    if (isset($oldAliases[$path])) { // known old alias
        return [handleOutgoing($oldAliases[$path], $alias), 301]; // to the current alias
    }
    $toAlias = handleOutgoing($path, $alias); // /node/12 typed by hand?
    if ($toAlias !== $path) {
        return [$toAlias, 301]; // the official address is the alias, not the internal address
    }
    return null; // ?array: the result is an array or null (nothing to redirect)
}
```

The third rule matters: if someone types `/node/12` directly, we redirect them to `/blog/my-article`. Without it, the same page would exist under two addresses, and search engines would count it as two competing pages (a "duplicate content").

| Requested address | Case | Response |
|---|---|---|
| `/blog/old-title` | Old alias kept | `301` to `/blog/my-article` |
| `/node/12` | Internal address that has an alias | `301` to `/blog/my-article` |
| `/promo` | Temporary redirect wanted | `302` to `/blog/another-topic` |
| `/blog/my-article` | Current alias | No redirect: the page is displayed |

## Converting a route parameter into an object

A route can contain a variable part, written between braces: `/article/{article}`. For `/article/12`, the variable part (the **route parameter**) is the text `12`. Each controller (the function that builds the response of the page) would then have to look up the article in the database, and answer `404` if it does not exist: the same code repeated everywhere. A **parameter converter** does this work once, before the controller, which receives the article object directly.

```text
/article/12  --->  parameter "12" (text)
                        |
                        v
               converter: looks up article 12
                  |                       |
          found   |                       | not found
                  v                       v
      controller(Article object)     404 response, controller never called
```

Here is the file `converter.php`. An **object** is a value that groups data (here a number and a title) and that you handle as one block; the `Article` class (see [OOP in PHP](/?c=langages&s=php&p=poo)) describes its shape.

```php
<?php
// file: converter.php
// the Article class describes an article: a number and a title
class Article
{
    // "public int $id" in the constructor directly creates the $id property
    public function __construct(public int $id, public string $title)
    {
    }
}

// imitation database: number => Article object
$articles = [
    12 => new Article(12, 'My article'),
    13 => new Article(13, 'Another topic'),
];

// converter: address text -> Article object, or null if it does not exist
function convertArticle(string $value, array $articles): ?Article
{
    if (!ctype_digit($value)) { // ctype_digit: true if the text contains only digits
        return null; // "abc" or "-1" are not valid numbers
    }
    return $articles[(int) $value] ?? null; // (int) turns the text "12" into the number 12
}
```

The router `router.php` finds the parameters in the address with a **regular expression** (a pattern that describes a form of text, explained in [the regex chapter](/?c=langages&s=domain-specific-languages-dsl&p=regex)), calls the converter of each parameter, then the controller.

```php
<?php
// file: router.php
// finds the matching route, converts the parameters, calls the controller
function dispatch(string $path, array $routes, array $converters): void
{
    foreach ($routes as $template => $controller) {
        // "/article/{article}" becomes the expression "#^/article/(?P<article>[^/]+)$#"
        $pattern = preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]+)', $template);
        $regex = '#^' . $pattern . '$#';
        // preg_match stores the pieces it finds in $matches
        if (!preg_match($regex, $path, $matches)) {
            continue; // this route does not fit: we try the next one
        }
        $params = []; // the objects to give to the controller
        foreach ($matches as $name => $text) {
            if (is_int($name)) {
                continue; // preg_match adds numbered entries: we ignore them
            }
            $object = $converters[$name]($text); // converter with the same name
            if ($object === null) {
                http_response_code(404); // object not found: the page does not exist
                echo "Not found\n";
                return; // the controller is never called
            }
            $params[] = $object; // object ready for the controller
        }
        $controller(...$params); // the three dots pass each object as an argument
        return; // one route handled: we stop here
    }
    http_response_code(404); // no route matches
    echo "Unknown page\n";
}
```

| Value in the address | Converter result | Response |
|---|---|---|
| `12` | `Article` object number 12 | `200`, the controller receives the object |
| `999` | `null` (no article) | `404`, controller not called |
| `abc` | `null` (not a number) | `404`, controller not called |
| `-1` | `null` (the `-` sign is not a digit) | `404`, controller not called |

## Putting it all together

The entry point `index.php` loads the four files, declares the controller and the routes, then handles the request in this order: possible redirect, alias translation, routing.

```php
<?php
// file: index.php
require __DIR__ . '/aliases.php'; // aliases and handlers
require __DIR__ . '/redirect.php'; // 301 and 302 redirects
require __DIR__ . '/converter.php'; // Article class and converter
require __DIR__ . '/router.php'; // dispatch() function

// controller: it directly receives the Article object, never a number
function showArticle(Article $article): void
{
    // htmlspecialchars neutralizes the < and > characters of a text displayed in the page
    echo '<h1>' . htmlspecialchars($article->title) . "</h1>\n";
}

// routes: address template => controller called
$routes = [
    '/node/{article}' => 'showArticle',
    '/article/{article}' => 'showArticle',
];

// converters: parameter name => conversion function
$converters = [
    'article' => fn(string $text): ?Article => convertArticle($text, $articles),
];

// requested address, without the part after "?"
$path = normalize(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/');

// 1) should we redirect?
$redirect = findRedirect($path, $alias, $oldAliases, $temporary);
if ($redirect !== null) {
    redirect(...$redirect); // [destination, status] becomes two arguments
}

// 2) the alias becomes an internal address, 3) the router takes over
dispatch(handleIncoming($path, $alias), $routes, $converters);
```

We start it with PHP's built-in server (`php -S 127.0.0.1:5611 index.php`, see [the routing chapter](/?c=langages&s=php&p=routage) for how it works). Results recorded with `curl -i` (the `-i` option also displays the response headers):

| Requested address | Code | `Location` header | Body |
|---|---|---|---|
| `/blog/my-article` | `200` | none | `<h1>My article</h1>` |
| `/blog/my-article/` (trailing slash) | `200` | none | `<h1>My article</h1>` |
| `/article/12` | `200` | none | `<h1>My article</h1>` |
| `/node/12` | `301` | `/blog/my-article` | empty |
| `/blog/old-title` | `301` | `/blog/my-article` | empty |
| `/promo` | `302` | `/blog/another-topic` | empty |
| `/article/999` | `404` | none | `Not found` |
| `/article/abc` | `404` | none | `Not found` |
| `/blog/unknown` | `404` | none | `Unknown page` |

## Pitfalls

| Pitfall | Consequence | Remedy |
|---|---|---|
| Redirecting with `301` by mistake or for a test | The browser keeps the redirect for a long time: even after a fix, some visitors keep being sent elsewhere | Test with `302`, switch to `301` only once you are sure |
| Deleting the old alias when renaming | All old links return `404` | Keep each old alias with a `301` to the current alias |
| Forgetting `exit` after `header('Location: ...')` | The script continues and may produce content or effects after the redirect | Isolate the redirect in a function that calls `exit` |
| Redirect chain (A to B to C) | Slowness, risk of a loop | Redirect directly to the **current** alias, never to an old alias |
| Two identical aliases for different pages | One page is unreachable (or the wrong one is displayed) | Make the alias unique when it is registered |
| Page reachable by the alias and by the internal address without a redirect | Duplicate content for search engines | Redirect the internal address to the alias with a `301` |
| Uppercase letters and trailing slash not normalized | `/Blog/My-Article/` and `/blog/my-article` are two addresses for the same content | Normalize (here `normalize()`), and redirect to the official form |
| Redirecting to an address taken from the request (`?next=...`) | Hijacking the site for phishing (*open redirect*) | Redirect only to addresses in your table, see [browser-side flaws](/?c=securite&s=cybersecurite&p=failles-de-navigateur) |
| Converter without validation (`(int) "abc"` is `0`) | An invalid text is taken for a valid number | Validate the format (`ctype_digit`) before searching |
| Controller receiving a possibly empty object | Fatal error on `null` | The converter answers `404` before calling the controller |
| Displaying a title without escaping it | XSS flaw (code injected into the page) | `htmlspecialchars()` when displaying |

## Best practices

| Practice | Reason |
|---|---|
| One official alias per page, the others are old aliases with a `301` | One page, one address: no duplicate content |
| Automatically create the old alias on rename | No published link breaks |
| `301` for a permanent change, `302` for a temporary change | The browser and search engines know what to keep |
| Produce all the site's links through the outgoing handler | A change of alias updates every link without any rewriting |
| Let the router know only internal addresses | Routes do not change when an alias changes |
| One converter per object type, reused by all routes | The search and the `404` are written only once |
| Validate the parameter text before searching for the object | Absurd values are refused cleanly |
| Compare normalized addresses (lowercase, no trailing slash) | No duplicate from a simple difference of case |

## Key Takeaways

| Concept | To remember |
|---|---|
| Address alias | Readable address for an internal address (`/blog/my-article` for `/node/12`) |
| Incoming handler | Translates the alias into an internal address before routing |
| Outgoing handler | Translates the internal address into an alias when the program writes a link |
| `301` redirect | Permanent: the browser and search engines keep it |
| `302` redirect | Temporary: the old address remains valid |
| Old alias kept | Keeps old links alive after a rename, thanks to a `301` |
| Parameter converter | Turns the address text into an object before the controller, `404` if not found |
| Controller | Receives the object directly, without searching or checking it itself |

To go further on the same principle in a framework, see the [Laravel documentation on routing](https://laravel.com/docs/routing) (automatic binding of a route parameter to a model) and the [official HTTP redirect specification](https://www.rfc-editor.org/rfc/rfc9110).
