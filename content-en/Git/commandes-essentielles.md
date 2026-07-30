---
order: 2
---

# Essential Commands

This chapter covers the most common Git workflow: initializing a repository (or cloning an existing one), tracking changes, and committing them.

## Create or retrieve a deposit

```bash
git init                              # converts the current directory into a Git repository (empty, no history)
git clone https://exemple.com/projet.git   # retrieves an existing repository, along with its entire history
```

## View the status of the workbook

```bash
git status
```

Displays which files have been modified, which are in the staging area, and which are not tracked (see the chapter on basic concepts).

## Add changes to the staging environment

```bash
git add file.txt        # add a specific file
git add folder/            # adds an entire folder
git add .                   # adds everything that has changed in the current folder and its subfolders
git add -p                  # Interactive mode: Choose exactly which blocks of lines to add
```

> **Note:** `git add .` also adds untracked files—make sure that `.gitignore` (see the relevant chapter) is up to date beforehand, so you don't accidentally add files that should never be included in the history (secrets, dependencies, generated files, etc.).

## Create a commit

```bash
git commit -m "Corrige le calcul de la remise"
git commit -am "Message"   # shortcut: automatically adds files that are already tracked AND have been modified, without needing to run "git add" first
```

> **Note:** `-a` (in `-am`) only adds files that are already tracked by Git—a brand-new file that has never been added before must always be explicitly `git add` at least once.

A good commit message explains **why** the change was made, not just what was changed (the diff already shows what changed)—which is helpful for understanding the history long after the fact.

## View history

```bash
git log                     # Complete history, from most recent to oldest
git log --oneline            # One line per commit, which makes it easier to read at a glance
git log --oneline --graph --all   # also displays the branches and their divergence/merge points
git log -p file.txt        # Detailed history (with diff) of a specific file
```

## See the differences

```bash
git diff                     # differences not yet added to the staging environment
git diff --staged             # changes already added to the staging environment but not yet committed
git diff commit1 commit2      # differences between two specific commits
```

## View the details of a commit

```bash
git show a3f9c1d   # displays the message, author, date, and full diff for this specific commit
```
