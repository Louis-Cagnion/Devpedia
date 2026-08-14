---
order: 9
---

# A STL — iteradores, algoritmos e lambdas

Um **iterador** é uma abstração que permite percorrer qualquer contentor STL (ver capítulo dedicado) da mesma forma, quer se trate de um «`vector`» (tabela contígua) ou de um «`list`» (lista encadeada) — o código de percurso não se altera, mesmo que a estrutura subjacente seja radicalmente diferente.

## O princípio do iterador

```cpp
std::vector<int> números = {1, 2, 3};

std::vector<int>::iterator it = números.begin();
while (it != números.end()) {
    std::cout << *it << " ";   // «*it» desreferencia o iterador, tal como um ponteiro (ver capítulo dedicado, secção C)
    ++it;
}
```

- `begin()` Devolve um iterador que aponta para o primeiro elemento.
- `end()` retorna um iterador «imediatamente a seguir» ao último elemento (que nunca é referenciado diretamente, apenas comparado).
- `*it` Desreferencia o iterador atual, `++it` avança para o seguinte — uma sintaxe deliberadamente semelhante à de um ponteiro bruto.

## O for-each moderno (C++11+)

```cpp
for (int n : números) {
    std::cout << n << " ";
}
```

Esta sintaxe baseia-se **exatamente** no mesmo mecanismo de iteradores nos bastidores — trata-se de um atalho sintático, válido para qualquer tipo que exponha `begin()` / `end()`.

## Os algoritmos padrão (`<algorithm>`)

Em vez de escrever manualmente um ciclo para cada operação comum, a STL fornece algoritmos genéricos, que funcionam com **pares de iteradores** (início, fim) — sendo, portanto, aplicáveis a qualquer contentor:

```cpp
#include <algorithm>

std::vector<int> números = {5, 3, 1, 4, 2};

std::sort(números.begin(), números.end());               // ordenação in situ -> {1, 2, 3, 4, 5}

auto it = std::find(números.begin(), números.end(), 3);    // iterador que aponta para o valor 3
bool trouve = (it != números.end());

int somme = std::accumulate(números.begin(), números.end(), 0);  // 15 -> requer <numérico>

std::for_each(números.begin(), números.end(), [](int n) {
    std::cout << n * 2 << " ";
});
```

## As funções lambda (C++11+)

Uma **lambda** é uma função anónima, escrita diretamente no local onde é utilizada — o mesmo conceito que os closures do JavaScript ou as lambdas do Python (ver capítulos dedicados):

```cpp
auto carre = [](int x) { return x * x; };
std::cout << carre(5);   // 25
```

```cpp
int seuil = 3;
auto estAuDessusDuSeuil = [seuil](int x) { return x > seuil; };   // captura «limiar» por valor

int compte = std::count_if(números.begin(), números.end(), estAuDessusDuSeuil);
```

- `[]` : lista de captura — quais as variáveis externas que a função lambda pode utilizar e de que forma (`[seuil]` por valor, `[&seuil]` por referência, `[&]` tudo por referência, `[=]` tudo por valor).
- `()` : parâmetros, tal como numa função clássica.
- `{}` : corpo da função lambda.

## Algoritmos comuns

| Função | Papel |
|---|---|
| `std::sort` | Ordena um intervalo de elementos |
| `std::find` | Procura a primeira ocorrência de um valor |
| `std::count` / `std::count_if` | Conta as ocorrências (com ou sem condição) |
| `std::for_each` | Aplica uma função a cada elemento |
| `std::transform` | Gera um novo conjunto aplicando uma função a cada elemento (equivalente a `map` em Python/JS) |
| `std::accumulate` | Reduz um intervalo a um único valor (equivalente a `reduce`) |

> **Nota:** utilizar estes algoritmos em vez de loops manuais torna a intenção explícita (o `std::sort`, ou seja, «estou ordenando», enquanto um ciclo com um algoritmo de ordenação escrito manualmente obriga a deduzir essa intenção) — um ganho direto em termos de legibilidade, além de evitar a reimplementação (e, potencialmente, a implementação incorreta) de uma lógica já padronizada e otimizada.
