---
order: 2
---

# Writing and Running a PowerShell Script

A PowerShell script is a text file with a `.ps1` extension, containing a sequence of commands (**cmdlets**) run in order, as if they'd been typed one by one in the console.

> **Windows PowerShell vs. PowerShell (Core)**: *Windows PowerShell* (5.1) is the historical version, shipped with Windows, limited to that system. *PowerShell* (often called *PowerShell Core*, versions 7+) is the cross-platform rewrite on [.NET](https://learn.microsoft.com/en-us/dotnet/), which also runs on Linux and macOS: it's the one invoked via `pwsh` rather than `powershell`. This site covers this second version, largely compatible with the first.

## No shebang, but an execution policy

Windows doesn't use a shebang like Unix (the `.ps1` extension is enough to identify the file), but PowerShell blocks script execution by default, for security reasons:

```powershell
Get-ExecutionPolicy   # displays the current policy, often "Restricted" by default
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

| Policy | Effect |
|---|---|
| `Restricted` | No script can run, only interactive commands work |
| `AllSigned` | Only digitally signed scripts can run |
| `RemoteSigned` | Local scripts run freely; downloaded ones must be signed |
| `Unrestricted` | Every script runs, with just a warning for downloaded ones |

> **Note:** this policy is specific to Windows (`RemoteSigned` is a common choice in development); on Linux/macOS with `pwsh`, it has no effect, security instead relying on the file's permissions like for a [Bash](/?c=shells&s=bash&p=bash) script (see [Permissions and File Manipulation](/?c=shells&s=powershell&p=permissions-et-fichiers)).

## Running a script

```powershell
.\script.ps1        # the ".\" is needed even if the current folder contains the script
powershell -File script.ps1   # alternative: explicitly launch the interpreter on the file
```

> **Note:** unlike Bash, simply typing `script.ps1` with no path prefix never works, even if the script is executable: PowerShell never searches the current folder by default, even if it's present in `$env:PATH`, to prevent a malicious file in the current folder from being run by mistake instead of a system command of the same name.

## A script's arguments

```powershell
# script.ps1
param(
    [string]$Name,
    [int]$Age
)

Write-Output "Hello $Name, you are $Age years old"
```

```powershell
.\script.ps1 -Name "John" -Age 25
# Hello John, you are 25 years old
```

Unlike Bash (`$1`, `$2`, positional and unnamed), a PowerShell script declares its parameters with `param()`, each typed and named: call order then matters much less, and `-Name "John"` stays readable even with many arguments.

Arguments not declared in `param()` remain accessible via the `$args` automatic variable, an equivalent of `$@`:

```powershell
# script.ps1
Write-Output "Number of arguments: $($args.Count)"
Write-Output "First argument: $($args[0])"
```

## Exit codes and error handling

```powershell
if (-not (Test-Path "config.txt")) {
    Write-Error "Config file missing"
    exit 1
}

Write-Output "Everything is ready"
exit 0
```

```powershell
.\script.ps1
if ($LASTEXITCODE -eq 0) {
    Write-Output "The script succeeded"
}
```

`$LASTEXITCODE` plays the role of Bash's `$?` for an external command or an explicit `exit`. But PowerShell also has a real exception mechanism on top: `Write-Error` alone doesn't stop execution (it continues with the next line), whereas `throw` raises an exception that stops the script, unless it's caught by a `try`/`catch` block, like the [exceptions from PHP's dedicated chapter](/?c=langages-de-programmation&s=php&p=exceptions).

## Stopping a script on the first error: `$ErrorActionPreference`

By default, a non-fatal error (the kind most cmdlets produce) doesn't stop the script, equivalent to Bash's default behavior with no `set -e`:

```powershell
$ErrorActionPreference = "Stop"   # equivalent to "set -e": every error becomes blocking

Set-Location "C:\nonexistent\folder"   # if this folder doesn't exist, the script stops here
Write-Output "This line never runs if Set-Location failed"
```

See also [Process Management](/?c=shells&s=powershell&p=gestion-des-processus) for what happens after launching a script in the background.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A `.ps1` script runs under an execution policy (`Get-ExecutionPolicy`), not via a shebang. Parameters are declared with `param()`, named and typed, unlike Bash's positional `$1`/`$2`. |
| **Tools you can use** | `param()`, `$args`, `$LASTEXITCODE`, `try`/`catch`/`throw`, `$ErrorActionPreference = "Stop"`. |
| **Pitfalls to avoid** | Confusing `Write-Error` (doesn't stop the script) with `throw` (raises an exception that stops it). |
| **Best practices** | Use `param()` for named, typed arguments rather than relying on positional `$args`; set `$ErrorActionPreference = "Stop"` for behavior close to `set -e`. |
