---
order: 13
---

# Como funciona um shell (arquitetura interna)

Tudo que o Bash faz na superfície (variáveis, laços, pipes, redirecionamentos) se apoia em uma mecânica bem simples de descrever: um laço que lê uma linha, a divide, a interpreta, e depois lança processos via as chamadas de sistema padrão do [capítulo sobre gerenciamento de processos em C](/?c=langages-de-programmation&s=c&p=processus) (`fork`, `execve`, `wait`). Este capítulo descreve essa mecânica, com o objetivo de entender (ou até reconstruir) um shell mínimo.

> **Pré-requisito:** este capítulo supõe conhecido o que é uma **chamada de sistema** e um **descritor de arquivo** (`STDIN_FILENO`, `dup2()`...). Veja [o capítulo dedicado](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) no tópico [C](/?c=langages-de-programmation&s=c&p=c) se esses conceitos ainda não estiverem claros.

## O laço principal (REPL)

Um shell interativo é fundamentalmente um laço infinito:

```text
enquanto verdadeiro:
    exibir o prompt
    ler uma linha de comando
    dividir a linha em palavras (tokenizacao)
    aplicar as expansoes (variaveis, coringas, substituicoes...)
    executar o comando resultante
    esperar seu fim se estiver em primeiro plano
```

*Read-Eval-Print Loop* (REPL): ler, avaliar, (implicitamente) exibir o resultado via a saída padrão do comando, repetir.

## A ordem precisa das expansões

Uma linha digitada **não** é executada tal como está: o Bash aplica várias passagens de expansão, em uma ordem fixa e não negociável, antes de lançar qualquer coisa:

1. **Expansão de chaves** (`{1,2,3}` → `1 2 3`)
2. **Expansão do til** (`~` → `/home/usuario`)
3. **Expansão de parâmetros/variáveis, substituição de comando e aritmética** (`$var`, `$(comando)`, `$((1+1))`), avaliadas da esquerda para a direita
4. **Divisão em palavras** (*word splitting*): o resultado das expansões anteriores é dividido novamente conforme os espaços, exceto se estava entre aspas duplas
5. **Expansão de caminho** (*globbing*: `*.txt` → lista real de arquivos)
6. **Remoção das aspas** (as próprias aspas nunca são transmitidas ao comando final)

> **Nota:** é essa ordem precisa que explica por que `"$var"` (com aspas) protege da divisão em palavras (etapa 4) enquanto `$var` sozinho fica exposto a ela: as aspas só são removidas na última etapa, depois que a divisão já ocorreu (ou não) sobre o conteúdo que elas protegiam.

## Como o globbing reconhece um padrão (`*.txt`): o algoritmo recursivo do `fnmatch`

A etapa 5 das expansões acima (*globbing*) substitui um padrão como `*.txt` pela lista real dos arquivos que correspondem a ele. O núcleo desse mecanismo é um algoritmo recursivo de correspondência de padrões (o mesmo princípio da função padrão `fnmatch()`): `*` pode representar qualquer subsequência de caracteres, incluindo uma vazia.

```text
corresponde("*.txt", "relatorio.txt")
  '*' encontrado -> duas tentativas:
    1. "*" corresponde a 0 caracteres -> comparar ".txt" com "relatorio.txt" (falha)
    2. "*" consome 1 caractere a mais -> comparar "*.txt" com "elatorio.txt" (repetir)
  ... repetido ate que ".txt" corresponda ao fim de "relatorio.txt" -> sucesso
```

A cada `*` encontrado no padrão, o algoritmo tenta primeiro fazê-lo corresponder a zero caracteres (avançando só no padrão), senão a mais um caractere da string testada (avançando na string mantendo o `*` atual): a recursão para assim que um dos dois textos se esgota. Fora de um `*`, uma correspondência exige uma igualdade estrita caractere a caractere.

