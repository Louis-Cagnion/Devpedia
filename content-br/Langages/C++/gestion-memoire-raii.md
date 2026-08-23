---
order: 7
---

# RAII e os ponteiros inteligentes

Em [C](/?c=langages-de-programmation&s=c&p=c) (veja [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire)), cada `malloc()` deve ser seguido de um `free()` manual: esquecido uma única vez, é um vazamento de memória; chamado duas vezes, um crash. **RAII** (*Resource Acquisition Is Initialization*) é o princípio central de C++ para eliminar essa classe inteira de bugs, apoiando-se em um mecanismo já visto: o destrutor (veja [As classes e objetos](/?c=langages-de-programmation&s=cpp&p=classes-et-objets)).

## O princípio RAII

Um recurso (memória, arquivo, conexão de rede...) é adquirido no **construtor** de um objeto, e liberado automaticamente em seu **destrutor**; quando o objeto sai de escopo, o recurso é obrigatoriamente liberado, sem que seja possível esquecer essa limpeza:

```cpp
class GerenciadorArquivo {
public:
    GerenciadorArquivo(const std::string &caminho) {
        arquivo.open(caminho);
        if (!arquivo.is_open()) {
            throw std::runtime_error("Impossivel abrir: " + caminho); // veja As excecoes
        }
    }
    ~GerenciadorArquivo() { arquivo.close(); }   // chamado automaticamente, mesmo em caso de excecao!
private:
    std::ifstream arquivo;
};

void processarArquivo() {
    GerenciadorArquivo ga("dados.txt");
    // ... usar ga ...
}   // <- aqui, ~GerenciadorArquivo() executa automaticamente: o arquivo e fechado, garantido
```

> **Nota:** ao contrário de um simples `close()` chamado manualmente ao fim da função, RAII garante a liberação mesmo se uma exceção interromper a função no meio: o destrutor executa durante o "desenrolar da pilha" (*stack unwinding*) causado pela exceção, onde uma chamada manual seria simplesmente pulada.

## `new`/`delete`: a versão C++ de `malloc`/`free`

```cpp
int *p = new int(42);  // aloca E inicializa em uma unica operacao
delete p;              // libera

int *array = new int[10];  // aloca um array dinamico
delete[] array;             // "[]" obrigatorio para liberar um array, senao comportamento indefinido
```

`new`/`delete` substituem `malloc`/`free`, mas sofrem exatamente os mesmos riscos (esquecimento de `delete`, `delete` duplo, *use-after-free*, veja [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire) em C): é por isso que em C++ moderno, eles raramente são usados **diretamente**.

## Os ponteiros inteligentes (*smart pointers*)

Um ponteiro inteligente aplica RAII à própria gestão de memória: ele **é** um objeto, cujo destrutor chama automaticamente `delete` no recurso que possui.

### `unique_ptr`: propriedade exclusiva

```cpp
#include <memory>

std::unique_ptr<int> p = std::make_unique<int>(42);
std::cout << *p;   // 42 -> desreferencia como um ponteiro bruto

// NAO precisa de delete: quando p sai de escopo, a memoria e liberada automaticamente
```

Um `unique_ptr` só pode ter um **único** proprietário; copiá-lo é proibido (erro de compilação), apenas o deslocamento (`std::move`) é possível, o que transfere a propriedade de um `unique_ptr` para outro:

```cpp
std::unique_ptr<int> p1 = std::make_unique<int>(42);
std::unique_ptr<int> p2 = std::move(p1);   // p2 se torna proprietario, p1 se torna nullptr
```

### `shared_ptr`: propriedade compartilhada, com contagem de referências

```cpp
std::shared_ptr<int> p1 = std::make_shared<int>(42);
std::shared_ptr<int> p2 = p1;   // OK, copia permitida: p1 E p2 compartilham o mesmo recurso

// a memoria so e liberada quando o ULTIMO shared_ptr que a referencia e destruido
```

Cada `shared_ptr` incrementa um contador de referências compartilhado; o recurso só é liberado automaticamente quando esse contador chega a zero.

> **Nota:** `shared_ptr` tem um custo (o contador de referências, atualizado de forma **thread-safe**: sem risco de [race condition](/?c=langages-de-programmation&s=c&p=threads) se várias threads o modificarem ao mesmo tempo) superior ao `unique_ptr`: reservado para os casos em que um recurso realmente tem vários proprietários legítimos, não por padrão.

## Resumo

| | `new`/`delete` bruto | `unique_ptr` | `shared_ptr` |
|---|---|---|---|
| Liberação automática | Não | Sim | Sim |
| Número de proprietários | N/A | Apenas um | Vários |
| Custo | Mínimo | Quase nulo (sem sobrecusto na execução) | Contagem de referências (leve sobrecusto) |

> **Boa prática de C++ moderno:** nunca usar `new`/`delete` diretamente em código aplicativo; preferir sistematicamente `unique_ptr` (por padrão) ou `shared_ptr` (se o compartilhamento for realmente necessário), para se beneficiar de RAII sem precisar pensar nisso a cada vez.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | RAII liga a aquisição de um recurso ao construtor e sua liberação ao destrutor: o recurso é obrigatoriamente liberado assim que o objeto sai de escopo, mesmo em caso de exceção. `unique_ptr`/`shared_ptr` aplicam esse princípio à memória. |
| **Ferramentas utilizáveis** | `unique_ptr` (propriedade exclusiva), `shared_ptr` (propriedade compartilhada, contagem de referências), `std::move`. |
| **Armadilhas a evitar** | Usar `new`/`delete` diretamente em código aplicativo moderno: mesmos riscos que `malloc`/`free` (vazamento, liberação dupla, use-after-free). |
| **Boas práticas** | Preferir sistematicamente `unique_ptr` por padrão, `shared_ptr` apenas se um compartilhamento real for necessário. |
