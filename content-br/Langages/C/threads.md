---
order: 21
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

    // lanca a thread, executa "tarefa" em paralelo
    pthread_create(&thread, NULL, tarefa, &valor);
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
        contador++; // PERIGO: várias threads modificam a mesma variável ao mesmo tempo
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

## Evitar um deadlock por ordem total sobre as travas

O **problema do jantar dos filósofos** (proposto por Dijkstra) ilustra bem esse risco: N filósofos ao redor de uma mesa compartilham N garfos (um entre cada par de vizinhos) e cada um precisa segurar dois (esquerdo e direito) para comer. Se todos pegarem o garfo esquerdo ao mesmo tempo, cada um espera indefinidamente pelo garfo direito segurado pelo vizinho: um deadlock generalizado. É um caso particular de um problema mais geral: duas threads precisam cada uma de **dois** mutex para continuar, mas os travam em ordem diferente.

```text
Thread A:  lock(mutex1) -> espera mutex2 (retido por B)
Thread B:  lock(mutex2) -> espera mutex1 (retido por A)
-> deadlock: nem A nem B conseguem avançar
```

A solução mais simples: impor uma **ordem total** arbitrária, mas idêntica para todas as threads, sobre o conjunto de travas a adquirir (por exemplo, comparar o endereço de memória dos dois mutex e sempre travar primeiro o de endereço menor):

```c
if (mutex_a < mutex_b) {
    pthread_mutex_lock(mutex_a);
    pthread_mutex_lock(mutex_b);
} else {
    pthread_mutex_lock(mutex_b);
    pthread_mutex_lock(mutex_a);
}
```

Não importa qual thread chega primeiro nem em que ordem lógica as duas travas lhe são úteis: todas as threads do programa seguem a mesma regra (aqui, menor endereço primeiro), então nenhum ciclo de espera circular pode se formar.

> **Boa prática:** assim que uma função precisar travar vários mutex de uma vez, definir uma única regra de ordem e segui-la em todo o programa, em vez de travar na ordem em que as travas aparecem mencionadas localmente no código.

## Sem mutex: as operações atômicas

`contador++` é feito em três etapas (ler, somar 1, escrever): duas threads podem ler o mesmo valor antigo, e um incremento se perde. Uma **operação atômica** é executada pelo processador em **uma única etapa indivisível**: nenhuma outra thread pode se intercalar no meio. O C11 as fornece em `<stdatomic.h>`.

A mais útil é o **compare-and-swap** (CAS, "comparar e depois trocar"): "se a variável ainda vale o valor esperado, substitua pelo novo; senão, não mexa em nada e me avise". Ela permite, por exemplo, designar **um único vencedor** entre várias threads, sem mutex:

```c
#include <pthread.h>
#include <stdatomic.h>
#include <stdio.h>

atomic_int vencedor = -1;                // -1: ninguém venceu ainda
atomic_int contador = 0;

void *trabalhar(void *arg)
{
    int eu = *(int *)arg;
    int esperado = -1;
    for (int i = 0; i < 100000; i++)
        atomic_fetch_add(&contador, 1);  // +1 em uma única etapa indivisível
    // "se vencedor ainda vale -1, coloque o meu número": só uma thread pode conseguir
    if (atomic_compare_exchange_strong(&vencedor, &esperado, eu))
        printf("thread %d: venci\n", eu);
    return NULL;
}
```

Executada em 8 threads (compilação com `-pthread`), essa função sempre mostra um único vencedor, e `contador` vale exatamente 800.000 no fim.

| Ferramenta | Garante | Usar para |
|---|---|---|
| Mutex | Uma única seção de código por vez, tão longa quanto necessário | Modificar vários dados juntos |
| Operação atômica (`atomic_fetch_add`, CAS) | Uma única operação simples, indivisível, sem espera | Um contador, uma flag, designar um vencedor |
| `volatile` | Só que a variável é relida da memória a cada acesso | Os [sinais](/?c=langages&s=c&p=signaux-unix) e os registradores de hardware, **nunca** a sincronização entre threads |

> **Armadilha:** `volatile` **não** torna uma operação atômica nem impõe nenhuma ordem entre os acessos de duas threads: um `volatile int` incrementado por várias threads perde atualizações como um `int` comum. Entre threads, é preciso um tipo `atomic_*` ou um mutex.

## Uma variável global por thread: `_Thread_local`

Uma variável declarada `_Thread_local` (C11; `__thread` no GCC) existe em **uma cópia por thread**: cada thread lê e escreve a sua, sem mexer na das outras.

