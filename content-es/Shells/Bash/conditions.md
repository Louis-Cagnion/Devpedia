---
order: 5
---

# Las condiciones

Bash no tiene operadores de comparación integrados en el lenguaje como en [PHP](/?c=langages-de-programmation&s=php&p=conditions) o en [C](/?c=langages-de-programmation&s=c&p=conditions): las pruebas se apoyan en **comandos** (`test`, `[`, `[[`) cuyo código de salida (`$?`) determina si la condición es verdadera (`0`) o falsa (distinto de cero).

## `if` / `then` / `elif` / `else` / `fi`

```bash
edad=18

if [ $edad -ge 18 ]; then
    echo "Eres mayor de edad."
else
    echo "Eres menor de edad."
fi
```

- `if` evalúa en realidad el **código de salida** del comando que le sigue (aquí, `[ $edad -ge 18 ]`): `[` es un comando real (a menudo un enlace a `/usr/bin/test`), no un símbolo del lenguaje.
- `fi` (`if` al revés) cierra el bloque, como lo haría `endif` en otros lenguajes.

## `[ ]` vs `[[ ]]`

```bash
[[ $edad -ge 18 && $edad -lt 65 ]]    # [[ ]]: sintaxis extendida de Bash, && y || directamente utilizables
[ $edad -ge 18 ] && [ $edad -lt 65 ]  # [ ]: POSIX, necesita combinar dos pruebas separadas
```

`[[ ]]` (específico de Bash, no portable a un `sh` estrictamente POSIX) acepta `&&`/`||` directamente dentro, gestiona mejor las variables no definidas, y permite el filtrado por patrón (`[[ $nombre == J* ]]`).

## Comparar números

```bash
if [ $edad -eq 18 ]; then echo "Exactamente 18"; fi
```

| Operador | Significado |
|---|---|
| `-eq` | Igual |
| `-ne` | Distinto |
| `-lt` | Inferior |
| `-le` | Inferior o igual |
| `-gt` | Superior |
| `-ge` | Superior o igual |

> **Nota:** `==` y `!=` también funcionan en `[[ ]]`, pero únicamente para comparar **cadenas**. Usar `==` con números dentro de `[ ]` clásico compara los valores como texto, no numéricamente (`"10" < "9"` textualmente, pero `10 -gt 9` numéricamente).

## Comparar cadenas

```bash
nombre="Juan"

if [ "$nombre" == "Juan" ]; then
    echo "Hola Juan"
fi

if [ -z "$nombre" ]; then
    echo "nombre está vacío"
fi
```

| Operador | Significado |
|---|---|
| `==` / `=` | Igualdad de cadenas |
| `!=` | Diferencia de cadenas |
| `-z "$str"` | Verdadero si la cadena está vacía |
| `-n "$str"` | Verdadero si la cadena no está vacía |

## Probar archivos

```bash
if [ -f "config.php" ]; then
    echo "El archivo existe"
fi

if [ -d "/var/www" ]; then
    echo "La carpeta existe"
fi
```

| Operador | Verdadero si... |
|---|---|
| `-f ruta` | ...es un archivo existente |
| `-d ruta` | ...es una carpeta existente |
| `-e ruta` | ...existe algo en esa ruta (archivo o carpeta) |
| `-x ruta` | ...el archivo es ejecutable |
| `-r` / `-w` | ...el archivo es legible / se puede escribir en él |

## Combinar condiciones

```bash
if [[ -f "config.php" && -r "config.php" ]]; then
    echo "El archivo existe y es legible"
fi
```

## El `case` (equivalente a `switch`)

```bash
dia="mie"

case $dia in
    lun|mar|mie|jue|vie)
        echo "Día laborable"
        ;;
    sab|dom)
        echo "Fin de semana"
        ;;
    *)
        echo "Día desconocido"
        ;;
esac
```

`|` separa varios patrones para un mismo bloque, `*)` captura todo el resto (equivalente al `default` de un `switch`), y `;;` marca el final de cada bloque.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Bash no tiene operadores de comparación integrados en el lenguaje: `if` evalúa el código de salida de un comando (`test`, `[`, `[[`). `[[ ]]` (Bash) es más permisivo que `[ ]` (POSIX). |
| **Herramientas utilizables** | Operadores numéricos (`-eq`, `-lt`...), operadores de cadenas (`==`, `-z`, `-n`), pruebas de archivos (`-f`, `-d`, `-e`), `case`. |
| **Trampas a evitar** | Usar `==` en `[ ]` clásico pensando comparar números: la comparación se hace como texto, no numéricamente. |
| **Buenas prácticas** | Preferir `[[ ]]` a `[ ]` en Bash (gestiona mejor las variables no definidas, `&&`/`\|\|` directos) salvo necesidad de portabilidad estricta hacia `sh`. |
