---
order: 6
---

# Los argumentos de la línea de comandos (`argc`, `argv`)

`main` puede recibir dos parámetros opcionales que dan acceso a los argumentos pasados al programa en el momento de su lanzamiento desde la terminal, además de la forma `int main(void)` ya vista.

## La firma completa de `main`

```c
int main(int argc, char *argv[])
{
    // ...
}
```

- `argc` (*argument count*): el número de argumentos recibidos, siempre al menos `1`.
- `argv` (*argument vector*): un arreglo de cadenas de caracteres, un elemento por argumento.

## Mostrar todos los argumentos recibidos

```c
#include <stdio.h>

int main(int argc, char *argv[])
{
    for (int i = 0; i < argc; i++) {
        printf("argv[%d] = %s\n", i, argv[i]);
    }
    return 0;
}
```

Ejecutado como `./programa hola 42`, este programa muestra:

```text
argv[0] = ./programa
argv[1] = hola
argv[2] = 42
```

`argc` vale entonces `3`: el nombre del propio programa cuenta como un argumento más.

## `argv[0]`: el nombre del programa, no el primer argumento útil

`argv[0]` siempre contiene la ruta usada para lanzar el programa (no necesariamente solo su nombre), nunca el primer argumento proporcionado por el usuario: ese es `argv[1]`.

## El centinela `argv[argc]`

El estándar C garantiza que `argv[argc]` siempre vale `NULL`: esto permite recorrer `argv` sin conocer `argc` de antemano (`while (argv[i] != NULL)`), pero nada garantiza lo que hay **más allá** de `argv[argc]`.

> **Trampa:** leer `argv[i]` sin haber comprobado antes que `i < argc`. Un usuario que lanza el programa sin proporcionar el argumento esperado provoca entonces un acceso fuera del arreglo: uno de los errores más frecuentes al empezar con `argc`/`argv`.

```c
if (argc < 2) {
    fprintf(stderr, "Uso: %s <argumento>\n", argv[0]);
    return 1;
}
printf("Argumento recibido: %s\n", argv[1]);   // solo se alcanza si argc >= 2
```

## Convertir un argumento en número

Un argumento siempre llega como una cadena de caracteres, aunque parezca un número en la línea de comandos: `atoi()`/`strtol()` (ver [Convertir una cadena en número](/?c=langages-de-programmation&s=c&p=variables#convertir-una-cadena-en-numero-atof-atoi), ya visto en *Las variables*) lo convierten explícitamente en un entero.

```c
int limite = atoi(argv[1]);   // "42" (cadena) -> 42 (int)
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `int main(int argc, char *argv[])` da acceso a los argumentos de la línea de comandos: `argc` su número (siempre ≥ 1), `argv` el arreglo de cadenas correspondiente. `argv[0]` es el nombre del programa, no el primer argumento útil. |
| **Herramientas utilizables** | `argc`, `argv[i]`, el centinela `argv[argc] == NULL`, `atoi()`/`strtol()` para convertir un argumento en número. |
| **Trampas a evitar** | Leer `argv[i]` sin comprobar antes `i < argc`: acceso fuera del arreglo si el usuario no proporciona el argumento esperado. Confundir `argv[0]` (el nombre del programa) con el primer argumento real (`argv[1]`). |
| **Buenas prácticas** | Comprobar siempre `argc` antes de acceder a un `argv[i]` dado, y mostrar un mensaje de uso claro (mediante `argv[0]`) cuando `argc` no coincide con lo esperado. |
