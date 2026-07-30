---
order: 8
---

# La STL: los contenedores

La **STL** (*Standard Template Library*) proporciona estructuras de datos genéricas (véase el capítulo sobre plantillas), listas para usar —en lugar de tener que reimplementar manualmente una lista enlazada o una tabla hash (véanse los capítulos dedicados a ello, sección C)—, casi todos los proyectos modernos en C++ se basan en estos contenedores estándar.

## `std::vector` : la tabla dinámica

```cpp
#include <vector>

std::vector<int> números = {1, 2, 3};

números.push_back(4);        // añadir al final
números[0];                     // Acceso directo mediante índice, como un array en C
números.size();                  // número de elementos
números.pop_back();                // elimina el último elemento

for (int n : números) {              // recorrido simple, como un «for-each»
    std::cout << n << " ";
}
```

> **Nota:** `std::vector` es, internamente, una matriz contigua en memoria (véase el capítulo sobre punteros y memoria, apartado C) que cambia de tamaño automáticamente (a menudo duplicando su capacidad) cuando se llena —el mismo principio que una lista de Python o un «`ArrayList`» de Java, pero sin la capa de indirección de un lenguaje con recolector de basura—.

## `std::list` : la lista doblemente encadenada

```cpp
#include <list>

std::list<int> lista = {1, 2, 3};
lista.push_front(0);   // Inserción al principio en tiempo constante -> std::vector sería O(n) en este caso
```

A diferencia de `std::vector`, insertar un elemento en medio o al principio de una `std::list` no requiere desplazar los demás elementos (véase el capítulo sobre listas encadenadas, apartado C), aunque a cambio no es posible el acceso por índice en tiempo constante (no existe `lista[2]`, hay que recorrer la lista).

## `std::map` : el diccionario ordenado

```cpp
#include <map>

std::map<std::string, int> ages;
ages["Jean"] = 25;
ages["Marie"] = 30;

ages["Jean"];                       // 25
ages.find("Ali") != ages.end();       // Comprueba si existe una clave (en C++ no existe el operador «in» directamente)

for (const auto &[número, edad] : ages) {   // recorrido: los pares SIEMPRE están ordenados por clave
    std::cout << número << " : " << edad << "\n";
}
```

> **Nota:** `std::map` es, internamente, un árbol equilibrado (a menudo un árbol rojo-negro, una variante del árbol binario de búsqueda que se trata en el capítulo dedicado, apartado C); por lo tanto, las claves siempre se recorren **ordenadas**, a diferencia de un array asociativo de PHP o un `dict` de Python (orden de inserción). `std::unordered_map` ofrece el equivalente basado en una tabla hash (véase el capítulo dedicado, apartado C), más rápido de media pero sin orden garantizado.

## `std::set` : los valores únicos, ordenados

```cpp
#include <set>

std::set<int> valores = {3, 1, 2, 1};   // {1, 2, 3} -> ordenado Y deduplicado automáticamente

valores.insert(4);
valores.count(2);   // 1 si está presente, 0 en caso contrario (un conjunto nunca contiene duplicados)
```

`std::unordered_set` es el equivalente basado en una tabla hash —más rápido de media, sin orden garantizado—.

## Elegir el contenedor adecuado

| Necesidad | Contenedor |
|---|---|
| Acceso rápido mediante índice, incorporación al final de la colección | `std::vector` |
| Inserciones/eliminaciones frecuentes en el medio o al principio de la colección | `std::list` |
| Asociación clave → valor, orden de clasificación obligatorio | `std::map` |
| Asociación clave → valor, orden indiferente, velocidad prioritaria | `std::unordered_map` |
| Valores únicos, ordenados | `std::set` |
| Valores únicos, orden indiferente, velocidad prioritaria | `std::unordered_set` |

Véase también el capítulo sobre iteradores y algoritmos STL, que permiten manipular cualquiera de estos contenedores de forma uniforme.
