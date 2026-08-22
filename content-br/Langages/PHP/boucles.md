---
order: 4
---

# Os laços

Os laços permitem repetir um bloco de código várias vezes, enquanto uma condição for verdadeira ou para cada elemento de uma coleção. Em PHP, usa-se principalmente `while`, `do while`, `for` e `foreach`.

## O laço `while`

O código executa em laço enquanto a condição permanece verdadeira. A condição é testada **antes** de cada volta:

```php
<?php
    $i = 0;

    while ($i < 5) {
        echo $i;
        $i++;
    }
?>
```

## O laço `do while`

Variante do `while`, mas a condição é testada **depois** de cada volta. O código então sempre executa pelo menos uma vez:

```php
<?php
    $i = 0;

    do {
        echo $i;
        $i++;
    } while ($i < 5);
?>
```

## O laço `for`

Útil quando você conhece antecipadamente o número de iterações. Ele agrupa em uma única linha: a inicialização, a condição, e o incremento:

```php
<?php
    for ($i = 0; $i < 5; $i++) {
        echo $i;
    }
?>
```

## O laço `foreach`

Projetado especificamente para percorrer os elementos de um array (`array`):

```php
<?php
    $frutas = ["maca", "banana", "cereja"];

    foreach ($frutas as $fruta) {
        echo $fruta;
    }
?>
```

Se você precisar do índice (ou da chave) além do valor:

```php
<?php
    $frutas = ["maca", "banana", "cereja"];

    foreach ($frutas as $indice => $fruta) {
        echo "{$indice}: {$fruta}";
    }
?>
```

## `break` e `continue`

- `break;` para completamente o laço.
- `continue;` passa diretamente para a próxima volta, sem executar o resto do código da iteração atual.

```php
<?php
    for ($i = 0; $i < 10; $i++) {
        if ($i == 5) {
            break; // para o laco assim que $i vale 5
        }
        if ($i % 2 == 0) {
            continue; // ignora os numeros pares
        }
        echo $i;
    }
?>
```

## Sintaxe alternativa

Como para as condições, os laços podem ser escritos com `:` e `end...`:

| Clássica | Alternativa |
|---|---|
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |

> **Nota:** `do while` não possui sintaxe alternativa em PHP. Você deve sempre usar as chaves `{ }` para esse laço.


```php
<?php foreach ($frutas as $fruta): ?>
    <p><?= $fruta ?></p>
<?php endforeach; ?>
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `while`/`do while`/`for` são os laços clássicos; `foreach` é especificamente projetado para percorrer um array, com ou sem sua chave. |
| **Ferramentas utilizáveis** | `break`/`continue`, a sintaxe alternativa (`:`/`end...`) para templates. |
| **Armadilhas a evitar** | Usar `for` com um índice manual onde `foreach` evita todo risco de erro de índice. |
| **Boas práticas** | Preferir `foreach` assim que se percorre um array, sem precisar gerenciar o índice manualmente. |
