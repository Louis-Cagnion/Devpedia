---
order: 7
---

# As funções

Ao contrário do Bash, onde uma função recebe seus argumentos exatamente como um script (`$1`, `$2`, sem nome), uma função PowerShell declara verdadeiros **parâmetros nomeados e tipados** via `param()`, como em [PHP](/?c=langages-de-programmation&s=php&p=conditions) ou em [C](/?c=langages-de-programmation&s=c&p=conditions).

## Declarar e chamar uma função

```powershell
function Saudar {
    param([string]$Nome)
    Write-Output "Ola $Nome !"
}

Saudar -Nome "Joao"  # Ola Joao !
Saudar "Joao"        # tambem funciona: o PowerShell aceita um argumento posicional se o nome for omitido
```

> **Convenção de nomenclatura:** as cmdlets e funções PowerShell seguem a grafia `Verbo-Substantivo` (`Get-ChildItem`, `Saudar` aqui em versão simplificada); um conjunto de verbos padrão (`Get`, `Set`, `New`, `Remove`...) é até imposto por convenção para as cmdlets oficiais, para que um mesmo verbo se comporte de forma previsível de um comando para outro.

## Os parâmetros de uma função

```powershell
function Resumir {
    param(
        [string]$Nome,
        [string]$Sobrenome
    )
    Write-Output "Nome da funcao: $($MyInvocation.MyCommand.Name)"
    Write-Output "Primeiro parametro: $Nome"
    Write-Output "Todos os argumentos nao declarados: $args"
}

Resumir -Nome "Silva" -Sobrenome "Joao"
```

> **Nota:** ao contrário do Bash onde `$1`, `$2` são puramente posicionais, a chamada `-Nome "Silva" -Sobrenome "Joao"` continua correta mesmo fora de ordem (`-Sobrenome "Joao" -Nome "Silva"`): os parâmetros são associados pelo nome, não pela posição, o que explica por que a grafia `Verbo-Substantivo` insiste tanto em nomes de parâmetro claros.

## Verdadeiros valores de retorno

Ao contrário do Bash, onde `return` só fixa um código de saída (0-255), `return` no PowerShell pode retornar um **valor de verdade** de qualquer tipo:

```powershell
function EhPar {
    param([int]$Numero)
    return ($Numero % 2 -eq 0)   # retorna $true ou $false, um verdadeiro booleano
}

if (EhPar -Numero 4) {
    Write-Output "4 e par"
}
```

## "Retornar" um dado: a saída não capturada do pipeline

Na prática, `return` é até opcional: **toda saída não atribuída** no corpo de uma função se torna seu valor de retorno, exatamente como a última expressão avaliada de um bloco; uma diferença importante em relação ao Bash, onde `echo` serve apenas para exibir, nunca para "retornar" no sentido estrito:

```powershell
function Soma {
    param([int]$A, [int]$B)
    $A + $B   # essa linha, nao atribuida, se torna o valor de retorno da funcao
}

$resultado = Soma -A 4 -B 6
Write-Output "Resultado: $resultado"   # Resultado: 10
```

> **Nota:** ao contrário do Bash onde `echo` dentro de uma função serve *apenas* para exibir (a captura via `$(...)` é uma convenção do lado de quem chama, não um verdadeiro mecanismo de retorno), toda linha PowerShell cujo resultado não é atribuído nem suprimido (com `[void]` ou `Out-Null`) se soma ao valor de retorno da função: um `Write-Output` de depuração esquecido em uma função pode assim poluir silenciosamente o que ela retorna.

## Escopo das variáveis

Ao contrário do Bash (variável global por padrão exceto `local`), uma variável atribuída em uma função PowerShell continua local a essa função por padrão:

```powershell
function Calcular {
    param([int]$Numero)
    $resultado = $Numero * 2   # local a Calcular(), sem precisar de uma palavra-chave "local"
    return $resultado
}
```

Veja também [As variáveis](/?c=shells&s=powershell&p=variables) (escopo `$script:`, já reutilizado aqui no contexto das funções).

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma função PowerShell declara verdadeiros parâmetros nomeados e tipados via `param()`. `return` (ou até a simples saída não atribuída) pode retornar um valor de verdade de qualquer tipo, ao contrário do código de saída limitado do Bash. |
| **Ferramentas utilizáveis** | `param()`, `$args` para os argumentos não declarados, escopo `$script:`. |
| **Armadilhas a evitar** | Um `Write-Output` de depuração esquecido em uma função se soma silenciosamente ao seu valor de retorno. |
| **Boas práticas** | Usar `[void]`/`Out-Null` para suprimir explicitamente uma saída que não deve fazer parte do valor de retorno. |
