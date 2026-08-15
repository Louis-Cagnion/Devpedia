---
order: 2
---

# Escribir y ejecutar un script Bash

Un script Bash es un simple archivo de texto que contiene una secuencia de comandos, ejecutados en orden como si se hubieran escrito uno a uno en la terminal.

> **Unix**, ¿qué es? En origen, un sistema operativo creado en los años 1970, cuyos principios (todo es un archivo, pequeñas herramientas especializadas que se combinan entre sí vía pipes, un shell en línea de comandos para pilotar todo) fueron luego copiados o reimplementados por numerosos sistemas: Linux y macOS son hoy sus herederos más comunes. Cuando un capítulo dice "en Unix" o "un sistema Unix", habla de esta familia de sistemas y sus convenciones comunes, por oposición a Windows por ejemplo.

## El shebang

La primera línea de un script indica al sistema qué intérprete usar para ejecutarlo:

```bash
#!/bin/bash

echo "Hola"
```

`#!/bin/bash` (el "shebang") no es un comentario ordinario a pesar del `#`: el sistema operativo lo lee específicamente para saber qué programa lanzar para interpretar el resto del archivo (ver [cómo lo detecta concretamente el kernel](/?c=shells&s=bash&p=architecture-dun-shell) para lo que ocurre a nivel de sistema).

> **Trampa:** el shebang debe ser los primerísimos caracteres del archivo, sin excepción: ni siquiera una línea vacía antes. El kernel solo comprueba los dos primeros bytes (`#!`); una línea vacía encima, y ya no los reconoce en absoluto como un shebang.
>
> **Buena práctica:** hacer que un script ejecutable empiece siempre directamente con `#!...`, nunca con un comentario o una línea vacía encima.

## `sh` vs `bash`

**POSIX** (*Portable Operating System Interface*) es una norma que define, entre otras cosas, un comportamiento estándar mínimo para un shell: un conjunto de funcionalidades que todo shell "compatible POSIX" debe implementar, para que un mismo script se ejecute de forma idéntica en cualquier sistema Unix, sea cual sea el shell realmente instalado detrás de `/bin/sh`.

`sh` designa por tanto menos un programa preciso que una **norma**: en la mayoría de los sistemas, `/bin/sh` es en realidad un enlace a otro shell (a menudo `dash` en Debian/Ubuntu, a veces `bash` mismo en macOS o en modo "compatibilidad POSIX") que se comporta de forma más restringida cuando se invoca bajo ese nombre. `bash` (*Bourne Again SHell*) es un shell concreto, que respeta POSIX pero le añade numerosas extensiones propias (`[[ ]]`, los arrays, `{1..5}`, `local`...) que no funcionan si el script se ejecuta con un `sh` estrictamente POSIX.

```bash
#!/bin/bash
echo "Compatible solo con Bash"
```

```bash
#!/bin/sh
echo "Portable a cualquier shell POSIX (dash, bash en modo sh, etc.)"
```

En la práctica: usar `#!/bin/bash` (y ejecutarlo con `bash`) en cuanto el script use una extensión Bash, que es el caso de la mayoría de los scripts de este sitio; reservar `#!/bin/sh` a scripts voluntariamente limitados a las funcionalidades POSIX básicas, por ejemplo para un script de sistema que deba funcionar incluso en una máquina donde `bash` no esté instalado.

> **Trampa:** escribir `#!/bin/sh` y luego usar una extensión propia de Bash (arrays, `[[ ]]`, `local`...). El script funciona igualmente en pruebas si `/bin/sh` apunta a `bash` en la máquina de desarrollo, y falla silenciosa o ruidosamente en otro sistema donde `/bin/sh` es un shell más estricto (`dash`, a menudo).
>
> **Buena práctica:** hacer que el shebang corresponda a lo que el script usa realmente: `#!/bin/bash` en cuanto aparece una sola extensión Bash, en lugar de descubrirlo en producción.

## Hacer que un script sea ejecutable

```bash
chmod +x script.sh  # añade el permiso de ejecución (ver Permisos y manipulación de archivos)
./script.sh         # ejecuta el script (el "./" es necesario si la carpeta actual no está en $PATH)
```

Alternativa sin necesidad de `chmod +x`: lanzar explícitamente el intérprete sobre el archivo:

```bash
bash script.sh
```

> **Trampa:** escribir `script.sh` solo, sin `./` delante, incluso una vez hecho `chmod +x`. Bash nunca busca en la carpeta actual por defecto (cf. [capítulo sobre comandos básicos](/?c=shells&s=bash&p=commandes-de-base)): sin prefijo de ruta, solo encuentra el script si su carpeta forma parte de `$PATH`, lo que casi nunca es el caso para una carpeta de proyecto.
>
> **Buena práctica:** prefijar siempre la ejecución de un script local con `./`, en lugar de buscar por qué "el comando no existe".

## Los argumentos de un script

```bash
#!/bin/bash
echo "Script: $0"
echo "Primer argumento: $1"
echo "Todos los argumentos: $@"
echo "Número de argumentos: $#"
```

```bash
./script.sh alicia roberto
# Script: ./script.sh
# Primer argumento: alicia
# Todos los argumentos: alicia roberto
# Número de argumentos: 2
```

`$0`, `$1`, `$@` y `$#` forman parte de un conjunto más amplio de **variables especiales**, todas leídas automáticamente por Bash sin ser nunca asignadas explícitamente:

