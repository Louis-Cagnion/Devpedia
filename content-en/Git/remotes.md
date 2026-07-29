---
order: 8
---

# Remote repositories

A **remote** is a reference to a copy of the repository hosted elsewhere (GitHub, GitLab, a corporate server, etc.), used to synchronize work among multiple people or machines.

## View and add a remote

```bash
git remote -v                                  # lists the configured remotes (often just "origin")
git remote add origin https://exemple.com/projet.git
```

`origin` is the conventional name given to the main remote (there is no requirement to use this specific name, but it is the almost universal convention).

## `push` : Push local commits

```bash
git push origin main               # pushes the commits from the local "main" branch to the "origin" remote
git push -u origin main             # -u: saves this link so you can later just type "git push"
git push                             # once you've memorized the link
```

## `fetch` vs`pull`

```bash
git fetch origin    # Download the new commits from the remote, WITHOUT modifying the working directory
git pull origin main # equivalent to: git fetch + git merge (merges immediately)
```

> **Note:** `git fetch` on its own is the "safest" way to check what has changed on the remote (`git log origin/main`) before deciding how to incorporate it—`git pull` performs this merge automatically, which can be surprising if conflicts arise unexpectedly.

## Tracking branches

A local branch can be linked to a remote branch, which lets Git know where to push or pull without having to specify it every time:

```bash
git branch -vv                     # shows which remote branch each local branch tracks
git push -u origin ma-branche       # establishes this tracking connection as soon as the first push occurs
```

## Clone an Already Configured Remote

```bash
git clone https://exemple.com/projet.git
```

`git clone` automatically configures `origin` to point to the cloned address—that's why simply going to `git pull` or `git push` works immediately after a clone, without any manual configuration.

## Remove a remote

```bash
git remote remove origin
```

See also the chapter on conflict resolution, which is often necessary after a `pull` when multiple people have edited the same lines.
