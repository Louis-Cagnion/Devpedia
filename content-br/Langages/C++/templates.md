---
order: 10
---

# Os templates (programação genérica)

Um **template** permite escrever uma função ou classe **uma única vez**, válida para qualquer tipo, sem sacrificar a verificação de tipo na compilação nem o desempenho (ao contrário de linguagens dinamicamente tipadas como [Python](/?c=langages-de-programmation&s=python&p=python) ou [PHP](/?c=langages-de-programmation&s=php&p=php)).

## Sem template: a duplicação

```cpp
int maximo(int a, int b) { return (a > b) ? a : b; }
double maximo(double a, double b) { return (a > b) ? a : b; }
std::string maximo(std::string a, std::string b) { return (a > b) ? a : b; }
```

Três funções estritamente idênticas em sua lógica, duplicadas apenas por causa do tipo: exatamente o tipo de repetição que um template elimina (veja [Evitar a repetição por estruturas indexadas](/?c=qualite-et-architecture-du-code&p=eviter-la-repetition-structures-indexees), o princípio DRY aplicado de forma mais geral).

## Template de função

```cpp
template <typename T>
T maximo(T a, T b) {
    return (a > b) ? a : b;
}

maximo(3, 7);                   // T deduzido automaticamente como int
maximo(3.5, 2.1);               // T deduzido como double
maximo<std::string>("a", "b");  // T especificado explicitamente se necessario
```

O compilador **gera** uma versão distinta da função para cada tipo realmente usado (`maximo<int>`, `maximo<double>`...): é isso que se chama instanciação de template, realizada inteiramente na compilação, sem nenhum custo na execução.

## Template de classe

```cpp
template <typename T>
class Pilha {
public:
    void empilhar(T valor) { elementos.push_back(valor); }
    T desempilhar() {
        if (estaVazia()) {
            throw std::out_of_range("Pilha vazia"); // veja As excecoes: nunca desempilhar vazia
        }
        T ultimo = elementos.back();
        elementos.pop_back();
        return ultimo;
    }
    bool estaVazia() const { return elementos.empty(); }

private:
    std::vector<T> elementos;
};

Pilha<int> pilhaInteiros;
pilhaInteiros.empilhar(42);

Pilha<std::string> pilhaTextos;
pilhaTextos.empilhar("ola");
```

Uma única definição de `Pilha`, utilizável com qualquer tipo: é exatamente assim que são construídos [os contêineres da STL](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs) (`std::vector<T>`, `std::map<K, V>`...).

## Restrições sobre o tipo (C++20: `concepts`)

Sem restrição, um template aceita qualquer tipo, incluindo tipos para os quais a operação não faz sentido, produzindo um erro de compilação frequentemente longo e pouco claro:

```cpp
template <typename T>
T adicao(T a, T b) { return a + b; }

adicao(2, 3);      // OK
adicao("a", "b");  // Erro de compilacao potencialmente criptico conforme o tipo
```

Desde o C++20, os **concepts** permitem expressar explicitamente as exigências sobre `T`, para uma mensagem de erro mais clara e uma intenção de código mais legível:

```cpp
template <typename T>
concept Numerico = std::is_arithmetic_v<T>;

template <Numerico T>
T adicao(T a, T b) { return a + b; }
```

## Templates vs generacidade dinâmica (Python, PHP)

| | Templates C++ | Tipagem dinâmica (Python/PHP) |
|---|---|---|
| Verificação de tipo | Na compilação | Na execução (ou nunca, conforme a linguagem) |
| Custo na execução | Nulo (código gerado especificamente para cada tipo) | Leve sobrecusto (verificações de tipo contínuas) |
| Detecção de erro de tipo | Antes mesmo de iniciar o programa | Somente ao executar o caminho de código em questão |

Veja também [A STL: os contêineres](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs), que se apoia inteiramente nesse mecanismo de templates.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um template escreve uma função/classe uma única vez para qualquer tipo, com verificação na compilação e sem custo na execução (o compilador gera uma versão por tipo usado). |
| **Ferramentas utilizáveis** | `template <typename T>`, `concepts` (C++20) para restringir os tipos aceitos. |
| **Armadilhas a evitar** | Um template sem restrição aceita qualquer tipo, incluindo aqueles para os quais a operação não faz sentido: erro de compilação às vezes críptico. |
| **Boas práticas** | Usar os `concepts` (C++20) para expressar explicitamente as exigências sobre um tipo template, em vez de deixar uma mensagem de erro genérica descobri-lo. |
