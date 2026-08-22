---
order: 3
---

# As variáveis

Para lembrar, [uma variável é uma caixa etiquetada que contém um valor](/?c=bases-de-l-informatique&p=la-variable): o que segue cobre apenas o que é específico do PowerShell.

Ao contrário do Bash, onde tudo é manipulado como texto, uma variável PowerShell mantém o **tipo real** de seu valor: um número continua sendo um número, uma lista continua sendo uma lista de objetos, sem conversão implícita para string. Toda variável começa com `$`, inclusive na atribuição (sem a regra "sem `$` para escrever, com `$` para ler" como no Bash).

## Declarar e ler uma variável

```powershell
$nome = "Joao"                # nenhuma regra estrita sobre espacos ao redor do '=', ao contrario do Bash
Write-Output $nome            # Joao
Write-Output "Ola $nome !"    # Ola Joao ! -> interpolacao direta em uma string com aspas duplas
```

> **Nota:** `$nome` sozinho (sem `Write-Output`) também exibe seu valor no console: o PowerShell exibe automaticamente o resultado de toda expressão que não é explicitamente atribuída ou suprimida, um comportamento próximo de um REPL.

## Aspas simples vs duplas

```powershell
$nome = "Joao"

Write-Output "Ola $nome"  # Ola Joao -> as aspas duplas interpretam as variaveis
Write-Output 'Ola $nome'  # Ola $nome -> as aspas simples desativam qualquer interpretacao
```

Para inserir uma propriedade ou o resultado de uma expressão (não apenas uma variável simples), é preciso envolvê-la com `$(...)` dentro das aspas duplas:

```powershell
$processo = Get-Process | Select-Object -First 1
Write-Output "Primeiro processo: $($processo.Name)"
```

> **Nota:** sem `$(...)`, `"$processo.Name"` exibiria a representação em texto do objeto seguida literalmente de `.Name`: o PowerShell só interpreta o acesso a uma propriedade dentro de uma string se a expressão inteira estiver explicitamente delimitada.

## Tipagem

Uma variável pode ser tipada explicitamente, ou deixada com seu tipo deduzido automaticamente:

```powershell
[int]$idade = 25
[string]$nome = "Joao"
$nota = 19.5   # tipo deduzido: Double

$idade.GetType().Name   # Int32
```

> **Nota:** ao contrário do Bash, onde `idade="abc"` não provoca nenhum erro imediato (o valor continua sendo uma string, o erro só aparece no momento de um cálculo), atribuir `"abc"` a uma variável tipada `[int]$idade` falha imediatamente: o PowerShell verifica o tipo na atribuição, não apenas no uso.

## Aritmética

Nenhum contexto aritmético explícito é necessário: os operadores funcionam nativamente sobre números, inclusive decimais:

```powershell
$a = 5
$b = 3

Write-Output ($a + $b)  # 8
Write-Output ($a * $b)  # 15
Write-Output ($a / $b)  # 1.66666666666667 -> divisao real, nao inteira como no Bash
```

## Variáveis automáticas

O PowerShell fornece variáveis automáticas sempre disponíveis, desempenhando um papel próximo das variáveis especiais do Bash (`$0`, `$1`...): veja a tabela e os exemplos no capítulo sobre escrita de scripts, logo após a seção sobre os argumentos de um script.

## Escopo das variáveis

Por padrão, uma variável declarada em uma função continua local a essa função: o inverso do Bash, onde uma variável de função é global por padrão exceto `local` explícito:

```powershell
function Contar {
    $total = 0   # local a Contar por padrao
    $total = $total + 1
    Write-Output $total
}

Contar
Write-Output $total   # vazio: $total nao existe fora da funcao
```

Para modificar explicitamente uma variável de um contexto envolvente (o equivalente inverso de um `local` do Bash), prefixa-se seu nome com um escopo:

```powershell
$total = 0

function Incrementar {
    $script:total = $script:total + 1   # modifica explicitamente a variavel do script chamador
}

Incrementar
Write-Output $total   # 1
```

Veja também [As funções](/?c=shells&s=powershell&p=fonctions), e [Variáveis de ambiente](/?c=shells&s=powershell&p=variables-denvironnement) (`$env:`) para compartilhar um valor com processos filhos.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma variável PowerShell mantém o tipo real de seu valor (sem conversão implícita para texto como no Bash). Uma variável tipada (`[int]$idade`) falha imediatamente se receber um valor incompatível. |
| **Ferramentas utilizáveis** | Interpolação em aspas duplas, `$(...)` para uma expressão/propriedade, escopos (`$script:`). |
| **Armadilhas a evitar** | Escrever `"$objeto.Propriedade"` pensando acessar a propriedade: sem `$(...)`, `.Propriedade` é tratado como texto literal. |
| **Boas práticas** | Usar `$(...)` assim que se interpola algo além de uma simples variável em uma string. |
