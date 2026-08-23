---
order: 8
---

# Expansão e coringas (wildcards)

O PowerShell retoma a ideia do globbing do [Bash](/?c=shells&s=bash&p=bash) (substituir um padrão pela lista real de arquivos correspondentes), mas sob um nome diferente (*wildcards*) e com regras ligeiramente distintas, além de um operador de correspondência de padrão reutilizável fora dos nomes de arquivo.

## Os wildcards: `*`, `?`, `[]`

```powershell
Get-ChildItem *.txt             # todos os arquivos que terminam em .txt
Get-ChildItem arquivo?.txt      # arquivo1.txt, arquivoA.txt... ('?' = exatamente 1 caractere)
Get-ChildItem arquivo[123].txt  # arquivo1.txt, arquivo2.txt ou arquivo3.txt apenas
Get-ChildItem arquivo[a-z].txt  # uma unica letra minuscula nessa posicao
```

| Padrão | Significa |
|---|---|
| `*` | Qualquer sequência de caracteres (inclusive vazia) |
| `?` | Exatamente um caractere, qualquer um |
| `[abc]` | Um único caractere entre `a`, `b` ou `c` |
| `[a-z]` | Um único caractere nessa faixa |

> **Nota:** como o globbing do Bash, isso **não** é uma [regex](/?c=domain-specific-languages-dsl&p=regex): esses padrões só são interpretados dessa forma pelas cmdlets que o anunciam explicitamente (`Get-ChildItem`, `-like`), não pelo PowerShell em si na escala da linha inteira como faz o Bash antes de executar qualquer coisa.

## `-like`: aplicar um wildcard a uma string qualquer

Ao contrário do Bash, onde o globbing só se aplica a nomes de arquivo reais no disco, `-like` aplica os mesmos padrões a qualquer string:

```powershell
if ("arquivo1.txt" -like "arquivo?.txt") {
    Write-Output "Corresponde"
}

"Joao", "Julia", "Marcos" | Where-Object { $_ -like "J*" }
# Joao
# Julia
```

## O que acontece se nenhum arquivo corresponder?

```powershell
Get-ChildItem *.xyz
# se nenhum arquivo .xyz existe, o comando nao retorna nada -> sem erro silencioso como no Bash
```

> **Nota:** essa é uma diferença importante em relação ao Bash, onde `echo *.xyz` exibe literalmente o texto `*.xyz` se nada corresponder; o PowerShell, por sua vez, sempre resolve o padrão em uma lista de verdade (eventualmente vazia), nunca na string bruta do padrão não resolvido.

## A expansão de faixa (`..`)

Equivalente mais próximo da expansão de chaves `{1..5}` do Bash, mas limitado a faixas numéricas:

```powershell
1..5
# 1 2 3 4 5

foreach ($n in 'a'[0]..'e'[0]) { [char]$n }
# a b c d e -> mais verboso que no Bash, o PowerShell nao tem equivalente direto de {a..e}
```

Para gerar vários caminhos de uma vez (equivalente de `arquivo{1,2,3}.txt` ou `mkdir -p a/{b,c}`), basta combinar um laço com uma coleção explícita:

```powershell
"src", "tests", "docs" | ForEach-Object { New-Item -ItemType Directory -Path "projeto\$_" }
```

## A expansão do til (`~`)

```powershell
Set-Location ~           # equivalente a Set-Location $HOME
Set-Location ~\projetos  # equivalente a Set-Location $HOME\projetos
```

## Impedir a expansão: as aspas simples

```powershell
Write-Output *.txt    # o PowerShell tenta resolver o padrao conforme o contexto do comando
Write-Output '*.txt'  # exibe literalmente *.txt -> as aspas simples desativam a interpretacao
```

> **Nota:** ao contrário do Bash onde `*` é expandido pelo próprio shell antes mesmo de o comando recebê-lo, no PowerShell é cada cmdlet que decide interpretar ou não um wildcard recebido como argumento: `Write-Output *.txt` então só exibe o texto `*.txt`, enquanto `Get-ChildItem *.txt` o resolve corretamente em uma lista de arquivos.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Os wildcards do PowerShell (`*`, `?`, `[]`) se parecem com o globbing do Bash, mas só são interpretados pelas cmdlets que o anunciam explicitamente: o próprio PowerShell nunca os expande na escala de toda a linha como faz o Bash. |
| **Ferramentas utilizáveis** | `-like` (wildcard sobre uma string qualquer), a expansão de faixa (`1..5`). |
| **Armadilhas a evitar** | Esperar que um padrão não resolvido apareça literalmente como no Bash: o PowerShell sempre resolve em uma lista de verdade, eventualmente vazia. |
| **Boas práticas** | Usar `-like`/`-match` para aplicar um padrão a uma string qualquer, não apenas a nomes de arquivo. |
