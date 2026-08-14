---
order: 6
---

# As exceções

O C++ oferece um mecanismo de erros estruturado (`try` / `catch` / `throw`), uma alternativa ao estilo «à la C» (uma função devolve um valor especial como `-1` ou `NULL` e define `errno`, ver capítulo sobre chamadas de sistema, secção C), o mesmo princípio que as exceções em PHP, Python ou JavaScript, já abordadas nas secções correspondentes.

## `try` / `catch` / `throw`

```cpp
double diviser(double a, double b) {
    if (b == 0) {
        throw std::runtime_error("Division par zéro");
    }
    return a / b;
}

try {
    double resultado = diviser(10, 0);
} catch (const std::runtime_error &erro) {
    std::cout << "Erreur : " << erro.what() << "\n";
}
```

## A hierarquia padrão das exceções

```cpp
#include <stdexcept>

std::exception              // classe base de todas as exceções padrão
  ├── std::logic_error        // erro detetável antes da execução (por exemplo: argumento inválido)
  │     ├── std::invalid_argument
  │     └── std::out_of_range
  └── std::runtime_error       // erro detetável apenas durante a execução
        ├── std::overflow_error
        └── std::underflow_error
```

Interceptar `const std::exception &` permite capturar qualquer exceção derivada desta hierarquia padrão, útil como último recurso, mas é preferível interceptar o tipo mais **específico** possível para reagir de forma diferente consoante o problema real.

## Criar a sua própria exceção

```cpp
class SoldeInsuffisantException : public std::runtime_error {
public:
    SoldeInsuffisantException(double saldo)
        : std::runtime_error("Solde insuffisant : " + std::to_string(saldo)) {}
};

void retirer(double saldo, double montant) {
    if (montant > saldo) {
        throw SoldeInsuffisantException(saldo);
    }
}

try {
    retirer(100, 150);
} catch (const SoldeInsuffisantException &e) {
    std::cout << e.what() << "\n";
} catch (const std::exception &e) {   // rede de segurança para qualquer outra exceção padrão
    std::cout << "Erreur inattendue : " << e.what() << "\n";
}
```

## Exceções e RAII: por que razão este mecanismo é seguro em C++

```cpp
void traiter() {
    GestionnaireFichier gf("donnees.txt");   // ver capítulo sobre RAII
    throw std::runtime_error("Erreur pendant le traitement");
}   // Mesmo aqui, ~GestionnaireFichier() é executada ANTES de a exceção ser propagada para um nível superior
```

Quando é lançada uma exceção, o C++ «desenrola a pilha» (*stack unwinding*): cada objeto local ainda ativo vê o seu destrutor chamado, na ordem inversa à da sua criação, antes de a exceção continuar a subir: é isto que garante que um recurso gerido pelo RAII (ver capítulo dedicado) seja sempre libertado de forma adequada, mesmo em caso de erro imprevisto.

## `noexcept` : garantir que uma função nunca saia

```cpp
void fonctionSure() noexcept {
    // O compilador pode otimizar, sabendo que não será lançada nenhuma exceção a partir daqui
    // Se, apesar de tudo, ocorrer uma exceção, o programa termina imediatamente (std::terminate)
}
```

> **Melhores práticas:** só se deve lançar uma exceção numa situação verdadeiramente **excecional** (erro imprevisto, invariante violado), nunca num fluxo de controle normal (uma exceção tem um custo de execução não negligenciável em comparação com um simples «`if`», ao contrário de um retorno de erro clássico).
