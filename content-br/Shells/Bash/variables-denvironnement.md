---
order: 4
---

# Variáveis de ambiente

Uma variável de ambiente é uma variável transmitida automaticamente aos processos que um shell lança, ao contrário de uma variável Bash comum, que permanece local ao script que a declara, exceto se explicitamente **exportada**.

## Variável local vs variável exportada

```bash
NOME="Joao"  # variavel de shell comum: visivel apenas nesse script/sessao
export NOME  # a partir de agora, transmitida aos processos filhos (outros scripts, comandos...)

export EMAIL="joao@exemplo.com"  # declaracao e export em uma unica linha
```

```bash
# subscript.sh
echo "$NOME"    # exibe "Joao" se NOME foi exportada pelo script chamador, vazio senao
```

> **Nota:** o export só funciona em um sentido: do pai para o filho. Um subscript que modifica uma variável exportada não pode repassar essa mudança para o script que o lançou: cada processo tem sua própria cópia do ambiente.

## Variáveis de ambiente comuns

```bash
echo $PATH   # lista dos diretorios onde o shell procura os comandos executaveis
echo $HOME   # diretorio pessoal do usuario atual
echo $USER   # nome do usuario atual
echo $PWD    # diretorio de trabalho atual
echo $SHELL  # caminho do shell usado
```

## `$PATH`: como o shell encontra um comando

Quando você digita `ls`, o shell procura um executável chamado `ls` em cada um dos diretórios listados em `$PATH`, separados por `:`:

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin

export PATH="$PATH:/meu/diretorio/scripts"  # adiciona um diretorio extra a busca
```

> **Nota:** a ordem importa: o primeiro diretório do `$PATH` que contém um executável com esse nome é usado, o que permite por exemplo fazer uma versão personalizada de um comando passar antes da versão do sistema.

## Arquivos de configuração do shell

| Arquivo | Carregado quando |
|---|---|
| `~/.bashrc` | A cada novo terminal interativo (não login) |
| `~/.bash_profile` (ou `~/.profile`) | Na conexão (shell de login) |
| `/etc/environment` | No nível do sistema, para todos os usuários |

É em `~/.bashrc` que tipicamente se adicionam os `export PATH=...`, os `alias`, ou variáveis personalizadas destinadas a estar disponíveis em cada novo terminal.

## `alias`: abreviar comandos frequentes

```bash
alias ll="ls -la"
alias gs="git status"

ll   # equivalente a digitar "ls -la"
```

Um `alias` definido diretamente no terminal não sobrevive ao fechamento da sessão: para que ele fique disponível em cada novo terminal, precisa ser adicionado em `~/.bashrc`.

## `source`: recarregar um arquivo de configuração

Depois de uma modificação de `~/.bashrc`, `source` aplica as mudanças na sessão atual, sem precisar abrir um novo terminal:

```bash
source ~/.bashrc
# equivalente, mais curto:
. ~/.bashrc
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma variável de ambiente é transmitida automaticamente aos processos filhos, ao contrário de uma variável Bash comum: `export` a faz passar de uma para outra, em um único sentido (pai para filho). |
| **Ferramentas utilizáveis** | `export`, `$PATH`, `~/.bashrc` (terminal interativo) vs `~/.bash_profile` (login), `alias`, `source`. |
| **Armadilhas a evitar** | Modificar uma variável exportada em um subscript esperando que isso se reflita no script chamador: cada processo tem sua própria cópia do ambiente. |
| **Boas práticas** | Colocar os `export`/`alias` destinados a cada novo terminal em `~/.bashrc`; usar `source ~/.bashrc` para aplicar uma mudança sem reabrir um terminal. |
