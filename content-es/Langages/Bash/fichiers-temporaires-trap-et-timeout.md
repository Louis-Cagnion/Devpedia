---
order: 15
---

# Un script que limpia y se detiene como es debido: `mktemp`, `trap` y `timeout`

Un script corto se limita a encadenar comandos. Un script que crea archivos, lanza comandos largos y puede ser interrumpido debe además **no dejar nada tras de sí** y **no esperar nunca indefinidamente**. Este capítulo sigue un caso real: el script que lanza el solucionador de Skyscraper sobre diez cuadrículas, muestra sus tiempos y puede detenerse desde el teclado.

| Problema | Qué ocurre | Herramienta |
|---|---|---|
| Un archivo temporal queda tras un error o un Ctrl-C | `/tmp` se llena, quedan datos por ahí | `mktemp` y `trap ... EXIT` |
| El script se interrumpe antes de su limpieza | La limpieza no llega a hacerse | `trap ... INT TERM` |
| Un comando no termina nunca | El script se queda bloqueado | `timeout` |
| Los mensajes de error se mezclan con la salida | Algunas líneas se parten en dos | Separar la salida de error |

## Un archivo temporal seguro: `mktemp`

Un **archivo temporal** solo existe durante una ejecución (aquí, para guardar aparte los mensajes de error de un comando). La tentación es darle un nombre fijo, como `/tmp/errores.$$`, donde `$$` es el número del proceso del script (véase [terminar un proceso](/?c=langages&s=bash&p=gestion-des-processus)). Ese nombre es **predecible**: otro usuario de la máquina puede crear de antemano en ese lugar un enlace hacia un archivo de quien ejecuta el script, que este sobrescribirá sin saberlo ([CWE-377](https://cwe.mitre.org/data/definitions/377.html)).

`mktemp` crea el archivo **él mismo**, con un nombre aleatorio que aún no existe, y deja el acceso solo a su propietario (véase [leer los permisos](/?c=langages&s=bash&p=permissions-et-fichiers#leer-los-permisos-con-ls-l)):

```
$ mktemp
/tmp/tmp.LiSSKlK2Ur
$ ls -l /tmp/tmp.LiSSKlK2Ur
-rw------- 1 alice alice 0 oct.   4 21:29 /tmp/tmp.LiSSKlK2Ur
$ mktemp -d
/tmp/tmp.6jBpvLiBQT
$ ls -ld /tmp/tmp.6jBpvLiBQT
drwx------ 2 alice alice 4096 oct.   4 21:29 /tmp/tmp.6jBpvLiBQT
$ mktemp /tmp/rapport.XXXXXX
/tmp/rapport.yckOz1
```

| Comando | Resultado |
|---|---|
| `mktemp` | Un archivo vacío, `/tmp/tmp.` seguido de diez caracteres aleatorios |
| `mktemp -d` | Una **carpeta** temporal, para guardar varios archivos |
| `mktemp /tmp/rapport.XXXXXX` | Un nombre elegido: las `X` finales se sustituyen por caracteres aleatorios |
| `TMPDIR=/ruta mktemp` | Crea el archivo en esa carpeta en lugar de `/tmp` |

## Borrarlo con seguridad: `trap ... EXIT`

`trap` ejecuta un comando cuando el script recibe una señal (véanse [interceptar una señal](/?c=langages&s=bash&p=gestion-des-processus#interceptar-una-senal-trap) y las [señales Unix](/?c=langages&s=c&p=signaux-unix)). La pseudoseñal `EXIT` no es una señal de verdad: designa **el final del script**, sea cual sea el motivo. El script siguiente (`demo.sh`) lo muestra en varias situaciones (una línea `case` por situación):

```bash
#!/bin/bash
# uso: ./demo.sh [normal|exit3|error|output|timeout|foreground|capture|capturefg]
# Sin argumento: sleep 17. Durante la espera, pulsar Ctrl-C.
tmp=$(mktemp)                       # un archivo temporal, de nombre impredecible
echo "archivo temporal: $tmp"
trap 'rm -f "$tmp"' EXIT            # se borra al salir, sea cual sea el motivo
trap 'exit 130' INT TERM            # una señal se convierte en una salida normal (130 = 128 + 2)
case $1 in
    normal)     ;;                                  # el script termina solo
    exit3)      exit 3 ;;                           # salida voluntaria con un código
    error)      set -e; false; echo "nunca" ;;     # set -e se detiene en el comando que falla
    output)     while :; do echo linea; done ;;     # escribe sin fin (SIGPIPE si el lector se va)
    timeout)    timeout 17 sleep 17 ;;              # sleep va a su propio grupo
    foreground) timeout --foreground 17 sleep 17 ;; # sleep se queda en el grupo del terminal
    capture)    out=$(timeout 17 sleep 17) ;;       # lo mismo dentro de una sustitución
    capturefg)  out=$(timeout --foreground 17 sleep 17) ;;
    *)          sleep 17 ;;
esac
```

Las cinco situaciones de la tabla siguiente se reprodujeron en bash 5.2 y zsh 5.9. Para Ctrl-C se simuló un terminal real y se envió el carácter Ctrl-C como desde el teclado. Cada casilla indica si el archivo temporal queda **borrado** o **permanece**, primero con la línea `trap 'exit 130' INT TERM` retirada («solo EXIT») y luego conservada:

| Final del script | bash, solo EXIT | bash, EXIT + INT/TERM | zsh, solo EXIT | zsh, EXIT + INT/TERM |
|---|---|---|---|---|
| Final normal (`normal`) | borrado | borrado | borrado | borrado |
| `exit 3` | borrado | borrado | borrado | borrado |
| `set -e`, un comando falla (`error`) | borrado | borrado | borrado | borrado |
| SIGPIPE: el lector de la salida se ha ido (`output`, leído por `head -1`) | borrado | borrado | **permanece** | **permanece** |
| Ctrl-C durante `sleep` | borrado | borrado | **permanece** | borrado |

Lo que hay que recordar:

| Constatación | Explicación |
|---|---|
| Los finales «normales» (fin del script, `exit`, [`set -e`](/?c=langages&s=bash&p=scripts-et-shebang#detener-un-script-ante-el-primer-error-set-e)) siempre disparan `EXIT` | Es el caso de uso de la pseudoseñal |
| **bash** ejecuta también `EXIT` cuando una señal mata el script | El archivo se borra incluso sin `trap ... INT TERM` |
| **zsh** no lo hace | Una señal que mata el script se salta la limpieza: `trap 'exit 130' INT TERM` es imprescindible |
| `trap 'exit 130' INT TERM` convierte una señal en una salida normal | `130` sigue la convención 128 + número de la señal (SIGINT vale 2), véase [el código de salida de un proceso muerto por una señal](/?c=langages&s=bash&p=architecture-dun-shell#el-codigo-de-salida-de-un-proceso-matado-por-una-senal) |
| Incluso con esa línea, zsh ignora SIGPIPE | Necesita `trap 'exit 141' PIPE` (13 + 128), verificado; en bash es inútil y hace aparecer un mensaje de error de escritura |

> Para escribir un script que se comporte igual en bash y en zsh, capturar **siempre** `EXIT` e `INT TERM`.

### Las trampas de `trap`

El script `trampas.sh` reproduce tres casos, cada uno en un subshell para que su `trap EXIT` se ejecute antes del recuento:

```bash
#!/bin/bash
# Tres formas de gestionar archivos temporales con trap. Cada caso se ejecuta en un
# subshell ( ... ) para que su trap EXIT se ejecute antes de contar lo que queda.
ensayo=$(mktemp -d)                      # carpeta de ensayo: mktemp crea ahí sus archivos
export TMPDIR=$ensayo
contar() { ls -A "$ensayo" | wc -l; }   # número de archivos y carpetas que quedan
vaciar() { find "$ensayo" -mindepth 1 -delete; }

echo "--- 1. dos trap EXIT: el segundo sustituye al primero"
( a=$(mktemp); trap 'rm -f "$a"' EXIT
  b=$(mktemp); trap 'rm -f "$b"' EXIT )
echo "quedan: $(contar)"; vaciar

echo "--- 2. comillas dobles: \$c se sustituye enseguida, cuando está vacía"
( trap "rm -f $c" EXIT
  c=$(mktemp) )
echo "quedan: $(contar)"; vaciar

echo "--- 3. una carpeta de trabajo, un solo trap"
( work=$(mktemp -d); trap 'rm -rf "$work"' EXIT
  touch "$work/un" "$work/deux" "$work/trois" )
echo "quedan: $(contar)"
rmdir "$ensayo"
```

```
--- 1. dos trap EXIT: el segundo sustituye al primero
quedan: 1
--- 2. comillas dobles: $c se sustituye enseguida, cuando está vacía
quedan: 1
--- 3. una carpeta de trabajo, un solo trap
quedan: 0
```

| Trampa | Qué ocurre | Remedio |
|---|---|---|
| Dos `trap ... EXIT` seguidos | El segundo **sustituye** al primero: el primer archivo permanece (caso 1) | Un solo `trap`, que limpie todo |
| Comillas dobles: `trap "rm -f $c" EXIT` | La variable se sustituye **en el momento del `trap`**, cuando aún está vacía: no se borra nada (caso 2) | Comillas simples: `$c` se lee al salir |
| Varios archivos temporales | Un `trap` por archivo: véase la primera trampa | Una sola **carpeta** de trabajo (`mktemp -d`) y `rm -rf` sobre ella (caso 3) |

## Detener un comando demasiado largo: `timeout`

`timeout DURACIÓN COMANDO` lanza el comando y le envía una señal (SIGTERM por defecto) cuando transcurre la duración:

```
$ timeout 1 sleep 5; echo "código de salida: $?"
código de salida: 124
```

| Código de salida | Significado (verificado) |
|---|---|
| 124 | Se superó el plazo: el comando fue detenido |
| 125 | `timeout` mismo falló (opción desconocida, por ejemplo) |
| 126 | El comando existe pero no puede ejecutarse (`timeout 1 /etc/passwd`) |
| 127 | Comando no encontrado |
| 137 | El comando ignora SIGTERM, `timeout -k 1 2 ...` lo mató con SIGKILL (128 + 9) |
| Otro | El código del propio comando, si terminó a tiempo |

### Por qué `--foreground`: adónde va Ctrl-C

Ctrl-C no se envía a un solo proceso: el terminal lo envía a **todos los procesos del grupo en primer plano** (véase [el control de tareas](/?c=langages&s=bash&p=architecture-dun-shell#el-control-de-tareas-jobs-ctrl-z-fg-bg)). Ahora bien, `timeout`, para poder detener el comando y sus hijos al vencer el plazo, se coloca **en un grupo aparte**. El script `grupos.sh` muestra los números de grupo (PGID):

```bash
#!/bin/bash
# uso: ./grupos.sh [--foreground]
# muestra el grupo de procesos (PGID) del script, de timeout y de sleep
echo "script: PID $$, PGID $(ps -o pgid= -p $$ | tr -d ' ')"
timeout $1 5 sleep 5 &
sleep 0.3
ps -o pid,ppid,pgid,comm --ppid $$ | grep -e PID -e timeout   # hijo del script: timeout
ps -o pid,ppid,pgid,comm --ppid $!                             # hijo de timeout: sleep
wait
```

Sin `--foreground`, y luego con él:

```
script: PID 98450, PGID 98336
    PID    PPID    PGID COMMAND
  98454   98450   98454 timeout
    PID    PPID    PGID COMMAND
  98456   98454   98454 sleep
```

```
script: PID 98461, PGID 98336
    PID    PPID    PGID COMMAND
  98465   98461   98336 timeout
    PID    PPID    PGID COMMAND
  98467   98465   98336 sleep
```

Sin `--foreground`, `timeout` y `sleep` tienen un PGID distinto del del script: **ya no están en primer plano**, así que Ctrl-C no los alcanza. Con `--foreground`, comparten el grupo del script. Los mismos casos en bash y zsh, con Ctrl-C pulsado 0,8 s después del arranque («> 4 s» significa que el script seguía esperando tras 4 s):

| Comando en el script | bash: fin | bash: archivo | zsh: fin | zsh: archivo | `sleep` supervivientes (bash, zsh) |
|---|---|---|---|---|---|
| `sleep 17` | 0,0 s | borrado | 0,0 s | borrado | 0, 0 |
| `timeout 17 sleep 17` | > 4 s | permanece | > 4 s | permanece | 1, 1 |
| `timeout --foreground 17 sleep 17` | 0,0 s | borrado | 0,0 s | borrado | 0, 0 |
| `out=$(timeout 17 sleep 17)` | > 4 s | permanece | 0,1 s | borrado | 1, 1 |
| `out=$(timeout --foreground 17 sleep 17)` | 0,0 s | borrado | 0,0 s | borrado | 0, 0 |

Sin `--foreground`, Ctrl-C **no hace nada**: el script espera a que pasen los 17 segundos (el archivo temporal permanece durante ese tiempo) y por fin se ejecuta su `trap`. Dentro de `$(...)`, zsh sale enseguida pero deja `sleep` corriendo solo hasta el final.

> La contrapartida, indicada por el manual de `timeout`: con `--foreground`, **los hijos del comando no se detienen** cuando vence el plazo, solo el comando. Si este lanza procesos que le sobreviven, hace falta una vigilancia adicional (en el solucionador, sus procesos hijos mueren con su padre gracias a `prctl(PR_SET_PDEATHSIG)`, véanse [los procesos huérfanos](/?c=langages&s=c&p=processus)).

## Capturar la salida sin mezclar los errores: el búfer de 4.096 bytes

El script original lanza el solucionador así: `output=$(timeout --foreground 90 ./solucionador "$clues" 2>"$ERRORS")`. La salida estándar va a una variable, la **salida de error** (véase [redirigir la salida de error](/?c=langages&s=bash&p=redirections-et-pipes#redirigir-la-salida-de-error)) a un archivo temporal, no a la misma variable con `2>&1`. La razón se ve con un pequeño programa en C (`parlanchin.c`, compilado con `gcc -o parlanchin parlanchin.c`) que escribe cien líneas y luego un aviso en la salida de error tras la septuagésima:

```c
#include <stdio.h>

int main(void)
{
    for (int i = 1; i <= 100; i++) {
        printf("linea %03d : 123456789 123456789 123456789 123456789 123456789\n", i);
        if (i == 70)
            fprintf(stderr, "AVISO: la línea 70 acaba de escribirse\n");
    }
    return 0;
}
```

Un programa en C que escribe en un **terminal** vacía su búfer en cada línea; hacia una **tubería** (`|`, véanse [las tuberías](/?c=langages&s=bash&p=redirections-et-pipes#los-pipes-encadenar-comandos)) o un archivo, acumula en un **búfer** (una zona de memoria intermedia) de 4.096 bytes que vacía de golpe cuando está lleno. La salida de error, en cambio, no tiene búfer: un mensaje que sale cuando el búfer está medio lleno llega antes que el texto que lo precede.

```
$ ./parlanchin 2>&1 | grep -n -B1 -A1 AVISO
66-linea 066 : 123456789 123456789 123456789 123456789 123456789
67:lineAVISO: la línea 70 acaba de escribirse
68-a 067 : 123456789 123456789 123456789 123456789 123456789
$ stdbuf -oL ./parlanchin 2>&1 | grep -n -B1 -A1 AVISO
70-linea 070 : 123456789 123456789 123456789 123456789 123456789
71:AVISO: la línea 70 acaba de escribirse
72-linea 071 : 123456789 123456789 123456789 123456789 123456789
```

En el primer caso, el aviso cayó en medio de la línea 67 (en el byte número 4.096); en el segundo, `stdbuf -oL` impone un búfer por línea y cada línea llega entera. En un terminal no hay ningún problema, lo que hace difícil detectar el defecto:

```
$ script -qec ./parlanchin /dev/null | grep -n -B1 -A1 AVISO
70-linea 070 : 123456789 123456789 123456789 123456789 123456789
71:AVISO: la línea 70 acaba de escribirse
72-linea 071 : 123456789 123456789 123456789 123456789 123456789
```

El script `capture.sh` captura la salida de las dos maneras y detecta las líneas cuya longitud no es la de una línea normal (61 caracteres):

```bash
#!/bin/bash
# Captura la salida de ./parlanchin de dos maneras
errors=$(mktemp)
trap 'rm -f "$errors"' EXIT

echo "--- stderr mezclada con stdout (2>&1)"
out=$(./parlanchin 2>&1)
echo "$out" | awk 'length($0) != 61 { print "línea dañada:", $0 }'

echo "--- stderr en un archivo temporal"
out=$(./parlanchin 2>"$errors")
echo "$out" | awk 'length($0) != 61 { print "línea dañada:", $0 }'
echo "líneas capturadas: $(echo "$out" | wc -l)"
echo "errores: $(cat "$errors")"
```

```
--- stderr mezclada con stdout (2>&1)
línea dañada: lineAVISO: la línea 70 acaba de escribirse
línea dañada: a 067 : 123456789 123456789 123456789 123456789 123456789
--- stderr en un archivo temporal
líneas capturadas: 100
errores: AVISO: la línea 70 acaba de escribirse
```

| Solución | Principio | Límite |
|---|---|---|
| Salida de error en un archivo temporal (`2>"$errors"`) | Dos flujos separados, nada que entrelazar | Un archivo más que limpiar: `trap` |
| `stdbuf -oL comando` | Fuerza un búfer por línea en los programas C enlazados dinámicamente | Sin efecto en un programa que fija él mismo su búfer |
| En el programa: `fflush(stdout)` tras cada línea, o `setvbuf` | El programa vacía su búfer por sí mismo | Hay que poder modificar el programa |

---

## 📋 Resumen

| | |
|---|---|
| **Qué recordar** | `mktemp` crea un archivo (o, con `-d`, una carpeta) con nombre aleatorio y derechos restringidos. `trap '...' EXIT` lo limpia al final del script, `trap 'exit 130' INT TERM` convierte una señal en un final normal para que la limpieza tenga lugar (imprescindible en zsh). `timeout` detiene un comando demasiado largo (código 124); en un script, `--foreground` mantiene el comando en el grupo del terminal para que Ctrl-C lo alcance. Una salida de error mezclada con la salida estándar puede partir líneas en dos. |
| **Herramientas utilizables** | `mktemp`, `mktemp -d`, `trap`, `timeout` (`--foreground`, `-k`), `stdbuf -oL`, `ps -o pid,ppid,pgid,comm` para ver los grupos de procesos. |
| **Trampas a evitar** | Un nombre fijo como `/tmp/archivo.$$`. Un segundo `trap ... EXIT` que sustituye al primero. Comillas dobles en un `trap`. Contar solo con `trap ... EXIT` en zsh. Lanzar `timeout` sin `--foreground` en un script interrumpible desde el teclado. Mezclar `2>&1` en la captura de un programa que escribe más de 4.096 bytes. |
| **Buenas prácticas** | Una sola carpeta de trabajo y un solo `trap`. Capturar `EXIT` e `INT TERM`. Probar el script con un Ctrl-C real y comprobar lo que queda en `/tmp`. Guardar la salida de error en un archivo temporal. |
