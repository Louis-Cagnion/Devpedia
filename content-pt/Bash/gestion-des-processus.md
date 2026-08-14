---
order: 11
---

# Gestão de processos

Cada comando executado num terminal inicia um **processo**. O Bash permite executar comandos em segundo plano, monitorizar os processos em execução e encerrá-los de forma correta (ou não) quando necessário.

## Primeiro plano vs. fundo

Por padrão, um comando é executado em **primeiro plano**: o terminal aguarda que este termine antes de aceitar um novo comando.

```bash
long_traitement.sh &   # O «&» final executa o comando em segundo plano
echo "Le terminal reste disponible immédiatement"
```

## Gerir tarefas em segundo plano (`jobs`, `fg`, `bg`)

```bash
long_traitement.sh &
jobs           # enumera as tarefas em segundo plano da sessão atual
fg %1          # traz a tarefa número 1 para o primeiro plano
# Ctrl+Z suspende uma tarefa em primeiro plano (sem a encerrar)
bg %1          # reinicia em segundo plano uma tarefa suspensa com Ctrl+Z
```

## Ver os processos em curso (`ps`, `top`)

```bash
ps aux             # enumera todos os processos do sistema, com indicação do usuário, da CPU, da memória...
ps aux | grep php   # filtro para ver apenas os processos relacionados com «php»
top                 # visualização interativa, atualizada em tempo real, ordenada por consumo de CPU por padrão
```

## Encerrar um processo (`kill`)

`kill` envia um **sinal** a um processo, identificado pelo seu PID (*Process ID*):

```bash
kill 1234        # envia SIGTERM (15): solicita educadamente ao processo que termine de forma correta
kill -9 1234      # envia SIGKILL (9): força o encerramento imediato, sem permitir que o processo reaja
```

| Sinal | Número | Efeito |
|---|---|---|
| `SIGTERM` | 15 (padrão) | Pedido de encerramento ordenado — o processo pode interceptar este sinal para se encerrar de forma ordenada (fechar arquivos, guardar...) |
| `SIGKILL` | 9 | Paragem imediata e incondicional, impossível de interceptar ou ignorar |
| `SIGINT` | 2 | Sinal enviado por `Ctrl+C` a partir do terminal |
| `SIGTSTP` | 20 | Sinal enviado por `Ctrl+Z`: suspende o processo (controlável, ao contrário de `SIGKILL`) sem o encerrar |
| `SIGCONT` | 18 | Retoma a execução de um processo suspenso por `SIGTSTP` (é isto que é enviado por `bg` / `fg`, ver capítulo sobre a arquitetura de um shell) |

> **Nota:** «`kill -9`» deve ser utilizado apenas como último recurso — um processo encerrado com «`SIGKILL`» não tem qualquer hipótese de limpar o que deixou para trás (arquivos temporários, ligações abertas, bloqueios...). Tente sempre «`kill`» (SIGTERM) em primeiro lugar.

## Separar um processo do terminal (`nohup`)

Um processo iniciado em segundo plano com a opção «`&`» recebe, mesmo assim, um sinal de encerramento se o terminal que o iniciou for encerrado. A opção «`nohup`» (*sem desligamento*) protege-o contra isso:

```bash
nohup long_traitement.sh &
# o processo continua mesmo após o encerramento do terminal
# A sua saída padrão é redirecionada, por padrão, para um arquivo chamado nohup.out
```

## Encontrar o PID de um processo através do seu nome

```bash
pgrep -f "long_traitement.sh"   # exibe o(s) PID correspondente(s) ao padrão indicado
pkill -f "long_traitement.sh"    # localiza E encerra com um único comando (envia SIGTERM por padrão)
```
