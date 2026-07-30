---
order: 6
---

# Las excepciones

C++ ofrece un mecanismo de errores estructurado (`try` / `catch` / `throw`), una alternativa al estilo «a la C» (una función devuelve un valor especial como `-1` o `NULL`, y establece `errno`; véase el capítulo sobre llamadas al sistema, apartado C), el mismo principio que las excepciones de PHP, Python o JavaScript que ya hemos visto en los apartados correspondientes.

## `try` / `catch` / `throw`

```cpp
double diviser(double a, double b) {
    if (b == 0) {
        throw std::runtime_error("Division par zéro");
    }
    return a / b;
}

try {
    double resultado = diviser(10, 0);
} catch (const std::runtime_error &error) {
    std::cout << "Erreur : " << error.what() << "\n";
}
```

## La jerarquía estándar de excepciones

```cpp
#include <stdexcept>

std::exception              // Clase base de todas las excepciones estándar
  ├── std::logic_error        // error detectable antes de la ejecución (p. ej., argumento no válido)
  │     ├── std::invalid_argument
  │     └── std::out_of_range
  └── std::runtime_error       // error detectable únicamente en tiempo de ejecución
        ├── std::overflow_error
        └── std::underflow_error
```

Al interceptar `const std::exception &` se captura cualquier excepción derivada de esta jerarquía estándar; esto resulta útil como último recurso, pero es preferible interceptar el tipo más **específico** posible para poder reaccionar de forma diferente según el problema real.

## Crear una excepción propia

```cpp
class SoldeInsuffisantException : public std::runtime_error {
public:
    SoldeInsuffisantException(double saldo)
        : std::runtime_error("Solde insuffisant : " + std::to_string(saldo)) {}
};

void retirer(double saldo, double montant) {
    if (montant > saldo) {
        throw SoldeInsuffisantException(saldo);
    }
}

try {
    retirer(100, 150);
} catch (const SoldeInsuffisantException &e) {
    std::cout << e.what() << "\n";
} catch (const std::exception &e) {   // red de seguridad para cualquier otra excepción estándar
    std::cout << "Erreur inattendue : " << e.what() << "\n";
}
```

## Excepciones y RAII: por qué este mecanismo es seguro en C++

```cpp
void traiter() {
    GestionnaireFichier gf("donnees.txt");   // Véase el capítulo sobre RAII
    throw std::runtime_error("Erreur pendant le traitement");
}   // Incluso aquí, ~GestionnaireFichier() se ejecuta ANTES de que la excepción se propague a un nivel superior.
```

Cuando se lanza una excepción, C++ «desenrolla la pila» (*stack unwinding*): se invoca el destructor de cada objeto local que aún esté activo, en orden inverso al de su creación, antes de que la excepción continúe ascendiendo; esto es lo que garantiza que un recurso gestionado por RAII (véase el capítulo dedicado) siempre se libere correctamente, incluso en caso de un error imprevisto.

## `noexcept` : garantizar que una función nunca se interrumpa

```cpp
void fonctionSure() noexcept {
    // El compilador puede optimizar sabiendo que no se producirá ninguna excepción a partir de aquí.
    // Si, a pesar de todo, se produce una excepción, el programa se detiene inmediatamente (std::terminate).
}
```

> **Buena práctica:** lanzar una excepción solo en situaciones realmente **excepcionales** (error imprevisto, invariante violada), nunca en un flujo de control normal (una excepción tiene un coste de ejecución nada desdeñable en comparación con un simple «`if`», a diferencia de un retorno de error clásico).
