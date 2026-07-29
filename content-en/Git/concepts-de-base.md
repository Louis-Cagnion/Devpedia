---
order: 1
---

# The Basics of Git

Git tracks a project's evolution by saving, at each chosen point in time, a complete snapshot of the state of the files—contrary to popular belief, it is not simply a line-by-line list of differences, even though that is often how it is visualized (`git diff`).

## The Three Work Areas

```
Dossier de travail  -->  Zone de staging  -->  Dépôt (historique)
(working directory)      (index)               (commits)

git add                  git commit
```

| Zone | Role |
|---|---|
| **Work Folder** | Files as they actually exist on the disk, which can be freely edited |
| **Staging area** (*index*) | An intermediate area: changes that have been explicitly selected for inclusion in the **next** commit |
| **Repository** | The complete history, with each commit serving as a permanent snapshot |

> **Note:** This intermediate staging step is a feature unique to Git compared to older systems (such as SVN): it allows you to choose exactly **which** changes are included in a commit, even if multiple files were modified at the same time.

## A commit: a snapshot, not a difference

Each commit references:
- A complete snapshot of the files being tracked at this moment.
- One or more **parent** commits (the preceding commit(s)).
- An author, a date, and a message describing the change.
- A unique identifier: an **SHA-1 hash** (e.g., `a3f9c1d...`), calculated from the content—two identical commits would have the same hash, and modifying a past commit changes its hash (and that of all its descendants).

```
commit A <-- commit B <-- commit C (HEAD)
```

Each commit points to its parent, forming a chain: this chain constitutes the project's history.

## `HEAD` : where you are right now

`HEAD` is a pointer that refers to the commit you are currently working on—most of the time, it points to the latest commit on the current branch (see the chapter on branches), and automatically advances with each new commit.

## Tracked, untracked, and modified files

```bash
git status
```

`git status` classifies the files in the working directory into several categories: tracked and unchanged (nothing to report), tracked and modified (not yet added to the staging area), pending in the staging area (ready for the next commit), or untracked (never added to Git; see the chapter on `.gitignore`).

See also the chapter on essential commands for practical use of this cycle: `add` → `commit`.
