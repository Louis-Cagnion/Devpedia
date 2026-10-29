---
order: 14
---

# Alias y atajos de comandos en PowerShell

Un **atajo de comando** es un nombre corto que se escribe en lugar de un comando largo o de una secuencia de comandos. En [PowerShell](/?c=langages&s=powershell&p=powershell), el shell (el programa que lee lo que se escribe en una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) y lo ejecuta), existen varias herramientas para ello, de la más simple a la más potente. Este capítulo las presenta **en cuatro niveles**, cada uno apoyándose en el anterior:

| Nivel | Necesidad | Herramienta | Sección |
|---|---|---|---|
| 1 | Otro nombre para un solo comando | El **alias** (`Set-Alias`) | [Nivel 1](#nivel-1-el-alias-simple) |
| 2 | Un comando con argumentos ya rellenados | Una **función** corta | [Nivel 2](#nivel-2-argumentos-fijos-con-una-funcion) |
| 3 | Una pequeña herramienta de verdad: parámetros con nombre, valores por defecto, [pipeline](/?c=langages&s=powershell&p=redirections-et-pipes) | Una función avanzada, y luego un alias sobre ella | [Nivel 3](#nivel-3-un-atajo-complejo) |
| 4 | Hacer convivir todo esto sin sorpresas | `Get-Command`, `$PROFILE`, dot sourcing (cargar un archivo en la sesión actual) | [Nivel 4](#nivel-4-convivencia-y-trampas) |

Una **cmdlet** (se pronuncia «comandlet») es un comando nativo de PowerShell, con nombre `Verbo-Nombre` como `Get-ChildItem`; se presenta en [los comandos de base](/?c=langages&s=powershell&p=commandes-de-base). Un **argumento** es todo lo que se escribe después del nombre de un comando; un **parámetro** es un argumento con nombre que empieza por un guion, como `-Force` en `Get-ChildItem -Force`. La **sesión** es el periodo que va desde la apertura de la ventana de la terminal hasta su cierre. Este capítulo supone conocidas [las funciones](/?c=langages&s=powershell&p=fonctions) y [las variables de entorno](/?c=langages&s=powershell&p=variables-denvironnement) (que presentan el archivo de perfil `$PROFILE`).

## Qué es un alias y por qué se crea uno

Un **alias** es un segundo nombre dado a **un** comando. La imagen más cercana es un contacto en un teléfono: la entrada «Mamá» no contiene una conversación, designa un número. Cuando usted llama a «Mamá», el teléfono marca el número. Del mismo modo, cuando usted escribe el alias, PowerShell lanza el comando que designa.

```
   Usted escribe:   ll -Force
                   |
                   v
   1. PowerShell lee la primera palabra: ll
   2. Encuentra el alias ll, que designa la cmdlet Get-ChildItem
   3. Reemplaza ll por Get-ChildItem y deja el resto tal cual
                   |
                   v
   Ejecuta:   Get-ChildItem -Force
```

Se crea un alias para escribir menos (`ll` en lugar de `Get-ChildItem`), para recuperar un nombre conocido de otro shell, o para conservar un nombre corto fácil de recordar.

## Nivel 1: el alias simple

### Crear un alias: `Set-Alias` y `New-Alias`

```powershell
# Set-Alias crea un alias: -Name da el nuevo nombre, -Value el comando designado
Set-Alias -Name ll -Value Get-ChildItem
# ll hace ahora lo mismo que Get-ChildItem: lista la carpeta actual
ll
# lo que se escribe después del alias se pasa al comando: aquí, el parámetro -Force
ll -Force
# forma corta: sin las palabras -Name y -Value, la 1.ª palabra es el nombre, la 2.ª el comando
Set-Alias g git
# g designa el programa git (que se instala aparte): « g status » lanza « git status »
g status
```

Dos cmdlets crean un alias. Se diferencian en un solo caso: el nombre ya existe.

| | `Set-Alias` | `New-Alias` |
|---|---|---|
| El nombre todavía no existe | Crea el alias | Crea el alias |
| El nombre ya existe | **Reemplaza** el alias existente, sin advertencia | **Rechaza** y muestra un error |
| Con `-Force` | Innecesario | Se comporta como `Set-Alias` |
| Para qué usarlo | Un archivo de perfil que se recarga | Crear un nombre que se cree libre, siendo avisado si no lo está |

```powershell
# primera creación: el nombre ll está libre, el alias se crea
New-Alias -Name ll -Value Get-ChildItem
# segunda creación del mismo nombre: error, porque ll ya existe (no se modifica nada)
New-Alias -Name ll -Value Get-ChildItem
# con -Force, New-Alias reemplaza el alias existente, como Set-Alias
New-Alias -Name ll -Value Get-ChildItem -Force
```

Algunos parámetros útiles de estas dos cmdlets (la página [Set-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/set-alias) y la página [New-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/new-alias) de Microsoft dan la lista completa):

| Parámetro | Función |
|---|---|
| `-Name` | El nombre del alias |
| `-Value` | El nombre del comando designado (un nombre solo, véase [el límite central](#el-limite-central-un-nombre-nunca-un-comando-con-argumentos)) |
| `-Description` | Un texto libre que recuerda para qué sirve el alias |
| `-Option ReadOnly` | Protege el alias: modificarlo exige después `-Force` |
| `-Scope Global` | Elige el ámbito donde vive el alias (véase [el nivel 4](#nivel-4-convivencia-y-trampas)) |

### Listar y encontrar un alias: `Get-Alias`

```powershell
# sin argumento, Get-Alias lista todos los alias de la sesión (los suyos incluidos)
Get-Alias
# ¿qué designa el alias ls?
Get-Alias -Name ls
# ¿qué alias designan la cmdlet Get-ChildItem? (encontrar el alias de una cmdlet)
Get-Alias -Definition Get-ChildItem
# un comodín (véase abajo): todos los alias cuyo nombre empieza por g
Get-Alias -Name g*
```

Un **comodín** (*wildcard*) es un carácter especial que sustituye letras desconocidas: `*` sustituye cualquier secuencia de caracteres (véase [expansión y comodines](/?c=langages&s=powershell&p=expansion-et-jokers)). `Get-Alias` muestra una línea por alias, con la forma `ll -> Get-ChildItem` en la columna del nombre. Con `-Definition Get-ChildItem`, se encuentran por ejemplo `gci` y, en Windows, `dir` y `ls`, además de `ll` si usted lo creó. La página [Get-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/get-alias) detalla los parámetros.

### El límite central: un nombre, nunca un comando con argumentos

Un alias solo puede designar un **nombre de comando**. No puede contener un comando **seguido de sus argumentos**. El error es frecuente, porque funciona en otros shells (véase [la tabla de comparación](#y-en-bash-y-zsh)):

```powershell
# Error: se pone un comando Y un argumento en -Value
Set-Alias -Name gs -Value "git status"
# La creación no produce ningún mensaje: PowerShell no verifica nada en ese momento
# Se escribe el alias: ahí es donde aparece el error
gs
# Error, en esencia: el término git status no se reconoce como el nombre de una cmdlet,
# de una función, de un archivo de script o de un programa (el texto exacto varía)
```

La explicación cabe en una frase: PowerShell lee `"git status"` como **un solo nombre**, con un espacio en medio, y busca un comando que se llame así. No existe ninguno. El alias se crea, pero apunta a la nada.

```powershell
# Correcto: el alias designa SOLO el nombre git
Set-Alias -Name g -Value git
# Lo que se escribe después del alias se añade tal cual: esta línea lanza «git status»
g status
# pero no se puede fijar «status» en el propio alias: hace falta una función
```

| Escritura | Lo que PowerShell busca | Resultado |
|---|---|---|
| `Set-Alias -Name g -Value git` | Un comando llamado `git` | Funciona; `g status` lanza `git status` |
| `Set-Alias -Name gs -Value "git status"` | Un comando llamado `git status` (con el espacio) | Error al usarlo |
| `Set-Alias -Name ll -Value "Get-ChildItem -Force"` | Un comando llamado `Get-ChildItem -Force` | Error al usarlo |

Para fijar un argumento en un atajo, hay que pasar al [nivel 2](#nivel-2-argumentos-fijos-con-una-funcion).

### Suprimir un alias

```powershell
# Alias: se comporta como una unidad de disco virtual que contiene los alias
# Remove-Item (la cmdlet que suprime) retira así el alias como se borra un archivo
Remove-Item Alias:ll
# el alias ya no existe: este comando indica un error «no encontrado»
Get-Alias -Name ll
```

PowerShell presenta los alias como los archivos de una unidad llamada `Alias:`. Véase también [la supresión de archivos](/?c=langages&s=powershell&p=permissions-et-fichiers) con `Remove-Item`. En PowerShell (Core), la cmdlet [Remove-Alias](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/remove-alias) hace lo mismo; falta en la versión histórica que viene con Windows, de ahí la forma `Remove-Item Alias:` que funciona en todas partes.

### El ámbito: solo la sesión en curso

Un alias creado en la terminal se conserva **en memoria**, en la sesión. Cierre la ventana y vuelva a abrirla: el alias ya no existe.

| Dónde se crea el alias | Cuánto tiempo vive |
|---|---|
| Escrito en la terminal | Hasta el cierre de la ventana |
| En un script lanzado normalmente (`.\script.ps1`) | Hasta el final del script (véase [el nivel 4](#nivel-4-convivencia-y-trampas)) |
| En el archivo de perfil `$PROFILE` | En cada nueva sesión: es la solución |

### Hacer permanente un alias con `$PROFILE`

El **perfil** es un archivo de script que PowerShell ejecuta en cada arranque de una sesión interactiva (véase [los archivos de configuración](/?c=langages&s=powershell&p=variables-denvironnement#archivos-de-configuracion-perfiles)). Su ruta se guarda en la variable `$PROFILE`, y su valor depende del sistema: hay que leerlo siempre en lugar de adivinarlo.

```powershell
# muestra la ruta del archivo de perfil
$PROFILE
# Test-Path devuelve True (verdadero) si la ruta existe, False (falso) en caso contrario
# -not invierte ese resultado: el bloque solo se ejecuta si el archivo NO existe
if (-not (Test-Path -Path $PROFILE)) {
    # New-Item crea el archivo; -Force crea también las carpetas que falten
    # Out-Null descarta el mensaje que New-Item mostraría
    New-Item -ItemType File -Path $PROFILE -Force | Out-Null
}
# Add-Content añade una línea al final del archivo, sin tocar el resto
Add-Content -Path $PROFILE -Value "Set-Alias -Name ll -Value Get-ChildItem"
# el punto seguido de un espacio (dot sourcing) ejecuta el archivo DENTRO de la sesión actual
. $PROFILE
```

La prueba `if (-not (Test-Path ...))` no es decorativa: `New-Item -Force` sobre un archivo **que ya existe** lo reemplaza por un archivo vacío, y borra así todos sus ajustes (las condiciones `if` se explican en [el capítulo dedicado](/?c=langages&s=powershell&p=conditions)). El dot sourcing se detalla en el [nivel 4](#nivel-4-convivencia-y-trampas).

En un perfil que se recarga a menudo, se usa `Set-Alias` en lugar de `New-Alias`: la segunda ejecución de `New-Alias` sobre un nombre existente mostraría un error en cada recarga.

## Nivel 2: argumentos fijos con una función

En cuanto el atajo debe **contener un argumento** (`git status`, `Get-ChildItem -Force`), el alias ya no basta: hace falta una **función**, es decir, un bloque de instrucciones al que se da un nombre (véase [las funciones](/?c=langages&s=powershell&p=fonctions)). Una función se escribe como un comando, así que cumple el papel de un atajo.

```powershell
# function declara una función llamada gs; las llaves { } rodean sus instrucciones
function gs {
    # $args: variable automática que contiene lo que se escribe después de gs
    # @args: reparte esta lista en argumentos separados, añadidos después de «git status»
    git status @args
}
```

El `@` delante de `args` se llama **splatting** (del inglés *splat*, «salpicar»): en lugar de pasar la lista como un solo bloque, PowerShell la reparte en tantos argumentos separados, cada uno con su sentido. Para una cmdlet, `@args` conserva incluso los parámetros con nombre (`-Force` sigue siendo un parámetro), cosa que `$args` solo no garantiza. `$args` es una [variable automática](/?c=langages&s=powershell&p=variables#variables-automaticas), es decir, creada y rellenada por el propio PowerShell. La página [about_Splatting](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_splatting) detalla el mecanismo.

```powershell
gs                     # ejecuta: git status
gs --short             # ejecuta: git status --short
gs --short --branch    # ejecuta: git status --short --branch
```

Lo mismo con una cmdlet, de la que se fija un parámetro:

```powershell
# la función lanza Get-ChildItem con -Force (mostrar también los elementos ocultos)
function la {
    # -Force es fijo; todo lo que se escribe detrás de «la» se añade después
    Get-ChildItem -Force @args
}
la                     # ejecuta: Get-ChildItem -Force
la -Recurse            # ejecuta: Get-ChildItem -Force -Recurse
la src                 # ejecuta: Get-ChildItem -Force src
```

| | Alias | Función corta |
|---|---|---|
| Dar otro nombre a un comando | Sí | Sí |
| Fijar uno o varios argumentos | **No** | Sí |
| Transmitir lo que se escribe detrás | Sí, automáticamente | Sí, con `@args` |
| Encadenar varios comandos | No | Sí |
| Se suprime con | `Remove-Item Alias:nombre` | `Remove-Item Function:nombre` |
| Se consulta con | `Get-Alias` | `Get-Command` o `Get-ChildItem Function:` |

Una función escrita en la terminal también vive solo en la sesión: para conservarla, se pone en `$PROFILE`, igual que un alias.

### Otra vía: los valores por defecto de los parámetros

Para que una **cmdlet** reciba siempre un parámetro, sin crear un nombre nuevo, PowerShell dispone de la variable `$PSDefaultParameterValues`. Es una **tabla asociativa**: una lista de pares `clave = valor`.

```powershell
# la clave «Get-ChildItem:Force» designa el parámetro -Force de Get-ChildItem
# $true significa «verdadero»: el parámetro se activa en cada llamada a la cmdlet
$PSDefaultParameterValues["Get-ChildItem:Force"] = $true
# elimina este ajuste
$PSDefaultParameterValues.Remove("Get-ChildItem:Force")
```

| | Función `la` | `$PSDefaultParameterValues` |
|---|---|---|
| Nuevo nombre que escribir | Sí (`la`) | No: se conserva `Get-ChildItem` |
| Funciona con un programa externo como `git` | Sí | No: solo cmdlets y funciones |
| Visible en el código que la usa | Sí | No: el ajuste actúa entre bastidores, incluso sobre los scripts lanzados en la sesión |

La página [about_Parameters_Default_Values](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_parameters_default_values) de Microsoft documenta esta variable.

## Nivel 3: un atajo complejo

Un atajo puede convertirse en una pequeña herramienta: recibe **parámetros con nombre** (con un tipo y un valor por defecto), acepta valores que llegan de un **pipeline** (el encadenamiento `comando1 | comando2`, donde la salida del primero se convierte en la entrada del segundo, véase [los pipes](/?c=langages&s=powershell&p=redirections-et-pipes)) y se comporta como una cmdlet de verdad. Ejemplo: listar los archivos más grandes de una o varias carpetas.

```powershell
function Get-ArchivoGrande {
    # atributo: un ajuste entre corchetes puesto antes de param; este da a la función
    # los comportamientos de una cmdlet (parámetros comunes como -Verbose)
    [CmdletBinding()]
    param(
        # este parámetro también puede recibir sus valores del pipeline
        [Parameter(ValueFromPipeline)]
        # [string]: el tipo texto; "." designa la carpeta actual (valor por defecto)
        [string]$Carpeta = ".",
        # [int]: el tipo número entero; 5 si no se indica nada
        [int]$Cantidad = 5
    )
    # bloque process: se ejecuta una vez por cada valor recibido del pipeline
    process {
        # se muestra solo si la llamada contiene -Verbose
        Write-Verbose "Analizando $Carpeta"
        # todos los archivos (-File) de la carpeta y de sus subcarpetas (-Recurse)
        Get-ChildItem -Path $Carpeta -File -Recurse |
            # ordena de más grande a más pequeño, según la propiedad Length (el tamaño)
            Sort-Object -Property Length -Descending |
            # conserva los $Cantidad primeros, y solo las columnas Name y Length
            Select-Object -First $Cantidad -Property Name, Length
    }
}
```

| Elemento | Función |
|---|---|
| `[CmdletBinding()]` | Añade los parámetros comunes (`-Verbose`, `-ErrorAction`...) y **rechaza** un argumento que la función no declara (`$args` ya no existe, así que ya no hay `@args`) |
| `[Parameter(ValueFromPipeline)]` | El parámetro puede recibir sus valores desde el pipeline |
| `[string]$Carpeta = "."` | Un parámetro con nombre `-Carpeta`, de tipo texto, que vale `"."` si se omite |
| `[int]$Cantidad = 5` | Un parámetro con nombre `-Cantidad`, de tipo entero, que vale `5` si se omite |
| `process { }` | El bloque que se repite para cada valor que llega del pipeline |
| `Write-Verbose` | Un mensaje de seguimiento, invisible salvo con `-Verbose` |

Las páginas [about_Functions_CmdletBindingAttribute](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_functions_cmdletbindingattribute) y [about_Functions_Advanced_Parameters](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_functions_advanced_parameters) de Microsoft dan todas las opciones.

```powershell
Get-ArchivoGrande                                 # carpeta actual, los 5 archivos más grandes
Get-ArchivoGrande -Carpeta src -Cantidad 3        # parámetros con nombre
Get-ArchivoGrande src 3                           # sin los nombres: en el orden declarado
"src", "docs" | Get-ArchivoGrande -Cantidad 3     # pipeline: una pasada por carpeta
Get-ArchivoGrande -Carpeta src -Verbose           # muestra también «Analizando src»
```

El nombre `Get-ArchivoGrande` sigue la convención `Verbo-Nombre`, lo que facilita encontrarlo (`Get-Command -Verb Get`), pero es largo de escribir. Se pone entonces un **alias sobre la función**: `Set-Alias` acepta el nombre de una función igual que el de una cmdlet.

```powershell
# el alias grande designa la función Get-ArchivoGrande
Set-Alias -Name grande -Value Get-ArchivoGrande
grande                   # ejecuta: Get-ArchivoGrande
grande -Cantidad 3       # los parámetros siguen al alias, como con una cmdlet
"src" | grande           # el pipeline también funciona a través del alias
Get-Alias -Name grande   # confirma: grande -> Get-ArchivoGrande
```

La lógica vive en la función; el alias es solo el nombre corto. Es la división recomendada: un nombre completo para los scripts, un nombre corto para escribir a mano.

## Nivel 4: convivencia y trampas

### ¿Quién responde cuando se escribe un nombre?

Varios comandos pueden llevar el mismo nombre. PowerShell elige según un orden fijo (alias, luego función, luego cmdlet, luego programa), descrito en [el capítulo sobre la arquitectura](/?c=langages&s=powershell&p=architecture-dun-shell#como-powershell-encuentra-que-comando-lanzar). Consecuencia directa: un alias **siempre gana** a una función del mismo nombre, y una función gana a la cmdlet. `Get-Command` ([documentación](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/get-command)) muestra quién responde.

```powershell
# gl ya es un alias que trae PowerShell (designa Get-Location)
# se cree crear un atajo para «git log», pero el alias pasa primero
function gl { git log --oneline @args }
# muestra la carpeta actual: ha respondido el alias, no nuestra función
gl
# ¿quién responde al nombre gl? (el comando que gana)
Get-Command -Name gl
# -All muestra también los comandos enmascarados, en orden de prioridad
Get-Command -Name gl -All
# se retira la función que ya no sirve: Function: es la unidad virtual de las funciones
Remove-Item Function:gl
```

Antes de elegir un nombre, se comprueba que esté libre:

```powershell
# -ErrorAction SilentlyContinue: no mostrar nada si ningún comando lleva este nombre
$existente = Get-Command -Name glg -ErrorAction SilentlyContinue
# la variable está vacía (falso) si el nombre está libre, llena (verdadero) si no
if ($existente) { "Nombre ya en uso" } else { "Nombre libre" }
```

| Usted define | El nombre ya lo lleva | Lo que responde después |
|---|---|---|
| Una función `gl` | El alias `gl` | El alias: su función nunca se llama |
| Un alias `ls` | El alias por defecto `ls` (que designa `Get-ChildItem`) | El suyo lo reemplaza, salvo que el alias por defecto esté protegido |
| Una función con el nombre de una cmdlet (`Get-Date`) | La cmdlet | Su función, en toda la sesión |
| Un alias con el nombre de un programa (`git`) | El programa | Su alias: el programa queda oculto |

Los alias por defecto (`ls`, `cp`, `cat`, `rm`...) figuran en [los alias familiares](/?c=langages&s=powershell&p=commandes-de-base#alias-familiares). Redefinirlos es tentador, pero arriesgado: sus costumbres, los ejemplos encontrados en línea y los scripts de sus colegas cuentan con su sentido original. Otra trampa: estos alias no son iguales en todas partes. PowerShell en Linux y macOS deja que, para algunos nombres como `ls`, responda el comando del sistema; la versión histórica que viene con Windows define incluso `curl` como alias de `Invoke-WebRequest`. En caso de duda, `Get-Command` da la respuesta en la máquina donde se encuentre.

### Eludir un alias o una función

| Quiero | Escritura | Observación |
|---|---|---|
| La cmdlet oculta tras un alias | Su nombre completo: `Get-ChildItem` | El alias solo se consulta por su nombre corto |
| La cmdlet cuando una función del mismo nombre la oculta | `Microsoft.PowerShell.Management\Get-ChildItem` | El nombre va precedido por el de su módulo (el paquete que contiene la cmdlet) |
| Un programa oculto por un alias o una función | `& (Get-Command git -CommandType Application)` | `&` (operador de llamada) ejecuta el comando designado por lo que sigue |
| Quitar la máscara para la sesión | `Remove-Item Alias:nombre` o `Remove-Item Function:nombre` | Definitivo hasta la próxima sesión |
| Comprobar si un problema viene de sus atajos | `pwsh -NoProfile` | `pwsh` inicia una nueva sesión de PowerShell (Core), aquí sin leer `$PROFILE`; `powershell -NoProfile` para la versión que viene con Windows |

### No poner sus atajos en un script compartido

Sus alias y sus funciones existen **en su máquina**, porque su perfil los crea. Un script que usa `gs` o `ll` falla en casa de un colega, en un servidor, o en una tarea programada (un comando lanzado automáticamente a una hora fija que no carga ningún perfil). En un script destinado a compartirse, se escriben los nombres completos: `Get-ChildItem`, `git status`. Los atajos están pensados para escribir rápido a mano, no para que otros los lean.

Hay una segunda sutileza, del lado de la definición. Un script lanzado normalmente se ejecuta en su **propio ámbito** (la zona de la sesión donde viven los nombres, véase [el ámbito de las variables](/?c=langages&s=powershell&p=variables#ambito-de-las-variables)), y lo que crea allí desaparece cuando termina.

```powershell
# atajos.ps1 contiene la línea: Set-Alias -Name ll -Value Get-ChildItem
# lanzamiento normal: el script tiene su propio ámbito, que se destruye al terminar
.\atajos.ps1
# error: el alias ll ya no existe
ll
# dot sourcing: el punto, un espacio y luego la ruta; el script se ejecuta en el ámbito
# actual (el de la sesión), y sus alias y funciones permanecen allí
. .\atajos.ps1
# esta vez, ll existe
ll
```

### Organizar su `$PROFILE`

Un perfil que crece se vuelve ilegible. Se dejan allí unas pocas líneas, que cargan por dot sourcing un archivo dedicado situado en el mismo lugar.

```powershell
# --- contenido de $PROFILE (el archivo de perfil) ---
# Split-Path -Parent: la carpeta que contiene el perfil
$carpetaPerfil = Split-Path -Path $PROFILE -Parent
# Join-Path une una carpeta y un nombre de archivo con el separador correcto
$atajos = Join-Path -Path $carpetaPerfil -ChildPath "atajos.ps1"
# se carga el archivo solo si existe, para no producir un error al arrancar
if (Test-Path -Path $atajos) { . $atajos }
```

```powershell
# --- contenido de atajos.ps1 (en la misma carpeta que el perfil) ---
Set-Alias -Name ll -Value Get-ChildItem        # nivel 1: alias simple
Set-Alias -Name g -Value git                   # nivel 1: alias hacia un programa
function gs { git status @args }               # nivel 2: argumento fijo
function glg { git log --oneline --graph @args }
```

Como el perfil también se carga por dot sourcing, los alias y las funciones de `atajos.ps1` siguen disponibles en toda la sesión. Para aplicar una modificación sin reabrir la terminal: `. $PROFILE`.

| Archivo | Contenido | Por qué |
|---|---|---|
| `$PROFILE` | Las tres líneas de carga, y los ajustes del entorno (véase [las variables de entorno](/?c=langages&s=powershell&p=variables-denvironnement)) | Se mantiene corto y legible |
| `atajos.ps1` | Todos los alias y funciones personales | Un único lugar para releer, guardar y copiar a otra máquina |
| Un script compartido | Ningún atajo personal | Debe funcionar sin su perfil |

En Windows, el perfil y `atajos.ps1` son scripts: la **política de ejecución** puede impedir su carga al arrancar. Este ajuste de seguridad se describe en [el capítulo sobre los scripts](/?c=langages&s=powershell&p=ecrire-et-executer-un-script#sin-shebang-pero-con-una-politica-de-ejecucion).

## Síntesis de los niveles

| Nivel | Necesidad | Herramienta | Límite |
|---|---|---|---|
| 1 | Otro nombre para un comando | `Set-Alias -Name ll -Value Get-ChildItem` | Un nombre solo: ningún argumento fijo; solo en la sesión actual si no hay perfil |
| 2 | Un comando con argumentos fijos | `function gs { git status @args }` | Sin parámetros con nombre ni valores por defecto; sin pipeline estructurado |
| 3 | Parámetros con nombre, valores por defecto, pipeline | Función con `[CmdletBinding()]`, luego `Set-Alias` sobre ella | Más largo de escribir; hay que recordar el nombre completo para los scripts |
| 4 | Varios atajos sin conflicto, recargados en cada sesión | `Get-Command`, `$PROFILE`, dot sourcing | Un atajo personal no existe en las otras máquinas |

## ¿Y en Bash y Zsh?

Las mismas preguntas se plantean en [Bash](/?c=langages&s=bash&p=bash) y [Zsh](/?c=langages&s=zsh&p=zsh) (dos shells comunes en Linux y macOS), con una diferencia de fondo: su comando `alias` guarda un **texto** que reemplaza la palabra escrita antes de que la línea sea analizada. Ese texto puede contener, por tanto, argumentos, cosa imposible en PowerShell.

| | PowerShell | Bash | Zsh |
|---|---|---|---|
| Crear | `Set-Alias -Name ll -Value Get-ChildItem` | `alias ll='ls -la'` | `alias ll='ls -la'` |
| Contenido del alias | Un nombre de comando solo | Un texto cualquiera, con argumentos | Igual que Bash |
| Alias con argumento fijo | Imposible: una función | `alias gs='git status'` funciona | Igual que Bash |
| Listar | `Get-Alias` | `alias` | `alias` |
| Suprimir | `Remove-Item Alias:ll` | `unalias ll` | `unalias ll` |
| Qué responde al nombre | `Get-Command nombre` | `type -a nombre` | `type -a nombre` o `whence -a nombre` |
| Eludir | Nombre completo, `&` | `\nombre` o `command nombre` | Igual que Bash |
| Hacer permanente | Archivo `$PROFILE` | `~/.bashrc` (véase [las variables de entorno](/?c=langages&s=bash&p=variables-denvironnement)) | `~/.zshrc` (véase [los archivos de inicio](/?c=langages&s=zsh&p=fichiers-de-demarrage)) |
| En un script | Ausente, salvo definición en el script o dot sourcing | No se expande por defecto en un script | Definido en `~/.zshrc`, leído solo por un shell interactivo: un script no lo ve |
| Necesidad de lógica o parámetros | Función (niveles 2 y 3) | Función (véase [las funciones Bash](/?c=langages&s=bash&p=fonctions)) | Función |

Los alias avanzados propios de Bash y Zsh no se tratan aquí: corresponden a los capítulos de esos shells.

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| `Set-Alias -Name gs -Value "git status"` | El alias solo designa un nombre: el error no aparece hasta el uso | Una función: `function gs { git status @args }` |
| Alias creado en la terminal | Se pierde al cerrar la sesión | Añadirlo al archivo `$PROFILE` |
| `New-Alias` en un perfil recargado | Error en cada recarga, porque el nombre ya existe | `Set-Alias` en el perfil |
| `New-Item -Force` sobre un `$PROFILE` existente | El archivo se reemplaza por un archivo vacío | Probar primero con `Test-Path` |
| Función sin `@args` | Lo que se escribe detrás del atajo se ignora | Terminar la línea con `@args` |
| `[CmdletBinding()]` combinado con `$args` | Un argumento no declarado se rechaza, y `$args` ya no está disponible | Declarar cada parámetro en `param()` |
| Función con el nombre de un alias existente (`gl`) | El alias pasa primero: la función nunca se ejecuta | `Get-Command -Name nombre` antes de elegir |
| Redefinir `ls`, `cp`, `cat`, `rm`... | Las costumbres y los ejemplos en línea pierden su sentido | Elegir un nombre nuevo libre |
| Suponer los mismos alias en todas partes | Según el sistema y la versión, un nombre designa otro comando, o ninguno | Verificar con `Get-Command` en la máquina correspondiente |
| Atajos en un script compartido | No existen en casa de los demás, ni en una tarea programada | Escribir los nombres completos en los scripts |
| Alias definido en un script lanzado normalmente | Desaparece al terminar el script | Dot sourcing (`. .\archivo.ps1`) |
| `$PSDefaultParameterValues` olvidado | Cambia el comportamiento de todas las cmdlets afectadas, scripts incluidos | Reservarlo para un ajuste asumido, y anotarlo en `atajos.ps1` |
| Perfil bloqueado por la política de ejecución | El archivo se ignora al arrancar, y faltan los atajos | Ajustar la política como en el capítulo sobre los scripts |
| Perfil demasiado pesado | Cada apertura de terminal se ralentiza | Poner solo lo útil |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Un alias para un simple cambio de nombre, una función en cuanto un argumento es fijo | Cada herramienta se queda en su ámbito |
| Terminar las funciones-atajo con `@args` | Lo que se escribe detrás del atajo llega hasta el comando |
| Para un atajo rico: una función `Verbo-Nombre` con `[CmdletBinding()]`, y luego un alias corto | Un nombre completo para los scripts, un nombre corto para escribir a mano |
| Verificar el nombre con `Get-Command` antes de crearlo | Ningún enmascaramiento involuntario |
| `Set-Alias` en el perfil, `New-Alias` para un nombre que se cree libre | Recarga sin error; aviso si el nombre ya está tomado |
| Guardar todos los atajos en `atajos.ps1`, cargado por dot sourcing desde `$PROFILE` | Un perfil corto, atajos fáciles de guardar |
| Escribir los nombres completos en todo script compartido | El script funciona en todas las máquinas |
| Probar con `pwsh -NoProfile` cuando un comportamiento parezca extraño | Descartar los atajos como causa |
| Mantener el perfil ligero | Una terminal que se abre rápido |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un **alias** es un segundo nombre para **un** comando: `Set-Alias -Name ll -Value Get-ChildItem` (sobrescribe un alias existente) o `New-Alias` (rechaza, salvo con `-Force`); `Get-Alias` lista y encuentra (`-Definition` para partir de una cmdlet); `Remove-Item Alias:ll` lo suprime. Vive en la sesión y se hace permanente con `$PROFILE`. El límite central: `-Value` es un **nombre de comando**, nunca un comando seguido de argumentos; `Set-Alias -Name gs -Value "git status"` busca un comando llamado «git status» y falla al usarlo. Con argumentos fijos, se escribe una **función** (`function gs { git status @args }`, donde `@args` transmite lo que se escribe detrás). Para un atajo complejo: función con `[CmdletBinding()]`, parámetros con nombre y tipados con valores por defecto, `[Parameter(ValueFromPipeline)]` y bloque `process`, y luego `Set-Alias` sobre su nombre. Un alias gana a una función, que gana a una cmdlet: `Get-Command nombre -All` muestra quién responde. El perfil carga por dot sourcing un archivo `atajos.ps1`. Bash y Zsh guardan un texto entero en `alias`, con argumentos. |
| **Trampas a evitar** | Poner un argumento en `-Value`; creer que un alias sobrevive a la sesión; `New-Alias` en un perfil recargado; `New-Item -Force` sobre un perfil existente; función sin `@args`; `[CmdletBinding()]` con `$args`; función enmascarada por un alias del mismo nombre; redefinir `ls`, `cp`, `cat`; atajos personales en un script compartido; alias definido en un script sin dot sourcing; perfil bloqueado por la política de ejecución. |
| **Buenas prácticas** | Alias para cambiar de nombre, función para fijar argumentos, función avanzada más alias para una herramienta de verdad; `Get-Command` antes de nombrar; `Set-Alias` en el perfil; todos los atajos en `atajos.ps1`; nombres completos en los scripts compartidos; `pwsh -NoProfile` para descartar sus atajos en un diagnóstico. |
