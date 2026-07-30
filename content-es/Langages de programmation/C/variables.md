---
order: 1
---

# Variables y tipos de datos

Las variables se utilizan para almacenar datos en memoria, de modo que un programa pueda manipularlos. En el lenguaje C, cada variable tiene un tipo que determina:

- La cantidad de memoria asignada.
- Los valores que puede contener.
- Las operaciones que se pueden realizar con ella.

Comprender los diferentes tipos de datos es fundamental para escribir programas eficaces y entender mejor la gestión de la memoria.

## Los números enteros (`int`)

El tipo `int` permite almacenar números enteros positivos o negativos.

```c
int edad = 25;
int temperature = -5;
```

El tamaño de un «`int`» depende de la arquitectura del equipo, pero suele ser de 4 bytes (32 bits).

## Los caracteres (`char`)

El tipo «`char`» permite almacenar un único carácter.

```c
char letter = 'A';
char digit = '5';
```

Un «`char`» suele ocupar 1 byte en memoria y contiene el valor ASCII del carácter.

## Los valores booleanos (`bool`)

Desde la norma C99, el lenguaje proporciona el tipo «`bool`» a través de la biblioteca «`stdbool.h`».

```c
#include <stdbool.h>

bool isConnected = true;
bool isAdmin = false;
```

Un valor booleano representa un valor lógico:

- `true`
- `false`

Antes de C99, era habitual utilizar números enteros (`0` para «falso» y un valor distinto de cero para «verdadero»).

## Los números de coma flotante

El lenguaje C ofrece varios tipos para representar números decimales:

```c
float price = 9.99f;
double pi = 3.1415926535;
```

- `float` : precisión simple
- `double` : precisión doble

## Las cadenas de caracteres

El lenguaje C no dispone de un tipo «string» nativo. Una cadena de caracteres se representa mediante una matriz de caracteres que termina con el carácter nulo (`\0`).

```c
char name[] = "Devpedia";
```

En memoria:

```
D e v p e d i a \0
```

Por lo tanto, una cadena es simplemente una secuencia de caracteres almacenados de forma contigua.

## Los punteros

Los punteros son una de las características más importantes del lenguaje C.

Permiten almacenar la dirección de memoria de una variable.

```c
int edad = 25;
int *ptr = &edad;
```

Aquí:

- `edad` contiene un valor.
- `ptr` Contiene la dirección de memoria de `edad`.

Los punteros se utilizan para:

- Manipular directamente la memoria.
- Pasar datos a las funciones.
- Creación de estructuras de datos complejas.

## Las estructuras (`struct`)

Las estructuras permiten agrupar varios datos en un mismo objeto.

```c
struct User
{
    int id;
    char name[50];
};
```

A menudo se utilizan para representar entidades complejas.

## Resumen

Los principales tipos de datos en C son:

| Tipo | Descripción |
|--------|-------------|
| `bool` | Valor lógico |
| `char` | Carácter |
| `int` | Entero |
| `float` | Número decimal |
| `double` | Número decimal de alta precisión |
| `char[]` | Cadena de caracteres |
| `struct` | Conjunto de datos personalizados |
| `pointer` | Dirección de memoria |

Es imprescindible dominar estos tipos antes de abordar conceptos más avanzados como las listas encadenadas, los árboles binarios, los subprocesos o la gestión de procesos; véanse los capítulos dedicados a cada uno de estos temas.
