---
order: 4
---

# Condiciones

Bash no cuenta con operadores de comparación integrados en el lenguaje, como ocurre en PHP o en C; las comprobaciones se basan en **comandos** (`test`, `[`, `[[`) cuyo código de salida (`$?`) determina si la condición es verdadera (`0`) o falsa (distinta de cero).

## `if` / `then` / `elif` / `else` / `fi`

```bash
edad=18

if [ $edad -ge 18 ]; then
    echo "Vous êtes majeur."
else
    echo "Vous êtes mineur."
fi
```

- `if` En realidad, evalúa el **código de salida** del comando que le sigue (en este caso, `[ $edad -ge 18 ]`); `[` es un comando real (a menudo un enlace a `/usr/bin/test`), no un símbolo del lenguaje.
- `fi` («`if`» al revés) cierra el bloque, tal y como lo haría «`endif`» en otros lenguajes.

## `[ ]` vs `[[ ]]`

```bash
[[ $edad -ge 18 && $edad -lt 65 ]]  # [[ ]] : sintaxis extendida de Bash, && y || directamente utilizables
[ $edad -ge 18 ] && [ $edad -lt 65 ]  # [ ]: POSIX, requiere combinar dos pruebas independientes
```

`[[ ]]` (específica para Bash, no compatible con un e`sh`o estrictamente POSIX) admite `&&` / `||` directamente en su interior, gestiona mejor las variables no definidas y permite el filtrado por patrón (`[[ $número == J* ]]`).

## Comparar números

```bash
if [ $edad -eq 18 ]; then echo "Exactement 18"; fi
```

| Operador | Significado |
|---|---|
| `-eq` | Igual |
| `-ne` | Varios |
| `-lt` | Inferior |
| `-le` | Menor o igual que |
| `-gt` | Superior |
| `-ge` | Igual o superior a |

> **Nota:** `==` y `!=` también funcionan en `[[ ]]`, pero solo para comparar **cadenas**. Si utilizas `==` con números dentro de `[ ]` clásico, los valores se comparan como texto, no numéricamente (`"10" < "9"` textualmente, pero `10 -gt 9` numéricamente).

## Comparar cadenas

```bash
número="Jean"

if [ "$número" == "Jean" ]; then
    echo "Bonjour Jean"
fi

if [ -z "$número" ]; then
    echo "nom est vide"
fi
```

| Operador | Significado |
|---|---|
| `==` / `=` | Comparación de cadenas |
| `!=` | Diferencia entre cadenas |
| `-z "$str"` | Verdadero si la cadena está vacía |
| `-n "$str"` | Verdadero si la cadena no está vacía |

## Probar archivos

```bash
if [ -f "config.php" ]; then
    echo "Le fichier existe"
fi

if [ -d "/var/www" ]; then
    echo "Le dossier existe"
fi
```

| Operador | Verdadero si... |
|---|---|
| `-f ruta` | ...es un archivo que ya existe |
| `-d ruta` | ...es una carpeta ya existente |
| `-e ruta` | ...existe algo en esa ruta (archivo o carpeta) |
| `-x ruta` | ...el archivo es ejecutable |
| `-r` / `-w` | ...el archivo es de lectura y escritura |

## Combinar condiciones

```bash
if [[ -f "config.php" && -r "config.php" ]]; then
    echo "Le fichier existe et est lisible"
fi
```

## El `case` (equivalente a `switch`)

```bash
jour="mer"

case $jour in
    lun|mar|mer|jeu|ven)
        echo "Jour de semaine"
        ;;
    sam|dim)
        echo "Week-end"
        ;;
    *)
        echo "Jour inconnu"
        ;;
esac
```

`|` separa varios motivos dentro de un mismo bloque, `*)` recoge todo lo demás (equivalente al «`default`» de un «`switch`»), y `;;` marca el final de cada bloque.
