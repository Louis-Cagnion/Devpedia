---
order: 7
---

# Reading a Key from the Keyboard in zsh: `read -k`, Escape and Arrows

An interactive script often needs an immediate answer: "Enter to continue, Escape to stop". The script that runs the Skyscraper solver over a series of grids does exactly that. Yet the usual command, `read`, waits for a **line** to be confirmed with Enter. This chapter shows how to read **a single key**, what a key really sends to the program, and how to tell the Escape key from an arrow.

## A line or a key: `read` and `read -k`

| Command | What it does |
|---|---|
| `read line` | Waits for a whole line to be confirmed with Enter |
| `read -k 1 key` | Reads **one key** as soon as it is typed: the terminal then handles input key by key |
| `read -s ...` | Does not display what is typed |
| `read -t 0.05 ...` | Waits only 0.05 seconds (a decimal number is accepted); return code 1 if nothing arrived |

According to the zsh manual, `-k` reads **from the terminal**. Without a terminal (a script launched by `cron`, redirected input), `read -k` fails with the message `not interactive and can't open terminal` and code 1.

The same operation exists in bash, with other options (behaviors verified in a simulated terminal):

| | bash | zsh |
|---|---|---|
| Read one key | `read -n 1 key` | `read -k 1 key` |
| No echo | `-s` | `-s` |
| 0.05 s delay expired | Code **142** | Code **1** |
| `read -n 1 key` | Reads one key | **Reads nothing**: `key` stays empty, code 0, no message |

> **Pitfall:** copying bash's `read -n 1` into a zsh script produces no error: the zsh manual reserves `-n` for completion functions, elsewhere the option is silently ignored.

## What a key sends: bytes

The keyboard does not send "the Escape key": the terminal transmits **bytes**, and `read -k 1` reads one at a time. The following script (`bytes.zsh`) prints each byte received; the `(q)` flag writes invisible characters in a readable form:

```zsh
#!/bin/zsh
# Prints the bytes received for each key: type a letter, Enter, Escape, an arrow...
# To stop: type q.
while read -s -k 1 key; do
    print -r -- "byte received: ${(q)key}"
    [[ $key == q ]] && break
done
```

Output when typing, in order: `a`, Enter, Escape, up arrow, left arrow, Alt+x, F1, then `q`:

```
byte received: a
byte received: $'\n'
byte received: $'\033'
byte received: $'\033'
byte received: \[
byte received: A
byte received: $'\033'
byte received: \[
byte received: D
byte received: $'\033'
byte received: x
byte received: $'\033'
byte received: O
byte received: P
byte received: q
```

| Key | Bytes received | Reading |
|---|---|---|
| Letter `a` | `a` | One byte |
| Enter | `\n` | One byte (the terminal converts the carriage return) |
| Escape | `\033` | One byte: the **ESC** character, code 27 |
| Up, down, right, left arrow | `\033`, `[`, then `A`, `B`, `C` or `D` | **Three** bytes: ESC, `[` and a letter |
| Alt+x | `\033`, `x` | Two bytes: ESC followed by the letter |
| F1 | `\033`, `O`, `P` | Three bytes |
| Tab, backspace | `\t`, `\177` | One byte each |

ESC is the character that opens an **escape sequence** (the same one used by the [ANSI color codes](/?c=langages&s=bash&p=architecture-dun-shell#coloring-a-terminal-s-output-ansi-codes) in the other direction, from the program to the terminal). An arrow therefore starts exactly like the Escape key: only what follows tells them apart.

## Telling Escape from an arrow

After reading ESC, we wait very briefly for one more byte. If it arrives, it is the start of a sequence (arrow, F1...). If it does not, it is the Escape key, typed alone. The `wait_for_key` function (`wait.zsh`) returns `0` on Enter, `1` on a lone Escape, `2` if there is no terminal:

```zsh
#!/bin/zsh
# Waits for Enter (code 0) or Escape (code 1); code 2 if there is no terminal.
wait_for_key() {
    local key
    while read -s -k 1 key 2>/dev/null; do
        [[ $key == $'\n' || $key == $'\r' ]] && return 0       # Enter
        [[ $key != $'\e' ]] && continue                        # any other key: keep waiting
        # an arrow sends Escape followed by other bytes: only a lone Escape stops
        read -s -t 0.05 -k 1 key || return 1                   # nothing follows: lone Escape
        while read -s -t 0.01 -k 1 key; do :; done             # drains the rest of the arrow
    done
    return 2
}

wait_for_key
echo "return code: $?"
```

| Line | Role |
|---|---|
| `while read -s -k 1 key 2>/dev/null` | Reads a key without displaying it; fails without a terminal (message hidden) |
| `[[ $key == $'\n' \|\| $key == $'\r' ]] && return 0` | Enter (carriage return or line feed): ends with code 0 |
| `[[ $key != $'\e' ]] && continue` | Any key other than ESC is ignored: read again |
| `read -s -t 0.05 -k 1 key \|\| return 1` | After ESC, waits 0.05 s for one more byte; none comes: lone Escape, code 1 |
| `while read -s -t 0.01 -k 1 key; do :; done` | A byte came: drain the rest of the sequence (`[` and `A`...) so they are not read as two keystrokes |
| `return 2` | The loop stopped because `read` failed: no terminal |

Results (simulated terminal, keys sent as from the keyboard):

| Keys typed | Code returned | Reading |
|---|---|---|
| Enter | 0 | Continue |
| Lone Escape | 1 | Stop |
| Up arrow, then Enter | 0 | The arrow is ignored |
| `abc`, then Enter | 0 | The letters are ignored |
| Escape, then `x` 20 ms later (like Alt+x) | 0 | Taken for the start of a sequence: Escape not recognized |
| No terminal (`< /dev/null`) | 2 | No terminal |

## The pitfalls

| Pitfall | What happens | Remedy |
|---|---|---|
| `read -n 1` written out of bash habit | No error, but the variable stays empty (verified) | `read -k 1` in zsh |
| Script without a terminal (cron, pipe) | `read -k` fails with a message and code 1 | Hide the message (`2>/dev/null`) and plan a dedicated code, like the `return 2` above |
| Alt+key or function key | ESC and the letter arrive almost together: read as a sequence, never as Escape (verified with 20 ms) | Accept this limit, or read the whole sequence |
| Not draining the end of a sequence | `[` and `A` would be read as two ordinary keystrokes | The `while read -t 0.01` loop |
| A 0.05 s delay that is too short | On a slow link (ssh), an arrow's bytes may arrive more than 0.05 s apart and the arrow be taken for Escape | Test on the link actually used, then adjust |

---

## 📋 Summary

| | |
|---|---|
| **Key points** | `read -k 1` reads a key without waiting for Enter (zsh; `read -n 1` in bash). A key sends bytes: Escape is a single ESC byte (`\033`), an arrow sends three (ESC, `[`, a letter). To tell Escape from an arrow, read ESC then briefly wait for one more byte with `-t`. |
| **Tools you can use** | `read -k`, `-s`, `-t`, the comparison with `$'\e'`, the `(q)` flag to see the bytes, `[[ -t 0 ]]` to test for the presence of a terminal. |
| **Pitfalls to avoid** | `read -n 1` in a zsh script (empty variable with no error). Forgetting to drain the end of a sequence. Reading a key without a terminal. Taking Alt+key for Escape. |
| **Best practices** | Check what each key sends with a small byte-printing script. Hide the error message and handle the "no terminal" case with a dedicated return code. Choose delays according to the link used. |
