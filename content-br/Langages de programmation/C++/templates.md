---
order: 10
---

# Os modelos (programação genérica)

Um **modelo** permite escrever uma função ou uma classe **uma única vez**, válida para qualquer tipo, sem sacrificar a verificação de tipos na compilação nem o desempenho (ao contrário de linguagens de tipagem dinâmica como o Python ou o PHP, ver capítulos dedicados).

## Sem modelo: a duplicação

```cpp
int maximum(int a, int b) { return (a > b) ? a : b; }
double maximum(double a, double b) { return (a > b) ? a : b; }
std::string maximum(std::string a, std::string b) { return (a > b) ? a : b; }
```

Três funções estritamente idênticas na sua lógica, duplicadas apenas devido ao tipo, exatamente o tipo de repetição que um modelo elimina (cf. princípio DRY, já mencionado para outras linguagens).

## Modelo de função

```cpp
template <typename T>
T maximum(T a, T b) {
    return (a > b) ? a : b;
}

maximum(3, 7);            // T é automaticamente inferido como int
maximum(3.5, 2.1);          // T é interpretado como «duplo»
maximum<std::string>("a", "b");  // T especificado explicitamente, se necessário
```

O compilador **gera** uma versão distinta da função para cada tipo efetivamente utilizado (`maximum<int>`, `maximum<double>`...): é o que se denomina instanciação de modelo, realizada inteiramente na compilação, sem qualquer custo na execução.

## Modelo de classe

```cpp
template <typename T>
class Pile {
public:
    void empiler(T valor) { elements.push_back(valor); }
    T depiler() {
        if (estVide()) {
            throw std::out_of_range("Pile vide"); // ver capítulo sobre exceções: nunca desempilhar em vazio
        }
        T dernier = elements.back();
        elements.pop_back();
        return dernier;
    }
    bool estVide() const { return elements.empty(); }

private:
    std::vector<T> elements;
};

Pile<int> pileEntiers;
pileEntiers.empiler(42);

Pile<std::string> pileTextes;
pileTextes.empiler("bonjour");
```

Uma única definição de `Pile`, utilizável com qualquer tipo: é exatamente assim que são construídos os contentores da STL (`std::vector<T>`, `std::map<K, V>`..., ver capítulo dedicado).

## Restrições de tipo (C++20: `concepts`)

Sem restrições, um modelo aceita qualquer tipo, incluindo tipos para os quais a operação não faz sentido, o que gera um erro de compilação frequentemente extenso e pouco claro:

```cpp
template <typename T>
T addition(T a, T b) { return a + b; }

addition(2, 3);          // OK
addition("a", "b");        // Erro de compilação potencialmente enigmático, dependendo do tipo
```

Desde o C++20, os **conceitos** permitem expressar explicitamente os requisitos no `T`, para uma mensagem de erro mais clara e um código mais legível:

```cpp
template <typename T>
concept Numerique = std::is_arithmetic_v<T>;

template <Numerique T>
T addition(T a, T b) { return a + b; }
```

## Modelos vs. genericidade dinâmica (Python, PHP)

| | Modelos C++ | Tipagem dinâmica (Python/PHP) |
|---|---|---|
| Verificação de tipo | Na compilação | Na execução (ou nunca, dependendo da linguagem) |
| Custo de execução | Nulo (código gerado especificamente para cada tipo) | Ligeiro sobrecosto (verificações de tipo contínuas) |
| Detecção de erros de tipo | Antes mesmo de iniciar o programa | Apenas ao executar o trecho de código em questão |

Ver também o capítulo sobre os contentores STL, que se baseia inteiramente neste mecanismo de modelos.
