---
order: 8
---

# Remote repositories

A **remote** is a reference to a copy of the repository hosted elsewhere (GitHub, GitLab, a corporate server, etc.), used to synchronize work among multiple people or machines.

## View and add a remote

```bash
git remote -v                                  # Lists the configured remotes (often just "origin")
git remote add origin https://exemple.com/projet.git
```

`origin` is the conventional name given to the main remote (there is no requirement to use this specific name, but it is the almost universal convention).

## `push` : Send local commits

```bash
git push origin main               # Pushes commits from the local "main" branch to the "origin" remote
git push -u origin main             # -u: saves this link so you can later just type "git push"
git push                             # once the link has been saved
```

## Force a push after rewriting the history

After a `rebase`, a `commit --amend`, or a history rewrite (see [Git's Internal Architecture](/?c=git&p=architecture-interne)), local commits no longer have the same hashes as those already pushed—a normal `push` is then rejected (*non-fast-forward*), since the remote cannot find its old commits as ancestors of the new ones.

```bash
git push --force origin main             # Unconditionally overwrites the remote history—dangerous if someone else has pushed changes in the meantime
git push --force-with-lease origin main   # Overwrite only if the remote is still in the state observed during the last fetch
```

> **Note:** `--force-with-lease` compares the actual state of the remote with what the local tracking branch (`origin/main`) knew at the time of the last `fetch`—if they differ (someone else has pushed in the meantime, or this tracking branch has itself been modified by a local operation), the push is rejected (`stale info`) rather than overwriting work you haven’t seen. Always prefer `--force-with-lease` to `--force`, unless you are absolutely certain you are the only one on the branch.

## `fetch` vs `pull`

```bash
git fetch origin    # Download the new commits from the remote repository WITHOUT modifying the working directory
git pull origin main # Equivalent to: git fetch + git merge (merges immediately)
```

> **Note:** `git fetch` is the "safest" way to check what has changed on the remote side (`git log origin/main`) before deciding how to integrate it—`git pull` performs this merge automatically, which can be surprising if conflicts arise unexpectedly.

## Tracking branches

A local branch can be linked to a remote branch, which allows Git to know where to push or pull without having to specify it each time:

```bash
git branch -vv                     # shows which remote branch each local branch tracks
git push -u origin ma-branche       # Establishes this tracking link as soon as the first push is made
```

## Cloning an Already Configured Remote

```bash
git clone https://exemple.com/projet.git
```

`git clone` It automatically configures `origin` to point to the cloned address—which is why a simple `git pull` / `git push` works immediately after a clone, without any manual configuration.

## Back up or transfer a serverless repository: `git bundle`

`git bundle` Packages all or part of a repository (commits, branches, tags) into a single binary file, without requiring a remote server:

```bash
git bundle create sauvegarde.bundle --all   # Captures all refs (branches, tags, HEAD) into a single file
git bundle verify sauvegarde.bundle          # Verifies that the bundle is complete and functional
git clone sauvegarde.bundle nouveau-folder   # A bundle is cloned just like a standard remote.
```

> **Note:** A bundle is a static snapshot—it does not update automatically. It is the ideal tool for creating a one-time backup before a risky operation (such as rewriting the commit history), or for transferring a repository to a machine without network access (e.g., a USB drive).

## Remove a remote

```bash
git remote remove origin
```

See also [Resolving a merge conflict](/?c=git&p=resoudre-conflits), which is often necessary after a `pull` when multiple people have modified the same lines.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | A "remote" refers to a copy of the repository hosted elsewhere. `push` / `pull` / `fetch` synchronize the work between the local repository and this remote. |
| **Tools available** | `git remote`, `git push` / `pull` / `fetch`, `git bundle` (backup or transfer without a server). |
| **Pitfalls to Avoid** | `git push --force` may overwrite someone else's work without warning. |
| **Best Practices** | Use `--force-with-lease` instead of `--force`; use `fetch` to review remote changes before deciding how to merge them, rather than a direct `pull` when in doubt. |
