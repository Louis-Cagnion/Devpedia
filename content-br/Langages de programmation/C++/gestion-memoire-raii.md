---
order: 7
---

# RAII e os ponteiros inteligentes

Em C (ver capítulo sobre gestão de memória), cada `malloc()` deve ser seguido de um `free()` manual: se for esquecido uma única vez, resulta numa fuga de memória; se for chamado duas vezes, provoca uma falha do sistema. **RAII** (*Resource Acquisition Is Initialization*) é o princípio central do C++ para eliminar toda esta classe de erros, baseando-se num mecanismo já conhecido: o destruidor (ver capítulo sobre classes e objetos).

## O princípio RAII

Um recurso (memória, arquivo, ligação de rede...) é alocado no **construtor** de um objeto e libertado automaticamente no seu **destrutor**: quando o objeto sai do âmbito, o recurso é inevitavelmente libertado, sem que seja possível esquecer essa limpeza:

```cpp
class GestionnaireFichier {
public:
    GestionnaireFichier(const std::string &caminho) {
        arquivo.open(caminho);
        if (!arquivo.is_open()) {
            throw std::runtime_error("Impossible d'ouvrir : " + caminho); // cf. chapitre sur les exceptions
        }
    }
    ~GestionnaireFichier() { arquivo.close(); }   // chamada automaticamente, mesmo em caso de exceção!
private:
    std::ifstream arquivo;
};

void traiterFichier() {
    GestionnaireFichier gf("donnees.txt");
    // ... utilizar gf ...
}   // <- aqui, a função ~GestionnaireFichier() é executada automaticamente: o arquivo é fechado, garantidamente
```

> **Nota:** ao contrário de um simples `close()` chamado manualmente no final da função, o RAII garante a libertação mesmo que uma exceção interrompa a função a meio: o destrutor é executado durante o «desenrolamento da pilha» (*stack unwinding*) causado pela exceção, enquanto que uma chamada manual seria simplesmente ignorada.

## `new` / `delete`: a versão em C++ de `malloc` / `free`

```cpp
int *p = new int(42);   // aloca E inicializa numa única operação
delete p;                 // liberta

int *matriz = new int[10];   // aloca um tabuláro dinâmico
delete[] matriz;               // «[]» é obrigatório para libertar um array; caso contrário, o comportamento é indefinido
```

`new` / `delete` substituem `malloc` / `free`, mas apresentam exatamente os mesmos riscos (esquecimento de `delete`, `delete` duplo, *use-after-free*; ver capítulo C sobre a memória): é por isso que, no C++ moderno, raramente são utilizados **diretamente**.

## Os ponteiros inteligentes (*smart pointers*)

Um ponteiro inteligente aplica o RAII à própria gestão de memória: **trata-se** de um objeto cujo destrutor chama automaticamente o método `delete` sobre o recurso que possui.

### `unique_ptr` : propriedade exclusiva

```cpp
#include <memory>

std::unique_ptr<int> p = std::make_unique<int>(42);
std::cout << *p;   // 42 -> é desreferenciado como um ponteiro bruto

// NÃO é necessário utilizar «delete»: quando «p» sai do âmbito, a memória é libertada automaticamente
```

Um `unique_ptr` só pode ter um **único** proprietário: a sua cópia é proibida (erro de compilação), sendo apenas possível a sua transferência (`std::move`), que transfere a propriedade de um `unique_ptr` para outro:

```cpp
std::unique_ptr<int> p1 = std::make_unique<int>(42);
std::unique_ptr<int> p2 = std::move(p1);   // p2 torna-se proprietário, p1 torna-se nullptr
```

### `shared_ptr` : propriedade partilhada, com contagem de referências

```cpp
std::shared_ptr<int> p1 = std::make_shared<int>(42);
std::shared_ptr<int> p2 = p1;   // OK, cópia autorizada: p1 E p2 partilham o mesmo recurso

// a memória só é libertada quando o ÚLTIMO shared_ptr que a referencia é destruído
```

Cada `shared_ptr` incrementa um contador de referências partilhado; o recurso só é libertado automaticamente quando esse contador chega a zero.

> **Nota:** `shared_ptr` tem um custo (o contador de referências, atualizado de forma thread-safe) superior ao de `unique_ptr`, a utilizar apenas nos casos em que um recurso tenha efetivamente vários proprietários legítimos, e não por padrão.

## Resumo

| | `new` / `delete` brut | `unique_ptr` | `shared_ptr` |
|---|---|---|---|
| Lançamento automático | Não | Sim | Sim |
| Número de proprietários | N/A | Um único | Vários |
| Custo | Mínimo | Quase nulo (sem sobrecusto na execução) | Contagem de referências (ligeiro sobrecusto) |

> **Boas práticas do C++ moderno:** nunca utilizar `new` / `delete` diretamente no código da aplicação, optar sistematicamente por `unique_ptr` (por padrão) ou `shared_ptr` (se a partilha for realmente necessária), para beneficiar do RAII sem ter de pensar nisso de cada vez.
