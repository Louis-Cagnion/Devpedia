---
order: 9
---

# Redirecciones y pipes

PowerShell retoma las mismas ideas que Bash (redirigir un flujo hacia un archivo, encadenar comandos vía un pipe), pero con una diferencia fundamental: un pipe de Bash transporta **texto**, un pipe de PowerShell transporta verdaderos **objetos .NET**, con sus propiedades y métodos intactos.

## Redirigir la salida hacia un archivo

```powershell
"Hola" > archivo.txt   # sobrescribe archivo.txt (o lo crea) con este contenido
"Otra vez" >> archivo.txt  # agrega al final de archivo.txt, sin sobrescribir
```

> **Nota:** como en Bash, `>` sobrescribe silenciosamente el contenido existente: usar `>>` cuando realmente se quiere agregar.

## Redirigir la entrada desde un archivo

```powershell
Get-Content lista.txt | Sort-Object   # PowerShell no tiene un operador "<" directo: se pasa por una cmdlet
```

> **Nota:** contrariamente a Bash (`sort < lista.txt`), PowerShell no tiene una verdadera redirección de entrada estándar: la convención es producir el contenido del archivo vía una cmdlet (`Get-Content`) y luego enviarlo al pipeline.

## Redirigir la salida de error

Los flujos están numerados de forma distinta a Bash: `1` = salida estándar, `2` = error, pero también `3` (advertencia), `4` (verboso), `5` (depuración), `6` (información); PowerShell distingue más flujos que los tres de Unix:

```powershell
Comando-QueFalla 2> errores.log        # solo la salida de error va a errores.log
Comando 1> salida.log 2> errores.log   # separa la salida normal y los errores en dos archivos
Comando *> todo.log                    # atajo de PowerShell: redirige TODOS los flujos hacia todo.log
```

> **Nota:** `*>` no tiene un equivalente directo en Bash (que solo tiene `&>` para stdout+stderr): PowerShell puede agrupar hasta seis flujos distintos en una sola redirección.

## `$null`: ignorar una salida

Rol equivalente a `/dev/null` en Unix:

```powershell
Comando-Ruidoso > $null 2>&1   # ignora toda salida normal Y todo error
```

## Los pipes (`|`): encadenar comandos, con verdaderos objetos

```powershell
Get-ChildItem | Where-Object { $_.Extension -eq ".txt" }     # filtra por propiedad, no por texto
Select-String "404" access.log | Measure-Object | Select-Object -ExpandProperty Count
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5     # los 5 procesos que más CPU consumen
```

> **Nota:** `Where-Object { $_.Extension -eq ".txt" }` filtra sobre una verdadera propiedad del objeto archivo, mientras que `grep ".txt"` en Bash solo busca el texto ".txt" en cualquier parte de la línea: un archivo llamado `informe.txt.bak` coincidiría con `grep` pero no con `-eq ".txt"`, más preciso.

## `Tee-Object`: redirigir manteniendo la visualización

Equivalente directo de `tee` en Bash:

```powershell
Get-ChildItem | Tee-Object -FilePath resultados.txt   # muestra el resultado Y lo guarda en un archivo
```

## Resumen de los símbolos

| Símbolo | Efecto |
|---|---|
| `>` | Redirige la salida estándar, sobrescribe el archivo |
| `>>` | Redirige la salida estándar, agrega al final |
| `2>` | Redirige la salida de error |
| `*>` | Redirige todos los flujos hacia el mismo destino |
| `\|` | Conecta la salida (de objetos) de un comando a la entrada del siguiente |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un pipe de PowerShell transporta verdaderos objetos .NET (propiedades y métodos intactos), no texto como un pipe de Bash: `Where-Object`/`Select-Object` filtran sobre propiedades reales. |
| **Herramientas utilizables** | `>`/`>>`, `*>` (todos los flujos), `$null` (equivalente de `/dev/null`), `Tee-Object`. |
| **Trampas a evitar** | Buscar un operador `<` de redirección de entrada: PowerShell no tiene uno, hay que pasar por una cmdlet (`Get-Content`). |
| **Buenas prácticas** | Filtrar sobre una propiedad real (`Where-Object { $_.Extension -eq ".txt" }`) en lugar de reproducir un filtrado de texto al estilo Bash. |
