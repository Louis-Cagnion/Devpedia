---
order: 8
---

# Expansión y comodines (wildcards)

PowerShell retoma la idea del globbing de [Bash](/?c=shells&s=bash&p=bash) (reemplazar un patrón por la lista real de archivos correspondientes), pero con un nombre diferente (*wildcards*) y con reglas ligeramente distintas, además de un operador de coincidencia de patrones reutilizable fuera de los nombres de archivo.

## Los wildcards: `*`, `?`, `[]`

```powershell
Get-ChildItem *.txt             # todos los archivos que terminan en .txt
Get-ChildItem archivo?.txt      # archivo1.txt, archivoA.txt... ('?' = exactamente 1 carácter)
Get-ChildItem archivo[123].txt  # archivo1.txt, archivo2.txt o archivo3.txt únicamente
Get-ChildItem archivo[a-z].txt  # una sola letra minúscula en esa posición
```

| Patrón | Significa |
|---|---|
| `*` | Cualquier secuencia de caracteres (incluida vacía) |
| `?` | Exactamente un carácter, cualquiera que sea |
| `[abc]` | Un solo carácter entre `a`, `b` o `c` |
| `[a-z]` | Un solo carácter en ese rango |

> **Nota:** como el globbing de Bash, esto **no** es una [regex](/?c=domain-specific-languages-dsl&p=regex): estos patrones solo son interpretados así por las cmdlets que lo anuncian explícitamente (`Get-ChildItem`, `-like`), no por PowerShell mismo a escala de toda la línea como lo hace Bash antes de ejecutar cualquier cosa.

## `-like`: aplicar un wildcard a cualquier cadena

Contrariamente a Bash, donde el globbing solo se aplica a nombres de archivo reales en el disco, `-like` aplica los mismos patrones a cualquier cadena:

```powershell
if ("archivo1.txt" -like "archivo?.txt") {
    Write-Output "Coincide"
}

"Juan", "Julia", "Marcos" | Where-Object { $_ -like "J*" }
# Juan
# Julia
```

## ¿Qué pasa si ningún archivo coincide?

```powershell
Get-ChildItem *.xyz
# si no existe ningún archivo .xyz, el comando no devuelve nada -> sin error silencioso como en Bash
```

> **Nota:** es una diferencia importante con Bash, donde `echo *.xyz` muestra literalmente el texto `*.xyz` si nada coincide; PowerShell, en cambio, siempre resuelve el patrón en una lista real (eventualmente vacía), nunca en la cadena bruta del patrón no resuelto.

## La expansión de rango (`..`)

Equivalente más cercano a la expansión de llaves `{1..5}` de Bash, pero limitado a rangos numéricos:

```powershell
1..5
# 1 2 3 4 5

foreach ($n in 'a'[0]..'e'[0]) { [char]$n }
# a b c d e -> más verboso que en Bash, PowerShell no tiene un equivalente directo de {a..e}
```

Para generar varias rutas a la vez (equivalente de `archivo{1,2,3}.txt` o `mkdir -p a/{b,c}`), simplemente se combina un bucle con una colección explícita:

```powershell
"src", "tests", "docs" | ForEach-Object { New-Item -ItemType Directory -Path "proyecto\$_" }
```

## La expansión de la virgulilla (`~`)

```powershell
Set-Location ~           # equivalente a Set-Location $HOME
Set-Location ~\proyectos # equivalente a Set-Location $HOME\proyectos
```

## Impedir la expansión: las comillas simples

```powershell
Write-Output *.txt    # PowerShell intenta resolver el patrón según el contexto del comando
Write-Output '*.txt'  # muestra literalmente *.txt -> las comillas simples desactivan la interpretación
```

> **Nota:** contrariamente a Bash donde `*` es expandido por el propio shell incluso antes de que el comando lo reciba, en PowerShell es cada cmdlet la que decide interpretar o no un wildcard recibido como argumento: `Write-Output *.txt` por tanto solo muestra el texto `*.txt`, mientras que `Get-ChildItem *.txt` sí lo resuelve en una lista de archivos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Los wildcards de PowerShell (`*`, `?`, `[]`) se parecen al globbing de Bash, pero solo son interpretados por las cmdlets que lo anuncian explícitamente: PowerShell mismo nunca los expande a escala de toda la línea como lo hace Bash. |
| **Herramientas utilizables** | `-like` (wildcard sobre cualquier cadena), la expansión de rango (`1..5`). |
| **Trampas a evitar** | Esperar que un patrón no resuelto se muestre literalmente como en Bash: PowerShell siempre resuelve en una lista real, eventualmente vacía. |
| **Buenas prácticas** | Usar `-like`/`-match` para aplicar un patrón a cualquier cadena, no solo a nombres de archivo. |
