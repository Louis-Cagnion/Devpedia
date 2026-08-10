---
order: 2
---

# Essential Commands

This chapter covers the most common Git workflow: initializing a repository (or cloning an existing one), tracking changes, and committing them.

## Create or retrieve a repository

```bash
git init                              # Converts the current directory into a Git repository (empty, no history)
git clone https://exemple.com/projet.git   # Retrieves an existing repository, along with its entire history
```

## View the status of the workbook

```bash
git status
```

Shows which files have been modified, which are in the staging area, and which are not tracked—see [Git Basics](/?c=git&p=concepts-de-base).

## Add changes to staging

```bash
git add file.txt        # Adds a specific file
git add folder/            # adds an entire folder
git add .                   # Adds everything that has changed in the current folder and its subfolders
git add -p                  # Interactive mode: Choose exactly which blocks of lines to add
```

> **Note:** `git add .` also adds files that are not tracked—make sure that `[.gitignore](/?c=git&p=gitignore)` is up to date beforehand, so you don't accidentally add files that should never be included in the commit history (secrets, dependencies, generated files, etc.).

## Create a commit

```bash
git commit -m "Corrects the discount calculation"
git commit -am "Message"   # Shortcut: Automatically adds files that are already tracked AND have been modified, without needing to run "git add" first
```

> **Note:** `-a` (in `-am`) only adds files already tracked by Git—a brand-new file that has never been added before must always be explicitly added with `git add` at least once.

A good commit message explains the **reason** for the change, not just what was changed (the diff already shows what changed)—which is helpful for understanding the history long after the fact.

## View history

```bash
git log                     # Complete history, from most recent to oldest
git log --oneline            # One line per commit, making it easier to read at a glance
git log --oneline --graph --all   # Also displays branches and their divergence/merge points
git log -p file.txt        # Detailed history (with diff) of a specific file
```

## See the differences

```bash
git diff                     # differences not yet added to staging
git diff --staged             # Changes already added to the staging environment but not yet committed
git diff commit1 commit2      # Differences between two specific commits
```

## View commit details

```bash
git show a3f9c1d   # Displays the message, author, date, and full diff for this specific commit
```

---

## 📋 Summary

| | |
|---|---|
| **Key Points** | `git init` / `clone` create or retrieve a repository; `git add` stage changes; `git commit` commit them; `git log` / `diff` / `show` view the history. |
| **Tools available** | `git status`, `git add`, `git commit`, `git log`, `git diff`, `git show`. |
| **Pitfalls to Avoid** | `git add .` also adds untracked files—check `.gitignore` first; `-am` does not add files that have never been tracked; an explicit `git add` is still required at least once. |
| **Best Practices** | Describe the *reason* for the change in the commit message, not just the *change itself*; check `git status` before each commit. |
