---
order: 4
---

# Variables de entorno

Una variable de entorno es una variable transmitida automáticamente a los procesos que un shell lanza, a diferencia de una variable Bash clásica, que permanece local al script que la declara, salvo que se **exporte** explícitamente.

## Variable local vs variable exportada

```bash
NOMBRE="Juan"  # variable de shell clásica: visible únicamente en este script/esta sesión
export NOMBRE  # a partir de ahora, transmitida a los procesos hijos (otros scripts, comandos...)

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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una variable de entorno se transmite automáticamente a los procesos hijos, a diferencia de una variable Bash clásica: `export` la hace pasar de una a otra, en un solo sentido (padre hacia hijo). |
| **Herramientas utilizables** | `export`, `$PATH`, `~/.bashrc` (terminal interactiva) vs `~/.bash_profile` (login), `alias`, `source`. |
| **Trampas a evitar** | Modificar una variable exportada en un subscript esperando que repercuta en el script llamador: cada proceso tiene su propia copia del entorno. |
| **Buenas prácticas** | Colocar los `export`/`alias` destinados a cada nueva terminal en `~/.bashrc`; usar `source ~/.bashrc` para aplicar un cambio sin reabrir una terminal. |
