---
order: 3
---

# Las variables

Como recordatorio, [una variable es una caja etiquetada que contiene un valor](/?c=bases-de-l-informatique&p=la-variable): lo que sigue cubre únicamente lo específico de Bash.

Bash solo tiene un tipo de datos real: la **cadena de caracteres**; incluso un número se maneja como texto, salvo en un contexto aritmético explícito (ver más abajo lo que eso cubre exactamente). Las variables no están tipadas, y su sintaxis de declaración/lectura es particular: sin `$` en la asignación, con `$` en la lectura.

## Declarar y leer una variable

```bash
nombre="Juan"     # ningún espacio alrededor del '=': "nombre = Juan" es un error de sintaxis
echo $nombre      # Juan
echo "${nombre}"  # Juan -> las llaves delimitan explícitamente el nombre de variable
echo "Hola ${nombre}!"
```

> **Trampa:** `nombre= "Juan"` (con un espacio después de `=`) no funciona **como se espera**: Bash entiende "ejecutar el comando `Juan` con la variable de entorno `nombre` vacía", no "asignar Juan a nombre". Un espacio antes del `=` (`nombre ="Juan"`) falla igualmente: Bash busca entonces un comando llamado `nombre`.
>
> **Buena práctica:** nunca dejar espacio ni antes ni después del `=` de una asignación: es la regla más simple de recordar, sin excepción en Bash.

## Comillas simples vs dobles

```bash
nombre="Juan"

echo "Hola $nombre"  # Hola Juan -> las comillas dobles interpretan las variables
echo 'Hola $nombre'  # Hola $nombre -> las comillas simples desactivan cualquier interpretación
```

| Comillas | ¿Variables interpretadas? | Caso de uso típico |
|---|---|---|
| Dobles `"..."` | Sí: `$nombre` reemplazado por su valor | Caso por defecto, en cuanto una variable aparece en la cadena |
| Simples `'...'` | No: texto tomado tal cual, `$` incluido | Texto literal que contiene un `$` que no debe interpretarse (regex, contraseña mostrada tal cual...) |
| Ninguna | Sí, pero además el valor se divide en palabras por los espacios | A evitar casi siempre: ver la trampa de abajo |

> **Trampa:** usar una variable sin comillas (`echo $nombre`) en lugar de `"$nombre"`. Si el valor contiene un espacio, Bash lo divide en varias palabras antes de usarlo: `rm $archivo` con un nombre de archivo que contiene un espacio puede así eliminar algo distinto de lo previsto, silenciosamente.
>
> **Buena práctica:** rodear siempre una variable de comillas dobles al usarla (`"$nombre"`), salvo necesidad precisa de lo contrario. Única excepción habitual: dentro de un contexto numérico explícito (`[ $i -lt 5 ]`, `$(( i + 1 ))`), Bash no hace ninguna división en palabras sobre el valor: las comillas son por tanto innecesarias ahí, lo que explica por qué los capítulos sobre condiciones y bucles no las usan en esos casos precisos.

## Sustitución de comandos

Ejecuta un comando y reemplaza la expresión por su salida:

```bash
fecha_actual=$(date +%Y-%m-%d)
echo "Hoy es $fecha_actual"

numero_archivos=$(ls | wc -l)
echo "Hay $numero_archivos archivos aquí"
```

`$(...)` es la sintaxis moderna, preferida a los antiguos backticks (`` `date` ``), menos legibles e imposibles de anidar fácilmente.

> **Trampa:** una sustitución de comandos sin comillas sufre la misma división en palabras que una variable sin comillas (ver la trampa de las comillas arriba): un resultado multilínea (`$(ls)`, `$(cat archivo.txt)`) ve sus saltos de línea transformados silenciosamente en simples espacios si se muestra sin comillas.
>
> **Buena práctica:** poner entre comillas una sustitución de comandos en cuanto su salida sea multilínea o pueda contener espacios (`echo "$(cat archivo.txt)"`), exactamente igual que para una variable ordinaria.

## Inyección de comandos: nunca interpolar una entrada no fiable

