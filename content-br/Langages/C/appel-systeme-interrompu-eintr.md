---
order: 29
---

# Chamada de sistema interrompida por um sinal (EINTR)

Uma **chamada de sistema** é um pedido feito ao kernel (o núcleo do sistema operacional) para uma operação que o programa não tem permissão de fazer sozinho: ler um arquivo, esperar um processo filho, suspender o programa (veja [as chamadas de sistema e os descritores](/?c=langages&s=c&p=appels-systeme-et-descripteurs)). Algumas dessas chamadas são **bloqueantes**: elas só devolvem o controle quando aquilo que esperam chegou, o que pode durar segundos, ou para sempre. E se, durante essa espera, chega um **sinal** (uma notificação enviada a um processo pelo sistema ou por outro processo, veja [os sinais UNIX](/?c=langages&s=c&p=signaux-unix))? A chamada volta anunciando uma falha que não é uma falha: `EINTR`. Este capítulo explica o que isso significa, como se proteger disso e por que as funções de `<stdio.h>` não resolvem o problema no seu lugar.

Ele pressupõe que você já conhece os sinais e o seu [handler](/?c=langages&s=c&p=signaux-unix) (a função que o kernel chama na chegada do sinal), [`signal()` e `sigaction()`](/?c=langages&s=c&p=signaux-unix#sigaction-um-handler-enriquecido-com-siginfo-t), [`errno`](/?c=langages&s=c&p=appels-systeme-et-descripteurs#sinalizar-um-erro-errno) (a variável onde a chamada deposita o código da sua falha) e o [descritor de arquivo](/?c=langages&s=c&p=appels-systeme-et-descripteurs#o-descritor-de-arquivo-uma-simples-entrada-em-uma-tabela) (um inteiro que designa um recurso aberto: arquivo, pipe, terminal...). Todas as observações foram feitas no Linux com a biblioteca C do projeto GNU (**glibc**, a biblioteca padrão da linguagem C fornecida com a maioria das distribuições Linux).

## O cenário: uma chamada que espera

Eis algumas chamadas que podem esperar por muito tempo.

| Chamada | O que ela espera |
|---|---|
| `read` | Bytes para ler de um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal), um pipe (definido abaixo) ou uma conexão de rede |
| `write` | Espaço em um pipe ou em uma conexão cujo **buffer** (a área de memória de espera) está cheio |
| `accept` | Que um cliente (programa que pede um serviço) se conecte a um servidor (programa que o oferece, veja [os sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)) |
| `waitpid` | Que um processo filho termine (veja [o gerenciamento de processos](/?c=langages&s=c&p=processus)) |
| `sem_wait` | Que um semáforo (um contador que regula o acesso a um recurso) fique positivo (veja [os semáforos](/?c=langages&s=c&p=semaphores)) |
| `nanosleep` | Que uma duração transcorra |
| `poll`, `select` | Que pelo menos um descritor esteja pronto, ou que um prazo expire |

Um **pipe** (canal de mão única) é um canal de sentido único: o que um processo escreve de um lado, outro lê do outro lado. É isso que o `|` do shell cria (veja [a arquitetura de um shell](/?c=langages&s=bash&p=architecture-dun-shell)). Se um handler está instalado para um sinal e esse sinal chega durante a espera, o kernel interrompe a espera, executa o handler, e então a chamada volta com `-1` e `errno` igual a `EINTR` (da palavra inglesa *interrupted*, "interrompido").

```text
Tempo ----------------------------------------------------------------->

programa :   read() ........ espera ........ [handler] ... read() retorna -1
                                   ^                              errno = EINTR
kernel    :                        |
                          o sinal chega (aqui SIGALRM)
```

Nada falhou: a chamada simplesmente não pôde ir até o fim. Os dados não foram perdidos, basta recomeçar. Mas tudo depende do que o programa instalou para o sinal:

| Situação do sinal | O que acontece com a chamada bloqueada |
|---|---|
| Comportamento padrão que mata o processo (`SIGALRM`, `SIGTERM`...) | O processo morre, não há mais chamada a interromper |
| Sinal ignorado (`SIG_IGN`) | Nada acontece, a chamada continua esperando |
| Handler instalado, sem `SA_RESTART` | A chamada volta com `-1` e `EINTR` |
| Handler instalado, com `SA_RESTART` | O kernel repete a chamada sozinho (na maioria das chamadas) |

