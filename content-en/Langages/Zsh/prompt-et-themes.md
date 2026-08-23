---
order: 5
---

# Customizing the Prompt

[Bash](/?c=shells&s=bash&p=bash) builds its prompt via the `PS1` variable, with escape codes starting with `\` (`\u`, `\h`, `\w`...). Zsh uses its own variable, `PROMPT` (historical alias: `PS1`, still accepted), with escape codes starting with `%`, an entirely different syntax, not just a renaming.

## The `PROMPT` variable

```bash
PROMPT='%n@%m %~ %# '
```

| Code | Displays |
|---|---|
| `%n` | Current user's name |
| `%m` | Machine name (short) |
| `%~` | Current folder, with `~` if under the home folder (equivalent to Bash's `\w`) |
| `%#` | `#` if root, `%` otherwise (equivalent to Bash's `\$`) |
| `%*` | Current time (HH:MM:SS) |
| `%D` | Current date |

> **Note:** unlike Bash's `\w`, which already automatically abbreviates the path with `~`, zsh explicitly distinguishes `%~` (abbreviated) from `%/` (full path, never abbreviated), an explicit choice to make based on the desired behavior.

## Coloring the prompt

```bash
PROMPT='%F{green}%n@%m%f %F{blue}%~%f %# '
```

`%F{color}` starts a text color, `%f` closes it, the equivalent of ANSI escape sequences (`\e[32m`, see terminal concepts) but in a zsh-specific syntax, with no need to know the raw ANSI codes.

## `RPROMPT`: a secondary prompt on the right of the screen

With no Bash equivalent: zsh can display a second prompt, aligned to the terminal's right edge, which automatically disappears as soon as you start typing:

```bash
RPROMPT='%D{%H:%M:%S}'
# displays the current time on the right, as long as the command line is empty
```

## `vcs_info`: [Git](/?c=git&p=git) information built into the prompt

Zsh natively provides a function able to display the current Git branch in the prompt, with no external dependency:

```bash
autoload -Uz vcs_info
precmd() { vcs_info }
setopt PROMPT_SUBST
PROMPT='%n@%m %~ ${vcs_info_msg_0_} %# '
```

`PROMPT_SUBST` (see [The Options System](/?c=shells&s=zsh&p=options-du-shell)) allows variables and substitutions to be evaluated inside `PROMPT`: without this option, `${vcs_info_msg_0_}` would display literally rather than being replaced with the current branch.

> **Note:** this is exactly the mechanism (`vcs_info` + a custom prompt) that popular themes like *robbyrussell* ([Oh My Zsh](/?c=shells&s=zsh&p=oh-my-zsh)'s default theme) or [*powerlevel10k*](https://github.com/romkatv/powerlevel10k) automate and enhance.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Zsh builds its prompt via `PROMPT` (`%` codes), not `PS1`/`\` like Bash. `RPROMPT` displays a secondary prompt on the right, with no Bash equivalent. |
| **Tools you can use** | `%n`/`%m`/`%~`/`%#`, `%F{color}`/`%f`, `vcs_info` for the Git branch. |
| **Pitfalls to avoid** | Forgetting `setopt PROMPT_SUBST`: without it, a substitution like `${vcs_info_msg_0_}` displays literally instead of being evaluated. |
| **Best practices** | Use `vcs_info` to natively integrate the current Git branch, rather than an external script. |
