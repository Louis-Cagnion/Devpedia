---
order: 2
---

# Sockets e E/S não bloqueante

Uma vez compreendido [o endereçamento de rede](/?c=reseaux&p=fondamentaux-reseau), falta entender como um **programa** troca dados concretamente com outro, possivelmente em uma máquina remota. Esse é o papel de uma **socket**: um ponto de extremidade de comunicação de rede, manipulado pelo programa como um [descritor de arquivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) clássico (é possível ler e escrever nele), mas cuja outra ponta é uma rede em vez de um arquivo em disco.

## O ciclo de vida de uma socket servidora

Criar um servidor de rede sempre segue a mesma sequência de chamadas de sistema:

| Etapa | Função | Papel |
|---|---|---|
| 1. Criação | `socket()` | Cria a socket, retorna um descritor de arquivo |
| 2. Associação | `bind()` | Associa a socket a um endereço IP e uma porta específicos da máquina |
| 3. Escuta | `listen()` | Coloca a socket em modo "aceito conexões de entrada" |
| 4. Aceitação | `accept()` | Bloqueia até que um cliente se conecte, retorna uma **nova** socket dedicada a esse cliente |
| 5. Troca | `read()`/`write()` | Lê ou escreve dados com esse cliente específico |
| 6. Fechamento | `close()` | Libera a socket |

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

int main(void)
{
    int servidor = socket(AF_INET, SOCK_STREAM, 0); // AF_INET = IPv4, SOCK_STREAM = TCP

    struct sockaddr_in endereco;
    endereco.sin_family = AF_INET;
    endereco.sin_addr.s_addr = INADDR_ANY;   // aceita conexoes em todas as interfaces
    endereco.sin_port = htons(8080);         // porta 8080, convertida na ordem esperada pela rede

    bind(servidor, (struct sockaddr *)&endereco, sizeof(endereco));
    listen(servidor, 10); // 10 = numero de conexoes em espera permitidas antes de recusar

    int cliente = accept(servidor, NULL, NULL); // bloqueia aqui ate uma conexao

    char buffer[1024];
    read(cliente, buffer, sizeof(buffer));
    write(cliente, "OK", 2);

    close(cliente);
    close(servidor);
    return 0;
}
```

> **Nota:** `htons()` (*host to network short*) converte o número da porta na **ordem de bytes de rede**, que pode ser diferente da usada internamente pelo processador da máquina. Um detalhe para nunca esquecer ao manipular um endereço ou uma porta.

Do lado do cliente, a sequência é mais curta: `socket()` seguido de `connect()` (o equivalente a `bind()` + `listen()` + `accept()`, mas para se juntar a um servidor existente em vez de esperar por um) já bastam antes de trocar dados.

## O problema do bloqueio

No exemplo acima, `accept()` e `read()` são **bloqueantes**: o programa para e espera, sem fazer mais nada, até que um evento ocorra. Um servidor que precisa lidar com **vários clientes ao mesmo tempo** não pode se dar ao luxo de ficar bloqueado em apenas um deles enquanto os outros esperam.

```text
Cliente A conecta -> accept() bloqueia em A
Cliente B tenta se conectar... mas o servidor ainda esta bloqueado em A!
```

## A multiplexação de E/S: monitorar várias sockets ao mesmo tempo

Em vez de bloquear em uma única socket, um servidor pode pedir ao sistema: "me avise assim que uma **destas** sockets tiver algo pronto (uma nova conexão, dados para ler)". Esse é o papel de `select()`, `poll()` e `epoll()`:

| Função | Portabilidade | Limite / vantagem |
|---|---|---|
| `select()` | POSIX (em todo lugar) | Limitada a um pequeno número de sockets monitoradas (geralmente 1024), percorre toda a lista de novo a cada chamada |
| `poll()` | POSIX (em todo lugar) | Sem limite de número, mas também percorre toda a lista a cada chamada: custoso com muitas sockets |
| `epoll()` | Somente Linux | O kernel retorna **apenas** as sockets realmente prontas: escalável mesmo com dezenas de milhares de conexões |

```text
      +-------------------------------------+
      |  select()/poll()/epoll_wait()       |
      |  "quais sockets estao prontas?"     |
      +-------------------------------------+
             |            |            |
        socket A     socket B     socket C
        (nada)       (dados       (nada)
                       prontos)
                |
                v
      o servidor trata APENAS a socket B, sem bloquear em A nem em C
```

Essa abordagem é a base de um **loop de eventos** (*event loop*): um único loop que consulta continuamente quais sockets estão prontas, e trata apenas essas, sem nunca ficar bloqueado em uma socket inativa.

> **Armadilha:** usar chamadas bloqueantes clássicas (`accept()`, `read()`) em um servidor que deveria lidar com vários clientes simultaneamente, sem multiplexação: o servidor se torna, na prática, mono-cliente, mesmo que tecnicamente aceite várias conexões.
>
> **Boa prática:** colocar as sockets em modo não bloqueante (`fcntl(socket, F_SETFL, O_NONBLOCK)`) em complemento a `select`/`poll`/`epoll`, para que uma chamada `read()` em uma socket anunciada como "pronta" mas que se esvazia nesse meio-tempo nunca bloqueie o programa.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Uma socket servidora segue a sequência `socket()` → `bind()` → `listen()` → `accept()`; as chamadas de rede clássicas bloqueiam, o que impede lidar com vários clientes com um único loop simples. |
| **Ferramentas utilizáveis** | `select()`/`poll()` (portáveis) ou `epoll()` (Linux, mais escalável) para monitorar várias sockets sem bloquear; `O_NONBLOCK` para proteger as leituras. |
| **Armadilhas a evitar** | Bloquear em uma única socket (`accept()`/`read()`) em um servidor multi-cliente sem multiplexação. |
| **Boas práticas** | Construir o servidor em torno de um loop de eventos que só age nas sockets realmente prontas. |
