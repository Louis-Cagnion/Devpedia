---
order: 3
---

# As condições

As condições permitem executar um bloco de código apenas se uma expressão for verdadeira (ou falsa). Em PHP, utilizam-se principalmente `if`, `else`, `elseif` e `switch`.

## A condição «`if`»

```php
<?php
    $idade = 18;

    if ($idade >= 18) {
        echo "Vous êtes majeur.";
    }
?>
```

## `if` / `else`

O bloco «`else`» permite executar código quando a condição do «`if`» é falsa:

```php
<?php
    $idade = 16;

    if ($idade >= 18) {
        echo "Vous êtes majeur.";
    } else {
        echo "Vous êtes mineur.";
    }
?>
```

## `elseif`

Para testar várias condições consecutivamente, utiliza-se`elseif`:

```php
<?php
    $note = 12;

    if ($note >= 16) {
        echo "Mention Très Bien";
    } elseif ($note >= 14) {
        echo "Mention Bien";
    } elseif ($note >= 10) {
        echo "Admis";
    } else {
        echo "Recalé";
    }
?>
```

> **Nota:** também pode escrever «`else if`» (em duas palavras); o comportamento é idêntico ao de «`elseif`».

## Sintaxe alternativa

Tal como acontece com outras estruturas de controlo, as condições podem ser escritas com «`:`» e «`end...`», o que é prático para combinar com HTML:

```php
<?php if ($idade >= 18): ?>
    <p>Vous êtes majeur.</p>
<?php elseif ($idade >= 13): ?>
    <p>Vous êtes adolescent.</p>
<?php else: ?>
    <p>Vous êtes enfant.</p>
<?php endif; ?>
```

| Clássica | Alternativa |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `if (...) { } else { }` | `if (...): ... else: ... endif;` |
| `if (...) { } elseif (...) { }` | `if (...): ... elseif (...): ... endif;` |

## O operador ternário

Para condições curtas que devolvem um valor, pode-se utilizar o operador ternário em vez de um «`if`» / «`else`»:

```php
<?php
    $idade = 20;
    $statut = ($idade >= 18) ? "majeur" : "mineur";

    echo $statut;
?>
```

Existe também uma versão abreviada, útil para definir um valor por predefinição:

```php
<?php
    $pseudo = $pseudo ?? "Invité";
?>
```

Aqui, `??` (operador de coalescência nula) devolve `$pseudo` se existir e não for `null`; caso contrário, devolve `"Invité"`.

## O `switch`

Quando é necessário comparar uma mesma variável com vários valores possíveis, «`switch`» é frequentemente mais legível do que uma longa sequência de «`elseif`»:

```php
<?php
    $jour = 3;

    switch ($jour) {
        case 1:
            echo "Lundi";
            break;
        case 2:
            echo "Mardi";
            break;
        case 3:
            echo "Mercredi";
            break;
        default:
            echo "Autre jour";
            break;
    }
?>
```

> **Nota:** não se esqueça de incluir o «`break;`» no final de cada «`case`», caso contrário, a execução prossegue para o «`case`» seguinte (comportamento denominado *«fall-through»*).

O «`switch`» também tem uma sintaxe alternativa, que utiliza «`:`» em vez de chaves, mas mantém «`case`» e «`break`»:

```php
<?php switch ($jour):
    case 1:
        echo "Lundi";
        break;
    default:
        echo "Autre jour";
        break;
endswitch; ?>
```
