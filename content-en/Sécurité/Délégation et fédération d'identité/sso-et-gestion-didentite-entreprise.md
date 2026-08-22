---
order: 2
---

# SSO and Enterprise Identity Management

In a company, an employee often uses dozens of different tools: email, team chat, code repositories, ticketing, internal apps... Without a centralized solution, each tool would require its own account and its own password: exhausting for the employee (who ends up reusing the same passwords everywhere, see [Passwords and Secure Hashing](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)), and risky for the company, which has to remember to revoke access on *every one* of these tools when someone leaves.

## Single Sign-On (SSO): One Account for Every Tool

**SSO** (*Single Sign-On*) lets an employee log in **once** to a central service, then access every company tool connected to that service without re-entering credentials. It's the principle of [delegation and identity federation](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) from the previous chapter, applied at the scale of an entire company rather than to a single "Log in with..." button.

## The Identity Provider (IdP): The Central Point

The central service that authenticates employees and then vouches for their identity to the other tools is called an **identity provider** (IdP). [Okta](https://www.okta.com) is one of the most widespread providers: a company configures its employees and authorized tools there once, and Okta then handles the actual authentication for each of those tools.

Two standardized protocols let a tool trust the identity vouched for by an IdP like Okta: [OpenID Connect](/?c=authentification&s=delegation-et-federation-didentite&p=oauth2-et-openid-connect) (covered in the previous chapter), and [**SAML**](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language) (*Security Assertion Markup Language*), older but still very widespread in large companies. Both address the same need (vouching for an identity to a third party), with a different exchange format (JSON for OpenID Connect, XML for SAML).

## How an Employee Actually Logs In

```text
1. The employee opens "internal-app.company.com"
2. The app redirects to Okta's login page
3. The employee authenticates with Okta
   (or skips straight to step 5 if they already have an active
    Okta session, opened earlier that day on another tool)
4. Okta verifies the credentials (and can require multi-factor
   authentication, centralized for every connected tool)
5. Okta redirects back to the app with proof of identity
   (an OpenID Connect identity token, or a SAML assertion)
6. The app trusts that proof and grants access
```

## The Real Benefit: Centralized Revocation

Beyond the convenience (a single password to remember), SSO solves a real security problem: when an employee leaves the company, disabling their account **once** in the IdP instantly cuts off their access to *every* connected tool, instead of relying on an IT team that has to remember to do it tool by tool, with the risk of missing one.

> **Pitfall:** treating SSO as purely a user convenience, without accounting for the fact that it concentrates access to every company tool behind a single account: a compromised IdP account becomes a far more valuable target for an attacker than a single isolated password, since it opens everything at once.
>
> **Best practice:** protect the IdP account itself with strengthened security (see [Multi-Factor Authentication](/?c=authentification&s=renforcer-lauthentification&p=authentification-multifacteur)), since compromising it has an outsized impact compared to an isolated account.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | SSO lets a user authenticate once with a central identity provider (IdP), like Okta, then access every connected tool without re-entering credentials. OpenID Connect and SAML are the two standardized protocols that enable this delegated trust. |
| **Tools you can use** | An IdP like Okta to centralize authentication for every tool in a company. |
| **Pitfalls to avoid** | Seeing SSO purely as a convenience, without accounting for the fact that it concentrates access to everything behind a single account. |
| **Best practices** | Revoke a departing employee's access in a single action, at the IdP level. Protect the IdP account with strengthened security, since it grants access to everything else. |
