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
echo "O terminal fica disponivel imediatamente"
```

## Gerenciar tarefas em segundo plano (`jobs`, `fg`, `bg`)

```bash
processamento_longo.sh &
jobs   # lista as tarefas em segundo plano da sessao atual
fg %1  # traz a tarefa numero 1 para o primeiro plano
# Ctrl+Z suspende uma tarefa em primeiro plano (sem para-la)
bg %1          # relanca em segundo plano uma tarefa suspensa por Ctrl+Z
```

`fg` e `bg` são abreviações diretas de seu sentido em inglês: `fg` = *foreground* (primeiro plano), `bg` = *background* (segundo plano): cada uma traz ou envia a tarefa `%1` para o plano correspondente. Muitos comandos e flags [Unix](/?c=shells&s=bash&p=scripts-et-shebang) seguem esse mesmo princípio de abreviação de uma palavra em inglês, o que ajuda a lembrá-los uma vez conhecida a palavra de origem: por exemplo, neste capítulo, `-f` (*full*/*format*, para `ps aux -f` ou o padrão completo de `pgrep -f`) ou `-9` para `SIGKILL`. A tabela de sinais abaixo detalha o sentido de cada um.

## Ver os processos em execução (`ps`, `top`)

```bash
ps aux             # lista todos os processos do sistema, com usuario, CPU, memoria...
ps aux | grep php  # filtra para ver apenas os processos relacionados a "php"
top                # visao interativa, atualizada ao vivo, ordenada por consumo de CPU por padrao
```

## Encerrar um processo (`kill`)

`kill` envia um **sinal** a um processo, identificado por seu PID (*Process ID*):

```bash
kill 1234     # envia SIGTERM (15): pede educadamente ao processo para terminar de forma limpa
kill -9 1234  # envia SIGKILL (9): forca a parada imediata, sem deixar o processo reagir
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

## Desconectar um processo do terminal (`nohup`)

Um processo lançado em segundo plano com `&` ainda recebe um sinal de parada se o terminal que o lançou for fechado. `nohup` (*no hang up*) o protege disso:

```bash
nohup processamento_longo.sh &
# o processo continua mesmo depois do fechamento do terminal
# sua saida padrao e redirecionada por padrao para um arquivo nohup.out
```

## Encontrar o PID de um processo pelo nome

```bash
pgrep -f "processamento_longo.sh"  # exibe o(s) PID correspondente(s) ao padrao dado
pkill -f "processamento_longo.sh"  # encontra E encerra em um unico comando (envia SIGTERM por padrao)
```

> **`kill` vs `pkill`**: `kill` precisa de um **PID** já conhecido (`kill 1234`): é o único jeito de enviar um sinal a um processo preciso sem errar o alvo. `pkill` evita precisar procurar esse PID manualmente: ele envia o sinal a todo processo cujo nome (ou linha de comando completa com `-f`) corresponde ao padrão dado, o que equivale a encadear `pgrep` e depois `kill` em cada PID encontrado. O risco de `pkill` é então atingir mais processos do que o previsto se o padrão for amplo demais (ex. `pkill -f script.sh` em uma máquina onde vários scripts contêm "script.sh" no nome).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um `&` final lança um comando em segundo plano. `kill` envia um sinal (SIGTERM por padrão, SIGKILL como último recurso); `trap` permite interceptar um sinal para uma limpeza controlada. |
| **Ferramentas utilizáveis** | `jobs`/`fg`/`bg`, `ps`/`top`, `pgrep`/`pkill`, `nohup`. |
| **Armadilhas a evitar** | Usar `kill -9` (SIGKILL) por reflexo: o processo então não tem nenhuma chance de limpar depois de si. |
| **Boas práticas** | Sempre tentar `kill` (SIGTERM) antes de `kill -9`; verificar o padrão de `pkill` antes de executá-lo, para não atingir mais processos do que o previsto. |
