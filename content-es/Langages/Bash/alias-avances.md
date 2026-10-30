---
order: 16
---

# Alias avanzados en Bash

Un **alias** es un atajo: un nombre corto que se escribe en lugar de un comando más largo. Este capítulo supone que usted sabe abrir una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la ventana donde se escriben instrucciones con el teclado) y lanzar en ella un comando simple como `ls` (véase [los comandos básicos](/?c=langages&s=bash&p=commandes-de-base)). El **shell** es el programa que lee lo que se escribe en la terminal y lo ejecuta; el de este capítulo es [Bash](/?c=langages&s=bash&p=bash). Un **comando** es una instrucción escrita en la terminal (`ls`), un **argumento** es todo lo que se escribe después de su nombre (`/tmp` en `ls /tmp`), y una **opción** es un argumento que empieza por un guion (`-l`).

El alias simple (`alias ll='ls -la'`) se presenta en [las variables de entorno](/?c=langages&s=bash&p=variables-denvironnement). Este capítulo va más lejos, **en cinco niveles**, apoyándose cada uno en el anterior:

| Nivel | Necesidad | Herramienta | Sección |
|---|---|---|---|
| 1 | Otro nombre para un comando | `alias`, `unalias`, `~/.bashrc` | [Nivel 1](#nivel-1-el-alias-simple) |
| 2 | Un comando que recibe argumentos en medio | Una **función** (un grupo de comandos guardado bajo un nombre: `$1`, `"$@"`, `"$#"`) | [Nivel 2](#nivel-2-alias-o-funcion-con-argumentos) |
| 3 | Usar un atajo en un script | `shopt -s expand_aliases`, o mejor, una función | [Nivel 3](#nivel-3-los-alias-en-un-script) |
| 4 | Hacer convivir alias, funciones y programas | `\nombre`, `command`, `type -a`, `unalias` | [Nivel 4](#nivel-4-eludir-y-convivir) |
| 5 | Ordenar sus atajos y apartarlos para diagnosticar | `~/.bash_aliases`, `bash --norc` | [Nivel 5](#nivel-5-organizar-sus-atajos) |

El mismo tema existe para otro shell: [los alias y atajos de comandos en PowerShell](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), donde el alias es mucho más limitado.

## Qué es un alias en Bash

Un alias es un **texto de sustitución**. La imagen más cercana es el corrector de un teléfono que reemplaza « porfa » por « por favor » antes de enviar el mensaje: nadie lee el mensaje antes de la sustitución. De la misma forma, Bash sustituye la palabra escrita por el texto del alias **antes de analizar la línea**, es decir, antes de dividirla en palabras y de tratar las variables y los [comodines](/?c=langages&s=bash&p=expansion-et-jokers) (véase [el orden de las expansiones](/?c=langages&s=bash&p=architecture-dun-shell#el-orden-preciso-de-las-expansiones)).

```
   Usted escribe:   ll /tmp
                   |
   1. Bash lee la primera palabra de la línea: ll
   2. Encuentra un alias ll, cuyo texto es: ls -la
   3. Sustituye la palabra ll por ese texto; el resto de la línea no cambia
                   |
                   v
   4. Analiza la línea obtenida: ls -la /tmp
   5. La ejecuta
```

El paso 3 se llama la **expansión** del alias (en inglés *alias expansion*): la sustitución de un alias por su texto. Todo este capítulo sale de esta frase: **el alias es un texto, que sustituye a la palabra escrita, antes de que la línea sea analizada** (véase [el manual de Bash, sección « Aliases »](https://www.gnu.org/software/bash/manual/html_node/Aliases.html)).

## Nivel 1: el alias simple

```bash
# alias nombre='texto' : crea el alias ll ; el texto entre comillas simples se guarda tal cual
alias ll='ls -la'
# ll se sustituye por « ls -la »: listado detallado de la carpeta, con los ocultos incluidos
ll
# lo que se escribe después del alias se añade al final del texto: ejecuta « ls -la /tmp »
ll /tmp
# alias sin argumento: lista todos los alias de la sesión en curso
alias
# alias seguido de un nombre: muestra solo la definición de ese alias
alias ll
# unalias elimina el alias ll en la sesión en curso
unalias ll
# ll ya no se conoce: Bash responde « command not found » (« comando no encontrado »)
ll
```

En una sesión recién abierta, estos comandos muestran (después del listado de la carpeta, que depende del lugar donde se encuentre usted):

```text
alias ll='ls -la'
alias ll='ls -la'
bash: ll: command not found
```

La primera línea es la salida de `alias`, la segunda la de `alias ll`, la tercera el error del último `ll`. El texto de los mensajes de error depende del idioma del sistema (en francés: « commande introuvable »). La opción `-la` reúne `-l` (una línea detallada por archivo) y `-a` (mostrar también los elementos ocultos): véase [el comando `ls`](/?c=langages&s=bash&p=commandes-de-base#listar-una-carpeta-ls).

| Comando | Efecto |
|---|---|
| `alias nombre='texto'` | Crea o reemplaza el alias `nombre` |
| `alias` | Lista todos los alias de la sesión |
| `alias nombre` | Muestra la definición del alias `nombre` |
| `unalias nombre` | Elimina el alias `nombre` |
| `unalias -a` | Elimina todos los alias de la sesión |

### Comillas simples o dobles: ¿cuándo se leen las variables?

Una **variable** es una caja con etiqueta que contiene un valor (véase [la variable](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable)). En `"echo $n"`, las comillas dobles hacen que se lea la variable `n` **enseguida**, al crear el alias; con comillas simples, el texto `$n` se guarda y se lee en cada **uso** (véase [comillas simples y dobles](/?c=langages&s=bash&p=variables#comillas-simples-vs-dobles)).

```bash
# n es una variable que contiene 1
n=1
# comillas dobles: $n se sustituye por 1 ahora, el alias memoriza « echo 1 »
alias valor_doble="echo $n"
# comillas simples: el alias memoriza el texto « echo $n », que se lee más tarde
alias valor_simple='echo $n'
# se cambia el valor de n
n=2
# muestra 1: el valor quedó fijado al crear el alias
valor_doble
# muestra 2: la variable se lee en el momento de usarla
valor_simple
```

La salida observada es `1` y luego `2`. Regla práctica: **siempre comillas simples** alrededor del texto de un alias, salvo que se quiera fijar un valor.

### Hacer permanente un alias

Un alias escrito en la terminal se guarda **en memoria**, en la sesión: cierre la ventana y desaparece. Para recuperarlo en cada apertura, se escribe en el archivo `~/.bashrc`, que Bash lee al arrancar cada terminal (véase [los archivos de configuración](/?c=langages&s=bash&p=variables-denvironnement#archivos-de-configuracion-del-shell)). El signo `~` designa su carpeta personal (véase [la expansión de la tilde](/?c=langages&s=bash&p=expansion-et-jokers#la-expansion-de-la-tilde)).

```bash
# echo muestra el texto; >> (redirección) lo añade al final del archivo ~/.bashrc
echo "alias ll='ls -la'" >> ~/.bashrc
# source lee el archivo y ejecuta sus líneas en la sesión en curso
# (no hace falta reabrir la terminal)
source ~/.bashrc
```

Las comillas dobles exteriores protegen aquí las comillas simples interiores: el archivo recibe exactamente `alias ll='ls -la'`. La redirección `>>` se explica en [las redirecciones y los pipes](/?c=langages&s=bash&p=redirections-et-pipes), y `source` en [las variables de entorno](/?c=langages&s=bash&p=variables-denvironnement#source-recargar-un-archivo-de-configuracion).

## Nivel 2: alias o función con argumentos

Un alias solo sabe **pegar** su texto en lugar de la palabra; los argumentos escritos después llegan **al final**. Por eso no puede colocarlos en otro sitio. Prepare una carpeta de prueba:

```bash
# mkdir crea una carpeta ; prueba es nuestra carpeta de trabajo
mkdir prueba
# cd entra en ella
cd prueba
# crea una subcarpeta llamada sub
mkdir sub
# > escribe el texto en un archivo (lo crea si no existe)
echo "hola" > a.txt
# un nombre de archivo con un espacio: lo usaremos más abajo
echo "hola mundo" > "mi archivo.txt"
# un archivo en la subcarpeta
echo "adiós" > sub/b.txt
```

### El alias que no funciona

Este es un atajo que busca una palabra en todos los archivos. `grep` es el comando que busca texto (véase [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-buscar-texto)); `-r` lo hace bajar a las subcarpetas, y el punto `.` designa la carpeta actual. El texto `$1` designa el primer argumento **de un script o de una función** (véase [los argumentos de un script](/?c=langages&s=bash&p=scripts-et-shebang#los-argumentos-de-un-script)).

```bash
# el alias debería ejecutar: grep -r "palabra" . (la palabra escrita en lugar de $1)
alias busca='grep -r "$1" .'
# lanzamos el alias con la palabra hola
busca hola
# muestra el contenido de $1 entre corchetes
echo "[$1]"
```

```text
./a.txt:hola
./mi archivo.txt:hola mundo
./sub/b.txt:adiós
grep: hola: No such file or directory
[]
```

El orden de los archivos puede variar de un sistema a otro. El resultado es falso, y la explicación está en los pasos de la sustitución:

| Paso | Lo que ocurre |
|---|---|
| 1. Expansión del alias | `busca hola` se convierte en `grep -r "$1" . hola`: la palabra escrita se pega **al final** |
| 2. Análisis de la línea obtenida | `$1` se lee como variable del **terminal**, donde no existe: vale vacío, de ahí `[]` |
| 3. Ejecución | `grep -r "" . hola`: el patrón vacío (el patrón es el texto buscado) coincide con **todas** las líneas, y `hola` se toma por un nombre de archivo, que no existe |

Un alias no tiene **`$1`**: no tiene parámetros propios. Hace falta una función.

### La función: `$1`, `"$@"` y `"$#"`

Una **función** agrupa comandos bajo un nombre; recibe sus argumentos en `$1` (el primero), `$2` (el segundo), etc. (véase [las funciones de Bash](/?c=langages&s=bash&p=fonctions)). Escrita en la terminal, se introduce en varias líneas: Bash muestra `>` mientras no se cierren las llaves.

```bash
# primero eliminamos el alias del mismo nombre (véase la explicación debajo de este bloque)
unalias busca
# busca() declara la función ; las llaves { } rodean sus comandos
busca() {
    # $1 vale aquí el primer argumento de la función: la palabra buscada
    grep -r "$1" .
}
# ejecuta la función con la palabra hola
busca hola
```

```text
./a.txt:hola
./mi archivo.txt:hola mundo
```

Esta vez, la línea `grep -r "hola" .` se ejecuta como se esperaba. El `unalias` del principio no es decorativo: mientras exista el alias `busca`, Bash lo expande también en la línea `busca() {` (es una palabra en primera posición), y la declaración de la función falla con `syntax error near unexpected token`. **Siempre se elimina un alias antes de declarar una función del mismo nombre.** Hay otras dos escrituras para pasarlo todo:

| Escritura | Significado |
|---|---|
| `$1`, `$2`... | El primer, el segundo... argumento recibido |
| `"$@"` | **Todos** los argumentos, cada uno guardado como una palabra separada, aunque contenga espacios |
| `"$#"` | El **número** de argumentos recibidos |

La diferencia de las comillas alrededor de `$@` se ve con un nombre de archivo que contiene un espacio. `printf` muestra un texto según una plantilla: aquí `[%s]` se repite para cada argumento, y `\n` pasa a la línea siguiente.

```bash
# resumir() muestra el número de argumentos, y luego cada uno entre corchetes
resumir() {
    # "$#": número de argumentos recibidos
    echo "$# argumentos"
    # "$@": cada argumento sigue siendo una palabra entera
    printf '[%s]\n' "$@"
}
# malo() hace lo mismo, pero $@ NO tiene comillas
malo() {
    # sin comillas, Bash trocea el contenido en cada espacio
    printf '[%s]\n' $@
}
# tres argumentos, entre ellos "mi archivo.txt", que contiene un espacio
resumir a "mi archivo.txt" c
# los mismos argumentos con la versión sin comillas
malo a "mi archivo.txt" c
```

```text
3 argumentos
[a]
[mi archivo.txt]
[c]
[a]
[mi]
[archivo.txt]
[c]
```

Sin comillas, « mi archivo.txt » se corta en **dos** palabras, y el comando que lo recibe buscará dos archivos que no existen. Por eso se escribe casi siempre `"$@"`, nunca `$@` a secas (véase [las variables especiales](/?c=langages&s=bash&p=scripts-et-shebang#los-argumentos-de-un-script) y [el orden de las expansiones](/?c=langages&s=bash&p=architecture-dun-shell#el-orden-preciso-de-las-expansiones)).

Por último, `"$#"` permite rechazar una llamada incompleta. `if` evalúa una condición (véase [las condiciones](/?c=langages&s=bash&p=conditions)), `-lt` significa « menor que », `return 1` termina la función con el código 1 (un código distinto de cero indica un fallo), y `${2:-.}` vale el segundo argumento si se ha dado, y si no, el punto.

```bash
# busca2(): busca una palabra, en una carpeta indicada o, por defecto, en la carpeta actual
busca2() {
    # si el número de argumentos es menor que 1, el comando está incompleto
    if [ "$#" -lt 1 ]; then
        # muestra el modo de empleo, y sale de la función con el código de fallo 1
        echo "uso: busca2 PATRÓN [CARPETA]"
        return 1
    fi
    # -n añade el número de línea ; "${2:-.}": la carpeta indicada, si no el punto
    grep -rn "$1" "${2:-.}"
}
# llamada sin argumento: se muestra el modo de empleo
busca2
# llamada con una palabra: busca en la carpeta actual
busca2 adiós
# llamada con una palabra y una carpeta: busca solo en sub
busca2 hola sub
```

```text
uso: busca2 PATRÓN [CARPETA]
./sub/b.txt:1:adiós
```

La última llamada no muestra nada: `hola` no aparece en `sub`, y `grep` termina entonces con el código de salida 1, el de un fallo (véase [los códigos de salida](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-salida-exit)).

| | Alias | Función |
|---|---|---|
| Dar otro nombre a un comando | Sí | Sí |
| Argumentos añadidos **al final** | Sí, automáticamente | Sí, con `"$@"` |
| Colocar un argumento **en medio** (`$1`) | **No** | Sí |
| Contar los argumentos, probar con `if` | No | Sí (`"$#"`, `if`) |
| Varios comandos seguidos | Posible, pero ilegible | Sí, uno por línea |
| Se elimina con | `unalias nombre` | `unset -f nombre` (`unset` deshace un nombre, `-f` designa una función) |
| Se consulta con | `alias` | `type nombre` (muestra qué es `nombre`, véase el [nivel 4](#nivel-4-eludir-y-convivir)) |

Una función escrita en la terminal también vive solo en la sesión: para conservarla, se pone en `~/.bashrc` o en un archivo que cargue ese archivo (véase [el nivel 5](#nivel-5-organizar-sus-atajos)).

## Nivel 3: los alias en un script

Un **script** es un archivo de texto que contiene comandos, ejecutados uno detrás de otro (véase [escribir y ejecutar un script](/?c=langages&s=bash&p=scripts-et-shebang)). Aquí se lanza con `bash nombre.sh`, lo que arranca un **nuevo** Bash que lee el archivo. Como ese Bash se lanza directamente, la primera línea especial del archivo, el [shebang](/?c=langages&s=bash&p=scripts-et-shebang#el-shebang), no es necesaria en nuestros ejemplos.

### Por defecto, un script ignora los alias

Un **shell interactivo** es un shell que espera sus comandos escritos con el teclado en una terminal; un shell **no interactivo** es un shell que lee un script. Los alias solo se expanden, por defecto, en el primero. Dos consecuencias:

```bash
# --- contenido de sin-opcion.sh ---
# alias: crea el alias saludar, que sustituye esta palabra por « echo hola »
alias saludar='echo hola'
# usamos el alias en la línea siguiente
saludar mundo
# esta línea demuestra que el script continúa a pesar del error
echo "fin del script"
```

```bash
# lanza el script en un nuevo Bash no interactivo
bash sin-opcion.sh
```

```text
sin-opcion.sh: line 4: saludar: command not found
fin del script
```

Incluso cuando el alias se define **en el script**, no se expande: Bash busca un comando llamado `saludar`. Y un alias creado en su terminal no existe en el script, que es otro **proceso** (un programa en ejecución, véase [la gestión de procesos](/?c=langages&s=bash&p=gestion-des-processus)):

```bash
# --- contenido de usa-alias.sh ---
# este script no creó ningún alias saludar: intenta usar el de la terminal
saludar tú
```

```bash
# en la terminal: el alias existe para la terminal
alias saludar='echo hola'
# la terminal lo expande
saludar mundo
# el script, en cambio, es otro Bash: el alias no está allí
bash usa-alias.sh
```

```text
hola mundo
usa-alias.sh: line 2: saludar: command not found
```

### Activar los alias: `shopt -s expand_aliases`

`shopt` (del inglés *shell option*) activa o desactiva una opción de Bash ([documentación de `shopt`](https://www.gnu.org/software/bash/manual/html_node/The-Shopt-Builtin.html)): `-s` la activa (*set*), `-u` la desactiva (*unset*), y su nombre solo muestra su estado. La opción `expand_aliases` está « desactivada » en un script (« activada » en una terminal).

```bash
# --- contenido de con-opcion.sh ---
# shopt -s : activa (set) la opción expand_aliases, que permite los alias en un script
shopt -s expand_aliases
# crea el alias saludar
alias saludar='echo hola'
# usa el alias en la línea siguiente
saludar mundo
# muestra un mensaje final
echo "fin del script"
```

```bash
# lanza el script
bash con-opcion.sh
# muestra el estado de la opción en un Bash no interactivo (-c : ejecutar este texto)
bash --norc -c 'shopt expand_aliases'
```

```text
hola mundo
fin del script
expand_aliases      	off
```

### La trampa de la línea siguiente

Bash lee un **comando completo**: al menos una línea entera, y todas las líneas de un bloque (`{ }`, `if`, bucle, cuerpo de función) antes de ejecutar la primera. Ahora bien, la expansión de un alias ocurre **al leer**, no al ejecutar. Consecuencia: un alias solo existe a partir de la **línea siguiente** leída. En una terminal, cada línea se lee al pulsar Intro, así que el problema no se ve; en un script, sí aparece.

```bash
# --- contenido de misma-linea.sh ---
# permite los alias en este script
shopt -s expand_aliases
# definición Y uso en la misma línea: separados por un punto y coma
alias saludar='echo hola'; saludar mundo
# muestra un mensaje final
echo "fin del script"
```

```bash
# --- contenido de bloque.sh ---
# permite los alias en este script
shopt -s expand_aliases
# las llaves { } forman un bloque: Bash lee todo el bloque antes de ejecutar una línea
{
    # definición del alias, dentro del bloque
    alias saludar='echo hola'
    # uso en el mismo bloque: el alias es desconocido aquí
    saludar mundo
}
# uso después del bloque: el bloque se ha ejecutado, el alias existe
saludar de nuevo
```

```bash
# --- contenido de funcion-antes.sh ---
# permite los alias en este script
shopt -s expand_aliases
# decir se LEE antes de que exista el alias: saludar sigue siendo una palabra común
decir() { saludar tú; }
# el alias se crea después de la lectura de la función
alias saludar='echo hola'
# llamada a la función: busca un comando saludar y no encuentra nada
decir
```

```bash
# --- contenido de funcion-despues.sh ---
# permite los alias en este script
shopt -s expand_aliases
# el alias se crea primero
alias saludar='echo hola'
# la función decir se lee ahora: saludar se sustituye por « echo hola »
decir() { saludar tú; }
# llamada a la función: muestra hola tú
decir
```

```bash
# ejecuta cada uno de los cuatro scripts
bash misma-linea.sh
bash bloque.sh
bash funcion-antes.sh
bash funcion-despues.sh
```

```text
misma-linea.sh: line 4: saludar: command not found
fin del script
bloque.sh: line 8: saludar: command not found
hola de nuevo
funcion-antes.sh: line 4: saludar: command not found
hola tú
```

| Situación | Resultado |
|---|---|
| Definición y uso en **dos líneas** consecutivas | Funciona (con `expand_aliases` en un script) |
| Definición y uso en la **misma línea** (`;`) | Falla: el alias no existe todavía al leer |
| Definición y uso **en el mismo bloque** `{ }` | Falla; el uso **después** del bloque funciona |
| Función leída **antes** del alias | Falla al llamarla, aunque el alias exista en ese momento |
| Función leída **después** del alias | Funciona |

Observe la línea 4 del mensaje de `funcion-antes.sh`: es la línea donde se leyó el **cuerpo de la función**, no la de la llamada.

Un archivo de atajos cargado con `source` es una excepción, porque solo se lee cuando se ejecuta `source`, es decir, después de `shopt`:

```bash
# --- contenido de atajos.sh ---
# archivo de atajos: solo contiene la definición de un alias
alias saludar='echo hola'
```

```bash
# --- contenido de carga-con.sh ---
# permite los alias en este script
shopt -s expand_aliases
# source lee el archivo atajos.sh y ejecuta sus líneas en este script
source ./atajos.sh
# el alias creado por el archivo se puede usar a partir de aquí
saludar mundo
```

```bash
# lanza el script: muestra « hola mundo »
bash carga-con.sh
```

### La solución recomendada: una función

Una función no depende de ninguna opción ni de ningún orden de lectura: funciona igual en una terminal y en un script.

```bash
# --- contenido de funcion.sh ---
# una función no necesita ninguna opción: funciona en un script como en la terminal
saludar() {
    # echo muestra su texto; "$@" transmite todos los argumentos recibidos por saludar
    echo hola "$@"
}
# llamada a la función con un argumento
saludar mundo
```

```bash
# lanza el script: muestra « hola mundo »
bash funcion.sh
```

En un script, **no se usa ningún alias**: se escribe el comando completo, o una función.

## Nivel 4: eludir y convivir

### ¿Quién responde cuando se escribe un nombre?

Un mismo nombre puede designar un alias, una función, un comando interno (*builtin*, un comando integrado en el propio Bash, como `cd`) y un programa (un archivo ejecutable, como `/usr/bin/date`, encontrado gracias a [`$PATH`](/?c=langages&s=bash&p=variables-denvironnement#path-como-encuentra-el-shell-un-comando)). Bash elige según un orden fijo:

| Prioridad | Quién responde | Ejemplo |
|---|---|---|
| 1 (la más fuerte) | Un **alias** | `alias ll='ls -la'` |
| 2 | Una **función** | `busca() { ... }` |
| 3 | Un **comando interno** | `cd`, `echo`, `type` |
| 4 (la más débil) | Un **programa** | `/usr/bin/date` |

El comando `type -a nombre` (*type*, « ¿de qué tipo es ese nombre? »; con `command` y `builtin`, se describe en [los comandos internos de Bash](https://www.gnu.org/software/bash/manual/html_node/Bash-Builtins.html)) enumera **todas** las respuestas posibles, en orden. Véalo con `date`, que es un programa, al que añadimos luego una función y un alias del mismo nombre:

```bash
# el nombre date solo es, por ahora, un programa
type -a date
# una función llamada date
date() { echo "date (función)"; }
# un alias llamado date
alias date='echo "date (alias)"'
# las tres respuestas, de la más prioritaria a la menos prioritaria
type -a date
# ¿quién responde cuando se escribe el nombre?
date
```

```text
date is /usr/bin/date
date is aliased to `echo "date (alias)"'
date is a function
date ()
{
    echo "date (función)"
}
date is /usr/bin/date
date (alias)
```

El primer `type -a` solo encuentra el programa; el segundo muestra el alias, luego la función (con su código), luego el programa; y responde el **alias**. Las palabras `is`, `aliased to` y `a function` son las de un sistema en inglés. Para un nombre de comando interno, `type -a echo` muestra primero `echo is a shell builtin`, y luego la ruta del programa `echo`. Otra forma útil: `type -t nombre` (*type*, opción `-t`) solo muestra una palabra entre `alias`, `function`, `builtin` o `file`, y nada si el nombre es desconocido (código de salida 1).

### Eludir un alias o una función

```bash
# el nombre date designa siempre el alias y la función creados antes
# \date: la barra invertida impide la expansión del alias, responde la función
\date
# command date: ignora el alias Y la función, ejecuta el comando interno o el programa
command date +%Y
# unalias date: elimina el alias ; la función vuelve a responder
unalias date
date
# unset -f date: elimina la función ; el programa vuelve a responder
unset -f date
command date +%Y
```

```text
date (función)
2026
date (función)
2026
```

El número `2026` es el año en curso en el momento de la prueba. `+%Y` es el argumento que pide a `date` mostrar solo el año.

| Quiero | Escritura | Lo que se ignora |
|---|---|---|
| Pasar por alto el alias | `\nombre`, `"nombre"` o `'nombre'` | Solo el alias: responde una **función** del mismo nombre |
| Pasar por alto alias **y** función | `command nombre` | Alias y funciones: responde el comando interno o el programa |
| Forzar un comando interno | `builtin nombre` | Alias, funciones y programas |
| Eliminar el alias de la sesión | `unalias nombre` | Nada: el alias desaparece hasta la próxima sesión |
| Eliminar la función de la sesión | `unset -f nombre` | Nada: la función desaparece hasta la próxima sesión |

¿Por qué funciona `\nombre`? Bash solo busca un alias para una palabra escrita **sin ninguna parte protegida**: en cuanto la palabra contiene una barra invertida o comillas, ya no se considera alias.

### Un alias que se llama a sí mismo: sin bucle

Un alias puede contener el nombre que sustituye, algo muy frecuente: `alias ls='ls --color=auto'` (`--color=auto` colorea los nombres solo si el resultado se muestra en una terminal). Se podría temer un bucle infinito: `ls` se convierte en `ls --color=auto`, cuya primera palabra `ls` vuelve a convertirse en `ls --color=auto`, etc. No ocurre: **una palabra idéntica al alias en curso de expansión no se expande una segunda vez**. El segundo `ls` designa, por tanto, el comando real.

```bash
# el alias ls añade --color=auto al comando ls real
alias ls='ls --color=auto'
# muestra la definición: el texto contiene la palabra ls
type ls
# dos alias que se remiten el uno al otro: a hacia b, b hacia a
alias a='b'
alias b='a'
# a se convierte en b, b se convierte en a, y a no se expande una segunda vez
a
```

```text
ls is aliased to `ls --color=auto'
bash: a: command not found
```

El segundo caso tampoco es un bucle: Bash se detiene y busca un comando real llamado `a`, que no existe. El alias inútil `alias a='b'` solo sirve para ilustrar: nunca se hace eso.

### El alias encadenado: el espacio final

Por defecto, solo la **primera palabra** de la línea se considera alias. Si el texto de un alias **termina con un espacio**, también se considera alias la palabra siguiente. Aquí tiene un ejemplo sin peligro:

```bash
# dos alias: escribir designa echo (sin espacio final), mundo es un texto de sustitución
alias escribir='echo'
alias mundo='todo el mundo'
# la palabra mundo no es una primera palabra: no se expande, aparece tal cual
escribir mundo
# se redefine escribir con un espacio AL FINAL del texto
alias escribir='echo '
# la palabra que sigue a escribir se considera ahora alias: mundo se expande
escribir mundo
```

```text
mundo
todo el mundo
```

El uso más frecuente es `alias sudo='sudo '`. `sudo` es un comando que ejecuta otro comando con los privilegios de administrador ([documentación oficial de `sudo`](https://www.sudo.ws/docs/man/sudo.man/)). Sin el espacio final, `sudo ll` falla (« `ll`: comando no encontrado »), porque la palabra `ll`, que sigue a `sudo`, no es una primera palabra; con él, `ll` se expande en `ls -la` antes de la ejecución.

### Donde los alias no sirven de nada

Un alias existe solo en el shell interactivo que lo creó. Los programas que lanzan otros comandos sin pasar por ese shell no los ven. Ejemplo con `xargs`, un programa que lee palabras y las añade como argumentos de un comando:

```bash
# el alias saludar existe para la terminal
alias saludar='echo hola'
# xargs busca un PROGRAMA llamado saludar: no conoce los alias de Bash
echo tú | xargs saludar
```

```text
xargs: saludar: No such file or directory
```

Una **función** tiene el mismo defecto con `xargs`: tampoco es un programa. `xargs` solo lanza programas reales.

## Nivel 5: organizar sus atajos

### Un archivo `~/.bash_aliases`

Cuando se tienen algunos atajos, `~/.bashrc` se vuelve ilegible. Se guardan en un archivo aparte, `~/.bash_aliases`, que `~/.bashrc` carga. Su nombre es una **convención**: Bash no lo lee por sí solo; es el `~/.bashrc` el que debe contener las líneas siguientes. Algunos sistemas ya los incluyen en su `~/.bashrc` por defecto: busque con `grep bash_aliases ~/.bashrc` antes de añadir (véase [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-buscar-texto)).

```bash
# --- que añadir en ~/.bashrc ---
# [ -f archivo ] es verdadero si ese archivo existe y es un archivo ordinario
if [ -f ~/.bash_aliases ]; then
    # el punto lee el archivo en el shell en curso, como source
    . ~/.bash_aliases
# fi termina el if
fi
```

La prueba `[ -f ... ]` evita un error si el archivo todavía no existe. Véase [las condiciones](/?c=langages&s=bash&p=conditions) para `if` y `[ ]`.

```bash
# --- contenido de ~/.bash_aliases ---
# atajos simples: un nombre corto para un comando
alias ll='ls -la'
# ls -lt: detalle de cada archivo, del más reciente al más antiguo
alias lt='ls -lt'
# --color=auto: colorea los nombres solo si la salida se muestra en una terminal
alias ls='ls --color=auto'
# el espacio final permite expandir el alias de la palabra siguiente (véase el nivel 4)
alias sudo='sudo '
# busca el patrón dado como primer argumento en la carpeta actual
busca() {
    grep -rn "$1" .
}
```

Los alias conviven ahí con las funciones (nivel 2): el archivo no es más que una sucesión de comandos, leída por `source`. Para aplicar una modificación sin reabrir la terminal: `source ~/.bash_aliases`.

| Archivo | Contenido | Por qué |
|---|---|---|
| `~/.bashrc` | El bloque de carga de arriba, y los ajustes del entorno (véase [las variables de entorno](/?c=langages&s=bash&p=variables-denvironnement)) | Se mantiene corto y legible |
| `~/.bash_aliases` | Todos los alias y funciones personales | Un solo lugar para releer, guardar y copiar a otra máquina |
| Un script compartido | Ningún atajo personal | Debe funcionar sin su configuración |

Con un `~/.bash_aliases` que contiene estos alias, se observa:

| Caso observado | Resultado |
|---|---|
| El archivo existe y `~/.bashrc` contiene el bloque `if` | Los alias están presentes en cada terminal nueva (`alias` los muestra) |
| El archivo no existe, con la prueba `[ -f ... ]` | La terminal arranca sin ningún mensaje |
| El archivo no existe, con solo `. ~/.bash_aliases` | Aparece un mensaje `No such file or directory` en cada arranque |
| Una línea añadida al archivo después del arranque | Desconocida mientras no se ejecute `source ~/.bash_aliases` |

### Diagnosticar: `bash --norc`

Cuando un comando se comporta de forma extraña, la causa es a veces uno de sus alias o de sus funciones. `bash --norc` arranca un nuevo Bash **interactivo** que **no lee** `~/.bashrc`: ninguno de sus atajos existe allí (véase [el manual de Bash, sección « Invoking Bash »](https://www.gnu.org/software/bash/manual/html_node/Invoking-Bash.html)).

```bash
# arranca un Bash sin leer ~/.bashrc; el prompt, el texto que precede a lo que escribe,
# puede cambiar de aspecto
bash --norc
# la lista está vacía: no se ha cargado ningún alias
alias
# el alias ll de ~/.bash_aliases no existe aquí
ll
# exit cierra este Bash y le devuelve a la sesión anterior, con sus atajos
exit
```

```text
bash: ll: command not found
```

Si el comportamiento vuelve a ser normal en `bash --norc`, el culpable está en sus atajos: se retiran uno a uno para averiguar cuál es.

## Síntesis de los niveles

| Nivel | Necesidad | Herramienta | Límite |
|---|---|---|---|
| 1 | Otro nombre para un comando | `alias ll='ls -la'`, `unalias`, `~/.bashrc` | Un texto que se pega delante de los argumentos; sin `$1`; se pierde al cerrar la terminal sin `~/.bashrc` |
| 2 | Un argumento colocado en medio, una prueba sobre el número de argumentos | Función con `"$1"`, `"$@"`, `"$#"` | Más largo de escribir; propio de la sesión sin archivo de carga |
| 3 | Un atajo en un script | `shopt -s expand_aliases`, o mejor, una función | Un alias solo existe desde la línea siguiente; un alias de la terminal no está en el script |
| 4 | Convivir sin sorpresas | `type -a`, `\nombre`, `command nombre`, `unalias`, espacio final | `\nombre` deja pasar una función; `xargs` y los scripts ignoran los alias |
| 5 | Ordenar y diagnosticar | `~/.bash_aliases` cargado por `~/.bashrc`, `bash --norc` | Un atajo personal no existe en las otras máquinas |

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| `alias busca='grep -r "$1" .'` | `$1` no existe en un alias: vale vacío, y la palabra escrita se pega al final | Una función con `"$1"` |
| `$@` sin comillas | Un nombre con un espacio se corta en varias palabras | `"$@"` |
| Alias en un script sin `shopt` | Los alias se ignoran en un shell no interactivo | Una función |
| Alias definido y usado en la misma línea o en el mismo bloque `{ }` | El alias solo existe a partir de la línea leída después | Definir en una línea, usar más adelante, o usar una función |
| Declarar una función con el mismo nombre que un alias existente | El alias se expande en la declaración: error de sintaxis | `unalias nombre` antes de la función |
| Función leída antes del alias que usa | La palabra sigue siendo común: la expansión ocurre al leer el cuerpo | Preferir el comando completo en una función |
| Comillas dobles alrededor del texto de un alias | Las variables se leen al crear el alias, el valor queda fijado | Comillas simples |
| Creer que `\nombre` lo evita todo | Solo evita el alias: una función del mismo nombre responde | `command nombre` |
| Olvidar `alias sudo='sudo '` | `sudo ll` falla: `ll` no es una primera palabra | El espacio final en el texto del alias |
| Redefinir un comando peligroso (`rm`, `cp`, `mv`) añadiéndole opciones | Uno se acostumbra a una confirmación que no existe en las otras máquinas | Elegir un nombre nuevo (`suprimir`) |
| Un alias (o una función) detrás de `xargs` | `xargs` lanza programas, no alias de Bash | Un script o el programa mismo |
| Alias escrito en la terminal | Se pierde al cerrar la ventana | Escribirlo en `~/.bash_aliases`, cargado por `~/.bashrc` |
| Modificar `~/.bash_aliases` sin recargar | La sesión en curso conserva el estado anterior | `source ~/.bash_aliases` |
| `. ~/.bash_aliases` sin prueba `[ -f ... ]` | Un error en cada arranque si el archivo no existe | `if [ -f ~/.bash_aliases ]; then ... fi` |
| Nombre de alias idéntico a un programa (`date`) | El programa queda oculto sin aviso | `type -a nombre` antes de elegir |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Un alias para un simple cambio de nombre o unas opciones fijas, una función en cuanto un argumento se coloca en otro lugar que el final | Cada herramienta se queda en su ámbito |
| Comillas simples alrededor del texto de un alias | Las variables se leen en el momento de usarlas |
| `"$@"` con comillas para transmitirlo todo, `"$#"` para contar | Los nombres con espacios no se cortan |
| Escribir el comando completo o una función en un script | El script funciona en todas las máquinas, con o sin sus alias |
| `type -a nombre` antes de crear un atajo | Ninguna máscara involuntaria |
| `command nombre` para llegar al comando real | Salta por encima de alias y funciones |
| Guardar todos los atajos en `~/.bash_aliases`, cargado por `~/.bashrc` con una prueba `[ -f ... ]` | Un `~/.bashrc` corto, atajos fáciles de guardar |
| `bash --norc` cuando un comportamiento parezca extraño | Descartar los atajos como causa |
| Mantener pocos atajos, con nombres sin ambigüedad | Se recuerdan, y se evita tapar un comando útil |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un **alias** es un **texto** que sustituye a la primera palabra escrita, **antes** del análisis de la línea: `alias ll='ls -la'` crea, `alias` lista, `unalias ll` elimina, y `~/.bashrc` lo hace permanente. Los argumentos escritos llegan **al final**: un alias no tiene `$1`, por eso `alias busca='grep -r "$1" .'` falla. Una **función** recibe `$1`, `"$@"` (todos los argumentos, una palabra cada uno) y `"$#"` (su número). Un script no tiene los alias por defecto; `shopt -s expand_aliases` los activa, pero el alias solo existe a partir de la línea siguiente, fuera del bloque o de la función que lo define: es preferible una función. Orden de respuesta: alias, luego función, luego comando interno, luego programa; `type -a nombre` los enumera. `\nombre` salta solo el alias, `command nombre` salta alias y función. Un alias que se llama a sí mismo no entra en bucle, porque la palabra idéntica no se expande dos veces. Un espacio final (`alias sudo='sudo '`) hace expandir la palabra siguiente. Se guardan los atajos en `~/.bash_aliases`, cargado por `~/.bashrc` con `[ -f ... ]`, y `bash --norc` los aparta para diagnosticar. |
| **Trampas a evitar** | `$1` en un alias; `$@` sin comillas; alias en un script sin `shopt`; alias definido y usado en la misma línea o en el mismo bloque; función declarada sin haber eliminado el alias del mismo nombre; función leída antes que su alias; comillas dobles alrededor de un alias; creer que `\nombre` salta una función; olvidar el espacio final de `sudo`; redefinir `rm`, `cp` o `mv`; alias detrás de `xargs`; alias perdido al cerrar la terminal; archivo de atajos modificado pero no recargado; `. archivo` sin prueba de existencia; nombre de alias que tapa un programa. |
| **Buenas prácticas** | Alias para cambiar de nombre, función en cuanto un argumento va en otro lugar que el final; comillas simples; `"$@"` y `"$#"`; comando completo o función en un script; `type -a nombre` antes de nombrar; `command nombre` para llegar al comando real; atajos en `~/.bash_aliases`; `bash --norc` para apartar sus atajos en un diagnóstico. |
