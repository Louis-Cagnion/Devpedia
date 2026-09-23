---
order: 12
---

# Calling the Model: API, SDK, Typed Errors, and Retries

The previous chapters describe what's sent (the [state and questions](/?c=ia&s=modeles-de-decision-structuree&p=etat-et-questions-paralleles)) and what's received (the [typed answers](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul)). This final chapter covers the transport: how these exchanges actually travel over the network, building on the notions already covered in [API and HTTP](/?c=infrastructure&p=api-et-http) (method, status code, authentication).

## A single entry point

The whole API fits on a single [HTTP](/?c=infrastructure&p=api-et-http) endpoint:

```text
POST https://api.typesafe.ai/v1/systemone
Authorization: Bearer <api_key>

{ "state": ..., "model": "jev-latest", "questions": { ... } }
```

The response returns the model used, a map of answers (one per question asked), and a token usage count.

## Client SDKs to avoid writing these requests by hand

Two official libraries (Python, JavaScript/TypeScript) wrap this HTTP call, handle retries automatically, and expose the [Choice/Score/Noul](/?c=ia&s=modeles-de-decision-structuree&p=primitives-choice-score-noul) primitives as classes rather than raw JSON objects to build by hand:

```python
from typesafe_sdk import TypeSafeClient, Choice

with TypeSafeClient() as client:                    # reads TYPESAFE_API_KEY from the environment
    result = client.system_one(
        state="I've been charged twice, please help.",
        questions={"billing": Choice(instructions="...", criteria={...})},
    )
    print(result.answers["billing"].choice)
```

Without an official SDK for a given language, the HTTP API remains directly usable: the SDKs are only a convenience, never a required path.

## Typed exceptions, one per status code

Rather than a single generic error type to inspect, the SDK defines a distinct exception per [HTTP status code](/?c=infrastructure&p=api-et-http), all inheriting from a common exception: a reusable pattern for any API client library, not specific to this vendor.

| Exception | HTTP code | Cause |
|---|---|---|
| `AuthenticationError` | 401 | Invalid or missing API key |
| `PermissionDeniedError` | 403 | Access denied to the requested resource |
| `NotFoundError` | 404 | Resource doesn't exist |
| `BadRequestError` | 400 | Malformed request |
| `UnprocessableEntityError` | 422 | The request is well-formed but rejected after server-side validation |
| `RateLimitError` | 429 | Too many requests; carries a recommended wait time (`retry_after_ms`) |
| `InternalServerError` | 5xx | Server-side error |
| `APIConnectionError` | (none) | The request never reached the server (network down, DNS...) |
| `APITimeoutError` | (none) | The configured maximum delay was exceeded before any response |

Catching the common exception (`TypeSafeError`) is enough to cover every case; catching a specific exception allows a differentiated reaction (re-authenticate on 401, slow down on 429).

## Retrying automatically, but not just any way

The SDK automatically retries certain errors, never all of them: a 400 error (malformed request) never becomes valid by repeating it as-is, whereas a 429 error (too many requests) or 503 (server temporarily unavailable) might succeed on the next attempt. The official documentation doesn't publish precise default values for this policy; the example below illustrates the configurable parameters, not imposed values:

```python
# max_retries      : number of extra attempts after the initial call
# backoff_initial  : delay before the first retry
# backoff_max      : cap on the delay, even after several failures
# jitter           : random variation added to the delay, to avoid
#                     several clients all retrying at the same instant
retry = RetryPolicy(
    max_retries=3,
    backoff_initial=0.5,
    backoff_max=5.0,
    jitter=0.25,
    http_statuses={429, 500, 502, 503, 504},
)
```

When the server provides a `Retry-After` header, the client uses it in priority over its own delay calculation: the server knows the real duration of its own overload better than the client does.

> **Pitfall:** retrying a 400 or 401 error in a loop, hoping it eventually goes through. These errors signal a problem with the request itself (malformed, misauthenticated), never resolved by repetition alone.
>
> **Best practice:** only retry errors that are genuinely transient (network, temporary overload, rate limit), with a growing delay and a bit of randomness (jitter), respecting the server's `Retry-After` header when provided.

## Naming the model: stable alias or pinned version

The Jev model illustrates a pricing scheme specific to this family of models: billed only on **input** tokens (the text of the state and questions), around $0.042/million tokens according to the vendor's announcement, never on output, consistent with the fact that the output is always a short typed structure, never text generated at variable length.

| | Value |
|---|---|
| Default alias | `jev-latest` (always points to the latest version) |
| Pinned version (example) | `jev-1.13.0` (never changes behavior) |
| Accepted inputs | Text only (string, JSON object, or array) |

> **Pitfall:** pinning `jev-latest` in production without monitoring. An alias that points to "the latest version" can change behavior without warning whenever the vendor ships an update.
>
> **Best practice:** pin a precise version (`jev-1.13.0`) for a production system whose behavior must stay stable, and only use `jev-latest` in a test environment where a behavior change is acceptable at any time.

## What to remember

| | |
|---|---|
| **To remember** | A single HTTP endpoint authenticated by bearer key, optional Python/JS SDKs that wrap it, one typed exception per status code (a reusable pattern for any API client), automatic retries limited to transient errors with growing delay and respect for `Retry-After`. |
| **Usable tools** | The REST API directly, or the official Python/JavaScript SDKs; a configurable retry policy. |
| **Pitfalls to avoid** | Retrying a malformed request (400) or authentication (401) error in a loop. |
| **Best practices** | Only retry transient errors (network, 429, 5xx), with a growing delay, jitter, and priority given to the server's `Retry-After` header. |