| Variable | Contenido |
|---|---|
| `$0` | Nombre del script en ejecución |
| `$1`, `$2`, ... | Argumentos posicionales pasados al script/a la función |
| `$@` | Todos los argumentos, cada uno como una palabra separada |
| `$*` | Todos los argumentos, reunidos en **una sola** cadena |
| `$#` | Número de argumentos recibidos |
| `$?` | Código de salida del último comando ejecutado (`0` = éxito) |
| `$$` | PID del script en ejecución |

> **Trampa frecuente: `$@` y `$*` se comportan diferente una vez entre comillas.** Sin comillas, ambos se comportan igual. Entre comillas (`"$@"` vs `"$*"`), divergen: `"$@"` expande cada argumento como una palabra **separada** (`"alicia" "roberto"`), mientras que `"$*"` los fusiona en **una sola** palabra (`"alicia roberto"`). Para transmitir los argumentos tal cual a otro comando (ej. `comando "$@"`), `"$@"` es casi siempre la opción correcta (ver [el orden preciso de las expansiones](/?c=shells&s=bash&p=architecture-dun-shell) para lo que explica esta diferencia: división en palabras, comillas).

`$?` y `$$` se detallan más adelante en este capítulo y en el de gestión de procesos; ver también el capítulo sobre variables para su uso dentro de una función.

## Códigos de salida (`exit`)

Cada comando, y por tanto cada script, termina con un **código de salida**: `0` significa éxito, cualquier otro valor (de 1 a 255) significa un fallo, cuyo sentido preciso depende del programa:

```bash
#!/bin/bash

if [ ! -f "config.txt" ]; then
    echo "Error: falta el archivo de config" >&2   # >&2: envía este mensaje a la salida de error (stderr)
    exit 1
fi

echo "Todo listo"
exit 0
```

> `>&2` redirige a la salida de error (*stderr*) en lugar de la salida estándar (*stdout*): ver [Redirecciones y pipes](/?c=shells&s=bash&p=redirections-et-pipes) para saber qué son estos flujos y cómo redirigirlos en detalle.

El script (o comando) que llama puede comprobar este código vía `$?`:

```bash
./script.sh
if [ $? -eq 0 ]; then
    echo "El script tuvo éxito"
fi

# atajo equivalente, más idiomático:
./script.sh && echo "El script tuvo éxito"
./script.sh || echo "El script falló"
```

`&&` solo ejecuta el siguiente comando si el anterior tuvo éxito (código `0`); `||` solo si falló.

> **Trampa:** un script sin `exit` explícito termina con el código de salida de su **último comando**: no necesariamente `0`, y no necesariamente lo que se quería. Un script que tiene éxito "globalmente" pero cuya última línea es un `echo` (que casi siempre tiene éxito) enmascara así un fallo ocurrido antes.
>
> **Buena práctica:** terminar un script con un `exit` explícito (`exit 0` en caso de éxito, un código diferente si no) en lugar de dejar que el código de salida dependa implícitamente del último comando.

## Detener un script ante el primer error: `set -e`

Por defecto, Bash sigue ejecutando las líneas siguientes incluso si un comando falla: a menudo indeseable en un script de automatización:

```bash
#!/bin/bash
set -e   # detiene inmediatamente el script si un comando falla (código de salida distinto de cero)

cd /carpeta/inexistente   # si esta carpeta no existe, el script se detiene aquí
echo "Esta línea nunca se ejecuta si cd falló"
```

Otras opciones refuerzan la robustez de un script, a menudo combinadas:

```bash
#!/bin/bash
set -euo pipefail
# -e: se detiene ante el primer error
# -u: error si se usa una variable no definida
# -o pipefail: una tubería falla si CUALQUIERA de sus comandos falla (no solo el último)
```

Un caso concreto donde `set -e` no se dispara, a pesar de un fallo real:

```bash
set -e
comando_que_falla | grep "patron"   # falla, pero set -e NO se detiene aquí sin pipefail: solo cuenta grep
```

> **Trampa:** `set -e` no cubre todo lo que se podría esperar. Un comando que falla **no detiene nada** si está probado por un `if`, combinado con `&&`/`||`, o si no es el último de un pipeline (sin `pipefail`, como en el ejemplo de arriba): en estos tres casos, Bash considera el fallo "esperado y ya gestionado", así que `set -e` no se dispara.
>
> **Buena práctica:** nunca contar solo con `set -e` para un comando en un pipeline, un `if`, o antes de `&&`/`||`: comprobar `$?` explícitamente en esos casos precisos si el fallo debe realmente interrumpir el script.

Ver también el capítulo sobre gestión de procesos para lo que ocurre tras lanzar un script en segundo plano.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El shebang indica al sistema qué intérprete ejecuta el script. `chmod +x` + `./script.sh` o `bash script.sh` lo lanza. `$1`, `$@`, `$#`... dan acceso a sus argumentos. Cada script termina con un código de salida (`0` = éxito), consultable vía `$?`. |
| **Herramientas utilizables** | `set -euo pipefail` al principio del script para detenerse ante el primer error en lugar de continuar sobre un estado incoherente. |
| **Trampas a evitar** | Confundir `$@` y `$*` una vez entre comillas (ver más arriba). Escribir `#!/bin/sh` y luego usar una extensión Bash (arrays, `[[ ]]`...): el script falla en cualquier sistema donde `/bin/sh` no sea `bash`. |
| **Buenas prácticas** | Comprobar siempre `$?` (o usar `&&`/`\|\|`) tras un comando cuyo fallo deba cambiar el comportamiento del script, en lugar de suponer que tuvo éxito. |
