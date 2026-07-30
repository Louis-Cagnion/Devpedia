---
order: 13
---

# Secure Your Data

When you retrieve data from a user (forms, URLs, cookies, etc.), you should always treat it as **untrusted**, even if it appears to be correct. A malicious visitor could send anything: HTML code, JavaScript, or malformed SQL queries. PHP provides several functions to filter, validate, and escape this data.

## `filter_input()`

Allows you to retrieve **and** validate/filter data from `$_GET`, `$_POST`, etc., all at the same time:

```php
<?php
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $age = filter_input(INPUT_GET, 'age', FILTER_VALIDATE_INT);

    if ($email === false) {
        echo "Email invalide.";
    }
?>
```

If the data does not match the specified filter, `filter_input()` returns `false`. If the field does not exist at all, it returns `null`.

Some common filters:

```php
<?php
    FILTER_VALIDATE_EMAIL;    // checks an email format
    FILTER_VALIDATE_INT;      // checks an integer
    FILTER_VALIDATE_FLOAT;    // checks a decimal number
    FILTER_VALIDATE_URL;      // checks a URL
    FILTER_SANITIZE_STRING;   // cleans a string (deprecated since PHP 8.1)
?>
```

## `htmlspecialchars()` — Protect yourself from XSS vulnerabilities

If you display user data on the page (e.g., a comment, a username), a visitor could inject malicious HTML or JavaScript code. This is a vulnerability known as **XSS** (*Cross-Site Scripting*).

```php
<?php
    $commentaire = "<script>alert('piraté');</script>";

    echo htmlspecialchars($commentaire);
    // displays the text as-is, without running the script
?>
```

`htmlspecialchars()` converts special characters (`<`, `>`, `"`, `'`) into HTML entities, which prevents the browser from interpreting the content as code.

> **Note:** Always display user data using `htmlspecialchars()`, unless you have a specific reason not to.

## Protecting Yourself from SQL Injections

If you insert user data directly into an SQL query, a visitor could manipulate the query to access data they shouldn't be able to see, or even delete it. This is known as an **SQL injection**.

```php
<?php
    // ❌ Dangerous: The data is inserted directly into the query
    $query = "SELECT * FROM users WHERE email = '" . $_POST['email'] . "'";
?>
```

The solution is to use **prepared statements** via PDO (*PHP Data Objects*, the built-in PHP tool for communicating with a database), which separate the SQL query from the data:

```php
<?php
    // Database connection (type, address, database name, username, password)
    $pdo = new PDO('mysql:host=localhost;dbname=mabase', 'utilisateur', 'motdepasse');

    // Preparing the request: ":email" is a placeholder; it is not yet a valid value
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");

    // Execute the query using the actual value submitted by the user
    $stmt->execute(['email' => $_POST['email']]);

    // Retrieving the result as a PHP array
    $user = $stmt->fetch();
?>
```

With this method, data sent by the user via `$_POST` is never interpreted as SQL code, regardless of its contents. It will always be treated as a query parameter.

## `password_hash()` and `password_verify()` — storing passwords

A password should **never** be stored in plain text in a database. PHP provides built-in functions to hash it securely:

```php
<?php
    // We hash the password
    $user['password'] = password_hash($_POST['password'], PASSWORD_DEFAULT);

    // We store the hash in the database (not the plaintext password).
    $stmt = $pdo->prepare("INSERT INTO users (email, password) VALUES (:email, :password)");
    $stmt->execute([
        'email' => $_POST['email'],
        'password' => $user['password'],
    ]);

    // We retrieve the hash stored in the database based on the email address entered
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
    $stmt->execute(['email' => $_POST['email']]);
    $user = $stmt->fetch();

    // The entered password is compared with the hash retrieved from the database
    if (password_verify($_POST['password'], $user['password'])) {
        echo "Connexion réussie.";
    } else {
        echo "Mot de passe incorrect.";
    }
?>
```

`password_hash()` generates a different hash with each call (even with the same password), thanks to a "salt" that is automatically incorporated. It is therefore impossible to recover the original password from the hash.

This salt is not lost: it is included directly in the generated hash, for example:

```
2y $10 N9qo8uLOickgx2ZMRZoMye IjZAgcfl7p92ldGxad68LJZdL17lhWy
```

- `$2y$` → the algorithm used (bcrypt)
- `$10$` → the cost (the difficulty of the calculation)
- The next 22 characters → the salt used for this specific hash
- The remainder → the hash result, calculated using this salt

That's why `password_verify($_POST['password'], $user['password'])` still works: it reads the salt already present in `$user['password']`, hashes `$_POST['password']` using **that same salt**, and then compares the resulting hash to the rest of `$user['password']` using the same algorithm and cost. This is why we always use `password_verify()` for comparison, and never a new `password_hash()` compared directly to the stored hash—the latter would always yield a different result, even with the correct password.

## Abstract

| Risk | Function / Method |
|---|---|
| Invalid data (email, number, etc.) | `filter_input()` |
| HTML/JS Injection (XSS) | `htmlspecialchars()` |
| SQL Injection | Prepared Queries (PDO) |
| Plaintext password | `password_hash()` / `password_verify()` |

> **Note:** None of these security measures replace HTTPS, which encrypts the data exchanged between the browser and the server.
