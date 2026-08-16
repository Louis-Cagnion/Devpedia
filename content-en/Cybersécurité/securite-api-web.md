---
order: 7
---

# Web API Security

A [web API](/?c=infrastructure&p=api-et-http) exposes data and actions to client programs, potentially running in contexts the server doesn't control (a browser, a mobile app, another server). This chapter covers the concerns specific to that context; token-based authentication (JWT, sessions) is already covered in the [Authentification](/?c=authentification) category, and the generic CSRF/brute-force mechanisms in [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite).

## CORS: allowing (or not) a site to call an API from another domain

By default, a browser enforces the **same-origin policy**: a page loaded from `site-a.example` can't read the response of a request to `api.site-b.example`, even though the request itself technically goes out. This restriction protects the user: without it, any visited site could read data from another site the user is logged into, without their knowledge.

**CORS** (*Cross-Origin Resource Sharing*) is the mechanism that lets a server explicitly authorize certain origins to read its responses, despite this default restriction:

```text
Browser (page loaded from site-a.example)
        |
        | request to api.site-b.example
        v
   Server api.site-b.example
        |
        | response + header:
        | Access-Control-Allow-Origin: https://site-a.example
        v
Browser: origin authorized -> the page can read the response
```

```http
Access-Control-Allow-Origin: https://site-a.example
```

| Configuration | Effect | Risk |
|---|---|---|
| `Access-Control-Allow-Origin: https://site-a.example` | Only that exact origin can read the response | None, as long as the list stays restricted to genuinely legitimate origins |
| `Access-Control-Allow-Origin: *` | Any origin can read the response | Acceptable for a public API with no sensitive data or account-linked action; dangerous otherwise |

> **Pitfall:** answering `Access-Control-Allow-Origin: *` as a reflex to "make the CORS error go away" during development, then forgetting to restrict it before shipping an API that handles account data to production.
>
> **Best practice:** only authorize the specific origins that genuinely need to access the API, never `*` once sensitive or authenticated-user data is involved.

## Authenticating an API: key or token, depending on the client

| Mechanism | Fits | Detail |
|---|---|---|
| API key | A third-party service, a script, a server-to-server access | See [Secrets Management](/?c=cybersecurite&p=gestion-des-secrets) for storing it properly |
| Token (JWT, session) | An authenticated human user | See [JWT and Tokens](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) and [Sessions and Cookies](/?c=authentification&s=sessions-et-tokens&p=sessions-et-cookies) |
| OAuth 2.0 delegation | Access granted by the user to a third-party app, without sharing their password | See [OAuth 2.0 and OpenID Connect](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) |

## Rate limiting

Without a limit, an API stays exposed to two related but distinct kinds of abuse: [brute force](/?c=langages-de-programmation&s=php&p=securite) (guessing a password or token by trying huge numbers of values) and simple overload from an overly eager client, intentional or not (a client-side bug that calls the API in a loop).

```text
Client                          API with rate limiting

request 1  --------------->     accepted (1/100 this month)
request 2  --------------->     accepted (2/100)
...
request 101 -------------->     429 Too Many Requests
                                 (quota exceeded, try again later)
```

The `429 Too Many Requests` status code (see the status codes in [The Data Exchange: API and HTTP](/?c=infrastructure&p=api-et-http)) signals precisely this refusal, distinct from a regular request error.

| Strategy | Principle |
|---|---|
| By IP | Limits the number of requests from a single IP address |
| By account/API key | Limits the number of requests for a given user or key, regardless of the originating IP |
| Sliding window | Recomputes the quota continuously rather than at fixed intervals, so a client can't "empty" its quota right before each reset |

## Never expose more than necessary

An API response that returns an entire internal record (including fields the client never uses: hashed password, internal notes, technical identifiers) needlessly widens what an attacker can retrieve should unintended access to that response ever occur. This mirrors the principle of least privilege already seen in [Secure Development Principles](/?c=cybersecurite&p=principes-de-developpement-securise), applied here to exposed data rather than system access.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | CORS explicitly authorizes certain origins to read an API's response despite the browser's same-origin policy. Rate limiting protects against brute force and overload. An API should only expose the fields the client genuinely needs. |
| **Tools you can use** | The `Access-Control-Allow-Origin` header, the `429 Too Many Requests` status code, an API key/JWT/OAuth 2.0 depending on the client type. |
| **Pitfalls to avoid** | `Access-Control-Allow-Origin: *` on an API handling sensitive data; no rate limit at all; returning an entire internal record in a response. |
| **Best practices** | Restrict CORS to genuinely legitimate origins; rate-limit by account/key in addition to IP; only return the fields the client actually needs. |
