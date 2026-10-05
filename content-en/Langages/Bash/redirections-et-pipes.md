---
order: 9
---

# Redirections and Pipes

Every Unix command communicates by default through three streams: **standard input** (`stdin`, what it reads), **standard output** (`stdout`, what it normally displays), and **standard error** (`stderr`, where error messages go). Redirections and pipes make it possible to redirect these streams to a file or to another command, instead of to the terminal.

> **Note:** these "streams" are actually numbered **file descriptors** (`0`, `1`, `2`); see the [chapter on system calls and file descriptors](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) (C section) for what actually happens at the operating system level when you redirect them.

## Redirecting output to a file

```bash
echo "Hello" > file.txt    # overwrites file.txt (or creates it) with this content
echo "Again" >> file.txt   # appends to the end of file.txt, without overwriting
```

> **Note:** `>` silently overwrites the target file's existing content: a classic mistake is using `>` where `>>` was intended, losing the previous content with no warning.

## Redirecting input from a file

```bash
# reads list.txt as "sort"'s standard input, rather than waiting for keyboard input
sort < list.txt
```

## Redirecting standard error

The streams are numbered: `0` = standard input, `1` = standard output, `2` = standard error.

```bash
failing_command 2> errors.log     # only standard error goes into errors.log
command 1> output.log 2> errors.log  # separates normal output and errors into two files
# redirects stdout into all.log, THEN stderr to wherever stdout goes
command > all.log 2>&1
command &> all.log                    # Bash shortcut equivalent to "> all.log 2>&1"
```

