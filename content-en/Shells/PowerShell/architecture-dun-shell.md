---
order: 13
---

# How PowerShell Works (Internal Architecture)

PowerShell relies on the same underlying mechanism as Bash — a loop that reads, interprets, and executes — but it doesn't run directly on the operating system as a plain native executable: it's an environment built on the **.NET Runtime**, which explains both its typed objects (see [Variables](/?c=shells&s=powershell&p=variables) and [Redirections and Pipes](/?c=shells&s=powershell&p=redirections-et-pipes)) and some of its performance differences from Bash.

> **Prerequisite:** this chapter assumes you know what a process is (`fork`/`exec`) — see the chapter on a shell's architecture (Bash section), which details this mechanism on the Unix side; the concepts show up here too, just implemented differently on Windows.

## The main loop (REPL)

Like Bash, an interactive PowerShell session is fundamentally an infinite loop:

```text
while true:
    display the prompt
    read a command line
    split the line into tokens (tokenization)
    resolve each command (cmdlet, function, alias, external executable)
    run the resulting pipeline
    display any uncaptured objects produced by the pipeline
```

## Cmdlet vs. function vs. external executable

Unlike Bash, which only distinguishes *builtin* (run by the shell itself) and *external* (a new process), PowerShell distinguishes three types of commands:

### Cmdlets

`Get-ChildItem`, `Set-Location`, `Write-Output`... are compiled **.NET classes**, packaged in modules — run directly within the PowerShell process (like a Bash *builtin*), but implemented in C#, not interpreted line by line.

### Functions

Written directly in the PowerShell language (`function Greet { ... }`, see [Functions](/?c=shells&s=powershell&p=fonctions)) — interpreted at runtime, like a Bash function, but benefiting from the same typing and the same parameter system as a cmdlet.

### External commands

For an executable like `notepad.exe`, PowerShell delegates creating a new process to the Windows operating system (a role equivalent to `fork`/`execve` in C, but via the Windows `CreateProcess` API):

```text
CreateProcess("notepad.exe", arguments, ...)
// the new process starts in parallel
// PowerShell waits for it to finish (or continues, if launched in the background) depending on context
```

## The object pipeline: what `|` actually carries

This is the most fundamental difference from Bash. A Bash pipe (`cmd1 | cmd2`) connects two **file descriptors** at the operating system level (see [How a Shell Works](/?c=shells&s=bash&p=architecture-dun-shell), with `pipe()`/`dup2()`) — the stream flowing through it is a sequence of bytes, with no structure at all.

A PowerShell pipeline (`Cmd1 | Cmd2`), by contrast, passes actual **.NET objects in memory** directly, one at a time, never serializing them into text between the two commands — this is what lets `Get-ChildItem | Where-Object { $_.Length -gt 1000 }` filter on an actual numeric property, rather than searching for a pattern in formatted text the way `ls -l | grep` would.

> **Note:** this difference has a cost: a PowerShell pipeline keeps all objects in memory as long as they haven't been consumed by the next step, whereas a Bash pipe only streams bytes as they flow — on a very large volume of data, a well-designed Bash script can therefore stay more memory-efficient than an equivalent PowerShell pipeline.

## How PowerShell finds which command to run

If the typed command contains an explicit path (`.\script.ps1`, `C:\tools\notepad.exe`), PowerShell uses it directly. Otherwise, it searches in this order: alias, function, cmdlet, then external executable in `$env:PATH`'s folders — unlike Bash, which only knows builtins and `$PATH`, PowerShell has to arbitrate between four potentially same-named types of commands before choosing which one to run.

## Implementing a pipeline (the conceptual equivalent of `pipe()`)

The PowerShell engine (the *pipeline processor*) instantiates each cmdlet in the pipeline, then calls their .NET `BeginProcessing()`/`ProcessRecord()`/`EndProcessing()` methods, chaining one's output as the next one's input — object by object, as they're produced, rather than waiting for the first cmdlet to finish producing everything:

```text
Cmd1.ProcessRecord() -> produces an object -> immediately passed to Cmd2.ProcessRecord()
```

This mechanism (object-by-object *streaming*) plays, inside the .NET runtime, a role equivalent to `pipe()`/`dup2()` at the operating system level for a Bash pipe — never going through a file descriptor nor the operating system itself, since everything happens within the same process.

## Job control: jobs rather than process groups

Unlike Bash, where `&`, `Ctrl+Z`, `fg`/`bg` manipulate process groups at the operating system level (see [Process Management](/?c=shells&s=bash&p=gestion-des-processus) in Bash), PowerShell manages background work via `Job` objects (see [Process Management](/?c=shells&s=powershell&p=gestion-des-processus)) — a .NET runtime abstraction, not a Windows kernel mechanism shared with the rest of the system's programs.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | PowerShell is built on .NET: cmdlets (compiled classes), functions (interpreted), and external executables (a new process via `CreateProcess`). The pipeline passes actual .NET objects, not text. |
| **Tools you can use** | Command resolution (alias → function → cmdlet → executable), `BeginProcessing`/`ProcessRecord`/`EndProcessing` (object-by-object streaming). |
| **Pitfalls to avoid** | Assuming a PowerShell pipeline is as memory-efficient as a Bash pipe — objects stay in memory as long as they aren't consumed. |
| **Best practices** | Take advantage of the pipeline objects' typing (filter on an actual property) rather than falling back to text processing like in Bash. |
