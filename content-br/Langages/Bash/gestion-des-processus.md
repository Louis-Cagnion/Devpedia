---
order: 12
---

# O gerenciamento de processos

Cada comando lançado em um terminal inicia um **processo**. O Bash permite lançar comandos em segundo plano, monitorar os processos em execução, e pará-los de forma controlada (ou não) quando necessário.

> As ferramentas deste capítulo exibem o consumo de **CPU** (*Central Processing Unit*, o processador) de cada processo, em porcentagem de um núcleo. Um valor acima de 100% não é então uma anomalia: significa que o processo ocupa vários núcleos em paralelo.

## Primeiro plano vs segundo plano

Por padrão, um comando executa em **primeiro plano**: o terminal espera ele terminar antes de aceitar um novo comando.

```bash
processamento_longo.sh &   # o '&' final lanca o comando em SEGUNDO PLANO
echo "O terminal fica disponível imediatamente"
```

## Gerenciar tarefas em segundo plano (`jobs`, `fg`, `bg`)

```bash
processamento_longo.sh &
jobs   # lista as tarefas em segundo plano da sessão atual
fg %1  # traz a tarefa número 1 para o primeiro plano
# Ctrl+Z suspende uma tarefa em primeiro plano (sem para-la)
bg %1          # relanca em segundo plano uma tarefa suspensa por Ctrl+Z
```

