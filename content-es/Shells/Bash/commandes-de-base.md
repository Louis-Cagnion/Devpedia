---
order: 1
---

# Comandos básicos

Este capítulo asume ya adquirido lo que es una [terminal](/?c=bases-de-l-informatique&p=le-terminal) y una [ruta de archivo](/?c=bases-de-l-informatique&p=arborescence-et-chemins): cubre los primerísimos comandos de Bash usados en una terminal, incluso antes de escribir el menor script.

## Moverse: `cd` y `pwd`

```bash
pwd           # muestra la carpeta actual (Print Working Directory)
cd Documentos # se mueve a la subcarpeta "Documentos"
cd ..         # sube un nivel
cd -          # vuelve a la carpeta anterior
```

> **Trampa:** `cd` sin argumento no "no hace nada": te lleva directamente a la carpeta personal (`$HOME`), lo que sorprende a quien esperaba quedarse en el mismo sitio.
>
> **Buena práctica:** comprobar tu posición con `pwd` después de un `cd` sin argumento, en lugar de suponer que te quedaste en el mismo lugar.

## Listar una carpeta: `ls`

```bash
ls     # lista el contenido de la carpeta actual
ls -a  # incluye los archivos ocultos (cuyo nombre empieza con un punto)
ls -l  # muestra los detalles (permisos, tamaño, fecha) en lugar de solo los nombres
```

| Opción | Efecto |
|---|---|
| `-a` | Muestra también los archivos/carpetas ocultos |
| `-l` | Formato detallado (una línea por archivo, con permisos y tamaño) |
| `-la` | Ambas combinadas: el orden de las letras no importa |

> **Trampa:** una carpeta que parece vacía o incompleta con un simple `ls` puede en realidad contener archivos ocultos (su nombre empieza con un punto, ej. `.env`, `.gitignore`), invisibles sin `-a`.
>
> **Buena práctica:** ante una carpeta cuyo contenido parece incoherente con lo esperado, repetir el `ls` con `-a` antes de buscar más allá.

## Leer el contenido de un archivo: `cat`

```bash
cat archivo.txt   # muestra todo el contenido del archivo en la terminal
```

> **Nota:** para un archivo demasiado largo para caber en una pantalla, ver el capítulo sobre procesamiento de texto (`less`, `head`, `tail`); `cat` muestra todo de golpe, sin paginación.

> **Trampa:** usar `cat` sobre un archivo binario (una imagen, un ejecutable) en lugar de un archivo de texto. La terminal intenta mostrar bytes que no son texto válido, lo que puede dejarla visualmente corrupta (caracteres extraños, colores que persisten), sin haber roto nada realmente.
>
> **Buena práctica:** reservar `cat` solo para archivos de texto conocidos. Si la terminal queda mostrada de forma incoherente tras este tipo de error, el comando `reset` (o cerrar/reabrir la terminal) la devuelve a un estado limpio.

## Crear, copiar, mover, eliminar

Estos comandos se cubren junto con el sistema de permisos, en el capítulo siguiente: [Permisos y manipulación de archivos](/?c=shells&s=bash&p=permissions-et-fichiers).

## Obtener ayuda: `man` y `--help`

```bash
man ls     # abre el manual completo del comando ls (q para salir)
ls --help  # resumen más corto, directamente en la terminal
```

### El manual está dividido en varias secciones

`man` no cubre solo los comandos de terminal: es el manual de todo el sistema, dividido en **secciones numeradas**, cada una dedicada a una categoría diferente de tema.

| Sección | Contenido |
|---|---|
| 1 | Comandos de usuario (los que se escriben en una terminal: `ls`, `cd`, `grep`...) |
| 2 | Llamadas al sistema (funciones proporcionadas directamente por el kernel de Linux) |
| 3 | Funciones de biblioteca del lenguaje C (`printf`, `malloc`...) |
| 5 | Formatos de archivo y convenciones (ej. la estructura de `/etc/passwd`) |
| 7 | Varios: convenciones generales, protocolos |
| 8 | Comandos de administración del sistema (generalmente reservados a root) |

Esto se vuelve concreto en cuanto un mismo nombre existe en **varias** secciones a la vez: `printf` es a la vez un comando de terminal (sección 1) y una función del lenguaje C (sección 3, cf. [capítulo C dedicado](/?c=langages-de-programmation&s=c&p=fonctions-variadiques)), y son dos páginas de manual completamente diferentes:

```bash
man printf    # sin precisar, abre la sección más baja encontrada: aquí, la 1 (comando)
man 3 printf  # fuerza la apertura de la sección 3: la función C, no el comando
```

Para saber en qué secciones existe un nombre antes de elegir:

```bash
man -f printf  # lista todas las secciones donde "printf" tiene una página de manual
whatis printf  # equivalente, con una descripción de una línea para cada una
```

### Trampa: `man cd` no funciona como se espera

```bash
man cd
# No manual entry for cd
```

`cd` no es un programa separado en el disco: es un **comando interno** (*builtin*), ejecutado directamente por Bash mismo en lugar de lanzado como un proceso aparte (ver [Ejecutar un comando: builtin vs externo](/?c=shells&s=bash&p=architecture-dun-shell) para saber por qué `cd` debe funcionar obligatoriamente así). `man` busca una página dedicada a un ejecutable: no la hay para un builtin. El comando correcto en este caso es `help`:

```bash
help cd   # documentación del builtin cd, proporcionada por Bash mismo
man bash  # alternativa: todos los builtins también están documentados ahí, en la sección "SHELL BUILTIN COMMANDS"
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `pwd` muestra dónde estás, `cd` cambia de carpeta, `ls` lista una carpeta, `cat` muestra un archivo. Las opciones (`-l`, `-a`) modifican el comportamiento de un comando sin cambiar su nombre. |
| **Herramientas utilizables** | `man <comando>` para la documentación completa, `<comando> --help` para un resumen rápido, `man -f <nombre>`/`whatis <nombre>` para ver en qué secciones existe un nombre, `help <builtin>` para un comando interno como `cd`. |
| **Trampas a evitar** | `cd` sin argumento te lleva a la carpeta personal (`$HOME`) en lugar de no hacer nada. `man <nombre>` sin precisar sección abre la primera encontrada: no necesariamente la deseada si el nombre existe en otro sitio (ej. `printf`, comando **y** función C). `man <builtin>` (ej. `man cd`) falla sin más: un builtin no tiene página dedicada, `help` lo reemplaza. |
| **Buenas prácticas** | Comprobar tu posición con `pwd` antes de un comando que actúa sobre una ruta relativa, en lugar de suponerla. |
