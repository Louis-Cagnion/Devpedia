---
order: 3
---

# Propagating Identity Between Services (On-Behalf-Of)

An application is almost never a single isolated service: a frontend calls service A, which needs to call service B to complete the request. When the user has authenticated via [OAuth 2.0](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) with service A, a question comes up immediately: with **which identity** should service A call service B?

## The Wrong Answer: a Generic Service Account

The simplest solution, but also the least safe, is to give service A its own **service account**, with broad rights, to call service B:

```text
User -> Service A -> Service B
(identity        (service account,   (receives a request from
 lost along       broad rights)       "Service A's service account",
 the way)                             not from the user)
```

> **Pitfall:** service B never sees the end user's identity, only service A's. There is no way, on service B's side, to know which user actually triggered the action; and the service account, to cover every possible user, has to carry broader rights than an individual user would, a risk if service A is ever compromised.
>
> **Best practice:** propagate the user's real identity from one service to the next, rather than replacing it with a generic technical account.

## The Right Answer: the On-Behalf-Of Flow

The **On-Behalf-Of** (OBO) flow addresses this problem: service A exchanges the token it received from the user for a new token, still on behalf of that user, but **scoped** to call service B:

```text
1. The user authenticates and obtains a token for Service A
2. Service A needs to call Service B to answer the request
3. Service A exchanges its user token for a new token
   (with the authorization server), still on behalf of the same user,
   but with the scope of Service B
4. Service A calls Service B with this new token
5. Service B sees the user's real identity, and applies
   THEIR permissions, not those of a service account
```

Service B can then apply [access control (RBAC/ABAC)](/?c=authentification&s=fondamentaux&p=rbac-et-abac) based on the end user's real rights, exactly as if it had received the request directly from them, rather than on the (often broader) rights of a technical account.

## Comparison

| | Generic service account | On-Behalf-Of |
|---|---|---|
| Identity seen by the final service | The calling service | The end user |
| Rights applied | The broad rights of the service account | The user's real rights |
| Traceability | No way to know which user triggered the call | The exact user stays identifiable at every hop |
| Risk if an intermediate service is compromised | High: the service account can act for any user | Limited to what the current user can do themselves |

> **Pitfall:** propagating the user's **original** token as is to service B, instead of exchanging it for a new token scoped for that service. A token meant for service A (with service A's scope) accepted as is by service B breaks the isolation between services: a token stolen from service B would also grant access to service A.
>
> **Best practice:** always exchange a new token, scoped specifically for the service being called, rather than passing the same token from one service to another.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The On-Behalf-Of flow lets a backend service call another service on behalf of the end user, by exchanging its token for a new scoped token, rather than using a generic service account with broad rights. |
| **Tools you can use** | The token exchange mechanism provided by most OAuth 2.0 / OpenID Connect authorization servers. |
| **Pitfalls to avoid** | Using a generic service account for inter-service calls. Passing the user's original token as is between several services. |
| **Best practices** | Propagate the user's real identity at every hop. Exchange a new scoped token for each service called. |
