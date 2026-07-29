---
order: 5
---

# Loops

Bash offers three loop structures (`for`, `while`, `until`), which are used both to repeat commands and to iterate over lists of files, lines, or command output.

## The `for` loop (list iteration)

```bash
for fruit in pomme banane cerise; do
    echo "$fruit"
done
```

Browse the files in a folder using globbing (see the chapter on expansion):

```bash
for fichier in *.txt; do
    echo "Traitement de $fichier"
done
```

Iterate through a range of numbers:

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

## `while` Loop

The block runs as long as the condition remains true (checked **before** each iteration):

```bash
i=0

while [ $i -lt 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

### Read a file line by line

The most common combination of commands in Bash scripting for processing a text file:

```bash
while read -r ligne; do
    echo "Ligne lue : $ligne"
done < fichier.txt
```

- `read -r` Reads a line from standard input into the variable `ligne` on each iteration (`-r` prevents `\` from being interpreted as escape characters, which is almost always what you want).
- `< fichier.txt` redirects the file's contents to the standard input of the entire loop (see the chapter on redirection).

## `until` Loop

The symmetric version of `while`: the block runs as long as the condition remains **false**, until it becomes true:

```bash
i=0

until [ $i -ge 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

`until [ $i -ge 5 ]` is exactly equivalent to `while [ $i -lt 5 ]`—the choice between the two is a matter of readability, depending on how naturally you want to express the condition.

## `break` and `continue`

They work the same way as in most languages:

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
