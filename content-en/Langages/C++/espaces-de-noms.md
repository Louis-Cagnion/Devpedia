---
order: 2
---

# Namespaces

**A namespace** groups identifiers (functions, classes, variables) under a common prefix to prevent name collisions between different parts of a project or different libraries, the same purpose as the namespaces we’ve already discussed in PHP (see the dedicated chapter).

## Declaring and Using a Namespace

```cpp
namespace Facturation {
    class Facture {
    public:
        double montant;
    };

    double calculerTVA(double montant) {
        return montant * 0.20;
    }
}

Facturation::Facture f;                    // Full access, via "::"
double tva = Facturation::calculerTVA(100);
```

## `using namespace` : Import without a prefix

```cpp
using namespace Facturation;

Facture f;              // The "Billing::" prefix is no longer needed
double tva = calculerTVA(100);
```

> **Note (best practice):** Including `using namespace X;` at the top of a header file (`.h`) is generally discouraged: it forces this import on **any** file that includes that header, creating a risk of unmanageable name collisions. Reserve `using namespace` for use within a specific `.cpp` file; never use it in a shared header.

## `std` : the standard library namespace

```cpp
std::vector<int> numbers;   // "vector" is in the "std" namespace, hence the prefix
std::cout << "Bonjour";      // Same goes for "cost"
```

```cpp
// In ANOTHER block/file, after "using namespace std;":
using namespace std;          // makes "vector," "cout," etc., usable without a prefix

vector<int> autresNombres;
cout << "Bonjour";
```

That is exactly why all the code in the previous chapters (STL, exceptions, etc.) uses the prefix `std::`: `vector`, `map`, `cout`, `runtime_error`... are all declared in the `std` namespace of the standard library.

## Selective Import

```cpp
using std::cout;   // Import ONLY "cout," not the entire std namespace

cout << "Bonjour";      // works
vector<int> v;             // ERROR: "vector" always requires std:: (not imported)
```

A compromise between the cumbersomeness of a systematic prefix and the risk of a complete "`using namespace`", importing only what is actually used, by name.

## Nested namespaces

```cpp
namespace Entreprise {
    namespace Facturation {
        class Facture { /* ... */ };
    }
}

// A more concise equivalent since C++17:
namespace Entreprise::Facturation {
    class Facture { /* ... */ };
}

Entreprise::Facturation::Facture f;
```