> **Boa prática:** esse mesmo algoritmo (recursão sobre `*`) serve de base a qualquer busca por padrão com curingas, não só à expansão de caminho: entendê-lo permite prever o comportamento de um `*` em qualquer ferramenta que aceite curingas (busca de arquivos, filtro de log...).

## Representar a linha: uma árvore de sintaxe (AST)

Uma linha como `cmd1 && cmd2 || cmd3` combina vários comandos com operadores (`&&`, `||`, `|`) que não têm todos a mesma prioridade nem o mesmo sentido: executá-la palavra por palavra, na ordem de leitura, não basta para respeitar essa prioridade. O shell constrói primeiro uma **árvore de sintaxe abstrata** (AST): uma árvore binária cujos nós internos são os operadores e cujas folhas são os comandos.

```text
cmd1 && cmd2 || cmd3

        OR
       /  \
     AND   cmd3
    /   \
 cmd1   cmd2
```

Executar a linha vira então um simples percurso recursivo dessa árvore:

- uma folha (um comando) é lançada normalmente (`fork`/`execve`/`waitpid`, veja acima);
- um nó `AND` só executa seu ramo direito se o esquerdo teve sucesso (código de saída `0`);
- um nó `OR` só executa seu ramo direito se o esquerdo falhou.

Os parênteses (`(cmd1 && cmd2) || cmd3`) criam uma subárvore avaliada primeiro, exatamente como em matemática: é a estrutura da árvore em si que codifica a prioridade e a associatividade dos operadores, não uma verificação repetida sobre o texto da linha.

> **Nota:** esse mesmo princípio (parsing → AST → avaliação recursiva) é o de um interpretador de calculadora ou um motor de regras: assim que uma sintaxe combina elementos com operadores de prioridades diferentes, uma árvore em vez de uma leitura linear simplifica a execução.

## Os subshells: fork() sem execve()

No exemplo de comando externo abaixo, o filho vindo de `fork()` chama `execve()`: ele substitui imediatamente sua imagem de memória por outro programa e deixa de ser um shell. Um **subshell** é o outro caso: um filho que **continua** sendo um shell e continua interpretando comandos, sem nunca chamar `execve()`. O Bash cria um automaticamente para:

- um comando entre parênteses: `(cd /tmp && ls)`
- cada estágio de um pipeline (cf. seção seguinte)
- uma substituição de comando: `resultado=$(comando)`
- um comando em segundo plano: `comando &`

Um subshell herda uma **cópia** das variáveis do shell pai no momento em que inicia, mas é uma cópia de mão única, como para o export de uma [variável de ambiente](/?c=shells&s=bash&p=variables-denvironnement): qualquer modificação que ele faz (`cd`, variável...) desaparece com ele ao terminar, sem nunca atingir o pai.

```bash
cd /tmp
(cd /var && pwd)  # exibe /var, no subshell
pwd               # continua exibindo /tmp: o cd do subshell nao sobreviveu
```

## Agrupar comandos sem subshell: `{ ; }`

`{ comando1; comando2; }` produz um efeito parecido com `(comando1; comando2)` visto acima, mas **sem** criar um subshell: os comandos são executados diretamente no shell atual, com as mesmas consequências de digitar um `cd` ou uma variável normalmente.

```bash
cd /tmp
{ cd /var; pwd; }   # exibe /var
pwd                 # continua exibindo /var: sem subshell, o cd realmente aconteceu aqui
```

| | `( ; )` | `{ ; }` |
|---|---|---|
| Cria um subshell | Sim | Não |
| Mudanças de `cd`/variável sobrevivem depois | Não | Sim |
| Espaço depois do símbolo de abertura | Não necessário | **Obrigatório** |
| `;` antes do símbolo de fechamento | Não necessário | **Obrigatório** |

> **Armadilha:** `{ls;}` (sem espaços) é um erro de sintaxe. `{` e `}` são **palavras-chave** do shell aqui, não operadores como `(`/`)`: precisam por isso ser separados do resto por um espaço, exatamente como qualquer outra palavra da linha de comando.

