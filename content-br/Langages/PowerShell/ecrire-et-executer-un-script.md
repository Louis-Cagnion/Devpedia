---
order: 2
---

# Escrever e executar um script PowerShell

Um script PowerShell é um arquivo de texto com a extensão `.ps1`, contendo uma sequência de comandos (as **cmdlets**) executados em ordem, como se tivessem sido digitados um a um no console.

> **Windows PowerShell vs PowerShell (Core)**: o *Windows PowerShell* (5.1) é a versão histórica, entregue com o Windows, limitada a esse sistema. O *PowerShell* (frequentemente chamado de *PowerShell Core*, versões 7+) é a reescrita multiplataforma sobre o [.NET](https://learn.microsoft.com/en-us/dotnet/), que também roda no Linux e no macOS: é ele que se invoca via `pwsh` em vez de `powershell`. Este site cobre essa segunda versão, amplamente compatível com a primeira.

## Sem shebang, mas com uma política de execução

O Windows não usa shebang como o Unix (a extensão `.ps1` já basta para identificar o arquivo), mas o PowerShell bloqueia por padrão a execução de scripts, por razões de segurança:

```powershell
Get-ExecutionPolicy   # exibe a politica atual, frequentemente "Restricted" por padrao
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

| Política | Efeito |
|---|---|
| `Restricted` | Nenhum script pode executar, apenas os comandos interativos funcionam |
| `AllSigned` | Apenas scripts assinados digitalmente podem executar |
| `RemoteSigned` | Scripts locais executam livremente; os baixados precisam ser assinados |
| `Unrestricted` | Todos os scripts executam, com um simples aviso para os baixados |

> **Nota:** essa política é específica do Windows (`RemoteSigned` é uma escolha comum em desenvolvimento): no Linux/macOS com `pwsh`, ela não tem nenhum efeito, a segurança então se apoiando nas permissões do arquivo como para um script [Bash](/?c=shells&s=bash&p=bash) (veja [Permissões e manipulação de arquivos](/?c=shells&s=powershell&p=permissions-et-fichiers)).

## Executar um script

```powershell
.\script.ps1                 # o ".\" e necessario mesmo se o diretorio atual contem o script
powershell -File script.ps1  # alternativa: lancar explicitamente o interpretador sobre o arquivo
```

> **Nota:** ao contrário do Bash, digitar simplesmente `script.ps1` sem prefixo de caminho nunca funciona, mesmo que o script seja executável: o PowerShell nunca procura no diretório atual por padrão, mesmo se ele estiver presente em `$env:PATH`, para evitar que um arquivo malicioso do diretório atual seja executado por engano no lugar de um comando do sistema de mesmo nome.

## Os argumentos de um script

```powershell
# script.ps1
param(
    [string]$Nome,
    [int]$Idade
)

Write-Output "Ola $Nome, voce tem $Idade anos"
```

```powershell
.\script.ps1 -Nome "Joao" -Idade 25
# Ola Joao, voce tem 25 anos
```

Ao contrário do Bash (`$1`, `$2`, posicionais e sem nome), um script PowerShell declara seus parâmetros com `param()`, cada um tipado e nomeado: a ordem da chamada então importa bem menos, e `-Nome "Joao"` continua legível mesmo com muitos argumentos.

Os argumentos não declarados em `param()` continuam mesmo assim acessíveis via a variável automática `$args`, como um equivalente de `$@`:

```powershell
# script.ps1
Write-Output "Numero de argumentos: $($args.Count)"
Write-Output "Primeiro argumento: $($args[0])"
```

## Códigos de saída e tratamento de erros

```powershell
if (-not (Test-Path "config.txt")) {
    Write-Error "Arquivo de configuracao ausente"
    exit 1
}

Write-Output "Tudo pronto"
exit 0
```

```powershell
.\script.ps1
if ($LASTEXITCODE -eq 0) {
    Write-Output "O script teve sucesso"
}
```

`$LASTEXITCODE` desempenha o papel do `$?` do Bash para um comando externo ou um `exit` explícito. Mas o PowerShell tem por cima um verdadeiro mecanismo de exceções: `Write-Error` sozinho não interrompe a execução (ela continua com a linha seguinte), enquanto `throw` lança uma exceção que para o script, exceto se interceptada por um bloco `try`/`catch`, como as [exceções do capítulo dedicado em PHP](/?c=langages-de-programmation&s=php&p=exceptions).

## Parar um script no primeiro erro: `$ErrorActionPreference`

Por padrão, um erro não fatal (o da maioria das cmdlets) não interrompe o script: equivalente ao comportamento padrão do Bash sem `set -e`:

```powershell
$ErrorActionPreference = "Stop"   # equivalente a "set -e": todo erro se torna bloqueante

Set-Location "C:\diretorio\inexistente"   # se esse diretorio nao existe, o script para aqui
Write-Output "Esta linha nunca executa se Set-Location falhou"
```

Veja também [O gerenciamento de processos](/?c=shells&s=powershell&p=gestion-des-processus) para o que acontece depois do lançamento de um script em segundo plano.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um script `.ps1` executa sob uma política de execução (`Get-ExecutionPolicy`), não via shebang. Os parâmetros se declaram com `param()`, nomeados e tipados, ao contrário dos `$1`/`$2` posicionais do Bash. |
| **Ferramentas utilizáveis** | `param()`, `$args`, `$LASTEXITCODE`, `try`/`catch`/`throw`, `$ErrorActionPreference = "Stop"`. |
| **Armadilhas a evitar** | Confundir `Write-Error` (não interrompe o script) e `throw` (lança uma exceção que o para). |
| **Boas práticas** | Usar `param()` para argumentos nomeados e tipados em vez de depender de `$args` posicional; definir `$ErrorActionPreference = "Stop"` para um comportamento próximo de `set -e`. |
