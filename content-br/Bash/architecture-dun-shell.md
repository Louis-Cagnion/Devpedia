---
order: 12
---

# Como funciona um shell (arquitetura interna)

Tudo o que o Bash faz à primeira vista (variáveis, loops, pipes, redirecionamentos) assenta numa mecânica bastante simples de descrever: um loop que lê uma linha, a divide, a interpreta e, em seguida, inicia processos através das chamadas de sistema padrão do capítulo sobre gestão de processos em C (`fork`, `execve`, `wait`). Este capítulo descreve este mecanismo, com o objetivo de compreender — ou mesmo reconstruir — um shell mínimo.

> **Pré-requisitos:** este capítulo pressupõe que o leitor sabe o que é uma **chamada de sistema** e um **descritor de arquivo** (`STDIN_FILENO`, `dup2()`...) — consulte o capítulo dedicado a este tema na secção C, caso estes conceitos ainda não estejam claros.

## O ciclo principal (REPL)

Um shell interativo é, fundamentalmente, um ciclo infinito:

```
tant que vrai :
    afficher le prompt
    lire une ligne de commande
    découper la ligne en mots (tokenisation)
    appliquer les expansions (variables, jokers, substitutions...)
    exécuter la commande résultante
    attendre sa fin si elle est au premier plan
```

*Read-Eval-Print Loop* (REPL): ler, avaliar, (implicitamente) apresentar o resultado através da saída padrão do comando, repetir.

## A ordem exata das expansões

Uma linha digitada não é executada tal como está: o Bash aplica várias etapas de expansão, numa ordem fixa e não negociável, antes de executar qualquer coisa:

1. **Expansão de chaves** (`{1,2,3}` → `1 2 3`)
2. **Expansão do símbolo til** (`~` → `/home/usuário`)
3. **Expansão de parâmetros/variáveis, substituição de comandos e operações aritméticas** (`$var`, `$(commande)`, `$((1+1))`), avaliadas da esquerda para a direita
4. **Divisão em palavras** (*word splitting*): o resultado das expansões anteriores é redividido de acordo com os espaços, exceto se estiver entre aspas duplas
5. **Expansão de caminho** (*globbing*: `*.txt` → lista real de arquivos)
6. **Supressão das aspas** (as próprias aspas nunca são transmitidas ao comando final)

> **Nota:** é precisamente esta ordem que explica por que razão «`"$var"`» (entre aspas) evita a divisão em palavras (etapa 4), enquanto `$var`, por si só, fica exposto a essa divisão — as aspas só são removidas na etapa final, depois de a divisão já ter ocorrido (ou não) no conteúdo que elas protegiam.

## Executar um comando: comando integrado vs comando externo

Depois de a linha ter sido dividida e expandida, o shell deve distinguir dois casos:

### Os comandos internos (*builtins*)

`cd`, `export`, `echo` (frequentemente), `read`, `exit`... são executados **diretamente pelo próprio processo do shell**, sem iniciar um novo processo. Trata-se de uma necessidade, não de uma escolha de estilo: «`cd`» deve alterar o diretório atual **do shell**, e não o de um subprocesso efémero que desapareceria imediatamente após a alteração do diretório.

### Os comandos externos

Num programa como o `ls` ou o `grep`, o shell reproduz exatamente o mecanismo descrito no capítulo sobre a gestão de processos em C:

```
pid_t pid = fork();

if (pid == 0) {
    // processus enfant : remplace son image mémoire par le programme demandé
    execve("/bin/ls", arguments, environnement);
    _exit(127); // atteint uniquement si execve a échoué (commande introuvable, par exemple)
} else {
    // processus parent (le shell lui-même) : attend la fin de l'enfant
    int statut;
    waitpid(pid, &statut, 0);
}
```

## Como é que o shell determina qual o executável a executar

Se o comando digitado contiver um `/` (por exemplo, `./script.sh`, `/bin/ls`), o shell utiliza-o diretamente. Caso contrário, percorre cada pasta listada em `$PATH` (ver capítulo sobre variáveis de ambiente), por ordem, e pára no **primeiro** arquivo executável encontrado com esse nome — trata-se de um simples teste `access(caminho, X_OK)` repetido em cada candidato.

## Implementar um pipe (`cmd1 | cmd2`)

Um pipe baseia-se na chamada de sistema `pipe()`, que cria dois descritores de arquivo ligados (uma extremidade de leitura e outra de escrita), combinada com `fork()` e `dup2()`:

```
int fds[2];
pipe(fds); // fds[0] = extrémité de lecture, fds[1] = extrémité d'écriture

pid_t p1 = fork();
if (p1 == 0) {
    dup2(fds[1], STDOUT_FILENO); // la sortie standard de cmd1 devient l'écriture du pipe
    close(fds[0]);
    close(fds[1]);
    execve("/bin/ls", ...);
}

pid_t p2 = fork();
if (p2 == 0) {
    dup2(fds[0], STDIN_FILENO); // l'entrée standard de cmd2 devient la lecture du pipe
    close(fds[0]);
    close(fds[1]);
    execve("/usr/bin/grep", ...);
}

close(fds[0]);
close(fds[1]);
waitpid(p1, NULL, 0);
waitpid(p2, NULL, 0);
```

`dup2(fonte, alvo)` faz com que o descritor `alvo` (por exemplo, `STDOUT_FILENO`, que corresponde a `1`) aponte para o mesmo recurso que `fonte` — é exatamente este mecanismo, aplicado ao descritor de um pipe em vez de a um arquivo, que liga a saída de um comando à entrada do seguinte.

## Implementar um redirecionamento (`>`, `<`)

A mesma lógica que para um pipe, mas a «fonte» é um arquivo aberto com `open()` em vez de um pipe:

```
int fd = open("sortie.txt", O_WRONLY | O_CREAT | O_TRUNC, 0644);
dup2(fd, STDOUT_FILENO); // tout ce qu'écrit le programme sur stdout part maintenant dans sortie.txt
close(fd);
execve(...);
```

`O_TRUNC` corresponde a `>` (substitui o arquivo), `O_APPEND` a `>>` (acrescenta no final) — ver o capítulo sobre redirecionamentos para conhecer o comportamento observado do ponto de vista do usuário.

## Controlo de tarefas (jobs): `&`, `Ctrl+Z`, `fg` / `bg`

Cada pipeline iniciado forma um **grupo de processos** — um identificador partilhado (`setpgid()`) que permite ao shell e ao terminal tratar todos os processos de um mesmo pipeline como uma única unidade (por exemplo, enviar-lhes um sinal a todos ao mesmo tempo), em vez de ter de selecionar cada PID individualmente. O terminal concede o controlo do teclado apenas a **um único** grupo de cada vez (`tcsetpgrp()`), aquele que se encontra em primeiro plano. `Ctrl+Z` envia o sinal `SIGTSTP` a esse grupo (suspende-o sem o encerrar), `fg` / `bg` (ver capítulo sobre gestão de processos) devolvem, respetivamente, o controlo do terminal ou reenvi`SIGCONT` para retomar a execução em segundo plano.

## Criar o seu próprio mini-shell

Em resumo, um shell minimalista em C necessita de: um ciclo de leitura, um analisador que respeite as aspas e os operadores (`|`, `>`, `<`, `&&`), a lógica de expansão na ordem correta, `fork` / `execve` / `waitpid` para os comandos externos, funções C chamadas diretamente para os comandos embutidos e `pipe()` / `dup2()` / `open()` para os pipes e redirecionamentos. Esta é, literalmente, a arquitetura completa — o resto (autocompletar, histórico, coloração...) não passa de funcionalidades adicionais para maior comodidade.
