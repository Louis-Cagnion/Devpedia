---
order: 11
---

# Permisos y manipulación de archivos

En Linux/Unix, cada archivo y carpeta lleva unos **permisos** que determinan quién puede leerlo, modificarlo o ejecutarlo. Este capítulo cubre a la vez este sistema de permisos y los comandos básicos para manipular archivos y carpetas en línea de comandos.

## Leer los permisos con `ls -l`

```bash
ls -l archivo.txt
# -rw-r--r-- 1 usuario grupo 1024 28 jul 10:00 archivo.txt
```

Los primeros 10 caracteres se descomponen así:

```text
-  rw-  r--  r--
^   ^    ^    ^
|   |    |    +-- permisos para los demás usuarios
|   |    +------- permisos para el grupo propietario
|   +------------ permisos para el propietario
+---------------- tipo (- = archivo, d = carpeta, l = enlace simbólico)
```

Cada grupo de tres caracteres representa **lectura** (`r`), **escritura** (`w`) y **ejecución** (`x`), en ese orden: un `-` significa que el permiso correspondiente está ausente.

## `chmod`: modificar los permisos

### Notación simbólica

```bash
chmod u+x script.sh    # añade el permiso de ejecución para el propietario (user)
chmod g-w archivo.txt  # retira el permiso de escritura para el grupo
chmod o=r archivo.txt  # fija los permisos de los demás en solo lectura, nada más
chmod a+r archivo.txt  # añade la lectura para todo el mundo (all)
```

### Notación octal

Cada permiso vale una potencia de 2: `r=4`, `w=2`, `x=1`; se suman para cada categoría (propietario, grupo, demás):

```bash
chmod 755 script.sh
# 7 = rwx (4+2+1) para el propietario
# 5 = r-x (4+0+1) para el grupo
# 5 = r-x (4+0+1) para los demás
```

| Valor | Permisos |
|---|---|
| `7` | `rwx` (lectura + escritura + ejecución) |
| `6` | `rw-` (lectura + escritura) |
| `5` | `r-x` (lectura + ejecución) |
| `4` | `r--` (solo lectura) |
| `0` | Ningún permiso |

> **Nota:** `chmod 644 archivo` (lectura/escritura para el propietario, solo lectura para el resto) es la configuración más común para un archivo normal; `755` para un script o una carpeta destinados a ejecutarse/recorrerse.

## `chown`: cambiar el propietario

```bash
chown usuario archivo.txt         # cambia el propietario
chown usuario:grupo archivo.txt   # cambia propietario Y grupo de una vez
```

## Comandos básicos sobre archivos

```bash
mkdir carpeta                        # crea una carpeta
mkdir -p a/b/c                       # crea toda la estructura de una vez, sin error si ya existe
touch archivo.txt                    # crea un archivo vacío (o actualiza su fecha de modificación si existe)
cp origen.txt destino.txt            # copia un archivo
cp -r carpeta_origen carpeta_destino # copia recursiva, necesaria para una carpeta
mv antiguo.txt nuevo.txt             # mueve O renombra (ambas son la misma operación para mv)
rm archivo.txt                       # elimina un archivo (definitivo, sin papelera)
rm -r carpeta                        # elimina una carpeta y todo su contenido
```

> **Nota:** `rm -rf` (recursivo + `-f` para ignorar confirmaciones/errores) es irreversible y no pide ninguna confirmación: un objetivo mal apuntado (ej. una ruta con un espacio de más, `rm -rf ~ /carpeta` en lugar de `rm -rf ~/carpeta`) puede eliminar mucho más de lo previsto.

## `find`: buscar archivos

```bash
find . -name "*.txt"                 # todos los archivos .txt, desde la carpeta actual
find /var/log -mtime -7              # archivos modificados en los últimos 7 días
find . -type d -name "node_modules"  # todas las carpetas llamadas "node_modules"
find . -name "*.tmp" -delete         # encuentra Y elimina en un solo comando
```

Ver también [Procesamiento de texto](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`) para ir más lejos en la explotación del contenido de estos archivos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Cada archivo tiene permisos lectura/escritura/ejecución para propietario/grupo/demás. `chmod` los modifica (notación simbólica u octal), `chown` cambia el propietario. |
| **Herramientas utilizables** | `ls -l`, `chmod`/`chown`, `mkdir`/`cp`/`mv`/`rm`, `find`. |
| **Trampas a evitar** | `rm -rf` sin comprobar el objetivo exacto: irreversible, sin confirmación. |
| **Buenas prácticas** | `chmod 644` para un archivo normal, `755` para un script/carpeta ejecutable; comprobar siempre un comando `find ... -delete` probándolo antes sin `-delete`. |
