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

> **Nota:** a diferencia de [PHP](/?c=langages-de-programmation&s=php&p=php) o [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), no existe **ningún medio nativo** de conocer el tamaño de un array a partir únicamente del puntero: `array[5]` "sabe" cuántos elementos contiene mientras se manipule como array estático, pero esta información desaparece en cuanto se pasa a una función (en ese caso se comporta como un simple puntero, véase [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs)). El tamaño debe entonces transmitirse por separado.

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

## Evaluación en cortocircuito de `&&`/`||`

`&&` y `||` solo evalúan su segundo operando si es necesario (**evaluación en cortocircuito**), exactamente igual que en [Python](/?c=langages-de-programmation&s=python&p=conditions): `a && b` solo evalúa `b` si `a` es verdadero (distinto de cero); `a || b` solo evalúa `b` si `a` es falso (`0`).

Uso clásico: evitar una desreferencia de puntero inválida.

```c
if (ptr != NULL && ptr->valor > 0) {
    ...
}
```

Si `ptr` vale `NULL`, `ptr->valor` nunca se evalúa: `&&` se detiene en cuanto el primer operando es falso.

> **Diferencia con Python:** en C, `&&`/`||` siempre devuelven `0` o `1` (un `int`), nunca uno de sus dos operandos. `edad > 0 && edad` no devuelve entonces `edad` como haría el equivalente en Python -- solo la propiedad de cortocircuito (no evaluar el segundo operando si no hace falta) es aprovechable en C, nunca el valor de retorno como "valor de repliegue".

### Combinar bifurcación condicional y detección de fallo

Un uso más avanzado: encadenar varios `&&`/`||` para probar un caso Y llamar a la función correspondiente, en una sola expresión, siempre que cada función llamada devuelva `1` en caso de éxito y `0` en caso de fallo:

```c
!strcmp(type, "v")  && add_vector(mesh, values)
|| !strcmp(type, "vt") && add_texcoord(mesh, values)
|| !strcmp(type, "f")  && add_face(mesh, values);
```

Se lee como una cadena `if`/`else if`: `&&` tiene mayor prioridad que `||`, así que cada línea forma un par `(prueba && llamada)` independiente. En cuanto un par es verdadero (la prueba coincide Y la llamada tiene éxito), `||` se detiene ahí; si no, continúa hacia el siguiente par.

> **Trampa:** este estilo supone que cada función llamada respeta la convención "`1` = éxito, `0` = fallo". Una función que sigue la convención inversa (`0` = éxito, habitual en llamadas al sistema como `close()`) rompe silenciosamente la cadena: un éxito real evaluado como `0` se interpreta como un fallo, y `||` continúa erróneamente hacia la siguiente rama.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `while` comprueba antes, `do while` comprueba después (al menos una ejecución), `for` reúne inicialización/condición/incremento. No hay `foreach` nativo: un array se recorre por índice. `&&`/`||` cortocircuitan su segundo operando, pero siempre devuelven `0`/`1`, nunca un operando como en Python. |
| **Herramientas utilizables** | `break` (detiene el bucle), `continue` (pasa a la siguiente vuelta). Encadenar `&&`/`||` para combinar una prueba y una llamada condicional en una sola expresión. |
| **Trampas a evitar** | `break` solo sale del bucle más cercano: se necesita una variable de control para salir de varios bucles anidados. Una cadena `&&`/`||` supone que cada función llamada devuelve `1` en caso de éxito; una función que devuelve `0` en caso de éxito (convención inversa) la rompe silenciosamente. |
| **Buenas prácticas** | Transmitir siempre explícitamente el tamaño de un array a una función que lo recorre, en lugar de suponer que se puede deducir. Reservar el encadenamiento `&&`/`||` a funciones que siguen la convención "1 = éxito"; usar un `if` explícito en caso contrario. |
