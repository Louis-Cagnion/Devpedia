---
order: 6
---

# Best Practices and Security

## A minimal image

Every package installed in an image is a **potential attack surface** (one more potential entry point that an attacker could exploit—a vulnerability in a package that is never used is still a vulnerability) and adds extra weight to the download. Opt for a minimal base image ([`alpine`](https://alpinelinux.org), or a variant `-slim`) and a [multi-stage build](/?c=docker&p=dockerfile) to deliver only what is strictly necessary for execution—never the compilation tools.

## Pin versions; never use `latest` in production

```dockerfile
FROM node:latest    # Avoid: The actual content of "latest" changes over time without notice.
FROM node:20.11.1    # Reproducible: the same Dockerfile always builds the same thing
```

An image `latest` that silently changes during a deployment fails in the worst possible way: the build succeeds, but with content different from the last time—it would be better if a missing version caused the build to fail explicitly rather than building anyway with unpredictable content.

## Never run a container in `root`

By default, a process in a container runs as `root`—an explicit `USER` in the Dockerfile limits the damage if the container is compromised:

```dockerfile
RUN adduser -D monapp
USER monapp
```

This precaution aligns with the [principle of least privilege](/?c=domain-specific-languages-dsl&p=sql) previously discussed in the context of a database login account, under the SQL section: a process should never have more privileges than it actually needs.

## Never embed secrets in an image

A value passed via `ENV` or `ARG` remains readable in the image's metadata (`docker history`), even after a multi-stage build that does not copy it into the final image—the secret existed in an intermediate layer, and that layer remains inspectable.

```dockerfile
# AVOID: The password remains visible in the image history
ARG DB_PASSWORD=motdepasse123
```

Secrets must be injected **at runtime** (environment variables passed to `docker run -e`, files mounted via a volume, or a dedicated secret manager), never hardcoded into any layer of the image—the same principle as never committing an API key to the source code (see the chapter [Securing Your Data](/?c=langages-de-programmation&s=php&p=securite), PHP section).

### Docker Compose Secrets vs. Simple Environment Variables

An environment variable (`environment:` in Compose) remains readable by anyone who can inspect the container (`docker inspect`, or read `/proc/<pid>/environ` from the host)—sufficient for ordinary configuration, but not well-suited for a password. Compose **secrets** are instead stored in a file, mounted as read-only only in containers that explicitly declare it:

```yaml
services:
  base:
    secrets:
      - db_password        # Mounted as read-only in /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt   # Never committed; see .gitignore
```

The application then reads the password as a regular file (`cat /run/secrets/db_password`) rather than as an environment variable—a secret set up this way does not appear in `docker inspect` or in the process's environment variables.

## `.dockerignore` systematic

Without a [`.dockerignore`](/?c=docker&p=dockerfile), a `COPY . .` will include everything in the directory—including a local `.env`, a complete `.git/`, or forgotten configuration credentials. The minimum list of items to exclude: `.git/`, `.env`, `node_modules/` (or equivalent), and any log files.

## Container isolation is not the same as virtual machine isolation

A container shares the host machine's kernel (see [Basic Concepts](/?c=docker&p=concepts-de-base)): a vulnerability in this kernel, or a misconfiguration (container launched in privileged mode `--privileged`, Docker socket mounted inside a container) could allow an attacker to escape and gain direct access to the host. A VM provides a much more secure hardware boundary. For a publicly exposed and particularly sensitive service, this difference should be a key factor in choosing between a container and a VM—Docker isolates processes, not kernels.

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaways** | A minimal image reduces the attack surface. A container should never run in `root` mode, nor should it embed secrets in its layers—secrets are injected at runtime, never in the Dockerfile. |
| **Tools to use** | `USER` (non-root user), Docker Compose secrets (mounted file), `.dockerignore`. |
| **Pitfalls to Avoid** | Using `latest` in production (unpredictable content); passing a secret via `ARG` / `ENV` — it remains readable in the image history even after a multi-stage build. |
| **Best Practices** | Pin a specific version of each base image; inject secrets at runtime (environment variable at launch, mounted file, dedicated manager); never run a container in "`root`" mode. |
