---
order: 12
---

# Process Management

As with Bash, every command launched starts a **process** — PowerShell also makes it possible to launch commands in the background, monitor running processes, and stop them cleanly (or not).

## Foreground vs. background

```powershell
Start-Job -ScriptBlock { .\long_process.ps1 }   # launches as a background job
Write-Output "The console is immediately available again"
```

## Managing background jobs (`Get-Job`, `Receive-Job`)

```powershell
$job = Start-Job -ScriptBlock { .\long_process.ps1 }
Get-Job                        # lists the current session's jobs, with their state
Wait-Job $job                   # waits for the job to finish (blocking), equivalent to an "fg" that would wait
Receive-Job $job                # retrieves the output produced by the job
```

> **Note:** unlike Bash where `fg`/`bg` switch a task between foreground and background within the **same** console session, a PowerShell `Job` runs in a separate process from the start — `Receive-Job` retrieves its result once finished, rather than "bringing it back" into the current console.

## Viewing running processes (`Get-Process`)

```powershell
Get-Process                                    # lists every process, with CPU, memory, PID...
Get-Process | Where-Object { $_.Name -like "*chrome*" }   # filters by name, equivalent to "ps aux | grep"
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5   # the 5 heaviest CPU consumers
```

## Ending a process (`Stop-Process`)

```powershell
Stop-Process -Id 1234              # requests the process to stop (closest equivalent to SIGTERM)
Stop-Process -Id 1234 -Force        # forced stop, with no wait for a clean shutdown (equivalent to SIGKILL)
Stop-Process -Name "notepad"         # targets by name rather than PID
```

> **Note:** Windows has no true equivalent of Unix signals (`SIGTERM`, `SIGKILL`, `SIGINT`...) — `Stop-Process` with no `-Force` asks the process to terminate, but the underlying mechanism remains different from sending a catchable signal like on Unix; most Windows applications, for that matter, have no dedicated handler for "shutting down cleanly" the way a Bash [`trap SIGTERM`](/?c=shells&s=bash&p=gestion-des-processus) does.

| Action | Bash (signal) | PowerShell |
|---|---|---|
| Request a clean stop | `kill` (`SIGTERM`) | `Stop-Process -Id <pid>` |
| Force a stop | `kill -9` (`SIGKILL`) | `Stop-Process -Id <pid> -Force` |
| Interrupt from the keyboard | `Ctrl+C` (`SIGINT`) | `Ctrl+C` (triggers a `PipelineStoppedException`) |

## Detaching a process from the console

Unlike `nohup` in Bash, a PowerShell `Job` (`Start-Job`) already runs in a process separate from the console process — closing the console therefore doesn't necessarily interrupt the job depending on the context (local vs. remote session), with no need for a dedicated tool equivalent to `nohup`.

## Finding a process by its name

```powershell
Get-Process -Name "*long_process*"                          # equivalent to pgrep
Get-Process -Name "*long_process*" | Stop-Process             # finds AND terminates, equivalent to pkill
```

> **`Get-Process` vs. `Stop-Process`**: like the `pgrep`/`pkill` pair in Bash, finding a process (reading) and terminating it (acting) remain two separate cmdlets — combined via a pipe rather than a shared flag. The same risk exists as with `pkill`: an overly broad `-Name` filter can target more processes than intended.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | `Start-Job` launches a background task in a separate process. `Stop-Process` requests or forces a process to stop — Windows has no true equivalent of Unix signals. |
| **Tools you can use** | `Get-Job`/`Receive-Job`/`Wait-Job`, `Get-Process`, `Stop-Process -Force`. |
| **Pitfalls to avoid** | Targeting `Stop-Process` with an overly broad `-Name` filter — risk of stopping more processes than intended. |
| **Best practices** | Try `Stop-Process` without `-Force` before forcing a stop, when the application allows it. |
