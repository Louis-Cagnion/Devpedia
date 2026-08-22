---
order: 10
---

# Procesamiento de texto (grep, sed, awk...)

Gran parte de la potencia de la [terminal Unix](/?c=shells&s=bash&p=scripts-et-shebang) viene de un puñado de herramientas especializadas en el procesamiento de texto, diseñadas para combinarse entre sí vía [pipes](/?c=shells&s=bash&p=redirections-et-pipes). Este capítulo presenta las más usadas en el día a día.

## `grep`: buscar texto

```bash
grep "error" archivo.log             # muestra las líneas que contienen "error"
grep -i "error" archivo.log          # insensible a mayúsculas/minúsculas (-i)
grep -v "error" archivo.log          # inverso: muestra las líneas que NO contienen "error"
grep -r "TODO" .                     # búsqueda recursiva en todos los archivos de una carpeta
grep -n "error" archivo.log          # también muestra el número de línea
grep -c "error" archivo.log          # cuenta el número de líneas correspondientes, sin mostrarlas
grep -E "error|warning" archivo.log  # -E activa las regex extendidas (cf. capítulo sobre regex)
grep -l "TODO" *.md                  # muestra solo los NOMBRES de los archivos que contienen el patrón
grep -q "TODO" *.md                  # no muestra nada: sirve únicamente para probar la presencia (ver más abajo)
```

Como muchos comandos Unix, estas banderas son iniciales de palabras en inglés más que letras arbitrarias: `-i` = *ignore case*, `-v` = *invert*, `-r` = *recursive*, `-n` = *line number*, `-c` = *count*, `-E` = *extended (regex)*, `-l` = *files with matches (list)*, `-q` = *quiet*. Una vez conocidas estas palabras, recordar la bandera se vuelve natural: este principio se repite en la mayoría de los comandos de este capítulo y del siguiente.

Las banderas se combinan, a veces con interacciones que conviene conocer: `grep -rln "patron" *.md` acumula recursivo + lista de archivos + número de línea, pero `-l` **prevalece sobre `-n`** (no se puede mostrar un número de línea cuando solo se muestran nombres de archivo). La bandera ignorada no provoca ningún aviso.

### Buscar varios patrones: `\|` o `-E`

`grep` usa por defecto las regex **básicas** (BRE), en las que la alternancia debe escaparse. Con `-E` (regex extendidas), se escribe de forma natural:

```bash
grep "error\|warning" archivo.log    # BRE: la alternancia se escribe \|
grep -E "error|warning" archivo.log  # ERE: más legible, preferible
```

Un `|` sin escapar sin `-E` se busca **literalmente**: `grep "a|b"` busca la cadena `a|b`, y por tanto no encuentra nada la mayoría de las veces, sin error ni aviso. Es una trampa clásica. Ver el capítulo [La regex](/?c=domain-specific-languages-dsl&p=regex) para la diferencia BRE/ERE.

### El código de retorno de `grep`

`grep` no sirve solo para mostrar texto: su **código de salida** responde a la pregunta "¿encontraste algo?".

| Código | Significado |
|---|---|
| `0` | al menos una coincidencia encontrada |
| `1` | ninguna coincidencia (esto **no** es un error) |
| `2` | un error real (archivo ilegible, patrón inválido) |

Esto es lo que permite encadenarlo con `&&` o `||` (ver [Redirecciones y pipes](/?c=shells&s=bash&p=redirections-et-pipes)):

```bash
grep -rl "patron" *.md || echo "ausente"  # mensaje de repliegue si no se encuentra nada
grep -q "patron" f.txt && procesar f.txt  # solo procesa el archivo si contiene el patrón
```

Con `-q`, `grep` se detiene en la primera coincidencia y no muestra nada: es la forma a priorizar cuando solo importa el resultado de la prueba, en particular en archivos grandes.

> Este código de retorno `1` explica un comportamiento desconcertante bajo `set -e`: un `grep` que no encuentra nada hace fallar todo un script. El remedio habitual es `grep patron archivo || true`.

> **`grep` vs `pgrep`**: a pesar del nombre parecido, son dos comandos independientes que no buscan en lo mismo. `grep` busca un patrón en **texto** (archivo, salida de un comando...). `pgrep` (*process grep*, ver [La gestión de procesos](/?c=shells&s=bash&p=gestion-des-processus)) busca un patrón en la **lista de procesos en curso** y devuelve PID, no líneas de texto: `ps aux | grep patron` y `pgrep patron` responden por lo demás casi a la misma pregunta, pasando por dos caminos diferentes.

## `sed`: buscar y reemplazar

`sed` (*stream editor*) lee el texto **una línea a la vez** y aplica a cada una uno o varios comandos de edición, sin cargar nunca todo el archivo en memoria. Por defecto, no modifica nada en disco: muestra el resultado en la salida estándar, línea por línea, sobre la marcha.

