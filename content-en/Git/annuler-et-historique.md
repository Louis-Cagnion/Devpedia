---
order: 5
---

# Undo changes and navigate the history

Git offers several commands for undoing changes at different levels: undoing an uncommitted change, an already committed change, or even recovering a commit that appears to have disappeared.

## Discard uncommitted changes

```bash
git checkout -- file.txt   # Restores a file to its last committed state and overwrites local changes
git restore file.txt        # Modern equivalent of the command above

git restore --staged file.txt  # Removes a file from staging WITHOUT affecting its changes in the working directory
```

> **Note:** `git checkout -- file.txt` and `git restore file.txt` are **irreversible**: uncommitted changes are permanently lost, unlike a commit, which can always be recovered (see `git reflog` below).

## `git reset` : Move the current branch backward

```bash
git reset --soft HEAD~1    # Undoes the last commit, but keeps everything in staging (ready to be committed again)
git reset --mixed HEAD~1   # Discards the last commit AND the staging area, but keeps the changes in the working directory (by default)
git reset --hard HEAD~1    # Undoes the last commit, the staging, AND the changes themselves -> permanent loss
```

| Option | Canceled commit | Staging | Working directory |
|---|---|---|---|
| `--soft` | Yes | Retained | Retained |
| `--mixed` (default) | Yes | Reset | Retained |
| `--hard` | Yes | Reset | **Reset (data loss)** |

> **Note:** `git reset --hard` is one of the most destructive Git commands: it silently overwrites any uncommitted changes, with no easy way to recover them. Use it only when you are certain of what you are discarding.

## `git revert` : Undo a commit that has already been shared

Unlike `reset` (which rewrites the history by deleting commits), `revert` creates a **new** commit that applies the reverse of a previous commit; the original history remains intact, making it safe even on commits that have already been pushed and shared:

```bash
git revert a3f9c1d
```

## `git reflog` : Finding a "lost" commit

Even after a `reset --hard` or a failed operation, Git actually keeps a record of all changes to `HEAD` for a certain amount of time:

```bash
git reflog
# a3f9c1d HEAD@{0}: reset: moving to HEAD~1
# e4f5g6h HEAD@{1}: commit: Fixes the discount calculation
```

```bash
git checkout e4f5g6h        # Retrieves the status of a "lost" commit that was found via reflog
git branch recuperation e4f5g6h   # or create a branch directly from this commit
```

> **Note:** `git reflog` is often the fallback solution after a Git operation goes wrong: as long as a commit existed locally at some point, it can usually still be retrieved for several weeks, even if it is no longer referenced by any branch.

See also [Branches](/?c=git&p=branches) and [Rebase](/?c=git&p=rebase), as the operations described in this chapter primarily involve these concepts.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | `restore` / `checkout --` undo uncommitted changes (irreversible); `reset` moves the branch backward (`--soft` / `--mixed` / `--hard`); `revert` creates a reverse commit, which is safe on an already shared history; `reflog` retrieves a "lost" commit. |
| **Tools available** | `git restore`, `git reset --soft/--mixed/--hard`, `git revert`, `git reflog`. |
| **Pitfalls to Avoid** | `git reset --hard` silently overwrites any uncommitted changes, with no easy way to recover them. |
| **Best Practices** | Use `revert` instead of `reset` when accessing a shared commit history; check `git reflog` before assuming a commit is permanently lost. |