Para provocar a interrupção sem digitar nada, os programas deste capítulo usam `alarm(1)`: o kernel enviará o sinal `SIGALRM` ao processo em 1 segundo. Eles são executados com `(sleep 3; echo bonjour) | ./programa`: o shell executa `sleep 3` (que espera 3 segundos), depois `echo bonjour` escreve "bonjour" em um pipe cuja outra ponta é lida por `./programa`. O programa espera então 3 segundos, e o alarme toca após apenas um. Eles usam também algumas funções de instalação:

| Elemento | Papel |
|---|---|
| `struct sigaction sa` | Estrutura que descreve o que queremos para um sinal (handler, flags...) |
| `memset(&sa, 0, sizeof sa)` | Coloca todos os bytes de `sa` em zero, para não herdar valores aleatórios |
| `sigemptyset(&sa.sa_mask)` | Prepara uma lista vazia de sinais a bloquear durante o handler |
| `sigaction(SIGALRM, &sa, NULL)` | Instala essa descrição para `SIGALRM` |
| `alarm(1)` | Pede ao kernel para enviar `SIGALRM` em 1 segundo ([`alarm`](https://man7.org/linux/man-pages/man2/alarm.2.html)) |
| `ssize_t` | Inteiro com sinal para um número de bytes: pode valer `-1` (`size_t` é seu equivalente sem sinal; `printf` os exibe com `%zd` e `%zu`) |
| `strerror(errno)` | Traduz o código de erro `errno` em texto legível |

## A armadilha: tomar EINTR por um erro real

Um programa habituado a testar "`-1` então erro" se engana aqui (`stderr` é a saída de erro do programa, o descritor 2):

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void ao_alarme(int sig)
{
    (void)sig;                          // só nos interessa o fato de ser chamado
}

int main(void)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    char             buffer[64];        // área de memória que receberá os bytes lidos
    ssize_t          n;                 // bytes lidos, ou -1 se a chamada falhou

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_alarme;          // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    sigaction(SIGALRM, &sa, NULL);      // instala o handler, sem SA_RESTART
    alarm(1);                           // SIGALRM chegará em 1 segundo
    n = read(STDIN_FILENO, buffer, sizeof buffer);   // espera na entrada padrão
    if (n == -1) {                      // -1: a chamada não teve sucesso
        fprintf(stderr, "read: %s\n", strerror(errno));   // traduz errno em texto
        return 1;                       // o programa aborta indevidamente
    }
    printf("lidos %zd bytes\n", n);     // caminho normal: bytes chegaram
    return 0;
}
```

```text
read: Interrupted system call
```

O programa reclama e sai, quando o pipe ia receber "bonjour" dois segundos depois. A receita clássica é um **laço de nova tentativa**: enquanto a chamada falha por causa de uma interrupção, ela é chamada de novo.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void ao_alarme(int sig)
{
    (void)sig;                          // nada a fazer: a interrupção basta
}

int main(void)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    char             buffer[64];        // área de memória que receberá os bytes lidos
    ssize_t          n;                 // bytes lidos, ou -1 se a chamada falhou
    int              tentativas = 0;    // número de vezes em que foi preciso repetir read

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_alarme;          // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    sigaction(SIGALRM, &sa, NULL);      // instala o handler, sem SA_RESTART
    alarm(1);                           // SIGALRM chegará em 1 segundo
    do {
        n = read(STDIN_FILENO, buffer, sizeof buffer);   // espera por dados
        if (n == -1 && errno == EINTR)  // interrompido pelo sinal, não é erro real
            tentativas++;               // conta a interrupção
    } while (n == -1 && errno == EINTR);   // e repete a chamada
    if (n == -1) {                      // aqui é um erro de verdade (descritor fechado...)
        fprintf(stderr, "read: %s\n", strerror(errno));   // traduz errno em texto
        return 1;                       // abandono justificado
    }
    printf("lidos %zd bytes após %d retentativa(s)\n", n, tentativas);   // resultado final
    return 0;
}
```

```text
lidos 8 bytes após 1 retentativa(s)
```

O `-1` sozinho não diz nada: é `errno` que distingue as causas. Só `EINTR` é repetido.

| Valor de `errno` após `-1` | Significado | Reação |
|---|---|---|
| `EINTR` | Interrompido por um handler de sinal | Repetir a chamada |
| `EBADF` | O descritor não está aberto | Bug do programa: corrigir |
| `EIO` | Erro de hardware de entrada e saída | Sinalizar e abortar |

> **Armadilha:** repetir em qualquer `-1`. Um erro real (`EBADF`) faria o laço girar sem fim, em velocidade máxima.

## `SA_RESTART`: pedir ao kernel que repita

Uma **flag** (sinalizador) é uma opção representada por um bit de um inteiro, combinada com as outras pelo OU binário `|` (veja [os operadores binários](/?c=langages&s=c&p=operateurs-binaires)). `sigaction()` aceita em `sa_flags` a flag `SA_RESTART` (do inglês *restart*, "reiniciar"): ela pede ao kernel que repita, por conta própria, as chamadas interrompidas por esse sinal. O handler continua sendo executado, mas o programa não vê mais `EINTR`.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t g_alarmes = 0;   // contador alterado pelo handler

static void ao_alarme(int sig)
{
    (void)sig;                          // o número do sinal não nos serve
    g_alarmes++;                        // única ação: contar as chegadas
}

int main(void)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    char             buffer[64];        // área de memória que receberá os bytes lidos
    ssize_t          n;                 // bytes lidos, ou -1 se a chamada falhou

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_alarme;          // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    sa.sa_flags = SA_RESTART;           // pede ao kernel que repita read sozinho
    sigaction(SIGALRM, &sa, NULL);      // instala o handler
    alarm(1);                           // SIGALRM chegará em 1 segundo
    n = read(STDIN_FILENO, buffer, sizeof buffer);   // uma única vez, sem laço
    if (n == -1) {                      // nada de EINTR aqui
        fprintf(stderr, "read: %s\n", strerror(errno));   // traduz errno em texto
        return 1;
    }
    printf("lidos %zd bytes, handler chamado %d vez(es)\n", n, (int)g_alarmes);
    return 0;
}
```

```text
lidos 8 bytes, handler chamado 1 vez(es)
```

O handler rodou uma vez (o contador prova), e `read` esperou por "bonjour" sem que o programa tivesse um laço para escrever. O tipo `volatile sig_atomic_t` do contador é explicado em [escrever um handler seguro](/?c=langages&s=c&p=signaux-unix#escrever-um-handler-seguro).

### `signal()` contra `sigaction()`

Ambas instalam um handler, mas só `sigaction()` diz explicitamente o que queremos (veja [`sigaction()`](/?c=langages&s=c&p=signaux-unix#sigaction-um-handler-enriquecido-com-siginfo-t)).

| | `signal()` | `sigaction()` |
|---|---|---|
| Repetição das chamadas | Não especificada: depende do sistema | Explícita: presença ou ausência de `SA_RESTART` |
| Com glibc (observado) | Repetição automática: `read` não é interrompido | Conforme a flag pedida |
| Portabilidade do comportamento | Fraca: o mesmo código pode se comportar de outra forma em outro lugar | Boa |
| A preferir | Nunca para um handler que importa | Sempre |

### Os limites de `SA_RESTART`

`SA_RESTART` não cobre todas as chamadas. O manual [`signal(7)`](https://man7.org/linux/man-pages/man7/signal.7.html) lista as que sempre falham com `EINTR`, mesmo com a flag, e as que são repetidas. A tabela cruza essa lista com o que foi observado aqui por um programa de teste para cada chamada, com um handler de `SIGALRM`.

| Chamada | Sem `SA_RESTART` | Com `SA_RESTART` | Observação |
|---|---|---|---|
| `read` (pipe, terminal) | `-1`, `EINTR` | Repetida | Caso mais comum |
| `write` (pipe cheio) | `-1`, `EINTR` | Repetida | Veja a escrita parcial mais abaixo |
| `waitpid` | `-1`, `EINTR` | Repetida | Espera por um filho |
| `sem_wait` | `-1`, `EINTR` | Repetida (observado) | Pode variar de um sistema para outro |
| `nanosleep` | `-1`, `EINTR` | `-1`, `EINTR` | Nunca repetida |
| `sleep` | Devolve o tempo restante | Idem | Nunca repetida |
| `poll`, `select` | `-1`, `EINTR` | `-1`, `EINTR` | Nunca repetidas |
| `close` | Veja mais abaixo | Veja mais abaixo | Não se repete |

Consequência: mesmo com `SA_RESTART`, é preciso manter o laço de nova tentativa para `nanosleep`, `poll` e `select`. Para uma espera de duração fixa, `nanosleep` aceita um segundo argumento que recebe o tempo restante: repete-se com esse resto, não com a duração original (para as outras formas de esperar, veja [a medição do tempo](/?c=langages&s=c&p=mesure-du-temps)).

Outro efeito a conhecer: com `SA_RESTART`, o programa não é mais avisado por `EINTR`. Um handler de `SIGINT` (Ctrl-C) que levanta um indicador de parada não tem efeito enquanto o `read` bloqueado é repetido em silêncio. Para que um sinal realmente acorde o programa, não se usa `SA_RESTART` e testa-se um **indicador** (uma variável que vale 0 enquanto nada aconteceu, 1 depois) a cada `EINTR`:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static volatile sig_atomic_t g_parada = 0;   // passa a 1 quando a parada é pedida

static void ao_sinal(int sig)
{
    (void)sig;                          // o número do sinal não nos serve
    g_parada = 1;                       // única ação: levantar o indicador
}

int main(void)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    char             buffer[64];        // área de memória que receberá os bytes lidos
    ssize_t          n = -1;            // bytes lidos, ou -1

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_sinal;           // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    sigaction(SIGALRM, &sa, NULL);      // sem SA_RESTART: read será interrompido
    alarm(1);                           // simula o pedido de parada (aqui um SIGALRM)
    while (!g_parada) {                 // repete enquanto ninguém pediu a parada
        n = read(STDIN_FILENO, buffer, sizeof buffer);   // espera por dados
        if (n == -1 && errno == EINTR)  // interrompido: volta a testar o indicador
            continue;
        break;                          // dados, fim ou erro real: sai do laço
    }
    if (g_parada)                       // a interrupção virou um pedido de parada
        printf("parada solicitada, saindo com limpeza\n");
    else
        printf("lidos %zd bytes\n", n);
    return 0;
}
```