Caso típico: a função de ordenação `qsort()` chama um comparador que só recebe os dois elementos a comparar, sem nenhum parâmetro extra. Se ele precisa de um contexto (aqui, um array de pesos), esse contexto tem de passar por uma variável global, e duas threads que ordenam ao mesmo tempo o sobrescreveriam:

```c
#include <stdlib.h>

_Thread_local const int *g_pesos;        // uma cópia por thread

int comparar(const void *a, const void *b)
{
    int x = *(const int *)a, y = *(const int *)b;
    return g_pesos[x] - g_pesos[y];      // ordena índices pelo peso
}

void ordenar_indices(int *indices, int n, const int *pesos)
{
    g_pesos = pesos;                     // só afeta a cópia da thread que chama
    qsort(indices, n, sizeof(int), comparar);
}
```

Verificado com duas threads ordenando ao mesmo tempo, 100.000 vezes cada uma, uma por pesos crescentes e a outra por pesos decrescentes: cada uma sempre obtém a sua própria ordem.

## Repartir uma renderização entre threads: dividir a tela em faixas

Um caso concreto de paralelismo limitado pelo processamento (diferente de um paralelismo que sobretudo espera uma rede ou um disco): repartir uma [renderização por raycasting](/?c=fondamentaux&s=graphisme&p=rendu-3d-bas-niveau-et-fenetrage) entre várias threads, cada uma calculando uma **faixa vertical** da tela em vez de um pool de tarefas genérico:

```text
Tela dividida em N faixas verticais (N = número de threads):
  Thread 1: colunas 0 a 199
  Thread 2: colunas 200 a 399
  Thread 3: colunas 400 a 599
  Thread 4: colunas 600 a 799 (recolhe o resto se a divisão não for exata)
```

Em vez de criar e destruir threads a cada frame (um custo desnecessário), cada thread é criada **uma única vez** e permanece ativa por todo o programa, reexecutando sua faixa a cada novo frame:

```c
pthread_mutex_t trava_frame = PTHREAD_MUTEX_INITIALIZER;
int proximo_frame_pronto = 0;

void *calcularFaixa(void *argumento)
{
    while (1) {
        pthread_mutex_lock(&trava_frame);
        while (!proximo_frame_pronto) {
            pthread_mutex_unlock(&trava_frame);
            usleep(1); // espera ativa: veja Medir o tempo e esperar com precisão
            pthread_mutex_lock(&trava_frame);
        }
        pthread_mutex_unlock(&trava_frame);

        // ... calcular a faixa de colunas atribuída a esta thread ...
    }
}
```

> **Cilada:** sincronizar a thread principal e as threads de renderização com uma espera ativa (`usleep()` em loop sobre um indicador compartilhado) em vez de uma primitiva dedicada. Funciona, mas desperdiça tempo de processador verificando o indicador em loop em vez de dormir até que ele realmente mude.
>
> **Boa prática:** preferir uma **variável de condição** (`pthread_cond_t`, `pthread_cond_wait()`/`pthread_cond_signal()`) a uma espera ativa quando a ferramenta estiver disponível: a thread em espera fica então realmente suspensa, sem consumir processador, e é acordada apenas quando o estado muda.

Esse padrão (repartir um cálculo pesado entre threads persistentes, cada uma sobre uma porção fixa dos dados) difere do [paralelismo por workers independentes](/?c=qualite-performance-et-outils&s=performance&p=parallelisme) já visto para tarefas de rede/disco: aqui, a restrição é o processador, as threads compartilham a mesma memória (o frame em construção), e o número útil de threads é limitado pelo número de núcleos disponíveis em vez de por alvos externos independentes.

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
| **Ferramentas utilizáveis** | `pthread_create`/`pthread_join`, `pthread_mutex_t`/`lock`/`unlock`; `<stdatomic.h>` (`atomic_fetch_add`, compare-and-swap); `_Thread_local` para uma global própria de cada thread. Repartir um cálculo pesado (uma renderização) em faixas fixas entre threads persistentes; `pthread_cond_t` em vez de uma espera ativa para sincronizá-las. |
| **Armadilhas a evitar** | Modificar uma variável compartilhada sem proteção (*race condition*); esquecer de destravar um mutex (*deadlock* se outra thread esperar indefinidamente); travar vários mutex em ordem diferente conforme a thread; contar com `volatile` para sincronizar threads. |
| **Boas práticas** | Proteger todo dado compartilhado entre threads com um mutex, mesmo para uma operação que parece simples (`contador++` não é atômica). Travar vários mutex sempre na mesma ordem (ex. por endereço de memória) para evitar qualquer deadlock. |
