---
order: 6
---

# Dependency and Supply Chain Security

A modern project relies on dozens, sometimes thousands, of libraries written by other people (see for instance `pip` in Python, or the equivalent in other languages, described in [Modules, pip and Virtual Environments](/?c=langages-de-programmation&s=python&p=modules-et-environnements)). Each of these libraries, and each of their own dependencies in turn, is a link in the **software supply chain**: a flaw or a piece of malicious code in any one of these links affects every project that depends on it, directly or indirectly, without any mistake having been made in the project's own code. This is one of the flaw categories already introduced in [The Main Families of Vulnerabilities](/?c=cybersecurite&p=types-de-failles) under "vulnerable components."

```text
Your project
   |
   +-- depends on --> Library A
   |                     |
   |                     +-- depends on --> Library C (flaw here)
   |
   +-- depends on --> Library B

A flaw in C affects your project, even if you've never
heard of C or installed it yourself.
```

## The lockfile: pinning what's actually installed

A regular dependency file (`package.json`, `composer.json`...) declares loose version ranges ("at least 2.1", "any 3.x version"): two installs at different times can therefore pull different versions, including of indirect dependencies never explicitly listed. A **lockfile** (`package-lock.json`, `composer.lock`, or a `requirements.txt` generated with `pip freeze`, see [Modules, pip and Virtual Environments](/?c=langages-de-programmation&s=python&p=modules-et-environnements)) pins the **exact** version of every dependency, direct and indirect, often alongside a cryptographic fingerprint of the downloaded content:

| Without a lockfile | With a lockfile |
|---|---|
| Installed version potentially different on every run of the installer | Installed version identical and reproducible, across the whole team and in production |
| A compromised indirect dependency can install silently | The lockfile's fingerprint detects content changed since the last validated install |

> **Best practice:** always commit the lockfile alongside the rest of the code, never ignore it as just another generated file: that's precisely what guarantees everyone installs the same versions, at the same fingerprints.

## Package typosquatting

[Typosquatting](/?c=cybersecurite&p=ingenierie-sociale-et-phishing) doesn't only target domain names: an attacker can publish a package under a name deliberately close to a popular one (`reqeusts` instead of `requests`, `lodahs` instead of `lodash`), hoping a typo during install (`pip install reqeusts`) installs their malicious version instead of the legitimate one.

```text
pip install requests    # the legitimate, widely used package
pip install reqeusts    # typo -> a different package, potentially malicious
```

> **Best practice:** copy-paste a package's exact name from its official documentation rather than typing it from memory, and check the download count/age of an unfamiliar package before adding it to a project.

## Auditing your dependencies

A package installed today with no known flaw can reveal one later: that's why dependency auditing is a recurring check, not a one-time verification done at install time.

| Tool | Ecosystem | Role |
|---|---|---|
| `npm audit` | [JavaScript](/?c=langages&s=javascript&p=javascript)/Node.js | Compares installed dependencies against a database of known flaws |
| `pip-audit` | Python | The equivalent for Python packages |
| [Dependabot](https://docs.github.com/en/code-security/dependabot) | Multi-ecosystem (built into GitHub) | Automatically opens a pull request when a dependency has a known flaw and a fix is available |

These tools plug naturally into a [CI/CD pipeline](/?c=ci-cd&p=pipeline-cicd): the audit runs automatically on every change, instead of depending on a manual check someone forgets to redo.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A dependency (direct or indirect) is a link in the software supply chain: its flaw becomes the project's flaw. A lockfile pins the exact versions actually installed, for the whole team. |
| **Tools you can use** | `npm audit`, `pip-audit`, Dependabot, a lockfile (`package-lock.json`, `composer.lock`, `requirements.txt`). |
| **Pitfalls to avoid** | Ignoring the lockfile instead of committing it; typing an unfamiliar package name from memory (typosquatting risk); auditing dependencies only once, at install time, never again. |
| **Best practices** | Always commit the lockfile; copy-paste a package name from its official documentation; integrate dependency auditing into the CI/CD pipeline, run on every change. |
