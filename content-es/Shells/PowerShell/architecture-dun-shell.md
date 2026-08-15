---
order: 13
---

# Cómo funciona PowerShell (arquitectura interna)

PowerShell se apoya en la misma mecánica de fondo que Bash (un bucle que lee, interpreta y ejecuta), pero no corre directamente sobre el sistema operativo como un simple ejecutable nativo: es un entorno construido sobre el [**.NET Runtime**](https://learn.microsoft.com/en-us/dotnet/), lo que explica tanto sus objetos tipados (ver [Las variables](/?c=shells&s=powershell&p=variables) y [Redirecciones y pipes](/?c=shells&s=powershell&p=redirections-et-pipes)) como algunas de sus diferencias de rendimiento con Bash.

> **Prerrequisito:** este capítulo supone conocido qué es un proceso (`fork`/`exec`), ver el capítulo sobre la arquitectura de un shell (sección Bash), que detalla este mecanismo del lado Unix; los conceptos se encuentran aquí también, pero implementados de forma diferente en Windows.

## El bucle principal (REPL)

Como en Bash, una sesión interactiva de PowerShell es fundamentalmente un bucle infinito:

```text
mientras verdadero :
    mostrar el prompt
    leer una línea de comando
    dividir la línea en tokens (tokenización)
    resolver cada comando (cmdlet, función, alias, ejecutable externo)
    ejecutar el pipeline resultante
    mostrar los objetos no capturados producidos por el pipeline
```

## Cmdlet vs función vs ejecutable externo

Contrariamente a Bash, que solo distingue *builtin* (ejecutado por el propio shell) y *externo* (nuevo proceso), PowerShell distingue tres tipos de comandos:

### Las cmdlets

`Get-ChildItem`, `Set-Location`, `Write-Output`... son clases **.NET compiladas**, empaquetadas en módulos, ejecutadas directamente en el proceso de PowerShell (como un *builtin* de Bash), pero implementadas en [C#](https://learn.microsoft.com/en-us/dotnet/csharp/), no interpretadas línea por línea.

### Las funciones

Escritas directamente en lenguaje PowerShell (`function Saludar { ... }`, ver [Las funciones](/?c=shells&s=powershell&p=fonctions)), interpretadas en tiempo de ejecución, como una función Bash, pero beneficiándose del mismo tipado y del mismo sistema de parámetros que una cmdlet.

### Los comandos externos

Para un ejecutable como `notepad.exe`, PowerShell delega en el sistema operativo Windows la creación de un nuevo proceso (rol equivalente a `fork`/`execve` en C, pero vía la API de Windows `CreateProcess`):

```text
CreateProcess("notepad.exe", argumentos, ...)
// el nuevo proceso arranca en paralelo
// PowerShell espera su fin (o continúa, si se lanzó en segundo plano) según el contexto
```

## El pipeline de objetos: lo que `|` hace circular realmente

Es la diferencia más fundamental con Bash. Un pipe de Bash (`cmd1 | cmd2`) conecta dos **descriptores de archivo** a nivel del sistema operativo (ver [Cómo funciona un shell](/?c=shells&s=bash&p=architecture-dun-shell), con `pipe()`/`dup2()`): el flujo que circula por ahí es una secuencia de bytes, sin ninguna estructura.

Un pipeline de PowerShell (`Cmd1 | Cmd2`), en cambio, transmite directamente **objetos .NET en memoria**, uno por uno, sin nunca serializarlos en texto entre los dos comandos: eso es lo que permite que `Get-ChildItem | Where-Object { $_.Length -gt 1000 }` filtre sobre una verdadera propiedad numérica, en lugar de buscar un patrón en texto formateado como lo haría un `ls -l | grep`.

> **Nota:** esta diferencia tiene un costo: un pipeline de PowerShell mantiene todos los objetos en memoria mientras no hayan sido consumidos por la etapa siguiente, mientras que un pipe de Bash solo hace circular bytes sobre la marcha: sobre un volumen de datos muy grande, un script Bash bien diseñado puede entonces seguir siendo más económico en memoria que un pipeline de PowerShell equivalente.

## Cómo PowerShell encuentra qué comando lanzar

Si el comando escrito contiene una ruta explícita (`.\script.ps1`, `C:\herramientas\notepad.exe`), PowerShell la usa directamente. Si no, busca en este orden: alias, función, cmdlet, y luego ejecutable externo en las carpetas de `$env:PATH`: contrariamente a Bash, que solo conoce builtins y `$PATH`, PowerShell debe desempatar entre cuatro tipos de comandos potencialmente homónimos antes de elegir cuál ejecutar.

## Implementar un pipeline (equivalente conceptual de `pipe()`)

El motor de PowerShell (el *pipeline processor*) instancia cada cmdlet del pipeline, y luego llama a sus métodos `.NET` `BeginProcessing()`/`ProcessRecord()`/`EndProcessing()` encadenando la salida de una como entrada de la siguiente: objeto por objeto, a medida que se producen, en lugar de esperar a que la primera cmdlet haya terminado de producir todo:

```text
Cmd1.ProcessRecord() -> produce un objeto -> transmitido inmediatamente a Cmd2.ProcessRecord()
```

Es este mecanismo (el *streaming* objeto por objeto) el que juega, dentro del runtime .NET, un rol equivalente al de `pipe()`/`dup2()` a nivel del sistema operativo para un pipe de Bash, sin pasar nunca por un descriptor de archivo ni por el sistema operativo mismo, ya que todo ocurre dentro del mismo proceso.

## El control de tareas: jobs en lugar de grupos de procesos

Contrariamente a Bash, donde `&`, `Ctrl+Z`, `fg`/`bg` manipulan grupos de procesos a nivel del sistema operativo (ver [La gestión de procesos](/?c=shells&s=bash&p=gestion-des-processus) en Bash), PowerShell gestiona el segundo plano vía objetos `Job` (ver [La gestión de procesos](/?c=shells&s=powershell&p=gestion-des-processus)), una abstracción del runtime .NET, no un mecanismo del núcleo de Windows compartido con los demás programas del sistema.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | PowerShell se apoya en .NET: cmdlets (clases compiladas), funciones (interpretadas) y ejecutables externos (nuevo proceso vía `CreateProcess`). El pipeline transmite verdaderos objetos .NET, no texto. |
| **Herramientas utilizables** | Resolución de comando (alias → función → cmdlet → ejecutable), `BeginProcessing`/`ProcessRecord`/`EndProcessing` (streaming objeto por objeto). |
| **Trampas a evitar** | Suponer que un pipeline de PowerShell es tan económico en memoria como un pipe de Bash: los objetos permanecen en memoria mientras no se consuman. |
| **Buenas prácticas** | Aprovechar el tipado de los objetos del pipeline (filtrar sobre una propiedad real) en lugar de recaer en un procesamiento de texto al estilo Bash. |
