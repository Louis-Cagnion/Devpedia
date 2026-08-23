---
order: 2
---

# Passwords and Secure Hashing

A password must never be stored as-is (in plaintext) in a [database](/?c=domain-specific-languages-dsl&p=sql): if that database ever leaks (a hack, a poorly protected backup, a malicious employee), every password immediately becomes readable, for every account, on every site where the user reused it. **Hashing** is the technique that avoids this scenario.

## Hashing: A One-Way Function

A **hash function** transforms an input (the password) into a fixed-size output (the *hash*), with two properties: the same input always produces the same output, and it's practically impossible to recover the input from the output alone.

```text
"password123"  ->  hashing  ->  ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94
```

> **Don't confuse:** a *hash table* (see [the dedicated C chapter](/?c=langages-de-programmation&s=c&p=tables-de-hachage)) is a data structure that speeds up looking up an element; a *cryptographic hash function*, here, makes a secret unreadable. Both use the word "hash" for a related mathematical operation (turning an input into a fixed-size output), but for entirely different purposes.

Storing the hash instead of the password changes the consequence of a leak:

| | Password stored in plaintext | Password stored hashed |
|---|---|---|
| Database leak | Every password is immediately readable | An attacker recovers hashes, not the passwords themselves |
| A legitimate user logging in | Direct comparison of the entered text | The entered text is hashed in turn, then compared to the hash |

## Why a "Fast" Hash Is Dangerous for a Password

Hash functions like [SHA-256](https://en.wikipedia.org/wiki/SHA-2) have been around for a long time and are deliberately **fast**: ideal for checking that a downloaded file wasn't corrupted, catastrophic for a password. An attacker who steals a database of hashes doesn't need to "break" the hashing itself: they try candidate passwords (a **dictionary attack**), hashing each one and comparing it to the stolen result. The faster the hash, the more they can try per second.

| Function | Designed for | Speed | Suited to passwords? |
|---|---|---|---|
| [MD5](https://en.wikipedia.org/wiki/MD5), [SHA-1](https://en.wikipedia.org/wiki/SHA-1), SHA-256 | Checking file integrity, fast indexing | Billions of hashes per second on dedicated hardware | No |
| [bcrypt](https://en.wikipedia.org/wiki/Bcrypt), [scrypt](https://en.wikipedia.org/wiki/Scrypt), [Argon2](https://en.wikipedia.org/wiki/Argon2) | Hashing passwords specifically | Deliberately slow, tunable | Yes |

> **Pitfall:** using SHA-256 (or worse, MD5) to hash a password, assuming a "strong" cryptographic hash is enough. These functions are strong for their intended purpose (integrity), but their very speed is what makes them unsuited here: an attacker equipped with specialized hardware can try billions of combinations per second.
>
> **Best practice:** use a function specifically designed for passwords (bcrypt, Argon2), whose slowness is a deliberate design choice, tunable to stay costly even as hardware improves.

## Salt: Preventing Precomputation Attacks

Without additional precautions, an attacker can precompute the hash of millions of common passwords once and for all (a [**rainbow table**](https://en.wikipedia.org/wiki/Rainbow_table)), then look up an instant match in a stolen database. **Salt** counters this strategy: a random value, unique to each password, combined with it before hashing.

```text
No salt   :  hash("password123")                    -> always the same result
With salt :  hash("password123" + "a8f3...")         -> different result per user
             hash("password123" + "9c21...")         -> same password, different hash
```

Two users with the same password thus get different hashes, and a rainbow table precomputed without knowing the salt becomes useless. The salt doesn't need to stay secret: it's generally stored right alongside the hash itself, only the original password needs to remain impossible to recover.

> **Best practice:** generate the salt with a cryptographic random generator rather than a classic one (see [Randomness and Generators](/?c=representation-des-donnees&p=aleatoire-et-generateurs), which cites password salt as exactly the kind of use case that requires a CSPRNG), so it stays unpredictable.

## Moving to Implementation

In practice, choosing the algorithm, generating the salt, and handling its integration into the final hash is handled by a dedicated function in the language used, never something to reimplement yourself: see [`password_hash()` and `password_verify()`](/?c=langages-de-programmation&s=php&p=securite) for the concrete [PHP](/?c=langages-de-programmation&s=php&p=php) implementation, which uses bcrypt by default and details how the salt is embedded in the stored hash.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A password always gets hashed before storage, never kept in plaintext. A fast hash function (SHA-256, MD5) makes dictionary attacks easier; a slow, tunable, dedicated function (bcrypt, Argon2) deliberately slows them down. Salt prevents precomputation attacks (rainbow tables) and guarantees a different hash for the same password across two users. |
| **Tools you can use** | bcrypt, Argon2, scrypt for hashing; a cryptographic random generator for the salt. |
| **Pitfalls to avoid** | Using SHA-256/MD5 to hash a password. Reimplementing salt generation or hash comparison yourself instead of using the language's dedicated functions. |
| **Best practices** | Always use a hash function designed for passwords, never a general-purpose hash function. Leave salt generation to a dedicated function rather than coding it by hand. |
