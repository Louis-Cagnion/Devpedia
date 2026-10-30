---
order: 16
---

# Alias avançados no Bash

Um **alias** é um atalho: um nome curto que se digita no lugar de um comando mais longo. Este capítulo pressupõe que você sabe abrir um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (a janela onde se digitam instruções pelo teclado) e executar nele um comando simples como `ls` (ver [os comandos básicos](/?c=langages&s=bash&p=commandes-de-base)). O **shell** é o programa que lê o que você digita no terminal e o executa; o deste capítulo é o [Bash](/?c=langages&s=bash&p=bash). Um **comando** é uma instrução digitada no terminal (`ls`), um **argumento** é tudo o que se escreve depois do seu nome (`/tmp` em `ls /tmp`), e uma **opção** é um argumento que começa com um hífen (`-l`).

O alias simples (`alias ll='ls -la'`) é apresentado em [as variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement). Este capítulo vai mais longe, **em cinco níveis**, cada um apoiado no anterior:

| Nível | Necessidade | Ferramenta | Seção |
|---|---|---|---|
| 1 | Outro nome para um comando | `alias`, `unalias`, `~/.bashrc` | [Nível 1](#nivel-1-o-alias-simples) |
| 2 | Um comando que recebe argumentos no meio | Uma **função** (um grupo de comandos guardado sob um nome: `$1`, `"$@"`, `"$#"`) | [Nível 2](#nivel-2-alias-ou-funcao-com-argumentos) |
| 3 | Usar um atalho em um script | `shopt -s expand_aliases`, ou melhor, uma função | [Nível 3](#nivel-3-os-alias-em-um-script) |
| 4 | Fazer alias, funções e programas conviverem | `\nome`, `command`, `type -a`, `unalias` | [Nível 4](#nivel-4-contorno-e-convivencia) |
| 5 | Organizar seus atalhos e pô-los de lado para diagnosticar | `~/.bash_aliases`, `bash --norc` | [Nível 5](#nivel-5-organizar-seus-atalhos) |

O mesmo assunto existe em outro shell: [os aliases e atalhos de comandos no PowerShell](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), em que o alias é bem mais limitado.

## O que é um alias no Bash

Um alias é um **texto de substituição**. A imagem mais próxima é o corretor de um celular que troca « pfv » por « por favor » antes de enviar a mensagem: ninguém lê a mensagem antes da substituição. Do mesmo modo, o Bash troca a palavra digitada pelo texto do alias **antes de analisar a linha**, ou seja, antes de dividi-la em palavras e de tratar as variáveis e os [coringas](/?c=langages&s=bash&p=expansion-et-jokers) (ver [a ordem das expansões](/?c=langages&s=bash&p=architecture-dun-shell#a-ordem-precisa-das-expansoes)).

```
   Você digita:   ll /tmp
                   |
   1. O Bash lê a primeira palavra da linha: ll
   2. Ele encontra um alias ll, cujo texto é: ls -la
   3. Ele troca a palavra ll por esse texto; o resto da linha não muda
                   |
                   v
   4. Ele analisa a linha obtida: ls -la /tmp
   5. Ele a executa
```

A etapa 3 se chama **expansão** do alias (em inglês *alias expansion*): a substituição de um alias pelo seu texto. Todo este capítulo decorre desta frase: **o alias é um texto, substituído à palavra digitada, antes de a linha ser analisada** (ver [o manual do Bash, seção « Aliases »](https://www.gnu.org/software/bash/manual/html_node/Aliases.html)).

## Nível 1: o alias simples

```bash
# alias nome='texto': cria o alias ll; o texto entre aspas simples é guardado tal como está
alias ll='ls -la'
# ll é substituído por « ls -la »: listagem detalhada da pasta, arquivos ocultos incluídos
ll
# o que é digitado depois do alias é acrescentado ao fim do texto: executa « ls -la /tmp »
ll /tmp
# alias sem argumento: lista todos os alias da sessão atual
alias
# alias seguido de um nome: mostra a definição somente desse alias
alias ll
# unalias remove o alias ll da sessão atual
unalias ll
# ll não é mais conhecido: o Bash responde « command not found » (« comando não encontrado »)
ll
```

Em uma sessão limpa, esses comandos mostram (depois da listagem da pasta, que depende de onde você está):

```text
alias ll='ls -la'
alias ll='ls -la'
bash: ll: command not found
```

A primeira linha é a saída de `alias`, a segunda a de `alias ll`, a terceira o erro do último `ll`. O texto das mensagens de erro depende do idioma do sistema (em português, a mensagem seria « comando não encontrado »). A opção `-la` reúne `-l` (uma linha detalhada por arquivo) e `-a` (mostrar também os itens ocultos): ver [o comando `ls`](/?c=langages&s=bash&p=commandes-de-base#listar-um-diretorio-ls).

| Comando | Efeito |
|---|---|
| `alias nome='texto'` | Cria ou substitui o alias `nome` |
| `alias` | Lista todos os alias da sessão |
| `alias nome` | Mostra a definição do alias `nome` |
| `unalias nome` | Remove o alias `nome` |
| `unalias -a` | Remove todos os alias da sessão |

### Aspas simples ou duplas: quando as variáveis são lidas?

Uma **variável** é uma caixa com etiqueta que guarda um valor (ver [a variável](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable)). Em `"echo $n"`, as aspas duplas fazem o Bash ler a variável `n` **imediatamente**, na criação do alias; com aspas simples, o texto `$n` é guardado e lido a cada **uso** (ver [aspas simples e duplas](/?c=langages&s=bash&p=variables#aspas-simples-vs-duplas)).

```bash
# n é uma variável que contém 1
n=1
# aspas duplas: $n é trocado por 1 agora, o alias guarda o texto « echo 1 »
alias valor_duplo="echo $n"
# aspas simples: o alias guarda o texto « echo $n », lido mais tarde
alias valor_simples='echo $n'
# mudamos o valor de n
n=2
# mostra 1: o valor ficou fixado na criação
valor_duplo
# mostra 2: a variável é lida no momento do uso
valor_simples
```

A saída observada é `1` e depois `2`. Regra prática: **sempre aspas simples** em volta do texto de um alias, a não ser que se queira fixar um valor.

### Tornar um alias permanente

Um alias digitado no terminal fica guardado **na memória**, na sessão: feche a janela e ele desaparece. Para encontrá-lo a cada abertura, escreve-se no arquivo `~/.bashrc`, que o Bash lê ao iniciar cada terminal (ver [os arquivos de configuração](/?c=langages&s=bash&p=variables-denvironnement#arquivos-de-configuracao-do-shell)). O sinal `~` designa a sua pasta pessoal (ver [a expansão do til](/?c=langages&s=bash&p=expansion-et-jokers#a-expansao-do-til)).

```bash
# echo mostra o texto; >> (redirecionamento) o acrescenta ao fim do arquivo ~/.bashrc
echo "alias ll='ls -la'" >> ~/.bashrc
# source lê o arquivo e executa as suas linhas na sessão atual
# (não é preciso reabrir o terminal)
source ~/.bashrc
```

As aspas duplas externas protegem aqui as aspas simples internas: o arquivo recebe exatamente `alias ll='ls -la'`. O redirecionamento `>>` é explicado em [redirecionamentos e pipes](/?c=langages&s=bash&p=redirections-et-pipes), e `source` em [as variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement#source-recarregar-um-arquivo-de-configuracao).

## Nível 2: alias ou função com argumentos

Um alias sabe **apenas** colar o seu texto no lugar da palavra; os argumentos digitados depois dele chegam **no fim**. Ele não pode colocá-los em outro lugar. Preparemos uma pasta de teste:

```bash
# mkdir cria uma pasta; teste é a nossa pasta de trabalho
mkdir teste
# cd entra nela
cd teste
# cria uma subpasta chamada sub
mkdir sub
# > escreve o texto em um arquivo (criado se não existir)
echo "olá" > a.txt
# um nome de arquivo com espaço: ele nos será útil mais abaixo
echo "olá mundo" > "meu arquivo.txt"
# um arquivo dentro da subpasta
echo "tchau" > sub/b.txt
```

### O alias que não funciona

Eis um atalho que procura uma palavra em todos os arquivos. `grep` é o comando que procura texto (ver [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-buscar-texto)); `-r` o faz descer às subpastas, e o ponto `.` designa a pasta atual. O texto `$1` designa o primeiro argumento **de um script ou de uma função** (ver [os argumentos de um script](/?c=langages&s=bash&p=scripts-et-shebang#os-argumentos-de-um-script)).

```bash
# o alias busca deve executar: grep -r "palavra" .  (com a palavra digitada no lugar de $1)
alias busca='grep -r "$1" .'
# executa o alias com a palavra olá
busca olá
# mostra o conteúdo de $1 entre colchetes
echo "[$1]"
```

```text
./a.txt:olá
./meu arquivo.txt:olá mundo
./sub/b.txt:tchau
grep: olá: No such file or directory
[]
```

A ordem dos arquivos pode variar de um sistema para outro. O resultado está errado, e a explicação está nas duas etapas da substituição:

| Etapa | O que acontece |
|---|---|
| 1. Expansão do alias | `busca olá` vira `grep -r "$1" . olá`: a palavra digitada é colada **no fim** |
| 2. Análise da linha obtida | `$1` é lido como variável do **terminal**, onde não existe: vale vazio, daí `[]` |
| 3. Execução | `grep -r "" . olá`: o padrão vazio (o padrão é o texto procurado) corresponde a **todas** as linhas, e `olá` é tomado por um nome de arquivo, que não existe |

Um alias não tem **`$1`**: ele não tem parâmetros próprios. É preciso uma função.

### A função: `$1`, `"$@"` e `"$#"`

Uma **função** agrupa comandos sob um nome; ela recebe seus argumentos em `$1` (o primeiro), `$2` (o segundo) etc. (ver [as funções do Bash](/?c=langages&s=bash&p=fonctions)). Digitada no terminal, ela se escreve em várias linhas: o Bash mostra `>` enquanto as chaves não forem fechadas.

```bash
# primeiro removemos o alias de mesmo nome (ver a explicação sob este bloco)
unalias busca
# busca() declara a função; as chaves { } envolvem os seus comandos
busca() {
    # $1 vale aqui o primeiro argumento da função: a palavra procurada
    grep -r "$1" .
}
# executa a função com a palavra olá
busca olá
```

```text
./a.txt:olá
./meu arquivo.txt:olá mundo
```

Desta vez, a linha `grep -r "olá" .` é executada como previsto. O `unalias` do início não é decorativo: enquanto o alias `busca` existir, o Bash também o desenvolve na linha `busca() {` (é uma palavra na primeira posição), e a declaração da função falha com `syntax error near unexpected token`. **Remove-se sempre um alias antes de declarar uma função de mesmo nome.** Duas outras escritas servem para repassar tudo :

| Escrita | Significado |
|---|---|
| `$1`, `$2`... | O primeiro, o segundo... argumento recebido |
| `"$@"` | **Todos** os argumentos, cada um mantido como uma palavra separada, mesmo que contenha espaços |
| `"$#"` | O **número** de argumentos recebidos |

A diferença das aspas em volta de `$@` aparece com um nome de arquivo que contém um espaço. `printf` mostra um texto segundo um modelo: aqui `[%s]` é repetido para cada argumento, e `\n` passa para a linha seguinte.

```bash
# resumir() mostra o número de argumentos, depois cada um entre colchetes
resumir() {
    # "$#": número de argumentos recebidos
    echo "$# argumentos"
    # "$@": cada argumento continua sendo uma palavra inteira
    printf '[%s]\n' "$@"
}
# ruim() faz o mesmo, mas $@ NÃO tem aspas
ruim() {
    # sem aspas, o Bash corta o conteúdo a cada espaço
    printf '[%s]\n' $@
}
# três argumentos, entre eles "meu arquivo.txt", que contém um espaço
resumir a "meu arquivo.txt" c
# os mesmos argumentos com a versão sem aspas
ruim a "meu arquivo.txt" c
```

```text
3 argumentos
[a]
[meu arquivo.txt]
[c]
[a]
[meu]
[arquivo.txt]
[c]
```

Sem aspas, « meu arquivo.txt » é cortado em **duas** palavras, e o comando que as recebe procurará dois arquivos que não existem. É por isso que se escreve quase sempre `"$@"`, nunca `$@` puro (ver [as variáveis especiais](/?c=langages&s=bash&p=scripts-et-shebang#os-argumentos-de-um-script) e [a ordem das expansões](/?c=langages&s=bash&p=architecture-dun-shell#a-ordem-precisa-das-expansoes)).

Por fim, `"$#"` permite recusar uma chamada incompleta. `if` testa uma condição (ver [as condições](/?c=langages&s=bash&p=conditions)), `-lt` significa « menor que », `return 1` termina a função com o código 1 (um código diferente de zero sinaliza uma falha), e `${2:-.}` vale o segundo argumento se ele for dado, senão o ponto.

```bash
# busca2(): procura uma palavra, em uma pasta dada ou, na falta dela, na pasta atual
busca2() {
    # se o número de argumentos for menor que 1, o comando está incompleto
    if [ "$#" -lt 1 ]; then
        # mostra o modo de uso, depois sai da função com o código de falha 1
        echo "uso: busca2 PADRÃO [PASTA]"
        return 1
    fi
    # -n acrescenta o número da linha; "${2:-.}": a pasta dada, senão o ponto
    grep -rn "$1" "${2:-.}"
}
# chamada sem argumento: o modo de uso aparece
busca2
# chamada com uma palavra: procura na pasta atual
busca2 tchau
# chamada com uma palavra e uma pasta: procura somente em sub
busca2 olá sub
```

```text
uso: busca2 PADRÃO [PASTA]
./sub/b.txt:1:tchau
```

A última chamada não mostra nada: `olá` não aparece em `sub`, e então `grep` termina com o código de saída 1, o de uma falha (ver [os códigos de saída](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-saida-exit)).

| | Alias | Função |
|---|---|---|
| Dar outro nome a um comando | Sim | Sim |
| Argumentos acrescentados **ao fim** | Sim, automaticamente | Sim, com `"$@"` |
| Colocar um argumento **no meio** (`$1`) | **Não** | Sim |
| Contar os argumentos, testar com `if` | Não | Sim (`"$#"`, `if`) |
| Vários comandos em sequência | Possível, mas ilegível | Sim, um por linha |
| Remove-se com | `unalias nome` | `unset -f nome` (`unset` desfaz um nome, `-f` designa uma função) |
| Encontra-se com | `alias` | `type nome` (mostra o que é `nome`, ver o [nível 4](#nivel-4-contorno-e-convivencia)) |

Uma função digitada no terminal também vive apenas na sessão: para guardá-la, coloca-se em `~/.bashrc` ou em um arquivo carregado por ele (ver [o nível 5](#nivel-5-organizar-seus-atalhos)).

## Nível 3: os alias em um script

Um **script** é um arquivo de texto que contém comandos, executados um após o outro (ver [escrever e executar um script](/?c=langages&s=bash&p=scripts-et-shebang)). Aqui ele é executado com `bash nome.sh`, o que inicia um **novo** Bash que lê o arquivo. Como esse Bash é iniciado diretamente, a primeira linha especial do arquivo, o [shebang](/?c=langages&s=bash&p=scripts-et-shebang#o-shebang), não é necessária nos nossos exemplos.

### Por padrão, um script ignora os alias

Um **shell interativo** é um shell que espera os seus comandos digitados no teclado em um terminal; um shell **não interativo** é um shell que lê um script. Os alias só são expandidos, por padrão, no primeiro. Duas consequências :

```bash
# --- conteúdo de sem-opcao.sh ---
# alias: cria o alias saudar, que troca esta palavra por « echo olá »
alias saudar='echo olá'
# usa o alias na linha seguinte
saudar mundo
# esta linha prova que o script continua apesar do erro
echo "fim do script"
```

```bash
# executa o script em um novo Bash não interativo
bash sem-opcao.sh
```

```text
sem-opcao.sh: line 4: saudar: command not found
fim do script
```

Mesmo quando o alias é definido **no script**, ele não é expandido: o Bash procura um comando chamado `saudar`. E um alias criado no seu terminal não existe no script, que é outro **processo** (um programa em execução, ver [o gerenciamento de processos](/?c=langages&s=bash&p=gestion-des-processus)) :

```bash
# --- conteúdo de usa-alias.sh ---
# este script não criou o alias saudar: ele tenta usar o do terminal
saudar você
```

```bash
# no terminal: o alias existe para o terminal
alias saudar='echo olá'
# o terminal o expande
saudar mundo
# o script, por sua vez, é outro Bash: o alias não está lá
bash usa-alias.sh
```

```text
olá mundo
usa-alias.sh: line 2: saudar: command not found
```

### Ativar os alias: `shopt -s expand_aliases`

`shopt` (do inglês *shell option*) ativa ou desativa uma opção do Bash ([documentação de `shopt`](https://www.gnu.org/software/bash/manual/html_node/The-Shopt-Builtin.html)): `-s` a ativa (*set*, « definir »), `-u` a desativa (*unset*, « desfazer »), e o seu nome sozinho mostra o estado dela. A opção `expand_aliases` está « desativada » em um script (« ativada » em um terminal).

```bash
# --- conteúdo de com-opcao.sh ---
# shopt -s: ativa (set) a opção expand_aliases, que permite os alias em um script
shopt -s expand_aliases
# cria o alias saudar
alias saudar='echo olá'
# usa o alias na linha seguinte
saudar mundo
# mostra uma mensagem de fim
echo "fim do script"
```

```bash
# executa o script
bash com-opcao.sh
# mostra o estado da opção em um Bash não interativo (-c: executar este texto)
bash --norc -c 'shopt expand_aliases'
```

```text
olá mundo
fim do script
expand_aliases      	off
```

### A armadilha da linha seguinte

Bash lê um **comando completo**: pelo menos uma linha inteira, e todas as linhas de um bloco (`{ }`, `if`, laço, corpo de função) antes de executar a primeira. Ora, a expansão de um alias acontece **na leitura**, não na execução. Consequência: um alias só existe a partir da **linha seguinte** lida. Em um terminal, cada linha é lida quando você aperta Enter, então o problema não aparece; em um script, ele aparece.

```bash
# --- conteúdo de mesma-linha.sh ---
# autoriza os alias neste script
shopt -s expand_aliases
# definição E uso na mesma linha: separados por um ponto e vírgula
alias saudar='echo olá'; saudar mundo
# mostra uma mensagem de fim
echo "fim do script"
```

```bash
# --- conteúdo de bloco.sh ---
# autoriza os alias neste script
shopt -s expand_aliases
# as chaves { } formam um bloco: o Bash lê o bloco inteiro antes de executar uma linha dele
{
    # definição do alias, dentro do bloco
    alias saudar='echo olá'
    # uso no mesmo bloco: o alias é desconhecido aqui
    saudar mundo
}
# uso depois do bloco: o bloco foi executado, o alias existe
saudar de novo
```

```bash
# --- conteúdo de funcao-antes.sh ---
# autoriza os alias neste script
shopt -s expand_aliases
# a função dizer é LIDA aqui, antes do alias: saudar continua sendo uma palavra comum
dizer() { saudar você; }
# o alias é criado depois da leitura da função
alias saudar='echo olá'
# chamada da função: ela procura um comando saudar, e não encontra nada
dizer
```

```bash
# --- conteúdo de funcao-depois.sh ---
# autoriza os alias neste script
shopt -s expand_aliases
# o alias é criado primeiro
alias saudar='echo olá'
# a função dizer é lida agora: saudar é substituído por « echo olá »
dizer() { saudar você; }
# chamada da função: ela mostra olá você
dizer
```

```bash
# executa cada um dos quatro scripts
bash mesma-linha.sh
bash bloco.sh
bash funcao-antes.sh
bash funcao-depois.sh
```

```text
mesma-linha.sh: line 4: saudar: command not found
fim do script
bloco.sh: line 8: saudar: command not found
olá de novo
funcao-antes.sh: line 4: saudar: command not found
olá você
```

| Situação | Resultado |
|---|---|
| Definição e uso em **duas linhas** consecutivas | Funciona (com `expand_aliases` em um script) |
| Definição e uso na **mesma linha** (`;`) | Falha: o alias ainda não existe na leitura |
| Definição e uso **no mesmo bloco** `{ }` | Falha; o uso **depois** do bloco funciona |
| Função lida **antes** do alias | Falha na chamada, mesmo que o alias exista naquele momento |
| Função lida **depois** do alias | Funciona |

Repare na linha 4 da mensagem de `funcao-antes.sh`: é a linha onde o **corpo da função** foi lido, não a da chamada.

Um arquivo de atalhos carregado por `source` é uma exceção, pois só é lido quando `source` é executado, portanto depois de `shopt` :

```bash
# --- conteúdo de atalhos.sh ---
# arquivo de atalhos: contém apenas a definição de um alias
alias saudar='echo olá'
```

```bash
# --- conteúdo de carrega-com.sh ---
# autoriza os alias neste script
shopt -s expand_aliases
# source lê o arquivo atalhos.sh e executa as suas linhas neste script
source ./atalhos.sh
# o alias criado pelo arquivo é utilizável a partir daqui
saudar mundo
```

```bash
# executa o script: mostra « olá mundo »
bash carrega-com.sh
```

### A solução recomendada: uma função

Uma função não depende de nenhuma opção, de nenhuma ordem de leitura: ela funciona igual em um terminal e em um script.

```bash
# --- conteúdo de funcao.sh ---
# uma função não precisa de nenhuma opção: ela funciona em um script como no terminal
saudar() {
    # echo mostra o seu texto; "$@" repassa todos os argumentos recebidos por saudar
    echo olá "$@"
}
# chamada da função com um argumento
saudar mundo
```

```bash
# executa o script: mostra « olá mundo »
bash funcao.sh
```

Em um script, **não se usa alias**: escreve-se o comando completo, ou uma função.

## Nível 4: contorno e convivência

### Quem responde quando se digita um nome?

O mesmo nome pode designar um alias, uma função, um comando interno (*builtin*, um comando embutido no próprio Bash, como `cd`) e um programa (um arquivo executável, como `/usr/bin/date`, encontrado graças ao [`$PATH`](/?c=langages&s=bash&p=variables-denvironnement#path-como-o-shell-encontra-um-comando)). O Bash escolhe segundo uma ordem fixa :

| Prioridade | Quem responde | Exemplo |
|---|---|---|
| 1 (a mais forte) | Um **alias** | `alias ll='ls -la'` |
| 2 | Uma **função** | `busca() { ... }` |
| 3 | Um **comando interno** | `cd`, `echo`, `type` |
| 4 (a mais fraca) | Um **programa** | `/usr/bin/date` |

O comando `type -a nome` (*type*, « de que tipo é este nome? »; com `command` e `builtin`, ele é descrito em [os comandos internos do Bash](https://www.gnu.org/software/bash/manual/html_node/Bash-Builtins.html)) lista **todas** as respostas possíveis, na ordem. Vejamos com `date`, que é um programa, ao qual acrescentamos uma função e depois um alias de mesmo nome :

```bash
# o nome date é, por enquanto, apenas um programa
type -a date
# uma função chamada date
date() { echo "date (função)"; }
# um alias chamado date
alias date='echo "date (alias)"'
# as três respostas, da mais prioritária à menos prioritária
type -a date
# quem responde quando se digita o nome?
date
```

```text
date is /usr/bin/date
date is aliased to `echo "date (alias)"'
date is a function
date ()
{
    echo "date (função)"
}
date is /usr/bin/date
date (alias)
```

O primeiro `type -a` encontra somente o programa; o segundo mostra o alias, depois a função (com o seu código) e depois o programa; e quem responde é o **alias**. Os termos `is`, `aliased to` e `a function` são os de um sistema em inglês, como as mensagens do Bash. Para um nome de comando interno, `type -a echo` mostra primeiro `echo is a shell builtin`, depois o caminho do programa `echo`. Outra forma útil: `type -t nome` (*type*, opção `-t`) mostra apenas uma palavra entre `alias`, `function`, `builtin` ou `file`, e nada se o nome for desconhecido (código de saída 1).

### Contornar um alias ou uma função

```bash
# o nome date continua designando o alias e a função criados acima
# \date: a barra invertida impede a expansão do alias, a função responde
\date
# command date: ignora o alias E a função, executa o comando interno ou o programa
command date +%Y
# unalias date: remove o alias; a função responde de novo
unalias date
date
# unset -f date: remove a função; o programa responde de novo
unset -f date
command date +%Y
```

```text
date (função)
2026
date (função)
2026
```

O número `2026` é o ano em curso no momento do teste. `+%Y` é o argumento que pede a `date` para mostrar somente o ano.

| Eu quero | Escrita | O que é ignorado |
|---|---|---|
| Passar por cima do alias | `\nome`, `"nome"` ou `'nome'` | Somente o alias: uma **função** de mesmo nome responde |
| Passar por cima de alias **e** função | `command nome` | Alias e funções: o comando interno ou o programa responde |
| Forçar um comando interno | `builtin nome` | Alias, funções e programas |
| Remover o alias da sessão | `unalias nome` | Nada: o alias desaparece até a próxima sessão |
| Remover a função da sessão | `unset -f nome` | Nada: a função desaparece até a próxima sessão |

Por que `\nome` funciona? O Bash só procura um alias para uma palavra escrita **sem nenhuma parte protegida**: assim que a palavra contém uma barra invertida ou aspas, ela deixa de ser considerada um alias.

### Um alias que se chama a si mesmo: sem laço

Um alias pode conter o nome que ele substitui, o que é muito comum: `alias ls='ls --color=auto'` (`--color=auto` colore os nomes somente se o resultado for exibido em um terminal). Poderíamos temer um laço infinito: `ls` vira `ls --color=auto`, cujo primeiro termo `ls` volta a ser `ls --color=auto`, etc. Ele não acontece: **uma palavra igual ao alias que está sendo expandido não é expandida uma segunda vez**. O segundo `ls` designa, portanto, o comando real.

```bash
# o alias ls acrescenta --color=auto ao comando ls real
alias ls='ls --color=auto'
# mostra a definição: o texto contém a palavra ls
type ls
# dois alias que se remetem um ao outro: a para b, b para a
alias a='b'
alias b='a'
# a vira b, b vira a, e a não é expandido uma segunda vez
a
```

```text
ls is aliased to `ls --color=auto'
bash: a: command not found
```

O segundo caso também não é um laço: o Bash para e procura um comando real chamado `a`, que não existe. O alias inútil `alias a='b'` serve apenas para ilustrar: nunca se faz isso.

### O alias encadeado: o espaço final

Por padrão, somente a **primeira palavra** da linha é considerada um alias. Se o texto de um alias **termina com um espaço**, a palavra seguinte também é considerada. Eis um exemplo sem perigo :

```bash
# dois alias: escrever designa echo (sem espaço final), mundo é um texto de substituição
alias escrever='echo'
alias mundo='todo mundo'
# a palavra mundo não é a primeira: ela não é expandida, aparece tal como está
escrever mundo
# redefinimos escrever com um espaço NO FIM do texto
alias escrever='echo '
# a palavra que segue escrever agora é considerada um alias: mundo é expandido
escrever mundo
```

```text
mundo
todo mundo
```

O uso mais frequente é `alias sudo='sudo '`. `sudo` é um comando que executa outro comando com os privilégios de administrador ([documentação oficial de `sudo`](https://www.sudo.ws/docs/man/sudo.man/)). Sem o espaço final, `sudo ll` falha (« `ll`: comando não encontrado »), porque a palavra `ll`, que segue `sudo`, não é uma primeira palavra; com ele, `ll` é expandido em `ls -la` antes da execução.

### Onde os alias não servem para nada

Um alias existe somente no shell interativo que o criou. Os programas que executam outros comandos sem passar por esse shell não os enxergam. Exemplo com `xargs`, um programa que lê palavras e as acrescenta como argumentos de um comando :

```bash
# o alias saudar existe para o terminal
alias saudar='echo olá'
# xargs procura um PROGRAMA chamado saudar: ele não conhece os alias do Bash
echo você | xargs saudar
```

```text
xargs: saudar: No such file or directory
```

Uma **função** tem o mesmo defeito com `xargs`: ela também não é um programa. `xargs` só executa programas de verdade.

## Nível 5: organizar seus atalhos

### Um arquivo `~/.bash_aliases`

Quando há alguns atalhos, `~/.bashrc` fica ilegível. Guardam-se eles em um arquivo à parte, `~/.bash_aliases`, que `~/.bashrc` carrega. O nome é uma **convenção**: o Bash não o lê por conta própria; é o `~/.bashrc` que deve conter as linhas abaixo. Alguns sistemas já trazem essas linhas no `~/.bashrc` padrão: procure com `grep bash_aliases ~/.bashrc` antes de acrescentar (ver [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-buscar-texto)).

```bash
# --- a acrescentar em ~/.bashrc ---
# [ -f arquivo ] é verdadeiro se este arquivo existir e for um arquivo comum
if [ -f ~/.bash_aliases ]; then
    # o ponto lê o arquivo no shell atual, como source
    . ~/.bash_aliases
# fi encerra o if
fi
```

O teste `[ -f ... ]` evita um erro se o arquivo ainda não existir. Ver [as condições](/?c=langages&s=bash&p=conditions) para `if` e `[ ]`.

```bash
# --- conteúdo de ~/.bash_aliases ---
# atalhos simples: um nome curto para um comando
alias ll='ls -la'
# ls -lt: detalhe de cada arquivo, do mais recente ao mais antigo
alias lt='ls -lt'
# --color=auto: colore os nomes somente se a saída for exibida em um terminal
alias ls='ls --color=auto'
# o espaço final permite expandir o alias da palavra seguinte (ver o nível 4)
alias sudo='sudo '
# busca o padrão dado como primeiro argumento na pasta atual
busca() {
    grep -rn "$1" .
}
```

Os alias convivem ali com as funções (nível 2): o arquivo é apenas uma sequência de comandos, lida por `source`. Para aplicar uma modificação sem reabrir o terminal: `source ~/.bash_aliases`.

| Arquivo | Conteúdo | Por quê |
|---|---|---|
| `~/.bashrc` | O bloco de carregamento acima, e as configurações do ambiente (ver [as variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement)) | Continua curto e legível |
| `~/.bash_aliases` | Todos os alias e funções pessoais | Um único lugar para reler, guardar em backup e copiar para outra máquina |
| Um script compartilhado | Nenhum atalho pessoal | Ele deve funcionar sem a sua configuração |

Com um `~/.bash_aliases` que contém esses alias, observa-se :

| Caso observado | Resultado |
|---|---|
| O arquivo existe e `~/.bashrc` contém o bloco `if` | Os alias estão presentes em cada novo terminal (`alias` os lista) |
| O arquivo não existe, com o teste `[ -f ... ]` | O terminal inicia sem nenhuma mensagem |
| O arquivo não existe, com apenas `. ~/.bash_aliases` | Uma mensagem `No such file or directory` aparece a cada início |
| Uma linha acrescentada ao arquivo depois do início | Desconhecida enquanto não se executar `source ~/.bash_aliases` |

### Diagnosticar: `bash --norc`

Quando um comando se comporta de forma estranha, a causa às vezes é um dos seus alias ou das suas funções. `bash --norc` inicia um novo Bash **interativo** que **não lê** `~/.bashrc`: nenhum dos seus atalhos existe ali (ver [o manual do Bash, seção « Invoking Bash »](https://www.gnu.org/software/bash/manual/html_node/Invoking-Bash.html)).

```bash
# inicia um Bash sem ler ~/.bashrc; o prompt, o texto que precede o que você digita,
# pode mudar de aparência
bash --norc
# a lista está vazia: nenhum alias foi carregado
alias
# o alias ll de ~/.bash_aliases não existe aqui
ll
# exit fecha este Bash e leva você de volta à sessão anterior, com os seus atalhos
exit
```

```text
bash: ll: command not found
```

Se o comportamento voltar ao normal em `bash --norc`, o culpado está nos seus atalhos: retire-os um a um para descobrir qual é.

## Síntese dos níveis

| Nível | Necessidade | Ferramenta | Limite |
|---|---|---|---|
| 1 | Outro nome para um comando | `alias ll='ls -la'`, `unalias`, `~/.bashrc` | Um texto colado antes dos argumentos; sem `$1`; perdido ao fechar o terminal sem `~/.bashrc` |
| 2 | Um argumento colocado no meio, um teste sobre o número de argumentos | Função com `"$1"`, `"$@"`, `"$#"` | Mais longa para escrever; restrita à sessão sem arquivo de carregamento |
| 3 | Um atalho em um script | `shopt -s expand_aliases`, ou melhor, uma função | Um alias só existe na linha seguinte; um alias do terminal fica ausente do script |
| 4 | Conviver sem surpresas | `type -a`, `\nome`, `command nome`, `unalias`, espaço final | `\nome` deixa passar uma função; `xargs` e os scripts ignoram os alias |
| 5 | Organizar e diagnosticar | `~/.bash_aliases` carregado por `~/.bashrc`, `bash --norc` | Um atalho pessoal não existe nas outras máquinas |

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| `alias busca='grep -r "$1" .'` | `$1` não existe em um alias: vale vazio, e a palavra digitada é colada no fim | Uma função com `"$1"` |
| `$@` sem aspas | Um nome com espaço é cortado em várias palavras | `"$@"` |
| Alias em um script sem `shopt` | Os alias são ignorados em um shell não interativo | Uma função |
| Alias definido e usado na mesma linha ou no mesmo bloco `{ }` | O alias só existe a partir da linha lida em seguida | Definir em uma linha, usar mais adiante, ou usar uma função |
| Declarar uma função com o mesmo nome de um alias existente | O alias é expandido na declaração: erro de sintaxe | `unalias nome` antes da função |
| Função lida antes do alias que ela usa | A palavra continua comum: a expansão acontece na leitura do corpo | Preferir o comando completo dentro de uma função |
| Aspas duplas em volta do texto de um alias | As variáveis são lidas na criação, o valor fica fixado | Aspas simples |
| Acreditar que `\nome` contorna tudo | Ele só contorna o alias: uma função de mesmo nome responde | `command nome` |
| `alias sudo='sudo '` esquecido | `sudo ll` falha: `ll` não é uma primeira palavra | O espaço final no texto do alias |
| Redefinir um comando perigoso (`rm`, `cp`, `mv`) acrescentando opções | Acostuma-se a uma confirmação que não existe nas outras máquinas | Escolher um nome novo (`apagar`) |
| Um alias (ou uma função) depois de `xargs` | `xargs` executa programas, não alias do Bash | Um script ou o próprio programa |
| Alias digitado no terminal | Perdido ao fechar a janela | Escrevê-lo em `~/.bash_aliases`, carregado por `~/.bashrc` |
| Modificar `~/.bash_aliases` sem recarregar | A sessão atual mantém o estado antigo | `source ~/.bash_aliases` |
| `. ~/.bash_aliases` sem o teste `[ -f ... ]` | Um erro a cada início se o arquivo faltar | `if [ -f ~/.bash_aliases ]; then ... fi` |
| Nome de alias igual a um programa (`date`) | O programa fica mascarado sem aviso | `type -a nome` antes de escolher |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Um alias para um simples renomeio ou opções fixas; uma função assim que um argumento deve ficar em outro lugar que não o fim | Cada ferramenta permanece no seu domínio |
| Aspas simples em volta do texto de um alias | As variáveis são lidas no uso |
| `"$@"` com aspas para repassar tudo, `"$#"` para contar | Os nomes com espaços não são cortados |
| Escrever o comando completo ou uma função em um script | O script funciona em todas as máquinas, com ou sem os seus alias |
| `type -a nome` antes de criar um atalho | Nenhuma máscara involuntária |
| `command nome` para chegar ao comando real | Passa por cima de alias e função |
| Guardar todos os atalhos em `~/.bash_aliases`, carregado por `~/.bashrc` com um teste `[ -f ... ]` | Um `~/.bashrc` curto, atalhos fáceis de guardar em backup |
| `bash --norc` quando um comportamento parecer estranho | Afastar os atalhos como causa |
| Manter poucos atalhos, com nomes sem ambiguidade | Eles são lembrados, e não mascaram um comando útil |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um **alias** é um **texto** substituído à primeira palavra digitada, **antes** da análise da linha: `alias ll='ls -la'` cria, `alias` lista, `unalias ll` remove, e `~/.bashrc` o torna permanente. Os argumentos digitados chegam **no fim**: um alias não tem `$1`, por isso `alias busca='grep -r "$1" .'` falha. Uma **função** recebe `$1`, `"$@"` (todos os argumentos, uma palavra cada) e `"$#"` (o número deles). Um script não tem os alias por padrão; `shopt -s expand_aliases` os ativa, mas o alias só existe na linha seguinte, fora do bloco ou da função que o define: prefere-se uma função. Ordem de resposta: alias, depois função, depois comando interno, depois programa; `type -a nome` os lista. `\nome` contorna somente o alias, `command nome` contorna alias e função. Um alias que se chama a si mesmo não entra em laço, pois a palavra igual não é expandida duas vezes. Um espaço final (`alias sudo='sudo '`) faz expandir a palavra seguinte. Guardam-se os atalhos em `~/.bash_aliases`, carregado por `~/.bashrc` com `[ -f ... ]`, e `bash --norc` os afasta para diagnosticar. |
| **Armadilhas a evitar** | `$1` em um alias; `$@` sem aspas; alias em script sem `shopt`; alias definido e usado na mesma linha ou no mesmo bloco; função declarada sem ter removido o alias de mesmo nome; função lida antes do seu alias; aspas duplas em volta de um alias; achar que `\nome` contorna uma função; esquecer o espaço final do `sudo`; redefinir `rm`, `cp` ou `mv`; alias depois de `xargs`; alias perdido ao fechar o terminal; arquivo de atalhos modificado e não recarregado; `. arquivo` sem teste de existência; nome de alias que mascara um programa. |
| **Boas práticas** | Alias para renomear, função quando um argumento fica em outro lugar que não o fim; aspas simples; `"$@"` e `"$#"`; comando completo ou função em um script; `type -a nome` antes de nomear; `command nome` para chegar ao comando real; atalhos em `~/.bash_aliases`; `bash --norc` para afastar os seus atalhos em um diagnóstico. |
