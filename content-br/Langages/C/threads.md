---
order: 18
---

# As threads (pthread)

Uma **thread** (linha de execução) é, como um processo, uma sequência de instruções executada de forma independente, mas ao contrário do [`fork()`](/?c=langages-de-programmation&s=c&p=processus), várias threads de um mesmo programa **compartilham a mesma memória**. É mais leve de criar que um processo, mas isso introduz um risco novo: duas threads podem modificar o mesmo dado ao mesmo tempo.

## Criar e esperar uma thread

A biblioteca POSIX threads (`pthread`) fornece as funções básicas; a compilação exige a opção `-pthread` ([`gcc`](https://gcc.gnu.org) `-pthread main.c -o programa`). O padrão **POSIX** é apresentado no capítulo [Escrever um script](/?c=shells&s=bash&p=scripts-et-shebang) de [Bash](/?c=shells&s=bash&p=bash).

```c
#include <pthread.h>
#include <stdio.h>

void *tarefa(void *argumento)
{
    int *numero = (int *)argumento;
    printf("Thread: recebi %d\n", *numero);
    return NULL;
}

int main(void)
{
    pthread_t thread;
    int valor = 42;

    pthread_create(&thread, NULL, tarefa, &valor);  // lanca a thread, executa "tarefa" em paralelo
    pthread_join(thread, NULL);                     // espera essa thread terminar

    return 0;
}
```

- `pthread_create()` recebe: um ponteiro para o identificador de thread a preencher, atributos (`NULL` = padrão), a função a executar, e o argumento a passar a ela (um único ponteiro `void *`, a converter para o tipo real dentro da função).
- `pthread_join()` bloqueia a execução até que a thread visada termine: equivalente de `wait()` para um processo.

## Memória compartilhada: uma vantagem e um perigo

Ao contrário de dois processos resultantes de um `fork()` (memórias separadas), duas threads do mesmo programa veem e modificam as **mesmas variáveis globais**:

```c
#include <pthread.h>

int contador = 0; // compartilhado por todas as threads

void *incrementar(void *argumento)
{
    for (int i = 0; i < 1000000; i++) {
        contador++; // PERIGO: varias threads modificam a mesma variavel ao mesmo tempo
    }
    return NULL;
}
```

Se duas threads executam `incrementar()` em paralelo, o resultado final de `contador` é **imprevisível**: `contador++` não é uma única operação atômica no nível do processador (ela se decompõe em ler, somar, reescrever), e duas threads podem ler o mesmo valor antes que uma delas tenha tido tempo de reescrevê-lo: um dos dois incrementos é então silenciosamente perdido. Esse fenômeno se chama **race condition** (situação de disputa).

## Proteger um dado compartilhado com um mutex

Um **mutex** (*mutual exclusion*) garante que apenas uma seção de código por vez pode manipular um dado compartilhado: a primeira thread a alcançá-la **trava** o acesso, as outras esperam que ela seja **destravada**:

```c
#include <pthread.h>

int contador = 0;
pthread_mutex_t trava = PTHREAD_MUTEX_INITIALIZER;

void *incrementar(void *argumento)
{
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&trava);
        contador++;                   // apenas uma thread por vez pode executar esta linha
        pthread_mutex_unlock(&trava);
    }
    return NULL;
}
```

> **Nota:** um mutex travado e nunca destravado (esquecimento de `pthread_mutex_unlock()`, ou `return`/exceção antes de chegar lá) bloqueia **definitivamente** todas as outras threads que esperam essa trava: um bug clássico chamado **deadlock**, quando duas threads se esperam mutuamente, cada uma retendo uma trava de que a outra precisa.

## Threads vs processos

| | Processo (`fork`) | Thread (`pthread`) |
|---|---|---|
| Memória | Separada (cópia) | Compartilhada |
| Custo de criação | Mais elevado | Mais leve |
| Comunicação entre unidades | Exige um mecanismo explícito (pipe, memória compartilhada...) | Direta (variáveis globais), mas exige proteção (mutex) |
| Um crash afeta os outros? | Não (isolado) | Sim (uma thread que trava pode corromper todo o processo) |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma thread compartilha a memória com as outras threads do mesmo programa (ao contrário de um processo resultante de `fork()`), mais leve, mas exposta a *race conditions* nos dados compartilhados. |
| **Ferramentas utilizáveis** | `pthread_create`/`pthread_join`, `pthread_mutex_t`/`lock`/`unlock`. |
| **Armadilhas a evitar** | Modificar uma variável compartilhada sem proteção (*race condition*); esquecer de destravar um mutex (*deadlock* se outra thread esperar indefinidamente). |
| **Boas práticas** | Proteger todo dado compartilhado entre threads com um mutex, mesmo para uma operação que parece simples (`contador++` não é atômica). |
