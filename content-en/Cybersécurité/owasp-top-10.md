---
order: 11
---

# The OWASP Top 10: the industry-standard reference

**[OWASP](https://owasp.org)** (*Open Worldwide Application Security Project*) is a non-profit organization dedicated to web application security, best known for its **Top 10**: a ranking, updated every few years, of the ten most critical flaw categories observed in real-world applications. This chapter walks through that ranking (2021 edition, the most recent as of this writing) as a synthesis of the whole [Cybersecurity](/?c=cybersecurite) category, each row pointing to the chapter that already covers it in depth.

## The ranking

| # | Category | What it covers | Covered in depth in |
|---|---|---|---|
| A01 | Broken access control | A user reaches a resource or action that should be off-limits to them | [The Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles) |
| A02 | Cryptographic failures | A secret or sensitive piece of data poorly protected by encryption/hashing, or lacking it entirely | [Applied Cryptography](/?c=cybersecurite&p=cryptographie-appliquee) |
| A03 | Injection | Untrusted data interpreted as an instruction | [The Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles), [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite) |
| A04 | Insecure design | Security bolted on after the fact rather than factored into a feature's design | [Secure Development Principles](/?c=cybersecurite&p=principes-de-developpement-securise) |
| A05 | Security misconfiguration | A default, overly permissive, or forgotten setting opens an unintended access path | [The Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles) |
| A06 | Vulnerable and outdated components | A third-party library or tool in use carries a known flaw | [Dependency Security](/?c=cybersecurite&p=securite-des-dependances) |
| A07 | Identification and authentication failures | A poorly designed login mechanism lets someone impersonate an identity | [Authentification](/?c=authentification) category |
| A08 | Software and data integrity failures | Data or a component altered with nothing to detect it (missing or unverified signature, compromised dependency) | [Applied Cryptography](/?c=cybersecurite&p=cryptographie-appliquee) (signatures), [Dependency Security](/?c=cybersecurite&p=securite-des-dependances) |
| A09 | Security logging and monitoring failures | An ongoing or past attack goes unnoticed for lack of usable traces | [The Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles), [Security Testing and Auditing](/?c=cybersecurite&p=tests-et-audit-de-securite) |
| A10 | SSRF (*Server-Side Request Forgery*) | A server forced to make a request, on an attacker's behalf, to a destination it shouldn't reach | [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite) |

## Why a ranking rather than a plain list

The order isn't arbitrary: it reflects the frequency and severity observed across a large number of real, audited applications, not a theoretical judgment. A category that keeps climbing from one edition to the next (broken access control, for instance, at the top since 2021) signals a problem that stays hard to eliminate in practice, despite already well-documented protections.

```text
OWASP Top 10                    Chapters in this category
(the standardized "what")       (the concrete "how")

     A01-A10        <-------->   types-de-failles, principes-de-
                                  developpement-securise, gestion-
                                  des-secrets, cryptographie-
                                  appliquee, securite-des-
                                  dependances, securite-api-web,
                                  tests-et-audit-de-securite,
                                  ingenierie-sociale-et-phishing
```

The Top 10 gives the vocabulary and priorities commonly agreed on across the industry; the other chapters in this category give the concrete means to act on each of these priorities.

## Using the Top 10 in practice

- As a **code review checklist**: check that none of the ten categories has been ignored before shipping to production.
- As **shared vocabulary** between developers, security testers, and external auditors, to name the same kind of flaw without ambiguity.
- As a **prioritization guide**: with limited resources, address the categories highest in the ranking first, statistically the most common.

> **Pitfall:** treating the Top 10 as an exhaustive list of everything worth checking. It's a ranking of the ten **most common** categories, not the totality of possible flaws: a security review that stops strictly at these ten points deliberately leaves everything else uncovered.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | The OWASP Top 10 ranks the ten most frequent and severe flaw categories observed in real-world applications, updated periodically. It serves as the cross-cutting reference tying together every chapter in the Cybersecurity category. |
| **Tools you can use** | The Top 10 as a review checklist before shipping to production, and as shared vocabulary across teams. |
| **Pitfalls to avoid** | Treating the Top 10 as an exhaustive list rather than a ranking of the most common categories. |
| **Best practices** | Use the ranking to prioritize security effort under limited resources, without ever limiting the security review to it alone. |
