---
order: 3
---

# Las variables

Como recordatorio, [una variable es una caja etiquetada que contiene un valor](/?c=bases-de-l-informatique&p=la-variable): lo que sigue cubre únicamente lo específico de PowerShell.

Contrariamente a [Bash](/?c=shells&s=bash&p=bash), donde todo se manipula como texto, una variable PowerShell conserva el **tipo real** de su valor: un número sigue siendo un número, una lista sigue siendo una lista de objetos, sin conversión implícita a cadena. Toda variable comienza con `$`, incluso al asignarla (sin la regla "sin `$` para escribir, con `$` para leer" como en Bash).

## Declarar y leer una variable

```powershell
$nombre = "Juan"               # sin regla estricta sobre los espacios alrededor del '=', a diferencia de Bash
Write-Output $nombre           # Juan
Write-Output "Hola $nombre !"  # Hola Juan ! -> interpolación directa en una cadena de comillas dobles
```

> **Nota:** `$nombre` solo (sin `Write-Output`) también muestra su valor en la consola: PowerShell muestra automáticamente el resultado de toda expresión que no esté explícitamente asignada o suprimida, un comportamiento cercano a un REPL.

## Comillas simples vs dobles

```powershell
$nombre = "Juan"

Write-Output "Hola $nombre"  # Hola Juan -> las comillas dobles interpretan las variables
Write-Output 'Hola $nombre'  # Hola $nombre -> las comillas simples desactivan toda interpretacion
```

Para insertar una propiedad o el resultado de una expresión (no solo una variable simple), hay que rodearla con `$(...)` dentro de las comillas dobles:

```powershell
$usuario = Get-Process | Select-Object -First 1
Write-Output "Primer proceso : $($usuario.Name)"
```

> **Nota:** sin `$(...)`, `"$usuario.Name"` mostraría la representación en texto del objeto seguida literalmente de `.Name`: PowerShell solo interpreta el acceso a una propiedad dentro de una cadena si la expresión entera está explícitamente delimitada.

## Tipado

Una variable puede tiparse explícitamente, o dejarse con su tipo deducido automáticamente:

```powershell
[int]$edad = 25
[string]$nombre = "Juan"
$puntaje = 19.5   # tipo deducido: Double

$edad.GetType().Name   # Int32
```

> **Nota:** contrariamente a Bash donde `edad="abc"` no provoca ningún error inmediato (el valor sigue siendo una cadena, el error solo aparece al momento de un cálculo), asignar `"abc"` a una variable tipada `[int]$edad` falla inmediatamente: PowerShell verifica el tipo en la asignación, no solo en el uso.

## Aritmética

No hace falta ningún contexto aritmético explícito: los operadores funcionan nativamente sobre números, incluidos los decimales:

```powershell
$a = 5
$b = 3

Write-Output ($a + $b)  # 8
Write-Output ($a * $b)  # 15
Write-Output ($a / $b)  # 1.66666666666667 -> division real, no entera como en Bash
```

## Variables automáticas

PowerShell proporciona variables automáticas siempre disponibles, con un rol cercano al de las variables especiales de Bash (`$0`, `$1`...): ver la tabla y los ejemplos en el capítulo sobre la escritura de scripts, justo después de la sección sobre los argumentos de un script.

## Ámbito de las variables

Por defecto, una variable declarada en una función permanece local a esa función: lo contrario de Bash, donde una variable de función es global por defecto salvo `local` explícito:

```powershell
function Contar {
    $total = 0   # local a Contar por defecto
    $total = $total + 1
    Write-Output $total
}

Contar
Write-Output $total   # vacío: $total no existe fuera de la función
```

Para modificar explícitamente una variable de un contexto englobante (el equivalente inverso de un `local` de Bash), se prefija su nombre con un ámbito:

```powershell
$total = 0

function Incrementar {
    $script:total = $script:total + 1   # modifica explícitamente la variable del script llamador
}

Incrementar
Write-Output $total   # 1
```

Ver también [Las funciones](/?c=shells&s=powershell&p=fonctions), y [Variables de entorno](/?c=shells&s=powershell&p=variables-denvironnement) (`$env:`) para compartir un valor con procesos hijos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una variable PowerShell conserva el tipo real de su valor (sin conversión implícita a texto como en Bash). Una variable tipada (`[int]$edad`) falla inmediatamente si se le asigna un valor incompatible. |
| **Herramientas utilizables** | Interpolación en las comillas dobles, `$(...)` para una expresión/propiedad, ámbitos (`$script:`). |
| **Trampas a evitar** | Escribir `"$objeto.Propiedad"` pensando acceder a la propiedad: sin `$(...)`, `.Propiedad` se trata como texto literal. |
| **Buenas prácticas** | Usar `$(...)` en cuanto se interpola algo distinto de una simple variable en una cadena. |
