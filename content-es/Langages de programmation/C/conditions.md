---
order: 2
---

# Condiciones

Las condiciones permiten ejecutar un bloque de código en función de si una expresión es verdadera o falsa. En C, se utilizan «`if`» / «`else`» / «`else if`», el operador ternario y «`switch`».

## La condición «`if`»

En C, cualquier valor **distinto de cero** se considera verdadero; solo el valor `0` es falso —no existía un tipo booleano nativo antes de C99 (`stdbool.h`, véase el capítulo sobre variables):

```c
int edad = 18;

if (edad >= 18) {
    printf("Vous êtes majeur.\n");
}
```

## `if` / `else` / `else if`

```c
int note = 12;

if (note >= 16) {
    printf("Mention Très Bien\n");
} else if (note >= 14) {
    printf("Mention Bien\n");
} else if (note >= 10) {
    printf("Admis\n");
} else {
    printf("Recalé\n");
}
```

> **Nota:** a diferencia de PHP, en C no existe una sintaxis alternativa con `:` / `endif`: las llaves `{ }` son la única forma de escritura disponible (son opcionales solo si el bloque contiene una única instrucción, pero se desaconseja encarecidamente omitirlas, ya que son una fuente habitual de errores si se añade una línea por error sin las llaves).

## El operador ternario

```c
int edad = 20;
const char *statut = (edad >= 18) ? "majeur" : "mineur";

printf("%s\n", statut);
```

## El e`switch`

Útil para comparar una misma variable con varios valores enteros o enumerados:

```c
int jour = 3;

switch (jour) {
    case 1:
        printf("Lundi\n");
        break;
    case 2:
        printf("Mardi\n");
        break;
    case 3:
        printf("Mercredi\n");
        break;
    default:
        printf("Autre jour\n");
        break;
}
```

> **Nota:** no olvides incluir el «`break;`» al final de cada «`case`»; de lo contrario, la ejecución continuará en el siguiente «`case`» (*fall-through*), aunque su condición no se cumpla. Este comportamiento se aprovecha a veces de forma intencionada para agrupar varios casos idénticos:

```c
switch (jour) {
    case 6:
    case 7:
        printf("Week-end\n"); // pas de break entre 6 et 7 : les deux cas partagent ce code
        break;
    default:
        printf("Jour de semaine\n");
        break;
}
```

> **Limitación de la instrucción «`switch`» en C:** a diferencia de otros lenguajes, la instrucción «`switch`» en C solo funciona con tipos enteros (o equivalentes: `char`, `enum`); no es posible aplicar directamente la instrucción «`switch`» a una cadena de caracteres.
