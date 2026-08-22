---
order: 6
---

# As exceções

C++ propõe um mecanismo de erros estruturado (`try`/`catch`/`throw`), uma alternativa ao estilo "à moda C" (uma função retorna um valor especial como `-1` ou `NULL`, e define `errno`, veja [As chamadas de sistema](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs)): o mesmo princípio das exceções [PHP](/?c=langages-de-programmation&s=php&p=exceptions), [Python](/?c=langages-de-programmation&s=python&p=gestion-des-erreurs) ou [JavaScript](/?c=langages-de-programmation&s=javascript&p=gestion-des-erreurs) já vistas nos capítulos correspondentes.

## `try` / `catch` / `throw`

```cpp
double dividir(double a, double b) {
    if (b == 0) {
        throw std::runtime_error("Divisao por zero");
    }
    return a / b;
}

try {
    double resultado = dividir(10, 0);
} catch (const std::runtime_error &erro) {
    std::cout << "Erro: " << erro.what() << "\n";
}
```

## A hierarquia padrão das exceções

```cpp
#include <stdexcept>

std::exception          // classe base de todas as excecoes padrao
  ├── std::logic_error  // erro detectavel antes da execucao (ex: argumento invalido)
  │     ├── std::invalid_argument
  │     └── std::out_of_range
  └── std::runtime_error       // erro detectavel apenas na execucao
        ├── std::overflow_error
        └── std::underflow_error
```

Capturar `const std::exception &` pega qualquer exceção derivada dessa hierarquia padrão: útil como último recurso, mas capturar o tipo mais **preciso** possível continua sendo preferível para reagir diferentemente conforme o problema real.

## Criar sua própria exceção

```cpp
class SaldoInsuficienteException : public std::runtime_error {
public:
    SaldoInsuficienteException(double saldo)
        : std::runtime_error("Saldo insuficiente: " + std::to_string(saldo)) {}
};

void sacar(double saldo, double valor) {
    if (valor > saldo) {
        throw SaldoInsuficienteException(saldo);
    }
}

try {
    sacar(100, 150);
} catch (const SaldoInsuficienteException &e) {
    std::cout << e.what() << "\n";
} catch (const std::exception &e) {   // rede de seguranca para qualquer outra excecao padrao
    std::cout << "Erro inesperado: " << e.what() << "\n";
}
```

## Exceções e RAII: por que esse mecanismo é seguro em C++

```cpp
void processar() {
    GerenciadorArquivo ga("dados.txt");   // veja RAII e os ponteiros inteligentes
    throw std::runtime_error("Erro durante o processamento");
}   // mesmo aqui, ~GerenciadorArquivo() executa ANTES que a excecao suba mais alto
```

Quando uma exceção é lançada, C++ "desenrola a pilha" (*stack unwinding*): cada objeto local ainda vivo tem seu destrutor chamado, na ordem inversa de sua criação, antes que a exceção continue subindo: é isso que garante que um recurso gerenciado por [RAII](/?c=langages-de-programmation&s=cpp&p=gestion-memoire-raii) é sempre liberado corretamente, mesmo em caso de erro imprevisto.

## `noexcept`: garantir que uma função nunca lança

```cpp
void funcaoSegura() noexcept {
    // o compilador pode otimizar sabendo que nenhuma excecao sairia daqui
    // se uma excecao escapar mesmo assim, o programa para imediatamente (std::terminate)
}
```

> **Boa prática:** só lançar uma exceção para uma situação realmente **excepcional** (erro imprevisto, [invariante](/?c=performance&p=traitements-longs) violado), nunca para um fluxo de controle normal (uma exceção tem um custo não desprezível na execução comparado a um simples `if`, ao contrário de um retorno de erro clássico).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `try`/`catch`/`throw` estrutura o tratamento de erros. A hierarquia padrão (`std::exception` e derivados) permite capturar por tipo preciso. O *stack unwinding* garante que um recurso RAII é liberado mesmo em caso de exceção. |
| **Ferramentas utilizáveis** | `std::runtime_error`, `std::logic_error`, exceções personalizadas herdando de `std::exception`, `noexcept`. |
| **Armadilhas a evitar** | Usar uma exceção para um fluxo de controle normal: custo não desprezível comparado a um simples `if`. |
| **Boas práticas** | Capturar o tipo mais preciso possível em vez de `std::exception` sistematicamente; reservar as exceções às situações realmente excepcionais. |
