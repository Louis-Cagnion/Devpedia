---
order: 4
---

# Los punteros

Un puntero es una variable que no almacena un valor directamente, sino la **dirección de memoria** de otra variable. Es el mecanismo central que permite en C manipular la memoria directamente, pasar datos a las funciones sin copiarlos y construir estructuras de datos dinámicas (listas encadenadas, árboles...).

## Declaración, dirección y desreferenciación

```c
int edad = 25;
int *ptr = &edad;

printf("%d\n", edad);   // 25          -> el valor
printf("%p\n", &edad);  // 0x7ffee...  -> la dirección de memoria de edad
printf("%p\n", ptr);    // 0x7ffee...  -> la misma dirección, almacenada en ptr
printf("%d\n", *ptr);   // 25          -> el valor apuntado por ptr
```

- `&variable`: operador "dirección de", devuelve la dirección de memoria de una variable.
- `*ptr` (en la declaración): indica que `ptr` es un puntero.
- `*ptr` (fuera de una declaración): operador de **desreferenciación**, accede al valor almacenado en la dirección contenida en `ptr`.

Modificar `*ptr` modifica directamente `edad`, ya que ambos designan la misma ubicación en memoria:

```c
*ptr = 30;
printf("%d\n", edad); // 30
```

## Aritmética de punteros

Sumar 1 a un puntero no lo avanza un byte, sino `sizeof(tipo)` bytes:

```c
int array[3] = {10, 20, 30};
int *p = array;

printf("%d\n", *p);        // 10
printf("%d\n", *(p + 1));  // 20 -> avanza sizeof(int) bytes, no 1 byte
printf("%d\n", *(p + 2));  // 30
```

> **Nota:** un array `array` se comporta como un puntero a su primer elemento. `array[i]` y `*(array + i)` son dos formas de escritura estrictamente equivalentes en C: por eso la indexación de arrays (`[]`) también funciona sobre un simple puntero.

### `[]` no es más que azúcar sintáctico

La equivalencia anterior es más profunda que una simple comodidad de escritura: el operador `[]` no tiene en C **ninguna noción** de "array" ni de "índice". El compilador lo traduce mecánicamente, siempre, por:

```text
a[b]  ≡  *(a + b)
```

Como la suma es conmutativa (`array + 2` y `2 + array` designan la misma dirección), se obtiene una consecuencia sorprendente pero perfectamente legal:

```c
int array[5] = {1, 2, 3, 4, 5};

printf("%d\n", array[2]);      // 3
printf("%d\n", *(array + 2));  // 3
printf("%d\n", 2[array]);      // ¡también 3!
```

> `2[array]` no sirve de nada en la práctica y solo tiene cabida en preguntas trampa de entrevista. En cambio, entender *por qué* esto compila resulta útil: refuerza el hecho de que, en C, indexar un array **es** aritmética de punteros, y nada más.

## Puntero a puntero

Un puntero puede a su vez ser apuntado por otro puntero, lo cual resulta útil para modificar un puntero desde una función (véase el paso por dirección más abajo):

```c
int edad = 25;
int *ptr = &edad;
int **ptrPtr = &ptr;

printf("%d\n", **ptrPtr); // 25 -> desreferencia dos veces: ptrPtr -> ptr -> edad
```

## Pasar un puntero a una función (paso por dirección)

En C, los argumentos se pasan **por valor** (una copia) de forma predeterminada: una función no puede entonces modificar la variable original de quien la llama, salvo que se le pase directamente la dirección de dicha variable:

```c
void incrementar(int *numero)
{
    (*numero)++; // modifica el valor en la dirección apuntada, por lo tanto la variable original
}

int main(void)
{
    int x = 5;
    incrementar(&x);
    printf("%d\n", x); // 6
}
```

Sin el `*`, `incrementar(int numero)` solo modificaría una copia local, sin efecto sobre `x`.

## Punteros a funciones

Una función también tiene una dirección en memoria, que se puede almacenar en un puntero, lo cual resulta útil para elegir dinámicamente qué función llamar (callbacks, tablas de despacho):

```c
int suma(int a, int b) { return a + b; }
int resta(int a, int b) { return a - b; }

int (*operacion)(int, int) = suma;

printf("%d\n", operacion(4, 2)); // 6
operacion = resta;
printf("%d\n", operacion(4, 2)); // 2
```

