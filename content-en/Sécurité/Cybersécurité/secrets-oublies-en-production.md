---
order: 5
---

# Secrets Forgotten in Production

[Secrets Management](/?c=securite&s=cybersecurite&p=gestion-des-secrets) covers where to properly store a secret (environment variable, dedicated vault) and how to inject it into a CI/CD pipeline without hardcoding it. This chapter covers two ways a secret that's well managed at first still ends up exposed: a file left publicly reachable, and a secret still present in Git history after the file that held it was deleted.

## A configuration file left reachable at a guessable URL

An `.env` file (environment variables, often secrets) or a backup (`.bak`, `.sql`, a `.zip` of the whole site) mistakenly dropped into the folder the web server serves publicly stays reachable by anyone who guesses or tries its address, exactly like any other page on the site:

```text
https://site.example/index.php    -> the site's normal page
https://site.example/.env          -> if the file sits in the public folder: THE ENTIRE CONTENT,
                                       secrets included, is displayed as-is in the browser
https://site.example/backup.sql    -> an entire database dump, if forgotten in the same place
```

This risk never comes from an application flaw (no code is exploited): it's a simple file-placement mistake, combined with the web server not restricting this type of extension.

| | |
|---|---|
| **Pitfall** | Dropping an `.env` file, a backup, or any working file (`.git/`, a database export) into the same folder as files actually meant to be served to the public, assuming "there's no link to this file so nobody will find it": an automated scan tests known paths (`.env`, `.git/config`, `backup.zip`...) against millions of sites, with no link needed |
| **Best practice** | Store any sensitive file OUTSIDE the folder served publicly by the web server (`public/` or equivalent); configure the server to explicitly refuse any request for an `.env`/`.git`/backup file, as an extra layer of defense even when placement is already correct |

## A secret left in Git history after being deleted

Deleting a file that contains a secret (or replacing its value in a later commit) doesn't remove it from history: every old version of a file remains viewable in earlier commits, as long as the history itself isn't rewritten.

```text
Commit 1: adds config.php with API_KEY="sk_live_abc123..."
Commit 2: removes the API_KEY line (or the whole file)

git log -p -- config.php   -> STILL shows commit 1, plaintext key included
```

Anyone with access to the repository (including after a private repo becomes public by mistake, or a fork made before the deletion) can recover that secret by looking through the history, even if the current file no longer contains any trace of it.

> **Pitfall:** believing that a deletion `git commit` "erases" an already-committed secret. Merely removing it from the current file has no effect on the versions already recorded in history.
>
> **Best practice:** treat any secret committed by mistake as permanently compromised and REVOKE/regenerate it immediately (new API key, new password): this is the only reliable protection, since rewriting history (`git filter-repo`, BFG Repo-Cleaner) doesn't prevent a copy already cloned/forked before the rewrite from keeping the old history intact.

## A single page that exposes every account's secrets

A more serious variant than an ordinary leak: an admin/configuration page that displays, in a single view, the complete list of access tokens for EVERY account/customer of a system (rather than only the one currently logged in). A single unintended access to that page (missing access control, a link shared by mistake) then compromises the entire scope at once, not just one account.

> **Pitfall:** grouping every tenant's/account's secrets on the same screen for administrative convenience ("it's more practical to manage everything in one place"), without weighing that it turns a missing access control ON THAT ONE PAGE into a total compromise rather than a partial one.
>
> **Best practice:** never display a secret in plaintext once it's been generated (only at creation time, then masked or regenerable but no longer viewable); if an overview is still needed for administration, show only metadata there (creation date, last used), never the secret's own value.

## Secrets and a CI/CD pipeline open to external contributions

[Secrets Management](/?c=securite&s=cybersecurite&p=gestion-des-secrets) shows how to properly declare a CI secret (dedicated storage, injected as an environment variable). The extra risk appears when that pipeline can be triggered by an untrusted external contribution (a *pull request* coming from an account outside the project):

```text
1. The CI pipeline is configured to run automatically on every pull request,
   the project's secrets injected as usual (deployment, API key...)
2. An attacker opens a pull request from their own fork, modifying
   the build script so it exfiltrates the environment variables
   (e.g. sending them to an external server they control)
3. If the pipeline runs this script WITH the project's secrets injected,
   the attacker retrieves those secrets without ever having accessed the repository itself
```

| | |
|---|---|
| **Pitfall** | Injecting the main repository's secrets into a CI run triggered by a pull request coming from an external fork, treating that run as though it were as trustworthy as a direct commit from the team |
| **Best practice** | Configure the CI platform to NOT expose the main repository's secrets to pipelines triggered by an external pull request (an option already offered by most platforms, e.g. `pull_request_target` to avoid on GitHub Actions without a prior manual review), or require manual approval before running an external PR |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A secret correctly stored at first can still get exposed: an `.env` file/backup left in the server's public folder, a secret still readable in Git history after the file was deleted, an admin page that groups every account's secrets into one view, or a CI pipeline that injects the project's secrets into an untrusted external pull request's run. |
| **Tools you can use** | Server configuration to block access to sensitive files; `git filter-repo`/BFG Repo-Cleaner to rewrite history (in addition to revocation, never instead of it); a CI platform option to restrict secrets to internal runs. |
| **Pitfalls to avoid** | Placing a sensitive file in the publicly served folder. Believing a deletion commit removes a secret from history. Grouping every account's secrets on the same admin page. Exposing the project's secrets to a CI run triggered by an external pull request. |
| **Best practices** | Store any sensitive file outside the public folder, with a server-side block as an extra layer of defense. Immediately revoke any secret committed by mistake, regardless of any history rewrite. Never redisplay a secret in plaintext after its creation. Restrict CI secrets to internal runs, never external pull requests. |
