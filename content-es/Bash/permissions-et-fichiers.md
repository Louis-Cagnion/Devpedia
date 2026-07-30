---
order: 10
---

# Permisos y gestión de archivos

En Linux/Unix, cada archivo y carpeta tiene unos **permisos** que determinan quién puede leerlo, modificarlo o ejecutarlo. Este capítulo aborda tanto este sistema de permisos como los comandos básicos para gestionar archivos y carpetas desde la línea de comandos.

## Leer los permisos con `ls -l`

```bash
ls -l archivo.txt
# -rw-r--r-- 1 usuario grupo 1024 28 de julio 10:00 archivo.txt
```

Los primeros 10 caracteres se desglosan de la siguiente manera:

```
-  rw-  r--  r--
^   ^    ^    ^
|   |    |    +-- droits pour les autres utilisateurs
|   |    +------- droits pour le groupe propriétaire
|   +------------ droits pour le propriétaire
+---------------- type (- = fichier, d = dossier, l = lien symbolique)
```

Cada grupo de tres caracteres representa **la lectura** (`r`), **la escritura** (`w`) y **la ejecución** (`x`), en ese orden; un `-` significa que no existe el derecho correspondiente.

## `chmod` : modificar los permisos

### Notación simbólica

```bash
chmod u+x script.sh    # Añade el derecho de ejecución para el propietario (usuario)
chmod g-w archivo.txt   # retira el derecho de escritura al grupo
chmod o=r archivo.txt   # establece los derechos de los demás en «solo lectura», nada más
chmod a+r archivo.txt   # Añade la lectura para todos (all)
```

### Notación octal

Cada permiso se valora como una potencia de 2: `r=4`, `w=2`, `x=1` — se suman los valores de cada categoría (propietario, grupo, otros):

```bash
chmod 755 script.sh
# 7 = rwx (4+2+1) para el propietario
# 5 = r-x (4+0+1) para el grupo
# 5 = r-x (4+0+1) para el resto
```

| Valor | Derechos |
|---|---|
| `7` | `rwx` (lectura + escritura + ejecución) |
| `6` | `rw-` (lectura + escritura) |
| `5` | `r-x` (lectura + ejecución) |
| `4` | `r--` (solo lectura) |
| `0` | Sin derechos |

> **Nota:** «`chmod 644 archivo`» (lectura/escritura para el propietario, solo lectura para el resto) es la configuración más habitual para un archivo normal; «`755`» para un script o una carpeta destinada a ser ejecutada o explorada.

## `chown` : cambiar el propietario

```bash
chown usuario archivo.txt           # cambiar el propietario
chown usuario:grupo archivo.txt    # Cambiar el propietario y el grupo de una sola vez
```

## Comandos básicos para trabajar con archivos

```bash
mkdir carpeta              # crea una carpeta
mkdir -p a/b/c              # crea toda la estructura de directorios de una sola vez, sin errores si ya existe
touch archivo.txt           # crea un archivo vacío (o actualiza su fecha de modificación si ya existe)
cp fuente.txt destination.txt        # copia un archivo
cp -r dossier_source dossier_dest    # copia recursiva, necesaria para una carpeta
mv ancien.txt nouveau.txt   # mueve O renombra (ambas son la misma operación para mv)
rm archivo.txt              # elimina un archivo (de forma definitiva, sin pasar por la papelera de reciclaje)
rm -r carpeta               # elimina una carpeta y todo su contenido
```

> **Nota:** `rm -rf` (recursivo + `-f` para ignorar las confirmaciones/errores) es irreversible y no requiere confirmación alguna; un destino mal especificado (por ejemplo, una ruta con un espacio de más, `rm -rf ~ /carpeta` en lugar de `rm -rf ~/carpeta`) puede eliminar mucho más de lo previsto.

## `find` : buscar archivos

```bash
find . -name "*.txt"                 # todos los archivos .txt de la carpeta actual
find /var/log -mtime -7               # archivos modificados en los últimos 7 días
find . -type d -name "node_modules"   # todas las carpetas denominadas «node_modules»
find . -name "*.tmp" -delete          # Busca y elimina con un solo comando
```

Consulta también el capítulo sobre el procesador de textos (`grep`, `sed`, `awk`) para profundizar en el aprovechamiento del contenido de estos archivos.
