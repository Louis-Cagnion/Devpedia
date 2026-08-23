---
order: 6
---

# Los bucles

PowerShell propone las mismas estructuras básicas que [Bash](/?c=shells&s=bash&p=bash) (`for`, `while`, hasta una condición), además de un bucle `foreach` dedicado al recorrido de objetos, el más usado en la práctica, ya que casi todo en PowerShell es una colección de objetos en lugar de texto plano.

## El bucle `foreach` (recorrido de colección)

```powershell
foreach ($fruta in "manzana", "banana", "cereza") {
    Write-Output $fruta
}
```

Recorrer los archivos de una carpeta:

```powershell
foreach ($archivo in Get-ChildItem -Filter "*.txt") {
    Write-Output "Procesando $($archivo.Name)"
}
```

Recorrer un rango de números:

```powershell
foreach ($i in 1..5) {
    Write-Output $i
}
```

## `ForEach-Object`: la misma idea, pero vía el pipeline

Contrariamente a `foreach` (una palabra clave del lenguaje), `ForEach-Object` es una cmdlet que recibe sus elementos **vía el pipeline** (ver [Redirecciones y pipes](/?c=shells&s=powershell&p=redirections-et-pipes)), la forma más idiomática en PowerShell para encadenar un procesamiento tras otro comando:

```powershell
Get-ChildItem -Filter "*.txt" | ForEach-Object {
    Write-Output "Procesando $($_.Name)"
}
```

`$_` designa el elemento actual del pipeline dentro del bloque, un rol cercano al que juega implícitamente la variable de bucle de un `foreach` clásico.

## El bucle `for` de estilo C

```powershell
for ($i = 0; $i -lt 5; $i++) {
    Write-Output $i
}
```

## El bucle `while`

El bloque se ejecuta mientras la condición siga siendo verdadera (probada **antes** de cada vuelta):

```powershell
$i = 0

while ($i -lt 5) {
    Write-Output $i
    $i++
}
```

### Leer un archivo línea por línea

```powershell
Get-Content "archivo.txt" | ForEach-Object {
    Write-Output "Línea leída : $_"
}
```

Contrariamente a Bash (`while read -r linea`), leer un archivo línea por línea pasa naturalmente por el pipeline: `Get-Content` produce una colección de líneas, `ForEach-Object` (o `foreach`) la recorre: no hace falta ninguna redirección de entrada estándar.

## El bucle `do`/`while` y `do`/`until`

Contrariamente a `while` (condición probada antes), el bloque `do` se ejecuta siempre **al menos una vez**, la condición solo se prueba después de la primera vuelta:

```powershell
$i = 0

do {
    Write-Output $i
    $i++
} while ($i -lt 5)
```

```powershell
$i = 0

do {
    Write-Output $i
    $i++
} until ($i -ge 5)
```

`do {...} until (...)` es el equivalente directo en PowerShell del `until` de Bash (bloque repetido mientras la condición siga siendo falsa), la única diferencia es la garantía de al menos una pasada, ausente del `while`/`until` de Bash.

## `break` y `continue`

Funcionan como en la mayoría de los lenguajes, incluso dentro de un `ForEach-Object`:

```powershell
foreach ($i in 1..10) {
    if ($i -eq 5) {
        break
    }
    if ($i % 2 -eq 0) {
        continue
    }
    Write-Output $i
}
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `foreach` recorre una colección de objetos; `ForEach-Object` hace lo mismo vía el pipeline. `do`/`while` y `do`/`until` garantizan al menos una pasada, a diferencia de `while`/`until` solos. |
| **Herramientas utilizables** | `1..5` (rango), `$_` (elemento actual del pipeline), `break`/`continue`. |
| **Trampas a evitar** | Confundir `foreach` (palabra clave) y `ForEach-Object` (cmdlet del pipeline): sintaxis y contexto de uso diferentes. |
| **Buenas prácticas** | Preferir `ForEach-Object` en una cadena de pipeline, `foreach` para un bucle autónomo sobre una colección ya en memoria. |
