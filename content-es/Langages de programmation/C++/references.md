---
order: 1
---

# Referencias

Una **referencia** es un alias —otro nombre para una variable ya existente, nunca una variable independiente—. Resuelve un problema muy concreto del lenguaje C: hasta ahora, para pasar una variable a una función para que esta pudiera modificarla, era necesario manipular punteros de forma explícita (véase el capítulo sobre punteros, apartado C).

## Declarar una referencia

```cpp
int edad = 25;
int &refAge = edad;   // refAge es OTRO NOMBRE para age, no una copia

refAge = 30;
std::cout << edad;    // 30 -> modificar refAge modifica directamente age
```

> **Nota:** a diferencia de un puntero, una referencia **debe** inicializarse en el momento de su declaración y, a partir de entonces, **nunca** puede reasignarse para apuntar a otra variable; una vez vinculada a `edad`, `refAge` seguirá siendo un alias de `edad` durante toda su vida útil.

## Pasar un parámetro por referencia a una función

```cpp
void incrementer(int &número) {
    número++;   // No es necesario desreferenciar con *, a diferencia de lo que ocurre con un puntero en C.
}

int x = 5;
incrementer(x);
std::cout << x;   // 6
```

En comparación con el equivalente en C (véase el capítulo sobre punteros):

```c
void incrementer(int *número) {
    (*número)++;
}
incrementer(&x);
```

La referencia evita la sintaxis `*` / `&` tanto en la llamada como dentro de la función, al tiempo que se obtiene exactamente el mismo comportamiento (modificar la variable del llamante).

## `const &` : evitar la copia sin correr el riesgo de que se produzcan modificaciones

Pasar un objeto grande por valor (una copia completa) en cada llamada a la función consume tiempo y memoria. Pasarlo por referencia evita la copia, pero permite que la función modifique el original; «`const &`» combina ambas ventajas:

```cpp
void afficher(const std::string &texto) {   // No se permite copiar, Y el texto no se puede modificar aquí.
    std::cout << texto;
}
```

> **Nota:** se ha convertido en la convención por defecto en C++ para pasar un objeto de gran tamaño (cadena, vector, estructura...) en modo de solo lectura a una función: es más rápido que una copia y más seguro que un puntero sin tipo (no hay riesgo de «`nullptr`», ni hay que gestionar la sintaxis de desreferenciación).

## Referencia frente a puntero

| | Referencia | Puntero |
|---|---|---|
| Puede ser `null` | No, nunca | Sí (`nullptr`) |
| Reasignable tras la inicialización | No | Sí |
| Sintaxis de acceso | Directa, igual que la propia variable | Requiere «`*`» para desreferenciar |
| Debe inicializarse en el momento de la declaración | Sí, obligatorio | No |

Por lo tanto, una referencia está más restringida que un puntero; eso es precisamente lo que la hace más segura en los casos en los que no es necesario eludir esas restricciones (ya se sabe que la variable existe y que no cambiará de destino).
