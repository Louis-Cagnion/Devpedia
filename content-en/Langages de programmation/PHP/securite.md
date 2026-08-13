---
order: 14
---

# Securing your data

When you retrieve data coming from the user (forms, URLs, cookies...), you should always treat it as **untrusted**, even if it looks correct. A malicious visitor can send anything: HTML code, JavaScript, or malformed SQL queries. PHP provides several functions to filter, validate, and escape this data.

This chapter first covers the protections directly actionable in PHP (validation, XSS, SQL injection, passwords), then places these protections within a broader picture of the families of attacks a web application can suffer: some are defended against at the application code level, others at the network or infrastructure level.

## `filter_input()`

Lets you retrieve **and** validate/filter a piece of data from `$_GET`, `$_POST`, etc. at the same time:

```php
<?php
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $age = filter_input(INPUT_GET, 'age', FILTER_VALIDATE_INT);

    if ($email === false) {
        echo "Invalid email.";
    }
?>
```

If the data doesn't match the requested filter, `filter_input()` returns `false`. If the field doesn't exist at all, it returns `null`.

Some common filters:

```php
<?php
    FILTER_VALIDATE_EMAIL;   // checks an email format
    FILTER_VALIDATE_INT;     // checks an integer
    FILTER_VALIDATE_FLOAT;   // checks a decimal number
    FILTER_VALIDATE_URL;     // checks a URL
    FILTER_SANITIZE_STRING;  // cleans a string (deprecated since PHP 8.1)
?>
```

## `htmlspecialchars()`: protecting against XSS flaws

If you display user data on the page (e.g. a comment, a username), a visitor could inject malicious HTML/JavaScript code. This is a flaw called **XSS** (*Cross-Site Scripting*).

```php
<?php
    $comment = "<script>alert('hacked');</script>";

    echo htmlspecialchars($comment);
    // displays the text as-is, without running the script
?>
```

`htmlspecialchars()` converts special characters (`<`, `>`, `"`, `'`) into HTML entities, which prevents the browser from interpreting the content as code.

> **Note:** always display user data with `htmlspecialchars()`, unless you have a specific reason not to.

## Protecting against SQL injection

If you insert user data directly into an SQL query, a visitor can manipulate the query to access data they shouldn't be able to see, or even delete it. This is an **SQL injection**, already detailed with the PDO prepared statement mechanism in the [SQL](/?c=domain-specific-languages-dsl&p=sql) chapter: the protection in PHP stays exactly the same, never concatenate user data into the query text.

```php
<?php
    // ❌ Dangerous: the data is inserted directly into the query
    $query = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";

    // ✅ Safe: the data goes through a placeholder, never interpreted as SQL
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
?>
```

## `password_hash()` and `password_verify()`: storing passwords

A password should **never** be stored in plain text in a database. PHP provides built-in functions to hash it securely:

```php
<?php
    // We hash the password
    $user['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // We store the hash in the database (not the plaintext password)
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :password)");
    $stmt->execute([
        'email' => $_POST['email'],
        'password' => $user['password'],
    ]);

    // We retrieve the stored hash, based on the entered email
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
    $user = $stmt->fetch();

    // We compare the entered password with the hash retrieved from the database
    if (password_verify($_POST['password'], $user['password'])) {
        echo "Login successful.";
    } else {
        echo "Incorrect password.";
    }
?>
```

`password_hash()` generates a different hash on every call (even with the same password), thanks to a "salt" automatically built in. It's therefore impossible to recover the original password from the hash.

This salt isn't lost: it's included directly in the generated hash, for example:

```text
2y $10 N9qo8uLOickgx2ZMRZoMye IjZAgcfl7p92ldGxad68LJZdL17lhWy
```

