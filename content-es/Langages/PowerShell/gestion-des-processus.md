---
order: 12
---

# La gestión de procesos

Como en Bash, cada comando lanzado inicia un **proceso**; PowerShell también permite lanzar comandos en segundo plano, supervisar los procesos en curso, y detenerlos de forma correcta (o no).

## Primer plano vs segundo plano

```powershell
Start-Job -ScriptBlock { .\proceso_largo.ps1 }   # lanza como tarea en segundo plano (job)
Write-Output "La consola queda disponible inmediatamente"
```

## Gestionar las tareas en segundo plano (`Get-Job`, `Receive-Job`)

```powershell
$job = Start-Job -ScriptBlock { .\proceso_largo.ps1 }
Get-Job           # lista los jobs de la sesión actual, con su estado
Wait-Job $job     # espera el fin del job (bloqueante), equivalente de un "fg" que esperaría
Receive-Job $job  # recupera la salida producida por el job
```

> **Nota:** contrariamente a Bash donde `fg`/`bg` alternan una tarea entre primer plano y segundo plano de la **misma** sesión de consola, un `Job` de PowerShell corre en un proceso separado desde el inicio: `Receive-Job` recupera su resultado una vez terminado, en lugar de "traerlo de vuelta" a la consola actual.

## Ver los procesos en curso (`Get-Process`)

```powershell
Get-Process                                                         # lista todos los procesos, con CPU, memoria, PID...
Get-Process | Where-Object { $_.Name -like "*chrome*" }             # filtra por nombre, equivalente de "ps aux | grep"
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5  # los 5 procesos que más CPU consumen
```

## Terminar un proceso (`Stop-Process`)

```powershell
Stop-Process -Id 1234         # solicita la detención del proceso (equivalente más cercano a SIGTERM)
Stop-Process -Id 1234 -Force  # detención forzada, sin esperar un cierre correcto (equivalente de SIGKILL)
Stop-Process -Name "notepad"  # apunta por nombre en lugar de por PID
```

> **Nota:** Windows no tiene un verdadero equivalente de las señales Unix (`SIGTERM`, `SIGKILL`, `SIGINT`...): `Stop-Process` sin `-Force` pide al proceso que termine, pero el mecanismo subyacente sigue siendo diferente del envío de una señal interceptable como en Unix; la mayoría de las aplicaciones de Windows no tienen tampoco un gestor dedicado para "cerrarse correctamente" al estilo de un [`trap SIGTERM`](/?c=shells&s=bash&p=gestion-des-processus) en Bash.

| Acción | Bash (señal) | PowerShell |
|---|---|---|
| Solicitar una detención correcta | `kill` (`SIGTERM`) | `Stop-Process -Id <pid>` |
| Forzar la detención | `kill -9` (`SIGKILL`) | `Stop-Process -Id <pid> -Force` |
| Interrumpir desde el teclado | `Ctrl+C` (`SIGINT`) | `Ctrl+C` (dispara una excepción `PipelineStoppedException`) |

## Desvincular un proceso de la consola

Contrariamente a `nohup` en Bash, un `Job` de PowerShell (`Start-Job`) ya corre en un proceso separado del proceso de consola: cerrar la consola no interrumpe necesariamente el job según el contexto (sesión local vs remota), sin necesitar una herramienta dedicada equivalente a `nohup`.

## Encontrar un proceso por su nombre

```powershell
Get-Process -Name "*proceso_largo*"                 # equivalente de pgrep
Get-Process -Name "*proceso_largo*" | Stop-Process  # encuentra Y termina, equivalente de pkill
```

> **`Get-Process` vs `Stop-Process`**: como el par `pgrep`/`pkill` en Bash, buscar un proceso (lectura) y terminarlo (acción) siguen siendo dos cmdlets distintas, combinadas por un pipe en lugar de por una bandera compartida. Existe el mismo riesgo que con `pkill`: un filtro `-Name` demasiado amplio puede apuntar a más procesos de los previstos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `Start-Job` lanza una tarea en segundo plano en un proceso separado. `Stop-Process` solicita o fuerza la detención de un proceso; Windows no tiene un verdadero equivalente de las señales Unix. |
| **Herramientas utilizables** | `Get-Job`/`Receive-Job`/`Wait-Job`, `Get-Process`, `Stop-Process -Force`. |
| **Trampas a evitar** | Apuntar `Stop-Process` con un filtro `-Name` demasiado amplio: riesgo de detener más procesos de los previstos. |
| **Buenas prácticas** | Probar `Stop-Process` sin `-Force` antes de forzar la detención, cuando la aplicación lo permite. |
