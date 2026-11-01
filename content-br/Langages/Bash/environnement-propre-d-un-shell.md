---
order: 17
---

# O ambiente limpo de um shell

Um [shell](/?c=langages&s=bash&p=bash) (o programa que lê seus comandos em um [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal)) transmite a cada programa que lança uma cópia do seu **ambiente**: o conjunto de suas [variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement). Esse ambiente vem da sua máquina, com tudo o que ela contém: suas configurações, seus aliases, seus diretórios em `$PATH`. Quando se quer construir um software de forma reproduzível, ou montar um sistema Linux à mão (como propõe o projeto [Linux From Scratch](https://www.linuxfromscratch.org/lfs/)), essa herança é um perigo: a construção passa a depender, sem que se perceba, da máquina que a iniciou. Este capítulo mostra como partir de um ambiente vazio e colocar nele apenas o que se escolhe.

Ele supõe conhecidos `export`, a ordem de `$PATH`, `~/.bashrc` contra `~/.bash_profile` e `source`, vistos no capítulo sobre as [variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement).

> **Vocabulário.** O **host** é a máquina (ou o sistema) que lança a construção. Um **processo** é um programa em execução (veja [a gestão de processos](/?c=langages&s=bash&p=gestion-des-processus)).

## O esquema geral

```text
HOST: sua sessão
  ambiente rico: PATH, HOME, PS1, aliases, dezenas de variáveis
        |
        |  env -i HOME=... TERM=... PS1=... PATH=...   (só passamos 4 variáveis)
        v
AMBIENTE VAZIO: nada herdado, exceto o que acabamos de declarar
        |
        |  /bin/bash   (um novo shell, que depois lê os próprios arquivos)
        v
CONSTRUÇÃO: compilar, instalar, com um ambiente conhecido e completo
```

## `env`: exibir e criar um ambiente

`env` é um programa do sistema (ele vem do [GNU coreutils](https://www.gnu.org/software/coreutils/manual/html_node/env-invocation.html), a coleção de ferramentas básicas). Sem argumento, ele exibe as variáveis do seu ambiente. Com `-i` (*ignore environment*), ele **esvazia** o ambiente, acrescenta as variáveis `NOME=valor` dadas e depois executa o comando que vem a seguir.

```bash
# conta as variáveis do ambiente de um shell comum (uma por linha de env)
bash -c 'env | wc -l'
# mesma contagem, mas o shell é iniciado com um ambiente vazio
env -i bash -c 'env | wc -l'
```

```text
78
3
```

O primeiro número depende da sua máquina. As três variáveis restantes não vêm de você: é o próprio Bash que as cria na inicialização.

```bash
# ambiente vazio: env mostra apenas as variáveis dadas
env -i bash -c 'env'
```

```text
PWD=/tmp
SHLVL=0
_=/usr/bin/env
```

Aqui `PWD` é o diretório atual, `SHLVL` o nível de aninhamento dos shells e `_` o último programa lançado. Vamos agora passar uma variável nossa:

```bash
# declaramos MINHA_VAR e PATH ; HOME não é declarada, então não existe
env -i MINHA_VAR=ola PATH=/usr/bin:/bin bash -c 'echo "[$MINHA_VAR] [$HOME]"'
# o comando ls é encontrado graças ao PATH que demos
env -i MINHA_VAR=ola PATH=/usr/bin:/bin bash -c 'ls /etc/hostname'
```

```text
[ola] []
/etc/hostname
```

| Comando | Ambiente que o programa iniciado recebe |
|---|---|
| `env` | Exibe o ambiente atual, não executa mais nada |
| `env VAR=val comando` | O do host, mais `VAR=val` |
| `env -i comando` | Vazio (exceto as três variáveis que o Bash cria) |
| `env -i VAR=val comando` | Vazio, mais apenas `VAR=val` |

> **Armadilha:** sem `HOME`, `TERM`, `PATH` e as demais, muitos programas se comportam de outra forma: `$HOME` fica vazio, `~` não se expande mais, um editor não sabe mais como exibir o terminal. Isso é intencional: cabe a você declarar o que é necessário, e apenas isso.

## `exec`: substituir o shell em vez de iniciar um segundo

Normalmente, quando um script lança um comando, o shell continua ali, espera o fim do comando e depois lê a linha seguinte. O comando interno `exec` faz outra coisa: ele **substitui** o processo do shell pelo programa pedido (veja [`fork()` e `execve()`](/?c=langages&s=bash&p=architecture-dun-shell) para o mecanismo). Não sobra mais shell por trás: tudo o que vem depois de `exec` no script nunca é lido.

```bash
# $$ é o número (PID) do processo do shell atual
# exec substitui esse shell por outro bash: o número não muda
bash -c 'echo "antes: $$"; exec bash -c "echo \"depois: \$\$\""'
```

```text
antes: 59235
depois: 59235
```

O número é o mesmo antes e depois: não houve um segundo processo, o primeiro mudou de programa. Os números exibidos mudam a cada execução, só a igualdade deles importa.

```bash
#!/bin/bash
# lancador.sh : um script que copia uma linha do livro sem entender exec
echo "início do lançador"
# exec substitui o script por um bash limpo: o script deixa de existir depois desta linha
exec env -i HOME=/tmp TERM=xterm /bin/bash -c 'echo "no bash limpo"'
echo "esta linha nunca é exibida"
```

```bash
# executa o script
bash lancador.sh
```

```text
início do lançador
no bash limpo
```

A última linha do script desapareceu junto com ele. A armadilha apareceu na prática: uma linha `exec env -i ...` copiada de um livro para um lançador, e tudo o que vinha depois (a própria construção) era ignorado sem nenhuma mensagem de erro.

| Escrita | O que acontece depois |
|---|---|
| `env -i ... bash` | Um segundo shell é iniciado; o primeiro espera o fim dele e então continua |
| `exec env -i ... bash` | O primeiro shell é substituído; nada continua depois |
| `(exec comando)` | A substituição só acontece no [subshell](/?c=langages&s=bash&p=architecture-dun-shell) entre parênteses; o script continua |

> **Nota:** `exec` tem seu lugar no **fim** de um lançador, ou em um arquivo de inicialização cuja única função é passar o controle a outro shell. Em qualquer outro lugar, esquecer o que ele faz custa caro.

## Quais arquivos um shell lê ao iniciar?

O capítulo sobre as [variáveis de ambiente](/?c=langages&s=bash&p=variables-denvironnement) opõe `~/.bashrc` e `~/.bash_profile`. Eis a regra exata, segundo o manual do [GNU Bash](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html):

- Um **shell de login** (*login shell*) é aquele obtido ao fazer login. O Bash é um quando é iniciado com `--login` (ou `-l`), ou quando seu nome é precedido de um hífen.
- Um shell **interativo** é um shell que aguarda comandos digitados (em oposição a um script).

| Tipo de shell | Arquivos lidos |
|---|---|
| Login | `/etc/profile`, depois o primeiro encontrado entre `~/.bash_profile`, `~/.bash_login`, `~/.profile` |
| Interativo, sem login | `~/.bashrc` (e, no Debian e no Ubuntu, `/etc/bash.bashrc` antes dele) |
| Nenhum dos dois (script, `bash -c`) | Nenhum arquivo de inicialização |

Demonstração com um diretório pessoal de teste, para não mexer no seu:

```bash
# cria um falso diretório pessoal
mkdir -p /tmp/teste-home
# um arquivo lido por um shell de login: ele define uma variável
echo 'export DO_PROFILE=sim' > /tmp/teste-home/.bash_profile
# um arquivo lido por um shell interativo: ele define outra variável
echo 'export DO_BASHRC=sim' > /tmp/teste-home/.bashrc

# -l pede um shell de login: .bash_profile é lido
env -i HOME=/tmp/teste-home bash -l -c 'echo "login: [$DO_PROFILE]"'
# sem -l: nenhum arquivo é lido
env -i HOME=/tmp/teste-home bash -c 'echo "sem login: [$DO_PROFILE]"'
# -i pede um shell interativo: .bashrc é lido
env -i HOME=/tmp/teste-home bash -i -c 'echo "interativo: [$DO_BASHRC]"'
```

```text
login: [sim]
sem login: []
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

interativo: [sim]
```

As duas linhas em inglês não vêm do seu arquivo: elas vêm de um arquivo do host, o que a seção seguinte explica.

### `su - NOME` contra `su NOME`

`su` (*substitute user*) abre um shell com a identidade de outro usuário. Esta parte é descrita segundo o manual de `su` (`man su`): ela não foi executada aqui, pois `su` pede uma senha.

| Comando | Natureza do shell obtido | Efeito |
|---|---|---|
| `su - NOME` (com o hífen, ou `-l`) | Shell de login | Apaga quase todo o ambiente (exceto `TERM`), recria `HOME`, `SHELL`, `USER`, `LOGNAME` e `PATH`, vai para o diretório pessoal de `NOME`, depois lê `~/.bash_profile` |
| `su NOME` (sem o hífen) | Shell interativo, sem login | Mantém a maior parte do ambiente de quem chamou, não lê `~/.bash_profile` (lê `~/.bashrc`) |

Um `~/.bash_profile` que apenas passa o controle a um shell limpo é a maneira clássica de garantir um ambiente controlado desde o login:

```bash
# ~/.bash_profile : substitui o shell de login por um bash com ambiente mínimo
# TERM descreve o tipo de terminal, PS1 é o texto exibido antes de cada comando
exec env -i HOME=$HOME TERM=$TERM PS1='\u:\w\$ ' PATH=/usr/bin:/bin /bin/bash
```

O `bash` assim iniciado é interativo, sem login: ele portanto lê `~/.bashrc`, e é nesse arquivo que se coloca o resto da configuração (variáveis próprias do projeto, aliases). Aqui `exec` está no lugar certo: o shell de login não tem mais nada a fazer e desaparece.

## Quando o host se intromete apesar de `env -i`

Na demonstração anterior, uma mensagem sobre `sudo` apareceu embora o ambiente estivesse vazio: um arquivo do host, `/etc/bash.bashrc`, é lido por todo shell interativo no Debian e no Ubuntu, antes mesmo de `~/.bashrc`. Ele também pode **alterar `PS1`**, a variável que contém o texto exibido antes de cada comando (o *prompt*), mesmo que a tenhamos transmitido corretamente:

```bash
# passa PS1='$ ' a um shell interativo iniciado com um ambiente vazio
env -i HOME=/nonexistent PS1='$ ' bash -i -c 'echo "[$PS1]"'
# o mesmo, mas --norc proíbe a leitura dos arquivos de inicialização do host
env -i HOME=/nonexistent PS1='$ ' bash --norc -i -c 'echo "[$PS1]"'
```

```text
To run a command as administrator (user "root"), use "sudo <command>".
See "man sudo_root" for details.

[${debian_chroot:+($debian_chroot)}\u@\h:\w\$ ]
[$ ]
```

O primeiro shell substituiu `PS1='$ '` pelo valor definido em `/etc/bash.bashrc` do host; o segundo, com `--norc`, manteve o valor. O método de verificação é sempre o mesmo:

| Etapa | Comando | O que procurar |
|---|---|---|
| 1. Anotar o que foi transmitido | A própria linha `env -i ...` | A lista exata das variáveis declaradas |
| 2. Exibir o que o shell vê | `env` no novo shell | Uma variável diferente ou a mais |
| 3. Identificar a origem | `grep -n PS1 /etc/bash.bashrc` (por exemplo) | O arquivo do host que a alterou |
| 4. Descartar o arquivo | `bash --norc`, ou não iniciar um shell interativo | Um ambiente igual ao que foi transmitido |

## `export`: tornar visível, não atribuir um valor

`export` não fixa um valor: ele marca uma variável já existente como **a ser transmitida** aos programas lançados depois. O valor é escrito em outro lugar (uma atribuição `NOME=valor`, ou a linha `env -i NOME=valor`). É isso que separa uma variável de shell de uma variável de ambiente:

```bash
# VAL é uma simples variável de shell: ela ainda não está no ambiente
VAL=1
# um shell filho iniciado agora não a vê: os colchetes ficam vazios
bash -c 'echo "filho sem export: [$VAL]"'
# export marca VAL como a ser transmitida aos programas lançados depois
export VAL
# o mesmo filho agora a recebe
bash -c 'echo "filho com export: [$VAL]"'
# remove a variável para não deixar nada neste terminal
unset VAL
```

```text
filho sem export: []
filho com export: [1]
```

Com `env -i`, não é preciso `export`: uma variável dada a `env` faz parte do ambiente do programa lançado, por construção.

## Limitar o paralelismo do `make` com `MAKEFLAGS`

O `make` ([veja os Makefiles](/?c=langages&s=c&p=makefiles)) lê sua variável de ambiente `MAKEFLAGS` como se o conteúdo dela tivesse sido escrito na linha de comando. A opção `-jN` permite lançar N tarefas de compilação ao mesmo tempo, o que acelera muito a construção. `nproc` exibe o número de núcleos de processamento (processadores) disponíveis: é um valor razoável para N.

```bash
# exibe o número de núcleos da máquina
nproc
# um Makefile mínimo de teste: uma regra que exibe o valor de MAKEFLAGS
printf 'tudo:\n\t@echo "MAKEFLAGS vale: $(MAKEFLAGS)"\n' > /tmp/Makefile.teste
# -j seguido do número de núcleos, passado pelo ambiente
MAKEFLAGS=-j$(nproc) make -f /tmp/Makefile.teste
# -j sem número: make lança tantas tarefas quantas estiverem prontas
make -j -f /tmp/Makefile.teste
```

```text
16
MAKEFLAGS vale:  -j16 --jobserver-auth=3,4
MAKEFLAGS vale:  -j
```

O número `16` é o da máquina de teste. No primeiro caso, o `make` completou a variável com um detalhe interno (`--jobserver-auth`) que serve para coordenar seus subprocessos: só `-j16` foi escrito por você.

| Ajuste | Efeito |
|---|---|
| `MAKEFLAGS=-j$(nproc)` | No máximo tantas tarefas quantos núcleos |
| `MAKEFLAGS=-j4` | No máximo 4 tarefas, por exemplo para manter a máquina utilizável |
| `-j` sem número | **Nenhum limite**: em um projeto grande, centenas de compiladores iniciam juntos e podem saturar memória e processador |

## O princípio do isolamento

Todo este capítulo aplica uma mesma ideia: **partir de um estado vazio e colocar nele apenas o que se declara**. O resultado deixa de depender do que a máquina contém por acaso; pode-se portanto refazê-lo em outro lugar, ou mais tarde, e obter a mesma coisa.

| Ferramenta | O que ela esvazia | O que se declara |
|---|---|---|
| `env -i` | As variáveis de ambiente | Os `NOME=valor` dados a `env` |
| Um [contêiner Docker](/?c=infrastructure-devops&s=docker&p=concepts-de-base) | O sistema de arquivos e os processos visíveis | Uma imagem, variáveis, volumes |
| Um [ambiente virtual Python](/?c=langages&s=python&p=modules-et-environnements) (`venv`) | As bibliotecas instaladas para este projeto | As dependências instaladas neste diretório |

Cada ferramenta isola na sua escala: `env -i` só isola o ambiente de um processo, `venv` só as bibliotecas Python, o contêiner muito mais. Nenhuma é proteção contra um programa hostil: elas produzem um resultado **reproduzível**, não inviolável.

### A ligação com o menor privilégio

O [princípio do menor privilégio](/?c=securite&s=cybersecurite&p=principes-de-developpement-securise) diz que um componente recebe apenas os direitos de que precisa. O isolamento por ambiente vazio é o seu par: ele protege no sentido contrário.

| Medida | O que ela protege | Contra o quê |
|---|---|---|
| Construir com um usuário comum (veja [as permissões](/?c=langages&s=bash&p=permissions-et-fichiers)) | O **host** | De um erro da construção (um comando que sobrescreve arquivos do sistema, um `rm` mal direcionado) |
| Construir com um ambiente vazio | A **construção** | Do host (variáveis, aliases, arquivos de inicialização que alteram o resultado sem que se perceba) |

As duas medidas se combinam: um usuário comum em um ambiente vazio só pode danificar o próprio diretório, e depende apenas do que lhe foi dado.

## As armadilhas

| Armadilha | Por que é um problema |
|---|---|
| `exec` seguido de outras linhas em um script | `exec` substitui o script: tudo o que vem depois é ignorado, sem erro. Reservá-lo para a última linha |
| `env -i` sem `PATH`, `HOME`, `TERM` | O shell usa um `PATH` padrão, mas `HOME` está vazia e `TERM` ausente: programas que travam ou exibem mal |
| Acreditar que `env -i` basta para isolar | Um shell interativo relê os arquivos do host (`/etc/bash.bashrc`, `~/.bashrc`): `PS1` ou outras variáveis mudam. Comparar `env` com o que foi transmitido |
| `su NOME` em vez de `su - NOME` | Sem shell de login: `~/.bash_profile` não é lido e o ambiente de quem chamou é mantido |
| Escrever `export` pensando em dar um valor | `export` apenas torna visível uma variável existente; o valor vem de uma atribuição |
| `MAKEFLAGS=-j` sem número | Paralelismo ilimitado: memória e processador saturados |

## Boas práticas

| Prática | Por quê |
|---|---|
| Iniciar a construção com `env -i` e a lista completa das variáveis necessárias, escrita em um único arquivo | Ela é legível, reexecutável e verificável de relance |
| Colocar `exec env -i ... /bin/bash` em `~/.bash_profile`, nunca no meio de um script | A substituição do shell acontece no lugar certo |
| Exibir `env` no novo shell e compará-lo com a lista transmitida | Detecta a variável acrescentada por um arquivo do host |
| Descartar o arquivo problemático (`--norc`, ou movê-lo) em vez de corrigir a variável depois | A causa desaparece, em vez de ser mascarada |
| Definir `MAKEFLAGS=-j$(nproc)` | Rápido sem saturar a máquina |
| Combinar usuário comum e ambiente vazio | O host fica protegido da construção, e a construção do host |

## O que reter

| | |
|---|---|
| **Para lembrar** | Um programa herda o ambiente do shell que o lançou. `env -i NOME=valor comando` o substitui por um ambiente vazio mais o que se declara. `exec` substitui o shell em vez de iniciar um segundo: nada é executado depois dele. Um shell de login lê `~/.bash_profile`, um shell interativo sem login lê `~/.bashrc`. |
| **Ferramentas utilizáveis** | `env`, `env -i`, `exec`, `bash -l`, `bash --norc`, `su -`, `export`, `nproc`, `MAKEFLAGS`. |
| **Armadilhas a evitar** | `exec` no meio de um script; acreditar que um ambiente vazio é estanque, já que `/etc/bash.bashrc` é relido; `-j` sem número. |
| **Boas práticas** | Partir de um estado vazio e declarar o que se quer, como com `env -i`, um contêiner ou `venv`; verificar o resultado com `env`; combinar com um usuário comum. |
