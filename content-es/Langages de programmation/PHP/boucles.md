---
order: 4
---

# Los bucles

Los bucles permiten repetir un bloque de código varias veces, siempre que se cumpla una condición o para cada elemento de una colección. En PHP, se utilizan principalmente `while`, `do while`, `for` y `foreach`.

## El bucle «`while`»

El código se ejecuta en bucle mientras la condición siga siendo verdadera. La condición se comprueba **antes de** cada iteración del bucle:

```php
<?php
    $i = 0;

    while ($i < 5) {
        echo $i;
        $i++;
    }
?>
```

## El bucle «`do while`»

Variante del «`while`», pero la condición se comprueba **después de** cada ronda. Por lo tanto, el código siempre se ejecuta al menos una vez:

```php
<?php
    $i = 0;

    do {
        echo $i;
        $i++;
    } while ($i < 5);
?>
```

## El bucle «`for`»

Resulta útil cuando se conoce de antemano el número de iteraciones. Reúne en una sola línea: la inicialización, la condición y el incremento:

```php
<?php
    for ($i = 0; $i < 5; $i++) {
        echo $i;
    }
?>
```

## El bucle «`foreach`»

Diseñada específicamente para recorrer los elementos de un array (`array`):

```php
<?php
    $frutas = ["pomme", "banane", "cerise"];

    foreach ($frutas as $fruta) {
        echo $fruta;
    }
?>
```

Si necesitas el índice (o la clave) además del valor:

```php
<?php
    $frutas = ["pomme", "banane", "cerise"];

    foreach ($frutas as $índice => $fruta) {
        echo "{$índice} : {$fruta}";
    }
?>
```

## `break` y `continue`

- `break;` detiene el bucle por completo.
- `continue;` pasa directamente a la siguiente ronda, sin ejecutar el resto del código de la iteración actual.

```php
<?php
    for ($i = 0; $i < 10; $i++) {
        if ($i == 5) {
            break; // detiene el bucle en cuanto $i sea igual a 5
        }
        if ($i % 2 == 0) {
            continue; // ignora los números pares
        }
        echo $i;
    }
?>
```

## Sintaxis alternativa

Al igual que con las condiciones, los bucles se pueden escribir con «`:`» y «`end...`»:

| Clásica | Alternativa |
|---|---|
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |

> **Nota:** «`do while`» no tiene una sintaxis alternativa en PHP. Siempre debes utilizar las llaves «`{ }`» para este bucle.


```php
<?php foreach ($frutas as $fruta): ?>
    <p><?= $fruta ?></p>
<?php endforeach; ?>
```
