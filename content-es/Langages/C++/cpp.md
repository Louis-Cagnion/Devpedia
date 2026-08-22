---
order: 2
---

# C++

C++ nació como una extensión de [C](/?c=langages-de-programmation&s=c&p=c) ("C with Classes"), y sigue siendo retrocompatible con casi la totalidad de ese lenguaje: prácticamente todo lo que se aplica allí (punteros, memoria, structs, compilación) funciona directamente en C++.

```cpp
#include <iostream>

int main() {
    int edad = 25;                   // una variable, igual que en C
    std::cout << edad << std::endl;  // imprime: 25
}
```

Lo que C++ añade por encima de C:

| Término | Qué significa |
|---|---|
| Programación orientada a objetos | Organizar el código en torno a objetos que agrupan datos y las funciones que los manipulan (véase [Clases y objetos](/?c=langages-de-programmation&s=cpp&p=classes-et-objets)) |
| RAII | Un recurso (memoria, archivo...) se libera automáticamente cuando el objeto que lo posee se destruye, véase [Gestión de memoria y RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii), lo que limita drásticamente las fugas de memoria posibles en C |
| Plantillas | Escribir una función o una clase una sola vez, válida para varios tipos distintos, sin sacrificar el rendimiento, véase [Las plantillas](/?c=langages-de-programmation&s=cpp&p=templates) |

C++ conserva así el control de bajo nivel de C (memoria, rendimiento, ausencia de recolector de basura) al tiempo que ofrece herramientas de más alto nivel para estructurar un proyecto de gran tamaño: un compromiso que explica su presencia duradera en los motores de videojuegos y los sistemas embebidos exigentes.

> **Nota:** a diferencia de [Python](/?c=langages-de-programmation&s=python&p=python) o [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), C++ sigue siendo **compilado** a código máquina nativo (véase [La compilación](/?c=langages-de-programmation&s=c&p=compilation)): ninguna máquina virtual, ningún intérprete entre el código y su ejecución.