`fg` e `bg` são abreviações diretas de seu sentido em inglês: `fg` = *foreground* (primeiro plano), `bg` = *background* (segundo plano): cada uma traz ou envia a tarefa `%1` para o plano correspondente. Muitos comandos e flags [Unix](/?c=shells&s=bash&p=scripts-et-shebang) seguem esse mesmo princípio de abreviação de uma palavra em inglês, o que ajuda a lembrá-los uma vez conhecida a palavra de origem: por exemplo, neste capítulo, `-f` (*full*/*format*, para `ps aux -f` ou o padrão completo de `pgrep -f`) ou `-9` para `SIGKILL`. A tabela de sinais abaixo detalha o sentido de cada um.

## Ver os processos em execução (`ps`, `top`)

```bash
ps aux             # lista todos os processos do sistema, com usuário, CPU, memória...
ps aux | grep php  # filtra para ver apenas os processos relacionados a "php"
# visão interativa, atualizada ao vivo, ordenada por consumo de CPU por padrão
top
```

## Encerrar um processo (`kill`)

`kill` envia um **sinal** a um processo, identificado por seu PID (*Process ID*):

```bash
kill 1234     # envia SIGTERM (15): pede educadamente ao processo para terminar de forma limpa
kill -9 1234  # envia SIGKILL (9): força a parada imediata, sem deixar o processo reagir
```

| Sinal | Número | Efeito |
|---|---|---|
| `SIGTERM` | 15 (padrão) | Pedido de parada limpa: o processo pode interceptar esse sinal para se fechar de forma controlada (fechar arquivos, salvar...) |
| `SIGKILL` | 9 | Parada imediata e incondicional, impossível de interceptar ou ignorar |
| `SIGINT` | 2 | Sinal enviado por `Ctrl+C` a partir do terminal |
| `SIGTSTP` | 20 | Sinal enviado por `Ctrl+Z`: suspende o processo (controlável, ao contrário de `SIGKILL`) sem encerrá-lo |
| `SIGCONT` | 18 | Retoma a execução de um processo suspenso por `SIGTSTP` (é o que `bg`/`fg` envia, veja [Como funciona um shell](/?c=shells&s=bash&p=architecture-dun-shell)) |

> **Nota:** `kill -9` deve continuar sendo um último recurso: um processo morto com `SIGKILL` não tem nenhuma chance de limpar depois de si (arquivos temporários, conexões abertas, locks...). Sempre tentar `kill` (SIGTERM) primeiro.

## Interceptar um sinal (`trap`)

`trap` permite a um script executar código em resposta a um sinal recebido, em vez de sofrer a parada padrão:

```bash
trap 'echo "Parada limpa"; rm -f arquivo.tmp' SIGTERM
```

Um sinal não interceptável como `SIGKILL` ignora totalmente `trap`: é justamente por isso que ele continua sendo o último recurso visto acima.

## Remover um arquivo temporário sem falta: `mktemp` e `trap`

Um script que cria um arquivo temporário deve removê-lo **seja qual for a forma como termine**: fim normal, erro, Ctrl-C, `kill`. O [`mktemp`](https://www.gnu.org/software/coreutils/manual/html_node/mktemp-invocation.html) cria um arquivo vazio com um nome único e imprevisível (da forma `/tmp/tmp.7nzzmlI0bS`) e mostra seu caminho; `mktemp -d` cria uma pasta da mesma maneira.

```bash
tmp=$(mktemp) || exit 1   # arquivo com nome único; para se não puder ser criado
trap 'rm -f "$tmp"' EXIT  # remoção em qualquer saída do script
trap 'exit 130' INT       # Ctrl-C: sair, o que dispara o trap EXIT
trap 'exit 143' TERM      # SIGTERM (enviado por kill): idem
```

Os códigos 130 e 143 seguem a convenção "128 + número do sinal" (SIGINT é o sinal 2, SIGTERM o 15). Resultado medido: o arquivo criado pelo `mktemp` é removido?

| Interpretador | Fim do script | Nenhum `trap` | `EXIT` sozinho | `EXIT` + `INT` + `TERM` |
|---|---|---|---|---|
| Bash | normal | fica | removido | removido |
| Bash | Ctrl-C | fica | removido | removido |
| Bash | SIGTERM | fica | removido | removido |
| Zsh | normal | fica | removido | removido |
| Zsh | Ctrl-C | fica | **fica** | removido |
| Zsh | SIGTERM | fica | **fica** | removido |

O Bash executa o `trap` de `EXIT` mesmo quando um sinal o interrompe; o zsh não. Escrever os três `trap` torna o script correto nos dois shells.

> **Armadilha:** um nome fixo (`/tmp/meu_script.tmp`). Duas execuções simultâneas se atropelam, e outro usuário da máquina que adivinhe o nome pode colocar ali um link simbólico para um arquivo sensível, que o script vai sobrescrever.
>
> **Boa prática:** sempre usar `mktemp` e colocar o `trap` antes de criar o arquivo (com `tmp=` vazio no início: `rm -f ""` não faz nada) para não deixar nenhuma janela em que um sinal deixaria o arquivo para trás.

> **Nota:** um script iniciado em segundo plano por um shell não interativo (`script.sh &`) tem o `SIGINT` ignorado desde o início, e um sinal ignorado na entrada não pode ser interceptado ([sinais no Bash](https://www.gnu.org/software/bash/manual/bash.html#Signals)). Testar a limpeza com Ctrl-C em um terminal real, ou com `kill -TERM`. O `SIGKILL` continua impossível de interceptar: o arquivo permanece então no lugar.

## Limitar a duração de um comando: `timeout` e Ctrl-C

O `timeout` (GNU coreutils) executa um comando e o interrompe se ele ultrapassar uma duração:

```bash
timeout 30 ./processamento.sh               # interrompido aos 30 s: código de saída 124
timeout --foreground 30 ./processamento.sh  # idem, mas o Ctrl-C também o alcança
timeout -k 5 30 ./processamento.sh          # SIGKILL 5 s depois do SIGTERM se preciso: código 137
```

| Situação | Código de saída do `timeout` |
|---|---|
| O comando termina a tempo | O dele |
| Prazo excedido: SIGTERM enviado | 124 |
| Prazo excedido, SIGTERM ignorado, depois SIGKILL (`-k`) | 137 |

Para poder interromper toda a descendência do comando, o `timeout` se coloca em seu **próprio grupo de processos** (veja [Como funciona um shell](/?c=shells&s=bash&p=architecture-dun-shell)). Ora, o terminal envia o Ctrl-C (SIGINT) apenas ao grupo de **primeiro plano**: nem o `timeout` nem o comando o recebem.

Medido em `timeout 20 sleep 8` executado por um script, com Ctrl-C digitado 0,8 s após o início:

| Opção | Após o Ctrl-C |
|---|---|
| Nenhuma | Nada para: o script espera o fim normal do `sleep` (7,2 s depois) e continua como se nada tivesse acontecido |
| `--foreground` | Parada imediata |

> **Armadilha:** o `--foreground` não delega mais a parada a todo um grupo: ao estourar o prazo, os **filhos** do comando não são mais interrompidos ([manual do `timeout`](https://www.gnu.org/software/coreutils/manual/html_node/timeout-invocation.html)).
>
> **Boa prática:** `--foreground` para um script que uma pessoa inicia em um terminal e precisa poder interromper; sem a opção para um script sem terminal (tarefa agendada) que deve cortar toda a descendência ao estourar o prazo.

## Desconectar um processo do terminal (`nohup`)

Um processo lançado em segundo plano com `&` ainda recebe um sinal de parada se o terminal que o lançou for fechado. `nohup` (*no hang up*) o protege disso:

```bash
nohup processamento_longo.sh &
# o processo continua mesmo depois do fechamento do terminal
# sua saída padrão é redirecionada por padrão para um arquivo nohup.out
```

## Encontrar o PID de um processo pelo nome

```bash
pgrep -f "processamento_longo.sh"  # exibe o(s) PID correspondente(s) ao padrão dado
# encontra E encerra em um único comando (envia SIGTERM por padrão)
pkill -f "processamento_longo.sh"
```

> **`kill` vs `pkill`**: `kill` precisa de um **PID** já conhecido (`kill 1234`): é o único jeito de enviar um sinal a um processo preciso sem errar o alvo. `pkill` evita precisar procurar esse PID manualmente: ele envia o sinal a todo processo cujo nome (ou linha de comando completa com `-f`) corresponde ao padrão dado, o que equivale a encadear `pgrep` e depois `kill` em cada PID encontrado. O risco de `pkill` é então atingir mais processos do que o previsto se o padrão for amplo demais (ex. `pkill -f script.sh` em uma máquina onde vários scripts contêm "script.sh" no nome).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um `&` final lança um comando em segundo plano. `kill` envia um sinal (SIGTERM por padrão, SIGKILL como último recurso); `trap` permite interceptar um sinal para uma limpeza controlada. O `mktemp` cria um arquivo temporário com nome único; um `trap` em `EXIT`, `INT` e `TERM` o remove seja qual for a saída do script (`EXIT` sozinho basta no Bash, não no zsh). O `timeout` interrompe um comando longo demais (código 124), mas o Ctrl-C só o alcança com `--foreground`. |
| **Ferramentas utilizáveis** | `jobs`/`fg`/`bg`, `ps`/`top`, `pgrep`/`pkill`, `nohup`. |
| **Armadilhas a evitar** | Usar `kill -9` (SIGKILL) por reflexo: o processo então não tem nenhuma chance de limpar depois de si. Um nome de arquivo temporário fixo. Contar só com `trap … EXIT` no zsh. Testar a limpeza com Ctrl-C em um script iniciado com `&`. Esquecer o `--foreground` em um script interativo, ou usá-lo onde é preciso cortar toda a descendência. |
| **Boas práticas** | Sempre tentar `kill` (SIGTERM) antes de `kill -9`; verificar o padrão de `pkill` antes de executá-lo, para não atingir mais processos do que o previsto. Colocar o `trap` antes do `mktemp` e escrevê-lo em `EXIT`, `INT` e `TERM`; escolher `--foreground` conforme o script seja iniciado por uma pessoa ou por uma tarefa agendada. |
