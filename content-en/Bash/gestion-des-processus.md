---
order: 11
---

# Process Management

Every command entered in a terminal starts a **process**. Bash allows you to run commands in the background, monitor running processes, and terminate them cleanly (or not) when necessary.

## Foreground vs. Background

By default, a command runs in **the foreground**: the terminal waits for it to finish before accepting a new command.

```bash
long_traitement.sh &   # The final '&' runs the command in the BACKGROUND
echo "Le terminal reste disponible immédiatement"
```

## Managing Background Tasks (`jobs`, `fg`, `bg`)

```bash
long_traitement.sh &
jobs           # lists the background tasks for the current session
fg %1          # brings task number 1 back to the foreground
# Ctrl+Z suspends a foreground task (without stopping it)
bg %1          # Resumes a task suspended with Ctrl+Z in the background
```

## View ongoing processes (`ps`, `top`)

```bash
ps aux             # lists all system processes, including user, CPU, memory, etc.
ps aux | grep php   # filter to show only processes related to "php"
top                 # Interactive view, refreshed in real time, sorted by CPU usage by default
```

## 

`kill` sends a **signal** to a process, identified by its PID (*Process ID*):

```bash
kill 1234        # sends SIGTERM (15): politely asks the process to terminate gracefully
kill -9 1234      # sends SIGKILL (9): forces the process to terminate immediately, without allowing it to respond
```

| Signal | Number | Effect |
|---|---|---|
| `SIGTERM` | 15 (default) | Request for graceful shutdown — the process can intercept this signal to shut down gracefully (close files, save data, etc.) |
| `SIGKILL` | 9 | Immediate and unconditional stop, impossible to intercept or ignore |
| `SIGINT` | 2 | Signal sent by `Ctrl+C` from the terminal |
| `SIGTSTP` | 20 | Signal sent by `Ctrl+Z`: suspends the process (which can be controlled, unlike `SIGKILL`) without terminating it |
| `SIGCONT` | 18 | Resumes the execution of a process suspended by `SIGTSTP` (this is what `bg` / `fg` sends; see the chapter on shell architecture) |

> **Note:** `kill -9` should be used only as a last resort—a process terminated with `SIGKILL` has no chance of cleaning up after itself (temporary files, open connections, locks, etc.). Always try `kill` (SIGTERM) first.

## 

A process started in the background with `&` will still receive a stop signal if the terminal that started it is closed. `nohup` (*no hang up*) prevents this from happening:

```bash
nohup long_traitement.sh &
# The process continues even after the terminal is shut down.
# Its standard output is redirected by default to a file named nohup.out
```

## Find a process's PID by its name

```bash
pgrep -f "long_traitement.sh"   # displays the PID(s) corresponding to the given pattern
pkill -f "long_traitement.sh"    # Finds AND terminates with a single command (sends SIGTERM by default)
```
