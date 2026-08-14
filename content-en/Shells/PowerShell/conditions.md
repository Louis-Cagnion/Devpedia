---
order: 5
---

# Conditions

Unlike Bash, where a condition goes through a test command's exit code (`[`, `[[`), PowerShell has real **comparison operators built into the language**, like [PHP](/?c=langages-de-programmation&s=php&p=conditions) or [C](/?c=langages-de-programmation&s=c&p=conditions).

## `if` / `elseif` / `else`

```powershell
$age = 18

if ($age -ge 18) {
    Write-Output "You are an adult."
} else {
    Write-Output "You are a minor."
}
```

- Blocks are delimited by curly braces `{ }`, like in C/PHP/JavaScript, not by closing keywords (`fi`).
- The condition in parentheses is an actual boolean expression, not the call to an external command like Bash's `[`.

## Comparison operators

Unlike Bash, a single set of operators works for both numbers and strings: no `-eq`/`==` distinction based on the type compared:

```powershell
if ($age -eq 18) { Write-Output "Exactly 18" }
```

| Operator | Meaning |
|---|---|
| `-eq` | Equal |
| `-ne` | Not equal |
| `-lt` | Less than |
| `-le` | Less than or equal |
| `-gt` | Greater than |
| `-ge` | Greater than or equal |

> **Note:** these operators remain PowerShell keywords (`-eq`, not `==`) even though the syntax is reminiscent of Bash flags: `==` doesn't exist as a comparison operator in PowerShell.

## Comparing strings

```powershell
$name = "John"

if ($name -eq "John") {
    Write-Output "Hello John"
}

if ([string]::IsNullOrEmpty($name)) {
    Write-Output "name is empty"
}
```

| Operator | Meaning |
|---|---|
| `-eq` / `-ne` | Equality / inequality, **case-sensitive with `-ceq`**, case-insensitive otherwise |
| `-like` | Match against a wildcard-style pattern (`*`, `?`) |
| `-match` | Match against a regular expression |

> **Note:** `-eq` on strings is case-insensitive by default (`"John" -eq "john"` is true): prefixing with `c` (`-ceq`, `-clike`, `-cmatch`) forces a case-sensitive comparison, the opposite of most languages where case matters by default.

## Testing files

```powershell
if (Test-Path "config.txt" -PathType Leaf) {
    Write-Output "The file exists"
}

if (Test-Path "C:\var\www" -PathType Container) {
    Write-Output "The folder exists"
}
```

`Test-Path` alone replaces all of Bash's file tests (`-f`, `-d`, `-e`): `-PathType Leaf` for a file, `-PathType Container` for a folder, no argument for "exists, whatever the type".

## Combining conditions

```powershell
if ((Test-Path "config.txt") -and (Get-Item "config.txt").Length -gt 0) {
    Write-Output "The file exists and isn't empty"
}
```

`-and`/`-or`/`-not` respectively replace Bash's `&&`/`||`/`!`: symbolic operators don't exist for boolean logic in PowerShell.

## `switch` (the equivalent of Bash's `case`)

```powershell
$day = "wed"

switch ($day) {
    { $_ -in "mon", "tue", "wed", "thu", "fri" } { Write-Output "Weekday" }
    { $_ -in "sat", "sun" } { Write-Output "Weekend" }
    default { Write-Output "Unknown day" }
}
```

`$_` refers to the tested value (the one passed in parentheses to `switch`), `-in` tests membership in a list, and `default` catches everything else, the equivalent of a Bash `case`'s final `*)`.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | PowerShell has real comparison operators built into the language (`-eq`, `-lt`...), unlike Bash which relies on test commands. A single set of operators works for numbers and strings. |
| **Tools you can use** | `Test-Path` (replaces Bash's `-f`/`-d`/`-e`), `-and`/`-or`/`-not`, `-like`/`-match`. |
| **Pitfalls to avoid** | Forgetting that `-eq` on strings is case-insensitive by default: `-ceq` forces case sensitivity. |
| **Best practices** | Use `Test-Path -PathType Leaf/Container` to explicitly distinguish a file from a folder. |