```text
parada solicitada, saindo com limpeza
```

Aqui `EINTR` é útil: é a única forma de sair de um `read` que não tem nada para ler.

## Os casos especiais que pegam de surpresa

### Uma leitura ou escrita parcial não devolve `-1`

Se o sinal chega **depois** que uma chamada já transferiu parte dos bytes, ela não devolve `-1`: devolve o número de bytes já transferidos. É uma **leitura parcial** (ou **escrita parcial**): menos bytes que o pedido, sem que isso seja um erro. O programa a seguir escreve 200.000 bytes em um pipe que ninguém lê; a capacidade de um pipe no Linux é de 65.536 bytes por padrão:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void ao_alarme(int sig)
{
    (void)sig;                          // a interrupção é o único efeito desejado
}

int main(void)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    static char      grande[200000];    // 200.000 bytes: mais que a capacidade de um pipe
    int              pipe_fds[2];       // pipe_fds[0]: leitura, pipe_fds[1]: escrita
    ssize_t          n;                 // bytes escritos, ou -1

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_alarme;          // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    sigaction(SIGALRM, &sa, NULL);      // sem SA_RESTART: write será interrompido
    if (pipe(pipe_fds) == -1)           // cria um pipe que ninguém lê
        return 1;
    memset(grande, 'x', sizeof grande); // preenche a área com 'x'
    alarm(1);                           // SIGALRM chegará quando o pipe estiver cheio
    n = write(pipe_fds[1], grande, sizeof grande);   // bloqueia assim que o pipe está cheio
    printf("write de %zu bytes: retorna %zd\n", sizeof grande, n);
    return 0;
}
```

```text
write de 200000 bytes: retorna 65536
```

| O que aconteceu antes do sinal | `write` / `read` devolve | `errno` |
|---|---|---|
| Nenhum byte transferido | `-1` | `EINTR` |
| Parte dos bytes transferida | O número já transferido (inferior ao pedido) | Sem significado: não o leia |
| Tudo transferido | A quantidade pedida | Sem significado |

A armadilha: depois de um `read` parcial, repetir com o **mesmo** buffer sobrescreveria os primeiros bytes. É preciso avançar no buffer do número de bytes já recebidos. Esse é o trabalho de `ler_tudo`, mais abaixo.

### `close()` devolve `EINTR`: não repetir

[POSIX](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html) (o padrão que descreve a interface dos sistemas do tipo Unix) prevê que `close()` interrompido devolva `-1` com `EINTR`, e que o estado do descritor fique então **indeterminado**: ele pode estar fechado ou ainda aberto, conforme o sistema. O manual do Linux esclarece que o descritor já está liberado nesse caso, e que um segundo `close()` nesse número poderia fechar um descritor aberto nesse meio-tempo por outra [thread](/?c=langages&s=c&p=threads) (um fio de execução do mesmo programa). Regra prudente: nunca repetir `close()`.

```c
if (close(fd) == -1) {                  // o fechamento sinalizou um problema
    if (errno != EINTR)                 // EINTR: não chame close de novo
        fprintf(stderr, "close: %s\n", strerror(errno));   // outra causa: sinaliza
}
```

### `EINTR` só existe se um handler estiver instalado

Um sinal ignorado ou deixado no comportamento padrão nunca produz `EINTR`: o primeiro é descartado pelo kernel, o segundo mata o processo (ou é ignorado, conforme o sinal).

O programa lê um argumento da linha de comando (veja [`argc` e `argv`](/?c=langages&s=c&p=argc-et-argv)) para escolher entre os dois casos:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

int main(int argc, char **argv)
{
    char    buffer[64];                 // área de memória que receberá os bytes lidos
    ssize_t n;                          // bytes lidos, ou -1 se a chamada falhou

    if (argc > 1 && strcmp(argv[1], "ignorar") == 0)   // argumento "ignorar"
        signal(SIGALRM, SIG_IGN);       // SIG_IGN: o kernel descarta o sinal
    alarm(1);                           // sem argumento: comportamento padrão do sinal
    n = read(STDIN_FILENO, buffer, sizeof buffer);   // espera por dados
    if (n == -1)                        // nenhum handler: sem EINTR
        printf("read: %s\n", strerror(errno));
    else
        printf("lidos %zd bytes\n", n);
    return 0;
}
```