## `NULL` y punteros no válidos

Un puntero no inicializado contiene una dirección **aleatoria** ("wild pointer"): desreferenciarlo produce un comportamiento indefinido, a menudo un fallo del sistema (`segmentation fault`). Un puntero que aún no se utiliza debe ponerse explícitamente a `NULL`, y comprobarse antes de desreferenciarlo:

```c
int *ptr = NULL;

if (ptr != NULL) {
    printf("%d\n", *ptr);
} else {
    printf("ptr no apunta a nada.\n");
}
```

> **Nota:** un puntero que apuntaba a una zona de memoria liberada (`free()`, véase [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)) se denomina **puntero colgante** (*dangling pointer*). Desreferenciarlo es un error clásico (*use-after-free*): la memoria puede parecer que aún contiene el valor correcto por casualidad, hasta que se reutiliza en otro lugar.

## Comparar punteros: ¿la dirección o el valor?

Con un puntero, hay dos cosas distintas que comparar, y confundir ambas es una fuente de errores:

```c
int a = 5;  // almacenada en la dirección 0x1000
int b = 5;  // almacenada en la dirección 0x2000
int *p1 = &a;
int *p2 = &b;

p1 == p2    // falso: las direcciones son diferentes
*p1 == *p2  // verdadero: los valores apuntados son idénticos
```

- `p1 == p2` compara las **direcciones**: "¿estos dos punteros designan la misma ubicación de memoria?"
- `*p1 == *p2` compara los **valores apuntados**: "¿el contenido es el mismo?"

Por lo tanto, dos punteros pueden perfectamente contener el mismo valor sin ser iguales, y viceversa.

> Esta distinción (comparación por **referencia** o por **valor**) no es exclusiva de C, se encuentra en la mayoría de los lenguajes. En [Python](/?c=langages-de-programmation&s=python&p=python), `is` compara la identidad (el equivalente de `p1 == p2`) y `==` compara el valor (el equivalente de `*p1 == *p2`); véase el capítulo [Variables](/?c=langages-de-programmation&s=python&p=variables) de Python. Comparar cadenas en C ilustra la misma trampa: `str1 == str2` compara dos direcciones, no dos textos: hace falta `strcmp()`.

## `const` con punteros

Dos usos de `const` bien distintos, a menudo confundidos:

```c
const int *p1;       // p1 puede cambiar de dirección, pero no modificar el valor apuntado
int *const p2 = &x;  // p2 ya no puede cambiar de dirección, pero puede modificar el valor apuntado
```

| Notación | Qué está protegido |
|---|---|
| `const int *p` | El **valor apuntado** no se puede modificar mediante `p` |
| `int *const p` | El **puntero en sí** ya no se puede reasignar tras la inicialización |
| `const int *const p` | Ni lo uno ni lo otro |

## Resumen

| Notación | Significado |
|---|---|
| `int *ptr` | Declara un puntero a un `int` |
| `&variable` | Dirección de memoria de `variable` |
| `*ptr` | Valor en la dirección contenida en `ptr` |
| `ptr + 1` | Dirección siguiente, desplazada `sizeof(tipo)` bytes |
| `NULL` | Puntero que no apunta a nada válido |

Véase también [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire) (`malloc`/`free`), que se apoya directamente en estos conceptos.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un puntero almacena la dirección de memoria de una variable. `&` obtiene una dirección, `*` desreferencia (accede al valor apuntado). Indexar un array (`array[i]`) es estrictamente equivalente a `*(array + i)`. |
| **Herramientas utilizables** | Punteros de puntero, punteros de función, `const` para proteger el valor apuntado y/o el propio puntero. |
| **Trampas a evitar** | Desreferenciar un puntero no inicializado o `NULL`; confundir la comparación de direcciones (`p1 == p2`) con la de valores apuntados (`*p1 == *p2`); usar un puntero después de su `free()` (puntero colgante). |
| **Buenas prácticas** | Inicializar todo puntero no utilizado a `NULL` y comprobarlo antes de desreferenciarlo; pasar la dirección de una variable a una función solo cuando realmente deba modificarla. |
