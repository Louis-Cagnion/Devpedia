---
order: 2
---

# Las variables

Bash solo tiene un tipo de datos real: la **cadena de caracteres**; incluso un número se maneja como texto, salvo en un contexto aritmético explícito. Las variables no están tipadas, y su sintaxis de declaración y lectura es particular: sin «`$`» en la asignación, y con «`$`» en la lectura.

## Declarar y leer una variable

```bash
número="Jean"        # No debe haber espacios alrededor del «=»: «nombre = Juan» es un error de sintaxis.
echo $número          # Jean
echo "${número}"       # Jean -> las llaves delimitan explícitamente el nombre de la variable
echo "Bonjour ${número} !"
```

> **Nota:** «`número= "Jean"`» (con un espacio después de «`=`») no funciona como se espera: Bash interpreta «ejecutar el comando `Jean` con la variable de entorno `número` vacía», no «asignar Jean a nombre». Es imprescindible que no haya ningún espacio alrededor de «`=`».

## Comillas simples frente a comillas dobles

```bash
número="Jean"

echo "Bonjour $número"   # Hola, Jean -> las comillas dobles interpretan las variables
echo 'Bonjour $nom'   # Hola $nombre -> las comillas simples desactivan cualquier interpretación
```

> **Nota:** siempre hay que escribir las variables entre comillas dobles cuando se utilicen (`"$número"`), salvo que se indique lo contrario de forma específica; sin comillas, Bash divide en varias palabras los valores que contienen espacios, lo que provoca errores silenciosos en muchos scripts (`rm $archivo` con un nombre de archivo que contenga un espacio puede eliminar algo distinto de lo previsto). La excepción más habitual: dentro de un contexto numérico explícito (`[ $i -lt 5 ]`, `$(( i + 1 ))`), Bash no divide el valor en palabras; por lo tanto, las comillas son innecesarias, lo que explica por qué los capítulos sobre condiciones y bucles no las utilizan en estos casos concretos.

## Sustitución de comandos

Ejecuta un comando y sustituye la expresión por su resultado:

```bash
date_du_jour=$(date +%Y-%m-%d)
echo "Nous sommes le $date_du_jour"

nombre_fichiers=$(ls | wc -l)
echo "Il y a $nombre_fichiers fichiers ici"
```

`$(...)` Esta es la sintaxis moderna, preferible a las antiguas `backticks\` (`` ` date ` ``), menos legibles e imposibles de anidar fácilmente.

## Aritmética

Bash no realiza cálculos de forma nativa con cadenas; se necesita un contexto aritmético explícito:

```bash
a=5
b=3

echo $((a + b))   # 8
echo $((a * b))   # 15
echo $((a / b))   # 1 -> solo división entera; Bash no admite decimales
```

## Variables especiales

| Variable | Contenido |
|---|---|
| `$0` | Nombre del script que se está ejecutando |
| `$1`, `$2`, ... | Argumentos posicionales pasados al script o a la función |
| `$@` | Todos los argumentos, cada uno como una palabra separada |
| `$#` | Número de argumentos recibidos |
| `$?` | Código de salida del último comando ejecutado (`0` = éxito) |
| `$$` | PID del script que se está ejecutando |

```bash
#!/bin/bash
echo "Script : $0"
echo "Premier argument : $1"
echo "Nombre d'arguments : $#"

ls /ruta/inexistant
echo "Code de sortie : $?"  # no nulo, ya que el comando anterior ha fallado
```

## Variables locales en una función

Por defecto, una variable declarada en una función sigue siendo **global** (visible en todas partes tras su primera llamada); sin embargo, «`local`» restringe su ámbito a la función actual, lo que evita efectos secundarios inesperados:

```bash
compter() {
    local total=0   # Visible únicamente dentro de la función contar()
    total=$((total + 1))
    echo $total
}

compter
echo "$total"  # vacío: «total» no existe fuera de la función
```

Consulta también el capítulo sobre funciones y el de variables de entorno (`export`) para compartir un valor con los procesos hijos.
