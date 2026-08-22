---
order: 9
---

# Redirecciones y pipes

Cada comando Unix se comunica por defecto vía tres flujos: la **entrada estándar** (`stdin`, lo que lee), la **salida estándar** (`stdout`, lo que muestra normalmente) y la **salida de error** (`stderr`, adonde van los mensajes de error). Las redirecciones y los pipes permiten redirigir estos flujos hacia un archivo o hacia otro comando, en lugar de hacia la terminal.

> **Nota:** estos "flujos" son en realidad **descriptores de archivo** numerados (`0`, `1`, `2`): ver [el capítulo sobre llamadas al sistema y descriptores de archivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) (sección C) para lo que ocurre realmente a nivel del sistema operativo cuando se redirigen.

## Redirigir la salida a un archivo

```bash
echo "Hola" > archivo.txt    # sobrescribe archivo.txt (o lo crea) con este contenido
echo "Otra vez" >> archivo.txt  # añade al final de archivo.txt, sin sobrescribir
```

> **Nota:** `>` sobrescribe silenciosamente el contenido existente del archivo destino: un error clásico es usar `>` donde se quería `>>`, perdiendo el contenido anterior sin aviso.

## Redirigir la entrada desde un archivo

```bash
sort < lista.txt   # lee lista.txt como entrada estándar de "sort", en lugar de esperar entrada de teclado
```

## Redirigir la salida de error

Los flujos están numerados: `0` = entrada estándar, `1` = salida estándar, `2` = salida de error.

```bash
comando_que_falla 2> errores.log        # solo la salida de error va a errores.log
comando 1> salida.log 2> errores.log    # separa salida normal y errores en dos archivos
comando > todo.log 2>&1                 # redirige stdout a todo.log, LUEGO stderr hacia donde va stdout
comando &> todo.log                     # atajo Bash equivalente a "> todo.log 2>&1"
```

> **Nota:** el orden importa para `2>&1`. `2>&1 > archivo` **no** funciona como se espera: en ese momento, `2` sigue redirigido a la terminal (la salida estándar de entonces), y solo `1` va después a `archivo`. Hay que escribir `> archivo 2>&1`: primero redirigir `1` a `archivo`, luego hacer que `2` apunte al mismo destino que `1` **en ese instante preciso**.

## `/dev/null`: ignorar una salida

Un archivo especial que "se traga" todo lo que se le escribe, sin almacenar nunca nada: útil para suprimir un flujo que no se necesita:

```bash
comando_ruidoso > /dev/null 2>&1   # ignora toda salida normal Y todo error
```

## Los pipes (`|`): encadenar comandos

Un pipe conecta la salida estándar de un comando con la entrada estándar del siguiente:

```bash
ls -l | grep ".txt"               # conserva solo las líneas que contienen ".txt"
grep "404" access.log | wc -l     # cuenta las líneas que contienen "404" en el archivo
ps aux | sort -k 3 -nr | head -5  # los 5 procesos que más CPU consumen
```

Cada comando de un pipe se ejecuta simultáneamente, alimentando la salida de uno la entrada del siguiente sobre la marcha: no es una ejecución secuencial con almacenamiento intermedio.

## Encadenar comandos según su resultado: `;`, `&&`, `||`

Un pipe hace circular **datos**. Estos tres operadores, en cambio, controlan la **ejecución**: deciden si el comando siguiente se lanza, según el código de salida del anterior (`0` = éxito, ver [Escribir y ejecutar un script Bash](/?c=shells&s=bash&p=scripts-et-shebang)).

```bash
comando1 ; comando2   # lanza comando2 en cualquier caso
comando1 && comando2  # lanza comando2 SOLO si comando1 tuvo éxito
comando1 || comando2  # lanza comando2 SOLO si comando1 falló
```

En la práctica:

```bash
mkdir -p build && cd build                 # solo entra en la carpeta si se creó correctamente
./configure && make && make install        # la cadena se detiene en cuanto un paso falla
grep -q "TODO" *.md || echo "ningún TODO"  # mensaje de repliegue si grep no encuentra nada
```

Se habla de evaluación en **cortocircuito** (*short-circuit*): `&&` solo ejecuta lo siguiente si es necesario, exactamente como los operadores lógicos de otros lenguajes.

> No confundas estos `&&`/`||` con los vistos en el capítulo sobre condiciones. Dentro de `[[ ... ]]`, son operadores **lógicos** que combinan dos pruebas. Entre dos comandos, son operadores de **control de flujo** basados en los códigos de salida. La grafía es idéntica, el papel es diferente.

### La trampa del `&& ... || ...`

Escribir un "si/si no" en una línea es tentador, pero no se comporta como un `if/else`:

```bash
comando && echo "OK" || echo "FALLO"
```

Si `comando` tiene éxito pero `echo "OK"` falla (caso raro pero posible, por ejemplo si la salida está cerrada), entonces el `||` se dispara y `FALLO` se muestra **también**. Para una lógica condicional real, un `if` explícito es más seguro:

```bash
if comando; then echo "OK"; else echo "FALLO"; fi
```

### Atención con `set -e`

Un comando colocado a la izquierda de un `&&` o un `||` se considera "probado": su fallo **no interrumpe** el script incluso bajo `set -e`. Esto es lo que permite escribir `grep patron archivo || true` para neutralizar voluntariamente un fallo esperado, pero también es una fuente de sorpresa si se creía que `set -e` protegía toda la línea.

## `tee`: redirigir conservando la visualización

`tee` escribe su salida a la vez en un archivo **y** hacia la salida estándar (útil para ver un resultado mientras se guarda):

```bash
ls -l | tee resultados.txt   # muestra el resultado en pantalla Y lo guarda en resultados.txt
```

## Resumen de símbolos

| Símbolo | Efecto |
|---|---|
| `>` | Redirige la salida estándar, sobrescribe el archivo |
| `>>` | Redirige la salida estándar, añade al final |
| `<` | Redirige la entrada estándar desde un archivo |
| `2>` | Redirige la salida de error |
| `&>` | Redirige salida estándar Y error hacia el mismo destino |
| `\|` | Conecta la salida de un comando con la entrada del siguiente |
| `;` | Encadena dos comandos, sin condición |
| `&&` | Ejecuta el siguiente solo si el anterior tuvo éxito |
| `\|\|` | Ejecuta el siguiente solo si el anterior falló |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `>`/`>>`/`<` redirigen los flujos stdin/stdout/stderr hacia o desde un archivo; `\|` conecta la salida de un comando con la entrada del siguiente. `&&`/`\|\|`/`;` encadenan comandos según su código de salida. |
| **Herramientas utilizables** | `2>&1` (fusionar stderr en stdout), `/dev/null` (ignorar una salida), `tee` (mostrar y guardar a la vez). |
| **Trampas a evitar** | `>` que sobrescribe silenciosamente un archivo existente; el orden de `2>&1` respecto a `>` (`2>&1 > archivo` no hace lo esperado). |
| **Buenas prácticas** | Escribir `> archivo 2>&1` (nunca al revés); preferir un `if` explícito a un `&& ... \|\| ...` en cuanto la lógica condicional sea realmente importante. |