Un comando `sed` se descompone en dos partes: una **dirección** opcional (qué líneas afectar) y un **comando** a aplicarles.

```bash
sed 's/antiguo/nuevo/' archivo.txt     # sin dirección -> el comando se aplica a TODAS las líneas
sed '3s/antiguo/nuevo/' archivo.txt    # dirección "3" -> solo la línea 3
sed '2,4s/antiguo/nuevo/' archivo.txt  # dirección "2,4" -> únicamente las líneas 2 a 4
```

El comando más usado es `s/patron/reemplazo/` (la "s" de *substitute*): busca `patron` (una [regex](/?c=domain-specific-languages-dsl&p=regex)) y lo reemplaza por `reemplazo`. Por defecto, `sed` solo reemplaza la **primera** aparición encontrada en cada línea, de ahí la bandera `g` para tratar también las siguientes:

```bash
sed 's/antiguo/nuevo/' archivo.txt      # reemplaza la 1ª aparición por línea, muestra el resultado
sed 's/antiguo/nuevo/g' archivo.txt     # 'g' (global): reemplaza TODAS las apariciones de cada línea
sed -i 's/antiguo/nuevo/g' archivo.txt  # -i: modifica el archivo directamente (in place), sin mostrar nada
```

El otro comando frecuente es `p` (*print*), que muestra explícitamente una línea; combinado con `-n` (que desactiva la visualización automática de cada línea procesada), permite mostrar solo ciertas líneas en lugar de todo el archivo:

```bash
sed -n '2,4p' archivo.txt   # -n: no muestra NADA por defecto; '2,4p': muestra explícitamente las líneas 2 a 4
```

> **Nota:** sin `-n`, `sed '2,4p'` mostraría cada línea del archivo una vez (comportamiento por defecto), y las líneas 2 a 4 una segunda vez (a causa del `p`): `-n` y `p` funcionan casi siempre en pareja.

## `awk`: procesar texto en columnas

`awk` divide automáticamente cada línea en campos (`$1`, `$2`...), separados por defecto por espacios/tabulaciones:

```bash
echo "Juan Perez 25" | awk '{ print $1 }'      # Juan -> primer campo
echo "Juan Perez 25" | awk '{ print $3, $1 }'  # 25 Juan

awk -F ',' '{ print $2 }' datos.csv    # -F ',': cambia el separador de campo por una coma
```

`$0` designa la línea entera, `$NF` el **último** campo de la línea (`NF` = *Number of Fields*):

```bash
awk '{ print $NF }' archivo.txt   # muestra la última palabra de cada línea
```

## `cut`: extraer columnas de forma sencilla

Más limitado que `awk`, pero suficiente para casos simples:

```bash
cut -d ',' -f 2 datos.csv    # -d: separador, -f: número del campo a extraer
cut -c 1-5 archivo.txt       # extrae los caracteres 1 a 5 de cada línea
```

## `sort` y `uniq`: ordenar y eliminar duplicados

```bash
sort archivo.txt            # orden alfabético
sort -n numeros.txt         # orden numérico (indispensable para números, si no orden por cadena)
sort -r archivo.txt         # orden descendente
sort archivo.txt | uniq     # elimina las líneas duplicadas CONSECUTIVAS solamente
sort archivo.txt | uniq -c  # cuenta las apariciones de cada línea
```

> **Nota:** `uniq` solo detecta duplicados **adyacentes**: por eso casi siempre se combina con `sort` antes, que agrupa las líneas idénticas.

## `wc`: contar

```bash
wc -l archivo.txt  # número de líneas
wc -w archivo.txt  # número de palabras
wc -c archivo.txt  # número de bytes
```

## Combinar estas herramientas

```bash
grep "404" access.log | awk '{ print $1 }' | sort | uniq -c | sort -rn
# 1) conserva las líneas de error 404
# 2) extrae la dirección IP (1er campo)
# 3) ordena para agrupar las IP idénticas
# 4) cuenta las apariciones de cada IP
# 5) ordena por número de apariciones descendente -> las IP más frecuentes primero
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `grep` busca, `sed` reemplaza, `awk` procesa por columnas: diseñados para combinarse vía pipes en lugar de usarse aislados. |
| **Herramientas utilizables** | `grep -i`/`-v`/`-r`/`-E`, `sed 's/.../.../'`, `awk '{ print $1 }'`, `cut`, `sort`/`uniq`, `wc`. |
| **Trampas a evitar** | Un `\|` sin escapar y sin `-E` en `grep` se busca literalmente, sin error ni aviso; `uniq` sin `sort` previo solo detecta duplicados adyacentes. |
| **Buenas prácticas** | Combinar `sort` antes de `uniq` para deduplicar correctamente; usar `grep -q` en lugar de `grep` simple cuando solo importa el resultado de la prueba (encontrado/no encontrado). |
