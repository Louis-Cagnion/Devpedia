---
order: 13
---

# Como funciona o PowerShell (arquitetura interna)

O PowerShell se apoia na mesma mecânica de fundo que o Bash (um laço que lê, interpreta e executa), mas não roda diretamente sobre o sistema operacional como um simples executável nativo: é um ambiente construído sobre o [**.NET Runtime**](https://learn.microsoft.com/en-us/dotnet/), o que explica ao mesmo tempo seus objetos tipados (veja [As variáveis](/?c=shells&s=powershell&p=variables) e [Redirecionamentos e pipes](/?c=shells&s=powershell&p=redirections-et-pipes)) e algumas de suas diferenças de desempenho em relação ao Bash.

> **Pré-requisito:** este capítulo supõe conhecido o que é um processo (`fork`/`exec`), veja o capítulo sobre a arquitetura de um shell (tópico Bash), que detalha esse mecanismo do lado Unix; os conceitos se reencontram aqui, mas implementados de forma diferente no Windows.

## O laço principal (REPL)

Como para o Bash, uma sessão interativa do PowerShell é fundamentalmente um laço infinito:

```text
enquanto verdadeiro:
    exibir o prompt
    ler uma linha de comando
    dividir a linha em tokens (tokenizacao)
    resolver cada comando (cmdlet, funcao, alias, executavel externo)
    executar o pipeline resultante
    exibir os objetos nao capturados produzidos pelo pipeline
```

## Cmdlet vs função vs executável externo

Ao contrário do Bash, que distingue apenas *builtin* (executado pelo próprio shell) e *externo* (novo processo), o PowerShell distingue três tipos de comandos:

### As cmdlets

`Get-ChildItem`, `Set-Location`, `Write-Output`... são classes **.NET compiladas**, empacotadas em módulos, executadas diretamente no processo do PowerShell (como um *builtin* do Bash), mas implementadas em [C#](https://learn.microsoft.com/en-us/dotnet/csharp/), não interpretadas linha por linha.

### As funções

Escritas diretamente na linguagem PowerShell (`function Saudar { ... }`, veja [As funções](/?c=shells&s=powershell&p=fonctions)), interpretadas na execução, como uma função Bash, mas se beneficiando da mesma tipagem e do mesmo sistema de parâmetros de uma cmdlet.

### Os comandos externos

Para um executável como `notepad.exe`, o PowerShell delega ao sistema operacional Windows a criação de um novo processo (papel equivalente a `fork`/`execve` em C, mas via a API Windows `CreateProcess`):

```text
CreateProcess("notepad.exe", argumentos, ...)
// o novo processo inicia em paralelo
// o PowerShell espera seu fim (ou continua, se lancado em segundo plano) conforme o contexto
```

## O pipeline de objetos: o que `|` realmente faz circular

Essa é a diferença mais fundamental em relação ao Bash. Um pipe do Bash (`cmd1 | cmd2`) conecta dois **descritores de arquivo** no nível do sistema operacional (veja [Como funciona um shell](/?c=shells&s=bash&p=architecture-dun-shell), com `pipe()`/`dup2()`): o fluxo que circula ali é uma sequência de bytes, sem nenhuma estrutura.

Um pipeline do PowerShell (`Cmd1 | Cmd2`), por sua vez, transmite diretamente **objetos .NET em memória**, um por um, sem nunca serializá-los em texto entre os dois comandos: é isso que permite a `Get-ChildItem | Where-Object { $_.Length -gt 1000 }` filtrar sobre uma propriedade numérica de verdade, em vez de buscar um padrão em texto formatado como faria um `ls -l | grep`.

> **Nota:** essa diferença tem um custo: um pipeline do PowerShell mantém todos os objetos em memória enquanto não forem consumidos pela etapa seguinte, enquanto um pipe do Bash só faz circular bytes conforme chegam: em um volume muito grande de dados, um script Bash bem projetado pode então continuar mais econômico em memória do que um pipeline PowerShell equivalente.

## Como o PowerShell encontra qual comando lançar

Se o comando digitado contém um caminho explícito (`.\script.ps1`, `C:\ferramentas\notepad.exe`), o PowerShell o usa diretamente. Senão, ele busca nesta ordem: alias, função, cmdlet, e depois executável externo nos diretórios de `$env:PATH`: ao contrário do Bash, que só conhece builtins e `$PATH`, o PowerShell precisa desempatar quatro tipos de comandos potencialmente homônimos antes de escolher qual executar.

## Implementar um pipeline (equivalente conceitual de `pipe()`)

O motor do PowerShell (o *pipeline processor*) instancia cada cmdlet do pipeline, e depois chama seus métodos `.NET` `BeginProcessing()`/`ProcessRecord()`/`EndProcessing()` encadeando a saída de uma como entrada da seguinte: objeto por objeto, à medida que são produzidos, em vez de esperar que a primeira cmdlet termine de produzir tudo:

```text
Cmd1.ProcessRecord() -> produz um objeto -> imediatamente transmitido a Cmd2.ProcessRecord()
```

É esse mecanismo (o *streaming* objeto por objeto) que desempenha, dentro do runtime .NET, um papel equivalente ao de `pipe()`/`dup2()` no nível do sistema operacional para um pipe do Bash, sem nunca passar por um descritor de arquivo nem pelo sistema operacional em si, já que tudo acontece no mesmo processo.

## O controle de tarefas: jobs em vez de grupos de processos

Ao contrário do Bash, onde `&`, `Ctrl+Z`, `fg`/`bg` manipulam grupos de processos no nível do sistema operacional (veja [O gerenciamento de processos](/?c=shells&s=bash&p=gestion-des-processus) em Bash), o PowerShell gerencia o segundo plano via objetos `Job` (veja [O gerenciamento de processos](/?c=shells&s=powershell&p=gestion-des-processus)), uma abstração do runtime .NET, não um mecanismo do kernel Windows compartilhado com os outros programas do sistema.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O PowerShell se apoia no .NET: cmdlets (classes compiladas), funções (interpretadas) e executáveis externos (novo processo via `CreateProcess`). O pipeline transmite objetos .NET de verdade, não texto. |
| **Ferramentas utilizáveis** | Resolução de comando (alias → função → cmdlet → executável), `BeginProcessing`/`ProcessRecord`/`EndProcessing` (streaming objeto por objeto). |
| **Armadilhas a evitar** | Supor que um pipeline PowerShell é tão econômico em memória quanto um pipe Bash: os objetos ficam em memória enquanto não forem consumidos. |
| **Boas práticas** | Explorar a tipagem dos objetos do pipeline (filtrar sobre uma propriedade real) em vez de recair em um processamento de texto como no Bash. |
