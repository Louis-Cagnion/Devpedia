---
order: 15
---

# Chamadas de sistema e descritores de arquivos

Um programa não pode ler um arquivo, criar um processo ou enviar dados pela rede manipulando diretamente o hardware — isso poderia ser catastrófico para a estabilidade e a segurança do sistema se qualquer programa tivesse acesso livre a ele. Em vez disso, deve passar por um canal restrito e controlado: a chamada** ao sistema** (*syscall*). Este capítulo explica este mecanismo e o **descritor de arquivo**, a «identificação» que o núcleo devolve em troca, ambos utilizados constantemente sempre que se lida com arquivos, processos ou pipes (ver capítulos sobre gestão de processos, threads e a arquitetura de um shell).

## Espaço do usuário vs. espaço do kernel

```
Programme (espace utilisateur)
      |
      | appel système : open(), read(), write(), fork(), pipe()...
      v
Noyau du système d'exploitation (espace noyau)
      |
      v
Matériel (disque, réseau, mémoire physique...)
```

Uma chamada de função C clássica (`addition(2, 3)`) é executada inteiramente no espaço** do usuário**, sem nunca sair do programa. Uma chamada de sistema é diferente: solicita explicitamente ao **kernel** que aja em vez do programa, para uma operação que este não tem permissão para realizar por si próprio. Este pedido implica uma mudança controlada do modo de execução (*modo de usuário* → *modo do kernel*), verificada pelo processador — é este controle que impede que um programa malicioso ou com erros acesse diretamente à memória ou ao disco de outro programa.

> **Nota:** uma função como `printf()` não é, por si só, uma chamada ao sistema — trata-se de uma função de biblioteca que formata a cadeia de caracteres no espaço do usuário e, em seguida, chama internamente a verdadeira chamada ao sistema (`write()`) para a enviar efetivamente para a saída padrão.

## Algumas chamadas de sistema comuns

| Chamada de sistema | Função |
|---|---|
| `open()` / `close()` | Abrir / fechar um arquivo |
| `read()` / `write()` | Ler/escrever bytes num descritor |
| `fork()` / `execve()` / `wait()` | Criar um processo / substituir o seu programa / aguardar a sua conclusão (ver capítulo sobre gestão de processos) |
| `pipe()` | Criar um canal de comunicação entre dois processos (ver capítulo sobre a arquitetura de um shell) |
| `dup2()` | Fazer com que um descritor aponte para outro recurso já aberto |
| `mmap()` / `brk()` | Solicitar memória ao sistema (utilizado internamente pelo `malloc()`, ver capítulo sobre gestão de memória) |

## Comunicar um erro: `errno`

A maioria das chamadas de sistema sinaliza uma falha devolvendo `-1` (ou `NULL` para aquelas que devolvem um ponteiro), e definindo a variável global `errno` com um código que descreve a causa exata — o mesmo princípio das funções C históricas mencionadas no capítulo sobre funções (`@` em PHP segue o mesmo tipo de convenção de erro «à la C»):

```c
#include <errno.h>
#include <fcntl.h>
#include <stdio.h>
#include <string.h>

int fd = open("fichier_inexistant.txt", O_RDONLY);

if (fd == -1) {
    printf("Erreur : %s\n", strerror(errno)); // traduit le code errno en message lisible
}
```

## O descritor de arquivo: uma simples entrada numa tabela

Um **descritor de arquivo** (*file descriptor*) não é nem um ponteiro nem um caminho: é um simples número inteiro, o índice de uma tabela mantida pelo núcleo **para cada processo**, que associa esse número inteiro a um recurso efetivamente aberto (arquivo, pipe, ligação de rede, terminal...).

Cada processo inicia com três descritores já abertos:

| Descritor | Constante C | Função habitual |
|---|---|---|
| `0` | `STDIN_FILENO` | Entrada padrão |
| `1` | `STDOUT_FILENO` | Saída padrão |
| `2` | `STDERR_FILENO` | Saída de erros |

```c
int fd = open("fichier.txt", O_RDONLY); // renvoie par ex. 3 : le prochain emplacement libre de CE processus
read(fd, tampon, taille);
close(fd);
```

> **Nota:** estes três números (`0` / `1` / `2`) correspondem exatamente aos «fluxos» (*stdin/stdout/stderr*) mencionados no capítulo sobre redirecionamentos do Bash — um redirecionamento como `2>` não faz nada mais, nos bastidores, do que manipular este descritor número `2` do processo em questão.

## `dup2()` : fazer com que um descritor aponte para outro recurso

`dup2(fonte, alvo)` faz com que o descritor número `alvo` aponte para o mesmo recurso aberto que `fonte`, fechando, ao mesmo tempo, aquilo para que `alvo` apontava anteriormente:

```c
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // désormais, écrire sur "stdout" (1) écrit en réalité dans "sortie.txt"
close(fd); // l'original peut être fermé : la cible (1) reste valide, pointant vers la même ressource
```

É exatamente este mecanismo que o capítulo sobre a arquitetura de um shell utiliza para implementar tanto os redirecionamentos (`>`, `<`) como os pipes (`|`) — em ambos os casos, faz-se com que um descritor padrão (`0`, `1`, `2`) aponte para um recurso diferente imediatamente antes de executar o programa de destino.

## Por que é que o `fork()` também duplica a tabela de descritores?

Quando `fork()` (ver capítulo sobre gestão de processos) cria um processo filho, este recebe uma **cópia** da tabela de descritores do seu pai — os mesmos números, apontando para os mesmos recursos abertos. É precisamente isto que permite que um shell execute um `dup2()` num descritor de pipe **no processo filho**, imediatamente antes da chamada a `execve()`: o novo programa herda esse descritor já redirecionado, sem ter conhecimento do mecanismo que o configurou.
