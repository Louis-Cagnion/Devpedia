---
order: 2
---

# Os espaços de nomes (namespaces)

Um **espaço de nomes** (*namespace*) reúne identificadores (funções, classes, variáveis) sob um prefixo comum, para evitar colisões de nomes entre diferentes partes de um projeto ou diferentes bibliotecas: a mesma necessidade dos namespaces PHP, cujo [autoloading](/?c=langages-de-programmation&s=php&p=autoloading) mostra um uso concreto.

## Declarar e usar um namespace

```cpp
namespace Faturamento {
    class Fatura {
    public:
        double valor;
    };

    double calcularImposto(double valor) {
        return valor * 0.20;
    }
}

Faturamento::Fatura f;                      // acesso completo, via "::"
double imposto = Faturamento::calcularImposto(100);
```

## `using namespace`: importar sem prefixo

```cpp
using namespace Faturamento;

Fatura f;                  // nao precisa mais do prefixo "Faturamento::"
double imposto = calcularImposto(100);
```

> **Nota (boa prática):** `using namespace X;` no topo de um arquivo de cabeçalho (`.h`) geralmente é desaconselhado: ele impõe essa importação a **todo** arquivo que inclui esse header, com um risco de colisão de nomes que não se controla mais. Reservar `using namespace` para dentro de um arquivo `.cpp` específico, nunca em um header compartilhado.

## `std`: o namespace da biblioteca padrão

```cpp
std::vector<int> numeros;  // "vector" vive no namespace "std", daí o prefixo
std::cout << "Ola";        // idem para "cout"
```

```cpp
// Em OUTRO bloco/arquivo, apos "using namespace std;":
using namespace std;          // torna "vector", "cout"... utilizaveis sem prefixo

vector<int> outrosNumeros;
cout << "Ola";
```

É exatamente por isso que todo o código dos capítulos anteriores (STL, exceções...) usa o prefixo `std::`: `vector`, `map`, `cout`, `runtime_error`... estão todos declarados no namespace `std` da biblioteca padrão.

## Importação seletiva

```cpp
using std::cout;    // importa APENAS "cout", nao todo o namespace std

cout << "Ola";      // funciona
vector<int> v;      // ERRO: "vector" ainda precisa de std:: (nao importado)
```

Um meio-termo entre a pesadez do prefixo sistemático e o risco de um `using namespace` completo: importar apenas o que é realmente usado, nomeadamente.

## Namespaces aninhados

```cpp
namespace Empresa {
    namespace Faturamento {
        class Fatura { /* ... */ };
    }
}

// equivalente mais conciso desde o C++17:
namespace Empresa::Faturamento {
    class Fatura { /* ... */ };
}

Empresa::Faturamento::Fatura f;
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um namespace reúne identificadores sob um prefixo (`Namespace::identificador`) para evitar colisões de nomes. `using namespace` importa sem prefixo; `using X::y` importa seletivamente. |
| **Ferramentas utilizáveis** | `namespace`, `using namespace`, importação seletiva (`using std::cout`), namespaces aninhados (`A::B`). |
| **Armadilhas a evitar** | Escrever `using namespace X;` em um header: impõe essa importação a todo arquivo que o inclui. |
| **Boas práticas** | Reservar `using namespace` para dentro de um arquivo `.cpp`, nunca em um header compartilhado. |
