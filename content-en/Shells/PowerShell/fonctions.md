---
order: 7
---

# Functions

Unlike Bash, where a function receives its arguments exactly like a script (`$1`, `$2`, with no name), a PowerShell function declares real **named, typed parameters** via `param()`, like PHP or C.

## Declaring and calling a function

```powershell
function Greet {
    param([string]$Name)
    Write-Output "Hello $Name!"
}

Greet -Name "John"   # Hello John!
Greet "John"         # also works: PowerShell accepts a positional argument if the name is omitted
```

> **Naming convention:** PowerShell cmdlets and functions follow `Verb-Noun` casing (`Get-ChildItem`, `Greet` here simplified) — a set of standard verbs (`Get`, `Set`, `New`, `Remove`...) is even mandated by convention for official cmdlets, so the same verb behaves predictably from one command to another.

## A function's parameters

```powershell
function Summarize {
    param(
        [string]$LastName,
        [string]$FirstName
    )
    Write-Output "Function name: $($MyInvocation.MyCommand.Name)"
    Write-Output "First parameter: $LastName"
    Write-Output "All undeclared arguments: $args"
}

Summarize -LastName "Smith" -FirstName "John"
```

> **Note:** unlike Bash where `$1`, `$2` are purely positional, the call `-LastName "Smith" -FirstName "John"` stays correct even out of order (`-FirstName "John" -LastName "Smith"`) — parameters are matched by name, not position, which is why `Verb-Noun` casing places so much emphasis on clear parameter names.

## Real return values

Unlike Bash, where `return` only sets an exit code (0-255), `return` in PowerShell can return an **actual value** of any type:

```powershell
function IsEven {
    param([int]$Number)
    return ($Number % 2 -eq 0)   # returns $true or $false, an actual boolean
}

if (IsEven -Number 4) {
    Write-Output "4 is even"
}
```

## "Returning" data: the pipeline's uncaptured output

In practice, `return` is even optional: **any unassigned output** in a function's body becomes its return value, exactly like a block's last evaluated expression — an important difference from Bash, where `echo` is only for displaying, never for "returning" in the strict sense:

```powershell
function Add {
    param([int]$A, [int]$B)
    $A + $B   # this line, unassigned, becomes the function's return value
}

$result = Add -A 4 -B 6
Write-Output "Result: $result"   # Result: 10
```

> **Note:** unlike Bash where `echo` inside a function is *only* for displaying (capturing via `$(...)` is a caller-side convention, not an actual return mechanism), any PowerShell line whose result is neither assigned nor discarded (with `[void]` or `Out-Null`) gets added to the function's return value — a forgotten debug `Write-Output` inside a function can thus silently pollute what it returns.

## Variable scope

Unlike Bash (global by default unless `local`), a variable assigned inside a PowerShell function stays local to that function by default:

```powershell
function Compute {
    param([int]$Number)
    $result = $Number * 2   # local to Compute(), no "local" keyword needed
    return $result
}
```

See also [Variables](/?c=shells&s=powershell&p=variables) (the `$script:` scope, already reused here in the context of functions).

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A PowerShell function declares real named, typed parameters via `param()`. `return` (or even plain unassigned output) can return an actual value of any type, unlike Bash's limited exit code. |
| **Tools you can use** | `param()`, `$args` for undeclared arguments, `$script:` scope. |
| **Pitfalls to avoid** | A forgotten debug `Write-Output` inside a function silently gets added to its return value. |
| **Best practices** | Use `[void]`/`Out-Null` to explicitly discard an output that shouldn't be part of the return value. |
