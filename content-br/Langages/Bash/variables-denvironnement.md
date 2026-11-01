---
order: 4
---

# Variáveis de ambiente

Uma variável de ambiente é uma variável transmitida automaticamente aos processos que um shell lança, ao contrário de uma variável Bash comum, que permanece local ao script que a declara, exceto se explicitamente **exportada**.

## Variável local vs variável exportada

```bash
NOME="Joao"  # variável de shell comum: visível apenas nesse script/sessão
# a partir de agora, transmitida aos processos filhos (outros scripts, comandos...)
export NOME

export EMAIL="joao@exemplo.com"  # declaração e export em uma única linha
```

```bash
# subscript.sh
echo "$NOME"    # exibe "Joao" se NOME foi exportada pelo script chamador, vazio senão
```

> **Nota:** o export só funciona em um sentido: do pai para o filho. Um subscript que modifica uma variável exportada não pode repassar essa mudança para o script que o lançou: cada processo tem sua própria cópia do ambiente.

## Variáveis de ambiente comuns

```bash
echo $PATH   # lista dos diretórios onde o shell procura os comandos executáveis
echo $HOME   # diretório pessoal do usuário atual
echo $USER   # nome do usuário atual
echo $PWD    # diretório de trabalho atual
echo $SHELL  # caminho do shell usado
```

## `$PATH`: como o shell encontra um comando

Quando você digita `ls`, o shell procura um executável chamado `ls` em cada um dos diretórios listados em `$PATH`, separados por `:`:

```bash
echo $PATH
# /usr/local/bin:/usr/bin:/bin

export PATH="$PATH:/meu/diretorio/scripts"  # adiciona um diretório extra a busca
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

## Uma variável exportada só vive no seu terminal

`export` transmite uma variável aos programas lançados **a partir deste shell**: não a outro [terminal](/?c=fondamentaux&s=bases-de-l-informatique&p=le-terminal) aberto ao lado, que é outro shell, com o seu próprio ambiente. Para verificar, abra dois terminais:

```bash
# Terminal 1: exporta uma variável e depois a exibe entre colchetes
export MINHA_VAR=ola
echo "terminal 1: [$MINHA_VAR]"
```

```bash
# Terminal 2 (outra janela): a mesma variável não existe aqui
echo "terminal 2: [$MINHA_VAR]"
```

```text
terminal 1: [ola]
terminal 2: []
```

Para que uma variável esteja presente em cada novo terminal, é preciso escrevê-la em `~/.bashrc` (veja mais acima).

## Uma variável vazia em um `rm -rf`

`rm -rf` apaga um diretório e todo o seu conteúdo, sem lixeira nem confirmação. Se a variável colocada antes do `/` estiver **vazia** (nunca definida, erro de digitação no nome, valor não transmitido), o shell a substitui por nada: o comando passa a ter como alvo a raiz do sistema, `/`. Nunca o execute para verificar: `echo` mostra o que o shell calculou, sem apagar nada.

```bash
# VAR está definida, mas vazia
VAR=""
# echo mostra o comando como o shell o montaria, sem executá-lo
echo rm -rf $VAR/
# os colchetes continuam visíveis mesmo quando o valor é vazio
echo "[$VAR]"
# com um valor normal, o comando visa o diretório desejado
VAR=/tmp/teste
echo rm -rf $VAR/
echo "[$VAR]"
```

```text
rm -rf /
[]
rm -rf /tmp/teste/
[/tmp/teste]
```

| Escrita | Se `VAR` estiver vazia |
|---|---|
| `rm -rf $VAR/` | Vira `rm -rf /`: a raiz é o alvo |
| `rm -rf "${VAR:?variável vazia}/"` | O Bash para com o erro `VAR: variável vazia`, nada é apagado |

Antes de qualquer remoção, `echo "[$VAR]"` mostra o valor: `[]` denuncia uma variável vazia, enquanto um `echo $VAR` sozinho só exibiria uma linha em branco, fácil de não notar.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma variável de ambiente é transmitida automaticamente aos processos filhos, ao contrário de uma variável Bash comum: `export` a faz passar de uma para outra, em um único sentido (pai para filho). |
| **Ferramentas utilizáveis** | `export`, `$PATH`, `~/.bashrc` (terminal interativo) vs `~/.bash_profile` (login), `alias`, `source`. |
| **Armadilhas a evitar** | Modificar uma variável exportada em um subscript esperando que isso se reflita no script chamador: cada processo tem sua própria cópia do ambiente. Esperar que outro terminal veja uma variável exportada em outro lugar. Escrever `rm -rf $VAR/`: se `VAR` estiver vazia, o comando visa a raiz. |
| **Boas práticas** | Colocar os `export`/`alias` destinados a cada novo terminal em `~/.bashrc`; usar `source ~/.bashrc` para aplicar uma mudança sem reabrir um terminal. Exibir `echo "[$VAR]"` antes de uma remoção (os colchetes revelam um valor vazio) e proteger a variável com `"${VAR:?}"`. |
