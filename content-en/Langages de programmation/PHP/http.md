---
order: 11
---

# Making HTTP Calls Natively

PHP offers at least two native ways to make outbound HTTP requests (such as querying an external API) without relying on any third-party libraries: the cURL extension and streams.

## cURL

API in 4 steps: create a handle, configure options, execute, release.

```php
<?php
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $corpsJson,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'], // required for a JSON body
    CURLOPT_RETURNTRANSFER => true, // Return the response as a string, rather than displaying it directly
    CURLOPT_TIMEOUT        => 10,
]);

$reponse  = curl_exec($ch);        // false in case of a network failure (C-style error)
$codeHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
?>
```

`CURLOPT_*` are integer constants predefined by the cURL extension (similar to C `open()` flags): each one configures a specific aspect of the request.

### Convert a "C-style" return to an exception

`curl_exec()` returns `false` in the event of a network failure, rather than throwing an exception—an entry point can handle this detail and allow only exceptions to be propagated to the rest of the program:

```php
<?php
if ($reponse === false || $codeHttp !== 200) {
    throw new \RuntimeException("HTTP $codeHttp");
}
?>
```

Once this conversion is made in a single location, the rest of the project never needs to know that `curl_exec()` can redirect to `false`: it can simply use `try` / `catch`, just as with any other modern PHP error.

## PHP Streams — Another API for the Same Purpose

PHP treats URLs as a type of "file" that `file_get_contents()` can read directly. `stream_context_create()` configures this behavior (HTTP method, headers, body, SSL, etc.):

```php
<?php
$options = [
    'http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/json\r\n",
        'content' => $corpsJson,
    ],
];
$contexte = stream_context_create($options);
$reponse  = file_get_contents($url, false, $contexte); // false if the operation fails; same behavior as `curl_exec`
?>
```

> **Note:** In a literal associative array, a duplicate key will silently take on its **last** value—the first assignment is dead code and is never used. This is a good reason to have a linter check this type of array (HTTP options, configuration, etc.), or to review it yourself line by line, asking, “What is the last value assigned to this key?”

## `json_decode()` : an ambiguous return t`null`

```php
<?php
$donnees = json_decode($reponse, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    throw new \RuntimeException('Réponse JSON invalide');
}
?>
```

`json_decode()` on an invalid string returns `null` — but a **valid** JSON string containing the literal `"null"` also decodes to `null`. A simple `if ($donnees === null)` would therefore not distinguish between "invalid JSON" and "JSON that actually was `null`". Hence `json_last_error()`: a separate function that returns whether the last conversion actually failed, regardless of the value obtained—the same logic as `isset()` / `empty()` when dealing with an array key (see the chapter on variables): never rely on an ambiguous value when a dedicated mechanism exists to resolve the ambiguity.

`json_encode()` / `json_decode(..., true)` are the PHP equivalents of `JSON.stringify()` / `JSON.parse()` in JavaScript (`true` requires an associative array rather than a `stdClass` object).

## To be explored

Two issues related to the security and robustness of HTTP requests remain to be explored:

- `verify_peer` / Setting `verify_peer_name` to `false` in the `ssl` block of a stream context disables verification of the remote server's SSL certificate. Why would you want to do that, and what are the trade-offs?
- `ignore_errors` (streams): How does this setting affect `file_get_contents()`'s behavior when it receives an HTTP error response (4xx/5xx)?
