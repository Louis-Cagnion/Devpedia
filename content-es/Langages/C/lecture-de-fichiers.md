---
order: 22
---

# Leer un archivo línea por línea: `fopen`, `fgets`, `getline`

El capítulo sobre [las llamadas al sistema](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) presenta `open()`/`read()`/`close()`: llamadas en bruto, sin formato, que requieren una ida y vuelta al núcleo en cada lectura. La biblioteca estándar de C (*libc*) ofrece una capa por encima, los **flujos** (*streams*, tipo `FILE *`), que añade un búfer interno (*buffer*): lee un gran bloque de una vez, y luego distribuye los datos poco a poco, sin repetir una llamada al sistema en cada pequeña lectura.

| | Llamadas al sistema en bruto | Flujos con búfer (libc) |
|---|---|---|
| Funciones | `open()`, `read()`, `close()` | `fopen()`, `fgets()`/`getline()`, `fclose()` |
| Tipo manipulado | Un entero (descriptor de archivo) | Un `FILE *` (flujo) |
| División en líneas | A cargo del programa | Realizada por `fgets()`/`getline()` |
| Página de manual | Sección 2 (`man 2 open`) | Sección 3 (`man 3 fopen`) |

## Abrir un flujo: `fopen()`

```c
FILE *fp = fopen("fichier.txt", "r");
if (!fp) {
    perror("fopen");
    return 1;
}
```

`fopen()` devuelve `NULL` en caso de fallo (archivo ausente, permisos insuficientes...): como toda llamada que puede fallar, el valor de retorno debe comprobarse antes de usar el flujo.

## `fgets()`: un búfer de tamaño fijo proporcionado por quien llama

```c
char buf[256];

while (fgets(buf, sizeof(buf), fp) != NULL) {
    printf("línea leída: %s", buf);
}
fclose(fp);
```

Firma: `char *fgets(char *s, int size, FILE *stream)`.

| Parámetro | Función |
|---|---|
| `s` | El búfer de destino, ya asignado por quien llama |
| `size` | El tamaño de ese búfer (siempre `sizeof(buf)`, nunca una constante copiada a mano) |
| `stream` | El flujo abierto por `fopen()` |

`fgets()` devuelve `s` si se ha leído una línea, `NULL` al final del archivo o en caso de error.

> **Trampa:** si una línea del archivo supera los `size - 1` caracteres, `fgets()` se detiene en el límite del búfer **sin leer el resto de la línea**: la siguiente llamada retoma donde se quedó. Una "línea lógica" demasiado larga puede así terminar dividida en varias llamadas si el búfer es demasiado pequeño.

## `getline()`: un búfer que la función asigna ella misma

```c
char *line = NULL;
size_t capacity = 0;
ssize_t len;

while ((len = getline(&line, &capacity, fp)) != -1) {
    printf("línea leída (%zd caracteres): %s", len, line);
}
free(line);
fclose(fp);
```

Firma (POSIX): `ssize_t getline(char **lineptr, size_t *n, FILE *stream)`.

| Parámetro | Función |
|---|---|
| `lineptr` | Dirección de un `char *`, inicializado a `NULL` antes de la primera llamada: `getline()` lo asigna/reasigna ella misma |
| `n` | Dirección de un `size_t`, inicializado a `0`: `getline()` lleva ahí el registro de la capacidad actualmente asignada |
| `stream` | El flujo abierto por `fopen()` |

`getline()` devuelve el número de caracteres leídos (sin contar el `'\0'` final) si se ha leído una línea, `-1` al final del archivo o en caso de error. A diferencia de `fgets()`, **reasigna** el búfer mientras la línea no esté leída por completo: ninguna truncación es posible, sin importar la longitud de la línea.

> **Nota:** en ambos casos, el carácter `'\n'` de fin de línea se **conserva** en el búfer (salvo posiblemente en la última línea del archivo, si no tiene un salto de línea final). Hay que tenerlo en cuenta antes de comparar el contenido leído con un valor esperado.

> **Buena práctica:** el búfer asignado por `getline()` debe ser liberado por quien llama con `free()`, incluso si ha sido reasignado varias veces internamente a lo largo de las llamadas.

## Cerrar el flujo: `fclose()`

```c
fclose(fp);
```

Cada `fopen()` exitoso debe corresponder exactamente a un `fclose()`, siguiendo el mismo principio que un `malloc()`/`free()` (véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)) o que un `open()`/`close()`.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `fopen`/`fgets`/`getline`/`fclose` son funciones de la libc, que añaden una capa de búfer (`FILE *`) por encima de las llamadas al sistema en bruto (`open`/`read`/`close`). `fgets` usa un búfer de tamaño fijo proporcionado por quien llama (riesgo de truncación); `getline` asigna y reasigna ella misma su búfer (nunca hay truncación). |
| **Herramientas utilizables** | `fopen`, `fgets`, `getline`, `fclose`, `perror` para diagnosticar un fallo de apertura. |
| **Trampas a evitar** | No comprobar el retorno de `fopen()` (`NULL`) antes de usarlo. Una línea más larga que el búfer de `fgets()` se corta en varias llamadas. Olvidar hacer `free()` del búfer asignado por `getline()`. Olvidar que `'\n'` permanece en la línea leída. |
| **Buenas prácticas** | Comprobar siempre `fopen()` antes de usarlo. Preferir `getline()` a `fgets()` en cuanto la longitud de las líneas no esté garantizada como acotada. Un `fclose()` por cada `fopen()` exitoso. |
