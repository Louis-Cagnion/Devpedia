---
order: 9
---

# Redirections and Pipes

Every Unix command communicates by default through three streams: **standard input** (`stdin`, what it reads), **standard output** (`stdout`, what it normally displays), and **standard error** (`stderr`, where error messages go). Redirections and pipes make it possible to redirect these streams to a file or to another command, instead of to the terminal.

> **Note:** these "streams" are actually numbered **file descriptors** (`0`, `1`, `2`) — see the chapter on system calls and file descriptors (C section) for what actually happens at the operating system level when you redirect them.

## Redirecting output to a file

```bash
echo "Hello" > file.txt    # overwrites file.txt (or creates it) with this content
echo "Again" >> file.txt   # appends to the end of file.txt, without overwriting
```

> **Note:** `>` silently overwrites the target file's existing content — a classic mistake is using `>` where `>>` was intended, losing the previous content with no warning.

## Redirecting input from a file

```bash
sort < list.txt   # reads list.txt as "sort"'s standard input, rather than waiting for keyboard input
```

## Redirecting standard error

The streams are numbered: `0` = standard input, `1` = standard output, `2` = standard error.

```bash
failing_command 2> errors.log     # only standard error goes into errors.log
command 1> output.log 2> errors.log  # separates normal output and errors into two files
command > all.log 2>&1               # redirects stdout into all.log, THEN stderr to wherever stdout goes
command &> all.log                    # Bash shortcut equivalent to "> all.log 2>&1"
```

> **Note:** order matters for `2>&1`. `2>&1 > file` does **not** work as expected: at that point, `2` is still redirected to the terminal (stdout's destination at that moment), and only `1` then goes to `file`. You need to write `> file 2>&1`: first redirect `1` to `file`, then point `2` to the same target as `1` **at that exact moment**.

## `/dev/null`: discarding an output

A special file that "swallows" everything written to it, never storing anything — useful for discarding a stream you don't need:

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

Every command in a pipe runs simultaneously, one's output feeding the next one's input as it goes — this isn't sequential execution with intermediate storage.

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

A command placed to the left of an `&&` or an `||` is considered "tested": its failure **does not stop** the script even under `set -e`. This is what allows writing `grep pattern file || true` to deliberately neutralize an expected failure — but it's also a source of surprise if you thought `set -e` protected the whole line.

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
| **Pitfalls to avoid** | `>` silently overwriting an existing file; the order of `2>&1` relative to `>` (`2>&1 > file` doesn't do what you'd expect). |
| **Best practices** | Write `> file 2>&1` (never the reverse); prefer an explicit `if` over `&& ... \|\| ...` as soon as the conditional logic actually matters. |
