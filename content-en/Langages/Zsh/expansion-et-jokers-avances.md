---
order: 3
---

# Advanced Expansion and Wildcards

Basic globbing (`*`, `?`, `[abc]`) works identically in zsh (see [Expansion and Wildcards](/?c=shells&s=bash&p=expansion-et-jokers) in [Bash](/?c=shells&s=bash&p=bash)). Zsh goes noticeably further once extended mode is enabled, with patterns Bash simply doesn't understand.

## Enabling extended globbing

```bash
setopt EXTENDED_GLOB
```

Without this option (see [The Options System](/?c=shells&s=zsh&p=options-du-shell)), this chapter's patterns aren't recognized and are treated as literal text.

## `**`: recursive search across subfolders

```bash
ls **/*.txt
# every .txt file, at any depth below the current folder
```

> **Note:** in Bash, this recursive behavior requires `shopt -s globstar` (an equivalent option, but absent by default and specific to Bash 4+); in zsh, `**` works as soon as `EXTENDED_GLOB` is active (or even without it, `**` alone is active by default in most recent configurations), with no extra setting.

## Negation: excluding a pattern

```bash
ls *.^txt
# every file EXCEPT those ending in .txt (Bash has no direct equivalent)
```

## Glob qualifiers: filtering by type or metadata

In parentheses after a pattern, a **qualifier** filters the results without going through a separate command like `find`:

```bash
ls *(.)          # regular files only (not folders, not links)
ls *(/)           # folders only
ls *(*)           # executable files only
ls *(.om[1])       # the most recently modified regular file (sorted by date, take the 1st)
ls *.log(.Lm-7)     # .log files modified less than 7 days ago
```

| Qualifier | Filters on... |
|---|---|
| `.` | Regular files only |
| `/` | Folders only |
| `*` | Executable files |
| `@` | Symbolic links |
| `Lm-N` / `Lm+N` | Modified less than / more than N days ago |
| `om[N]` | Sorts by modification date, keeps the Nth result |

> **Note:** for many simple cases, these qualifiers replace a `find . -type f` or a `find . -mtime -7` (see [Permissions and File Manipulation](/?c=shells&s=bash&p=permissions-et-fichiers) in Bash), directly in the glob pattern, with no external command launched.

## Combining extended globbing and quotes

Like in Bash, wrapping a pattern in quotes disables its interpretation (see [Variables](/?c=shells&s=bash&p=variables) in Bash for the single/double quote logic):

```bash
echo *(.)      # actual list of regular files
echo "*(.)"     # literally displays *(.)
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Basic globbing works like in Bash; `EXTENDED_GLOB` unlocks zsh-specific patterns (recursive `**`, `^` negation, qualifiers in parentheses). |
| **Tools you can use** | `**/*.ext` (recursive), `*.^txt` (negation), glob qualifiers (`.`, `/`, `*`, `Lm-N`). |
| **Pitfalls to avoid** | Using these patterns without having enabled `EXTENDED_GLOB`: they're then treated as literal text. |
| **Best practices** | Use a glob qualifier (`*(.Lm-7)`) rather than an external `find` for a simple filter. |
