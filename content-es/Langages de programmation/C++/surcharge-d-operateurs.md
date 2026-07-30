---
order: 5
---

# La sobrecarga de operadores

C++ permite redefinir el comportamiento de los operadores estándar (`+`, `==`, `<<`...) para tipos personalizados, lo que permite que un objeto creado por el usuario se comporte, en apariencia, como un tipo nativo del lenguaje.

## Sobrecargar`+`

```cpp
class Vecteur2D {
public:
    Vecteur2D(double x, double y) : x(x), y(y) {}

    Vecteur2D operator+(const Vecteur2D &autre) const {
        return Vecteur2D(x + autre.x, y + autre.y);
    }

    double x, y;
};

Vecteur2D a(1, 2);
Vecteur2D b(3, 4);
Vecteur2D c = a + b;   // En realidad, se llama a.operator+(b) -> Vector2D(4, 6)
```

`a + b` El compilador lo transforma literalmente en `a.operator+(b)`: el operador no es más que un método con un nombre concreto y una sintaxis de llamada especial.

## Sobrecargar`==`

```cpp
class Point {
public:
    Point(int x, int y) : x(x), y(y) {}

    bool operator==(const Point &autre) const {
        return x == autre.x && y == autre.y;
    }

    int x, y;
};

Point p1(1, 2);
Point p2(1, 2);
std::cout << (p1 == p2);   // true -> sin sobrecarga, compararía las DIRECCIONES, no el contenido
```

> **Nota:** sin sobrecarga de «`==`», al comparar dos objetos con «`==`», por defecto se comparan sus **direcciones de memoria** (como si se compararan dos punteros), nunca su contenido —una fuente frecuente de errores para quienes esperan una comparación «por valor» automática—.

## `<<`, para visualizarla

```cpp
class Point {
public:
    Point(int x, int y) : x(x), y(y) {}
    int x, y;
};

std::ostream &operator<<(std::ostream &os, const Point &p) {
    os << "(" << p.x << ", " << p.y << ")";
    return os;
}

Point p(3, 4);
std::cout << p;   // (3, 4) -> sin esta sobrecarga: error de compilación, «no reconoce Point»
```

> **Nota:** esta sobrecarga se escribe fuera de la clase (una función libre, no un método), ya que el objeto de la izquierda de «`<<`» es el flujo (`std::ostream`), no el «`Point`»; «`p << std::cout`» no tendría sentido, pero «`std::cout << p`» debería funcionar.

## Lo que no hay que hacer: sobrecargar sin respetar el significado esperado

```cpp
// A EVITAR: el símbolo «+» que no realiza una suma en el sentido intuitivo del término
Vecteur2D operator+(const Vecteur2D &autre) const {
    return Vecteur2D(x * autre.x, y * autre.y);   // Engañoso: ¡el signo «+» que multiplica!
}
```

> **Nota (buena práctica):** un operador sobrecargado debe comportarse de forma **predecible**, coherente con el significado habitual del símbolo (`+` suma, `==` compara una igualdad lógica...). Una sobrecarga que contradiga esta expectativa hace que el código resulte engañoso para cualquiera que lo relea, incluido uno mismo más adelante.

## Resumen de los operadores que se sobrecargan con más frecuencia

| Operador | Uso típico |
|---|---|
| `+`, `-`, `*` | Operaciones aritméticas sobre un tipo matemático (vector, matriz, número complejo...) |
| `==`, `!=` | Comparación lógica del contenido de dos objetos |
| `<<`, `>>` | Visualización (`std::cout`) y lectura (`std::cin`) de un objeto |
| `[]` | Acceso indexado, para un tipo que se comporta como una colección |
| `()` | Hacer que un objeto sea «invocable» como una función (*functor*) |
