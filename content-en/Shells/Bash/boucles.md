---
order: 6
---

# Loops

Bash offers three loop structures (`for`, `while`, `until`), used both to repeat commands and to walk through lists of files, lines, or command results.

## The `for` loop (walking a list)

```bash
for fruit in apple banana cherry; do
    echo "$fruit"
done
```

Walking through a folder's files via [globbing](/?c=shells&s=bash&p=expansion-et-jokers):

```bash
for file in *.txt; do
    echo "Processing $file"
done
```

Walking through a range of numbers:

```bash
for i in {1..5}; do
    echo "$i"
done
```

## The C-style `for` loop

```bash
for ((i = 0; i < 5; i++)); do
    echo "$i"
done
```

## The `while` loop

The block runs as long as the condition stays true (tested **before** each iteration):

```bash
i=0

while [ $i -lt 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

### Reading a file line by line

The most common combo in Bash scripting for processing a text file:

```bash
while read -r line; do
    echo "Line read: $line"
done < file.txt
```

- `read -r` reads a line from standard input into the `line` variable on each iteration (`-r` prevents `\` from being interpreted as an escape character, almost always what you want).
- `< file.txt` redirects the file's content to the standard input of the whole loop (see [Redirections and Pipes](/?c=shells&s=bash&p=redirections-et-pipes)).

## The `until` loop

The mirror image of `while`: the block runs as long as the condition stays **false**, until it becomes true:

```bash
i=0

until [ $i -ge 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

`until [ $i -ge 5 ]` is exactly equivalent to `while [ $i -lt 5 ]` — the choice between the two is a matter of readability, depending on which condition you want to express naturally.

## `break` and `continue`

Work like in most languages:

```bash
for i in {1..10}; do
    if [ $i -eq 5 ]; then
        break
    fi
    if [ $((i % 2)) -eq 0 ]; then
        continue
    fi
    echo "$i"
done
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `for` walks a list, files (globbing), or a range of numbers; `while`/`until` repeat as long as a condition stays true/false. `while read -r line` is the standard combo for reading a file line by line. |
| **Tools you can use** | Brace expansion (`{1..5}`), C-style `for`, `break`/`continue`. |
| **Pitfalls to avoid** | Forgetting `-r` with `read` — without it, `\` characters are interpreted as escapes. |
| **Best practices** | Use `while read -r line; do ... done < file.txt` to process a text file line by line, rather than a less idiomatic approach. |
