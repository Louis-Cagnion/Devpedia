---
order: 14
---

# Gestão de processos

Um **processo** é uma instância de um programa em execução, com o seu próprio espaço de memória, isolado do dos outros processos. Em C, a biblioteca padrão POSIX (`unistd.h`, `sys/wait.h`) permite criar novos processos, iniciar outros programas e aguardar a sua conclusão.

> **Nota:** `fork()`, `execve()` (utilizado por `execlp()` e pelas outras funções da família `exec`) e `wait()` / `waitpid()` são **chamadas de sistema**; consulte o capítulo dedicado às chamadas de sistema e aos descritores de arquivos para saber o que isso implica na prática (passagem para o espaço do kernel, gestão de erros através de `errno`).

## `fork()` : duplicar o processo atual

`fork()` cria uma cópia praticamente idêntica do processo chamador. Após a chamada, existem **dois** processos e ambos continuam a execução imediatamente após o `fork()`: a única diferença é o valor devolvido:

```c
#include <unistd.h>
#include <stdio.h>

int main(void)
{
    pid_t pid = fork();

    if (pid < 0) {
        printf("Erreur : fork a échoué\n");
    } else if (pid == 0) {
        printf("Je suis l'enfant, mon PID est %d\n", getpid());
    } else {
        printf("Je suis le parent, le PID de mon enfant est %d\n", pid);
    }

    return 0;
}
```

| Valor de retorno | Em que processo? | Significado |
|---|---|---|
| `< 0` | Apenas o pai | A chamada «`fork()`» falhou, não foi criado nenhum filho |
| `0` | A criança | Recebe sempre `0` |
| `> 0` | O processo pai | Recebe o PID (*identificador do processo*) do processo filho recém-criado |

> **Nota:** `pid_t` é o tipo dedicado aos identificadores de processo. `getpid()` devolve o PID do processo atual, enquanto `getppid()` devolve o PID do seu processo pai.

## Substituir o programa em execução: a família «`exec`»

`fork()` duplica o processo atual, mas não altera o programa em execução. Para iniciar **outro** programa no processo filho, utiliza-se uma função da família «`exec`» (por exemplo, `execve`, `execlp`): esta substitui na totalidade o código do processo atual pelo de um novo programa:

```c
#include <unistd.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        execlp("ls", "ls", "-l", NULL); // remplace le processus enfant par le programme "ls"
        printf("Cette ligne ne s'exécute jamais si execlp réussit\n");
    }

    return 0;
}
```

> **Nota:** se `execlp()` for bem-sucedido, nunca «regressa»: o código do processo filho é substituído na íntegra, pelo que a linha seguinte só é executada em caso de falha do próprio `execlp()`.

## À espera do nascimento de um filho: `wait()` / `waitpid()`

Sem sincronização, o processo pai continua a sua execução independentemente do processo filho. `wait()` bloqueia o processo pai até que um dos seus processos filhos termine:

```c
#include <sys/wait.h>

int main(void)
{
    pid_t pid = fork();

    if (pid == 0) {
        printf("Enfant : je travaille...\n");
        return 42; // code de sortie de l'enfant
    } else {
        int statut;
        wait(&statut); // le parent attend ici que l'enfant se termine

        if (WIFEXITED(statut)) {
            printf("L'enfant s'est terminé avec le code %d\n", WEXITSTATUS(statut));
        }
    }
}
```

- `wait(&statut)` preenche `statut` com informações sobre como a criança faleceu.
- `WIFEXITED(statut)` verifica se o processo terminou normalmente (através de `return` / `exit()`, e não por meio de um sinal).
- `WEXITSTATUS(statut)` extraia o código de saída real do filho.

`waitpid(pid, &statut, 0)` faz o mesmo que `wait()`, mas permite aguardar um filho **específico** (útil quando um processo tem vários filhos).

> **Nota:** um processo filho que tenha terminado, mas que nunca tenha sido «recuperado» por um `wait()` do processo pai, permanece como um **processo «zombie»** na tabela de processos do sistema, até que o seu pai chame `wait()` (ou termine por si próprio).

Ver também o capítulo sobre threads, uma alternativa mais leve a`fork()`, quando as tarefas têm de partilhar a mesma memória.
