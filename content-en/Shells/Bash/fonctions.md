---
order: 7
---

# Functions

A Bash function groups a sequence of commands under a reusable name. Unlike [PHP](/?c=langages-de-programmation&s=php&p=conditions) or [C](/?c=langages-de-programmation&s=c&p=conditions), a Bash function **never** declares a list of named parameters: it receives its arguments exactly the way a script receives its own, via `$1`, `$2`, etc.

## Declaring and calling a function

```bash
greet() {
    echo "Hello $1!"
}

greet "John"   # Hello John!
```

`function greet { ... }` is an alternative form Bash accepts (but not portable to a strictly POSIX `sh`) — `greet() { ... }` is the most universal form.

## A function's arguments

```bash
summarize() {
    echo "Function name: $FUNCNAME"
    echo "First argument: $1"
    echo "All arguments: $@"
    echo "Number of arguments: $#"
}

summarize "John" "Smith"
```

> **Note:** `$1`, `$2`... inside a function refer to the arguments **of the function**, never those of the enclosing script — they're automatically swapped in during the call, with nothing to configure.

## No real return value: only an exit code

`return` in Bash does **not** return a value in the PHP/C sense — it only sets the function's **exit code** (an integer from 0 to 255, retrievable via `$?`), exactly like `exit` for an entire script:

```bash
is_even() {
    if [ $(($1 % 2)) -eq 0 ]; then
        return 0   # 0 = success/true, Unix convention
    else
        return 1   # non-zero = failure/false
    fi
}

if is_even 4; then
    echo "4 is even"
fi
```

## "Returning" actual data: `echo` + command substitution

To get back computed data (not just success/failure), the convention is to display it with `echo`, and capture that output from the caller via [`$(...)`](/?c=shells&s=bash&p=variables):

```bash
add() {
    echo $(($1 + $2))
}

result=$(add 4 6)
echo "Result: $result"  # Result: 10
```

> **Note:** never confuse the two mechanisms. `return` communicates a status (0-255, for flow control with `if`), `echo` + `$(...)` communicates actual data (to be stored/reused). Mixing the two in the same function is a classic source of confusion.

## Local variables

Without `local`, a variable assigned inside a function stays visible **globally** after the first call — often an unwanted side effect:

```bash
compute() {
    local result=$(($1 * 2))  # local: only exists inside compute()
    echo $result
}
```

See also [Variables](/?c=shells&s=bash&p=variables) (the special variables `$1`, `$@`, `$#`, `$?`, already reused here in the context of functions).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A Bash function receives its arguments like a script (`$1`, `$2`...), never via named parameters. `return` only sets an exit code (0-255) — for actual data, `echo` captured via `$(...)` is used. |
| **Tools you can use** | `$FUNCNAME`, `$@`/`$#`, `local` for a variable scoped to the function. |
| **Pitfalls to avoid** | Confusing `return` (status, for `if`) with `echo`+`$(...)` (data, to be stored); forgetting `local`, which makes a variable visible globally after the first call. |
| **Best practices** | Always declare `local` for a variable that doesn't need to exist outside the function. |
