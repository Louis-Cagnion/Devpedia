---
order: 1
---

# Authentication vs Authorization

> **Analogy:** a company badge. At the entrance, the guard checks that the photo on the badge matches your face: that's **authentication**, proving who you are. Once inside, that same badge determines which doors open for you (office, server room, rooftop): that's **authorization**, what you're allowed to do once identified. The two mechanisms work together, but they're two distinct checks, made at different times.

This confusion comes up often enough that it deserves to be settled before anything else: this chapter lays out the definitions that every other chapter in this category builds on.

## Authentication: Proving Who You Are

**Authentication** is the process that verifies a person (or a program) is really who they claim to be. Proving your identity always relies on at least one of three types of proof, called **authentication factors**:

| Factor | What it is | Example |
|---|---|---|
| Something you know | A memorized secret piece of information | A password, a PIN code |
| Something you have | A physical or digital object in your possession | A phone receiving a code, a USB security key |
| Something you are | A biological characteristic unique to you | A fingerprint, facial recognition |

```text
User                                   Server
----                                   ------
enters username + password       ->    checks the match
                                        against what's on record
                                  <-    authenticated (or refused)
```

Most systems today rely on a single factor (the password): a practical choice, but a fragile one, since a single compromised secret is enough to steal the entire identity. Other chapters in this category detail how to store that secret correctly, and how to combine several factors to reduce this risk.

## Authorization: What You're Allowed to Do

Once identity is verified, **authorization** determines which resources or actions that identity can access. Two employees at the same company can authenticate with equal success on the same system, without necessarily having the same rights once logged in:

```text
Employee A (authenticated) -> "accounting" role     -> can view salaries
Employee B (authenticated) -> "development" role    -> CANNOT view salaries
```

Authentication answers the question *"who are you?"*, once per login. Authorization answers *"are you allowed to do this specific thing?"*, potentially on every action, and can change without the person needing to re-authenticate (a role change, for instance).

## A Concrete Illustration: HTTP Codes 401 and 403

The chapter on [APIs and HTTP](/?c=infrastructure&p=api-et-http) presents the status code as the number that indicates whether a request succeeded, and if not, why. Two specific codes illustrate exactly the distinction laid out above:

| Code | Official name | What it actually means |
|---|---|---|
| `401` | *Unauthorized* | Authentication missing or invalid: the server doesn't know who you are |
| `403` | *Forbidden* | Authentication succeeded, but authorization was denied: the server knows who you are, and refuses |

> **Pitfall:** trusting the official name `Unauthorized` for code `401` and assuming it signals an authorization problem. Historically misnamed, it actually signals missing or invalid authentication: it's `403` that covers a genuine authorization refusal, once identity has already been established.
>
> **Best practice:** when facing an access error, check which code it is before looking for the cause: a `401` is fixed by providing or renewing valid credentials, a `403` is never fixed that way since the identity is already accepted, only the role or permissions need to change.

## A Simple Mechanism: HTTP Basic Authentication

**HTTP Basic** is an authentication mechanism carried by the HTTP protocol itself, rather than by the application: it's the browser that displays its own login pop-up (not a login form designed by the site), and credentials travel in an `Authorization` header on every request.

```text
Client                                  Server
------                                  ------
request without Authorization header -> 401, header "WWW-Authenticate: Basic"
(the browser shows its pop-up)
request with header
"Authorization: Basic dXNlcjpwYXNz"  -> 200, if credentials are valid
```

The transmitted header is nothing more than `username:password` encoded in **Base64** (`dXNlcjpwYXNz` decodes to `user:pass`).

> **Pitfall:** believing Base64 encoding protects the credentials in any way. Base64 is **neither hashing nor encryption** (see the distinction laid out in [Applied Cryptography](/?c=authentification&s=cybersecurite&p=cryptographie-appliquee)): it's just a representation, instantly decodable by anyone who intercepts the request, no key required at all.
>
> **Best practice:** only use HTTP Basic over a systematic HTTPS connection, never in plaintext: without HTTPS, credentials travel literally in the clear over the network.

Another difference from the mechanisms already covered ([sessions/cookies](/?c=authentification&s=sessions-et-tokens&p=sessions-et-cookies), [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens)): HTTP Basic has no proper server-side logout concept. The browser retains the credentials for the domain as long as the tab stays open, and automatically resends them on every subsequent request; there's no direct equivalent to deleting a session cookie or a JWT expiring.

## Why the Distinction Matters in Practice

Confusing the two mechanisms leads to fixing the wrong problem: resetting the password of a user who gets a `403` changes nothing, since their identity was already valid, the problem comes from their rights. Conversely, changing the permissions of an account that gets a `401` does nothing as long as authentication itself keeps failing.

> **Pitfall:** treating every access error as a credentials problem by reflex, without checking whether authentication actually failed or whether authorization is what's refusing.
>
> **Best practice:** always identify which of the two mechanisms is at fault before acting, relying on the returned status code (`401` vs `403`) when the check happens through an API.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Authentication proves who you are (via one or more factors: knowledge, possession, inherence); authorization determines what you're allowed to do once identified. Two distinct mechanisms, often confused. HTTP Basic is a simple authentication mechanism carried by HTTP itself, to be reserved for a systematic HTTPS connection. |
| **Tools you can use** | HTTP codes `401` (authentication) and `403` (authorization) to precisely diagnose which of the two mechanisms is failing; the `Authorization: Basic` header for simple HTTP authentication. |
| **Pitfalls to avoid** | Trusting the name `Unauthorized` for code `401`, which actually signals an authentication problem, not an authorization one. Fixing the wrong mechanism (resetting a password when facing a `403`, for instance). Believing that HTTP Basic's Base64 encoding protects credentials. |
| **Best practices** | Always identify which of the two mechanisms is at fault before acting. Rely on the status code returned by an API to decide quickly. Only use HTTP Basic over HTTPS, never in plaintext. |
