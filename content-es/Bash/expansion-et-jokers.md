---
order: 7
---

# Expansión y comodines (globbing)

Antes de ejecutar un comando, Bash sustituye ciertos patrones que contiene por su valor real: variables (`$número`, véase el capítulo dedicado a ello), pero también patrones de archivos (*globbing*) y expansiones de llaves. Comprender este paso (invisible pero sistemático) explica por qué algunos comandos se comportan de forma diferente según las comillas que se utilicen.

## El «globbing»: `*`, `?`, `[]`

```bash
ls *.txt        # todos los archivos que terminen en .txt
ls archivo?.txt  # archivo1.txt, archivoA.txt... («?» = exactamente 1 carácter, cualquiera)
ls archivo[123].txt  # solo archivo1.txt, archivo2.txt o archivo3.txt
ls archivo[a-z].txt  # una sola letra minúscula en esa posición
```

| Motivo | Significado |
|---|---|
| `*` | Cualquier secuencia de caracteres (incluida la cadena vacía) |
| `?` | Exactamente un carácter, cualquiera |
| `[abc]` | Un solo carácter de entre `a`, `b` o `c` |
| `[a-z]` | Un solo carácter en este rango |
| `[^abc]` | Un único carácter que no es ni `a`, ni `b`, ni `c` |

> **Nota:** no se trata de una expresión regular (véase el capítulo dedicado a las expresiones regulares); el «globbing» es más sencillo y propio de la interpretación de los nombres de archivo por parte del propio shell, incluso antes de que se ejecute el comando.

## Atención: ¿qué ocurre si no hay ningún archivo que coincida?

```bash
echo *.xyz
# Si no existe ningún archivo .xyz, Bash muestra literalmente «*.xyz» (el patrón no se sustituye).
```

Es una fuente habitual de errores: un script que da por hecho que `*.xyz` siempre hace referencia a una lista de archivos reales puede recibir el texto sin formato `*.xyz` como único «nombre de archivo» si la carpeta no contiene nada de ese tipo.

## La expansión de llaves (*brace expansion*)

Genera varias cadenas a partir de un único patrón, **antes de realizar** cualquier búsqueda de archivos reales en el disco:

```bash
echo archivo{1,2,3}.txt
# archivo1.txt archivo2.txt archivo3.txt

mkdir -p projet/{src,tests,docs}
# Crea las tres carpetas con un solo comando

echo {1..5}
# 1 2 3 4 5

echo {a..e}
# a b c d e
```

> **Nota:** a diferencia del globbing, la expansión de las llaves no depende de ningún archivo existente — `archivo{1,2,3}.txt` siempre genera estas tres cadenas, independientemente de si los archivos correspondientes existen o no.

## La expansión de la tilde (`~`)

```bash
cd ~          # equivalente a cd $HOME
cd ~/projets   # equivalente a cd $HOME/proyectos
```

## Evitar la expansión: las comillas

```bash
echo *.txt      # sustituida por la lista real de archivos .txt
echo "*.txt"     # muestra literalmente *.txt -> las comillas dobles desactivan el globbing
echo '*.txt'     # mismo resultado, las comillas simples son aún más estrictas (también desactivan $variable)
```

Véase también el capítulo sobre variables para conocer la diferencia entre comillas simples y dobles en relación con la interpretación de `$variable`.
