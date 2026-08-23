---
order: 2
---

# Los espacios de nombres (namespaces)

Un **espacio de nombres** (*namespace*) agrupa identificadores (funciones, clases, variables) bajo un prefijo común, para evitar colisiones de nombres entre distintas partes de un proyecto o distintas bibliotecas: la misma necesidad que los namespaces de [PHP](/?c=langages-de-programmation&s=php&p=php), cuyo [autoloading](/?c=langages-de-programmation&s=php&p=autoloading) muestra un uso concreto.

## Declarar y usar un namespace

```cpp
namespace Facturacion {
    class Factura {
    public:
        double monto;
    };

    double calcularIVA(double monto) {
        return monto * 0.20;
    }
}

Facturacion::Factura f;                    // acceso completo, mediante "::"
double iva = Facturacion::calcularIVA(100);
```

## `using namespace`: importar sin prefijo

```cpp
using namespace Facturacion;

Factura f;              // ya no hace falta el prefijo "Facturacion::"
double iva = calcularIVA(100);
```

> **Nota (buena práctica):** `using namespace X;` al principio de un archivo de cabecera (`.h`) suele desaconsejarse: impone esta importación a **todo** archivo que incluya esa cabecera, con un riesgo de colisión de nombres que ya no se controla. Reservar `using namespace` al interior de un archivo `.cpp` concreto, nunca en una cabecera compartida.

## `std`: el namespace de la biblioteca estándar

```cpp
std::vector<int> numeros;  // "vector" vive en el namespace "std", de ahí el prefijo
std::cout << "Hola";       // lo mismo para "cout"
```

```cpp
// En OTRO bloque/archivo, tras "using namespace std;":
using namespace std;          // permite usar "vector", "cout"... sin prefijo

vector<int> otrosNumeros;
cout << "Hola";
```

Es exactamente por esta razón que todo el código de los capítulos anteriores (STL, excepciones...) usa el prefijo `std::`: `vector`, `map`, `cout`, `runtime_error`... están todos declarados en el namespace `std` de la biblioteca estándar.

## Importación selectiva

```cpp
using std::cout;    // importa ÚNICAMENTE "cout", no todo el namespace std

cout << "Hola";     // funciona
vector<int> v;      // ERROR: "vector" sigue requiriendo std:: (no importado)
```

Un término medio entre la pesadez del prefijo sistemático y el riesgo de un `using namespace` completo: importar solo lo que realmente se usa, nominalmente.

## Namespaces anidados

```cpp
namespace Empresa {
    namespace Facturacion {
        class Factura { /* ... */ };
    }
}

// equivalente más conciso desde C++17:
namespace Empresa::Facturacion {
    class Factura { /* ... */ };
}

Empresa::Facturacion::Factura f;
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | Un namespace agrupa identificadores bajo un prefijo (`Namespace::identificador`) para evitar colisiones de nombres. `using namespace` importa sin prefijo; `using X::y` importa de forma selectiva. |
| **Herramientas utilizables** | `namespace`, `using namespace`, importación selectiva (`using std::cout`), namespaces anidados (`A::B`). |
| **Trampas a evitar** | Escribir `using namespace X;` en una cabecera: impone esa importación a todo archivo que la incluya. |
| **Buenas prácticas** | Reservar `using namespace` al interior de un archivo `.cpp`, nunca en una cabecera compartida. |
