---
order: 2
---

# Variables

Bash has only one true data type: the **string**—even a number is treated as text, except in an explicit arithmetic context. Variables are untyped, and their declaration and reading syntax is unique: without a "`$`" when assigning, and with a "`$`" when reading.

## Declare and read a variable

```bash
nom="Jean"        # No spaces around the '=': "name = Jean" is a syntax error
echo $nom          # Jean
echo "${nom}"       # Jean -> Curly braces explicitly delimit the variable name
echo "Bonjour ${nom} !"
```

> **Note:** `nom= "Jean"` (with a space after `=`) does **not** work as expected: Bash interprets this as "run the command `Jean` with the environment variable `nom` set to empty," not "assign Jean to `nom`." There must be absolutely no spaces around `=`.

## Single vs. Double Quotes

```bash
nom="Jean"

echo "Bonjour $nom"   # Hello Jean -> double quotation marks are interpreted as variables
echo 'Bonjour $nom'   # Hello $name -> single quotes prevent any interpretation
```

> **Note:** Always enclose a variable in double quotes when using it (`"$nom"`), unless there is a specific reason not to—without quotes, a value containing spaces is split into multiple words by Bash, which silently breaks many scripts (`rm $fichier` with a filename containing a space may delete something other than what was intended). The most common exception: within an explicit numeric context (`[ $i -lt 5 ]`, `$(( i + 1 ))`), Bash does not split the value into words—quotes are therefore unnecessary, which explains why the chapters on conditions and loops do not use them in these specific cases.

## Order Substitution

Runs a command and replaces the expression with its output:

```bash
date_du_jour=$(date +%Y-%m-%d)
echo "Nous sommes le $date_du_jour"

nombre_fichiers=$(ls | wc -l)
echo "Il y a $nombre_fichiers fichiers ici"
```

`$(...)` is the modern syntax, preferred over the older `backticks\` (`` ` date ` ``), which are less readable and cannot be easily nested.

## Arithmetic

Bash does not natively perform calculations on strings—an explicit arithmetic context is required:

```bash
a=5
b=3

echo $((a + b))   # 8
echo $((a * b))   # 15
echo $((a / b))   # 1 -> integer division only; Bash does not support decimals
```

## Special Variables

| Variable | Content |
|---|---|
| `$0` | Name of the script currently running |
| `$1`, `$2`, ... | Positional arguments passed to the script/function |
| `$@` | All arguments, each as a separate word |
| `$#` | Number of arguments received |
| `$?` | Exit code of the last command executed (`0` = success) |
| `$$` | PID of the currently running script |

```bash
#!/bin/bash
echo "Script : $0"
echo "Premier argument : $1"
echo "Nombre d'arguments : $#"

ls /chemin/inexistant
echo "Code de sortie : $?"  # not null, because the previous command failed
```

## Local Variables in a Function

By default, a variable declared within a function remains **global** (visible everywhere after its first call)—`local` restricts its scope to the current function, which prevents unexpected side effects:

```bash
compter() {
    local total=0   # visible only within `compte()`
    total=$((total + 1))
    echo $total
}

compter
echo "$total"  # empty: total does not exist outside the function
```

See also the chapter on functions and the chapter on environment variables (`export`) to share a value with child processes.
