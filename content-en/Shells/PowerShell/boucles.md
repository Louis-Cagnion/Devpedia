---
order: 6
---

# Loops

PowerShell offers the same basic structures as Bash (`for`, `while`, up to a condition), plus a `foreach` loop dedicated to walking through objects — the most used in practice, since almost everything in PowerShell is a collection of objects rather than plain text.

## The `foreach` loop (walking a collection)

```powershell
foreach ($fruit in "apple", "banana", "cherry") {
    Write-Output $fruit
}
```

Walking through a folder's files:

```powershell
foreach ($file in Get-ChildItem -Filter "*.txt") {
    Write-Output "Processing $($file.Name)"
}
```

Walking through a range of numbers:

```powershell
foreach ($i in 1..5) {
    Write-Output $i
}
```

## `ForEach-Object`: the same idea, but via the pipeline

Unlike `foreach` (a language keyword), `ForEach-Object` is a cmdlet that receives its elements **via the pipeline** (see [Redirections and Pipes](/?c=shells&s=powershell&p=redirections-et-pipes)) — the most idiomatic PowerShell form for chaining processing after another command:

```powershell
Get-ChildItem -Filter "*.txt" | ForEach-Object {
    Write-Output "Processing $($_.Name)"
}
```

`$_` refers to the current pipeline element inside the block — a role close to what a classic `foreach`'s loop variable implicitly plays.

## The C-style `for` loop

```powershell
for ($i = 0; $i -lt 5; $i++) {
    Write-Output $i
}
```

## The `while` loop

The block runs as long as the condition stays true (tested **before** each iteration):

```powershell
$i = 0

while ($i -lt 5) {
    Write-Output $i
    $i++
}
```

### Reading a file line by line

```powershell
Get-Content "file.txt" | ForEach-Object {
    Write-Output "Line read: $_"
}
```

Unlike Bash (`while read -r line`), reading a file line by line naturally goes through the pipeline: `Get-Content` produces a collection of lines, `ForEach-Object` (or `foreach`) walks through it — no standard input redirection needed.

## The `do`/`while` and `do`/`until` loops

Unlike `while` (condition tested before), a `do` block always runs **at least once**, the condition only being tested after the first iteration:

```powershell
$i = 0

do {
    Write-Output $i
    $i++
} while ($i -lt 5)
```

```powershell
$i = 0

do {
    Write-Output $i
    $i++
} until ($i -ge 5)
```

`do {...} until (...)` is the direct PowerShell equivalent of Bash's `until` (block repeated as long as the condition stays false) — the only difference being the guarantee of at least one pass, absent from Bash's `while`/`until`.

## `break` and `continue`

Work like in most languages, including inside a `ForEach-Object`:

```powershell
foreach ($i in 1..10) {
    if ($i -eq 5) {
        break
    }
    if ($i % 2 -eq 0) {
        continue
    }
    Write-Output $i
}
```

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `foreach` walks through a collection of objects; `ForEach-Object` does the same via the pipeline. `do`/`while` and `do`/`until` guarantee at least one pass, unlike `while`/`until` alone. |
| **Tools you can use** | `1..5` (range), `$_` (current pipeline element), `break`/`continue`. |
| **Pitfalls to avoid** | Confusing `foreach` (keyword) and `ForEach-Object` (pipeline cmdlet) — different syntax and context of use. |
| **Best practices** | Prefer `ForEach-Object` in a pipeline chain, `foreach` for a standalone loop over a collection already in memory. |
