---
order: 4
---

# Advanced Completion

Bash completes file names and, for some commands, offers a flat list via the Tab key. Zsh's completion system (`compsys`) is a full-fledged engine, aware of **context**: it knows that after `git checkout` it should offer branch names, and that after `kill`, PIDs of running processes — not just file names.

## Enabling the completion system

```bash
autoload -Uz compinit
compinit
```

These two lines, placed in `~/.zshrc` (see [Startup Files](/?c=shells&s=zsh&p=fichiers-de-demarrage)), load `compsys`. Without them, zsh is limited to basic completion close to Bash's.

> **Note:** `compinit` rebuilds a cache of completion definitions on every launch, which can noticeably slow down opening a new terminal — hence the common use of `compinit -C` (skips the cache re-check) once the configuration has stabilized, or a call conditioned on the cache's date.

## What this actually changes

```bash
git checkout <Tab>        # offers local branches, not the folder's files
kill -9 <Tab>              # offers PIDs of running processes, with their name
ssh <Tab>                  # offers known hosts (~/.ssh/config, ~/.ssh/known_hosts)
```

Without `compsys`, each of these commands would just complete file names from the current folder — rarely what you want in these specific cases.

## The navigable completion menu

When several results are possible, zsh can display a navigable **menu** using the arrow keys rather than just listing the possibilities:

```bash
zstyle ':completion:*' menu select
```

Once this line is added to `~/.zshrc`, pressing Tab with several possible results opens a menu where the arrow keys move the selection, and Enter confirms it — faster than retyping characters to disambiguate.

## Case-insensitive completion

```bash
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'
```

Lets you type `desk<Tab>` and complete to `Desktop` despite the capital letter — useful in particular on macOS/Windows, where file name casing is less strictly enforced than in Bash on Linux.

## `zstyle`: the configuration mechanism behind all this

The examples above use `zstyle`, `compsys`'s generic configuration command — each rule maps a context (`':completion:*'` = everywhere) to a behavior. This is a zsh-specific mechanism, with no direct Bash equivalent, whose completion doesn't expose this level of customization.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `compsys` is a context-aware completion engine — after `git checkout`, it offers branches, not file names. It must be explicitly enabled (`compinit`). |
| **Tools you can use** | `autoload -Uz compinit`/`compinit`, `zstyle` to customize (navigable menu, case insensitivity). |
| **Pitfalls to avoid** | `compinit` rebuilds its cache on every launch — can noticeably slow down opening a terminal. |
| **Best practices** | Use `compinit -C` once the configuration has stabilized, to avoid systematically re-checking the cache. |
