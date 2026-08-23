---
order: 11
---

# Manage Connections

When a user browses a website, the server often needs to remember the user from one page to the next, or even from one visit to the next: to keep the user logged in, retrieve their preferences, their shopping cart, and so on. To achieve this, PHP offers several tools, each with its own specific uses: **cookies** (stored on the user’s device), **sessions** (stored on the server), and **login tokens** (for long-term authentication). This chapter introduces these three tools and explains when to use one over the other.

## Cookies
A **cookie** is a small piece of data stored by the user's browser that is automatically sent to the server with every request to the same site. Unlike standard PHP variables (which are cleared at the end of each script), a cookie persists across multiple visits, even if the user closes their browser.

Cookies are typically used to:
- Remembering a user (staying logged in, "remember me")
- Save preferences (language, light/dark theme, etc.)
- Track a shopping cart before creating an account

### Create a cookie
```php
<?php
    setcookie("nom_cookie", "valeur", time() + 3600); // expires in 1 hour
?>
```

`setcookie()` It mainly takes 3 parameters:
- The name of the cookie
- The value to be stored
- The expiration date (as a Unix timestamp; `time()` returns the current time, so `time() + 3600` means "in 1 hour")

> **Important note:** `setcookie()` must be called **before** any [HTML](/?c=langages-de-balisage&s=html&p=html) is rendered (before any tags, spaces, or line breaks), because it modifies the HTTP headers of the response. This follows the same logic as the closing `?>` tag mentioned above.

### Read a cookie
Once created, a cookie can be accessed via the global variable `$_COOKIE`:

```php
<?php
    if (isset($_COOKIE["nom_cookie"])) {
        echo $_COOKIE["nom_cookie"];
    }
?>
```

> **Note:** A cookie created with `setcookie()` is only available in `$_COOKIE` after the page **is** **reloaded**; it is not immediately available within the same script.

### Edit a cookie
There is no "update" function: to modify a cookie, you simply recreate it with the same name and a new value, which overwrites the old one:

```php
<?php
    setcookie("nom_cookie", "nouvelle_valeur", time() + 3600);
?>
```

### Delete a cookie
To delete a cookie, you can recreate it with an expiration date **in the past**:

```php
<?php
    setcookie("nom_cookie", "", time() - 3600);
?>
```

### Securing a cookie
`setcookie()` supports additional options to enhance security:

```php
<?php
    setcookie("nom_cookie", "valeur", [
        "expires" => time() + 3600,
        "path" => "/",
        "secure" => true,
        "httponly" => true,
        "samesite" => "Strict"
    ]);
?>
```

- `secure` : The cookie is only sent if the connection is via HTTPS.
- `httponly` : Prevents [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript) (`document.cookie`) from accessing the cookie, which limits the damage in the event of an XSS vulnerability.
- `samesite` : Prevents the cookie from being sent in a request originating from another site, thereby protecting against CSRF attacks.

> **Note:** Never store sensitive information (passwords, credit card numbers, etc.) in a cookie, even a secure one. A cookie can still be manipulated by the user. For sensitive data on the server side, use **sessions** instead (`$_SESSION`).

## The sessions