## Colorir a saída de um terminal: os códigos ANSI

Um terminal não exibe só texto puro: ele também interpreta certas sequências de bytes como instruções de formatação (cor, negrito...), os **códigos de escape ANSI**. Uma sequência começa com o caractere `ESC` (`\033` em octal), seguido de `[`, um código, e uma letra final:

```bash
printf '\033[31mTexto em vermelho\033[0m\n'
```

| Código | Efeito |
|---|---|
| `\033[31m` | Texto vermelho |
| `\033[32m` | Texto verde |
| `\033[36m` | Texto ciano |
| `\033[0m` | Reseta tudo (cor, negrito...) |

> **Armadilha:** `echo '\033[31mTexto\033[0m'` (sem `-e`) na maioria das vezes exibe a sequência **tal como está**, como texto puro, em vez de interpretá-la. O comportamento padrão do `echo` diante de uma sequência de escape depende na verdade do shell que o executa: o `echo` interno do Bash só a interpreta se `-e` for passado, enquanto o `echo` interno do `dash` (o `/bin/sh` padrão em muitas distribuições Linux) a interpreta nativamente, sem `-e`. A mesma linha pode assim mostrar cores dentro de um Makefile (cujas receitas rodam via `/bin/sh`) e falhar tal como está ao ser colada em um prompt Bash interativo.
>
> **Boa prática:** preferir `printf`, cujo comportamento é constante entre shells (ele sempre interpreta `\033` na sua string de formato), em vez de confiar no comportamento do `echo`, que varia.

## Executar um comando: builtin vs externo

Uma vez a linha dividida e expandida, o shell precisa distinguir dois casos:

### Os comandos internos (*builtins*)

`cd`, `export`, `echo` (frequentemente), `read`, `exit`... são executados **diretamente pelo próprio processo shell**, sem lançar um novo processo. É uma necessidade, não uma escolha de estilo: `cd` precisa mudar o diretório atual **do shell**, não o de um subprocesso efêmero que desapareceria imediatamente com sua mudança de diretório.

### Os comandos externos

Para um programa como `ls` ou `grep`, o shell reproduz exatamente o mecanismo do capítulo sobre gerenciamento de processos em C:

```c
pid_t pid = fork();

if (pid == 0) {
    // processo filho: substitui sua imagem de memoria pelo programa solicitado
    execve("/bin/ls", argumentos, ambiente);
    _exit(127); // alcancado apenas se execve falhou (comando nao encontrado, por exemplo)
} else {
    // processo pai (o proprio shell): espera o fim do filho
    int status;
    waitpid(pid, &status, 0);
}
```

## O código de saída de um processo morto por um sinal

`waitpid()` (acima) não retorna diretamente um simples código de saída: é um status a decodificar via as macros `WIFEXITED`/`WEXITSTATUS` (saída normal) ou `WIFSIGNALED`/`WTERMSIG` (terminado por um sinal, veja [Sinais UNIX](/?c=langages-de-programmation&s=c&p=signaux-unix)). Quando um processo é morto por um sinal (`Ctrl+C` envia `SIGINT`, por exemplo) em vez de terminar normalmente via `exit()`, a convenção POSIX seguida por todos os shells consiste em expor `128 + número_do_sinal` como código de saída aparente:

| Sinal | Número | Código de saída (`$?`) |
|---|---|---|
| `SIGINT` (Ctrl+C) | 2 | 130 |
| `SIGQUIT` (Ctrl+\\) | 3 | 131 |
| `SIGKILL` | 9 | 137 |

```bash
sleep 100
# Ctrl+C durante a execucao
echo $?   # exibe 130 (128 + 2)
```

> **Armadilha:** achar que `$?` só pode valer entre 0 e 255 por razões arbitrárias. É justamente essa faixa (um byte) que explica a convenção `128 + sinal`: além de 128, `$?` na verdade codifica "morto pelo sinal `$? - 128`", nunca um valor de retorno real escolhido pelo programa.

