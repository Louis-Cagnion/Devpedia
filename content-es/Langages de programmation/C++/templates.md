---
order: 10
---

# Las plantillas (programación genérica)

Una **plantilla** permite escribir una función o una clase **una sola vez**, válida para cualquier tipo, sin sacrificar ni la verificación de tipos en la compilación ni el rendimiento (a diferencia de los lenguajes de tipado dinámico como Python o PHP; véanse los capítulos dedicados a ellos).

## Sin plantilla: la duplicación

```cpp
int maximum(int a, int b) { return (a > b) ? a : b; }
double maximum(double a, double b) { return (a > b) ? a : b; }
std::string maximum(std::string a, std::string b) { return (a > b) ? a : b; }
```

Tres funciones estrictamente idénticas en su lógica, duplicadas únicamente por el tipo; exactamente el tipo de repetición que elimina una plantilla (véase el principio DRY, ya mencionado para otros lenguajes).

## Plantilla de función

```cpp
template <typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

maximum(3, 7);            // T se deduce automáticamente como int
maximum(3.5, 2.1);          // T se deduce como doble
maximum<std::string>("a", "b");  // Se especifica explícitamente «T» cuando es necesario.
```

El compilador **genera** una versión distinta de la función para cada tipo realmente utilizado (`maximum<int>`, `maximum<double>`...) —esto es lo que se conoce como instanciación de plantillas, que se lleva a cabo íntegramente durante la compilación, sin ningún coste en la ejecución.

## Plantilla de clase

```cpp
template <typename T>
class Pile {
public:
    void empiler(T valor) { elements.push_back(valor); }
    T depiler() {
        if (estVide()) {
            throw std::out_of_range("Pile vide"); // Véase el capítulo sobre excepciones: nunca se debe desapilar en vacío.
        }
        T dernier = elements.back();
        elements.pop_back();
        return dernier;
    }
    bool estVide() const { return elements.empty(); }

private:
    std::vector<T> elements;
};

Pile<int> pileEntiers;
pileEntiers.empiler(42);

Pile<std::string> pileTextes;
pileTextes.empiler("bonjour");
```

Una única definición de «`Pile`», que se puede utilizar con cualquier tipo: así es exactamente como se construyen los contenedores de la STL (`std::vector<T>`, `std::map<K, V>`..., véase el capítulo dedicado a este tema).

## Restricciones de tipo (C++20: `concepts`)

Sin restricciones, una plantilla admite cualquier tipo, incluidos aquellos para los que la operación no tiene sentido, lo que genera un error de compilación que suele ser largo y poco claro:

```cpp
template <typename T>
T addition(T a, T b) { return a + b; }

addition(2, 3);          // De acuerdo
addition("a", "b");        // Error de compilación que puede resultar críptico según el tipo
```

Desde C++20, los **conceptos** permiten expresar explícitamente los requisitos en `T`, lo que proporciona un mensaje de error más claro y una intención del código más legible:

```cpp
template <typename T>
concept Numerique = std::is_arithmetic_v<T>;

template <Numerique T>
T addition(T a, T b) { return a + b; }
```

## Plantillas frente a genericidad dinámica (Python, PHP)

| | Plantillas de C++ | Tipado dinámico (Python/PHP) |
|---|---|---|
| Verificación de tipo | En la compilación | En la ejecución (o nunca, según el lenguaje) |
| Coste en tiempo de ejecución | Nulo (código generado específicamente para cada tipo) | Ligero sobrecoste (comprobaciones de tipo continuas) |
| Detección de errores de tipo | Incluso antes de iniciar el programa | Solo al ejecutar la parte del código en cuestión |

Véase también el capítulo sobre los contenedores STL, que se basa íntegramente en este mecanismo de plantillas.
