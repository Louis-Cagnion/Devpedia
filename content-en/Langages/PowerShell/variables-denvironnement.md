---
order: 4
---

# Environment Variables

Like in [Bash](/?c=shells&s=bash&p=bash), an environment variable is automatically passed to child processes, but PowerShell accesses it through a dedicated namespace (`$env:`), distinct from its regular variables, rather than a simple convention (`export`) applied to a normal variable.

## Reading and modifying an environment variable

```powershell
$env:NAME = "John"          # creates or modifies an environment variable directly
Write-Output $env:NAME       # John
```

```powershell
# subscript.ps1
Write-Output $env:NAME    # displays "John" if NAME was set by the calling process, empty otherwise
```

> **Note:** as with `export` in Bash, propagation only works from parent to child: a subscript that modifies `$env:NAME` never propagates that change back to the script that launched it, each process having its own copy of the environment.

## Common environment variables

```powershell
$env:PATH     # list of folders where PowerShell looks for executables (separated by ";" on Windows)
$env:USERPROFILE   # current user's home folder (equivalent to $HOME)
$env:USERNAME  # current user's name
$env:COMPUTERNAME  # machine name
```

## `$env:PATH`: how PowerShell finds a command

Like Bash, PowerShell looks for an executable in each of the folders listed in `$env:PATH`:

```powershell
$env:PATH
# C:\Windows\system32;C:\Windows;C:\Program Files\PowerShell\7

$env:PATH += ";C:\my\scripts\folder"   # adds an extra folder to the search
```

> **Note:** on Windows, `$env:PATH`'s folders are separated by `;`, unlike `:` on Unix, a difference to keep in mind when porting a script from one system to the other.

## Configuration files (profiles)

| File | Scope |
|---|---|
| `$PROFILE` (CurrentUserCurrentHost) | Current user, PowerShell (Core) only |
| "AllUsersAllHosts" profile | Every user on the machine |

```powershell
$PROFILE   # displays the current profile's path (to create if it doesn't exist yet)
```

This profile is typically where `$env:PATH` changes, custom aliases, or functions meant to be available in every new session get added.

## `Set-Alias`: shortening frequent commands

```powershell
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name gs -Value "git status"

ll   # equivalent to typing "Get-ChildItem"
```

An alias defined directly in the console doesn't survive closing it: to have it available in every new session, it needs to be added to `$PROFILE`.

## `. $PROFILE`: reloading the profile

After modifying the profile, "dot sourcing" applies the changes in the current session, with no need to open a new console:

```powershell
. $PROFILE
```

This leading `.` (identical to the one used for [`source` in Bash](/?c=shells&s=bash&p=variables-denvironnement)) runs the script in the current session's context rather than in an isolated subprocess: without it, the functions and variables defined in the file would disappear as soon as it finished running.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A PowerShell environment variable lives in the `$env:` namespace, distinct from regular variables; propagation to child processes only works from parent to child, like `export` in Bash. |
| **Tools you can use** | `$env:PATH`, `$PROFILE`, `Set-Alias`, dot sourcing (`. $PROFILE`). |
| **Pitfalls to avoid** | Forgetting that `;` separates `$env:PATH`'s folders on Windows, unlike `:` on Unix. |
| **Best practices** | Put `$env:PATH` changes and aliases in `$PROFILE` so they're available in every new session. |