## Como o kernel reconhece um script executável (o shebang)

Quando `execve()` recebe o caminho de um arquivo, o kernel lê seus primeiríssimos bytes para saber como lançá-lo. Se eles valerem `#!` (o [shebang](/?c=shells&s=bash&p=scripts-et-shebang)), o kernel não tenta executar o arquivo como código de máquina: ele mesmo relança `execve()`, dessa vez sobre o interpretador indicado depois de `#!`, passando a ele o caminho do script original como primeiro argumento.

```text
./script.sh
      │
      ▼
execve("./script.sh", ...)
      │
      ▼
O kernel le os 2 primeiros bytes do arquivo: "#!"
      │
      ▼
Relanca: execve("/bin/bash", ["/bin/bash", "./script.sh", ...], ...)
```

É por isso que um script sem direito de execução (`chmod +x`, veja [Permissões e manipulação de arquivos](/?c=shells&s=bash&p=permissions-et-fichiers)) não pode ser lançado diretamente (`./script.sh` falha), mas continua executável invocando o interpretador explicitamente (`bash script.sh`): nesse segundo caso, é o próprio `bash` (já executável) que é lançado por `execve()`: é ele, e não o kernel, que depois abre o script como um simples arquivo de texto a ler linha por linha.

## Como o shell encontra qual executável lançar

Se o comando digitado contém uma `/` (ex. `./script.sh`, `/bin/ls`), o shell o usa diretamente. Senão, ele percorre cada diretório listado em [`$PATH`](/?c=shells&s=bash&p=variables-denvironnement), na ordem, e para no **primeiro** arquivo executável encontrado com esse nome: é um simples teste `access(caminho, X_OK)` repetido em cada candidato.

## Implementar um pipe (`cmd1 | cmd2`)

Um pipe se apoia na chamada de sistema `pipe()`, que cria dois descritores de arquivo conectados (uma extremidade de leitura, uma de escrita), combinada com `fork()` e `dup2()`:

```c
int fds[2];
pipe(fds); // fds[0] = extremidade de leitura, fds[1] = extremidade de escrita

pid_t p1 = fork();
if (p1 == 0) {
    dup2(fds[1], STDOUT_FILENO); // a saida padrao de cmd1 vira a escrita do pipe
    close(fds[0]);
    close(fds[1]);
    execve("/bin/ls", ...);
}

pid_t p2 = fork();
if (p2 == 0) {
    dup2(fds[0], STDIN_FILENO); // a entrada padrao de cmd2 vira a leitura do pipe
    close(fds[0]);
    close(fds[1]);
    execve("/usr/bin/grep", ...);
}

close(fds[0]);
close(fds[1]);
waitpid(p1, NULL, 0);
waitpid(p2, NULL, 0);
```

`dup2(origem, alvo)` faz o descritor `alvo` (ex. `STDOUT_FILENO`, que vale `1`) apontar para o mesmo recurso que `origem`: é exatamente esse mecanismo, aplicado ao descritor de um pipe em vez de a um arquivo, que liga a saída de um comando à entrada do seguinte.

## Implementar um redirecionamento (`>`, `<`)

Mesma lógica que para um pipe, mas a "origem" é um arquivo aberto com `open()` em vez de um pipe:

```c
int fd = open("saida.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // tudo que o programa escreve em stdout agora vai para saida.txt
close(fd);
execve(...);
```

`O_TRUNC` corresponde a `>` (sobrescreve o arquivo), `O_APPEND` a `>>` (adiciona ao final); veja [Redirecionamentos e pipes](/?c=shells&s=bash&p=redirections-et-pipes) para o comportamento observado do lado do usuário.

## O here-document (`<<DELIM`): redirecionar um bloco de texto sem arquivo

