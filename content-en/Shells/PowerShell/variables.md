---
order: 3
---

# Variables

As a reminder, [a variable is a labeled box that holds a value](/?c=bases-de-l-informatique&p=la-variable) — what follows only covers what's specific to PowerShell.

Unlike Bash, where everything is handled as text, a PowerShell variable keeps the **actual type** of its value — a number stays a number, a list stays a list of objects, with no implicit conversion to a string. Every variable starts with `$`, including at assignment (no "no `$` to write, `$` to read" rule like in Bash).

## Declaring and reading a variable

```powershell
$name = "John"          # no strict rule about spaces around the '=', unlike Bash
Write-Output $name       # John
Write-Output "Hello $name!"   # Hello John! -> direct interpolation in a double-quoted string
```

> **Note:** `$name` alone (with no `Write-Output`) also displays its value in the console — PowerShell automatically displays the result of any expression that isn't explicitly assigned or discarded, a behavior close to a REPL.

## Single vs. double quotes

```powershell
$name = "John"

Write-Output "Hello $name"    # Hello John -> double quotes interpret variables
Write-Output 'Hello $name'    # Hello $name -> single quotes disable all interpretation
```

To insert a property or the result of an expression (not just a plain variable), you need to wrap it in `$(...)` inside double quotes:

```powershell
$process = Get-Process | Select-Object -First 1
Write-Output "First process: $($process.Name)"
```

> **Note:** without `$(...)`, `"$process.Name"` would display the object's text representation followed literally by `.Name` — PowerShell only interprets a property access inside a string if the whole expression is explicitly delimited.

## Typing

A variable can be explicitly typed, or left to have its type automatically inferred:

```powershell
[int]$age = 25
[string]$name = "John"
$score = 19.5   # inferred type: Double

$age.GetType().Name   # Int32
```

> **Note:** unlike Bash where `age="abc"` triggers no immediate error (the value stays a string, the error only shows up when a computation is attempted), assigning `"abc"` to a variable typed `[int]$age` fails immediately — PowerShell checks the type at assignment, not only at use.

## Arithmetic

No explicit arithmetic context is needed — operators work natively on numbers, decimals included:

```powershell
$a = 5
$b = 3

Write-Output ($a + $b)   # 8
Write-Output ($a * $b)   # 15
Write-Output ($a / $b)   # 1.66666666666667 -> real division, not integer like in Bash
```

## Automatic variables

PowerShell provides automatic variables that are always available, playing a role close to Bash's special variables (`$0`, `$1`...) — see the table and examples in the chapter on writing scripts, right after the section on script arguments.

## Variable scope

By default, a variable declared inside a function stays local to that function — the opposite of Bash, where a function's variable is global by default unless explicitly made `local`:

```powershell
function Count {
    $total = 0   # local to Count by default
    $total = $total + 1
    Write-Output $total
}

Count
Write-Output $total   # empty: $total doesn't exist outside the function
```

To explicitly modify a variable from an enclosing context (the reverse equivalent of a Bash `local`), its name is prefixed with a scope:

```powershell
$total = 0

function Increment {
    $script:total = $script:total + 1   # explicitly modifies the calling script's variable
}

Increment
Write-Output $total   # 1
```

See also [Functions](/?c=shells&s=powershell&p=fonctions), and [Environment Variables](/?c=shells&s=powershell&p=variables-denvironnement) (`$env:`) for sharing a value with child processes.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A PowerShell variable keeps the actual type of its value (no implicit conversion to text like in Bash). A typed variable (`[int]$age`) fails immediately if assigned an incompatible value. |
| **Tools you can use** | Interpolation in double quotes, `$(...)` for an expression/property, scopes (`$script:`). |
| **Pitfalls to avoid** | Writing `"$object.Property"` thinking it accesses the property — without `$(...)`, `.Property` is treated as literal text. |
| **Best practices** | Use `$(...)` as soon as you interpolate something other than a plain variable into a string. |
