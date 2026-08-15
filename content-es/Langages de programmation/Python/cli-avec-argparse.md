---
order: 14
---

# Construir una CLI con `argparse`

Una **CLI** (*Command-Line Interface*, interfaz de línea de comandos) es un programa que se pilota íntegramente con comandos escritos en una [terminal](/?c=bases-de-l-informatique&p=le-terminal), en lugar de con clics en una interfaz gráfica: `git`, `ls`, o el script `pdf_parser process informe.pdf --marca peugeot` de este capítulo son ejemplos. Un script Python lanzado así recibe sus argumentos en `sys.argv` (una simple lista de cadenas), exactamente como `$1`/`$2` en [Bash](/?c=shells&s=bash&p=scripts-et-shebang). Leerlos uno a uno a mano se vuelve rápidamente tedioso en cuanto hay que gestionar opciones, valores por defecto, o producir un mensaje de ayuda correcto. **`argparse`** (módulo de la biblioteca estándar) construye todo esto a partir de una descripción declarativa de los argumentos esperados.

## Argumentos posicionales y opcionales

```python
import argparse

parser = argparse.ArgumentParser(prog="conversor")
parser.add_argument("archivo", help="Ruta del archivo a convertir")        # posicional: obligatorio, identificado por su posición
parser.add_argument("--formato", default="json", help="Formato de salida")  # opcional: identificado por su nombre, "--" delante

args = parser.parse_args()
print(args.archivo, args.formato)
```

```bash
python conversor.py informe.csv                # archivo="informe.csv", formato="json" (valor por defecto)
python conversor.py informe.csv --formato=xml   # archivo="informe.csv", formato="xml"
```

| | Posicional | Opcional |
|---|---|---|
| Sintaxis de declaración | `add_argument("nombre")` | `add_argument("--nombre")` |
| Identificado por | Su posición en el comando | Su nombre, precedido de `--` |
| ¿Obligatorio por defecto? | Sí | No, salvo `required=True` explícito |
| Acceso en `args` | `args.nombre` | `args.nombre` (el `--` no aparece en el nombre del atributo) |

## Tipos, valores por defecto, banderas booleanas

```python
parser.add_argument("--repeticiones", type=int, default=1)  # convierte automáticamente la cadena recibida a int
parser.add_argument("--verboso", action="store_true")       # bandera booleana: presente -> True, ausente -> False

args = parser.parse_args(["--repeticiones", "3", "--verboso"])
print(args.repeticiones, args.verboso)   # 3 True
```

> **Trampa:** sin `type=int`, `args.repeticiones` sigue siendo una **cadena** (`"3"`), aunque "parezca" un número: `args.repeticiones * 2` daría `"33"` (repetición de cadena), no `6`.
>
> **Buena práctica:** precisar siempre `type=` en cuanto un argumento espera algo distinto de una cadena bruta; `argparse` lanza él mismo un error claro si la conversión falla (ej. `--repeticiones abc`), en lugar de dejar que una conversión manual falle más adelante en el programa con un mensaje confuso.

## La ayuda generada automáticamente

`argparse` construye `--help` sin escribir nada más, a partir de los `help=` proporcionados en cada argumento:

```bash
python conversor.py --help
# usage: conversor [-h] [--formato FORMATO] archivo
#
# positional arguments:
#   archivo             Ruta del archivo a convertir
#
# options:
#   -h, --help          show this help message and exit
#   --formato FORMATO   Formato de salida
```

> **Buena práctica:** proporcionar siempre `help=` en cada argumento, incluso los que parecen evidentes en el momento de escribirlos: es ese texto el que aparecerá para un usuario que descubra la herramienta meses después, sin el contexto que el autor tenía en mente.

## Los subcomandos: varias acciones en un solo programa

Una herramienta que ofrece varias acciones distintas (`git commit`, `git push`, [`docker run`](/?c=docker&p=commandes-essentielles)...) las agrupa en **subcomandos**, cada uno con sus propios argumentos. `add_subparsers` construye esta división:

```python
import argparse

parser = argparse.ArgumentParser(prog="pdf_parser")
subcomandos = parser.add_subparsers(dest="command", required=True)

process_parser = subcomandos.add_parser("process", help="Procesa un PDF")
process_parser.add_argument("pdf_path", help="Ruta hacia el PDF a procesar")
process_parser.add_argument("--marca", required=True, help="Identificador de la marca")

args = parser.parse_args()

if args.command == "process":
    print(f"Procesando {args.pdf_path} para la marca {args.marca}")
```

```bash
pdf_parser process informe.pdf --marca peugeot
# Procesando informe.pdf para la marca peugeot

pdf_parser process informe.pdf
# error: the following arguments are required: --marca
```

- `dest="command"` nombra el atributo (`args.command`) que contendrá el nombre del subcomando efectivamente usado (`"process"` aquí), para poder probarlo después con un `if`.
- Cada subcomando creado por `add_parser(...)` es un `ArgumentParser` de pleno derecho: tiene sus propios argumentos, independientes de los de los demás subcomandos.

> **Trampa:** omitir `required=True` en `add_subparsers()`. Un programa lanzado sin ningún subcomando deja entonces `args.command` en `None`, sin que `argparse` mismo lance ningún error: el programa sigue ejecutándose, potencialmente hasta un punto mucho más adelante donde la ausencia de comando termina causando un fallo confuso.
>
> **Buena práctica:** declarar sistemáticamente `required=True` en `add_subparsers()` en cuanto al menos un subcomando sea obligatorio para que el programa tenga sentido; `argparse` se niega entonces a arrancar sin comando precisado, con un mensaje de error explícito en lugar de un fallo silencioso más adelante.

## Hacer una CLI testeable: nunca leer `sys.argv` fijo

`parser.parse_args()` sin argumento lee `sys.argv` directamente: práctico para el uso real, pero imposible de testear unitariamente sin lanzar un subproceso real. El remedio: aceptar los argumentos como parámetro, con `None` por defecto para recurrir a `sys.argv` solo en uso real:

```python
import sys

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="pdf_parser")
    # ... declaración de los argumentos ...
    args = parser.parse_args(argv)   # argv=None -> argparse lee sys.argv él mismo; si no, usa la lista proporcionada
    # ... lógica del programa ...
    return 0

if __name__ == "__main__":
    sys.exit(main())
```

Un test puede entonces llamar a `main(["process", "test.pdf", "--marca", "peugeot"])` directamente, sin invocar nunca una terminal real, y verificar el valor entero devuelto (`0` = éxito, otro valor = fallo) exactamente como el [código de salida](/?c=shells&s=bash&p=scripts-et-shebang) de un script Bash.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `argparse` construye un analizador de argumentos (posicionales, opcionales, tipados) a partir de una descripción declarativa, con `--help` generado automáticamente. `add_subparsers` agrupa varias acciones distintas en un solo programa. |
| **Herramientas utilizables** | `add_argument` (`type=`, `default=`, `action="store_true"`, `required=`), `add_subparsers(dest=..., required=True)`. |
| **Trampas a evitar** | Olvidar `type=` en un argumento numérico (sigue siendo una cadena). Omitir `required=True` en `add_subparsers()`: `args.command` puede quedar en `None` sin error inmediato. |
| **Buenas prácticas** | Proporcionar siempre `help=` en cada argumento. Hacer `main()` testeable aceptando `argv` como parámetro en lugar de leer `sys.argv` directamente. |
