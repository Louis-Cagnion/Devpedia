---
order: 15
---

# Business Logic and Automated Workarounds

The previous chapters cover TECHNICAL flaws (poorly validated data, poorly checked access). This family is different: the code can be technically flawless and still be exploitable, because the BUSINESS RULE itself is incomplete or misplaced. No automated scanner detects these flaws: you need to understand the application's business domain to know what to test.

## Mass assignment: accepting more fields than intended

An endpoint that updates an object by directly accepting ALL fields received in the request (instead of an explicit list of allowed fields) lets the client send a field they should never be able to modify themselves.

```php
// DANGEROUS: accepts every field received, including ones a legitimate form
// would never expose
$user->update($_POST);
// If the client quietly adds "role=admin" to their profile-edit request,
// and the "users" table does have a "role" column...
// that field gets updated like any other, with no distinction

// SAFE: explicit allowlist of fields this specific endpoint may modify
$allowed_fields = ['name', 'email', 'bio'];
$data = array_intersect_key($_POST, array_flip($allowed_fields));
$user->update($data);
```

> **Best practice:** explicitly define, for each endpoint, the list of fields it's allowed to modify, rather than passing whatever data was received straight into an object update.

## Salami slicing: accumulating many small, negligible gains

The name comes from thin salami slices: a fraud that skims, from each operation, an amount individually so small that no per-transaction check notices it, but which becomes significant once repeated at very large scale. Textbook case: a rounding calculation (division, rate, conversion) systematically truncated in the same direction rather than rounded correctly, with the remainder redirected to an account controlled by the attacker.

```text
1,000,000 transactions x 0.004 cent "lost" on each rounding = 4,000 cents = 40 euros
-> invisible transaction by transaction, significant at the scale of the volume processed
```

> **Pitfall:** testing a financial calculation rule with a single reference amount, which never reveals a drift that only shows up at large scale or across a varied distribution of values.
>
> **Best practice:** test a rounding/distribution logic against a large volume of varied values, checking the cumulative sum rather than a single case; make sure a rounding remainder is always accounted for somewhere traceable, never silently lost or redirected without a trace.

## User enumeration: an error message that's too precise

A login form (or password-reset form) that distinguishes "incorrect password" from "this account doesn't exist" reveals, without granting access, which accounts actually exist.

| Response | What it reveals |
|---|---|
| "No account associated with this email" | Confirms the email is NOT registered (useful info for an attacker about other emails they tried) |
| "Incorrect password" | Confirms the account EXISTS, narrowing the rest of the attack to guessing just the password |
| "Invalid credentials" (same message in both cases) | Reveals nothing more than an incorrect email/password pair, without specifying which |

This information, free for the attacker, saves an entire step of a brute-force attack or a targeted phishing attempt (knowing WHO has an account before even trying to log into it).

> **Best practice:** return a strictly identical error message, whether the email exists or not, on both the login form AND the password-reset form.

## Race condition / TOCTOU: exploiting the gap between checking and acting

**TOCTOU** (*time-of-check to time-of-use*) names the delay, however short, between the moment the code CHECKS that a condition is true and the moment it ACTS on it. If the state can change during that window, two simultaneous requests can both pass the check before either one has acted yet.

```text
Vulnerable code (using a single-use coupon):

  Request A                          Request B
  ----------                         ----------
  1. Checks: is coupon "PROMO"
     already used? NO
                                      2. Checks: is coupon "PROMO"
                                         already used? NO
                                         (state not yet changed by A)
  3. Marks "PROMO" as used
     applies the discount
                                      4. Marks "PROMO" as used
                                         applies the discount A 2nd TIME
```

Both requests, sent a few milliseconds apart (often automated on purpose for this), both pass the check BEFORE either one has had time to mark the coupon as used.

> **Best practice:** make the "check then act" operation ATOMIC (a single indivisible step, guaranteed by the database itself: a uniqueness constraint, a conditional update in a single query) rather than two separate steps in the application code, where another request can always slip in between them.

## Unicode homograph spoofing

Two characters can display identically or nearly identically on screen while being, for the computer, completely DIFFERENT characters (distinct [Unicode](/?c=donnees&s=representation-des-donnees&p=encodage-des-textes) code points). A username or domain chosen with these characters fools the human eye without triggering a uniqueness conflict on the database side.

```text
"admin"  (standard Latin characters)
"аdmin"  (the "а" is Cyrillic, U+0430, visually identical to the Latin "a" U+0061)

-> Both strings LOOK identical to the eye, but are two DIFFERENT values
   for a plain string comparison: an attacker can create "аdmin" alongside
   an already-existing real "admin" account, with no conflict
```

> **Best practice:** normalize (see the standard Unicode normalization functions, e.g. NFKC) and/or restrict the allowed character set for any identifier meant to be compared for uniqueness (username, subdomain), rather than accepting any Unicode character.

## Filter bypass through encoding

A validation filter that decodes or normalizes data ONLY ONCE before checking it can be bypassed with an extra layer of encoding, revealed only during a later processing step.

```text
Filter that blocks the "/" character (path traversal):
  Input received directly:          ../secret          -> blocked (contains "/")
  Input double-encoded as URL:      %252e%252e%252f     -> decoded ONCE gives
                                                            "%2e%2e%2f" (doesn't
                                                            yet contain a literal "/")
                                                         -> passes the filter
                                     then a LATER layer (web server,
                                     framework) decodes it a SECOND time
                                                         -> it does become "../secret"
                                                            AFTER the filter
```

> **Best practice:** fully decode data (until stable, no further change on another decode) BEFORE validating it, never validate an intermediate encoding hoping no later layer will decode it again.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A business logic flaw stays exploitable even with technically clean code: an endpoint that accepts too many fields (mass assignment), a rounding drift accumulated at scale (salami slicing), an exploitable gap between checking and acting (TOCTOU), an overly precise error message (enumeration), a visually deceptive identifier (Unicode homograph), or a filter applied before an extra decoding step. |
| **Tools you can use** | An explicit allowlist of fields per endpoint; a uniqueness constraint or conditional database update for an atomic operation; Unicode normalization (NFKC) on any identifier compared for uniqueness. |
| **Pitfalls to avoid** | Passing any received data as-is into an object update. Testing a financial calculation on a single case rather than a large volume. Splitting "check" and "act" into two non-atomic steps. An error message that distinguishes a nonexistent account from an incorrect password. Validating data before it's fully decoded. |
| **Best practices** | An allowlist of fields per endpoint. Testing cumulative drift over a large volume of values. Making every sensitive "check then act" operation atomic. A generic, identical error message on authentication failure. Normalizing/restricting the character set for a unique identifier. Full decoding before validation, never the reverse. |
