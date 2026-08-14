---
order: 10
---

# Las funciones variádicas (va_list)

Una función **variádica** admite un número variable de argumentos: `printf("%d %s\n", 42, "texto")` es el ejemplo más conocido: `printf` admite 1, 2 o 10 argumentos según el formato proporcionado. En C, este mecanismo es posible gracias a las macros de `<stdarg.h>`.

## Declarar una función variádica

Una función variádica siempre tiene al menos un parámetro fijo, seguido de `...`:

```c
#include <stdarg.h>

int suma(int cantidad, ...)
{
    va_list argumentos;
    va_start(argumentos, cantidad); // "cantidad" es el último parámetro fijo, justo antes de los "..."

    int total = 0;
    for (int i = 0; i < cantidad; i++) {
        total += va_arg(argumentos, int); // recupera el siguiente argumento, tratándolo como un int
    }

    va_end(argumentos);
    return total;
}

suma(3, 10, 20, 30); // 60 -> cantidad = 3, se suman los 3 argumentos siguientes
```

## Las macros de `<stdarg.h>`

| Macro | Función |
|---|---|
| `va_list` | Tipo que representa la lista de argumentos variables |
| `va_start(lista, ultimoParamFijo)` | Inicializa la lista, a partir del último parámetro fijo conocido |
| `va_arg(lista, tipo)` | Recupera el siguiente argumento, suponiendo que es del `tipo` indicado |
| `va_end(lista)` | Termina correctamente el uso de la lista |

> **Nota:** el compilador no tiene forma de comprobar que el `tipo` pasado a `va_arg()` se corresponda realmente con el tipo del argumento proporcionado por quien llama a la función: es responsabilidad exclusiva del desarrollador. Pasar un tipo incorrecto (por ejemplo, leer un `int` cuando se ha proporcionado un `double`) es un comportamiento indefinido, no detectado en la compilación.

## ¿Cómo sabe `printf` el número de argumentos?

`printf` no dispone de **ningún medio nativo** para saber cuántos argumentos variables se han proporcionado: es la propia cadena de formato la que sirve de guía, contando el número de `%` que contiene.

```c
printf("%d %d %d\n", 1, 2, 3); // la cadena anuncia 3 valores -> printf lee 3 argumentos variádicos
```

> **Nota:** por eso, un número incorrecto de `%` en relación con los argumentos reales (o al revés) no provoca **ningún error de compilación**: solo un comportamiento indefinido en tiempo de ejecución (lectura de datos que no son argumentos reales). Es una fuente clásica de fallos de seguridad ("vulnerabilidad de cadena de formato") cuando una cadena de formato procede directamente de una entrada de usuario no controlada.

## Una limitación: el número de argumentos debe comunicarse de otra forma

A diferencia de `printf` (guiado por la cadena de formato), el ejemplo `suma()` anterior debe recibir explícitamente el número de argumentos como primer parámetro (`cantidad`): `va_list` no permite saber por sí solo "cuántos argumentos quedan", siempre hace falta un medio externo para comunicarlo (un contador, un valor centinela como `NULL` en el último argumento, o una cadena de formato).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una función variádica (`...`) admite un número variable de argumentos, leídos mediante las macros de `<stdarg.h>` (`va_list`, `va_start`, `va_arg`, `va_end`). El número de argumentos siempre debe comunicarse por un medio externo. |
| **Herramientas utilizables** | `va_list`, `va_start`, `va_arg`, `va_end`. |
| **Trampas a evitar** | Pasar a `va_arg()` un tipo diferente del realmente proporcionado por quien llama a la función: comportamiento indefinido, no detectado en la compilación. |
| **Buenas prácticas** | Nunca construir una cadena de formato a partir de una entrada de usuario no controlada: fuente clásica de vulnerabilidades ("vulnerabilidad de cadena de formato"). |
