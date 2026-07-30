---
order: 4
---

# Conditions

Bash does not have comparison operators built into the language, as in PHP or C—comparisons rely on **commands** (`test`, `[`, `[[`) whose `$?` determines whether the condition is `0` or false (non-zero).

## `if` / `then` / `elif` / `else` / `fi`

```bash
age=18

if [ $age -ge 18 ]; then
    echo "Vous êtes majeur."
else
    echo "Vous êtes mineur."
fi
```

- `if` actually evaluates the **exit code **of the following command (in this case, `[ $age -ge 18 ]`) — `[` is a real command (often a link to `/usr/bin/test`), not a language symbol.
- `fi` (`if` backwards) closes the block, just as `endif` would in other languages.

## `[ ]` vs`[[ ]]`

```bash
[[ $age -ge 18 && $age -lt 65 ]]  # [[ ]] : extended Bash syntax; && and || can be used directly
[ $age -ge 18 ] && [ $age -lt 65 ]  # [ ]: POSIX; requires combining two separate tests
```

`[[ ]]` (Bash-specific; not portable to a strictly POSIX-`sh`) accepts `&&` / `||` directly within the command, handles undefined variables better, and supports `[[ $name == J* ]]`.

## Comparing Numbers

```bash
if [ $age -eq 18 ]; then echo "Exactement 18"; fi
```

| Operator | Meaning |
|---|---|
| `-eq` | Equal |
| `-ne` | Different |
| `-lt` | Bottom |
| `-le` | Less than or equal to |
| `-gt` | Top |
| `-ge` | Greater than or equal to |

> **Note:** `==` and `!=` also work in `[[ ]]`, but only for comparing **strings**. Using `==` on numbers within the standard `[ ]` compares the values as text, not numerically (`"10" < "9"` compares them as text, but `10 -gt 9` compares them numerically).

## Compare Channels

```bash
name="Jean"

if [ "$name" == "Jean" ]; then
    echo "Bonjour Jean"
fi

if [ -z "$name" ]; then
    echo "nom est vide"
fi
```

| Operator | Meaning |
|---|---|
| `==` / `=` | Channel parity |
| `!=` | Channel Differences |
| `-z "$str"` | True if the channel is empty |
| `-n "$str"` | True if the string is not empty |

## Testing Files

```bash
if [ -f "config.php" ]; then
    echo "Le fichier existe"
fi

if [ -d "/var/www" ]; then
    echo "Le dossier existe"
fi
```

| Operator | True if... |
|---|---|
| `-f path` | ...this is an existing file |
| `-d path` | ...this is an existing folder |
| `-e path` | ...something exists at this path (file or folder) |
| `-x path` | ...the file is executable |
| `-r` / `-w` | ...the file is readable/writable |

## Combining Conditions

```bash
if [[ -f "config.php" && -r "config.php" ]]; then
    echo "Le fichier existe et est lisible"
fi
```

## `case` (equivalent to `switch`)

```bash
jour="mer"

case $jour in
    lun|mar|mer|jeu|ven)
        echo "Jour de semaine"
        ;;
    sam|dim)
        echo "Week-end"
        ;;
    *)
        echo "Jour inconnu"
        ;;
esac
```

`|` separates multiple patterns within a single block; `*)` captures everything else (equivalent to `default` in `switch`), and `;;` marks the end of each block.
