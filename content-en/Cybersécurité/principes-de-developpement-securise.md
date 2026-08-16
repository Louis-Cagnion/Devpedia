---
order: 3
---

# Secure Development Principles

The [Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles) chapter shows that most vulnerabilities share a common root: a piece of data or a situation wrongly treated as trustworthy. This chapter details four principles that, applied consistently, eliminate a large share of that risk before the business logic is even written.

## Secure by design: thinking about security from the start

Bolting on security *after the fact*, once a feature is already written, almost always amounts to patching holes one by one, with no guarantee of having found them all. **Secure by design** means factoring security questions into a feature's design from the start, on the same footing as its functional requirements: *who can do what? what happens if this data is tampered with? what happens if this service goes down?*

```text
"Patch it later" approach                Secure by design approach

Feature written                          Feature designed
        |                                        |
        v                                        v
  Deployed to production                 Who can access it? What data
        |                                is sensitive? What happens
        v                                on failure?
  Flaw discovered                                |
        |                                        v
        v                                Feature written, with
      Fix                                obvious flaws already avoided
  (the cycle repeats
   with every new flaw)
```

## Validating input: never trust by default

Any data entering a system from the outside (a form field, a URL parameter, an HTTP header, an uploaded file, a third-party API response) must be validated before use. Two strategies exist:

| Strategy | Principle | Reliability |
|---|---|---|
| **Allowlist** | Explicitly permit only values/formats known to be valid | High: anything not explicitly allowed is rejected |
| **Denylist** | Explicitly reject values/formats known to be dangerous | Low: bound to miss a case nobody anticipated |

```text
// Denylist (fragile): blocks what's already known
if input contains "<script>" then reject
// An attacker bypasses it with an unforeseen variant: "<ScRiPt>", "<img onerror=...>"...

// Allowlist (robust): only allows what's expected
if input exactly matches "valid email format" then accept
// Everything else is rejected, including an unforeseen variant
```

The allowlist is therefore the default strategy to prefer. A concrete allowlist validation example, using `filter_input()`, is already covered in [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite).

> **Pitfall:** validating a piece of data only on the client side (in the browser), then trusting it on the server. Client-side validation is only a usability convenience (instant feedback): nothing stops an attacker from sending a request directly to the server, bypassing the browser entirely.
>
> **Best practice:** always re-validate on the server, no matter what validation was already done client-side.

## The principle of least privilege

A component (user, service, process) should only hold the rights strictly required for its task, never more "just in case":

| Context | Excess privilege | Applying the principle |
|---|---|---|
| Database | An application account with `DROP TABLE`/`ALTER` rights | An account limited to `SELECT`/`INSERT`/`UPDATE` on only the tables it needs |
| File system | A web process running as administrator | A dedicated user, with no write access outside its own folder |
| Third-party API | An API key granting access to every operation on the account | A key restricted to only the operations actually used (read-only if no write is required) |
| Human team | Everyone has access to production | Only the people who genuinely need it, with a regular access review |

The benefit goes beyond prevention alone: if a component is compromised anyway, the damage stays bounded to what its limited rights allow, instead of spreading to the whole system.

## Defense in depth

No protection is foolproof: defense in depth means stacking several independent layers of protection, so that a single failure is never enough to compromise the whole system.

```text
Attacker
   |
   v
[ Firewall / network infrastructure ]   <- 1st layer
   |
   v
[ Input validation ]                    <- 2nd layer
   |
   v
[ Prepared statements (anti-injection) ]<- 3rd layer
   |
   v
[ Least-privilege DB account ]          <- 4th layer
   |
   v
Data protected, even if ONE layer fails
```

If one layer is bypassed (an unpatched flaw, for instance), the following layers still contain the damage, instead of granting full access from the very first breach.

## Failing securely

When a security check fails or crashes unexpectedly (a network error, an unforeseen exception), the default behavior must be to **deny** access, never to grant it by default:

```text
// Dangerous: an unexpected error grants access (fail open)
try:
    if userIsAuthorized(user) then grant access
catch error:
    grant access   // "just in case, let it through"

// Safe: an unexpected error denies access (fail closed)
try:
    if userIsAuthorized(user) then grant access
    else deny access
catch error:
    deny access   // by default, with no confirmed authorization, no access at all
```

This mirrors the general robustness expected of any code: an error should fail explicitly, never be silently masked by a permissive default behavior.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | Four principles cut down most flaws: designing for security from the start, validating every external input with an allowlist, applying least privilege, and stacking several independent layers of defense. |
| **Tools you can use** | `filter_input()` (PHP) and equivalents in other languages for allowlist validation; dedicated application accounts with restricted rights for the database. |
| **Pitfalls to avoid** | Validating data only client-side; using a denylist instead of an allowlist; granting access by default on an unexpected error (*fail open*). |
| **Best practices** | Always re-validate server-side; restrict every component to the strict minimum it needs; deny access by default when in doubt (*fail closed*). |
