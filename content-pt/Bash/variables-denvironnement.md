---
order: 3
---

# Variáveis de ambiente

Uma variável de ambiente é uma variável transmitida automaticamente aos processos iniciados por um shell — ao contrário de uma variável Bash clássica, que permanece local ao script que a declara, a menos que seja explicitamente **exportada**.

## Variável local vs. variável exportada

```bash
NOME="Jean"          # Variável clássica do shell: visível apenas neste script/nesta sessão
export NOME          # a partir de agora, transmitida aos processos filhos (outros scripts, comandos...)

export EMAIL="jean@exemple.com"  # declaração e exportação numa única linha
```

```bash
# sous_script.sh
echo "$NOME"    # exibe «Jean» se NOME tiver sido exportado pelo script chamador; caso contrário, fica vazio
```

> **Nota:** a exportação funciona apenas num sentido: do pai para o filho. Um sub-script que altere uma variável exportada não pode repercutir essa alteração no script que o iniciou — cada processo tem a sua própria cópia do ambiente.

## Variáveis de ambiente comuns

```bash
echo $PATH    # lista das pastas onde o shell procura os comandos executáveis
echo $HOME    # pasta pessoal do utilizador atual
echo $USER    # nome do utilizador atual
echo $PWD     # pasta de trabalho atual
echo $SHELL   # caminho do shell utilizado
```

## `$PATH` : como é que o shell encontra um comando

Quando escreve «`ls`», o shell procura um executável chamado «`ls`» em cada uma das pastas listadas em «`$PATH`», separadas por «`:`»:

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin

export PATH="$PATH:/mon/dossier/scripts"  # adiciona uma pasta adicional à pesquisa
```

> **Nota:** a ordem é importante — é utilizada a primeira pasta do `$PATH` que contenha um executável com esse nome, o que permite, por exemplo, dar prioridade a uma versão personalizada de um comando em detrimento da versão do sistema.

## Ficheiros de configuração do shell

| Ficheiro | Carregado em |
|---|---|
| `~/.bashrc` | A cada novo terminal interativo (sem início de sessão) |
| `~/.bash_profile` (ou `~/.profile`) | Ao iniciar sessão (shell de início de sessão) |
| `/etc/environment` | Ao nível do sistema, para todos os utilizadores |

É no ficheiro «`~/.bashrc`» que são normalmente adicionados os «`export PATH=...`», os «`alias`» ou variáveis personalizadas destinadas a estarem disponíveis em cada novo terminal.

## `alias` : simplificar comandos frequentes

```bash
alias ll="ls -la"
alias gs="git status"

ll   # equivalente a digitar «ls -la»
```

Um `alias` definido diretamente no terminal não é mantido após o encerramento da sessão — para que esteja disponível em cada novo terminal, deve ser adicionado ao ficheiro `~/.bashrc`.

## `fonte` : recarregar um ficheiro de configuração

Após uma alteração em `~/.bashrc`, o comando `fonte` aplica as alterações na sessão atual, sem necessidade de abrir um novo terminal:

```bash
fonte ~/.bashrc
# equivalente, mais curto:
. ~/.bashrc
```
