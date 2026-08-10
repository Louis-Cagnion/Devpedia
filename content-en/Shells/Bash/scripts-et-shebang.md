---
order: 2
---

# Writing and Running a Bash Script

A Bash script is a plain text file containing a sequence of commands, run in order as if they'd been typed one by one in the terminal.

> What is **Unix**? Originally, an operating system created in the 1970s, whose principles (everything is a file, small specialized tools combined via pipes, a command-line shell to drive it all) were later copied or reimplemented by many systems — Linux and macOS are today its most common descendants. When a chapter says "on Unix" or "a Unix system", it's talking about this family of systems and their shared conventions, as opposed to Windows, for instance.

## The shebang

A script's first line tells the system which interpreter to use to run it:

```bash
#!/bin/bash

echo "Hello"
```

`#!/bin/bash` (the "shebang") isn't an ordinary comment despite the `#`: the operating system reads it specifically to know which program to launch to interpret the rest of the file — see [how the kernel actually detects it](/?c=shells&s=bash&p=architecture-dun-shell) for what happens at the system level.

> **Pitfall:** the shebang must be the very first characters of the file, with no exception — not even a blank line before it. The kernel only checks the first two bytes (`#!`); a blank line above, and it no longer recognizes them as a shebang at all.
>
> **Best practice:** always have an executable script start directly with `#!...`, never with a comment or a blank line above it.

## `sh` vs. `bash`

**POSIX** (*Portable Operating System Interface*) is a standard that defines, among other things, a minimal standard behavior for a shell — a set of features that any "POSIX-compliant" shell must implement, so the same script runs identically on any Unix system, whatever shell is actually installed behind `/bin/sh`.

`sh` therefore refers less to a specific program than to a **standard**: on most systems, `/bin/sh` is actually a link to another shell (often `dash` on Debian/Ubuntu, sometimes `bash` itself on macOS or in "POSIX compatibility" mode) which behaves in a more restricted way when invoked under that name. `bash` (*Bourne Again SHell*) is a concrete shell, which follows POSIX but adds many extensions of its own (`[[ ]]`, arrays, `{1..5}`, `local`...) that don't work if the script is run with a strictly POSIX `sh`.

```bash
#!/bin/bash
echo "Bash-only compatible"
```

```bash
#!/bin/sh
echo "Portable to any POSIX shell (dash, bash in sh mode, etc.)"
```

In practice: use `#!/bin/bash` (and run it with `bash`) as soon as the script uses a Bash extension, which is the case for most scripts on this site; reserve `#!/bin/sh` for scripts deliberately limited to basic POSIX features, for instance a system script meant to work even on a machine where `bash` isn't installed.

> **Pitfall:** writing `#!/bin/sh` then using a Bash-specific extension (arrays, `[[ ]]`, `local`...). The script still works when tested if `/bin/sh` points to `bash` on the development machine — and fails silently or loudly on another system where `/bin/sh` is a stricter shell (often `dash`).
>
> **Best practice:** match the shebang to what the script actually uses — `#!/bin/bash` as soon as a single Bash extension appears, rather than discovering it in production.

## Making a script executable

```bash
chmod +x script.sh   # adds execute permission (see Permissions and File Manipulation)
./script.sh            # runs the script (the "./" is needed if the current folder isn't in $PATH)
```

An alternative with no need for `chmod +x`: explicitly launch the interpreter on the file:

```bash
bash script.sh
```

> **Pitfall:** typing `script.sh` alone, with no `./` in front, even after `chmod +x`. Bash never searches the current folder by default (see the [chapter on basic commands](/?c=shells&s=bash&p=commandes-de-base)) — with no path prefix, it only finds the script if its folder is part of `$PATH`, which is almost never the case for a project folder.
>
> **Best practice:** always prefix running a local script with `./`, rather than wondering why "the command doesn't exist".

## A script's arguments

```bash
#!/bin/bash
echo "Script: $0"
echo "First argument: $1"
echo "All arguments: $@"
echo "Number of arguments: $#"
```

```bash
./script.sh alice bob
# Script: ./script.sh
# First argument: alice
# All arguments: alice bob
# Number of arguments: 2
```

`$0`, `$1`, `$@`, and `$#` are part of a broader set of **special variables**, all automatically readable by Bash without ever being explicitly assigned:

| Variable | Content |
|---|---|
| `$0` | Name of the currently running script |
| `$1`, `$2`, ... | Positional arguments passed to the script/function |
| `$@` | All arguments, each as a separate word |
| `$*` | All arguments, merged into **one single** string |
| `$#` | Number of arguments received |
| `$?` | Exit code of the last command run (`0` = success) |
| `$$` | PID of the currently running script |

> **Common pitfall: `$@` and `$*` behave differently once quoted.** Unquoted, both behave the same. Quoted (`"$@"` vs. `"$*"`), they diverge: `"$@"` expands each argument as a **separate** word (`"alice" "bob"`), while `"$*"` merges them into **one** word (`"alice bob"`). To pass arguments through as-is to another command (e.g. `command "$@"`), `"$@"` is almost always the right choice — see [the precise order of expansions](/?c=shells&s=bash&p=architecture-dun-shell) for what explains this difference (word splitting, quoting).

`$?` and `$$` are detailed further in this chapter and in the one on process management; see also the chapter on variables for their use inside a function.

## Exit codes (`exit`)

Every command, and therefore every script, ends with an **exit code**: `0` means success, any other value (1 to 255) means a failure, whose precise meaning depends on the program:

```bash
#!/bin/bash

if [ ! -f "config.txt" ]; then
    echo "Error: config file missing" >&2   # >&2: sends this message to standard error (stderr)
    exit 1
fi

echo "Everything is ready"
exit 0
```

> `>&2` redirects to standard error (*stderr*) rather than standard output (*stdout*) — see [Redirections and Pipes](/?c=shells&s=bash&p=redirections-et-pipes) for what these streams are and how to redirect them in detail.

The calling script (or command) can check this code via `$?`:

```bash
./script.sh
if [ $? -eq 0 ]; then
    echo "The script succeeded"
fi

# equivalent shortcut, more idiomatic:
./script.sh && echo "The script succeeded"
./script.sh || echo "The script failed"
```

`&&` only runs the next command if the previous one succeeded (code `0`); `||` only if it failed.

> **Pitfall:** a script with no explicit `exit` ends with the exit code of its **last command** — not necessarily `0`, and not necessarily what was intended. A script that "overall" succeeds but whose very last line is an `echo` (which almost always succeeds) thus masks a failure that happened earlier.
>
> **Best practice:** end a script with an explicit `exit` (`exit 0` on success, a different code otherwise) rather than letting the exit code implicitly depend on the last command.

## Stopping a script on the first error: `set -e`

By default, Bash keeps running subsequent lines even if a command fails — often undesirable in an automation script:

```bash
#!/bin/bash
set -e   # immediately stops the script if a command fails (non-zero exit code)

cd /nonexistent/folder   # if this folder doesn't exist, the script stops here
echo "This line never runs if cd failed"
```

Other options strengthen a script's robustness, often combined:

```bash
#!/bin/bash
set -euo pipefail
# -e: stop on the first error
# -u: error if an undefined variable is used
# -o pipefail: a pipe fails if ANY of its commands fails (not just the last one)
```

A concrete case where `set -e` doesn't trigger, despite an actual failure:

```bash
set -e
failing_command | grep "pattern"   # fails, but set -e does NOT stop here without pipefail: only grep counts
```

> **Pitfall:** `set -e` doesn't cover everything you might expect. A failing command **stops nothing** if it's tested by an `if`, combined with `&&`/`||`, or if it isn't the last one in a pipeline (with no `pipefail`, as in the example above) — in these three cases, Bash considers the failure "expected and already handled", so `set -e` doesn't trigger.
>
> **Best practice:** never rely on `set -e` alone for a command inside a pipeline, an `if`, or before `&&`/`||` — explicitly check `$?` in these specific cases if the failure should actually stop the script.

See also the chapter on process management for what happens after launching a script in the background.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | The shebang tells the system which interpreter runs the script. `chmod +x` + `./script.sh` or `bash script.sh` launches it. `$1`, `$@`, `$#`... give access to its arguments. Every script ends with an exit code (`0` = success), readable via `$?`. |
| **Tools you can use** | `set -euo pipefail` at the top of a script to stop on the first error rather than continuing on an inconsistent state. |
| **Pitfalls to avoid** | Confusing `$@` and `$*` once quoted (see above). Writing `#!/bin/sh` then using a Bash extension (arrays, `[[ ]]`...): the script fails on any system where `/bin/sh` isn't `bash`. |
| **Best practices** | Always check `$?` (or use `&&`/`\|\|`) after a command whose failure should change the script's behavior, rather than assuming it succeeded. |