A **session** allows data to be stored **on the server side** while associating it with a specific visitor. Unlike a cookie (which is stored on the user's device and can be modified by the user), session data remains on the server, so the user has no way to read or modify it directly.

PHP links the visitor to their data using a unique session ID, which is automatically sent to the browser as a cookie (usually named `PHPSESSID`). This cookie therefore contains no sensitive data: just an ID that points to the actual data stored on the server.

### Log In

```php
<?php
    session_start(); // must be called before any HTML is rendered, just like setcookie()
?>
```

### Storing Data in a Session

```php
<?php
    session_start();

    $_SESSION["user_id"] = 12;
    $_SESSION["email"] = "jean@example.com";
?>
```

### Read session data

```php
<?php
    session_start();

    if (isset($_SESSION["user_id"])) {
        echo "Connecté en tant qu'utilisateur n°" . $_SESSION["user_id"];
    }
?>
```

> **Note:** `session_start()` must be called at the beginning of **every** page where you want to access `$_SESSION`; otherwise, PHP won't know which visitor to associate the data with.

### Delete data or end the session

```php
<?php
    session_start();

    unset($_SESSION["user_id"]); // deletes only this data
    session_destroy();           // deletes the entire session (e.g., upon logout)
?>
```

> **Note:** By default, the `PHPSESSID` cookie (and thus the session) expires when the browser is closed or after a period of inactivity on the server side. To keep a connection active for a longer period (several days or weeks), standard sessions are not sufficient: see the section on session tokens below.

## Session tokens ("remember me")

To keep a user logged in for an extended period (several days or weeks), even after the browser is closed, neither a standard cookie (which isn't secure enough for this purpose) nor a session (which is too short-lived) is sufficient. Instead, a *remember ***token** is used: a long-term proof of authentication, stored both on the user’s device and on the server.

The principle:
- We **never** store the password to do this: only a random token.
- The token is sent in plain text in a cookie to the user.
- Its **hashed** version is stored in the database, linked to the user's account (just like a password).

### Create the token upon login

```php
<?php
    $token = bin2hex(random_bytes(32)); // random token (64 hexadecimal characters)
    $tokenHache = hash('sha256', $token);

    // We store $tokenHache in the database, linked to the user (e.g., the "remember_token" column)

    // We send the $token (unhashed) in a secure, long-lived cookie
    setcookie("remember_token", $token, time() + 60 * 60 * 24 * 30, "/", "", true, true);
?>
```

### Automatically log the user back in

On each visit, if the session is empty but the "`remember_token`" cookie exists, we check whether it matches the database:

```php
<?php
    session_start();

    if (!isset($_SESSION["user_id"]) && isset($_COOKIE["remember_token"])) {
        $tokenHache = hash('sha256', $_COOKIE["remember_token"]);

        // We're searching the database for a user whose `remember_token` matches
        $stmt = $pdo->prepare("SELECT * FROM users WHERE remember_token = :token");
        $stmt->execute(['token' => $tokenHache]);
        $user = $stmt->fetch();

        if ($user) {
            $_SESSION["user_id"] = $user["id"]; // logs the user back in
        }
    }
?>
```

> **Note:** We always compare the **hash** of the received token with the one stored in the database, never the plaintext token, just like with a password using `password_hash()` / `password_verify()`. If the cookie is stolen, the thief cannot deduce the stored hash; more importantly, this token can be revoked at any time by deleting it from the database (e.g., when a password is changed or the user explicitly logs out).

### Cookies, sessions, or login tokens: which one should you choose?

| | Cookie | Session | Login token |
|---|---|---|---|
| Storage | Browser-side | Server-side | Both (token on the user's device, hash in the database) |
| User-manipulable | Yes | No | The token itself, yes, but it's useless without the corresponding hash in the database |
| Persistence | Can last for days or months | Usually until the browser is closed | Can last for days or months |
| Revocable at any time | No | Yes (`session_destroy()`) | Yes (removal of the hash from the database) |
| Typical Use | Preferences, language, theme | User login (short-term), shopping cart, sensitive data | User login (long-term), "remember me" |

## What the Session Cookie Actually Contains

A common mistake: believing that `$_SESSION` is stored in the browser's cookie. In reality:

- `session_start()` generates a **random**, **opaque identifier** (e.g., `a3f9c1...`), which is sent to the client in a cookie (`PHPSESSID` by default). That is all the cookie contains.
- The data (`$_SESSION['...'] = ...`) is written **on the server side** (to a file or database) and associated with this identifier.
- With each subsequent request, the browser sends the cookie; PHP reads the identifier, retrieves the corresponding server storage, and reloads `$_SESSION`.

> **Analogy:** a coat check ticket. The number on the ticket is chosen at random **when you check your coat**; it has nothing to do with the coat itself. The link between the number and the coat exists only in the employee’s records (the server storage), never in the number itself.

### The Risk of Session Hijacking

If an attacker were to guess or steal the identifier of an already open session, they would inherit its contents, but they cannot *choose* the target: the identifier is generated by a CSPRNG (cryptographically secure pseudorandom number generator) with enormous entropy, comparable to a password several hundred bits long. `session_set_cookie_params(['httponly' => true])` adds an additional layer of protection: it prevents the page’s JavaScript from reading this cookie, which limits the damage in the event of an XSS vulnerability.

### Why not simply derive the identifier by hashing a known piece of data?

A simple hash (`sha256($identifiant_connu)`) is **deterministic and contains no secrets**: anyone can recalculate it. If there is a limited number of possible values (e.g., about thirty accounts), an attacker doesn’t even need to brute-force a large space; they simply need to hash each possible value to obtain all valid identifiers. A hash alone adds no** entropy** beyond that already present in the input.

## Signed Tokens (HMAC): Transmitting Data While Ensuring It Cannot Be Tampered With

The login token described above is an **opaque** secret (random, meaningless), verified by comparing it to a hash stored in the database. But sometimes, we need a token that **carries information itself** (e.g., an identifier), while remaining impossible to forge without access to the server. In that case, we us`hash_hmac()`: a hash calculated using a **secret key** known only to the server.

```php
<?php
function creerToken(string $donnee, string $secret): string
{
    $encode = base64_encode($donnee);                 // Encoded, NOT encrypted: readable if decoded
    $signature = hash_hmac('sha256', $encode, $secret);
    return $encode . '.' . $signature;
}

function verifierToken(string $token, string $secret): ?string
{
    [$encode, $signature] = explode('.', $token, 2);
    $attendu = hash_hmac('sha256', $encode, $secret);

    if (!hash_equals($attendu, $signature)) {
        return null; // Invalid signature -> data rejected, even if it appears to be correct
    }
    return base64_decode($encode);
}
?>
```

If the `$encode` section is modified by someone who is not a `$secret`, the signature recalculated during verification will no longer match: the modification is not physically prevented, but **it is detected**.

### Session ID vs. Signed Token: Two Different Requirements

| | Session ID | Signed token (HMAC) |
|---|---|---|
| Does it contain information? | No: opaque key, no data | Yes: the data is encoded within it |
| Does it require server storage? | Yes: the data is stored in a file or database associated with the key | No: self-contained; verifiable by recalculating the signature at any time |
| Typical Use Case | User already logged in, session active | Data to be transmitted in a verifiable manner without consulting a database (activation link, guest without an account, etc.) |

> **Note:** Use `hash_equals()` rather than just `===` to compare two hashes: it performs the comparison in constant time, which prevents an attacker from gradually deducing the correct value by measuring the response time (timing attack).