| Execução (com o mesmo pipe lento de antes) | Saída observada |
|---|---|
| `./ignora ignorar` | `lidos 8 bytes`: o alarme é descartado, `read` espera o fim |
| `./ignora` | Nenhuma saída: o processo morre. O status de saída é 142: o shell indica "morto por um sinal" com 128 mais o número do sinal, aqui 14 para `SIGALRM` |

## `fread` e `fgets`: a biblioteca padrão faz o trabalho?

`fread` e `fgets` (veja [a leitura de arquivos](/?c=langages&s=c&p=lecture-de-fichiers)) pertencem a `<stdio.h>`, a biblioteca de entrada e saída padrão do C. Elas leem por meio de um `FILE *` (um **fluxo**, um objeto que reúne um descritor e um buffer de memória). `fread(buffer, 1, n, fluxo)` lê até `n` bytes; em caso de falha ou fim, ela devolve menos que o pedido e consulta-se `ferror(fluxo)` (1 se o fluxo está em erro) e `feof(fluxo)` (1 se o fim dos dados foi atingido). Por baixo, elas chamam `read`. Pode-se achar que essa camada esconde a interrupção. Teste com um `fread` na entrada padrão, um handler de `SIGALRM` sem `SA_RESTART` e um alarme que toca durante a espera:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

