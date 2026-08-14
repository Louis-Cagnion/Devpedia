---
order: 5
---

# A sobrecarga de operadores

C++ permite redefinir o comportamento dos operadores padrão (`+`, `==`, `<<`...) para tipos personalizados: o que permite a um objeto criado pelo usuário se comportar, aparentemente, como um tipo nativo da linguagem.

## Sobrecarregar `+`

```cpp
class Vetor2D {
public:
    Vetor2D(double x, double y) : x(x), y(y) {}

    Vetor2D operator+(const Vetor2D &outro) const {
        return Vetor2D(x + outro.x, y + outro.y);
    }

    double x, y;
};

Vetor2D a(1, 2);
Vetor2D b(3, 4);
Vetor2D c = a + b;   // chama na verdade a.operator+(b) -> Vetor2D(4, 6)
```

`a + b` é literalmente transformado pelo compilador em `a.operator+(b)`: o operador é apenas um método com um nome particular e uma sintaxe de chamada especial.

## Sobrecarregar `==`

```cpp
class Ponto {
public:
    Ponto(int x, int y) : x(x), y(y) {}

    bool operator==(const Ponto &outro) const {
        return x == outro.x && y == outro.y;
    }

    int x, y;
};

Ponto p1(1, 2);
Ponto p2(1, 2);
std::cout << (p1 == p2);   // true -> sem sobrecarga, compararia os ENDERECOS, nao o conteudo
```

> **Nota:** sem sobrecarga de `==`, comparar dois objetos com `==` compara por padrão seu **endereço de memória** (como comparar dois ponteiros), nunca seu conteúdo: uma fonte de erro frequente para quem espera uma comparação "por valor" automática.

## Sobrecarregar `<<` para exibição

```cpp
class Ponto {
public:
    Ponto(int x, int y) : x(x), y(y) {}
    int x, y;
};

std::ostream &operator<<(std::ostream &os, const Ponto &p) {
    os << "(" << p.x << ", " << p.y << ")";
    return os;
}

Ponto p(3, 4);
std::cout << p;   // (3, 4) -> sem essa sobrecarga: erro de compilacao, << nao conhece Ponto
```

> **Nota:** essa sobrecarga é escrita fora da classe (uma função livre, não um método), pois o objeto à esquerda de `<<` é o fluxo (`std::ostream`), não o `Ponto`; `p << std::cout` não faria sentido, mas `std::cout << p` precisa funcionar.

## O que não fazer: sobrecarregar sem respeitar o sentido esperado

```cpp
// A EVITAR: "+" que nao faz uma adicao no sentido intuitivo do termo
Vetor2D operator+(const Vetor2D &outro) const {
    return Vetor2D(x * outro.x, y * outro.y);   // enganoso: "+" que multiplica!
}
```

> **Nota (boa prática):** um operador sobrecarregado deve se comportar de forma **previsível**, coerente com o sentido habitual do símbolo (`+` soma, `==` compara uma igualdade lógica...). Uma sobrecarga que contradiz essa expectativa torna o código enganoso para quem o revisar, incluindo você mesmo no futuro.

## Resumo dos operadores mais comumente sobrecarregados

| Operador | Uso típico |
|---|---|
| `+`, `-`, `*` | Operações aritméticas em um tipo matemático (vetor, matriz, número complexo...) |
| `==`, `!=` | Comparação lógica do conteúdo de dois objetos |
| `<<`, `>>` | Exibição (`std::cout`) e leitura (`std::cin`) de um objeto |
| `[]` | Acesso indexado, para um tipo que se comporta como uma coleção |
| `()` | Tornar um objeto "chamável" como uma função (*functor*) |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | C++ permite redefinir um operador padrão (`+`, `==`, `<<`...) para um tipo personalizado: `a + b` se traduz em `a.operator+(b)`. Sem sobrecarga, `==` compara por padrão os endereços, não o conteúdo. |
| **Ferramentas utilizáveis** | `operator+`, `operator==`, `operator<<` (função livre, fora da classe). |
| **Armadilhas a evitar** | Sobrecarregar um operador com um comportamento que contradiz seu sentido habitual (`+` que multiplicaria). |
| **Boas práticas** | Manter um operador sobrecarregado previsível e coerente com o símbolo padrão: nunca um comportamento surpreendente para quem revisar o código. |
