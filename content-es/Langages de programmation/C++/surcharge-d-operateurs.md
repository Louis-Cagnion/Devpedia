---
order: 5
---

# La sobrecarga de operadores

C++ permite redefinir el comportamiento de los operadores estándar (`+`, `==`, `<<`...) para tipos personalizados: lo que permite que un objeto creado por el usuario se comporte, en apariencia, como un tipo nativo del lenguaje.

## Sobrecargar `+`

```cpp
class Vector2D {
public:
    Vector2D(double x, double y) : x(x), y(y) {}

    Vector2D operator+(const Vector2D &otro) const {
        return Vector2D(x + otro.x, y + otro.y);
    }

    double x, y;
};

Vector2D a(1, 2);
Vector2D b(3, 4);
Vector2D c = a + b;   // en realidad, llama a a.operator+(b) -> Vector2D(4, 6)
```

`a + b` es transformado literalmente por el compilador en `a.operator+(b)`: el operador no es más que un método con un nombre particular y una sintaxis de llamada especial.

## Sobrecargar `==`

```cpp
class Punto {
public:
    Punto(int x, int y) : x(x), y(y) {}

    bool operator==(const Punto &otro) const {
        return x == otro.x && y == otro.y;
    }

    int x, y;
};

Punto p1(1, 2);
Punto p2(1, 2);
std::cout << (p1 == p2);   // true -> sin sobrecarga, compararía las DIRECCIONES, no el contenido
```

> **Nota:** sin sobrecarga de `==`, comparar dos objetos con `==` compara por defecto su **dirección de memoria** (como comparar dos punteros), nunca su contenido: una fuente de errores frecuente para quien espera una comparación "por valor" automática.

## Sobrecargar `<<` para la visualización

```cpp
class Punto {
public:
    Punto(int x, int y) : x(x), y(y) {}
    int x, y;
};

std::ostream &operator<<(std::ostream &os, const Punto &p) {
    os << "(" << p.x << ", " << p.y << ")";
    return os;
}

Punto p(3, 4);
std::cout << p;   // (3, 4) -> sin esta sobrecarga: error de compilación, << no conoce Punto
```

> **Nota:** esta sobrecarga se escribe fuera de la clase (una función libre, no un método), ya que el objeto de la izquierda de `<<` es el flujo (`std::ostream`), no el `Punto`; `p << std::cout` no tendría sentido, pero `std::cout << p` debe funcionar.

## Lo que no hay que hacer: sobrecargar sin respetar el sentido esperado

```cpp
// A EVITAR: "+" que no realiza una suma en el sentido intuitivo del término
Vector2D operator+(const Vector2D &otro) const {
    return Vector2D(x * otro.x, y * otro.y);   // engañoso: ¡"+" que multiplica!
}
```

> **Nota (buena práctica):** un operador sobrecargado debe comportarse de forma **predecible**, coherente con el sentido habitual del símbolo (`+` suma, `==` compara una igualdad lógica...). Una sobrecarga que contradiga esta expectativa hace que el código resulte engañoso para cualquiera que lo vuelva a leer, incluido uno mismo más adelante.

## Resumen de los operadores sobrecargados con más frecuencia

| Operador | Uso típico |
|---|---|
| `+`, `-`, `*` | Operaciones aritméticas sobre un tipo matemático (vector, matriz, número complejo...) |
| `==`, `!=` | Comparación lógica del contenido de dos objetos |
| `<<`, `>>` | Visualización (`std::cout`) y lectura (`std::cin`) de un objeto |
| `[]` | Acceso indexado, para un tipo que se comporta como una colección |
| `()` | Hacer que un objeto sea "invocable" como una función (*functor*) |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | C++ permite redefinir un operador estándar (`+`, `==`, `<<`...) para un tipo personalizado: `a + b` se traduce en `a.operator+(b)`. Sin sobrecarga, `==` compara por defecto las direcciones, no el contenido. |
| **Herramientas utilizables** | `operator+`, `operator==`, `operator<<` (función libre, fuera de la clase). |
| **Trampas a evitar** | Sobrecargar un operador con un comportamiento que contradice su sentido habitual (`+` que multiplicaría). |
| **Buenas prácticas** | Mantener un operador sobrecargado predecible y coherente con el símbolo estándar: nunca un comportamiento sorprendente para quien vuelva a leer el código. |
