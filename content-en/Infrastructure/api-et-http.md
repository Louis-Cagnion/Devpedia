---
order: 1
---

# Exchanging Data: API and HTTP

Two programs running on different machines (a phone and a remote server, for example) share neither memory nor files — to exchange information, they have to send messages over a network, following shared rules that both understand. **HTTP** (*HyperText Transfer Protocol*) is the most widely used set of rules for these exchanges.

> **Analogy:** ordering at a restaurant. The customer (the dining room) sends a precise order to the kitchen; the kitchen responds with a dish, or with a message if the order can't be fulfilled ("out of stock"). Neither party needs to know how the other works internally, only how to phrase the order and read the response.

## Client and server: who asks, who answers

```text
Client (browser, application, script...)          Server (remote machine)

        ------------- request ------------->
        <------------ response --------------
```

The **client** is the one who initiates the exchange (a request); the **server** is the one who receives it and responds. The same program can be a client in one exchange and a server in another.

## A request: a method, an address, sometimes data

Every HTTP request specifies a **method** (what you want to do) and an address (the resource involved):

| Method | Role | Example |
|---|---|---|
| `GET` | Retrieve information, without modifying it | Loading a web page, reading a shop's product list |
| `POST` | Send new data, generally to create it | Submitting a form, creating a user account |
| `PUT` | Replace existing data | Updating a profile's information |
| `DELETE` | Delete data | Deleting a message |

> **Pitfall:** using `GET` for an action that modifies data (for example, deleting an item via a simple clickable link). A `GET` is supposed to be repeatable with no consequence (reloading a page shouldn't change anything) — many tools (site crawlers, link previews) trigger `GET`s automatically, with no intent from the user.
>
> **Best practice:** reserve `GET` for reading only, and use `POST`/`PUT`/`DELETE` for any action that actually modifies data.

## The response: a status code, sometimes data

The server always responds with a **status code** — a number indicating whether the request succeeded, and if not, why:

| Code | Category | Example |
|---|---|---|
| `200` | Success | The request was processed correctly |
| `301` / `302` | Redirect | The requested resource is at another address |
| `404` | Client-side error | The requested resource doesn't exist |
| `500` | Server-side error | The server ran into an internal problem while processing the request |

> **Pitfall:** ignoring the status code and assuming a request succeeded simply because a response arrived. A server in error (`500`) still returns a response — often with content that can look deceptively like a normal response if the code isn't checked.
>
> **Best practice:** always check a response's status code before using its content, and explicitly plan for error cases rather than only coding the success path.

## An API: a server designed for a program, not a human

An **API** (*Application Programming Interface*) in this context refers to a server that responds with structured data meant to be read by a program, rather than a web page meant to be displayed in a browser (see the most common format for this data, [JSON](/?c=infrastructure&p=json)):

```text
Request:  GET https://api.example.com/weather?city=Lyon

Response (status 200):
{
  "city": "Lyon",
  "temperature": 18,
  "conditions": "cloudy"
}
```

A program can then read `temperature` or `conditions` directly, without having to extract that information from a web page designed for display.

> **Pitfall:** confusing "the server isn't responding" (timeout, network down) with "the server is responding with an error" (`4xx`/`5xx` code) — the two need different handling, but look like a similar failure from the caller's point of view if the two cases aren't distinguished explicitly in the code.
>
> **Best practice:** explicitly distinguish, in the code that calls an API, the absence of a response (timeout) from an explicit refusal of the request (error code) — the two call for different reactions (retry, or fix the request).

## Key takeaways

| | |
|---|---|
| **Key takeaways** | HTTP is the most common protocol for exchanging data between a client and a server. A request specifies a method (`GET`/`POST`/`PUT`/`DELETE`); a response always carries a status code. An API is a server designed to be used by a program rather than a human. |
| **Tools you can use** | A browser (for a simple `GET`), or a dedicated tool (`curl`, Postman, an HTTP library in the language of your choice) to build a complete request. |
| **Pitfalls to avoid** | Using `GET` for an action that modifies data. Ignoring a response's status code. Confusing an absent response with an explicit error response. |
| **Best practices** | Reserve `GET` for read-only use. Systematically check the status code before using a response's content. Explicitly handle error cases, not just the success case. |
