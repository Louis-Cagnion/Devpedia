---
order: 10
---

# Las plantillas (programación genérica)

Un **template** permite escribir una función o una clase **una sola vez**, válida para cualquier tipo, sin sacrificar ni la verificación de tipos en la compilación ni el rendimiento (a diferencia de lenguajes de tipado dinámico como [Python](/?c=langages-de-programmation&s=python&p=python) o [PHP](/?c=langages-de-programmation&s=php&p=php)).

## Sin template: la duplicación

```cpp
int maximum(int a, int b) { return (a > b) ? a : b; }
double maximum(double a, double b) { return (a > b) ? a : b; }
std::string maximum(std::string a, std::string b) { return (a > b) ? a : b; }
```

Tres funciones estrictamente idénticas en su lógica, duplicadas únicamente por el tipo: exactamente el tipo de repetición que un template elimina (véase [Evitar la repetición mediante estructuras indexadas](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees), el principio DRY aplicado de forma más general).

## Template de función

```cpp
template <typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

maximum(3, 7);                   // T deducido automáticamente como int
maximum(3.5, 2.1);               // T deducido como double
maximum<std::string>("a", "b");  // T especificado explícitamente si es necesario
```

El compilador **genera** una versión distinta de la función para cada tipo realmente utilizado (`maximum<int>`, `maximum<double>`...): esto es lo que se llama instanciación de template, realizada íntegramente en la compilación, sin ningún coste en la ejecución.

## Template de clase

```cpp
template <typename T>
class Pila {
public:
    void apilar(T valor) { elementos.push_back(valor); }
    T desapilar() {
        if (estaVacia()) {
            throw std::out_of_range("Pila vacía"); // véase Las excepciones: nunca desapilar en vacío
        }
        T ultimo = elementos.back();
        elementos.pop_back();
        return ultimo;
    }
    bool estaVacia() const { return elementos.empty(); }

private:
    std::vector<T> elementos;
};

Pila<int> pilaEnteros;
pilaEnteros.apilar(42);

Pila<std::string> pilaTextos;
pilaTextos.apilar("hola");
```

Una sola definición de `Pila`, utilizable con cualquier tipo: así es exactamente como se construyen [los contenedores de la STL](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs) (`std::vector<T>`, `std::map<K, V>`...).

## Restricciones sobre el tipo (C++20: `concepts`)

Sin restricción, un template acepta cualquier tipo, incluidos tipos para los que la operación no tiene sentido, lo que produce un error de compilación a menudo largo y poco claro:

```cpp
template <typename T>
T addition(T a, T b) { return a + b; }

addition(2, 3);      // OK
addition("a", "b");  // Error de compilación potencialmente críptico según el tipo
```

Desde C++20, los **concepts** permiten expresar explícitamente los requisitos sobre `T`, para un mensaje de error más claro y una intención del código más legible:

```cpp
template <typename T>
concept Numerico = std::is_arithmetic_v<T>;

template <Numerico T>
T addition(T a, T b) { return a + b; }
```

## Templates frente a genericidad dinámica (Python, PHP)

| | Templates de C++ | Tipado dinámico (Python/PHP) |
|---|---|---|
| Verificación de tipo | En la compilación | En la ejecución (o nunca, según el lenguaje) |
| Coste en la ejecución | Nulo (código generado específicamente para cada tipo) | Ligero sobrecoste (comprobaciones de tipo continuas) |
| Detección de error de tipo | Incluso antes de lanzar el programa | Solo al ejecutar la ruta de código en cuestión |

Véase también [La STL: los contenedores](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs), que se apoya enteramente en este mecanismo de templates.

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un template escribe una función/clase una sola vez para cualquier tipo, con verificación en la compilación y sin coste en la ejecución (el compilador genera una versión por cada tipo utilizado). |
| **Herramientas utilizables** | `template <typename T>`, `concepts` (C++20) para restringir los tipos aceptados. |
| **Trampas a evitar** | Un template sin restricción acepta cualquier tipo, incluidos aquellos para los que la operación no tiene sentido: error de compilación a veces críptico. |
| **Buenas prácticas** | Usar los `concepts` (C++20) para expresar explícitamente los requisitos sobre un tipo de template, en lugar de dejar que un mensaje de error genérico lo revele. |
