---
order: 9
---

# Redirecionamentos e pipes

O PowerShell retoma as mesmas ideias que o Bash (redirecionar um fluxo para um arquivo, encadear comandos via um pipe), mas com uma diferença fundamental: um pipe do Bash transporta **texto**, um pipe do PowerShell transporta verdadeiros **objetos .NET**, com suas propriedades e métodos intactos.

## Redirecionar a saída para um arquivo

```powershell
"Ola" > arquivo.txt      # sobrescreve arquivo.txt (ou o cria) com esse conteudo
"De novo" >> arquivo.txt # adiciona ao final de arquivo.txt, sem sobrescrever
```

> **Nota:** como no Bash, `>` sobrescreve silenciosamente o conteúdo existente: usar `>>` quando a adição é realmente desejada.

## Redirecionar a entrada a partir de um arquivo

```powershell
Get-Content lista.txt | Sort-Object   # o PowerShell nao tem operador "<" direto: passa-se por uma cmdlet
```

> **Nota:** ao contrário do Bash (`sort < lista.txt`), o PowerShell não tem um verdadeiro redirecionamento de entrada padrão: a convenção é produzir o conteúdo do arquivo via uma cmdlet (`Get-Content`) e depois enviá-lo ao pipeline.

## Redirecionar a saída de erro

Os fluxos são numerados de forma diferente do Bash: `1` = saída padrão, `2` = erro, mas também `3` (aviso), `4` (verboso), `5` (depuração), `6` (informação); o PowerShell distingue mais fluxos do que os três do Unix:

```powershell
Comando-QueFalha 2> erros.log      # apenas a saida de erro vai para erros.log
Comando 1> saida.log 2> erros.log  # separa saida normal e erros em dois arquivos
Comando *> tudo.log                # atalho PowerShell: redireciona TODOS os fluxos para tudo.log
```

> **Nota:** `*>` não tem equivalente direto no Bash (que só tem `&>` para stdout+stderr): o PowerShell pode agrupar até seis fluxos distintos em um único redirecionamento.

## `$null`: ignorar uma saída

Papel equivalente a `/dev/null` no Unix:

```powershell
Comando-Barulhento > $null 2>&1   # ignora toda saida normal E todo erro
```

## Os pipes (`|`): encadear comandos, com objetos de verdade

```powershell
Get-ChildItem | Where-Object { $_.Extension -eq ".txt" }     # filtra por propriedade, nao por texto
Select-String "404" access.log | Measure-Object | Select-Object -ExpandProperty Count
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5     # os 5 processos mais pesados
```

> **Nota:** `Where-Object { $_.Extension -eq ".txt" }` filtra sobre uma propriedade real do objeto arquivo, enquanto `grep ".txt"` no Bash só busca o texto ".txt" em qualquer lugar da linha: um arquivo chamado `relatorio.txt.bak` corresponderia ao `grep` mas não a `-eq ".txt"`, mais preciso.

## `Tee-Object`: redirecionar mantendo uma exibição

Equivalente direto de `tee` no Bash:

```powershell
Get-ChildItem | Tee-Object -FilePath resultados.txt   # exibe o resultado E o salva em um arquivo
```

## Resumo dos símbolos

| Símbolo | Efeito |
|---|---|
| `>` | Redireciona a saída padrão, sobrescreve o arquivo |
| `>>` | Redireciona a saída padrão, adiciona ao final |
| `2>` | Redireciona a saída de erro |
| `*>` | Redireciona todos os fluxos para o mesmo alvo |
| `\|` | Conecta a saída (de objetos) de um comando à entrada do seguinte |

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um pipe do PowerShell transporta objetos .NET de verdade (propriedades e métodos intactos), não texto como um pipe do Bash: `Where-Object`/`Select-Object` filtram sobre propriedades reais. |
| **Ferramentas utilizáveis** | `>`/`>>`, `*>` (todos os fluxos), `$null` (equivalente de `/dev/null`), `Tee-Object`. |
| **Armadilhas a evitar** | Procurar um operador `<` de redirecionamento de entrada: o PowerShell não tem nenhum, é preciso passar por uma cmdlet (`Get-Content`). |
| **Boas práticas** | Filtrar sobre uma propriedade real (`Where-Object { $_.Extension -eq ".txt" }`) em vez de reproduzir uma filtragem de texto à moda Bash. |
