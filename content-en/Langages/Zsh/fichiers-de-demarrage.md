---
order: 1
---

# Startup Files

[Bash](/?c=shells&s=bash&p=bash) loads `~/.bashrc`, `~/.bash_profile`, or `~/.profile` depending on the case (see [Environment Variables](/?c=shells&s=bash&p=variables-denvironnement) in Bash). Zsh splits this same need into **four distinct files**, each with a precise role: understanding this distinction avoids the classic surprise ("my variable isn't visible in my script even though it works in my terminal").

## The four files, and when each one loads

| File | Loaded for... |
|---|---|
| `~/.zshenv` | **Every** zsh invocation, including non-interactive scripts and [subshells](/?c=shells&s=bash&p=architecture-dun-shell) (the same as what `~/.bashrc`'s behavior would be if Bash loaded it systematically, which it doesn't) |
| `~/.zprofile` | Only a login shell, the equivalent of `~/.bash_profile` |
| `~/.zshrc` | Only an interactive shell, the equivalent of `~/.bashrc`, the most frequently edited file in practice (aliases, `PROMPT`, [Oh My Zsh](/?c=shells&s=zsh&p=oh-my-zsh) plugins) |
| `~/.zlogin` | Only a login shell, **after** `~/.zshrc`; rarely used, for commands that need to run once the interactive environment is ready |

> **Note:** unlike Bash, where the exact loading order depending on "login" or "non-login" is a recurring source of confusion, zsh always loads in the same fixed order: `.zshenv` → `.zprofile` (if login) → `.zshrc` (if interactive) → `.zlogin` (if login). It's predictable, regardless of the invocation context.

## Where to put what

```bash
# ~/.zshenv: variables needed even in a non-interactive script
export EDITOR="vim"

# ~/.zshrc: anything that only makes sense interactively
alias ll="ls -la"
export PROMPT='%n@%m %~ %# '
```

> **Note:** `~/.zshenv` is loaded even by tools that invoke zsh behind the scenes (scripts, some window managers): putting slow commands or ones that print something in it can slow down or disrupt programs that don't expect an interactive shell. Reserve `~/.zshenv` for the strict essentials (environment variables), and put the rest in `~/.zshrc`.

## Reloading without opening a new terminal

Like `source ~/.bashrc` in Bash:

```bash
source ~/.zshrc
# equivalent, shorter:
. ~/.zshrc
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Zsh always loads in the same fixed order: `.zshenv` → `.zprofile` (login) → `.zshrc` (interactive) → `.zlogin` (login), more predictable than Bash's login/non-login logic. |
| **Tools you can use** | `~/.zshenv` (every invocation), `~/.zshrc` (interactive, the most edited in practice), `source`/`.`. |
| **Pitfalls to avoid** | Putting a slow command or one that prints something in `~/.zshenv`: it's loaded even by tools that invoke zsh behind the scenes. |
| **Best practices** | Reserve `~/.zshenv` for strictly necessary environment variables; put aliases, `PROMPT`, and plugins in `~/.zshrc`. |
