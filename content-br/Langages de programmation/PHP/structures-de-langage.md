---
order: 5
---

# As estruturas de linguagem

Uma **estrutura de linguagem** (*language construct*) é uma instrução integrada diretamente ao núcleo da linguagem PHP. Ao contrário de uma função, ela não é definida por código, faz parte da própria sintaxe da linguagem, no mesmo nível que `if`, `for`, ou `;`.

## Diferenças com uma função

Essa natureza particular dá às estruturas de linguagem algumas liberdades de escrita que uma função clássica não tem:

```php
<?php
    // Os parenteses sao opcionais
    include "boasvindas.php";
    include("boasvindas.php"); // equivalente

    // echo pode receber varios valores separados por virgulas
    echo "Ola ", $nome, "!";

    // print sempre retorna 1, e portanto pode ser usado em uma expressao
    $resultado = print "Hello"; // exibe "Hello", depois $resultado = 1
?>
```

Ao contrário, uma função como `strlen()` sempre deve ser chamada com seus parênteses, e não pode usar essas liberdades.

## Por que essa distinção existe?

As estruturas de linguagem são tratadas pelo PHP no momento da análise do código (antes mesmo de sua execução), pois elas influenciam diretamente o andamento do script: por exemplo, `include` insere código em um local preciso, ou `return` interrompe a execução de uma função. É por isso que elas não podem ser manipuladas como simples funções: não é possível armazená-las em uma variável, nem passá-las como argumento de outra função.

```php
<?php
    $f = strlen;  // ❌ nao funciona assim para funcoes, exceto via string/callable
    $f = "echo";  // ❌ impossivel chamar echo assim, nao e uma funcao
?>
```

## Lista das estruturas de linguagem mais comuns

| Estrutura | Função |
|---|---|
| `echo` | Exibe um ou vários valores |
| `print` | Exibe um valor, sempre retorna `1` |
| `include` / `require` | Inclui o conteúdo de outro arquivo PHP |
| `if` / `else` / `elseif` | Executa código conforme uma condição |
| `for` / `foreach` / `while` / `do-while` | Repete um bloco de código |
| `switch` | Compara um valor a vários casos possíveis |
| `return` | Retorna um valor e para a execução de uma função |
| `break` / `continue` | Para ou passa para a próxima volta de um laço |
| `isset()` / `unset()` | Verifica a existência / remove uma variável |
| `list()` | Atribui várias variáveis de uma vez a partir de um array |

> **Nota:** você já encontrou a maioria dessas estruturas nos capítulos anteriores (condições, laços, variáveis...) sem que esse conceito fosse nomeado explicitamente.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma estrutura de linguagem (`echo`, `include`, `if`, `return`...) faz parte da sintaxe da própria linguagem, ao contrário de uma função: ela se beneficia de liberdades de escrita (parênteses opcionais, não armazenável em variável). |
| **Ferramentas utilizáveis** | `echo`/`print`, `include`/`require`, `isset()`/`unset()`, `list()`. |
| **Armadilhas a evitar** | Tentar armazenar uma estrutura de linguagem em uma variável ou passá-la como argumento, como uma função clássica. |
| **Boas práticas** | Usar `include`/`require` em vez de uma função personalizada para carregar um arquivo: é o mecanismo nativo previsto para isso. |
