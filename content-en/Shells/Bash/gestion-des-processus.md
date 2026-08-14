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
kill -9 1234      # sends SIGKILL (9): forces immediate termination, with no chance for the process to react
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

An uncatchable signal like `SIGKILL` completely ignores `trap`, which is exactly why it remains the last resort mentioned above.

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
pkill -f "long_process.sh"    # finds AND terminates in a single command (sends SIGTERM by default)
```

> **`kill` vs. `pkill`**: `kill` needs an already-known **PID** (`kill 1234`): it's the only way to send a signal to a specific process with no risk of targeting the wrong one. `pkill` avoids having to look up that PID by hand: it sends the signal to any process whose name (or full command line with `-f`) matches the given pattern, which amounts to chaining `pgrep` then `kill` on each PID found. The risk with `pkill`, then, is targeting more processes than intended if the pattern is too broad (e.g. `pkill -f script.sh` on a machine where several scripts have "script.sh" in their name).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A trailing `&` launches a command in the background. `kill` sends a signal (SIGTERM by default, SIGKILL as a last resort); `trap` makes it possible to catch a signal for clean cleanup. |
| **Tools you can use** | `jobs`/`fg`/`bg`, `ps`/`top`, `pgrep`/`pkill`, `nohup`. |
| **Pitfalls to avoid** | Using `kill -9` (SIGKILL) as a reflex: the process then has no chance to clean up after itself. |
| **Best practices** | Always try `kill` (SIGTERM) before `kill -9`; check `pkill`'s pattern before running it, to avoid targeting more processes than intended. |