static void ao_alarme(int sig)
{
    (void)sig;                          // só nos interessa o fato de ser chamado
}

int main(int argc, char **argv)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    char             buffer[64];        // área de memória que receberá os bytes lidos
    size_t           n;                 // número de elementos lidos pelo fread

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_alarme;          // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    if (argc > 1 && strcmp(argv[1], "restart") == 0)   // "restart" ativa SA_RESTART
        sa.sa_flags = SA_RESTART;       // o kernel repetirá read sozinho
    sigaction(SIGALRM, &sa, NULL);      // instala o handler
    alarm(1);                           // SIGALRM chegará em 1 segundo
    errno = 0;                          // começa com um errno limpo para observá-lo bem
    n = fread(buffer, 1, sizeof buffer, stdin);   // pede 64 bytes da entrada padrão
    printf("fread=%zu ferror=%d feof=%d errno=%d (%s)\n",
           n,                           // bytes realmente devolvidos
           ferror(stdin) != 0,          // 1 se a flag de erro do fluxo estiver levantada
           feof(stdin) != 0,            // 1 se o fim do fluxo foi atingido
           errno,                       // 4 vale EINTR no Linux
           strerror(errno));            // o texto correspondente
    return 0;
}
```

```text
$ (sleep 3; echo bonjour) | ./stdio
fread=0 ferror=1 feof=0 errno=4 (Interrupted system call)

$ (printf abc; sleep 3; echo def) | ./stdio
fread=3 ferror=1 feof=0 errno=4 (Interrupted system call)

