---
order: 10
---

# Las funciones variádicas (va_list)

Una función **variádica** admite un número variable de argumentos; el ejemplo más conocido es «`printf("%d %s\n", 42, "texto")`»: «`printf`» admite 1, 2 o 10 argumentos, según el formato proporcionado. En C, este mecanismo es posible gracias a las macros de `<stdarg.h>`.

## Declarar una función variádica

Una función variádica siempre tiene al menos un parámetro fijo, seguido de un`...`:

```c
#include <stdarg.h>

int somme(int número, ...)
{
    va_list arguments;
    va_start(arguments, número); // "número" est le dernier paramètre fixe, juste avant les "..."

    int total = 0;
    for (int i = 0; i < número; i++) {
        total += va_arg(arguments, int); // récupère l'argument suivant, en le traitant comme un int
    }

    va_end(arguments);
    return total;
}

somme(3, 10, 20, 30); // 60 -> número = 3, les 3 arguments suivants sont additionnés
```

## Las macros de `<stdarg.h>`

| Macro | Función |
|---|---|
| `va_list` | Tipo que representa la lista de argumentos variables |
| `va_start(lista, dernierParamFixe)` | Inicializa la lista a partir del último parámetro fijo conocido |
| `va_arg(lista, type)` | Recupera el siguiente argumento, suponiendo que se trata del `type` indicado |
| `va_end(lista)` | Finaliza correctamente el uso de la lista |

> **Nota:** el compilador no tiene forma de verificar que el `type` pasado a `va_arg()` se corresponda realmente con el tipo del argumento proporcionado por el llamante; esto es responsabilidad exclusiva del desarrollador. Pasar un tipo incorrecto (por ejemplo, leer un `int` cuando se ha proporcionado un `double`) es un comportamiento indefinido que no se detecta en la compilación.

## ¿Cómo sabe `printf` el número de argumentos?

`printf` No dispone de **ningún método nativo** para saber cuántos argumentos variables se han proporcionado: es la propia cadena de formato la que sirve de guía, contando el número de «`%`» que contiene.

```c
printf("%d %d %d\n", 1, 2, 3); // la chaîne annonce 3 valeurs -> printf lit 3 arguments variadiques
```

> **Nota:** por eso, un número incorrecto de «`%`» en relación con los argumentos reales (o al revés) no provoca **ningún error de compilación**, sino solo un comportamiento indefinido en la ejecución (lectura de datos que no son argumentos reales). Se trata de una fuente clásica de vulnerabilidades de seguridad («vulnerabilidad de cadena de formato») cuando una cadena de formato procede directamente de una entrada de usuario no controlada.

## Una restricción: el número de argumentos debe indicarse de otra forma

A diferencia de `printf` (guiado por la cadena de formato), el ejemplo `somme()` anterior debe recibir explícitamente el número de argumentos como primer parámetro (`número`); `va_list` no permite saber por sí solo «cuántos argumentos quedan», siempre se necesita un medio externo para comunicarlo (un contador, un valor centinela como `NULL` como último argumento, o una cadena de formato).
