---
order: 1
---

# Comandos básicos

Este capítulo já pressupõe conhecido o que é um [terminal](/?c=bases-de-l-informatique&p=le-terminal) e um [caminho de arquivo](/?c=bases-de-l-informatique&p=arborescence-et-chemins): ele cobre os primeiríssimos comandos Bash usados em um terminal, antes mesmo de escrever o menor script.

## Se locomover: `cd` e `pwd`

```bash
pwd            # exibe o diretorio atual (Print Working Directory)
cd Documentos  # move para o subdiretorio "Documentos"
cd ..          # sobe um nivel
cd -           # volta para o diretorio anterior
```

> **Armadilha:** `cd` sem argumento não "não faz nada": ele leva diretamente ao diretório pessoal (`$HOME`), o que surpreende quem esperava permanecer no lugar.
>
> **Boa prática:** verificar sua posição com `pwd` depois de um `cd` sem argumento, em vez de supor ter permanecido no mesmo lugar.

## Listar um diretório: `ls`

```bash
ls     # lista o conteudo do diretorio atual
ls -a  # inclui os arquivos ocultos (cujo nome comeca com um ponto)
ls -l  # exibe os detalhes (permissoes, tamanho, data) em vez de so os nomes
```

| Opção | Efeito |
|---|---|
| `-a` | Exibe também os arquivos/diretórios ocultos |
| `-l` | Formato detalhado (uma linha por arquivo, com permissões e tamanho) |
| `-la` | As duas combinadas: a ordem das letras não importa |

> **Armadilha:** um diretório que parece vazio ou incompleto com um simples `ls` pode na verdade conter arquivos ocultos (seu nome começa com um ponto, ex. `.env`, `.gitignore`), invisíveis sem `-a`.
>
> **Boa prática:** diante de um diretório cujo conteúdo parece inconsistente com o esperado, refazer o `ls` com `-a` antes de procurar mais longe.

## Ler o conteúdo de um arquivo: `cat`

```bash
cat arquivo.txt   # exibe todo o conteudo do arquivo no terminal
```

> **Nota:** para um arquivo longo demais para caber em uma tela, veja o capítulo sobre processamento de texto (`less`, `head`, `tail`); `cat` exibe tudo de uma vez, sem paginação.

> **Armadilha:** usar `cat` em um arquivo binário (uma imagem, um executável) em vez de um arquivo de texto. O terminal tenta exibir bytes que não são texto válido, o que pode deixá-lo visualmente corrompido (caracteres estranhos, cores que persistem), sem nada ter sido realmente quebrado.
>
> **Boa prática:** reservar `cat` apenas a arquivos de texto conhecidos. Se o terminal continuar exibido de forma inconsistente depois desse tipo de erro, o comando `reset` (ou fechar/reabrir o terminal) o coloca de volta em um estado limpo.

## Criar, copiar, mover, excluir

Esses comandos são cobertos junto com o sistema de permissões, no capítulo seguinte: [Permissões e manipulação de arquivos](/?c=shells&s=bash&p=permissions-et-fichiers).

## Obter ajuda: `man` e `--help`

```bash
man ls     # abre o manual completo do comando ls (q para sair)
ls --help  # resumo mais curto, direto no terminal
```

### O manual é dividido em várias seções

`man` não cobre apenas os comandos de terminal: é o manual de todo o sistema, dividido em **seções numeradas**, cada uma dedicada a uma categoria diferente de assunto.

| Seção | Conteúdo |
|---|---|
| 1 | Comandos de usuário (os digitados em um terminal: `ls`, `cd`, `grep`...) |
| 2 | Chamadas de sistema (funções fornecidas diretamente pelo kernel Linux) |
| 3 | Funções de biblioteca da linguagem C (`printf`, `malloc`...) |
| 5 | Formatos de arquivo e convenções (ex. a estrutura de `/etc/passwd`) |
| 7 | Diversos: convenções gerais, protocolos |
| 8 | Comandos de administração do sistema (geralmente reservados ao root) |

Isso fica concreto assim que um mesmo nome existe em **várias** seções ao mesmo tempo: `printf` é ao mesmo tempo um comando de terminal (seção 1) e uma função da linguagem C (seção 3, cf. [capítulo C dedicado](/?c=langages-de-programmation&s=c&p=fonctions-variadiques)), e são duas páginas de manual completamente diferentes:

```bash
man printf    # sem especificar, abre a secao mais baixa encontrada: aqui, a 1 (comando)
man 3 printf  # forca a abertura da secao 3: a funcao C, nao o comando
```

Para saber em quais seções um nome existe antes de escolher:

```bash
man -f printf  # lista todas as secoes onde "printf" tem uma pagina de manual
whatis printf  # equivalente, com uma descricao de uma linha para cada uma
```

### Armadilha: `man cd` não funciona como esperado

```bash
man cd
# No manual entry for cd
```

`cd` não é um programa separado no disco: é um **comando interno** (*builtin*), executado diretamente pelo próprio Bash em vez de lançado como um processo à parte (veja [Executar um comando: builtin vs externo](/?c=shells&s=bash&p=architecture-dun-shell) para o porquê de `cd` precisar obrigatoriamente funcionar assim). `man` procura uma página dedicada a um executável: não há nenhuma para um builtin. O comando certo nesse caso é `help`:

```bash
help cd   # documentacao do builtin cd, fornecida pelo proprio Bash
man bash  # alternativa: todos os builtins tambem estao documentados ali, na secao "SHELL BUILTIN COMMANDS"
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `pwd` exibe onde se está, `cd` muda de diretório, `ls` lista um diretório, `cat` exibe um arquivo. As opções (`-l`, `-a`) modificam o comportamento de um comando sem mudar seu nome. |
| **Ferramentas utilizáveis** | `man <comando>` para a documentação completa, `<comando> --help` para um resumo rápido, `man -f <nome>`/`whatis <nome>` para ver em quais seções um nome existe, `help <builtin>` para um comando interno como `cd`. |
| **Armadilhas a evitar** | `cd` sem argumento leva ao diretório pessoal (`$HOME`) em vez de não fazer nada. `man <nome>` sem especificar seção abre a primeira encontrada: não necessariamente a desejada se o nome existe em outro lugar (ex. `printf`, comando **e** função C). `man <builtin>` (ex. `man cd`) falha simplesmente: um builtin não tem página dedicada, `help` o substitui. |
| **Boas práticas** | Verificar sua posição com `pwd` antes de um comando que age sobre um caminho relativo, em vez de supô-la. |
