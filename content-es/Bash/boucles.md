---
order: 5
---

# Los bucles

Bash ofrece tres estructuras de bucle (`for`, `while`, `until`), que se utilizan tanto para repetir comandos como para recorrer listas de archivos, líneas o resultados de comandos.

## El bucle «`for`» (recorrido por una lista)

```bash
for fruta in pomme banane cerise; do
    echo "$fruta"
done
```

Recorrer los archivos de una carpeta mediante el uso de comodines (véase el capítulo sobre la expansión):

```bash
for archivo in *.txt; do
    echo "Traitement de $archivo"
done
```

Recorrer un rango de números:

```bash
for i in {1..5}; do
    echo "$i"
done
```

## El bucle «`for`» al estilo C

```bash
for ((i = 0; i < 5; i++)); do
    echo "$i"
done
```

## El bucle «`while`»

El bloque se ejecuta mientras la condición siga siendo verdadera (se comprueba **antes de** cada iteración):

```bash
i=0

while [ $i -lt 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

### Leer un archivo línea por línea

La combinación más habitual en scripts de Bash para procesar un archivo de texto:

```bash
while read -r línea; do
    echo "Ligne lue : $línea"
done < archivo.txt
```

- `read -r` Lee una línea de la entrada estándar en la variable `línea` en cada iteración (el `-r` impide que se interpreten los caracteres `\` como caracteres de escape, que es casi siempre lo que se desea).
- `< archivo.txt` Redirige el contenido del archivo a la entrada estándar de todo el bucle (véase el capítulo sobre redirecciones).

## El bucle «`until`»

Simétrico al de «`while`»: el bloque se ejecuta mientras la condición siga siendo **falsa**, hasta que pase a ser verdadera:

```bash
i=0

until [ $i -ge 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

`until [ $i -ge 5 ]` equivale exactamente a «`while [ $i -lt 5 ]`»; la elección entre ambas opciones es una cuestión de legibilidad, dependiendo de la condición que se quiera expresar de forma natural.

## `break` y `continue`

Funcionan como en la mayoría de los lenguajes:

```bash
for i in {1..10}; do
    if [ $i -eq 5 ]; then
        break
    fi
    if [ $((i % 2)) -eq 0 ]; then
        continue
    fi
    echo "$i"
done
```
