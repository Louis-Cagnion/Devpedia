---
order: 9
---

# A STL: iteradores, algoritmos e lambdas

Um **iterador** é uma abstração que permite percorrer qualquer [contêiner STL](/?c=langages-de-programmation&s=cpp&p=stl-conteneurs) da mesma forma, seja um `vector` (array contíguo) ou uma `list` (lista encadeada): o código de percurso não muda, mesmo que a estrutura subjacente seja radicalmente diferente.

## O princípio do iterador

```cpp
std::vector<int> numeros = {1, 2, 3};

std::vector<int>::iterator it = numeros.begin();
while (it != numeros.end()) {
    std::cout << *it << " ";   // "*it" desreferencia o iterador, como um ponteiro (veja Os ponteiros, secao C)
    ++it;
}
```

- `begin()` retorna um iterador apontando para o primeiro elemento.
- `end()` retorna um iterador "logo depois" do último elemento (nunca desreferenciado diretamente, apenas comparado).
- `*it` desreferencia o iterador atual, `++it` avança para o seguinte: uma sintaxe deliberadamente próxima da de um ponteiro bruto.

## O for-each moderno (C++11+)

```cpp
for (int n : numeros) {
    std::cout << n << " ";
}
```

Essa sintaxe se apoia **exatamente** no mesmo mecanismo de iteradores nos bastidores: é um atalho sintático, válido para qualquer tipo que exponha `begin()`/`end()`.

## Os algoritmos padrão (`<algorithm>`)

Em vez de escrever manualmente um laço para cada operação comum, a STL fornece algoritmos genéricos, funcionando sobre **pares de iteradores** (início, fim), portanto válidos em qualquer contêiner:

```cpp
#include <algorithm>

std::vector<int> numeros = {5, 3, 1, 4, 2};

std::sort(numeros.begin(), numeros.end());               // ordena no lugar -> {1, 2, 3, 4, 5}

auto it = std::find(numeros.begin(), numeros.end(), 3);  // iterador apontando para o valor 3
bool encontrado = (it != numeros.end());

int soma = std::accumulate(numeros.begin(), numeros.end(), 0);  // 15 -> exige <numeric>

std::for_each(numeros.begin(), numeros.end(), [](int n) {
    std::cout << n * 2 << " ";
});
```

## As lambdas (C++11+)

Uma **lambda** é uma função anônima, escrita diretamente onde é usada: o mesmo conceito das [closures JavaScript](/?c=langages-de-programmation&s=javascript&p=fonctions) ou das [lambdas Python](/?c=langages-de-programmation&s=python&p=fonctions):

```cpp
auto quadrado = [](int x) { return x * x; };
std::cout << quadrado(5);   // 25
```

```cpp
int limite = 3;
auto estaAcimaDoLimite = [limite](int x) { return x > limite; };   // captura "limite" por valor

int contagem = std::count_if(numeros.begin(), numeros.end(), estaAcimaDoLimite);
```

- `[]`: lista de captura, quais variáveis externas a lambda pode usar, e como (`[limite]` por valor, `[&limite]` por referência, `[&]` tudo por referência, `[=]` tudo por valor).
- `()`: parâmetros, como uma função clássica.
- `{}`: corpo da lambda.

## Algoritmos comuns

| Função | Função |
|---|---|
| `std::sort` | Ordena um intervalo de elementos |
| `std::find` | Busca a primeira ocorrência de um valor |
| `std::count` / `std::count_if` | Conta as ocorrências (com ou sem condição) |
| `std::for_each` | Aplica uma função a cada elemento |
| `std::transform` | Produz um novo intervalo aplicando uma função a cada elemento (equivalente de `map` em Python/JS) |
| `std::accumulate` | Reduz um intervalo a um único valor (equivalente de `reduce`) |

> **Nota:** usar esses algoritmos em vez de laços manuais torna a intenção explícita (`std::sort` diz "eu ordeno", um laço com um algoritmo de ordenação escrito à mão exige deduzir isso): um ganho de legibilidade direto, além de evitar reimplementar (e potencialmente implementar mal) uma lógica já padronizada e otimizada.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um iterador percorre qualquer contêiner STL de forma uniforme (`begin()`/`end()`, `*it`, `++it`). Os algoritmos padrão (`sort`, `find`, `accumulate`...) operam sobre pares de iteradores, válidos em qualquer contêiner. |
| **Ferramentas utilizáveis** | `std::sort`, `std::find`, `std::count_if`, `std::transform`, `std::accumulate`, lambdas (`[](...){ ... }`). |
| **Armadilhas a evitar** | Desreferenciar `end()`: ele nunca aponta para um elemento real, apenas uma posição "logo depois" do último. |
| **Boas práticas** | Preferir um algoritmo padrão nomeado (`std::sort`) a um laço manual equivalente: a intenção é explícita e a lógica já otimizada. |
