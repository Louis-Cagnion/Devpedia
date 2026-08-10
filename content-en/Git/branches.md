---
order: 4
---

# The Branches

A **branch** is simply a movable pointer to a commit—it allows you to develop a version of the code (a new feature, a fix) without affecting the main branch, and then merge the two lines of work later.

## Create and Switch Branches

```bash
git branch                     # Lists the existing branches; the current one is marked with an *
git branch nouvelle-fonctionnalite   # Creates a new branch without switching to it
git checkout nouvelle-fonctionnalite  # Switch to this branch
git checkout -b nouvelle-fonctionnalite  # Shortcut: creates AND toggles with a single command

git switch nouvelle-fonctionnalite      # The modern equivalent of "checkout" for switching branches
git switch -c nouvelle-fonctionnalite    # Modern equivalent of "checkout -b"
```

> **Note:** `git switch` (more recent) and `git checkout` (historical, more versatile but less explicit) serve the same purpose here—`checkout` is also used for other purposes (restoring a file; see [Undo Changes and Browse History](/?c=git&p=annuler-et-historique)), which makes it more ambiguous to read.

## What Actually Happens When You Switch Branches

Each branch is simply a pointer to a specific commit. Switching branches moves `HEAD` to that pointer, and Git updates the working directory so that it exactly matches the snapshot of that commit:

```text
main:          A -- B -- C
                          \
feature:                   D -- E   <-- HEAD (si on est sur "feature")
```

## 

```bash
git checkout main
git merge feature
```

Two possible scenarios:

**Fast-forward**: If `main` has not received any commits since the creation of `feature`, Git simply moves the pointer `main` to the last commit of `feature`—no new merge commit is created.

```text
Avant :  main: A -- B          feature: A -- B -- C -- D
Après :  main: A -- B -- C -- D
```

**Merge commit**: If `main` has evolved in parallel, Git creates a special commit with **two parents**, which combines the two histories:

```text
main:     A -- B ------- E (merge commit)
                \        /
feature:         C -- D
```

## Delete a branch

```bash
git branch -d feature    # Removes, only if the branch has already been merged (safety)
git branch -D feature    # Forces deletion, even if it was never merged
```

> **Note:** Running `git branch -D` on a branch that has never been merged may result in the loss of access to commits that no longer exist anywhere else. They can usually still be found for a while via `git reflog` (see [Undo Changes and Browse History](/?c=git&p=annuler-et-historique)), but it’s best to check with `git log feature` (or a merge/`git branch -d`) before forcing deletion.

See also [Rebasing](/?c=git&p=rebase), an alternative to merging that allows you to incorporate changes without a merge commit, and [Resolving a Merge Conflict](/?c=git&p=resoudre-conflits), for cases where both branches have modified the same lines.

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaway** | A branch is a moving pointer to a commit. `git merge` combines two branches: fast-forward if possible, otherwise a merge commit with two parents. |
| **Tools available** | `git branch`, `git switch` / `checkout`, `git merge`. |
| **Pitfalls to Avoid** | `git branch -D` on a branch that has never been merged can make it difficult to track down your commits. |
| **Best Practices** | Use `-d` (secure, rejects requests if not merged) instead of `-D`; use `switch` rather than `checkout` to switch branches, as it is less ambiguous to read. |
