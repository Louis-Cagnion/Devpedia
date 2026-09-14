---
order: 1
---

# OAuth 2.0 and OpenID Connect

The "Log in with Google" button (or GitHub, Facebook...) is everywhere on the web. It never asks the app displaying it for your Google password: this chapter explains how.

## The Problem: Granting Access Without Handing Over a Password

A poor solution, historically common, involves giving your Google password directly to a third-party app so it can access certain data (your contacts, for example). Two concrete problems follow:

- the app gets **total** access to the Google account, when it only needs the contacts;
- revoking that access requires changing the Google password itself, which logs out every other legitimate app in the process.

**OAuth 2.0** solves this problem: a protocol that lets a third-party app get limited, revocable access to a resource, without ever knowing the password for the account involved.

## The Actors in an OAuth Exchange

| Role | Who it actually is |
|---|---|
| Resource owner | The user (their Google account, their contacts) |
| Client | The third-party app requesting access |
| Authorization server | The service that authenticates the user and issues access (Google, GitHub...) |
| Resource server | The API that holds the protected data (Google's Contacts API, for instance) |

## The Simplified Flow

```text
1. The user clicks "Log in with Google" on the third-party app
2. The third-party app redirects the user to Google
3. The user logs in AT GOOGLE (never at the third-party app)
4. Google asks the user for consent: "This app wants to access
   your contacts, allow?"
5. If accepted, Google redirects to the third-party app with a temporary code
6. The third-party app exchanges that code for an access token
   (a direct server-to-server exchange, using its own secret)
7. The third-party app uses that token to call Google's API
   on the user's behalf
```

The third-party app never sees the password: only Google receives it, at step 3.

## The Access Token: Limited and Revocable Scope

The **access token** obtained at step 6 carries a specific **scope**: "read contacts," for example, never total access to the account. It can also be revoked at any time, independently of the password:

| | Sharing the password directly | OAuth 2.0 |
|---|---|---|
| Scope of access | Total, no possible limit | Limited to what was explicitly granted |
| Revocation | Changes the password everywhere, including legitimate uses | Revokes only that specific token |
| Does the password reach the third party? | Yes | Never |

## Another flow: *Client Credentials*, with no user

The flow seen above (*Authorization Code*) assumes a user is present, logging in and giving consent. Another, equally common case involves no user at all: a service that needs to call an API **on its own behalf**, for instance a server that fetches statistics every night from a reporting tool's API.

```text
1. Service A authenticates directly with the authorization server
   using its client id + client secret (client_id/client_secret)
2. The authorization server verifies these credentials and returns an access token
   -- with no redirection to anyone, no consent screen
3. Service A uses that token to call the API on its own behalf,
   not on behalf of a user
```

This flow is called **Client Credentials**. Unlike *Authorization Code*, there's no redirection, no consent screen, and no end user involved at any step: only the calling service's `client_id`/`client_secret` proves its identity.

| | *Authorization Code* (seen above) | *Client Credentials* |
|---|---|---|
| Who logs in | An end user | No one: the service authenticates itself |
| Browser redirection | Yes (steps 2-5) | None |
| Token obtained on behalf of | The user | The service itself |
| Typical use case | "Log in with Google" | A server calling a third-party API for its own processing (import, scheduled sync...) |

> **Pitfall:** using *Client Credentials* when the action should actually be attributed to a specific user (e.g. "which user requested this export?"). This flow carries no user identity at all: any action taken with this token is indistinguishable from an action by the service itself.
>
> **Best practice:** reserve *Client Credentials* for server-to-server calls that explicitly need no notion of a user; as soon as an action must be traced back to a specific person, use a flow with a user instead (*Authorization Code*).

## OAuth Doesn't Prove Identity: OpenID Connect's Role

OAuth 2.0 was designed for **authorization** (accessing a resource), not **authentication** (see [Authentication vs Authorization](/?c=authentification&s=fondamentaux&p=authentification-vs-autorisation)). Getting an access token for someone's contacts doesn't formally prove who logged in: an app that used that token alone to "recognize" a user is misusing OAuth beyond its intended purpose.

**OpenID Connect** (OIDC) adds an identity layer on top of OAuth 2.0, specifically designed for authentication: alongside the access token, the authorization server issues an **ID token**, which is a standardized [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens) containing the user's verified identity (their ID, their email...). It's this ID token, not the access token, that a "Log in with Google" button actually relies on.

> **Pitfall:** using a raw OAuth access token to authenticate a user, assuming that getting it proves their identity. An access token only proves that access was granted, not who logged in: that's OpenID Connect's ID token's job.
>
> **Best practice:** use OpenID Connect (and its ID token) whenever the need is knowing *who* is logging in, and reserve plain OAuth 2.0 for cases where the need is only to access a resource on the user's behalf.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | OAuth 2.0 lets a third-party app get limited, revocable access to a resource, without ever knowing the account's password. *Client Credentials* gets a token with no user at all, for a service acting on its own behalf. OpenID Connect adds an ID token on top (a JWT) specifically designed for authentication, something OAuth alone doesn't provide. |
| **Tools you can use** | An OAuth/OIDC library for the language used rather than a manual implementation of the protocol. |
| **Pitfalls to avoid** | Sharing a password directly with a third-party app. Using an OAuth access token to authenticate a user. Using *Client Credentials* for an action that must be attributed to a specific user. |
| **Best practices** | Always limit the requested scope to the strict minimum needed. Use OpenID Connect when the need is to prove an identity, not just access a resource. Reserve *Client Credentials* for server-to-server calls with no notion of a user. |
