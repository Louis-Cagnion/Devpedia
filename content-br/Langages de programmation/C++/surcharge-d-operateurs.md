---
order: 5
---

# A sobrecarga de operadores

O C++ permite redefinir o comportamento dos operadores padrão (`+`, `==`, `<<`...) para tipos personalizados, o que permite que um objeto criado pelo usuário se comporte, aparentemente, como um tipo nativo da linguagem.

## Sobrescrever `+`

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
Vecteur2D c = a + b;   // na realidade, chama a.operator+(b) -> Vector2D(4, 6)
```

`a + b` é literalmente transformado pelo compilador num «`a.operator+(b)`»: o operador não passa de um método com um nome específico e uma sintaxe de chamada especial.

## Sobrescrever `==`

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
std::cout << (p1 == p2);   // true -> sem sobrecarga, compararia os ENDEREÇOS, e não o conteúdo
```

> **Nota:** sem sobrecarga de `==`, comparar dois objetos com `==` compara, por padrão, os seus **endereços de memória** (tal como comparar dois ponteiros), nunca o seu conteúdo, uma fonte frequente de erros para quem espera uma comparação «por valor» automática.

## Sobrepor `<<` para visualização

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
std::cout << p;   // (3, 4) -> sem esta sobrecarga: erro de compilação, << não reconhece Point
```

> **Nota:** esta sobrecarga é definida fora da classe (uma função livre, não um método), uma vez que o objeto à esquerda de `<<` é o fluxo (`std::ostream`), e não o `Point`; `p << std::cout` não faria sentido, mas `std::cout << p` deve funcionar.

## O que não se deve fazer: sobrecarregar sem respeitar o sentido esperado

```cpp
// A EVITAR: «+» que não signifique uma adição no sentido intuitivo do termo
Vecteur2D operator+(const Vecteur2D &autre) const {
    return Vecteur2D(x * autre.x, y * autre.y);   // Enganador: o «+» que multiplica!
}
```

> **Nota (melhores práticas):** um operador sobrecarregado deve comportar-se de forma **previsível**, coerente com o significado habitual do símbolo (`+` soma, `==` compara uma igualdade lógica...). Uma sobrecarga que contradiga esta expectativa torna o código enganador para quem o reler, incluindo o próprio programador mais tarde.

## Resumo dos operadores mais frequentemente sobrecarregados

| Operador | Utilização típica |
|---|---|
| `+`, `-`, `*` | Operações aritméticas num tipo matemático (vetor, matriz, número complexo...) |
| `==`, `!=` | Comparação lógica do conteúdo de dois objetos |
| `<<`, `>>` | Visualização (`std::cout`) e leitura (`std::cin`) de um objeto |
| `[]` | Acesso indexado, para um tipo que se comporta como uma coleção |
| `()` | Tornar um objeto «chamável» como uma função (*functor*) |
