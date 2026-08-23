---
order: 5
---

# As condições

Ao contrário do [Bash](/?c=shells&s=bash&p=bash), onde uma condição passa pelo código de saída de um comando de teste (`[`, `[[`), o PowerShell tem verdadeiros **operadores de comparação embutidos na linguagem**, como em [PHP](/?c=langages-de-programmation&s=php&p=conditions) ou em [C](/?c=langages-de-programmation&s=c&p=conditions).

## `if` / `elseif` / `else`

```powershell
$idade = 18

if ($idade -ge 18) {
    Write-Output "Voce e maior de idade."
} else {
    Write-Output "Voce e menor de idade."
}
```

- Os blocos são delimitados por chaves `{ }`, como em [C](/?c=langages-de-programmation&s=c&p=c)/[PHP](/?c=langages-de-programmation&s=php&p=php)/[JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript), não por palavras-chave de fechamento (`fi`).
- A condição entre parênteses é uma verdadeira expressão booleana, não a chamada de um comando externo como o `[` do Bash.

## Os operadores de comparação

Ao contrário do Bash, um único conjunto de operadores serve tanto para números quanto para strings: sem distinção `-eq`/`==` conforme o tipo comparado:

```powershell
if ($idade -eq 18) { Write-Output "Exatamente 18" }
```

| Operador | Significado |
|---|---|
| `-eq` | Igual |
| `-ne` | Diferente |
| `-lt` | Menor |
| `-le` | Menor ou igual |
| `-gt` | Maior |
| `-ge` | Maior ou igual |

> **Nota:** esses operadores continuam sendo palavras-chave do PowerShell (`-eq`, não `==`) mesmo que a sintaxe lembre as flags do Bash: `==` não existe como operador de comparação no PowerShell.

## Comparar strings

```powershell
$nome = "Joao"

if ($nome -eq "Joao") {
    Write-Output "Ola Joao"
}

if ([string]::IsNullOrEmpty($nome)) {
    Write-Output "nome esta vazio"
}
```

| Operador | Significado |
|---|---|
| `-eq` / `-ne` | Igualdade / diferença, **sensível a maiúsculas com `-ceq`**, insensível caso contrário |
| `-like` | Correspondência com um padrão tipo coringa (`*`, `?`) |
| `-match` | Correspondência com uma expressão regular |

> **Nota:** `-eq` em strings é insensível a maiúsculas/minúsculas por padrão (`"Joao" -eq "joao"` é verdadeiro); prefixar com `c` (`-ceq`, `-clike`, `-cmatch`) força uma comparação sensível à caixa, o inverso da maioria das linguagens onde a caixa importa por padrão.

## Testar arquivos

```powershell
if (Test-Path "config.txt" -PathType Leaf) {
    Write-Output "O arquivo existe"
}

if (Test-Path "C:\var\www" -PathType Container) {
    Write-Output "O diretorio existe"
}
```

`Test-Path` substitui sozinho todos os testes de arquivo do Bash (`-f`, `-d`, `-e`): `-PathType Leaf` para um arquivo, `-PathType Container` para um diretório, nenhum argumento para "existe, seja qual for o tipo".

## Combinar condições

```powershell
if ((Test-Path "config.txt") -and (Get-Item "config.txt").Length -gt 0) {
    Write-Output "O arquivo existe e nao esta vazio"
}
```

`-and`/`-or`/`-not` substituem respectivamente `&&`/`||`/`!` do Bash: os operadores simbólicos não existem para a lógica booleana no PowerShell.

## O `switch` (equivalente do `case` do Bash)

```powershell
$dia = "qua"

switch ($dia) {
    { $_ -in "seg", "ter", "qua", "qui", "sex" } { Write-Output "Dia de semana" }
    { $_ -in "sab", "dom" } { Write-Output "Fim de semana" }
    default { Write-Output "Dia desconhecido" }
}
```

`$_` designa o valor testado (o passado entre parênteses ao `switch`), `-in` testa sua presença em uma lista, e `default` captura todo o resto: equivalente do `*)` final de um `case` do Bash.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | O PowerShell tem verdadeiros operadores de comparação embutidos na linguagem (`-eq`, `-lt`...), ao contrário do Bash que se apoia em comandos de teste. Um único conjunto de operadores serve para números e strings. |
| **Ferramentas utilizáveis** | `Test-Path` (substitui `-f`/`-d`/`-e` do Bash), `-and`/`-or`/`-not`, `-like`/`-match`. |
| **Armadilhas a evitar** | Esquecer que `-eq` em strings é insensível a maiúsculas/minúsculas por padrão: `-ceq` força a sensibilidade à caixa. |
| **Boas práticas** | Usar `Test-Path -PathType Leaf/Container` para distinguir explicitamente um arquivo de um diretório. |
