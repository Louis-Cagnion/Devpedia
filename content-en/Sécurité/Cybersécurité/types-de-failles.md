---
order: 1
---

# The Main Families of Vulnerabilities

A **vulnerability** (or *flaw*) is a defect in a system (code, configuration, infrastructure) that lets someone make it behave differently than intended. An **attack** is the attempt to exploit that vulnerability; an **exploit** is the actual code or method used to do it.

```text
Vulnerability (the defect) --exploited by--> Exploit (the method) --produces--> Successful attack
```

## Who attacks, and why

Not every attack comes from the same kind of actor, or with the same goal:

| Actor | Motivation | Resource level |
|---|---|---|
| Script kiddie | Curiosity, reputation, no specific target | Low: uses ready-made tools without deep understanding |
| Cybercriminal | Financial gain (ransom, reselling data) | Variable, often organized |
| Hacktivist | Political or ideological message | Variable |
| Malicious insider | Revenge, personal gain | Legitimate access already in place, often the most dangerous |
| State actor / APT (*Advanced Persistent Threat*) | Long-term espionage, sabotage | Very high: discretion and patience are the goal |

## The zero-day: a flaw unknown to the vendor

A vulnerability generally follows this life cycle:

```text
Flaw introduced --> Discovered --> Reported to vendor --> Fixed (patch) --> Rolled out to users
                        |
                        v
        If exploited BEFORE being reported/fixed: it's a "zero-day"
        (the vendor had "zero days" to protect against it)
```

A **zero-day** is therefore a flaw exploited before the software's vendor even knows about it, and so before a fix (*patch*) exists. It's the most dangerous situation for users: no update can protect them yet. Once the flaw is known and fixed, any system that doesn't apply the patch stays exposed, this time with no excuse: the information is public, often under a **CVE** identifier (*Common Vulnerabilities and Exposures*), a public catalog of known flaws, browsable on the [official CVE database](https://www.cve.org).

## The main categories of application flaws

| Category | What it covers | Concrete example |
|---|---|---|
| **Injection** | An untrusted piece of data is interpreted as an instruction instead of a plain value | [SQL](/?c=domain-specific-languages-dsl&p=sql) injection, already detailed with its fix in [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite) |
| **Broken authentication** | A poorly designed login mechanism lets someone impersonate an identity | Password stored in plain text (see [Passwords and Secure Hashing](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)) |
| **Broken access control** | A user can reach a resource or action that should be off-limits to them | Editing the id in a URL (`/order/42` → `/order/43`) to view another customer's order, with no server-side re-check of permissions |
| **Security misconfiguration** | A default, overly permissive, or forgotten setting opens an unintended access path | An admin panel reachable without authentication, a detailed error message exposed in production |
| **Cryptographic failure** | A secret or sensitive piece of data is poorly protected by the encryption/hashing in use, or lacks it entirely | See [Applied Cryptography](/?c=cybersecurite&p=cryptographie-appliquee) |
| **Vulnerable components** | A third-party library or tool in use carries a known flaw of its own | See [Dependency Security](/?c=cybersecurite&p=securite-des-dependances) |
| **Insufficient logging and monitoring** | An ongoing or past attack goes unnoticed for lack of usable traces | No alert after hundreds of failed login attempts on the same account |

This breakdown largely overlaps with the [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10), the industry-standard reference detailed at the end of this category.

## How to avoid leaving these in your own code

These categories share a common root: a piece of data or a situation wrongly treated as trustworthy. Three habits cut down most of this risk, covered in depth in [Secure Development Principles](/?c=cybersecurite&p=principes-de-developpement-securise):

```text
// Pseudocode -- the same trap exists in any language
query = "SELECT * FROM users WHERE name = '" + userSuppliedName + "'"
// If userSuppliedName is:  x'; DROP TABLE users; --
// the query that actually runs is no longer the one the developer intended

preparedQuery = "SELECT * FROM users WHERE name = ?"
execute(preparedQuery, [userSuppliedName])
// The data stays data, never interpreted as an instruction
```

- Never trust data coming from outside (user input, third-party API, imported file) without validating it.
- Apply the **principle of least privilege**: a component should only have access to what it strictly needs.
- Keep dependencies up to date, so as not to inherit a flaw already fixed elsewhere.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A vulnerability is an exploitable defect; a zero-day is a flaw exploited before the vendor knows about it. Application flaws cluster into a few recurring families (injection, authentication, access control, configuration, cryptography, dependencies, logging). |
| **Tools you can use** | The [CVE database](https://www.cve.org) to track known public flaws. |
| **Pitfalls to avoid** | Treating external data as trustworthy by default; leaving a dependency or default configuration unreviewed. |
| **Best practices** | Systematically validate any external data; apply the principle of least privilege; keep dependencies up to date. |
