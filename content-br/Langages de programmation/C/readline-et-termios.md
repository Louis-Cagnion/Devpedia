---
order: 20
---

# `readline` e `termios`: controlar a linha de comando

Um programa que apenas lê a entrada padrão com `read()` recebe o texto tal como o terminal o transmite: nada antes que o usuário pressione Enter, nenhuma gestão das setas direcionais, nenhum histórico dos comandos anteriores. Esse comportamento padrão é chamado de **modo canônico** (*cooked mode*): é o próprio terminal que gerencia a edição da linha (backspace, deslocamento do cursor) antes de transmitir o texto final ao programa. Duas ferramentas permitem ir além desse modo padrão: a biblioteca `readline`, e a API `termios` para controlar o modo do terminal em si.

## `readline`: uma linha de entrada editável, com histórico

A biblioteca [`readline`](https://tiswww.case.edu/php/chet/readline/rltop.html) fornece uma linha de entrada completa: edição com as setas, navegação no histórico dos comandos anteriores (seta para cima/para baixo), sem que o programa precise reimplementar esse mecanismo ele mesmo:

```c
#include <readline/readline.h>
#include <readline/history.h>

int main(void)
{
    char *ligne;

    while ((ligne = readline("mon_shell$ ")) != NULL) {
        if (*ligne) {
            add_history(ligne);   // adiciona essa linha ao historico (seta para cima a recupera)
        }

        printf("Voce digitou : %s\n", ligne);
        free(ligne);   // readline() aloca a linha: deve ser liberada manualmente
    }

    return 0;
}
```

`readline()` exibe o prompt passado como argumento, gerencia a edição da linha enquanto o usuário digita, e retorna a linha final assim que Enter é pressionado (`NULL` se o usuário fecha a entrada com Ctrl-D). `add_history()` torna essa linha acessível via seta para cima nas próximas entradas.

> **Nota:** `readline()` aloca a string retornada com `malloc()`: cabe a quem chamou liberá-la com `free()`, exatamente como qualquer outro ponteiro alocado dinamicamente (veja [A gestão da memória](/?c=langages-de-programmation&s=c&p=memoire)).

## `termios`: mudar o modo do terminal em si

`readline` gerencia a edição de uma linha clássica, mas alguns programas precisam de **cada tecla pressionada imediatamente**, sem esperar Enter, e sem que o terminal exiba automaticamente o que foi digitado (um jogo em modo texto, uma entrada de senha). É o papel da API POSIX `termios`: ela controla diretamente o modo do terminal.

```c
#include <termios.h>
#include <unistd.h>

struct termios ancien, nouveau;

tcgetattr(STDIN_FILENO, &ancien);   // salva a configuracao atual do terminal
nouveau = ancien;
nouveau.c_lflag &= ~(ICANON | ECHO);   // desativa o modo canonico E a exibicao automatica
tcsetattr(STDIN_FILENO, TCSANOW, &nouveau);   // aplica o novo modo

// ... leitura tecla por tecla, sem esperar Enter, sem eco automatico ...

tcsetattr(STDIN_FILENO, TCSANOW, &ancien);   // restaura o modo original antes de sair
```

| Flag (`c_lflag`) | Papel | Desativado para... |
|---|---|---|
| `ICANON` | Modo canônico: o terminal só transmite uma linha depois de Enter | Receber cada tecla imediatamente (modo bruto, *raw mode*) |
| `ECHO` | O terminal exibe automaticamente o que foi digitado | Controlar sozinho o que é exibido (senha oculta, interface personalizada) |

> **Armadilha:** modificar o terminal com `tcsetattr()` sem nunca restaurar sua configuração original antes que o programa termine. O terminal do usuário permanece então em modo bruto após o fechamento do programa: sem eco das teclas digitadas, sem edição de linha normal no shell que retomou o controle, um terminal que parece "quebrado" até que o usuário o reinicie manualmente (`reset` ou `stty sane`).
>
> **Boa prática:** sempre salvar a configuração original (`tcgetattr()`) antes de modificá-la, e restaurá-la explicitamente (`tcsetattr()`) em toda saída possível do programa, incluindo em um sinal de interrupção (veja [Os sinais UNIX](/?c=langages-de-programmation&s=c&p=signaux-unix)) ou um erro, não apenas no caminho de saída normal.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O modo canônico (padrão) deixa o terminal gerenciar a edição de linha; `readline` fornece uma linha de entrada editável com histórico sem reimplementar esse mecanismo; `termios` permite desativar esse modo para receber cada tecla imediatamente (modo bruto). |
| **Ferramentas utilizáveis** | `readline()`/`add_history()` para uma linha de entrada com histórico. `tcgetattr()`/`tcsetattr()` e os flags `ICANON`/`ECHO` para controlar o modo do terminal. |
| **Armadilhas a evitar** | Modificar o terminal com `tcsetattr()` sem nunca restaurar sua configuração original, deixando o terminal do usuário em modo bruto após o fechamento do programa. |
| **Boas práticas** | Salvar a configuração original antes da modificação, e restaurá-la em toda saída possível do programa (normal, erro, sinal). |
