---
order: 8
---

# A STL: os contêineres

A **STL** (*Standard Template Library*) fornece estruturas de dados genéricas (veja [Os templates](/?c=langages-de-programmation&s=cpp&p=templates)), prontas para uso; em vez de reimplementar à mão uma [lista encadeada](/?c=langages-de-programmation&s=c&p=listes-chainees) ou uma [tabela hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage), a quase totalidade dos projetos C++ modernos se apoia nesses contêineres padrão.

## `std::vector`: o array dinâmico

```cpp
#include <vector>

std::vector<int> numeros = {1, 2, 3};

numeros.push_back(4);  // adiciona ao final
numeros[0];            // acesso direto por indice, como um array C
numeros.size();        // numero de elementos
numeros.pop_back();    // remove o ultimo elemento

for (int n : numeros) {  // percurso simples, como um for-each
    std::cout << n << " ";
}
```

> **Nota:** `std::vector` é, internamente, um array contíguo na memória (veja [Os ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs) e [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire)) que se redimensiona automaticamente (frequentemente dobrando sua capacidade) quando fica cheio: o mesmo princípio de uma [lista Python](/?c=langages-de-programmation&s=python&p=listes-et-tuples) ou um [`ArrayList`](https://docs.oracle.com/en/java/) Java, mas sem a camada de indireção de uma linguagem com coletor de lixo.

## `std::list`: a lista duplamente encadeada

```cpp
#include <list>

std::list<int> lista = {1, 2, 3};
lista.push_front(0);   // insercao no inicio em tempo constante -> std::vector seria O(n) aqui
```

Ao contrário de `std::vector`, inserir no meio ou no início de uma `std::list` não exige nenhum deslocamento dos outros elementos (veja [As listas encadeadas](/?c=langages-de-programmation&s=c&p=listes-chainees)), ao custo de um acesso por índice impossível em tempo constante (`lista[2]` não existe, é preciso percorrer).

## `std::map`: o dicionário ordenado

```cpp
#include <map>

std::map<std::string, int> idades;
idades["Joao"] = 25;
idades["Maria"] = 30;

idades["Joao"];                    // 25
idades.find("Ali") != idades.end();  // testa a existencia de uma chave (nenhum operador "in" direto em C++)

for (const auto &[nome, idade] : idades) {  // percurso: os pares SEMPRE ordenados por chave
    std::cout << nome << " : " << idade << "\n";
}
```

> **Nota:** `std::map` é internamente uma árvore balanceada (frequentemente uma [árvore rubro-negra](https://en.wikipedia.org/wiki/Red%E2%80%93black_tree), uma variante da [árvore binária de busca](/?c=langages-de-programmation&s=c&p=arbres-binaires)): as chaves então são sempre percorridas **ordenadas**, ao contrário de um [array associativo PHP](/?c=langages-de-programmation&s=php&p=variables) ou um [`dict` Python](/?c=langages-de-programmation&s=python&p=dictionnaires-et-ensembles) (ordem de inserção). `std::unordered_map` propõe o equivalente baseado em uma [tabela hash](/?c=langages-de-programmation&s=c&p=tables-de-hachage), mais rápido em média mas sem ordem garantida.

## `std::set`: os valores únicos, ordenados

```cpp
#include <set>

std::set<int> valores = {3, 1, 2, 1};   // {1, 2, 3} -> ordenado E deduplicado automaticamente

valores.insert(4);
valores.count(2);   // 1 se presente, 0 caso contrario (um set nunca contem duplicata)
```

`std::unordered_set` é o equivalente baseado em uma tabela hash, mais rápido em média, sem ordem garantida.

## Escolher o contêiner certo

| Necessidade | Contêiner |
|---|---|
| Acesso rápido por índice, adição ao final da coleção | `std::vector` |
| Inserções/remoções frequentes no meio/início da coleção | `std::list` |
| Associação chave → valor, ordem ordenada necessária | `std::map` |
| Associação chave → valor, ordem indiferente, velocidade prioritária | `std::unordered_map` |
| Valores únicos, ordenados | `std::set` |
| Valores únicos, ordem indiferente, velocidade prioritária | `std::unordered_set` |

Veja também [A STL: iteradores, algoritmos e lambdas](/?c=langages-de-programmation&s=cpp&p=stl-algorithmes-et-iterateurs), que permitem manipular qualquer um desses contêineres de forma uniforme.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | A STL fornece contêineres genéricos prontos para uso: `vector` (array dinâmico), `list` (lista duplamente encadeada), `map`/`set` (ordenados), `unordered_map`/`unordered_set` (tabela hash, mais rápidos mas não ordenados). |
| **Ferramentas utilizáveis** | `push_back`/`push_front`, `size`, `find`, percurso for-each. |
| **Armadilhas a evitar** | Escolher `vector` para inserções frequentes no início (custo `O(n)`, `list` seria em tempo constante). |
| **Boas práticas** | Escolher o contêiner conforme a operação dominante (acesso por índice, inserção frequente, associação ordenada...) em vez de por hábito. |
