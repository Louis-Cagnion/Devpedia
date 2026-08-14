---
order: 3
---

# Variables de entorno

Una variable de entorno es una variable que se transmite automáticamente a los procesos que inicia un shell, a diferencia de una variable Bash convencional, que permanece local al script que la declara, salvo que se **exporte** explícitamente.

## Variable local frente a variable exportada

```bash
NÚMERO="Jean"          # Variable de shell clásica: visible únicamente en este script o en esta sesión.
export NÚMERO          # A partir de ahora, se transmite a los procesos hijos (otros scripts, comandos...).

export EMAIL="jean@exemple.com"  # declaración y exportación en una sola línea
```

```bash
# sous_script.sh
echo "$NÚMERO"    # muestra «Jean» si NOM ha sido exportado por el script que lo invoca; en caso contrario, queda vacío
```

> **Nota:** la exportación solo funciona en un sentido: de la script principal a la secundaria. Una sub-script que modifique una variable exportada no puede reflejar ese cambio en la script que la ha iniciado, ya que cada proceso tiene su propia copia del entorno.

## Variables de entorno habituales

```bash
echo $PATH    # Lista de carpetas en las que el shell busca los comandos ejecutables
echo $HOME    # carpeta personal del usuario actual
echo $USER    # nombre de usuario actual
echo $PWD     # carpeta de trabajo actual
echo $SHELL   # ruta del shell utilizado
```

## `$PATH` : cómo encuentra el shell un comando

Cuando escribes «`ls`», el shell busca un ejecutable llamado «`ls`» en cada una de las carpetas que aparecen en «`$PATH`», separadas por «`:`»:

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin

export PATH="$PATH:/mon/dossier/scripts"  # Añade una carpeta más a la búsqueda
```

> **Nota:** el orden es importante: se utiliza la primera carpeta del directorio «`$PATH`» que contenga un ejecutable con ese nombre, lo que permite, por ejemplo, que se ejecute una versión personalizada de un comando antes que la versión del sistema.

## Archivos de configuración del shell

| Archivo | Subido el |
|---|---|
| `~/.bashrc` | En cada nuevo terminal interactivo (sin inicio de sesión) |
| `~/.bash_profile` (o `~/.profile`) | Al iniciar sesión (shell de inicio de sesión) |
| `/etc/environment` | A nivel del sistema, para todos los usuarios |

Normalmente, en el archivo «`~/.bashrc`» se añaden los archivos «`export PATH=...`», «`alias`» o variables personalizadas que deben estar disponibles en cada nuevo terminal.

## `alias` : acortar los comandos más habituales

```bash
alias ll="ls -la"
alias gs="git status"

ll   # equivalente a escribir «ls -la»
```

Un `alias` definido directamente en el terminal no se conserva al cerrar la sesión; para que esté disponible en cada nuevo terminal, debe añadirse en `~/.bashrc`.

## `fuente` : recargar un archivo de configuración

Tras modificar el archivo «`~/.bashrc`», «`fuente`» aplica los cambios en la sesión actual, sin necesidad de abrir un nuevo terminal:

```bash
fuente ~/.bashrc
# Equivalente, más breve:
. ~/.bashrc
```
