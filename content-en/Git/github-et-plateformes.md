---
order: 9
---

# GitHub and Git hosting platforms

[Git](/?c=git&p=concepts-de-base) is software, installed locally, that manages a project's history. **GitHub** is an **online service** (a website, with servers behind it) that hosts Git repositories and adds collaboration tools on top that Git alone has never provided: this chapter covers specifically those additions, not Git itself.

| | Git | GitHub |
|---|---|---|
| Nature | Software installed on your machine | A web service, operated by a company (Microsoft) |
| Role | Manages history, branches, commits **locally** | Hosts a copy of the repository online, accessible to multiple people |
| Works without the other? | Yes: Git works perfectly fine without ever touching GitHub | No: GitHub hosts **Git** repositories, it doesn't replace the tool |
| Competitors | (Git has no competitor: it's the standard) | [GitLab](https://gitlab.com), [Bitbucket](https://bitbucket.org), Azure Repos (see Azure DevOps): different platforms, all built on Git |

> **Pitfall:** using "Git" and "GitHub" as synonyms. A purely local Git repository (never pushed anywhere) is a perfectly valid Git repository, with no connection to GitHub whatsoever. Conversely, a repository hosted on GitHub remains an ordinary Git repository; every command from the [Remote repositories](/?c=git&p=remotes) chapter (`push`, `pull`, `fetch`, `clone`) applies identically.

## A repository on GitHub: a remote, plus a web page

Adding GitHub as a [remote](/?c=git&p=remotes) of a local repository is technically no different from adding any other remote:

```bash
git remote add origin https://github.com/user/project.git
git push -u origin main
```

What GitHub adds on top of this plain storage: a **web page** for the repository (browsable files, `README.md` displayed automatically as the project's home page), a history you can browse without a terminal, and the collaboration tools detailed below.

> **Note (authentication):** GitHub no longer accepts a plain password for `git push` over HTTPS. You need either a **personal access token** (generated from your account settings, used in place of a password), or an **SSH key**: a pair of two files generated together (a private key, kept secret on your machine, and a public key, saved to your GitHub account) that let you prove your identity without ever transmitting a password. Without either one, `git push` fails with an authentication error, even with the correct account username and password.

## The collaboration tools added by GitHub

Beyond hosting, GitHub adds three families of tools, each detailed in its own chapter rather than skimmed here:

| Tool | Role | Dedicated chapter |
|---|---|---|
| **Pull request** | Propose a change (a branch) for review before merging it in | [Pull requests on GitHub](/?c=git&p=pull-requests-github) |
| **Fork** | Copy a repository you don't control, to be able to contribute to it via a pull request | [Pull requests on GitHub](/?c=git&p=pull-requests-github) (a fork only makes sense for this use case) |
| **Issue** | Track a bug, a task, a discussion, with no code attached | [Issues and project management on GitHub](/?c=git&p=issues-et-projets-github) |
| **GitHub Actions** | Automate build/tests/deployment | Azure Pipelines vs. GitHub Actions (detailed comparison already available) |

## Visibility: public or private repository

A **public** repository is visible and clonable by anyone on the internet, with or without a GitHub account. A **private** repository is only visible to explicitly authorized accounts.

> **Pitfall:** pushing a secret (an API key, a password, a `.env` file) to a public repository, even briefly then removed in a following commit: the commit containing the secret remains visible in the Git history until it's explicitly rewritten (see [The internal architecture of Git](/?c=git&p=architecture-interne)), and a public repository may already have been cloned by anyone in the meantime.
>
> **Best practice:** exclude secrets via [`.gitignore`](/?c=git&p=gitignore) before the very first commit that involves them; if a secret has already been pushed, treat it as compromised and revoke/regenerate it on the service concerned, not just remove it from the repository.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | GitHub is a service that hosts Git repositories (a remote like any other, plus a web page) and adds collaboration tools detailed in their own chapters: pull requests and forks, issues, GitHub Actions. Git works independently of GitHub. |
| **Tools you can use** | Personal access token or SSH key for authentication. |
| **Pitfalls to avoid** | Confusing Git and GitHub. Pushing a secret to a public repository. |
| **Best practices** | Exclude secrets via `.gitignore` before the first commit that involves them. |
