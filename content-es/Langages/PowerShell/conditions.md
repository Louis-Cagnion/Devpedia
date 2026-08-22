---
order: 5
---

# Las condiciones

Contrariamente a Bash, donde una condición pasa por el código de salida de un comando de prueba (`[`, `[[`), PowerShell tiene verdaderos **operadores de comparación integrados al lenguaje**, como en [PHP](/?c=langages-de-programmation&s=php&p=conditions) o en [C](/?c=langages-de-programmation&s=c&p=conditions).

## `if` / `elseif` / `else`

```powershell
$edad = 18

if ($edad -ge 18) {
    Write-Output "Eres mayor de edad."
} else {
    Write-Output "Eres menor de edad."
}
```

- Los bloques se delimitan con llaves `{ }`, como en C/PHP/JavaScript, no con palabras clave de cierre (`fi`).
- La condición entre paréntesis es una verdadera expresión booleana, no la llamada a un comando externo como el `[` de Bash.

## Los operadores de comparación

Contrariamente a Bash, un único conjunto de operadores sirve tanto para números como para cadenas: sin distinción `-eq`/`==` según el tipo comparado:

```powershell
if ($edad -eq 18) { Write-Output "Exactamente 18" }
```

| Operador | Significado |
|---|---|
| `-eq` | Igual |
| `-ne` | Distinto |
| `-lt` | Menor |
| `-le` | Menor o igual |
| `-gt` | Mayor |
| `-ge` | Mayor o igual |

> **Nota:** estos operadores siguen siendo palabras clave de PowerShell (`-eq`, no `==`) aunque la sintaxis recuerde las banderas de Bash: `==` no existe como operador de comparación en PowerShell.

## Comparar cadenas

```powershell
$nombre = "Juan"

if ($nombre -eq "Juan") {
    Write-Output "Hola Juan"
}

if ([string]::IsNullOrEmpty($nombre)) {
    Write-Output "nombre está vacío"
}
```

| Operador | Significado |
|---|---|
| `-eq` / `-ne` | Igualdad / diferencia, **sensible a mayúsculas por defecto con `-ceq`**, insensible en caso contrario |
| `-like` | Coincidencia con un patrón tipo comodín (`*`, `?`) |
| `-match` | Coincidencia con una expresión regular |

> **Nota:** `-eq` sobre cadenas es insensible a mayúsculas por defecto (`"Juan" -eq "juan"` es verdadero); anteponer una `c` (`-ceq`, `-clike`, `-cmatch`) fuerza una comparación sensible a mayúsculas, lo contrario de la mayoría de los lenguajes donde las mayúsculas cuentan por defecto.

## Probar archivos

```powershell
if (Test-Path "config.txt" -PathType Leaf) {
    Write-Output "El archivo existe"
}

if (Test-Path "C:\var\www" -PathType Container) {
    Write-Output "La carpeta existe"
}
```

`Test-Path` reemplaza por sí sola todas las pruebas de archivos de Bash (`-f`, `-d`, `-e`): `-PathType Leaf` para un archivo, `-PathType Container` para una carpeta, sin argumento para "existe, sin importar el tipo".

## Combinar condiciones

```powershell
if ((Test-Path "config.txt") -and (Get-Item "config.txt").Length -gt 0) {
    Write-Output "El archivo existe y no está vacío"
}
```

`-and`/`-or`/`-not` reemplazan respectivamente `&&`/`||`/`!` de Bash: los operadores simbólicos no existen para la lógica booleana en PowerShell.

## El `switch` (equivalente del `case` de Bash)

```powershell
$dia = "mie"

switch ($dia) {
    { $_ -in "lun", "mar", "mie", "jue", "vie" } { Write-Output "Día de semana" }
    { $_ -in "sab", "dom" } { Write-Output "Fin de semana" }
    default { Write-Output "Día desconocido" }
}
```

`$_` designa el valor probado (el que se pasa entre paréntesis a `switch`), `-in` prueba su pertenencia a una lista, y `default` captura todo lo demás: equivalente del `*)` final de un `case` de Bash.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | PowerShell tiene verdaderos operadores de comparación integrados al lenguaje (`-eq`, `-lt`...), a diferencia de Bash que se apoya en comandos de prueba. Un único conjunto de operadores sirve para números y cadenas. |
| **Herramientas utilizables** | `Test-Path` (reemplaza `-f`/`-d`/`-e` de Bash), `-and`/`-or`/`-not`, `-like`/`-match`. |
| **Trampas a evitar** | Olvidar que `-eq` sobre cadenas es insensible a mayúsculas por defecto: `-ceq` fuerza la sensibilidad a mayúsculas. |
| **Buenas prácticas** | Usar `Test-Path -PathType Leaf/Container` para distinguir explícitamente un archivo de una carpeta. |
