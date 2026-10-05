---
order: 20
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

A maioria das chamadas de sistema sinaliza uma falha retornando `-1` (ou `NULL` para as que retornam um ponteiro), e definindo a variável global `errno` com um código descrevendo a causa precisa: o mesmo princípio das funções C históricas mencionadas no capítulo sobre funções (`@` em [PHP](/?c=langages-de-programmation&s=php&p=php) enfrenta o mesmo tipo de convenção de erro "à moda C"):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("arquivo_inexistente.txt", O_RDONLY);

if (fd == -1) {
    printf("Erro: %s\n", strerror(errno)); // traduz o código errno em uma mensagem legível
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
// retorna, por exemplo, 3: o próximo espaço livre DESSE processo
int fd = open("arquivo.txt", O_RDONLY);
read(fd, buffer, tamanho);
close(fd);
```

> **Nota:** esses três números (`0`/`1`/`2`) são exatamente os "fluxos" (*stdin*/*stdout*/*stderr*) mencionados no capítulo sobre redirecionamentos do [Bash](/?c=shells&s=bash&p=bash): um redirecionamento como `2>` não faz nada além de manipular, por baixo dos panos, esse descritor número `2` do processo em questão.

## As flags de abertura do `open()`

```c
open(caminho, O_RDONLY);                            // somente leitura
open(caminho, O_WRONLY);                            // somente escrita
open(caminho, O_RDWR);                              // leitura E escrita

open(caminho, O_WRONLY | O_CREAT, 0644);            // cria o arquivo se ainda não existir
open(caminho, O_WRONLY | O_CREAT | O_TRUNC, 0644);  // + esvazia o arquivo se já existisse
// + sempre escreve no FIM, sem sobrescrever
open(caminho, O_WRONLY | O_CREAT | O_APPEND, 0644);
```

| Flag | Efeito |
|---|---|
| `O_RDONLY`/`O_WRONLY`/`O_RDWR` | Modo de acesso (apenas um dos três, mutuamente exclusivos) |
| `O_CREAT` | Cria o arquivo se ainda não existir (senão `open()` falha sobre um arquivo ausente) |
| `O_TRUNC` | Esvazia o arquivo existente antes de escrever (senão o conteúdo antigo permaneceria após a posição de escrita) |
| `O_APPEND` | Sempre posiciona a escrita no fim do arquivo, nunca no ponto alcançado por um `write()` anterior |

Essas flags se combinam com `|` (OR bit a bit, veja [Os operadores bit a bit](/?c=langages-de-programmation&s=c&p=operateurs-binaires)): cada uma ocupa um bit distinto do mesmo inteiro, então `O_CREAT` e `O_TRUNC` podem ser pedidas juntas sem se excluírem.

> **Nota:** o último argumento (`0644` acima) define as **permissões** do arquivo, mas somente se `O_CREAT` o criar de fato (um arquivo já existente mantém suas permissões atuais, esse argumento é então ignorado): veja [Permissões e arquivos](/?c=shells&s=bash&p=permissions-et-fichiers) para o significado desse modo octal.

## `dup2()`: fazer um descritor apontar para outro recurso

`dup2(origem, destino)` faz o descritor número `destino` apontar para o mesmo recurso aberto que `origem`, fechando de passagem o que `destino` apontava anteriormente:

```c
int fd = open("saida.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
// daí em diante, escrever em "stdout" (1) escreve na verdade em "saída.txt"
dup2(fd, STDOUT_FILENO);
// o original pode ser fechado: o destino (1) continua válido, apontando para o mesmo recurso
close(fd);
```

É exatamente esse mecanismo que o capítulo sobre a arquitetura de um shell usa para implementar tanto os redirecionamentos (`>`, `<`) quanto os pipes (`|`): em ambos os casos, faz-se um descritor padrão (`0`, `1`, `2`) apontar para um recurso diferente logo antes de executar o programa alvo.

## Por que `fork()` também duplica a tabela de descritores

Quando [`fork()`](/?c=langages-de-programmation&s=c&p=processus) cria um processo filho, este recebe uma **cópia** da tabela de descritores de seu pai: os mesmos números, apontando para os mesmos recursos abertos. É precisamente isso que permite a um shell fazer um `dup2()` em um descritor de pipe **no filho**, logo antes da chamada a `execve()`: o novo programa herda esse descritor já reapontado, sem saber nada do mecanismo que o configurou.

## Arquivos especiais: quando `open()` não encontra um arquivo comum

No Unix (Linux, macOS), `open()` aceita tudo o que tem um caminho, não só os arquivos de dados guardados no disco (os arquivos **comuns**). O tipo do que foi realmente aberto se lê com `fstat()`, que preenche uma estrutura `struct stat` descrevendo o descritor (tipo, tamanho, permissões):

| Tipo | Teste sobre `info.st_mode` | Exemplo | Comportamento de `read()` |
|---|---|---|---|
| Arquivo comum | `S_ISREG` | `notes.txt` | Lê o conteúdo e depois `0` no fim |
| Diretório | `S_ISDIR` | `/tmp` | Falha (`EISDIR`) |
| Dispositivo de «caracteres» | `S_ISCHR` | `/dev/zero`: fornece bytes nulos **sem fim** | Nunca devolve `0`: a leitura não termina |
| Pipe nomeado (FIFO) | `S_ISFIFO` | `canal` criado por `mkfifo` | Espera outro processo escrever |

### O pipe nomeado (FIFO)

Um [pipe](/?c=shells&s=bash&p=architecture-dun-shell) anônimo (o `|` do shell, ou `pipe()` acima) não tem nome: só existe para os processos que o herdaram por `fork()`. Um **pipe nomeado** (*named pipe*, ou **FIFO**, de *First In, First Out*, «primeiro a entrar, primeiro a sair»: a ordem de uma [fila](/?c=fondamentaux&s=algorithmes&p=pile-et-file)) é o mesmo mecanismo com um nome na árvore de arquivos, então dois programas sem parentesco podem usá-lo. Os bytes escritos de um lado saem na mesma ordem do outro, sem nunca serem guardados no disco.

```bash
mkfifo canal              # cria o pipe nomeado "canal" (a função C de mesmo nome faz o mesmo)
ls -l canal               # o primeiro caractere é "p" (pipe): prw-r--r-- ...
echo "bonjour" > canal &  # escritor lançado em segundo plano (&): espera um leitor chegar
cat canal                 # leitor: mostra "bonjour"; os dois lados se desbloqueiam
```

> **Nota:** um FIFO não pode ser criado em qualquer disco. No WSL (Linux dentro do Windows), a pasta `/mnt/c` falha; use uma pasta do sistema Linux, como `/tmp`.

### A armadilha: a abertura bloqueia

Por padrão, `open()` sobre um FIFO é **bloqueante**: o kernel pausa o programa até que um evento aconteça (veja [o bloqueio e a E/S não bloqueante](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante)). Abrir para leitura espera que um escritor abra a outra ponta, e vice-versa. Um programa que acredita receber um arquivo comum fica, portanto, congelado sem nenhuma mensagem se receber um FIFO. Mesmo efeito com `/dev/zero`: uma leitura «até o fim do arquivo» nunca para e enche a memória.

| O que se passa ao programa | `open()` simples | Resultado |
|---|---|---|
| `notes.txt` | Devolve o controle na hora | Leitura normal |
| `canal` (FIFO sem escritor) | **Bloqueia para sempre** | Programa congelado |
| `/dev/zero` | Devolve o controle | A leitura não termina, memória saturada |
| `/tmp` (diretório) | Devolve o controle | `read()` falha mais tarde, longe da causa real |

### O remédio: abrir sem bloquear, verificar o tipo e passar para `FILE *`

A opção `O_NONBLOCK` pede a `open()` que devolva o controle na hora em vez de esperar. Depois se verifica o tipo com `fstat()`, e `fdopen()` converte o descritor validado em um `FILE *`, o objeto das funções de [leitura de arquivos](/?c=langages-de-programmation&s=c&p=lecture-de-fichiers) (`fgets`, `fread`...):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>
#include <sys/stat.h>
#include <unistd.h>

FILE *open_regular_file(const char *path)
{
    struct stat info;                                  // recebe tipo, tamanho, permissões
    int         fd;
    FILE       *file;

    fd = open(path, O_RDONLY | O_NONBLOCK);            // nunca bloqueia, nem em um FIFO
    if (fd == -1) {
        fprintf(stderr, "%s : %s\n", path, strerror(errno));   // a causa real
        return (NULL);
    }
    if (fstat(fd, &info) == -1) {                      // consulta o descritor já aberto
        fprintf(stderr, "%s : %s\n", path, strerror(errno));
        close(fd);
        return (NULL);
    }
    if (!S_ISREG(info.st_mode)) {                      // FIFO, /dev/zero, diretório: recusado
        fprintf(stderr, "%s : não é um arquivo comum\n", path);
        close(fd);                                     // liberar o descritor em cada falha
        return (NULL);
    }
    file = fdopen(fd, "r");                            // o FILE * passa a ser dono de fd
    if (file == NULL) {
        fprintf(stderr, "%s : %s\n", path, strerror(errno));
        close(fd);
    }
    return (file);                                     // fechar com fclose(), não com close()
}
```

Resultado verificado com um pequeno `main` que chama esta função com cada argumento da linha de comando (um arquivo comum, um FIFO, `/dev/zero`, um diretório e um caminho inexistente):

```text
reg.txt : aberto
canal : não é um arquivo comum
/dev/zero : não é um arquivo comum
. : não é um arquivo comum
absent : No such file or directory
```

Dois detalhes importam. Primeiro, chama-se `fstat()` sobre o **descritor** e não `stat()` sobre o caminho: entre as duas chamadas, alguém poderia trocar o arquivo por um FIFO, enquanto o descritor continua designando o que foi realmente aberto. Segundo, cada causa de falha tem a sua própria mensagem (arquivo inexistente, tipo errado, falha de `fdopen()`), para que o usuário saiba o que corrigir.

## Encontrar a localização do próprio executável

Um programa entregue com arquivos próprios (por exemplo os [shaders](/?c=fondamentaux&s=graphisme&p=tampons-textures-et-shaders-opengl), os pequenos programas de uma aplicação gráfica, guardados em uma pasta `shaders/` ao lado do executável) deve encontrá-los de onde quer que seja lançado. Escrever `fopen("shaders/basic.vert", "r")` só funciona se o programa for lançado **a partir da sua própria pasta**, porque um caminho sem `/` inicial é relativo ao **diretório atual** (a pasta em que o terminal está no momento do lançamento, veja [`cd` na arquitetura de um shell](/?c=shells&s=bash&p=architecture-dun-shell)) e não ao executável.

```text
~/projeto/
├── scop              <- o executável
└── shaders/basic.vert

cd ~/projeto && ./scop     ->  "shaders/basic.vert" encontrado
cd ~ && projeto/scop       ->  "shaders/basic.vert" procurado em ~/shaders: não encontrado
```

### Por que `argv[0]` não basta

[`argv[0]`](/?c=langages-de-programmation&s=c&p=argc-et-argv) contém o nome **como o usuário o digitou**, não um caminho verificado:

| Lançamento | `argv[0]` | Problema |
|---|---|---|
| `./scop` | `./scop` | Relativo ao diretório atual, utilizável enquanto ele não mudar |
| `scop` (encontrado pela variável [`PATH`](/?c=shells&s=bash&p=variables-denvironnement)) | `scop` | Nenhuma pasta no valor: impossível saber onde está |
| `link` (link simbólico para `scop`) | `link` | Designa o link, não a pasta real do executável |
| Lançado por `execve()` com um `argv[0]` qualquer | qualquer coisa | O programa chamador escolhe livremente esse valor |

### A solução no Linux: `/proc/self/exe`

No Linux, `/proc` é uma pasta **virtual**: nenhum dos seus arquivos está no disco, o kernel os fabrica na leitura para descrever os processos em execução. `/proc/self` designa sempre o processo que o abre, e `/proc/self/exe` é um **link simbólico** (um arquivo especial que só contém um caminho para outro arquivo, como um atalho) que o kernel faz apontar para o executável real do processo, já limpo de `./`, `..` e outros links. A chamada de sistema `readlink()` lê o caminho contido em um link simbólico:

```c
#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <unistd.h>

// Escreve em dir a pasta do executável. Devolve 0, ou -1 (mensagem já exibida).
int get_exe_dir(char *dir, size_t size)
{
    ssize_t len;                                           // inteiro com sinal: número de bytes, ou -1
    char   *slash;

    len = readlink("/proc/self/exe", dir, size - 1);      // copia o caminho, sem '\0' final
    if (len == -1) {
        fprintf(stderr, "/proc/self/exe: %s\n", strerror(errno));   // /proc ausente?
        return (-1);
    }
    if ((size_t)len == size - 1) {                         // buffer cheio: caminho talvez cortado
        fprintf(stderr, "caminho do executável longo demais para %zu bytes\n", size);
        return (-1);
    }
    dir[len] = '\0';                                       // readlink() nunca termina a string
    slash = strrchr(dir, '/');                             // último '/': separa pasta e nome
    if (slash == dir)                                      // executável na raiz: "/scop"
        slash++;                                           // manter o próprio "/"
    *slash = '\0';                                         // corta o nome do arquivo
    return (0);
}
```

O **buffer** é a área de memória reservada para receber o resultado, aqui o array `dir`, cujo tamanho em bytes é dado por `size` (veja [o buffer de duplicação](/?c=langages-de-programmation&s=c&p=memoire)). A função é usada para montar o caminho de um arquivo entregue com o programa:

```c
char dir[4096];                                            // 4096: comprimento máximo de um caminho no Linux
char path[4200];                                           // grande o bastante para dir + "/shaders/basic.vert"

if (get_exe_dir(dir, sizeof dir) == -1)                    // sizeof dir: tamanho do array, 4096 bytes
    return (1);
// snprintf() escreve em path e para em sizeof path bytes, logo sem estourar
snprintf(path, sizeof path, "%s/shaders/basic.vert", dir);
```

Resultado verificado no Linux com um pequeno `main` que exibe `argv[0]` e a pasta encontrada, lançado de quatro maneiras:

```text
(lançado a partir de /)  /tmp/exetest/where  ->  pasta = /tmp/exetest
(por link /tmp/lien)     argv[0] = /tmp/lien ->  pasta = /tmp/exetest
(por PATH)               argv[0] = where     ->  pasta = /tmp/exetest
(sem /proc)              /proc/self/exe : No such file or directory
```

Só o último caso falha, com uma mensagem que nomeia a causa real: sabe-se o que corrigir em vez de ver `fopen()` falhar mais adiante em um caminho inventado.

### As armadilhas

| Armadilha | Por quê | Remédio |
|---|---|---|
| Esquecer o `'\0'` depois de `readlink()` | Ela copia os caracteres do caminho sem terminar a string: o resto do buffer é lido como texto | Colocar `dir[len] = '\0'` você mesmo |
| Passar `sizeof dir` a `readlink()` em vez de `sizeof dir - 1` | Não sobra lugar para o `'\0'` | Reservar um byte |
| Caminho mais longo que o buffer | `readlink()` **trunca em silêncio** e devolve o tamanho do buffer | Recusar um resultado que enche todo o buffer |
| Executável apagado durante a execução | O Linux acrescenta ` (deleted)` ao fim do caminho lido | Raro; verificar que o arquivo existe antes de usá-lo |
| `/proc` ausente (sistema mínimo, alguns contêineres ou ambientes isolados) | O link não existe | Mensagem explícita, ou caminho dado pelo usuário (variável de ambiente, opção) |
| Sistema diferente do Linux | `/proc/self/exe` é próprio do Linux | Veja a tabela abaixo |

| Sistema | Meio de encontrar o próprio executável |
|---|---|
| Linux | `readlink("/proc/self/exe", ...)` |
| macOS | `_NSGetExecutablePath()` (declarada em `<mach-o/dyld.h>`) |
| Windows | `GetModuleFileNameA()` |
| FreeBSD | `sysctl` com `KERN_PROC_PATHNAME` |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma chamada de sistema pede ao kernel para agir no lugar do programa (arquivos, processos, rede): uma mudança controlada do espaço de usuário para o espaço de kernel. Um descritor de arquivo é um simples inteiro, índice de uma tabela por processo. Um caminho nem sempre é um arquivo comum: FIFOs, dispositivos e diretórios também se abrem. Para encontrar os arquivos entregues com o programa, partir da localização real do executável (`/proc/self/exe` no Linux), nunca do diretório atual nem de `argv[0]`. |
| **Ferramentas utilizáveis** | `open`/`close`/`read`/`write`, flags `O_CREAT`/`O_TRUNC`/`O_APPEND`/`O_NONBLOCK` do `open()`, `dup2`, `errno`/`strerror` para diagnosticar uma falha, `mkfifo`, `fstat` + `S_ISREG`, `fdopen`, `readlink`. |
| **Armadilhas a evitar** | Confundir uma função de biblioteca (`printf`) com uma chamada de sistema real (`write`): a primeira encapsula a segunda. Abrir sem verificar um caminho dado pelo usuário: um FIFO congela o programa, `/dev/zero` satura a memória. Usar o resultado de `readlink()` sem colocar o `'\0'` final. |
| **Boas práticas** | Sempre verificar o valor de retorno de uma chamada de sistema (`-1` ou `NULL`) e consultar `errno`/`strerror()` para diagnosticar uma falha. Abrir com `O_NONBLOCK`, verificar com `fstat()` + `S_ISREG()` e depois `fdopen()`. |
