---
order: 7
---

# Las funciones

Contrariamente a Bash, donde una función recibe sus argumentos exactamente como un script (`$1`, `$2`, sin nombre), una función PowerShell declara verdaderos **parámetros nombrados y tipados** vía `param()`, como en [PHP](/?c=langages-de-programmation&s=php&p=conditions) o en [C](/?c=langages-de-programmation&s=c&p=conditions).

## Declarar y llamar a una función

```powershell
function Saludar {
    param([string]$Nombre)
    Write-Output "Hola $Nombre !"
}

Saludar -Nombre "Juan"  # Hola Juan !
Saludar "Juan"          # también funciona: PowerShell acepta un argumento posicional si se omite el nombre
```

> **Convención de nombrado:** las cmdlets y funciones de PowerShell siguen la forma `Verbo-Nombre` (`Get-ChildItem`, `Saludar` aquí de forma simplificada); un conjunto de verbos estándar (`Get`, `Set`, `New`, `Remove`...) incluso se impone por convención para las cmdlets oficiales, para que un mismo verbo se comporte de forma predecible de un comando a otro.

## Los parámetros de una función

```powershell
function Resumir {
    param(
        [string]$Nombre,
        [string]$Apellido
    )
    Write-Output "Nombre de la función : $($MyInvocation.MyCommand.Name)"
    Write-Output "Primer parámetro : $Nombre"
    Write-Output "Todos los argumentos no declarados : $args"
}

Resumir -Nombre "Perez" -Apellido "Juan"
```

> **Nota:** contrariamente a Bash donde `$1`, `$2` son puramente posicionales, la llamada `-Nombre "Perez" -Apellido "Juan"` sigue siendo correcta incluso en desorden (`-Apellido "Juan" -Nombre "Perez"`): los parámetros se asocian por su nombre, no por su posición, lo que explica por qué la forma `Verbo-Nombre` insiste tanto en nombres de parámetros claros.

## Verdaderos valores de retorno

Contrariamente a Bash, donde `return` solo fija un código de salida (0-255), `return` en PowerShell puede devolver un **valor real** de cualquier tipo:

```powershell
function EsPar {
    param([int]$Numero)
    return ($Numero % 2 -eq 0)   # devuelve $true o $false, un verdadero booleano
}

if (EsPar -Numero 4) {
    Write-Output "4 es par"
}
```

## "Devolver" un dato: la salida no capturada del pipeline

En la práctica, `return` es incluso opcional: **toda salida no asignada** en el cuerpo de una función se convierte en su valor de retorno, exactamente como la última expresión evaluada de un bloque; una diferencia importante con Bash, donde `echo` solo sirve para mostrar, nunca para "devolver" en sentido estricto:

```powershell
function Suma {
    param([int]$A, [int]$B)
    $A + $B   # esta línea, no asignada, se convierte en el valor de retorno de la función
}

$resultado = Suma -A 4 -B 6
Write-Output "Resultado : $resultado"   # Resultado : 10
```

> **Nota:** contrariamente a Bash donde `echo` dentro de una función sirve *únicamente* para mostrar (la captura vía `$(...)` es una convención del lado del llamador, no un verdadero mecanismo de retorno), toda línea de PowerShell cuyo resultado no está ni asignado ni suprimido (con `[void]` u `Out-Null`) se agrega al valor de retorno de la función: un `Write-Output` de depuración olvidado en una función puede así contaminar silenciosamente lo que devuelve.

## Ámbito de las variables

Contrariamente a Bash (variable global por defecto salvo `local`), una variable asignada en una función de PowerShell permanece local a esa función por defecto:

```powershell
function Calcular {
    param([int]$Numero)
    $resultado = $Numero * 2   # local a Calcular(), sin necesidad de una palabra clave "local"
    return $resultado
}
```

Ver también [Las variables](/?c=shells&s=powershell&p=variables) (ámbito `$script:`, ya reutilizado aquí en el contexto de las funciones).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una función PowerShell declara verdaderos parámetros nombrados y tipados vía `param()`. `return` (o incluso la simple salida no asignada) puede devolver un valor real de cualquier tipo, a diferencia del código de salida limitado de Bash. |
| **Herramientas utilizables** | `param()`, `$args` para los argumentos no declarados, ámbito `$script:`. |
| **Trampas a evitar** | Un `Write-Output` de depuración olvidado en una función se agrega silenciosamente a su valor de retorno. |
| **Buenas prácticas** | Usar `[void]`/`Out-Null` para suprimir explícitamente una salida que no debe formar parte del valor de retorno. |
