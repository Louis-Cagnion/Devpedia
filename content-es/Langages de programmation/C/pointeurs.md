---
order: 4
---

# Los punteros

Un puntero es una variable que no almacena un valor directamente, sino la dirección** de memoria** de otra variable. Es el mecanismo fundamental que permite, en C, manipular la memoria directamente, pasar datos a las funciones sin copiarlos y construir estructuras de datos dinámicas (listas encadenadas, árboles...).

## Declaración, dirección y retirada de referencias

```c
int edad = 25;
int *ptr = &edad;

printf("%d\n", edad);   // 25          -> la valeur
printf("%p\n", &edad);  // 0x7ffee...  -> l'adresse mémoire de age
printf("%p\n", ptr);   // 0x7ffee...  -> la même adresse, stockée dans ptr
printf("%d\n", *ptr);  // 25          -> la valeur pointée par ptr
```

- `&variable` : operador «dirección de», devuelve la dirección de memoria de una variable.
- `*ptr` (en la declaración): indica que «`ptr`» es un puntero.
- `*ptr` (fuera de una declaración): operador de **desreferenciación**, accede al valor almacenado en la dirección contenida en `ptr`.

Al modificar «`*ptr`», se modifica directamente «`edad`», ya que ambos hacen referencia a la misma ubicación en memoria:

```c
*ptr = 30;
printf("%d\n", edad); // 30
```

## Aritmética de punteros

Sumar 1 a un puntero no lo desplaza un byte, sino`sizeof(type)`es bytes:

```c
int tab[3] = {10, 20, 30};
int *p = tab;

printf("%d\n", *p);       // 10
printf("%d\n", *(p + 1)); // 20 -> avance de sizeof(int) octets, pas de 1 octet
printf("%d\n", *(p + 2)); // 30
```

> **Nota:** un array `tab` se comporta como un puntero a su primer elemento. `tab[i]` y `*(tab + i)` son dos formas de escribir que son estrictamente equivalentes en C; por eso, la indexación de arrays (`[]`) también funciona con un puntero sin tipo.

## Puntero a puntero

Un puntero puede a su vez ser objeto de otro puntero, lo cual resulta útil para modificar un puntero desde una función (véase «pase por dirección» más abajo):

```c
int edad = 25;
int *ptr = &edad;
int **ptrPtr = &ptr;

printf("%d\n", **ptrPtr); // 25 -> déréférence deux fois : ptrPtr -> ptr -> age
```

## Pasar un puntero a una función (paso por dirección)

En C, los argumentos se pasan **por valor** (una copia) de forma predeterminada; por lo tanto, una función no puede modificar la variable original del llamante, salvo que se le pase directamente la dirección de dicha variable:

```c
void incrementer(int *número)
{
    (*número)++; // modifie la valeur à l'adresse pointée, donc la variable d'origine
}

int main(void)
{
    int x = 5;
    incrementer(&x);
    printf("%d\n", x); // 6
}
```

Sin el `*`, `incrementer(int número)` solo modificaría una copia local, sin que ello tuviera ningún efecto en `x`.

## Punteros a funciones

Una función también tiene una dirección en memoria, que se puede almacenar en un puntero, lo cual resulta útil para elegir dinámicamente qué función llamar (callbacks, tablas de despacho):

```c
int addition(int a, int b) { return a + b; }
int soustraction(int a, int b) { return a - b; }

int (*operation)(int, int) = addition;

printf("%d\n", operation(4, 2)); // 6
operation = soustraction;
printf("%d\n", operation(4, 2)); // 2
```

## `NULL` y punteros no válidos

Un puntero no inicializado contiene una dirección **aleatoria** («wild pointer»); al desreferenciarlo se produce un comportamiento indefinido, a menudo un fallo del sistema (`segmentation fault`). Un puntero que aún no se utilice debe inicializarse explícita`NULL` y comprobarse antes de desreferenciarlo:

```c
int *ptr = NULL;

if (ptr != NULL) {
    printf("%d\n", *ptr);
} else {
    printf("ptr ne pointe vers rien.\n");
}
```

> **Nota:** un puntero que apuntaba a una zona de memoria liberada (`free()`; véase el capítulo sobre gestión de la memoria) se denomina **«puntero colgante» (dangling pointer**). Desreferenciarlo es un error clásico (*use-after-free*): la memoria puede parecer que sigue conteniendo el valor correcto por casualidad, hasta que se reutiliza en otro lugar.

## `const` con punteros

Dos usos muy distintos de «`const`», que a menudo se confunden:

```c
const int *p1;  // p1 peut changer d'adresse, mais pas modifier la valeur pointée
int *const p2 = &x; // p2 ne peut plus changer d'adresse, mais peut modifier la valeur pointée
```

| Redacción | Qué está protegido |
|---|---|
| `const int *p` | El **valor al que apunta** no se puede modificar mediante `p` |
| `int *const p` | El **puntero en sí** ya no se puede reasignar tras la inicialización |
| `const int *const p` | Ni lo uno ni lo otro |

## Resumen

| Notación | Significado |
|---|---|
| `int *ptr` | Declara un puntero a un `int` |
| `&variable` | Dirección de memoria de `variable` |
| `*ptr` | Valor en la dirección contenida en `ptr` |
| `ptr + 1` | Dirección siguiente, desplazada `sizeof(type)` bytes |
| `NULL` | Puntero que no apunta a nada válido |

Véase también el capítulo sobre la gestión de la memoria (`malloc` / `free`), que se basa directamente en estos conceptos.
