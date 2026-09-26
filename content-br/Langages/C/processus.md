---
order: 18
---

# O gerenciamento de processos

Um **processo** é uma instância de um programa em execução, com seu próprio espaço de memória, isolado do de outros processos. Em C, a biblioteca padrão POSIX (`unistd.h`, `sys/wait.h`) permite criar novos processos, lançar outros programas, e esperar seu término. O padrão **POSIX** é apresentado no capítulo [Escrever um script](/?c=shells&s=bash&p=scripts-et-shebang) de [Bash](/?c=shells&s=bash&p=bash).

> **Nota:** `fork()`, `execve()` (usado por `execlp()` e as outras funções da família `exec`) e `wait()`/`waitpid()` são **chamadas de sistema**: veja o capítulo dedicado às chamadas de sistema e aos descritores de arquivo para o que isso implica concretamente (passagem para o espaço do kernel, tratamento de erros via `errno`).

## `fork()`: duplicar o processo atual

`fork()` cria uma cópia quase idêntica do processo chamador. Após a chamada, **dois** processos existem e ambos continuam a execução logo após o `fork()`: a única diferença é o valor retornado:

```c
#include <unistd.h>
#include <stdio.h>

int main(void)
{
    pid_t pid = fork();

    if (pid < 0) {
        printf("Erro: fork falhou\n");
    } else if (pid == 0) {
        printf("Eu sou o filho, meu PID e %d\n", getpid());
    } else {
        printf("Eu sou o pai, o PID do meu filho e %d\n", pid);
    }

    return 0;
}
```

| Valor de retorno | Em qual processo? | Significado |
|---|---|---|
| `< 0` | Apenas o pai | O `fork()` falhou, nenhum filho criado |
| `0` | O filho | Sempre recebe `0` |
| `> 0` | O pai | Recebe o PID (*process ID*) do processo filho recém-criado |

> **Nota:** `pid_t` é o tipo dedicado aos identificadores de processo. `getpid()` retorna o PID do processo atual, `getppid()` o de seu pai.

## Substituir o programa em execução: a família `exec`

`fork()` duplica o processo atual, mas não muda o programa executado. Para lançar **outro** programa no processo filho, usa-se uma função da família `exec` (ex.: `execve`, `execlp`): ela substitui inteiramente o código do processo atual pelo de um novo programa:

```c
#include <unistd.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        execlp("ls", "ls", "-l", NULL); // substitui o processo filho pelo programa "ls"
        printf("Esta linha nunca executa se execlp tiver sucesso\n");
    }

    return 0;
}
```

> **Nota:** se `execlp()` tiver sucesso, ele nunca "retorna": o código do processo filho é integralmente substituído, a linha seguinte só é alcançada em caso de falha do próprio `execlp()`.

## Esperar o término de um filho: `wait()` / `waitpid()`

Sem sincronização, o pai continua sua execução independentemente do filho. `wait()` bloqueia o pai até que **um** de seus filhos termine:

```c
#include <sys/wait.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        printf("Filho: estou trabalhando...\n");
        return 42; // código de saída do filho
    } else {
        int status;
        wait(&status); // o pai espera aqui até que o filho termine

        if (WIFEXITED(status)) {
            printf("O filho terminou com o código %d\n", WEXITSTATUS(status));
        }
    }
}
```

- `wait(&status)` preenche `status` com informações sobre como o filho terminou.
- `WIFEXITED(status)` verifica se o filho terminou normalmente (via `return`/`exit()`, não por um sinal).
- `WEXITSTATUS(status)` extrai o código de saída real do filho.

`waitpid(pid, &status, 0)` faz a mesma coisa que `wait()`, mas permite esperar um filho **específico** (útil quando um processo tem vários filhos).

> **Nota:** um processo filho terminado mas nunca "recolhido" por um `wait()` do pai permanece um **processo zumbi** na tabela de processos do sistema, até que seu pai chame `wait()` (ou termine ele mesmo).

Veja também [As threads](/?c=langages-de-programmation&s=c&p=threads), uma alternativa mais leve ao `fork()` quando as tarefas precisam compartilhar a mesma memória.

## Quando o pai morre antes dos filhos: os processos órfãos

Um **processo órfão** é um filho cujo pai terminou antes dele. Ao contrário de um zumbi, ele **continua rodando**: o sistema lhe dá um novo pai (o primeiro processo do sistema, `init`, ou um processo de serviço designado para isso, como o `systemd`), que o recolherá quando ele terminar. Matar um programa, portanto, **não** mata os filhos que ele criou com `fork()`.

