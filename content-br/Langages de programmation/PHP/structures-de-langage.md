---
order: 5
---

# As estruturas da linguagem

Uma **construção de linguagem** (*language construct*) é uma instrução integrada diretamente no núcleo da linguagem PHP. Ao contrário de uma função, não é definida por código: faz parte da própria sintaxe da linguagem, tal como «`if`», «`for`» ou «`;`».

## Diferenças em relação a uma função

Esta natureza específica confere às estruturas da linguagem certas liberdades de escrita que uma função clássica não possui:

```php
<?php
    // Os parênteses são opcionais
    include "boasvindas.php";
    include("boasvindas.php"); // equivalente

    // O comando «echo» pode aceitar vários valores separados por vírgulas
    echo "Olá ", $nome, " !";

    // A função print devolve sempre 1, pelo que pode ser utilizada numa expressão
    $resultado = print "Oi"; // exibe «Oi» e, em seguida, $resultado = 1
?>
```

Por outro lado, uma função como `strlen()` deve ser sempre chamada com parênteses e não pode recorrer a essas flexibilidades.

## Por que razão existe esta distinção?

As estruturas da linguagem são processadas pelo PHP no momento da análise do código (antes mesmo da sua execução), uma vez que influenciam diretamente o desenrolar do script; por exemplo, `include` insere código num local específico, ou `return` interrompe a execução de uma função. É por isso que não podem ser manipuladas como simples funções: não é possível armazená-las numa variável, nem passá-las como argumento de outra função.

```php
<?php
    $f = strlen;     // ❌ Não funciona tal como está para as funções, exceto através de string/callable
    $f = "echo";     // ❌ Não é possível chamar o «echo» desta forma, pois não é uma função
?>
```

## Lista das estruturas de linguagem mais comuns

| Estrutura | Função |
|---|---|
| `echo` | Apresenta um ou mais valores |
| `print` | Exibe um valor, devolve sempre `1` |
| `include` / `require` | Inclui o conteúdo de outro arquivo PHP |
| `if` / `else` / `elseif` | Executa código em função de uma condição |
| `for` / `foreach` / `while` / `do-while` | Repete um bloco de código |
| `switch` | Compara um valor com vários casos possíveis |
| `return` | Devolve um valor e interrompe a execução de uma função |
| `break` / `continue` | Interrompe ou avança para a próxima iteração de um ciclo |
| `isset()` / `unset()` | Verifica a existência / elimina uma variável |
| `list()` | Atribui vários valores a variáveis de uma só vez a partir de um array |

> **Nota:** já se deparou com a maioria destas estruturas nos capítulos anteriores (condições, loops, variáveis...) sem que este conceito fosse explicitamente mencionado.

---

## 📋 Recapitulação

| | |
|---|---|
| **O que reter** | Uma estrutura de linguagem (`echo`, `include`, `if`, `return`...) faz parte da sintaxe da própria linguagem, diferente de uma função: ela tem liberdades de escrita (parênteses opcionais, não pode ser armazenada em uma variável). |
| **Ferramentas úteis** | `echo`/`print`, `include`/`require`, `isset()`/`unset()`, `list()`. |
| **Armadilhas a evitar** | Tentar armazenar uma estrutura de linguagem em uma variável ou passá-la como argumento, como se fosse uma função clássica. |
| **Boas práticas** | Usar `include`/`require` em vez de uma função personalizada para carregar um arquivo: é o mecanismo nativo previsto para isso. |
