---
order: 17
---

# As chamadas de sistema e os descritores de arquivo

Um programa não pode ler um arquivo, criar um processo ou enviar dados pela rede manipulando diretamente o hardware: isso poderia ser catastrófico para a estabilidade e a segurança do sistema se qualquer programa tivesse acesso livre a ele. Em vez disso, ele precisa passar por uma porta estreita e controlada: a **chamada de sistema** (*syscall*). Este capítulo explica esse mecanismo e o **descritor de arquivo**, a "alça" que o kernel entrega em troca, ambos usados constantemente ao lidar com arquivos, processos ou pipes (veja [O gerenciamento de processos](/?c=langages-de-programmation&s=c&p=processus), [As threads](/?c=langages-de-programmation&s=c&p=threads), e [Como funciona um shell](/?c=shells&s=bash&p=architecture-dun-shell)).

## Espaço de usuário vs espaço de kernel

```text
Programa (espaco de usuario)
      |
      | chamada de sistema: open(), read(), write(), fork(), pipe()...
      v
Kernel do sistema operacional (espaco de kernel)
      |
      v
Hardware (disco, rede, memoria fisica...)
```

Uma chamada de função C clássica (`adicao(2, 3)`) executa inteiramente no **espaço de usuário**, sem nunca sair do programa. Uma chamada de sistema é diferente: ela pede explicitamente ao **kernel** para agir no lugar do programa, para uma operação que este não tem permissão de fazer sozinho. Esse pedido implica uma mudança controlada de modo de execução (*user mode* → *kernel mode*), verificada pelo processador: é esse controle que impede um programa malicioso ou com bugs de acessar diretamente a memória ou o disco de outro programa.

> **Nota:** uma função como `printf()` **não é** ela mesma uma chamada de sistema: é uma função de biblioteca, que formata a string em espaço de usuário, e depois chama internamente a verdadeira chamada de sistema (`write()`) para enviá-la de fato à saída padrão.

## Algumas chamadas de sistema comuns

| Chamada de sistema | Função |
|---|---|
| `open()` / `close()` | Abrir / fechar um arquivo |
| `read()` / `write()` | Ler / escrever bytes em um descritor |
| `fork()` / `execve()` / `wait()` | Criar um processo / substituir seu programa / esperar seu término (veja [O gerenciamento de processos](/?c=langages-de-programmation&s=c&p=processus)) |
| `pipe()` | Criar um cano de comunicação entre dois processos (veja [Como funciona um shell](/?c=shells&s=bash&p=architecture-dun-shell)) |
| `dup2()` | Fazer um descritor apontar para outro recurso já aberto |
| `mmap()` / `brk()` | Pedir memória ao sistema (usados internamente por `malloc()`, veja [O gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire)) |

## Sinalizar um erro: `errno`

A maioria das chamadas de sistema sinaliza uma falha retornando `-1` (ou `NULL` para as que retornam um ponteiro), e definindo a variável global `errno` com um código descrevendo a causa precisa: o mesmo princípio das funções C históricas mencionadas no capítulo sobre funções (`@` em PHP enfrenta o mesmo tipo de convenção de erro "à moda C"):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("arquivo_inexistente.txt", O_RDONLY);

if (fd == -1) {
    printf("Erro: %s\n", strerror(errno)); // traduz o codigo errno em uma mensagem legivel
}
```

## O descritor de arquivo: uma simples entrada em uma tabela

Um **descritor de arquivo** (*file descriptor*) não é nem um ponteiro, nem um caminho: é um simples inteiro, o índice de uma tabela mantida pelo kernel **para cada processo**, associando esse inteiro a um recurso realmente aberto (arquivo, pipe, conexão de rede, terminal...).

Cada processo inicia com três descritores já abertos:

| Descritor | Constante C | Função habitual |
|---|---|---|
| `0` | `STDIN_FILENO` | Entrada padrão |
| `1` | `STDOUT_FILENO` | Saída padrão |
| `2` | `STDERR_FILENO` | Saída de erro |

```c
int fd = open("arquivo.txt", O_RDONLY); // retorna, por exemplo, 3: o proximo espaco livre DESSE processo
read(fd, buffer, tamanho);
close(fd);
```

> **Nota:** esses três números (`0`/`1`/`2`) são exatamente os "fluxos" (*stdin*/*stdout*/*stderr*) mencionados no capítulo sobre redirecionamentos do Bash: um redirecionamento como `2>` não faz nada além de manipular, por baixo dos panos, esse descritor número `2` do processo em questão.

## `dup2()`: fazer um descritor apontar para outro recurso

`dup2(origem, destino)` faz o descritor número `destino` apontar para o mesmo recurso aberto que `origem`, fechando de passagem o que `destino` apontava anteriormente:

```c
int fd = open("saida.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO);  // dai em diante, escrever em "stdout" (1) escreve na verdade em "saida.txt"
close(fd);                // o original pode ser fechado: o destino (1) continua valido, apontando para o mesmo recurso
```

É exatamente esse mecanismo que o capítulo sobre a arquitetura de um shell usa para implementar tanto os redirecionamentos (`>`, `<`) quanto os pipes (`|`): em ambos os casos, faz-se um descritor padrão (`0`, `1`, `2`) apontar para um recurso diferente logo antes de executar o programa alvo.

## Por que `fork()` também duplica a tabela de descritores

Quando [`fork()`](/?c=langages-de-programmation&s=c&p=processus) cria um processo filho, este recebe uma **cópia** da tabela de descritores de seu pai: os mesmos números, apontando para os mesmos recursos abertos. É precisamente isso que permite a um shell fazer um `dup2()` em um descritor de pipe **no filho**, logo antes da chamada a `execve()`: o novo programa herda esse descritor já reapontado, sem saber nada do mecanismo que o configurou.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma chamada de sistema pede ao kernel para agir no lugar do programa (arquivos, processos, rede): uma mudança controlada do espaço de usuário para o espaço de kernel. Um descritor de arquivo é um simples inteiro, índice de uma tabela por processo. |
| **Ferramentas utilizáveis** | `open`/`close`/`read`/`write`, `dup2`, `errno`/`strerror` para diagnosticar uma falha. |
| **Armadilhas a evitar** | Confundir uma função de biblioteca (`printf`) com uma chamada de sistema real (`write`): a primeira encapsula a segunda. |
| **Boas práticas** | Sempre verificar o valor de retorno de uma chamada de sistema (`-1` ou `NULL`) e consultar `errno`/`strerror()` para diagnosticar uma falha. |
