---
order: 8
---

# Alias avanzados en Zsh

Un **alias** es un atajo: un nombre corto que se escribe en lugar de un comando más largo. Este capítulo supone que usted sabe abrir una [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (la ventana donde se escriben instrucciones con el teclado) y lanzar en ella un comando simple como `ls` (véase [los comandos básicos](/?c=langages&s=bash&p=commandes-de-base)). El **shell** es el programa que lee lo que se escribe en la terminal y lo ejecuta; el de este capítulo es [Zsh](/?c=langages&s=zsh&p=zsh). Un **comando** es una instrucción escrita en la terminal (`ls`), un **argumento** es todo lo que se escribe después de su nombre (`/tmp` en `ls /tmp`), y una **opción** es un argumento que empieza por un guion (`-l`). La **sesión** es el periodo que va desde la apertura de la ventana de la terminal hasta su cierre.

La mecánica de los alias es la misma en [Bash](/?c=langages&s=bash&p=bash) y en Zsh. Todo lo que es idéntico se resume aquí en una frase y se remite al capítulo [Alias avanzados en Bash](/?c=langages&s=bash&p=alias-avances); este capítulo detalla **lo que difiere o se añade en Zsh**, **en cinco niveles**, apoyándose cada uno en el anterior:

| Nivel | Necesidad | Herramienta | Sección |
|---|---|---|---|
| 1 | Otro nombre para un comando | `alias`, `unalias`, `~/.zshrc` | [Nivel 1](#nivel-1-el-alias-simple) |
| 2 | Un comando que recibe argumentos en medio | Una **función** (un grupo de comandos guardado bajo un nombre: `$1`, `"$@"`, `"$#"`) | [Nivel 2](#nivel-2-alias-o-funcion-con-argumentos) |
| 3 | Usar un atajo en un script | La opción `aliases` (activa por defecto), o mejor, una función | [Nivel 3](#nivel-3-los-alias-en-un-script) |
| 4 | Un atajo que actúa en cualquier parte de la línea, o según la extensión de un archivo | `alias -g` (alias globales), `alias -s` (alias de sufijo) | [Nivel 4](#nivel-4-alias-globales-y-alias-de-sufijo) |
| 5 | Hacer convivir, ordenar y diagnosticar | `\nombre`, `command`, `whence -a`, `~/.zsh_aliases`, `zsh -f` | [Nivel 5](#nivel-5-eludir-convivir-y-organizar) |

El mismo tema existe para otro shell: [los alias y atajos de comandos en PowerShell](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), donde el alias es mucho más limitado.

## Qué es un alias en Zsh, y lo que no cambia

Como en Bash, un alias es un **texto de sustitución**: Zsh sustituye la palabra escrita por el texto del alias **antes de analizar la línea**, es decir, antes de dividirla en palabras y de tratar las [variables](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) (cajas con etiqueta que contienen un valor) y los [comodines](/?c=langages&s=bash&p=expansion-et-jokers) (patrones como `*.txt`, que el shell sustituye por los nombres de archivo correspondientes) (véase [qué es un alias en Bash](/?c=langages&s=bash&p=alias-avances#que-es-un-alias-en-bash)). Esta sustitución se llama la **expansión** del alias (en inglés *alias expansion*). El manual de Zsh la describe en [su sección « Aliasing »](https://zsh.sourceforge.io/Doc/Release/Shell-Grammar.html#Aliasing).

La tabla siguiente resume, para cada punto, lo que es cierto de manera idéntica en los dos shells (comprobado por la experiencia) y lo que difiere. Las diferencias se detallan en los niveles indicados.

| Punto | Bash | Zsh | Nivel |
|---|---|---|---|
| El alias es un texto sustituido antes del análisis de la línea | Sí | Sí, idéntico | Este nivel |
| `$1` en el texto de un alias | Ausente: vale vacío | Ausente, idéntico | [2](#nivel-2-alias-o-funcion-con-argumentos) |
| Función con el mismo nombre que un alias, escrita `nombre() { ... }` | Error de sintaxis | Error, con un mensaje más explícito | [2](#nivel-2-alias-o-funcion-con-argumentos) |
| `$@` sin comillas | Troceado en cada espacio, y los comodines se expanden | **No troceado**, comodines no expandidos | [2](#nivel-2-alias-o-funcion-con-argumentos) |
| Alias definido en un script, luego usado | Ignorado, salvo con `shopt -s expand_aliases` | **Expandido**: la opción `aliases` está activa en todas partes | [3](#nivel-3-los-alias-en-un-script) |
| Alias definido y usado en la misma línea o en el mismo bloque | Todavía no existe | Idéntico | [3](#nivel-3-los-alias-en-un-script) |
| Alias que actúa en otro lugar que la primera palabra | Solo con el espacio final | Alias globales (`alias -g`) | [4](#nivel-4-alias-globales-y-alias-de-sufijo) |
| Lanzar un archivo según su extensión | No existe | Alias de sufijo (`alias -s`) | [4](#nivel-4-alias-globales-y-alias-de-sufijo) |
| Mostrar lo que responde a un nombre | `type -a nombre` | `type -a nombre` o `whence -a nombre` | [5](#nivel-5-eludir-convivir-y-organizar) |
| Archivo de atajos personales | `~/.bashrc`, `~/.bash_aliases` | `~/.zshrc`, `~/.zsh_aliases` | [5](#nivel-5-eludir-convivir-y-organizar) |

## Nivel 1: el alias simple

La sintaxis es la de Bash: `alias nombre='texto'` crea un alias, `alias` solo los lista, `unalias nombre` elimina uno. Las comillas simples alrededor del texto dejan además las variables intactas hasta el uso del alias: la experiencia del capítulo Bash (véase [comillas simples o dobles](/?c=langages&s=bash&p=alias-avances#comillas-simples-o-dobles-cuando-se-leen-las-variables)) da, en Zsh, `1` con comillas dobles y `2` con comillas simples. Lo que cambia es la **visualización** de las listas.

Una precaución antes de copiar en una terminal los bloques de este capítulo: incluyen **comentarios**, es decir, textos que empiezan por `#` y que el shell ignora. Un Zsh que lee un script los ignora, pero un Zsh **interactivo** solo los reconoce si la opción `interactive_comments` está activa (véase [el sistema de opciones](/?c=langages&s=zsh&p=options-du-shell)); si no, intenta lanzar un comando llamado `#` y responde `zsh: command not found: #`.

```zsh
# setopt activa una opción del shell: aquí, los comentarios pasan a ser aceptados
setopt interactive_comments
```

La primera línea de este bloque es ella misma un comentario: provoca el error una última vez, así que basta con escribir la segunda. Para que la opción esté activa en cada sesión, se añade a `~/.zshrc` (véase [el final de este nivel](#hacer-permanente-un-alias-zshrc)). Los bloques siguientes suponen la opción activada.

```zsh
# alias nombre='texto': crea el alias ll; el texto entre comillas simples se guarda tal cual
alias ll='ls -la'
# alias sin argumento: lista todos los alias de la sesión, con la forma nombre='texto'
alias
# alias seguido de un nombre: muestra la definición de ese alias solamente
alias ll
# alias -L: lista en forma de comandos completos, que se pueden copiar en un archivo
alias -L
# unalias elimina el alias ll para la sesión en curso
unalias ll
# ll ya no se conoce: Zsh responde « command not found: ll » (« comando no encontrado »)
ll
```

En una sesión virgen (iniciada con `zsh -f`, véase [el nivel 5](#diagnosticar-zsh-f)), estos comandos muestran:

```text
ll='ls -la'
run-help=man
which-command=whence
ll='ls -la'
alias ll='ls -la'
alias run-help=man
alias which-command=whence
zsh: command not found: ll
```

La opción `-la` reúne `-l` (una línea detallada por archivo) y `-a` (mostrar también los elementos ocultos): véase [el comando `ls`](/?c=langages&s=bash&p=commandes-de-base#listar-una-carpeta-ls). Tres diferencias con Bash aparecen:

| Observación | Bash | Zsh |
|---|---|---|
| Forma de una línea de `alias` | `alias ll='ls -la'` | `ll='ls -la'` (sin la palabra `alias`) |
| Forma reutilizable tal cual | La salida de `alias` | La salida de **`alias -L`**: `alias ll='ls -la'` |
| Alias presentes en una sesión virgen | Ninguno | Dos, definidos por el propio Zsh: `run-help` (que designa `man`, el comando que muestra el manual de un comando, véase [`man`](/?c=langages&s=bash&p=commandes-de-base#obtener-ayuda-man-y-help)) y `which-command` (que designa `whence`, véase el [nivel 5](#nivel-5-eludir-convivir-y-organizar)) |

Los dos alias de partida varían según la configuración del sistema: algunos archivos de configuración quitan uno. El mensaje de error depende del idioma del sistema. En lo demás, los comandos de gestión son los de Bash:

| Comando | Efecto |
|---|---|
| `alias nombre='texto'` | Crea o reemplaza el alias `nombre` |
| `alias` | Lista todos los alias (el resto de este capítulo añade `-r`, `-g`, `-s`, `-L`, `-m`) |
| `alias nombre` | Muestra la definición de `nombre`; no muestra nada y termina con error si `nombre` no es un alias |
| `unalias nombre` | Elimina el alias `nombre`; muestra `no such hash table element: nombre` si el alias no existe |
| `unalias -a` | Elimina todos los alias de la sesión, los de Zsh incluidos |

### Hacer permanente un alias: `~/.zshrc`

Un alias escrito en la terminal vive **en memoria**, en la sesión. Para recuperarlo en cada apertura, se escribe en el archivo `~/.zshrc`, que Zsh lee al arrancar cada terminal interactiva (véase [los archivos de inicio](/?c=langages&s=zsh&p=fichiers-de-demarrage)). El signo `~` designa su carpeta personal.

```zsh
# echo muestra el texto; >> (redirección) lo añade al final del archivo ~/.zshrc
echo "alias ll='ls -la'" >> ~/.zshrc
# source lee el archivo y ejecuta sus líneas en la sesión en curso
# (no hace falta reabrir la terminal)
source ~/.zshrc
```

La redirección `>>` se explica en [las redirecciones y los pipes](/?c=langages&s=bash&p=redirections-et-pipes). Si ha instalado [Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh), el `~/.zshrc` ya existe y contiene otras líneas: se añaden las suyas **al final** (véase el [nivel 5](#los-alias-de-oh-my-zsh)).

## Nivel 2: alias o función con argumentos

El límite es el mismo que en Bash: un alias solo puede pegar su texto delante de los argumentos escritos, no tiene `$1` (véase [el nivel 2 del capítulo Bash](/?c=langages&s=bash&p=alias-avances#nivel-2-alias-o-funcion-con-argumentos)). Preparemos la misma carpeta de prueba:

```zsh
# mkdir crea una carpeta ; prueba es nuestra carpeta de trabajo
mkdir prueba
# cd entra en ella
cd prueba
# crea una subcarpeta llamada sub
mkdir sub
# echo muestra su texto; > lo escribe en el archivo a.txt (lo crea si no existe)
echo "hola" > a.txt
# un nombre de archivo con un espacio: lo usaremos más abajo
echo "hola mundo" > "mi archivo.txt"
# un archivo en la subcarpeta
echo "adiós" > sub/b.txt
```

Este es el alias que no funciona. `grep` busca texto (véase [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-buscar-texto)), `-r` hace que descienda a las subcarpetas, y el punto `.` designa la carpeta actual.

```zsh
# el alias debe lanzar: grep -r "palabra" .  (con la palabra escrita en lugar de $1)
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

El orden de los archivos puede variar de un sistema a otro. El resultado es el de Bash y la explicación también (véase [el alias que no funciona](/?c=langages&s=bash&p=alias-avances#el-alias-que-no-funciona)): la línea se convierte en `grep -r "$1" . hola`, `$1` se lee como variable de la terminal, donde no existe, y `hola` se toma por un nombre de archivo. Hace falta una **función**.

### Declarar la función: dos escrituras, y una trampa de nombre

Una función agrupa comandos bajo un nombre; recibe sus argumentos en `$1`, `$2`... (véase [las funciones](/?c=langages&s=bash&p=fonctions)). Zsh acepta las escrituras de Bash y añade una:

| Escritura | Resultado en Zsh |
|---|---|
| `nombre() { ... }` | Declara la función (la escritura de Bash) |
| `function nombre { ... }` | Declara la función (la palabra `function`, sin paréntesis) |
| `function nombre() { ... }` | Declara la función (las dos juntas) |

Las tres escrituras dan una función idéntica. Aquí la primera, escrita en la terminal en varias líneas (Zsh muestra un indicador de continuación, es decir, un texto corto al principio de cada nueva línea, mientras falte la llave de cierre):

```zsh
# la palabra busca sigue siendo un alias: se elimina antes de declarar la función
unalias busca
# busca() declara la función ; las llaves { } rodean sus comandos
busca() {
    # $1 vale aquí el primer argumento de la función: la palabra buscada
    grep -r "$1" .
}
# lanza la función con la palabra hola
busca hola
```

```text
./a.txt:hola
./mi archivo.txt:hola mundo
```

¿Qué pasa si se olvida el `unalias`? Como en Bash, la palabra `busca` es una primera palabra: Zsh también la expande en la declaración. La diferencia está en el **mensaje**, más explícito que el « syntax error » de Bash. Se recrea el alias para comprobarlo, y luego se prueba la otra escritura:

```zsh
# recreamos el alias eliminado antes
alias busca='grep -r "$1" .'
# declaración de una función del mismo nombre, en una línea (; separa dos comandos)
busca() { grep -r "$1" . ; }
# la otra escritura: el nombre no está en primera posición, el alias no se expande
function busca { grep -r "$1" . ; }
# type -a enumera todas las respuestas posibles al nombre, de la más prioritaria a la menos
type -a busca
```

```text
zsh: defining function based on alias `busca'
zsh: parse error near `()'
busca is an alias for grep -r "$1" .
busca is a shell function
```

La declaración `busca() { ... }` falla con dos mensajes. La escritura `function busca { ... }` **tiene éxito sin ruido**, pero es una trampa: el alias sigue siendo prioritario (aparece primero en `type -a`), así que escribir `busca` lanza siempre el alias, nunca la función. **Por eso se elimina siempre el alias antes de declarar una función del mismo nombre**, sea cual sea la escritura. Después se ordena la terminal:

```zsh
# elimina el alias y la función busca, para empezar de nuevo con una terminal limpia
unalias busca
# unfunction elimina una función (la tabla de más abajo da el equivalente unset -f)
unfunction busca
```

### `$@` sin comillas: la trampa de Bash no existe

En Bash, `$@` sin comillas parte en dos un nombre de archivo que contiene un espacio (véase [la función: `$1`, `"$@"` y `"$#"`](/?c=langages&s=bash&p=alias-avances#la-funcion-1-y)). Zsh se comporta de otra manera. `printf` muestra un texto según una plantilla: aquí `[%s]` se repite para cada argumento, y `\n` pasa a la línea siguiente.

```zsh
# resumir() muestra el número de argumentos, y luego cada uno entre corchetes
resumir() {
    # "$#": número de argumentos recibidos
    echo "$# argumentos"
    # "$@": cada argumento sigue siendo una palabra entera
    printf '[%s]\n' "$@"
}
# malo() hace lo mismo, pero $@ NO lleva comillas
malo() {
    # Bash trocearía aquí en cada espacio; Zsh no lo hace
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
[mi archivo.txt]
[c]
```

Las dos versiones dan **tres** palabras: Zsh no trocea el contenido de una variable en los espacios (véase [el troceado de palabras en Zsh](/?c=langages&s=zsh&p=zsh#el-troceado-de-palabras-en-una-variable-sin-comillas)). Las dos funciones no son, sin embargo, equivalentes. Con los argumentos `"*.txt"` (un comodín: el shell lo sustituiría por los nombres de archivo correspondientes) y `""` (un argumento vacío), en la carpeta `prueba`:

| | Bash | Zsh |
|---|---|---|
| `printf '[%s]\n' "$@"` | `[*.txt]` y luego `[]` | `[*.txt]` y luego `[]` |
| `printf '[%s]\n' $@` | `[a.txt]` y luego `[mi archivo.txt]`: el comodín se expande, el argumento vacío desaparece | `[*.txt]` solamente: el comodín no se expande, pero el argumento vacío desaparece |

Zsh es más seguro que Bash en este punto, pero **el argumento vacío desaparece igualmente** sin comillas. Un script escrito para Zsh también puede ser lanzado por Bash: así que se escribe `"$@"` siempre, con las comillas.

`"$#"` (el número de argumentos) funciona como en Bash. Zsh añade `$argv`, un sinónimo de `$@`: `$argv[1]` vale `$1` y `$#argv` vale `$#`. El último ejemplo rechaza una llamada sin argumentos. `if` evalúa una condición (véase [las condiciones](/?c=langages&s=bash&p=conditions)), `-lt` significa « menor que », `return 1` termina la función con el código de fallo 1, y `${2:-.}` vale el segundo argumento si se ha dado, y si no, el punto.

```zsh
# busca2(): busca una palabra en una carpeta dada o, a falta de ella, en la carpeta actual
busca2() {
    # si el número de argumentos es menor que 1, el comando está incompleto
    if [ "$#" -lt 1 ]; then
        # muestra el modo de empleo, y sale de la función con el código de fallo 1
        echo "uso: busca2 PATRÓN [CARPETA]"
        return 1
    fi
    # -n añade el número de línea ; "${2:-.}": la carpeta dada, si no el punto
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

La última llamada no muestra nada: `hola` no aparece en `sub`, y `grep` termina con el código 1 (fallo). Esta es la forma de gestionar las propias funciones en Zsh:

| Quiero | Escritura | Observación |
|---|---|---|
| Saber si `nombre` es una función | `type nombre` | Muestra `nombre is a shell function` |
| Leer el código de la función | `whence -f nombre`, `which nombre` o `functions nombre` | Los tres muestran el cuerpo de la función |
| Eliminar la función | `unfunction nombre` o `unset -f nombre` (`unset` deshace un nombre, `-f` designa una función) | Desaparece hasta la próxima sesión |
| Conservarla para siempre | Colocarla en `~/.zshrc` o en un archivo cargado por él | Véase el [nivel 5](#organizar-sus-atajos) |

## Nivel 3: los alias en un script

Un **script** es un archivo de texto que contiene comandos, ejecutados uno detrás de otro (véase [escribir y ejecutar un script](/?c=langages&s=bash&p=scripts-et-shebang)). Aquí se lanza con `zsh nombre.zsh`, lo que arranca un **nuevo** Zsh que lee el archivo. Un **shell interactivo** es un shell que espera sus comandos escritos con el teclado en una terminal; un shell **no interactivo** es un shell que lee un script.

### Por defecto, un script expande los alias

Es la gran diferencia con Bash, donde los alias solo se expanden en un shell interactivo. Una **opción** del shell es un ajuste que cambia su comportamiento (véase [el sistema de opciones](/?c=langages&s=zsh&p=options-du-shell)). La opción que gobierna los alias se llama `aliases` y está **activa en todos los Zsh**, interactivos o no.

```zsh
# --- contenido de directo.zsh ---
# alias : crea el alias saludar, que sustituye esta palabra por « echo hola »
alias saludar='echo hola'
# usamos el alias en la línea siguiente
saludar mundo
# esta línea muestra un mensaje de fin
echo "fin del script"
```

```zsh
# lanza el script en un nuevo Zsh no interactivo
zsh directo.zsh
```

```text
hola mundo
fin del script
```

No hace falta ningún ajuste (Bash exige `shopt -s expand_aliases`, véase [los alias en un script con Bash](/?c=langages&s=bash&p=alias-avances#nivel-3-los-alias-en-un-script)). Para consultar el estado de una opción, `[[ -o nombre ]]` es verdadero si la opción está activa (los dobles corchetes `[[ ]]` comprueban una condición). `unsetopt` desactiva una opción, `setopt` la activa (véase [el sistema de opciones](/?c=langages&s=zsh&p=options-du-shell)), y `setopt no_aliases` es otra escritura de `unsetopt aliases`: el prefijo `no_` invierte el sentido de una opción.

```zsh
# --- contenido de sin-alias.zsh ---
# desactiva la opción aliases: ya no se expande ningún alias a partir de aquí
setopt no_aliases
# el comando alias sigue funcionando: el alias se crea...
alias saludar='echo hola'
# ... pero la palabra saludar ya no se sustituye: Zsh busca un comando de ese nombre
saludar mundo
# esta línea demuestra que el script continúa a pesar del error
echo "fin del script"
```

```zsh
# --- contenido de estado.zsh ---
# [[ -o aliases ]] es verdadero si la opción aliases está activa
if [[ -o aliases ]]; then echo "aliases: activo"; else echo "aliases: inactivo"; fi
```

```zsh
# lanza los dos scripts
zsh sin-alias.zsh
zsh estado.zsh
```

```text
sin-alias.zsh:6: command not found: saludar
fin del script
aliases: activo
```

El primer mensaje nombra el archivo y el número de línea (`:6`, las líneas de comentario cuentan). Un script lanzado directamente (con una primera línea `#!/usr/bin/env zsh`, el [shebang](/?c=langages&s=bash&p=scripts-et-shebang#el-shebang)) se comporta de la misma manera.

### El alias de la terminal no está en el script

Aunque la opción `aliases` esté activa, un alias creado en su terminal no existe en el script, que es otro **proceso** (un programa en ejecución, véase [la gestión de procesos](/?c=langages&s=bash&p=gestion-des-processus)):

```zsh
# --- contenido de usa-alias.zsh ---
# este script no creó ningún alias saludar: intenta usar el de la terminal
saludar tú
```

```zsh
# en la terminal: el alias existe para la terminal
alias saludar='echo hola'
# la terminal lo expande
saludar mundo
# el script, en cambio, es otro Zsh: el alias no está allí
zsh usa-alias.zsh
```

```text
hola mundo
usa-alias.zsh:2: command not found: saludar
```

El `:2` es el número de línea del archivo, contando la línea de comentario como una.

### ¿Y los alias de `~/.zshrc`?

Un alias escrito en `~/.zshrc` es « un alias de la terminal »: `~/.zshrc` solo lo lee un shell interactivo, un script no lo lee. El capítulo sobre PowerShell lo afirma en [su tabla de comparación](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes#y-en-bash-y-zsh); la experiencia lo confirma, con un **matiz**: `~/.zshenv`, en cambio, lo leen **todos** los Zsh, scripts incluidos (véase [los cuatro archivos de inicio](/?c=langages&s=zsh&p=fichiers-de-demarrage)). Para no tocar su verdadero `~/.zshrc`, fabricamos una carpeta de configuración de prueba. La variable `ZDOTDIR` indica a Zsh la carpeta donde buscar sus archivos de inicio, en lugar de su carpeta personal; escrita delante de un comando (`ZDOTDIR=... comando`), solo vale para ese comando. `$PWD` es la variable que contiene la carpeta actual, y la opción `-d` pide a Zsh que no lea los archivos de inicio del sistema (véase [el diagnóstico](#diagnosticar-zsh-f)).

```zsh
# crea la carpeta de configuración de prueba
mkdir conf
# un alias en el .zshrc de esta configuración
echo "alias desdezshrc='echo alias de zshrc'" > conf/.zshrc
# un alias en el .zshenv de esta configuración
echo "alias desdezshenv='echo alias de zshenv'" > conf/.zshenv
# un script que usa los dos alias (printf escribe una palabra por línea)
printf '%s\n' desdezshrc desdezshenv > usa.zsh
# script lanzado normalmente (no interactivo), con esta configuración
ZDOTDIR=$PWD/conf zsh usa.zsh
# mismo script leído por un Zsh interactivo (-i), sin archivos del sistema (-d)
ZDOTDIR=$PWD/conf zsh -d -i usa.zsh
```

```text
usa.zsh:1: command not found: desdezshrc
alias de zshenv
alias de zshrc
alias de zshenv
```

| Archivo de inicio | Leído por `zsh script.zsh` | Leído por un Zsh interactivo |
|---|---|---|
| `~/.zshenv` | Sí: sus alias son visibles para el script | Sí |
| `~/.zshrc` | **No**: sus alias no están en el script | Sí |

La frase del capítulo PowerShell es, pues, exacta para `~/.zshrc`. No dice que, a diferencia de Bash, un script Zsh expande sus **propios** alias. Una consecuencia práctica: **nunca alias en `~/.zshenv`**, que modificarían en silencio el comportamiento de todos los scripts.

### La trampa de la línea siguiente también existe

La expansión de un alias ocurre **al leer**, no al ejecutar (véase [la trampa de la línea siguiente](/?c=langages&s=bash&p=alias-avances#la-trampa-de-la-linea-siguiente)): Zsh lee un comando completo, o todo un bloque, antes de ejecutar el primero. Los cuatro scripts de Bash han dado los mismos resultados en Zsh:

```zsh
# --- contenido de misma-linea.zsh ---
# definición Y uso en la misma línea: separados por un punto y coma
alias saludar='echo hola'; saludar mundo
# muestra un mensaje de fin
echo "fin del script"
```

```zsh
# --- contenido de bloque.zsh ---
# las llaves { } forman un bloque: Zsh lee todo el bloque antes de ejecutar una línea
{
    # definición del alias, dentro del bloque
    alias saludar='echo hola'
    # uso dentro del mismo bloque: el alias es desconocido aquí
    saludar mundo
}
# uso después del bloque: el bloque se ha ejecutado, el alias existe
saludar de nuevo
```

```zsh
# --- contenido de funcion-antes.zsh ---
# decir se LEE aquí, antes de que exista el alias: saludar sigue siendo una palabra común
decir() { saludar tú; }
# el alias se crea después de la lectura de la función
alias saludar='echo hola'
# llamada a la función: busca un comando saludar y no encuentra nada
decir
```

```zsh
# --- contenido de funcion-despues.zsh ---
# el alias se crea primero
alias saludar='echo hola'
# la función decir se lee ahora: saludar se sustituye por « echo hola »
decir() { saludar tú; }
# llamada a la función: muestra hola tú
decir
```

```zsh
# lanza cada uno de los cuatro scripts
zsh misma-linea.zsh
zsh bloque.zsh
zsh funcion-antes.zsh
zsh funcion-despues.zsh
```

```text
misma-linea.zsh:2: command not found: saludar
fin del script
bloque.zsh:6: command not found: saludar
hola de nuevo
decir: command not found: saludar
hola tú
```

Zsh nombra aquí la **función** en el mensaje (`decir:`) en lugar del archivo y la línea. El resumen es el de Bash, sin el ajuste `shopt`:

| Situación | Resultado |
|---|---|
| Definición y uso en **dos líneas** consecutivas | Funciona, sin ajuste |
| Definición y uso en la **misma línea** (`;`) | Falla: el alias no existe todavía al leer |
| Definición y uso **en el mismo bloque** `{ }` | Falla; el uso **después** del bloque funciona |
| Función leída **antes** del alias | Falla al llamarla, aunque el alias exista en ese momento |
| Función leída **después** del alias | Funciona |

Un archivo de atajos cargado con `source` se lee cuando se ejecuta `source`, así que sus alias existen después:

```zsh
# --- contenido de atajos.zsh ---
# archivo de atajos: solo contiene la definición de un alias
alias saludar='echo hola'
```

```zsh
# --- contenido de carga.zsh ---
# source lee el archivo atajos.zsh y ejecuta sus líneas en este script
source ./atajos.zsh
# el alias creado por el archivo se puede usar a partir de aquí
saludar mundo
```

```zsh
# lanza el script: muestra « hola mundo »
zsh carga.zsh
```

Que la opción `aliases` esté activa no cambia, pues, el consejo de Bash: en un script compartido, **no se usa ningún alias**: se escribe el comando completo o una función. Un alias existe en su máquina, en su configuración; el script debe funcionar en todas partes.

## Nivel 4: alias globales y alias de sufijo

Bash solo conoce un tipo de alias: el de la **primera palabra** de la línea. Zsh añade dos, que no existen en Bash. Preparamos un archivo más en la carpeta de prueba (la carpeta `prueba` del nivel 2):

```zsh
# un archivo de notas (extensión md), para el ejemplo de los alias de sufijo más abajo
echo "# título" > notas.md
```

### El alias global: `alias -g`

Un alias **global** se expande **en cualquier parte de la línea**, no solo en la primera palabra. Se crea con la opción `-g` (de *global*). Los ejemplos tienen un punto en común: sustituyen un trozo de línea que se vuelve a escribir a menudo. Un **tubo** (*pipe*, el carácter `|`) envía lo que muestra un comando a la entrada del siguiente, `less` muestra un texto página a página (se sale con la tecla `q`), y `2>/dev/null` descarta los mensajes de error: `2` designa la salida de error, `>` la redirige, y `/dev/null` es un archivo especial que destruye todo lo que se escribe en él (véase [las redirecciones y los pipes](/?c=langages&s=bash&p=redirections-et-pipes)).

```zsh
# -g: alias global; L se sustituye por « | less » en cualquier parte de la línea
alias -g L='| less'
# NE (« sin errores »): los mensajes de error del comando se descartan
alias -g NE='2>/dev/null'
# G: envía el resultado a grep, el comando que busca una palabra (véase más arriba)
alias -g G='| grep'
# alias -g sin nombre: lista solamente los alias globales
alias -g
# ls sub lista el contenido de la carpeta sub ; L envía el resultado a less
ls sub L
# ls G txt se convierte en « ls | grep txt »: solo se muestran los nombres con txt
ls G txt
# tres trozos: « ls | grep txt | less »
ls G txt L
# ls falla (la carpeta no existe), NE descarta el mensaje de error
ls /inexistente NE
# $? contiene el código de salida del último comando: 0 si tuvo éxito, si no un fallo
echo "code=$?"
```

```text
G='| grep'
L='| less'
NE='2>/dev/null'
b.txt
a.txt
mi archivo.txt
a.txt
mi archivo.txt
code=2
```

(En una terminal real, `ls sub L` abre `less`; aquí se muestra como un simple texto porque la salida no es una pantalla. Los códigos de salida se explican en [el capítulo sobre los scripts](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-salida-exit).) El esquema siguiente muestra lo que Zsh hace con la línea `ls G txt L`:

```
   Usted escribe:   ls G txt L
                   |
   1. Zsh examina CADA palabra, no solo la primera
   2. G es un alias global: se sustituye por  | grep
   3. L es un alias global: se sustituye por  | less
   4. ls y txt no son alias: quedan tal cual
                   |
                   v
   Zsh analiza y ejecuta:   ls | grep txt | less
```

### Las trampas del alias global

Un alias global es potente, y por eso peligroso: se sustituye **en todas partes**, incluso donde la palabra `G` era un simple texto.

```zsh
# G se expande incluso aquí: la línea queda « echo | grep » (grep sin texto que buscar)
echo G
# entre comillas, la palabra sigue siendo un texto corriente
echo "G"
# precedida de una barra invertida, también sigue siendo un texto corriente
echo \G
# entre comillas simples: no se expande nada
echo 'a G b'
# un alias global como primera palabra da una línea que empieza por un tubo
G
# sin comillas, G se expandiría antes de que unalias lo lea
unalias G
# con comillas, el nombre se lee tal cual: el alias se elimina
unalias 'G'
```

```text
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
G
G
a G b
zsh: parse error near `|'
unalias: not enough arguments
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
```

El último `unalias 'G'` tiene éxito sin mostrar nada. Los tres comandos que nombran un alias (`alias`, `unalias`, `unhash`) sufren la misma regla: un alias global debe escribirse ahí **entre comillas** (`unalias 'G'`) o precedido de una barra invertida (`unalias \G`).

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| Un alias global cuyo nombre es una palabra que a veces se escribe como texto (`echo G`, `echo 3 L 4`) | El texto se sustituye por un tubo: la línea cambia de sentido | Nombres en mayúsculas, cortos y sin sentido corriente (`NE`, `G`); comillas o barra invertida para el texto |
| Un alias global como primera palabra | La línea empieza por un tubo: error de análisis | No usarlo nunca solo |
| `unalias G`, `alias G`, `unhash -a G` sin comillas | El nombre se expande antes de ser leído | `unalias 'G'` |
| Alias globales en los comandos de otros (scripts, documentación) | `ls G txt L` es ilegible para quien no conoce sus alias | Un alias global solo para escribir a mano, nunca en un script compartido |
| Un alias global que oculta una redirección (`NE`) | Se olvida que los errores se descartan, así que un comando falla sin ruido | Reservar `NE` para los comandos cuyos mensajes sabe que son inútiles |

### El alias de sufijo: `alias -s`

Un alias de **sufijo** (*suffix alias*) está ligado a la **extensión** de un archivo, es decir, a las letras que siguen al último punto de su nombre (`txt` en `a.txt`). Se crea con `-s`: `alias -s txt=cat` significa « una palabra que termina en `.txt` y que se escribe **primero** va precedida de `cat` ». `cat` muestra el contenido de un archivo (véase [`cat`](/?c=langages&s=bash&p=commandes-de-base#leer-el-contenido-de-un-archivo-cat)), `head` muestra sus primeras líneas (diez por defecto).

```zsh
# -s: alias de sufijo ; a.txt escrito solo lanza « cat a.txt »
alias -s txt=cat
# lo mismo para la extensión md, con el comando head
alias -s md=head
# alias -s sin nombre: lista los alias de sufijo
alias -s
# el nombre del archivo es la primera palabra: Zsh lanza « cat a.txt »
a.txt
# una ruta con una carpeta también funciona
sub/b.txt
# el archivo notas.md lo muestra head
notas.md
# el archivo no existe: el alias se aplica igualmente, cat protesta
inexistente.txt
# los espacios deben protegerse con una barra invertida
mi\ archivo.txt
# entre comillas, la palabra ya no es un nombre de archivo para Zsh: el alias se ignora
"mi archivo.txt"
```

```text
md=head
txt=cat
hola
adiós
# título
cat: inexistente.txt: No such file or directory
hola mundo
zsh: command not found: mi archivo.txt
```

Lo que se observa, contrariamente a lo que se supone a menudo:

| Caso | Resultado |
|---|---|
| `a.txt` (el archivo existe) | Se lanza `cat a.txt` |
| `inexistente.txt` (el archivo no existe) | Se lanza `cat inexistente.txt` igualmente: el alias depende del **nombre**, no del archivo |
| `./a.txt`, `sub/b.txt`, `~/notas.txt` | El alias se aplica: la ruta cuenta solo por su final |
| `a.TXT` | Ningún alias: la extensión distingue **mayúsculas y minúsculas** |
| `"mi archivo.txt"` o `'mi archivo.txt'` | Ningún alias: una palabra entre comillas no se reconoce; se escribe `mi\ archivo.txt` |
| `echo a.txt` | Ningún alias: solo se mira la **primera palabra** de la línea |
| `a.txt otro` | `cat a.txt otro`: el resto de la línea sigue al nombre del archivo |
| Una carpeta llamada `doc.txt` | `cat: doc.txt: Is a directory`: `cat` no lee una carpeta |
| Un programa ejecutable llamado `prog.txt`, lanzado por `./prog.txt` | El alias pasa **antes**: `cat` muestra el script en lugar de ejecutarlo |

El texto de un alias de sufijo puede contener opciones (`alias -s txt='cat -n'` numera las líneas). `alias` sin opción **no** lista los alias de sufijo: hace falta `alias -s` (o `alias -sL` para la forma copiable: `alias -s txt=cat`). Para suprimir uno: `unalias -s txt`.

### Listar los alias: todas las opciones

| Comando | Lo que lista |
|---|---|
| `alias` | Los alias normales **y** los globales (sin distinguirlos), no los de sufijo |
| `alias -r` | Los alias **normales** solamente (*regular*), los de la primera palabra |
| `alias -g` | Solo los alias globales |
| `alias -s` | Solo los alias de sufijo |
| `alias -L` | Los alias normales y globales, en forma de comandos completos (`alias -g G='...'`) que se pueden copiar en un archivo |
| `alias -gL`, `alias -sL` | Misma forma, limitada a los alias globales o de sufijo |
| `alias -m 'patrón'` | Los alias cuyo **nombre** coincide con el patrón (véase más abajo) |

Un **patrón** (*pattern*) es un modelo de texto con comodines: `N*` designa todos los nombres que empiezan por `N`. Hay que protegerlo con comillas simples; si no, Zsh lo sustituye por nombres de archivo antes de que `alias` lo vea, y responde `zsh: no matches found: N*` si ningún archivo coincide. Con los alias creados arriba:

```zsh
# alias cuyo nombre empieza por N: NE
alias -m 'N*'
# alias cuyo nombre termina en E: NE también (cuentan las mayúsculas)
alias -m '*E'
# alias cuyo nombre empieza por which: which-command
alias -m 'which*'
# unalias también acepta -m: elimina todos los alias cuyo nombre empieza por k
alias k1=echo k2=echo
unalias -m 'k*'
# k1 y k2 ya no existen: alias no muestra nada
alias k1
```

```text
NE='2>/dev/null'
NE='2>/dev/null'
which-command=whence
```

## Nivel 5: eludir, convivir y organizar

### ¿Quién responde cuando se escribe un nombre?

El mismo nombre puede designar un alias, una función, un comando interno (*builtin*: un comando integrado en el propio Zsh, como `cd`) y un programa (un archivo ejecutable, como `/usr/bin/date`). El orden de prioridad es el de Bash (véase [quién responde cuando se escribe un nombre](/?c=langages&s=bash&p=alias-avances#quien-responde-cuando-se-escribe-un-nombre)): **alias, luego función, luego comando interno, luego programa**. Las palabras reservadas (`if`, `for`...) forman una categoría aparte: `whence -w if` responde `if: reserved`.

Zsh ofrece **tres comandos** para mostrar las respuestas, además del `type -a` de Bash: `whence` (del inglés « ¿de dónde viene esta palabra? »), `which` y `where`. Con `date`, un programa al que se añade luego una función y después un alias del mismo nombre:

```zsh
# el nombre date no es, por ahora, más que un programa
type -a date
# una función llamada date
date() { echo "date (función)"; }
# un alias llamado date
alias date='echo "date (alias)"'
# type -a: todas las respuestas, de la más prioritaria a la menos prioritaria
type -a date
# whence -a: las mismas respuestas, en versión corta
whence -a date
# where: las mismas respuestas, con el código completo de la función
where date
# which: solo la primera respuesta, la que se ejecuta
which date
# whence -w: una sola palabra, la naturaleza de la primera respuesta
whence -w date
# ¿quién responde cuando se escribe el nombre?
date
```

```text
date is /usr/bin/date
date is /bin/date
date is an alias for echo "date (alias)"
date is a shell function
date is /usr/bin/date
date is /bin/date
echo "date (alias)"
date
/usr/bin/date
/bin/date
date: aliased to echo "date (alias)"
date () {
	echo "date (función)"
}
/usr/bin/date
/bin/date
date: aliased to echo "date (alias)"
date: alias
date (alias)
```

El programa aparece dos veces (`/usr/bin/date` y `/bin/date`) porque, en este sistema, `/bin` es un **enlace** (una entrada de carpeta que apunta a otra) hacia `/usr/bin`: es el mismo archivo, encontrado por dos entradas de `$PATH` (la lista de carpetas donde el shell busca los programas, véase [`$PATH`](/?c=langages&s=bash&p=variables-denvironnement#path-como-encuentra-el-shell-un-comando)). Lo que escribe cada comando:

| Comando | Alias | Función | Programa |
|---|---|---|---|
| `type -a nombre` | `nombre is an alias for texto` | `nombre is a shell function` | `nombre is /ruta` |
| `whence -a nombre` | El texto del alias | El nombre solo | La ruta |
| `where nombre` | `nombre: aliased to texto` | El código completo de la función | La ruta |
| `which nombre` | `nombre: aliased to texto` | El código completo de la función | La ruta |
| `whence -w nombre` | `nombre: alias` | `nombre: function` | `nombre: command` |

`which` solo muestra la **primera** respuesta (la única que se ejecuta), `where` y `whence -a` las muestran todas. `whence -w` da una palabra por nombre: `alias`, `function`, `builtin`, `command`, `reserved`, o `none` si el nombre es desconocido (con el código de salida 1). Es el equivalente del `type -t` de Bash.

### Eludir un alias o una función

```zsh
# el nombre date designa siempre el alias y la función creados antes
# \date: la barra invertida impide la expansión del alias, responde la función
\date
# las comillas tienen el mismo efecto que la barra invertida
"date"
# command date: ignora el alias Y la función, lanza el comando interno o el programa
command date +%Y
# builtin date: busca solo un comando interno; date no es uno
builtin date
# builtin echo: echo existe como comando interno, responde
builtin echo hola
# unalias date: elimina el alias; la función vuelve a responder
unalias date
date
# unfunction date: elimina la función; el programa vuelve a responder
unfunction date
date +%Y
```

```text
date (función)
date (función)
2026
zsh: no such builtin: date
hola
date (función)
2026
```

El número `2026` es el año en curso en el momento de la prueba. `+%Y` es el argumento que pide a `date` mostrar solo el año.

| Quiero | Escritura | Lo que se ignora |
|---|---|---|
| Pasar por alto el alias | `\nombre`, `"nombre"` o `'nombre'` | Solo el alias: responde una **función** del mismo nombre |
| Pasar por alto alias **y** función | `command nombre` | Alias y funciones: responde el comando interno o el programa |
| Forzar un comando interno | `builtin nombre` | Alias, funciones y programas (`no such builtin` si `nombre` no es uno) |
| Eliminar el alias | `unalias nombre` | Nada: desaparece hasta la próxima sesión |
| Eliminar la función | `unfunction nombre` o `unset -f nombre` | Nada: desaparece hasta la próxima sesión |
| Eliminar por la tabla de hash | `unhash -a nombre` (alias), `unhash -f nombre` (función), `unhash -s ext` (alias de sufijo) | Nada: mismos efectos que los comandos de arriba |

`unhash` retira un nombre de una de las tablas de búsqueda internas de Zsh (las « tablas de hash », donde guarda sus alias, sus funciones y sus alias de sufijo); sin opción, olvida la ruta memorizada de un programa. Con `-a`, `-f` o `-s`, hace pues el mismo trabajo que `unalias`, `unfunction` y `unalias -s`.

### Lo que no cambia: el alias que se llama a sí mismo, el espacio final, `xargs`

Tres comportamientos de Bash son idénticos en Zsh. Un alias puede contener el nombre que sustituye sin bucle infinito; si el texto de un alias termina con un espacio, la palabra siguiente también se considera alias; `xargs` (un programa que lee palabras y las añade como argumentos de un comando) no conoce los alias del shell. Las explicaciones están en [el nivel 4 del capítulo Bash](/?c=langages&s=bash&p=alias-avances#nivel-4-eludir-y-convivir); aquí están los resultados observados en Zsh.

```zsh
# el alias ls añade --color=auto (colores si la salida es una terminal) al comando real
alias ls='ls --color=auto'
# type muestra qué es ls: la palabra ls del texto no se expande una segunda vez
type ls
# dos alias que se remiten el uno al otro: a hacia b, b hacia a
alias a='b'
alias b='a'
# a se convierte en b, b se convierte en a, y a no se expande una segunda vez: sin bucle
a
# escribir designa echo (sin espacio final), mundo es un texto de sustitución
alias escribir='echo'
alias mundo='todo el mundo'
# la palabra mundo no es una primera palabra: aparece tal cual
escribir mundo
# se redefine escribir con un espacio AL FINAL del texto
alias escribir='echo '
# la palabra que sigue a escribir ahora se considera alias: mundo se expande
escribir mundo
# el alias saludar existe para la terminal
alias saludar='echo hola'
# xargs busca un PROGRAMA llamado saludar: no conoce los alias de Zsh
echo tú | xargs saludar
# se retiran los alias del ejemplo
unalias ls a b escribir mundo saludar
```

```text
ls is an alias for ls --color=auto
zsh: command not found: a
mundo
todo el mundo
xargs: saludar: No such file or directory
```

### Las opciones de Zsh relacionadas con los alias

Tres opciones de Zsh conciernen a los alias (véase [el sistema de opciones](/?c=langages&s=zsh&p=options-du-shell) para `setopt` y `unsetopt`, y [la lista oficial de opciones](https://zsh.sourceforge.io/Doc/Release/Options.html) para su descripción completa):

| Opción | Valor por defecto | Efecto |
|---|---|---|
| `aliases` | Activa | Si se desactiva (`unsetopt aliases`), ningún alias se expande; el comando `alias` sigue creándolos. Véase el [nivel 3](#nivel-3-los-alias-en-un-script) |
| `alias_func_def` | Desactivada | Si está activa, una declaración `nombre() { ... }` se admite aunque `nombre` sea un alias, **con un efecto sorprendente** (véase más abajo) |
| `complete_aliases` | Desactivada | Si está activa, la completación (la propuesta del final de una palabra al pulsar la tecla Tab, véase [la completación avanzada](/?c=langages&s=zsh&p=completion-avancee)) trata el alias como un comando de pleno derecho, en lugar de sustituirlo antes por su texto |

La opción `alias_func_def` merece una prueba, porque su resultado es contrario a la intuición: en lugar de definir una función `ll`, define una función con el nombre del **texto** del alias.

```zsh
# ll es un alias del programa ls
alias ll=ls
# activa el permiso para declarar una función con un nombre de alias
setopt alias_func_def
# la declaración se acepta... pero ll se sustituye primero por ls
ll() { echo "soy ll"; }
# ll sigue siendo un alias
type -a ll
# ¡es el nombre ls el que se ha convertido en una función!
type -a ls
# la llamada a ll lanza el alias, es decir, la función ls
ll
# se pone todo en orden: opción desactivada, función y alias eliminados
unsetopt alias_func_def
unfunction ls
unalias ll
```

```text
ll is an alias for ls
ls is a shell function
ls is /usr/bin/ls
ls is /bin/ls
soy ll
```

Con un alias de varias palabras como `grep -r "$1" .`, la declaración define varias funciones a la vez (prueba: `grep` y `.`). **No hay que activar `alias_func_def`**: el error por defecto es la protección.

### Organizar sus atajos

Cuando se tienen algunos atajos, `~/.zshrc` se vuelve ilegible. Se guardan en un archivo aparte, `~/.zsh_aliases`, que `~/.zshrc` carga, o en una carpeta `~/.zshrc.d` cuyos archivos se cargan uno a uno. Estos dos nombres son **convenciones**: Zsh no los lee por sí mismo; es `~/.zshrc` el que debe contener las líneas siguientes. El test `[[ -f archivo ]]` es verdadero si ese archivo existe y es un archivo ordinario (véase [las condiciones](/?c=langages&s=bash&p=conditions)). El patrón `*.zsh` designa todos los archivos cuyo nombre termina en `.zsh`, y el **calificador** `(N)` colocado después dice « si ningún archivo coincide, no producir nada en lugar de señalar un error » (véase [los calificadores de glob](/?c=langages&s=zsh&p=expansion-et-jokers-avances#los-calificadores-de-glob-filtrar-por-tipo-o-metadato)). `for ... do ... done` repite los comandos para cada archivo encontrado (véase [los bucles](/?c=langages&s=bash&p=boucles)).

```zsh
# --- que añadir al final de ~/.zshrc ---
# si el archivo ~/.zsh_aliases existe, lo cargamos
if [[ -f ~/.zsh_aliases ]]; then
    # source lee el archivo en el shell actual
    source ~/.zsh_aliases
# fi termina el if
fi
# para cada archivo .zsh de ~/.zshrc.d (ninguno: (N) evita el error)
for archivo in ~/.zshrc.d/*.zsh(N); do
    # cargamos este archivo
    source "$archivo"
# done termina el bucle
done
```

```zsh
# --- contenido de ~/.zsh_aliases ---
# atajos simples: un nombre corto para un comando
alias ll='ls -la'
# ls -lt: detalle de cada archivo, del más reciente al más antiguo
alias lt='ls -lt'
# alias global (nivel 4): descarta los mensajes de error
alias -g NE='2>/dev/null'
# alias de sufijo (nivel 4): un archivo .txt escrito solo lo muestra cat
alias -s txt=cat
# busca la palabra dada como primer argumento en la carpeta actual
busca() {
    grep -rn "$1" .
}
```

Los alias globales y de sufijo se guardan en el mismo archivo que los demás: `alias -L` da la forma copiable. Con este archivo y dos archivos en `~/.zshrc.d` (`git.zsh`, que contiene `alias gs='git status'`, del programa [Git](/?c=qualite-performance-et-outils&s=git&p=concepts-de-base), y `docker.zsh`, que contiene `alias dc='docker compose'`, de la herramienta [Docker Compose](/?c=infrastructure-devops&s=docker&p=docker-compose)), se observa, al lanzar un Zsh interactivo que lee un `~/.zshrc` así:

| Caso observado | Resultado |
|---|---|
| Los archivos existen | `alias` lista `ll`, `lt`, `gs`, `dc` y `NE`; `alias -s` lista `txt=cat`; `type busca` responde que es una función |
| `~/.zsh_aliases` no existe, con la prueba `[[ -f ... ]]` | La terminal arranca sin ningún mensaje |
| `~/.zsh_aliases` no existe, con solo `source ~/.zsh_aliases` | Un mensaje `no such file or directory` en cada arranque (el arranque continúa) |
| `~/.zshrc.d` vacía, con `(N)` | La terminal arranca sin ningún mensaje |
| `~/.zshrc.d` vacía, sin `(N)` | Un mensaje `no matches found` seguido del patrón, en cada arranque |
| Una línea añadida a los archivos después del arranque | Desconocida mientras no se ejecute `source ~/.zsh_aliases` |

### Diagnosticar: `zsh -f`

Cuando un comando se comporta de manera extraña, la causa es a veces uno de sus alias o de sus funciones. Las opciones de la línea de comandos de Zsh (descritas en [la sección « Invocation » del manual](https://zsh.sourceforge.io/Doc/Release/Invocation.html)) permiten descartarlos:

| Comando | Efecto |
|---|---|
| `zsh -f` | Arranca un nuevo Zsh que **no lee** sus archivos de inicio personales (`~/.zshenv`, `~/.zshrc`...): ninguno de sus atajos existe en él |
| `zsh -d` | No lee los archivos de inicio **del sistema** (los de `/etc/zsh`, que también pueden definir o quitar alias) |
| `zsh -d -f` | Ningún archivo de inicio en absoluto |
| `zsh -f -c 'texto'` | Lanza este texto en un Zsh sin configuración, y luego se detiene (`-c`: ejecutar este texto) |

```zsh
# en la sesión normal, ll existe (creado en el nivel 1)
alias ll='ls -la'
# muestra la definición de ll
alias ll
# en un Zsh sin configuración, ll no existe: no se muestra nada, y el código vale 1
zsh -f -c 'alias ll; echo "code=$?"'
```

```text
ll='ls -la'
code=1
```

Para trabajar en un Zsh sin configuración, se escribe `zsh -f` solo: el prompt (el texto que precede a lo que se escribe) cambia de aspecto, `alias` solo lista los dos alias de partida, y `exit` cierra ese Zsh y devuelve a la sesión anterior, con sus atajos. Si el comportamiento vuelve a ser normal en `zsh -f`, el culpable está en sus atajos: se retiran uno a uno para averiguar cuál es.

### Los alias de Oh My Zsh

[Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh) es un conjunto de ajustes y extensiones (*plugins*) para Zsh. Sus plugins definen cientos de alias, por ejemplo los del plugin `git`. Se cargan al arrancar y `alias` los lista como los suyos, lo que permite encontrarlos y verificarlos:

```zsh
# definición de un alias proporcionado por el plugin git
alias gst
# los alias cuyo nombre empieza por gpu: aquí uno solo, git push upstream
alias -m 'gpu*'
# Oh My Zsh define él mismo alias globales: los listamos (alias -g)
alias -g
```

```text
gst='git status'
gpu='git push upstream'
...=../..
....=../../..
.....=../../../..
......=../../../../..
```

Los dos primeros resultados dependen del plugin instalado; los alias globales, de la versión de Oh My Zsh. Conviene tomar tres precauciones:

| Precaución | Por qué |
|---|---|
| `alias nombre` antes de crear un atajo | Oh My Zsh ya define nombres comunes: `ll` vale `ls -lh`, `l` vale `ls -lah` |
| Añadir sus alias **después** de la línea `source $ZSH/oh-my-zsh.sh` de `~/.zshrc` | La última definición de un nombre prevalece: después de `source`, `alias ll='ls -la'` sustituye al de Oh My Zsh |
| O depositarlos en `~/.oh-my-zsh/custom/` | Todo archivo `.zsh` de esta carpeta se carga automáticamente y sobrevive a las actualizaciones (véase el capítulo [Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh)) |

## Síntesis de los niveles

| Nivel | Necesidad | Herramienta | Límite |
|---|---|---|---|
| 1 | Otro nombre para un comando | `alias ll='ls -la'`, `alias -L`, `unalias`, `~/.zshrc` | Un texto pegado delante de los argumentos; sin `$1`; se pierde al cerrar la terminal sin `~/.zshrc` |
| 2 | Un argumento colocado en medio, una prueba sobre el número de argumentos | Función con `"$1"`, `"$@"`, `"$#"` | `nombre() {` falla si un alias lleva ese nombre; `function nombre {` tiene éxito pero el alias sigue prevaleciendo |
| 3 | Un atajo en un script | La opción `aliases` (activa), o mejor, una función | Un alias solo existe a partir de la línea siguiente; los alias de `~/.zshrc` no están en el script, los de `~/.zshenv` sí |
| 4 | Actuar en cualquier parte de la línea, o según la extensión | `alias -g`, `alias -s` | Un alias global se expande incluso en un texto; un alias de sufijo se aplica también a un archivo que no existe |
| 5 | Convivir, ordenar, diagnosticar | `\nombre`, `command`, `whence -a`, `~/.zsh_aliases`, `zsh -f` | `\nombre` deja pasar una función; `alias_func_def` renombra el nombre equivocado |

## Las trampas

| Trampa | Por qué es un problema | Qué hacer |
|---|---|---|
| `alias busca='grep -r "$1" .'` | `$1` no existe en un alias: vale vacío, y la palabra escrita se pega al final | Una función con `"$1"` |
| `busca() { ... }` cuando existe un alias `busca` | Error `defining function based on alias` | `unalias nombre` antes de la función |
| `function busca { ... }` cuando existe un alias `busca` | Ningún error, pero el alias sigue prevaleciendo: la función nunca se llama | `unalias nombre` antes de la función, y `type -a nombre` para verificar |
| `$@` sin comillas | Los argumentos vacíos desaparecen (y Bash también trocea los espacios y expande los comodines) | `"$@"` |
| Creer que un script ignora los alias | En Zsh, un script expande los alias que define | Escribir el comando completo o una función |
| Alias definido y usado en la misma línea o en el mismo bloque `{ }` | El alias solo existe a partir de la línea leída después | Definir en una línea, usar más adelante, o usar una función |
| Función leída antes del alias que usa | La palabra sigue siendo corriente: la expansión ocurre al leer el cuerpo | Preferir el comando completo en una función |
| Un alias en `~/.zshenv` | Este archivo lo leen todos los scripts: el comportamiento cambia en silencio | Reservar `~/.zshenv` para las variables de entorno |
| Un alias global con nombre corriente (`echo G`) | El texto se sustituye por un tubo seguido de `grep` | Nombres cortos en mayúsculas, raros en el texto |
| `unalias G`, `alias G`, `unhash -a G` sin comillas | El nombre de un alias global se expande antes de ser leído | `unalias 'G'` o `unalias \G` |
| Un alias global en primera palabra, o en un script compartido | Error de análisis, o línea ilegible para los demás | Reservar los alias globales para escribir a mano |
| Un alias de sufijo que cree que el archivo existe | Se aplica según el nombre solamente, y pasa antes que un programa del mismo nombre | No nombrar un programa con una extensión que hemos vinculado |
| Un nombre de archivo entre comillas, o una extensión en mayúsculas | El alias de sufijo se ignora | `mi\ archivo.txt` y la capitalización correcta |
| `setopt alias_func_def` | Una declaración `ll() {...}` define una función con el nombre del texto del alias | Dejar la opción desactivada |
| `\nombre` para eludir | Solo elude el alias: una función del mismo nombre responde | `command nombre` |
| Un alias en un programa lanzado por `xargs` | `xargs` lanza programas, no alias | Un script o el propio programa |
| `source ~/.zsh_aliases` sin prueba `[[ -f ... ]]` | Un mensaje de error en cada arranque si el archivo falta | `if [[ -f ~/.zsh_aliases ]]; then ... fi` |
| `~/.zshrc.d/*.zsh` sin `(N)` | `no matches found` en cada arranque si la carpeta está vacía | `~/.zshrc.d/*.zsh(N)` |
| Un alias que reutiliza un nombre de Oh My Zsh | El sentido anterior desaparece, o el suyo queda tapado según el orden de carga | `alias nombre` antes de elegir, y sus líneas después de `source $ZSH/oh-my-zsh.sh` |
| Modificar `~/.zsh_aliases` sin recargar | La sesión en curso conserva el estado anterior | `source ~/.zsh_aliases` |

## Buenas prácticas

| Buena práctica | Por qué |
|---|---|
| Un alias para un simple renombrado o unas opciones fijas, una función en cuanto un argumento se coloca en otro sitio que al final | Cada herramienta se queda en su ámbito |
| Comillas simples alrededor del texto de un alias | Las variables se leen en el momento de usarlo |
| `"$@"` con comillas, `"$#"` para contar | El script también funciona en Bash, y los argumentos vacíos se conservan |
| `alias -L` para guardar sus alias | La forma copiable, con los globales y de sufijo incluidos |
| Escribir el comando completo o una función en un script | El script funciona en todas las máquinas, con o sin sus alias |
| `whence -a nombre` o `type -a nombre` antes de crear un atajo | Ninguna tapadera involuntaria, incluso por un alias de Oh My Zsh |
| `command nombre` para llegar al comando real | Pasa por encima de alias y funciones |
| Alias globales cortos, en mayúsculas, solo para escribir a mano | Siguen siendo reconocibles, y un script compartido no depende de ellos |
| Guardar todos los atajos en `~/.zsh_aliases` o `~/.zshrc.d`, cargados con `[[ -f ... ]]` o `(N)` | Un `~/.zshrc` corto, atajos fáciles de guardar |
| `zsh -f` cuando un comportamiento parezca extraño | Descartar los atajos como causa |
| Mantener pocos atajos, con nombres sin ambigüedad | Se recuerdan, y se evita tapar un comando útil |

## Lo que hay que recordar

| | |
|---|---|
| **Para recordar** | Un **alias** es un **texto** que sustituye a la primera palabra escrita, **antes** del análisis de la línea, como en Bash: `alias ll='ls -la'` crea, `alias` lista (sin la palabra `alias` delante de cada línea; `alias -L` da la forma copiable), `unalias ll` elimina, y `~/.zshrc` lo hace permanente. Un alias no tiene `$1`: una **función** recibe `$1`, `"$@"` y `"$#"`. En Zsh, `$@` sin comillas no se trocea en los espacios (el argumento vacío desaparece igualmente), y la declaración `nombre() {` falla si un alias lleva ese nombre, mientras que `function nombre {` tiene éxito sin que la función se llame. A diferencia de Bash, un script **expande los alias** que define (opción `aliases` activa), pero no los de `~/.zshrc` (los de `~/.zshenv` sí); la trampa de la línea siguiente también existe. **Alias globales** (`alias -g NE='2>/dev/null'`): se expanden en cualquier parte de la línea, y hay que escribirlos entre comillas para `unalias`. **Alias de sufijo** (`alias -s txt=cat`): `archivo.txt` escrito como primera palabra lanza `cat archivo.txt`, según el nombre solamente, con la capitalización. Orden de respuesta: alias, función, comando interno, programa; `type -a nombre`, `whence -a nombre` y `where nombre` los enumeran. `\nombre` salta solo el alias, `command nombre` salta alias y función. Atajos en `~/.zsh_aliases` o `~/.zshrc.d`, y `zsh -f` para diagnosticar. |
| **Trampas a evitar** | `$1` en un alias; función declarada sin haber eliminado el alias del mismo nombre; `function nombre {` que deja prevalecer el alias; creer que un script ignora los alias; alias definido y usado en la misma línea o en el mismo bloque; alias en `~/.zshenv`; alias global con nombre corriente o en primera palabra; `unalias G` sin comillas; alias de sufijo aplicado a un nombre que no existe o a un programa; `setopt alias_func_def`; creer que `\nombre` salta una función; alias detrás de `xargs`; `source` o `*.zsh` sin prueba ni `(N)`; nombre de alias que tapa un comando o un alias de Oh My Zsh. |
| **Buenas prácticas** | Alias para renombrar, función en cuanto un argumento va en otro sitio que al final; comillas simples; `"$@"` y `"$#"`; comando completo o función en un script; `whence -a nombre` antes de nombrar; `command nombre` para llegar al comando real; alias globales cortos y reservados para escribir a mano; atajos en `~/.zsh_aliases` o `~/.zshrc.d`; `zsh -f` para descartar sus atajos en un diagnóstico. |
