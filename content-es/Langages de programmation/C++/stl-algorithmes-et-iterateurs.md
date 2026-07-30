---
order: 9
---

# La STL: iteradores, algoritmos y lambda

Un **iterador** es una abstracción que permite recorrer cualquier contenedor STL (véase el capítulo dedicado a ello) de la misma manera, ya sea un «`vector`» (matriz contigua) o un «`list`» (lista encadenada): el código de recorrido no cambia, aunque la estructura subyacente sea radicalmente diferente.

## El principio del iterador

```cpp
std::vector<int> números = {1, 2, 3};

std::vector<int>::iterator it = números.begin();
while (it != números.end()) {
    std::cout << *it << " ";   // «*it» desreferencia el iterador, como si fuera un puntero (véase el capítulo correspondiente, apartado C)
    ++it;
}
```

- `begin()` Devuelve un iterador que apunta al primer elemento.
- `end()` Devuelve un iterador «justo después» del último elemento (que nunca se desreferencia directamente, solo se compara).
- `*it` Desreferencia el iterador actual, `++it` avanza al siguiente — una sintaxis que se asemeja deliberadamente a la de un puntero sin tipo.

## El «for-each» moderno (C++11+)

```cpp
for (int n : números) {
    std::cout << n << " ";
}
```

Esta sintaxis se basa **exactamente** en el mismo mecanismo de iteradores en segundo plano: se trata de un atajo sintáctico, válido para cualquier tipo que exponga `begin()` / `end()`.

## Los algoritmos estándar (`<algorithm>`)

En lugar de escribir manualmente un bucle para cada operación habitual, la STL proporciona algoritmos genéricos que funcionan con **pares de iteradores** (inicio, fin), por lo que son válidos para cualquier contenedor:

```cpp
#include <algorithm>

std::vector<int> números = {5, 3, 1, 4, 2};

std::sort(números.begin(), números.end());               // ordenación in situ -> {1, 2, 3, 4, 5}

auto it = std::find(números.begin(), números.end(), 3);    // iterador que apunta al valor 3
bool trouve = (it != números.end());

int somme = std::accumulate(números.begin(), números.end(), 0);  // 15 -> requiere <numérico>

std::for_each(números.begin(), números.end(), [](int n) {
    std::cout << n * 2 << " ";
});
```

## Las lambda (C++11+)

Una **lambda** es una función anónima, escrita directamente en el lugar donde se utiliza —el mismo concepto que los closures de JavaScript o las lambdas de Python (véanse los capítulos correspondientes)):

```cpp
auto carre = [](int x) { return x * x; };
std::cout << carre(5);   // 25
```

```cpp
int seuil = 3;
auto estAuDessusDuSeuil = [seuil](int x) { return x > seuil; };   // captura «umbral» por valor

int compte = std::count_if(números.begin(), números.end(), estAuDessusDuSeuil);
```

- `[]` : lista de captura: qué variables externas puede utilizar la lambda y cómo (`[seuil]` por valor, `[&seuil]` por referencia, `[&]` todo por referencia, `[=]` todo por valor).
- `()` : parámetros, como en una función clásica.
- `{}` : cuerpo de la lambda.

## Algoritmos habituales

| Función | Papel |
|---|---|
| `std::sort` | Ordena un rango de elementos |
| `std::find` | Busca la primera aparición de un valor |
| `std::count` / `std::count_if` | Cuenta las ocurrencias (con o sin condición) |
| `std::for_each` | Aplica una función a cada elemento |
| `std::transform` | Genera un nuevo rango aplicando una función a cada elemento (equivalente a «`map`» en Python/JS) |
| `std::accumulate` | Reduce un rango a un único valor (equivalente a `reduce`) |

> **Nota:** utilizar estos algoritmos en lugar de bucles manuales hace que la intención sea explícita (en `std::sort`, se dice «estoy ordenando», mientras que un bucle con un algoritmo de ordenación escrito a mano obliga a deducirlo)— lo que supone una mejora directa de la legibilidad, además de evitar tener que reimplementar (y, potencialmente, implementar incorrectamente) una lógica ya estandarizada y optimizada.
