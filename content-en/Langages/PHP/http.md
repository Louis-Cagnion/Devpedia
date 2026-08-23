---
order: 12
---

# Making HTTP Calls Natively

PHP offers at least two native ways to make outbound HTTP requests (such as querying an external API) without relying on any third-party libraries: the cURL extension and streams.

> An **API** (*Application Programming Interface*) is the contract by which one piece of software exposes its functionality to another: which requests to send, in what format, and what responses to expect. The term covers both a web service reachable over HTTP (the case here) and the full set of public functions of a library.
>
> A web API's responses are most often in **JSON** (*[JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) Object Notation*) format: a human-readable text format for representing structured data, born in JavaScript but today independent of any language. PHP converts it with `json_encode()` / `json_decode()`.

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

$response  = curl_exec($ch);        // false in case of a network failure (C-style error)
$codeHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
?>
```

`CURLOPT_*` are integer constants predefined by the cURL extension (similar to [C](/?c=langages-de-programmation&s=c&p=c) `open()` flags): each one configures a specific aspect of the request.

### Convert a "C-style" return to an exception

`curl_exec()` returns `false` in the event of a network failure, rather than throwing an exception: an entry point can handle this detail and allow only exceptions to be propagated to the rest of the program:

```php
<?php
if ($response === false || $codeHttp !== 200) {
    throw new \RuntimeException("HTTP $codeHttp");
}
?>
```

Once this conversion is made in a single location, the rest of the project never needs to know that `curl_exec()` can redirect to `false`: it can simply use `try` / `catch`, just as with any other modern PHP error.

## PHP Streams: Another API for the Same Purpose

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
$response  = file_get_contents($url, false, $contexte); // false if the operation fails; same behavior as `curl_exec`
?>
```

> **Note:** In a literal associative array, a duplicate key will silently take on its **last** value: the first assignment is dead code and is never used. This is a good reason to have a linter check this type of array (HTTP options, configuration, etc.), or to review it yourself line by line, asking, “What is the last value assigned to this key?”

## `json_decode()` : an ambiguous return t`null`

```php
<?php
$data = json_decode($response, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    throw new \RuntimeException('Réponse JSON invalide');
}
?>
```

`json_decode()` on an invalid string returns `null`, but a **valid** JSON string containing the literal `"null"` also decodes to `null`. A simple `if ($data === null)` would therefore not distinguish between "invalid JSON" and "JSON that actually was `null`". Hence `json_last_error()`: a separate function that returns whether the last conversion actually failed, regardless of the value obtained, the same logic as `isset()` / `empty()` when dealing with an array key (see the chapter on variables): never rely on an ambiguous value when a dedicated mechanism exists to resolve the ambiguity.

`json_encode()` / `json_decode(..., true)` are the PHP equivalents of `JSON.stringify()` / `JSON.parse()` in JavaScript (`true` requires an associative array rather than a `stdClass` object).

## `verify_peer` / `verify_peer_name`: verifying the remote server's certificate

A stream context's `ssl` block (see the example above) controls two **independent** checks, not the same thing twice:

```php
<?php
$options = [
    'ssl' => [
        'verify_peer'      => false,  // is the certificate signed by a recognized authority?
        'verify_peer_name' => false,  // does the certificate's name match the domain being called?
    ],
];
?>
```

- `verify_peer`: is the certificate presented by the server signed by a recognized certificate authority (CA)? Disabled, a self-signed certificate (forged in a few seconds with `openssl`) is accepted with no complaint.
- `verify_peer_name`: does the name written into that certificate match the domain name actually being called? A perfectly valid certificate (signed by a real CA) but issued for a *different* domain fails this check.

Disabling `verify_peer` is the broader of the two flaws: it opens the door to a **man-in-the-middle** attack with virtually no effort from an attacker, who doesn't even need to obtain a certificate signed by a real CA (see [Securing your data](/?c=langages-de-programmation&s=php&p=securite) for the detail of this attack). `verify_peer_name` alone, disabled, is one notch less severe (a CA-signed certificate would still be needed, just for the wrong domain), but remains a flaw.

> **Note:** disabling both is a common trade-off in local development (a self-hosted API with a self-signed certificate, for example), but becomes a real security risk again if the same code runs in production without distinguishing environments. cURL has the exact equivalent via `CURLOPT_SSL_VERIFYPEER` and `CURLOPT_SSL_VERIFYHOST`.

## `ignore_errors`: what does `file_get_contents()` do with an HTTP error response?

By default (without `ignore_errors`), if the server responds with an HTTP error code (4xx/5xx), `file_get_contents()` returns `false` and discards the response body, **even though PHP did receive that body**. With `ignore_errors => true`, the function returns the actual response body, regardless of the HTTP code:

```php
<?php
$options = ['http' => ['ignore_errors' => true]];
$context = stream_context_create($options);

$response = file_get_contents($url, false, $context);
// with ignore_errors: $response holds the body even for a 404/500
// without ignore_errors: $response is false for a 404/500, even though the server did respond
```

A direct consequence for a "return value → exception" conversion like the one seen above (`if ($response === false) { throw ... }`): with `ignore_errors => true`, this check no longer triggers **at all** for an HTTP error (4xx/5xx): only for a more radical communication failure (server unreachable, DNS not resolving, network timeout, a case where PHP receives nothing at all, not even headers).

> **Note:** the two mechanisms are complementary, not redundant. Once `ignore_errors` is enabled, every caller must re-check the actual HTTP code itself (`$http_response_header`, see the PHP documentation) to distinguish "communication succeeded but the response is an application-level error" from "everything went fine": something the initial `throw` (reserved for network failure) no longer covers.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | PHP makes outbound HTTP requests natively via cURL or streams, with no third-party library. Both return `false` on a network failure, a "C-style" error rather than an exception. |
| **Tools you can use** | `curl_init`/`curl_setopt_array`/`curl_exec`, `stream_context_create`/`file_get_contents`, `json_encode`/`json_decode`, `json_last_error()`. |
| **Pitfalls to avoid** | Disabling `verify_peer`/`verify_peer_name` in production (opens the door to a MITM); confusing a `json_decode()` that returns `null` due to failure with valid JSON literally containing `null`. |
| **Best practices** | Convert a "C-style" return value (`false`) into an exception in a single place in the code; check `json_last_error()` rather than testing the decoded value directly. |
