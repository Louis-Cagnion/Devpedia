---
order: 2
---

# As variáveis

O Bash tem apenas um único tipo de dados real: a **cadeia de caracteres** — até mesmo um número é tratado como texto, exceto num contexto aritmético explícito. As variáveis não são tipadas e a sua sintaxe de declaração/leitura é específica: sem «`$`» na atribuição e com «`$`» na leitura.

## Declarar e ler uma variável

```bash
nome="Jean"        # sem espaços à volta do '=': «nome = Jean» é um erro de sintaxe
echo $nome          # Jean
echo "${nome}"       # Jean -> as chaves delimitam explicitamente o nome da variável
echo "Bonjour ${nome} !"
```

> **Nota:** `nome= "Jean"` (com um espaço após `=`) não funciona como esperado: o Bash interpreta «executar o comando `Jean` com a variável de ambiente `nome` vazia», e não «atribuir Jean a nom». É obrigatório que não haja espaços à volta de `=`.

## Aspas simples vs. aspas duplas

```bash
nome="Jean"

echo "Bonjour $nome"   # Olá, Jean -> as aspas duplas interpretam as variáveis
echo 'Bonjour $nom'   # Olá $nome -> as aspas simples desativam qualquer interpretação
```

> **Nota:** coloque sempre uma variável entre aspas duplas quando a utilizar (`"$nome"`), salvo indicação específica em contrário — sem aspas, um valor que contenha espaços é dividido em várias palavras pelo Bash, o que provoca erros silenciosos em muitos scripts (`rm $arquivo` com um nome de arquivo que contenha um espaço pode eliminar algo diferente do previsto). A exceção mais comum: dentro de um contexto numérico explícito (`[ $i -lt 5 ]`, `$(( i + 1 ))`), o Bash não divide o valor em palavras — as aspas são, portanto, desnecessárias, o que explica por que razão os capítulos sobre condições e loops não as utilizam nestes casos específicos.

## Substituição de comando

Executa um comando e substitui a expressão pelo seu resultado:

```bash
date_du_jour=$(date +%Y-%m-%d)
echo "Nous sommes le $date_du_jour"

nombre_fichiers=$(ls | wc -l)
echo "Il y a $nombre_fichiers fichiers ici"
```

`$(...)` Esta é a sintaxe moderna, preferida em relação às antigas`backticks\` (`` ` date ` ``), menos legíveis e impossíveis de aninhar facilmente.

## Aritmética

O Bash não realiza cálculos de forma nativa em cadeias de caracteres — é necessário um contexto aritmético explícito:

```bash
a=5
b=3

echo $((a + b))   # 8
echo $((a * b))   # 15
echo $((a / b))   # 1 -> apenas divisão inteira; o Bash não suporta decimais
```

## Variáveis especiais

| Variável | Conteúdo |
|---|---|
| `$0` | Nome do script em execução |
| `$1`, `$2`, ... | Argumentos posicionais passados ao script/à função |
| `$@` | Todos os argumentos, cada um como uma palavra separada |
| `$#` | Número de argumentos recebidos |
| `$?` | Código de saída do último comando executado (`0` = sucesso) |
| `$$` | PID do script em execução |

```bash
#!/bin/bash
echo "Script : $0"
echo "Premier argument : $1"
echo "Nombre d'arguments : $#"

ls /caminho/inexistant
echo "Code de sortie : $?"  # diferente de zero, porque o comando anterior falhou
```

## Variáveis locais numa função

Por padrão, uma variável declarada numa função permanece **global** (visível em todo o código após a sua primeira chamada) — «`local`» restringe o seu âmbito à função atual, o que evita efeitos colaterais inesperados:

```bash
compter() {
    local total=0   # visível apenas no interior da função compter()
    total=$((total + 1))
    echo $total
}

compter
echo "$total"  # vazio: o valor «total» não existe fora da função
```

Consulte também o capítulo sobre funções e o capítulo sobre variáveis de ambiente (`export`) para partilhar um valor com processos filhos.
