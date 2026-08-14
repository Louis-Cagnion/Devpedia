---
order: 3
---

# Los bucles

Los bucles permiten repetir un bloque de código varias veces. En C, disponemos de tres estructuras: `while`, `do while` y `for`; no existe un `foreach` nativo, por lo que un array siempre se recorre mediante un índice o un puntero.

## El bucle `while`

La condición se comprueba **antes** de cada vuelta:

```c
int i = 0;

while (i < 5) {
    printf("%d\n", i);
    i++;
}
```

## El bucle `do while`

Variante en la que la condición se comprueba **después** de cada vuelta: el bloque se ejecuta entonces siempre al menos una vez, incluso si la condición es falsa desde el principio:

```c
int i = 0;

do {
    printf("%d\n", i);
    i++;
} while (i < 5);
```

## El bucle `for`

Reúne en una sola línea la inicialización, la condición y el incremento; resulta práctico en cuanto se conoce de antemano el número de iteraciones:

```c
for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
}
```

Las tres partes son independientes y opcionales (`for (;;)` es un bucle infinito válido), pero el uso habitual sigue siendo `for (inicialización; condición; incremento)`.

## Recorrer un array (sin `foreach`)

```c
int array[5] = {10, 20, 30, 40, 50};

for (int i = 0; i < 5; i++) {
    printf("%d\n", array[i]);
}
```

> **Nota:** a diferencia de PHP o JavaScript, no existe **ningún medio nativo** de conocer el tamaño de un array a partir únicamente del puntero: `array[5]` "sabe" cuántos elementos contiene mientras se manipule como array estático, pero esta información desaparece en cuanto se pasa a una función (en ese caso se comporta como un simple puntero, véase [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs)). El tamaño debe entonces transmitirse por separado.

```c
void mostrar(int *array, int tamano) // el tamaño debe pasarse explícitamente
{
    for (int i = 0; i < tamano; i++) {
        printf("%d\n", array[i]);
    }
}
```

## `break` y `continue`

- `break;` detiene por completo el bucle que lo engloba.
- `continue;` pasa directamente a la siguiente vuelta, sin ejecutar el resto del cuerpo del bucle actual.

```c
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // detiene el bucle en cuanto i vale 5
    }
    if (i % 2 == 0) {
        continue; // ignora los números pares
    }
    printf("%d\n", i);
}
```

## Bucles anidados y `break`

`break` solo detiene el bucle **más cercano** que lo engloba: para salir de varios bucles anidados a la vez, se necesita una variable de control o un `goto` (poco frecuente, pero a veces utilizado precisamente para este caso en C):

```c
int encontrado = 0;

for (int i = 0; i < 10 && !encontrado; i++) {
    for (int j = 0; j < 10; j++) {
        if (i * j == 42) {
            encontrado = 1;
            break; // solo sale del bucle interno
        }
    }
}
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `while` comprueba antes, `do while` comprueba después (al menos una ejecución), `for` reúne inicialización/condición/incremento. No hay `foreach` nativo: un array se recorre por índice. |
| **Herramientas utilizables** | `break` (detiene el bucle), `continue` (pasa a la siguiente vuelta). |
| **Trampas a evitar** | `break` solo sale del bucle más cercano: se necesita una variable de control para salir de varios bucles anidados. |
| **Buenas prácticas** | Transmitir siempre explícitamente el tamaño de un array a una función que lo recorre, en lugar de suponer que se puede deducir. |
