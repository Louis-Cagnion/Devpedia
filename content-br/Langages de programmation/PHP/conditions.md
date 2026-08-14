---
order: 3
---

# As condições

As condições permitem executar um bloco de código apenas se uma expressão for verdadeira (ou falsa). Em PHP, usa-se principalmente `if`, `else`, `elseif` e `switch`.

## A condição `if`

```php
<?php
    $idade = 18;

    if ($idade >= 18) {
        echo "Voce e maior de idade.";
    }
?>
```

## Comparar valores: `==` e `===`

PHP oferece dois operadores de igualdade, e a escolha entre os dois não é cosmética.

| Operador | Nome | Comportamento |
|---|---|---|
| `==` | igualdade **flexível** | converte os tipos antes de comparar |
| `===` | igualdade **estrita** | compara o tipo **e** o valor, sem conversão |

```php
<?php
    $a = "10";
    $b = "1e1";   // notacao cientifica: vale 10
    $c = 10;

    var_dump($a == $b);   // true  -> as duas strings sao numericas: 10 == 10
    var_dump($a === $b);  // false -> mesmo tipo (string) mas conteudo literal diferente
    var_dump($a == $c);   // true  -> "10" convertida em inteiro
    var_dump($a === $c);  // false -> string e int sao tipos diferentes
?>
```

Essa conversão automática se chama **type juggling**. Ela é conveniente ao lidar com dados de formulário (sempre recebidos como strings), mas produz resultados difíceis de prever assim que os tipos se misturam.

**Regra prática:** use `===` por padrão, e reserve `==` para os casos em que você quer explicitamente uma conversão.

> Atenção, o `switch` do PHP compara com `==` (comparação flexível), não com `===`. Para uma comparação estrita, prefira uma cadeia de `if`/`elseif`, ou `match` (PHP 8+) que usa `===`.

O type juggling também tem uma consequência direta na segurança ao comparar hashes (veja o capítulo [Proteger seus dados](/?c=langages-de-programmation&s=php&p=securite)).

## `if` / `else`

O bloco `else` permite executar código quando a condição do `if` é falsa:

```php
<?php
    $idade = 16;

    if ($idade >= 18) {
        echo "Voce e maior de idade.";
    } else {
        echo "Voce e menor de idade.";
    }
?>
```

## `elseif`

Para testar várias condições em sequência, usa-se `elseif`:

```php
<?php
    $nota = 12;

    if ($nota >= 16) {
        echo "Mencao Otimo";
    } elseif ($nota >= 14) {
        echo "Mencao Bom";
    } elseif ($nota >= 10) {
        echo "Aprovado";
    } else {
        echo "Reprovado";
    }
?>
```

> **Nota:** você também pode escrever `else if` (em duas palavras), o comportamento é idêntico ao `elseif`.

## Sintaxe alternativa

Como para as outras estruturas de controle, as condições podem ser escritas com `:` e `end...`, útil para misturar com HTML:

```php
<?php if ($idade >= 18): ?>
    <p>Voce e maior de idade.</p>
<?php elseif ($idade >= 13): ?>
    <p>Voce e adolescente.</p>
<?php else: ?>
    <p>Voce e crianca.</p>
<?php endif; ?>
```

| Clássica | Alternativa |
|---|---|
| `if (...) { }` | `if (...): ... endif;` |
| `if (...) { } else { }` | `if (...): ... else: ... endif;` |
| `if (...) { } elseif (...) { }` | `if (...): ... elseif (...): ... endif;` |

## O operador ternário

Para condições curtas que retornam um valor, é possível usar o operador ternário em vez de um `if`/`else`:

```php
<?php
    $idade = 20;
    $status = ($idade >= 18) ? "maior de idade" : "menor de idade";

    echo $status;
?>
```

Existe também uma versão abreviada, útil para fornecer um valor padrão:

```php
<?php
    $apelido = $apelido ?? "Convidado";
?>
```

Aqui, `??` (operador de coalescência nula) retorna `$apelido` se existir e não for `null`, senão retorna `"Convidado"`.

## O `switch`

Quando você precisa comparar uma mesma variável com vários valores possíveis, `switch` costuma ser mais legível que uma longa cadeia de `elseif`:

```php
<?php
    $dia = 3;

    switch ($dia) {
        case 1:
            echo "Segunda";
            break;
        case 2:
            echo "Terca";
            break;
        case 3:
            echo "Quarta";
            break;
        default:
            echo "Outro dia";
            break;
    }
?>
```

> **Nota:** não esqueça o `break;` no final de cada `case`, senão a execução continua no `case` seguinte (comportamento chamado *fall-through*).

O `switch` também tem sua sintaxe alternativa, que usa `:` no lugar das chaves, mas mantém `case` e `break`:

```php
<?php switch ($dia):
    case 1:
        echo "Segunda";
        break;
    default:
        echo "Outro dia";
        break;
endswitch; ?>
```

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `if`/`elseif`/`else` e `switch` estruturam o controle de fluxo. `switch` compara com `==` (flexível), ao contrário de `match` (PHP 8+) que usa `===`. |
| **Ferramentas utilizáveis** | Operador ternário `? :`, coalescência nula `??`, sintaxe alternativa (`:`/`end...`) para templates. |
| **Armadilhas a evitar** | Usar `==` por hábito (type juggling); esquecer `break;` em um `case` (*fall-through*). |
| **Boas práticas** | Usar `===` por padrão; preferir `match` a `switch` quando uma comparação estrita for necessária. |
