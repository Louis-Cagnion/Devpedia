---
order: 12
---

# Process Management

Every command launched in a terminal starts a **process**. Bash makes it possible to launch commands in the background, monitor running processes, and stop them cleanly (or not) when needed.

> The tools in this chapter display each process's **CPU** (*Central Processing Unit*) usage, as a percentage of one core. A value above 100% isn't therefore an anomaly: it means the process is using several cores in parallel.

## Foreground vs. background

By default, a command runs in the **foreground**: the terminal waits for it to finish before accepting a new command.

```bash
long_process.sh &   # the trailing '&' launches the command in the BACKGROUND
echo "The terminal is immediately available again"
```

## Managing background jobs (`jobs`, `fg`, `bg`)

```bash
long_process.sh &
jobs           # lists the current session's background jobs
fg %1          # brings job number 1 back to the foreground
# Ctrl+Z suspends a foreground job (without stopping it)
bg %1          # resumes a job suspended by Ctrl+Z, in the background
```

`fg` and `bg` are direct abbreviations of their English meaning: `fg` = *foreground*, `bg` = *background*: each brings or sends job `%1` to the corresponding plane. Many [Unix](/?c=shells&s=bash&p=scripts-et-shebang) commands and flags follow this same abbreviation pattern, which helps remember them once you know the source word: for example, in this chapter, `-f` (*full*/*format*, for `ps aux -f` or `pgrep -f`'s full pattern) or `-9` for `SIGKILL`. The signal table below spells out the meaning of each.

## Viewing running processes (`ps`, `top`)

```bash
ps aux             # lists every process on the system, with user, CPU, memory...
ps aux | grep php   # filters to show only processes related to "php"
top                 # interactive view, refreshed live, sorted by CPU usage by default
```

## Ending a process (`kill`)

`kill` sends a **signal** to a process, identified by its PID (*Process ID*):

```bash
kill 1234        # sends SIGTERM (15): politely asks the process to terminate cleanly
# sends SIGKILL (9): forces immediate termination, with no chance for the process to react
kill -9 1234
```

| Signal | Number | Effect |
|---|---|---|
| `SIGTERM` | 15 (default) | A clean shutdown request: the process can catch this signal to close cleanly (closing files, saving...) |
| `SIGKILL` | 9 | Immediate, unconditional termination, impossible to catch or ignore |
| `SIGINT` | 2 | Signal sent by `Ctrl+C` from the terminal |
| `SIGTSTP` | 20 | Signal sent by `Ctrl+Z`: suspends the process (controllable, unlike `SIGKILL`) without ending it |
| `SIGCONT` | 18 | Resumes execution of a process suspended by `SIGTSTP` (this is what `bg`/`fg` sends, see [How a Shell Works](/?c=shells&s=bash&p=architecture-dun-shell)) |

> **Note:** `kill -9` should remain a last resort: a process killed with `SIGKILL` has no chance to clean up after itself (temp files, open connections, locks...). Always try `kill` (SIGTERM) first.

## Catching a signal (`trap`)

`trap` lets a script run code in response to a received signal, instead of undergoing the default shutdown:

```bash
trap 'echo "Clean shutdown"; rm -f file.tmp' SIGTERM
```

An uncatchable signal like `SIGKILL` completely ignores `trap`, which is exactly why it remains the last resort mentioned above. To clean up temporary files reliably (the `EXIT` pseudo-signal, the difference between bash and zsh, `timeout`), see [A Script That Cleans Up and Stops Properly](/?c=langages&s=bash&p=fichiers-temporaires-trap-et-timeout).

## Deleting a Temporary File for Sure: `mktemp` and `trap`

A script that creates a temporary file must delete it **however it ends**: normal end, error, Ctrl-C, `kill`. [`mktemp`](https://www.gnu.org/software/coreutils/manual/html_node/mktemp-invocation.html) creates an empty file with a unique, unpredictable name (of the form `/tmp/tmp.7nzzmlI0bS`) and prints its path; `mktemp -d` creates a directory the same way.

```bash
tmp=$(mktemp) || exit 1   # file with a unique name; stop if it cannot be created
trap 'rm -f "$tmp"' EXIT  # delete on any exit of the script
trap 'exit 130' INT       # Ctrl-C: exit, which triggers the EXIT trap
trap 'exit 143' TERM      # SIGTERM (sent by kill): same
```

Codes 130 and 143 follow the "128 + signal number" convention (SIGINT is signal 2, SIGTERM is 15). Measured result: is the file created by `mktemp` deleted?

| Interpreter | End of the script | No `trap` | `EXIT` alone | `EXIT` + `INT` + `TERM` |
|---|---|---|---|---|
| Bash | normal | stays | deleted | deleted |
| Bash | Ctrl-C | stays | deleted | deleted |
| Bash | SIGTERM | stays | deleted | deleted |
| Zsh | normal | stays | deleted | deleted |
| Zsh | Ctrl-C | stays | **stays** | deleted |
| Zsh | SIGTERM | stays | **stays** | deleted |

Bash runs the `EXIT` trap even when a signal stops it; zsh does not. Writing all three `trap`s makes the script correct in both shells.

> **Pitfall:** a fixed name (`/tmp/my_script.tmp`). Two simultaneous runs trample each other, and another user of the machine who guesses the name can place a symbolic link there to a sensitive file, which the script will overwrite.
>
> **Best practice:** always `mktemp`, and set the `trap` before creating the file (with `tmp=` empty at the start: `rm -f ""` does nothing) so there is no window where a signal would leave the file behind.

> **Note:** a script started in the background by a non-interactive shell (`script.sh &`) has `SIGINT` ignored from the start, and a signal ignored on entry cannot be caught ([signals in Bash](https://www.gnu.org/software/bash/manual/bash.html#Signals)). Test the cleanup with Ctrl-C in a real terminal, or with `kill -TERM`. `SIGKILL` still cannot be caught: the file then stays in place.

## Limiting a Command's Duration: `timeout` and Ctrl-C

`timeout` (GNU coreutils) runs a command and stops it if it exceeds a duration:

```bash
timeout 30 ./processing.sh               # stopped after 30 s: exit code 124
timeout --foreground 30 ./processing.sh  # same, but Ctrl-C reaches it too
timeout -k 5 30 ./processing.sh          # SIGKILL 5 s after SIGTERM if needed: code 137
```

| Situation | `timeout` exit code |
|---|---|
| The command finishes in time | Its own |
| Time exceeded: SIGTERM sent | 124 |
| Time exceeded, SIGTERM ignored, then SIGKILL (`-k`) | 137 |

To be able to stop the command's whole descendance, `timeout` puts itself in its **own process group** (see [How a Shell Works](/?c=shells&s=bash&p=architecture-dun-shell)). Yet the terminal sends Ctrl-C (SIGINT) only to the **foreground** group: neither `timeout` nor the command receives it.

Measured on `timeout 20 sleep 8` run by a script, Ctrl-C typed 0.8 s after the start:

| Option | After Ctrl-C |
|---|---|
| None | Nothing stops: the script waits for `sleep` to end normally (7.2 s later) and carries on as if nothing had happened |
| `--foreground` | Immediate stop |

> **Pitfall:** `--foreground` no longer delegates the stop to a whole group: when the time is exceeded, the command's **children** are no longer stopped ([`timeout` manual](https://www.gnu.org/software/coreutils/manual/html_node/timeout-invocation.html)).
>
> **Best practice:** `--foreground` for a script that a human starts in a terminal and must be able to interrupt; without the option for a script with no terminal (scheduled task) that must cut the whole descendance when the time is exceeded.

## Detaching a process from the terminal (`nohup`)

A process launched in the background with `&` still receives a shutdown signal if the terminal that launched it closes. `nohup` (*no hang up*) protects it from that:

```bash
nohup long_process.sh &
# the process keeps running even after the terminal closes
# its standard output is redirected by default to a nohup.out file
```

## Finding a process's PID by its name

```bash
pgrep -f "long_process.sh"   # displays the PID(s) matching the given pattern
# finds AND terminates in a single command (sends SIGTERM by default)
pkill -f "long_process.sh"
```

> **`kill` vs. `pkill`**: `kill` needs an already-known **PID** (`kill 1234`): it's the only way to send a signal to a specific process with no risk of targeting the wrong one. `pkill` avoids having to look up that PID by hand: it sends the signal to any process whose name (or full command line with `-f`) matches the given pattern, which amounts to chaining `pgrep` then `kill` on each PID found. The risk with `pkill`, then, is targeting more processes than intended if the pattern is too broad (e.g. `pkill -f script.sh` on a machine where several scripts have "script.sh" in their name).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A trailing `&` launches a command in the background. `kill` sends a signal (SIGTERM by default, SIGKILL as a last resort); `trap` makes it possible to catch a signal for clean cleanup. `mktemp` creates a temporary file with a unique name; a `trap` on `EXIT`, `INT` and `TERM` deletes it however the script ends (`EXIT` alone is enough in Bash, not in zsh). `timeout` stops a command that runs too long (code 124), but Ctrl-C only reaches it with `--foreground`. |
| **Tools you can use** | `jobs`/`fg`/`bg`, `ps`/`top`, `pgrep`/`pkill`, `nohup`. |
| **Pitfalls to avoid** | Using `kill -9` (SIGKILL) as a reflex: the process then has no chance to clean up after itself. A fixed temporary file name. Relying on `trap … EXIT` alone in zsh. Testing the cleanup with Ctrl-C on a script started with `&`. Forgetting `--foreground` on an interactive script, or using it where the whole descendance must be cut. |
| **Best practices** | Always try `kill` (SIGTERM) before `kill -9`; check `pkill`'s pattern before running it, to avoid targeting more processes than intended. Set the `trap` before `mktemp` and write it on `EXIT`, `INT` and `TERM`; choose `--foreground` depending on whether the script is started by a human or by a scheduled task. |
