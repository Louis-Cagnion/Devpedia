# Zsh

Zsh (*Z shell*) is, like Bash, a [POSIX](/?c=shells&s=bash&p=scripts-et-shebang)-compatible shell — nearly everything covered in the Bash section (variables, conditions, loops, functions, redirections and pipes, permissions and files, process management, text processing) works **identically** in zsh, syntax included. It's also the default shell on macOS since 2019, and a common choice on Linux for its interactive-use comfort.

> **What's covered here:** only what actually differs from Bash or doesn't exist on the Bash side at all — startup files, the options system (`setopt`), extended globbing, advanced completion, prompt customization, and the **Oh My Zsh** framework. For everything else (variables, conditions, loops, functions, redirections, permissions, processes, text processing), the Bash section's chapters apply directly.

## How zsh concretely differs from Bash

Zsh adds, on top of the POSIX foundation (shared with Bash), several layers of comfort geared toward **interactive** use rather than pure scripting:

- noticeably richer tab completion (navigable menus, per-command contextual completion);
- more powerful globbing, enabled with `setopt extendedglob`;
- a prompt customization system independent from Bash's (`PROMPT` rather than `PS1`, with its own escape codes);
- a system of named options (`setopt`/`unsetopt`) more readable than Bash's ad hoc options (`shopt`, `set -o`);
- an ecosystem of configuration frameworks, of which **Oh My Zsh** is the most widespread.

You'll find the different chapters below:
