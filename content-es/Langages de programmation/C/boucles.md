---
order: 3
---

# Los bucles

Los bucles permiten repetir un bloque de código varias veces. En C, disponemos de tres estructuras: `while`, `do while` y `for`; no existe un `foreach` nativo, por lo que un array siempre se recorre mediante un índice o un puntero.

## El bucle «`while`»

La condición se comprueba **antes de** cada ronda:

```c
int i = 0;

while (i < 5) {
    printf("%d\n", i);
    i++;
}
```

## El bucle «`do while`»

Variante en la que la condición se comprueba **después de** cada bucle: por lo tanto, el bloque siempre se ejecuta al menos una vez, aunque la condición sea falsa desde el principio:

```c
int i = 0;

do {
    printf("%d\n", i);
    i++;
} while (i < 5);
```

## El bucle «`for`»

Reúne en una sola línea la inicialización, la condición y el incremento, lo cual resulta práctico cuando se conoce de antemano el número de iteraciones:

```c
for (int i = 0; i < 5; i++) {
    printf("%d\n", i);
}
```

Las tres partes son independientes y opcionales (`for (;;)` es un bucle infinito válido), pero el uso habitual sigue siendo `for (init; condition; incrément)`.

## Recorrer un array (sin «`foreach`»)

```c
int matriz[5] = {10, 20, 30, 40, 50};

for (int i = 0; i < 5; i++) {
    printf("%d\n", matriz[i]);
}
```

> **Nota:** a diferencia de PHP o JavaScript, no existe **ninguna forma nativa** de conocer el tamaño de un array a partir únicamente del puntero — `matriz[5]` «sabe» cuántos elementos contiene siempre que se maneje como un array estático, pero esta información desaparece en cuanto se pasa a una función (en ese caso, se comporta como un simple puntero; véase el capítulo sobre punteros). Por lo tanto, el tamaño debe transmitirse por separado.

```c
void afficher(int *matriz, int taille) // la taille doit être passée explicitement
{
    for (int i = 0; i < taille; i++) {
        printf("%d\n", matriz[i]);
    }
}
```

## `break` y `continue`

- `break;` detiene por completo el bucle envolvente.
- `continue;` pasa directamente a la siguiente iteración, sin ejecutar el resto del cuerpo del bucle actual.

```c
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break; // arrête la boucle dès que i vaut 5
    }
    if (i % 2 == 0) {
        continue; // ignore les nombres pairs
    }
    printf("%d\n", i);
}
```

## Bucles anidados y «`break`»

`break` solo detiene el bucle **más cercano** que lo engloba; para salir de varios bucles anidados a la vez, se necesita una variable de control o un «`goto`» (poco habitual, pero que a veces se utiliza para este caso concreto en C):

```c
int trouve = 0;

for (int i = 0; i < 10 && !trouve; i++) {
    for (int j = 0; j < 10; j++) {
        if (i * j == 42) {
            trouve = 1;
            break; // ne sort que de la boucle interne
        }
    }
}
```
