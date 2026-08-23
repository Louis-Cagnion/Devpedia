---
order: 15
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
        return 42; // codigo de saida do filho
    } else {
        int status;
        wait(&status); // o pai espera aqui ate que o filho termine

        if (WIFEXITED(status)) {
            printf("O filho terminou com o codigo %d\n", WEXITSTATUS(status));
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

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `fork()` duplica o processo atual (dois processos continuam após a chamada); `exec*()` substitui o programa do processo atual; `wait()`/`waitpid()` esperam que um filho termine. |
| **Ferramentas utilizáveis** | `fork()`, `execlp()`/`execve()`, `wait()`/`waitpid()`, `WIFEXITED`/`WEXITSTATUS`. |
| **Armadilhas a evitar** | Nunca deixar de chamar `wait()` em um filho terminado: ele permanece "zumbi" na tabela de processos até que o pai o recolha ou termine ele mesmo. |
| **Boas práticas** | Sempre verificar o valor de retorno de `fork()` (`< 0` = falha) antes de ramificar entre o caso pai/filho. |
