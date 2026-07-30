---
order: 6
---

# Functions

A Bash function groups a sequence of commands under a reusable name. Unlike PHP or C, a Bash function **never** declares a list of named parameters: it receives its arguments exactly as a script receives its arguments—via `$1`, `$2`, and so on.

## Declaring and Calling a Function

```bash
saluer() {
    echo "Bonjour $1 !"
}

saluer "Jean"   # Hello, Jean!
```

`function saluer { ... }` is an alternative notation accepted by Bash (but not portable to a strictly POSIX-`sh`) — `saluer() { ... }` is the most universal form.

## The arguments of a function

```bash
resumer() {
    echo "Nom de la fonction : $FUNCNAME"
    echo "Premier argument : $1"
    echo "Tous les arguments : $@"
    echo "Nombre d'arguments : $#"
}

resumer "Jean" "Dupont"
```

> **Note:** `$1`, `$2`... within a function refer to the** function's** arguments, never those of the enclosing script—they are automatically substituted during the call, with no configuration required.

## No actual return value: only an exit code

`return` In Bash, this does **not** return a value in the PHP/C sense—it simply sets the function's **exit code** (an integer from 0 to 255, which can be retrieved using `$?`), just like `exit` does for an entire script:

```bash
est_pair() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0   # 0 = success/true, Unix convention
    else
        return 1   # non-zero = failure/false
    fi
}

if est_pair 4; then
    echo "4 est pair"
fi
```

## "Returning" actual data: `echo` + command substitution

To retrieve a calculated value (not just a pass/fail result), the convention is to display it using `echo` and to capture this output from the caller using `$(...)` (see the chapter on variables):

```bash
addition() {
    echo $(($1 + $2))
}

result=$(addition 4 6)
echo "Résultat : $result"  # Result: 10
```

> **Note:** Never confuse the two mechanisms. `return` returns a status (0–255, for flow control with `if`), while `echo` + `$(...)` returns actual data (to be stored or reused). Mixing the two in the same function is a common source of confusion.

## Local variables

Without `local`, a variable assigned within a function remains **globally** visible after the first call—often an unintended side effect:

```bash
calculer() {
    local result=$(($1 * 2))  # local: exists only within `calculate()`
    echo $result
}
```

See also the chapter on variables (special variables `$1`, `$@`, `$#`, `$?`, which have already been used here in the context of functions).
