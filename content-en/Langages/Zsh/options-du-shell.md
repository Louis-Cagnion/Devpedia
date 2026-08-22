---
order: 2
---

# The Options System (`setopt`)

Bash enables optional behaviors case by case (`shopt -s name`, `set -o name`, each with its own command). Zsh centralizes this into a single, coherent mechanism: `setopt`/`unsetopt`, with dozens of named options that change the shell's behavior.

## Enabling and disabling an option

```bash
setopt AUTO_CD          # enables an option
unsetopt AUTO_CD         # disables it

setopt                   # lists every currently active option
```

> **Note:** option names are case- and underscore-insensitive: `AUTO_CD`, `autocd`, and `auto_cd` refer to the same option. The `UPPERCASE_WITH_UNDERSCORES` convention is the most readable and the most common in `.zshrc` files found online.

## A few options useful day to day

```bash
setopt AUTO_CD           # typing a folder name alone (with no "cd") moves into it directly
setopt EXTENDED_GLOB      # enables extended globbing (see Advanced Expansion and Wildcards)
setopt SHARE_HISTORY       # shares command history live across all open terminals
setopt HIST_IGNORE_DUPS    # doesn't log a command identical to the previous one in history
setopt CORRECT             # suggests a correction if a typed command doesn't exist ("did you mean...")
```

| Option | Effect |
|---|---|
| `AUTO_CD` | `folder_name` alone is equivalent to `cd folder_name` |
| `EXTENDED_GLOB` | enables extended globbing patterns (see [Advanced Expansion and Wildcards](/?c=shells&s=zsh&p=expansion-et-jokers-avances)) |
| `SHARE_HISTORY` | history shared live across simultaneously open terminals |
| `HIST_IGNORE_DUPS` | no consecutive duplicate in history |
| `CORRECT` | suggests a spelling correction for a command |
| `NO_CASE_GLOB` | globbing (`*.txt`) becomes case-insensitive |

## `setopt` vs. `shopt`/`set -o`: not just a different name

Unlike Bash, where options are split between `shopt` (Bash-specific options) and `set -o` (shared POSIX options), zsh groups everything under `setopt`/`unsetopt`, with a list of several hundred options covering aspects Bash doesn't make configurable at all (globbing behavior, history, completion...).

> **Note:** these options are typically placed in `~/.zshrc` (see [Startup Files](/?c=shells&s=zsh&p=fichiers-de-demarrage)) to be active in every new terminal, exactly like a `shopt -s` would be placed in `~/.bashrc`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Zsh groups all its behavior options under a single mechanism (`setopt`/`unsetopt`), where Bash splits them between `shopt` and `set -o`. |
| **Tools you can use** | `setopt`/`unsetopt`, `AUTO_CD`, `EXTENDED_GLOB`, `SHARE_HISTORY`, `CORRECT`. |
| **Pitfalls to avoid** | Looking for a Bash equivalent option one by one: zsh often covers aspects Bash doesn't make configurable at all. |
| **Best practices** | Put `setopt` lines in `~/.zshrc` so they're active in every new terminal. |
