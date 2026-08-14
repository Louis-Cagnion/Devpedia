---
order: 9
---

# Procesamiento de texto (grep, sed, awk...)

Gran parte de la potencia del terminal Unix proviene de un puñado de herramientas especializadas en el procesamiento de texto, diseñadas para combinarse entre sí mediante tuberías (véase el capítulo sobre redireccionamientos). Este capítulo presenta las más utilizadas en el día a día.

## `grep` : buscar texto

```bash
grep "erreur" archivo.log         # muestra las líneas que contienen «error»
grep -i "erreur" archivo.log      # insensible a mayúsculas y minúsculas (-i)
grep -v "erreur" archivo.log      # inverso: muestra las líneas que NO contienen «error»
grep -r "TODO" .                  # Búsqueda recursiva en todos los archivos de una carpeta
grep -n "erreur" archivo.log      # también muestra el número de línea
grep -c "erreur" archivo.log      # cuenta el número de líneas correspondientes, sin mostrarlas
grep -E "erreur|warning" archivo.log  # -E activa las expresiones regulares extendidas (véase el capítulo sobre expresiones regulares)
```

## `sed` : buscar y sustituir

```bash
sed 's/ancien/nouveau/' archivo.txt        # sustituye la primera aparición de cada línea y muestra el resultado
sed 's/ancien/nouveau/g' archivo.txt        # «g» (global): sustituye TODAS las apariciones de cada línea
sed -i 's/ancien/nouveau/g' archivo.txt     # -i: modifica el archivo directamente (in situ)
sed -n '2,4p' archivo.txt                    # solo muestra las líneas 2 a 4
```

> **Nota:** `sed` procesa el texto línea por línea y utiliza expresiones regulares (véase el capítulo dedicado a ellas) como patrón de búsqueda; `s/motif/remplacement/` es su comando más utilizado («s» significa *«substituir»*).

## `awk` : tratamiento de texto en columnas

`awk` Divide automáticamente cada línea en campos (`$1`, `$2`...), separados por defecto por espacios o tabulaciones:

```bash
echo "Jean Dupont 25" | awk '{ print $1 }'        # Jean -> primer campo
echo "Jean Dupont 25" | awk '{ print $3, $1 }'    # 25 de enero

awk -F ',' '{ print $2 }' datos.csv    # -F ',' : cambia el separador de campos por una coma
```

`$0` se refiere a toda la línea, `$NF` al **último** campo de la línea (`NF` = *Número de campos*):

```bash
awk '{ print $NF }' archivo.txt   # muestra la última palabra de cada línea
```

## `cut` : extraer columnas de forma sencilla

Más limitada que `awk`, pero suficiente para casos sencillos:

```bash
cut -d ',' -f 2 datos.csv       # -d: separador, -f: número del campo que se va a extraer
cut -c 1-5 archivo.txt            # extrae los caracteres del 1 al 5 de cada línea
```

## `sort` y `uniq`: ordenar y eliminar duplicados

```bash
sort archivo.txt                  # orden alfabético
sort -n números.txt                # ordenación numérica (imprescindible para números; en caso contrario, ordenación por cadena)
sort -r archivo.txt                 # orden descendente
sort archivo.txt | uniq            # Elimina únicamente las líneas duplicadas CONSECUTIVAS
sort archivo.txt | uniq -c          # cuenta el número de veces que aparece cada línea
```

> **Nota:** `uniq` solo detecta duplicados **adyacentes**; por eso casi siempre se combina con `sort` antes, que agrupa las líneas idénticas.

## `wc` : contar

```bash
wc -l archivo.txt   # número de líneas
wc -w archivo.txt    # número de palabras
wc -c archivo.txt    # número de bytes
```

## Combinar estas herramientas

```bash
grep "404" access.log | awk '{ print $1 }' | sort | uniq -c | sort -rn
# 1) mantiene las líneas de error 404
# 2) extrae la dirección IP (primer campo)
# 3) ordena para agrupar las direcciones IP idénticas
# 4) cuenta las apariciones de cada IP
# 5) ordenar por número de apariciones en orden descendente -> las direcciones IP más frecuentes primero
```
