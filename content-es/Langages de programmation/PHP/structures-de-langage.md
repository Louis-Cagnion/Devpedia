---
order: 5
---

# Las estructuras del lenguaje

Una **estructura del lenguaje** (*language construct*) es una instrucción integrada directamente en el núcleo del lenguaje PHP. A diferencia de una función, no se define mediante código: forma parte de la propia sintaxis del lenguaje, al igual que `if`, `for` o `;`.

## Diferencias con una función

Esta particularidad da a las estructuras del lenguaje ciertas libertades de escritura que una función clásica no tiene:

```php
<?php
    // Los paréntesis son opcionales
    include "bienvenida.php";
    include("bienvenida.php"); // equivalente

    // echo puede aceptar varios valores separados por comas
    echo "Hola ", $nombre, " !";

    // print siempre devuelve 1, por lo que puede usarse en una expresión
    $resultado = print "Hello"; // muestra "Hello", luego $resultado = 1
?>
```

En cambio, una función como `strlen()` siempre debe invocarse con sus paréntesis, y no puede permitirse esas libertades.

## ¿Por qué existe esta distinción?

PHP procesa las estructuras del lenguaje en el momento del análisis del código (incluso antes de su ejecución), porque influyen directamente en el desarrollo del script: por ejemplo, `include` inserta código en un lugar concreto, o `return` interrumpe la ejecución de una función. Por eso no se pueden manipular como simples funciones: no se pueden almacenar en una variable ni pasarlas como argumento de otra función.

```php
<?php
    $f = strlen;  // ❌ no funciona tal cual para las funciones, salvo vía string/callable
    $f = "echo";  // ❌ imposible llamar a echo así, no es una función
?>
```

## Lista de las estructuras del lenguaje más habituales

| Estructura | Función |
|---|---|
| `echo` | Muestra uno o varios valores |
| `print` | Muestra un valor, siempre devuelve `1` |
| `include` / `require` | Incluye el contenido de otro archivo PHP |
| `if` / `else` / `elseif` | Ejecuta código según una condición |
| `for` / `foreach` / `while` / `do-while` | Repite un bloque de código |
| `switch` | Compara un valor con varios casos posibles |
| `return` | Devuelve un valor y detiene la ejecución de una función |
| `break` / `continue` | Detiene o pasa a la siguiente vuelta de un bucle |
| `isset()` / `unset()` | Comprueba la existencia / elimina una variable |
| `list()` | Asigna varias variables a la vez a partir de un array |

> **Nota:** ya te has encontrado con la mayoría de estas estructuras en los capítulos anteriores (condiciones, bucles, variables...) sin que esta noción se nombrara explícitamente.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una estructura del lenguaje (`echo`, `include`, `if`, `return`...) forma parte de la sintaxis del lenguaje mismo, a diferencia de una función: se beneficia de libertades de escritura (paréntesis opcionales, no almacenable en una variable). |
| **Herramientas utilizables** | `echo`/`print`, `include`/`require`, `isset()`/`unset()`, `list()`. |
| **Trampas a evitar** | Intentar almacenar una estructura del lenguaje en una variable o pasarla como argumento, como una función clásica. |
| **Buenas prácticas** | Usar `include`/`require` en lugar de una función personalizada para cargar un archivo: es el mecanismo nativo previsto para eso. |
