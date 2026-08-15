---
order: 8
---

# Expansión y comodines (globbing)

Antes de ejecutar un comando, Bash sustituye ciertos patrones que contiene por su valor real: [variables](/?c=shells&s=bash&p=variables) (`$nombre`), pero también patrones de archivos (*globbing*) y expansiones de llaves. Entender este paso (invisible pero sistemático) explica por qué algunos comandos se comportan de forma diferente según las comillas usadas.

## El globbing: `*`, `?`, `[]`

```bash
ls *.txt             # todos los archivos que terminan en .txt
ls archivo?.txt      # archivo1.txt, archivoA.txt... ('?' = exactamente 1 carácter, cualquiera)
ls archivo[123].txt  # solo archivo1.txt, archivo2.txt o archivo3.txt
ls archivo[a-z].txt  # una sola letra minúscula en esa posición
```

| Patrón | Significa |
|---|---|
| `*` | Cualquier secuencia de caracteres (incluida la vacía) |
| `?` | Exactamente un carácter, cualquiera |
| `[abc]` | Un solo carácter entre `a`, `b` o `c` |
| `[a-z]` | Un solo carácter en ese rango |
| `[^abc]` | Un solo carácter que no sea ni `a`, `b`, ni `c` |

> **Nota:** esto **no** es una [regex](/?c=domain-specific-languages-dsl&p=regex): el globbing es más simple, propio de la interpretación de los nombres de archivo por el propio shell, incluso antes de que el comando se lance.

## Atención: ¿qué pasa si ningún archivo coincide?

```bash
echo *.xyz
# si no existe ningún archivo .xyz, Bash muestra literalmente "*.xyz" (el patrón no se sustituye)
```

Es una fuente clásica de bugs: un script que supone que `*.xyz` siempre designa una lista de archivos reales puede recibir el texto plano `*.xyz` como único "nombre de archivo" si la carpeta no contiene nada de eso.

## La expansión de llaves (*brace expansion*)

Genera varias cadenas a partir de un único patrón, **antes** de cualquier búsqueda de archivos reales en el disco:

```bash
echo archivo{1,2,3}.txt
# archivo1.txt archivo2.txt archivo3.txt

mkdir -p proyecto/{src,tests,docs}
# crea las tres carpetas en un solo comando

echo {1..5}
# 1 2 3 4 5

echo {a..e}
# a b c d e
```

> **Nota:** a diferencia del globbing, la expansión de llaves no depende de ningún archivo existente: `archivo{1,2,3}.txt` siempre genera estas tres cadenas, existan o no los archivos correspondientes.

## La expansión de la tilde (`~`)

```bash
cd ~            # equivalente a cd $HOME
cd ~/proyectos  # equivalente a cd $HOME/proyectos
```

## Impedir la expansión: las comillas

```bash
echo *.txt    # sustituido por la lista real de archivos .txt
echo "*.txt"  # muestra literalmente *.txt -> las comillas dobles desactivan el globbing
echo '*.txt'  # mismo resultado, comillas simples aún más estrictas (también desactivan $variable)
```

Ver también [Las variables](/?c=shells&s=bash&p=variables) para la distinción comillas simples/dobles respecto a la interpretación de `$variable`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Antes de ejecutar un comando, Bash sustituye variables, patrones de archivos (globbing) y expansiones de llaves: un paso invisible pero sistemático. El globbing depende de los archivos realmente presentes; la expansión de llaves nunca depende de ellos. |
| **Herramientas utilizables** | `*`/`?`/`[abc]` (globbing), `{1,2,3}`/`{1..5}` (llaves), `~` (tilde). |
| **Trampas a evitar** | Un patrón de globbing que no coincide con ningún archivo se transmite literalmente al comando, sin error ni aviso. |
| **Buenas prácticas** | Rodear de comillas dobles toda variable que pueda contener un espacio o un carácter especial, para desactivar la división en palabras y el globbing no deseados. |
