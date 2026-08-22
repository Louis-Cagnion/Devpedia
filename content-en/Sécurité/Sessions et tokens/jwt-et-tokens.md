---
order: 2
---

# JWT and Tokens

The previous chapter shows that a session forces the server to keep a dedicated storage space, looked up on every request. That works great for a single server, but gets more cumbersome as soon as several servers handle requests for the same site: each one then needs access to the same session store, an extra dependency to keep running. Another approach avoids this problem entirely: instead of storing the information server-side, it gets encoded directly **inside** the token the client carries.

## The JWT: Self-Contained and Verifiable Information

A **JWT** (*JSON Web Token*) encodes information in [JSON](/?c=infrastructure&p=json) directly inside the token, then signs it cryptographically. A JWT always consists of three parts separated by a dot:

```text
header.payload.signature

eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxMiwiZXhwIjoxNzM1Njg5NjAwfQ.4f8a2c...
     |                          |                                  |
  header                     payload                            signature
  (algorithm                 (the encoded                       (computed from
   used)                      information, in JSON)                the first two
                                                                     parts + a secret
                                                                     known to the server)
```

The server receiving a JWT recomputes the signature from the header and payload it got, using its own secret, and compares it to the one supplied: if they match, the content hasn't been altered since it was issued. This check requires **no access to any storage** at all: that's what makes a JWT stateless, unlike a session.

## What a JWT Contains: Never Encrypted, Only Signed

A JWT's data is encoded in [Base64](https://en.wikipedia.org/wiki/Base64), not encrypted: anyone can decode that data and read it, including an attacker intercepting the token. Only the signature prevents it from being **modified** without it showing, it does nothing to stop anyone from **reading** it.

```text
Decoded data from a JWT :  { "user_id": 12, "exp": 1735689600 }
                            -> readable by anyone holding the token,
                               even without knowing the server's secret
```

> **Pitfall:** putting sensitive data (a password, a credit card number, confidential information) inside a JWT's payload, assuming the signature protects it. The signature guarantees integrity (nothing was changed), never confidentiality (anyone can read it).
>
> **Best practice:** only put information in a JWT that's safe to read if the token gets intercepted (a user ID, an expiration date, a role), never a secret.

## The Real Catch of Statelessness: Revoking a JWT Before It Expires

A session revokes instantly: just delete the matching data server-side, and the identifier becomes useless. A JWT, on the other hand, stays valid until its expiration date is reached, precisely because the server keeps no record of what it issued: forcibly logging it out before its natural expiration (a hacked account, an employee leaving the company) requires extra machinery (a blocklist checked on every request), which cancels out part of the statelessness advantage sought in the first place.

| | Session | JWT |
|---|---|---|
| Where the information lives | Server-side | Inside the token itself |
| Revocation before expiration | Immediate (delete server-side) | Difficult without extra machinery |
| Sharing across several servers | Requires a shared storage space | Requires no shared storage at all |
| Content readable if intercepted | No (just an opaque identifier) | Yes (data in the clear, only signed) |

> **Pitfall:** choosing a JWT for its apparent simplicity without having anticipated the case where a token needs to be revoked before its natural expiration (a forced logout, a compromised account).
>
> **Best practice:** keep a JWT's lifetime short (a few minutes to a few hours), and plan for a renewal mechanism rather than a token valid for several days, to limit the window where an early revocation would be needed.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A JWT encodes information in JSON directly inside the token and signs it, which lets it be verified without server-side storage (stateless). Its data is encoded, never encrypted: readable by anyone holding the token, only its modification is prevented by the signature. |
| **Tools you can use** | A JWT library for the language used to generate and verify the signature, rather than a manual implementation. |
| **Pitfalls to avoid** | Putting sensitive data in a JWT assuming it's protected. Choosing a JWT without having anticipated the need for early revocation. |
| **Best practices** | Only put data in a JWT that's safe to read. Keep a short lifetime and plan for renewal rather than a long-lived token. |