Diferente de `<`, que redireciona a partir de um arquivo já existente, `<<DELIM` faz o shell ler as linhas seguintes de entrada **diretamente do terminal** (ou do script), até encontrar uma linha composta unicamente pelo delimitador escolhido:

```bash
cat <<FIM
Primeira linha
Segunda linha
FIM
```

O shell fornece todo esse texto como entrada padrão do comando, exatamente como se viesse de um arquivo: útil para injetar um bloco multilinha sem criar um arquivo separado. Uma implementação possível (em um mini-shell) escreve cada linha lida em um arquivo temporário (`open(".heredoc", O_WRONLY | O_CREAT | O_TRUNC)`) aos poucos, e depois reabre esse arquivo em leitura como entrada do comando, uma vez alcançado o delimitador.

> **Nota:** colocar o delimitador entre aspas (`<<"FIM"` ou `<<'FIM'`) desativa as expansões de variáveis dentro do bloco (`$var` permanece literal); sem aspas, as expansões habituais se aplicam normalmente ao texto do here-document.

## O controle de tarefas (jobs): `&`, `Ctrl+Z`, `fg`/`bg`

Cada pipeline lançado forma um **grupo de processos**: um identificador compartilhado (`setpgid()`) que permite ao shell e ao terminal tratar todos os processos de um mesmo pipeline como uma única unidade (ex. enviar um sinal a todos ao mesmo tempo), em vez de precisar mirar em cada PID individualmente. O terminal só dá o controle do teclado a **um único** grupo por vez (`tcsetpgrp()`), o que está em primeiro plano. `Ctrl+Z` envia o sinal `SIGTSTP` a esse grupo (o suspende sem encerrá-lo), `fg`/`bg` (veja [O gerenciamento de processos](/?c=shells&s=bash&p=gestion-des-processus)) devolvem respectivamente o controle do terminal ou enviam `SIGCONT` para retomar a execução em segundo plano.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um shell é um laço REPL: ler uma linha, aplicar as expansões em uma ordem fixa, executar (builtin internamente, ou `fork`/`execve`/`wait` para um comando externo). `( ; )` cria um subshell, `{ ; }` agrupa comandos sem criar um. `&&`/`\|\|`/`\|` são representados internamente como uma árvore de sintaxe (AST) que codifica sua prioridade. |
| **Ferramentas utilizáveis** | `fork()`/`execve()`/`waitpid()`, `pipe()`/`dup2()` para os pipes e redirecionamentos, `<<DELIM` para um here-document, o shebang para que um script seja reconhecido como executável, `printf` para códigos ANSI confiáveis entre shells. |
| **Armadilhas a evitar** | Confundir a ordem das expansões: é ela que explica por que `"$var"` protege da divisão em palavras enquanto `$var` sozinho fica exposto a ela. Omitir os espaços ao redor de `{ ; }`. Confiar no `echo` para interpretar um código ANSI: seu comportamento padrão varia entre shells. Esquecer que `$?` além de 128 codifica um sinal (`128 + número`), não um valor de retorno real. |
| **Boas práticas** | Construir seu próprio mini-shell para verificar sua compreensão: laço de leitura, analisador, expansões, `fork`/`execve`/`waitpid`, `pipe`/`dup2`/`open`. Preferir `{ ; }` a um subshell sempre que uma mudança (`cd`, uma variável) precisar sobreviver ao grupo de comandos. |

## Construir seu próprio mini-shell

Resumindo, um shell mínimo em C precisa de: um laço de leitura, um analisador que respeite as aspas e os operadores (`|`, `>`, `<`, `&&`), a lógica de expansão na ordem correta, `fork`/`execve`/`waitpid` para os comandos externos, funções C chamadas diretamente para os builtins, e `pipe()`/`dup2()`/`open()` para os pipes e redirecionamentos. É literalmente a arquitetura completa; o resto (completação, histórico, coloração...) é apenas conforto adicionado por cima.
