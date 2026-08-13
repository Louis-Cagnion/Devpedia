---
order: 3
---

# Variables

As a reminder, [a variable is a labeled box that holds a value](/?c=bases-de-l-informatique&p=la-variable) — what follows only covers what's specific to Bash.

Bash has only one real data type: the **string** — even a number is handled as text, except in an explicit arithmetic context (see below exactly what that covers). Variables aren't typed, and their declaration/reading syntax is peculiar: no `$` when assigning, `$` when reading.

## Declaring and reading a variable

```bash
name="John"        # no space around the '=': "name = John" is a syntax error
echo $name          # John
echo "${name}"       # John -> the braces explicitly delimit the variable name
echo "Hello ${name}!"
```

> **Pitfall:** `name= "John"` (with a space after `=`) does **not** work as expected: Bash understands "run the command `John` with the empty environment variable `name`", not "assign John to name". A space before the `=` (`name ="John"`) fails just the same: Bash then looks for a command named `name`.
>
> **Best practice:** never leave a space before or after the `=` of an assignment — it's the simplest rule to remember, with no exception in Bash.

## Single vs. double quotes

```bash
name="John"

echo "Hello $name"   # Hello John -> double quotes interpret variables
echo 'Hello $name'   # Hello $name -> single quotes disable all interpretation
```

| Quotes | Variables interpreted? | Typical use case |
|---|---|---|
| Double `"..."` | Yes — `$name` replaced with its value | The default case, as soon as a variable appears in the string |
| Single `'...'` | No — text taken as-is, `$` included | Literal text containing a `$` that must absolutely not be interpreted (a regex, a password displayed as-is...) |
| None | Yes, but the value is also split into words on spaces | Almost always to avoid — see the pitfall below |

> **Pitfall:** using a variable with no quotes (`echo $name`) instead of `"$name"`. If the value contains a space, Bash splits it into several words before using it — `rm $file` with a file name containing a space can thus silently delete something other than intended.
>
> **Best practice:** systematically wrap a variable in double quotes when using it (`"$name"`), unless there's a specific need not to. The one common exception: inside an explicit numeric context (`[ $i -lt 5 ]`, `$(( i + 1 ))`), Bash does no word splitting on the value at all — quotes are therefore unnecessary there, which is why the chapters on conditions and loops don't use them in those specific cases.

## Command substitution

Runs a command and replaces the expression with its output:

```bash
today=$(date +%Y-%m-%d)
echo "Today is $today"

file_count=$(ls | wc -l)
echo "There are $file_count files here"
```

`$(...)` is the modern syntax, preferred over the old \`backticks\` (`` `date` ``), less readable and hard to nest easily.

> **Pitfall:** an unquoted command substitution undergoes the same word splitting as an unquoted variable (see the quoting pitfall above) — a multi-line result (`$(ls)`, `$(cat file.txt)`) has its line breaks silently turned into plain spaces if displayed with no quotes.
>
> **Best practice:** quote a command substitution as soon as its output is multi-line or may contain spaces (`echo "$(cat file.txt)"`), exactly like an ordinary variable.

## Command injection: never interpolate untrusted input

If a script builds a command by directly interpolating an external value into it (user input, an argument, the content of a downloaded file...), that value can contain special shell characters (`;`, `|`, `` ` ``, `$(...)`) that **change the structure of the command being run**, instead of remaining plain data:

```bash
file_name="report.txt; rm -rf ~"   # value received from outside, uncontrolled

eval "cat $file_name"    # DANGER: actually runs "cat report.txt" THEN "rm -rf ~"
```

`eval` reinterprets its string as a brand new command line — it's exactly this mechanism that turns a `;` contained in the data into an actual **second command**, rather than a harmless character in a file name. Even without `eval`, command substitution (`$(...)`, above) or an unquoted variable in a command that itself accepts code (e.g. `ssh host "$command"`) create the same risk.

> **Pitfall:** trusting an external value (user input, a script argument, the content of a downloaded file) to build a command, in particular via `eval` or a command that itself accepts code (`ssh host "$command"`) — conceptually the Bash equivalent of a [SQL injection](/?c=langages-de-programmation&s=php&p=securite): uncontrolled input that changes the structure of what's executed, rather than staying plain data.
>
> **Best practice:** never textually assemble an external value into a command that's then run. When it's unavoidable, treat it as pure data — never interpolated directly into the command, and even less so passed on to `eval`.

## Arithmetic

Bash doesn't natively compute on strings — an explicit arithmetic context is required:

```bash
a=5
b=3

echo $((a + b))   # 8
echo $((a * b))   # 15
echo $((a / b))   # 1 -> integer division only, Bash doesn't handle decimals
```

> **What is an "explicit arithmetic context"?** It's a precise syntax Bash recognizes, inside which it interprets the content as a numeric expression rather than as text: `$((...))` (to get the result), `((...))` alone (for a computation or a test, with no value retrieved — used for example in `for ((i = 0; i < 5; i++))`, see [Loops](/?c=shells&s=bash&p=boucles)), the `let` command (`let "a = a + 1"`), or the numeric operators `-eq`, `-lt`, `-gt`... inside `[ ]`/`[[ ]]` (see [Conditions](/?c=shells&s=bash&p=conditions)). Outside these specific syntaxes, `+`, `-`, `*` are just ordinary characters in a string.

> **Pitfall:** `$((a / b))` silently truncates any decimal part, with no warning or error — `echo $((5 / 2))` displays `2`, not `2.5`. A computation that should produce a decimal result (an average, a percentage...) thus gives a wrong result with nothing flagging it.
>
> **Best practice:** go through an external tool that handles decimals ([`bc`](https://www.gnu.org/software/bc/), `awk`) as soon as a computation might produce a non-integer result, rather than Bash's native arithmetic.

## Special variables

Besides the variables you declare yourself, Bash provides special variables that are always available (`$0`, `$1`, `$@`, `$#`, `$?`, `$$`) — see the table and examples in the chapter on writing scripts, right after the section on script arguments.

## Local variables in a function

By default, a variable declared in a function stays **global** (visible everywhere after its first call) — `local` restricts its scope to the current function, which avoids unexpected side effects:

```bash
count() {
    local total=0   # only visible inside count()
    total=$((total + 1))
    echo $total
}

count
echo "$total"  # empty: total doesn't exist outside the function
```

> **Pitfall:** forgetting `local` in a function that reuses a common variable name (`i`, `total`, `result`...) — the variable silently becomes global, and can overwrite a variable of the same name used elsewhere in the script, with no error flagged.
>
> **Best practice:** declare `local` for any variable that only needs to exist for the duration of the function — a reflex to adopt from the function's very first line, not only once a scope bug has already been found.

See also the chapter on functions, and the one on environment variables (`export`) for sharing a value with child processes.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | Bash has only one real type, the string. Assignment with no `$` (`name="John"`), reading with `$` (`$name`) or `${name}`, with no space at all around the `=`. `"$(...)"` captures a command's output; `$((...))` evaluates a numeric expression. `local` restricts a variable to its function. |
| **Tools you can use** | `$(command)` for command substitution; `$((...))`, `((...))`, or `let` for arithmetic; `bc`/`awk` as soon as a decimal computation is needed. |
| **Pitfalls to avoid** | A space around the `=` in an assignment. An unquoted variable or command substitution (silent word splitting). Interpolating an uncontrolled external value into a command (`eval`, `ssh host "$command"`). Forgetting `local` in a function. |
| **Best practices** | Always quote a variable (`"$name"`) except in an explicit arithmetic context. Never build a command from an uncontrolled external value. Systematically declare `local` inside a function. |
