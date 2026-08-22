---
order: 9
---

# Redirecionamentos e pipes

Cada comando Unix se comunica por padrão via três fluxos: a **entrada padrão** (`stdin`, o que ele lê), a **saída padrão** (`stdout`, o que ele exibe normalmente) e a **saída de erro** (`stderr`, para onde vão as mensagens de erro). Os redirecionamentos e os pipes permitem redirecionar esses fluxos para um arquivo ou para outro comando, em vez de para o terminal.

> **Nota:** esses "fluxos" são na verdade **descritores de arquivo** numerados (`0`, `1`, `2`): veja [o capítulo sobre chamadas de sistema e descritores de arquivo](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) (tópico C) para o que realmente acontece no nível do sistema operacional quando os redirecionamos.

## Redirecionar a saída para um arquivo

```bash
echo "Ola" > arquivo.txt   # sobrescreve arquivo.txt (ou o cria) com esse conteudo
echo "De novo" >> arquivo.txt  # adiciona ao final de arquivo.txt, sem sobrescrever
```

> **Nota:** `>` sobrescreve silenciosamente o conteúdo existente do arquivo alvo: um erro clássico é usar `>` onde `>>` era desejado, perdendo o conteúdo anterior sem aviso.

## Redirecionar a entrada a partir de um arquivo

```bash
sort < lista.txt   # le lista.txt como entrada padrao de "sort", em vez de esperar uma digitacao
```

## Redirecionar a saída de erro

Os fluxos são numerados: `0` = entrada padrão, `1` = saída padrão, `2` = saída de erro.

```bash
comando_que_falha 2> erros.log       # apenas a saida de erro vai para erros.log
comando 1> saida.log 2> erros.log    # separa saida normal e erros em dois arquivos
comando > tudo.log 2>&1              # redireciona stdout para tudo.log, DEPOIS stderr para onde vai stdout
comando &> tudo.log                  # atalho Bash equivalente a "> tudo.log 2>&1"
```

> **Nota:** a ordem importa para `2>&1`. `2>&1 > arquivo` **não** funciona como esperado: nesse momento, `2` ainda está redirecionado para o terminal (a saída padrão de então), e só `1` vai depois para `arquivo`. É preciso escrever `> arquivo 2>&1`: primeiro redirecionar `1` para `arquivo`, depois fazer `2` apontar para o mesmo alvo que `1` **nesse instante preciso**.

## `/dev/null`: ignorar uma saída

Um arquivo especial que "engole" tudo que se escreve nele, sem nunca armazenar nada: útil para descartar um fluxo do qual não se precisa:

```bash
comando_barulhento > /dev/null 2>&1   # ignora toda saida normal E todo erro
```

## Os pipes (`|`): encadear comandos

Um pipe conecta a saída padrão de um comando à entrada padrão do seguinte:

```bash
ls -l | grep ".txt"                # mantem apenas as linhas contendo ".txt"
grep "404" access.log | wc -l      # conta as linhas contendo "404" no arquivo
ps aux | sort -k 3 -nr | head -5   # os 5 processos que mais consomem CPU
```

Cada comando de um pipe é executado simultaneamente, a saída de um alimentando a entrada do seguinte à medida que ocorre: não é uma execução sequencial com armazenamento intermediário.

## Encadear comandos conforme seu resultado: `;`, `&&`, `||`

Um pipe faz circular **dados**. Esses três operadores, por sua vez, controlam a **execução**: eles decidem se o comando seguinte é lançado, com base no código de saída do anterior (`0` = sucesso, veja [Escrever e executar um script Bash](/?c=shells&s=bash&p=scripts-et-shebang)).

```bash
comando1 ; comando2   # lanca comando2 em todos os casos
comando1 && comando2  # lanca comando2 SOMENTE se comando1 deu certo
comando1 || comando2  # lanca comando2 SOMENTE se comando1 falhou
```

Na prática:

```bash
mkdir -p build && cd build                 # so entra no diretorio se ele foi realmente criado
./configure && make && make install        # a cadeia para assim que uma etapa falha
grep -q "TODO" *.md || echo "nenhum TODO"  # mensagem de reserva se grep nao encontra nada
```

Fala-se de avaliação de **curto-circuito** (*short-circuit*): `&&` só executa a continuação se necessário, exatamente como os operadores lógicos de outras linguagens.

> Não confunda esses `&&`/`||` com os vistos no capítulo sobre condições. Dentro de `[[ ... ]]`, são operadores **lógicos** que combinam dois testes. Entre dois comandos, são operadores de **controle de fluxo** baseados nos códigos de saída. A grafia é idêntica, o papel é diferente.

### A armadilha do `&& ... || ...`

Escrever um "se/senão" em uma linha é tentador, mas não se comporta como um `if/else`:

```bash
comando && echo "OK" || echo "FALHA"
```

Se `comando` tem sucesso mas `echo "OK"` falha (caso raro mas possível, por exemplo se a saída está fechada), então o `||` é disparado e `FALHA` também é exibido. Para uma lógica condicional real, um `if` explícito é mais seguro:

```bash
if comando; then echo "OK"; else echo "FALHA"; fi
```

### Atenção com `set -e`

Um comando colocado à esquerda de um `&&` ou de um `||` é considerado "testado": sua falha **não interrompe** o script mesmo sob `set -e`. É isso que permite escrever `grep padrao arquivo || true` para neutralizar voluntariamente uma falha esperada, mas também é uma fonte de surpresa se você achava que `set -e` protegia toda a linha.

## `tee`: redirecionar mantendo uma exibição

`tee` escreve sua saída ao mesmo tempo em um arquivo **e** para a saída padrão (útil para ver um resultado enquanto o salva):

```bash
ls -l | tee resultados.txt   # exibe o resultado na tela E o salva em resultados.txt
```

## Resumo dos símbolos

| Símbolo | Efeito |
|---|---|
| `>` | Redireciona a saída padrão, sobrescreve o arquivo |
| `>>` | Redireciona a saída padrão, adiciona ao final |
| `<` | Redireciona a entrada padrão a partir de um arquivo |
| `2>` | Redireciona a saída de erro |
| `&>` | Redireciona saída padrão E erro para o mesmo alvo |
| `\|` | Conecta a saída de um comando à entrada do seguinte |
| `;` | Encadeia dois comandos, sem condição |
| `&&` | Executa o seguinte apenas se o anterior teve sucesso |
| `\|\|` | Executa o seguinte apenas se o anterior falhou |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `>`/`>>`/`<` redirecionam os fluxos stdin/stdout/stderr para ou a partir de um arquivo; `\|` conecta a saída de um comando à entrada do seguinte. `&&`/`\|\|`/`;` encadeiam comandos conforme seu código de saída. |
| **Ferramentas utilizáveis** | `2>&1` (fundir stderr em stdout), `/dev/null` (ignorar uma saída), `tee` (exibir e salvar ao mesmo tempo). |
| **Armadilhas a evitar** | `>` que sobrescreve silenciosamente um arquivo existente; a ordem de `2>&1` em relação a `>` (`2>&1 > arquivo` não faz o que se espera). |
| **Boas práticas** | Escrever `> arquivo 2>&1` (nunca o inverso); preferir um `if` explícito a um `&& ... \|\| ...` assim que a lógica condicional for realmente importante. |
