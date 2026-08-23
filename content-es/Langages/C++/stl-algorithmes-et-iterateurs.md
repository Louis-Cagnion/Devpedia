---
order: 9
---

# La STL: iteradores, algoritmos y lambdas

Un **iterador** es una abstracción que permite recorrer cualquier [contenedor STL](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs) de la misma manera, ya sea un `vector` (array contiguo) o una `list` (lista encadenada): el código de recorrido no cambia, aunque la estructura subyacente sea radicalmente distinta.

## El principio del iterador

```cpp
std::vector<int> numeros = {1, 2, 3};

std::vector<int>::iterator it = numeros.begin();
while (it != numeros.end()) {
    std::cout << *it << " ";   // "*it" desreferencia el iterador, como un puntero (véase Los punteros, apartado C)
    ++it;
}
```

- `begin()` devuelve un iterador que apunta al primer elemento.
- `end()` devuelve un iterador "justo después" del último elemento (nunca se desreferencia directamente, solo se compara).
- `*it` desreferencia el iterador actual, `++it` avanza al siguiente: una sintaxis deliberadamente cercana a la de un puntero bruto.

## El for-each moderno (C++11+)

```cpp
for (int n : numeros) {
    std::cout << n << " ";
}
```

Esta sintaxis se apoya **exactamente** en el mismo mecanismo de iteradores por detrás: es un atajo sintáctico, válido para cualquier tipo que exponga `begin()`/`end()`.

## Los algoritmos estándar (`<algorithm>`)

En lugar de escribir manualmente un bucle para cada operación habitual, la STL proporciona algoritmos genéricos que funcionan sobre **pares de iteradores** (inicio, fin), por lo que son válidos para cualquier contenedor:

```cpp
#include <algorithm>

std::vector<int> numeros = {5, 3, 1, 4, 2};

std::sort(numeros.begin(), numeros.end());               // ordena en el sitio -> {1, 2, 3, 4, 5}

auto it = std::find(numeros.begin(), numeros.end(), 3);  // iterador que apunta al valor 3
bool encontrado = (it != numeros.end());

int suma = std::accumulate(numeros.begin(), numeros.end(), 0);  // 15 -> requiere <numeric>

std::for_each(numeros.begin(), numeros.end(), [](int n) {
    std::cout << n * 2 << " ";
});
```

## Las lambdas (C++11+)

Una **lambda** es una función anónima, escrita directamente donde se utiliza: el mismo concepto que [los closures de JavaScript](/?c=langages-de-programmation&s=javascript&p=fonctions) o [las lambdas de Python](/?c=langages-de-programmation&s=python&p=fonctions):

```cpp
auto cuadrado = [](int x) { return x * x; };
std::cout << cuadrado(5);   // 25
```

```cpp
int umbral = 3;
auto estaPorEncimaDelUmbral = [umbral](int x) { return x > umbral; };   // captura "umbral" por valor

int cuenta = std::count_if(numeros.begin(), numeros.end(), estaPorEncimaDelUmbral);
```

- `[]`: lista de captura, qué variables externas puede utilizar la lambda y cómo (`[umbral]` por valor, `[&umbral]` por referencia, `[&]` todo por referencia, `[=]` todo por valor).
- `()`: parámetros, como en una función clásica.
- `{}`: cuerpo de la lambda.

## Algoritmos habituales

| Función | Papel |
|---|---|
| `std::sort` | Ordena un rango de elementos |
| `std::find` | Busca la primera aparición de un valor |
| `std::count` / `std::count_if` | Cuenta las apariciones (con o sin condición) |
| `std::for_each` | Aplica una función a cada elemento |
| `std::transform` | Produce un nuevo rango aplicando una función a cada elemento (equivalente a `map` en [Python](/?c=langages-de-programmation&s=python&p=python)/JS) |
| `std::accumulate` | Reduce un rango a un único valor (equivalente a `reduce`) |

> **Nota:** usar estos algoritmos en lugar de bucles manuales hace la intención explícita (`std::sort` dice "estoy ordenando", un bucle con un algoritmo de ordenación escrito a mano obliga a deducirlo): una ganancia de legibilidad directa, además de evitar reimplementar (y potencialmente implementar mal) una lógica ya estandarizada y optimizada.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un iterador recorre cualquier contenedor STL de manera uniforme (`begin()`/`end()`, `*it`, `++it`). Los algoritmos estándar (`sort`, `find`, `accumulate`...) operan sobre pares de iteradores, válidos para cualquier contenedor. |
| **Herramientas utilizables** | `std::sort`, `std::find`, `std::count_if`, `std::transform`, `std::accumulate`, lambdas (`[](...){ ... }`). |
| **Trampas a evitar** | Desreferenciar `end()`: nunca apunta a un elemento real, solo a una posición "justo después" del último. |
| **Buenas prácticas** | Preferir un algoritmo estándar con nombre (`std::sort`) a un bucle manual equivalente: la intención es explícita y la lógica ya está optimizada. |
