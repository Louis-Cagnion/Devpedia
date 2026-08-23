---
order: 12
---

# O gerenciamento de processos

Como no [Bash](/?c=shells&s=bash&p=bash), cada comando lançado inicia um **processo**; o PowerShell também permite lançar comandos em segundo plano, monitorar os processos em execução, e pará-los de forma controlada (ou não).

## Primeiro plano vs segundo plano

```powershell
Start-Job -ScriptBlock { .\processamento_longo.ps1 }   # lanca como tarefa em segundo plano (job)
Write-Output "O console fica disponivel imediatamente"
```

## Gerenciar tarefas em segundo plano (`Get-Job`, `Receive-Job`)

```powershell
$job = Start-Job -ScriptBlock { .\processamento_longo.ps1 }
Get-Job          # lista os jobs da sessao atual, com seu estado
Wait-Job $job    # espera o fim do job (bloqueante), equivalente de um "fg" que esperaria
Receive-Job $job # recupera a saida produzida pelo job
```

> **Nota:** ao contrário do Bash onde `fg`/`bg` alternam uma tarefa entre primeiro plano e segundo plano da **mesma** sessão do console, um `Job` do PowerShell roda em um processo separado desde o início: `Receive-Job` recupera seu resultado depois de terminado, em vez de "trazê-lo de volta" para o console atual.

## Ver os processos em execução (`Get-Process`)

```powershell
Get-Process                                                         # lista todos os processos, com CPU, memoria, PID...
Get-Process | Where-Object { $_.Name -like "*chrome*" }             # filtra por nome, equivalente de "ps aux | grep"
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5  # os 5 processos mais pesados em CPU
```

## Encerrar um processo (`Stop-Process`)

```powershell
Stop-Process -Id 1234         # pede a parada do processo (equivalente mais proximo de SIGTERM)
Stop-Process -Id 1234 -Force  # parada forcada, sem esperar um fechamento limpo (equivalente de SIGKILL)
Stop-Process -Name "notepad"  # mira pelo nome em vez do PID
```

> **Nota:** o Windows não tem um verdadeiro equivalente dos sinais Unix (`SIGTERM`, `SIGKILL`, `SIGINT`...): `Stop-Process` sem `-Force` pede ao processo para terminar, mas o mecanismo subjacente continua diferente do envio de um sinal interceptável como no Unix; a maioria das aplicações Windows aliás não tem um manipulador dedicado para "se fechar de forma limpa" à maneira de um [`trap SIGTERM`](/?c=shells&s=bash&p=gestion-des-processus) no Bash.

| Ação | Bash (sinal) | PowerShell |
|---|---|---|
| Pedir uma parada limpa | `kill` (`SIGTERM`) | `Stop-Process -Id <pid>` |
| Forçar a parada | `kill -9` (`SIGKILL`) | `Stop-Process -Id <pid> -Force` |
| Interromper pelo teclado | `Ctrl+C` (`SIGINT`) | `Ctrl+C` (dispara uma exceção `PipelineStoppedException`) |

## Desconectar um processo do console

Ao contrário de `nohup` no Bash, um `Job` do PowerShell (`Start-Job`) já roda em um processo separado do processo do console: fechar o console então não necessariamente interrompe o job dependendo do contexto (sessão local vs remota), sem precisar de uma ferramenta dedicada equivalente a `nohup`.

## Encontrar um processo pelo nome

```powershell
Get-Process -Name "*processamento_longo*"                 # equivalente de pgrep
Get-Process -Name "*processamento_longo*" | Stop-Process  # encontra E encerra, equivalente de pkill
```

> **`Get-Process` vs `Stop-Process`**: como o par `pgrep`/`pkill` no Bash, buscar um processo (leitura) e encerrá-lo (ação) continuam sendo duas cmdlets distintas, combinadas por um pipe em vez de por uma flag compartilhada. O mesmo risco existe que com `pkill`: um filtro `-Name` amplo demais pode atingir mais processos do que o previsto.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `Start-Job` lança uma tarefa em segundo plano em um processo separado. `Stop-Process` pede ou força a parada de um processo; o Windows não tem um verdadeiro equivalente dos sinais Unix. |
| **Ferramentas utilizáveis** | `Get-Job`/`Receive-Job`/`Wait-Job`, `Get-Process`, `Stop-Process -Force`. |
| **Armadilhas a evitar** | Mirar `Stop-Process` com um filtro `-Name` amplo demais: risco de parar mais processos do que o previsto. |
| **Boas práticas** | Tentar `Stop-Process` sem `-Force` antes de forçar a parada, quando a aplicação permite. |