$ (sleep 3; echo bonjour) | ./stdio restart
fread=8 ferror=0 feof=1 errno=0 (Success)
```

Observação: `fread` **não repete**. Ela para, devolve o que já tinha (0 ou 3 bytes), levanta a flag de erro do fluxo e deixa `errno` em `EINTR` (valor 4 no Linux). O mesmo teste com `fgets` devolve `NULL` com `ferror` em 1 e `errno` em 4. Com `SA_RESTART`, tudo funciona, mas porque é o kernel que repete o `read` subjacente, não `fread`.

A norma da linguagem C não diz nada sobre `EINTR`, e POSIX permite que essas funções falhem com `EINTR` ([`fread`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/fread.html)). O comportamento observado aqui portanto não é uma garantia: outro sistema poderia decidir de outra forma. Para um programa portável, é preciso repetir por conta própria. A função `clearerr(fluxo)` apaga a flag de erro e a flag de fim do fluxo, o que permite tentar de novo:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// Igual a fread, mas repete se a chamada de sistema subjacente for interrompida.
size_t ler_fluxo(void *buffer, size_t tamanho, FILE *fluxo)
{
    char    *bytes = buffer;            // visão byte a byte da área a preencher
    size_t   total = 0;                 // bytes já recebidos

    while (total < tamanho) {           // enquanto faltar algum
        total += fread(bytes + total, 1, tamanho - total, fluxo);   // lê o restante
        if (total == tamanho || feof(fluxo))   // concluído, ou fim do fluxo
            break;
        if (ferror(fluxo) && errno == EINTR)   // interrupção, não é uma falha real
            clearerr(fluxo);            // limpa a flag de erro e então repete
        else
            break;                      // erro real: para
    }
    return total;
}

static void ao_alarme(int sig)
{
    (void)sig;                          // a interrupção é o único efeito desejado
}

int main(void)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    char             buffer[8];         // área que receberá os bytes lidos
    size_t           n;                 // bytes devolvidos por ler_fluxo

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_alarme;          // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    sigaction(SIGALRM, &sa, NULL);      // sem SA_RESTART: read será interrompido
    alarm(1);                           // SIGALRM cairá durante a espera
    n = ler_fluxo(buffer, 7, stdin);    // quer 7 bytes: "abc" chega antes do alarme
    printf("lidos %zu bytes: %.*s\n", n, (int)n, buffer);
    return 0;
}
```

```text
$ (printf abc; sleep 3; printf defg) | ./ler_fluxo
lidos 7 bytes: abcdefg
```

Dois detalhes importam. Primeiro, `clearerr`: sem ele, a flag de erro continuaria levantada e toda chamada seguinte falharia de imediato. Depois, `errno` só se consulta após uma falha constatada (`ferror`): uma chamada bem-sucedida não o zera, então ele pode continuar valendo `EINTR` por causa de uma interrupção passada.

## O que faz cada camada?

| Camada | Reação a um sinal capturado | O que o programa deve fazer |
|---|---|---|
| Chamada de sistema bruta (`read`, `write`) | `-1` e `EINTR` se nada foi transferido, senão o número de bytes já transferidos | Laço de nova tentativa, e avançar no buffer |
| Função de `<stdio.h>` (`fread`, `fgets`) | Observado: para, flag de erro levantada, `errno` em `EINTR` | `clearerr` e depois repetir, ou `SA_RESTART` |
| `SA_RESTART` | O kernel repete as chamadas que o permitem | Manter um laço para `nanosleep`, `poll`, `select` |
| Laço de nova tentativa | Absorve `EINTR` | Testar o indicador de parada a cada volta, se o sinal deve acordar o programa |

## Uma função reutilizável: `ler_tudo`

`ler_tudo(fd, buffer, tamanho)` combina as duas proteções: repete em `EINTR` e trata a leitura parcial avançando no buffer. Ela para em `tamanho` bytes, ou antes se a outra ponta fechar (`read` devolve então `0`). O `main` simula um escritor lento com algumas funções já vistas no capítulo sobre [os processos](/?c=langages&s=c&p=processus):

| Função | Papel aqui |
|---|---|
| `pipe(pipe_fds)` | Cria um pipe: `pipe_fds[0]` é a ponta de leitura, `pipe_fds[1]` a ponta de escrita |
| `fork()` | Duplica o processo; o filho recebe `0`, o pai recebe o identificador do filho |
| `sleep(2)` | Suspende o processo por 2 segundos |
| `_exit(0)` | Termina o processo imediatamente, sem esvaziar os buffers do `printf` |
| `close(pipe_fds[1])` | Fecha uma ponta do pipe: sem isso, o leitor nunca veria o fim dos dados |

O cenário: três bytes de imediato, uma pausa de 2 segundos durante a qual o alarme toca, depois cinco bytes.

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <unistd.h>

// Lê exatamente tamanho bytes, a menos que o fim dos dados chegue antes.
// Devolve o número de bytes lidos (0 se nada), ou -1 em caso de erro real.
ssize_t ler_tudo(int fd, void *buffer, size_t tamanho)
{
    char    *bytes = buffer;            // visão byte a byte da área a preencher
    size_t   total = 0;                 // bytes já recebidos
    ssize_t  n;                         // resultado da última read

    while (total < tamanho) {           // enquanto faltar algum
        n = read(fd, bytes + total, tamanho - total);   // lê o restante, não do início
        if (n == -1 && errno == EINTR)  // interrupção por um sinal
            continue;                   // repete sem perder nada
        if (n == -1)                    // erro real
            return -1;                  // errno descreve a causa, deixa-a para quem chamou
        if (n == 0)                     // fim dos dados: a outra ponta fechou
            break;                      // devolve o que temos
        total += (size_t)n;             // leitura completa ou parcial: avança
    }
    return (ssize_t)total;
}

