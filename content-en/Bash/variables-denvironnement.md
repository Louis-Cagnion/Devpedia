---
order: 3
---

# Environment Variables

An environment variable is a variable that is automatically passed to processes launched by a shell—unlike a standard Bash variable, which remains local to the script that declares it, unless it is explicitly **exported**.

## Local Variable vs. Exported Variable

```bash
NAME="Jean"          # Standard shell variable: visible only in this script/session
export NAME          # from now on, passed to child processes (other scripts, commands, etc.)

export EMAIL="jean@exemple.com"  # Declaration and export in a single line
```

```bash
# sous_script.sh
echo "$NAME"    # Returns "Jean" if NAME was exported by the calling script; otherwise, returns an empty string
```

> **Note:** Exporting works only in one direction: from parent to child. A child script that modifies an exported variable cannot propagate that change back to the script that launched it—each process has its own copy of the environment.

## Common Environment Variables

```bash
echo $PATH    # list of directories where the shell looks for executable commands
echo $HOME    # current user's home directory
echo $USER    # current username
echo $PWD     # current work folder
echo $SHELL   # path to the shell being used
```

## `$PATH` : How the shell finds a command

When you type `ls`, the shell searches for an executable named `ls` in each of the directories listed in `$PATH`, separated by `:`:

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin

export PATH="$PATH:/mon/dossier/scripts"  # Add an additional folder to the search
```

> **Note:** Order matters—the first directory on the `$PATH` containing an executable with that name is used, which allows you, for example, to run a custom version of a command before the system version.

## Shell Configuration Files

| File | Uploaded on |
|---|---|
| `~/.bashrc` | For each new interactive terminal (no login required) |
| `~/.bash_profile` (or `~/.profile`) | Upon login (shell login) |
| `/etc/environment` | System-wide, for all users |

`export PATH=...`, `alias`, or custom variables intended to be available in every new terminal are typically added to `~/.bashrc`.

## `alias` : Shorten frequently used commands

```bash
alias ll="ls -la"
alias gs="git status"

ll   # equivalent to typing "ls -la"
```

A `alias` defined directly in the terminal does not persist after the session is closed—to make it available in every new terminal, it must be added to `~/.bashrc`.

## `source` : Reload a configuration file

After modifying `~/.bashrc`, `source` applies the changes to the current session without requiring you to open a new terminal:

```bash
source ~/.bashrc
# equivalent, shorter version:
. ~/.bashrc
```
