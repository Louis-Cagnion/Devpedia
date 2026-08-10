---
order: 9
---

# Redirections and Pipes

PowerShell reuses the same ideas as Bash — redirecting a stream to a file, chaining commands via a pipe — but with one fundamental difference: a Bash pipe carries **text**, a PowerShell pipe carries actual **.NET objects**, with their properties and methods intact.

## Redirecting output to a file

```powershell
"Hello" > file.txt     # overwrites file.txt (or creates it) with this content
"Again" >> file.txt      # appends to the end of file.txt, without overwriting
```

> **Note:** like in Bash, `>` silently overwrites existing content — use `>>` when appending is actually intended.

## Redirecting input from a file

```powershell
Get-Content list.txt | Sort-Object   # PowerShell has no direct "<" operator: you go through a cmdlet
```

> **Note:** unlike Bash (`sort < list.txt`), PowerShell has no true standard input redirection — the convention is to produce the file's content via a cmdlet (`Get-Content`) then send it into the pipeline.

## Redirecting standard error

The streams are numbered differently from Bash: `1` = standard output, `2` = error, but also `3` (warning), `4` (verbose), `5` (debug), `6` (information) — PowerShell distinguishes more streams than Unix's three:

```powershell
Failing-Command 2> errors.log         # only standard error goes into errors.log
Command 1> output.log 2> errors.log     # separates normal output and errors into two files
Command *> all.log                       # PowerShell shortcut: redirects ALL streams to all.log
```

> **Note:** `*>` has no direct Bash equivalent (which only has `&>` for stdout+stderr) — PowerShell can group up to six distinct streams into a single redirection.

## `$null`: discarding an output

Plays the same role as `/dev/null` on Unix:

```powershell
Noisy-Command > $null 2>&1   # discards all normal output AND all errors
```

## Pipes (`|`): chaining commands, with real objects

```powershell
Get-ChildItem | Where-Object { $_.Extension -eq ".txt" }     # filters by property, not by text
Select-String "404" access.log | Measure-Object | Select-Object -ExpandProperty Count
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5     # the 5 heaviest processes
```

> **Note:** `Where-Object { $_.Extension -eq ".txt" }` filters on an actual property of the file object, whereas Bash's `grep ".txt"` only searches for the text ".txt" anywhere in the line — a file named `report.txt.bak` would match `grep` but not the more precise `-eq ".txt"`.

## `Tee-Object`: redirecting while still displaying

The direct equivalent of Bash's `tee`:

```powershell
Get-ChildItem | Tee-Object -FilePath results.txt   # displays the result AND saves it to a file
```

## Symbol summary

| Symbol | Effect |
|---|---|
| `>` | Redirects standard output, overwrites the file |
| `>>` | Redirects standard output, appends to the end |
| `2>` | Redirects standard error |
| `*>` | Redirects every stream to the same target |
| `\|` | Connects one command's (object) output to the next one's input |

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A PowerShell pipe carries actual .NET objects (properties and methods intact), not text like a Bash pipe — `Where-Object`/`Select-Object` filter on real properties. |
| **Tools you can use** | `>`/`>>`, `*>` (every stream), `$null` (equivalent to `/dev/null`), `Tee-Object`. |
| **Pitfalls to avoid** | Looking for a `<` input-redirection operator — PowerShell doesn't have one, you need to go through a cmdlet (`Get-Content`). |
| **Best practices** | Filter on an actual property (`Where-Object { $_.Extension -eq ".txt" }`) rather than reproducing Bash-style text filtering. |
