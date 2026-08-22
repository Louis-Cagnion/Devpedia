---
order: 1
---

# Comandos básicos

Ao contrário do Bash, onde `cd`, `ls` ou `cp` são nomes curtos já familiares para muita gente, as cmdlets do PowerShell seguem a convenção `Verbo-Substantivo` (`Set-Location`, `Get-ChildItem`, `Copy-Item`), mais longas, mas explícitas e previsíveis uma vez entendido o verbo (veja a tabela dos verbos padrão no capítulo sobre funções). Este capítulo cobre os comandos usados primeiro em um terminal, antes mesmo de escrever o menor script: se locomover, listar, ler um arquivo, e encontrar ajuda sobre um comando desconhecido.

## Se locomover: `Set-Location` e `Get-Location`

```powershell
Get-Location                # exibe o diretorio atual, equivalente a "pwd"
Set-Location C:\Users\Joao  # move para esse diretorio, equivalente a "cd"
Set-Location ..             # sobe um nivel
Set-Location -              # volta para o diretorio anterior
```

## Listar um diretório: `Get-ChildItem`

```powershell
Get-ChildItem                # lista o conteudo do diretorio atual
Get-ChildItem -Force         # inclui os arquivos e diretorios ocultos
Get-ChildItem -Path C:\logs  # lista um diretorio especifico sem mover para ele
```

> **Nota:** `Get-ChildItem` também faz o trabalho de `find` assim que se adiciona `-Recurse`: veja o capítulo sobre permissões para esse uso, assim como para criar, copiar, mover e remover arquivos/diretórios.

## Ler o conteúdo de um arquivo: `Get-Content`

```powershell
Get-Content arquivo.txt          # exibe todo o arquivo, equivalente a "cat"
Get-Content arquivo.txt -Tail 5  # as 5 ultimas linhas, equivalente a "tail"
Get-Content arquivo.txt -Wait    # continua exibindo as linhas adicionadas ao arquivo, equivalente a "tail -f"
```

Veja o capítulo sobre processamento de texto para ir mais longe (busca, substituição, ordenação sobre o conteúdo lido por `Get-Content`).

## Aliases familiares

O PowerShell fornece por padrão aliases para essas cmdlets, para permanecer compatível com os reflexos do Bash e do prompt de comando do Windows:

| Alias | Cmdlet real |
|---|---|
| `cd` | `Set-Location` |
| `pwd` | `Get-Location` |
| `ls`, `dir` | `Get-ChildItem` |
| `cat`, `type` | `Get-Content` |
| `cp` | `Copy-Item` |
| `mv` | `Move-Item` |
| `rm`, `del` | `Remove-Item` |
| `cls`, `clear` | `Clear-Host` |

> **Nota:** um alias continua sendo um comando PowerShell como qualquer outro: `cp` aceita os mesmos parâmetros que `Copy-Item` (`-Recurse` por exemplo), mas não necessariamente os do comando Unix ou cmd de mesmo nome. Veja o capítulo sobre variáveis de ambiente para criar seus próprios aliases com `Set-Alias`.

## Obter ajuda: `Get-Help`

O nome de uma cmdlet nem sempre basta para adivinhar seus parâmetros: `Get-Help` evita precisar buscar online:

```powershell
Get-Help Get-ChildItem            # sintaxe e descricao geral
Get-Help Get-ChildItem -Examples  # apenas exemplos de uso
Get-Help Get-ChildItem -Full      # descricao completa, todos os parametros
```

> **Nota:** na primeira execução, `Get-Help` pode pedir para rodar `Update-Help` (baixa a documentação atualizada); sem rede disponível, uma versão mínima já instalada continua utilizável.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | As cmdlets PowerShell seguem a convenção `Verbo-Substantivo` (`Get-ChildItem`, `Set-Location`), mais longas que os comandos Bash, mas previsíveis uma vez entendido o verbo. Aliases familiares (`cd`, `ls`, `cat`) continuam disponíveis. |
| **Ferramentas utilizáveis** | `Get-Location`/`Set-Location`, `Get-ChildItem`, `Get-Content`, `Get-Help`. |
| **Armadilhas a evitar** | Supor que um alias (`cp`) aceita exatamente os mesmos parâmetros que o comando Unix de mesmo nome: ele na verdade repassa para `Copy-Item`. |
| **Boas práticas** | Usar `Get-Help <cmdlet> -Examples` para descobrir rapidamente o uso de um comando desconhecido. |
