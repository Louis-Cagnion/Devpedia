---
order: 10
---

# Processamento de texto e objetos

Onde o [Bash](/?c=shells&s=bash&p=bash) se apoia em [ferramentas de texto especializadas](/?c=shells&s=bash&p=traitement-de-texte) (`grep`, `sed`, `awk`), o PowerShell faz o mesmo trabalho com cmdlets genéricas que filtram, transformam e selecionam **objetos**: o texto é apenas um caso particular, aquele em que o objeto manipulado é uma string.

## `Select-String`: buscar texto (equivalente de `grep`)

```powershell
Select-String "erro" arquivo.log                   # exibe as linhas contendo "erro"
Select-String -CaseSensitive "Erro" arquivo.log    # sensivel a maiusculas/minusculas (o inverso do padrao)
Select-String -NotMatch "erro" arquivo.log         # inverte: linhas que NAO contem "erro"
Select-String "TODO" -Path .\* -Recurse            # busca recursiva em todos os arquivos de um diretorio
Select-String "erro" arquivo.log | Measure-Object  # conta as linhas correspondentes
Select-String -Pattern "erro|warning" arquivo.log  # padrao = uma regex .NET de verdade por padrao
```

> **Nota:** ao contrário de `grep` onde `-E` precisa ser adicionado para ativar as regex estendidas, `Select-String` interpreta seu padrão como uma regex **por padrão**: usar `-SimpleMatch` para voltar a uma busca de texto literal, o inverso da convenção do Bash.

Cada resultado é um objeto com propriedades utilizáveis diretamente, em vez de uma simples linha de texto a reprocessar:

```powershell
Select-String "erro" arquivo.log | Select-Object LineNumber, Line
```

## `-replace`: buscar e substituir (equivalente de `sed`)

```powershell
(Get-Content arquivo.txt) -replace "antigo", "novo"                            # substitui todas as ocorrencias por linha
(Get-Content arquivo.txt) -replace "antigo", "novo" | Set-Content arquivo.txt  # modifica o arquivo
```

> **Nota:** `-replace` substitui **todas** as ocorrências por padrão (o inverso de `sed 's///'` sem `g`, que só substitui a primeira): nenhuma flag equivalente ao `g` do `sed` a adicionar, esse comportamento já é o padrão.

Para processar apenas certas linhas (equivalente de um endereço `sed '2,4s///'`), filtra-se explicitamente por índice:

```powershell
(Get-Content arquivo.txt)[1..3] -replace "antigo", "novo"   # linhas 2 a 4 (indice base 0)
```

## `ConvertFrom-Csv`, `ConvertFrom-Json`: processar dados estruturados (equivalente de `awk`)

Onde `awk` divide manualmente uma linha em campos (`$1`, `$2`...), o PowerShell converte diretamente um formato estruturado em objetos tipados:

```powershell
Import-Csv dados.csv | Select-Object Nome, Idade    # colunas acessiveis pelo nome, nao pela posicao
Get-Content dados.json | ConvertFrom-Json | Select-Object -ExpandProperty usuario
```

Para um texto não estruturado próximo do uso do `awk` (divisão por espaços), `-split` continua disponível:

```powershell
("Joao Silva 25" -split " ")[0]     # Joao -> primeiro campo
```

## `Sort-Object` e `Get-Unique`/`-Unique`: ordenar e deduplicar

```powershell
Get-Content arquivo.txt | Sort-Object                                   # ordenacao alfabetica
Get-Content numeros.txt | Sort-Object { [int]$_ }                       # ordenacao numerica explicita
Get-Content arquivo.txt | Sort-Object -Descending                       # ordenacao decrescente
Get-Content arquivo.txt | Sort-Object -Unique                           # ordena E deduplica em uma unica etapa
Get-Content arquivo.txt | Group-Object | Sort-Object Count -Descending  # conta as ocorrencias
```

> **Nota:** ao contrário de `uniq` no Bash (que só detecta duplicatas **adjacentes**, daí a obrigação de ordenar antes), `Sort-Object -Unique` e `Group-Object` funcionam sobre o conjunto da coleção, independentemente da ordem inicial: não é preciso ordenar antes para deduplicar corretamente.

## `Measure-Object`: contar (equivalente de `wc`)

```powershell
(Get-Content arquivo.txt | Measure-Object -Line).Lines            # numero de linhas
(Get-Content arquivo.txt | Measure-Object -Word).Words            # numero de palavras
(Get-Content arquivo.txt | Measure-Object -Character).Characters  # numero de caracteres
```

## Combinar essas ferramentas

```powershell
Select-String "404" access.log |
    ForEach-Object { ($_.Line -split " ")[0] } |
    Group-Object |
    Sort-Object Count -Descending
# 1) mantem as linhas de erro 404
# 2) extrai o endereco IP (1o campo de cada linha)
# 3) agrupa os IPs identicos
# 4) ordena por numero de ocorrencias decrescente -> os IPs mais frequentes primeiro
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O PowerShell trata o texto como um caso particular de objeto: `Select-String` (grep), `-replace` (sed), `ConvertFrom-Csv`/`Json` (awk sobre dados estruturados) manipulam objetos tipados, não apenas linhas. |
| **Ferramentas utilizáveis** | `Select-String`, `-replace`, `-split`, `Sort-Object -Unique`, `Group-Object`, `Measure-Object`. |
| **Armadilhas a evitar** | Esquecer que `Select-String` interpreta seu padrão como uma regex por padrão (ao contrário de `grep`, que exige `-E`). |
| **Boas práticas** | Usar `Sort-Object -Unique`/`Group-Object` em vez de uma ordenação manual seguida de deduplicação: funcionam sobre toda a coleção, sem ordem prévia necessária. |
