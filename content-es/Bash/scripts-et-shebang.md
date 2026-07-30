---
order: 1
---

# Escribir y ejecutar un script de Bash

Un script de Bash es un sencillo archivo de texto que contiene una secuencia de comandos, que se ejecutan en orden como si se hubieran introducido uno a uno en el terminal.

## El shebang

La primera línea de un script indica al sistema qué intérprete debe utilizar para ejecutarlo:

```bash
#!/bin/bash

echo "Bonjour"
```

`#!/bin/bash` (el «shebang») no es un comentario normal, a pesar de que `#`: el sistema operativo lo lee específicamente para saber qué programa debe ejecutar para interpretar el resto del archivo. `#!/bin/sh` ejecutaría el script con un shell POSIX más restringido (sin ciertas extensiones propias de Bash, como `[[ ]]` o las matrices).

## Hacer que un script sea ejecutable

```bash
chmod +x script.sh   # añade el derecho de ejecución (véase el capítulo sobre permisos)
./script.sh            # Ejecuta el script (el «./» es necesario si la carpeta actual no está en $PATH)
```

Alternativa sin necesidad de «`chmod +x`»: ejecutar explícitamente el intérprete sobre el archivo:

```bash
bash script.sh
```

## Los argumentos de un script

```bash
#!/bin/bash
echo "Script : $0"
echo "Premier argument : $1"
echo "Tous les arguments : $@"
echo "Nombre d'arguments : $#"
```

```bash
./script.sh alice bob
# Script: ./script.sh
# Primer argumento: alice
# Todos los argumentos: alice bob
# Número de argumentos: 2
```

## Códigos de salida (`exit`)

Cada comando, y por lo tanto cada script, termina con un **código de salida**: «`0`» significa éxito; cualquier otro valor (del 1 al 255) significa un fallo, cuyo significado concreto depende del programa:

```bash
#!/bin/bash

if [ ! -f "config.txt" ]; then
    echo "Erreur : fichier de config manquant" >&2   # >&2: mensaje de error enviado a stderr
    exit 1
fi

echo "Tout est prêt"
exit 0
```

El script (o comando) que realiza la llamada puede comprobar este código a través de `$?`:

```bash
./script.sh
if [ $? -eq 0 ]; then
    echo "Le script a réussi"
fi

# Abreviatura equivalente, más idiomática:
./script.sh && echo "Le script a réussi"
./script.sh || echo "Le script a échoué"
```

`&&` Solo ejecuta el siguiente comando si el anterior se ha ejecutado correctamente (código «`0`»); «`||`» solo si ha fallado.

## Detener un script ante el primer error: `set -e`

Por defecto, Bash sigue ejecutando las líneas siguientes aunque un comando falle, lo que a menudo no es deseable en un script de automatización:

```bash
#!/bin/bash
set -e   # detiene inmediatamente el script si un comando falla (código de salida distinto de cero)

cd /carpeta/inexistant   # Si esta carpeta no existe, el script se detiene aquí.
echo "Cette ligne ne s'exécute jamais si cd a échoué"
```

Existen otras opciones que refuerzan la solidez de un script, que a menudo se combinan:

```bash
#!/bin/bash
set -euo pipefail
# -e: se detiene ante el primer error
# -u: se produce un error si se utiliza una variable no definida
# -o pipefail: una tubería falla si CUALQUIERA de sus comandos falla (no solo el último)
```

Consulta también el capítulo sobre la gestión de procesos para saber qué ocurre tras la ejecución de un script en segundo plano.
