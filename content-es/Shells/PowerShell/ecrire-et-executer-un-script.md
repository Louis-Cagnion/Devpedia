---
order: 2
---

# Escribir y ejecutar un script PowerShell

Un script PowerShell es un archivo de texto con la extensión `.ps1`, que contiene una serie de comandos (**cmdlets**) ejecutados en orden, como si se hubieran escrito uno a uno en la consola.

> **Windows PowerShell vs PowerShell (Core)**: *Windows PowerShell* (5.1) es la versión histórica, incluida con Windows, limitada a ese sistema. *PowerShell* (a menudo llamado *PowerShell Core*, versiones 7+) es la reescritura multiplataforma sobre [.NET](https://learn.microsoft.com/en-us/dotnet/), que también funciona en Linux y macOS: es la que se invoca con `pwsh` en lugar de `powershell`. Este sitio cubre esta segunda versión, ampliamente compatible con la primera.

## Sin shebang, pero con una política de ejecución

Windows no usa un shebang como Unix (la extensión `.ps1` basta para identificar el archivo), pero PowerShell bloquea por defecto la ejecución de scripts, por razones de seguridad:

```powershell
Get-ExecutionPolicy   # muestra la política actual, a menudo "Restricted" por defecto
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

| Política | Efecto |
|---|---|
| `Restricted` | Ningún script puede ejecutarse, solo funcionan los comandos interactivos |
| `AllSigned` | Solo los scripts firmados digitalmente pueden ejecutarse |
| `RemoteSigned` | Los scripts locales se ejecutan libremente; los descargados deben estar firmados |
| `Unrestricted` | Todos los scripts se ejecutan, con una simple advertencia para los descargados |

> **Nota:** esta política es propia de Windows (`RemoteSigned` es una elección común en desarrollo): en Linux/macOS con `pwsh`, no tiene ningún efecto, la seguridad recae entonces en los permisos del archivo como para un script Bash (ver [Permisos y manipulación de archivos](/?c=shells&s=powershell&p=permissions-et-fichiers)).

## Ejecutar un script

```powershell
.\script.ps1                 # el ".\" es necesario incluso si la carpeta actual contiene el script
powershell -File script.ps1  # alternativa: lanzar explícitamente el intérprete sobre el archivo
```

> **Nota:** contrariamente a Bash, escribir simplemente `script.ps1` sin prefijo de ruta nunca funciona, aunque el script sea ejecutable: PowerShell nunca busca en la carpeta actual por defecto, incluso si está presente en `$env:PATH`, para evitar que un archivo malicioso de la carpeta actual se ejecute por error en lugar de un comando del sistema con el mismo nombre.

## Los argumentos de un script

```powershell
# script.ps1
param(
    [string]$Nombre,
    [int]$Edad
)

Write-Output "Hola $Nombre, tienes $Edad años"
```

```powershell
.\script.ps1 -Nombre "Juan" -Edad 25
# Hola Juan, tienes 25 años
```

Contrariamente a Bash (`$1`, `$2`, posicionales y sin nombre), un script PowerShell declara sus parámetros con `param()`, cada uno tipado y nombrado: el orden de llamada importa entonces mucho menos, y `-Nombre "Juan"` sigue siendo legible incluso con muchos argumentos.

Los argumentos no declarados en `param()` siguen siendo accesibles a través de la variable automática `$args`, como un equivalente de `$@`:

```powershell
# script.ps1
Write-Output "Número de argumentos : $($args.Count)"
Write-Output "Primer argumento : $($args[0])"
```

## Códigos de salida y gestión de errores

```powershell
if (-not (Test-Path "config.txt")) {
    Write-Error "Falta el archivo de configuración"
    exit 1
}

Write-Output "Todo listo"
exit 0
```

```powershell
.\script.ps1
if ($LASTEXITCODE -eq 0) {
    Write-Output "El script tuvo éxito"
}
```

`$LASTEXITCODE` juega el rol del `$?` de Bash para un comando externo o un `exit` explícito. Pero PowerShell tiene además un verdadero mecanismo de excepciones: `Write-Error` solo no interrumpe la ejecución (esta continúa con la línea siguiente), mientras que `throw` lanza una excepción que detiene el script, salvo que sea interceptada por un bloque `try`/`catch`, como las [excepciones del capítulo dedicado en PHP](/?c=langages-de-programmation&s=php&p=exceptions).

## Detener un script en el primer error: `$ErrorActionPreference`

Por defecto, un error no fatal (el de la mayoría de las cmdlets) no interrumpe el script: equivalente al comportamiento por defecto de Bash sin `set -e`:

```powershell
$ErrorActionPreference = "Stop"   # equivalente a "set -e": todo error se vuelve bloqueante

Set-Location "C:\carpeta\inexistente"   # si esta carpeta no existe, el script se detiene aquí
Write-Output "Esta línea nunca se ejecuta si Set-Location falló"
```

Ver también [La gestión de procesos](/?c=shells&s=powershell&p=gestion-des-processus) para lo que ocurre tras lanzar un script en segundo plano.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un script `.ps1` se ejecuta bajo una política de ejecución (`Get-ExecutionPolicy`), no mediante un shebang. Los parámetros se declaran con `param()`, nombrados y tipados, a diferencia de los `$1`/`$2` posicionales de Bash. |
| **Herramientas utilizables** | `param()`, `$args`, `$LASTEXITCODE`, `try`/`catch`/`throw`, `$ErrorActionPreference = "Stop"`. |
| **Trampas a evitar** | Confundir `Write-Error` (no interrumpe el script) y `throw` (lanza una excepción que lo detiene). |
| **Buenas prácticas** | Usar `param()` para argumentos nombrados y tipados en lugar de depender de `$args` posicional; definir `$ErrorActionPreference = "Stop"` para un comportamiento cercano a `set -e`. |
