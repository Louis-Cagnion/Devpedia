---
order: 11
---

# Managing Connections

When a user browses a site, the server often needs to remember them from one page to the next, or even from one visit to the next: staying logged in, retrieving their preferences, their cart... For this, PHP offers several tools, each with its own uses: **cookies** (stored on the user's device), **sessions** (stored on the server), and **login tokens** (for a long-lived connection). This chapter introduces these three tools and explains when to use one rather than another.

## Cookies
A **cookie** is a small piece of data stored by the user's browser, automatically sent to the server on every request to the same site. Unlike classic PHP variables (which disappear at the end of each script), a cookie persists across several visits, even if the user closes their browser.

Cookies are typically used to:
- Remember a user (stay logged in, "remember me")
- Save preferences (language, light/dark theme...)
- Track a shopping cart before an account is created

### Creating a cookie
```php
<?php
    setcookie("cookie_name", "value", time() + 3600); // expires in 1h
?>
```

`setcookie()` mainly takes 3 parameters:
- The cookie's name
- The value to store
- The expiration date (as a Unix timestamp; `time()` returns the current time, so `time() + 3600` means "in 1h")

> **Important note:** `setcookie()` must be called **before** any [HTML](/?c=langages&s=html&p=html) is output (before the slightest tag, space, or line break), because it modifies the response's HTTP headers. Same logic as the closing `?>` tag mentioned above.

### Reading a cookie
Once created, a cookie is accessible via the global variable `$_COOKIE`:

```php
<?php
    if (isset($_COOKIE["cookie_name"])) {
        echo $_COOKIE["cookie_name"];
    }
?>
```

> **Note:** a cookie created with `setcookie()` is only available in `$_COOKIE` starting from the page's **next reload**, not immediately within the same script.

### Modifying a cookie
There's no "update" function: to modify a cookie, it's simply recreated with the same name and a new value, which overwrites the old one:

```php
<?php
    setcookie("cookie_name", "new_value", time() + 3600);
?>
```

### Deleting a cookie
To delete a cookie, it's recreated with an expiration date **in the past**:

```php
<?php
    setcookie("cookie_name", "", time() - 3600);
?>
```

### Securing a cookie
`setcookie()` accepts additional options to strengthen security:

```php
<?php
    setcookie("cookie_name", "value", [
        "expires" => time() + 3600,
        "path" => "/",
        "secure" => true,
        "httponly" => true,
        "samesite" => "Strict"
    ]);
?>
```

- `secure`: the cookie is only sent if the connection is over HTTPS.
- `httponly`: prevents [JavaScript](/?c=langages&s=javascript&p=javascript) (`document.cookie`) from accessing the cookie, which limits the damage in the event of an XSS flaw.
- `samesite`: prevents the cookie from being sent on a request originating from another site, which protects against CSRF attacks.

> **Note:** never store sensitive information (password, card number...) in a cookie, even a secure one. A cookie remains manipulable by the user themselves. For sensitive server-side data, prefer **sessions** (`$_SESSION`).

## Sessions

A **session** allows data to be stored **server-side**, while associating it with a specific visitor. Unlike a cookie (stored on the user's device and modifiable by them), session data stays on the server: the user therefore has no way to read or modify it directly.

PHP links the visitor to their data through a unique session identifier, automatically sent to the browser as a cookie (usually named `PHPSESSID`). This cookie therefore contains no sensitive data: just an identifier, pointing to the real data stored on the server.

### Starting a session

```php
<?php
    session_start(); // must be called before any HTML output, just like setcookie()
?>
```

### Storing session data

```php
<?php
    session_start();

    $_SESSION["user_id"] = 12;
    $_SESSION["email"] = "jean@example.com";
?>
```

### Reading session data

```php
<?php
    session_start();

    if (isset($_SESSION["user_id"])) {
        echo "Logged in as user #" . $_SESSION["user_id"];
    }
?>
```

> **Note:** `session_start()` must be called at the top of **every** page where you want to access `$_SESSION`, otherwise PHP doesn't know which visitor to associate the data with.

### Deleting data or destroying the session

```php
<?php
    session_start();

    unset($_SESSION["user_id"]);  // deletes only this data
    session_destroy();            // destroys the entire session (e.g. on logout)
?>
```

> **Note:** by default, the `PHPSESSID` cookie (and therefore the session) disappears when the browser closes, or after a period of server-side inactivity. To make a connection last longer (several days/weeks), classic sessions aren't enough: see the section on login tokens below.

## Login tokens ("remember me")

To keep a user logged in over the long term (several days/weeks), even after the browser closes, neither a classic cookie (not secure enough for this) nor a session (too short-lived) is sufficient. A **login token** (*remember token*) is used instead: long-lived proof of login, stored both on the user's device and on the server.

The principle:
- The password is **never** stored for this: only a random token.
- The token is sent in plain text in a cookie to the user.
- Its **hashed** version is stored in the database, linked to their account (just like a password).

### Creating the token at login

```php
<?php
    $token = bin2hex(random_bytes(32)); // random token (64 hexadecimal characters)
    $hashedToken = hash('sha256', $token);

    // store $hashedToken in the database, linked to the user (e.g. a "remember_token" column)

    // send $token (unhashed) in a secure, long-lived cookie
    setcookie("remember_token", $token, time() + 60 * 60 * 24 * 30, "/", "", true, true);
?>
```

### Automatically logging the user back in

On every visit, if the session is empty but the `remember_token` cookie exists, its match is checked in the database:

```php
<?php
    session_start();

    if (!isset($_SESSION["user_id"]) && isset($_COOKIE["remember_token"])) {
        $hashedToken = hash('sha256', $_COOKIE["remember_token"]);

        // look up a user in the database whose remember_token matches
        $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
        $stmt->execute(['token' => $hashedToken]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION["user_id"] = $user["id"]; // logs the user back in
        }
    }
?>
```

> **Note:** always compare the **hash** of the received token with the one stored in the database, never the plaintext token: exactly like a password with `password_hash()`/`password_verify()`. If the cookie is stolen, the thief cannot deduce the stored hash from it, but more importantly, this token can be revoked at any time by deleting it from the database (e.g. on a password change or an explicit logout).

### Cookie, session, or login token: which to choose?

| | Cookie | Session | Login token |
|---|---|---|---|
| Storage | Browser-side | Server-side | Both (token on the user's device, hash in the database) |
| Manipulable by the user | Yes | No | The token itself, yes, but useless without the matching hash in the database |
| Persistence | Can last days/months | Generally until the browser closes | Can last days/months |
| Revocable at any time | No | Yes (`session_destroy()`) | Yes (deleting the hash from the database) |
| Typical use | Preferences, language, theme | User login (short-lived), cart, sensitive data | User login (long-lived), "remember me" |

## What the session cookie actually contains

Common mistake: thinking `$_SESSION` is stored in the browser's cookie. In reality:

- `session_start()` generates an **opaque random identifier** (e.g. `a3f9c1...`), sent to the client in a cookie (`PHPSESSID` by default). That's all the cookie contains.
- The data (`$_SESSION['...'] = ...`) is written **server-side** (file or database), associated with that identifier.
- On every subsequent request, the browser sends the cookie back; PHP reads the identifier, finds the matching server-side storage, and reloads `$_SESSION`.

> **Analogy:** a coat-check ticket. The number on the ticket is drawn at random **at the moment the coat is checked in**: it has no relationship to the coat itself. The number-to-coat link only exists in the attendant's register (the server-side storage), never in the number.

### The risk of session theft

If an attacker guessed or stole the identifier of an already open session, they would inherit its content, but they can't *choose* the target: the identifier is generated by a CSPRNG (cryptographically secure random number generator) with enormous entropy, comparable to a password several hundred bits long. `session_set_cookie_params(['httponly' => true])` adds a complementary layer of protection: it prevents the page's JavaScript from reading this cookie, which limits the damage in the event of an XSS flaw.

### Why not simply derive the identifier by hashing a known piece of data?

A simple hash (`sha256($known_identifier)`) is **deterministic and contains no secret**: anyone can recalculate it. If there is a limited number of possible values (e.g. about thirty accounts), an attacker doesn't even need to brute-force a large space: they simply need to hash each possible value to obtain all valid identifiers. A hash alone adds **no entropy** beyond what's already present in the input.

## Signed Tokens (HMAC): carrying data while staying tamper-proof

The login token seen above is an **opaque** secret (random, meaningless), verified by matching it against a hash stored in the database. But sometimes a token is needed that **carries information itself** (e.g. an identifier), while remaining impossible to forge without access to the server. That's when `hash_hmac()` is used: a hash calculated with a **secret key**, known only to the server.

```php
<?php
function createToken(string $data, string $secret): string
{
    $encoded = base64_encode($data);                  // encoded, NOT encrypted: readable if decoded
    $signature = hash_hmac('sha256', $encoded, $secret);
    return $encoded . '.' . $signature;
}

function verifyToken(string $token, string $secret): ?string
{
    [$encoded, $signature] = explode('.', $token, 2);
    $expected = hash_hmac('sha256', $encoded, $secret);

    if (!hash_equals($expected, $signature)) {
        return null; // invalid signature -> data rejected, even if it looks correct
    }
    return base64_decode($encoded);
}
?>
```

If the `$encoded` part is modified by someone who doesn't know `$secret`, the signature recalculated at verification time will never match again: the modification isn't physically prevented, but it **is detected**.

### Session identifier vs. signed token: two different needs

| | Session identifier | Signed token (HMAC) |
|---|---|---|
| Contains the information? | No: opaque key, no data | Yes: the data is encoded inside it |
| Requires server-side storage? | Yes: the data lives in a file/database associated with the key | No: self-sufficient, verifiable by recalculating the signature at any time |
| Typical use case | User already identified, session in progress | Data to transmit verifiably with no database to consult (activation link, guest with no account...) |

> **Note:** `hash_equals()` rather than a plain `===` to compare two hashes: it compares in constant time, which prevents an attacker from progressively deducing the correct value by measuring the response time (timing attack).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A cookie is stored client-side (can be manipulated by the user), a session server-side (an opaque identifier sent via a cookie). A login token combines both for a long-lived connection. |
| **Tools you can use** | `setcookie()`, `$_SESSION`/`session_start()`, `hash_hmac()`/`hash_equals()` for a signed token. |
| **Pitfalls to avoid** | Storing sensitive data in a cookie; comparing two hashes with `==`/`===` rather than `hash_equals()`. |
| **Best practices** | `httponly`/`secure`/`samesite` on every session cookie; compare a received token's hash, never the token in plain text. |
