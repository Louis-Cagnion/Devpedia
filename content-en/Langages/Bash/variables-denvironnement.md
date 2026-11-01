---
order: 4
---

# Environment Variables

An environment variable is a variable automatically passed on to the processes a shell launches; unlike a regular Bash variable, which stays local to the script that declares it, unless explicitly **exported**.

## Local variable vs. exported variable

```bash
NAME="John"          # regular shell variable: visible only in this script/session
export NAME          # from now on, passed to child processes (other scripts, commands...)

export EMAIL="john@example.com"  # declaration and export in a single line
```

```bash
# subscript.sh
echo "$NAME"    # displays "John" if NAME was exported by the calling script, empty otherwise
```

> **Note:** exporting only works one way: from parent to child. A subscript that modifies an exported variable can't propagate that change back to the script that launched it: each process has its own copy of the environment.

## Common environment variables

```bash
echo $PATH    # list of folders where the shell looks for executable commands
echo $HOME    # current user's home folder
echo $USER    # current user's name
echo $PWD     # current working folder
echo $SHELL   # path to the shell being used
```

## `$PATH`: how the shell finds a command

When you type `ls`, the shell looks for an executable named `ls` in each of the folders listed in `$PATH`, separated by `:`:

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin

export PATH="$PATH:/my/scripts/folder"  # adds an extra folder to the search
```

> **Note:** order matters: the first folder in `$PATH` containing an executable with that name is the one used, which makes it possible, for instance, to have a custom version of a command take precedence over the system one.

## Shell configuration files

| File | Loaded when |
|---|---|
| `~/.bashrc` | Every new interactive (non-login) terminal |
| `~/.bash_profile` (or `~/.profile`) | On login (login shell) |
| `/etc/environment` | System-wide, for every user |

`~/.bashrc` is typically where `export PATH=...` lines, `alias`es, or custom variables meant to be available in every new terminal get added.

## `alias`: shortening frequent commands

```bash
alias ll="ls -la"
alias gs="git status"

ll   # equivalent to typing "ls -la"
```

An `alias` defined directly in the terminal doesn't survive closing the session: to have it available in every new terminal, it needs to be added to `~/.bashrc`.

## `source`: reloading a configuration file

After modifying `~/.bashrc`, `source` applies the changes in the current session, with no need to open a new terminal:

```bash
source ~/.bashrc
# equivalent, shorter:
. ~/.bashrc
```

## An exported variable only lives in its terminal

`export` passes a variable to the programs launched **from this shell**: not to another [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) opened beside it, which is another shell with its own environment. To check this, open two terminals:

```bash
# Terminal 1: exports a variable, then displays it between brackets
export MY_VAR=hello
echo "terminal 1: [$MY_VAR]"
```

```bash
# Terminal 2 (another window): the same variable does not exist here
echo "terminal 2: [$MY_VAR]"
```

```text
terminal 1: [hello]
terminal 2: []
```

For a variable to be present in every new terminal, it must be written in `~/.bashrc` (see above).

## An empty variable in an `rm -rf`

`rm -rf` deletes a folder and all its contents, with no trash and no confirmation. If the variable placed before the `/` is **empty** (never set, a typo in its name, a value not passed on), the shell replaces it with nothing: the command then targets the root of the system, `/`. Never run it to check that: `echo` shows what the shell has computed, without deleting anything.

```bash
# VAR is set but empty
VAR=""
# echo prints the command as the shell would build it, without running it
echo rm -rf $VAR/
# the brackets stay visible even when the value is empty
echo "[$VAR]"
# with a normal value, the command does target the intended folder
VAR=/tmp/test
echo rm -rf $VAR/
echo "[$VAR]"
```

```text
rm -rf /
[]
rm -rf /tmp/test/
[/tmp/test]
```

| Form | If `VAR` is empty |
|---|---|
| `rm -rf $VAR/` | Becomes `rm -rf /`: the root is targeted |
| `rm -rf "${VAR:?empty variable}/"` | Bash stops with the error `VAR: empty variable`, nothing is deleted |

Before any deletion, `echo "[$VAR]"` shows the value: `[]` gives away an empty variable, whereas a bare `echo $VAR` would only print a blank line, easy to miss.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | An environment variable is automatically passed to child processes, unlike a regular Bash variable; `export` moves it from one to the other, in only one direction (parent to child). |
| **Tools you can use** | `export`, `$PATH`, `~/.bashrc` (interactive terminal) vs. `~/.bash_profile` (login), `alias`, `source`. |
| **Pitfalls to avoid** | Modifying an exported variable in a subscript expecting it to propagate back to the calling script: each process has its own copy of the environment. Expecting another terminal to see a variable exported somewhere else. Writing `rm -rf $VAR/`: if `VAR` is empty, the command targets the root. |
| **Best practices** | Put the `export`/`alias` lines meant for every new terminal in `~/.bashrc`; use `source ~/.bashrc` to apply a change without reopening a terminal. Display `echo "[$VAR]"` before any deletion (the brackets reveal an empty value) and protect the variable with `"${VAR:?}"`. |
