---
order: 15
---

# A Script That Cleans Up and Stops Properly: `mktemp`, `trap` and `timeout`

A short script just chains commands. A script that creates files, launches long commands and can be interrupted must also **leave nothing behind** and **never wait forever**. This chapter follows a real case: the script that runs the Skyscraper solver on ten grids, prints their times and can be stopped from the keyboard.

| Problem | What happens | Tool |
|---|---|---|
| A temporary file stays after an error or a Ctrl-C | `/tmp` fills up, data lingers | `mktemp` and `trap ... EXIT` |
| The script is interrupted before its cleanup | The cleanup never happens | `trap ... INT TERM` |
| A command never finishes | The script stays blocked | `timeout` |
| Error messages get mixed into the output | Lines are cut in two | Keep the error output separate |

## A safe temporary file: `mktemp`

A **temporary file** exists only for the duration of one run (here, to keep a command's error messages apart). The temptation is to give it a fixed name, such as `/tmp/errors.$$`, where `$$` is the number of the script's process (see [ending a process](/?c=langages&s=bash&p=gestion-des-processus)). This name is **predictable**: another user of the machine can create a link at that location in advance, pointing to a file belonging to whoever runs the script, which the script will overwrite without knowing it ([CWE-377](https://cwe.mitre.org/data/definitions/377.html)).

`mktemp` creates the file **itself**, with a random name that does not exist yet, and leaves access to its owner alone (see [reading permissions](/?c=langages&s=bash&p=permissions-et-fichiers#reading-permissions-with-ls-l)):

```
$ mktemp
/tmp/tmp.LiSSKlK2Ur
$ ls -l /tmp/tmp.LiSSKlK2Ur
-rw------- 1 alice alice 0 oct.   4 21:29 /tmp/tmp.LiSSKlK2Ur
$ mktemp -d
/tmp/tmp.6jBpvLiBQT
$ ls -ld /tmp/tmp.6jBpvLiBQT
drwx------ 2 alice alice 4096 oct.   4 21:29 /tmp/tmp.6jBpvLiBQT
$ mktemp /tmp/rapport.XXXXXX
/tmp/rapport.yckOz1
```

| Command | Result |
|---|---|
| `mktemp` | An empty file, `/tmp/tmp.` followed by ten random characters |
| `mktemp -d` | A temporary **folder**, to keep several files in |
| `mktemp /tmp/rapport.XXXXXX` | A chosen name: the final `X` characters are replaced by random ones |
| `TMPDIR=/path mktemp` | Creates the file in that folder instead of `/tmp` |

## Deleting it for sure: `trap ... EXIT`

`trap` runs a command when the script receives a signal (see [intercepting a signal](/?c=langages&s=bash&p=gestion-des-processus#catching-a-signal-trap) and [Unix signals](/?c=langages&s=c&p=signaux-unix)). The pseudo-signal `EXIT` is not a real one: it stands for **the end of the script**, for whatever reason. The following script (`demo.sh`) shows it in several situations (one `case` line per situation):

```bash
#!/bin/bash
# usage: ./demo.sh [normal|exit3|error|output|timeout|foreground|capture|capturefg]
# With no argument: sleep 17. While it waits, press Ctrl-C.
tmp=$(mktemp)                       # a temporary file, with an unpredictable name
echo "temporary file: $tmp"
trap 'rm -f "$tmp"' EXIT            # deleted on exit, whatever the reason
trap 'exit 130' INT TERM            # a signal becomes a normal exit (130 = 128 + 2)
case $1 in
    normal)     ;;                                  # the script ends by itself
    exit3)      exit 3 ;;                           # deliberate exit with a code
    error)      set -e; false; echo "never" ;;     # set -e stops at the failing command
    output)     while :; do echo line; done ;;     # writes endlessly (SIGPIPE if reader gone)
    timeout)    timeout 17 sleep 17 ;;              # sleep goes into its own group
    foreground) timeout --foreground 17 sleep 17 ;; # sleep stays in the terminal's group
    capture)    out=$(timeout 17 sleep 17) ;;       # same thing inside a substitution
    capturefg)  out=$(timeout --foreground 17 sleep 17) ;;
    *)          sleep 17 ;;
esac
```

The five situations of the table below were replayed in bash 5.2 and zsh 5.9. For Ctrl-C, a real terminal was simulated and the Ctrl-C character sent as from the keyboard. Each cell says whether the temporary file is **deleted** or **stays**, first with the line `trap 'exit 130' INT TERM` removed ("EXIT only") then kept:

| End of the script | bash, EXIT only | bash, EXIT + INT/TERM | zsh, EXIT only | zsh, EXIT + INT/TERM |
|---|---|---|---|---|
| Normal end (`normal`) | deleted | deleted | deleted | deleted |
| `exit 3` | deleted | deleted | deleted | deleted |
| `set -e`, a command fails (`error`) | deleted | deleted | deleted | deleted |
| SIGPIPE: the reader of the output has left (`output`, read by `head -1`) | deleted | deleted | **stays** | **stays** |
| Ctrl-C during `sleep` | deleted | deleted | **stays** | deleted |

What to remember:

| Finding | Explanation |
|---|---|
| "Normal" ends (end of script, `exit`, [`set -e`](/?c=langages&s=bash&p=scripts-et-shebang#stopping-a-script-on-the-first-error-set-e)) always trigger `EXIT` | That is the use case of the pseudo-signal |
| **bash** also runs `EXIT` when a signal kills the script | The file is deleted even without `trap ... INT TERM` |
| **zsh** does not | A signal that kills the script skips the cleanup: `trap 'exit 130' INT TERM` is essential |
| `trap 'exit 130' INT TERM` turns a signal into a normal exit | `130` follows the convention 128 + signal number (SIGINT is 2), see [the exit code of a process killed by a signal](/?c=langages&s=bash&p=architecture-dun-shell#the-exit-code-of-a-process-killed-by-a-signal) |
| Even with this line, zsh ignores SIGPIPE | It needs `trap 'exit 141' PIPE` (13 + 128), verified; in bash this is useless and makes a write error message appear |

> To write a script that behaves the same under bash and zsh, **always** trap `EXIT` and `INT TERM`.

### The pitfalls of `trap`

The `pitfalls.sh` script replays three cases, each in a subshell so that its `trap EXIT` runs before the counting:

```bash
#!/bin/bash
# Three ways of handling temporary files with trap. Each case runs in a
# subshell ( ... ) so that its EXIT trap runs before the leftovers are counted.
trial=$(mktemp -d)                      # trial folder: mktemp creates its files there
export TMPDIR=$trial
count() { ls -A "$trial" | wc -l; }   # number of files and folders left
empty() { find "$trial" -mindepth 1 -delete; }

echo "--- 1. two EXIT traps: the second replaces the first"
( a=$(mktemp); trap 'rm -f "$a"' EXIT
  b=$(mktemp); trap 'rm -f "$b"' EXIT )
echo "left: $(count)"; empty

echo "--- 2. double quotes: \$c is replaced right away, while it is empty"
( trap "rm -f $c" EXIT
  c=$(mktemp) )
echo "left: $(count)"; empty

echo "--- 3. one work folder, a single trap"
( work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
  touch "$work/un" "$work/deux" "$work/trois" )
echo "left: $(count)"
rmdir "$trial"
```

```
--- 1. two EXIT traps: the second replaces the first
left: 1
--- 2. double quotes: $c is replaced right away, while it is empty
left: 1
--- 3. one work folder, a single trap
left: 0
```

| Pitfall | What happens | Remedy |
|---|---|---|
| Two `trap ... EXIT` in a row | The second **replaces** the first: the first file stays (case 1) | A single `trap`, which cleans everything |
| Double quotes: `trap "rm -f $c" EXIT` | The variable is replaced **when the `trap` is defined**, while it is still empty: nothing is deleted (case 2) | Single quotes: `$c` is read at exit |
| Several temporary files | One `trap` per file: see the first pitfall | A single work **folder** (`mktemp -d`) and `rm -rf` on it (case 3) |

## Stopping a command that runs too long: `timeout`

`timeout DURATION COMMAND` runs the command and sends it a signal (SIGTERM by default) when the duration has elapsed:

```
$ timeout 1 sleep 5; echo "exit code: $?"
exit code: 124
```

| Exit code | Meaning (verified) |
|---|---|
| 124 | The deadline was exceeded: the command was stopped |
| 125 | `timeout` itself failed (unknown option, for example) |
| 126 | The command exists but cannot be run (`timeout 1 /etc/passwd`) |
| 127 | Command not found |
| 137 | The command ignores SIGTERM, `timeout -k 1 2 ...` killed it with SIGKILL (128 + 9) |
| Other | The command's own code, if it finished in time |

### Why `--foreground`: where Ctrl-C goes

Ctrl-C is not sent to a single process: the terminal sends it to **all the processes of the foreground group** (see [job control](/?c=langages&s=bash&p=architecture-dun-shell#job-control-ctrl-z-fg-bg)). Now `timeout`, so that it can stop the command and its children at the deadline, places itself **in a separate group**. The `groups.sh` script prints the group numbers (PGID):

```bash
#!/bin/bash
# usage: ./groups.sh [--foreground]
# shows the process group (PGID) of the script, of timeout and of sleep
echo "script: PID $$, PGID $(ps -o pgid= -p $$ | tr -d ' ')"
timeout $1 5 sleep 5 &
sleep 0.3
ps -o pid,ppid,pgid,comm --ppid $$ | grep -e PID -e timeout   # child of the script: timeout
ps -o pid,ppid,pgid,comm --ppid $!                             # child of timeout: sleep
wait
```

Without `--foreground`, then with it:

```
script: PID 98369, PGID 98336
    PID    PPID    PGID COMMAND
  98373   98369   98373 timeout
    PID    PPID    PGID COMMAND
  98375   98373   98373 sleep
```

```
script: PID 98379, PGID 98336
    PID    PPID    PGID COMMAND
  98383   98379   98336 timeout
    PID    PPID    PGID COMMAND
  98385   98383   98336 sleep
```

Without `--foreground`, `timeout` and `sleep` have a PGID different from the script's: they are **no longer in the foreground**, so Ctrl-C does not reach them. With `--foreground`, they share the script's group. The same cases under bash and zsh, with Ctrl-C typed 0.8 s after the start ("> 4 s" means the script was still waiting after 4 s):

| Command in the script | bash: end | bash: file | zsh: end | zsh: file | surviving `sleep` (bash, zsh) |
|---|---|---|---|---|---|
| `sleep 17` | 0.0 s | deleted | 0.0 s | deleted | 0, 0 |
| `timeout 17 sleep 17` | > 4 s | stays | > 4 s | stays | 1, 1 |
| `timeout --foreground 17 sleep 17` | 0.0 s | deleted | 0.0 s | deleted | 0, 0 |
| `out=$(timeout 17 sleep 17)` | > 4 s | stays | 0.1 s | deleted | 1, 1 |
| `out=$(timeout --foreground 17 sleep 17)` | 0.0 s | deleted | 0.0 s | deleted | 0, 0 |

Without `--foreground`, Ctrl-C does **nothing**: the script waits for the 17 seconds to pass (the temporary file stays during that time), and its `trap` finally runs. Inside `$(...)`, zsh leaves right away but lets `sleep` run alone to the end.

> The downside, stated by the `timeout` manual: with `--foreground`, **the command's children are not stopped** when the deadline expires, only the command is. If it launches processes that outlive it, extra supervision is needed (in the solver, its child processes die with their parent thanks to `prctl(PR_SET_PDEATHSIG)`, see [orphan processes](/?c=langages&s=c&p=processus)).

## Capturing the output without mixing in the errors: the 4,096-byte buffer

The original script launches the solver like this: `output=$(timeout --foreground 90 ./solver "$clues" 2>"$ERRORS")`. The standard output goes into a variable, the **error output** (see [redirecting the error output](/?c=langages&s=bash&p=redirections-et-pipes#redirecting-standard-error)) into a temporary file, not into the same variable with `2>&1`. The reason shows with a small C program (`chatty.c`, compiled with `gcc -o chatty chatty.c`) that writes a hundred lines, then a warning on the error output after the seventieth:

```c
#include <stdio.h>

int main(void)
{
    for (int i = 1; i <= 100; i++) {
        printf("line %03d : 123456789 123456789 123456789 123456789 123456789\n", i);
        if (i == 70)
            fprintf(stderr, "WARNING: line 70 has just been written\n");
    }
    return 0;
}
```

A C program writing to a **terminal** empties its buffer at every line; to a **pipe** (`|`, see [pipes](/?c=langages&s=bash&p=redirections-et-pipes#pipes-chaining-commands)) or a file, it accumulates in a **buffer** (an intermediate memory area) of 4,096 bytes that it empties in one block when it is full. The error output, for its part, is not buffered: a message sent while the buffer is half full arrives before the text that precedes it.

```
$ ./chatty 2>&1 | grep -n -B1 -A1 WARNING
67-line 067 : 123456789 123456789 123456789 123456789 123456789
68:line 068 WARNING: line 70 has just been written
69-: 123456789 123456789 123456789 123456789 123456789
$ stdbuf -oL ./chatty 2>&1 | grep -n -B1 -A1 WARNING
70-line 070 : 123456789 123456789 123456789 123456789 123456789
71:WARNING: line 70 has just been written
72-line 071 : 123456789 123456789 123456789 123456789 123456789
```

In the first case, the warning landed in the middle of line 68 (at byte number 4,096); in the second, `stdbuf -oL` imposes a line buffer and every line arrives whole. On a terminal there is no problem at all, which makes the defect hard to spot:

```
$ script -qec ./chatty /dev/null | grep -n -B1 -A1 WARNING
70-line 070 : 123456789 123456789 123456789 123456789 123456789
71:WARNING: line 70 has just been written
72-line 071 : 123456789 123456789 123456789 123456789 123456789
```

The `capture.sh` script captures the output both ways and spots the lines whose length is not that of a normal line (60 characters):

```bash
#!/bin/bash
# Captures the output of ./chatty in two ways
errors=$(mktemp)
trap 'rm -f "$errors"' EXIT

echo "--- stderr mixed into stdout (2>&1)"
out=$(./chatty 2>&1)
echo "$out" | awk 'length($0) != 60 { print "damaged line:", $0 }'

echo "--- stderr in a temporary file"
out=$(./chatty 2>"$errors")
echo "$out" | awk 'length($0) != 60 { print "damaged line:", $0 }'
echo "lines captured: $(echo "$out" | wc -l)"
echo "errors: $(cat "$errors")"
```

```
--- stderr mixed into stdout (2>&1)
damaged line: line 068 WARNING: line 70 has just been written
damaged line: : 123456789 123456789 123456789 123456789 123456789
--- stderr in a temporary file
lines captured: 100
errors: WARNING: line 70 has just been written
```

| Solution | Principle | Limit |
|---|---|---|
| Error output in a temporary file (`2>"$errors"`) | Two separate streams, nothing to interleave | One more file to clean up: `trap` |
| `stdbuf -oL command` | Forces a line buffer for dynamically linked C programs | No effect on a program that sets its own buffer |
| In the program: `fflush(stdout)` after each line, or `setvbuf` | The program empties its buffer itself | The program must be modifiable |

---

## 📋 Summary

| | |
|---|---|
| **Key points** | `mktemp` creates a file (or, with `-d`, a folder) with a random name and restricted rights. `trap '...' EXIT` cleans it at the end of the script, `trap 'exit 130' INT TERM` turns a signal into a normal end so that the cleanup happens (essential in zsh). `timeout` stops a command that runs too long (code 124); in a script, `--foreground` keeps the command in the terminal's group so that Ctrl-C reaches it. An error output mixed into the standard output can cut lines in two. |
| **Tools you can use** | `mktemp`, `mktemp -d`, `trap`, `timeout` (`--foreground`, `-k`), `stdbuf -oL`, `ps -o pid,ppid,pgid,comm` to see process groups. |
| **Pitfalls to avoid** | A fixed name such as `/tmp/file.$$`. A second `trap ... EXIT` replacing the first. Double quotes in a `trap`. Relying on `trap ... EXIT` alone in zsh. Running `timeout` without `--foreground` in a script that can be interrupted from the keyboard. Mixing `2>&1` into the capture of a program that writes more than 4,096 bytes. |
| **Best practices** | A single work folder and a single `trap`. Trap `EXIT` and `INT TERM`. Test the script with a real Ctrl-C and check what is left in `/tmp`. Keep the error output in a temporary file. |
