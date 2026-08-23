---
order: 2
---

# Condiciones

Las condiciones permiten ejecutar un bloque de código según si una expresión es verdadera o falsa. En C, se utilizan `if`/`else`/`else if`, el operador ternario y `switch`.

## La condición `if`

En C, cualquier valor **distinto de cero** se considera verdadero; solo el valor `0` es falso: no existe un tipo booleano nativo antes de [C99](https://en.wikipedia.org/wiki/C99) ([`stdbool.h`](/?c=langages-de-programmation&s=c&p=variables)):

```c
int edad = 18;

if (edad >= 18) {
    printf("Eres mayor de edad.\n");
}
```

## `if` / `else` / `else if`

```c
int nota = 12;

if (nota >= 16) {
    printf("Muy Bien\n");
} else if (nota >= 14) {
    printf("Bien\n");
} else if (nota >= 10) {
    printf("Aprobado\n");
} else {
    printf("Suspenso\n");
}
```

> **Nota:** a diferencia de [PHP](/?c=langages-de-programmation&s=php&p=php), en C no existe una sintaxis alternativa con `:`/`endif`: las llaves `{ }` son la única forma de escritura disponible (son opcionales solo si el bloque contiene una única instrucción, pero se desaconseja encarecidamente omitirlas: son una fuente clásica de errores si se añade una línea por error sin las llaves).

## El operador ternario

```c
int edad = 20;
const char *estado = (edad >= 18) ? "mayor de edad" : "menor de edad";

printf("%s\n", estado);
```

## El `switch`

Útil para comparar una misma variable con varios valores enteros o enumerados:

```c
int dia = 3;

switch (dia) {
    case 1:
        printf("Lunes\n");
        break;
    case 2:
        printf("Martes\n");
        break;
    case 3:
        printf("Miércoles\n");
        break;
    default:
        printf("Otro día\n");
        break;
}
```

> **Nota:** no olvides el `break;` al final de cada `case`: si no, la ejecución continúa en el `case` siguiente (*fall-through*), aunque su condición no se cumpla. Este comportamiento a veces se aprovecha intencionadamente para agrupar varios casos idénticos:

```c
switch (dia) {
    case 6:
    case 7:
        printf("Fin de semana\n"); // sin break entre 6 y 7: los dos casos comparten este código
        break;
    default:
        printf("Día laborable\n");
        break;
}
```

> **Límite del `switch` en C:** a diferencia de otros lenguajes, un `switch` en C solo funciona con tipos enteros (o asimilados: `char`, `enum`): es imposible hacer un `switch` directamente sobre una cadena de caracteres.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `if`/`else`/`else if` ejecutan un bloque según una condición; cualquier valor distinto de cero es verdadero en C. `switch` compara una misma variable entera con varios valores. |
| **Herramientas utilizables** | El operador ternario `? :` para una asignación condicional corta. |
| **Trampas a evitar** | Olvidar el `break;` en un `case`: la ejecución continúa en el `case` siguiente (*fall-through*), aunque no corresponda a su condición. |
| **Buenas prácticas** | Poner siempre llaves en un bloque `if`, incluso con una única instrucción: evita un error si más adelante se añade una línea sin las llaves. |
