---
order: 8
---

# The WAF: Filtering Traffic Before It Reaches the Application

A **WAF** (*Web Application Firewall*) inspects every HTTP request before it reaches the application, and blocks those matching a known attack pattern (a [SQL injection](/?c=cybersecurite&p=types-de-failles) attempt, an XSS script slipped into a parameter). Unlike a classic network firewall, it doesn't inspect raw network content, but specifically the structure of an [HTTP](/?c=infrastructure&p=api-et-http) request: method, headers, body, parameters.

## An Additional Layer, Not a Replacement for Secure Code

```text
Client -> [ WAF ] -> Application

Normal request:          allowed through
Request with injection:  blocked before it even reaches the application
```

A WAF sits between the client and the application, most often as a dedicated reverse proxy or a module built into the web server. It filters **before** the request reaches the application code, which makes it useful even against a vulnerability not yet fixed in that code.

> **Pitfall:** treating a WAF as a substitute for secure application code (see [Secure Development Principles](/?c=cybersecurite&p=principes-de-developpement-securise)). A WAF filters by **pattern**: an attack variant different enough from its known rules (unusual encoding, a recent technique) can slip through without triggering it, whereas correct input validation on the application side would block the flaw itself, regardless of the attack's form.
>
> **Best practice:** treat the WAF as an additional defense layer (*defense in depth*) that reduces the attack surface exploitable in practice, never as the sole protection against the flaws listed in the [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10).

## ModSecurity and Rule Sets

**ModSecurity** is the most widely used open source WAF, deployable as a web server module (Apache, Nginx) or as a standalone reverse proxy. It ships with no rules by default: its rules most often come from the OWASP **Core Rule Set** (CRS), a set of patterns already written and maintained for the most common vulnerability families.

```text
# Simplified rule, in the spirit of the CRS: block a classic SQL injection pattern
SecRule ARGS "@detectSQLi" \
    "id:942100,deny,status:403,msg:'SQL injection attempt detected'"
```

| Rule element | Role |
|---|---|
| `ARGS` | Target: all request parameters (query string, form body) |
| `@detectSQLi` | Operator: SQL injection pattern detection, provided by the CRS engine |
| `deny,status:403` | Action: block the request with a `403 Forbidden` code |

## The Trade-off: False Positives vs. False Negatives

A rule set that's too strict sometimes blocks legitimate requests (a user comment that happens to contain a string resembling SQL code); a rule set that's too permissive lets real attacks through. Most WAF deployments go through a **learning mode** (*detection only*, which logs without blocking) before enabling blocking, to tune the rules to the application's real traffic without breaking legitimate usage right from launch.

> **Pitfall:** enabling blocking immediately in production, without a prior observation phase. An overly aggressive rule can block a share of legitimate traffic without anyone noticing until the affected users complain.
>
> **Best practice:** start in logging-only mode, analyze false positives against real traffic, then enable blocking once the rules are tuned to the application in question.

## What the WAF Doesn't Cover

The WAF filters incoming HTTP traffic; it protects neither application secrets (API key, database password — see [Secrets Management](/?c=cybersecurite&p=gestion-des-secrets) for that aspect, distinct from network filtering), nor an already-installed vulnerable dependency (see [Dependency Security](/?c=cybersecurite&p=securite-des-dependances)), nor a server-side misconfiguration. Each of these security layers addresses a different threat; none replaces the others.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A WAF inspects every HTTP request and blocks those matching a known attack pattern, before they reach the application. ModSecurity, combined with the OWASP Core Rule Set, is the most common open source deployment. It's an additional defense layer, not a substitute for secure application code. |
| **Tools you can use** | ModSecurity with the OWASP Core Rule Set, a logging-only mode to tune the rules before enabling blocking. |
| **Pitfalls to avoid** | Treating a WAF as sufficient on its own against application flaws. Enabling blocking in production without a prior observation phase. |
| **Best practices** | Treating the WAF as a defense-in-depth layer, complementing secure code. Starting in detection-only mode before enabling blocking. |
