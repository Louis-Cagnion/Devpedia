---
order: 4
---

# Loops

Loops allow you to repeat a block of code multiple times, as long as a condition is true or for each element in a collection. In PHP, the most commonly used loops are `while`, `do while`, `for`, and `foreach`.

## `while` Loop

The code runs in a loop as long as the condition remains true. The condition is checked **before** each iteration of the loop:

```php
<?php
    $i = 0;

    while ($i < 5) {
        echo $i;
        $i++;
    }
?>
```

## `do while` Loop

A variation on the "`while`" pattern, but the condition is checked **after** each iteration. The code therefore always executes at least once:

```php
<?php
    $i = 0;

    do {
        echo $i;
        $i++;
    } while ($i < 5);
?>
```

## `for` Loop

Useful when you know the number of iterations in advance. It combines the initialization, the condition, and the increment into a single line:

```php
<?php
    for ($i = 0; $i < 5; $i++) {
        echo $i;
    }
?>
```

## `foreach` Loop

Designed specifically to iterate through the elements of an array (`array`):

```php
<?php
    $fruits = ["pomme", "banane", "cerise"];

    foreach ($fruits as $fruit) {
        echo $fruit;
    }
?>
```

If you need the index (or key) in addition to the value:

```php
<?php
    $fruits = ["pomme", "banane", "cerise"];

    foreach ($fruits as $index => $fruit) {
        echo "{$index} : {$fruit}";
    }
?>
```

## `break` and `continue`

- `break;` completely stops the loop.
- `continue;` skips directly to the next iteration, without executing the rest of the code in the current iteration.

```php
<?php
    for ($i = 0; $i < 10; $i++) {
        if ($i == 5) {
            break; // Stop the loop as soon as $i equals 5
        }
        if ($i % 2 == 0) {
            continue; // ignores even numbers
        }
        echo $i;
    }
?>
```

## Alternative Syntax

As with conditions, loops can be written using `:` and `end...`:

| Classic | Alternative |
|---|---|
| `while (...) { }` | `while (...): ... endwhile;` |
| `for (...) { }` | `for (...): ... endfor;` |
| `foreach (...) { }` | `foreach (...): ... endforeach;` |

> **Note:** `do while` does not have an alternative syntax in PHP. You must always use curly braces `{ }` for this loop.


```php
<?php foreach ($fruits as $fruit): ?>
    <p><?= $fruit ?></p>
<?php endforeach; ?>
```