- `$2y$` → the algorithm used ([bcrypt](https://en.wikipedia.org/wiki/Bcrypt))
- `$10$` → the cost (the difficulty of the computation)
- The next 22 characters → the salt used for this specific hash
- The rest → the hashing result, computed with this salt

That's why `password_verify($_POST['password'], $user['password'])` still works: it reads the salt already present in `$user['password']`, hashes `$_POST['password']` with **that same salt**, then compares the result to the rest of `$user['password']` using the same algorithm and cost. This is why we always use `password_verify()` to compare, never a fresh `password_hash()` compared directly to the stored hash: the latter would always give a different result, even with the correct password.

### Comparing hashes: the `==` pitfall

One more reason to never compare a hash yourself: PHP's **loose comparison** (see the [Conditions](/?c=langages-de-programmation&s=php&p=conditions) chapter) converts numeric-looking strings to numbers before comparing them.

Now, PHP interprets a string like `"0e123456"` as scientific notation: `0` raised to a power, so **zero**. Two completely different hashes that both start with `0e` followed by digits are therefore both converted to `0`, and considered equal:

```php
<?php
    var_dump("0e123456" == "0e999999");   // true !  0 == 0
    var_dump("0e123456" === "0e999999");  // false, as expected
?>
```

This isn't theoretical: this flaw (the *magic hash*) has been used to bypass real authentication systems, by supplying a password whose [MD5](https://en.wikipedia.org/wiki/MD5) or [SHA-1](https://en.wikipedia.org/wiki/SHA-1) hash happens to take this form. All it took was code that compared with `==`.

Three protections, which stack:

- use `password_verify()`, which does no type conversion at all;
- to compare two sensitive strings, use `hash_equals()`, which compares in **constant time** and also avoids timing attacks;
- never compare sensitive data with `==`.

```php
if (hash_equals($expectedToken, $receivedToken)) { /* ... */ }
```

## CSRF: Cross-Site Request Forgery

A malicious site makes the victim's browser trigger an action, without their knowledge, on another site where they're already authenticated, relying on the fact that the browser automatically sends that site's session cookies along, regardless of the request's page of origin.

```html
<!-- on a booby-trapped third-party site -->
<img src="https://bank.example/transfer?amount=1000&to=attacker">
```

If the victim is logged into their bank in the same browser, this request goes out with their valid session cookies, without them having clicked anything on `bank.example` itself. This is only possible because the action is triggered by a plain `GET`/`POST` request with no verification beyond the presence of a valid session cookie.

**Protection: a CSRF token**, a random value generated server-side, stored in the session, and required in every sensitive form/request:

```php
<?php
session_start();

// when generating the form
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
?>
<form action="/transfer" method="POST">
    <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
    <!-- ... rest of the form ... -->
</form>
```

```php
<?php
// when receiving the form
session_start();

$receivedToken = $_POST['csrf_token'] ?? '';
if (!hash_equals($_SESSION['csrf_token'] ?? '', $receivedToken)) {
    http_response_code(403);
    exit('Request rejected (invalid CSRF token).');
}
// normal processing...
?>
```

A third-party site has no way to know this token (it's stored in the session, never accessible from another domain): it therefore can't slip it into its booby-trapped request. `hash_equals()` rather than a plain `===`, for the same reason as when verifying a signed token (see [Managing connections](/?c=langages-de-programmation&s=php&p=connexions)): a constant-time comparison, which avoids a timing attack.

> **Note:** the `samesite` cookie attribute (see [Managing connections](/?c=langages-de-programmation&s=php&p=connexions)) provides an additional layer of protection at the browser level itself, but an application-level CSRF token remains the reference protection, independent of the browser used.

## A broader picture of other attack families

The protections above cover the PHP application code itself. Other attacks target the network, the infrastructure, or the user directly: knowing them helps you understand *where* a given protection sits, and what it doesn't cover.

### Network attacks

Three acronyms come up throughout the rest of this section:

- **SSL** (*Secure Sockets Layer*) and its successor **TLS** (*Transport Layer Security*): the protocols that encrypt a network connection and let the client verify the server's identity via a **certificate**. SSL has long been obsolete, but the name stuck in common usage: when people say "SSL certificate", they mean TLS in practice.
- **HTTPS**: simply HTTP carried over a TLS-encrypted connection. Nothing else changes on the application protocol side.
- **DNS** (*Domain Name System*): the directory that translates a domain name into an IP address. It's a required step before any connection, and therefore a target.

- **Man-in-the-middle (MITM)**: the attacker inserts themselves between the client and the legitimate server, and relays (or alters) the conversation without either party noticing. Encryption alone (TLS) isn't enough to prevent it: an attacker can encrypt *their own* conversation with the client, while separately encrypting another conversation with the real server. **Protection:** verifying the SSL/TLS certificate presented by the server (`verify_peer`/`verify_peer_name`, see [Making native HTTP calls](/?c=langages-de-programmation&s=php&p=http)): without it, a certificate forged by the attacker would be accepted without complaint.
- **DNS spoofing / cache poisoning**: the attacker corrupts DNS resolution so a legitimate domain name points to their own IP. Certificate verification remains a protection even if DNS is compromised, since it doesn't depend on DNS resolution but on the cryptographic identity presented by the server.
- **Sniffing (passive eavesdropping)**: simply reading unencrypted network traffic. Requires no active interaction with the traffic: just observing it, for example on an unsecured public Wi-Fi network. **Protection:** HTTPS everywhere, with no exception for data deemed "not that sensitive".

### Session hijacking

Stealing a user's session identifier (the cookie, see [Managing connections](/?c=langages-de-programmation&s=php&p=connexions)) to impersonate them without knowing their password. An attacker who obtains this identifier (via XSS: reading the cookie in JS, which is why `httponly` matters; via sniffing on an unencrypted connection; or by physically stealing the device) can literally pass for the victim for as long as the session stays valid.

### Brute force

Trying a large number of combinations (passwords, tokens, credentials) until finding a valid one. `password_verify()` (see above) protects against directly reading a password from the database, but not against an attacker trying thousands of passwords on the login form itself. **Typical protection:** limiting the number of attempts per unit of time (*rate limiting*), by IP, by account, or both, with a delay or a temporary block after a failure threshold.

### DDoS: Distributed Denial of Service

Overwhelming a server (or a network resource) with requests, from many simultaneous sources, to make it unavailable to legitimate users. Different from brute force: the goal isn't to guess a value, but to exhaust a resource (bandwidth, CPU, open connections). Rarely defended against at the application code level alone: rather through infrastructure (firewall, CDN, rate limiting upstream of the server).

### Phishing

Making the victim believe they're interacting with a legitimate site/service in order to extract information from them (credentials, banking details), typically via a domain name that visually resembles the real one (*typosquatting*) and a valid SSL certificate, but issued for that fake domain. A valid certificate proves the identity **of the domain being called**, not that this domain is trustworthy: a nuance that explains why the browser's padlock alone never guarantees a site is legitimate.

### SSRF: Server-Side Request Forgery

Forcing a server to make, on an attacker's behalf, an HTTP request to a destination it shouldn't normally be able to reach, typically a resource internal to the network (an admin dashboard, cloud metadata, an internal service not exposed publicly).

```php
<?php
// dangerous if $_GET['url'] can target an internal address (e.g. http://169.254.169.254/, http://localhost:6379/...)
$response = file_get_contents($_GET['url']);
?>
```

Any code that builds a destination URL/host from input influenced, even indirectly, by the user (see [Making native HTTP calls](/?c=langages-de-programmation&s=php&p=http)) is a candidate for an SSRF audit. **Protection:** validate the target host against an explicit allowlist rather than trusting an arbitrary URL supplied by the client.

## Summary

| Risk | Main defense |
|---|---|
| Malformed data (email, number...) | `filter_input()` |
| HTML/JS injection (XSS) | `htmlspecialchars()` |
| SQL injection | Prepared statements (PDO) |
| Plaintext password | `password_hash()` / `password_verify()` |
| CSRF | Session CSRF token, verified via `hash_equals()` |
| MITM / DNS spoofing | SSL certificate verification (`verify_peer`/`verify_peer_name`) |
| Sniffing | HTTPS everywhere |
| Session hijacking | `httponly`/`secure` cookie, high-entropy session identifier |
| Brute force | Rate limiting the number of attempts |
| SSRF | Allowlist of authorized hosts/URLs |

> **Note:** none of these protections replace HTTPS, which encrypts the data exchanged between the browser and the server.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | All user data is untrusted by default. The main application flaws (XSS, SQL injection, CSRF) are neutralized by dedicated mechanisms (`htmlspecialchars`, prepared statements, CSRF token); other attacks target the network or infrastructure, outside the application code alone. |
| **Tools you can use** | `filter_input()`, `htmlspecialchars()`, PDO (prepared statements), `password_hash`/`password_verify`, `hash_equals()`. |
| **Pitfalls to avoid** | Comparing two hashes with `==` (the *magic hash* flaw); concatenating user data directly into an SQL query. |
| **Best practices** | Always validate/escape user data according to its use (display, SQL, comparison); HTTPS everywhere, with no exception for data deemed "not that sensitive". |
