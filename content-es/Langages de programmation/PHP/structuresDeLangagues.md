---
order: 5
---

# Las estructuras del lenguaje

Una **construcción del lenguaje** (*language construct*) es una instrucción integrada directamente en el núcleo del lenguaje PHP. A diferencia de una función, no se define mediante código, sino que forma parte de la propia sintaxis del lenguaje, al igual que `if`, `for` o `;`.

## Diferencias con respecto a una función

Esta particularidad confiere a las estructuras del lenguaje ciertas libertades de escritura de las que carece una función clásica:

```php
<?php
    // Los paréntesis son opcionales.
    include "bienvenue.php";
    include("bienvenue.php"); // equivalente

    // echo puede aceptar varios valores separados por comas
    echo "Bonjour ", $prenom, " !";

    // print siempre devuelve 1, por lo que puede utilizarse en una expresión
    $resultado = print "Hello"; // muestra «Hello» y, a continuación, $resultado = 1
?>
```

Por el contrario, una función como `strlen()` siempre debe invocarse con sus paréntesis y no puede permitirse esas libertades.

## ¿Por qué existe esta distinción?

PHP procesa las estructuras del lenguaje en el momento del análisis del código (incluso antes de su ejecución), ya que influyen directamente en el desarrollo del script; por ejemplo, `include` inserta código en un lugar concreto, o `return` interrumpe la ejecución de una función. Por eso no se pueden manipular como si fueran simples funciones: no se pueden almacenar en una variable ni pasarlas como argumento de otra función.

```php
<?php
    $f = strlen;     // ❌ No funciona tal cual para las funciones, salvo a través de string/callable
    $f = "echo";     // ❌ No se puede llamar a «echo» así, no es una función.
?>
```

## Lista de las estructuras de lenguaje más habituales

| Estructura | Función |
|---|---|
| `echo` | Muestra uno o varios valores |
| `print` | Muestra un valor, siempre devuelve `1` |
| `include` / `require` | Incluye el contenido de otro archivo PHP |
| `if` / `else` / `elseif` | Ejecuta código en función de una condición |
| `for` / `foreach` / `while` / `do-while` | Repite un bloque de código |
| `switch` | Compara un valor con varios casos posibles |
| `return` | Devuelve un valor y detiene la ejecución de una función |
| `break` / `continue` | Detiene o pasa a la siguiente iteración de un bucle |
| `isset()` / `unset()` | Comprueba si existe una variable / elimina una variable |
| `list()` | Asigna varios valores a varias variables a la vez a partir de una matriz |

> **Nota:** ya te has encontrado con la mayoría de estas estructuras en los capítulos anteriores (condiciones, bucles, variables...) sin que se mencionara explícitamente este concepto.
