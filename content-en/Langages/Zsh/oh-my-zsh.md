---
order: 6
---

# Oh My Zsh

Manually configuring [the prompt](/?c=shells&s=zsh&p=prompt-et-themes), [completion](/?c=shells&s=zsh&p=completion-avancee), and [dozens of options](/?c=shells&s=zsh&p=options-du-shell) takes time. **Oh My Zsh** is an open-source framework that provides all of this preconfigured, with hundreds of ready-to-use themes and plugins, the most common way to get a comfortable `~/.zshrc` without writing everything yourself.

## Installation

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

The installer backs up the previous `~/.zshrc` (to `~/.zshrc.pre-oh-my-zsh`), installs Oh My Zsh into `~/.oh-my-zsh/`, and generates a new `~/.zshrc` that loads it.

## The structure of a `.zshrc` with Oh My Zsh

```bash
export ZSH="$HOME/.oh-my-zsh"

ZSH_THEME="robbyrussell"

plugins=(git zsh-autosuggestions zsh-syntax-highlighting)

source $ZSH/oh-my-zsh.sh
```

- `ZSH_THEME` selects a theme among those provided (in `~/.oh-my-zsh/themes/`): it configures `PROMPT`/`RPROMPT` for you (see [Customizing the Prompt](/?c=shells&s=zsh&p=prompt-et-themes)), no need to redefine them yourself on top of it.
- `plugins=(...)` enables a list of plugins, each adding specific aliases, functions, or completions.
- `source $ZSH/oh-my-zsh.sh` must stay the **last** relevant line: it's this line that actually loads the theme and plugins declared above.

## A few common plugins

| Plugin | Adds |
|---|---|
| `git` | Dozens of [Git](/?c=git&p=git) aliases (`gst` = `git status`, `gco` = `git checkout`...) and the current branch name in the prompt via `vcs_info` |
| `zsh-autosuggestions` | Suggests, grayed out, the end of a command already typed in the past, confirmed with → |
| `zsh-syntax-highlighting` | Colors the command line in real time (green = valid command, red = invalid) even before running it |
| `docker`, `npm`, `python`... | Completion and aliases specific to the corresponding tool |

> **Note:** `zsh-autosuggestions` and `zsh-syntax-highlighting` are **not** included by default with Oh My Zsh (unlike `git`): they're installed separately into `~/.oh-my-zsh/custom/plugins/` before they can be added to the `plugins=(...)` list.

## Aliases provided by the `git` plugin

```bash
gst    # git status
gco    # git checkout
gaa    # git add --all
gcmsg  # git commit -m
gp     # git push
```

These aliases (see [Environment Variables](/?c=shells&s=bash&p=variables-denvironnement) in [Bash](/?c=shells&s=bash&p=bash) for the `alias` mechanism itself, identical in zsh) are defined by the plugin, not by zsh or Oh My Zsh themselves; their full list depends on the installed plugin version.

## Customizing without touching Oh My Zsh's core

```bash
# ~/.oh-my-zsh/custom/my-aliases.zsh
alias myalias="my_command --with --options"
```

Any `.zsh` file dropped into `~/.oh-my-zsh/custom/` is automatically loaded, which avoids modifying the framework's internal files (which would be overwritten on the next update) to add your own aliases or functions.

## Updating Oh My Zsh

```bash
omz update
```

Since Oh My Zsh updates itself via its own internal Git repository (`~/.oh-my-zsh/` is a Git clone), this command does the equivalent of a `git pull` on it, with nothing to worry about manually.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Oh My Zsh preconfigures prompt, completion, and options via a framework of themes and plugins, rather than setting everything up manually. |
| **Tools you can use** | `ZSH_THEME`, `plugins=(...)`, `~/.oh-my-zsh/custom/` to customize without touching the framework's core, `omz update`. |
| **Pitfalls to avoid** | Directly modifying Oh My Zsh's internal files, overwritten on the next update. |
| **Best practices** | Drop your own aliases/functions into `~/.oh-my-zsh/custom/`; keep `source $ZSH/oh-my-zsh.sh` as the last relevant line of the `.zshrc`. |
