---
order: 1
---

# Referências

Uma **referência** é um alias — outro nome para uma variável já existente, nunca uma variável independente. Resolve um problema muito concreto da linguagem C: passar uma variável a uma função para que esta a possa modificar obrigava, até então, a manipular explicitamente ponteiros (ver capítulo sobre ponteiros, secção C).

## Declarar uma referência

```cpp
int idade = 25;
int &refAge = idade;   // refAge é um OUTRO NOME para age, não uma cópia

refAge = 30;
std::cout << idade;    // 30 -> alterar refAge altera diretamente age
```

> **Nota:** ao contrário de um ponteiro, uma referência **deve** ser inicializada logo na sua declaração e, posteriormente, **nunca** pode ser reatribuída para designar outra variável — uma vez associada a `idade`, `refAge` permanecerá um alias de `idade` durante todo o seu ciclo de vida.

## Chamar uma função por referência

```cpp
void incrementer(int &número) {
    número++;   // não é necessário desreferenciar com *, ao contrário do que acontece com um ponteiro em C
}

int x = 5;
incrementer(x);
std::cout << x;   // 6
```

Em comparação com o equivalente em C (ver capítulo sobre ponteiros):

```c
void incrementer(int *número) {
    (*número)++;
}
incrementer(&x);
```

A referência evita a sintaxe `*` / `&` na chamada e no interior da função, obtendo, no entanto, exatamente o mesmo comportamento (alterar a variável do chamador).

## `const &` : evitar a cópia sem correr o risco de alterações

Passar um objeto de grande dimensão por valor (uma cópia completa) em cada chamada à função consome tempo e memória. Passar por referência evita a cópia, mas permite que a função altere o original — o «`const &`» combina as duas vantagens:

```cpp
void afficher(const std::string &texto) {   // Não é permitida a cópia, E o texto não pode ser alterado aqui
    std::cout << texto;
}
```

> **Nota:** esta tornou-se a convenção padrão em C++ para passar um objeto de grande dimensão (cadeia, vetor, estrutura...) em modo de leitura única a uma função — mais rápido do que uma cópia, mais seguro do que um ponteiro bruto (sem risco de «`nullptr`», sem sintaxe de desreferenciamento para gerir).

## Referência vs. ponteiro

| | Referência | Ponto de referência |
|---|---|---|
| Pode ser `null` | Não, nunca | Sim (`nullptr`) |
| Reatribuível após a inicialização | Não | Sim |
| Sintaxe de acesso | Direta, tal como a própria variável | Requer «`*`» para desreferenciar |
| Deve ser inicializado na declaração | Sim, obrigatório | Não |

Uma referência é, portanto, mais restrita do que um ponteiro — é precisamente isso que a torna mais segura nos casos em que essas restrições não precisam de ser contornadas (já se sabe que a variável existe e que não mudará de alvo).
