---
order: 5
---

# Operator Overload

C++ allows you to redefine the behavior of standard operators (`+`, `==`, `<<`...) for custom types, which enables a user-defined object to behave, on the surface, like a native language type.

## Overload`+`

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
Vecteur2D c = a + b;   // actually calls a.operator+(b) -> 2D Vector(4, 6)
```

`a + b` is literally transformed by the compiler into `a.operator+(b)`: the operator is simply a method with a specific name and a special calling syntax.

## Overload`==`

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
std::cout << (p1 == p2);   // true -> without overloading, would compare the ADDRESSES, not the content
```

> **Note:** Without the `==` overload, comparing two objects using `==` compares their **memory addresses** by default (as if comparing two pointers), never their contents, a common source of error for those who expect an automatic "by value" comparison.

## Override `<<` for display

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
std::cout << p;   // (3, 4) -> without this overloading: compilation error, << does not recognize Point
```

> **Note:** This overloading is defined outside the class (as a free function, not a method), because the left-hand side of `<<` is the stream (`std::ostream`), not the `Point`: `p << std::cout` would not make sense, but `std::cout << p` should work.

## What Not to Do: Overload without respecting the intended meaning

```cpp
// AVOID: "+" that does not represent addition in the intuitive sense of the term
Vecteur2D operator+(const Vecteur2D &autre) const {
    return Vecteur2D(x * autre.x, y * autre.y);   // Misleading: "+" that multiplies!
}
```

> **Note (best practice):** An overloaded operator must behave in a **predictable** manner, consistent with the usual meaning of the symbol (`+` adds, `==` checks for logical equality...). An overloading that contradicts this expectation makes the code misleading to anyone who reads it later, including yourself.

## Summary of the Most Commonly Overloaded Operators

| Operator | Typical Use |
|---|---|
| `+`, `-`, `*` | Arithmetic operations on a mathematical type (vector, matrix, complex number, etc.) |
| `==`, `!=` | Logical comparison of the contents of two objects |
| `<<`, `>>` | Displaying (`std::cout`) and reading (`std::cin`) an object |
| `[]` | Indexed access, for a type that behaves like a collection |
| `()` | Making an object "callable" like a function (*functor*) |
