---
order: 8
---

# Alias avançados no Zsh

Um **alias** é um atalho: um nome curto que se digita no lugar de um comando mais longo. Este capítulo pressupõe que você sabe abrir um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) (a janela onde se digitam instruções pelo teclado) e executar nele um comando simples como `ls` (ver [os comandos básicos](/?c=langages&s=bash&p=commandes-de-base)). O **shell** é o programa que lê o que você digita no terminal e o executa; o deste capítulo é o [Zsh](/?c=langages&s=zsh&p=zsh). Um **comando** é uma instrução digitada no terminal (`ls`), um **argumento** é tudo o que se escreve depois do seu nome (`/tmp` em `ls /tmp`), e uma **opção** é um argumento que começa com um hífen (`-l`). A **sessão** é o período que vai da abertura da janela do terminal até o seu fechamento.

A mecânica dos alias é a mesma no [Bash](/?c=langages&s=bash&p=bash) e no Zsh. Tudo o que é idêntico é, portanto, resumido aqui em uma frase e remetido ao capítulo [Alias avançados no Bash](/?c=langages&s=bash&p=alias-avances); este capítulo detalha **o que difere ou se acrescenta no Zsh**, **em cinco níveis**, cada um apoiado no anterior:

| Nível | Necessidade | Ferramenta | Seção |
|---|---|---|---|
| 1 | Outro nome para um comando | `alias`, `unalias`, `~/.zshrc` | [Nível 1](#nivel-1-o-alias-simples) |
| 2 | Um comando que recebe argumentos no meio | Uma **função** (um grupo de comandos guardado sob um nome: `$1`, `"$@"`, `"$#"`) | [Nível 2](#nivel-2-alias-ou-funcao-com-argumentos) |
| 3 | Usar um atalho em um script | A opção `aliases` (ativa por padrão), ou melhor, uma função | [Nível 3](#nivel-3-os-alias-em-um-script) |
| 4 | Um atalho que age em qualquer lugar da linha, ou conforme a extensão de um arquivo | `alias -g` (alias globais), `alias -s` (alias de sufixo) | [Nível 4](#nivel-4-alias-globais-e-alias-de-sufixo) |
| 5 | Fazer conviver, organizar e diagnosticar | `\nome`, `command`, `whence -a`, `~/.zsh_aliases`, `zsh -f` | [Nível 5](#nivel-5-contorno-convivencia-e-organizacao) |

O mesmo assunto existe em outro shell: [os alias e atalhos de comandos no PowerShell](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes), em que o alias é bem mais limitado.

## O que é um alias no Zsh, e o que não muda

Como no Bash, um alias é um **texto de substituição**: o Zsh troca a palavra digitada pelo texto do alias **antes de analisar a linha**, ou seja, antes de dividi-la em palavras e de tratar as [variáveis](/?c=fondamentaux&s=bases-de-l-informatique&p=la-variable) (caixas com etiqueta que guardam um valor) e os [coringas](/?c=langages&s=bash&p=expansion-et-jokers) (padrões como `*.txt`, que o shell troca pelos nomes de arquivos correspondentes) (ver [o que é um alias no Bash](/?c=langages&s=bash&p=alias-avances#o-que-e-um-alias-no-bash)). Essa substituição se chama **expansão** do alias (em inglês *alias expansion*). O manual do Zsh a descreve em [sua seção « Aliasing »](https://zsh.sourceforge.io/Doc/Release/Shell-Grammar.html#Aliasing).

A tabela a seguir resume, para cada ponto, o que é verdadeiro de forma idêntica nos dois shells (verificado pela experiência) e o que difere. As diferenças estão detalhadas nos níveis indicados.

| Ponto | Bash | Zsh | Nível |
|---|---|---|---|
| O alias é um texto substituído antes da análise da linha | Sim | Sim, idêntico | Este nível |
| `$1` no texto de um alias | Ausente: vale vazio | Ausente, idêntico | [2](#nivel-2-alias-ou-funcao-com-argumentos) |
| Função de mesmo nome que um alias, escrita `nome() { ... }` | Erro de sintaxe | Erro, com uma mensagem mais explícita | [2](#nivel-2-alias-ou-funcao-com-argumentos) |
| `$@` sem aspas | Cortado em cada espaço, e os coringas são expandidos | **Não cortado**, coringas não expandidos | [2](#nivel-2-alias-ou-funcao-com-argumentos) |
| Alias definido em um script, depois usado | Ignorado, salvo com `shopt -s expand_aliases` | **Expandido**: a opção `aliases` está ativa em toda parte | [3](#nivel-3-os-alias-em-um-script) |
| Alias definido e usado na mesma linha ou no mesmo bloco | Ainda não existe | Idêntico | [3](#nivel-3-os-alias-em-um-script) |
| Alias que age em outro lugar que não a primeira palavra | Somente com o espaço final | Alias globais (`alias -g`) | [4](#nivel-4-alias-globais-e-alias-de-sufixo) |
| Executar um arquivo pela sua extensão | Não existe | Alias de sufixo (`alias -s`) | [4](#nivel-4-alias-globais-e-alias-de-sufixo) |
| Mostrar o que responde a um nome | `type -a nome` | `type -a nome` ou `whence -a nome` | [5](#nivel-5-contorno-convivencia-e-organizacao) |
| Arquivo de atalhos pessoais | `~/.bashrc`, `~/.bash_aliases` | `~/.zshrc`, `~/.zsh_aliases` | [5](#nivel-5-contorno-convivencia-e-organizacao) |

## Nível 1: o alias simples

A sintaxe é a do Bash: `alias nome='texto'` cria um alias, `alias` sozinho os lista, `unalias nome` remove um. As aspas simples em volta do texto também deixam as variáveis intactas até o uso do alias: a experiência do capítulo do Bash (ver [aspas simples ou duplas](/?c=langages&s=bash&p=alias-avances#aspas-simples-ou-duplas-quando-as-variaveis-sao-lidas)) dá, no Zsh, `1` com aspas duplas e `2` com aspas simples. O que muda é a **exibição** das listas.

Uma precaução antes de copiar os blocos deste capítulo para um terminal: eles trazem **comentários**, ou seja, textos que começam com `#` e que o shell ignora. Um Zsh que lê um script os ignora, mas um Zsh **interativo** só os reconhece se a opção `interactive_comments` estiver ativa (ver [o sistema de opções](/?c=langages&s=zsh&p=options-du-shell)); senão ele tenta executar um comando chamado `#` e responde `zsh: command not found: #`.

```zsh
# setopt ativa uma opção do shell: aqui, os comentários passam a ser aceitos
setopt interactive_comments
```

A primeira linha deste bloco é ela mesma um comentário: ela provoca o erro uma última vez, então basta digitar a segunda. Para que a opção fique ativa em cada sessão, acrescenta-se ao `~/.zshrc` (ver [o fim deste nível](#tornar-um-alias-permanente-zshrc)). Os blocos seguintes supõem a opção ativada.

```zsh
# alias nome='texto': cria o alias ll; o texto entre aspas simples é guardado tal como está
alias ll='ls -la'
# alias sem argumento: lista todos os alias da sessão, sob a forma nome='texto'
alias
# alias seguido de um nome: mostra a definição somente desse alias
alias ll
# alias -L: lista sob a forma de comandos completos, que se podem copiar para um arquivo
alias -L
# unalias remove o alias ll para a sessão atual
unalias ll
# ll não existe mais: o Zsh responde « command not found: ll » (comando não encontrado)
ll
```

Em uma sessão limpa (aberta com `zsh -f`, ver [o nível 5](#diagnosticar-zsh-f)), esses comandos mostram:

```text
ll='ls -la'
run-help=man
which-command=whence
ll='ls -la'
alias ll='ls -la'
alias run-help=man
alias which-command=whence
zsh: command not found: ll
```

A opção `-la` reúne `-l` (uma linha detalhada por arquivo) e `-a` (mostrar também os itens ocultos): ver [o comando `ls`](/?c=langages&s=bash&p=commandes-de-base#listar-um-diretorio-ls). Três diferenças com o Bash aparecem:

| Observação | Bash | Zsh |
|---|---|---|
| Forma de uma linha de `alias` | `alias ll='ls -la'` | `ll='ls -la'` (sem a palavra `alias`) |
| Forma reutilizável tal qual | A saída de `alias` | A saída de **`alias -L`**: `alias ll='ls -la'` |
| Alias presentes em uma sessão limpa | Nenhum | Dois, definidos pelo próprio Zsh: `run-help` (que designa `man`, o comando que mostra o manual de um comando, ver [`man`](/?c=langages&s=bash&p=commandes-de-base#obter-ajuda-man-e-help)) e `which-command` (que designa `whence`, ver o [nível 5](#nivel-5-contorno-convivencia-e-organizacao)) |

Os dois alias de partida variam conforme a configuração do sistema: alguns arquivos de configuração retiram um deles. A mensagem de erro depende do idioma do sistema. Quanto ao resto, os comandos de gestão são os do Bash:

| Comando | Efeito |
|---|---|
| `alias nome='texto'` | Cria ou substitui o alias `nome` |
| `alias` | Lista todos os alias (a continuação deste capítulo acrescenta `-r`, `-g`, `-s`, `-L`, `-m`) |
| `alias nome` | Mostra a definição de `nome`; não mostra nada e termina em falha se `nome` não for um alias |
| `unalias nome` | Remove o alias `nome`; mostra `no such hash table element: nome` se o alias não existir |
| `unalias -a` | Remove todos os alias da sessão, inclusive os do Zsh |

### Tornar um alias permanente: `~/.zshrc`

Um alias digitado no terminal fica **na memória**, na sessão. Para encontrá-lo a cada abertura, escreve-se no arquivo `~/.zshrc`, que o Zsh lê ao iniciar cada terminal interativo (ver [os arquivos de inicialização](/?c=langages&s=zsh&p=fichiers-de-demarrage)). O sinal `~` designa a sua pasta pessoal.

```zsh
# echo mostra o texto; >> (redirecionamento) o acrescenta ao fim do arquivo ~/.zshrc
echo "alias ll='ls -la'" >> ~/.zshrc
# source lê o arquivo e executa as suas linhas na sessão atual
# (não é preciso reabrir o terminal)
source ~/.zshrc
```

O redirecionamento `>>` é explicado em [redirecionamentos e pipes](/?c=langages&s=bash&p=redirections-et-pipes). Se você instalou o [Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh), o `~/.zshrc` já existe e contém outras linhas: acrescentam-se as suas **no fim** (ver o [nível 5](#os-alias-do-oh-my-zsh)).

## Nível 2: alias ou função com argumentos

A limitação é a mesma do Bash: um alias só consegue colar o seu texto antes dos argumentos digitados, não tem `$1` (ver [o nível 2 do capítulo Bash](/?c=langages&s=bash&p=alias-avances#nivel-2-alias-ou-funcao-com-argumentos)). Preparemos a mesma pasta de teste:

```zsh
# mkdir cria uma pasta; teste é a nossa pasta de trabalho
mkdir teste
# cd entra nela
cd teste
# cria uma subpasta chamada sub
mkdir sub
# echo mostra o seu texto; > o escreve no arquivo a.txt (criado se não existir)
echo "olá" > a.txt
# um nome de arquivo com espaço: ele nos será útil mais adiante
echo "olá mundo" > "meu arquivo.txt"
# um arquivo dentro da subpasta
echo "tchau" > sub/b.txt
```

Eis o alias que não funciona. `grep` procura um texto (ver [`grep`](/?c=langages&s=bash&p=traitement-de-texte#grep-buscar-texto)), `-r` o faz descer às subpastas, e o ponto `.` designa a pasta atual.

```zsh
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

A ordem dos arquivos pode variar de um sistema para outro. O resultado é o do Bash, e a explicação também (ver [o alias que não funciona](/?c=langages&s=bash&p=alias-avances#o-alias-que-nao-funciona)): a linha vira `grep -r "$1" . olá`, `$1` é lido como variável do terminal, onde não existe, e `olá` é tomado por um nome de arquivo. É preciso uma **função**.

### Declarar a função: duas escritas e uma armadilha de nome

Uma função agrupa comandos sob um nome; ela recebe os seus argumentos em `$1`, `$2`... (ver [as funções](/?c=langages&s=bash&p=fonctions)). O Zsh aceita as escritas do Bash e acrescenta uma:

| Escrita | Resultado no Zsh |
|---|---|
| `nome() { ... }` | Declara a função (a escrita do Bash) |
| `function nome { ... }` | Declara a função (a palavra `function`, sem parênteses) |
| `function nome() { ... }` | Declara a função (as duas juntas) |

As três escritas dão uma função idêntica. Eis a primeira, digitada no terminal em várias linhas (o Zsh mostra um prompt de continuação, ou seja, um pequeno texto no início de cada nova linha, enquanto a chave de fechamento faltar):

```zsh
# a palavra busca ainda é um alias: nós o removemos antes de declarar a função
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

E se esquecermos o `unalias`? Como no Bash, a palavra `busca` está na primeira posição: o Zsh também a expande na declaração. A diferença é a **mensagem**, mais explícita que o « syntax error » do Bash. Recriamos o alias para constatar isso, depois testamos a outra escrita:

```zsh
# recriamos o alias removido acima
alias busca='grep -r "$1" .'
# declaração de uma função de mesmo nome, em uma linha (; separa dois comandos)
busca() { grep -r "$1" . ; }
# a outra escrita: o nome não está na primeira posição, o alias não é expandido
function busca { grep -r "$1" . ; }
# type -a lista todas as respostas possíveis, da mais prioritária à menos prioritária
type -a busca
```

```text
zsh: defining function based on alias `busca'
zsh: parse error near `()'
busca is an alias for grep -r "$1" .
busca is a shell function
```

A declaração `busca() { ... }` falha com duas mensagens. A escrita `function busca { ... }` **funciona sem barulho**, mas é uma armadilha: o alias continua prioritário (ele aparece primeiro na lista de `type -a`), então digitar `busca` executa sempre o alias, nunca a função. **Remove-se, portanto, sempre o alias antes de declarar uma função de mesmo nome**, qualquer que seja a escrita. Arruma-se em seguida o terminal:

```zsh
# remove o alias e a função busca, para recomeçar com um terminal limpo
unalias busca
# unfunction remove uma função (a tabela abaixo dá o equivalente unset -f)
unfunction busca
```

### `$@` sem aspas: a armadilha do Bash não existe

No Bash, `$@` sem aspas corta em duas um nome de arquivo que contém um espaço (ver [a função: `$1`, `"$@"` e `"$#"`](/?c=langages&s=bash&p=alias-avances#a-funcao-1-e)). O Zsh se comporta de outra maneira. `printf` mostra um texto segundo um modelo: aqui `[%s]` é repetido para cada argumento, e `\n` passa para a linha seguinte.

```zsh
# resumir() mostra o número de argumentos, depois cada um entre colchetes
resumir() {
    # "$#": número de argumentos recebidos
    echo "$# argumentos"
    # "$@": cada argumento continua sendo uma palavra inteira
    printf '[%s]\n' "$@"
}
# ruim() faz o mesmo, mas $@ NÃO tem aspas
ruim() {
    # o Bash cortaria aqui a cada espaço; o Zsh não faz isso
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
[meu arquivo.txt]
[c]
```

As duas versões dão **três** palavras: o Zsh não corta o conteúdo de uma variável nos espaços (ver [a quebra de palavras no Zsh](/?c=langages&s=zsh&p=zsh#a-quebra-de-palavras-em-uma-variavel-sem-aspas)). As duas funções não são, porém, equivalentes. Com os argumentos `"*.txt"` (um coringa: o shell o trocaria pelos nomes de arquivos correspondentes) e `""` (um argumento vazio), na pasta `teste`:

| | Bash | Zsh |
|---|---|---|
| `printf '[%s]\n' "$@"` | `[*.txt]` depois `[]` | `[*.txt]` depois `[]` |
| `printf '[%s]\n' $@` | `[a.txt]` depois `[meu arquivo.txt]`: o coringa é expandido, o argumento vazio desaparece | `[*.txt]` somente: o coringa não é expandido, mas o argumento vazio desaparece |

O Zsh é mais seguro que o Bash nesse ponto, mas o **argumento vazio desaparece mesmo assim** sem aspas. Um script escrito para o Zsh também pode ser executado pelo Bash: escreve-se, portanto, `"$@"` em todos os lugares, com aspas.

`"$#"` (o número de argumentos) funciona como no Bash. O Zsh acrescenta `$argv`, um sinônimo de `$@`: `$argv[1]` vale `$1` e `$#argv` vale `$#`. O último exemplo recusa uma chamada sem argumento. `if` testa uma condição (ver [as condições](/?c=langages&s=bash&p=conditions)), `-lt` significa « menor que », `return 1` termina a função com o código de falha 1, e `${2:-.}` vale o segundo argumento se for dado, senão o ponto.

```zsh
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

A última chamada não mostra nada: `olá` não aparece em `sub`, e o `grep` termina com o código 1 (falha). Eis como gerenciar as próprias funções no Zsh:

| Eu quero | Escrita | Observação |
|---|---|---|
| Saber se `nome` é uma função | `type nome` | Mostra `nome is a shell function` |
| Ler o código da função | `whence -f nome`, `which nome` ou `functions nome` | As três mostram o corpo da função |
| Remover a função | `unfunction nome` ou `unset -f nome` (`unset` desfaz um nome, `-f` designa uma função) | Desaparece até a próxima sessão |
| Guardá-la para sempre | Colocá-la em `~/.zshrc` ou em um arquivo carregado por ele | Ver o [nível 5](#organizar-seus-atalhos) |

## Nível 3: os alias em um script

Um **script** é um arquivo de texto que contém comandos, executados um após o outro (ver [escrever e executar um script](/?c=langages&s=bash&p=scripts-et-shebang)). Ele é executado aqui por `zsh nome.zsh`, o que inicia um **novo** Zsh que lê o arquivo. Um **shell interativo** é um shell que espera os seus comandos digitados no teclado em um terminal; um shell **não interativo** é um shell que lê um script.

### Por padrão, um script expande os alias

Esta é a grande diferença com o Bash, em que os alias só são expandidos em um shell interativo. Uma **opção** do shell é uma configuração que muda o seu comportamento (ver [o sistema de opções](/?c=langages&s=zsh&p=options-du-shell)). A opção que controla os alias se chama `aliases` e está **ativa em todos os Zsh**, interativos ou não.

```zsh
# --- conteúdo de direto.zsh ---
# alias: cria o alias saudar, que troca esta palavra por « echo olá »
alias saudar='echo olá'
# usa o alias na linha seguinte
saudar mundo
# esta linha mostra uma mensagem de fim
echo "fim do script"
```

```zsh
# executa o script em um novo Zsh não interativo
zsh direto.zsh
```

```text
olá mundo
fim do script
```

Nenhuma configuração é necessária (o Bash exige `shopt -s expand_aliases`, ver [os alias em um script no Bash](/?c=langages&s=bash&p=alias-avances#nivel-3-os-alias-em-um-script)). Para consultar o estado de uma opção, `[[ -o nome ]]` é verdadeiro se a opção estiver ativa (os colchetes duplos `[[ ]]` testam uma condição). `unsetopt` desativa uma opção, `setopt` a ativa (ver [o sistema de opções](/?c=langages&s=zsh&p=options-du-shell)), e `setopt no_aliases` é outra escrita de `unsetopt aliases`: o prefixo `no_` inverte o sentido de uma opção.

```zsh
# --- conteúdo de sem-alias.zsh ---
# desativa a opção aliases: nenhum alias é mais expandido a partir daqui
setopt no_aliases
# o comando alias continua funcionando: o alias é criado...
alias saudar='echo olá'
# ... mas a palavra saudar não é mais substituída: o Zsh procura um comando desse nome
saudar mundo
# esta linha prova que o script continua apesar do erro
echo "fim do script"
```

```zsh
# --- conteúdo de estado.zsh ---
# [[ -o aliases ]] é verdadeiro se a opção aliases estiver ativa
if [[ -o aliases ]]; then echo "aliases: ativo"; else echo "aliases: inativo"; fi
```

```zsh
# executa os dois scripts
zsh sem-alias.zsh
zsh estado.zsh
```

```text
sem-alias.zsh:6: command not found: saudar
fim do script
aliases: ativo
```

A primeira mensagem nomeia o arquivo e o número da linha (`:6`, as linhas de comentário contam). Um script executado diretamente (com uma primeira linha `#!/usr/bin/env zsh`, o [shebang](/?c=langages&s=bash&p=scripts-et-shebang#o-shebang)) se comporta da mesma forma.

### O alias do terminal está ausente do script

Mesmo com a opção `aliases` ativa, um alias criado no seu terminal não existe no script, que é outro **processo** (um programa em execução, ver [o gerenciamento de processos](/?c=langages&s=bash&p=gestion-des-processus)):

```zsh
# --- conteúdo de usa-alias.zsh ---
# este script não criou o alias saudar: ele tenta usar o do terminal
saudar você
```

```zsh
# no terminal: o alias existe para o terminal
alias saudar='echo olá'
# o terminal o expande
saudar mundo
# o script, por sua vez, é outro Zsh: o alias não está lá
zsh usa-alias.zsh
```

```text
olá mundo
usa-alias.zsh:2: command not found: saudar
```

O `:2` é o número da linha do arquivo, contando a linha de comentário.

### E os alias de `~/.zshrc`?

Um alias escrito em `~/.zshrc` é um « alias do terminal »: `~/.zshrc` só é lido por um shell interativo, um script não o lê. O capítulo sobre o PowerShell afirma isso em [sua tabela de comparação](/?c=langages&s=powershell&p=alias-et-raccourcis-de-commandes#e-no-bash-e-no-zsh); a experiência confirma, com uma **nuance**: `~/.zshenv`, por sua vez, é lido por **todos** os Zsh, inclusive os scripts (ver [os quatro arquivos de inicialização](/?c=langages&s=zsh&p=fichiers-de-demarrage)). Para não mexer no seu verdadeiro `~/.zshrc`, criamos uma pasta de configuração de teste. A variável `ZDOTDIR` indica ao Zsh a pasta onde procurar os seus arquivos de inicialização, no lugar da sua pasta pessoal; escrita diante de um comando (`ZDOTDIR=... comando`), ela vale somente para esse comando. `$PWD` é a variável que contém a pasta atual, e a opção `-d` pede ao Zsh que não leia os arquivos de inicialização do sistema (ver [o diagnóstico](#diagnosticar-zsh-f)).

```zsh
# cria a pasta de configuração de teste
mkdir config
# um alias no .zshrc dessa configuração
echo "alias dozshrc='echo alias do zshrc'" > config/.zshrc
# um alias no .zshenv dessa configuração
echo "alias dozshenv='echo alias do zshenv'" > config/.zshenv
# um script que usa os dois alias (printf escreve uma palavra por linha)
printf '%s\n' dozshrc dozshenv > usa.zsh
# script executado normalmente (não interativo), com essa configuração
ZDOTDIR=$PWD/config zsh usa.zsh
# o mesmo script lido por um Zsh interativo (-i), sem os arquivos do sistema (-d)
ZDOTDIR=$PWD/config zsh -d -i usa.zsh
```

```text
usa.zsh:1: command not found: dozshrc
alias do zshenv
alias do zshrc
alias do zshenv
```

| Arquivo de inicialização | Lido por `zsh script.zsh` | Lido por um Zsh interativo |
|---|---|---|
| `~/.zshenv` | Sim: seus alias são visíveis ao script | Sim |
| `~/.zshrc` | **Não**: seus alias estão ausentes do script | Sim |

A frase do capítulo sobre o PowerShell está, portanto, exata para `~/.zshrc`. Ela não diz que, ao contrário do Bash, um script Zsh expande os seus **próprios** alias. Uma consequência prática: **nunca colocar alias em `~/.zshenv`**, que mudariam em silêncio o comportamento de todos os scripts.

### A armadilha da linha seguinte também existe

A expansão de um alias acontece **na leitura**, não na execução (ver [a armadilha da linha seguinte](/?c=langages&s=bash&p=alias-avances#a-armadilha-da-linha-seguinte)): o Zsh lê um comando completo, ou um bloco inteiro, antes de executar a menor linha dele. Os quatro scripts do Bash deram os mesmos resultados no Zsh:

```zsh
# --- conteúdo de mesma-linha.zsh ---
# definição E uso na mesma linha: separados por um ponto e vírgula
alias saudar='echo olá'; saudar mundo
# mostra uma mensagem de fim
echo "fim do script"
```

```zsh
# --- conteúdo de bloco.zsh ---
# as chaves { } formam um bloco: o Zsh lê o bloco inteiro antes de executar uma linha dele
{
    # definição do alias, dentro do bloco
    alias saudar='echo olá'
    # uso no mesmo bloco: o alias é desconhecido aqui
    saudar mundo
}
# uso depois do bloco: o bloco foi executado, o alias existe
saudar de novo
```

```zsh
# --- conteúdo de funcao-antes.zsh ---
# a função dizer é LIDA aqui, antes do alias: saudar continua sendo uma palavra comum
dizer() { saudar você; }
# o alias é criado depois da leitura da função
alias saudar='echo olá'
# chamada da função: ela procura um comando saudar e não encontra nada
dizer
```

```zsh
# --- conteúdo de funcao-depois.zsh ---
# o alias é criado primeiro
alias saudar='echo olá'
# a função dizer é lida agora: saudar é substituído por « echo olá »
dizer() { saudar você; }
# chamada da função: ela mostra olá você
dizer
```

```zsh
# executa cada um dos quatro scripts
zsh mesma-linha.zsh
zsh bloco.zsh
zsh funcao-antes.zsh
zsh funcao-depois.zsh
```

```text
mesma-linha.zsh:2: command not found: saudar
fim do script
bloco.zsh:6: command not found: saudar
olá de novo
dizer: command not found: saudar
olá você
```

O Zsh nomeia aqui a **função** na mensagem (`dizer:`) em vez do arquivo e da linha. O resumo é o do Bash, sem o ajuste `shopt`:

| Situação | Resultado |
|---|---|
| Definição e uso em **duas linhas** consecutivas | Funciona, sem ajuste |
| Definição e uso na **mesma linha** (`;`) | Falha: o alias ainda não existe na leitura |
| Definição e uso **no mesmo bloco** `{ }` | Falha; o uso **depois** do bloco funciona |
| Função lida **antes** do alias | Falha na chamada, mesmo que o alias exista naquele momento |
| Função lida **depois** do alias | Funciona |

Um arquivo de atalhos carregado por `source` é lido quando `source` é executado, portanto seus alias existem depois dele:

```zsh
# --- conteúdo de atalhos.zsh ---
# arquivo de atalhos: contém apenas a definição de um alias
alias saudar='echo olá'
```

```zsh
# --- conteúdo de carrega.zsh ---
# source lê o arquivo atalhos.zsh e executa as suas linhas neste script
source ./atalhos.zsh
# o alias criado pelo arquivo é utilizável a partir daqui
saudar mundo
```

```zsh
# executa o script: mostra « olá mundo »
zsh carrega.zsh
```

Ter a opção `aliases` ativa não muda, portanto, o conselho do Bash: em um script compartilhado, **não se usa alias**: escreve-se o comando completo ou uma função. Um alias existe na sua máquina, na sua configuração; o script precisa funcionar em toda parte.

## Nível 4: alias globais e alias de sufixo

O Bash conhece apenas um tipo de alias: o do **primeiro termo** da linha. O Zsh acrescenta dois, que não existem no Bash. Preparamos mais um arquivo na pasta de teste (a pasta `teste` do nível 2):

```zsh
# um arquivo de notas (extensão md), para o exemplo dos alias de sufixo mais abaixo
echo "# titulo" > notas.md
```

### O alias global: `alias -g`

Um alias **global** é expandido **em qualquer lugar da linha**, não apenas no primeiro termo. Cria-se com a opção `-g` (de *global*). Os exemplos têm um ponto em comum: substituem um trecho de linha que se digita com frequência. Um **pipe** (o caractere `|`) envia o que um comando mostra para a entrada do seguinte, `less` mostra um texto página por página (sai-se com a tecla `q`), e `2>/dev/null` descarta as mensagens de erro: `2` designa a saída de erro, `>` a redireciona, e `/dev/null` é um arquivo especial que destrói tudo o que se escreve nele (ver [redirecionamentos e pipes](/?c=langages&s=bash&p=redirections-et-pipes)).

```zsh
# -g: alias global; L é substituído por « | less », onde quer que esteja na linha
alias -g L='| less'
# NE (de « no errors », « sem erros »): as mensagens de erro são descartadas
alias -g NE='2>/dev/null'
# G: envia o resultado ao grep, o comando que procura uma palavra (ver acima)
alias -g G='| grep'
# alias -g sem nome: lista somente os alias globais
alias -g
# ls sub lista o conteúdo da pasta sub; L envia o resultado ao less
ls sub L
# ls G txt vira « ls | grep txt »: só aparecem os nomes que contêm txt
ls G txt
# três partes: « ls | grep txt | less »
ls G txt L
# ls falha (a pasta não existe), NE descarta a mensagem de erro
ls /inexistente NE
# $? contém o código de saída do último comando: 0 para um sucesso, senão uma falha
echo "código=$?"
```

```text
G='| grep'
L='| less'
NE='2>/dev/null'
b.txt
a.txt
meu arquivo.txt
a.txt
meu arquivo.txt
código=2
```

(Em um terminal de verdade, `ls sub L` abre o `less`; aqui ele aparece como um texto simples porque a saída não é uma tela. Os códigos de saída são explicados em [o capítulo sobre os scripts](/?c=langages&s=bash&p=scripts-et-shebang#codigos-de-saida-exit).) O esquema a seguir mostra o que o Zsh faz com a linha `ls G txt L`:

```
   Você digita:   ls G txt L
                   |
   1. O Zsh examina CADA palavra, não apenas a primeira
   2. G é um alias global: é substituído por  | grep
   3. L é um alias global: é substituído por  | less
   4. ls e txt não são alias: permanecem como estão
                   |
                   v
   O Zsh analisa e executa:   ls | grep txt | less
```

### As armadilhas do alias global

Um alias global é poderoso, portanto perigoso: ele é substituído **em todos os lugares**, inclusive onde a palavra `G` era um simples texto.

```zsh
# G é expandido mesmo aqui: a linha vira « echo | grep » (grep sem texto a procurar)
echo G
# entre aspas, a palavra continua sendo um texto comum
echo "G"
# precedida de uma barra invertida, continua sendo um texto comum
echo \G
# entre aspas simples: nada é expandido
echo 'a G b'
# um alias global como primeira palavra dá uma linha que começa com um pipe
G
# sem aspas, G seria expandido antes que o unalias o lesse
unalias G
# com aspas, o nome é lido tal como está: o alias é removido
unalias 'G'
```

```text
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
G
G
a G b
zsh: parse error near `|'
unalias: not enough arguments
Usage: grep [OPTION]... PATTERNS [FILE]...
Try 'grep --help' for more information.
```

O último `unalias 'G'` tem êxito sem mostrar nada. Os três comandos que nomeiam um alias (`alias`, `unalias`, `unhash`) seguem a mesma regra: um alias global deve ser escrito ali **entre aspas** (`unalias 'G'`) ou precedido de uma barra invertida (`unalias \G`).

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| Um alias global cujo nome é uma palavra que às vezes se escreve como texto (`echo G`, `echo 3 L 4`) | O texto é substituído por um pipe: a linha muda de sentido | Nomes em maiúsculas, curtos e sem sentido corrente (`NE`, `G`); aspas ou barra invertida para o texto |
| Um alias global como primeira palavra | A linha começa com um pipe: erro de análise | Nunca usá-lo sozinho |
| `unalias G`, `alias G`, `unhash -a G` sem aspas | O nome é expandido antes de ser lido | `unalias 'G'` |
| Alias globais nos comandos dos outros (scripts, documentação) | `ls G txt L` é ilegível para quem não conhece os seus alias | Um alias global só para a digitação manual, nunca em um script compartilhado |
| Um alias global que esconde um redirecionamento (`NE`) | Esquece-se que os erros são descartados, portanto que um comando falha em silêncio | Reservar `NE` para os comandos cujas mensagens de erro são conhecidas como inúteis |

### O alias de sufixo: `alias -s`

Um alias de **sufixo** (*suffix alias*) está ligado à **extensão** de um arquivo, isto é, às letras depois do último ponto do seu nome (`txt` em `a.txt`). Cria-se com `-s`: `alias -s txt=cat` significa « uma palavra que termina em `.txt` e que é digitada **em primeiro lugar** é precedida de `cat` ». `cat` mostra o conteúdo de um arquivo (ver [`cat`](/?c=langages&s=bash&p=commandes-de-base#ler-o-conteudo-de-um-arquivo-cat)), `head` mostra as primeiras linhas (dez por padrão).

```zsh
# -s: alias de sufixo; a.txt digitado sozinho executa « cat a.txt »
alias -s txt=cat
# idem para a extensão md, com o comando head
alias -s md=head
# alias -s sem nome: lista os alias de sufixo
alias -s
# o nome do arquivo é a primeira palavra: o Zsh executa « cat a.txt »
a.txt
# um caminho com uma pasta também funciona
sub/b.txt
# o arquivo notas.md é lido pelo head
notas.md
# o arquivo não existe: o alias é aplicado mesmo assim, e o cat reclama
inexistente.txt
# os espaços precisam ser protegidos por uma barra invertida
meu\ arquivo.txt
# entre aspas, a palavra não é mais um nome de arquivo para o Zsh: o alias é ignorado
"meu arquivo.txt"
```

```text
md=head
txt=cat
olá
tchau
# titulo
cat: inexistente.txt: No such file or directory
olá mundo
zsh: command not found: meu arquivo.txt
```

O que se observa, ao contrário do que se supõe com frequência:

| Caso | Resultado |
|---|---|
| `a.txt` (o arquivo existe) | `cat a.txt` é executado |
| `inexistente.txt` (o arquivo não existe) | `cat inexistente.txt` é executado mesmo assim: o alias depende do **nome**, não do arquivo |
| `./a.txt`, `sub/b.txt`, `~/notas.txt` | O alias se aplica: o caminho conta somente pelo seu final |
| `a.TXT` | Nenhum alias: a extensão é **sensível a maiúsculas e minúsculas** (maiúsculas e minúsculas são diferentes) |
| `"meu arquivo.txt"` ou `'meu arquivo.txt'` | Nenhum alias: uma palavra entre aspas não é reconhecida; escreve-se `meu\ arquivo.txt` |
| `echo a.txt` | Nenhum alias: só a **primeira palavra** da linha é observada |
| `a.txt outro` | `cat a.txt outro`: o restante da linha segue o nome do arquivo |
| Uma pasta chamada `doc.txt` | `cat: doc.txt: Is a directory`: `cat` não lê uma pasta |
| Um programa executável chamado `prog.txt`, executado por `./prog.txt` | O alias tem prioridade **antes**: `cat` mostra o script em vez de executá-lo |

O texto de um alias de sufixo pode conter opções (`alias -s txt='cat -n'` numera as linhas). `alias` sem opção **não** lista os alias de sufixo: é preciso `alias -s` (ou `alias -sL` para a forma recopiável: `alias -s txt=cat`). Para remover um: `unalias -s txt`.

### Listar os alias: todas as opções

| Comando | O que lista |
|---|---|
| `alias` | Os alias comuns **e** os alias globais (sem distingui-los), não os de sufixo |
| `alias -r` | Somente os alias **comuns** (*regular*), os do primeiro termo |
| `alias -g` | Somente os alias globais |
| `alias -s` | Somente os alias de sufixo |
| `alias -L` | Os alias comuns e globais, sob a forma de comandos completos (`alias -g G='...'`) que se podem copiar para um arquivo |
| `alias -gL`, `alias -sL` | A mesma forma, limitada aos alias globais ou de sufixo |
| `alias -m 'padrão'` | Os alias cujo **nome** corresponde ao padrão (ver abaixo) |

Um **padrão** (*pattern*) é um modelo de texto com coringas: `N*` designa todos os nomes que começam por `N`. É preciso protegê-lo com aspas simples, senão o Zsh o troca por nomes de arquivos antes que `alias` o veja, e responde `zsh: no matches found: N*` se nenhum arquivo corresponder. Com os alias criados acima:

```zsh
# alias cujo nome começa por N: NE
alias -m 'N*'
# alias cujo nome termina em E: NE também (maiúsculas e minúsculas contam)
alias -m '*E'
# alias cujo nome começa por which: which-command
alias -m 'which*'
# unalias também aceita -m: remove todos os alias cujo nome começa por k
alias k1=echo k2=echo
unalias -m 'k*'
# k1 e k2 não existem mais: alias não mostra nada
alias k1
```

```text
NE='2>/dev/null'
NE='2>/dev/null'
which-command=whence
```

## Nível 5: contorno, convivência e organização

### Quem responde quando se digita um nome?

O mesmo nome pode designar um alias, uma função, um comando interno (*builtin*: um comando embutido no próprio Zsh, como `cd`) e um programa (um arquivo executável, como `/usr/bin/date`). A ordem de prioridade é a do Bash (ver [quem responde quando se digita um nome](/?c=langages&s=bash&p=alias-avances#quem-responde-quando-se-digita-um-nome)): **alias, depois função, depois comando interno, depois programa**. As palavras reservadas (`if`, `for`...) formam uma categoria à parte: `whence -w if` responde `if: reserved`.

O Zsh oferece **três comandos** para mostrar as respostas, além do `type -a` do Bash: `whence` (do inglês « de onde vem esta palavra? »), `which` e `where`. Com `date`, um programa ao qual acrescentamos uma função e depois um alias de mesmo nome:

```zsh
# o nome date é, por enquanto, apenas um programa
type -a date
# uma função chamada date
date() { echo "date (função)"; }
# um alias chamado date
alias date='echo "date (alias)"'
# type -a: todas as respostas, da mais prioritária à menos prioritária
type -a date
# whence -a: as mesmas respostas, em versão curta
whence -a date
# where: as mesmas respostas, com o código completo da função
where date
# which: somente a primeira resposta, aquela que é executada
which date
# whence -w: uma só palavra, a natureza da primeira resposta
whence -w date
# quem responde quando se digita o nome?
date
```

```text
date is /usr/bin/date
date is /bin/date
date is an alias for echo "date (alias)"
date is a shell function
date is /usr/bin/date
date is /bin/date
echo "date (alias)"
date
/usr/bin/date
/bin/date
date: aliased to echo "date (alias)"
date () {
	echo "date (função)"
}
/usr/bin/date
/bin/date
date: aliased to echo "date (alias)"
date: alias
date (alias)
```

O programa aparece duas vezes (`/usr/bin/date` e `/bin/date`) porque, neste sistema, `/bin` é um **link simbólico** (uma entrada de pasta que aponta para outra) para `/usr/bin`: é o mesmo arquivo, encontrado por duas entradas de `$PATH` (a lista das pastas onde o shell procura os programas, ver [`$PATH`](/?c=langages&s=bash&p=variables-denvironnement#path-como-o-shell-encontra-um-comando)). O que cada comando escreve:

| Comando | Alias | Função | Programa |
|---|---|---|---|
| `type -a nome` | `nome is an alias for texto` | `nome is a shell function` | `nome is /caminho` |
| `whence -a nome` | O texto do alias | O nome apenas | O caminho |
| `where nome` | `nome: aliased to texto` | O código completo da função | O caminho |
| `which nome` | `nome: aliased to texto` | O código completo da função | O caminho |
| `whence -w nome` | `nome: alias` | `nome: function` | `nome: command` |

`which` mostra somente a **primeira** resposta (a única que é executada), `where` e `whence -a` mostram todas. `whence -w` dá uma palavra por nome: `alias`, `function`, `builtin`, `command`, `reserved`, ou `none` se o nome for desconhecido (com o código de saída 1). É o equivalente do `type -t` do Bash.

### Contornar um alias ou uma função

```zsh
# o nome date sempre designa o alias e a função criados acima
# \date: a barra invertida impede a expansão do alias, a função responde
\date
# as aspas têm o mesmo efeito que a barra invertida
"date"
# command date: ignora o alias E a função, executa o comando interno ou o programa
command date +%Y
# builtin date: procura somente um comando interno; date não é um
builtin date
# builtin echo: echo existe como comando interno, ele responde
builtin echo oi
# unalias date: remove o alias; a função responde de novo
unalias date
date
# unfunction date: remove a função; o programa responde de novo
unfunction date
date +%Y
```

```text
date (função)
date (função)
2026
zsh: no such builtin: date
oi
date (função)
2026
```

O número `2026` é o ano em curso no momento do teste. `+%Y` é o argumento que pede ao `date` para mostrar somente o ano.

| Eu quero | Escrita | O que é ignorado |
|---|---|---|
| Passar por cima do alias | `\nome`, `"nome"` ou `'nome'` | Somente o alias: uma **função** de mesmo nome responde |
| Passar por cima de alias **e** função | `command nome` | Alias e funções: o comando interno ou o programa responde |
| Forçar um comando interno | `builtin nome` | Alias, funções e programas (`no such builtin` se `nome` não for um) |
| Remover o alias | `unalias nome` | Nada: ele desaparece até a próxima sessão |
| Remover a função | `unfunction nome` ou `unset -f nome` | Nada: ela desaparece até a próxima sessão |
| Remover pela tabela de hash | `unhash -a nome` (alias), `unhash -f nome` (função), `unhash -s ext` (alias de sufixo) | Nada: mesmos efeitos dos comandos acima |

`unhash` retira um nome de uma das tabelas de busca internas do Zsh (as « tabelas de hash », onde ele guarda os seus alias, funções e alias de sufixo); sem opção, ele esquece o caminho memorizado de um programa. Com `-a`, `-f` ou `-s`, ele portanto duplica `unalias`, `unfunction` e `unalias -s`.

### O que não muda: o alias que se chama a si mesmo, o espaço final, `xargs`

Três comportamentos do Bash são idênticos no Zsh. Um alias pode conter o nome que ele substitui sem laço infinito; se o texto de um alias termina com um espaço, a palavra seguinte também é considerada alias; `xargs` (um programa que lê palavras e as acrescenta como argumentos de um comando) não conhece os alias do shell. As explicações estão em [o nível 4 do capítulo Bash](/?c=langages&s=bash&p=alias-avances#nivel-4-contorno-e-convivencia); eis os resultados observados no Zsh.

```zsh
# o alias ls acrescenta --color=auto (cores se a saída for um terminal) ao comando real
alias ls='ls --color=auto'
# type mostra o que é ls: a palavra ls do texto não é expandida uma segunda vez
type ls
# dois alias que se remetem um ao outro: a para b, b para a
alias a='b'
alias b='a'
# a vira b, b vira a, e a não é expandido uma segunda vez: sem laço
a
# escrever designa echo (sem espaço final), mundo é um texto de substituição
alias escrever='echo'
alias mundo='todo mundo'
# a palavra mundo não é a primeira: ela aparece tal como está
escrever mundo
# redefinimos escrever com um espaço NO FIM do texto
alias escrever='echo '
# a palavra que segue escrever agora é considerada alias: mundo é expandido
escrever mundo
# o alias saudar existe para o terminal
alias saudar='echo olá'
# xargs procura um PROGRAMA chamado saudar: ele não conhece os alias do Zsh
echo você | xargs saudar
# remove os alias do exemplo
unalias ls a b escrever mundo saudar
```

```text
ls is an alias for ls --color=auto
zsh: command not found: a
mundo
todo mundo
xargs: saudar: No such file or directory
```

### As opções do Zsh ligadas aos alias

Três opções do Zsh dizem respeito aos alias (ver [o sistema de opções](/?c=langages&s=zsh&p=options-du-shell) para `setopt` e `unsetopt`, e [a lista oficial das opções](https://zsh.sourceforge.io/Doc/Release/Options.html) para a descrição completa delas):

| Opção | Valor padrão | Efeito |
|---|---|---|
| `aliases` | Ativa | Se for desativada (`unsetopt aliases`), nenhum alias é expandido; o comando `alias` continua a criá-los. Ver o [nível 3](#nivel-3-os-alias-em-um-script) |
| `alias_func_def` | Desativada | Se estiver ativa, uma declaração `nome() { ... }` é aceita mesmo quando `nome` é um alias, **com um efeito surpreendente** (ver abaixo) |
| `complete_aliases` | Desativada | Se estiver ativa, a complementação (a proposta do fim de uma palavra quando se aperta a tecla Tab, ver [a complementação avançada](/?c=langages&s=zsh&p=completion-avancee)) trata o alias como um comando completo, em vez de substituí-lo primeiro pelo seu texto |

A opção `alias_func_def` merece um teste, porque o seu resultado é contrário à intuição: em vez de definir uma função `ll`, ela define uma função com o nome do **texto** do alias.

```zsh
# ll é um alias do programa ls
alias ll=ls
# ativa a permissão para declarar uma função com nome de alias
setopt alias_func_def
# a declaração é aceita... mas ll é antes substituído por ls
ll() { echo "eu sou ll"; }
# ll continua sendo um alias
type -a ll
# foi o nome ls que virou uma função!
type -a ls
# a chamada a ll executa o alias, portanto a função ls
ll
# colocamos tudo em ordem: opção desativada, função e alias removidos
unsetopt alias_func_def
unfunction ls
unalias ll
```

```text
ll is an alias for ls
ls is a shell function
ls is /usr/bin/ls
ls is /bin/ls
eu sou ll
```

Com um alias de várias palavras como `grep -r "$1" .`, a declaração define várias funções de uma vez (teste: `grep` e `.`). **Não se deve, portanto, ativar `alias_func_def`**: o erro padrão é a proteção.

### Organizar seus atalhos

Quando se tem alguns atalhos, o `~/.zshrc` fica ilegível. Guardam-se eles em um arquivo à parte, `~/.zsh_aliases`, que o `~/.zshrc` carrega, ou em uma pasta `~/.zshrc.d` cujo arquivo é carregado um a um. Esses dois nomes são **convenções**: o Zsh não os lê por conta própria; é o `~/.zshrc` que deve conter as linhas abaixo. O teste `[[ -f arquivo ]]` é verdadeiro se esse arquivo existir e for um arquivo comum (ver [as condições](/?c=langages&s=bash&p=conditions)). O padrão `*.zsh` designa todos os arquivos cujo nome termina em `.zsh`, e o **qualificador** `(N)` colocado depois dele diz « se nenhum arquivo corresponder, não produzir nada em vez de sinalizar um erro » (ver [os qualificadores de glob](/?c=langages&s=zsh&p=expansion-et-jokers-avances#os-qualificadores-de-glob-filtrar-por-tipo-ou-metadado)). `for ... do ... done` repete os comandos para cada arquivo encontrado (ver [os laços](/?c=langages&s=bash&p=boucles)).

```zsh
# --- a acrescentar em ~/.zshrc ---
# se o arquivo ~/.zsh_aliases existir, nós o carregamos
if [[ -f ~/.zsh_aliases ]]; then
    # source lê o arquivo no shell atual
    source ~/.zsh_aliases
# fi encerra o if
fi
# para cada arquivo .zsh de ~/.zshrc.d (nenhum: (N) evita o erro)
for arquivo in ~/.zshrc.d/*.zsh(N); do
    # carregamos esse arquivo
    source "$arquivo"
# done encerra o laço
done
```

```zsh
# --- conteúdo de ~/.zsh_aliases ---
# atalhos simples: um nome curto para um comando
alias ll='ls -la'
# ls -lt: detalhe de cada arquivo, do mais recente ao mais antigo
alias lt='ls -lt'
# alias global (nível 4): descarta as mensagens de erro
alias -g NE='2>/dev/null'
# alias de sufixo (nível 4): um arquivo .txt digitado sozinho é mostrado pelo cat
alias -s txt=cat
# busca a palavra dada como primeiro argumento na pasta atual
busca() {
    grep -rn "$1" .
}
```

Os alias globais e de sufixo se guardam no mesmo arquivo que os outros: `alias -L` dá a forma recopiável. Com este arquivo e dois arquivos em `~/.zshrc.d` (`git.zsh`, que contém `alias gs='git status'`, do programa [Git](/?c=qualite-performance-et-outils&s=git&p=concepts-de-base), e `docker.zsh`, que contém `alias dc='docker compose'`, da ferramenta [Docker Compose](/?c=infrastructure-devops&s=docker&p=docker-compose)), observa-se, ao iniciar um Zsh interativo que lê esse `~/.zshrc`:

| Caso observado | Resultado |
|---|---|
| Os arquivos existem | `alias` lista `ll`, `lt`, `gs`, `dc` e `NE`; `alias -s` lista `txt=cat`; `type busca` responde que é uma função |
| `~/.zsh_aliases` não existe, com o teste `[[ -f ... ]]` | O terminal inicia sem nenhuma mensagem |
| `~/.zsh_aliases` não existe, com apenas `source ~/.zsh_aliases` | Uma mensagem `no such file or directory` a cada início (o início continua) |
| `~/.zshrc.d` vazia, com `(N)` | O terminal inicia sem nenhuma mensagem |
| `~/.zshrc.d` vazia, sem `(N)` | Uma mensagem `no matches found` seguida do padrão, a cada início |
| Uma linha acrescentada aos arquivos depois do início | Desconhecida enquanto não se executar `source ~/.zsh_aliases` |

### Diagnosticar: `zsh -f`

Quando um comando se comporta de forma estranha, a causa às vezes é um dos seus alias ou das suas funções. As opções da linha de comando do Zsh (descritas em [a seção « Invocação » do manual](https://zsh.sourceforge.io/Doc/Release/Invocation.html)) permitem afastá-los:

| Comando | Efeito |
|---|---|
| `zsh -f` | Inicia um novo Zsh que **não lê** os seus arquivos de inicialização pessoais (`~/.zshenv`, `~/.zshrc`...): nenhum dos seus atalhos existe ali |
| `zsh -d` | Não lê os arquivos de inicialização **do sistema** (os de `/etc/zsh`, que também podem definir ou retirar alias) |
| `zsh -d -f` | Nenhum arquivo de inicialização, nenhum |
| `zsh -f -c 'texto'` | Executa esse texto em um Zsh sem configuração, depois termina (`-c`: executar este texto) |

```zsh
# na sessão normal, ll existe (criado no nível 1)
alias ll='ls -la'
# mostra a definição de ll
alias ll
# em um Zsh sem configuração, ll não existe: nada aparece, e o código vale 1
zsh -f -c 'alias ll; echo "código=$?"'
```

```text
ll='ls -la'
código=1
```

Para trabalhar em um Zsh sem configuração, digita-se apenas `zsh -f`: o prompt (o texto que precede o que você digita) muda de aparência, `alias` lista apenas os dois alias de partida, e `exit` fecha esse Zsh e leva de volta à sessão anterior, com os seus atalhos. Se o comportamento voltar ao normal em `zsh -f`, o culpado está nos seus atalhos: retire-os um a um para descobrir qual é.

### Os alias do Oh My Zsh

[Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh) é um conjunto de ajustes e extensões (*plugins*) para o Zsh. Os seus plugins definem centenas de alias, por exemplo os do plugin `git`. Eles são carregados no início, e `alias` os lista como os seus, o que permite encontrá-los e verificá-los:

```zsh
# definição de um alias fornecido pelo plugin git
alias gst
# os alias cujo nome começa por gpu: aqui um só, git push upstream
alias -m 'gpu*'
# o Oh My Zsh define ele mesmo alias globais: nós os listamos (alias -g)
alias -g
```

```text
gst='git status'
gpu='git push upstream'
...=../..
....=../../..
.....=../../../..
......=../../../../..
```

Os dois primeiros resultados dependem do plugin instalado, e os alias globais, da versão do Oh My Zsh. Três precauções se impõem:

| Precaução | Por quê |
|---|---|
| `alias nome` antes de criar um atalho | O Oh My Zsh já define nomes comuns: `ll` vale `ls -lh`, `l` vale `ls -lah` |
| Acrescentar os seus alias **depois** da linha `source $ZSH/oh-my-zsh.sh` do `~/.zshrc` | A última definição de um nome é a que prevalece: depois do `source`, `alias ll='ls -la'` substitui a do Oh My Zsh |
| Ou colocá-los em `~/.oh-my-zsh/custom/` | Todo arquivo `.zsh` dessa pasta é carregado automaticamente e sobrevive às atualizações (ver o capítulo [Oh My Zsh](/?c=langages&s=zsh&p=oh-my-zsh)) |

## Síntese dos níveis

| Nível | Necessidade | Ferramenta | Limite |
|---|---|---|---|
| 1 | Outro nome para um comando | `alias ll='ls -la'`, `alias -L`, `unalias`, `~/.zshrc` | Um texto colado antes dos argumentos; sem `$1`; perdido ao fechar o terminal sem `~/.zshrc` |
| 2 | Um argumento colocado no meio, um teste sobre o número de argumentos | Função com `"$1"`, `"$@"`, `"$#"` | `nome() {` falha se um alias tiver esse nome; `function nome {` funciona, mas o alias continua prioritário |
| 3 | Um atalho em um script | A opção `aliases` (ativa), ou melhor, uma função | Um alias só existe a partir da linha seguinte; os alias de `~/.zshrc` estão ausentes do script, os de `~/.zshenv` estão presentes |
| 4 | Agir em qualquer lugar da linha, ou conforme a extensão | `alias -g`, `alias -s` | Um alias global é expandido até em um texto; um alias de sufixo se aplica também a um arquivo que não existe |
| 5 | Conviver, organizar, diagnosticar | `\nome`, `command`, `whence -a`, `~/.zsh_aliases`, `zsh -f` | `\nome` deixa passar uma função; `alias_func_def` renomeia o nome errado |

## As armadilhas

| Armadilha | Por que é um problema | O que fazer |
|---|---|---|
| `alias busca='grep -r "$1" .'` | `$1` não existe em um alias: vale vazio, e a palavra digitada é colada ao fim | Uma função com `"$1"` |
| `busca() { ... }` quando existe um alias `busca` | Erro `defining function based on alias` | `unalias nome` antes da função |
| `function busca { ... }` quando existe um alias `busca` | Nenhum erro, mas o alias continua prioritário: a função nunca é chamada | `unalias nome` antes da função, e `type -a nome` para verificar |
| `$@` sem aspas | Os argumentos vazios desaparecem (e o Bash também corta os espaços e expande os coringas) | `"$@"` |
| Acreditar que um script ignora os alias | No Zsh, um script expande os alias que ele define | Escrever o comando completo ou uma função |
| Alias definido e usado na mesma linha ou no mesmo bloco `{ }` | O alias só existe a partir da linha lida em seguida | Definir em uma linha, usar mais adiante, ou usar uma função |
| Função lida antes do alias que ela usa | A palavra continua comum: a expansão acontece na leitura do corpo | Preferir o comando completo dentro da função |
| Um alias em `~/.zshenv` | Esse arquivo é lido por todos os scripts: o comportamento muda em silêncio | Reservar `~/.zshenv` para as variáveis de ambiente |
| Um alias global com um nome comum (`echo G`) | O texto é substituído por um pipe seguido de `grep` | Nomes curtos em maiúsculas, raros no texto |
| `unalias G`, `alias G`, `unhash -a G` sem aspas | O nome de um alias global é expandido antes de ser lido | `unalias 'G'` ou `unalias \G` |
| Um alias global como primeira palavra, ou em um script compartilhado | Erro de análise, ou linha ilegível para os outros | Reservar os alias globais para a digitação manual |
| Um alias de sufixo que supõe que o arquivo existe | Aplica-se somente pelo nome, e tem prioridade sobre um programa de mesmo nome | Não nomear um programa com uma extensão que se ligou a um alias |
| Um nome de arquivo entre aspas, ou uma extensão em maiúsculas | O alias de sufixo é ignorado | `meu\ arquivo.txt` e a grafia correta |
| `setopt alias_func_def` | Uma declaração `ll() {...}` define uma função com o nome do texto do alias | Deixar a opção desativada |
| `\nome` para contornar | Contorna somente o alias: uma função de mesmo nome responde | `command nome` |
| Um alias em um programa executado por `xargs` | `xargs` executa programas, não alias | Um script ou o próprio programa |
| `source ~/.zsh_aliases` sem teste `[[ -f ... ]]` | Uma mensagem de erro a cada início se o arquivo faltar | `if [[ -f ~/.zsh_aliases ]]; then ... fi` |
| `~/.zshrc.d/*.zsh` sem `(N)` | `no matches found` a cada início se a pasta estiver vazia | `~/.zshrc.d/*.zsh(N)` |
| Um alias que reutiliza um nome do Oh My Zsh | O sentido antigo desaparece, ou o seu é sobrescrito conforme a ordem de carregamento | `alias nome` antes de escolher, e as suas linhas depois de `source $ZSH/oh-my-zsh.sh` |
| Modificar `~/.zsh_aliases` sem recarregar | A sessão atual mantém o estado antigo | `source ~/.zsh_aliases` |

## Boas práticas

| Boa prática | Por quê |
|---|---|
| Um alias para um simples renomeio ou opções fixas; uma função assim que um argumento deve ficar em outro lugar que não o fim | Cada ferramenta permanece no seu domínio |
| Aspas simples em volta do texto de um alias | As variáveis são lidas no uso |
| `"$@"` com aspas, `"$#"` para contar | O script também funciona no Bash, e os argumentos vazios são preservados |
| `alias -L` para salvar os seus alias | A forma recopiável, incluindo alias globais e de sufixo |
| Escrever o comando completo ou uma função em um script | O script funciona em todas as máquinas, com ou sem os seus alias |
| `whence -a nome` ou `type -a nome` antes de criar um atalho | Nenhuma máscara involuntária, inclusive por um alias do Oh My Zsh |
| `command nome` para chegar ao comando real | Passa por cima de alias e função |
| Alias globais curtos, em maiúsculas, somente para a digitação manual | Continuam identificáveis, e um script compartilhado não depende deles |
| Guardar todos os atalhos em `~/.zsh_aliases` ou `~/.zshrc.d`, carregados com `[[ -f ... ]]` ou `(N)` | Um `~/.zshrc` curto, atalhos fáceis de salvar |
| `zsh -f` quando um comportamento parecer estranho | Afastar os atalhos como causa |
| Manter poucos atalhos, com nomes sem ambiguidade | Eles são lembrados, e não mascaram um comando útil |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um **alias** é um **texto** substituído à primeira palavra digitada, **antes** da análise da linha, como no Bash: `alias ll='ls -la'` cria, `alias` lista (sem a palavra `alias` diante de cada linha; `alias -L` dá a forma recopiável), `unalias ll` remove, e `~/.zshrc` o torna permanente. Um alias não tem `$1`: uma **função** recebe `$1`, `"$@"` e `"$#"`. No Zsh, `$@` sem aspas não é cortado nos espaços (o argumento vazio desaparece mesmo assim), e a declaração `nome() {` falha se um alias tiver esse nome, enquanto `function nome {` funciona sem que a função seja chamada. Ao contrário do Bash, um script **expande os alias** que define (opção `aliases` ativa), mas não os de `~/.zshrc` (os de `~/.zshenv`, sim); a armadilha da linha seguinte também existe. **Alias globais** (`alias -g NE='2>/dev/null'`): expandidos em qualquer lugar da linha, a escrever entre aspas para `unalias`. **Alias de sufixo** (`alias -s txt=cat`): `arquivo.txt` digitado como primeira palavra executa `cat arquivo.txt`, conforme o nome somente, com a grafia. Ordem de resposta: alias, função, comando interno, programa; `type -a nome`, `whence -a nome`, `where nome` os listam. `\nome` passa por cima somente do alias, `command nome` passa por cima de alias e função. Atalhos em `~/.zsh_aliases` ou `~/.zshrc.d`, e `zsh -f` para diagnosticar. |
| **Armadilhas a evitar** | `$1` em um alias; função declarada sem ter removido o alias de mesmo nome; `function nome {` que deixa o alias prioritário; achar que um script ignora os alias; alias definido e usado na mesma linha ou no mesmo bloco; alias em `~/.zshenv`; alias global com nome comum ou em primeira posição; `unalias G` sem aspas; alias de sufixo aplicado a um nome que não existe ou a um programa; `setopt alias_func_def`; achar que `\nome` contorna uma função; alias depois de `xargs`; `source` ou `*.zsh` sem teste nem `(N)`; nome de alias que mascara um comando ou um alias do Oh My Zsh. |
| **Boas práticas** | Alias para renomear, função quando um argumento fica em outro lugar que não o fim; aspas simples; `"$@"` e `"$#"`; comando completo ou função em um script; `whence -a nome` antes de nomear; `command nome` para chegar ao comando real; alias globais curtos e reservados à digitação; atalhos em `~/.zsh_aliases` ou `~/.zshrc.d`; `zsh -f` para afastar os seus atalhos em um diagnóstico. |
