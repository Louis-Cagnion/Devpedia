---
order: 10
---

# Processamento de texto e objetos

Onde o [Bash](/?c=shells&s=bash&p=bash) se apoia em [ferramentas de texto especializadas](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`), o PowerShell faz o mesmo trabalho com cmdlets genéricas que filtram, transformam e selecionam **objetos**: o texto é apenas um caso particular, aquele em que o objeto manipulado é uma string.

## `Select-String`: buscar texto (equivalente de `grep`)

```powershell
Select-String "erro" arquivo.log                   # exibe as linhas contendo "erro"
# sensível a maiúsculas/minúsculas (o inverso do padrão)
Select-String -CaseSensitive "Erro" arquivo.log
Select-String -NotMatch "erro" arquivo.log         # inverte: linhas que NÃO contêm "erro"
# busca recursiva em todos os arquivos de um diretório
Select-String "TODO" -Path .\* -Recurse
Select-String "erro" arquivo.log | Measure-Object  # conta as linhas correspondentes
# padrão = uma regex .NET de verdade por padrão
Select-String -Pattern "erro|warning" arquivo.log
```

> **Nota:** ao contrário de `grep` onde `-E` precisa ser adicionado para ativar as regex estendidas, `Select-String` interpreta seu padrão como uma regex **por padrão**: usar `-SimpleMatch` para voltar a uma busca de texto literal, o inverso da convenção do Bash.

Cada resultado é um objeto com propriedades utilizáveis diretamente, em vez de uma simples linha de texto a reprocessar:

```powershell
Select-String "erro" arquivo.log | Select-Object LineNumber, Line
```

## `-replace`: buscar e substituir (equivalente de `sed`)

```powershell
# substitui todas as ocorrências por linha
(Get-Content arquivo.txt) -replace "antigo", "novo"
# modifica o arquivo
(Get-Content arquivo.txt) -replace "antigo", "novo" | Set-Content arquivo.txt
```

> **Nota:** `-replace` substitui **todas** as ocorrências por padrão (o inverso de `sed 's///'` sem `g`, que só substitui a primeira): nenhuma flag equivalente ao `g` do `sed` a adicionar, esse comportamento já é o padrão.

Para processar apenas certas linhas (equivalente de um endereço `sed '2,4s///'`), filtra-se explicitamente por índice:

```powershell
(Get-Content arquivo.txt)[1..3] -replace "antigo", "novo"   # linhas 2 a 4 (índice base 0)
```

## `ConvertFrom-Csv`, `ConvertFrom-Json`: processar dados estruturados (equivalente de `awk`)

Onde `awk` divide manualmente uma linha em campos (`$1`, `$2`...), o PowerShell converte diretamente um formato estruturado em objetos tipados:

```powershell
# colunas acessíveis pelo nome, não pela posição
Import-Csv dados.csv | Select-Object Nome, Idade
Get-Content dados.json | ConvertFrom-Json | Select-Object -ExpandProperty usuario
```

Para um texto não estruturado próximo do uso do `awk` (divisão por espaços), `-split` continua disponível:

```powershell
("Joao Silva 25" -split " ")[0]     # Joao -> primeiro campo
```

## `Sort-Object` e `Get-Unique`/`-Unique`: ordenar e deduplicar

```powershell
Get-Content arquivo.txt | Sort-Object                                   # ordenação alfabetica
# ordenação numérica explícita
Get-Content numeros.txt | Sort-Object { [int]$_ }
Get-Content arquivo.txt | Sort-Object -Descending                       # ordenação decrescente
# ordena E deduplica em uma única etapa
Get-Content arquivo.txt | Sort-Object -Unique
Get-Content arquivo.txt | Group-Object | Sort-Object Count -Descending  # conta as ocorrências
```

> **Nota:** ao contrário de `uniq` no Bash (que só detecta duplicatas **adjacentes**, daí a obrigação de ordenar antes), `Sort-Object -Unique` e `Group-Object` funcionam sobre o conjunto da coleção, independentemente da ordem inicial: não é preciso ordenar antes para deduplicar corretamente.

## `Measure-Object`: contar (equivalente de `wc`)

```powershell
(Get-Content arquivo.txt | Measure-Object -Line).Lines            # número de linhas
(Get-Content arquivo.txt | Measure-Object -Word).Words            # número de palavras
(Get-Content arquivo.txt | Measure-Object -Character).Characters  # número de caracteres
```

## Combinar essas ferramentas

```powershell
Select-String "404" access.log |
    ForEach-Object { ($_.Line -split " ")[0] } |
    Group-Object |
    Sort-Object Count -Descending
# 1) mantém as linhas de erro 404
# 2) extrai o endereço IP (1o campo de cada linha)
# 3) agrupa os IPs idênticos
# 4) ordena por número de ocorrências decrescente -> os IPs mais frequentes primeiro
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O PowerShell trata o texto como um caso particular de objeto: `Select-String` (grep), `-replace` (sed), `ConvertFrom-Csv`/`Json` (awk sobre dados estruturados) manipulam objetos tipados, não apenas linhas. |
| **Ferramentas utilizáveis** | `Select-String`, `-replace`, `-split`, `Sort-Object -Unique`, `Group-Object`, `Measure-Object`. |
| **Armadilhas a evitar** | Esquecer que `Select-String` interpreta seu padrão como uma regex por padrão (ao contrário de `grep`, que exige `-E`). |
| **Boas práticas** | Usar `Sort-Object -Unique`/`Group-Object` em vez de uma ordenação manual seguida de deduplicação: funcionam sobre toda a coleção, sem ordem prévia necessária. |
