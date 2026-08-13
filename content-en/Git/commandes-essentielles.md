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

Shows which files have been modified, which are in the staging area, and which are not tracked (see [Git Basics](/?c=git&p=concepts-de-base)).

## Add changes to staging

```bash
git add file.txt        # Adds a specific file
git add folder/            # adds an entire folder
git add .                   # Adds everything that has changed in the current folder and its subfolders
git add -p                  # Interactive mode: Choose exactly which blocks of lines to add
```

> **Note:** `git add .` also adds files that are not tracked: make sure that `[.gitignore](/?c=git&p=gitignore)` is up to date beforehand, so you don't accidentally add files that should never be included in the commit history (secrets, dependencies, generated files, etc.).

## Create a commit

```bash
git commit -m "Corrects the discount calculation"
git commit -am "Message"   # Shortcut: Automatically adds files that are already tracked AND have been modified, without needing to run "git add" first
```

> **Note:** `-a` (in `-am`) only adds files already tracked by Git: a brand-new file that has never been added before must always be explicitly added with `git add` at least once.

A good commit message explains the **reason** for the change, not just what was changed (the diff already shows what changed), which is helpful for understanding the history long after the fact.

## A commit message has two levels: title and description

To Git, a commit message is just a single block of text: nothing forces it into a distinct "title" and "description". It's a **convention**, not a technical constraint, but one so widely adopted ([GitHub](/?c=git&p=github-et-plateformes), `git log`, most tools that display a history) that it's worth following consistently:

- The **first line** is the title: a short summary (traditionally under 50-72 characters), written in the imperative ("Fix", "Add", not "Fixed" or "Added").
- A **blank line** separates the title from the rest.
- Everything that follows is the **description**: the detail, the context, the "why" spelled out, over as many lines as needed.

```text
Fix the discount calculation for multi-item orders

The percentage was only applied to the order's first item instead
of the total: a bug introduced during the last refactor of
`calculateDiscount()`, never caught by the existing tests.
```

It's this blank line, and only this blank line, that tells a tool like [GitHub](/?c=git&p=github-et-plateformes) where the title ends: in a repository's or pull request's commit list, only the first line is shown by default (in bold); the description only shows up once the commit is expanded. `git log --oneline` does the same thing: one line per commit, title only.

## Writing a multi-line message from the command line

`git commit -m "message"` with a single `-m` only produces a title, with no description. Three ways to get both:

```bash
# 1. Without -m: opens your configured editor (vim, nano...), where you type title, blank line, then description
git commit

# 2. Multiple -m: each becomes a separate paragraph divided by a blank line, without opening an editor
git commit -m "Fix the discount calculation" -m "The percentage was only applied to the first item, not the total."

# 3. A multi-line string passed to a single -m (useful for scripting a commit, or from a tool that generates the message)
git commit -m "$(cat <<'EOF'
Fix the discount calculation

The percentage was only applied to the first item, not the total.
EOF
)"
```

> **Note:** option 3 (`$(cat <<'EOF' ... EOF)`) isn't a Git feature: it's a **heredoc**, a shell syntax (see [Writing and Running a Bash Script](/?c=shells&s=bash&p=scripts-et-shebang)) that builds a multi-line string, then passed as-is to `-m`. `$(...)` captures the output of the `cat` command (here, everything between the two `EOF`) to inject it as a single argument.

> **Pitfall:** writing an overly long commit title, or one that describes the *how* rather than the *why* ("Change line 42 of cart.php"). A title should stay understandable on its own, sitting among dozens of other titles in a list, without needing to open the commit to understand what it does.
>
> **Best practice:** reserve the title for a brief, actionable summary, and put any useful context (why this change, which bug, which alternative was ruled out) in the description rather than stretching the title indefinitely.

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
| **Key Points** | `git init` / `clone` create or retrieve a repository; `git add` stage changes; `git commit` commit them; `git log` / `diff` / `show` view the history. A commit message has a title (first line) and an optional description, separated by a blank line: it's this blank line that GitHub and `git log` use to display only the title by default. |
| **Tools available** | `git status`, `git add`, `git commit` (multiple `-m`, or without `-m` for the editor), `git log`, `git diff`, `git show`. |
| **Pitfalls to Avoid** | `git add .` also adds untracked files: check `.gitignore` first; `-am` does not add files that have never been tracked, an explicit `git add` is still required at least once; an overly long commit title, or one that describes the *how* rather than the *why*. |
| **Best Practices** | Describe the *reason* for the change in the commit message, not just the *change itself*; check `git status` before each commit; keep the title short and actionable, put context in the description. |
