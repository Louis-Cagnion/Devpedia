---
order: 4
---

# Variables de entorno

Como en Bash, una variable de entorno se transmite automáticamente a los procesos hijos, pero PowerShell accede a ella mediante un espacio de nombres dedicado (`$env:`), distinto de sus variables clásicas, en lugar de una simple convención (`export`) aplicada a una variable normal.

## Leer y modificar una variable de entorno

```powershell
$env:NOMBRE = "Juan"      # crea o modifica una variable de entorno directamente
Write-Output $env:NOMBRE  # Juan
```

```powershell
# subscript.ps1
Write-Output $env:NOMBRE    # muestra "Juan" si NOMBRE fue definida por el proceso llamador, vacío si no
```

> **Nota:** como con `export` en Bash, la transmisión solo funciona del padre hacia el hijo: un subscript que modifica `$env:NOMBRE` nunca repercute ese cambio hacia el script que lo lanzó, cada proceso tiene su propia copia del entorno.

## Variables de entorno comunes

```powershell
$env:PATH          # lista de carpetas donde PowerShell busca los ejecutables (separadas por ";" en Windows)
$env:USERPROFILE   # carpeta personal del usuario actual (equivalente de $HOME)
$env:USERNAME      # nombre del usuario actual
$env:COMPUTERNAME  # nombre de la máquina
```

## `$env:PATH`: cómo PowerShell encuentra un comando

Como en Bash, PowerShell busca un ejecutable en cada una de las carpetas listadas en `$env:PATH`:

```powershell
$env:PATH
# C:\Windows\system32;C:\Windows;C:\Program Files\PowerShell\7

$env:PATH += ";C:\mi\carpeta\scripts"   # agrega una carpeta adicional a la búsqueda
```

> **Nota:** en Windows, las carpetas de `$env:PATH` se separan con `;`, a diferencia de `:` en Unix, una diferencia a tener en cuenta al portar un script de un sistema a otro.

## Archivos de configuración (perfiles)

| Archivo | Alcance |
|---|---|
| `$PROFILE` (CurrentUserCurrentHost) | Usuario actual, solo PowerShell (Core) |
| Perfil "AllUsersAllHosts" | Todos los usuarios de la máquina |

```powershell
$PROFILE   # muestra la ruta del perfil actual (a crear si aún no existe)
```

En este perfil es donde típicamente se añaden las modificaciones de `$env:PATH`, los alias personalizados, o funciones destinadas a estar disponibles en cada nueva sesión.

## `Set-Alias`: acortar comandos frecuentes

```powershell
Set-Alias -Name ll -Value Get-ChildItem
Set-Alias -Name gs -Value "git status"

ll   # equivalente a escribir "Get-ChildItem"
```

Un alias definido directamente en la consola no sobrevive a su cierre: para que esté disponible en cada nueva sesión, debe añadirse en `$PROFILE`.

## `. $PROFILE`: recargar el perfil

Tras una modificación del perfil, el "dot sourcing" aplica los cambios en la sesión actual, sin tener que abrir una nueva consola:

```powershell
. $PROFILE
```

Este `.` inicial (idéntico al usado para [`source` en Bash](/?c=shells&s=bash&p=variables-denvironnement)) ejecuta el script en el contexto de la sesión actual en lugar de en un subproceso aislado: sin él, las funciones y variables definidas en el archivo desaparecerían al terminar su ejecución.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una variable de entorno de PowerShell vive en el espacio de nombres `$env:`, distinto de las variables clásicas; la transmisión a los procesos hijos solo funciona del padre hacia el hijo, como `export` en Bash. |
| **Herramientas utilizables** | `$env:PATH`, `$PROFILE`, `Set-Alias`, el dot sourcing (`. $PROFILE`). |
| **Trampas a evitar** | Olvidar que `;` separa las carpetas de `$env:PATH` en Windows, a diferencia de `:` en Unix. |
| **Buenas prácticas** | Colocar las modificaciones de `$env:PATH` y los alias en `$PROFILE` para que estén disponibles en cada nueva sesión. |
