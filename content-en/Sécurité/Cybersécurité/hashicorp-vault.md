---
order: 9
---

# HashiCorp Vault: beyond the .env file

[Secrets management](/?c=cybersecurite&p=gestion-des-secrets) introduces the secrets vault as the most robust option, with **HashiCorp Vault** as an example. This chapter goes into how that tool actually works: what a secrets vault can do that a plain `.env` file can't.

## Static vs. dynamic secrets

A **static** secret (a fixed password, like in a `.env` file) stays valid indefinitely until someone changes it by hand. Vault can also generate **dynamic** secrets: credentials created on demand, valid only for a limited time, then automatically revoked.

```text
Application requests a database credential from Vault
        |
        v
Vault creates a temporary account (unique login/password)
        |
        v
Application uses that account for 1h (the "lease" duration)
        |
        v
After 1h: Vault automatically revokes that account
```

| | Static secret | Dynamic secret |
|---|---|---|
| Origin | Created once by a human, stored as-is | Generated on demand by Vault, each new time it's used |
| Lifetime | Indefinite, until manual rotation | Limited (a *lease*), automatically revoked on expiry |
| Exploitation window if stolen | Unlimited until someone changes it | Bounded to the remaining lease time |

> **Pitfall:** treating a dynamic secret like a regular one that can be cached indefinitely on the application side. A dynamic secret really does expire: an application that never renews its lease loses access without warning once the time runs out.
>
> **Best practice:** renew the lease before it expires for continuous use (most Vault client libraries do this automatically), rather than treating a dynamic secret as a one-time acquisition.

## Authenticating to Vault: auth methods

Before it can read a secret, a client (an application, a human) must first prove its identity to Vault through an **auth method**:

| Auth method | Principle | Typical use case |
|---|---|---|
| Token | An opaque string, generated ahead of time and handed to the client | Manual testing, a one-off script |
| AppRole | An ID + secret pair specific to an application, designed for automated authentication with no human involved | A service that starts up on its own (server, container) |
| Cloud identity (AWS IAM, Azure AD...) | Vault trusts the identity already proven by the cloud provider the client runs on | An application hosted on that same cloud |

Once authenticated, the client receives a temporary **Vault token**, which it attaches to each subsequent request.

## Controlling access: policies

A Vault **policy** defines, in text, which secret paths a token can read, write, or list: the same principle as [access control (IDOR)](/?c=cybersecurite&p=owasp-top-10) covered elsewhere, applied here to the secrets themselves rather than to an application's data:

```text
# Simplified policy: read-only access to the "billing" application's secrets
path "secret/data/billing/*" {
  capabilities = ["read"]
}
```

> **Pitfall:** granting an overly broad policy "so development isn't blocked" (e.g., access to `secret/*` instead of only the needed path). A compromised token then exposes every secret in the organization, not just the ones belonging to the application in question.
>
> **Best practice:** apply the least-privilege principle (already covered in [Secure Development Principles](/?c=cybersecurite&p=principes-de-developpement-securise)) to every policy: only authorize the paths and capabilities that this specific client actually needs.

## Sealing and unsealing: Vault protects its own data

All data stored by Vault is encrypted at rest with an encryption key, itself protected by a key-splitting mechanism (*Shamir's Secret Sharing*): the key never exists whole in one person's hands, it's split across several shares.

| State | Description |
|---|---|
| **Sealed** | Vault refuses every operation: the encryption key isn't assembled, the data stays unreadable even with direct disk access |
| **Unsealed** | Enough share holders have provided theirs: the key is reconstructed in memory, Vault can serve requests |

Restarting Vault brings it back to the sealed state: someone must again provide enough key shares to unseal it, a deliberate safeguard against a server restarting unexpectedly (e.g. after a compromise) without anyone noticing.

## Vault Agent: automating authentication and secret retrieval

Rather than every application reimplementing its own authentication and lease-renewal logic, **Vault Agent** runs as a process alongside the application and handles it on its behalf: it authenticates, retrieves the requested secrets, writes them to a local file (or injects them directly), and automatically renews leases as they approach expiry.

---

## 📋 Summary

| | |
|---|---|
| **To remember** | Vault goes beyond a `.env` file: dynamic secrets with a limited lifetime, authentication through an auth method, fine-grained access control through policies, data encrypted and protected by sealing/unsealing, Vault Agent to automate authentication and lease renewal. |
| **Usable tools** | AppRole for a service's automated authentication, Vault Agent to delegate lease management to a dedicated process. |
| **Pitfalls to avoid** | Caching a dynamic secret without ever renewing its lease. Granting an overly broad policy for simplicity. |
| **Best practices** | Renew leases before they expire. Apply least privilege to every policy, one secret path at a time. |
