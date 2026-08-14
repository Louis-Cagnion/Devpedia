---
order: 1
---

# Las referencias

Una **referencia** es un alias: otro nombre para una variable ya existente, nunca una variable independiente. Resuelve un problema muy concreto de C: pasar una variable a una función para que esta pudiera modificarla obligaba hasta ahora a manipular explícitamente [punteros](/?c=langages-de-programmation&s=c&p=pointeurs).

## Declarar una referencia

```cpp
int edad = 25;
int &refEdad = edad;   // refEdad es OTRO NOMBRE para edad, no una copia

refEdad = 30;
std::cout << edad;    // 30 -> modificar refEdad modifica directamente edad
```

> **Nota:** a diferencia de un puntero, una referencia **debe** inicializarse desde su declaración, y luego **nunca** puede reasignarse para designar otra variable; una vez vinculada a `edad`, `refEdad` seguirá siendo un alias de `edad` durante toda su vida.

## Pasar por referencia a una función

```cpp
void incrementar(int &numero) {
    numero++;   // no hace falta desreferenciar con *, a diferencia de un puntero en C
}

int x = 5;
incrementar(x);
std::cout << x;   // 6
```

En comparación con [el equivalente en C](/?c=langages-de-programmation&s=c&p=pointeurs):

```c
void incrementar(int *numero) {
    (*numero)++;
}
incrementar(&x);
```

La referencia evita la sintaxis `*`/`&` tanto en la llamada como dentro de la función, obteniendo exactamente el mismo comportamiento (modificar la variable de quien llama).

## `const &`: evitar una copia sin arriesgar una modificación

Pasar un objeto grande por valor (una copia completa) en cada llamada a la función cuesta tiempo y memoria. Pasarlo por referencia evita la copia, pero permite que la función modifique el original; `const &` combina ambas ventajas:

```cpp
void mostrar(const std::string &texto) {   // sin copia, Y texto no puede modificarse aquí
    std::cout << texto;
}
```

> **Nota:** se ha convertido en la convención por defecto en C++ para pasar un objeto voluminoso (cadena, vector, estructura...) en modo de solo lectura a una función: más rápido que una copia, más seguro que un puntero crudo (sin riesgo de `nullptr`, sin sintaxis de desreferenciación que gestionar).

## Referencia frente a puntero

| | Referencia | Puntero |
|---|---|---|
| Puede ser `null` | No, nunca | Sí (`nullptr`) |
| Reasignable tras la inicialización | No | Sí |
| Sintaxis de acceso | Directa, como la propia variable | Requiere `*` para desreferenciar |
| Debe inicializarse en la declaración | Sí, obligatorio | No |

Una referencia es, por tanto, más restringida que un puntero: es precisamente eso lo que la hace más segura en los casos en los que no hace falta sortear esas restricciones (ya se sabe que la variable existe y que no cambiará de destino).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Una referencia es un alias de una variable existente: nunca `null`, nunca reasignable tras la inicialización, sin sintaxis `*`/`&` en su uso. `const &` pasa un objeto voluminoso sin copia ni riesgo de modificación. |
| **Herramientas utilizables** | `&` en la declaración de tipo (referencia), `const &` para un parámetro de solo lectura. |
| **Trampas a evitar** | Creer que una referencia puede ser `null` o reasignarse como un puntero: ambas cosas son imposibles. |
| **Buenas prácticas** | Pasar un objeto voluminoso por `const &` por defecto, en lugar de por valor (copia costosa) o por puntero crudo. |
