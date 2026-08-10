---
order: 1
---

# Basic Commands

Unlike Bash, where `cd`, `ls`, or `cp` are short names already familiar to many, PowerShell cmdlets follow the `Verb-Noun` convention (`Set-Location`, `Get-ChildItem`, `Copy-Item`) — longer, but explicit and predictable once you understand the verb (see the table of standard verbs in the chapter on functions). This chapter covers the commands used first in a terminal, before writing a single script: moving around, listing, reading a file, and finding help on an unfamiliar command.

## Moving around: `Set-Location` and `Get-Location`

```powershell
Get-Location                   # displays the current folder, equivalent to "pwd"
Set-Location C:\Users\John      # moves into this folder, equivalent to "cd"
Set-Location ..                  # moves up one level
Set-Location -                   # returns to the previous folder
```

## Listing a folder: `Get-ChildItem`

```powershell
Get-ChildItem                    # lists the current folder's content
Get-ChildItem -Force              # includes hidden files and folders
Get-ChildItem -Path C:\logs        # lists a specific folder without moving into it
```

> **Note:** `Get-ChildItem` also does `find`'s job as soon as you add `-Recurse` — see the chapter on permissions for this use, as well as for creating, copying, moving, and deleting files/folders.

## Reading a file's content: `Get-Content`

```powershell
Get-Content file.txt           # displays the entire file, equivalent to "cat"
Get-Content file.txt -Tail 5    # the last 5 lines, equivalent to "tail"
Get-Content file.txt -Wait       # keeps displaying lines added to the file, equivalent to "tail -f"
```

See the chapter on text processing to go further (searching, replacing, sorting the content read by `Get-Content`).

## Familiar aliases

PowerShell provides default aliases to these cmdlets, to stay compatible with Bash reflexes and the Windows command prompt:

| Alias | Actual cmdlet |
|---|---|
| `cd` | `Set-Location` |
| `pwd` | `Get-Location` |
| `ls`, `dir` | `Get-ChildItem` |
| `cat`, `type` | `Get-Content` |
| `cp` | `Copy-Item` |
| `mv` | `Move-Item` |
| `rm`, `del` | `Remove-Item` |
| `cls`, `clear` | `Clear-Host` |

> **Note:** an alias is still a PowerShell command like any other — `cp` accepts the same parameters as `Copy-Item` (`-Recurse`, for instance), but not necessarily those of the Unix or cmd command of the same name. See the chapter on environment variables to create your own aliases with `Set-Alias`.

## Getting help: `Get-Help`

A cmdlet's name isn't always enough to guess its parameters — `Get-Help` avoids having to search online:

```powershell
Get-Help Get-ChildItem             # syntax and general description
Get-Help Get-ChildItem -Examples    # usage examples only
Get-Help Get-ChildItem -Full         # full description, every parameter
```

> **Note:** on first launch, `Get-Help` may ask you to run `Update-Help` (downloads up-to-date documentation) — with no network available, an already-installed minimal version remains usable.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | PowerShell cmdlets follow the `Verb-Noun` convention (`Get-ChildItem`, `Set-Location`) — longer than Bash commands, but predictable once you understand the verb. Familiar aliases (`cd`, `ls`, `cat`) remain available. |
| **Tools you can use** | `Get-Location`/`Set-Location`, `Get-ChildItem`, `Get-Content`, `Get-Help`. |
| **Pitfalls to avoid** | Assuming an alias (`cp`) accepts exactly the same parameters as the Unix command of the same name — it actually relays `Copy-Item`. |
| **Best practices** | Use `Get-Help <cmdlet> -Examples` to quickly discover how to use an unfamiliar command. |
