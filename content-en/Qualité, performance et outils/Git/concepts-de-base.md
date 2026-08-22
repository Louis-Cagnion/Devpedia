---
order: 1
---

# The Basics of Git

**Git** is *version control* software: it stores the complete history of changes to a project, allowing you to revert to a previous state, understand who changed what and why, or have multiple people work on the same code without overwriting each other’s work. The following commands are executed in a [terminal](/?c=bases-de-l-informatique&p=le-terminal).

Git tracks a project’s evolution by saving, at any given moment, a complete snapshot of the files’ state: contrary to popular belief, it is not simply a line-by-line list of differences, even though that is often how it is visualized (`git diff`).

## The three work areas

```text
Working directory  -->  Staging area (index)  -->  Repository (history)

git add                 git commit
```

| Field | Role |
|---|---|
| **Working directory** | Files as they actually exist on the disk, freely editable |
| **Staging area** (*index*) | An intermediate area: changes that have been explicitly selected for inclusion in the **next** commit |
| **Repository** | The complete history, with each commit serving as a permanent snapshot |

> **Note:** This intermediate staging step is a unique feature of Git compared to older systems (such as [SVN](https://en.wikipedia.org/wiki/Apache_Subversion), not covered on this site): it allows you to precisely select **which** changes are included in a commit, even if multiple files were modified at the same time.

## A commit: a snapshot, not a difference

Each commit references:
- A complete snapshot of the files being tracked at this moment.
- One or more **parent** commits (the preceding commit(s)).
- An author, a date, and a message describing the change.
- A unique identifier: an **SHA-1 hash** (e.g., `a3f9c1d...`), calculated based on the content: two identical commits would have the same hash, and modifying a past commit changes its hash (and that of all its descendants).

> **SHA-1** (*Secure Hash Algorithm 1*) is a hash function: it transforms data of any size into a fixed-length fingerprint (40 hexadecimal characters in this case). Two properties make it useful for Git: the same input always produces the same fingerprint, and even the slightest change in the input produces a completely different fingerprint. This is what allows content to be identified by its fingerprint and any tampering with the history to be detected.

```text
commit A <-- commit B <-- commit C (HEAD)
```

Each commit points to its parent, forming a chain: this chain constitutes the project's history.

## `HEAD`: where you are now

`HEAD` is a pointer that indicates the commit you are currently working on; most of the time, it points to the latest commit on the current [branch](/?c=git&p=branches), and automatically advances with each new commit.

## Tracked, untracked, and modified files

```bash
git status
```

`git status` classifies the files in the working directory into several categories: tracked and unchanged (nothing to report), tracked and modified (not yet added to the staging area), pending in the staging area (ready for the next commit), or untracked, never added to Git; see the chapter [The .gitignore file](/?c=git&p=gitignore) to intentionally exclude certain files from tracking.

See also [Essential Commands](/?c=git&p=commandes-essentielles) for practical guidance on this workflow: `add` → `commit`.

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | Git stores complete snapshots (not just differences) in three successive areas: working directory → staging area (`git add`) → repository (`git commit`). Each commit has a unique SHA-1 hash and points to its parent commit, forming the commit history. `HEAD` refers to the currently active commit. |
| **Tools available** | `git status` to view the status of files; `git add` / `git commit` to push a change from the working directory to the repository. |
| **Pitfalls to Avoid** | Confusing staging with a simple draft: as long as a modified file has not been `git add`, it will not be included in the next commit, even if the commit is initiated immediately afterward. |
| **Best Practices** | Check `git status` before every commit to ensure you never accidentally include a file (or forget one). |
