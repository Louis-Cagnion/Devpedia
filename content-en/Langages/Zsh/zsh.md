---
order: 10
---

# Zsh

Zsh (*Z shell*) is, like [Bash](/?c=shells&s=bash&p=bash), a [POSIX](/?c=shells&s=bash&p=scripts-et-shebang)-compatible shell: nearly everything covered in the Bash section (variables, conditions, loops, functions, redirections and pipes, permissions and files, process management, text processing) works **identically** in zsh, syntax included -- with the exception of a few narrow, silent divergences, detailed below. It's also the default shell on macOS since 2019, and a common choice on Linux for its interactive-use comfort.

> **What's covered here:** only what actually differs from Bash or doesn't exist on the Bash side at all: startup files, the options system (`setopt`), extended globbing, advanced completion, prompt customization, the **Oh My Zsh** framework, and two behavioral divergences that silently break a Bash script ported as-is (see below). For everything else (variables, conditions, loops, functions, redirections, permissions, processes, text processing), the Bash section's chapters apply directly.

## How zsh concretely differs from Bash

Zsh adds, on top of the POSIX foundation (shared with Bash), several layers of comfort geared toward **interactive** use rather than pure scripting:

- noticeably richer tab completion (navigable menus, per-command contextual completion);
- more powerful globbing, enabled with `setopt extendedglob`;
- a prompt customization system independent from Bash's (`PROMPT` rather than `PS1`, with its own escape codes);
- a system of named options (`setopt`/`unsetopt`) more readable than Bash's ad hoc options (`shopt`, `set -o`);
- an ecosystem of configuration frameworks, of which **Oh My Zsh** is the most widespread.

## Two divergences that silently break a Bash script ported as-is

Unlike the comfort additions above (globbing, completion...), these two points change the **result** of an identical script depending on which shell runs it, with no error or warning at all -- the script runs, just not as expected.

### Word splitting on an unquoted variable

In [Bash](/?c=shells&s=bash&p=bash), an unquoted scalar variable (`$var`) gets split on spaces (*word splitting*), just like a command substitution (`$(cmd)`). In zsh, only command substitution stays split: an unquoted scalar variable remains a **single string**, spaces included.

```bash
steps="one two three"

for s in $steps; do
    echo "$s"
done
```

| Shell | Loop result |
|---|---|
| Bash | 3 iterations: `one`, then `two`, then `three` (`$steps` split on spaces) |
| Zsh | 1 single iteration: `one two three` (whole string, not split) |

> **Best practice:** never rely on this implicit splitting, in either shell. Using a real array (`steps=(one two three)`, then `for s in "${steps[@]}"`) makes the behavior identical and explicit on both sides.

### Native floating-point arithmetic

In Bash, `$(( ))` arithmetic only handles integers: a division like `$((1 / 2))` truncates the result (`0`), and an expression with a literal decimal number fails. In zsh, `$(( ))` natively handles floating-point numbers:

```zsh
echo $((1 / 2))       # 0 in Bash (integer division) -- 0.5 in zsh
echo $((0.53 / 1))    # error in Bash -- 0.53 in zsh
```

> **Pitfall:** a script written and tested in zsh can therefore silently produce a different numeric result (or an error) once run with `bash script.sh` or through an explicit `#!/bin/bash`. For a portable decimal calculation, use [`bc`](https://www.gnu.org/software/bc) or `awk` instead of `$(( ))`, regardless of the target shell.

## Reading a Key: `read -k` (zsh) and `read -n` (Bash)

`read` normally waits for a whole line confirmed with Enter. To react to **a single key** (a menu, "press any key"), each shell has its own option:

| | Zsh | Bash |
|---|---|---|
| Read one character, without displaying it | `read -s -k 1 key` | `read -rsn1 key` |
| Limit the wait | `-t 0.05` (seconds) | `-t 0.05` (seconds) |

A zsh script that uses `-k` fails in Bash: `read: -k: invalid option` (exit code 2).

**Arrow keys send several bytes.** The up arrow transmits three bytes at once: Escape (code 27, written `033` in octal), `[` then `A`. A one-character read therefore sees three successive "keys". Measured in zsh, up arrow typed then `x`:

```text
read 1 :  033
read 2 :  [
read 3 :  A
```

The fix: after an Escape, read the following bytes with a **very short timeout**. If they arrive, it is a sequence; otherwise, it is the Escape key alone.

```zsh
lire_touche() {
  local k suite
  read -s -k 1 k
  if [[ $k == $'\e' ]]; then    # Escape: start of a sequence, or the Escape key alone
    read -s -k 2 -t 0.05 suite  # the next two bytes, if they arrive within 50 ms
    k+=$suite
  fi
  REPLY=$k
}
```

Measured: the up arrow returns `033 [ A` in a single call, the Escape key alone returns `033`, and an ordinary key (`x`) is still read alone. The same function is written in Bash with `read -rsn1` and `read -rsn2 -t 0.05` (identical result).

> **Pitfall:** a timeout that is too short. On a slow connection (SSH), the three bytes may arrive separately: the arrow is then read as Escape followed by stray characters.
>
> **Pitfall:** other keys (Home, End, F1…) send longer sequences, which a `-k 2` does not read in full.
>
> **Best practice:** test the function with an arrow **and** with Escape alone, in a real terminal; for a complex menu, use a dedicated tool rather than decoding sequences by hand.

Another silent difference between the two shells (the `trap … EXIT` that does not run on a signal in zsh) is described in [Process Management](/?c=shells&s=bash&p=gestion-des-processus).

You'll find the different chapters below:
