---
order: 5
---

# Los genéricos en C: despacho por etiqueta de tipo

El C no tiene un mecanismo de genericidad nativo como los [templates](/?c=langages-de-programmation&s=cpp&p=templates) en C++: no hay compilador que genere una versión especializada de una función para cada tipo utilizado. Escribir una función que acepte "cualquier tipo" requiere entonces una técnica manual, construida directamente sobre los [punteros](/?c=langages-de-programmation&s=c&p=pointeurs): el puntero genérico `void*`, acompañado de una **etiqueta de tipo** que indica, en tiempo de ejecución, qué apunta realmente.

## El problema: `void*` no sabe qué apunta

Un `void*` puede almacenar la dirección de cualquier dato, pero pierde toda información sobre el **tipo** de ese dato: imposible desreferenciarlo directamente, imposible hacer aritmética de punteros sobre él (el compilador no conoce `sizeof(tipo)`).

```c
void mostrar(void *dato) {
    printf("%d\n", *(int *)dato);  // supone que dato apunta a un int: peligroso
}
```

Esta función funciona mientras solo se la llame con un `int*`, pero nada impide que se la llame con un `float*` o una cadena: el cast `(int *)` mentiría silenciosamente al compilador, sin error ni advertencia, hasta el comportamiento indefinido en tiempo de ejecución.

## La técnica: acompañar el `void*` con una etiqueta de tipo

La solución consiste en no hacer circular nunca un `void*` solo, sino siempre acompañado de un dato que identifique su tipo real, casi siempre una cadena o un valor de enumeración:

```c
typedef struct {
    void *dato;
    char *tipo;   // "int", "float", "string"...
} Valor;

void mostrar(Valor v) {
    if (strcmp(v.tipo, "int") == 0) {
        printf("%d\n", *(int *)v.dato);
    } else if (strcmp(v.tipo, "float") == 0) {
        printf("%f\n", *(float *)v.dato);
    } else if (strcmp(v.tipo, "string") == 0) {
        printf("%s\n", (char *)v.dato);
    }
}
```

El cast ya no es una suposición: está **condicionado** por la etiqueta, verificada antes de usarse. La función sabe, en tiempo de ejecución, qué tiene realmente en sus manos.

> **Trampa:** comparar las etiquetas con `==` en lugar de `strcmp()` si son cadenas de caracteres. `v.tipo == "int"` compara dos direcciones, no dos textos (véase la misma observación en el capítulo [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs)): según cómo se haya asignado la cadena literal, la comparación puede fallar aunque el texto sea idéntico.

## Despachar sin una cadena de `if`/`else if`

Una cadena de comparaciones se convierte rápidamente en un código que hay que hacer crecer manualmente con cada nuevo tipo: exactamente el tipo de repetición que una [estructura indexada](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees) permite evitar, aquí bajo la forma de una **tabla de despacho** que asocia cada etiqueta a un [puntero de función](/?c=langages-de-programmation&s=c&p=pointeurs):

```c
void mostrarInt(void *d)    { printf("%d\n", *(int *)d); }
void mostrarFloat(void *d)  { printf("%f\n", *(float *)d); }
void mostrarString(void *d) { printf("%s\n", (char *)d); }

typedef struct {
    char *tipo;
    void (*funcion)(void *);
} Despacho;

Despacho tabla[] = {
    {"int", mostrarInt},
    {"float", mostrarFloat},
    {"string", mostrarString},
};

void mostrar(Valor v) {
    for (int i = 0; i < 3; i++) {
        if (strcmp(tabla[i].tipo, v.tipo) == 0) {
            tabla[i].funcion(v.dato);
            return;
        }
    }
}
```

Añadir un tipo se reduce a añadir una línea en `tabla`, nunca a tocar `mostrar()` en sí misma.

## Lo que esto resuelve, y lo que no resuelve

| | `void*` + etiqueta (C) | Templates (C++) |
|---|---|---|
| Verificación del tipo | En tiempo de ejecución, por el propio código | En tiempo de compilación, por el compilador |
| Costo en tiempo de ejecución | Comparación de etiqueta + indirección en cada llamada | Nulo (código especializado generado por tipo) |
| Tipo incorrecto | Bug silencioso si la etiqueta miente o se olvida | Error de compilación |
| Lo que realmente se generaliza | El código que manipula el dato | El código **y** la garantía de tipo |

Véase [Los templates](/?c=langages-de-programmation&s=cpp&p=templates): la misma intención (escribir una vez, usar con cualquier tipo) resuelta en un momento completamente distinto del ciclo de vida del programa. Como el C no ofrece verificación en tiempo de compilación para este tipo de código, la responsabilidad de la coherencia entre `dato` y `tipo` recae por completo en el programador, sin red de seguridad.

> **Buena práctica:** centralizar la construcción de un `Valor` (nunca asignar `dato`/`tipo` por separado a mano en varios lugares) en una única función por tipo (`valorDesdeInt()`, `valorDesdeFloat()`...), para que una etiqueta incoherente con su dato no pueda aparecer en ningún otro lugar que no sea ese único punto de entrada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El C no tiene genericidad verificada en tiempo de compilación: `void*` hace circular un dato de tipo cualquiera, pero pierde su tipo. Una etiqueta (cadena o enum) transportada junto al `void*` restaura esa información en tiempo de ejecución, condición del cast antes de la desreferenciación. |
| **Herramientas utilizables** | Una tabla de despacho (etiqueta -> puntero de función) para evitar una cadena de `if`/`else if` que crece con cada nuevo tipo. |
| **Trampas a evitar** | Comparar etiquetas de tipo cadena con `==` en lugar de `strcmp()`. Confiar en un cast sin haber comprobado antes la etiqueta. |
| **Buenas prácticas** | Centralizar la construcción del par dato/etiqueta en una función dedicada por tipo, para que no pueda aparecer ninguna incoherencia en otro lugar. |
