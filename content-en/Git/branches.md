---
order: 4
---

# Branches

A **branch** is simply a movable pointer to a commit: it lets you develop a version of the code (a new feature, a fix) without touching the main branch, then bring the two lines of work back together later.

## Creating and switching branches

```bash
git branch                               # lists the existing branches; the current one is marked with an *
git branch nouvelle-fonctionnalite       # creates a new branch, without switching to it
git checkout nouvelle-fonctionnalite     # switches to this branch
git checkout -b nouvelle-fonctionnalite  # shortcut: creates AND switches in a single command

git switch nouvelle-fonctionnalite     # modern equivalent of "checkout" for switching branches
git switch -c nouvelle-fonctionnalite  # modern equivalent of "checkout -b"
```

> **Note:** `git switch` (newer) and `git checkout` (older, more versatile but less explicit) do the same thing here: `checkout` is also used for other purposes (restoring a file, see [Undoing changes and browsing history](/?c=git&p=annuler-et-historique)), which makes it more ambiguous to read.

## What actually happens when you switch branches

Each branch is simply a pointer to a specific commit. Switching branches moves `HEAD` to that pointer, and Git updates the working directory so it exactly matches the snapshot of that commit:

```text
main:          A -- B -- C
                          \
feature:                   D -- E   <-- HEAD (if you're on "feature")
```

## Merging a branch (`merge`)

```bash
git checkout main
git merge feature
```

What Git does depends on a single question: **has `main` received any new commits since `feature` was created?** The answer determines whether a real merge (with a new commit) is needed, or whether Git can simply let `main` "catch up".

**Fast-forward: `main` hasn't moved, there's nothing to bring together.** Every commit on `feature` (`C`, `D`) already descends directly from the last commit on `main` (`B`): the history of `feature` **already contains** the entire history of `main`, with no divergence at all. Merging then only requires one thing: moving the `main` pointer forward to `D`, exactly like moving a bookmark forward in a book. No content is ever combined, so no merge commit is needed:

```text
Before:  main: A -- B                    feature: A -- B -- C -- D
                    ^main                                        ^feature

After:   main: A -- B -- C -- D          (main is simply fast-forwarded to feature)
                              ^main, feature
```

**Merge commit: `main` evolved on its own side, the two histories genuinely need to be brought together.** If `main` received its own commit (`E`) while `feature` moved forward with `C`/`D`, the two branches have **diverged**: neither one contains the other's history anymore, so "moving a pointer forward" is no longer enough. Git has to create a new commit with **two parents** at once (the last commit on `main` and the last one on `feature`), the only way to represent "here is a point in history that brings these two lines of work back together":

```text
Before:  main:     A -- B -- E                    feature: A -- B -- C -- D
                             ^main

After:   main:     A -- B -- E ------- F (merge commit, two parents)
                        \             /
         feature:        C --------- D
                                      ^feature
```

## Deleting a branch

```bash
git branch -d feature  # deletes, only if the branch has already been merged (safety)
git branch -D feature  # forces deletion, even if it was never merged
```

> **Note:** `git branch -D` on a branch that was never merged can make its commits inaccessible from anywhere else. They usually remain recoverable for a while via `git reflog` (see [Undoing changes and browsing history](/?c=git&p=annuler-et-historique)), but it's best to check with `git log feature` (or merge it, or use `git branch -d`) before forcing the deletion.

See also [Rebase](/?c=git&p=rebase), an alternative to merge for integrating changes without a merge commit, and [Resolving a merge conflict](/?c=git&p=resoudre-conflits), for when both branches have modified the same lines.

---

## 📋 Summary

| | |
|---|---|
| **Key Takeaway** | A branch is a moving pointer to a commit. `git merge` combines two branches: fast-forward if possible, otherwise a merge commit with two parents. |
| **Tools available** | `git branch`, `git switch` / `checkout`, `git merge`. |
| **Pitfalls to Avoid** | `git branch -D` on a branch that has never been merged can make it difficult to track down your commits. |
| **Best Practices** | Use `-d` (secure, rejects requests if not merged) instead of `-D`; use `switch` rather than `checkout` to switch branches, as it is less ambiguous to read. |
