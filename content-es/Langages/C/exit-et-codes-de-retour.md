---
order: 5
---

# `exit()` y los códigos de retorno

Un programa en C siempre termina con un **código de retorno**: un entero que le indica al proceso que lo llamó (a menudo la shell) si el programa se ejecutó correctamente. Este código ya se vio de pasada en [La gestión de procesos](/?c=langages-de-programmation&s=c&p=processus): `WEXITSTATUS(estado)` lo extrae después de un `wait()`.

## `return` en `main`: el caso más común

```c
int main(void)
{
    // ... procesamiento ...
    return 0;   // el programa termina aquí, código de retorno 0
}
```

En `main` (y solo en `main`), `return valor;` termina todo el programa y fija su código de retorno en `valor`: no es un simple retorno de función como en el resto del código.

## `exit(code)`: terminar desde cualquier parte

```c
#include <stdlib.h>

void verificar_configuracion(Config *config)
{
    if (config == NULL) {
        fprintf(stderr, "Error: falta la configuración\n");
        exit(1);   // termina el programa de inmediato, incluso fuera de main
    }
}
```

`exit(code)` termina el programa **de inmediato**, sin importar en qué función se llame: no hace falta hacer subir un error a través de una cadena de `return` hasta `main` para detener el programa.

| | `return` en `main` | `exit(code)` |
|---|---|---|
| Dónde llamarlo | Solo en `main` | Cualquier función |
| Efecto | Termina `main`, y por tanto el programa | Termina el programa directamente |
| Código de retorno | El valor devuelto | `code` |

## La convención: 0 = éxito, distinto de cero = error

```c
#include <stdlib.h>

exit(EXIT_SUCCESS);   // equivalente a exit(0)
exit(EXIT_FAILURE);   // equivalente a exit(1)
```

`EXIT_SUCCESS` y `EXIT_FAILURE` (definidas en `<stdlib.h>`) valen `0` y `1` respectivamente: usarlas en lugar de los números directos hace explícita la intención al leer el código, sin cambiar el comportamiento.

Este código de retorno puede consultarse después desde la shell que lanzó el programa mediante [`$?`](/?c=shells&s=bash&p=scripts-et-shebang#codigos-de-salida-exit): `0` señala éxito, cualquier otro valor señala algún tipo de fallo (el significado exacto de los valores distintos de cero depende de cada programa).

> **Trampa:** olvidar devolver un código distinto de cero en caso de error (`return 0;`, o ningún `return` explícito, que cuenta como `0` por convención cuando `main` llega a su fin normal). Un script que encadena comandos con `&&` o comprueba `$?` creerá entonces que el programa tuvo éxito, aunque en realidad haya fallado.

## `atexit()`: liberar todo en cada camino de salida

Un programa que llama a `exit()` en lo más hondo de una cadena de funciones se salta el `free()` que `main` habría hecho al final: la memoria no se devuelve limpiamente y una herramienta de detección de fugas (ver [Memoria](/?c=langages-de-programmation&s=c&p=memoire)) lo señala. `atexit(función)` resuelve este problema: **registra** una función que el programa llamará por sí solo al terminar, sea cual sea el lugar desde el que parte la salida.

```c
#include <stdlib.h>

static char *g_buffer;   // global: la función registrada no recibe ningún argumento

static void cleanup(void)
{
    free(g_buffer);
}

int main(void)
{
    g_buffer = malloc(100);
    atexit(cleanup);     // cleanup se llamará al final, por return o por exit()
    // ...
    return 0;
}
```

Resultado medido con dos funciones registradas (`cleanup` primero, luego `log_end`), según la forma de terminar:

| Forma de terminar | ¿Se llaman las funciones registradas? | Código de retorno |
|---|---|---|
| `return 0;` en `main` | Sí, en orden inverso: `log_end` y luego `cleanup` | `0` |
| `exit(EXIT_FAILURE);` llamado en lo hondo de varias funciones | Sí, mismo orden inverso | `1` |
| `_exit(EXIT_FAILURE);` (`<unistd.h>`) | **No**, no se llama nada | `1` |

- **Orden inverso**: la última función registrada se ejecuta la primera, como una pila; un recurso registrado al final (que depende de los anteriores) se libera por tanto antes que ellos.
- **Límite**: el estándar garantiza al menos 32 funciones registrables; `atexit()` devuelve un valor distinto de cero si el registro falla.

> **Trampa:** `_exit()`, `abort()` y una señal mortal (ver [Señales Unix](/?c=langages-de-programmation&s=c&p=signaux-unix)) terminan el programa sin llamar a las funciones registradas. En un proceso creado por `fork()`, el hijo que debe detenerse tras un error usa `_exit()` para no repetir las limpiezas del padre (búferes de escritura vaciados dos veces, archivos temporales borrados demasiado pronto).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `return valor;` en `main` termina el programa y fija su código de retorno. `exit(code)` hace lo mismo desde cualquier función. Por convención, `0` señala éxito, cualquier otro valor un fallo. `atexit(función)` registra una limpieza llamada al salir, en el orden inverso del registro. |
| **Herramientas utilizables** | `exit(code)`, `EXIT_SUCCESS`/`EXIT_FAILURE` (`<stdlib.h>`), `atexit()`. |
| **Trampas a evitar** | Devolver `0` por defecto sin comprobar que nada falló: un script que revisa `$?` creerá entonces en un éxito que nunca ocurrió. Contar con `atexit()` tras `_exit()`, `abort()` o una señal mortal: no se llama nada. |
| **Buenas prácticas** | Usar `EXIT_SUCCESS`/`EXIT_FAILURE` en lugar de `0`/`1` directos para hacer explícita la intención; siempre devolver un código distinto de cero en cuanto un error impide que el programa haga lo que se esperaba de él; registrar la limpieza con `atexit()` en lugar de repetir los `free()` antes de cada `exit()`. |
