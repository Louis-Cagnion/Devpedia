---
order: 10
---

# Security Testing and Auditing

A regular functional test checks that a program does what it's supposed to; a security test checks, in addition, that it does **nothing else** than what's intended, even when facing a deliberately malicious input. Several families of tools and methods cover this goal, at different points in the development cycle.

## SAST: analyzing code without running it

**SAST** (*Static Application Security Testing*) analyzes the source code itself, without running it, looking for patterns known to be dangerous: a [SQL](/?c=domain-specific-languages-dsl&p=sql) query built by concatenation instead of a prepared statement, a hardcoded secret (see [Secrets Management](/?c=cybersecurite&p=gestion-des-secrets)), a hashing function unsuited to a password (see [Passwords and Secure Hashing](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)).

```text
Source code  -->  SAST scanner  -->  List of risky patterns found,
(never run)                          with the file + line involved
```

Since it never actually runs the code, a SAST tool fits in early and automatically, for instance on every `git push` in a [CI/CD pipeline](/?c=ci-cd&p=pipeline-cicd), even before a functional test runs.

## DAST: attacking the running application

**DAST** (*Dynamic Application Security Testing*) does the opposite: it actually launches the application (typically an API or a website deployed to a test environment) and sends it requests designed to reveal a flaw, exactly like an attacker would, but automated and systematic.

| | SAST | DAST |
|---|---|---|
| What it examines | The source code | The running application |
| Typical timing | Early, on every code change | On a deployed environment (test, staging) |
| Detects | Risky code patterns | An actually exploitable behavior, including configuration flaws invisible in the code alone |
| Limitation | May flag a risky-looking pattern that isn't actually exploitable (false positive) | Only covers the application paths actually exercised during the test |

## Fuzzing: bombarding a program with unexpected input

**Fuzzing** consists of sending a program a very large number of random, malformed, or edge-case inputs (extremely long strings, special characters, out-of-range values), hoping to trigger a crash, an unhandled exception, or behavior that reveals a flaw:

```text
Target program: CSV file parser

Inputs automatically tried by the fuzzer:
  ""                          (empty)
  "a,b,c\n" * 1000000         (huge file)
  "\x00\xFF\x00\xFF"          (non-text bytes)
  "a,\"b\nc\",d"               (nested quotes and line break)

-> If one of these inputs crashes the parser, the fuzzer isolates
   the exact input responsible, to fix before a real malicious
   file causes the same effect in production.
```

A crash triggered by an unforeseen input is often the symptom of a broader flaw (buffer overflow, denial of service) that a simple code review alone would miss.

## Pentesting: a simulated attack by a professional

A **penetration test** (*pentest*) means hiring a person or team to genuinely attack a system, using the same techniques a real attacker would, but within a legally defined framework agreed on beforehand:

| Framework element | Role |
|---|---|
| Scope | Precisely defines what can be tested (which systems, which techniques), so a system outside the scope is never impacted |
| Rules of engagement | Sets the limits (allowed hours, forbidden techniques such as an actual denial-of-service attack) |
| Final report | Lists the flaws found, their severity, and recommendations for fixing them |

> **Pitfall:** confusing an authorized pentest with a real intrusion. Without a written mandate and a scope defined beforehand, the exact same action is illegal, even with good intentions.

### Bug bounty: an open, continuous variant

A **bug bounty program** invites any external security researcher to report a flaw found within a defined scope, in exchange for a reward proportional to its severity. Unlike a one-off pentest carried out by a hired team, it stays open continuously, which multiplies the number and diversity of people actively looking for a flaw.

## Where dependency auditing and CVE tracking fit in

Auditing third-party libraries (`npm audit`, `pip-audit`, already covered in [Dependency Security](/?c=cybersecurite&p=securite-des-dependances)) and tracking [CVE](/?c=cybersecurite&p=types-de-failles) identifiers complement these methods: SAST/DAST/fuzzing/pentesting look for flaws **in the code written by the project itself**, while dependency auditing looks for flaws **already known in code written by others**, reused by the project.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | SAST analyzes code without running it; DAST attacks the running application; fuzzing bombards a program with unexpected input to trigger a revealing crash; a pentest is a simulated attack by a hired professional, within a defined scope. |
| **Tools you can use** | A SAST/DAST scanner integrated into the CI/CD pipeline, a fuzzer, a bug bounty program for continuous monitoring. |
| **Pitfalls to avoid** | Confusing an authorized pentest with a real intrusion; testing security only once, instead of continuously on every change. |
| **Best practices** | Integrate SAST into the CI/CD pipeline, from the very first commit; define a scope and written rules of engagement before any pentest. |
