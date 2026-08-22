---
order: 1
---

# As referências

Uma **referência** é um apelido: outro nome para uma variável já existente, nunca uma variável independente. Ela resolve um problema muito concreto do C: passar uma variável a uma função para que ela pudesse modificá-la até então obrigava a manipular explicitamente [ponteiros](/?c=langages-de-programmation&s=c&p=pointeurs).

## Declarar uma referência

```cpp
int idade = 25;
int &refIdade = idade;   // refIdade e OUTRO NOME para idade, nao uma copia

refIdade = 30;
std::cout << idade;      // 30 -> modificar refIdade modifica diretamente idade
```

> **Nota:** ao contrário de um ponteiro, uma referência **deve** ser inicializada logo em sua declaração, e depois nunca pode ser reatribuída para designar outra variável; uma vez ligada a `idade`, `refIdade` permanecerá um apelido de `idade` por toda sua vida.

## Passar por referência a uma função

```cpp
void incrementar(int &numero) {
    numero++;   // nao precisa desreferenciar com *, ao contrario de um ponteiro em C
}

int x = 5;
incrementar(x);
std::cout << x;   // 6
```

Comparado ao [equivalente em C](/?c=langages-de-programmation&s=c&p=pointeurs):

```c
void incrementar(int *numero) {
    (*numero)++;
}
incrementar(&x);
```

A referência evita a sintaxe `*`/`&` na chamada e dentro da função, obtendo exatamente o mesmo comportamento (modificar a variável do chamador).

## `const &`: evitar uma cópia sem arriscar uma modificação

Passar um objeto grande por valor (uma cópia completa) a cada chamada de função custa tempo e memória. Passar por referência evita a cópia, mas permite que a função modifique o original; `const &` combina as duas vantagens:

```cpp
void exibir(const std::string &texto) {   // sem copia, E texto nao pode ser modificado aqui
    std::cout << texto;
}
```

> **Nota:** essa se tornou a convenção padrão em C++ para passar um objeto volumoso (string, vetor, estrutura...) somente leitura a uma função: mais rápido que uma cópia, mais seguro que um ponteiro bruto (sem risco de `nullptr`, sem sintaxe de desreferenciamento a gerenciar).

## Referência vs ponteiro

| | Referência | Ponteiro |
|---|---|---|
| Pode ser `null` | Não, nunca | Sim (`nullptr`) |
| Reatribuível após a inicialização | Não | Sim |
| Sintaxe de acesso | Direta, como a própria variável | Exige `*` para desreferenciar |
| Deve ser inicializado na declaração | Sim, obrigatório | Não |

Uma referência é, portanto, mais restrita que um ponteiro: é precisamente isso que a torna mais segura nos casos em que essas restrições não precisam ser contornadas (já se sabe que a variável existe e não vai mudar de alvo).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma referência é um apelido de uma variável existente: nunca `null`, nunca reatribuível após a inicialização, sem sintaxe `*`/`&` no uso. `const &` passa um objeto volumoso sem cópia nem risco de modificação. |
| **Ferramentas utilizáveis** | `&` na declaração de tipo (referência), `const &` para um parâmetro somente leitura. |
| **Armadilhas a evitar** | Acreditar que uma referência pode ser `null` ou reatribuída como um ponteiro: ambas são impossíveis. |
| **Boas práticas** | Passar um objeto volumoso por `const &` por padrão, em vez de por valor (cópia custosa) ou por ponteiro bruto. |
