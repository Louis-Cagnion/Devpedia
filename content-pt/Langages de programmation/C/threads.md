---
order: 16
---

# Os threads (pthread)

Um **thread** (fio de execução) é, tal como um processo, uma sequência de instruções executada de forma independente — mas, ao contrário de um`fork()`o (ver capítulo sobre processos), vários threads de um mesmo programa **partilham a mesma memória**. É mais leve de criar do que um processo, mas introduz um novo risco: dois threads podem alterar os mesmos dados ao mesmo tempo.

## Criar e aguardar um thread

A biblioteca POSIX threads (`pthread`) fornece as funções básicas; a compilação requer a opção «`-pthread`» (`gcc -pthread main.c -o programa`).

```c
#include <pthread.h>
#include <stdio.h>

void *tache(void *argument)
{
    int *número = (int *)argument;
    printf("Thread : je reçois %d\n", *número);
    return NULL;
}

int main(void)
{
    pthread_t thread;
    int valor = 42;

    pthread_create(&thread, NULL, tache, &valor); // lance le thread, exécute "tache" en parallèle
    pthread_join(thread, NULL);                    // attend que ce thread se termine

    return 0;
}
```

- `pthread_create()` Aceita: um ponteiro para o identificador do thread a preencher, atributos (`NULL` = por predefinição), a função a executar e o argumento a passar-lhe (um único ponteiro `void *`, a ser convertido para o tipo real no interior da função).
- `pthread_join()` bloqueia a execução até que o thread em questão termine — equivalente a «`wait()`» para um processo.

## Memória partilhada: uma vantagem e um risco

Ao contrário de dois processos originários de um «`fork()`» (memórias separadas), dois threads do mesmo programa acedem e alteram as **mesmas variáveis globais**:

```c
#include <pthread.h>

int contador = 0; // partagé par tous les threads

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        contador++; // DANGER : plusieurs threads modifient la même variable en même temps
    }
    return NULL;
}
```

Se dois threads executarem `incrementer()` em paralelo, o resultado final de `contador` é **imprevisível**: `contador++` não é uma única operação atómica ao nível do processador (decompõe-se em ler, adicionar, reescrever), e duas threads podem ler o mesmo valor antes de uma delas ter tido tempo de o reescrever — um dos dois incrementos é então silenciosamente perdido. Este fenómeno denomina-se **«condição** de **corrida**» (situação de competição).

## Proteger dados partilhados com um mutex

Um **mutex** (*exclusão mútua*) garante que apenas uma secção de código de cada vez possa manipular um dado partilhado: o primeiro thread a aceder ao mesmo **bloqueia-o**, enquanto os outros aguardam que este o **desbloqueie**:

```c
#include <pthread.h>

int contador = 0;
pthread_mutex_t verrou = PTHREAD_MUTEX_INITIALIZER;

void *incrementer(void *argument)
{
    for (int i = 0; i < 1000000; i++) {
        pthread_mutex_lock(&verrou);
        contador++;                    // une seule thread à la fois peut exécuter cette ligne
        pthread_mutex_unlock(&verrou);
    }
    return NULL;
}
```

> **Nota:** um mutex bloqueado e que nunca é desbloqueado (esquecimento de «`pthread_mutex_unlock()`», ou «`return`» / exceção antes de chegar a essa fase) bloqueia **definitivamente** todas as outras threads que aguardam esse bloqueio — um bug clássico denominado **«deadlock»**, que ocorre quando duas threads aguardam uma pela outra, cada uma retendo um bloqueio de que a outra necessita.

## Threads vs. processos

| | Processo (`fork`) | Thread (`pthread`) |
|---|---|---|
| Memória | Separada (cópia) | Partilhada |
| Custo de criação | Mais elevado | Mais leve |
| Comunicação entre unidades | Requer um mecanismo explícito (pipe, memória partilhada...) | Direta (variáveis globais), mas requer proteção (mutex) |
| Uma falha afeta os outros? | Não — isolada | Sim — um thread que falha pode corromper todo o processo |
