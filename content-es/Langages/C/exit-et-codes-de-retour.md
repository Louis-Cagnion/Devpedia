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
    return 0;   // el programa termina aqui, codigo de retorno 0
}
```

En `main` (y solo en `main`), `return valor;` termina todo el programa y fija su código de retorno en `valor`: no es un simple retorno de función como en el resto del código.

## `exit(code)`: terminar desde cualquier parte

```c
#include <stdlib.h>

void verificar_configuracion(Config *config)
{
    if (config == NULL) {
        fprintf(stderr, "Error: falta la configuracion\n");
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

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `return valor;` en `main` termina el programa y fija su código de retorno. `exit(code)` hace lo mismo desde cualquier función. Por convención, `0` señala éxito, cualquier otro valor un fallo. |
| **Herramientas utilizables** | `exit(code)`, `EXIT_SUCCESS`/`EXIT_FAILURE` (`<stdlib.h>`). |
| **Trampas a evitar** | Devolver `0` por defecto sin comprobar que nada falló: un script que revisa `$?` creerá entonces en un éxito que nunca ocurrió. |
| **Buenas prácticas** | Usar `EXIT_SUCCESS`/`EXIT_FAILURE` en lugar de `0`/`1` directos para hacer explícita la intención; siempre devolver un código distinto de cero en cuanto un error impide que el programa haga lo que se esperaba de él. |
