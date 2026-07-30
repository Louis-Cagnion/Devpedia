---
order: 8
---

# Redireccionamientos y pipes

Cada comando de Unix se comunica, por defecto, a través de tres flujos: la entrada** estándar** (`stdin`, lo que lee), la **salida estándar** (`stdout`, lo que muestra normalmente) y la **salida de error** (`stderr`, adonde van los mensajes de error). Las redirecciones y las tuberías permiten redirigir estos flujos a un archivo o a otro comando, en lugar de a la terminal.

> **Nota:** estos «flujos» son, en realidad, **descriptores de archivo** numerados (`0`, `1`, `2`); consulta el capítulo sobre llamadas al sistema y descriptores de archivo (apartado C) para saber qué ocurre realmente a nivel del sistema operativo cuando se redirigen.

## Redirigir la salida a un archivo

```bash
echo "Bonjour" > archivo.txt    # Sobrescribe el archivo.txt (o lo crea) con este contenido
echo "Encore" >> archivo.txt    # Añade al final del archivo .txt, sin sobrescribir
```

> **Nota:** `>` sobrescribe sin aviso el contenido existente del archivo de destino; un error habitual es utilizar `>` cuando se quería `>>`, con lo que se pierde el contenido anterior sin previo aviso.

## Redirigir la entrada desde un archivo

```bash
sort < lista.txt   # lee el archivo «liste.txt» como entrada estándar de «sort», en lugar de esperar una entrada del teclado
```

## Redirigir la salida de errores

Los flujos están numerados: `0` = entrada estándar, `1` = salida estándar, `2` = salida de error.

```bash
commande_qui_echoue 2> erreurs.log     # Solo la salida de error se registra en errores.log
commande 1> salida.log 2> erreurs.log  # Separa la salida normal y los errores en dos archivos
commande > tout.log 2>&1               # redirige stdout a todo.log, y LUEGO stderr al mismo destino que stdout
commande &> tout.log                    # Atajo de Bash equivalente a «> todo.log 2>&1»
```

> **Nota:** el orden es importante para `2>&1`. `2>&1 > archivo` no funciona como se espera: en ese momento, `2` sigue redirigiéndose al terminal (la salida estándar en ese momento), y solo `1` se redirige posteriormente a `archivo`. Hay que escribir `> archivo 2>&1`: primero redirigir `1` a `archivo` y, a continuación, hacer que `2` apunte al mismo destino que `1` **en ese preciso instante**.

## `/dev/null` : omitir una salida

Un archivo especial que «se traga» todo lo que se escribe en él, sin almacenar nada —útil para eliminar un flujo que no se necesita:

```bash
commande_bruyante > /dev/null 2>&1   # ignora cualquier salida normal Y cualquier error
```

## Las «pipes» (`|`): encadenar comandos

Una tubería conecta la salida estándar de un comando con la entrada estándar del siguiente:

```bash
ls -l | grep ".txt"          # solo conserva las líneas que contengan «.txt»
grep "404" access.log | wc -l   # cuenta las líneas que contienen «404» en el archivo
ps aux | sort -k 3 -nr | head -5      # Los 5 procesos que más CPU consumen
```

Cada comando de una tubería se ejecuta simultáneamente, de modo que la salida de uno alimenta la entrada del siguiente a medida que avanza el proceso; no se trata de una ejecución secuencial con almacenamiento intermedio.

## `tee` : redirigir sin alterar la visualización

`tee` Escribe el resultado tanto en un archivo **como** en la salida estándar (útil para ver el resultado mientras se guarda):

```bash
ls -l | tee resultats.txt   # muestra el resultado en pantalla Y lo guarda en resultats.txt
```

## Resumen de símbolos

| Símbolo | Efecto |
|---|---|
| `>` | Redirige la salida estándar, sobrescribe el archivo |
| `>>` | Redirige la salida estándar y añade al final |
| `<` | Redirige la entrada estándar desde un archivo |
| `2>` | Redirige la salida de errores |
| `&>` | Redirige la salida estándar y de error al mismo destino |
| `\|` | Conecta la salida de un comando con la entrada del siguiente |
