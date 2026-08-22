---
order: 4
---

# Secrets Management

A **secret** is a piece of information that grants access if known: a password, an API key, an authentication token, a private encryption key, a database connection string. A compromised secret is equivalent to handing an attacker the exact access it protects, no matter how strong the rest of the system is.

## The most common pitfall: hardcoding a secret in the code

```text
// Dangerous: the secret is written directly in the source code
api_key = "sk_live_51H8xJ2eZvKYlo2C..."

// Once this code is committed to Git, this secret is exposed:
// - to anyone with access to the repository (even a private one, if that access ever leaks)
// - permanently in the history, even if the line is later removed
//   (see Undoing Changes and Navigating History)
```

Once a secret has been committed, simply removing it from the file isn't enough: it remains readable in the Git history until it's rewritten (a heavy, risky operation on a shared repository, see [Undoing Changes and Navigating History](/?c=git&p=annuler-et-historique)), and even after a rewrite, a clone that already exists elsewhere may still hold the compromised version. The only reliable protection once a secret is exposed is to **revoke and replace it immediately**, never to rely on removing it from the repository.

## Where to store a secret: three approaches, from simplest to most robust

| Approach | Principle | Typical use case |
|---|---|---|
| **Environment variable** | The secret is provided to the program by the operating system at startup, never written to a file tracked by Git | Local development, small projects |
| **`.env` file ignored by Git** | A file separate from the code, listed in [`.gitignore`](/?c=git&p=gitignore), that defines the project's environment variables | Local development with several secrets, small team |
| **Secrets vault** | A dedicated service that stores, encrypts, and distributes secrets on demand, with a trail of who accessed what | Production, larger teams, regulatory compliance |

```bash
# .env file (never committed, see .gitignore)
DATABASE_URL=postgres://user:password@localhost/mydatabase
API_KEY=sk_live_51H8xJ2eZvKYlo2C...
```

```text
// The code reads the environment variable, never a hardcoded value
api_key = readEnvironmentVariable("API_KEY")
```

## Secrets vaults

Beyond a simple `.env` file, a secrets vault is a dedicated service (for example [HashiCorp Vault](https://www.vaultproject.io) or a cloud provider's built-in secrets manager, like [AWS Secrets Manager](https://aws.amazon.com/secrets-manager)) that offers what a `.env` file can't:

| Need | `.env` file | Secrets vault |
|---|---|---|
| Encrypted storage at rest | No (plain text on disk) | Yes |
| Who accessed which secret, and when | No trail | Logged (audit) |
| Automatic secret rotation | Manual | Often automatable |
| Individually revocable access | Hard (the whole file is shared) | One specific access can be revoked without touching the others |

## Secret rotation

**Rotating** a secret means periodically replacing it with a new value, even without any known compromise: this shrinks the window during which a stolen but not-yet-detected secret stays usable. A secret that's never renewed stays valid indefinitely, including for an attacker who obtained it months earlier without anyone knowing.

## Secrets and continuous integration

A [CI/CD](/?c=ci-cd&p=pipeline-cicd) pipeline also needs secrets (deploying to a server, publishing a package, calling a third-party API), and should never write them into the pipeline's own configuration file (tracked by Git, and so visible to anyone with repository access): the CI platform instead provides a dedicated, encrypted space to declare these secrets once, then inject them as environment variables when the pipeline runs.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaway** | A secret (password, API key, token) grants direct access if known. Never hardcode it in the code; once committed, it stays exposed in the history even after removal. |
| **Tools you can use** | Environment variables, a `.env` file [ignored by Git](/?c=git&p=gitignore), a secrets vault (Vault, a cloud secrets manager) for production. |
| **Pitfalls to avoid** | Hardcoding a secret; assuming that removing it from the file secures it after an exposure; never rotating a secret. |
| **Best practices** | Immediately revoke and replace any exposed secret; rotate secrets periodically; use a CI platform's dedicated secrets space rather than the pipeline's configuration file. |