Si un script construye un comando interpolando directamente en él un valor externo (entrada de usuario, argumento, contenido de un archivo descargado...), ese valor puede contener caracteres especiales del shell (`;`, `|`, `` ` ``, `$(...)`) que **cambian la estructura del comando ejecutado**, en lugar de quedarse como un simple dato:

```bash
nombre_archivo="informe.txt; rm -rf ~"   # valor recibido del exterior, no controlado

eval "cat $nombre_archivo"    # PELIGRO: ejecuta realmente "cat informe.txt" Y LUEGO "rm -rf ~"
```

`eval` reinterpreta su cadena como una nueva línea de comando completa: es exactamente ese mecanismo el que transforma un `;` contenido en el dato en una verdadera **segunda orden**, en lugar de un carácter inofensivo en un nombre de archivo. Incluso sin `eval`, la sustitución de comandos (`$(...)`, arriba) o una variable sin comillas en un comando que él mismo acepta código (ej. `ssh host "$comando"`) crean el mismo riesgo.

> **Trampa:** confiar en un valor externo (entrada de usuario, argumento de script, contenido de un archivo descargado) para construir un comando, en particular vía `eval` o un comando que él mismo acepta código (`ssh host "$comando"`), conceptualmente el equivalente Bash de una [inyección SQL](/?c=langages-de-programmation&s=php&p=securite): una entrada no controlada que modifica la estructura de lo que se ejecuta, en lugar de quedarse como un simple dato.
>
> **Buena práctica:** nunca ensamblar textualmente un valor externo en un comando ejecutado después. Cuando sea inevitable, tratarlo como un dato puro: nunca interpolado directamente en el comando, y menos aún pasado a `eval`.

## Aritmética

Bash no calcula nativamente sobre cadenas: se necesita un contexto aritmético explícito:

```bash
a=5
b=3

echo $((a + b))  # 8
echo $((a * b))  # 15
echo $((a / b))  # 1 -> solo división entera, Bash no maneja decimales
```

> **¿Qué es un "contexto aritmético explícito"?** Es una sintaxis precisa que Bash reconoce y dentro de la cual interpreta el contenido como una expresión numérica en lugar de como texto: `$((...))` (para obtener el resultado), `((...))` solo (para un cálculo o una prueba, sin recuperar valor, usado por ejemplo en `for ((i = 0; i < 5; i++))`, ver [Los bucles](/?c=shells&s=bash&p=boucles)), el comando `let` (`let "a = a + 1"`), o también los operadores numéricos `-eq`, `-lt`, `-gt`... dentro de `[ ]`/`[[ ]]` (ver [Las condiciones](/?c=shells&s=bash&p=conditions)). Fuera de estas sintaxis precisas, `+`, `-`, `*` no son más que caracteres ordinarios en una cadena.

> **Trampa:** `$((a / b))` trunca silenciosamente cualquier parte decimal, sin aviso ni error: `echo $((5 / 2))` muestra `2`, no `2.5`. Un cálculo que debería producir un resultado decimal (media, porcentaje...) da así un resultado falso sin que ningún error lo señale.
>
> **Buena práctica:** pasar por una herramienta externa que maneje decimales ([`bc`](https://www.gnu.org/software/bc/), `awk`) en cuanto un cálculo pueda producir un resultado no entero, en lugar de la aritmética nativa de Bash.

## Variables especiales

Además de las variables que declaras tú mismo, Bash proporciona variables especiales siempre disponibles (`$0`, `$1`, `$@`, `$#`, `$?`, `$$`): ver la tabla y los ejemplos en el capítulo sobre escritura de scripts, justo después de la sección sobre los argumentos de un script.

## Variables locales en una función

Por defecto, una variable declarada en una función sigue siendo **global** (visible en todas partes tras su primera llamada): `local` restringe su ámbito a la función actual, lo que evita efectos secundarios inesperados:

```bash
contar() {
    local total=0   # visible solo dentro de contar()
    total=$((total + 1))
    echo $total
}

contar
echo "$total"  # vacío: total no existe fuera de la función
```

> **Trampa:** olvidar `local` en una función que reutiliza un nombre de variable común (`i`, `total`, `resultado`...): la variable se vuelve global silenciosamente, y puede sobrescribir una variable del mismo nombre usada en otra parte del script, sin ningún error señalado.
>
> **Buena práctica:** declarar `local` para toda variable que solo necesita existir mientras dura la función: un reflejo a adoptar desde la primera línea de la función, no solo una vez ya constatado un bug de ámbito.

Ver también el capítulo sobre funciones, y el de variables de entorno (`export`) para compartir un valor con procesos hijos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Bash solo conoce un tipo real, la cadena de caracteres. Asignación sin `$` (`nombre="Juan"`), lectura con `$` (`$nombre`) o `${nombre}`, sin ningún espacio alrededor del `=`. `"$(...)"` captura la salida de un comando; `$((...))` evalúa una expresión numérica. `local` restringe una variable a su función. |
| **Herramientas utilizables** | `$(comando)` para la sustitución de comandos; `$((...))`, `((...))` o `let` para la aritmética; `bc`/`awk` en cuanto se necesite un cálculo decimal. |
| **Trampas a evitar** | Un espacio alrededor del `=` en la asignación. Una variable o una sustitución de comandos sin comillas (división en palabras silenciosa). Interpolar un valor externo no controlado en un comando (`eval`, `ssh host "$comando"`). Olvidar `local` en una función. |
| **Buenas prácticas** | Poner siempre una variable entre comillas (`"$nombre"`) salvo en un contexto aritmético explícito. Nunca construir un comando a partir de un dato externo no controlado. Declarar `local` sistemáticamente en una función. |
