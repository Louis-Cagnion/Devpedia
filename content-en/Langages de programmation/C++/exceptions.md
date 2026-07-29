---
order: 6
---

# Exceptions

C++ provides a structured error-handling mechanism (`try` / `catch` / `throw`), an alternative to the "C-style" approach (where a function returns a special value such as `-1` or `NULL`, and sets `errno`; see the chapter on system calls, under the C section)—the same principle as PHP exceptions, Python, or JavaScript exceptions already covered in the corresponding sections.

## `try` / `catch` / `throw`

```cpp
double diviser(double a, double b) {
    if (b == 0) {
        throw std::runtime_error("Division par zéro");
    }
    return a / b;
}

try {
    double resultat = diviser(10, 0);
} catch (const std::runtime_error &erreur) {
    std::cout << "Erreur : " << erreur.what() << "\n";
}
```

## The Standard Exception Hierarchy

```cpp
#include <stdexcept>

std::exception              // base class for all standard exceptions
  ├── std::logic_error        // error that can be detected before execution (e.g., invalid argument)
  │     ├── std::invalid_argument
  │     └── std::out_of_range
  └── std::runtime_error       // an error that can only be detected at runtime
        ├── std::overflow_error
        └── std::underflow_error
```

Intercepting `const std::exception &` catches any exception derived from this standard hierarchy—useful as a last resort, but intercepting the most **specific** type possible is still preferable so you can handle each actual problem differently.

## Create Your Own Exception

```cpp
class SoldeInsuffisantException : public std::runtime_error {
public:
    SoldeInsuffisantException(double solde)
        : std::runtime_error("Solde insuffisant : " + std::to_string(solde)) {}
};

void retirer(double solde, double montant) {
    if (montant > solde) {
        throw SoldeInsuffisantException(solde);
    }
}

try {
    retirer(100, 150);
} catch (const SoldeInsuffisantException &e) {
    std::cout << e.what() << "\n";
} catch (const std::exception &e) {   // safety net for any other standard exception
    std::cout << "Erreur inattendue : " << e.what() << "\n";
}
```

## Exceptions and RAII: Why This Mechanism Is Safe in C++

```cpp
void traiter() {
    GestionnaireFichier gf("donnees.txt");   // See the chapter on RAII
    throw std::runtime_error("Erreur pendant le traitement");
}   // Even here, ~FileManager() runs BEFORE the exception is propagated upward
```

When an exception is thrown, C++ performs "stack* unwinding*": each local object that is still alive has its destructor called, in the reverse order of their creation, before the exception continues to propagate upward—this ensures that a resource managed by RAII (see the dedicated chapter) is always released properly, even in the event of an unexpected error.

## `noexcept` : ensure that a function never returns

```cpp
void fonctionSure() noexcept {
    // The compiler can optimize the code, knowing that no exception will be thrown from here on.
    // If an exception is thrown despite this, the program terminates immediately (std::terminate)
}
```

> **Best practice:** Throw an exception only in truly **exceptional** situations (unforeseen error, violated invariant)—never for normal control flow (an exception incurs a significant runtime cost compared to a simple `if`, unlike a traditional error return).
