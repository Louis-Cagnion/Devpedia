---
order: 6
---

# Las excepciones

C++ ofrece un mecanismo de errores estructurado (`try`/`catch`/`throw`), una alternativa al estilo "a la C" (una función devuelve un valor especial como `-1` o `NULL`, y establece `errno`, véase [Las llamadas al sistema y los descriptores de archivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)): el mismo principio que las excepciones de [PHP](/?c=langages-de-programmation&s=php&p=exceptions), [Python](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) o [JavaScript](/?c=langages-de-programmation&s=javascript&p=gestion-des-erreurs) ya vistas en los apartados correspondientes.

## `try` / `catch` / `throw`

```cpp
double dividir(double a, double b) {
    if (b == 0) {
        throw std::runtime_error("Division por cero");
    }
    return a / b;
}

try {
    double resultado = dividir(10, 0);
} catch (const std::runtime_error &error) {
    std::cout << "Error: " << error.what() << "\n";
}
```

## La jerarquía estándar de las excepciones

```cpp
#include <stdexcept>

std::exception          // clase base de todas las excepciones estándar
  ├── std::logic_error  // error detectable antes de la ejecución (ej.: argumento no válido)
  │     ├── std::invalid_argument
  │     └── std::out_of_range
  └── std::runtime_error       // error detectable solo en tiempo de ejecución
        ├── std::overflow_error
        └── std::underflow_error
```

Interceptar `const std::exception &` captura cualquier excepción derivada de esta jerarquía estándar: útil como último recurso, pero interceptar el tipo más **preciso** posible sigue siendo preferible para reaccionar de forma distinta según el problema real.

## Crear una excepción propia

```cpp
class SaldoInsuficienteException : public std::runtime_error {
public:
    SaldoInsuficienteException(double saldo)
        : std::runtime_error("Saldo insuficiente: " + std::to_string(saldo)) {}
};

void retirar(double saldo, double monto) {
    if (monto > saldo) {
        throw SaldoInsuficienteException(saldo);
    }
}

try {
    retirar(100, 150);
} catch (const SaldoInsuficienteException &e) {
    std::cout << e.what() << "\n";
} catch (const std::exception &e) {   // red de seguridad para cualquier otra excepción estándar
    std::cout << "Error inesperado: " << e.what() << "\n";
}
```

## Excepciones y RAII: por qué este mecanismo es seguro en C++

```cpp
void procesar() {
    GestorArchivo gestor("datos.txt");   // véase RAII y los punteros inteligentes
    throw std::runtime_error("Error durante el procesamiento");
}   // incluso aquí, ~GestorArchivo() se ejecuta ANTES de que la excepción siga propagándose
```

Cuando se lanza una excepción, C++ "desenrolla la pila" (*stack unwinding*): cada objeto local aún vivo ve cómo se llama a su destructor, en el orden inverso al de su creación, antes de que la excepción siga ascendiendo: esto es lo que garantiza que un recurso gestionado mediante [RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii) siempre se libere correctamente, incluso en caso de un error imprevisto.

## `noexcept`: garantizar que una función nunca lanza

```cpp
void funcionSegura() noexcept {
    // el compilador puede optimizar sabiendo que ninguna excepción saldrá de aquí
    // si a pesar de todo escapa una excepción, el programa se detiene de inmediato (std::terminate)
}
```

> **Buena práctica:** lanzar una excepción solo para una situación realmente **excepcional** (error imprevisto, [invariante](/?c=performance&p=traitements-longs) violada), nunca para un flujo de control normal (una excepción tiene un coste nada desdeñable en tiempo de ejecución en comparación con un simple `if`, a diferencia de un retorno de error clásico).

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `try`/`catch`/`throw` estructura la gestión de errores. La jerarquía estándar (`std::exception` y sus derivados) permite interceptar por tipo preciso. El *stack unwinding* garantiza que un recurso RAII se libere incluso en caso de excepción. |
| **Herramientas utilizables** | `std::runtime_error`, `std::logic_error`, excepciones personalizadas que heredan de `std::exception`, `noexcept`. |
| **Trampas a evitar** | Usar una excepción para un flujo de control normal: coste nada desdeñable en comparación con un simple `if`. |
| **Buenas prácticas** | Interceptar el tipo más preciso posible en lugar de `std::exception` sistemáticamente; reservar las excepciones para situaciones realmente excepcionales. |
