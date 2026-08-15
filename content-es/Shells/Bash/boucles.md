---
order: 6
---

# Los bucles

Bash ofrece tres estructuras de bucle (`for`, `while`, `until`), usadas tanto para repetir comandos como para recorrer listas de archivos, líneas o resultados de comandos.

## El bucle `for` (recorrido de lista)

```bash
for fruta in manzana platano cereza; do
    echo "$fruta"
done
```

Recorrer los archivos de una carpeta gracias al [globbing](/?c=shells&s=bash&p=expansion-et-jokers):

```bash
for archivo in *.txt; do
    echo "Procesando $archivo"
done
```

Recorrer un rango de números:

```bash
for i in {1..5}; do
    echo "$i"
done
```

## El bucle `for` al estilo C

```bash
for ((i = 0; i < 5; i++)); do
    echo "$i"
done
```

## El bucle `while`

El bloque se ejecuta mientras la condición siga siendo verdadera (probada **antes** de cada vuelta):

```bash
i=0

while [ $i -lt 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

### Leer un archivo línea por línea

La combinación más frecuente en scripting Bash para procesar un archivo de texto:

```bash
while read -r linea; do
    echo "Línea leída: $linea"
done < archivo.txt
```

- `read -r` lee una línea de la entrada estándar en la variable `linea` en cada vuelta (`-r` impide la interpretación de los `\` como caracteres de escape, casi siempre lo que se quiere).
- `< archivo.txt` redirige el contenido del archivo a la entrada estándar de todo el bucle (ver [Redirecciones y pipes](/?c=shells&s=bash&p=redirections-et-pipes)).

## El bucle `until`

Simétrico de `while`: el bloque se ejecuta mientras la condición siga siendo **falsa**, hasta que se vuelva verdadera:

```bash
i=0

until [ $i -ge 5 ]; do
    echo "$i"
    i=$((i + 1))
done
```

`until [ $i -ge 5 ]` equivale exactamente a `while [ $i -lt 5 ]`: la elección entre ambos es una cuestión de legibilidad según la condición que se quiera expresar de forma natural.

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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `for` recorre una lista, archivos (globbing) o un rango de números; `while`/`until` repiten mientras una condición siga siendo verdadera/falsa. `while read -r linea` es la combinación estándar para leer un archivo línea por línea. |
| **Herramientas utilizables** | Expansión de llaves (`{1..5}`), `for` al estilo C, `break`/`continue`. |
| **Trampas a evitar** | Olvidar `-r` con `read`: sin él, los `\` se interpretan como caracteres de escape. |
| **Buenas prácticas** | Usar `while read -r linea; do ... done < archivo.txt` para procesar un archivo de texto línea por línea, en lugar de otro enfoque menos idiomático. |
