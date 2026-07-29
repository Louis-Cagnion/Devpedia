---
order: 5
---

# Undo changes and browse the history

Git offers several commands for undoing changes at different levels: undoing an uncommitted change, an existing commit, or even recovering a commit that seems to have disappeared.

## Discard uncommitted changes

```bash
git checkout -- fichier.txt   # Restores a file to its last committed state, overwriting local changes
git restore fichier.txt        # the modern equivalent of the command above

git restore --staged fichier.txt  # Remove a file from the staging area WITHOUT affecting its changes in the working directory
```

> **Note:** `git checkout -- fichier.txt` and `git restore fichier.txt` are **irreversible**: uncommitted changes are permanently lost, unlike a commit, which can always be recovered (see `git reflog` below).

## `git reset` : Move the current branch backward

```bash
git reset --soft HEAD~1    # Undoes the last commit, but keeps everything in the staging area (ready to be committed again)
git reset --mixed HEAD~1   # Reverts the last commit AND the staging area, but keeps the changes in the working directory (by default)
git reset --hard HEAD~1    # Undoes the last commit, the staging, AND the changes themselves -> permanent loss
```

| Option | Commit Canceled | Staging | Working Directory |
|---|---|---|---|
| `--soft` | Yes | Retained | Retained |
| `--mixed` (default) | Yes | Reset | Retained |
| `--hard` | Yes | Reset | **Reset (data loss)** |

> **Note:** `git reset --hard` is one of the most destructive Git commands—it silently overwrites any uncommitted changes, with no easy way to recover them. Use it only when you are certain about what you are discarding.

## `git revert` : Undo a commit that has already been shared

Unlike `reset` (which rewrites the history by deleting commits), `revert` creates a **new** commit that applies the inverse of a previous commit—the original history remains intact, making it safe even on commits that have already been pushed and shared:

```bash
git revert a3f9c1d
```

## `git reflog` : Finding a "lost" commit

Even after a `reset --hard` or a failed operation, Git actually keeps track of all changes to `HEAD` for a certain amount of time:

```bash
git reflog
# a3f9c1d HEAD@{0}: reset: moving to HEAD~1
# e4f5g6h HEAD@{1}: commit: Fixes the discount calculation
```

```bash
git checkout e4f5g6h        # retrieves the state of a "lost" commit found via reflog
git branch recuperation e4f5g6h   # or create a branch directly from this commit
```

> **Note:** `git reflog` is often the fallback solution after a Git operation goes wrong—as long as a commit existed locally at some point, it can usually still be retrieved for several weeks, even if it is no longer referenced by any branch.

See also the chapter on branches and the chapter on rebasing, as the procedures described in this chapter are most relevant to those topics.
