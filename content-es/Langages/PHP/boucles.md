---
order: 4
---

# Los bucles

Los bucles permiten repetir un bloque de código varias veces, mientras una condición sea verdadera o para cada elemento de una colección. En PHP, se usan principalmente `while`, `do while`, `for` y `foreach`.

## El bucle `while`

El código se ejecuta en bucle mientras la condición siga siendo verdadera. La condición se comprueba **antes** de cada vuelta del bucle:

```php
<?php
    $i = 0;

    while ($i < 5) {
        echo $i;
        $i++;
    }
?>
```

## El bucle `do while`

Variante del `while`, pero la condición se comprueba **después** de cada vuelta. El código se ejecuta por tanto siempre al menos una vez:

```php
<?php
    $i = 0;

    do {
        echo $i;
        $i++;
    } while ($i < 5);
?>
```

## El bucle `for`

Útil cuando conoces de antemano el número de iteraciones. Reúne en una sola línea: la inicialización, la condición y el incremento:

```php
<?php
    for ($i = 0; $i < 5; $i++) {
        echo $i;
    }
?>
```

## El bucle `foreach`

Diseñado específicamente para recorrer los elementos de un array (`array`):

```php
<?php
    $frutas = ["manzana", "plátano", "cereza"];

    foreach ($frutas as $fruta) {
        echo $fruta;
    }
?>
```

Si necesitas el índice (o la clave) además del valor:

```php
<?php
    $frutas = ["manzana", "plátano", "cereza"];

    foreach ($frutas as $indice => $fruta) {
        echo "{$indice}: {$fruta}";
    }
?>
```

## `break` y `continue`

- `break;` detiene por completo el bucle.
- `continue;` pasa directamente a la vuelta siguiente, sin ejecutar el resto del código de la iteración actual.

```php
<?php
    for ($i = 0; $i < 10; $i++) {
        if ($i == 5) {
            break; // detiene el bucle en cuanto $i vale 5
        }
        if ($i % 2 == 0) {
            continue; // ignora los números pares
        }
        echo $i;
    }
?>
```

## Sintaxis alternativa

Igual que con las condiciones, los bucles se pueden escribir con `:` y `end...`:

| Clásica | Alternativa |
|---|---|
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |

> **Nota:** `do while` no tiene sintaxis alternativa en PHP. Siempre debes usar las llaves `{ }` para este bucle.


```php
<?php foreach ($frutas as $fruta): ?>
    <p><?= $fruta ?></p>
<?php endforeach; ?>
```

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | `while`/`do while`/`for` son los bucles clásicos; `foreach` está diseñado específicamente para recorrer un array, con o sin su clave. |
| **Herramientas utilizables** | `break`/`continue`, la sintaxis alternativa (`:`/`end...`) para las plantillas. |
| **Trampas a evitar** | Usar `for` con un índice manual donde `foreach` evita cualquier riesgo de error de índice. |
| **Buenas prácticas** | Preferir `foreach` en cuanto se recorre un array, sin necesidad de gestionar el índice uno mismo. |
