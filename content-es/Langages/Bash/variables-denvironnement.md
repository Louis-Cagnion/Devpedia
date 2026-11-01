---
order: 4
---

# Variables de entorno

Una variable de entorno es una variable transmitida automáticamente a los procesos que un shell lanza, a diferencia de una variable Bash clásica, que permanece local al script que la declara, salvo que se **exporte** explícitamente.

## Variable local vs variable exportada

```bash
NOMBRE="Juan"  # variable de shell clásica: visible únicamente en este script/esta sesión
# a partir de ahora, transmitida a los procesos hijos (otros scripts, comandos...)
export NOMBRE

export EMAIL="juan@ejemplo.com"  # declaración y export en una sola línea
```

```bash
# subscript.sh
echo "$NOMBRE"    # muestra "Juan" si NOMBRE fue exportada por el script llamador, vacío si no
```

> **Nota:** el export solo funciona en un sentido: del padre hacia el hijo. Un subscript que modifica una variable exportada no puede repercutir ese cambio hacia el script que lo lanzó: cada proceso tiene su propia copia del entorno.

## Variables de entorno comunes

```bash
echo $PATH   # lista de carpetas donde el shell busca los comandos ejecutables
echo $HOME   # carpeta personal del usuario actual
echo $USER   # nombre del usuario actual
echo $PWD    # carpeta de trabajo actual
echo $SHELL  # ruta del shell usado
```

## `$PATH`: cómo encuentra el shell un comando

Cuando escribes `ls`, el shell busca un ejecutable llamado `ls` en cada una de las carpetas listadas en `$PATH`, separadas por `:`:

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin

export PATH="$PATH:/mi/carpeta/scripts"  # añade una carpeta más a la búsqueda
```

> **Nota:** el orden importa: se usa la primera carpeta de `$PATH` que contenga un ejecutable de ese nombre, lo que permite por ejemplo hacer pasar una versión personalizada de un comando antes que la versión del sistema.

## Archivos de configuración del shell

| Archivo | Se carga cuando |
|---|---|
| `~/.bashrc` | En cada nueva terminal interactiva (no-login) |
| `~/.bash_profile` (o `~/.profile`) | Al conectarse (login shell) |
| `/etc/environment` | A nivel de sistema, para todos los usuarios |

Es en `~/.bashrc` donde se añaden típicamente los `export PATH=...`, los `alias`, o variables personalizadas destinadas a estar disponibles en cada nueva terminal.

## `alias`: acortar comandos frecuentes

```bash
alias ll="ls -la"
alias gs="git status"

ll   # equivalente a escribir "ls -la"
```

Un `alias` definido directamente en la terminal no sobrevive al cierre de la sesión: para que esté disponible en cada nueva terminal, debe añadirse en `~/.bashrc`.

## `source`: recargar un archivo de configuración

Tras una modificación de `~/.bashrc`, `source` aplica los cambios en la sesión actual, sin tener que abrir una nueva terminal:

```bash
source ~/.bashrc
# equivalente, más corto:
. ~/.bashrc
```

## Una variable exportada solo vive en su terminal

`export` transmite una variable a los programas lanzados **desde ese shell**: no a otra [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) abierta al lado, que es otro shell con su propio entorno. Para comprobarlo, abre dos terminales:

```bash
# Terminal 1: exporta una variable y luego la muestra entre corchetes
export MI_VAR=hola
echo "terminal 1: [$MI_VAR]"
```

```bash
# Terminal 2 (otra ventana): la misma variable no existe aquí
echo "terminal 2: [$MI_VAR]"
```

```text
terminal 1: [hola]
terminal 2: []
```

Para que una variable esté presente en cada terminal nueva, hay que escribirla en `~/.bashrc` (ver más arriba).

## Una variable vacía en un `rm -rf`

`rm -rf` elimina una carpeta y todo su contenido, sin papelera ni confirmación. Si la variable colocada delante de `/` está **vacía** (nunca definida, error de escritura en su nombre, valor no transmitido), el shell la sustituye por nada: entonces el comando apunta a la raíz del sistema, `/`. No lo ejecutes nunca para comprobarlo: `echo` muestra lo que el shell ha calculado, sin borrar nada.

```bash
# VAR está definida pero vacía
VAR=""
# echo muestra el comando tal como lo construiría el shell, sin ejecutarlo
echo rm -rf $VAR/
# los corchetes siguen siendo visibles incluso cuando el valor está vacío
echo "[$VAR]"
# con un valor normal, el comando apunta a la carpeta deseada
VAR=/tmp/prueba
echo rm -rf $VAR/
echo "[$VAR]"
```

```text
rm -rf /
[]
rm -rf /tmp/prueba/
[/tmp/prueba]
```

| Escritura | Si `VAR` está vacía |
|---|---|
| `rm -rf $VAR/` | Se convierte en `rm -rf /`: se apunta a la raíz |
| `rm -rf "${VAR:?variable vacía}/"` | Bash se detiene con el error `VAR: variable vacía`, no se borra nada |

Antes de cualquier borrado, `echo "[$VAR]"` muestra el valor: `[]` delata una variable vacía, mientras que un `echo $VAR` solo mostraría una línea en blanco, fácil de pasar por alto.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una variable de entorno se transmite automáticamente a los procesos hijos, a diferencia de una variable Bash clásica: `export` la hace pasar de una a otra, en un solo sentido (padre hacia hijo). |
| **Herramientas utilizables** | `export`, `$PATH`, `~/.bashrc` (terminal interactiva) vs `~/.bash_profile` (login), `alias`, `source`. |
| **Trampas a evitar** | Modificar una variable exportada en un subscript esperando que repercuta en el script llamador: cada proceso tiene su propia copia del entorno. Esperar que otro terminal vea una variable exportada en otro sitio. Escribir `rm -rf $VAR/`: si `VAR` está vacía, el comando apunta a la raíz. |
| **Buenas prácticas** | Colocar los `export`/`alias` destinados a cada nueva terminal en `~/.bashrc`; usar `source ~/.bashrc` para aplicar un cambio sin reabrir una terminal. Mostrar `echo "[$VAR]"` antes de un borrado (los corchetes revelan un valor vacío) y proteger la variable con `"${VAR:?}"`. |
