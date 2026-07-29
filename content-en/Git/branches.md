---
order: 4
---

# The Branches

A **branch** is simply a movable pointer to a commit—it allows you to develop a version of the code (a new feature, a fix) without affecting the main branch, and then merge the two lines of work later.

## Create and Switch Branches

```bash
git branch                     # lists the existing branches; the current one is marked with an *
git branch nouvelle-fonctionnalite   # creates a new branch without switching to it
git checkout nouvelle-fonctionnalite  # switches to this branch
git checkout -b nouvelle-fonctionnalite  # Shortcut: Creates AND toggles with a single command

git switch nouvelle-fonctionnalite      # the modern equivalent of "checkout" for switching branches
git switch -c nouvelle-fonctionnalite    # modern equivalent of "checkout -b"
```

> **Note:** `git switch` (more recent) and `git checkout` (older, more versatile but less explicit) do the same thing here—`checkout` is also used for other purposes (restoring a file; see the chapter on undoing), which makes it more ambiguous to read.

## What Really Happens When You Switch Majors

Each branch is simply a pointer to a specific commit. Switching branches moves `HEAD` to that pointer, and Git updates the working directory so that it exactly matches the snapshot of that commit:

```
main:          A -- B -- C
                          \
feature:                   D -- E   <-- HEAD (si on est sur "feature")
```

## 

```bash
git checkout main
git merge feature
```

There are two possible scenarios:

**Fast-forward**: If `main` has not received any commits since the creation of `feature`, Git simply moves the pointer `main` to the last commit at `feature`—no new merge commit is created.

```
Avant :  main: A -- B          feature: A -- B -- C -- D
Après :  main: A -- B -- C -- D
```

**Merge commit**: If `main` has evolved in parallel, Git creates a special commit with **two parents** that combines the two histories:

```
main:     A -- B ------- E (merge commit)
                \        /
feature:         C -- D
```

## Delete a branch

```bash
git branch -d feature    # deletes, only if the branch has already been merged (safety)
git branch -D feature    # forces deletion, even if it was never merged
```

> **Note:** Running `git branch -D` on a branch that has never been merged may cause you to lose access to commits that no longer exist anywhere else. They can usually still be found for a while via `git reflog` (see the chapter on rollback and history), but it’s best to check with `git log feature` (or a merge/`git branch -d`) before forcing deletion.

See also the chapter on rebase, an alternative to merge for incorporating changes without a merge commit, and the chapter on conflict resolution, in case both branches have modified the same lines.
