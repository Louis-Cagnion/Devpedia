---
order: 2
---

# Los espacios de nombres (namespaces)

Un **espacio de nombres** (*namespace*) agrupa identificadores (funciones, clases, variables) bajo un prefijo común, para evitar colisiones de nombres entre diferentes partes de un proyecto o diferentes bibliotecas —la misma necesidad que los espacios de nombres ya vistos en PHP (véase el capítulo dedicado a ello).

## Declarar y utilizar un espacio de nombres

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

Facturation::Facture f;                    // Acceso completo, mediante «::»
double tva = Facturation::calculerTVA(100);
```

## `using namespace` : importar sin prefijo

```cpp
using namespace Facturation;

Facture f;              // Ya no es necesario el prefijo «Facturación::»
double tva = calculerTVA(100);
```

> **Nota (buena práctica):** Por lo general, no se recomienda incluir «`using namespace X;`» al principio de un archivo de encabezado (`.h`), ya que obliga a importar este módulo en **cualquier** archivo que incluya dicho encabezado, con el riesgo de que se produzcan conflictos de nombres que ya no se pueden controlar. Reserva «`using namespace`» para su uso dentro de un archivo `.cpp` concreto, nunca en un encabezado compartido.

## `std` : el espacio de nombres de la biblioteca estándar

```cpp
std::vector<int> números;   // «vector» se encuentra en el espacio de nombres «std», de ahí el prefijo
std::cout << "Bonjour";      // Lo mismo para «cout».
```

```cpp
// En OTRO bloque/archivo, después de «using namespace std;»:
using namespace std;          // permite utilizar «vector», «cout», etc., sin prefijo

vector<int> autresNombres;
cout << "Bonjour";
```

Precisamente por este motivo, todo el código de los capítulos anteriores (STL, excepciones...) utiliza el prefijo `std::`: `vector`, `map`, `cout`, `runtime_error`... están todos declarados en el espacio de nombres `std` de la biblioteca estándar.

## Importación selectiva

```cpp
using std::cout;   // Importa ÚNICAMENTE «cout», no todo el espacio de nombres std

cout << "Bonjour";      // funciona
vector<int> v;             // ERROR: «vector» siempre requiere std:: (no importado)
```

Un término medio entre la pesadez del prefijo sistemático y el riesgo de un «`using namespace`» completo: importar solo lo que realmente se utiliza, por su nombre.

## Espacios de nombres anidados

```cpp
namespace Entreprise {
    namespace Facturation {
        class Facture { /* ... */ };
    }
}

// Equivalente más conciso desde C++17:
namespace Entreprise::Facturation {
    class Facture { /* ... */ };
}

Entreprise::Facturation::Facture f;
```