> **Note:** order matters for `2>&1`. `2>&1 > file` does **not** work as expected: at that point, `2` is still redirected to the terminal (stdout's destination at that moment), and only `1` then goes to `file`. You need to write `> file 2>&1`: first redirect `1` to `file`, then point `2` to the same target as `1` **at that exact moment**.

## `/dev/null`: discarding an output

A special file that "swallows" everything written to it, never storing anything, useful for discarding a stream you don't need:

```bash
noisy_command > /dev/null 2>&1   # discards all normal output AND all errors
```

## Pipes (`|`): chaining commands

A pipe connects one command's standard output to the next one's standard input:

```bash
ls -l | grep ".txt"          # keeps only lines containing ".txt"
grep "404" access.log | wc -l   # counts lines containing "404" in the file
ps aux | sort -k 3 -nr | head -5      # the 5 processes consuming the most CPU
```

Every command in a pipe runs simultaneously, one's output feeding the next one's input as it goes: this isn't sequential execution with intermediate storage.

## Chaining commands based on their result: `;`, `&&`, `||`

A pipe carries **data**. These three operators, instead, control **execution**: they decide whether the next command runs, based on the previous one's exit code (`0` = success, see [Writing and Running a Bash Script](/?c=shells&s=bash&p=scripts-et-shebang)).

```bash
command1 ; command2      # runs command2 no matter what
command1 && command2     # runs command2 ONLY if command1 succeeded
command1 || command2     # runs command2 ONLY if command1 failed
```

In practice:

```bash
mkdir -p build && cd build          # only enters the folder if it was actually created
./configure && make && make install # the chain stops as soon as one step fails
grep -q "TODO" *.md || echo "no TODO"   # fallback message if grep finds nothing
```

This is called **short-circuit** evaluation: `&&` only runs what follows if needed, exactly like the logical operators in other languages.

> Don't confuse this `&&`/`||` with the ones seen in the chapter on conditions. Inside `[[ ... ]]`, they're **logical** operators combining two tests. Between two commands, they're **flow-control** operators based on exit codes. The spelling is identical, the role is different.

### The `&& ... || ...` pitfall

Writing an "if/else" on one line is tempting, but it doesn't behave like an `if/else`:

```bash
command && echo "OK" || echo "FAILED"
```

If `command` succeeds but `echo "OK"` fails (a rare but possible case, for instance if output is closed), then the `||` triggers and `FAILED` gets displayed **too**. For real conditional logic, an explicit `if` is safer:

```bash
if command; then echo "OK"; else echo "FAILED"; fi
```

### Watch out with `set -e`

A command placed to the left of an `&&` or an `||` is considered "tested": its failure **does not stop** the script even under `set -e`. This is what allows writing `grep pattern file || true` to deliberately neutralize an expected failure, but it's also a source of surprise if you thought `set -e` protected the whole line.

## Mixing Output and Errors in a Pipe: the 4 KB Buffer

`2>&1` sends errors (stderr) to the same place as normal output (stdout). To a terminal, the display order is the program's. To a pipe (`|`) or a file, that is no longer true: a C program keeps its normal output in memory in a 4096-byte **buffer** (a waiting area), which it only writes when full, while it writes its errors right away.

```c
#include <stdio.h>

int main(void)
{
    for (int i = 1; i <= 300; i++) {
        printf("line %03d: a line of text long enough to fill the buffer\n", i);
        if (i == 150)
            fprintf(stderr, "ERROR: problem at line 150\n");
    }
    return 0;
}
```

```bash
./program 2>&1 | grep -B1 -A1 ERROR             # normal output buffered in blocks
stdbuf -oL ./program 2>&1 | grep -B1 -A1 ERROR  # line buffering
```

The program writes 300 lines of 56 bytes and an error after line 150. In a pipe, the error arrives **ahead of time** (it slips in after the 4096-byte blocks already written, before the lines still in the buffer) and **cuts a line in two**:

```text
line 146: a line of text long enough to fill the buffer
line 147: a lineERROR: problem at line 150
 of text long enough to fill the buffer
```

With line buffering, the order is the program's:

```text
line 150: a line of text long enough to fill the buffer
ERROR: problem at line 150
line 151: a line of text long enough to fill the buffer
```

| Output to | stdout buffer | Error and normal output |
|---|---|---|
| Terminal | Per line | In the program's order |
| Pipe or file | In 4096-byte blocks | Error ahead of time, line cut in two |

| Remedy | Effect |
|---|---|
| `stdbuf -oL command` | Forces line buffering, without touching the program; only works for C programs dynamically linked to the standard library ([`stdbuf` manual](https://www.gnu.org/software/coreutils/manual/html_node/stdbuf-invocation.html)) |
| `setvbuf(stdout, NULL, _IOLBF, 0)` at the start of the program | Line buffering (tested: output in order) |
| `fflush(stdout)` before writing to `stderr` | Empties the buffer first |
| `python3 -u` | Unbuffered Python |

> **Pitfall:** the defect does not show on screen, only in a log file, a pipeline output or a `| tee`: a manual diagnosis in a terminal does not reproduce it.
>
> **Pitfall:** an unflushed buffer is **lost** if the program crashes. Tested: a program that writes a message then calls `abort()` sends **no line** into a pipe, while the same message shows on a terminal. The last messages before the incident, the most useful ones, disappear.
>
> **Best practice:** for any output read live (log, continuous integration), ask for line buffering; and check the order of errors in a file, not only on screen.

## `tee`: redirecting while still displaying

`tee` writes its output both to a file **and** to standard output (useful for seeing a result while also saving it):

```bash
ls -l | tee results.txt   # displays the result on screen AND saves it to results.txt
```

## Symbol summary

| Symbol | Effect |
|---|---|
| `>` | Redirects standard output, overwrites the file |
| `>>` | Redirects standard output, appends to the end |
| `<` | Redirects standard input from a file |
| `2>` | Redirects standard error |
| `&>` | Redirects both standard output AND error to the same target |
| `\|` | Connects one command's output to the next one's input |
| `;` | Chains two commands, unconditionally |
| `&&` | Runs the next one only if the previous one succeeded |
| `\|\|` | Runs the next one only if the previous one failed |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `>`/`>>`/`<` redirect the stdin/stdout/stderr streams to or from a file; `\|` connects one command's output to the next one's input. `&&`/`\|\|`/`;` chain commands based on their exit code. |
| **Tools you can use** | `2>&1` (merging stderr into stdout), `/dev/null` (discarding an output), `tee` (displaying and saving at once). |
| **Pitfalls to avoid** | `>` silently overwriting an existing file; the order of `2>&1` relative to `>` (`2>&1 > file` doesn't do what you'd expect). Mixing stdout and stderr with `2>&1` in a pipe or file without thinking about the buffer: error ahead of time, line cut, last messages lost on a crash. |
| **Best practices** | Write `> file 2>&1` (never the reverse); prefer an explicit `if` over `&& ... \|\| ...` as soon as the conditional logic actually matters. Ask for line buffering (`stdbuf -oL`, `setvbuf`) for an output read live. |
