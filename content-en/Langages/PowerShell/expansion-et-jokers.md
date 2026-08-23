---
order: 8
---

# Expansion and Wildcards

PowerShell reuses [Bash](/?c=shells&s=bash&p=bash) globbing's idea (replacing a pattern with the actual list of matching files), but under a different name (*wildcards*) and with slightly different rules, plus a pattern-matching operator reusable outside of file names.

## Wildcards: `*`, `?`, `[]`

```powershell
Get-ChildItem *.txt                    # every file ending in .txt
Get-ChildItem file?.txt                 # file1.txt, fileA.txt... ('?' = exactly 1 character)
Get-ChildItem file[123].txt             # file1.txt, file2.txt, or file3.txt only
Get-ChildItem file[a-z].txt             # a single lowercase letter at this position
```

| Pattern | Means |
|---|---|
| `*` | Any sequence of characters (including empty) |
| `?` | Exactly one character, any one |
| `[abc]` | A single character among `a`, `b`, or `c` |
| `[a-z]` | A single character within this range |

> **Note:** like Bash globbing, this is **not** a [regex](/?c=domain-specific-languages-dsl&p=regex): these patterns are only interpreted this way by cmdlets that explicitly declare it (`Get-ChildItem`, `-like`), not by PowerShell itself across the entire line the way Bash does before running anything.

## `-like`: applying a wildcard to any string

Unlike Bash, where globbing only applies to actual file names on disk, `-like` applies the same patterns to any string:

```powershell
if ("file1.txt" -like "file?.txt") {
    Write-Output "Matches"
}

"John", "Julia", "Mark" | Where-Object { $_ -like "J*" }
# John
# Julia
```

## What happens if no file matches?

```powershell
Get-ChildItem *.xyz
# if no .xyz file exists, the command returns nothing -> no silent error like in Bash
```

> **Note:** this is an important difference from Bash, where `echo *.xyz` literally displays the text `*.xyz` if nothing matches; PowerShell, by contrast, always resolves the pattern into an actual list (possibly empty), never into the raw, unresolved pattern string.

## Range expansion (`..`)

The closest equivalent to Bash's `{1..5}` brace expansion, but limited to numeric ranges:

```powershell
1..5
# 1 2 3 4 5

foreach ($n in 'a'[0]..'e'[0]) { [char]$n }
# a b c d e -> more verbose than in Bash, PowerShell has no direct equivalent of {a..e}
```

To generate several paths at once (the equivalent of `file{1,2,3}.txt` or `mkdir -p a/{b,c}`), you simply combine a loop with an explicit collection:

```powershell
"src", "tests", "docs" | ForEach-Object { New-Item -ItemType Directory -Path "project\$_" }
```

## Tilde expansion (`~`)

```powershell
Set-Location ~              # equivalent to Set-Location $HOME
Set-Location ~\projects       # equivalent to Set-Location $HOME\projects
```

## Preventing expansion: single quotes

```powershell
Write-Output *.txt      # PowerShell tries to resolve the pattern depending on the command's context
Write-Output '*.txt'     # literally displays *.txt -> single quotes disable interpretation
```

> **Note:** unlike Bash where `*` is expanded by the shell itself even before the command receives it, in PowerShell it's each cmdlet that decides whether to interpret a wildcard received as an argument: `Write-Output *.txt` therefore only displays the text `*.txt`, while `Get-ChildItem *.txt` does resolve it into a list of files.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | PowerShell wildcards (`*`, `?`, `[]`) resemble Bash globbing, but are only interpreted by cmdlets that explicitly declare it: PowerShell itself never expands them across the whole line the way Bash does. |
| **Tools you can use** | `-like` (wildcard on any string), range expansion (`1..5`). |
| **Pitfalls to avoid** | Expecting an unresolved pattern to display literally like in Bash: PowerShell always resolves into an actual list, possibly empty. |
| **Best practices** | Use `-like`/`-match` to apply a pattern to any string, not just file names. |
