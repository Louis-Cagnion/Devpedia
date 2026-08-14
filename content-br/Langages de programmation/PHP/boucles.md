---
order: 4
---

# Os loops

Os loops permitem repetir um bloco de código várias vezes, enquanto uma condição for verdadeira ou para cada elemento de uma coleção. Em PHP, utilizam-se principalmente `while`, `do while`, `for` e `foreach`.

## O ciclo `while`

O código é executado em ciclo enquanto a condição se mantiver verdadeira. A condição é verificada **antes de** cada iteração do ciclo:

```php
<?php
    $i = 0;

    while ($i < 5) {
        echo $i;
        $i++;
    }
?>
```

## O ciclo `do while`

Variante do «`while`», mas a condição é verificada **após** cada iteração. Assim, o código é sempre executado pelo menos uma vez:

```php
<?php
    $i = 0;

    do {
        echo $i;
        $i++;
    } while ($i < 5);
?>
```

## O ciclo `for`

Útil quando se sabe antecipadamente o número de iterações. Reúne numa única linha: a inicialização, a condição e o incremento:

```php
<?php
    for ($i = 0; $i < 5; $i++) {
        echo $i;
    }
?>
```

## O ciclo `foreach`

Concebida especificamente para percorrer os elementos de um array (`array`):

```php
<?php
    $frutas = ["pomme", "banane", "cerise"];

    foreach ($frutas as $fruto) {
        echo $fruto;
    }
?>
```

Se precisar do índice (ou da chave) além do valor:

```php
<?php
    $frutas = ["pomme", "banane", "cerise"];

    foreach ($frutas as $índice => $fruto) {
        echo "{$índice} : {$fruto}";
    }
?>
```

## `break` e `continue`

- `break;` interrompe completamente o ciclo.
- `continue;` passa diretamente para a próxima iteração, sem executar o resto do código da iteração atual.

```php
<?php
    for ($i = 0; $i < 10; $i++) {
        if ($i == 5) {
            break; // interrompe o ciclo assim que $i for igual a 5
        }
        if ($i % 2 == 0) {
            continue; // ignora os números pares
        }
        echo $i;
    }
?>
```

## Sintaxe alternativa

Tal como acontece com as condições, os laços podem ser escritos com «`:`» e «`end...`»:

| Clássica | Alternativa |
|---|---|
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |

> **Nota:** «`do while`» não tem sintaxe alternativa em PHP. Deve utilizar sempre as chaves `{ }` para este ciclo.


```php
<?php foreach ($frutas as $fruto): ?>
    <p><?= $fruto ?></p>
<?php endforeach; ?>
```
