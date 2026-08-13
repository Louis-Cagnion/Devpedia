---
order: 5
---

# Conditions

Bash has no comparison operators built into the language like [PHP](/?c=langages-de-programmation&s=php&p=conditions) or [C](/?c=langages-de-programmation&s=c&p=conditions) do — tests rely on **commands** (`test`, `[`, `[[`) whose exit code (`$?`) determines whether the condition is true (`0`) or false (non-zero).

## `if` / `then` / `elif` / `else` / `fi`

```bash
age=18

if [ $age -ge 18 ]; then
    echo "You are an adult."
else
    echo "You are a minor."
fi
```

- `if` actually evaluates the **exit code** of the command that follows it (here, `[ $age -ge 18 ]`) — `[` is a real command (often a link to `/usr/bin/test`), not a language symbol.
- `fi` (`if` backward) closes the block, the way `endif` would in other languages.

## `[ ]` vs. `[[ ]]`

```bash
[[ $age -ge 18 && $age -lt 65 ]]  # [[ ]]: extended Bash syntax, && and || usable directly
[ $age -ge 18 ] && [ $age -lt 65 ]  # [ ]: POSIX, requires combining two separate tests
```

`[[ ]]` (Bash-specific, not portable to a strictly POSIX `sh`) accepts `&&`/`||` directly inside it, handles undefined variables better, and allows pattern matching (`[[ $name == J* ]]`).

## Comparing numbers

```bash
if [ $age -eq 18 ]; then echo "Exactly 18"; fi
```

| Operator | Meaning |
|---|---|
| `-eq` | Equal |
| `-ne` | Not equal |
| `-lt` | Less than |
| `-le` | Less than or equal |
| `-gt` | Greater than |
| `-ge` | Greater than or equal |

> **Note:** `==` and `!=` also work inside `[[ ]]`, but only for comparing **strings**. Using `==` on numbers inside a classic `[ ]` compares the values as text, not numerically (`"10" < "9"` textually, but `10 -gt 9` numerically).

## Comparing strings

```bash
name="John"

if [ "$name" == "John" ]; then
    echo "Hello John"
fi

if [ -z "$name" ]; then
    echo "name is empty"
fi
```

| Operator | Meaning |
|---|---|
| `==` / `=` | String equality |
| `!=` | String inequality |
| `-z "$str"` | True if the string is empty |
| `-n "$str"` | True if the string isn't empty |

## Testing files

```bash
if [ -f "config.php" ]; then
    echo "The file exists"
fi

if [ -d "/var/www" ]; then
    echo "The folder exists"
fi
```

| Operator | True if... |
|---|---|
| `-f path` | ...it's an existing file |
| `-d path` | ...it's an existing folder |
| `-e path` | ...something exists at this path (file or folder) |
| `-x path` | ...the file is executable |
| `-r` / `-w` | ...the file is readable / writable |

## Combining conditions

```bash
if [[ -f "config.php" && -r "config.php" ]]; then
    echo "The file exists and is readable"
fi
```

## `case` (the equivalent of `switch`)

```bash
day="wed"

case $day in
    mon|tue|wed|thu|fri)
        echo "Weekday"
        ;;
    sat|sun)
        echo "Weekend"
        ;;
    *)
        echo "Unknown day"
        ;;
esac
```

`|` separates several patterns for the same block, `*)` catches everything else (the equivalent of a `switch`'s `default`), and `;;` marks the end of each block.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Bash has no comparison operators built into the language — `if` evaluates a command's exit code (`test`, `[`, `[[`). `[[ ]]` (Bash) is more permissive than `[ ]` (POSIX). |
| **Tools you can use** | Numeric operators (`-eq`, `-lt`...), string operators (`==`, `-z`, `-n`), file tests (`-f`, `-d`, `-e`), `case`. |
| **Pitfalls to avoid** | Using `==` inside a classic `[ ]` thinking it compares numbers — the comparison is done as text, not numerically. |
| **Best practices** | Prefer `[[ ]]` over `[ ]` in Bash (handles undefined variables better, direct `&&`/`\|\|`) unless strict portability to `sh` is needed. |
