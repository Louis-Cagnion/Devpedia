---
order: 6
---

# Os laços

O PowerShell oferece as mesmas estruturas básicas que o Bash (`for`, `while`, até uma condição), mais um laço `foreach` dedicado a percorrer objetos, o mais usado na prática, já que quase tudo no PowerShell é uma coleção de objetos em vez de texto bruto.

## O laço `foreach` (percorrer uma coleção)

```powershell
foreach ($fruta in "maca", "banana", "cereja") {
    Write-Output $fruta
}
```

Percorrer os arquivos de um diretório:

```powershell
foreach ($arquivo in Get-ChildItem -Filter "*.txt") {
    Write-Output "Processando $($arquivo.Name)"
}
```

Percorrer uma faixa de números:

```powershell
foreach ($i in 1..5) {
    Write-Output $i
}
```

## `ForEach-Object`: a mesma ideia, mas via o pipeline

Ao contrário de `foreach` (uma palavra-chave da linguagem), `ForEach-Object` é uma cmdlet que recebe seus elementos **via o pipeline** (veja [Redirecionamentos e pipes](/?c=shells&s=powershell&p=redirections-et-pipes)), a forma mais idiomática no PowerShell para encadear um processamento depois de outro comando:

```powershell
Get-ChildItem -Filter "*.txt" | ForEach-Object {
    Write-Output "Processando $($_.Name)"
}
```

`$_` designa o elemento atual do pipeline dentro do bloco, um papel próximo do que a variável de laço de um `foreach` clássico desempenha implicitamente.

## O laço `for` estilo C

```powershell
for ($i = 0; $i -lt 5; $i++) {
    Write-Output $i
}
```

## O laço `while`

O bloco executa enquanto a condição permanece verdadeira (testada **antes** de cada volta):

```powershell
$i = 0

while ($i -lt 5) {
    Write-Output $i
    $i++
}
```

### Ler um arquivo linha por linha

```powershell
Get-Content "arquivo.txt" | ForEach-Object {
    Write-Output "Linha lida: $_"
}
```

Ao contrário do Bash (`while read -r linha`), ler um arquivo linha por linha passa naturalmente pelo pipeline: `Get-Content` produz uma coleção de linhas, `ForEach-Object` (ou `foreach`) a percorre: nenhum redirecionamento de entrada padrão necessário.

## O laço `do`/`while` e `do`/`until`

Ao contrário de `while` (condição testada antes), o bloco `do` sempre executa **pelo menos uma vez**, a condição só sendo testada depois da primeira volta:

```powershell
$i = 0

do {
    Write-Output $i
    $i++
} while ($i -lt 5)
```

```powershell
$i = 0

do {
    Write-Output $i
    $i++
} until ($i -ge 5)
```

`do {...} until (...)` é o equivalente direto do PowerShell para o `until` do Bash (bloco repetido enquanto a condição permanece falsa), a única diferença sendo a garantia de pelo menos uma passagem, ausente do `while`/`until` do Bash.

## `break` e `continue`

Funcionam como na maioria das linguagens, inclusive dentro de um `ForEach-Object`:

```powershell
foreach ($i in 1..10) {
    if ($i -eq 5) {
        break
    }
    if ($i % 2 -eq 0) {
        continue
    }
    Write-Output $i
}
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `foreach` percorre uma coleção de objetos; `ForEach-Object` faz a mesma coisa via o pipeline. `do`/`while` e `do`/`until` garantem pelo menos uma passagem, ao contrário de `while`/`until` sozinhos. |
| **Ferramentas utilizáveis** | `1..5` (faixa), `$_` (elemento atual do pipeline), `break`/`continue`. |
| **Armadilhas a evitar** | Confundir `foreach` (palavra-chave) e `ForEach-Object` (cmdlet do pipeline): sintaxe e contexto de uso diferentes. |
| **Boas práticas** | Preferir `ForEach-Object` em uma cadeia de pipeline, `foreach` para um laço autônomo sobre uma coleção já em memória. |
