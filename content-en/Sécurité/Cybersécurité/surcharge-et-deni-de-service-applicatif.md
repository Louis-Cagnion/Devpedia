---
order: 16
---

# Overload and Application-Level Denial of Service

[Web API Security](/?c=securite&s=cybersecurite&p=securite-api-web) covers rate limiting: limiting the NUMBER of requests a client can send. This chapter covers a different, complementary family: requests that look legitimate and few in number, but designed to cost far more to process than their size would suggest. Well-tuned rate limiting doesn't protect against a single request that's already disproportionately expensive.

## ReDoS: a regex whose execution time explodes

Some regular expression patterns, especially ones that stack several quantified groups (`(a+)+`, `(a|a)*`), have an execution time that can grow EXPONENTIALLY with the length of the tested input, on an input precisely designed to never find a match.

```text
Vulnerable pattern:  ^(a+)+$
Adversarial input:   "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!"
                      (30-40 "a"s followed by a character that never matches)

-> The regex engine tries EVERY way of splitting the string of "a"s between
   the inner group and the outer group before concluding it fails:
   the number of combinations doubles with each extra "a"

30 "a"s -> a few milliseconds
40 "a"s -> a few seconds
50 "a"s -> several MINUTES, for a single request
```

A single, tiny request is then enough to occupy an entire process for a disproportionate amount of time: no need to send a large volume of traffic to saturate a service.

> **Best practice:** avoid nested quantified groups in a regex applied to external input; enforce a maximum execution time on any regex evaluation against untrusted data; test a regex with a tool dedicated to detecting ReDoS-vulnerable patterns before deploying it.

## Decompression bombs

A tiny compressed file can represent, once decompressed, a disproportionately larger size: an extreme compression ratio, reachable by deliberately repeating the same data millions of times before compression (which compresses repetitive data extremely efficiently).

```text
Typical "zip bomb" file: a few kilobytes compressed
  -> several GIGAbytes once decompressed

If the application decompresses the file ENTIRELY into memory before
examining it (antivirus scan, extracting an import), it exhausts
its available memory on a single file of just a few KB received
```

An XML variant is called the **"billion laughs" attack**: an XML document declares an entity that references several others, which themselves reference several more, across several levels: a document of just a few lines expands into billions of occurrences once every entity is resolved (the same entity mechanism already seen for [XXE](/?c=securite&s=cybersecurite&p=injections-au-dela-du-sql), here repurposed to exhaust resources rather than to read a file).

> **Best practice:** enforce a maximum decompression size BEFORE fully decompressing a file (most (de)compression libraries expose a configurable limit), and disable external/nested XML entity resolution by default (the same defense as for XXE).

## Pagination and unbounded queries

An endpoint that returns an entire collection for lack of a `LIMIT`/pagination enforced SERVER-SIDE lets an entire table be extracted in a single request. A pagination parameter left up to the client's choice (`?limit=`), with no cap, amounts to the same problem in a different shape.

```text
GET /api/customers            -> with no server-side limit, returns ALL customers in one call

GET /api/customers?limit=999999999
                             -> if the client parameter is never capped server-side,
                                ends up with exactly the same result
```

> **Best practice:** enforce a maximum limit server-side on any returned collection, regardless of what the client asks for; explicitly cap any `limit`/`per_page` value supplied by the client to a reasonable maximum, never pass it straight through to the query.

## Local resource exhaustion

Opening a connection, a process, or a thread per request, with no limit or reuse, lets an attacker saturate the server with a number of requests that would otherwise stay reasonable for an application that manages that resource correctly.

| Resource | Risk with no limit | Mitigation |
|---|---|---|
| Network/database connections | Each request opens a new connection without ever reusing or closing it | A fixed-size connection pool, reused across requests |
| Processes/subprocesses launched per request | A server that launches a new heavy process (a driven browser, a file conversion) per user request, with no queue or concurrency limit | A queue with a maximum number of concurrent tasks, the rest waiting rather than all launching at once |
| File upload | No size limit on an uploaded file | A size limit enforced server-side, not just on the form |

## Cost amplification through a third-party API

A feature that triggers a call to a PAID or QUOTA-LIMITED third-party API (an LLM, an SMS-sending service, a geocoding API) for every user request, with no limit or cache, shifts the risk: the exhausted resource isn't even local anymore (CPU, memory), it's directly the account's budget or quota.

```text
Feature: "Summarize this text with AI" -> 1 LLM call per user click,
                                            with no limit or cache

Attacker: a script that triggers this action thousands of times
          -> the bill explodes, or the monthly quota runs out within minutes,
             without any LOCAL resource ever being saturated
```

> **Best practice:** apply rate limiting specific to any feature that triggers a billed third-party call, regardless of the API's general rate limiting; cache an identical result already obtained rather than calling the third-party service again each time.

## Email/notification bombing

A form (contact, sign-up, password reset) that sends an email or SMS to an address/number SUPPLIED BY THE USER, with no frequency limit, can be repurposed to spam a third party whose address is merely known, with no need to ever access their account.

> **Best practice:** limit the number of sends per recipient (not just per sending IP/account) on any feature that sends a communication to an address supplied by a third party.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Beyond plain rate limiting (number of requests), an individual request can cost disproportionately more than its size suggests: ReDoS (compute time), a decompression bomb (memory), unbounded pagination (database), connection/process exhaustion, cost amplification through a billed third-party API, or email bombing toward a third party. |
| **Tools you can use** | A maximum execution time on a regex; a decompression size limit; a server-side cap on any pagination; a fixed-size connection pool/queue; caching for a repeated third-party call. |
| **Pitfalls to avoid** | A regex with nested quantified groups on external input. Fully decompressing a file before checking its size. Trusting a client-supplied `limit` parameter with no server-side cap. Calling a billed third-party API with no limit or cache. Sending an email/SMS to a third-party address with no frequency limit. |
| **Best practices** | Test a regex against ReDoS before deployment. Limit decompression size upfront. Cap any collection returned server-side. Cache and specifically limit any billed third-party call. Limit sends per recipient, not just per sender. |
