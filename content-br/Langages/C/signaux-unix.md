---
order: 18
---

# Os sinais UNIX

Um **sinal** é uma notificação assíncrona enviada a um processo: diferente de uma chamada de função clássica, ele pode chegar a **qualquer momento** da execução, interrompendo o código em andamento para executar um tratamento dedicado antes de retomar de onde o processo estava. O sistema operacional usa esse mecanismo para avisar um processo sobre um evento (Ctrl-C pressionado no teclado, um [processo](/?c=langages-de-programmation&s=c&p=processus) filho terminado), ou para permitir que um processo avise outro.

## Os sinais comuns

| Sinal | Gatilho habitual | Comportamento padrão |
|---|---|---|
| `SIGINT` | Ctrl-C no teclado | Termina o processo |
| `SIGTERM` | Pedido de parada limpa (`kill <pid>`) | Termina o processo |
| `SIGKILL` | `kill -9 <pid>` | Termina o processo, **não pode ser interceptado** |
| `SIGCHLD` | Um processo filho termina | Ignorado por padrão |
| `SIGUSR1` / `SIGUSR2` | Enviado manualmente por outro processo (`kill -SIGUSR1 <pid>`) | Termina o processo (mas previsto para ser redefinido) |

> **Nota:** `SIGKILL` (e `SIGSTOP`) são os dois únicos sinais que um processo nunca pode interceptar nem ignorar: eles garantem que um processo permaneça sempre interrompível de fora, mesmo que ele tente bloquear todos os outros sinais.

## Interceptar um sinal com `signal()`

`signal()` substitui o comportamento padrão de um sinal por uma função (um **handler**), chamada automaticamente assim que o sinal chega:

```c
#include <signal.h>
#include <stdio.h>
#include <unistd.h>

volatile sig_atomic_t recu = 0;

void handler(int sig)
{
    recu = 1;   // o handler quase nao faz nada: veja "handler minimo" mais abaixo
}

int main(void)
{
    signal(SIGINT, handler);   // Ctrl-C nao interrompe mais o programa, chama handler() no lugar

    while (!recu) {
        pause();   // espera um sinal sem consumir CPU
    }

    printf("Sinal recebido, parada limpa.\n");
    return 0;
}
```

Sem `signal(SIGINT, handler)`, um Ctrl-C teria terminado o programa imediatamente (comportamento padrão de `SIGINT`); com ele, o programa intercepta o sinal e decide sozinho o que fazer.

## Comunicar entre processos por sinal (IPC)

`SIGUSR1`/`SIGUSR2` não têm nenhum sentido padrão: um programa pode usá-los como mecanismo de comunicação entre processos (*IPC*, *Inter-Process Communication*), estabelecendo sua própria convenção. Exemplo: transmitir um bit de cada vez, `SIGUSR1` para `0`, `SIGUSR2` para `1`:

```c
// Lado emissor (conhece o PID do receptor)
kill(pid_recepteur, bit ? SIGUSR2 : SIGUSR1);

// Lado receptor: um handler por bit possivel
void handler(int sig)
{
    bit_recu = (sig == SIGUSR2) ? 1 : 0;
    // acumular esse bit em um byte em construcao...
}
```

Cada caractere transmitido exige então 8 sinais (um por bit), o receptor reconstruindo o byte aos poucos. É mais lento que um [descritor de arquivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) clássico, mas funciona sem nenhum canal de comunicação prévio, apenas o PID do destinatário é necessário.

## Escrever um handler seguro

Um handler é executado interrompendo o código normal do programa, potencialmente **bem no meio** de outra função (inclusive uma função da biblioteca padrão): ele não pode, portanto, se comportar como uma função comum.

> **Armadilha:** chamar uma função não **async-signal-safe** dentro de um handler, como `printf()`. Se o sinal chegar enquanto o programa já está no meio de uma chamada a `printf()` (buffer interno em processo de modificação), uma segunda chamada a `printf()` a partir do handler corrompe esse estado interno compartilhado, um bug que aparece raramente e de forma não reproduzível.
>
> **Boa prática:** um handler deve permanecer mínimo: modificar uma variável do tipo `sig_atomic_t` (o único tipo cuja leitura/escrita é garantida atômica diante de uma interrupção) e nada mais. O programa lê essa variável **fora** do handler, em seu loop principal, para reagir ao sinal de forma segura.

`volatile sig_atomic_t` combina duas garantias necessárias aqui: `sig_atomic_t` assegura que a variável é lida e escrita em uma única operação indivisível (nunca meio modificada); `volatile` impede que o compilador otimize sua leitura supondo, erroneamente, que ela só pode mudar dentro do fluxo normal do programa.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um sinal interrompe um processo a qualquer momento para executar um handler, diferente de uma chamada de função clássica. `SIGUSR1`/`SIGUSR2` não têm sentido padrão e podem servir de canal de comunicação entre processos. |
| **Ferramentas utilizáveis** | `signal()` para interceptar um sinal, `kill()` para enviar um, `volatile sig_atomic_t` para comunicar entre um handler e o resto do programa. |
| **Armadilhas a evitar** | Chamar uma função não async-signal-safe (como `printf()`) dentro de um handler. |
| **Boas práticas** | Manter um handler mínimo (modificar uma única variável `sig_atomic_t`) e tratar o sinal no loop principal do programa, nunca dentro do handler. |
