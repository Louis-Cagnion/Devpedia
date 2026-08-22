---
order: 8
---

# La STL: los contenedores

La **STL** (*Standard Template Library*) proporciona estructuras de datos genéricas (véase [Las plantillas](/?c=langages-de-programmation&s=cpp&p=templates)), listas para usar, en lugar de tener que reimplementar a mano [una lista encadenada](/?c=langages-de-programmation&s=c&p=listes-chainees) o [una tabla hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage): la práctica totalidad de los proyectos C++ modernos se apoyan en estos contenedores estándar.

## `std::vector`: el array dinámico

```cpp
#include <vector>

std::vector<int> numeros = {1, 2, 3};

numeros.push_back(4);  // añade al final
numeros[0];             // acceso directo por índice, como un array en C
numeros.size();          // número de elementos
numeros.pop_back();       // elimina el último elemento

for (int n : numeros) {  // recorrido simple, como un for-each
    std::cout << n << " ";
}
```

> **Nota:** `std::vector` es, internamente, un array contiguo en memoria (véase [Los punteros](/?c=langages-de-programmation&s=c&p=pointeurs) y [La gestión de la memoria](/?c=langages-de-programmation&s=c&p=memoire)) que se redimensiona automáticamente (a menudo duplicando su capacidad) cuando está lleno: el mismo principio que [una lista de Python](/?c=langages-de-programmation&s=python&p=listes-et-tuples) o un [`ArrayList`](https://docs.oracle.com/en/java/) de Java, pero sin la capa de indirección de un lenguaje con recolector de basura.

## `std::list`: la lista doblemente encadenada

```cpp
#include <list>

std::list<int> lista = {1, 2, 3};
lista.push_front(0);   // inserción al principio en tiempo constante -> std::vector sería O(n) aquí
```

A diferencia de `std::vector`, insertar en medio o al principio de una `std::list` no requiere desplazar los demás elementos (véase [las listas encadenadas](/?c=langages-de-programmation&s=c&p=listes-chainees)), a cambio de un acceso por índice imposible en tiempo constante (`lista[2]` no existe, hay que recorrerla).

## `std::map`: el diccionario ordenado

```cpp
#include <map>

std::map<std::string, int> edades;
edades["Juan"] = 25;
edades["Maria"] = 30;

edades["Juan"];                       // 25
edades.find("Ana") != edades.end();  // comprueba la existencia de una clave (no hay operador "in" directo en C++)

for (const auto &[nombre, edad] : edades) {  // recorrido: los pares SIEMPRE están ordenados por clave
    std::cout << nombre << " : " << edad << "\n";
}
```

> **Nota:** `std::map` es internamente un árbol equilibrado (a menudo un [árbol rojo-negro](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree), una variante de [el árbol binario de búsqueda](/?c=langages-de-programmation&s=c&p=arbres-binaires)): las claves se recorren entonces siempre **ordenadas**, a diferencia de [un array asociativo de PHP](/?c=langages-de-programmation&s=php&p=variables) o un [`dict` de Python](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) (orden de inserción). `std::unordered_map` ofrece el equivalente basado en [una tabla hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage), más rápido en promedio pero sin orden garantizado.

## `std::set`: los valores únicos, ordenados

```cpp
#include <set>

std::set<int> valores = {3, 1, 2, 1};   // {1, 2, 3} -> ordenado Y deduplicado automáticamente

valores.insert(4);
valores.count(2);   // 1 si está presente, 0 si no (un set nunca contiene duplicados)
```

`std::unordered_set` es el equivalente basado en una tabla hash, más rápido en promedio, sin orden garantizado.

## Elegir el contenedor adecuado

| Necesidad | Contenedor |
|---|---|
| Acceso rápido por índice, añadir al final de la colección | `std::vector` |
| Inserciones/eliminaciones frecuentes en medio/al principio de la colección | `std::list` |
| Asociación clave → valor, se necesita orden | `std::map` |
| Asociación clave → valor, orden indiferente, velocidad prioritaria | `std::unordered_map` |
| Valores únicos, ordenados | `std::set` |
| Valores únicos, orden indiferente, velocidad prioritaria | `std::unordered_set` |

Véase también [La STL: iteradores, algoritmos y lambdas](/?c=langages-de-programmation&s=cpp&p=stl-algorithmes-et-iterateurs), que permite manipular cualquiera de estos contenedores de forma uniforme.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | La STL proporciona contenedores genéricos listos para usar: `vector` (array dinámico), `list` (lista doblemente encadenada), `map`/`set` (ordenados), `unordered_map`/`unordered_set` (tabla hash, más rápidos pero sin ordenar). |
| **Herramientas utilizables** | `push_back`/`push_front`, `size`, `find`, recorrido for-each. |
| **Trampas a evitar** | Elegir `vector` para inserciones frecuentes al principio (coste `O(n)`, `list` sería en tiempo constante). |
| **Buenas prácticas** | Elegir el contenedor según la operación dominante (acceso por índice, inserción frecuente, asociación ordenada...) en lugar de por costumbre. |
