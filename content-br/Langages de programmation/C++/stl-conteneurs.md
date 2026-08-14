---
order: 8
---

# A STL — os contentores

A **STL** (*Standard Template Library*) fornece estruturas de dados genéricas (ver capítulo sobre os templates), prontas a utilizar — em vez de ter de reimplementar manualmente uma lista encadeada ou uma tabela de hash (ver capítulos dedicados, secção C), quase todos os projetos modernos em C++ baseiam-se nestes contentores padrão.

## `std::vector` : a tabela dinâmica

```cpp
#include <vector>

std::vector<int> números = {1, 2, 3};

números.push_back(4);        // acrescentar no final
números[0];                     // Acesso direto por índice, tal como um tabuláio em C
números.size();                  // número de elementos
números.pop_back();                // retira o último elemento

for (int n : números) {              // iteração simples, como um for-each
    std::cout << n << " ";
}
```

> **Nota:** o «`std::vector`» é, internamente, uma matriz contígua na memória (ver capítulo sobre ponteiros e memória, secção C) que se redimensiona automaticamente (muitas vezes duplicando a sua capacidade) quando fica cheia — o mesmo princípio que uma lista em Python ou um «`ArrayList`» em Java, mas sem a camada de indireção de uma linguagem com recolha automática de lixo.

## `std::list` : a lista duplamente encadeada

```cpp
#include <list>

std::list<int> lista = {1, 2, 3};
lista.push_front(0);   // Inserção no início em tempo constante -> o std::vector seria O(n) neste caso
```

Ao contrário de `std::vector`, inserir no meio ou no início de uma `std::list` não requer qualquer deslocamento dos outros elementos (ver capítulo sobre listas encadeadas, secção C) — em troca de um acesso por índice impossível em tempo constante (não existe `lista[2]`, é necessário percorrer a lista).

## `std::map` : o dicionário ordenado

```cpp
#include <map>

std::map<std::string, int> ages;
ages["Jean"] = 25;
ages["Marie"] = 30;

ages["Jean"];                       // 25
ages.find("Ali") != ages.end();       // verifica se existe uma chave (não existe o operador «in» direto em C++)

for (const auto &[nome, idade] : ages) {   // percorro: os pares estão SEMPRE ordenados por chave
    std::cout << nome << " : " << idade << "\n";
}
```

> **Nota:** `std::map` é, internamente, uma árvore equilibrada (frequentemente uma árvore vermelha-preta, uma variante da árvore binária de pesquisa abordada no capítulo dedicado, secção C) — as chaves são, portanto, sempre percorridas **por ordem de classificação**, ao contrário de um array associativo em PHP ou de um `dict` em Python (ordem de inserção). `std::unordered_map` oferece o equivalente baseado numa tabela de hash (ver capítulo dedicado, secção C), mais rápido em média, mas sem ordem garantida.

## `std::set` : os valores únicos, ordenados

```cpp
#include <set>

std::set<int> valores = {3, 1, 2, 1};   // {1, 2, 3} -> ordenado E deduplicado automaticamente

valores.insert(4);
valores.count(2);   // 1 se existir, 0 caso contrário (um conjunto nunca contém elementos duplicados)
```

`std::unordered_set` é o equivalente baseado numa tabela hash — mais rápido, em média, sem ordem garantida.

## Escolher o contentor certo

| Necessidade | Contentor |
|---|---|
| Acesso rápido por índice, adição ao final da coleção | `std::vector` |
| Inserções/eliminações frequentes no meio/início da coleção | `std::list` |
| Associação chave → valor, ordenação necessária | `std::map` |
| Associação chave → valor, ordem indiferente, velocidade prioritária | `std::unordered_map` |
| Valores únicos, ordenados | `std::set` |
| Valores únicos, ordem indiferente, velocidade prioritária | `std::unordered_set` |

Consulte também o capítulo sobre iteradores e algoritmos STL, que permitem manipular qualquer um destes contentores de forma uniforme.