static void ao_alarme(int sig)
{
    (void)sig;                          // a interrupção é o único efeito desejado
}

int main(void)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    int              pipe_fds[2];       // pipe_fds[0]: leitura, pipe_fds[1]: escrita
    char             buffer[9];         // 8 bytes esperados + 1 para o '\0'
    ssize_t          n;                 // bytes devolvidos por ler_tudo

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_alarme;          // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    sigaction(SIGALRM, &sa, NULL);      // sem SA_RESTART: read será interrompido
    if (pipe(pipe_fds) == -1)           // cria o pipe
        return 1;
    if (fork() == 0) {                  // o processo filho faz o papel do escritor lento
        if (write(pipe_fds[1], "abc", 3) == -1)   // envia 3 bytes de imediato
            _exit(1);
        sleep(2);                       // depois se cala por 2 segundos
        if (write(pipe_fds[1], "defgh", 5) == -1)   // envia os 5 últimos bytes
            _exit(1);
        _exit(0);                       // o filho terminou
    }
    close(pipe_fds[1]);                 // o pai só mantém a ponta de leitura
    alarm(1);                           // SIGALRM chegará enquanto o filho se cala
    n = ler_tudo(pipe_fds[0], buffer, 8);   // quer 8 bytes: 3, interrupção, 5
    if (n == -1)
        return 1;
    buffer[n] = '\0';                   // termina a string para poder exibi-la
    printf("lidos %zd bytes: %s\n", n, buffer);
    return 0;
}
```

```text
lidos 8 bytes: abcdefgh
```

A primeira leitura devolve 3 bytes (parcial), a segunda é interrompida (`EINTR`, repetida sem perda), a terceira devolve os 5 últimos. A versão simétrica para a escrita:

```c
#include <errno.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

// Escreve exatamente tamanho bytes. Devolve 0 se tudo saiu, -1 em caso de erro real.
int escrever_tudo(int fd, const void *buffer, size_t tamanho)
{
    const char *bytes = buffer;         // visão byte a byte da área a enviar
    size_t      total = 0;              // bytes já enviados
    ssize_t     n;                      // resultado do último write

    while (total < tamanho) {           // enquanto restar algum
        n = write(fd, bytes + total, tamanho - total);   // envia o restante
        if (n == -1 && errno == EINTR)  // interrupção por um sinal
            continue;                   // repete sem perder nada
        if (n == -1)                    // erro real
            return -1;                  // errno descreve a causa
        total += (size_t)n;             // escrita completa ou parcial: avança
    }
    return 0;
}

static void ao_alarme(int sig)
{
    (void)sig;                          // a interrupção é o único efeito desejado
}

