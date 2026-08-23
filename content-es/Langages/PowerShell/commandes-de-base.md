---
order: 1
---

# Comandos básicos

Contrariamente a [Bash](/?c=shells&s=bash&p=bash), donde `cd`, `ls` o `cp` son nombres cortos ya familiares para muchos, las cmdlets de PowerShell siguen la convención `Verbo-Nombre` (`Set-Location`, `Get-ChildItem`, `Copy-Item`), más largas, pero explícitas y predecibles una vez entendido el verbo (ver la tabla de verbos estándar en el capítulo sobre las funciones). Este capítulo cubre los comandos usados primero en una terminal, incluso antes de escribir el menor script: moverse, listar, leer un archivo, y encontrar ayuda sobre un comando desconocido.

## Moverse: `Set-Location` y `Get-Location`

```powershell
Get-Location                # muestra la carpeta actual, equivalente a "pwd"
Set-Location C:\Users\Juan  # se mueve a esa carpeta, equivalente a "cd"
Set-Location ..             # sube un nivel
Set-Location -              # vuelve a la carpeta anterior
```

## Listar una carpeta: `Get-ChildItem`

```powershell
Get-ChildItem                # lista el contenido de la carpeta actual
Get-ChildItem -Force         # incluye archivos y carpetas ocultos
Get-ChildItem -Path C:\logs  # lista una carpeta precisa sin moverse a ella
```

> **Nota:** `Get-ChildItem` también hace el trabajo de `find` en cuanto se añade `-Recurse`: ver el capítulo sobre permisos para este uso, así como para crear, copiar, mover y eliminar archivos/carpetas.

## Leer el contenido de un archivo: `Get-Content`

```powershell
Get-Content archivo.txt          # muestra todo el archivo, equivalente a "cat"
Get-Content archivo.txt -Tail 5  # las 5 últimas líneas, equivalente a "tail"
Get-Content archivo.txt -Wait    # sigue mostrando las líneas añadidas al archivo, equivalente a "tail -f"
```

Ver el capítulo sobre procesamiento de texto para ir más lejos (búsqueda, reemplazo, orden sobre el contenido leído por `Get-Content`).

## Alias familiares

PowerShell proporciona por defecto alias hacia estas cmdlets, para mantener la compatibilidad con los reflejos de Bash y el símbolo del sistema de Windows:

| Alias | Cmdlet real |
|---|---|
| `cd` | `Set-Location` |
| `pwd` | `Get-Location` |
| `ls`, `dir` | `Get-ChildItem` |
| `cat`, `type` | `Get-Content` |
| `cp` | `Copy-Item` |
| `mv` | `Move-Item` |
| `rm`, `del` | `Remove-Item` |
| `cls`, `clear` | `Clear-Host` |

> **Nota:** un alias sigue siendo un comando PowerShell como cualquier otro: `cp` acepta los mismos parámetros que `Copy-Item` (`-Recurse` por ejemplo), pero no necesariamente los del comando Unix o cmd del mismo nombre. Ver el capítulo sobre variables de entorno para crear alias propios con `Set-Alias`.

## Obtener ayuda: `Get-Help`

El nombre de una cmdlet no siempre basta para adivinar sus parámetros: `Get-Help` evita tener que buscar en línea:

```powershell
Get-Help Get-ChildItem            # sintaxis y descripción general
Get-Help Get-ChildItem -Examples  # solo ejemplos de uso
Get-Help Get-ChildItem -Full      # descripción completa, todos los parámetros
```

> **Nota:** en el primer lanzamiento, `Get-Help` puede pedir ejecutar `Update-Help` (descarga la documentación actualizada); sin red disponible, una versión mínima ya instalada sigue siendo utilizable.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Las cmdlets de PowerShell siguen la convención `Verbo-Nombre` (`Get-ChildItem`, `Set-Location`), más largas que los comandos de Bash, pero predecibles una vez entendido el verbo. Alias familiares (`cd`, `ls`, `cat`) siguen disponibles. |
| **Herramientas utilizables** | `Get-Location`/`Set-Location`, `Get-ChildItem`, `Get-Content`, `Get-Help`. |
| **Trampas a evitar** | Suponer que un alias (`cp`) acepta exactamente los mismos parámetros que el comando Unix del mismo nombre: en realidad reenvía a `Copy-Item`. |
| **Buenas prácticas** | Usar `Get-Help <cmdlet> -Examples` para descubrir rápidamente el uso de un comando desconocido. |