Caso real: um script de medição parava, depois de 90 s, um programa que calculava com 4 filhos; os 4 filhos ainda rodavam 30 minutos depois, ocupavam o processador e falseavam todas as medições seguintes.

| Lado | Meio | Efeito |
|---|---|---|
| Filho | [`prctl(PR_SET_PDEATHSIG, SIGKILL)`](https://man7.org/linux/man-pages/man2/prctl.2.html), só no Linux | O kernel envia o [sinal](/?c=langages&s=c&p=signaux-unix) `SIGKILL` ao filho assim que o pai morre |
| Lançador | Iniciar o programa no seu próprio **grupo de processos** (`setsid()`, veja [o controle de tarefas de um shell](/?c=langages&s=bash&p=architecture-dun-shell#o-controle-de-tarefas-jobs-ctrl-z-fg-bg)) e depois matar o grupo inteiro: `kill(-grupo, SIGKILL)` | O programa e todos os seus descendentes recebem o sinal; em Python, veja [o orçamento de tempo do `subprocess`](/?c=langages&s=python&p=sous-processus-et-flux-standard#executar-varios-programas-em-paralelo-com-orcamento-de-tempo) |

Dois filhos, um protegido por `PR_SET_PDEATHSIG` e o outro não; o pai termina depois de um segundo sem esperá-los. Saída de `./orfaos; sleep 3` (o `sleep` dá aos filhos tempo para escrever):

```c
#include <signal.h>
#include <stdio.h>
#include <sys/prctl.h>
#include <unistd.h>

static void filho(int protegido, pid_t pai)
{
    if (protegido) {
        prctl(PR_SET_PDEATHSIG, SIGKILL);            /* morto quando o pai morrer */
        if (getppid() != pai)                        /* pai morto antes da chamada? */
            _exit(0);
    }
    sleep(2);                                        /* o pai morre enquanto isso */
    printf("filho %s: ainda vivo, pai %s\n",
           protegido ? "protegido" : "não protegido",
           getppid() == pai ? "inalterado" : "substituído");
    fflush(stdout);                                  /* _exit não esvazia os buffers */
    _exit(0);
}

int main(void)
{
    pid_t pai = getpid();

    for (int protegido = 0; protegido <= 1; protegido++)
        if (fork() == 0)
            filho(protegido, pai);                   /* o filho nunca volta aqui */
    sleep(1);
    printf("pai: termino sem esperar meus filhos\n");
    return 0;
}
```

```
pai: termino sem esperar meus filhos
filho não protegido: ainda vivo, pai substituído
```

O filho protegido foi morto quando o pai morreu e não escreve nada; o outro continua rodando, ligado a um novo pai. O teste `getppid() != pai` cobre o caso em que o pai morre entre `fork()` e `prctl()`: sem ele, o filho nunca seria avisado.

> **Armadilha:** um programa que se relança com `execv("/proc/self/exe", ...)` (o caminho especial do seu próprio executável, veja [a família `exec`](/?c=langages&s=c&p=processus#substituir-o-programa-em-execucao-a-familia-exec)) aparece depois com o nome `exe` no `ps` ou no `pgrep`. Caso real: um órfão renomeado assim foi primeiro confundido com um aplicativo do usuário. Relance pelo caminho real, obtido com `readlink("/proc/self/exe", ...)`.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `fork()` duplica o processo atual (dois processos continuam após a chamada); `exec*()` substitui o programa do processo atual; `wait()`/`waitpid()` esperam que um filho termine. Um filho cujo pai morre se torna órfão e continua rodando. |
| **Ferramentas utilizáveis** | `fork()`, `execlp()`/`execve()`, `wait()`/`waitpid()`, `WIFEXITED`/`WEXITSTATUS`; `prctl(PR_SET_PDEATHSIG, SIGKILL)`, `setsid()` e `kill(-grupo, SIGKILL)` contra os órfãos. |
| **Armadilhas a evitar** | Nunca deixar de chamar `wait()` em um filho terminado: ele permanece "zumbi" na tabela de processos até que o pai o recolha ou termine ele mesmo; achar que matar um programa também mata os filhos dele. |
| **Boas práticas** | Sempre verificar o valor de retorno de `fork()` (`< 0` = falha) antes de ramificar entre o caso pai/filho. |