int main(void)
{
    struct sigaction sa;                // descrição do comportamento desejado para um sinal
    static char      grande[200000];    // mais que a capacidade de um pipe
    static char      recebido[4096];    // pequeno buffer de leitura do filho
    int              pipe_fds[2];       // pipe_fds[0]: leitura, pipe_fds[1]: escrita
    long             contagem = 0;      // bytes contados pelo filho
    ssize_t          n;                 // bytes lidos pelo filho

    memset(&sa, 0, sizeof sa);          // zera todos os campos de sa
    sa.sa_handler = ao_alarme;          // função a chamar na chegada do sinal
    sigemptyset(&sa.sa_mask);           // não bloqueia nenhum outro sinal
    sigaction(SIGALRM, &sa, NULL);      // sem SA_RESTART: write será interrompido
    if (pipe(pipe_fds) == -1)
        return 1;
    if (fork() == 0) {                  // o filho faz o papel do leitor lento
        close(pipe_fds[1]);             // ele só mantém a ponta de leitura
        sleep(2);                       // ele não lê nada durante 2 segundos
        while ((n = read(pipe_fds[0], recebido, sizeof recebido)) > 0)   // esvazia o pipe
            contagem += n;              // contando os bytes recebidos
        printf("o filho recebeu %ld bytes\n", contagem);
        exit(0);                        // exit esvazia os buffers do printf
    }
    close(pipe_fds[0]);                 // o pai só mantém a ponta de escrita
    memset(grande, 'x', sizeof grande); // preenche a área com 'x'
    alarm(1);                           // SIGALRM cairá enquanto o pipe estiver cheio
    if (escrever_tudo(pipe_fds[1], grande, sizeof grande) == -1)
        return 1;
    close(pipe_fds[1]);                 // o filho verá o fim dos dados
    wait(NULL);                         // espera o fim do filho
    return 0;
}
```

```text
o filho recebeu 200000 bytes
```

Os 200.000 bytes chegaram todos, apesar de uma escrita parcial de 65.536 bytes interrompida pelo alarme. Aqui o filho termina com `exit(0)` e não com `_exit(0)`: `exit` esvazia os buffers do `printf`, senão a frase nunca seria exibida quando a saída é um pipe.

## As armadilhas

| Armadilha | Por quê | Solução |
|---|---|---|
| Tratar qualquer `-1` como falha | `EINTR` não é uma falha | Testar `errno == EINTR` |
| Repetir em qualquer `-1` | Um erro real faria o laço girar sem fim | Repetir somente em `EINTR` |
| Achar que `fread` ou `fgets` repetem | Observado: elas param com `ferror` | `clearerr` e depois repetir, ou `SA_RESTART` |
| Esquecer `clearerr` antes de repetir | A flag de erro do fluxo continua levantada | Chamá-lo assim que se decidir repetir |
| Repetir um `read` parcial desde o início do buffer | Os bytes já recebidos são sobrescritos | Avançar `total` bytes |
| Repetir `close()` | Estado do descritor indeterminado, risco de fechar o descritor de outra thread | Nunca repetir |
| Contar com `SA_RESTART` para tudo | `nanosleep`, `poll`, `select` sempre falham | Manter o laço de nova tentativa |
| Repetir cegamente quando um sinal deve parar o programa | O programa fica impossível de parar corretamente | Testar o indicador de parada a cada `EINTR` |
| Usar `signal()` | Comportamento de repetição variável conforme o sistema | Usar `sigaction()` |
| Ler `errno` sem falha constatada | Uma chamada bem-sucedida não o zera | Lê-lo somente logo após uma falha |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Escrever uma vez `ler_tudo` e `escrever_tudo`, e usá-las em todo lugar | Um único laço para verificar, em vez de um por chamada |
| Instalar os handlers com `sigaction()` e uma flag escolhida | O comportamento é idêntico em todos os sistemas |
| Escolher: `SA_RESTART` para um sinal puramente informativo, nenhuma flag se o sinal deve acordar o programa | O programa mantém o controle sobre o que a interrupção provoca |
| Testar o indicador de parada (`volatile sig_atomic_t`) a cada `EINTR` | O programa continua podendo ser parado |
| Para `nanosleep`, repetir com o tempo restante | A duração total da espera é respeitada |
| Nunca repetir `close()` | Nenhuma garantia sobre o estado do descritor |
| Verificar o código de retorno de cada chamada de sistema e de cada função de `<stdio.h>` | Um erro silencioso se paga mais tarde |
| Testar o comportamento na própria máquina (alarme de 1 segundo, pipe lento) | A documentação diz "pode", a experiência diz "acontece" |

## O que reter

| | |
|---|---|
| **Para lembrar** | Uma chamada de sistema bloqueante interrompida por um sinal cujo handler está instalado volta com `-1` e `errno` igual a `EINTR`: nada falhou, basta repetir (`do { n = read(...); } while (n == -1 && errno == EINTR);`). `SA_RESTART` pede ao kernel que repita certas chamadas, mas não `nanosleep`, `poll` nem `select`. Uma leitura ou escrita já iniciada devolve o número de bytes transferidos, não `-1`. `close()` não se repete. `EINTR` só existe se um handler estiver instalado. Observado com glibc: `fread` e `fgets` não repetem, levantam `ferror` e deixam `errno` em `EINTR`; a norma C não diz nada disso e POSIX permite essa falha. |
| **Armadilhas a evitar** | Sair ao receber `EINTR`; repetir em qualquer `-1`; contar com `fread` para repetir; esquecer `clearerr`; repetir um `read` parcial desde o início do buffer; repetir `close()`; achar que `SA_RESTART` cobre tudo; tornar o programa impossível de parar repetindo cegamente. |
| **Boas práticas** | `sigaction()` com uma flag explícita; funções `ler_tudo` e `escrever_tudo` que repetem e avançam no buffer; `clearerr` e depois repetir para `<stdio.h>`; indicador de parada testado a cada `EINTR`; nunca repetir `close()`; documentação: [`read`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/read.html), [`close`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/close.html), [`sigaction`](https://pubs.opengroup.org/onlinepubs/9699919799/functions/sigaction.html), [`nanosleep`](https://man7.org/linux/man-pages/man2/nanosleep.2.html). |
